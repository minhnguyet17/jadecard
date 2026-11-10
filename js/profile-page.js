// ======================================================================
// HỒ SƠ THÀNH VIÊN (F41) — profile.html?u=Kenjiro
// Mở khi bấm avatar hoặc tên ở bất kỳ đâu. Không hiện email.
//   - Đầu hồ sơ: chức vụ, ngày tham gia, số bài, like, giao dịch ký gửi thành công, điểm người bán (F56)
//   - Tiến độ tới chức vụ sau + thang 7 chức vụ (F40)
//   - Tab Bộ sưu tập (F27, tab đầu tiên): theo cài đặt riêng tư; thẻ đang ký gửi có nhãn "Đang bán"
//   - Tab Tin ký gửi đang bán, tab Topic gần đây, danh sách đánh giá người bán
//   - Mod / Admin: khóa / mở khóa tài khoản (F42)
// ======================================================================
const profileName = getQueryParam("u") || "";
let profileData = null;

function profileHeadHtml(data) {
  const user = data.user;
  const stats = data.sellerStats;
  return (
    avatarHtml(user, "xl") +
    '<div class="profile-head__info">' +
    '<h1 class="profile-head__name">' + escapeHtml(user.displayName) + "</h1>" +
    '<div class="user-tags">' + rankTagsHtml(user) + (user.banned ? ' <span class="tag tag--yellow">Tài khoản bị khóa</span>' : "") + "</div>" +
    '<dl class="profile-head__stats">' +
    "<div><dt>Ngày tham gia</dt><dd>" + formatDate(user.joinedAt) + "</dd></div>" +
    "<div><dt>Bài viết</dt><dd>" + formatNumber(user.postCount) + "</dd></div>" +
    '<div><dt>Lượt thích nhận được</dt><dd class="text-cyan">' + formatNumber(user.likesReceived) + "</dd></div>" +
    "<div><dt>Ký gửi thành công</dt><dd>" + stats.successCount + "</dd></div>" +
    "<div><dt>Đánh giá người bán</dt><dd>" + starsHtml(stats.ratingAvg, stats.ratingCount) + "</dd></div>" +
    "</dl>" +
    "</div>" +
    (data.isMe ? '<p class="profile-head__me"><span class="icon" aria-hidden="true">badge</span> Đây là hồ sơ của bạn. Người khác thấy giống hệt (không có email).</p>' : "") +
    (data.canModerate
      ? '<button type="button" class="btn btn--soft btn--sm btn--danger profile-head__ban" data-ban="' + !user.banned + '"><span class="icon" aria-hidden="true">' +
        (user.banned ? "lock_open" : "block") + "</span> " + (user.banned ? "Mở khóa tài khoản" : "Khóa tài khoản") + "</button>"
      : "")
  );
}

// Thanh tiến độ "412 / 1.000 like tới Master" + thang 7 chức vụ
function rankProgressHtml(data) {
  const user = data.user;
  const rank = user.rank;
  let progressText;
  let percent = 100;
  if (rank.next) {
    const current = data.ranks[rank.level - 1];
    percent = Math.round(((user.likesReceived - current.min) / (rank.next.min - current.min)) * 100);
    progressText =
      "<strong>" + formatNumber(user.likesReceived) + " / " + formatNumber(rank.next.min) + "</strong> like tới " +
      '<span class="rank-tag rank-tag--' + (rank.level + 1) + '">' + escapeHtml(rank.next.name) + "</span>";
  } else {
    progressText = "<strong>" + formatNumber(user.likesReceived) + "</strong> like · đã đạt chức vụ cao nhất";
  }

  const ladder = data.ranks
    .map(function (item) {
      const state = item.level < rank.level ? "is-done" : item.level === rank.level ? "is-current" : "";
      return (
        '<li class="rank-ladder__step ' + state + '">' +
        '<span class="rank-tag rank-tag--' + item.level + '">' + escapeHtml(item.name) + "</span>" +
        '<span class="rank-ladder__min">' + formatNumber(item.min) + " like</span></li>"
      );
    })
    .join("");

  return (
    '<div class="rank-progress">' +
    '<p class="rank-progress__text">' + progressText + "</p>" +
    '<div class="rank-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '" aria-label="Tiến độ tới chức vụ tiếp theo">' +
    '<span style="width: ' + percent + '%"></span></div>' +
    "</div>" +
    '<ol class="rank-ladder">' + ladder + "</ol>"
  );
}

