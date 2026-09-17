/**
 * Two modes:
 *   npm run test:sefaria        parse fixtures offline (no network)
 *   npm run test:sefaria -- --live   hit the real API and print what comes back
 */
import { parseText, stripHtml, toSefariaRef, excerpt, fetchText, httpFetcher } from "../lib/sefaria.js";

let fails = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}${detail ? "  " + detail : ""}`);
  if (!ok) fails++;
}

/* ---- fixtures: both API shapes, as documented ---- */

const V3 = {
  ref: "Chullin 140a",
  versions: [
    {
      language: "en",
      versionTitle: "William Davidson Edition - English",
      license: "CC-BY-NC",
      text: ["<b>MISHNA:</b> In the case of one who takes&nbsp;a mother bird.", "Second line here."],
    },
    { language: "he", versionTitle: "Vilna Edition", text: ["<b>מתני׳</b> הנוטל אם על הבנים"] },
  ],
};

const V1 = {
  ref: "Oholot 2:4",
  text: [["A quarter-<i>log</i> of blood.", "And a quarter-log of blood that came from two corpses."]],
  he: [["רביעית דם", "ורביעית דם שיצא משני מתים"]],
  versionTitle: "Mishnah Yomit",
  license: "Public Domain",
};

console.log("\n== html stripping ==");
check("tags removed", stripHtml("<b>MISHNA:</b> text") === "MISHNA: text");
check("entities decoded", stripHtml("one&nbsp;two &amp; three") === "one two & three");
check("br becomes space", stripHtml("a<br/>b") === "a b");

console.log("\n== ref building ==");
check("spaces to underscores", toSefariaRef("Bava Metzia", "2a") === "Bava_Metzia.2a", toSefariaRef("Bava Metzia", "2a"));
check("chapter:mishnah kept", toSefariaRef("Oholot", "2:4") === "Oholot.2:4", toSefariaRef("Oholot", "2:4"));
check("apostrophes dropped", toSefariaRef("Ha'azinu", "") === "Haazinu", toSefariaRef("Ha'azinu", ""));
check("curly apostrophes dropped", toSefariaRef("Tish\u2019a B\u2019Av", "") === "Tisha_BAv", toSefariaRef("Tish\u2019a B\u2019Av", ""));
check("empty ref yields bare work", toSefariaRef("Haazinu", "") === "Haazinu");

console.log("\n== v3 shape ==");
const a = parseText(V3, "fallback");
check("parsed", !!a);
check("english extracted", a?.en[0] === "MISHNA: In the case of one who takes a mother bird.", a?.en[0]);
check("hebrew extracted", a?.he[0] === "מתני׳ הנוטל אם על הבנים", a?.he[0]);
check("version title kept", a?.versionTitle === "William Davidson Edition - English");
check("license kept", a?.license === "CC-BY-NC");
check("url built", a?.url === "https://www.sefaria.org/Chullin_140a", a?.url);

console.log("\n== v1 shape ==");
const b = parseText(V1, "fallback");
check("parsed", !!b);
check("nested arrays flattened", b?.en.length === 2, String(b?.en.length));
check("italics stripped", b?.en[0] === "A quarter-log of blood.", b?.en[0]);
check("hebrew flattened", b?.he.length === 2, String(b?.he.length));

console.log("\n== degenerate input ==");
check("null payload", parseText(null, "x") === null);
check("empty object", parseText({}, "x") === null);
check("empty bodies", parseText({ text: [], he: [] }, "x") === null);
check("string body accepted", parseText({ text: "just a string" }, "x")?.en[0] === "just a string");
check("ref falls back", parseText({ text: "a" }, "Berakhot 2a")?.ref === "Berakhot 2a");

console.log("\n== excerpting ==");
const long = Array.from({ length: 30 }, (_, i) => "Line " + i + " " + "x".repeat(60));
const ex = excerpt(long, 300);
check("truncates", ex.truncated);
check("stays under budget-ish", ex.body.length < 400, String(ex.body.length));
const short = excerpt(["one", "two"], 900);
check("short passes through whole", !short.truncated && short.body === "one\n\ntwo");

console.log("\n== fetch error handling ==");
const boom = await fetchText("Chullin", "140a", async () => { throw new Error("network down"); });
check("network failure returns null instead of throwing", boom === null);
const junk = await fetchText("Chullin", "140a", async () => ({ nonsense: true }));
check("unparseable payload returns null", junk === null);

if (process.argv.includes("--live")) {
  console.log("\n== live API ==");
  try {
    const live = await fetchText("Chullin", "140a", httpFetcher);
    check("live fetch returned text", !!live);
    if (live) {
      console.log("      ref:", live.ref);
      console.log("      version:", live.versionTitle, "| license:", live.license);
      console.log("      en[0]:", (live.en[0] ?? "").slice(0, 110));
      console.log("      he[0]:", (live.he[0] ?? "").slice(0, 80));
    }
  } catch (e) {
    check("live fetch", false, String(e));
  }
} else {
  console.log("\n(offline fixtures only. Run with --live to hit the real API.)");
}

console.log(`\n${fails === 0 ? "ALL CHECKS PASSED" : fails + " CHECK(S) FAILED"}\n`);
process.exit(fails === 0 ? 0 : 1);
