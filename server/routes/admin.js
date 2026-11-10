// ======================================================================
// API QUẢN TRỊ — chỉ Admin (chủ shop, kiêm nhân viên kiểm định)
//   GET  /api/admin/listings?view=pending|active|settle|all&q=KG-0042   danh sách tin
//   POST /api/admin/listings/:id/verify    kiểm định tại quầy (F44)
//   POST /api/admin/listings/:id/settle    tất toán: đã trả tiền cho người bán tại quầy (F49)
//   GET  /api/admin/orders?status=...      danh sách đơn (F20)
//   POST /api/admin/orders/:id/action      confirm | advance | cancel | paid
// Mod không có quyền ở đây (REQUIREMENTS mục 3: Mod chỉ giữ trật tự diễn đàn).
// ======================================================================
const express = require("express");
const { db, transaction, nowIso } = require("../db");
const { ApiError } = require("../errors");
const { requireRole } = require("../session");
const { uploadImages, checkImages, saveImages } = require("../uploads");
const cards = require("../cards");
const c = require("../consign");
const o = require("../orders");
const v = require("../validate");

const router = express.Router();
router.use("/admin", requireRole("admin")); // mọi API bên dưới /api/admin đều cần quyền Admin

// ---------- Danh sách tin cho Admin ----------
router.get("/admin/listings", (req, res) => {
  const views = {
    pending: "li.status = 'pending'",
    active: "li.status IN ('active', 'held', 'reserved')",
    // Chờ tất toán: đã bán và đơn hàng đã hoàn thành
    settle: "li.status = 'sold' AND EXISTS (SELECT 1 FROM orders od WHERE od.id = li.order_id AND od.status = 'completed')",
    all: "1 = 1",
  };
  const where = [views[req.query.view] || views.pending];
  const params = [];
  const searchId = c.parseListingCode(req.query.q);
  if (req.query.q) {
    where.push("li.id = ?");
    params.push(searchId || 0);
  }
  const rows = db.prepare(c.LISTING_SELECT + " WHERE " + where.join(" AND ") + " ORDER BY li.id DESC LIMIT 100").all(...params);
  const imagesOf = db.prepare("SELECT path, source FROM listing_images WHERE listing_id = ? ORDER BY id");

  res.json({
    listings: rows.map((row) => ({
      ...c.listingCard(row),
      description: row.description,
      askingPrice: row.asking_price,
      conditionDeclared: row.condition_declared,
      listPrice: row.list_price,
      finalPrice: row.final_price,
      commission: row.commission,
      payout: row.payout,
      verifyDeadline: row.verify_deadline,
      rejectReason: row.reject_reason,
      orderCode: row.order_id ? o.orderCode(row.order_id) : null,
      images: imagesOf.all(row.id),
    })),
    rules: c.RULES,
  });
});

// ---------- F44: Kiểm định tại quầy ----------
router.post("/admin/listings/:id/verify", uploadImages(4), (req, res) => {
  const row = c.findListing(req.params.id);
  if (row.status !== "pending") {
    throw new ApiError(400, `Tin ${c.listingCode(row.id)} đang "${c.STATUS_LABELS[row.status]}", không kiểm định được.`);
  }
  const now = nowIso();

  if (req.body.result === "reject") {
    const reason = v.cleanText(req.body.rejectReason, { field: "rejectReason", label: "lý do từ chối", max: 300 });
    db.prepare(
      "UPDATE listings SET status = 'rejected', reject_reason = ?, authentic = ?, verified_by = ?, verified_at = ? WHERE id = ?"
    ).run(reason, req.body.authentic === "0" ? 0 : null, req.user.id, now, row.id);
    return res.json({ ok: true, status: "rejected" });
  }

  // Đạt: thẻ thật, ghi tình trạng thực tế, giá niêm yết đã thống nhất, ít nhất 1 ảnh shop chụp
  if (req.body.authentic !== "1") throw new ApiError(400, "Thẻ nghi giả thì chọn Từ chối.", { field: "authentic" });
  const conditionVerified = cards.checkCondition(req.body.conditionVerified, "conditionVerified");
  const listPrice = cards.checkMoney(req.body.listPrice, { field: "listPrice", label: "Giá niêm yết", min: c.RULES.minPrice, max: c.RULES.maxPrice });
  const files = req.files || [];
  if (!files.length) throw new ApiError(400, "Cần ít nhất 1 ảnh chụp thẻ tại cửa hàng.", { field: "images" });
  const checkedImages = checkImages(files);

  transaction(() => {
    db.prepare(
      `UPDATE listings SET status = 'active', authentic = 1, condition_verified = ?, list_price = ?,
         verified_by = ?, verified_at = ?, list_expires_at = ? WHERE id = ?`
    ).run(conditionVerified, listPrice, req.user.id, now, nowIso(c.RULES.listingDays * c.DAY), row.id);
    const insertImage = db.prepare("INSERT INTO listing_images (listing_id, path, source) VALUES (?, ?, 'shop')");
    for (const imagePath of saveImages(checkedImages, "listings")) insertImage.run(row.id, imagePath);
  });
  res.json({ ok: true, status: "active" });
});

// ---------- F49: Tất toán ----------
router.post("/admin/listings/:id/settle", (req, res) => {
  const row = c.findListing(req.params.id);
  if (row.status === "settled") throw new ApiError(409, "Tin này đã được tất toán rồi.");
  if (row.status !== "sold") throw new ApiError(400, "Chỉ tất toán được tin Đã bán.");
  const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(row.order_id);
  if (!order || order.status !== "completed") throw new ApiError(400, "Đơn hàng của tin này chưa hoàn thành, chưa tất toán được.");

  db.prepare("UPDATE listings SET status = 'settled', settled_at = ?, settled_by = ? WHERE id = ? AND status = 'sold'").run(nowIso(), req.user.id, row.id);
  res.json({ ok: true, payout: row.payout });
});

// ---------- F20: Đơn hàng ----------
router.get("/admin/orders", (req, res) => {
  const status = String(req.query.status || "");
  const rows = o.STATUS_LABELS[status]
    ? db.prepare("SELECT * FROM orders WHERE status = ? ORDER BY id DESC LIMIT 100").all(status)
    : db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 100").all();
  const counts = {};
  for (const row of db.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all()) counts[row.status] = row.n;
  res.json({ orders: rows.map((order) => o.orderView(order, true)), counts, statusLabels: o.STATUS_LABELS });
});

router.post("/admin/orders/:id/action", (req, res) => {
  const order = o.findOrder(req.params.id);
  const action = req.body.action;
  if (action === "confirm") o.confirmOrder(order);
  else if (action === "advance") o.advanceOrder(order);
  else if (action === "cancel") o.cancelOrder(order, String(req.body.note || "").trim().slice(0, 300));
  else if (action === "paid") {
    if (order.status === "cancelled") throw new ApiError(400, "Đơn đã hủy.");
    db.prepare("UPDATE orders SET payment_status = 'paid', updated_at = ? WHERE id = ?").run(nowIso(), order.id);
  } else throw new ApiError(400, "Thao tác không hợp lệ.");
  res.json({ order: o.orderView(o.findOrder(order.id), true) });
});

module.exports = router;
