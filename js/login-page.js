// ======================================================================
// TRANG ĐĂNG NHẬP (F32) — login.html?next=...
// Đăng nhập bằng email + mật khẩu. Chưa xác thực email → sang trang nhập OTP.
// Đăng nhập xong quay lại trang trong tham số "next" (mặc định: Diễn đàn).
// ======================================================================
redirectIfLoggedIn();

const loginForm = document.getElementById("login-form");
const nextPage = safeNextPage(getQueryParam("next"), "forum.html");

// Vừa đổi mật khẩu xong (forgot-password.html chuyển sang với ?reset=1)
if (getQueryParam("reset") === "1") {
  showAlert("success", "Đã đổi mật khẩu", "Mọi phiên đăng nhập cũ đã bị đăng xuất. Hãy đăng nhập bằng mật khẩu mới.");
}

// Link Đăng ký / Quên mật khẩu giữ nguyên "next"
if (getQueryParam("next")) {
  document.getElementById("register-link").href = "register.html?next=" + encodeURIComponent(nextPage);
}

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearFormErrors(loginForm);

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email) setFieldError("email", "Vui lòng nhập email.");
  if (!password) setFieldError("password", "Vui lòng nhập mật khẩu.");
  if (!email || !password) return;

  const button = loginForm.querySelector("button[type=submit]");
  setBusy(button, true, "Đang đăng nhập…");
  try {
    await apiPost("/api/auth/login", { email: email, password: password });
    window.location.href = nextPage;
  } catch (error) {
    setBusy(button, false);
    if (error.code === "EMAIL_NOT_VERIFIED") {
      window.location.href =
        "verify.html?email=" + encodeURIComponent(error.data.email) + "&wait=" + error.data.retryAfter + "&next=" + encodeURIComponent(nextPage);
      return;
    }
    if (error.field === "password") {
      // Không nói rõ sai email hay sai mật khẩu (tránh dò email thành viên)
      showAlert("error", null, error.message);
      document.getElementById("password").setAttribute("aria-invalid", "true");
      return;
    }
    showServerError(error);
  }
});
