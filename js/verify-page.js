// ======================================================================
// TRANG NHẬP OTP XÁC THỰC EMAIL (F31) — verify.html?email=...
// 6 ô số: gõ tự nhảy ô, dán cả mã một lần được, đủ 6 số tự gửi.
// Đúng mã → tài khoản được kích hoạt và đăng nhập luôn.
// ======================================================================
const verifyEmail = (getQueryParam("email") || "").trim().toLowerCase();
const verifyForm = document.getElementById("verify-form");
const digits = Array.from(document.querySelectorAll(".otp__digit"));
const verifyButton = verifyForm.querySelector("button[type=submit]");

if (!verifyEmail) {
  // Mở trang không kèm email: hướng dẫn quay lại đăng ký / đăng nhập
  document.getElementById("verify-lead").textContent = "Không rõ email cần xác thực. Hãy đăng ký hoặc đăng nhập lại.";
  verifyForm.classList.add("hidden");
} else {
  document.getElementById("verify-email").textContent = maskEmail(verifyEmail);
}

function getCode() {
  return digits.map(function (input) {
    return input.value;
  }).join("");
}

function markDigits(invalid) {
  digits.forEach(function (input) {
    input.setAttribute("aria-invalid", invalid ? "true" : "false");
  });
}

// Đặt nhiều chữ số vào các ô, bắt đầu từ ô thứ "start" (dùng khi dán mã)
function fillDigits(text, start) {
  const numbers = text.replace(/\D/g, "").split("");
  numbers.forEach(function (number, i) {
    if (digits[start + i]) digits[start + i].value = number;
  });
  const next = Math.min(start + numbers.length, digits.length - 1);
  digits[next].focus();
}

digits.forEach(function (input, index) {
  input.addEventListener("input", function () {
    markDigits(false);
    const value = input.value.replace(/\D/g, "");
    if (value.length > 1) {
      fillDigits(value, index); // trình duyệt điện thoại tự điền cả mã vào một ô
    } else {
      input.value = value;
      if (value && digits[index + 1]) digits[index + 1].focus();
    }
    if (getCode().length === 6) verifyForm.requestSubmit();
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Backspace" && !input.value && digits[index - 1]) {
      digits[index - 1].focus();
    }
  });

  input.addEventListener("paste", function (event) {
    event.preventDefault();
    fillDigits(event.clipboardData.getData("text"), index);
    if (getCode().length === 6) verifyForm.requestSubmit();
  });
});

verifyForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  hideAlert();
  const code = getCode();
  if (code.length !== 6) {
    showAlert("error", null, "Vui lòng nhập đủ 6 chữ số.");
    return;
  }

  setBusy(verifyButton, true, "Đang kiểm tra…");
  try {
    await apiPost("/api/auth/verify", { email: verifyEmail, code: code });
    showAlert("success", "Tài khoản đã kích hoạt thành công", "Đang chuyển bạn vào diễn đàn…");
    setTimeout(function () {
      window.location.href = safeNextPage(getQueryParam("next"), "forum.html");
    }, 1500);
  } catch (error) {
    setBusy(verifyButton, false);
    markDigits(true);
    if (error.code === "ALREADY_VERIFIED") {
      document.getElementById("form-alert").className = "alert alert--info";
      document.getElementById("form-alert").innerHTML =
        '<span class="icon" aria-hidden="true">info</span><div>' + escapeHtml(error.message) + ' <a href="login.html">Đăng nhập</a></div>';
      return;
    }
    const title = error.code === "CODE_WRONG" ? "Mã xác thực không đúng" : "Mã không còn hiệu lực";
    showAlert("error", title, error.message);
    digits.forEach(function (input) {
      input.value = "";
    });
    digits[0].focus();
  }
});

// Đếm ngược "Gửi lại sau 0:59" (vừa đăng ký xong thì phải chờ 60 giây)
const firstWait = Number(getQueryParam("wait")) || 0;
setupResendButton(document.getElementById("resend-button"), Math.min(firstWait, 60), async function () {
  const result = await apiPost("/api/auth/resend", { email: verifyEmail, purpose: "verify" });
  markDigits(false);
  showAlert("info", null, "Nếu email này đang chờ xác thực, mã mới đã được gửi. Mã cũ không còn dùng được.");
  digits[0].focus();
  showDevCode(document.getElementById("dev-code"), verifyEmail, "verify");
  return result.retryAfter;
});

showDevCode(document.getElementById("dev-code"), verifyEmail, "verify");

if (verifyEmail) digits[0].focus();
