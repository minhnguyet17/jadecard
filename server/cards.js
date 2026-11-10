// ======================================================================
// THÔNG TIN THẺ GỬI LÊN TỪ TRÌNH DUYỆT (bộ sưu tập, tin ký gửi)
// Trình duyệt tra thẻ trên TCGdex (js/card-service.js) rồi gửi kèm tên, set, số, ảnh.
// Server kiểm tra định dạng từng trường; thẻ thật / giả và tình trạng thì
// JadeCard kiểm tra tận tay khi người bán mang thẻ đến cửa hàng (F44).
// ======================================================================
const { ApiError } = require("./errors");
const v = require("./validate");

const VARIANTS = {
  normal: "Thường",
  holo: "Holo",
  reverse: "Reverse Holo",
};

const CONDITIONS = ["NM", "LP", "MP", "HP"];

// Ảnh thẻ chỉ được lấy từ máy chủ ảnh của TCGdex hoặc ảnh mẫu có sẵn trong dự án
const IMAGE_PATTERN = /^(https:\/\/assets\.tcgdex\.net\/[\w./-]+|\/images\/cards\/[\w.-]+\.webp)$/;

function cleanCard(card) {
  card = card && typeof card === "object" ? card : {};
  const cardId = String(card.cardId || "");
  if (!/^[A-Za-z0-9.-]{2,40}$/.test(cardId)) {
    throw new ApiError(400, "Vui lòng chọn thẻ.", { field: "card" });
  }
  const image = String(card.image || "");
  if (!IMAGE_PATTERN.test(image)) {
    throw new ApiError(400, "Ảnh thẻ không hợp lệ.", { field: "card" });
  }
  return {
    cardId,
    name: v.cleanText(card.name, { field: "card", label: "Tên thẻ", max: 80 }),
    setName: v.cleanText(card.setName, { field: "card", label: "Tên set", max: 80 }),
    number: v.cleanText(card.number, { field: "card", label: "Số thẻ", max: 20 }),
    image,
  };
}

function checkVariant(variant) {
  if (!VARIANTS[variant]) throw new ApiError(400, "Vui lòng chọn biến thể.", { field: "variant" });
  return variant;
}

function checkCondition(condition, field = "condition") {
  if (!CONDITIONS.includes(condition)) throw new ApiError(400, "Vui lòng chọn tình trạng NM, LP, MP hoặc HP.", { field });
  return condition;
}

// Số tiền VND: số nguyên trong khoảng cho phép
function checkMoney(value, { field, label, min, max }) {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < min || amount > max) {
    throw new ApiError(400, `${label} phải từ ${min.toLocaleString("vi-VN")} ₫ đến ${max.toLocaleString("vi-VN")} ₫.`, { field });
  }
  return amount;
}

module.exports = { VARIANTS, CONDITIONS, cleanCard, checkVariant, checkCondition, checkMoney };
