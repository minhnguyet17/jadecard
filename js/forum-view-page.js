// ======================================================================
// DANH SÁCH TOPIC CỦA MỘT FORUM (F35, F52) — forum-view.html?f=F368&prefix=3&page=2
// Topic ghim ở trên cùng (chỉ trang 1), còn lại sắp theo bài mới nhất, 20 topic / trang.
// ======================================================================
const forumCode = (getQueryParam("f") || "F368").toUpperCase();
const prefixFilter = getQueryParam("prefix");

// Đường dẫn của trang này với tham số mới (giữ forum, đổi tag lọc / số trang)
function forumViewUrl(params) {
  const query = new URLSearchParams({ f: forumCode });
  if (params.prefix) query.set("prefix", params.prefix);
  if (params.page && params.page > 1) query.set("page", params.page);
  return "forum-view.html?" + query.toString();
}

function topicRowHtml(topic) {
  const url = "thread.html?id=" + topic.id;
  const icons =
    (topic.pinned ? '<span class="icon topic-row__flag text-yellow" title="Topic ghim" aria-label="Topic ghim">push_pin</span>' : "") +
    (topic.locked ? '<span class="icon topic-row__flag text-dim" title="Topic đã khóa" aria-label="Topic đã khóa">lock</span>' : "");
  const last = topic.lastPoster || topic.author;

  return (
    '<article class="topic-row' + (topic.pinned ? " topic-row--pinned" : "") + '">' +
    '<a class="topic-row__avatar" href="' + profileUrl(topic.author) + '">' + avatarHtml(topic.author, "md") + "</a>" +
    '<div class="topic-row__main">' +
    '<h3 class="topic-row__title">' + icons + prefixHtml(topic.prefix) + ' <a href="' + url + '">' + escapeHtml(topic.title) + "</a>" +
    (topic.hidden ? ' <span class="tag tag--yellow">Đã ẩn</span>' : "") + "</h3>" +
    listingRowHtml(topic.listing) +
    '<p class="topic-row__meta">' + userLinkHtml(topic.author) + ' <span class="user-tags">' + rankTagsHtml(topic.author) + "</span> · " + timeHtml(topic.createdAt) +
    '<span class="topic-row__inline-stats"> · ' + formatNumber(topic.replyCount) + " trả lời · " + formatNumber(topic.viewCount) + " lượt xem</span></p>" +
    "</div>" +
    '<dl class="topic-row__stats">' +
    "<div><dd>" + formatNumber(topic.replyCount) + "</dd><dt>Trả lời</dt></div>" +
    "<div><dd>" + formatNumber(topic.viewCount) + "</dd><dt>Lượt xem</dt></div>" +
    "</dl>" +
    '<div class="topic-row__last">' + userLinkHtml(last) + "<br>" + timeHtml(topic.lastPostAt) + "</div>" +
    "</article>"
  );
}

// Topic Mua bán: ảnh nhỏ + giá + nhãn xác thực của tin ký gửi gắn kèm (F50)
function listingRowHtml(listing) {
  if (!listing) return "";
  const badge = listing.sold
    ? '<span class="badge badge--sold">ĐÃ BÁN</span>'
    : listing.verified
      ? '<span class="badge badge--verified"><span class="icon" aria-hidden="true">verified</span> JadeCard đã xác thực</span>'
      : '<span class="badge badge--pending">Chưa xác thực</span>';
  return (
    '<a class="topic-row__listing" href="listing.html?id=' + listing.id + '">' +
    '<img src="' + escapeHtml(listingImage(listing.image)) + '" alt="" loading="lazy">' +
    '<span class="topic-row__listing-price">' + formatVND(listing.price) + "</span>" + badge + "</a>"
  );
}

