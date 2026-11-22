# ChaiX, the SHRINEVA leasing assistant

ChaiX is the chat assistant on the site. Its round avatar (with a green "online" dot) sits at the bottom right of every page, above
the phone action bar on phones and above the WhatsApp button on larger screens. When a page loads it says **"How can I help you?"**
(about half a second after load, for 6.5 s); on the first page of a visit it then says **"My name is ChaiX · Online"** (6 s) and tucks
away, leaving only the avatar. Later pages of the same visit repeat "How can I help you?" up to three pages in all; the cross on the
bubble keeps it away for the rest of the visit. It is held back while a dialog, the menu or a form field is in use. Pressing the
avatar or the bubble opens the window. It answers questions about the building from the project's own facts, shows the most-asked
questions pinned above the message box, and lets a visitor send a question to the leasing team (name, mobile number, email and the
question; the chat so far goes with it).

**What it is not:** ChaiX is not a live AI model. Every answer is written in `src/app/config/chaix.knowledge.ts`, drawn from the same
configs as the pages and the brochure, and each visitor question is matched to one of those answers. That is deliberate: it can
never invent a figure, a rent, an approval or a date. When something is not confirmed it says so and offers to pass the question on.

## Where things live

| What | File |
| --- | --- |
| Everything ChaiX knows (answers in English and Hindi, matching words, the pinned questions) | `src/app/config/chaix.knowledge.ts` |
| The matching engine (reads a question, picks the answers, builds chips and buttons) | `src/app/core/chaix/chaix-engine.ts` |
| How an answer is drawn (labels, bullets, bold names, tap-to-call and tap-to-write links) | `src/app/components/chaix/chaix.format.ts` |
| The avatar dock, the speech bubble and its timings (`BUBBLE_*`, state kept in `sessionStorage` key `shrineva.chaix.intro`), the chat window (panel, pinned strip, send-to-team form) | `src/app/components/chaix/chaix.component.{ts,html,scss}`, words in `chaix.text.ts` (English and Hindi) |
| Open it from any button | `openChaix({ question?, source? })` in `src/app/core/ui-events.ts` |
| The build test (questions, wording rules, structure) | `scripts/test-chaix.js` (runs after every `npm run build`) |
| The enquiry handler | `src/api/lead.php` (kind `chaix`) |

The engine and the answers are a separate download (about 28 kB compressed) that loads the first time a visitor opens ChaiX or
reaches for the button, so the page itself stays light.

## How a question is answered

1. The text is split into words; Hindi and Hinglish words are mapped onto English matching words (`SYNONYMS` in the engine) and small
   spelling mistakes are tolerated.
2. Each entry's `keys` (words or phrases) are scored; longer phrases score higher, and "weak" keys written `'~word'` count only
   together with another key (so "good" alone does not pull in a business answer).
3. Floor words ("second floor"), sizes ("I need 1,500 sq ft") and business types ("bank", "clinic", "gym") get their own handling.
4. One or two entries are composed into the reply. The reply carries up to three follow-up buttons and up to three action buttons
   (Floor plans, 3D explorer, Schedule a visit, Send my question to the team). A follow-up never repeats a pinned question.
5. A question nothing matches gets the "not covered" answer, which offers the most-asked questions and the send-to-team form.

## How answers look

Answers are point-wise so they can be scanned: one short line that answers, then one fact per point.

```
Here is what matters for a bank, NBFC or insurance branch:   <- lead line (drawn semi-bold)
**Location**                                                  <- a line that is only **bold** is a section label
• High footfall potential: directly opposite the upcoming …   <- "• " is a point; text before a colon is drawn bold
• About 50 ft of frontage on a 24 m wide road
**Next step**
• … call +91 81140 80609 or email leasing@shrineva.in         <- published numbers and the email become links
```

Use the helpers `ans(...)`, `pts(...)` and `lab(...)` exported from the knowledge file. The build rejects a long answer without
points, an answer over its word limit (95 words; 195 for the business answers) and a stray `**`. Text is drawn from its parts, never
as HTML, so an answer cannot inject markup.

## Teaching ChaiX

- **A new fact or question:** add an entry to `KB` (`id`, `title`, `keys`, `a: { en, hi }`, optional `next`, `actions`), add a few
  example questions to `scripts/test-chaix.js`, run `npm run build`. A fact that already lives in a config (the specification sheet,
  distances, plan figures) is read from that config, not retyped, so changing the config changes ChaiX.
