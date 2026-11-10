// ======================================================================
// TRANG KÝ GỬI (F45) — consign.html
// Giao diện giống trang Sản phẩm: bộ lọc bên trái, lưới thẻ bên phải.
// Chỉ hiện tin đã qua kiểm định đang bán. Mỗi thẻ có khung người bán (avatar, tên, chức vụ).
// Lọc / sắp xếp làm ở server (GET /api/listings), 12 tin mỗi trang.
// ======================================================================
const consignGrid = document.getElementById("consign-grid");
const consignFilters = {
  keyword: document.getElementById("filter-keyword"),
  set: document.getElementById("filter-set"),
  min: document.getElementById("filter-min"),
  max: document.getElementById("filter-max"),
  sort: document.getElementById("sort"),
};
let consignPage = 1;
let consignViewer = null;
const shownListings = {}; // id → dữ liệu tin, để nút "Thêm vào giỏ" lấy lại

function consignCardHtml(card) {
  const isMine = consignViewer && consignViewer.id === card.seller.id;
  let action;
  if (isMine) action = '<span class="consign-card__note">Tin của bạn</span>';
  else if (card.status === "held") action = '<button type="button" class="btn btn--soft btn--sm" disabled>Đang giữ cho người trả giá</button>';
  else action = '<button type="button" class="btn btn--primary btn--sm" data-add-listing="' + card.id + '"><span class="icon" aria-hidden="true">add_shopping_cart</span> Thêm vào giỏ</button>';

  const stats = card.sellerStats;
  return (
    '<article class="consign-card">' +
    '<a class="consign-card__media" href="' + listingUrl(card) + '">' +
    '<img src="' + escapeHtml(listingImage(card.image)) + '" alt="' + escapeHtml(card.cardName) + '" loading="lazy">' +
    listingBadgeHtml(card) +
    '<span class="consign-card__cond">' + escapeHtml(card.condition) + "</span></a>" +
    '<div class="consign-card__body">' +
    '<p class="consign-card__set">' + escapeHtml(card.setName + " · " + card.cardNumber + " · " + card.variantLabel) + "</p>" +
    '<h3 class="consign-card__name"><a href="' + listingUrl(card) + '">' + escapeHtml(card.cardName) + "</a></h3>" +
    '<p class="consign-card__price">' + formatVND(card.price) + "</p>" +
    (card.refPrice ? '<p class="consign-card__ref">Giá tham khảo quốc tế lúc đăng: ' + formatVND(card.refPrice) + "</p>" : "") +
    '<div class="seller-chip">' +
    '<a href="' + profileUrl(card.seller) + '">' + avatarHtml(card.seller, "sm") + "</a>" +
    '<div class="seller-chip__text">' + userLinkHtml(card.seller) + ' <span class="user-tags">' + rankTagsHtml(card.seller) + "</span>" +
    '<p class="seller-chip__meta">' + stats.successCount + " giao dịch thành công · " + starsHtml(stats.ratingAvg, stats.ratingCount) + "</p></div></div>" +
    '<div class="consign-card__actions">' + action + '<a class="btn btn--soft btn--sm" href="' + listingUrl(card) + '">Xem chi tiết</a></div>' +
    "</div></article>"
  );
}

async function loadConsign() {
  const query = new URLSearchParams({ page: consignPage });
  if (consignFilters.keyword.value.trim()) query.set("q", consignFilters.keyword.value.trim());
  if (consignFilters.set.value) query.set("set", consignFilters.set.value);
  const condition = document.querySelector('input[name="condition"]:checked').value;
  if (condition) query.set("condition", condition);
  if (consignFilters.min.value) query.set("min", consignFilters.min.value);
  if (consignFilters.max.value) query.set("max", consignFilters.max.value);
  if (consignFilters.sort.value) query.set("sort", consignFilters.sort.value);

  try {
    const [data, user] = await Promise.all([apiGet("/api/listings?" + query), getCurrentUser()]);
    consignViewer = user;
    data.listings.forEach(function (card) {
      shownListings[card.id] = card;
    });

    // Danh sách set lấy từ các tin đang bán (giữ lựa chọn hiện tại)
    const chosen = consignFilters.set.value;
    consignFilters.set.innerHTML =
      '<option value="">Tất cả set</option>' +
      data.sets
        .map(function (set) {
          return '<option value="' + escapeHtml(set.name) + '"' + (set.name === chosen ? " selected" : "") + ">" + escapeHtml(set.name) + " (" + set.count + ")</option>";
        })
        .join("");

    document.getElementById("result-count").textContent = data.total ? "Đang hiển thị " + data.listings.length + " / " + data.total + " thẻ ký gửi đã kiểm định" : "";
    consignGrid.innerHTML = data.listings.length
      ? data.listings.map(consignCardHtml).join("")
      : '<div class="empty-state consign-empty"><span class="icon icon--5xl text-dim" aria-hidden="true">search_off</span><p class="empty-state__title">Chưa có thẻ ký gửi phù hợp</p><p class="empty-state__text">Thử bỏ bớt bộ lọc, hoặc ký gửi thẻ của bạn.</p></div>';
    document.getElementById("pagination").innerHTML = paginationHtml(data.page, data.pageCount, function (number) {
      return "#trang-" + number;
    });
  } catch (error) {
    consignGrid.innerHTML = loadErrorHtml(error);
  }
}

// Bấm số trang (link "#trang-2") → tải trang đó, không đổi địa chỉ trang
document.getElementById("pagination").addEventListener("click", function (event) {
  const link = event.target.closest("a[href^='#trang-']");
  if (!link) return;
  event.preventDefault();
  consignPage = Number(link.getAttribute("href").replace("#trang-", ""));
  loadConsign();
  consignGrid.scrollIntoView({ behavior: "smooth" });
});

// Thêm tin ký gửi vào giỏ (F47)
consignGrid.addEventListener("click", function (event) {
  const button = event.target.closest("[data-add-listing]");
  if (!button) return;
  const card = shownListings[button.dataset.addListing];
  if (addListingToCart(card, card.price)) {
    bumpCartBadge();
    showToast('Đã thêm "' + card.cardName + '" vào giỏ', true);
  } else {
    showToast("Thẻ này đã có trong giỏ", true);
  }
});

// Đổi bộ lọc → về trang 1 và tải lại. Ô từ khóa chờ người dùng ngừng gõ 300ms.
let keywordTimer = null;
consignFilters.keyword.addEventListener("input", function () {
  clearTimeout(keywordTimer);
  keywordTimer = setTimeout(function () {
    consignPage = 1;
    loadConsign();
  }, 300);
});
[consignFilters.set, consignFilters.min, consignFilters.max, consignFilters.sort].forEach(function (input) {
  input.addEventListener("change", function () {
    consignPage = 1;
    loadConsign();
  });
});
document.querySelectorAll('input[name="condition"]').forEach(function (radio) {
  radio.addEventListener("change", function () {
    consignPage = 1;
    loadConsign();
  });
});
document.getElementById("filter-reset").addEventListener("click", function () {
  consignFilters.keyword.value = "";
  consignFilters.set.value = "";
  consignFilters.min.value = "";
  consignFilters.max.value = "";
  consignFilters.sort.value = "";
  document.querySelector('input[name="condition"][value=""]').checked = true;
  consignPage = 1;
  loadConsign();
});

// Điện thoại: thu gọn bộ lọc (giống trang Sản phẩm)
document.getElementById("filter-toggle").addEventListener("click", function () {
  const box = document.getElementById("filters");
  const open = box.classList.toggle("is-open");
  this.setAttribute("aria-expanded", String(open));
});

loadConsign();
