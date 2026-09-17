# Torah Scroll

Replace doomscrolling with learning.

A working proof of concept for a social feed built out of Torah content: divrei Torah,
daily quizzes, video shiurim and diagrams, posted by individuals and organizations,
ranked against the Jewish calendar so that what you are actually learning today rises
to the top.

## Run it

Nothing external is required. No API keys, no hosted database, no network calls at runtime.

```bash
npm install
npm run setup     # generate client, create SQLite db, seed content
npm run dev       # http://localhost:3000
```

Sign in with `demo@torahscroll.test` / `demo1234`. Every seeded account uses the same
password, so you can sign in as `maggid@torahscroll.test`, `mkatz@torahscroll.test` and
so on to see the feed from a different person's side.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build and server |
| `npm run db:reset` | Wipe and reseed against today's calendar |
| `npm run test:calendar` | Print the calendar engine's output for several dates |
| `npm run test:e2e` | Browser smoke test (needs a server already running) |
| `npm run test:sefaria` | Parser tests offline; add `-- --live` to hit the real API |
| `npm run sync:texts` | Pull today's daf, mishnayos and parsha into the feed |

## Running it on your phone

The app is built mobile-first and installs to the home screen as a PWA, so it
opens full screen without browser chrome.

**Same wifi (fastest, about two minutes).** Start the server bound to all
interfaces, then open your computer's LAN address on the phone:

```bash
npm run dev:lan          # or: npm run build && npm run start:lan
```

Find your computer's address with `ipconfig getifaddr en0` on macOS or
`hostname -I` on Linux, then visit `http://<that-address>:3000` on the phone.
Both devices need to be on the same network, and the computer has to stay running.

**Add it to the home screen.** Once the page is open: on iOS, Share then "Add to
Home Screen"; on Android, the menu then "Install app". It gets its own icon and
launches without the address bar, which is the point for something meant to
replace a scrolling habit.

**Showing it to someone remote.** Run the server and put a tunnel in front of it,
for example `npx cloudflared tunnel --url http://localhost:3000` or `ngrok http
3000`. You get a temporary public URL. Good for a demo, not for anything lasting.

**Real hosting.** SQLite will not work on Vercel or similar serverless hosts,
whose filesystems are read-only and ephemeral. You would need to point
`DATABASE_URL` at hosted Postgres (Neon, Supabase, Vercel Postgres) and change
the `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`. No
application code changes, but it is a real step and it is not done here.

## What works

- **Email and password accounts.** Hashed with bcrypt, session in a signed httpOnly
  JWT cookie. Sign up, onboarding, sign in, sign out.
- **Four post types.** Dvar Torah, quiz (answer inline, explanation reveals), video
  (YouTube and Vimeo, embedded, loaded on click), and diagram.
- **Hearts, comments, follows.** All persisted, all feeding back into ranking.
- **Three feeds.** For You (ranked), Today's Learning (calendar matches only),
  Following (chronological).
- **Tag and profile pages**, and source references that deep-link to Sefaria.
- **Long posts collapse** in the feed to about five lines with a Read more control.
  Only posts over 650 characters collapse, so a short dvar Torah still reads whole;
  a daf or a set of mishnayos does not swallow the screen. Post pages always show
  the full text. Hebrew-majority paragraphs render right to left in their own face.
- **Daily texts imported from Sefaria**, so the feed is never empty.
- **Reporting and a moderator review queue.**

## Daily texts from Sefaria

The feed has a floor. Today's daf, today's mishnayos and this week's sedra are
pulled from Sefaria's open library and posted by a `@sefaria` account, so the app
is useful on a day when nobody posted anything. User content becomes upside
rather than life support.

```bash
npm run sync:texts              # today
npm run sync:texts -- 2026-12-06   # a specific date
```

The feed also triggers this lazily, at most once a day, and never blocks the
render: if Sefaria is unreachable the reader still gets their feed.

`lib/sefaria.ts` takes its fetcher as an argument, so the parsing is tested
against fixtures with no network (`npm run test:sefaria`). That covers both API
response shapes, HTML stripping, ref building, excerpting and failure handling.

**One caveat, stated plainly.** The environment this was built in blocks outbound
requests to `www.sefaria.org`, so the parser has been tested against fixtures but
**the live response has never been seen**. Run `npm run test:sefaria -- --live`
on a machine with open network access before trusting it. If the shape differs,
`parseText` is the only function that needs to change.

Licensing varies per text version. Public domain works are unrestricted; several
modern translations are CC-BY or CC-BY-NC. The version title and license come
back with each response and are stored on the post and shown on the card. Check
the license before any commercial use.

