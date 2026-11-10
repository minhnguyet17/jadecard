// ======================================================================
// MENU TÀI KHOẢN TRÊN HEADER (F32, F40)
//   - Chưa đăng nhập: nút "Đăng nhập" (đăng nhập xong quay lại đúng trang đang xem).
//   - Đã đăng nhập: avatar + tên + tag chức vụ; bấm vào mở menu Hồ sơ / Đăng xuất.
// Cần js/api.js và js/community-ui.js chạy trước.
// ======================================================================

function renderAccountMenu(user) {
  const box = document.getElementById("account-menu");
  if (!box) return;

  if (!user) {
    // Nút Đăng nhập có sẵn trong HTML, chỉ thêm "next" để đăng nhập xong quay về trang này
    const loginLink = box.querySelector(".account-menu__login");
    const page = currentPageForNext();
    if (loginLink && !/^(login|register|verify|forgot-password)\.html/.test(page)) {
      loginLink.href = "login.html?next=" + encodeURIComponent(page);
    }
    return;
  }

  box.innerHTML =
    '<button type="button" class="account-menu__button" aria-expanded="false" aria-controls="account-dropdown">' +
    avatarHtml(user, "sm") +
    '<span class="account-menu__who"><span class="account-menu__name">' + escapeHtml(user.displayName) + "</span>" +
    '<span class="rank-tag rank-tag--' + user.rank.level + '">' + escapeHtml(user.rank.name) + "</span></span>" +
    '<span class="icon account-menu__caret" aria-hidden="true">expand_more</span>' +
    '<span class="sr-only">Mở menu tài khoản</span>' +
    "</button>" +
    '<div id="account-dropdown" class="account-menu__dropdown" hidden>' +
    '<p class="account-menu__head">' + escapeHtml(user.displayName) + "<br>" + rankTagsHtml(user) + "</p>" +
    '<a href="' + profileUrl(user) + '"><span class="icon" aria-hidden="true">person</span> Hồ sơ của tôi</a>' +
    '<a href="collection.html"><span class="icon" aria-hidden="true">collections_bookmark</span> Bộ sưu tập</a>' +
    '<a href="my-listings.html"><span class="icon" aria-hidden="true">storefront</span> Tin ký gửi của tôi</a>' +
    '<a href="orders.html"><span class="icon" aria-hidden="true">receipt_long</span> Đơn hàng của tôi</a>' +
    staffLinksHtml(user) +
    '<button type="button" data-logout><span class="icon" aria-hidden="true">logout</span> Đăng xuất</button>' +
    "</div>";

  const button = box.querySelector(".account-menu__button");
  const dropdown = box.querySelector(".account-menu__dropdown");

  function setOpen(open) {
    dropdown.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  }

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    setOpen(dropdown.hidden);
  });
  // Bấm ra ngoài hoặc nhấn Esc thì đóng menu
  document.addEventListener("click", function (event) {
    if (!box.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });

  box.querySelector("[data-logout]").addEventListener("click", async function () {
    try {
      await apiPost("/api/auth/logout");
    } finally {
      window.location.href = "index.html";
    }
  });
}

// Lối vào trang quản trị: Mod chỉ có Kiểm duyệt; Admin có thêm Ký gửi và Đơn hàng
function staffLinksHtml(user) {
  if (user.role !== "mod" && user.role !== "admin") return "";
  let html = '<p class="account-menu__group">Quản trị</p>';
  if (user.role === "admin") {
    html += '<a href="admin-consignments.html"><span class="icon" aria-hidden="true">fact_check</span> Kiểm định &amp; tất toán</a>';
    html += '<a href="admin-orders.html"><span class="icon" aria-hidden="true">local_shipping</span> Quản lý đơn hàng</a>';
  }
  html += '<a href="moderation.html"><span class="icon" aria-hidden="true">shield_person</span> Kiểm duyệt diễn đàn</a>';
  return html;
}

getCurrentUser().then(renderAccountMenu);
