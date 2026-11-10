// ======================================================================
// XEM TOPIC (F36), TRẢ LỜI / TRÍCH DẪN / SỬA (F38), LIKE (F39) — thread.html?id=12&page=2
// 20 bài mỗi trang. Khung tác giả có avatar, tên, tag chức vụ, số bài, số like.
// Cần: js/auth-forms.js (báo lỗi ô nhập), js/post-editor.js (ô soạn bài).
// Từ đợt Ký gửi: thẻ sản phẩm ở đầu topic Mua bán (F50), link tin ký gửi tự hiện thành thẻ (F51),
// nút Báo cáo bài và công cụ Mod: ghim / khóa / ẩn topic, ẩn bài (F42).
// Hashtag thẻ / bộ (#PikachuEx_SV08_238): thành link + thẻ mời mua nếu shop có bán (js/hashtag.js).
// ======================================================================
const threadId = Number(getQueryParam("id"));
const threadPage = Number(getQueryParam("page")) || 1;
let threadData = null; // dữ liệu topic đang hiển thị (dùng lại khi trích dẫn, sửa bài)
let viewer = null; // người đang xem (null = khách)
let shownOffers = new Set(); // thẻ mời mua đã hiện trên trang (mỗi sản phẩm chỉ mời một lần)

function threadUrl(page) {
  return "thread.html?id=" + threadId + (page > 1 ? "&page=" + page : "");
}

function joinedLabel(isoString) {
  const date = new Date(isoString);
  return String(date.getMonth() + 1).padStart(2, "0") + "/" + date.getFullYear();
}

// ---------- Vẽ ----------

function threadHeadHtml(data) {
  const thread = data.thread;
  return (
    '<div class="thread-head__tags">' + prefixHtml(thread.prefix) +
    (thread.pinned ? ' <span class="tag tag--yellow"><span class="icon icon--base" aria-hidden="true">push_pin</span> Ghim</span>' : "") +
    (thread.locked ? ' <span class="tag"><span class="icon icon--base" aria-hidden="true">lock</span> Đã khóa</span>' : "") +
    (thread.hidden ? ' <span class="tag tag--yellow">Đã ẩn</span>' : "") +
    (thread.listing && thread.listing.sold ? ' <span class="badge badge--sold">Đã bán</span>' : "") +
    "</div>" +
    '<h1 class="thread-head__title">' + escapeHtml(thread.title) + "</h1>" +
    '<p class="thread-head__meta">' +
    '<span><span class="icon" aria-hidden="true">person</span> ' + userLinkHtml(thread.author) + "</span>" +
    '<span><span class="icon" aria-hidden="true">schedule</span> ' + timeHtml(thread.createdAt) + "</span>" +
    '<span><span class="icon" aria-hidden="true">forum</span> ' + formatNumber(thread.replyCount) + " trả lời</span>" +
    '<span><span class="icon" aria-hidden="true">visibility</span> ' + formatNumber(thread.viewCount) + " lượt xem</span>" +
    "</p>" +
    (data.canModerate ? modToolbarHtml(thread) : "")
  );
}

// Công cụ Mod / Admin cho topic (F42)
function modToolbarHtml(thread) {
  const button = function (action, icon, label) {
    return '<button type="button" class="btn btn--soft btn--sm" data-moderate-thread="' + action + '"><span class="icon" aria-hidden="true">' + icon + "</span> " + label + "</button>";
  };
  return (
    '<div class="mod-toolbar"><span class="mod-toolbar__label"><span class="icon" aria-hidden="true">shield_person</span> Kiểm duyệt</span>' +
    (thread.pinned ? button("unpin", "keep_off", "Bỏ ghim") : button("pin", "push_pin", "Ghim")) +
    (thread.locked ? button("unlock", "lock_open", "Mở khóa") : button("lock", "lock", "Khóa topic")) +
    (thread.hidden ? button("unhide", "visibility", "Hiện topic") : button("hide", "visibility_off", "Ẩn topic")) +
    "</div>"
  );
}

