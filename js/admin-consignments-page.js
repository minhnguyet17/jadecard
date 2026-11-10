// ======================================================================
// KIỂM ĐỊNH VÀ TẤT TOÁN KÝ GỬI — admin-consignments.html, chỉ Admin
//   Tab "Chờ kiểm định" (F44): tìm theo mã KG, xem ảnh người bán chụp, ghi biên bản:
//       thật / nghi giả, tình trạng thực tế, giá niêm yết đã thống nhất, ảnh shop chụp → Đạt / Từ chối
//   Tab "Đang bán": các tin đang niêm yết, đang giữ, đã có đơn
//   Tab "Chờ tất toán" (F49): tin đã bán, đơn hoàn thành → ghi "đã trả tiền cho người bán tại quầy"
// ======================================================================
const adminListingsBox = document.getElementById("admin-listings");
let adminView = "pending";

function verifyFormHtml(card) {
  const conditions = ["NM", "LP", "MP", "HP"]
    .map(function (c) {
      return '<option value="' + c + '"' + (c === card.conditionDeclared ? " selected" : "") + ">" + c + "</option>";
    })
    .join("");
  return (
    '<form class="verify-form" data-verify="' + card.id + '" novalidate>' +
    '<fieldset class="verify-form__row"><legend class="field__label">Thẻ thật hay giả?</legend>' +
    '<label class="delivery-option"><input type="radio" name="authentic" value="1" checked> <span class="delivery-option__name">Thẻ thật</span></label>' +
    '<label class="delivery-option"><input type="radio" name="authentic" value="0"> <span class="delivery-option__name">Nghi giả</span></label></fieldset>' +
    '<div class="verify-form__grid">' +
    '<label class="field"><span class="field__label">Tình trạng thực tế</span><select class="select field__select" name="conditionVerified">' + conditions + "</select></label>" +
    '<label class="field"><span class="field__label">Giá niêm yết đã thống nhất (₫)</span><input class="field__input" type="number" name="listPrice" min="50000" step="1000" value="' + card.askingPrice + '"></label>' +
    "</div>" +
    '<label class="field"><span class="field__label">Ảnh chụp tại cửa hàng (1–4 ảnh, bắt buộc khi Đạt)</span><input class="input" type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple></label>' +
    '<label class="field"><span class="field__label">Lý do từ chối (khi Không đạt)</span><input class="field__input" type="text" name="rejectReason" maxlength="300" placeholder="vd: Nghi thẻ giả; tình trạng HP người bán không đồng ý giá"></label>' +
    '<p class="field__error" aria-live="polite"></p>' +
    '<div class="verify-form__actions"><button type="submit" name="result" value="pass" class="btn btn--primary btn--sm"><span class="icon" aria-hidden="true">verified</span> Đạt · đăng bán</button>' +
    '<button type="submit" name="result" value="reject" class="btn btn--soft btn--sm btn--danger">Từ chối</button></div></form>'
  );
}

