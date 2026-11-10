// ======================================================================
// TẠO TOPIC MỚI (F37) — new-thread.html?f=F368
// Chọn forum, tag tiền tố, tiêu đề, nội dung, tối đa 4 ảnh.
// Phải đăng nhập (đã xác thực email). F100 chỉ Admin được mở topic.
// Tag "Mua bán" phải gắn một tin ký gửi của chính mình (F50); mở kèm ?listing=12 thì chọn sẵn.
// Nút "Gắn thẻ / bộ": tìm thẻ hoặc bộ pack rồi chèn #hashtag vào nội dung (js/hashtag.js).
// Cần: js/auth-forms.js, js/post-editor.js, js/card-service.js, js/hashtag.js
// ======================================================================
const threadForm = document.getElementById("thread-form");
const forumSelect = document.getElementById("forum");
const prefixList = document.getElementById("prefix-list");
const titleInput = document.getElementById("title");

const threadEditor = setupPostEditor({
  textarea: document.getElementById("content"),
  boldButton: document.getElementById("bold-button"),
  fileInput: document.getElementById("images"),
  preview: document.getElementById("image-preview"),
  imagesError: document.getElementById("images-error"),
});

setupTagPicker({
  button: document.getElementById("tag-button"),
  textarea: document.getElementById("content"),
  editor: threadForm.querySelector(".editor"),
});

titleInput.addEventListener("input", function () {
  document.getElementById("title-count").textContent = titleInput.value.trim().length + "/120";
});

// Vẽ các tag tiền tố của forum đang chọn (dạng nút radio)
async function loadPrefixes(code) {
  prefixList.innerHTML = '<p class="field__hint">Đang tải tag…</p>';
  const data = await apiGet("/api/forums/" + encodeURIComponent(code) + "/threads");
  const wantListing = getQueryParam("listing");
  prefixList.innerHTML = data.prefixes
    .map(function (prefix, index) {
      const checked = wantListing ? prefix.requiresListing : index === 0;
      return (
        '<label class="prefix-option">' +
        '<input type="radio" name="prefixId" value="' + prefix.id + '" data-requires-listing="' + prefix.requiresListing + '"' + (checked ? " checked" : "") + ">" +
        prefixHtml(prefix) +
        (prefix.requiresListing ? ' <span class="prefix-option__note">gắn tin ký gửi</span>' : "") +
        "</label>"
      );
    })
    .join("");
  updateListingField();
}

// ---------- F50: chọn tin ký gửi khi tag là Mua bán ----------
let attachableLoaded = false;

async function updateListingField() {
  const checked = prefixList.querySelector("input[name=prefixId]:checked");
  const needs = Boolean(checked && checked.dataset.requiresListing === "true");
  document.getElementById("listing-field").classList.toggle("hidden", !needs);
  if (!needs || attachableLoaded) return;
  attachableLoaded = true;

  const select = document.getElementById("listingId");
  const data = await apiGet("/api/my/attachable-listings");
  if (!data.listings.length) {
    select.innerHTML = '<option value="">Bạn chưa có tin ký gửi nào chưa gắn topic</option>';
    document.getElementById("listing-hint").innerHTML = 'Muốn rao bán, hãy <a class="text-cyan" href="new-listing.html">đăng tin ký gửi</a> trước. Mua bán chỉ qua Ký gửi JadeCard.';
    return;
  }
  select.innerHTML = data.listings
    .map(function (card) {
      return '<option value="' + card.id + '">' + escapeHtml(card.code + " · " + card.cardName + " " + card.cardNumber + " · " + formatVND(card.price) + " · " + card.statusLabel) + "</option>";
    })
    .join("");
  const wanted = getQueryParam("listing");
  if (wanted && data.listings.some((card) => String(card.id) === wanted)) select.value = wanted;
  // Gợi ý tiêu đề từ tin đã chọn nếu người dùng chưa gõ
  if (!titleInput.value) {
    const card = data.listings.find((item) => String(item.id) === select.value);
    titleInput.value = "[Mua bán] " + card.cardName + " · " + card.setName + " · " + card.cardNumber + " — " + card.condition;
    titleInput.dispatchEvent(new Event("input"));
  }
}

prefixList.addEventListener("change", updateListingField);

async function initNewThread() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.replace("login.html?next=" + encodeURIComponent(currentPageForNext()));
    return;
  }

  try {
    const data = await apiGet("/api/forum");
    // Forum chỉ Admin đăng (F100) thì người khác không thấy trong danh sách chọn
    const forums = data.forums.filter(function (forum) {
      return !forum.staffOnly || user.role === "admin";
    });
    forumSelect.innerHTML = forums
      .map(function (forum) {
        return '<option value="' + forum.code + '">' + escapeHtml(forum.code + " · " + forum.name) + "</option>";
      })
      .join("");

    const wanted = (getQueryParam("f") || "").toUpperCase();
    if (forums.some((forum) => forum.code === wanted)) forumSelect.value = wanted;
    await loadPrefixes(forumSelect.value);
    threadForm.classList.remove("hidden");
    document.getElementById("cancel-link").href = "forum-view.html?f=" + forumSelect.value;
  } catch (error) {
    document.getElementById("new-thread-loading").innerHTML = loadErrorHtml(error);
    return;
  }
  document.getElementById("new-thread-loading").classList.add("hidden");
}

forumSelect.addEventListener("change", function () {
  loadPrefixes(forumSelect.value);
  document.getElementById("cancel-link").href = "forum-view.html?f=" + forumSelect.value;
});

threadForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearFormErrors(threadForm);

  const title = titleInput.value.trim();
  const content = document.getElementById("content").value.trim();
  const checkedPrefix = threadForm.querySelector("input[name=prefixId]:checked");
  let ok = true;
  if (!checkedPrefix) {
    setFieldError("prefixId", "Vui lòng chọn tag cho topic.");
    ok = false;
  }
  if (title.length < 5) {
    setFieldError("title", "Tiêu đề cần ít nhất 5 ký tự.");
    ok = false;
  }
  if (!content) {
    setFieldError("content", "Vui lòng nhập nội dung.");
    ok = false;
  }
  if (!ok) return;

  const formData = new FormData();
  formData.append("prefixId", checkedPrefix.value);
  if (checkedPrefix.dataset.requiresListing === "true") formData.append("listingId", document.getElementById("listingId").value);
  formData.append("title", title);
  formData.append("content", content);
  threadEditor.getFiles().forEach(function (file) {
    formData.append("images", file);
  });

  const button = threadForm.querySelector("button[type=submit]");
  setBusy(button, true, "Đang đăng…");
  try {
    const result = await apiPost("/api/forums/" + forumSelect.value + "/threads", formData);
    window.location.href = "thread.html?id=" + result.id;
  } catch (error) {
    setBusy(button, false);
    showServerError(error);
  }
});

initNewThread();