- **A new kind of business:** add it to the business list near `suit(...)` in the knowledge file: its keys, the "For <business>"
  points, and its follow-ups. Every business answer has the same sections in the same order: lead line, Location, Floor, Parking and
  access, For <business>, Next step.
- **The pinned "Most asked" questions:** edit `PINNED`. Each needs an English and a Hindi label, and typing the label must reach the
  same entry (the test checks it).
- **Hindi:** write it into the entry's `hi` text. Have a Hindi reader read new Hindi wording before it goes live.

## Rules the build enforces

The test fails the build (and so blocks the zip) if an answer: quotes a rent, price, deposit or any charge; says "column-free"; says
"handover", studio, serviced stay or hotel; mentions night or golden-hour views; calls the Apollo Hospital anything but upcoming or
under construction; states the completion month as anything but a target subject to approvals; quotes "footfall" as a number or a
promise (only "footfall potential" is used, and no footfall figures are published); gives the lift as anything but 10-passenger;
names a road as anything but the 24 m wide road; puts a phone number or email that is not the published one into an answer; or
claims an approval that the owner's switch in `property.config.ts` has not turned on. The owner asked for no disclaimer line under the
message box, so there is none; do not add one back.

## Send my question to the team

The form has the same four fields as every other enquiry form on the site: name, mobile number and email (all required) and the
question (filled in with what they last asked; the placeholder suggests adding the business, the space and the parking need). On Send,
the browser posts to `/api/lead.php` with kind `chaix`:

- Recipient: `leasing@shrineva.in` only. The mailbox must exist in Hostinger (Emails) or the mail bounces. Reply-To is the visitor's
  email, so replying to the enquiry answers them directly. The subject is `[SHRINEVA] New question from the ChaiX chat: <mobile>`.
- The email lists Business category (the latest business the visitor asked about), Space required (a size they typed, such as
  "1,500 sq ft"), Preferred floor (the floor they were looking at), the question, and the chat so far, one line per question with the
  topic that answered it ("not covered by ChaiX" when nothing matched).
- A copy is kept on the server (`leads-YYYY-MM.jsonl` and `leads.csv`, outside the web root where possible). At most 6 enquiries per
  visitor per 10 minutes; a hidden field catches bots; only the site's own host may post.
- If the handler is unreachable the form tries FormSubmit as a backup, and if both fail it keeps what the visitor typed and shows the
  phone and WhatsApp numbers. It never shows "sent" unless delivery was confirmed.
- Nothing is sent anywhere until the visitor presses Send. Analytics events (`chaix_prompt_show`, `chaix_prompt_click`,
  `chaix_prompt_dismiss`, `chaix_open`, `chaix_close`, `chaix_question`, `chaix_language`, `chaix_action`, `chaix_form_open`,
  `lead_form_error`) carry counts and topic names only, never typed text. The
  chat lives in the browser's memory only, so a reload starts a new one. This also means a question ChaiX could not answer is only
  seen by the team if the visitor sends it.

To use authenticated SMTP instead of PHP `mail()`, put the mailbox settings in `src/api/config.local.php` on the server (git-ignored;
see the example in `src/api/config.php`).

## Testing

- `node scripts/test-chaix.js`: questions in English and Hindi, every specification row, every not-confirmed item, wording rules,
  point-wise structure, the formatter. It runs automatically after `npm run build`.
- Avatar and bubble: load any page with a fresh tab (clear `sessionStorage`); "How can I help you?" appears, then "My name is ChaiX";
  on `/hi` the bubble is in Hindi. Check it at 320 px wide and in landscape: it must not cover the action bar or the menu.
- Window: open it on a phone-size and a desktop-size page; tap a pinned question; type a business question ("how is this suitable
  for a bank"); switch to हिन्दी; open Send my question to the team, press Send once with the fields empty (every error should show),
  then with real values.
- Handler: `php -S` with `src/api/` and a `config.local.php` setting `data_dir` and (to read the email) a `sendmail_path` script. This
  proves the handler, the stored copy and the email that is handed to the mail system. It cannot prove that Hostinger's mail system
  delivers to the inbox: after every first upload, send one real test enquiry from the live site and look in the inbox **and the
  spam folder** (see "Where enquiries go" in the README).

## If a language model is ever wanted

Not enabled, by design. If the owner wants free-form answers, the safe shape is a server-side `src/api/chaix.php` that sends the
visitor's question plus the text of the knowledge base to a model and returns only what the knowledge base supports, falling back to
this engine when the model is unavailable or unsure. It needs an API key (kept in `config.local.php`, never in the repository), a
monthly cost limit, and a decision on what visitor text may leave the site. None of that is in place.
