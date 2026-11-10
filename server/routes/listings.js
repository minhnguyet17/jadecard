// ======================================================================
// API KÝ GỬI (phía thành viên)
//   GET  /api/listings                 trang Ký gửi: tin đang bán, lọc, sắp xếp (F45)
//   GET  /api/listings/:id             chi tiết tin (F46) + trả giá của tôi (F55) + đánh giá người bán (F56)
//   GET  /api/listing-cards?ids=1,2    thẻ rút gọn cho topic F368 (F50) và link trong bài viết (F51)
//   POST /api/listings                 đăng tin ký gửi (F43)
//   GET  /api/my/listings              tin ký gửi của tôi (F48)
//   POST /api/listings/:id/withdraw    rút tin (F48)
//   POST /api/listings/:id/offers      trả giá (F55)
//   POST /api/offers/:id/accept | decline | cancel
// Phần của Admin (kiểm định F44, tất toán F49) nằm ở routes/admin.js.
// ======================================================================
const express = require("express");
const { db, transaction, nowIso } = require("../db");
const { ApiError } = require("../errors");
const { requireLogin } = require("../session");
const { publicUser, authorFromRow, authorColumns } = require("../users");
const { uploadImages, checkImages, saveImages } = require("../uploads");
const cards = require("../cards");
const c = require("../consign");
const v = require("../validate");

const router = express.Router();
const PAGE_SIZE = 12;