// Thẻ sản phẩm ở đầu MỌI trang của topic Mua bán, luôn theo trạng thái mới nhất của tin (F50)
function listingBannerHtml(card) {
  const buyable = card.status === "active" && !(viewer && viewer.id === card.seller.id);
  let action = '<a class="btn btn--soft btn--sm" href="' + listingUrl(card) + '">Xem tin ký gửi</a>';
  if (buyable) action = '<button type="button" class="btn btn--primary btn--sm" data-add-banner><span class="icon" aria-hidden="true">add_shopping_cart</span> Thêm vào giỏ</button>' + action;
  return (
    '<div class="listing-banner' + (card.status === "sold" || card.status === "settled" ? " listing-banner--sold" : "") + '">' +
    '<a class="listing-banner__img" href="' + listingUrl(card) + '"><img src="' + escapeHtml(listingImage(card.image)) + '" alt="' + escapeHtml(card.cardName) + '"></a>' +
    '<div class="listing-banner__info">' + listingBadgeHtml(card) +
    '<p class="listing-banner__name">' + escapeHtml(card.cardName) + "</p>" +
    '<p class="listing-banner__meta">' + escapeHtml(card.setName + " · " + card.cardNumber + " · " + card.variantLabel) + " · Tình trạng: <strong>" + escapeHtml(card.condition) + "</strong></p>" +
    '<p class="listing-banner__meta">Người bán: ' + userLinkHtml(card.seller) + ' <span class="user-tags">' + rankTagsHtml(card.seller) + "</span> · " + escapeHtml(card.code) + "</p></div>" +
    '<div class="listing-banner__buy"><p class="listing-banner__label">' + escapeHtml(card.statusLabel) + '</p><p class="listing-banner__price">' + formatVND(card.price) + "</p>" +
    '<div class="listing-banner__actions">' + action + "</div></div></div>"
  );
}

function likeButtonHtml(post) {
  const isOwn = viewer && viewer.id === post.author.id;
  const label = post.likedByMe ? "Đã thích" : "Thích";
  return (
    '<button type="button" class="post-action post-action--like' + (post.likedByMe ? " is-liked" : "") + '" data-like="' + post.id + '"' +
    ' aria-pressed="' + post.likedByMe + '"' + (isOwn ? ' disabled title="Không thể tự like bài của mình"' : "") + ">" +
    '<span class="icon" aria-hidden="true">favorite</span> <span data-like-label>' + label + "</span> (<span data-like-count>" + formatNumber(post.likeCount) + "</span>)</button>"
  );
}

