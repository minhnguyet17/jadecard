// ======================================================================
// BỘ SƯU TẬP CỦA TÔI (F13 Đang có, F14 Đang săn, F27 cài đặt riêng tư) — collection.html
//   - Thêm thẻ: tra trên TCGdex (js/card-picker.js), chọn biến thể, tình trạng, số lượng
//   - Đang có: tổng giá tham khảo TẠI THỜI ĐIỂM LƯU; thẻ chưa có giá đếm riêng, không tính 0đ
//   - Đang săn: nhãn "JadeCard đang có hàng" khi shop có đúng thẻ + biến thể, còn hàng
//   - "Ký gửi thẻ này": mở form đăng tin ký gửi có sẵn thẻ (thay cho F16)
// Cần: js/config.js, js/card-service.js, js/card-picker.js, js/collection-store.js
// ======================================================================
let collectionUser = null;
let collectionItems = [];
let chosenCard = null;
let chosenVariant = null;

const VARIANT_LABELS = { normal: "Thường", holo: "Holo", reverse: "Reverse Holo" };

// ---------- Ô chọn thẻ ----------
setupCardPicker({
  input: document.getElementById("card-search"),
  searchButton: document.getElementById("card-search-button"),
  results: document.getElementById("card-results"),
  selected: document.getElementById("card-selected"),
  onChange: function (card, variant) {
    chosenCard = card;
    chosenVariant = variant;
    document.getElementById("add-form-extra").classList.toggle("hidden", !card);
  },
});

// Đang săn thì không cần tình trạng, số lượng
document.querySelectorAll('input[name="add-list"]').forEach(function (radio) {
  radio.addEventListener("change", function () {
    document.getElementById("have-fields").classList.toggle("hidden", radio.value === "want" && radio.checked);
  });
});

document.getElementById("add-button").addEventListener("click", async function () {
  if (!chosenCard || !chosenVariant) return;
  const list = document.querySelector('input[name="add-list"]:checked').value;
  const item = {
    list: list,
    card: { cardId: chosenCard.cardId, name: chosenCard.name, setName: chosenCard.setName, number: chosenCard.number, image: chosenCard.image },
    variant: chosenVariant.key,
    variantLabel: chosenVariant.label,
    condition: document.getElementById("add-condition").value,
    quantity: Math.max(1, Number(document.getElementById("add-quantity").value) || 1),
    savedPrice: chosenVariant.vnd,
  };
  try {
    collectionItems = await addCollectionItem(collectionUser, item);
    renderCollection();
    showToast('Đã thêm "' + chosenCard.name + '" vào ' + (list === "have" ? "Đang có" : "Đang săn"));
    selectTab(list);
  } catch (error) {
    showToast(error.message);
  }
});

// ---------- Vẽ danh sách ----------

// F14: shop có bán đúng thẻ + biến thể, đang còn hàng?
function shopProductFor(item) {
  return products.find(function (product) {
    return product.cardId === item.cardId && product.variant && product.variant.toLowerCase() === item.variant && product.stock > 0;
  });
}

function haveRowHtml(item) {
  const conditions = ["NM", "LP", "MP", "HP"]
    .map(function (c) {
      return '<option value="' + c + '"' + (c === item.condition ? " selected" : "") + ">" + c + "</option>";
    })
    .join("");
  const sellUrl = "new-listing.html?card=" + encodeURIComponent(item.cardId) + "&variant=" + item.variant + "&condition=" + item.condition;
  return (
    '<li class="collection-row">' +
    '<img class="collection-row__img" src="' + escapeHtml(listingImage(item.image)) + '" alt="" loading="lazy">' +
    '<div class="collection-row__info"><p class="collection-row__name">' + escapeHtml(item.name) + "</p>" +
    '<p class="collection-row__meta">' + escapeHtml(item.setName + " · " + item.number + " · " + (VARIANT_LABELS[item.variant] || item.variant)) + "</p>" +
    '<p class="collection-row__price">' + (item.savedPrice ? formatVND(item.savedPrice) + " / lá · lưu " + formatDate(item.savedAt) : '<span class="text-dim">Chưa có giá tham khảo</span>') + "</p></div>" +
    '<div class="collection-row__controls">' +
    '<label class="sr-only" for="cond-' + item.id + '">Tình trạng</label><select id="cond-' + item.id + '" class="select collection-row__select" data-condition="' + item.id + '">' + conditions + "</select>" +
    '<label class="sr-only" for="qty-' + item.id + '">Số lượng</label><input id="qty-' + item.id + '" class="input collection-row__qty" type="number" min="1" max="999" value="' + item.quantity + '" data-quantity="' + item.id + '">' +
    "</div>" +
    '<div class="collection-row__actions">' +
    '<a class="btn btn--soft btn--sm" href="' + sellUrl + '"><span class="icon" aria-hidden="true">storefront</span> Ký gửi thẻ này</a>' +
    '<button type="button" class="link-button link-button--danger" data-remove="' + item.id + '">Xóa</button></div>' +
    "</li>"
  );
}

