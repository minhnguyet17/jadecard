// ======================================================================
// HÀM DÙNG CHUNG CHO CÁC FORM TÀI KHOẢN (đăng ký, OTP, đăng nhập, quên mật khẩu)
// Quy ước HTML: ô nhập có id = tên trường (vd. "email"), chỗ báo lỗi có id = "<tên>-error".
// ======================================================================

// Báo lỗi ngay dưới một ô nhập
function setFieldError(name, message) {
  const input = document.getElementById(name);
  const errorBox = document.getElementById(name + "-error");
  if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  if (errorBox) errorBox.textContent = message || "";
}

// Xóa mọi lỗi trong form trước khi gửi lại
function clearFormErrors(form) {
  form.querySelectorAll("[aria-invalid]").forEach(function (input) {
    input.setAttribute("aria-invalid", "false");
  });
  form.querySelectorAll(".field__error").forEach(function (box) {
    box.textContent = "";
  });
  hideAlert();
}

// Hộp thông báo chung của trang (id="form-alert"): type = "error" | "success" | "info"
function showAlert(type, title, message) {
  const box = document.getElementById("form-alert");
  if (!box) return;
  const icons = { error: "error", success: "verified", info: "info" };
  box.className = "alert alert--" + type;
  box.setAttribute("role", type === "error" ? "alert" : "status");
  box.innerHTML =
    '<span class="icon" aria-hidden="true">' + icons[type] + "</span>" +
    "<div>" + (title ? '<strong class="alert__title">' + escapeHtml(title) + "</strong>" : "") +
    "<span>" + escapeHtml(message || "") + "</span></div>";
}

function hideAlert() {
  const box = document.getElementById("form-alert");
  if (box) box.className = "hidden";
}

// Hiện lỗi server trả về: có "field" thì báo ở đúng ô, không thì báo ở hộp chung
function showServerError(error) {
  if (error.field && document.getElementById(error.field + "-error")) {
    setFieldError(error.field, error.message);
    const input = document.getElementById(error.field);
    if (input) input.focus();
  } else {
    showAlert("error", null, error.message);
  }
}

// Khóa nút gửi khi đang chờ server (tránh bấm 2 lần)
function setBusy(button, busy, busyText) {
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.textContent = busyText || "Đang xử lý…";
  } else {
    button.disabled = false;
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
}

// Nút con mắt: hiện / ẩn mật khẩu
function setupPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach(function (button) {
    button.addEventListener("click", function () {
      const input = document.getElementById(button.dataset.togglePassword);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.querySelector(".icon").textContent = show ? "visibility_off" : "visibility";
      button.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    });
  });
}

// Độ mạnh mật khẩu 0–4, chỉ để gợi ý (server chỉ bắt buộc ít nhất 8 ký tự)
function passwordStrength(password) {
  if (password.length < 8) return password.length ? 1 : 0;
  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 14) score++;
  return Math.min(score, 4);
}

// Gắn thanh độ mạnh vào một ô mật khẩu
function setupStrengthMeter(inputId, meterId, labelId) {
  const input = document.getElementById(inputId);
  const meter = document.getElementById(meterId);
  const label = document.getElementById(labelId);
  const names = ["", "YẾU", "TẠM ĐƯỢC", "KHÁ MẠNH", "RẤT MẠNH"];
  input.addEventListener("input", function () {
    const level = passwordStrength(input.value);
    meter.dataset.level = String(level);
    label.textContent = names[level];
  });
}

// Che bớt email: kenjiro@example.com → k*****o@example.com
function maskEmail(email) {
  const parts = email.split("@");
  const name = parts[0];
  if (name.length <= 2) return name.charAt(0) + "*@" + parts[1];
  return name.charAt(0) + "*".repeat(Math.min(name.length - 2, 5)) + name.charAt(name.length - 1) + "@" + parts[1];
}

// Nút "Gửi lại mã" có đếm ngược. onClick trả về số giây phải chờ cho lần sau.
function setupResendButton(button, seconds, onClick) {
  let timer = null;
  const textBox = button.querySelector("[data-resend-text]");

  function countdown(wait) {
    clearInterval(timer);
    let left = wait;
    const tick = function () {
      if (left <= 0) {
        clearInterval(timer);
        button.disabled = false;
        textBox.textContent = "Gửi lại mã";
        return;
      }
      button.disabled = true;
      const minutes = Math.floor(left / 60);
      const secs = String(left % 60).padStart(2, "0");
      textBox.textContent = "Gửi lại sau " + minutes + ":" + secs;
      left--;
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  button.addEventListener("click", async function () {
    button.disabled = true;
    try {
      const wait = await onClick();
      countdown(wait);
    } catch (error) {
      button.disabled = false;
      showAlert("error", null, error.message);
    }
  });

  countdown(seconds);
}

// Đã đăng nhập mà vẫn mở trang đăng nhập / đăng ký → chuyển đi luôn
function redirectIfLoggedIn() {
  getCurrentUser().then(function (user) {
    if (user) window.location.replace(safeNextPage(getQueryParam("next"), "forum.html"));
  });
}

setupPasswordToggles();

// ----------------------------------------------------------------------
// CHẾ ĐỘ LẬP TRÌNH (máy chưa cấu hình Gmail trong .env): hiện mã OTP ngay trên trang.
// Server chỉ trả mã khi KHÔNG gửi được email thật; đã cấu hình Gmail thì khung này luôn ẩn.
// box: phần tử <p class="dev-code hidden"> trên trang verify / quên mật khẩu.
// ----------------------------------------------------------------------
async function showDevCode(box, email, purpose) {
  if (!box || !email) return;
  try {
    const result = await apiGet("/api/auth/dev-code?email=" + encodeURIComponent(email) + "&purpose=" + purpose);
    if (!result.enabled) return box.classList.add("hidden");
    box.innerHTML =
      '<span class="icon" aria-hidden="true">terminal</span><span>' +
      "<strong>Chế độ chạy thử (chưa cấu hình Gmail):</strong> " +
      (result.code
        ? 'mã OTP của bạn là <code class="dev-code__value">' + escapeHtml(result.code) + "</code>. Khi cấu hình Gmail, mã chỉ gửi qua email."
        : 'chưa có mã nào cho email này. Bấm "Gửi lại mã" để tạo mã mới.') +
      "</span>";
    box.classList.remove("hidden");
  } catch (error) {
    // không lấy được thì thôi, mã vẫn in ở cửa sổ dòng lệnh
  }
}