function postHtml(post) {
  const author = post.author;
  const images = post.images.length
    ? '<div class="post__images">' +
      post.images
        .map(function (src, i) {
          return '<a href="' + src + '" target="_blank"><img src="' + src + '" alt="Ảnh ' + (i + 1) + " của bài #" + post.number + '" loading="lazy"></a>';
        })
        .join("") +
      "</div>"
    : "";

  return (
    '<article class="post' + (post.hidden ? " post--hidden" : "") + '" id="post-' + post.id + '">' +
    '<aside class="post__author">' +
    '<a class="post__avatar" href="' + profileUrl(author) + '">' + avatarHtml(author, "lg") + "</a>" +
    '<div class="post__who">' + userLinkHtml(author) + '<span class="user-tags">' + rankTagsHtml(author) + "</span></div>" +
    '<dl class="post__stats">' +
    "<div><dt>Tham gia</dt><dd>" + joinedLabel(author.joinedAt) + "</dd></div>" +
    "<div><dt>Bài viết</dt><dd>" + formatNumber(author.postCount) + "</dd></div>" +
    '<div><dt>Lượt thích</dt><dd class="text-cyan">' + formatNumber(author.likesReceived) + "</dd></div>" +
    "</dl>" +
    "</aside>" +
    '<div class="post__body">' +
    '<div class="post__meta">' +
    '<span><span class="icon" aria-hidden="true">schedule</span> ' + timeHtml(post.createdAt) + "</span>" +
    (post.editedAt ? '<span class="post__edited" title="' + formatDateTime(post.editedAt) + '">đã sửa</span>' : "") +
    (post.hidden ? '<span class="tag tag--yellow">Đã ẩn</span>' : "") +
    '<a class="post__num" href="#post-' + post.id + '">#' + post.number + (post.isFirst ? " · Chủ thớt" : "") + "</a>" +
    "</div>" +
    '<div class="post__content" data-content>' + formatPostContent(post.content, post.tags) + "</div>" +
    images +
    '<div data-shop>' + postShopHtml(post.tags, threadData.listingStats, shownOffers) + "</div>" +
    '<div class="post__actions">' +
    likeButtonHtml(post) +
    '<span class="post__actions-right">' +
    (post.canEdit ? '<button type="button" class="post-action" data-edit="' + post.id + '"><span class="icon" aria-hidden="true">edit</span> Sửa</button>' : "") +
    (threadData.canModerate && !post.isFirst
      ? '<button type="button" class="post-action" data-moderate-post="' + post.id + '" data-hidden="' + post.hidden + '"><span class="icon" aria-hidden="true">' +
        (post.hidden ? "visibility" : "visibility_off") + "</span> " + (post.hidden ? "Hiện bài" : "Ẩn bài") + "</button>"
      : "") +
    (post.canReport ? '<button type="button" class="post-action" data-report="' + post.id + '"><span class="icon" aria-hidden="true">flag</span> Báo cáo</button>' : "") +
    '<button type="button" class="post-action" data-quote="' + post.id + '"><span class="icon" aria-hidden="true">format_quote</span> Trích dẫn</button>' +
    '<button type="button" class="post-action" data-reply><span class="icon" aria-hidden="true">reply</span> Trả lời</button>' +
    "</span></div>" +
    "</div>" +
    "</article>"
  );
}

function renderThread(data) {
  threadData = data;
  document.title = data.thread.title + " — Diễn đàn JadeCard";
  document.getElementById("thread-crumb").innerHTML =
    '<a href="forum.html">Diễn đàn</a> / <a href="forum-view.html?f=' + data.forum.code + '">' + escapeHtml(data.forum.code + " " + data.forum.name) + "</a> / " +
    '<span class="breadcrumb__current">' + escapeHtml(data.thread.title) + "</span>";
  document.getElementById("thread-head").innerHTML = threadHeadHtml(data);
  document.getElementById("thread-listing").innerHTML = data.listing ? listingBannerHtml(data.listing) : "";
  shownOffers = new Set();
  document.getElementById("post-list").innerHTML = data.posts.map(postHtml).join("");
  renderListingEmbeds(document.getElementById("post-list")); // F51

  const pages = paginationHtml(data.page, data.pageCount, threadUrl);
  document.getElementById("pagination-top").innerHTML = pages;
  document.getElementById("pagination-bottom").innerHTML = pages;

  renderComposerState(data);

  // Mở link có #post-123 → cuộn tới đúng bài
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) target.scrollIntoView();
  }
}

function renderComposerState(data) {
  const loginBox = document.getElementById("composer-login");
  const lockedBox = document.getElementById("composer-locked");
  const form = document.getElementById("reply-form");
  loginBox.classList.add("hidden");
  lockedBox.classList.add("hidden");
  form.classList.add("hidden");

  if (data.thread.locked) {
    lockedBox.classList.remove("hidden");
  } else if (!viewer) {
    const next = encodeURIComponent(currentPageForNext());
    loginBox.innerHTML =
      '<span class="icon" aria-hidden="true">lock_open</span> <span>Bạn cần <a href="login.html?next=' + next + '">đăng nhập</a> hoặc <a href="register.html?next=' + next + '">đăng ký</a> để trả lời và like bài viết.</span>';
    loginBox.classList.remove("hidden");
  } else {
    form.classList.remove("hidden");
  }
}

// ---------- Tải dữ liệu ----------

async function loadThread() {
  if (!threadId) {
    document.getElementById("post-list").innerHTML = loadErrorHtml(new Error("Đường dẫn thiếu mã topic."));
    return;
  }
  try {
    const result = await Promise.all([apiGet("/api/threads/" + threadId + "?page=" + threadPage), getCurrentUser()]);
    viewer = result[1];
    renderThread(result[0]);
  } catch (error) {
    document.getElementById("post-list").innerHTML = loadErrorHtml(error);
    document.getElementById("composer").classList.add("hidden");
  }
}