## Moderation

Readers can report a post from its page. Reporting does not hide anything on its
own, which is deliberate: a report is not a verdict, and letting any reader take
a post down would be its own kind of abuse. Reports land in a queue at
`/moderate`, open only to accounts with `role = "MODERATOR"`.

A moderator can keep or remove. Removing sets the post to `REMOVED`, which takes
it out of every feed, profile and tag page and makes its permalink 404, but keeps
the row and writes a `ModerationAction` so there is a record of what came down
and why. The seeded `demo` account is a moderator and the seed plants one
reported post so the queue is not empty.

**Graduated exposure is still not built, and that is now a considered decision
rather than a gap.** At a few hundred users an "inner circle" is a large share of
the whole platform and each expansion tier means very little. The columns
(`Post.reach`) are there for when reach actually needs throttling.

## The calendar engine

`lib/calendar.ts` is the spine of the product. It computes, for any date and with no
network access:

- the Hebrew date, in English and in gematriya
- today's **Daf Yomi**
- today's **Mishnah Yomi**
- the coming Shabbos's **parsha**
- holidays within the next ten days, with how far away they are

This is built on `@hebcal/core` and `@hebcal/learning` rather than hand-rolled. Parsha
assignment in particular depends on leap years, year length and which festivals displace
a sedra; getting it subtly wrong in a Torah app is worse than not having the feature.

Verify it yourself with `npm run test:calendar`, which prints output across a leap year,
a festival and an Adar II date.

## How ranking works

`lib/feed.ts`. Deliberately a set of readable weights rather than a learned model, because
a Torah feed should be able to tell you why something reached you. Every term that adds
score also produces the reason string shown on the card.

| Signal | Weight |
| --- | --- |
| Post's source matches **today's daf** exactly | +62 |
| Post's source matches **today's Mishnah Yomi** chapter | +55 |
| Tagged with an **upcoming holiday** | up to +48, scaled by proximity |
| Tagged with **this week's parsha** | +44 |
| Author is someone you **follow** | +26 |
| **Tag affinity** from what you've hearted, answered and commented on | up to +36 |
| **Recency** | up to +20, half-life 3 days |
| **Engagement** | comments weighted higher than hearts |

Then:

- Posts you have already seen sink, but calendar matches have a higher floor. Today's
  daf is still today's daf on your second look at the feed.
- A diversity pass stops one account or one post format from taking three slots in a row.
- Rapid refreshes are not counted as separate views.

Comments are weighted above hearts on purpose. A conversation about a sugya is worth more
than a tap, which is the entire premise of the app.

## Deliberately not built yet

- **Graduated exposure.** See the moderation section: deferred on purpose until reach
  needs throttling.
- **A daily completion state and streak.** The strongest remaining idea, and the one
  most aligned with the premise: today's learning is finite and completable, unlike an
  infinite feed.
- **A daily nudge** by email or push. A habit app with no re-entry trigger forms no habit.
- **Sharing out** with a link preview. Content in this world spreads through WhatsApp.
- Image uploads, search, notifications, direct messages.

## A note on the seeded organizations

Every account in the seed is fictional: The Maggid Institute, Shas Companion, Chavrusa Quiz
and the rest. The pitch involves onboarding real institutions, and real institutions should
write their own words. Inventing divrei Torah and attributing them to an actual organization
is not something a proof of concept should ship, so the seed demonstrates the shape of
organizational accounts without putting words in anyone's mouth.

The Torah content itself is real and checked, but treat it as demo material rather than as
a source to rely on.

## Stack

Next.js 15 (App Router, server actions) · TypeScript · Prisma · SQLite · Tailwind ·
`@hebcal/core` and `@hebcal/learning` · bcrypt and jose for auth · Playwright for the
smoke test.

SQLite was chosen so the thing runs anywhere with one command. Moving to Postgres is a
change to `prisma/schema.prisma` and `DATABASE_URL`, nothing more.

## Layout

```
app/            routes and server actions
components/     post card, feed chrome, client interactions
lib/
  calendar.ts   Hebrew date, Daf Yomi, Mishnah Yomi, parsha, holidays
  sefaria.ts    text fetching and parsing, network injected for testing
  daily-import.ts  turns those texts into feed posts, idempotent
  feed.ts       ranking, diversity pass, affinity updates
  auth.ts       password hashing, session cookie
  taxonomy.ts   the tag vocabulary
prisma/         schema and seed
public/diagrams six hand-built SVG diagrams used by the image posts
scripts/        calendar check and end-to-end browser test
```

Set `AUTH_SECRET` to a long random string before deploying anywhere real.
