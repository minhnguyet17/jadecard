// ======================================================================
// QUY TẮC KÝ GỬI (F43–F49, F55) dùng chung cho các API
//   - Hoa hồng: 8% giá bán, tối thiểu 20.000 ₫ (giả định để mô phỏng)
//   - Mang thẻ đến cửa hàng trong 7 ngày; niêm yết tối đa 60 ngày
//   - Trả giá hết hạn sau 48 giờ; chấp nhận thì giữ thẻ 24 giờ cho người trả giá
// ======================================================================
const { db, nowIso } = require("./db");
const { ApiError } = require("./errors");
const { VARIANTS } = require("./cards");
const { authorFromRow, authorColumns } = require("./users");

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const RULES = {
  commissionRate: 0.08,
  minCommission: 20000,
  minPrice: 50000,
  maxPrice: 2000000000,
  verifyDays: 7,
  listingDays: 60,
  offerHours: 48,
  holdHours: 24,
};

const STATUS_LABELS = {
  pending: "Chờ kiểm định",
  rejected: "Từ chối",
  expired_verify: "Hết hạn kiểm định",
  active: "Đang bán",
  held: "Đang giữ cho người trả giá",
  reserved: "Đã có đơn, đang giữ",
  sold: "Đã bán",
  settled: "Đã tất toán",
  withdrawn: "Đã rút",
  expired_listing: "Hết hạn niêm yết",
};

// Trạng thái ai cũng xem được (tin "Chờ kiểm định" chưa hiện công khai, F43)
const PUBLIC_STATUSES = ["active", "held", "reserved", "sold", "settled"];
// Trạng thái đã qua kiểm định của JadeCard → có huy hiệu "JadeCard đã xác thực"
const VERIFIED_STATUSES = ["active", "held", "reserved", "sold", "settled"];

// Hoa hồng và số tiền người bán nhận cho một giá bán
function commissionFor(price) {
  const commission = Math.max(Math.round(price * RULES.commissionRate), RULES.minCommission);
  return { commission, payout: price - commission };
}

function listingCode(id) {
  return "KG-" + String(id).padStart(4, "0");
}

// Đọc mã "KG-0042" hoặc "42" → 42
function parseListingCode(text) {
  const match = String(text || "").trim().match(/^(?:KG-?)?0*(\d+)$/i);
  return match ? Number(match[1]) : null;
}

// Cập nhật các tin / đề nghị đã quá hạn. Chạy đầu mỗi yêu cầu API (rất nhanh),
// nên không cần chương trình chạy ngầm theo giờ.
function runExpiry(req, res, next) {
  const now = nowIso();
  db.prepare("UPDATE listings SET status = 'expired_verify' WHERE status = 'pending' AND verify_deadline < ?").run(now);
  db.prepare(
    "UPDATE listings SET status = 'active', hold_buyer_id = NULL, hold_price = NULL, hold_until = NULL WHERE status = 'held' AND hold_until < ?"
  ).run(now);
  db.prepare("UPDATE listings SET status = 'expired_listing' WHERE status = 'active' AND list_expires_at < ?").run(now);
  db.prepare("UPDATE offers SET status = 'expired', decided_at = ? WHERE status = 'pending' AND expires_at < ?").run(now, now);
  if (next) next();
}

// Câu SELECT một tin kèm thông tin người bán
const LISTING_SELECT = `SELECT li.*, ${authorColumns("u", "seller_")} FROM listings li JOIN users u ON u.id = li.seller_id`;

function findListing(id) {
  const listingId = Number(id);
  const row = Number.isInteger(listingId) && listingId > 0 && db.prepare(LISTING_SELECT + " WHERE li.id = ?").get(listingId);
  if (!row) throw new ApiError(404, "Không tìm thấy tin ký gửi này.");
  return row;
}

// Giá đang bán: giá niêm yết sau kiểm định, chưa kiểm định thì là giá mong muốn
function currentPrice(row) {
  return row.list_price || row.asking_price;
}

// Thông tin rút gọn của một tin: dùng cho lưới Ký gửi, thẻ trong topic F368 (F50), link tự hiện thành thẻ (F51)
function listingCard(row) {
  return {
    id: row.id,
    code: listingCode(row.id),
    cardId: row.card_id,
    cardName: row.card_name,
    setName: row.set_name,
    cardNumber: row.card_number,
    image: row.image,
    variant: row.variant,
    variantLabel: VARIANTS[row.variant] || row.variant,
    condition: row.condition_verified || row.condition_declared,
    price: currentPrice(row),
    refPrice: row.ref_price,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    verified: VERIFIED_STATUSES.includes(row.status),
    isPublic: PUBLIC_STATUSES.includes(row.status),
    holdUntil: row.status === "held" ? row.hold_until : null,
    seller: authorFromRow(row, "seller_"),
    createdAt: row.created_at,
  };
}

// Số giao dịch thành công và điểm đánh giá trung bình của người bán (F46, F56)
function sellerStats(sellerId) {
  const sales = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE seller_id = ? AND status IN ('sold', 'settled')").get(sellerId).n;
  const rating = db
    .prepare("SELECT COUNT(*) AS n, AVG(stars) AS avg FROM seller_reviews WHERE seller_id = ? AND hidden = 0")
    .get(sellerId);
  return {
    successCount: sales,
    ratingCount: rating.n,
    ratingAvg: rating.n ? Math.round(rating.avg * 10) / 10 : null,
  };
}

// Topic F368 đang gắn tin này (F50), nếu có
function attachedThread(listingId) {
  return db.prepare("SELECT id, title FROM threads WHERE listing_id = ? AND hidden = 0").get(listingId) || null;
}

module.exports = {
  RULES,
  STATUS_LABELS,
  PUBLIC_STATUSES,
  DAY,
  HOUR,
  commissionFor,
  listingCode,
  parseListingCode,
  runExpiry,
  LISTING_SELECT,
  findListing,
  currentPrice,
  listingCard,
  sellerStats,
  attachedThread,
};
