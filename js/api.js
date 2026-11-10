// ======================================================================
// GỌI API CỦA SERVER JadeCard (từ giai đoạn 4, cần chạy "npm start")
// Mọi trang dùng chung các hàm ở đây để gửi yêu cầu và nhận lỗi theo một kiểu.
// Server trả lỗi dạng JSON: { error: "thông báo", code: "...", field: "..." }
// ======================================================================

// Gửi yêu cầu tới API. data có thể là đối tượng JS (gửi dạng JSON) hoặc FormData (có ảnh).
async function apiRequest(method, url, data) {
  const options = { method: method, headers: {}, credentials: "same-origin" };
  if (data instanceof FormData) {
    options.body = data; // trình duyệt tự đặt Content-Type multipart cho FormData
  } else if (data !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (networkError) {
    // Mở file .html trực tiếp (file://) hoặc server chưa chạy
    const error = new Error('Không kết nối được máy chủ. Hãy chạy "npm start" rồi mở http://localhost:5500.');
    error.status = 0;
    throw error;
  }

  const body = await response.json().catch(function () {
    return {};
  });
  if (!response.ok) {
    const error = new Error(body.error || "Có lỗi xảy ra, vui lòng thử lại.");
    error.status = response.status;
    error.code = body.code;
    error.field = body.field;
    error.data = body;
    throw error;
  }
  return body;
}

function apiGet(url) {
  return apiRequest("GET", url);
}

function apiPost(url, data) {
  return apiRequest("POST", url, data === undefined ? {} : data);
}

// Người đang đăng nhập (hoặc null). Chỉ hỏi server một lần cho mỗi lần tải trang.
let currentUserPromise = null;
function getCurrentUser() {
  if (!currentUserPromise) {
    currentUserPromise = apiGet("/api/auth/me")
      .then(function (result) {
        return result.user;
      })
      .catch(function () {
        return null;
      });
  }
  return currentUserPromise;
}

// Lấy tham số trên đường dẫn. Ví dụ thread.html?id=12 → getQueryParam("id") = "12"
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Trang hiện tại (tên file + tham số), dùng làm "next" để đăng nhập xong quay lại đúng chỗ
function currentPageForNext() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  return file + window.location.search;
}

// Chỉ chấp nhận "next" là một trang .html của chính website (chống chuyển hướng sang web lạ)
function safeNextPage(next, fallback) {
  if (next && /^[a-z0-9-]+\.html(\?[^#]*)?$/i.test(next)) return next;
  return fallback;
}
