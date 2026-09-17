import { db } from "./db";
import { fetchFeed, httpTextFetcher, type SourceKind, type TextFetcher } from "./sources";
import { importDailyTexts } from "./daily-import";

export type SyncResult = {
  source: string;
  created: number;
  updated: number;
  skipped: number;
  error?: string;
};

/** Newest first, and only a handful per run: a feed dump is not a feed. */
const MAX_ITEMS_PER_SYNC = 6;

/**
 * Imports one source's recent items as posts.
 *
 * Posts carry only the title, the publisher's own summary and a link. For a
 * YouTube item the link becomes an embed, which plays through YouTube and
 * counts as a view for the channel. Nothing is rehosted.
 */
export async function syncSource(
  sourceId: string,
  opts: { fetcher?: TextFetcher; now?: Date } = {}
): Promise<SyncResult> {
  const source = await db.source.findUnique({
    where: { id: sourceId },
    include: { account: { select: { id: true, handle: true } } },
  });
  if (!source) return { source: sourceId, created: 0, updated: 0, skipped: 0, error: "No such source" };

  const result: SyncResult = { source: source.slug, created: 0, updated: 0, skipped: 0 };

  if (!source.enabled) {
    result.skipped = 1;
    result.error = "disabled";
    return result;
  }

  // The built-in texts have their own importer.
  if (source.kind === "BUILTIN_TEXT") {
    const r = await importDailyTexts({ date: opts.now });
    await db.source.update({
      where: { id: source.id },
      data: { lastSyncedAt: new Date(), lastError: r.failed.length ? r.failed.join(", ") : null },
    });
    return { ...result, created: r.created, updated: r.updated, error: r.failed[0] };
  }

  if (!source.feedRef) {
    await db.source.update({ where: { id: source.id }, data: { lastError: "No feed configured" } });
    return { ...result, error: "No feed configured" };
  }

  const { items, error } = await fetchFeed(
    source.kind as SourceKind,
    source.feedRef,
    opts.fetcher ?? httpTextFetcher
  );

  if (error) {
    await db.source.update({ where: { id: source.id }, data: { lastError: error } });
    return { ...result, error };
  }

  const tagIds = (
    await db.postTag.findMany({
      where: { post: { authorId: source.accountId } },
      select: { tagId: true },
      distinct: ["tagId"],
    })
  ).map((t) => t.tagId);

  for (const item of items.slice(0, MAX_ITEMS_PER_SYNC)) {
    const externalId = `source:${source.slug}:${item.guid}`;
    const body = [item.summary].filter(Boolean).join("\n\n").slice(0, 1200);

    const data = {
      authorId: source.accountId,
      type: item.videoUrl ? "VIDEO" : "TEXT",
      title: item.title.slice(0, 200),
      body: body || null,
      videoUrl: item.videoUrl,
      sourceUrl: item.url || null,
      sourceName: source.name,
      origin: "IMPORT",
      externalId,
      ...(item.publishedAt ? { createdAt: item.publishedAt } : {}),
    };

    const existing = await db.post.findUnique({ where: { externalId }, select: { id: true } });
    if (existing) {
      // Don't move createdAt on an update: a re-sync should not resurface an
      // old item at the top of everyone's feed.
      const { createdAt, ...rest } = data;
      void createdAt;
      await db.post.update({ where: { id: existing.id }, data: rest });
      result.updated++;
      continue;
    }

    const post = await db.post.create({ data });
    if (tagIds.length) {
      await db.postTag.createMany({ data: tagIds.map((tagId) => ({ postId: post.id, tagId })) });
    }
    result.created++;
  }

  await db.source.update({
    where: { id: source.id },
    data: { lastSyncedAt: new Date(), lastError: null },
  });
  return result;
}

export async function syncAllSources(
  opts: { fetcher?: TextFetcher; now?: Date } = {}
): Promise<SyncResult[]> {
  const sources = await db.source.findMany({ where: { enabled: true }, select: { id: true } });
  const out: SyncResult[] = [];
  for (const s of sources) out.push(await syncSource(s.id, opts));
  return out;
}