function wantRowHtml(item) {
  const product = shopProductFor(item);
  return (
    '<li class="collection-row">' +
    '<img class="collection-row__img" src="' + escapeHtml(listingImage(item.image)) + '" alt="" loading="lazy">' +
    '<div class="collection-row__info"><p class="collection-row__name">' + escapeHtml(item.name) + "</p>" +
    '<p class="collection-row__meta">' + escapeHtml(item.setName + " · " + item.number + " · " + (VARIANT_LABELS[item.variant] || item.variant)) + "</p>" +
    (product
      ? '<a class="tag tag--emerald" href="product-detail.html?id=' + product.id + '">JadeCard đang có hàng · ' + formatVND(product.price) + " →</a>"
      : '<a class="collection-row__search" href="consign.html">Tìm trong Ký gửi →</a>') +
    "</div>" +
    '<div class="collection-row__actions"><button type="button" class="link-button link-button--danger" data-remove="' + item.id + '">Xóa</button></div>' +
    "</li>"
  );
}

function renderCollection() {
  const have = collectionItems.filter(function (item) {
    return item.list === "have";
  });
  const want = collectionItems.filter(function (item) {
    return item.list === "want";
  });

  // Tổng giá tham khảo tại thời điểm lưu (PB19): chỉ tính thẻ có giá
  const priced = have.filter(function (item) {
    return item.savedPrice;
  });
  const total = priced.reduce(function (sum, item) {
    return sum + item.savedPrice * item.quantity;
  }, 0);
  const cardCount = have.reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);
  const noPrice = have.length - priced.length;

  document.getElementById("collection-stats").innerHTML =
    "<div><dt>Tổng giá tham khảo lúc lưu</dt><dd>" + formatVND(total) + "</dd></div>" +
    "<div><dt>Số lá đang có</dt><dd>" + formatNumber(cardCount) + "</dd></div>" +
    "<div><dt>Đang săn</dt><dd>" + want.length + "</dd></div>" +
    (noPrice ? '<div><dt>Chưa có giá</dt><dd class="text-yellow">' + noPrice + " thẻ</dd></div>" : "");

  document.getElementById("tab-have").querySelector("[data-count]").textContent = have.length;
  document.getElementById("tab-want").querySelector("[data-count]").textContent = want.length;
  document.getElementById("have-list").innerHTML = have.length
    ? have.map(haveRowHtml).join("")
    : '<li class="empty-note">Chưa có thẻ nào. Tìm thẻ ở khung bên trên để thêm.</li>';
  document.getElementById("want-list").innerHTML = want.length
    ? want.map(wantRowHtml).join("")
    : '<li class="empty-note">Chưa săn thẻ nào.</li>';
}

function selectTab(name) {
  ["have", "want"].forEach(function (key) {
    const selected = key === name;
    document.getElementById("tab-" + key).setAttribute("aria-selected", String(selected));
    document.getElementById("panel-" + key).hidden = !selected;
  });
}
document.getElementById("tab-have").addEventListener("click", function () {
  selectTab("have");
});
document.getElementById("tab-want").addEventListener("click", function () {
  selectTab("want");
});

// ---------- Sửa / xóa ----------
document.getElementById("collection-lists").addEventListener("change", async function (event) {
  const target = event.target;
  try {
    if (target.dataset.quantity) {
      const quantity = Math.min(999, Math.max(1, Number(target.value) || 1));
      collectionItems = await updateCollectionItem(collectionUser, Number(target.dataset.quantity), { quantity: quantity });
    } else if (target.dataset.condition) {
      collectionItems = await updateCollectionItem(collectionUser, Number(target.dataset.condition), { condition: target.value });
    } else {
      return;
    }
    renderCollection();
  } catch (error) {
    showToast(error.message);
    renderCollection();
  }
});

