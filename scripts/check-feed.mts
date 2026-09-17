import { PrismaClient } from "@prisma/client";
import { buildFeed } from "../lib/feed.js";

const db = new PrismaClient();
const demo = await db.user.findUnique({ where: { handle: "demo" } });
await db.$disconnect();

for (const mode of ["foryou", "today", "following"] as const) {
  const { posts, calendar } = await buildFeed({ userId: demo!.id, mode, limit: 8 });
  console.log(`\n######## ${mode.toUpperCase()}  (${calendar.dafYomi.display} | ${calendar.parsha})`);
  posts.forEach((p, i) => {
    const head = (p.title ?? p.body ?? JSON.parse(p.quizJson!).question).slice(0, 62);
    console.log(
      `${String(i + 1).padStart(2)}. [${String(Math.round(p.score)).padStart(3)}] ${p.type.padEnd(5)} @${p.author.handle.padEnd(18)} ${head}`
    );
    if (p.reasons.length) console.log(`         -> ${p.reasons.map((r) => r.label).join("  |  ")}`);
  });
}