function recentThreadsHtml(threads) {
  if (!threads.length) return '<div class="empty-state"><p class="empty-state__title">Chưa mở topic nào</p></div>';
  return (
    '<ul class="profile-topics">' +
    threads
      .map(function (thread) {
        return (
          '<li class="profile-topics__item">' +
          '<a class="profile-topics__title" href="thread.html?id=' + thread.id + '">' + prefixHtml(thread.prefix) + " " + escapeHtml(thread.title) + "</a>" +
          '<p class="profile-topics__meta">' + escapeHtml(thread.forum.code + " " + thread.forum.name) + " · " + timeHtml(thread.createdAt) + " · " + formatNumber(thread.replyCount) + " trả lời</p>" +
          "</li>"
        );
      })
      .join("") +
    "</ul>"
  );
}

function listingsHtml(listings) {
  if (!listings.length) return '<div class="empty-state"><p class="empty-state__title">Chưa có thẻ nào đang ký gửi</p></div>';
  return '<div class="mini-grid">' + listings.map(listingMiniHtml).join("") + "</div>";
}

function profileReviewsHtml(reviews, staff) {
  if (!reviews.length) return '<p class="empty-note">Chưa có đánh giá người bán.</p>';
  return (
    '<ul class="review-list">' +
    reviews
      .map(function (review) {
        return (
          '<li class="review' + (review.hidden ? " review--hidden" : "") + '">' +
          '<div class="review__head">' + avatarHtml(review.buyer, "sm") + userLinkHtml(review.buyer) +
          '<span class="stars__icons">' + "★".repeat(review.stars) + "☆".repeat(5 - review.stars) + "</span>" +
          '<span class="review__meta">' + escapeHtml(review.cardName) + " · " + timeHtml(review.createdAt) + "</span>" +
          (staff ? '<button type="button" class="link-button" data-review="' + review.id + '" data-hidden="' + review.hidden + '">' + (review.hidden ? "Hiện" : "Ẩn") + " nhận xét</button>" : "") +
          "</div>" +
          (review.comment ? '<p class="review__text">' + escapeHtml(review.comment) + "</p>" : "") +
          "</li>"
        );
      })
      .join("") +
    "</ul>"
  );
}

// ---------- Tab Bộ sưu tập (F27) ----------
function collectionTabHtml(data) {
  if (data.hidden) {
    return '<div class="empty-state empty-state--stack"><span class="icon icon--5xl text-dim" aria-hidden="true">visibility_off</span><p class="empty-state__title">Bộ sưu tập đang ẩn</p></div>';
  }
  const have = data.items.filter((item) => item.list === "have");
  const want = data.items.filter((item) => item.list === "want");
  const cardHtml = function (item) {
    const sale = item.onSaleListingId
      ? '<a class="badge badge--verified collection-card__sale" href="listing.html?id=' + item.onSaleListingId + '">Đang bán →</a>'
      : "";
    return (
      '<figure class="collection-card">' + sale +
      '<img src="' + escapeHtml(listingImage(item.image)) + '" alt="' + escapeHtml(item.name) + '" loading="lazy">' +
      '<figcaption><span class="collection-card__name">' + escapeHtml(item.name) + "</span>" +
      '<span class="collection-card__meta">' + escapeHtml(item.number) + (item.condition ? " · " + item.condition : "") + (item.quantity > 1 ? " · ×" + item.quantity : "") + "</span></figcaption></figure>"
    );
  };
  const value =
    data.totalValue !== null
      ? '<p class="collection-total">Tổng giá tham khảo lúc lưu: <strong>' + formatVND(data.totalValue) + "</strong>" + (data.isMe && !data.settings.showValue ? " (chỉ bạn thấy)" : "") + "</p>"
      : "";
  return (
    value +
    (data.isMe ? '<p class="field__hint">Sửa bộ sưu tập và cài đặt riêng tư ở <a class="text-cyan" href="collection.html">Bộ sưu tập của tôi</a>.</p>' : "") +
    '<h3 class="section-label">Đang có (' + have.length + ")</h3>" +
    (have.length ? '<div class="collection-grid">' + have.map(cardHtml).join("") + "</div>" : '<p class="empty-note">Chưa có thẻ.</p>') +
    '<h3 class="section-label">Đang săn (' + want.length + ")</h3>" +
    (want.length ? '<div class="collection-grid">' + want.map(cardHtml).join("") + "</div>" : '<p class="empty-note">Chưa săn thẻ nào.</p>')
  );
}

