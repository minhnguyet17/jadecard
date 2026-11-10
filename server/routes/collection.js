// ======================================================================
// API BỘ SƯU TẬP THEO TÀI KHOẢN (F13, F14, F27)
//   GET    /api/collection                 bộ sưu tập + cài đặt của tôi
//   POST   /api/collection                 thêm thẻ (trùng thẻ + biến thể + tình trạng thì cộng số lượng)
//   PATCH  /api/collection/:id             sửa số lượng / tình trạng
//   DELETE /api/collection/:id             xóa
//   POST   /api/collection/merge           gộp bộ sưu tập trên trình duyệt vào tài khoản (lần đầu đăng nhập)
//   PUT    /api/collection/settings        công khai / riêng tư, hiện / ẩn tổng giá trị
// Chưa đăng nhập thì bộ sưu tập nằm trong localStorage (js/collection-store.js), không gọi các API này.
// ======================================================================
const express = require("express");
const { db, transaction, nowIso } = require("../db");
const { ApiError } = require("../errors");
const { requireLogin } = require("../session");
const cards = require("../cards");
const v = require("../validate");

const router = express.Router();
router.use("/collection", requireLogin);

function itemView(row) {
  return {
    id: row.id,
    list: row.list,
    cardId: row.card_id,
    name: row.card_name,
    setName: row.set_name,
    number: row.card_number,
    image: row.image,
    variant: row.variant,
    variantLabel: cards.VARIANTS[row.variant],
    condition: row.condition || null,
    quantity: row.quantity,
    savedPrice: row.saved_price,
    savedAt: row.saved_at,
  };
}

function getSettings(userId) {
  const row = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId);
  return { isPublic: row ? Boolean(row.collection_public) : true, showValue: row ? Boolean(row.show_value) : false };
}

function listItems(userId) {
  return db
    .prepare("SELECT * FROM collection_items WHERE user_id = ? ORDER BY saved_at DESC, id DESC")
    .all(userId)
    .map(itemView);
}

// Kiểm tra một thẻ gửi lên (dùng cho thêm mới và gộp)
function cleanItem(input) {
  const list = input.list === "want" ? "want" : "have";
  const card = cards.cleanCard(input.card || input);
  const variant = cards.checkVariant(input.variant);
  const condition = list === "have" ? cards.checkCondition(input.condition) : "";
  const quantity = Number(input.quantity || 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new ApiError(400, "Số lượng từ 1 đến 999.", { field: "quantity" });
  const price = Number(input.savedPrice);
  const savedPrice = Number.isInteger(price) && price > 0 ? price : null; // không có giá thì để trống, không tính là 0đ
  return { list, card, variant, condition, quantity, savedPrice };
}

// Thêm hoặc cộng dồn số lượng (UNIQUE user + list + thẻ + biến thể + tình trạng)
function upsertItem(userId, item, savedAt) {
  db.prepare(
    `INSERT INTO collection_items (user_id, list, card_id, card_name, set_name, card_number, image, variant, condition, quantity, saved_price, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, list, card_id, variant, condition)
     DO UPDATE SET quantity = MIN(999, quantity + excluded.quantity)`
  ).run(userId, item.list, item.card.cardId, item.card.name, item.card.setName, item.card.number, item.card.image,
    item.variant, item.condition, item.list === "want" ? 1 : item.quantity, item.savedPrice, savedAt || nowIso());
}

router.get("/collection", (req, res) => {
  res.json({ items: listItems(req.user.id), settings: getSettings(req.user.id) });
});

router.post("/collection", (req, res) => {
  upsertItem(req.user.id, cleanItem(req.body));
  res.status(201).json({ items: listItems(req.user.id) });
});

function findOwnItem(id, user) {
  const itemId = v.toPositiveInt(id);
  const row = itemId && db.prepare("SELECT * FROM collection_items WHERE id = ?").get(itemId);
  if (!row) throw new ApiError(404, "Không tìm thấy thẻ này trong bộ sưu tập.");
  if (row.user_id !== user.id) throw new ApiError(403, "Chỉ chủ bộ sưu tập được sửa.");
  return row;
}

router.patch("/collection/:id", (req, res) => {
  const row = findOwnItem(req.params.id, req.user);
  const quantity = Number(req.body.quantity ?? row.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new ApiError(400, "Số lượng từ 1 đến 999.", { field: "quantity" });
  const condition = row.list === "have" && req.body.condition ? cards.checkCondition(req.body.condition) : row.condition;
  try {
    db.prepare("UPDATE collection_items SET quantity = ?, condition = ? WHERE id = ?").run(quantity, condition, row.id);
  } catch (error) {
    throw new ApiError(409, "Đã có dòng cùng thẻ, biến thể và tình trạng này. Hãy sửa số lượng ở dòng đó.");
  }
  res.json({ items: listItems(req.user.id) });
});

router.delete("/collection/:id", (req, res) => {
  const row = findOwnItem(req.params.id, req.user);
  db.prepare("DELETE FROM collection_items WHERE id = ?").run(row.id);
  res.json({ items: listItems(req.user.id) });
});

// Gộp bộ sưu tập trên trình duyệt vào tài khoản: thẻ trùng thì cộng số lượng (PB22)
router.post("/collection/merge", (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 500) : [];
  let merged = 0;
  transaction(() => {
    for (const input of items) {
      try {
        upsertItem(req.user.id, cleanItem(input), typeof input.savedAt === "string" ? input.savedAt.slice(0, 30) : null);
        merged++;
      } catch (error) {
        // bỏ qua dòng hỏng, gộp các dòng còn lại
      }
    }
  });
  res.json({ merged, items: listItems(req.user.id) });
});

router.put("/collection/settings", (req, res) => {
  const isPublic = req.body.isPublic !== false;
  const showValue = req.body.showValue === true;
  db.prepare(
    `INSERT INTO user_settings (user_id, collection_public, show_value) VALUES (?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET collection_public = excluded.collection_public, show_value = excluded.show_value`
  ).run(req.user.id, isPublic ? 1 : 0, showValue ? 1 : 0);
  res.json({ settings: getSettings(req.user.id) });
});

module.exports = router;
module.exports.getSettings = getSettings;
module.exports.listItems = listItems;
