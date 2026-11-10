// ======================================================================
// API HASHTAG THẺ / BỘ THẺ
//   GET  /api/tags/search?q=...   gợi ý khi gắn hashtag: hàng shop đang bán + hashtag đã có
//   POST /api/tags                { kind: "card" | "set", ref: "sv08-238" } → tạo (tra TCGdex) hoặc lấy hashtag
//   GET  /api/tags/:slug          trang hashtag: thông tin thẻ / bộ + các topic nhắc tới (tag.html)
// ======================================================================
const express = require("express");
const { db } = require("../db");
const { ApiError } = require("../errors");
const { requireLogin } = require("../session");
const { authorColumns, authorFromRow } = require("../users");
const v = require("../validate");
const t = require("../tags");

const router = express.Router();
const PAGE_SIZE = 20;

router.get("/tags/search", (req, res) => {
  const query = String(req.query.q || "").trim().slice(0, 60);
  if (query.length < 2) return res.json({ shop: [], saved: [] });
  res.json({ shop: t.shopSuggestions(query), saved: t.searchSavedTags(query) });
});

router.post("/tags", requireLogin, async (req, res) => {
  const tag = await t.findOrCreateTag(req.body.kind, String(req.body.ref || ""));
  res.status(201).json({ tag: t.tagView(tag) });
});

router.get("/tags/:slug", (req, res) => {
  const tag = t.findTagBySlug(req.params.slug);
  if (!tag) throw new ApiError(404, "Chưa có bài viết nào gắn hashtag này.");
  const page = v.toPositiveInt(req.query.page, 1);

  // Topic có ít nhất một bài (chưa bị ẩn) nhắc tới hashtag, mới nhất trước
  const from = `FROM threads th
    WHERE th.hidden = 0 AND EXISTS (
      SELECT 1 FROM post_tags pt JOIN posts po ON po.id = pt.post_id
      WHERE pt.tag_id = ? AND po.thread_id = th.id AND po.hidden = 0)`;
  const total = db.prepare("SELECT COUNT(*) AS n " + from).get(tag.id).n;
  const rows = db
    .prepare(
      `SELECT th.id, th.title, th.reply_count, th.view_count, th.last_post_at, th.created_at,
              f.code AS forum_code, f.name AS forum_name, p.name AS prefix_name, p.color AS prefix_color,
              ${authorColumns("a")},
              (SELECT pi.path FROM post_images pi JOIN posts po ON po.id = pi.post_id
               WHERE po.thread_id = th.id AND po.hidden = 0 ORDER BY pi.id LIMIT 1) AS cover
       FROM threads th
       JOIN forums f ON f.id = th.forum_id
       JOIN users a ON a.id = th.user_id
       LEFT JOIN prefixes p ON p.id = th.prefix_id
       WHERE th.id IN (SELECT th.id ${from})
       ORDER BY th.last_post_at DESC LIMIT ? OFFSET ?`
    )
    .all(tag.id, PAGE_SIZE, (page - 1) * PAGE_SIZE);

  res.json({
    tag: t.tagView(tag),
    listingStats: tag.kind === "card" ? t.listingStats([tag.ref]) : {},
    threads: rows.map((row) => ({
      id: row.id,
      title: row.title,
      forum: { code: row.forum_code, name: row.forum_name },
      prefix: row.prefix_name ? { name: row.prefix_name, color: row.prefix_color } : null,
      replyCount: row.reply_count,
      viewCount: row.view_count,
      lastPostAt: row.last_post_at,
      createdAt: row.created_at,
      cover: row.cover,
      author: authorFromRow(row),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
});

module.exports = router;
