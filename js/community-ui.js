// ======================================================================
// CÁC MẢNH GIAO DIỆN DÙNG CHUNG CHO TÀI KHOẢN VÀ DIỄN ĐÀN
// avatar, tag chức vụ, tên thành viên, thời gian, nội dung bài viết, phân trang
//
// Quy tắc an toàn (chống XSS): mọi chữ do người dùng nhập đều đi qua escapeHtml()
// trước khi chèn vào HTML. Không bao giờ chèn thẳng chữ người dùng vào innerHTML.
// ======================================================================

// Đổi các ký tự đặc biệt của HTML thành dạng an toàn: <script> → &lt;script&gt;
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatNumber(number) {
  return Number(number).toLocaleString("vi-VN");
}

// ---------- Thành viên ----------

function profileUrl(user) {
  return "profile.html?u=" + encodeURIComponent(user.displayName);
}

// Avatar = chữ cái đầu của tên trên nền màu. Màu tính từ id nên mỗi người một màu cố định.
function avatarHtml(user, size) {
  const hue = (user.id * 47) % 360;
  const initial = escapeHtml(user.displayName.charAt(0).toUpperCase());
  return '<span class="avatar avatar--' + (size || "md") + '" style="--avatar-hue: ' + hue + '" aria-hidden="true">' + initial + "</span>";
}

// Tag nhân viên (Admin, Mod JadeCard) + tag chức vụ (F40)
function rankTagsHtml(user) {
  let html = "";
  if (user.staffTag) {
    html += '<span class="staff-tag staff-tag--' + user.role + '">' + escapeHtml(user.staffTag) + "</span>";
  }
  html += '<span class="rank-tag rank-tag--' + user.rank.level + '">' + escapeHtml(user.rank.name) + "</span>";
  return html;
}

// Tên thành viên có link sang hồ sơ (F41: bấm tên hoặc avatar ở bất kỳ đâu đều mở hồ sơ)
function userLinkHtml(user) {
  return '<a class="user-link" href="' + profileUrl(user) + '">' + escapeHtml(user.displayName) + "</a>";
}

// ---------- Thời gian ----------

