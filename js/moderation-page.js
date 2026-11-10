// ======================================================================
// KIỂM DUYỆT DIỄN ĐÀN (F42) — moderation.html, Mod và Admin
// Danh sách báo cáo đang chờ: xem bài bị báo cáo → Ẩn bài, hoặc Bỏ qua (đánh dấu đã xử lý).
// Ghim / khóa / ẩn topic và khóa tài khoản làm ngay trên trang topic và trang hồ sơ.
// ======================================================================
const reportsBox = document.getElementById("report-list");

function reportHtml(report) {
  const post = report.post;
  return (
    '<article class="report-card">' +
    '<header class="report-card__head"><span class="tag tag--yellow">' + escapeHtml(report.reason) + "</span>" +
    '<span class="report-card__meta">Báo cáo bởi ' + userLinkHtml(report.reporter) + " · " + timeHtml(report.createdAt) + "</span></header>" +
    '<p class="report-card__thread">Topic: <a href="thread.html?id=' + post.threadId + "&page=" + post.page + "#post-" + post.id + '">' + escapeHtml(post.threadTitle) + "</a></p>" +
    '<div class="report-card__post">' + avatarHtml(post.author, "sm") + "<div>" + userLinkHtml(post.author) + ' <span class="user-tags">' + rankTagsHtml(post.author) + "</span>" +
    '<div class="post__content">' + formatPostContent(post.content) + "</div></div></div>" +
    '<div class="report-card__actions">' +
    (post.hidden ? '<span class="tag">Bài đã ẩn</span>' : '<button type="button" class="btn btn--primary btn--sm" data-hide-post="' + post.id + '"><span class="icon" aria-hidden="true">visibility_off</span> Ẩn bài</button>') +
    '<button type="button" class="btn btn--soft btn--sm" data-resolve="' + report.id + '">Bỏ qua (không vi phạm)</button></div></article>'
  );
}

async function loadReports() {
  try {
    const data = await apiGet("/api/mod/reports");
    document.getElementById("report-count").textContent = data.reports.length;
    reportsBox.innerHTML = data.reports.length ? data.reports.map(reportHtml).join("") : '<p class="empty-note">Không có báo cáo nào đang chờ. 🎉</p>';
  } catch (error) {
    reportsBox.innerHTML = loadErrorHtml(error);
  }
}

reportsBox.addEventListener("click", async function (event) {
  const hide = event.target.closest("[data-hide-post]");
  const resolve = event.target.closest("[data-resolve]");
  try {
    if (hide) {
      await apiPost("/api/posts/" + hide.dataset.hidePost + "/moderate", { action: "hide" });
      showToast("Đã ẩn bài; like của bài không còn tính cho tác giả.");
    } else if (resolve) {
      await apiPost("/api/mod/reports/" + resolve.dataset.resolve + "/resolve");
      showToast("Đã đánh dấu xử lý.");
    } else {
      return;
    }
    loadReports();
  } catch (error) {
    showToast(error.message);
  }
});

requireStaffPage(["mod", "admin"]).then(function (ok) {
  if (ok) loadReports();
});
