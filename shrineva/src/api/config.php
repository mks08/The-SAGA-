<?php
/**
 * SHRINEVA enquiry handler: settings.
 *
 * Do NOT put passwords in this file (it is committed to the repository). Put secrets, or any value you want
 * to change on the live server only, in `config.local.php` next to it. That file is git-ignored and its values
 * override these. Example config.local.php for SMTP through the domain mailbox:
 *
 *   <?php return [
 *     'transport' => 'smtp',
 *     'smtp' => ['host' => 'smtp.hostinger.com', 'port' => 465, 'secure' => 'ssl',
 *                'user' => 'leasing@shrineva.com', 'pass' => '********'],
 *     'from' => 'leasing@shrineva.com',
 *   ];
 */
return [
    // Everyone in this list gets every enquiry. leasing@shrineva.com only works once that mailbox exists.
    'recipients' => ['leasing@shrineva.com', 'neerajsingh250@gmail.com'],

    // Visible sender. Use a real mailbox or alias on the website's domain so SPF/DKIM line up.
    'from'      => 'leasing@shrineva.com',
    'from_name' => 'SHRINEVA website',

    // 'mail' = PHP's built-in mail() (works on Hostinger with no setup); 'smtp' = authenticated SMTP (more reliable).
    'transport' => 'mail',
    'smtp' => ['host' => 'smtp.hostinger.com', 'port' => 465, 'secure' => 'ssl', 'user' => '', 'pass' => ''],

    // Where enquiries are kept (one JSON line per enquiry plus a CSV you can open in Excel).
    // null = a "shrineva-leads" folder one level ABOVE the website folder (not reachable from the web);
    // if that is not writable the handler falls back to api/_data, which is closed to the web by .htaccess.
    'data_dir' => null,

    // Extra host names allowed to post (the site's own host is always allowed).
    'allowed_hosts' => [],

    // At most `max` enquiries per visitor per `window` seconds.
    'rate_limit' => ['max' => 6, 'window' => 600],

    // Tests set this to skip the actual send and just report what would have been sent.
    'dry_run' => false,
];