// ---------- F45: Trang Ký gửi ----------
router.get("/listings", (req, res) => {
  const where = ["li.status IN ('active', 'held')"];
  const params = [];

  const keyword = String(req.query.q || "").trim();
  if (keyword) {
    where.push("(li.card_name LIKE ? OR li.card_number LIKE ? OR li.set_name LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (req.query.set) {
    where.push("li.set_name = ?");
    params.push(String(req.query.set));
  }
  if (cards.CONDITIONS.includes(req.query.condition)) {
    where.push("COALESCE(li.condition_verified, li.condition_declared) = ?");
    params.push(req.query.condition);
  }
  const min = Number(req.query.min);
  const max = Number(req.query.max);
  if (min > 0) {
    where.push("li.list_price >= ?");
    params.push(min);
  }
  if (max > 0) {
    where.push("li.list_price <= ?");
    params.push(max);
  }

  const orderBy = { "price-asc": "li.list_price ASC", "price-desc": "li.list_price DESC" }[req.query.sort] || "li.verified_at DESC";
  const whereSql = " WHERE " + where.join(" AND ");
  const total = db.prepare("SELECT COUNT(*) AS n FROM listings li" + whereSql).get(...params).n;
  const page = v.toPositiveInt(req.query.page, 1);
  const rows = db
    .prepare(c.LISTING_SELECT + whereSql + ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .all(...params, PAGE_SIZE, (page - 1) * PAGE_SIZE);

  const sets = db
    .prepare("SELECT set_name, COUNT(*) AS n FROM listings WHERE status IN ('active', 'held') GROUP BY set_name ORDER BY set_name")
    .all()
    .map((row) => ({ name: row.set_name, count: row.n }));

  // Số giao dịch thành công của từng người bán (hiện trên khung người bán)
  const statsCache = {};
  const withStats = rows.map((row) => {
    statsCache[row.seller_id] = statsCache[row.seller_id] || c.sellerStats(row.seller_id);
    return { ...c.listingCard(row), sellerStats: statsCache[row.seller_id] };
  });

  res.json({ listings: withStats, sets, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
});

// ---------- F50, F51: thẻ rút gọn theo danh sách mã ----------
router.get("/listing-cards", (req, res) => {
  const ids = String(req.query.ids || "")
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 30);
  if (!ids.length) return res.json({ cards: [] });
  const marks = ids.map(() => "?").join(",");
  const rows = db.prepare(c.LISTING_SELECT + ` WHERE li.id IN (${marks})`).all(...ids);
  res.json({ cards: rows.map(c.listingCard) });
});

// ---------- F46: Chi tiết tin ----------
router.get("/listings/:id", (req, res) => {
  const row = c.findListing(req.params.id);
  const me = req.user;
  const isOwner = Boolean(me && me.id === row.seller_id);
  const isAdmin = Boolean(me && me.role === "admin");
  if (!c.PUBLIC_STATUSES.includes(row.status) && !isOwner && !isAdmin) {
    throw new ApiError(404, "Không tìm thấy tin ký gửi này.");
  }

  const images = db.prepare("SELECT path, source FROM listing_images WHERE listing_id = ? ORDER BY id").all(row.id);

  // Ai mua được, với giá nào
  let canBuy = false;
  let buyPrice = c.currentPrice(row);
  let buyNote = "";
  if (row.status === "active") {
    canBuy = !isOwner;
    if (isOwner) buyNote = "Đây là tin của bạn.";
  } else if (row.status === "held") {
    if (me && row.hold_buyer_id === me.id) {
      canBuy = true;
      buyPrice = row.hold_price;
      buyNote = "Người bán đã chấp nhận giá bạn trả. Hãy đặt hàng trước khi hết thời gian giữ.";
    } else {
      buyNote = "Thẻ đang được giữ cho một người trả giá.";
    }
  } else {
    buyNote = c.STATUS_LABELS[row.status];
  }

  // Trả giá của người đang xem (F55)
  const myOffer = me
    ? db.prepare("SELECT id, amount, status, expires_at FROM offers WHERE listing_id = ? AND buyer_id = ? ORDER BY id DESC LIMIT 1").get(row.id, me.id)
    : null;
  const canOffer = Boolean(me) && !isOwner && row.status === "active" && !(myOffer && myOffer.status === "pending");

  // Người bán xem các đề nghị đang chờ
  const offers = isOwner ? pendingOffers(row.id) : [];

  const reviews = db
    .prepare(
      `SELECT r.id, r.stars, r.comment, r.hidden, r.created_at, l.card_name, ${authorColumns("b")}
       FROM seller_reviews r JOIN users b ON b.id = r.buyer_id JOIN listings l ON l.id = r.listing_id
       WHERE r.seller_id = ? ${me && (me.role === "admin" || me.role === "mod") ? "" : "AND r.hidden = 0"}
       ORDER BY r.id DESC LIMIT 5`
    )
    .all(row.seller_id)
    .map(reviewView);

  res.json({
    listing: {
      ...c.listingCard(row),
      description: row.description,
      askingPrice: row.asking_price,
      images: {
        shop: images.filter((image) => image.source === "shop").map((image) => image.path),
        seller: images.filter((image) => image.source === "seller").map((image) => image.path),
      },
      verification: row.verified_at
        ? {
            conditionVerified: row.condition_verified,
            authentic: row.authentic === 1,
            verifiedAt: row.verified_at,
            rejectReason: row.reject_reason,
          }
        : null,
      verifyDeadline: row.verify_deadline,
      listExpiresAt: row.list_expires_at,
      thread: c.attachedThread(row.id),
    },
    sellerStats: c.sellerStats(row.seller_id),
    reviews,
    isOwner,
    canBuy,
    buyPrice,
    buyNote,
    myOffer: myOffer ? { id: myOffer.id, amount: myOffer.amount, status: myOffer.status, expiresAt: myOffer.expires_at } : null,
    canOffer,
    offerMin: Math.ceil(c.currentPrice(row) * 0.5),
    offers,
  });
});

function reviewView(row) {
  return {
    id: row.id,
    stars: row.stars,
    comment: row.comment,
    hidden: Boolean(row.hidden),
    createdAt: row.created_at,
    cardName: row.card_name,
    buyer: authorFromRow(row),
  };
}

function pendingOffers(listingId) {
  return db
    .prepare(
      `SELECT o.id, o.amount, o.expires_at, o.created_at, ${authorColumns("b")}
       FROM offers o JOIN users b ON b.id = o.buyer_id
       WHERE o.listing_id = ? AND o.status = 'pending' ORDER BY o.amount DESC`
    )
    .all(listingId)
    .map((o) => ({ id: o.id, amount: o.amount, expiresAt: o.expires_at, createdAt: o.created_at, buyer: authorFromRow(o) }));
}

// ---------- F43: Đăng tin ký gửi ----------
router.post("/listings", requireLogin, uploadImages(6), (req, res) => {
  let cardInput;
  try {
    cardInput = JSON.parse(req.body.card || "{}");
  } catch (error) {
    cardInput = {};
  }
  const card = cards.cleanCard(cardInput);
  const variant = cards.checkVariant(req.body.variant);
  const condition = cards.checkCondition(req.body.condition);
  const askingPrice = cards.checkMoney(req.body.askingPrice, {
    field: "askingPrice",
    label: "Giá mong muốn",
    min: c.RULES.minPrice,
    max: c.RULES.maxPrice,
  });
  const refPrice = Number.isInteger(Number(req.body.refPrice)) && Number(req.body.refPrice) > 0 ? Number(req.body.refPrice) : null;
  const description = v.cleanText(req.body.description, { field: "description", label: "Mô tả", min: 0, max: 1000 });

  const files = req.files || [];
  if (files.length < 2) throw new ApiError(400, "Cần ít nhất 2 ảnh thật của thẻ (mặt trước và mặt sau).", { field: "images" });
  const checkedImages = checkImages(files);

  const listingId = transaction(() => {
    const now = nowIso();
    const result = db
      .prepare(
        `INSERT INTO listings (seller_id, card_id, card_name, set_name, card_number, image, variant, ref_price, description,
           condition_declared, asking_price, verify_deadline, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(req.user.id, card.cardId, card.name, card.setName, card.number, card.image, variant, refPrice, description,
        condition, askingPrice, nowIso(c.RULES.verifyDays * c.DAY), now);
    const id = Number(result.lastInsertRowid);
    const insertImage = db.prepare("INSERT INTO listing_images (listing_id, path, source) VALUES (?, ?, 'seller')");
    for (const imagePath of saveImages(checkedImages, "listings")) insertImage.run(id, imagePath);
    return id;
  });

  const row = c.findListing(listingId);
  res.status(201).json({ id: listingId, code: c.listingCode(listingId), verifyDeadline: row.verify_deadline, ...c.commissionFor(askingPrice) });
});

// ---------- F48: Tin ký gửi của tôi ----------
router.get("/my/listings", requireLogin, (req, res) => {
  const rows = db.prepare(c.LISTING_SELECT + " WHERE li.seller_id = ? ORDER BY li.id DESC").all(req.user.id);
  res.json({
    listings: rows.map((row) => {
      const price = row.final_price || c.currentPrice(row);
      const money = row.final_price ? { commission: row.commission, payout: row.payout } : c.commissionFor(price);
      const thread = c.attachedThread(row.id);
      return {
        ...c.listingCard(row),
        askingPrice: row.asking_price,
        listPrice: row.list_price,
        finalPrice: row.final_price,
        commission: money.commission,
        payout: money.payout,
        verifyDeadline: row.verify_deadline,
        listExpiresAt: row.list_expires_at,
        rejectReason: row.reject_reason,
        soldAt: row.sold_at,
        settledAt: row.settled_at,
        thread,
        offers: row.status === "active" ? pendingOffers(row.id) : [],
        canWithdraw: ["pending", "active", "held"].includes(row.status),
        canAttach: !thread && ["pending", "active", "held", "reserved"].includes(row.status),
      };
    }),
    rules: c.RULES,
  });
});

// Chỉ chủ tin mới thao tác được tin của mình
function findOwnListing(id, user) {
  const row = c.findListing(id);
  if (row.seller_id !== user.id) throw new ApiError(403, "Bạn chỉ thao tác được tin ký gửi của chính mình.");
  return row;
}

// ---------- F48: Rút tin ----------
router.post("/listings/:id/withdraw", requireLogin, (req, res) => {
  const row = findOwnListing(req.params.id, req.user);
  if (!["pending", "active", "held"].includes(row.status)) {
    throw new ApiError(400, `Không rút được tin ở trạng thái "${c.STATUS_LABELS[row.status]}".`);
  }
  transaction(() => {
    db.prepare("UPDATE listings SET status = 'withdrawn', hold_buyer_id = NULL, hold_price = NULL, hold_until = NULL WHERE id = ?").run(row.id);
    db.prepare("UPDATE offers SET status = 'declined', decided_at = ? WHERE listing_id = ? AND status = 'pending'").run(nowIso(), row.id);
  });
  res.json({ ok: true, message: row.status === "pending" ? "Đã hủy tin." : "Đã rút tin. Hãy đến cửa hàng nhận lại thẻ." });
});

// ---------- F55: Trả giá ----------
router.post("/listings/:id/offers", requireLogin, (req, res) => {
  const row = c.findListing(req.params.id);
  if (row.seller_id === req.user.id) throw new ApiError(400, "Bạn không thể trả giá tin của chính mình.");
  if (row.status !== "active") throw new ApiError(400, "Tin này hiện không nhận trả giá.");

  const price = row.list_price;
  const amount = cards.checkMoney(req.body.amount, {
    field: "amount",
    label: "Giá đề nghị",
    min: Math.ceil(price * 0.5),
    max: price - 1, // dưới 100% giá niêm yết
  });
  const existing = db.prepare("SELECT 1 FROM offers WHERE listing_id = ? AND buyer_id = ? AND status = 'pending'").get(row.id, req.user.id);
  if (existing) throw new ApiError(409, "Bạn đang có một đề nghị chờ người bán trả lời cho tin này.");

  const result = db
    .prepare("INSERT INTO offers (listing_id, buyer_id, amount, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(row.id, req.user.id, amount, nowIso(c.RULES.offerHours * c.HOUR), nowIso());
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

function findOffer(id) {
  const offerId = v.toPositiveInt(id);
  const offer = offerId && db.prepare("SELECT * FROM offers WHERE id = ?").get(offerId);
  if (!offer) throw new ApiError(404, "Không tìm thấy đề nghị này.");
  return offer;
}

// Người bán chấp nhận: giữ thẻ 24 giờ cho người trả giá, các đề nghị khác tự bị từ chối
router.post("/offers/:id/accept", requireLogin, (req, res) => {
  const offer = findOffer(req.params.id);
  const row = findOwnListing(offer.listing_id, req.user);
  if (offer.status !== "pending") throw new ApiError(400, "Đề nghị này không còn chờ trả lời.");
  if (row.status !== "active") throw new ApiError(400, "Tin không còn ở trạng thái Đang bán.");

  const holdUntil = nowIso(c.RULES.holdHours * c.HOUR);
  transaction(() => {
    db.prepare("UPDATE offers SET status = 'accepted', decided_at = ? WHERE id = ?").run(nowIso(), offer.id);
    db.prepare("UPDATE offers SET status = 'declined', decided_at = ? WHERE listing_id = ? AND status = 'pending'").run(nowIso(), row.id);
    db.prepare("UPDATE listings SET status = 'held', hold_buyer_id = ?, hold_price = ?, hold_until = ? WHERE id = ?").run(
      offer.buyer_id,
      offer.amount,
      holdUntil,
      row.id
    );
  });
  res.json({ ok: true, holdUntil });
});

router.post("/offers/:id/decline", requireLogin, (req, res) => {
  const offer = findOffer(req.params.id);
  findOwnListing(offer.listing_id, req.user);
  if (offer.status !== "pending") throw new ApiError(400, "Đề nghị này không còn chờ trả lời.");
  db.prepare("UPDATE offers SET status = 'declined', decided_at = ? WHERE id = ?").run(nowIso(), offer.id);
  res.json({ ok: true });
});

// Người mua tự hủy đề nghị của mình
router.post("/offers/:id/cancel", requireLogin, (req, res) => {
  const offer = findOffer(req.params.id);
  if (offer.buyer_id !== req.user.id) throw new ApiError(403, "Bạn chỉ hủy được đề nghị của chính mình.");
  if (offer.status !== "pending") throw new ApiError(400, "Đề nghị này không còn chờ trả lời.");
  db.prepare("UPDATE offers SET status = 'cancelled', decided_at = ? WHERE id = ?").run(nowIso(), offer.id);
  res.json({ ok: true });
});

module.exports = router;
module.exports.reviewView = reviewView;