function adminListingHtml(card) {
  const sellerImages = card.images.filter(function (image) {
    return image.source === "seller";
  });
  let side = "";
  if (card.status === "pending") side = verifyFormHtml(card);
  else if (adminView === "settle") {
    side =
      '<dl class="my-listing__money">' +
      "<div><dt>Giá bán</dt><dd>" + formatVND(card.finalPrice) + "</dd></div>" +
      "<div><dt>Hoa hồng JadeCard</dt><dd>" + formatVND(card.commission) + "</dd></div>" +
      '<div class="my-listing__payout"><dt>Trả người bán</dt><dd>' + formatVND(card.payout) + "</dd></div></dl>" +
      '<button type="button" class="btn btn--primary btn--sm" data-settle="' + card.id + '"><span class="icon" aria-hidden="true">payments</span> Đã trả tiền tại quầy</button>';
  } else {
    side = '<p class="admin-listing__price">' + formatVND(card.price) + "</p>" + (card.orderCode ? '<p class="field__hint">Đơn ' + escapeHtml(card.orderCode) + "</p>" : "");
  }

  return (
    '<article class="admin-listing">' +
    '<div class="admin-listing__card">' +
    '<p class="mono text-cyan">' + escapeHtml(card.code) + '</p>' +
    '<h2 class="my-listing__name">' + escapeHtml(card.cardName) + "</h2>" +
    '<p class="my-listing__meta">' + escapeHtml(card.setName + " · " + card.cardNumber + " · " + card.variantLabel) + "</p>" +
    '<p class="my-listing__meta">Người bán: ' + userLinkHtml(card.seller) + " · khai <strong>" + escapeHtml(card.conditionDeclared) + "</strong> · mong muốn " + formatVND(card.askingPrice) + "</p>" +
    '<p class="my-listing__status"><span class="status status--' + card.status + '">' + escapeHtml(card.statusLabel) + "</span>" +
    (card.status === "pending" ? " Hạn mang thẻ đến: " + formatDate(card.verifyDeadline) : "") + "</p>" +
    (card.description ? '<p class="field__hint">“' + escapeHtml(card.description) + "”</p>" : "") +
    '<div class="admin-listing__photos"><img src="' + escapeHtml(listingImage(card.image)) + '" alt="Ảnh thẻ trên TCGdex" title="Ảnh chuẩn TCGdex">' +
    sellerImages
      .map(function (image, i) {
        return '<a href="' + escapeHtml(image.path) + '" target="_blank"><img src="' + escapeHtml(image.path) + '" alt="Ảnh người bán ' + (i + 1) + '"></a>';
      })
      .join("") +
    "</div></div>" +
    '<div class="admin-listing__side">' + side + "</div></article>"
  );
}

async function loadAdminListings() {
  const query = new URLSearchParams({ view: adminView });
  const code = document.getElementById("code-search").value.trim();
  if (code) query.set("q", code);
  document.querySelectorAll("[data-view]").forEach(function (tab) {
    tab.setAttribute("aria-selected", String(tab.dataset.view === adminView));
  });
  try {
    const data = await apiGet("/api/admin/listings?" + query);
    adminListingsBox.innerHTML = data.listings.length
      ? data.listings.map(adminListingHtml).join("")
      : '<p class="empty-note">' + (code ? "Không tìm thấy tin " + escapeHtml(code) + " ở mục này." : "Không có tin nào.") + "</p>";
  } catch (error) {
    adminListingsBox.innerHTML = loadErrorHtml(error);
  }
}

document.getElementById("admin-tabs").addEventListener("click", function (event) {
  const tab = event.target.closest("[data-view]");
  if (!tab) return;
  adminView = tab.dataset.view;
  loadAdminListings();
});

document.getElementById("code-form").addEventListener("submit", function (event) {
  event.preventDefault();
  loadAdminListings();
});

// ---------- F44: gửi biên bản kiểm định ----------
adminListingsBox.addEventListener("submit", async function (event) {
  const form = event.target.closest("[data-verify]");
  if (!form) return;
  event.preventDefault();
  const result = event.submitter ? event.submitter.value : "pass";
  const errorBox = form.querySelector(".field__error");
  errorBox.textContent = "";

  const data = new FormData();
  data.append("result", result);
  data.append("authentic", form.querySelector("input[name=authentic]:checked").value);
  data.append("conditionVerified", form.elements.conditionVerified.value);
  data.append("listPrice", form.elements.listPrice.value);
  data.append("rejectReason", form.elements.rejectReason.value);
  Array.from(form.elements.images.files).forEach(function (file) {
    data.append("images", file);
  });

  try {
    await apiPost("/api/admin/listings/" + form.dataset.verify + "/verify", data);
    showToast(result === "pass" ? "Đã kiểm định đạt, tin chuyển sang Đang bán." : "Đã từ chối tin.");
    loadAdminListings();
  } catch (error) {
    errorBox.textContent = error.message;
  }
});

// ---------- F49: tất toán ----------
adminListingsBox.addEventListener("click", async function (event) {
  const button = event.target.closest("[data-settle]");
  if (!button || !window.confirm("Xác nhận đã trả tiền cho người bán tại quầy?")) return;
  button.disabled = true;
  try {
    const result = await apiPost("/api/admin/listings/" + button.dataset.settle + "/settle");
    showToast("Đã tất toán " + formatVND(result.payout) + " cho người bán.");
    loadAdminListings();
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
});

requireStaffPage(["admin"]).then(function (ok) {
  if (ok) loadAdminListings();
});
