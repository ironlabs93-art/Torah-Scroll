/**
 *   npm run test:sources             parse fixtures offline
 *   npm run test:sources -- --live UCxxxx   fetch a real YouTube channel feed
 */
import { parseFeed, parseChannelId, youtubeFeedUrl, fetchFeed, httpTextFetcher } from "../lib/sources.js";

let fails = 0;
const check = (n: string, ok: boolean, d = "") => {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${n}${d ? "  " + d : ""}`);
  if (!ok) fails++;
};

const YT = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>Example Daf Channel</title>
 <entry>
  <id>yt:video:AbCdEf12345</id>
  <yt:videoId>AbCdEf12345</yt:videoId>
  <yt:channelId>UC1234567890123456789012</yt:channelId>
  <title>Chullin 140 - Daf Yomi</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=AbCdEf12345"/>
  <published>2026-09-17T06:15:00+00:00</published>
  <media:group>
    <media:title>Chullin 140 - Daf Yomi</media:title>
    <media:description>Today&apos;s shiur on Chullin 140. &lt;b&gt;Sponsored&lt;/b&gt; by the Cohen family.</media:description>
  </media:group>
 </entry>
 <entry>
  <id>yt:video:ZZZ999</id>
  <yt:videoId>ZZZ999</yt:videoId>
  <title>Chullin 139 - Daf Yomi</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=ZZZ999"/>
  <published>2026-09-16T06:15:00+00:00</published>
  <media:group><media:description>Yesterday.</media:description></media:group>
 </entry>
</feed>`;

const PODCAST = `<?xml version="1.0"?>
<rss version="2.0"><channel>
 <title>A Shiur Podcast</title>
 <item>
   <title>Mishnah Yomi: Oholot 2</title>
   <guid isPermaLink="false">episode-1041</guid>
   <link>https://example.org/episodes/1041</link>
   <pubDate>Wed, 16 Sep 2026 10:00:00 +0000</pubDate>
   <description>&lt;p&gt;A walk through &lt;i&gt;Oholot&lt;/i&gt; chapter two.&lt;/p&gt;</description>
 </item>
</channel></rss>`;

const SINGLE = `<feed xmlns="http://www.w3.org/2005/Atom"><entry>
  <id>tag:example,2026:1</id><title>Only entry</title>
  <link rel="alternate" href="https://example.org/1"/><updated>2026-09-10T00:00:00Z</updated>
</entry></feed>`;

console.log("\n== youtube atom ==");
const yt = parseFeed(YT, { youtube: true });
check("two entries", yt.length === 2, String(yt.length));
check("title", yt[0].title === "Chullin 140 - Daf Yomi", yt[0].title);
check("guid is stable and video-scoped", yt[0].guid === "yt:AbCdEf12345", yt[0].guid);
check("watch url built", yt[0].videoUrl === "https://www.youtube.com/watch?v=AbCdEf12345", yt[0].videoUrl ?? "");
check("html stripped from description", !/[<>]/.test(yt[0].summary), yt[0].summary);
check("entities decoded", yt[0].summary.includes("Today's shiur"), yt[0].summary.slice(0, 40));
check("published parsed", yt[0].publishedAt?.toISOString().startsWith("2026-09-17") === true,
  String(yt[0].publishedAt));

console.log("\n== rss podcast ==");
const rss = parseFeed(PODCAST);
check("one item", rss.length === 1);
check("guid from <guid>", rss[0].guid === "episode-1041", rss[0].guid);
check("link kept", rss[0].url === "https://example.org/episodes/1041", rss[0].url);
check("not treated as video", rss[0].videoUrl === null);
check("markup stripped", rss[0].summary === "A walk through Oholot chapter two.", rss[0].summary);
check("pubDate parsed", rss[0].publishedAt?.getUTCFullYear() === 2026);

console.log("\n== shapes and junk ==");
check("single entry is not dropped", parseFeed(SINGLE).length === 1);
check("empty string", parseFeed("").length === 0);
check("not xml", parseFeed("this is not a feed").length === 0);
check("empty feed", parseFeed("<feed></feed>").length === 0);
check("entry without a title is skipped", parseFeed('<feed><entry><id>x</id></entry></feed>').length === 0);

console.log("\n== channel id ==");
check("bare UC id", (parseChannelId("UC1234567890123456789012") as any).channelId === "UC1234567890123456789012");
check("/channel/ url", (parseChannelId("https://www.youtube.com/channel/UC1234567890123456789012") as any).channelId === "UC1234567890123456789012");
check("feed url with query", (parseChannelId("https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890123456789012") as any).channelId === "UC1234567890123456789012");
check("@handle is refused, not guessed", "error" in parseChannelId("https://www.youtube.com/@MDYdaf"));
check("non-youtube url refused", "error" in parseChannelId("https://vimeo.com/channels/x"));
check("gibberish refused", "error" in parseChannelId("hello"));
check("feed url built", youtubeFeedUrl("UC123") === "https://www.youtube.com/feeds/videos.xml?channel_id=UC123");

console.log("\n== fetch errors ==");
const down = await fetchFeed("YOUTUBE", "UC123", async () => { throw new Error("network down"); });
check("network failure reported, not thrown", down.items.length === 0 && down.error === "network down");
const builtin = await fetchFeed("BUILTIN_TEXT", "", async () => "unused");
check("builtin kind fetches nothing", builtin.items.length === 0 && !builtin.error);

const live = process.argv.indexOf("--live");
if (live > -1) {
  const id = process.argv[live + 1];
  console.log(`\n== live: ${id} ==`);
  const r = await fetchFeed("YOUTUBE", id, httpTextFetcher);
  check("live fetch", r.items.length > 0, r.error ?? `${r.items.length} items`);
  r.items.slice(0, 3).forEach((i) => console.log(`      ${i.publishedAt?.toISOString().slice(0,10)}  ${i.title}`));
} else {
  console.log("\n(offline fixtures only. Run with --live UCxxxx to fetch a real channel.)");
}

console.log(`\n${fails === 0 ? "ALL CHECKS PASSED" : fails + " CHECK(S) FAILED"}\n`);
process.exit(fails ? 1 : 0);
