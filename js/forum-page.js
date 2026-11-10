// ======================================================================
// TRANG CHỦ DIỄN ĐÀN (F34) + THÀNH VIÊN NỔI BẬT TUẦN (F53) — forum.html
// Dữ liệu lấy từ GET /api/forum. Khách chưa đăng nhập vẫn đọc được.
// ======================================================================

function forumCardHtml(forum) {
  const url = "forum-view.html?f=" + forum.code;
  let latestHtml = '<p class="forum-card__empty">Chưa có topic nào.</p>';
  if (forum.latest) {
    const topic = forum.latest;
    const poster = topic.lastPoster || topic.author;
    latestHtml =
      '<a href="' + profileUrl(poster) + '">' + avatarHtml(poster, "md") + "</a>" +
      '<div class="forum-card__latest-text">' +
      '<a class="forum-card__latest-title" href="thread.html?id=' + topic.id + '">' + prefixHtml(topic.prefix) + " " + escapeHtml(topic.title) + "</a>" +
      '<p class="forum-card__latest-meta">' + userLinkHtml(poster) + " · " + timeHtml(topic.lastPostAt) + "</p>" +
      "</div>";
  }

  return (
    '<article class="forum-card forum-card--' + forum.code.toLowerCase() + '">' +
    '<a class="forum-card__code" href="' + url + '">' + escapeHtml(forum.code) + "</a>" +
    '<div class="forum-card__main">' +
    '<h2 class="forum-card__name"><a href="' + url + '">' + escapeHtml(forum.name) + "</a>" +
    (forum.staffOnly ? ' <span class="tag tag--yellow">Chính thức</span>' : "") + "</h2>" +
    '<p class="forum-card__desc">' + escapeHtml(forum.description) + "</p>" +
    '<p class="forum-card__stats"><span><span class="icon" aria-hidden="true">topic</span> Topic <strong>' + formatNumber(forum.threadCount) + "</strong></span>" +
    '<span><span class="icon" aria-hidden="true">forum</span> Bài viết <strong>' + formatNumber(forum.postCount) + "</strong></span></p>" +
    "</div>" +
    '<div class="forum-card__latest">' + latestHtml + "</div>" +
    "</article>"
  );
}

function topMembersHtml(topMembers) {
  if (!topMembers.length) return '<p class="side-card__empty">Tuần này chưa có ai nhận like. Hãy là người đầu tiên!</p>';
  return (
    '<ol class="top-members">' +
    topMembers
      .map(function (item, index) {
        return (
          '<li class="top-member">' +
          '<span class="top-member__pos">' + (index + 1) + "</span>" +
          '<a href="' + profileUrl(item.user) + '">' + avatarHtml(item.user, "md") + "</a>" +
          '<div class="top-member__who">' + userLinkHtml(item.user) + '<span class="user-tags">' + rankTagsHtml(item.user) + "</span></div>" +
          '<p class="top-member__likes"><strong>' + formatNumber(item.weekLikes) + "</strong> like</p>" +
          "</li>"
        );
      })
      .join("") +
    "</ol>"
  );
}

async function loadForumHome() {
  const list = document.getElementById("forum-list");
  try {
    const data = await apiGet("/api/forum");
    list.innerHTML = data.forums.map(forumCardHtml).join("");
    document.getElementById("top-members").innerHTML = topMembersHtml(data.topMembers);
    document.getElementById("forum-totals").innerHTML =
      "<div><dt>Topic</dt><dd>" + formatNumber(data.totals.threads) + "</dd></div>" +
      "<div><dt>Bài viết</dt><dd>" + formatNumber(data.totals.posts) + "</dd></div>" +
      "<div><dt>Thành viên</dt><dd>" + formatNumber(data.totals.members) + "</dd></div>";
  } catch (error) {
    list.innerHTML = loadErrorHtml(error);
  }
}

loadForumHome();
