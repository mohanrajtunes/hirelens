# HireLens redesign v3 (saved 10 Nov 2026, evening)

## v3 changes (latest, replaces the dark look below)
- Light cream page, ink outlines, hard shadows, 7 sticker colours (`styles/theme.css`, loaded last)
- Fonts: Fredoka (headings), Nunito (body)
- Light ribbons replaced by glossy 3D objects that scatter and fly together on scroll (`components/Scene3D.jsx`)
- Home: no pinned story; three cards tip up in 3D, the letter opens and is scanned
- Sample resume is a made-up person (`lib/resume.js`); no other projects anywhere
- About page replaced by `/why` (Why HireLens); builder credit only in the footer
- Tested on the dev server at 1440 wide with a stand-in API: full flow passes, board drag works
- NOT checked in v3: phone widths, How / Playground / Under the hood / Why pages by eye,
  real backend, reduced motion
- Unused files now also include `components/Ribbons.jsx` and `pages/site/About.jsx`

## v3.1 (same evening)
- Page is now dark purple with bright cards. `--ink` = text colour in place (light on the page,
  dark inside a card), `--edge` = outline and hard-shadow colour. See the end of `styles/theme.css`.
- 3D objects are job-hunt things: resume, lens, briefcase, envelope, paper plane, target, tick, AI chip, cards
- Buttons wobble, shine and pop confetti; ghost buttons are yellow or pink
- The five security cards were removed from Under the hood (rate-limit demo is still there)
- Tested at 1440 wide: home, Under the hood, and the full signed-in flow. Phones still not checked.

## v4 PROFESSIONAL (latest, replaces the sticker look)
- Graphite greys, lava red `#ff4326`, ember `#ff9a3d`; font Geist. All in `styles/theme.css` + tokens in `base.css`
- Navbar: Home and Demo only. How it works, Under the hood and Why pages are removed from the routes
- Professional wording everywhere; home demo score is computed from the sample texts, labelled as sample
- Scroll: each section wipes in over the last like a page change (`lib/reveal.js`, class `panelsec`)
- 3D: five lava/grey objects (resume, lens, briefcase, envelope, target, plane), visible mainly in the hero
- Tested at 1440 wide: home and demo, no console errors. NOT yet looked at in this theme:
  signed-in pages, phone widths, real backend
- Unused files safe to delete: `pages/site/How.jsx`, `Stack.jsx`, `Why.jsx`, `About.jsx`, `components/Ribbons.jsx`

## v5 DESIGN E (latest, chosen from five picture proposals on 11 Nov)
- Home (`pages/site/Home.jsx` + `styles/home.css`, classes prefixed `x-`): yellow hero, liquid-glass navbar,
  the app shown as four glass cards at different depths. Cards fly in, drift, lean toward the cursor, and on
  scroll the hero pins while they slide together into one screen and yellow fades to paper.
  Then three steps, the score formula band (numbers count up), a closing band.
- No Demo tab. Navbar is logo, Sign in, Get started. Only route besides auth and the app is `/`.
- Signed-in pages and sign-in use `styles/theme.css` (paper, ink, yellow accent, mint = have, amber = missing,
  liquid-glass dock). No 3D toy objects any more.
- Tested on the dev server with a stand-in API: home at 1440 and 390 wide, full signed-in flow at 1440. No console errors.
- NOT tested: real Django backend, signed-in pages on a phone, reduced motion.
- Unused files safe to delete in `src`: `styles/site.css`, `components/Nav.jsx`, `components/Scene3D.jsx`,
  `components/Ribbons.jsx`, `lib/reveal.js`, `pages/site/Play.jsx`, `How.jsx`, `Stack.jsx`, `Why.jsx`, `About.jsx`

## v5.1 fixes after the screen recording (11 Nov)
- Hero cards no longer clip at the right edge; they size to the space beside the heading
- Scroll sequence moves only transforms (text no longer re-wraps mid-animation), longer and smoother (scrub 1)
- Cards use a frosted gradient, not live blur, so 3D motion stays smooth; the navbar is still real glass
- Removed everything about how the score is calculated (formula band, keyword/AI bars)
- Tech skill words removed from sign-in, create-account and the steps; they remain only in the hero example
- Sign-in and create-account: one logo everywhere, two real buttons, hover sweep and press on all buttons
- Tested at 1918x940 and earlier sizes on the dev server. Still not tested: real backend, signed-in pages on a phone

# v2 notes

## Look
- Plum-black base, violet-to-magenta light ribbons (Three.js, `components/Ribbons.jsx`)
- Lime = skill you have, coral = skill missing, cream paper resume
- Fonts: Bricolage Grotesque, Instrument Serif italic, JetBrains Mono

## Done
- Public pages with a liquid-glass navbar and a page-change wipe:
  `/` home (pinned scroll story), `/how`, `/play`, `/stack`, `/about`
- Paper resume that unfolds and gets scanned (`components/Paper.jsx`, real text in CSS 3D)
- App: floating glass dock, Ctrl+K palette, Home overview, Match with live scan
  and score ring, drag-and-drop board, Skills gap page, confetti
- Tested on the dev server against a stand-in API at 1440 and 390 wide: no console errors

## Not done / not tested
- NOT tested against the real Django backend, a real phone, or reduced motion
- Tracker: a fix for cards staying small or out of place after a move went in
  last and was NOT re-tested. Check drag and the "move to" menu first.
- Phone screens of the app pages were not looked at
- Bundle is one 1.1 MB file: lazy-load routes and import only the Three.js parts used
- About page text is a draft; no email on it (add one in `pages/site/About.jsx` if wanted)
- Old unused files can be deleted: `src/pages/Landing.jsx`, `src/pages/Match.jsx`,
  `src/pages/Tracker.jsx`, `src/pages/AppShell.jsx`, `src/styles/landing.css`,
  `src/components/Backdrop.jsx`, `src/components/ResumeScene.jsx`

## Run
frontend: `npm install` then `npm run dev` (new font packages were added)
backend: `python manage.py migrate` then `python manage.py runserver`

## Rules for continuing
Test on the dev server, read files back after writing, user pushes to GitHub himself.

## v6 (11 Nov): hero animation replaced

The four flying cards are gone. The hero now has ONE app screen in a glass frame.
On scroll the hero pins, the screen stays in place and runs the check
(scan sweep lights the skills, score counts to 72, chips fill in, cover note writes),
while the text on the left changes through three beats. One GSAP timeline (`tl` in
`Home.jsx`) drives it all: scrubbed by scroll on wide screens, played once on phones.
The "three steps" section was removed because the beats now cover it.
Not tested: real backend, real phone, reduced motion.

## v7 (11 Nov): app pages

- Resume on Match is now a flat page with a scan line (no fold, no tilt, no stamps). `components/Paper.jsx`.
- Score panel no longer shows the keyword/AI split. It shows skills matched and missing.
- Search button, "Jump to / Ctrl K" and the command palette are removed. Dock tab is "Dashboard".
- Home button for signed-in visitors says "Dashboard". New favicon (logo on yellow).
- Empty states (`Empty` in bits.jsx), loading placeholders (`Skel`, `.spin`), getting-started checklist on the dashboard.
- Cover note is an editable textarea with word count; button rewrites in the chosen tone.
- New styles are at the bottom of `styles/theme.css` (section "v7").
Not tested: real backend, real phone.
- v7.1: closing band on Home shows a small tracker board (one card moves Saved to Applied). App navigation is at the top from 900px wide, bottom dock on phones. Resume page reveals behind a scan line on load. Home animation rebuilds when the window crosses 1000px (`wide` state in Home.jsx).
