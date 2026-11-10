// ======================================================================
// TRANG QUÊN MẬT KHẨU (F33) — forgot-password.html
//   Bước 1: nhập email → server gửi OTP (thông báo luôn giống nhau dù email có tồn tại hay không)
//   Bước 2: nhập OTP + mật khẩu mới → đổi xong, mọi phiên cũ bị đăng xuất → về trang đăng nhập
// ======================================================================
const emailForm = document.getElementById("forgot-email-form");
const resetForm = document.getElementById("reset-form");
let forgotEmail = "";

setupStrengthMeter("password", "password-strength", "password-strength-label");

function goToStep(step) {
  document.querySelectorAll(".steps__item").forEach(function (item, index) {
    item.classList.toggle("is-active", index + 1 === step);
  });
  emailForm.classList.toggle("hidden", step !== 1);
  resetForm.classList.toggle("hidden", step !== 2);
}

// ---------- Bước 1 ----------
emailForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearFormErrors(emailForm);
  const email = document.getElementById("email").value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError("email", "Email không hợp lệ.");
    return;
  }

  const button = emailForm.querySelector("button[type=submit]");
  setBusy(button, true, "Đang gửi mã…");
  try {
    const result = await apiPost("/api/auth/forgot", { email: email });
    forgotEmail = email;
    setBusy(button, false);
    goToStep(2);
    document.getElementById("reset-email").textContent = email;
    showAlert("info", null, result.message);
    startResendCountdown(result.retryAfter);
    showDevCode(document.getElementById("dev-code"), email.toLowerCase(), "reset");
    document.getElementById("code").focus();
  } catch (error) {
    setBusy(button, false);
    showServerError(error);
  }
});

// Nút "Gửi lại mã" (chỉ tạo một lần, lần sau chỉ đếm ngược lại)
let resendStarted = false;
function startResendCountdown(seconds) {
  if (resendStarted) return;
  resendStarted = true;
  setupResendButton(document.getElementById("resend-button"), seconds, async function () {
    const result = await apiPost("/api/auth/resend", { email: forgotEmail, purpose: "reset" });
    showAlert("info", null, "Nếu email này đã đăng ký, mã mới đã được gửi. Mã cũ không còn dùng được.");
    showDevCode(document.getElementById("dev-code"), forgotEmail.toLowerCase(), "reset");
    return result.retryAfter;
  });
}

document.getElementById("change-email").addEventListener("click", function () {
  hideAlert();
  goToStep(1);
  document.getElementById("dev-code").classList.add("hidden");
  document.getElementById("email").focus();
});

// ---------- Bước 2 ----------
resetForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearFormErrors(resetForm);

  const code = document.getElementById("code").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;
  let ok = true;
  if (!/^\d{6}$/.test(code)) {
    setFieldError("code", "Mã gồm đúng 6 chữ số.");
    ok = false;
  }
  if (password.length < 8) {
    setFieldError("password", "Mật khẩu phải có ít nhất 8 ký tự.");
    ok = false;
  }
  if (confirm !== password) {
    setFieldError("confirm", "Mật khẩu nhập lại không khớp.");
    ok = false;
  }
  if (!ok) return;

  const button = resetForm.querySelector("button[type=submit]");
  setBusy(button, true, "Đang đổi mật khẩu…");
  try {
    await apiPost("/api/auth/reset", { email: forgotEmail, code: code, password: password });
    window.location.href = "login.html?reset=1";
  } catch (error) {
    setBusy(button, false);
    showServerError(error);
  }
});