// ---------- Tab ----------
function setupTabs() {
  const tabs = Array.from(document.querySelectorAll("[role=tab]"));
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (other) {
        const selected = other === tab;
        other.setAttribute("aria-selected", String(selected));
        document.getElementById(other.getAttribute("aria-controls")).hidden = !selected;
      });
    });
  });
}

async function loadProfile() {
  if (!profileName) {
    document.getElementById("profile-head").innerHTML = loadErrorHtml(new Error("Đường dẫn thiếu tên thành viên."));
    return;
  }
  try {
    const encoded = encodeURIComponent(profileName);
    const [data, collection] = await Promise.all([apiGet("/api/users/" + encoded), apiGet("/api/users/" + encoded + "/collection")]);
    profileData = data;
    document.title = data.user.displayName + " — Hồ sơ thành viên JadeCard";
    document.getElementById("crumb-name").textContent = data.user.displayName;
    document.getElementById("profile-head").innerHTML = profileHeadHtml(data);
    document.getElementById("profile-rank").innerHTML = rankProgressHtml(data);
    document.getElementById("profile-rank").classList.remove("hidden");
    document.getElementById("tab-collection-panel").innerHTML = collectionTabHtml(collection);
    document.getElementById("tab-listings-panel").innerHTML = listingsHtml(data.listings);
    document.getElementById("tab-topics-panel").innerHTML = recentThreadsHtml(data.recentThreads);
    document.getElementById("tab-listings").querySelector("[data-count]").textContent = data.listings.length;
    document.getElementById("profile-reviews").innerHTML = '<h2 class="section-label">Đánh giá người bán</h2>' + profileReviewsHtml(data.reviews, data.viewerIsStaff);
    document.getElementById("profile-tabs").classList.remove("hidden");
  } catch (error) {
    document.getElementById("profile-head").innerHTML = loadErrorHtml(error);
  }
}

// Mod / Admin: khóa tài khoản, ẩn nhận xét vi phạm (F42, F56)
document.querySelector("main").addEventListener("click", async function (event) {
  const ban = event.target.closest("[data-ban]");
  const review = event.target.closest("[data-review]");
  try {
    if (ban) {
      const banned = ban.dataset.ban === "true";
      if (banned && !window.confirm("Khóa tài khoản " + profileData.user.displayName + "? Thành viên sẽ bị đăng xuất ngay.")) return;
      await apiPost("/api/users/" + encodeURIComponent(profileData.user.displayName) + "/ban", { banned: banned });
      showToast(banned ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.");
    } else if (review) {
      await apiPost("/api/reviews/" + review.dataset.review + "/moderate", { action: review.dataset.hidden === "true" ? "unhide" : "hide" });
      showToast("Đã cập nhật nhận xét.");
    } else {
      return;
    }
    loadProfile();
  } catch (error) {
    showToast(error.message);
  }
});

setupTabs();
loadProfile();
