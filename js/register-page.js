// ======================================================================
// TRANG ĐĂNG KÝ (F30) — register.html
// Kiểm tra nhanh ở trình duyệt cho tiện, server vẫn kiểm tra lại toàn bộ.
// Đăng ký xong → sang trang nhập OTP (verify.html).
// ======================================================================
redirectIfLoggedIn();
setupStrengthMeter("password", "password-strength", "password-strength-label");

const registerForm = document.getElementById("register-form");
const nameInput = document.getElementById("displayName");
const nameCounter = document.getElementById("displayName-count");

// Bộ đếm 0/20 ký tự cho tên hiển thị
nameInput.addEventListener("input", function () {
  nameCounter.textContent = nameInput.value.trim().length + "/20";
});

// Kiểm tra ở trình duyệt, trả về true nếu hợp lệ
function validateRegisterForm(values) {
  let ok = true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    setFieldError("email", "Email không hợp lệ.");
    ok = false;
  }
  if (values.displayName.length < 3 || values.displayName.length > 20) {
    setFieldError("displayName", "Tên hiển thị phải dài 3–20 ký tự.");
    ok = false;
  } else if (!/^[\p{L}\p{N}_.]+$/u.test(values.displayName)) {
    setFieldError("displayName", "Chỉ dùng chữ, số, dấu gạch dưới (_) và dấu chấm, không có khoảng trắng.");
    ok = false;
  }
  if (values.password.length < 8) {
    setFieldError("password", "Mật khẩu phải có ít nhất 8 ký tự.");
    ok = false;
  }
  if (values.confirm !== values.password) {
    setFieldError("confirm", "Mật khẩu nhập lại không khớp.");
    ok = false;
  }
  if (!values.acceptRules) {
    setFieldError("acceptRules", "Bạn cần đồng ý với Quy định diễn đàn.");
    ok = false;
  }
  return ok;
}

registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearFormErrors(registerForm);

  const values = {
    email: document.getElementById("email").value.trim(),
    displayName: nameInput.value.trim(),
    password: document.getElementById("password").value,
    confirm: document.getElementById("confirm").value,
    acceptRules: document.getElementById("acceptRules").checked,
  };
  if (!validateRegisterForm(values)) return;

  const button = registerForm.querySelector("button[type=submit]");
  setBusy(button, true, "Đang tạo tài khoản…");
  try {
    const result = await apiPost("/api/auth/register", {
      email: values.email,
      displayName: values.displayName,
      password: values.password,
      acceptRules: values.acceptRules,
    });
    const next = getQueryParam("next");
    window.location.href =
      "verify.html?email=" + encodeURIComponent(result.email) + "&wait=" + result.retryAfter + (next ? "&next=" + encodeURIComponent(next) : "");
  } catch (error) {
    setBusy(button, false);
    showServerError(error);
    // Email đã đăng ký nhưng chưa xác thực: đưa link đi tiếp bước nhập OTP
    if (error.code === "EMAIL_UNVERIFIED") {
      const errorBox = document.getElementById("email-error");
      errorBox.innerHTML =
        escapeHtml("Email này đã đăng ký nhưng chưa xác thực. ") +
        '<a href="verify.html?email=' + encodeURIComponent(values.email) + '">Nhập mã OTP</a>';
    } else if (error.code === "EMAIL_TAKEN") {
      document.getElementById("email-error").innerHTML =
        escapeHtml("Email này đã được đăng ký. Vui lòng ") + '<a href="login.html">đăng nhập</a>' + escapeHtml(" hoặc dùng email khác.");
    }
  }
});
