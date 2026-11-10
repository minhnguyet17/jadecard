// ======================================================================
// NƠI LƯU BỘ SƯU TẬP (F13, F14, F27 — quy tắc PB22 sửa ở v2.0)
//   - Chưa đăng nhập: lưu trên trình duyệt (localStorage, khóa "collection").
//   - Đã đăng nhập: đọc / ghi trên server (/api/collection).
//   - Lần đầu đăng nhập mà trình duyệt đang có thẻ: hỏi gộp vào tài khoản.
// Trang chỉ gọi các hàm dưới đây, không cần biết dữ liệu đang nằm ở đâu.
// Cần: js/api.js
// ======================================================================
const COLLECTION_KEY = "collection";

// Một dòng: { id, list: "have"|"want", cardId, name, setName, number, image, variant,
//             condition, quantity, savedPrice, savedAt }
function loadLocalCollection() {
  try {
    const items = JSON.parse(localStorage.getItem(COLLECTION_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch (error) {
    return []; // dữ liệu hỏng thì coi như trống
  }
}

function saveLocalCollection(items) {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(items));
}

async function fetchCollection(user) {
  if (user) return apiGet("/api/collection");
  return { items: loadLocalCollection(), settings: null };
}

// Thêm thẻ; trùng thẻ + biến thể + tình trạng trong cùng danh sách thì cộng số lượng
async function addCollectionItem(user, item) {
  if (user) return (await apiPost("/api/collection", item)).items;

  const items = loadLocalCollection();
  const condition = item.list === "have" ? item.condition : null;
  const same = items.find(function (row) {
    return row.list === item.list && row.cardId === item.card.cardId && row.variant === item.variant && row.condition === condition;
  });
  if (same) {
    same.quantity = Math.min(999, same.quantity + (item.list === "want" ? 0 : item.quantity));
  } else {
    items.unshift({
      id: Date.now(), // mã tạm trên trình duyệt
      list: item.list,
      cardId: item.card.cardId,
      name: item.card.name,
      setName: item.card.setName,
      number: item.card.number,
      image: item.card.image,
      variant: item.variant,
      variantLabel: item.variantLabel,
      condition: condition,
      quantity: item.list === "want" ? 1 : item.quantity,
      savedPrice: item.savedPrice || null,
      savedAt: new Date().toISOString(),
    });
  }
  saveLocalCollection(items);
  return items;
}

async function updateCollectionItem(user, id, changes) {
  if (user) return (await apiRequest("PATCH", "/api/collection/" + id, changes)).items;
  const items = loadLocalCollection();
  const row = items.find(function (item) {
    return item.id === id;
  });
  if (row) Object.assign(row, changes);
  saveLocalCollection(items);
  return items;
}

async function removeCollectionItem(user, id) {
  if (user) return (await apiRequest("DELETE", "/api/collection/" + id)).items;
  const items = loadLocalCollection().filter(function (item) {
    return item.id !== id;
  });
  saveLocalCollection(items);
  return items;
}

// Gộp thẻ trên trình duyệt vào tài khoản rồi xóa bản trên trình duyệt
async function mergeLocalCollection() {
  const local = loadLocalCollection().map(function (item) {
    return {
      list: item.list,
      card: { cardId: item.cardId, name: item.name, setName: item.setName, number: item.number, image: item.image },
      variant: item.variant,
      condition: item.condition,
      quantity: item.quantity,
      savedPrice: item.savedPrice,
      savedAt: item.savedAt,
    };
  });
  const result = await apiPost("/api/collection/merge", { items: local });
  localStorage.removeItem(COLLECTION_KEY);
  return result;
}
