// ======================================================================
// TRA CỨU THẺ VÀ GIÁ THAM KHẢO TỪ TCGdex (F10, F11 bản gọn)
// Mọi lần gọi TCGdex đều nằm trong file này, muốn đổi nguồn giá chỉ sửa ở đây.
// API miễn phí, không cần key, cho phép gọi từ trình duyệt:
//   Tìm thẻ:   https://api.tcgdex.net/v2/en/cards?name=pikachu
//   Chi tiết:  https://api.tcgdex.net/v2/en/cards/sv03.5-199  (có giá TCGplayer theo biến thể)
// Cần js/config.js (tỉ giá).
// ======================================================================
const TCGDEX_API = "https://api.tcgdex.net/v2/en";

// Biến thể của dự án ↔ tên trường giá TCGplayer trên TCGdex
const VARIANT_INFO = {
  normal: { label: "Thường", priceKey: "normal" },
  holo: { label: "Holo", priceKey: "holofoil" },
  reverse: { label: "Reverse Holo", priceKey: "reverse-holofoil" },
};

// Gọi TCGdex. Lỗi mạng hoặc máy chủ trả lỗi thì thử lại thêm 1 lần sau 0,8 giây
// (TCGdex đôi khi trả lỗi tạm thời).
async function fetchTcgdex(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
      if (attempt === 2) throw new Error("TCGdex trả lỗi " + response.status + ".");
    } catch (error) {
      if (attempt === 2) throw new Error("Không kết nối được TCGdex. Kiểm tra Internet rồi thử lại.");
    }
    await new Promise(function (resolve) {
      setTimeout(resolve, 800);
    });
  }
}

// Tìm thẻ theo tên và / hoặc số thẻ. Ví dụ: "charizard", "charizard 199", "199/165"
async function searchCards(query) {
  const text = query.trim();
  const numberMatch = text.match(/(\d{1,3})(?:\s*\/\s*\d{1,3})?\s*$/); // số thẻ ở cuối: "199" hoặc "199/165"
  const name = (numberMatch ? text.slice(0, numberMatch.index) : text).trim();
  const params = new URLSearchParams({ "pagination:itemsPerPage": "48" });
  if (name) params.set("name", name);
  // TCGdex lọc "gần đúng" (localId=19 ra cả 194, 199) nên lọc lại cho đúng số ở bên dưới
  if (numberMatch) params.set("localId", numberMatch[1]);
  if (!name && !numberMatch) return [];

  const list = await fetchTcgdex(TCGDEX_API + "/cards?" + params.toString());
  const wantedNumber = numberMatch ? numberMatch[1].replace(/^0+/, "") : null;
  return list.filter(function (card) {
    if (!card.image) return false; // bỏ thẻ không có ảnh (thường là bản quảng bá hiếm gặp)
    return !wantedNumber || String(card.localId).replace(/^0+/, "") === wantedNumber;
  });
}

// Chi tiết một thẻ: tên, set, số, ảnh, các biến thể có thật và giá tham khảo từng biến thể
async function getCardDetail(cardId) {
  const card = await fetchTcgdex(TCGDEX_API + "/cards/" + encodeURIComponent(cardId));
  const tcgplayer = (card.pricing && card.pricing.tcgplayer) || {};
  const official = card.set.cardCount && card.set.cardCount.official;

  const variants = Object.keys(VARIANT_INFO)
    .filter(function (key) {
      return card.variants && card.variants[key];
    })
    .map(function (key) {
      const price = tcgplayer[VARIANT_INFO[key].priceKey];
      const usd = price && price.marketPrice ? price.marketPrice : null;
      // Không có giá của đúng biến thể thì để trống (không lấy giá biến thể khác, không hiện 0đ — PB09)
      return { key: key, label: VARIANT_INFO[key].label, usd: usd, vnd: usd ? usdToVnd(usd) : null };
    });

  return {
    cardId: card.id,
    name: card.name,
    setName: card.set.name,
    number: card.localId + (official ? "/" + official : ""),
    image: card.image, // link gốc; thêm "/low.webp" hoặc "/high.webp" khi hiển thị
    rarity: card.rarity || "",
    variants: variants,
    priceUpdated: tcgplayer.updated || null,
  };
}

// Link ảnh thẻ. Ảnh TCGdex cần thêm đuôi chất lượng; ảnh mẫu trong dự án (/images/...) dùng nguyên
function cardImageUrl(image, quality) {
  if (/^https:\/\/assets\.tcgdex\.net\//.test(image)) return image + "/" + (quality || "low") + ".webp";
  return image;
}
