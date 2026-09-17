import type { DailyLearning } from "../lib/calendar";

export type SeedPost = {
  author: string;
  type: "TEXT" | "QUIZ" | "VIDEO" | "IMAGE";
  title?: string;
  body?: string;
  videoUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  quiz?: { question: string; choices: string[]; answerIndex: number; explanation: string };
  sourceWork?: string;
  sourceRef?: string;
  tags: string[];
  /** Days before now. Fractions allowed. */
  ago: number;
  hearts: number;
};

/**
 * Organization and individual accounts are fictional. Real institutions would
 * be onboarded and verified themselves. Inventing divrei Torah and attributing
 * them to a real organization is not something a POC should ship.
 */
export const ACCOUNTS = [
  { handle: "maggid", name: "The Maggid Institute", kind: "ORG", verified: true, hue: 158,
    bio: "A short dvar Torah every morning. Parsha, machshava, and the occasional hard question." },
  { handle: "shascompanion", name: "Shas Companion", kind: "ORG", verified: true, hue: 212,
    bio: "Daf Yomi summaries, structure maps and review questions. One daf, one card." },
  { handle: "mishnahproject", name: "The Mishnah Project", kind: "ORG", verified: true, hue: 32,
    bio: "Following Mishnah Yomi, perek by perek, in plain English." },
  { handle: "bmlive", name: "Beis Medrash Live", kind: "ORG", verified: true, hue: 348,
    bio: "Recorded shiurim from our beis medrash. New video most days." },
  { handle: "chavrusaquiz", name: "Chavrusa Quiz", kind: "ORG", verified: true, hue: 275,
    bio: "One question a day. Answer before you scroll past." },
  { handle: "seferdiagrams", name: "Sefer Diagrams", kind: "ORG", verified: true, hue: 190,
    bio: "We draw the sugya. Charts, timelines and structure maps, tagged to chapter and mishnah." },
  { handle: "halachadaily", name: "Halacha Daily", kind: "ORG", verified: true, hue: 120,
    bio: "Practical halacha in under ninety seconds. Always cite your posek." },
  { handle: "parshaperspectives", name: "Parsha Perspectives", kind: "ORG", verified: true, hue: 14,
    bio: "Four takes on the parsha every week, from four different batei midrash." },

  { handle: "yosefadler", name: "Yosef Adler", kind: "PERSON", verified: false, hue: 200,
    bio: "Daf Yomi since the last siyum. Accountant by day. I post what I didn't understand." },
  { handle: "mkatz", name: "Miriam Katz", kind: "PERSON", verified: false, hue: 320,
    bio: "Teaching 8th grade Chumash. Mishnah Yomi on the train." },
  { handle: "dstern", name: "Dovid Stern", kind: "PERSON", verified: false, hue: 44,
    bio: "Baal teshuva, five years in. Still asking the beginner questions on purpose." },
  { handle: "shirabloom", name: "Shira Bloom", kind: "PERSON", verified: false, hue: 290,
    bio: "Nach Yomi, and a soft spot for Sefer Shmuel." },
  { handle: "demo", name: "Demo User", kind: "PERSON", verified: false, hue: 160,
    bio: "This is the account you're logged into. Try posting something." },
];

