// ======================================================================
// TRANG HASHTAG — tag.html?t=PikachuEx_SV08_238
// Mở khi bấm một hashtag trong bài viết:
//   1. Thẻ / bộ thẻ được nhắc (ảnh, tên, bộ, số thẻ)
//   2. "Có tại JadeCard": thẻ lẻ, tin ký gửi, pack / box liên quan → mua ngay (CTA)
//      Shop chưa bán thì mời ký gửi lá của mình hoặc tra giá bằng Check thẻ.
//   3. Các topic có bài nhắc tới hashtag này (mới nhất trước, 20 topic / trang)
// Cần: js/hashtag.js
// ======================================================================
const tagSlug = getQueryParam("t") || "";
const tagPage = Number(getQueryParam("page")) || 1;

function tagPageUrl(page) {
  return "tag.html?t=" + encodeURIComponent(tagSlug) + (page > 1 ? "&page=" + page : "");
}

function tagHeadHtml(tag, total) {
  const image = tagImageUrl(tag, "high");
  return (
    '<div class="tag-head__media tag-head__media--' + tag.kind + '">' +
    (image ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(tag.name) + '">' : '<span class="icon" aria-hidden="true">style</span>') +
    "</div>" +
    '<div class="tag-head__info">' +
    '<p class="tag-head__eyebrow"><span class="icon" aria-hidden="true">tag</span> ' + escapeHtml(tag.slug) + "</p>" +
    '<h1 class="tag-head__title">' + escapeHtml(hashtagText(tag)) + "</h1>" +
    '<p class="tag-head__meta">' +
    (tag.kind === "card" ? "Thẻ thuộc bộ <strong>" + escapeHtml(tag.setName) + "</strong>" : "Bộ thẻ (set) · pack, box, thẻ lẻ") +
    " · " + formatNumber(total) + " topic nhắc tới</p>" +
    '<div class="tag-head__actions">' +
    (tag.kind === "card"
      ? '<a class="btn btn--soft btn--sm" href="check-card.html"><span class="icon" aria-hidden="true">document_scanner</span> Tra giá tham khảo</a>'
      : "") +
    '<a class="btn btn--soft btn--sm" href="new-thread.html?f=F368"><span class="icon" aria-hidden="true">edit_square</span> Viết bài về ' + (tag.kind === "card" ? "lá này" : "bộ này") + "</a>" +
    "</div></div>"
  );
}

// Shop chưa bán gì liên quan: mời người có thẻ đem ký gửi (vẫn là một hướng kiếm doanh thu cho shop)
function noOfferHtml(tag) {
  return (
    '<div class="tag-shop__empty">' +
    '<span class="icon" aria-hidden="true">inventory_2</span>' +
    "<div><p><strong>JadeCard chưa có " + (tag.kind === "card" ? "lá này" : "hàng của bộ này") + ".</strong> " +
    "Bạn đang có? Đăng ký gửi để shop kiểm định và bán giúp, phí 8% (tối thiểu 20.000 ₫).</p>" +
    '<a class="btn btn--primary btn--sm" href="new-listing.html"><span class="icon" aria-hidden="true">sell</span> Ký gửi thẻ</a></div>' +
    "</div>"
  );
}

function tagThreadHtml(thread) {
  const url = "thread.html?id=" + thread.id;
  return (
    '<article class="tag-thread">' +
    (thread.cover
      ? '<a class="tag-thread__cover" href="' + url + '"><img src="' + escapeHtml(thread.cover) + '" alt="" loading="lazy"></a>'
      : '<a class="tag-thread__cover tag-thread__cover--empty" href="' + url + '"><span class="icon" aria-hidden="true">forum</span></a>') +
    '<div class="tag-thread__main">' +
    '<p class="tag-thread__forum">' + escapeHtml(thread.forum.code + " " + thread.forum.name) + "</p>" +
    '<h3 class="tag-thread__title">' + prefixHtml(thread.prefix) + ' <a href="' + url + '">' + escapeHtml(thread.title) + "</a></h3>" +
    '<p class="tag-thread__meta">' + userLinkHtml(thread.author) + " · " + timeHtml(thread.lastPostAt) +
    " · " + formatNumber(thread.replyCount) + " trả lời · " + formatNumber(thread.viewCount) + " lượt xem</p>" +
    "</div></article>"
  );
}

async function loadTagPage() {
  const head = document.getElementById("tag-head");
  const list = document.getElementById("tag-threads");
  if (!tagSlug) {
    head.innerHTML = loadErrorHtml(new Error("Đường dẫn thiếu hashtag."));
    return;
  }
  try {
    const data = await apiGet("/api/tags/" + encodeURIComponent(tagSlug) + (tagPage > 1 ? "?page=" + tagPage : ""));
    const tag = data.tag;
    document.title = "#" + hashtagText(tag) + " — Diễn đàn JadeCard";
    document.getElementById("crumb-tag").textContent = "#" + hashtagText(tag);
    head.innerHTML = tagHeadHtml(tag, data.total);

    const offers = shopOffersForTag(tag, data.listingStats);
    document.getElementById("tag-offers").innerHTML = offers.length ? offers.map(shopCtaHtml).join("") : noOfferHtml(tag);
    document.getElementById("tag-shop").classList.remove("hidden");

    document.getElementById("tag-count").textContent = formatNumber(data.total) + " topic";
    list.innerHTML = data.threads.length
      ? data.threads.map(tagThreadHtml).join("")
      : '<div class="empty-state empty-state--stack"><p class="empty-state__title">Chưa có bài viết nào</p></div>';
    document.getElementById("pagination").innerHTML = paginationHtml(data.page, data.pageCount, tagPageUrl);
  } catch (error) {
    head.innerHTML = loadErrorHtml(error);
  }
}

loadTagPage();
