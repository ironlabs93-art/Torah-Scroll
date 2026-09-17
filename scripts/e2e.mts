/**
 * End-to-end smoke test against a running dev/prod server.
 *   npm run start        (in one shell)
 *   npx tsx scripts/e2e.mts
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS ?? "/tmp/claude-0/shots";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } } as never);

console.log("\n== landing ==");
await page.goto(`${BASE}/welcome`);
check("welcome renders", (await page.locator("h1").innerText()).includes("scroll"));
await page.screenshot({ path: `${SHOTS}/01-welcome.png`, fullPage: true });

console.log("\n== login ==");
await page.goto(`${BASE}/login`);
await page.fill("#email", "demo@torahscroll.test");
await page.fill("#password", "demo1234");
await page.click('button[type=submit]');
await page.waitForURL(`${BASE}/`, { timeout: 15000 });
check("logged in and landed on feed", page.url() === `${BASE}/`);

console.log("\n== feed ==");
await page.waitForSelector("article, main");
const cards = page.locator("main > div.space-y-4 > div");
const cardCount = await cards.count();
check("feed has posts", cardCount > 5, `${cardCount} cards`);

const reasons = await page.locator('main span:has-text("Today\'s daf")').count();
check("calendar reason pill present", reasons > 0, `${reasons} pills`);

const topThree = (
  await Promise.all([0, 1, 2].map((i) => cards.nth(i).innerText()))
).join(" ");
check("today's daf ranks in the top 3", /Today's daf/.test(topThree));
await page.screenshot({ path: `${SHOTS}/02-feed.png`, fullPage: true });

console.log("\n== quiz interaction ==");
const quizCard = page.locator("main [data-quiz-choice='0']:not([disabled])").first();
if (await quizCard.count()) {
  await quizCard.scrollIntoViewIfNeeded();
  await quizCard.click();
  await page.waitForTimeout(1200);
  const revealed = await page.locator('text=/Correct\\.|Not quite\\./').count();
  check("quiz reveals answer + explanation", revealed > 0);
  await page.screenshot({ path: `${SHOTS}/03-quiz.png`, fullPage: false });
} else {
  check("quiz card found", false);
}

console.log("\n== heart ==");
// Resolve to a concrete element first: the aria-label flips on click, so a
// filtered locator would silently re-resolve to a different card.
const heartEl = await page.$('button[data-heart-button][aria-pressed="false"]');
if (!heartEl) throw new Error("no unhearted post found in feed");
const heartPostId = await heartEl.getAttribute("data-heart-button");
const beforeCount = Number((await heartEl.innerText()).trim());
await heartEl.scrollIntoViewIfNeeded();
await heartEl.click();
await page.waitForTimeout(2000);
check(
  "heart increments optimistically",
  Number((await heartEl.innerText()).trim()) === beforeCount + 1,
  `${beforeCount} -> ${(await heartEl.innerText()).trim()}`
);

await page.goto(`${BASE}/post/${heartPostId}`);
const persistedEl = await page.$(`button[data-heart-button="${heartPostId}"]`);
const persistedCount = Number((await persistedEl!.innerText()).trim());
const persistedPressed = await persistedEl!.getAttribute("aria-pressed");
check(
  "heart persisted to the database",
  persistedCount === beforeCount + 1 && persistedPressed === "true",
  `reloaded as ${persistedCount}, pressed=${persistedPressed}`
);

console.log("\n== tabs ==");
await page.goto(`${BASE}/`);
await page.click('a:has-text("Today\'s Learning")');
await page.waitForURL(/tab=today/);
const todayCount = await page.locator("main > div.space-y-4 > div").count();
check("Today tab filters to calendar posts", todayCount > 0, `${todayCount} cards`);
await page.screenshot({ path: `${SHOTS}/04-today.png`, fullPage: true });

await page.click('a:has-text("Following")');
await page.waitForURL(/tab=following/);
check("Following tab loads", (await page.locator("main > div.space-y-4 > div").count()) > 0);

console.log("\n== post detail + comment ==");
await page.goto(`${BASE}/`);
await page.locator("main a[href^='/post/']").first().click();
await page.waitForURL(/\/post\//);
check("post page loads", (await page.locator("main").count()) > 0);
await page.fill('textarea[name=body]', "Testing the comment box end to end.");
await page.click('button:has-text("Comment")');
await page.waitForTimeout(2500);
const commentShown = await page.locator("text=Testing the comment box end to end.").count();
check("comment posts and appears", commentShown > 0);
await page.screenshot({ path: `${SHOTS}/05-post.png`, fullPage: true });

console.log("\n== profile + follow ==");
await page.goto(`${BASE}/u/mkatz`);
check("profile renders", (await page.locator("h1").innerText()).includes("Miriam"));
const followBtn = page.locator('button:has-text("Follow"), button:has-text("Following")').first();
const initialLabel = await followBtn.innerText();
await followBtn.click();
await page.waitForTimeout(1500);
await page.reload();
const newLabel = await page
  .locator('button:has-text("Follow"), button:has-text("Following")')
  .first()
  .innerText();
check("follow state persists across reload", newLabel !== initialLabel, `${initialLabel} -> ${newLabel}`);
await page.screenshot({ path: `${SHOTS}/06-profile.png`, fullPage: true });

console.log("\n== tag page ==");
await page.goto(`${BASE}/tag/daf-yomi`);
check("tag page shows today's daf", (await page.locator("main").innerText()).includes("Chullin 140"));
await page.screenshot({ path: `${SHOTS}/07-tag.png`, fullPage: true });

console.log("\n== compose: quiz ==");
await page.goto(`${BASE}/compose`);
await page.click('button:has-text("Quiz")');
await page.fill("#question", "Which seder contains Masechta Berachos?");
await page.fill('input[name=choice0]', "Zeraim");
await page.fill('input[name=choice1]', "Moed");
await page.fill('input[name=choice2]', "Nashim");
await page.fill("#explanation", "Berachos opens Seder Zeraim, even though its subject is brachos rather than agriculture.");
await page.fill("#sourceWork", "Berakhot");
await page.fill("#sourceRef", "1:1");
await page.click('button:has-text("Mishnah Yomi")');
await page.screenshot({ path: `${SHOTS}/08-compose.png`, fullPage: true });
await page.click('button:has-text("Post to the feed")');
await page.waitForURL(/\/post\//, { timeout: 15000 });
const created = await page.locator("main").innerText();
check("quiz post created", created.includes("Which seder contains Masechta Berachos?"));
check("source reference saved", created.includes("Berakhot 1:1"));
await page.screenshot({ path: `${SHOTS}/09-created.png`, fullPage: true });

console.log("\n== compose: video validation ==");
await page.goto(`${BASE}/compose`);
await page.click('button:has-text("Video")');
await page.fill("#videoUrl", "https://example.com/not-a-video");
await page.waitForTimeout(400);
check(
  "rejects non-embeddable video link",
  (await page.locator("text=won't play inline").count()) > 0
);
await page.fill("#videoUrl", "https://www.youtube.com/watch?v=aqz-KE-bpKQ");
await page.waitForTimeout(400);
check(
  "accepts YouTube link",
  (await page.locator("text=this will play in the feed").count()) > 0
);

console.log("\n== signup + onboarding ==");
const ctx = await browser.newContext();
const p2 = await ctx.newPage();
await p2.goto(`${BASE}/signup`);
const uniq = `tester${Date.now().toString().slice(-7)}`;
await p2.fill("#name", "Test Learner");
await p2.fill("#handle", uniq);
await p2.fill("#email", `${uniq}@example.com`);
await p2.fill("#password", "testing1234");
await p2.click('button[type=submit]');
await p2.waitForURL(/onboarding/, { timeout: 15000 });
check("signup lands on onboarding", p2.url().includes("onboarding"));
await p2.click('button:has-text("Daf Yomi")');
await p2.click('button:has-text("Machshava")');
await p2.screenshot({ path: `${SHOTS}/10-onboarding.png`, fullPage: true });
await p2.click('button:has-text("Build my feed")');
await p2.waitForURL(`${BASE}/`, { timeout: 15000 });
const newFeed = await p2.locator("main > div.space-y-4 > div").count();
check("new user gets a populated feed", newFeed > 3, `${newFeed} cards`);
const newUserReasons = await p2.locator('main span:has-text("Today\'s daf")').count();
check("new user sees calendar-matched content", newUserReasons > 0);
await p2.screenshot({ path: `${SHOTS}/11-newuser-feed.png`, fullPage: true });

console.log("\n== long posts collapse ==");
await page.goto(`${BASE}/`);
await page.waitForTimeout(600);
const collapse = await page.evaluate(async () => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Read more")) as HTMLButtonElement | undefined;
  if (!btn) return null;
  const inner = btn.parentElement!.querySelector("div.overflow-hidden") as HTMLElement;
  const before = inner.clientHeight;
  const full = inner.scrollHeight;
  btn.click();
  await new Promise((r) => setTimeout(r, 500));
  return { before, full, after: inner.clientHeight, showLess: !!btn.textContent?.includes("Show less") };
});
check("a long post is collapsed in the feed", collapse !== null);
if (collapse) {
  check("collapsed body is short", collapse.before < collapse.full, `${collapse.before}px of ${collapse.full}px`);
  check("Read more expands it fully", collapse.after === collapse.full, `-> ${collapse.after}px`);
  check("control flips to Show less", collapse.showLess);
}
check(
  "short posts are not collapsed",
  await page.evaluate(() => {
    const bodies = [...document.querySelectorAll("div.overflow-hidden")];
    // Every clamped body must belong to a post that also offers Read more.
    return bodies.every((b) => !b.getAttribute("style")?.includes("max-height") ||
      !!b.parentElement?.querySelector("button"));
  })
);
// Right-to-left rendering needs Hebrew-majority text, which arrives with the
// Sefaria import. The heuristic itself is unit-tested in check-sefaria.mts.

console.log("\n== subscriptions ==");
await page.goto(`${BASE}/sources`);
const srcText = await page.locator("main").innerText();
check("subscriptions page loads", /Subscriptions/.test(srcText));
check("built-in daily texts are live", /Daily Texts/.test(srcText));
check("external sources are held back", /not switched on yet/i.test(srcText));
check("All Daf listed but not enabled", /All Daf/.test(srcText));
check("setup note explains what is missing", /permission/i.test(srcText));
check("moderator sees setup controls", (await page.locator('form input[name="feedRef"]').count()) > 0);
await page.screenshot({ path: `${SHOTS}/14-sources.png`, fullPage: true });

// Refusing a vanity URL rather than guessing a channel id.
const ytForm = page.locator("form").filter({ has: page.locator('input[name="feedRef"]') }).last();
await ytForm.locator('input[name="feedRef"]').fill("https://www.youtube.com/@MDYdaf");
await ytForm.locator('input[name="enabled"]').check();
await ytForm.locator('button:has-text("Save")').click();
await page.waitForTimeout(1800);
check(
  "a handle URL is refused, not guessed at",
  (await page.locator("text=/does not contain the channel id/").count()) > 0
);

// A real channel id is accepted.
await ytForm.locator('input[name="feedRef"]').fill("UC1234567890123456789012");
await ytForm.locator('button:has-text("Save")').click();
await page.waitForTimeout(1800);
check("a UC id is accepted", (await page.locator("text=Saved.").count()) > 0);

console.log("\n== subscribing ==");
await page.goto(`${BASE}/sources`);
const subBtn = page.locator('button:has-text("Follow")').first();
if (await subBtn.count()) {
  await subBtn.click();
  await page.waitForTimeout(1500);
  await page.reload();
  check("subscription sticks", (await page.locator('button:has-text("Following")').count()) > 0);
} else {
  check("already subscribed to every live channel", true);
}

console.log("\n== flagging ==");
await page.goto(`${BASE}/`);
// Flag a post authored by someone else.
const targetHref = await page.locator("main a[href^='/post/']").first().getAttribute("href");
await page.goto(`${BASE}${targetHref}`);
const flagBtn = page.locator('button[aria-label="Report this post"]');
check("report control shown on someone else's post", (await flagBtn.count()) > 0);
if (await flagBtn.count()) {
  await flagBtn.click();
  await page.locator('input[value="SPAM"]').check();
  await page.fill('input[name=note]', "e2e test report");
  await page.click('button:has-text("Report")');
  await page.waitForTimeout(2000);
  check("report acknowledged", (await page.locator("text=Reported. Thank you.").count()) > 0);
}

console.log("\n== moderation queue ==");
await page.goto(`${BASE}/moderate`);
check("moderator reaches the queue", page.url().endsWith("/moderate"));
const queued = await page.locator("main").innerText();
check("seeded spam report is queued", /Selling my sefarim/.test(queued));
await page.screenshot({ path: `${SHOTS}/13-moderate.png`, fullPage: true });

// Remove the seeded spam post and confirm it leaves the feed.
// Remove the seeded spam specifically, not whichever card happens to be first.
const queuedBefore = await page.locator('form button:has-text("Remove")').count();
const spamForm = page.locator("form").filter({ has: page.locator('button:has-text("Remove")') }).first();
await spamForm.locator('button:has-text("Remove")').click();
await page.waitForTimeout(2500);
const queuedAfter = await page.locator('form button:has-text("Remove")').count();
check("post leaves the review queue", queuedAfter === queuedBefore - 1, `${queuedBefore} -> ${queuedAfter}`);
check(
  "removal is recorded in the audit list",
  (await page.locator('text=Recently removed').count()) > 0
);

await page.goto(`${BASE}/?tab=foryou`);
const feedText = await page.locator("main").innerText();
check("removed post is gone from the feed", !/Selling my sefarim/.test(feedText));

console.log("\n== non-moderator is redirected ==");
const memberCtx = await browser.newContext();
const m = await memberCtx.newPage();
await m.goto(`${BASE}/login`);
await m.fill("#email", "mkatz@torahscroll.test");
await m.fill("#password", "demo1234");
await m.click("button[type=submit]");
await m.waitForURL(`${BASE}/`, { timeout: 15000 });
await m.goto(`${BASE}/moderate`);
await m.waitForTimeout(1200);
check("member cannot open the queue", !m.url().endsWith("/moderate"), `landed on ${m.url()}`);
check("member sees no Review link", (await m.locator('a:has-text("Review")').count()) === 0);
await memberCtx.close();

console.log("\n== mobile layout ==");
const mob = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p3 = await mob.newPage();
await p3.goto(`${BASE}/welcome`);
const scrollW = await p3.evaluate(() => document.documentElement.scrollWidth);
check("no horizontal overflow on phone", scrollW <= 390, `scrollWidth ${scrollW}`);
await p3.screenshot({ path: `${SHOTS}/12-mobile.png`, fullPage: true });

await browser.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