/** Evergreen content: always in the feed regardless of the date. */
export const EVERGREEN: SeedPost[] = [
  {
    author: "maggid", type: "TEXT", ago: 1.1, hearts: 264,
    title: "The four who entered the pardes, read slowly",
    body: "Chagigah 14b tells it in a few lines and then moves on, which is part of why it unsettles people.\n\nFour entered the pardes: Ben Azzai, Ben Zoma, Acher, and Rabbi Akiva. Ben Azzai looked and died. Ben Zoma looked and was harmed. Acher cut down the shoots. Rabbi Akiva entered in peace and left in peace.\n\nThe usual reading treats this as a warning about mysticism: dangerous material, handle carefully, most people should stay out. That reading is not wrong, but it skips the detail the Gemara actually dwells on, which is that all four were qualified. Nobody wandered in. These were among the greatest of their generation, and three of them were damaged anyway.\n\nSo what distinguished Rabbi Akiva? The Gemara does not say he was smarter or that he knew more. It says he entered in peace and left in peace, which is a statement about the state he arrived in rather than the equipment he brought.\n\nRav Kook reads the four outcomes as four relationships to truth that is larger than you. Ben Azzai could not bear to return to ordinary life afterward. Ben Zoma could not integrate what he saw with what he already held. Acher concluded that if this is what is up there, the system below is not binding. Only Rabbi Akiva could hold something vast without either being consumed by it or using it as a reason to discard everything else.\n\nWhich means the warning in the story is not really about mysticism. It is about what happens to a person who encounters something true and bigger than their previous frame. Most of us will meet that in much smaller doses, and the same four responses are available every time.",
    sourceWork: "Chagigah", sourceRef: "14b",
    tags: ["daf-yomi", "machshava", "mussar"],
  },
  {
    author: "seferdiagrams", type: "IMAGE", ago: 6.2, hearts: 341,
    title: "The six sedarim, on one page",
    body: "New learners ask where a masechta 'lives' all the time. This is the map we hand out on day one. The mnemonic at the bottom is from Shabbos 31a. Reish Lakish reads each word of the pasuk in Yeshayahu as a hint to one seder, in order.",
    imageUrl: "/diagrams/sedarim.svg", imageAlt: "Chart of the six orders of the Mishnah with masechta counts",
    tags: ["mishnah-yomi", "beginner-friendly", "jewish-history"],
  },
  {
    author: "seferdiagrams", type: "IMAGE", ago: 11.4, hearts: 502,
    title: "What you're actually looking at when you open a daf",
    body: "Gemara in the middle, Rashi toward the binding, Tosafos on the outside. Once you know that the layout is the same in almost every printing, 'Berachos 7b' becomes a real address that anyone in the world can find.",
    imageUrl: "/diagrams/daf-anatomy.svg", imageAlt: "Diagram of the standard Vilna page layout",
    tags: ["daf-yomi", "beginner-friendly"],
  },
  {
    author: "chavrusaquiz", type: "QUIZ", ago: 1.3, hearts: 128,
    quiz: {
      question: "How many masechtos are there in the Mishnah?",
      choices: ["37", "63", "60", "54"],
      answerIndex: 1,
      explanation: "63, spread across the six sedarim. The Bavli has Gemara on 37 of them, which is why the two numbers get mixed up so often.",
    },
    tags: ["mishnah-yomi", "beginner-friendly"],
  },
  {
    author: "chavrusaquiz", type: "QUIZ", ago: 2.6, hearts: 96,
    quiz: {
      question: "Which masechta has the most dapim in the Bavli?",
      choices: ["Shabbos", "Bava Basra", "Yevamos", "Chullin"],
      answerIndex: 1,
      explanation: "Bava Basra, at 176 dapim. Shabbos is second at 157. A full Daf Yomi cycle is 2,711 dapim and takes about seven and a half years.",
    },
    tags: ["daf-yomi"],
  },
  {
    author: "chavrusaquiz", type: "QUIZ", ago: 4.1, hearts: 71,
    quiz: {
      question: "Why does every masechta begin at daf 2 instead of daf 1?",
      choices: [
        "Daf 1 was lost in the Vilna printing",
        "The title page counts as daf 1",
        "A person should always remember they have not yet begun",
        "Daf 1 is reserved for the Yerushalmi",
      ],
      answerIndex: 2,
      explanation: "The reason usually given is the one in choice 3: no matter how much you have learned, you never get to say you finished page one. Practically, it also follows the printers' convention of not numbering the title leaf.",
    },
    tags: ["daf-yomi", "beginner-friendly", "mussar"],
  },
  {
    author: "maggid", type: "TEXT", ago: 3.4, hearts: 220,
    title: "The Mishnah opens with a question",
    body: "Look at the very first words of Shas: מאימתי קורין את שמע בערבית, from when do we read Shema at night?\n\nNot a statement. Not a principle. A question, and specifically a question about timing, asked from the middle of a practice that everyone was already doing.\n\nRav Chaim Volozhiner points out how much that sets the tone. The Mishnah does not introduce itself, does not define its terms, does not tell you what Shema is. It assumes you are already standing inside the room and only need to know when.",
    sourceWork: "Berakhot", sourceRef: "1:1",
    tags: ["mishnah-yomi", "machshava", "tefillah"],
  },
  {
    author: "dstern", type: "TEXT", ago: 2.2, hearts: 412,
    body: "Five years in and I still don't know what to do when the Gemara says 'תיקו'.\n\nThe question just... stops. No answer. And we move on to the next line like nothing happened.\n\nMy chavrusa says that's the point. The Gemara is comfortable leaving something open, and I'm the one who isn't. Took me a long time to hear that as a compliment to the Gemara rather than an insult to me.",
    tags: ["daf-yomi", "beginner-friendly", "machshava"],
  },
  {
    author: "bmlive", type: "VIDEO", ago: 5.1, hearts: 189,
    title: "How to learn a Tosafos without drowning",
    body: "Forty minutes on the structure every Tosafos follows: the question on Rashi, the alternative, and the return. Once you see the skeleton it stops being a wall of text.",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    tags: ["daf-yomi", "beginner-friendly"],
  },
  {
    author: "mkatz", type: "TEXT", ago: 1.9, hearts: 158,
    title: "My eighth graders asked a better question than I did",
    body: "We were on the mishnah about returning a lost object. One of them asked: if I have to return it, and he has to give up hope of getting it back before it becomes mine, then isn't the halacha rewarding the person who gives up faster?\n\nI didn't have an answer. We spent the rest of the period on it. Best forty minutes of the week.",
    sourceWork: "Bava Metzia", sourceRef: "2:1",
    tags: ["mishnah-yomi", "family", "chesed"],
  },
  {
    author: "halachadaily", type: "TEXT", ago: 0.9, hearts: 97,
    title: "Washing before bread when there's no towel",
    body: "Common shailah at kiddushim. The netilah requires drying before you eat, because the halacha treats eating with wet hands as an issue in its own right.\n\nIf there is genuinely nothing to dry with, poskim discuss waving the hands until they're dry, or using a clean garment. But this is exactly the kind of case where you ask your own rav rather than a feed. Including this one.",
    sourceWork: "Orach Chaim", sourceRef: "158",
    tags: ["halacha", "kashrus"],
  },
  {
    author: "shirabloom", type: "TEXT", ago: 7.3, hearts: 143,
    title: "Chana's tefillah is the source for almost everything",
    body: "Berachos 31a learns an astonishing amount of hilchos tefillah out of a few pesukim in Shmuel Aleph: that you daven with your lips moving but without sound, that you have to have kavanah, that you don't daven drunk.\n\nOne woman, in real distress, davening in a way nobody around her recognized as davening, including the Kohen Gadol, who assumed she was drunk. And that became the model.",
    sourceWork: "Berakhot", sourceRef: "31a",
    tags: ["tefillah", "nach-yomi", "machshava"],
  },
  {
    author: "parshaperspectives", type: "TEXT", ago: 9.1, hearts: 265,
    title: "Four voices on teshuvah, one page",
    body: "Our standing format: we send the same question to four batei midrash and print all four answers without picking a winner.\n\nThis week's question was whether teshuvah changes the past or only the future. Two said only the future, one said the past is reinterpreted, and one refused the question and said it changes the person, which makes the distinction meaningless. We printed all four.",
    tags: ["machshava", "mussar"],
  },
  {
    author: "yosefadler", type: "TEXT", ago: 0.4, hearts: 64,
    body: "Missed the daf three days running because of a work deadline. Caught up all three this morning before shacharis.\n\nNobody is checking. That's the part nobody tells you about Daf Yomi. The whole thing runs on the fact that you'd know.",
    tags: ["daf-yomi", "mussar"],
  },
  {
    author: "maggid", type: "TEXT", ago: 13.6, hearts: 388,
    title: "Hillel's one-liner is harder than it looks",
    body: "דעלך סני לחברך לא תעביד, what is hateful to you, do not do to your fellow. That's the whole Torah, Hillel tells the ger, and the rest is commentary. Go learn.\n\nPeople quote the first half and stop. The last two words are the actual instruction. Hillel did not say the commentary is optional. He said the principle is the doorway, and then sent him to learn.",
    sourceWork: "Shabbat", sourceRef: "31a",
    tags: ["machshava", "mussar", "beginner-friendly", "chesed"],
  },
  {
    author: "bmlive", type: "VIDEO", ago: 8.4, hearts: 154,
    title: "The Rambam's ladder of tzedakah, explained",
    body: "Eight levels, from the reluctant gift to the partnership that ends the need for tzedakah entirely. Twenty-two minutes.",
    videoUrl: "https://www.youtube.com/watch?v=YE7VzlLtp-4",
    tags: ["chesed", "halacha", "mussar"],
  },
  {
    author: "seferdiagrams", type: "IMAGE", ago: 16.2, hearts: 276,
    title: "Beis Shammai and Beis Hillel on the Chanukah licht",
    body: "Worth having around before Kislev. The machlokes on Shabbos 21b is not really about candles. It's about whether you model the thing that is ending or the thing that is growing.",
    imageUrl: "/diagrams/chanukah-machlokes.svg", imageAlt: "Bar chart comparing Beis Shammai and Beis Hillel candle counts across the nights of Chanukah",
    sourceWork: "Shabbat", sourceRef: "21b",
    tags: ["chanukah", "daf-yomi", "halacha"],
  },
  {
    author: "mishnahproject", type: "TEXT", ago: 3.8, hearts: 119,
    title: "Why Avos sits in Nezikin",
    body: "Readers ask this constantly. Avos has no halachos in it, so why is it filed with damages and courts?\n\nThe classic answer: Nezikin is the seder about judges, and Avos opens by tracing the mesorah from Sinai through to the men who sat on those courts. It is the credentials page for everyone ruling in the rest of the seder.",
    sourceWork: "Avot", sourceRef: "1:1",
    tags: ["mishnah-yomi", "jewish-history", "machshava"],
  },
  {
    author: "chavrusaquiz", type: "QUIZ", ago: 6.7, hearts: 88,
    quiz: {
      question: "The Mishnah in Avos says the world stands on three things. Which three?",
      choices: [
        "Torah, avodah, and gemilus chasadim",
        "Torah, tefillah, and teshuvah",
        "Emunah, Torah, and Eretz Yisrael",
        "Din, emes, and shalom",
      ],
      answerIndex: 0,
      explanation: "Shimon HaTzaddik, Avos 1:2. Choice 4 is also a real mishnah. Rabban Shimon ben Gamliel in Avos 1:18 says the world endures on din, emes and shalom. Two different mishnayos, two different lists.",
    },
    sourceWork: "Avot", sourceRef: "1:2",
    tags: ["mishnah-yomi", "mussar", "beginner-friendly"],
  },
  {
    author: "dstern", type: "TEXT", ago: 11.1, hearts: 301,
    title: "Nobody warned me about the Aramaic",
    body: "I spent my first year assuming I was bad at Gemara. I was actually just bad at Aramaic, which is a different and much more fixable problem.\n\nIf you're starting: get a list of the fifty most common Aramaic words in Shas and learn them cold. מאי, אלא, תא שמע, קא משמע לן. It is maybe two weeks of work and it changes everything.",
    tags: ["beginner-friendly", "hebrew-language", "daf-yomi"],
  },
  {
    author: "halachadaily", type: "TEXT", ago: 14.8, hearts: 76,
    title: "Bishul akum and the modern kitchen",
    body: "The classic categories assume a fire and a pot. Induction burners, sous vide and app-controlled ovens raise questions the Shulchan Aruch was not asked.\n\nThere are teshuvos on all three. There is no consensus on any of them. Posting this mostly so people know the question exists, not to answer it.",
    sourceWork: "Yoreh Deah", sourceRef: "113",
    tags: ["halacha", "kashrus"],
  },
  {
    author: "shirabloom", type: "TEXT", ago: 5.6, hearts: 132,
    title: "Shaul is the most tragic figure in Nach and nobody talks about it",
    body: "He didn't want the job. He hid among the baggage at his own coronation. Every failure the navi records is him being too lenient, too worried about what the people thought, too slow to act.\n\nAnd the Gemara in Yoma 22b says his one sin was counted against him where David's many were not, because Shaul had no prior sins, and a clean record makes every mark visible.",
    sourceWork: "Yoma", sourceRef: "22b",
    tags: ["nach-yomi", "jewish-history", "machshava"],
  },
  {
    author: "mkatz", type: "TEXT", ago: 19.3, hearts: 88,
    title: "Teaching Rashi to kids who can't read Rashi script yet",
    body: "The trick that finally worked: I give them the Rashi in block letters for a month, and the same Rashi in Rashi script on the facing page. No pressure to use the second column. By week three most of them are reading it without noticing they switched.",
    tags: ["family", "chumash", "hebrew-language", "beginner-friendly"],
  },
  {
    author: "maggid", type: "TEXT", ago: 22.5, hearts: 174,
    title: "On learning something you will never use",
    body: "Most of Seder Kodashim describes a Beis HaMikdash that has not stood for nineteen hundred years. Sedarim Zeraim and Taharos describe obligations that, for most of us, will never come up.\n\nThe standard answer is that learning it is itself the mitzvah. I want to offer a smaller one: it is good for a person to spend regular time thinking carefully about something that gains him nothing.",
    tags: ["machshava", "mussar"],
  },
  {
    author: "bmlive", type: "VIDEO", ago: 17.7, hearts: 121,
    title: "Introduction to the Mesorah: from Sinai to the Mishnah",
    body: "Where the Oral Torah came from and how it got written down. Good for someone who's just started and wants the map before the details.",
    videoUrl: "https://www.youtube.com/watch?v=lTTajzrSkCw",
    tags: ["jewish-history", "beginner-friendly", "mishnah-yomi"],
  },
  {
    author: "yosefadler", type: "TEXT", ago: 26.1, hearts: 209,
    title: "Made my first siyum last month",
    body: "Not a whole masechta. One perek. My rav told me to make a siyum on it anyway.\n\nI thought it was a consolation prize. It wasn't. Saying הדרן on something you actually finished does something that finishing it quietly doesn't.",
    tags: ["daf-yomi", "mussar", "beginner-friendly"],
  },
  {
    author: "seferdiagrams", type: "IMAGE", ago: 24.4, hearts: 198,
    title: "The four minim, and why all four",
    body: "The midrash reads the four species as four kinds of Jew, where taste stands for Torah, smell for maasim tovim. The whole force of it is in the binding: you don't get to drop the fourth one.",
    imageUrl: "/diagrams/arba-minim.svg", imageAlt: "Chart of the four species showing taste and smell for each",
    tags: ["sukkot", "machshava", "halacha"],
  },
  {
    author: "parshaperspectives", type: "TEXT", ago: 29.2, hearts: 96,
    title: "A note on how we pick our four",
    body: "People ask whether we screen for hashkafa. We don't, beyond checking that the piece is actually learning and not politics wearing a kippah. The four sources rotate, and a given week's four may disagree sharply. That's the format working, not failing.",
    tags: ["machshava"],
  },
];