function forumHeadHtml(data, user) {
  const forum = data.forum;
  let action = "";
  if (data.canCreate) {
    action = '<a class="btn btn--primary btn--md btn--glow" href="new-thread.html?f=' + forum.code + '"><span class="icon" aria-hidden="true">add</span> Tạo topic mới</a>';
  } else if (!user) {
    action = '<a class="btn btn--ghost btn--md" href="login.html?next=' + encodeURIComponent(currentPageForNext()) + '"><span class="icon" aria-hidden="true">login</span> Đăng nhập để tạo topic</a>';
  } else if (forum.staffOnly) {
    action = '<p class="forum-head__note"><span class="icon" aria-hidden="true">campaign</span> Chỉ Admin đăng topic trong ' + escapeHtml(forum.code) + ".</p>";
  }

  return (
    '<div class="forum-head__text">' +
    '<p class="eyebrow">' + escapeHtml(forum.code) + " · DIỄN ĐÀN JADECARD</p>" +
    '<h1 class="forum-head__title"><span class="forum-head__code">' + escapeHtml(forum.code) + '</span> <span class="forum-head__slash">/</span> ' + escapeHtml(forum.name) + "</h1>" +
    '<p class="forum-head__desc">' + escapeHtml(forum.description) + "</p>" +
    '<p class="forum-head__stats"><span class="icon" aria-hidden="true">topic</span> Chủ đề: <strong>' + formatNumber(data.totalAll) + "</strong></p>" +
    "</div>" +
    '<div class="forum-head__action">' + action + "</div>"
  );
}

function prefixChipsHtml(data) {
  const all = '<a class="chip' + (!prefixFilter ? " is-active" : "") + '" href="' + forumViewUrl({}) + '">Tất cả <span class="chip__count">' + formatNumber(data.totalAll) + "</span></a>";
  const chips = data.prefixes.map(function (prefix) {
    const active = String(prefix.id) === prefixFilter;
    return (
      '<a class="chip' + (active ? " is-active" : "") + '" href="' + forumViewUrl({ prefix: prefix.id }) + '">' +
      '<span class="chip__dot chip__dot--' + prefix.color + '" aria-hidden="true"></span>' + escapeHtml(prefix.name) +
      ' <span class="chip__count">' + formatNumber(prefix.count) + "</span></a>"
    );
  });
  return all + chips.join("");
}

async function loadForumView() {
  const list = document.getElementById("topic-list");
  const page = Number(getQueryParam("page")) || 1;
  const query = new URLSearchParams({ page: page });
  if (prefixFilter) query.set("prefix", prefixFilter);

  try {
    const [data, user] = await Promise.all([apiGet("/api/forums/" + encodeURIComponent(forumCode) + "/threads?" + query), getCurrentUser()]);

    document.title = data.forum.code + " · " + data.forum.name + " — Diễn đàn JadeCard";
    document.getElementById("crumb-forum").textContent = data.forum.code + " " + data.forum.name;
    document.getElementById("forum-head").innerHTML = forumHeadHtml(data, user);
    document.getElementById("prefix-chips").innerHTML = prefixChipsHtml(data);

    const pinnedSection = document.getElementById("pinned-section");
    pinnedSection.classList.toggle("hidden", data.pinned.length === 0);
    document.getElementById("pinned-list").innerHTML = data.pinned.map(topicRowHtml).join("");

    list.innerHTML = data.threads.length
      ? data.threads.map(topicRowHtml).join("")
      : '<div class="empty-state"><p class="empty-state__title">Chưa có topic nào ở đây</p><p class="empty-state__text">Hãy mở topic đầu tiên!</p></div>';

    const from = (data.page - 1) * 20 + 1;
    const to = from + data.threads.length - 1;
    document.getElementById("list-count").textContent = data.total ? "Hiển thị " + from + "–" + to + " trên " + formatNumber(data.total) + " topic" : "";
    document.getElementById("pagination").innerHTML = paginationHtml(data.page, data.pageCount, function (number) {
      return forumViewUrl({ prefix: prefixFilter, page: number });
    });
  } catch (error) {
    document.getElementById("forum-head").innerHTML = "";
    list.innerHTML = loadErrorHtml(error);
  }
}

loadForumView();