// "vừa xong", "5 phút trước", "3 giờ trước", "2 ngày trước", quá 30 ngày thì hiện ngày
function timeAgo(isoString) {
  const seconds = Math.max(0, (Date.now() - Date.parse(isoString)) / 1000);
  if (seconds < 60) return "vừa xong";
  if (seconds < 3600) return Math.floor(seconds / 60) + " phút trước";
  if (seconds < 86400) return Math.floor(seconds / 3600) + " giờ trước";
  if (seconds < 30 * 86400) return Math.floor(seconds / 86400) + " ngày trước";
  return formatDate(isoString);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

// <time> có title là ngày giờ đầy đủ (rê chuột vào để xem)
function timeHtml(isoString) {
  return '<time datetime="' + isoString + '" title="' + formatDateTime(isoString) + '">' + timeAgo(isoString) + "</time>";
}

// ---------- Diễn đàn ----------

// Tag tiền tố của topic: [Bóc thẻ], [Định giá], [Mua bán]...
function prefixHtml(prefix) {
  if (!prefix) return "";
  return '<span class="prefix prefix--' + prefix.color + '">' + escapeHtml(prefix.name) + "</span>";
}

// ---------- Hashtag thẻ / bộ thẻ (#PikachuEx_SV08_238, #SurgingSparks) ----------

function tagUrl(tag) {
  return "tag.html?t=" + encodeURIComponent(tag.slug);
}

// Chữ hiển thị của hashtag: "Pikachu ex 238/191" (thẻ) hoặc "Surging Sparks" (bộ)
function hashtagText(tag) {
  return tag.kind === "card" ? tag.name + " " + (tag.number || "") : tag.name;
}

// Ảnh của hashtag: ảnh thẻ (TCGdex cần thêm đuôi) hoặc logo bộ
function tagImageUrl(tag, quality) {
  if (!tag.image) return "";
  if (/^https:\/\/assets\.tcgdex\.net\//.test(tag.image)) {
    return tag.image + (tag.kind === "set" ? ".png" : "/" + (quality || "low") + ".webp");
  }
  return tag.image;
}

// Shop có bán thẻ này, hoặc pack / box của bộ chứa thẻ này không (đọc js/data/products.js)
function shopHasTag(tag) {
  if (typeof products === "undefined") return false;
  return products.some(function (product) {
    if (tag.kind === "card") return product.cardId === tag.ref || (!product.cardId && product.setId === tag.setId);
    return product.setId === tag.ref;
  });
}

// Link hashtag trong bài: bấm vào mở trang hashtag (tag.html). Có biểu tượng cửa hàng nếu shop có bán.
function hashtagLinkHtml(tag) {
  const shop = shopHasTag(tag);
  const title = "#" + tag.slug + (tag.kind === "card" ? " · " + tag.setName : " · bộ thẻ") + (shop ? " · có bán tại JadeCard" : "");
  return (
    '<a class="hashtag' + (shop ? " hashtag--shop" : "") + '" href="' + tagUrl(tag) + '" title="' + escapeHtml(title) + '">' +
    '<span class="hashtag__hash" aria-hidden="true">#</span>' + escapeHtml(hashtagText(tag)) +
    (shop ? '<span class="icon hashtag__shop" aria-hidden="true">storefront</span>' : "") + "</a>"
  );
}

// Nội dung bài viết: chữ thuần → HTML an toàn.
// Hỗ trợ: xuống dòng, **in đậm**, link http(s) tự nhận, trích dẫn [quote=Tên]...[/quote],
// hashtag thẻ / bộ (tags = các hashtag server đã nhận diện trong bài này; hashtag lạ để nguyên chữ).
function formatPostContent(text, tags) {
  let html = escapeHtml(text); // bước quan trọng nhất: lọc HTML trước, rồi mới thêm thẻ của mình

  html = html.replace(/\[quote=([\p{L}\p{N}_.]{1,20})\]([\s\S]*?)\[\/quote\]\n?/gu, function (match, name, body) {
    return '<blockquote class="post-quote"><span class="post-quote__by">' + name + " đã viết:</span>" + body.trim() + "</blockquote>";
  });
  html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  if (tags && tags.length) {
    const bySlug = {};
    tags.forEach(function (tag) {
      bySlug[tag.slug.toLowerCase()] = tag;
    });
    // Cùng quy tắc với server (server/tags.js): dấu # không đứng ngay sau chữ, số, &, /, ?, =, #
    html = html.replace(/(^|[^\p{L}\p{N}_&/?=#])#([A-Za-z0-9_]{2,60})/gu, function (match, before, slug) {
      const tag = bySlug[slug.toLowerCase()];
      return tag ? before + hashtagLinkHtml(tag) : match;
    });
  }
  html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener nofollow ugc">$1</a>');
  html = html.replace(/\n/g, "<br>");
  return html;
}

// Đoạn trích khi bấm "Trích dẫn": bỏ trích dẫn lồng bên trong, cắt ngắn còn 300 ký tự
function makeQuote(authorName, content) {
  let text = content.replace(/\[quote=[^\]]*\][\s\S]*?\[\/quote\]\s*/g, "").trim();
  if (text.length > 300) text = text.slice(0, 300) + "…";
  return "[quote=" + authorName + "]" + text + "[/quote]\n";
}

// Thanh phân trang. makeUrl(số trang) trả về đường dẫn của trang đó.
function paginationHtml(page, pageCount, makeUrl) {
  if (pageCount <= 1) return "";
  const items = [];
  const link = function (number, label, extraClass) {
    const current = number === page ? ' aria-current="page"' : "";
    return '<a class="pagination__item ' + (extraClass || "") + '" href="' + makeUrl(number) + '"' + current + ">" + label + "</a>";
  };

  if (page > 1) items.push(link(page - 1, '<span class="icon" aria-hidden="true">chevron_left</span><span class="sr-only">Trang trước</span>'));
  for (let number = 1; number <= pageCount; number++) {
    // Hiện trang đầu, trang cuối và các trang gần trang hiện tại; còn lại thay bằng "…"
    if (number === 1 || number === pageCount || Math.abs(number - page) <= 1) {
      items.push(link(number, String(number)));
    } else if (items[items.length - 1] !== '<span class="pagination__gap">…</span>') {
      items.push('<span class="pagination__gap">…</span>');
    }
  }
  if (page < pageCount) items.push(link(page + 1, '<span class="icon" aria-hidden="true">chevron_right</span><span class="sr-only">Trang sau</span>'));

  return '<nav class="pagination" aria-label="Phân trang">' + items.join("") + "</nav>";
}

// Khối báo lỗi khi không tải được dữ liệu (ví dụ chưa chạy server)
function loadErrorHtml(error) {
  return (
    '<div class="empty-state empty-state--stack"><span class="icon icon--5xl text-dim" aria-hidden="true">cloud_off</span>' +
    '<p class="empty-state__title">Không tải được dữ liệu</p><p class="empty-state__text">' + escapeHtml(error.message) + "</p></div>"
  );
}

// ======================================================================
// KÝ GỬI: thẻ tin rút gọn, nhãn trạng thái, sao đánh giá
// ======================================================================

// Ảnh thẻ: ảnh TCGdex cần thêm đuôi chất lượng, ảnh có sẵn trong dự án dùng nguyên
function listingImage(image, quality) {
  return /^https:\/\/assets\.tcgdex\.net\//.test(image) ? image + "/" + (quality || "low") + ".webp" : image;
}

function listingUrl(card) {
  return "listing.html?id=" + card.id;
}

// Nhãn trạng thái tin: "JadeCard đã xác thực", "Chưa xác thực", "ĐÃ BÁN"...
function listingBadgeHtml(card) {
  if (card.status === "sold" || card.status === "settled") return '<span class="badge badge--sold">ĐÃ BÁN</span>';
  if (card.verified) {
    return '<span class="badge badge--verified"><span class="icon" aria-hidden="true">verified</span> JadeCard đã xác thực</span>';
  }
  if (card.status === "pending") return '<span class="badge badge--pending">Chưa xác thực</span>';
  return '<span class="badge">' + escapeHtml(card.statusLabel) + "</span>";
}

// Sao đánh giá người bán (F56): "★★★★☆ 4,5 (12)"
function starsHtml(avg, count) {
  if (!count) return '<span class="stars stars--empty">Chưa có đánh giá</span>';
  const full = Math.round(avg);
  return (
    '<span class="stars" title="' + avg + ' / 5 từ ' + count + ' đánh giá">' +
    '<span class="stars__icons" aria-hidden="true">' + "★".repeat(full) + "☆".repeat(5 - full) + "</span> " +
    '<span class="stars__value">' + String(avg).replace(".", ",") + "</span> (" + count + ")</span>"
  );
}

// Thẻ tin thu nhỏ: dùng khi link tin ký gửi được dán vào bài viết (F51)
function listingMiniHtml(card) {
  return (
    '<a class="listing-mini" href="' + listingUrl(card) + '">' +
    '<img src="' + escapeHtml(listingImage(card.image)) + '" alt="" loading="lazy">' +
    '<span class="listing-mini__text">' +
    '<span class="listing-mini__name">' + escapeHtml(card.cardName) + "</span>" +
    '<span class="listing-mini__meta">' + escapeHtml(card.setName + " · " + card.cardNumber + " · " + card.condition) + "</span>" +
    '<span class="listing-mini__price">' + formatVND(card.price) + "</span>" +
    "</span>" + listingBadgeHtml(card) + "</a>"
  );
}

// Link "listing.html?id=12" trong nội dung bài viết → thẻ tin thu nhỏ (F51)
async function renderListingEmbeds(container) {
  const links = Array.from(container.querySelectorAll(".post__content a[href]")).filter(function (link) {
    return /\/listing\.html\?id=\d+$/.test(link.getAttribute("href"));
  });
  if (!links.length) return;
  const ids = links.map(function (link) {
    return link.getAttribute("href").match(/id=(\d+)$/)[1];
  });
  try {
    const data = await apiGet("/api/listing-cards?ids=" + Array.from(new Set(ids)).join(","));
    links.forEach(function (link, i) {
      const card = data.cards.find(function (item) {
        return String(item.id) === ids[i];
      });
      if (card) link.outerHTML = listingMiniHtml(card);
    });
  } catch (error) {
    // không tải được thì giữ nguyên link
  }
}

// ======================================================================
// F54: THẺ XEM NHANH KHI RÊ CHUỘT VÀO AVATAR / TÊN THÀNH VIÊN
// Chỉ bật trên thiết bị có chuột; điện thoại bấm avatar thì mở thẳng hồ sơ.
// ======================================================================
(function setupHoverCards() {
  if (!window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;
  const cache = {};
  let card = null;
  let showTimer = null;
  let currentLink = null;

  function getCard() {
    if (!card) {
      card = document.createElement("div");
      card.className = "hover-card";
      card.setAttribute("role", "tooltip");
      card.hidden = true;
      document.body.appendChild(card);
      card.addEventListener("mouseleave", hide);
    }
    return card;
  }

  function hide() {
    clearTimeout(showTimer);
    currentLink = null;
    if (card) card.hidden = true;
  }

  function render(data, link) {
    const box = getCard();
    const user = data.user;
    box.innerHTML =
      '<div class="hover-card__head">' + avatarHtml(user, "md") +
      '<div><p class="hover-card__name">' + escapeHtml(user.displayName) + '</p><span class="user-tags">' + rankTagsHtml(user) + "</span></div></div>" +
      '<dl class="hover-card__stats">' +
      "<div><dt>Like</dt><dd>" + formatNumber(user.likesReceived) + "</dd></div>" +
      "<div><dt>Thẻ sưu tập</dt><dd>" + (data.collectionCount === null ? "Ẩn" : formatNumber(data.collectionCount)) + "</dd></div>" +
      "<div><dt>Người bán</dt><dd>" + (data.ratingCount ? "★ " + String(data.ratingAvg).replace(".", ",") : "—") + "</dd></div>" +
      "</dl>" +
      '<a class="hover-card__link" href="' + profileUrl(user) + '">Xem bộ sưu tập →</a>';
    const rect = link.getBoundingClientRect();
    box.hidden = false;
    const top = window.scrollY + rect.bottom + 8;
    const left = Math.min(window.scrollX + rect.left, window.scrollX + document.documentElement.clientWidth - box.offsetWidth - 16);
    box.style.top = top + "px";
    box.style.left = Math.max(16, left) + "px";
  }

  document.addEventListener("mouseover", function (event) {
    const link = event.target.closest('a[href^="profile.html?u="]');
    if (!link || link === currentLink || (card && card.contains(link))) return;
    currentLink = link;
    clearTimeout(showTimer);
    showTimer = setTimeout(async function () {
      const name = new URL(link.href).searchParams.get("u");
      try {
        cache[name] = cache[name] || (await apiGet("/api/users/" + encodeURIComponent(name) + "/card"));
        if (currentLink === link) render(cache[name], link);
      } catch (error) {
        // lỗi mạng: bỏ qua, người dùng vẫn bấm link được
      }
    }, 350);
  });

  document.addEventListener("mouseout", function (event) {
    const link = event.target.closest('a[href^="profile.html?u="]');
    if (!link) return;
    const to = event.relatedTarget;
    if (to && (link.contains(to) || (card && card.contains(to)))) return;
    hide();
  });
})();

// ======================================================================
// TRANG QUẢN TRỊ: chặn ở giao diện cho dễ hiểu. Quyền THẬT luôn kiểm tra ở server
// (gọi API không đủ quyền sẽ nhận lỗi 403), nên dù sửa JavaScript cũng không vượt quyền được.
// roles: ví dụ ["admin"] hoặc ["mod", "admin"]. Vùng nội dung có thuộc tính data-staff-area.
// ======================================================================
async function requireStaffPage(roles) {
  const user = await getCurrentUser();
  if (!user) {
    window.location.replace("login.html?next=" + encodeURIComponent(currentPageForNext()));
    return false;
  }
  if (roles.indexOf(user.role) === -1) {
    document.querySelector("[data-staff-area]").innerHTML =
      '<div class="empty-state empty-state--stack"><span class="icon icon--5xl text-dim" aria-hidden="true">lock</span>' +
      '<p class="empty-state__title">Bạn không có quyền xem trang này</p><p class="empty-state__text">Trang dành cho nhân viên JadeCard.</p></div>';
    return false;
  }
  return true;
}
