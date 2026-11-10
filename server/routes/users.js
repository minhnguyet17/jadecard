// ======================================================================
// API HỒ SƠ THÀNH VIÊN
//   GET /api/users/:name              hồ sơ công khai (F41): chức vụ, tiến độ, topic gần đây,
//                                     tin ký gửi đang bán, điểm đánh giá người bán (F56)
//   GET /api/users/:name/collection   tab Bộ sưu tập (F27), theo cài đặt riêng tư của chủ hồ sơ
//   GET /api/users/:name/card         thẻ xem nhanh khi rê chuột vào avatar / tên (F54)
// Không bao giờ trả về email (F41).
// ======================================================================
const express = require("express");
const { db } = require("../db");
const { ApiError } = require("../errors");
const { publicUser, authorColumns } = require("../users");
const { RANKS } = require("../ranks");
const c = require("../consign");
const { reviewView } = require("./listings");
const { getSettings, listItems } = require("./collection");

const router = express.Router();

function findMember(name) {
  const user = db.prepare("SELECT * FROM users WHERE display_name = ? AND email_verified = 1").get(String(name).normalize("NFC"));
  if (!user) throw new ApiError(404, "Không tìm thấy thành viên này.");
  return user;
}

const isStaff = (user) => Boolean(user && (user.role === "mod" || user.role === "admin"));

router.get("/users/:name", (req, res) => {
  const user = findMember(req.params.name);

  const recentThreads = db
    .prepare(
      `SELECT t.id, t.title, t.reply_count, t.created_at, f.code AS forum_code, f.name AS forum_name,
              p.name AS prefix_name, p.color AS prefix_color
       FROM threads t JOIN forums f ON f.id = t.forum_id LEFT JOIN prefixes p ON p.id = t.prefix_id
       WHERE t.user_id = ? AND t.hidden = 0
       ORDER BY t.created_at DESC LIMIT 10`
    )
    .all(user.id)
    .map((t) => ({
      id: t.id,
      title: t.title,
      replyCount: t.reply_count,
      createdAt: t.created_at,
      forum: { code: t.forum_code, name: t.forum_name },
      prefix: t.prefix_name ? { name: t.prefix_name, color: t.prefix_color } : null,
    }));

  const listings = db
    .prepare(c.LISTING_SELECT + " WHERE li.seller_id = ? AND li.status IN ('active', 'held', 'reserved') ORDER BY li.verified_at DESC")
    .all(user.id)
    .map(c.listingCard);

  const reviews = db
    .prepare(
      `SELECT r.id, r.stars, r.comment, r.hidden, r.created_at, l.card_name, ${authorColumns("b")}
       FROM seller_reviews r JOIN users b ON b.id = r.buyer_id JOIN listings l ON l.id = r.listing_id
       WHERE r.seller_id = ? ${isStaff(req.user) ? "" : "AND r.hidden = 0"} ORDER BY r.id DESC LIMIT 10`
    )
    .all(user.id)
    .map(reviewView);

  res.json({
    user: { ...publicUser(user), banned: Boolean(user.banned) },
    sellerStats: c.sellerStats(user.id),
    recentThreads,
    listings,
    reviews,
    isMe: Boolean(req.user && req.user.id === user.id),
    canModerate: isStaff(req.user) && user.role === "member",
    viewerIsStaff: isStaff(req.user),
    ranks: RANKS, // thang 7 chức vụ để vẽ trên hồ sơ
  });
});

// Thẻ nào của bộ sưu tập đang được chủ hồ sơ ký gửi → nhãn "Đang bán" + link (F27)
function onSaleMap(userId) {
  const map = {};
  const rows = db
    .prepare("SELECT id, card_id, variant FROM listings WHERE seller_id = ? AND status IN ('active', 'held', 'reserved')")
    .all(userId);
  for (const row of rows) map[row.card_id + "|" + row.variant] = row.id;
  return map;
}

router.get("/users/:name/collection", (req, res) => {
  const user = findMember(req.params.name);
  const isMe = Boolean(req.user && req.user.id === user.id);
  const settings = getSettings(user.id);

  if (!settings.isPublic && !isMe) {
    return res.json({ hidden: true, settings: { isPublic: false } });
  }

  const items = listItems(user.id);
  const sale = onSaleMap(user.id);
  for (const item of items) item.onSaleListingId = item.list === "have" ? sale[item.cardId + "|" + item.variant] || null : null;

  // Tổng giá trị (giá lúc lưu × số lượng) chỉ hiện khi chủ bật, hoặc chính chủ xem
  let totalValue = null;
  if (settings.showValue || isMe) {
    totalValue = items
      .filter((item) => item.list === "have" && item.savedPrice)
      .reduce((sum, item) => sum + item.savedPrice * item.quantity, 0);
  }

  res.json({ hidden: false, items, totalValue, settings, isMe });
});

// F54: chỉ những gì cần cho thẻ xem nhanh
router.get("/users/:name/card", (req, res) => {
  const user = findMember(req.params.name);
  const settings = getSettings(user.id);
  const count = settings.isPublic
    ? db.prepare("SELECT COALESCE(SUM(quantity), 0) AS n FROM collection_items WHERE user_id = ? AND list = 'have'").get(user.id).n
    : null; // bộ sưu tập riêng tư thì không hiện số thẻ
  const stats = c.sellerStats(user.id);
  res.json({ user: publicUser(user), collectionCount: count, ratingAvg: stats.ratingAvg, ratingCount: stats.ratingCount });
});

module.exports = router;