/** Posts wired to whatever today happens to be when you run the seed. */
export function calendarContent(cal: DailyLearning): SeedPost[] {
  const daf = cal.dafYomi;
  const mishna = cal.mishnaYomi;
  const posts: SeedPost[] = [];

  posts.push({
    author: "shascompanion", type: "TEXT", ago: 0.15, hearts: 87,
    title: `${daf.display}, the shape of the daf`,
    body: `Today's daf in one breath before you sit down with it.\n\nRead the amud straight through once without stopping at anything you don't understand. Then go back. The second pass is where the daf actually opens up, and the first pass is what makes the second one possible.\n\nIf you're behind, today is a fine day to just do today. The cycle does not require you to have done yesterday.`,
    sourceWork: daf.work, sourceRef: daf.ref,
    tags: ["daf-yomi"],
  });

  posts.push({
    author: "yosefadler", type: "TEXT", ago: 0.07, hearts: 23,
    body: `Anyone else have to read the first line of ${daf.display} four times before it landed? Posting in case it wasn't just me.`,
    sourceWork: daf.work, sourceRef: daf.ref,
    tags: ["daf-yomi", "beginner-friendly"],
  });

  posts.push({
    author: "chavrusaquiz", type: "QUIZ", ago: 0.3, hearts: 54,
    quiz: {
      question: `Daf Yomi is on ${daf.work} today. Which seder is ${daf.work} in?`,
      choices: ["Zeraim", "Moed", "Nashim", "Look it up, then come back"],
      answerIndex: 3,
      explanation: `This one's on purpose. Knowing where a masechta sits in Shas changes how you read it. ${daf.work} is today's daf, so find its seder before you learn it, and the sugya will have a context it didn't have a minute ago.`,
    },
    sourceWork: daf.work, sourceRef: daf.ref,
    tags: ["daf-yomi", "beginner-friendly"],
  });

  if (mishna) {
    posts.push({
      author: "mishnahproject", type: "TEXT", ago: 0.22, hearts: 61,
      title: `Mishnah Yomi: ${mishna.display}`,
      body: `Two mishnayos a day, and the whole Mishnah in about six years. No Aramaic, no Tosafos, no prerequisites.\n\nToday: ${mishna.display}. If you have never learned Mishnah before, this is the single easiest place in all of Torah to start a daily seder, because the unit is small enough that a bad day costs you four minutes instead of forty.`,
      sourceWork: mishna.work, sourceRef: mishna.ref,
      tags: ["mishnah-yomi", "beginner-friendly"],
    });

    posts.push({
      author: "mkatz", type: "TEXT", ago: 0.5, hearts: 34,
      body: `Mishnah Yomi on the train this morning, ${mishna.display}. Six stops, two mishnayos, done before I got to work. This is the only seder I've ever kept for more than a year and I think it's entirely because of how small it is.`,
      sourceWork: mishna.work, sourceRef: mishna.ref,
      tags: ["mishnah-yomi", "mussar"],
    });
  }

  if (cal.parshaSlug && cal.parsha) {
    posts.push({
      author: "parshaperspectives", type: "TEXT", ago: 0.6, hearts: 142,
      title: `Parshas ${cal.parsha}: four voices`,
      body: `Our four batei midrash on this week's sedra. As always we print all four without picking a winner, and as always at least two of them disagree with each other.\n\nRead it before Shabbos if you can. The point of the format is to give you something to argue about at the table, not something to recite.`,
      tags: ["parsha", cal.parshaSlug],
    });

    posts.push({
      author: "maggid", type: "TEXT", ago: 0.35, hearts: 176,
      title: `A thought on ${cal.parsha}`,
      body: `Every week we send one short piece on the sedra, short enough to read standing up and long enough to be worth reading.\n\nThis week's is on ${cal.parsha}. The question we kept circling: what does the sedra assume you already know, and what does it take the trouble to spell out? The gap between those two is usually where the parsha is actually arguing with you.`,
      tags: ["parsha", cal.parshaSlug, "machshava"],
    });

    if (cal.parshaSlug === "haazinu") {
      posts.push({
        author: "seferdiagrams", type: "IMAGE", ago: 0.8, hearts: 214,
        title: "Ha'azinu is written differently from every other shirah",
        body: "Shiras HaYam is laid out like brickwork, with staggered gaps, half-brick over whole brick. Ha'azinu is two clean columns with a channel down the middle.\n\nThe Gemara in Megillah 16b discusses both layouts. A sefer Torah that gets this wrong is pasul, which is a strong hint that the shape is carrying meaning and not just decoration.",
        imageUrl: "/diagrams/shiras-haazinu.svg",
        imageAlt: "Diagram of the two-column layout of Shiras Haazinu in a sefer Torah",
        sourceWork: "Megillah", sourceRef: "16b",
        tags: ["parsha", "haazinu", "chumash"],
      });
    }
  }

  for (const hol of cal.upcomingHolidays.slice(0, 2)) {
    posts.push({
      author: "halachadaily", type: "TEXT", ago: 0.45, hearts: 118,
      title: `${hol.label}: the things people ask at the last minute`,
      body: `${hol.daysAway === 0 ? "Today." : `${hol.daysAway} day${hol.daysAway === 1 ? "" : "s"} out.`} Every year the same questions come in the day before, and every year the honest answer to most of them is that it depends on your minhag and your rav.\n\nWhat we can say generally: read the halachos a week early, not the night before. Almost every erev-Yom-Tov shailah we get would have been a calm question with seven days of runway.`,
      tags: ["halacha", hol.slug],
    });

    if (hol.slug === "yom-kippur") {
      posts.push({
        author: "seferdiagrams", type: "IMAGE", ago: 0.55, hearts: 287,
        title: "The Avodah, in order",
        body: "We read the seder ha'avodah in Mussaf every year and most of us have no picture of what is being described. Here is the sequence, following the mishnayos in Yoma.\n\nThe ketores in the Kodesh HaKodashim is the center of it: one moment, one day a year, one person.",
        imageUrl: "/diagrams/yom-kippur-avodah.svg",
        imageAlt: "Flow diagram of the Kohen Gadol's Yom Kippur service in order",
        sourceWork: "Yoma", sourceRef: "5:1",
        tags: ["yom-kippur", "mishnah-yomi", "tefillah"],
      });
      posts.push({
        author: "chavrusaquiz", type: "QUIZ", ago: 0.65, hearts: 103,
        quiz: {
          question: "How many inuyim (afflictions) apply on Yom Kippur?",
          choices: ["Three", "Four", "Five", "Seven"],
          answerIndex: 2,
          explanation: "Five, listed in the mishnah in Yoma 8:1: eating and drinking, washing, anointing, wearing leather shoes, and marital relations. Eating and drinking count as one.",
        },
        sourceWork: "Yoma", sourceRef: "8:1",
        tags: ["yom-kippur", "halacha", "mishnah-yomi"],
      });
      posts.push({
        author: "maggid", type: "TEXT", ago: 0.75, hearts: 356,
        title: "Yom Kippur does not work by itself",
        body: "The last mishnah in Yoma is blunt about it: for aveiros between a person and Hashem, Yom Kippur atones. For aveiros between a person and his fellow, Yom Kippur does not atone until he appeases his fellow.\n\nNo amount of davening substitutes for the phone call. The mishnah puts that at the very end of the masechta, as the last word on the subject.",
        sourceWork: "Yoma", sourceRef: "8:9",
        tags: ["yom-kippur", "mussar", "machshava", "chesed"],
      });
    }

    if (hol.slug === "sukkot") {
      posts.push({
        author: "bmlive", type: "VIDEO", ago: 0.95, hearts: 134,
        title: "Building a kosher sukkah: the three walls rule",
        body: "Practical walkthrough before Yom Tov. Covers the minimum walls, schach materials, and the mistakes we see most often on the third wall.",
        videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        tags: ["sukkot", "halacha"],
      });
    }
  }

  return posts;
}

