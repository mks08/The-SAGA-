<?php
/**
 * SHRINEVA enquiry handler.
 *
 * Receives the website's contact / site-visit / broker forms as JSON, validates them, keeps a private copy
 * on disk and emails the leasing desk. Replies with JSON {ok: true} ONLY when the email was handed to the
 * mail system; otherwise {ok: false}, and the website falls back to its second route and finally to
 * showing the phone / WhatsApp numbers, so nobody is told "sent" when it was not.
 *
 * PHP 7.4+. No dependencies.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

$cfg = require __DIR__ . '/config.php';
if (is_file(__DIR__ . '/config.local.php')) {
    $local = require __DIR__ . '/config.local.php';
    if (is_array($local)) {
        $cfg = array_replace_recursive($cfg, $local);
    }
}

// ── 1. Method and origin ──────────────────────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'method']);
}

$host = strtolower(preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
$bare = preg_replace('/^www\./', '', $host);
$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '') {
    $oh = strtolower((string)parse_url($origin, PHP_URL_HOST));
    $ob = preg_replace('/^www\./', '', $oh);
    $allowed = array_merge([$bare], array_map('strtolower', (array)$cfg['allowed_hosts']));
    if (!in_array($ob, $allowed, true)) {
        respond(403, ['ok' => false, 'error' => 'origin']);
    }
}

// ── 2. Read the body ──────────────────────────────────────────────────────────────────
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 20000) {
    respond(413, ['ok' => false, 'error' => 'size']);
}
$in = json_decode($raw, true);
if (!is_array($in)) {
    $in = $_POST; // plain form posts also work
}
if (!$in) {
    respond(400, ['ok' => false, 'error' => 'body']);
}

// Honeypot: real visitors never fill this. Pretend success, send nothing.
if (trim((string)($in['website'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}

// ── 3. Clean and validate ─────────────────────────────────────────────────────────────
function clean($v, int $max): string
{
    $v = is_scalar($v) ? (string)$v : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    $v = trim($v);
    return mb_substr($v, 0, $max, 'UTF-8');
}

$kinds = ['leasing' => 'leasing enquiry', 'site-visit' => 'site-visit request', 'broker' => 'broker requirement'];
$kind = clean($in['kind'] ?? 'leasing', 20);
if (!isset($kinds[$kind])) {
    $kind = 'leasing';
}

$fields = [
    'name'               => clean($in['name'] ?? '', 100),
    'phone'              => preg_replace('/[^\d+]/', '', clean($in['phone'] ?? '', 20)) ?? '',
    'email'              => clean($in['email'] ?? '', 120),
    'company'            => clean($in['company'] ?? '', 120),
    'designation'        => clean($in['designation'] ?? '', 80),
    'business_category'  => clean($in['business_category'] ?? '', 80),
    'space_type'         => clean($in['space_type'] ?? '', 80),
    'other_details'      => clean($in['other_details'] ?? '', 200),
    'space_required'     => clean($in['space_required'] ?? '', 60),
    'preferred_floor'    => clean($in['preferred_floor'] ?? '', 30),
    'expected_occupancy' => clean($in['expected_occupancy'] ?? '', 60),
    'message'            => clean($in['message'] ?? '', 2000),
];

$errors = [];
if (mb_strlen($fields['name'], 'UTF-8') < 2) {
    $errors[] = 'name';
}
$digits = preg_match('/^\+?91([6-9]\d{9})$/', $fields['phone'], $pm) ? $pm[1] : (preg_replace('/^0/', '', $fields['phone']) ?? '');
if (!preg_match('/^[6-9]\d{9}$/', $digits)) {
    $errors[] = 'phone';
}
if ($fields['email'] !== '' && !filter_var($fields['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'email';
}
if ($errors) {
    respond(422, ['ok' => false, 'error' => 'invalid', 'fields' => $errors]);
}
$fields['phone'] = $digits;

// ── 4. Where to keep things ───────────────────────────────────────────────────────────
function pick_data_dir(array $cfg): string
{
    $candidates = [];
    if (!empty($cfg['data_dir'])) {
        $candidates[] = (string)$cfg['data_dir'];
    } else {
        $candidates[] = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'shrineva-leads';
    }
    $candidates[] = __DIR__ . DIRECTORY_SEPARATOR . '_data';
    foreach ($candidates as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        if (is_dir($dir) && is_writable($dir)) {
            if (strpos($dir, __DIR__) === 0) { // inside the web folder: close it
                @file_put_contents($dir . '/.htaccess', "Require all denied\n");
                @file_put_contents($dir . '/index.html', '');
            }
            return $dir;
        }
    }
    return '';
}
$dir = pick_data_dir($cfg);

// ── 5. Rate limit (per visitor, file based) ───────────────────────────────────────────
$ip = (string)($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '');
$ip = trim(explode(',', $ip)[0]);
$ipHash = substr(hash('sha256', $ip . '|shrineva'), 0, 16);
if ($dir !== '') {
    $rl = $dir . '/rate-' . $ipHash . '.json';
    $now = time();
    $win = (int)$cfg['rate_limit']['window'];
    $hits = [];
    if (is_file($rl)) {
        $hits = json_decode((string)@file_get_contents($rl), true);
        $hits = is_array($hits) ? array_values(array_filter($hits, function ($t) use ($now, $win) { return is_int($t) && $t > $now - $win; })) : [];
    }
    if (count($hits) >= (int)$cfg['rate_limit']['max']) {
        respond(429, ['ok' => false, 'error' => 'rate']);
    }
    $hits[] = $now;
    @file_put_contents($rl, json_encode($hits), LOCK_EX);
}

// ── 6. Keep a private copy ────────────────────────────────────────────────────────────
date_default_timezone_set('Asia/Kolkata');
$stamp = date('Y-m-d H:i:s');
$record = ['received_ist' => $stamp, 'kind' => $kind] + $fields + ['visitor' => $ipHash, 'page' => clean($in['page'] ?? '', 120)];
$stored = false;
if ($dir !== '') {
    $line = json_encode($record, JSON_UNESCAPED_UNICODE) . "\n";
    $stored = @file_put_contents($dir . '/leads-' . date('Y-m') . '.jsonl', $line, FILE_APPEND | LOCK_EX) !== false;
    $csv = $dir . '/leads.csv';
    $fresh = !is_file($csv);
    $fh = @fopen($csv, 'ab');
    if ($fh) {
        if (flock($fh, LOCK_EX)) {
            if ($fresh) {
                fputcsv($fh, array_keys($record));
            }
            fputcsv($fh, array_map(function ($v) { // neutralise spreadsheet formulas
                $v = (string)$v;
                return ($v !== '' && strpos('=+-@', $v[0]) !== false) ? "'" . $v : $v;
            }, array_values($record)));
            flock($fh, LOCK_UN);
        }
        fclose($fh);
    }
}

// ── 7. Email the leasing desk ─────────────────────────────────────────────────────────
function header_safe(string $v): string
{
    return trim(str_replace(["\r", "\n", '%0a', '%0d'], ' ', $v));
}
function b64subject(string $s): string
{
    return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

$label = $kinds[$kind];
$who = $fields['name'] . ' · ' . $fields['phone'];
$subject = '[SHRINEVA] New ' . $label . ': ' . $who;
$rows = [
    'Type' => ucfirst($label), 'Name' => $fields['name'], 'Phone' => $fields['phone'], 'Email' => $fields['email'],
    'Company / brand' => $fields['company'], 'Designation' => $fields['designation'],
    'Business category' => $fields['business_category'], 'Space type' => $fields['space_type'], 'Other details' => $fields['other_details'],
    'Space required' => $fields['space_required'], 'Preferred floor' => $fields['preferred_floor'],
    'Expected occupancy' => $fields['expected_occupancy'], 'Message' => $fields['message'],
    'Received (IST)' => $stamp, 'Sent from page' => $record['page'],
];
$body = "A new enquiry came in through the SHRINEVA website.\r\n\r\n";
foreach ($rows as $k => $v) {
    if ($v !== '') {
        $body .= str_pad($k . ':', 22) . $v . "\r\n";
    }
}
$body .= "\r\nReply to this email to answer the enquirer directly" . ($fields['email'] === '' ? ' (no email was given: call or WhatsApp the number above).' : '.') . "\r\n";
$body .= "A copy is also kept in the leads folder on the server.\r\n";

$recipients = array_values(array_filter(array_map('trim', (array)$cfg['recipients']), function ($r) { return filter_var($r, FILTER_VALIDATE_EMAIL); }));
$from = filter_var($cfg['from'], FILTER_VALIDATE_EMAIL) ? (string)$cfg['from'] : 'no-reply@' . ($bare ?: 'localhost');
$fromName = header_safe((string)$cfg['from_name']);
$replyTo = $fields['email'] !== '' ? header_safe($fields['email']) : '';

$headers = [
    'From: ' . b64subject($fromName) . ' <' . $from . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: shrineva-lead-handler',
];
if ($replyTo !== '') {
    $headers[] = 'Reply-To: ' . $replyTo;
}

/** Minimal authenticated SMTP client (ssl / starttls / none). Returns true when the server accepted the message. */
function smtp_send(array $smtp, string $from, array $to, string $subjectEnc, array $headers, string $body): bool
{
    $secure = (string)($smtp['secure'] ?? 'ssl');
    $remote = ($secure === 'ssl' ? 'ssl://' : '') . $smtp['host'] . ':' . (int)$smtp['port'];
    $fp = @stream_socket_client($remote, $errno, $errstr, 12, STREAM_CLIENT_CONNECT);
    if (!$fp) {
        return false;
    }
    stream_set_timeout($fp, 12);
    $read = function () use ($fp): string {
        $out = '';
        while (($l = fgets($fp, 1024)) !== false) {
            $out .= $l;
            if (strlen($l) < 4 || $l[3] === ' ') {
                break;
            }
        }
        return $out;
    };
    $cmd = function (string $c, string $expect) use ($fp, $read): bool {
        fwrite($fp, $c . "\r\n");
        return strpos($read(), $expect) === 0;
    };
    $ok = strpos($read(), '220') === 0 && $cmd('EHLO shrineva', '250');
    if ($ok && $secure === 'starttls') {
        $ok = $cmd('STARTTLS', '220') && @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) && $cmd('EHLO shrineva', '250');
    }
    if ($ok && !empty($smtp['user'])) {
        $ok = $cmd('AUTH LOGIN', '334') && $cmd(base64_encode((string)$smtp['user']), '334') && $cmd(base64_encode((string)$smtp['pass']), '235');
    }
    $ok = $ok && $cmd('MAIL FROM:<' . $from . '>', '250');
    foreach ($to as $r) {
        $ok = $ok && $cmd('RCPT TO:<' . $r . '>', '25');
    }
    if ($ok && $cmd('DATA', '354')) {
        $msg = 'Date: ' . date('r') . "\r\nTo: " . implode(', ', $to) . "\r\nSubject: " . $subjectEnc . "\r\n" . implode("\r\n", $headers) . "\r\n\r\n";
        $msg .= preg_replace('/^\./m', '..', $body);
        fwrite($fp, $msg . "\r\n.\r\n");
        $ok = strpos($read(), '250') === 0;
    } else {
        $ok = false;
    }
    @fwrite($fp, "QUIT\r\n");
    fclose($fp);
    return $ok;
}

$sent = false;
if (!empty($cfg['dry_run'])) {
    respond(200, ['ok' => true, 'dry_run' => true, 'stored' => $stored, 'to' => $recipients, 'subject' => $subject]);
}
if ($recipients) {
    if (($cfg['transport'] ?? 'mail') === 'smtp') {
        $sent = smtp_send((array)$cfg['smtp'], $from, $recipients, b64subject($subject), $headers, $body);
    } else {
        $sent = @mail(implode(', ', $recipients), b64subject($subject), $body, implode("\r\n", $headers), '-f' . $from);
    }
}

if ($sent) {
    respond(200, ['ok' => true]);
}
// Stored on disk but not emailed: tell the browser it failed so it can use its backup route and show the phone numbers.
respond(502, ['ok' => false, 'error' => 'mail', 'stored' => $stored]);