function findPost(id) {
  return threadData.posts.find(function (post) {
    return post.id === id;
  });
}

// ---------- Like (F39) ----------
async function toggleLike(button) {
  if (!viewer) {
    window.location.href = "login.html?next=" + encodeURIComponent(currentPageForNext());
    return;
  }
  const post = findPost(Number(button.dataset.like));
  button.disabled = true;
  try {
    const result = await apiPost("/api/posts/" + post.id + "/like");
    post.likedByMe = result.liked;
    post.likeCount = result.likeCount;
    button.classList.toggle("is-liked", result.liked);
    button.setAttribute("aria-pressed", String(result.liked));
    button.querySelector("[data-like-label]").textContent = result.liked ? "Đã thích" : "Thích";
    button.querySelector("[data-like-count]").textContent = formatNumber(result.likeCount);
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
}

// ---------- Trích dẫn + Trả lời (F38) ----------
function focusComposer(textToAdd) {
  const textarea = document.getElementById("content");
  if (document.getElementById("reply-form").classList.contains("hidden")) {
    document.getElementById("composer").scrollIntoView({ behavior: "smooth" });
    return;
  }
  if (textToAdd) {
    textarea.value = (textarea.value ? textarea.value.trimEnd() + "\n" : "") + textToAdd;
  }
  textarea.scrollIntoView({ behavior: "smooth", block: "center" });
  textarea.focus();
}

// ---------- Sửa bài của mình (F38) ----------
function startEdit(postId) {
  const post = findPost(postId);
  const article = document.getElementById("post-" + postId);
  const contentBox = article.querySelector("[data-content]");
  if (article.querySelector(".post-edit")) return; // đang sửa rồi

  const form = document.createElement("form");
  form.className = "post-edit";
  form.innerHTML =
    '<label class="sr-only" for="edit-' + postId + '">Sửa nội dung bài #' + post.number + "</label>" +
    '<textarea id="edit-' + postId + '" class="textarea" maxlength="10000"></textarea>' +
    '<p class="field__error" aria-live="polite"></p>' +
    '<div class="post-edit__actions"><button type="button" class="btn btn--soft btn--sm" data-cancel>Hủy</button>' +
    '<button type="submit" class="btn btn--primary btn--sm">Lưu</button></div>';
  form.querySelector("textarea").value = post.content;
  contentBox.classList.add("hidden");
  contentBox.after(form);
  form.querySelector("textarea").focus();

  form.querySelector("[data-cancel]").addEventListener("click", function () {
    form.remove();
    contentBox.classList.remove("hidden");
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const result = await apiRequest("PATCH", "/api/posts/" + postId, { content: form.querySelector("textarea").value });
      post.content = result.content;
      post.editedAt = result.editedAt;
      post.tags = result.tags;
      contentBox.innerHTML = formatPostContent(result.content, result.tags);
      article.querySelector("[data-shop]").innerHTML = postShopHtml(result.tags, result.listingStats, null);
      form.remove();
      contentBox.classList.remove("hidden");
      showToast("Đã lưu bài viết.");
    } catch (error) {
      button.disabled = false;
      form.querySelector(".field__error").textContent = error.message;
    }
  });
}

// Một trình nghe sự kiện cho cả danh sách bài (không phải gắn cho từng nút)
document.getElementById("post-list").addEventListener("click", function (event) {
  const likeButton = event.target.closest("[data-like]");
  const quoteButton = event.target.closest("[data-quote]");
  const editButton = event.target.closest("[data-edit]");
  if (likeButton) toggleLike(likeButton);
  if (quoteButton) {
    const post = findPost(Number(quoteButton.dataset.quote));
    focusComposer(makeQuote(post.author.displayName, post.content));
  }
  if (event.target.closest("[data-reply]")) focusComposer("");
  if (editButton) startEdit(Number(editButton.dataset.edit));

  const reportButton = event.target.closest("[data-report]");
  if (reportButton) openReportDialog(Number(reportButton.dataset.report));

  const hideButton = event.target.closest("[data-moderate-post]");
  if (hideButton) {
    const action = hideButton.dataset.hidden === "true" ? "unhide" : "hide";
    moderate("/api/posts/" + hideButton.dataset.moderatePost + "/moderate", action);
  }
});