export const COMMENTS: { postMatch: string; author: string; body: string; ago: number }[] = [
  { postMatch: "תיקו", author: "yosefadler", body: "The Ba'al HaTurim style acronym on תיקו is that Tishbi (Eliyahu) will resolve the questions. Whether that's the real meaning or a later derush, it says something that the tradition needed to put an ending on it.", ago: 1.8 },
  { postMatch: "תיקו", author: "mkatz", body: "I teach it as: the Gemara is telling you the question is good, not that the answer is missing.", ago: 1.5 },
  { postMatch: "Aramaic", author: "mkatz", body: "Seconding this so hard. I'd add איבעית אימא to the list. Once you know it means 'if you want, say instead', half the flow problems disappear.", ago: 10.2 },
  { postMatch: "Aramaic", author: "demo", body: "Where do you get a list like that? Is there one you'd recommend?", ago: 9.8 },
  { postMatch: "Aramaic", author: "dstern", body: "Most Gemara vocabulary primers have one in the back. Ours is on the way, and I'll post it here when it's ready.", ago: 9.4 },
  { postMatch: "eighth graders", author: "maggid", body: "That's a real question and it has a real answer in the sugya about yiush shelo mida'as. Please tell them a stranger on the internet was impressed.", ago: 1.6 },
  { postMatch: "Avos sits in Nezikin", author: "shirabloom", body: "The Rambam's introduction to Avos makes basically this point at length. Worth reading alongside.", ago: 3.2 },
  { postMatch: "Shaul", author: "dstern", body: "This reframed the whole sefer for me. Reading it again tonight.", ago: 5.1 },
  { postMatch: "first siyum", author: "shirabloom", body: "Mazal tov. One perek is one perek more than most people finish.", ago: 25.4 },
  { postMatch: "first siyum", author: "maggid", body: "הדרן עלך. Onward.", ago: 25.1 },
  { postMatch: "never use", author: "dstern", body: "This is the answer I've been looking for for about three years and couldn't articulate.", ago: 21.9 },
];