document.getElementById("collection-lists").addEventListener("click", async function (event) {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  collectionItems = await removeCollectionItem(collectionUser, Number(button.dataset.remove));
  renderCollection();
});

// ---------- Cài đặt riêng tư (F27) ----------
function renderSettings(settings) {
  const box = document.getElementById("collection-settings");
  if (!collectionUser) {
    box.innerHTML =
      '<p class="alert alert--info"><span class="icon" aria-hidden="true">info</span><span>Bộ sưu tập được lưu trên trình duyệt này. ' +
      '<a href="login.html?next=collection.html">Đăng nhập</a> để lưu vào tài khoản và chia sẻ với cộng đồng.</span></p>';
    return;
  }
  box.innerHTML =
    '<div class="settings-card"><p class="settings-card__title"><span class="icon" aria-hidden="true">visibility</span> Ai xem được bộ sưu tập?</p>' +
    '<label class="checkbox"><input id="setting-public" type="checkbox"' + (settings.isPublic ? " checked" : "") + "> <span>Công khai danh sách thẻ trên hồ sơ (người khác bấm avatar của bạn sẽ thấy)</span></label>" +
    '<label class="checkbox"><input id="setting-value" type="checkbox"' + (settings.showValue ? " checked" : "") + (settings.isPublic ? "" : " disabled") + "> <span>Hiện tổng giá trị cho người khác (mặc định ẩn để an toàn khi giao dịch trực tiếp)</span></label>" +
    '<a class="link-arrow" href="' + profileUrl(collectionUser) + '">Xem hồ sơ của tôi →</a></div>';

  box.addEventListener("change", async function () {
    const isPublic = document.getElementById("setting-public").checked;
    const showValue = isPublic && document.getElementById("setting-value").checked;
    try {
      const result = await apiRequest("PUT", "/api/collection/settings", { isPublic: isPublic, showValue: showValue });
      renderSettings(result.settings);
      showToast("Đã lưu cài đặt.");
    } catch (error) {
      showToast(error.message);
    }
  }, { once: true });
}

// ---------- Gộp bộ sưu tập trên trình duyệt vào tài khoản ----------
function renderMergeBanner() {
  const local = loadLocalCollection();
  const banner = document.getElementById("merge-banner");
  if (!collectionUser || !local.length) {
    banner.classList.add("hidden");
    return;
  }
  banner.classList.remove("hidden");
  banner.innerHTML =
    '<span class="icon" aria-hidden="true">move_down</span><div><strong class="alert__title">Trình duyệt này đang có ' + local.length + " thẻ chưa lưu vào tài khoản</strong>" +
    "<span>Gộp vào tài khoản? Thẻ trùng (cùng thẻ, biến thể, tình trạng) sẽ được cộng số lượng.</span>" +
    '<div class="merge-actions"><button id="merge-yes" type="button" class="btn btn--primary btn--sm">Gộp vào tài khoản</button>' +
    '<button id="merge-no" type="button" class="btn btn--soft btn--sm">Không, xóa bản trên trình duyệt</button></div></div>';
  document.getElementById("merge-yes").addEventListener("click", async function () {
    try {
      const result = await mergeLocalCollection();
      collectionItems = result.items;
      renderCollection();
      renderMergeBanner();
      showToast("Đã gộp " + result.merged + " thẻ vào tài khoản.");
    } catch (error) {
      showToast(error.message);
    }
  });
  document.getElementById("merge-no").addEventListener("click", function () {
    localStorage.removeItem(COLLECTION_KEY);
    renderMergeBanner();
  });
}

async function initCollection() {
  collectionUser = await getCurrentUser();
  try {
    const data = await fetchCollection(collectionUser);
    collectionItems = data.items;
    renderSettings(data.settings);
  } catch (error) {
    // Không có server (mở file trực tiếp): vẫn dùng được bản trên trình duyệt
    collectionUser = null;
    collectionItems = loadLocalCollection();
    renderSettings(null);
  }
  renderMergeBanner();
  renderCollection();
}

initCollection();