// ---------- Công cụ Mod (F42) ----------
async function moderate(url, action) {
  try {
    await apiPost(url, { action: action });
    showToast("Đã cập nhật.");
    loadThread();
  } catch (error) {
    showToast(error.message);
  }
}

document.getElementById("thread-head").addEventListener("click", function (event) {
  const button = event.target.closest("[data-moderate-thread]");
  if (button) moderate("/api/threads/" + threadId + "/moderate", button.dataset.moderateThread);
});

// Thẻ sản phẩm đầu topic: thêm tin ký gửi vào giỏ (F47)
document.getElementById("thread-listing").addEventListener("click", function (event) {
  if (!event.target.closest("[data-add-banner]")) return;
  const card = threadData.listing;
  if (addListingToCart(card, card.price)) {
    bumpCartBadge();
    showToast('Đã thêm "' + card.cardName + '" vào giỏ', true);
  } else {
    showToast("Thẻ này đã có trong giỏ", true);
  }
});

// ---------- Báo cáo bài (F42) ----------
const reportDialog = document.getElementById("report-dialog");
let reportPostId = null;

function openReportDialog(postId) {
  reportPostId = postId;
  document.getElementById("report-reason").innerHTML = threadData.reportReasons
    .map(function (reason) {
      return '<option value="' + escapeHtml(reason) + '">' + escapeHtml(reason) + "</option>";
    })
    .join("");
  document.getElementById("report-note").value = "";
  document.getElementById("report-error").textContent = "";
  reportDialog.showModal();
}

document.getElementById("report-cancel").addEventListener("click", function () {
  reportDialog.close();
});

document.getElementById("report-form").addEventListener("submit", async function (event) {
  event.preventDefault();
  try {
    await apiPost("/api/posts/" + reportPostId + "/report", {
      reason: document.getElementById("report-reason").value,
      note: document.getElementById("report-note").value,
    });
    reportDialog.close();
    showToast("Đã gửi báo cáo. Cảm ơn bạn, Mod sẽ xem xét.");
  } catch (error) {
    document.getElementById("report-error").textContent = error.message;
  }
});

// ---------- Gửi trả lời ----------
const replyForm = document.getElementById("reply-form");
setupTagPicker({
  button: document.getElementById("tag-button"),
  textarea: document.getElementById("content"),
  editor: replyForm.querySelector(".editor"),
});
const replyEditor = setupPostEditor({
  textarea: document.getElementById("content"),
  boldButton: document.getElementById("bold-button"),
  fileInput: document.getElementById("images"),
  preview: document.getElementById("image-preview"),
  imagesError: document.getElementById("images-error"),
});

replyForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  setFieldError("content", "");
  const content = document.getElementById("content").value.trim();
  if (!content) {
    setFieldError("content", "Vui lòng nhập nội dung trả lời.");
    return;
  }

  // Có ảnh nên gửi bằng FormData (multipart) thay vì JSON
  const formData = new FormData();
  formData.append("content", content);
  replyEditor.getFiles().forEach(function (file) {
    formData.append("images", file);
  });

  const button = replyForm.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const result = await apiPost("/api/threads/" + threadId + "/posts", formData);
    replyEditor.reset();
    // Sang trang chứa bài vừa đăng và cuộn tới bài đó
    if (result.page === threadData.page) {
      window.location.hash = "post-" + result.postId;
      window.location.reload(); // cùng trang: chỉ đổi # thì trình duyệt không tải lại, nên tải lại thủ công
    } else {
      window.location.href = threadUrl(result.page) + "#post-" + result.postId;
    }
  } catch (error) {
    button.disabled = false;
    if (error.field === "images") document.getElementById("images-error").textContent = error.message;
    else setFieldError("content", error.message);
  }
});

loadThread();
