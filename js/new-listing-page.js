// ======================================================================
// ĐĂNG TIN KÝ GỬI (F43) — new-listing.html  (có thể mở kèm ?card=sv03.5-199&variant=holo&condition=NM)
//   Bước 1: chọn thẻ + biến thể (tra TCGdex)
//   Bước 2: tình trạng tự đánh giá, mô tả, 2–6 ảnh thật
//   Bước 3: giá mong muốn → thấy ngay hoa hồng 8% (tối thiểu 20.000 ₫) và số tiền dự kiến nhận
//   Bước 4: xác nhận → tin ở trạng thái "Chờ kiểm định", mang thẻ đến cửa hàng trong 7 ngày
// Cần: js/config.js, js/card-service.js, js/card-picker.js, js/post-editor.js, js/auth-forms.js
// ======================================================================
const listingForm = document.getElementById("listing-form");
const priceInput = document.getElementById("askingPrice");
let pickedCard = null;
let pickedVariant = null;

const picker = setupCardPicker({
  input: document.getElementById("card-search"),
  searchButton: document.getElementById("card-search-button"),
  results: document.getElementById("card-results"),
  selected: document.getElementById("card-selected"),
  onChange: function (card, variant) {
    pickedCard = card;
    pickedVariant = variant;
    setFieldError("card", "");
    updateMoney();
  },
});

const photoPicker = setupPostEditor({
  fileInput: document.getElementById("images"),
  preview: document.getElementById("image-preview"),
  imagesError: document.getElementById("images-error"),
  maxImages: 6,
});

// Bảng tiền: giá mong muốn − hoa hồng = bạn nhận tại quầy (F43)
function updateMoney() {
  const price = Number(priceInput.value) || 0;
  const money = consignMoney(price);
  document.getElementById("money-price").textContent = price ? formatVND(price) : "—";
  document.getElementById("money-fee").textContent = price ? "− " + formatVND(money.commission) : "—";
  document.getElementById("money-payout").textContent = price ? formatVND(Math.max(0, money.payout)) : "—";
  const ref = pickedVariant && pickedVariant.vnd;
  document.getElementById("money-ref").textContent = ref
    ? "Giá tham khảo quốc tế của biến thể này: " + formatVND(ref) + " (TCGplayer, chỉ để tham khảo)."
    : pickedCard ? "Biến thể này chưa có giá tham khảo quốc tế." : "";
}
priceInput.addEventListener("input", updateMoney);

listingForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearFormErrors(listingForm);

  const condition = listingForm.querySelector('input[name="condition"]:checked');
  const price = Number(priceInput.value);
  const photos = photoPicker.getFiles();
  let ok = true;
  if (!pickedCard || !pickedVariant) {
    setFieldError("card", "Vui lòng tìm và chọn thẻ.");
    ok = false;
  }
  if (!condition) {
    setFieldError("condition", "Vui lòng chọn tình trạng.");
    ok = false;
  }
  if (photos.length < 2) {
    document.getElementById("images-error").textContent = "Cần ít nhất 2 ảnh thật (mặt trước và mặt sau).";
    ok = false;
  }
  if (!Number.isInteger(price) || price < PRICE_CONFIG.minListingPrice) {
    setFieldError("askingPrice", "Giá mong muốn tối thiểu " + formatVND(PRICE_CONFIG.minListingPrice) + ".");
    ok = false;
  }
  if (!document.getElementById("agree").checked) {
    setFieldError("agree", "Bạn cần đồng ý với cách ký gửi tại cửa hàng.");
    ok = false;
  }
  if (!ok) {
    const firstError = listingForm.querySelector('[aria-invalid="true"], .field__error:not(:empty)');
    if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const formData = new FormData();
  formData.append("card", JSON.stringify({
    cardId: pickedCard.cardId,
    name: pickedCard.name,
    setName: pickedCard.setName,
    number: pickedCard.number,
    image: pickedCard.image,
  }));
  formData.append("variant", pickedVariant.key);
  formData.append("condition", condition.value);
  formData.append("askingPrice", String(price));
  if (pickedVariant.vnd) formData.append("refPrice", String(pickedVariant.vnd));
  formData.append("description", document.getElementById("description").value);
  photos.forEach(function (file) {
    formData.append("images", file);
  });

  const button = listingForm.querySelector("button[type=submit]");
  setBusy(button, true, "Đang đăng tin…");
  try {
    const result = await apiPost("/api/listings", formData);
    showDone(result);
  } catch (error) {
    setBusy(button, false);
    if (error.field === "images") document.getElementById("images-error").textContent = error.message;
    else showServerError(error);
  }
});

// Đăng xong: hiện mã tin và hướng dẫn mang thẻ đến cửa hàng
function showDone(result) {
  listingForm.classList.add("hidden");
  const box = document.getElementById("listing-done");
  box.classList.remove("hidden");
  box.innerHTML =
    '<span class="icon listing-done__icon" aria-hidden="true">task_alt</span>' +
    '<h2 class="listing-done__title">Đã tạo tin <span class="mono text-cyan">' + escapeHtml(result.code) + "</span></h2>" +
    "<p>Tin đang ở trạng thái <strong>Chờ kiểm định</strong> và chưa hiện công khai.</p>" +
    '<ol class="listing-done__steps">' +
    "<li>Mang thẻ đến <strong>123 Đường Mẫu, Quận 1, TP.HCM</strong> (dữ liệu mẫu) trước <strong>" + formatDate(result.verifyDeadline) + "</strong>, đọc mã " + escapeHtml(result.code) + " cho nhân viên.</li>" +
    "<li>JadeCard kiểm định tận tay trước mặt bạn, hai bên thống nhất giá niêm yết. Shop giữ thẻ và đăng bán với huy hiệu <strong>JadeCard đã xác thực</strong>.</li>" +
    "<li>Thẻ bán xong, bạn nhận tiền tại quầy sau khi trừ hoa hồng (dự kiến nhận <strong>" + formatVND(result.payout) + "</strong> nếu bán đúng giá mong muốn).</li></ol>" +
    '<div class="listing-done__actions"><a class="btn btn--primary btn--sm" href="my-listings.html">Tin ký gửi của tôi</a>' +
    '<a class="btn btn--soft btn--sm" href="new-thread.html?f=F368&listing=' + result.id + '">Mở topic Mua bán trong F368</a></div>';
  box.scrollIntoView({ behavior: "smooth" });
}

async function initNewListing() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.replace("login.html?next=" + encodeURIComponent(currentPageForNext()));
    return;
  }
  // Mở từ Bộ sưu tập ("Ký gửi thẻ này"): điền sẵn thẻ, biến thể, tình trạng
  const cardId = getQueryParam("card");
  if (cardId) {
    await picker.preselect(cardId);
    if (getQueryParam("variant")) picker.selectVariant(getQueryParam("variant"));
    const condition = listingForm.querySelector('input[name="condition"][value="' + getQueryParam("condition") + '"]');
    if (condition) condition.checked = true;
  }
  updateMoney();
}

initNewListing();
