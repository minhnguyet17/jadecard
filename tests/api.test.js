// ======================================================================
// KIỂM THỬ TỰ ĐỘNG API — chạy bằng: npm test
// Dùng bộ kiểm thử có sẵn của Node.js (node:test), không cần cài thêm.
// Mỗi lần chạy tạo một CSDL tạm riêng (có dữ liệu mẫu), không đụng data/jadecard.db.
// Mã ca kiểm thử (API-xx) khớp với bảng trong docs/test-report-cong-dong.md.
// ======================================================================
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Cấu hình môi trường thử TRƯỚC khi nạp code server
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jadecard-test-"));
process.env.NODE_ENV = "test";
process.env.DB_FILE = path.join(tempDir, "test.db");
process.env.UPLOAD_DIR = path.join(tempDir, "uploads");

const { seedDatabase, DEMO_PASSWORD } = require("../server/seed");
const { createApp } = require("../server/app");
const { testOutbox } = require("../server/mailer");
const { db } = require("../server/db");

seedDatabase();

let server;
let baseUrl;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = "http://localhost:" + server.address().port;
});

test.after(() => {
  server.close();
  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// Một "trình duyệt" nhỏ: tự giữ cookie giữa các lần gọi
function createClient() {
  let cookie = "";
  async function call(method, url, body) {
    const options = { method, headers: {} };
    if (cookie) options.headers.cookie = cookie;
    if (body instanceof FormData) {
      options.body = body;
    } else if (body !== undefined) {
      options.headers["content-type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    const response = await fetch(baseUrl + url, options);
    const setCookie = response.headers.getSetCookie();
    for (const line of setCookie) {
      const [pair] = line.split(";");
      const [name, value] = pair.split("=");
      if (name === "sid") cookie = value ? "sid=" + value : "";
    }
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  }
  return {
    get: (url) => call("GET", url),
    post: (url, body) => call("POST", url, body === undefined ? {} : body),
    patch: (url, body) => call("PATCH", url, body),
    put: (url, body) => call("PUT", url, body),
    login: (email) => call("POST", "/api/auth/login", { email, password: DEMO_PASSWORD }),
  };
}

function lastCode(email, purpose) {
  const mails = testOutbox.filter((mail) => mail.to === email && mail.purpose === purpose);
  return mails[mails.length - 1].code;
}

// Cho phép gửi lại OTP ngay (giả lập đã chờ đủ 60 giây)
function skipResendWait(email) {
  db.prepare(
    "UPDATE email_codes SET created_at = '2000-01-01T00:00:00.000Z' WHERE user_id = (SELECT id FROM users WHERE email = ?)"
  ).run(email);
}

// ---------------------------------------------------------------------
// TÀI KHOẢN (F30–F33)
// ---------------------------------------------------------------------

test("API-01 /api/health trả về OK", async () => {
  const res = await createClient().get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.data.ok, true);
});

test("API-02 F30 đăng ký hợp lệ → tài khoản Chưa xác thực, OTP được gửi", async () => {
  const client = createClient();
  const res = await client.post("/api/auth/register", {
    email: "New.Player@Example.com",
    displayName: "Thợ_Mới",
    password: "matkhau123",
    acceptRules: true,
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.email, "new.player@example.com"); // email được đổi về chữ thường
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get("new.player@example.com");
  assert.equal(user.email_verified, 0);
  assert.notEqual(user.password_hash, "matkhau123"); // không lưu mật khẩu thật
  assert.match(lastCode("new.player@example.com", "verify"), /^\d{6}$/);
  // CSDL chỉ có bản băm của OTP, không có mã thật
  const row = db.prepare("SELECT code_hash FROM email_codes WHERE user_id = ?").get(user.id);
  assert.notEqual(row.code_hash, lastCode("new.player@example.com", "verify"));
});

test("API-03 F30 dữ liệu sai bị từ chối (email trùng, tên trùng, tên sai, mật khẩu ngắn, chưa đồng ý quy định)", async () => {
  const client = createClient();
  const base = { email: "x@example.com", displayName: "Hop_Le", password: "matkhau123", acceptRules: true };
  const cases = [
    [{ email: "kenjiro@example.com" }, 409, "email"],
    [{ displayName: "KENJIRO" }, 409, "displayName"], // trùng tên, không phân biệt hoa thường
    [{ displayName: "ab" }, 400, "displayName"],
    [{ displayName: "co khoang trang" }, 400, "displayName"],
    [{ password: "1234567" }, 400, "password"],
    [{ email: "khong-phai-email" }, 400, "email"],
    [{ acceptRules: false }, 400, "acceptRules"],
  ];
  for (const [change, status, field] of cases) {
    const res = await client.post("/api/auth/register", { ...base, ...change });
    assert.equal(res.status, status, JSON.stringify(change));
    assert.equal(res.data.field, field, JSON.stringify(change));
  }
});

test("API-04 F31/F32 chưa xác thực thì không đăng nhập được; OTP sai bị đếm; OTP đúng → kích hoạt và đăng nhập", async () => {
  const client = createClient();
  const email = "new.player@example.com";

  const login = await client.post("/api/auth/login", { email, password: "matkhau123" });
  assert.equal(login.status, 403);
  assert.equal(login.data.code, "EMAIL_NOT_VERIFIED");

  const wrong = await client.post("/api/auth/verify", { email, code: "000000" === lastCode(email, "verify") ? "111111" : "000000" });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.data.attemptsLeft, 4);

  const ok = await client.post("/api/auth/verify", { email, code: lastCode(email, "verify") });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.displayName, "Thợ_Mới");
  assert.equal(ok.data.user.rank.name, "Chiếu mới"); // chức vụ thấp nhất
  assert.equal(ok.data.user.email, undefined); // không trả email ra ngoài

  const me = await client.get("/api/auth/me");
  assert.equal(me.data.user.displayName, "Thợ_Mới");

  // Mã đã dùng thì không dùng lại được
  const again = await client.post("/api/auth/verify", { email, code: lastCode(email, "verify") });
  assert.equal(again.data.code, "ALREADY_VERIFIED");
});

test("API-05 F31 sai OTP 5 lần → mã hết hiệu lực, kể cả nhập đúng; gửi lại bị chặn trong 60 giây", async () => {
  const client = createClient();
  const email = "otp.test@example.com";
  await client.post("/api/auth/register", { email, displayName: "OtpTest", password: "matkhau123", acceptRules: true });
  const code = lastCode(email, "verify");
  const wrongCode = code === "999999" ? "888888" : "999999";

  for (let i = 0; i < 5; i++) await client.post("/api/auth/verify", { email, code: wrongCode });
  const locked = await client.post("/api/auth/verify", { email, code });
  assert.equal(locked.data.code, "CODE_LOCKED");

  const mailsBefore = testOutbox.length;
  const tooSoon = await client.post("/api/auth/resend", { email, purpose: "verify" });
  assert.ok(tooSoon.data.retryAfter > 0);
  assert.equal(testOutbox.length, mailsBefore); // chưa gửi mail mới

  skipResendWait(email);
  await client.post("/api/auth/resend", { email, purpose: "verify" });
  const ok = await client.post("/api/auth/verify", { email, code: lastCode(email, "verify") });
  assert.equal(ok.status, 200);
});

test("API-06 F31 OTP quá 10 phút thì hết hạn", async () => {
  const client = createClient();
  const email = "expired@example.com";
  await client.post("/api/auth/register", { email, displayName: "HetHan", password: "matkhau123", acceptRules: true });
  db.prepare("UPDATE email_codes SET expires_at = '2000-01-01T00:00:00.000Z'").run();
  const res = await client.post("/api/auth/verify", { email, code: lastCode(email, "verify") });
  assert.equal(res.data.code, "CODE_EXPIRED");
});

test("API-07 F32 sai mật khẩu 5 lần → khóa đăng nhập 15 phút (đúng mật khẩu cũng không vào được)", async () => {
  const client = createClient();
  for (let i = 0; i < 4; i++) {
    const res = await client.post("/api/auth/login", { email: "nam@example.com", password: "sai-mat-khau" });
    assert.equal(res.status, 401);
  }
  const fifth = await client.post("/api/auth/login", { email: "nam@example.com", password: "sai-mat-khau" });
  assert.equal(fifth.data.code, "LOGIN_LOCKED");
  const correct = await client.login("nam@example.com");
  assert.equal(correct.status, 429);
  db.prepare("UPDATE users SET locked_until = NULL WHERE email = 'nam@example.com'").run();
});

test("API-08 F32 sai email và sai mật khẩu nhận cùng một thông báo; đăng xuất xóa phiên", async () => {
  const client = createClient();
  const noUser = await client.post("/api/auth/login", { email: "khong-ton-tai@example.com", password: "abcdefgh" });
  const wrongPass = await client.post("/api/auth/login", { email: "pikafan@example.com", password: "abcdefgh" });
  assert.equal(noUser.data.error, wrongPass.data.error);
  db.prepare("UPDATE users SET failed_logins = 0 WHERE email = 'pikafan@example.com'").run();

  await client.login("pikafan@example.com");
  assert.ok((await client.get("/api/auth/me")).data.user);
  await client.post("/api/auth/logout");
  assert.equal((await client.get("/api/auth/me")).data.user, null);
});

test("API-09 F33 quên mật khẩu: thông báo giống nhau; đổi xong mọi phiên cũ bị đăng xuất", async () => {
  const oldDevice = createClient();
  await oldDevice.login("huy@example.com");
  assert.ok((await oldDevice.get("/api/auth/me")).data.user);

  const client = createClient();
  const exists = await client.post("/api/auth/forgot", { email: "huy@example.com" });
  const missing = await client.post("/api/auth/forgot", { email: "ai-do@example.com" });
  assert.equal(exists.data.message, missing.data.message);

  const res = await client.post("/api/auth/reset", { email: "huy@example.com", code: lastCode("huy@example.com", "reset"), password: "matkhaumoi9" });
  assert.equal(res.status, 200);
  assert.equal((await oldDevice.get("/api/auth/me")).data.user, null); // phiên cũ đã bị đăng xuất

  const newLogin = await client.post("/api/auth/login", { email: "huy@example.com", password: "matkhaumoi9" });
  assert.equal(newLogin.status, 200);
});

// ---------------------------------------------------------------------
// DIỄN ĐÀN (F34–F40, F52, F53)
// ---------------------------------------------------------------------

test("API-10 F34/F53 trang chủ diễn đàn: 3 forum, số đếm, thành viên nổi bật tuần", async () => {
  const res = await createClient().get("/api/forum");
  assert.deepEqual(res.data.forums.map((f) => f.code), ["F100", "F368", "F666"]);
  assert.ok(res.data.forums[1].threadCount > 20);
  assert.ok(res.data.topMembers.length > 0 && res.data.topMembers.length <= 5);
});

test("API-11 F35 danh sách topic: ghim ở trang 1, 20 topic/trang, lọc theo tag", async () => {
  const client = createClient();
  const page1 = await client.get("/api/forums/F368/threads");
  assert.ok(page1.data.pinned.length >= 1);
  assert.equal(page1.data.threads.length, 20);
  assert.ok(page1.data.pageCount >= 2);
  const page2 = await client.get("/api/forums/F368/threads?page=2");
  assert.equal(page2.data.pinned.length, 0); // topic ghim chỉ hiện ở trang 1

  const prefix = page1.data.prefixes.find((p) => p.name === "Định giá");
  const filtered = await client.get("/api/forums/F368/threads?prefix=" + prefix.id);
  assert.ok(filtered.data.threads.every((t) => t.prefix.name === "Định giá"));
  assert.equal(filtered.data.total, prefix.count);
});

test("API-12 F36 xem topic: 20 bài/trang, khung tác giả có chức vụ, không lộ email", async () => {
  const client = createClient();
  const list = await client.get("/api/forums/F368/threads");
  const longThread = list.data.threads.find((t) => t.replyCount >= 20);
  const page1 = await client.get("/api/threads/" + longThread.id);
  assert.equal(page1.data.posts.length, 20);
  assert.equal(page1.data.posts[0].isFirst, true);
  assert.ok(page1.data.posts[0].author.rank.name);
  assert.equal(JSON.stringify(page1.data).includes("@example.com"), false);
  const page2 = await client.get("/api/threads/" + longThread.id + "?page=2");
  assert.equal(page2.data.posts[0].number, 21);
});

test("API-13 F37 khách không tạo được topic; thành viên tạo được; F100 chỉ Admin; Mua bán cần tin ký gửi", async () => {
  const guest = createClient();
  const prefixes = (await guest.get("/api/forums/F368/threads")).data.prefixes;
  const bocThe = prefixes.find((p) => p.name === "Bóc thẻ");
  const muaBan = prefixes.find((p) => p.name === "Mua bán");

  const noLogin = await guest.post("/api/forums/F368/threads", { prefixId: bocThe.id, title: "Topic của khách", content: "abc" });
  assert.equal(noLogin.status, 401);

  const member = createClient();
  await member.login("tuan@example.com");
  const created = await member.post("/api/forums/F368/threads", { prefixId: bocThe.id, title: "Topic thử nghiệm", content: "Nội dung <script>alert(1)</script>" });
  assert.equal(created.status, 201);
  const thread = await member.get("/api/threads/" + created.data.id);
  // Server lưu nguyên chữ; giao diện lọc HTML khi hiển thị (escapeHtml trong js/community-ui.js)
  assert.equal(thread.data.posts[0].content, "Nội dung <script>alert(1)</script>");

  const shortTitle = await member.post("/api/forums/F368/threads", { prefixId: bocThe.id, title: "abc", content: "x" });
  assert.equal(shortTitle.data.field, "title");

  const sale = await member.post("/api/forums/F368/threads", { prefixId: muaBan.id, title: "Bán Charizard", content: "x" });
  assert.equal(sale.status, 400);
  assert.equal(sale.data.field, "listingId"); // Mua bán phải gắn tin ký gửi (F50)

  const f100Prefix = (await member.get("/api/forums/F100/threads")).data.prefixes[0];
  const notAdmin = await member.post("/api/forums/F100/threads", { prefixId: f100Prefix.id, title: "Thông báo giả", content: "x" });
  assert.equal(notAdmin.status, 403);

  const admin = createClient();
  await admin.login("admin@jadecard.test");
  const adminPost = await admin.post("/api/forums/F100/threads", { prefixId: f100Prefix.id, title: "Thông báo thật", content: "x" });
  assert.equal(adminPost.status, 201);

  // Tag của forum khác không dùng được
  const wrongForumTag = await member.post("/api/forums/F666/threads", { prefixId: bocThe.id, title: "Sai tag forum", content: "x" });
  assert.equal(wrongForumTag.data.field, "prefixId");
});

test("API-14 F37 ảnh: nhận JPG/PNG/WebP thật, từ chối file giả đuôi ảnh và quá 4 ảnh", async () => {
  const member = createClient();
  await member.login("bao@example.com");
  const prefixId = (await member.get("/api/forums/F368/threads")).data.prefixes[0].id;
  const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4b70000000049454e44ae426082", "hex");

  const ok = new FormData();
  ok.append("prefixId", prefixId);
  ok.append("title", "Topic có ảnh");
  ok.append("content", "Ảnh thẻ vừa bóc");
  ok.append("images", new Blob([png], { type: "image/png" }), "the.png");
  const created = await member.post("/api/forums/F368/threads", ok);
  assert.equal(created.status, 201);
  const thread = await member.get("/api/threads/" + created.data.id);
  const imagePath = thread.data.posts[0].images[0];
  assert.match(imagePath, /^\/uploads\/forum\/[a-f0-9]{24}\.png$/);
  const image = await fetch(baseUrl + imagePath);
  assert.equal(image.status, 200);

  const fake = new FormData();
  fake.append("prefixId", prefixId);
  fake.append("title", "Topic ảnh giả");
  fake.append("content", "x");
  fake.append("images", new Blob(["<script>alert(1)</script>"], { type: "image/png" }), "hack.png");
  const rejected = await member.post("/api/forums/F368/threads", fake);
  assert.equal(rejected.status, 400);
  assert.equal(rejected.data.field, "images");

  const tooMany = new FormData();
  tooMany.append("prefixId", prefixId);
  tooMany.append("title", "Quá nhiều ảnh");
  tooMany.append("content", "x");
  for (let i = 0; i < 5; i++) tooMany.append("images", new Blob([png], { type: "image/png" }), i + ".png");
  const tooManyRes = await member.post("/api/forums/F368/threads", tooMany);
  assert.equal(tooManyRes.status, 400);
});

test("API-15 F38 trả lời; topic khóa thì không trả lời được; chỉ sửa được bài của mình", async () => {
  const member = createClient();
  await member.login("tuan@example.com");
  const threads = (await member.get("/api/forums/F368/threads")).data;
  const openThread = threads.threads[0];
  const lockedThread = threads.pinned.find((t) => t.locked);

  const reply = await member.post("/api/threads/" + openThread.id + "/posts", { content: "Trả lời thử" });
  assert.equal(reply.status, 201);
  const after = await member.get("/api/threads/" + openThread.id + "?page=" + reply.data.page);
  assert.ok(after.data.posts.some((p) => p.id === reply.data.postId));

  const locked = await member.post("/api/threads/" + lockedThread.id + "/posts", { content: "x" });
  assert.equal(locked.data.code, "THREAD_LOCKED");

  const edit = await member.patch("/api/posts/" + reply.data.postId, { content: "Đã sửa" });
  assert.equal(edit.status, 200);
  assert.ok(edit.data.editedAt);

  // Truy cập trái phép: A sửa bài của B
  const other = createClient();
  await other.login("son@example.com");
  const hack = await other.patch("/api/posts/" + reply.data.postId, { content: "Bị sửa trộm" });
  assert.equal(hack.status, 403);
});

test("API-16 F39/F40 like: không tự like, like lần 2 là bỏ like, like làm đổi chức vụ", async () => {
  const author = createClient();
  await author.login("pikafan@example.com");
  const prefixId = (await author.get("/api/forums/F666/threads")).data.prefixes[0].id;
  const created = await author.post("/api/forums/F666/threads", { prefixId, title: "Hỏi luật về Prize", content: "Cho mình hỏi…" });
  const postId = (await author.get("/api/threads/" + created.data.id)).data.posts[0].id;

  const self = await author.post("/api/posts/" + postId + "/like");
  assert.equal(self.status, 400);

  // Đưa PikaFan về sát ngưỡng Học việc (10 like) để thấy chức vụ đổi
  db.prepare("UPDATE users SET likes_received = 9 WHERE display_name = 'PikaFan'").run();
  const fan = createClient();
  await fan.login("kenjiro@example.com");
  const liked = await fan.post("/api/posts/" + postId + "/like");
  assert.deepEqual(liked.data, { liked: true, likeCount: 1 });
  let profile = await fan.get("/api/users/PikaFan");
  assert.equal(profile.data.user.rank.name, "Học việc");

  const unliked = await fan.post("/api/posts/" + postId + "/like");
  assert.deepEqual(unliked.data, { liked: false, likeCount: 0 });
  profile = await fan.get("/api/users/PikaFan");
  assert.equal(profile.data.user.rank.name, "Chiếu mới");

  const guest = await createClient().post("/api/posts/" + postId + "/like");
  assert.equal(guest.status, 401);
});

test("API-17 F52 lượt xem: tác giả không tính, mỗi người 1 lượt/giờ", async () => {
  const author = createClient();
  await author.login("son@example.com");
  const prefixId = (await author.get("/api/forums/F368/threads")).data.prefixes[0].id;
  const created = await author.post("/api/forums/F368/threads", { prefixId, title: "Đếm lượt xem", content: "x" });
  const url = "/api/threads/" + created.data.id;

  await author.get(url);
  const viewer = createClient();
  await viewer.login("bao@example.com");
  await viewer.get(url);
  await viewer.get(url); // xem lại trong 1 giờ: không tính thêm
  const result = await viewer.get(url);
  assert.equal(result.data.thread.viewCount, 1);
});

test("API-18 F41 hồ sơ công khai không có email; tên không tồn tại → 404", async () => {
  const client = createClient();
  const res = await client.get("/api/users/" + encodeURIComponent("Minh_CardVault"));
  assert.equal(res.status, 200);
  assert.equal(res.data.ranks.length, 7);
  assert.equal(JSON.stringify(res.data).includes("@"), false);
  assert.equal((await client.get("/api/users/KhongCoAi")).status, 404);
});

test("API-19 Website tĩnh không để lộ code server, CSDL, file .env", async () => {
  for (const url of ["/server/db.js", "/data/jadecard.db", "/.env", "/package.json", "/node_modules/express/package.json", "/scss/main.scss"]) {
    const res = await fetch(baseUrl + url);
    assert.equal(res.status, 404, url);
  }
  assert.equal((await fetch(baseUrl + "/forum.html")).status, 200);
});

// =====================================================================
// CỘNG ĐỒNG ĐỢT 2: BỘ SƯU TẬP, KÝ GỬI, TRẢ GIÁ, ĐƠN HÀNG, ĐÁNH GIÁ, F50, KIỂM DUYỆT
// Dữ liệu mẫu (server/seed-shop.js): tin 1 Charizard (Son, đang bán, có topic + 1 trả giá của Huy),
// 2 Umbreon (Kenjiro), 3 Pikachu ex (Minh, có topic), 4 Pikachu IR (Son), 5 Rayquaza (Nam),
// 6 Greninja (Bao, chờ kiểm định, có topic), 7 Mew (Tuan, đã tất toán), 8 Lugia (Kenjiro, đã bán).
// Đơn 1, 2 hoàn thành; đơn 3 của PikaFan đang chờ xác nhận.
// =====================================================================

const PNG_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4b70000000049454e44ae426082",
  "hex"
);
const CARD = {
  cardId: "sv06-214",
  name: "Greninja ex",
  setName: "Twilight Masquerade",
  number: "214/167",
  image: "https://assets.tcgdex.net/en/sv/sv06/214",
};

// Form có ảnh (multipart) cho đăng tin / kiểm định
function photoForm(fields, imageCount) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  for (let i = 0; i < imageCount; i++) form.append("images", new Blob([PNG_BYTES], { type: "image/png" }), i + ".png");
  return form;
}

const stockOf = (productId) => db.prepare("SELECT stock FROM product_stock WHERE product_id = ?").get(productId).stock;
const listingStatus = (id) => db.prepare("SELECT status FROM listings WHERE id = ?").get(id).status;
const likesOf = (name) => db.prepare("SELECT likes_received FROM users WHERE display_name = ?").get(name).likes_received;

async function loggedIn(email, password) {
  const client = createClient();
  const res = password ? await client.post("/api/auth/login", { email, password }) : await client.login(email);
  assert.equal(res.status, 200, "đăng nhập " + email);
  return client;
}

test("API-20 F13/F14/F27 bộ sưu tập: cộng dồn thẻ trùng, chỉ chủ sửa được, quyền riêng tư, gộp từ trình duyệt", async () => {
  const kenji = await loggedIn("kenjiro@example.com");
  const before = (await kenji.get("/api/collection")).data;
  assert.equal(before.settings.showValue, true);

  await kenji.post("/api/collection", { list: "have", card: CARD, variant: "holo", condition: "NM", quantity: 2, savedPrice: 5000000 });
  const after = await kenji.post("/api/collection", { list: "have", card: CARD, variant: "holo", condition: "NM", quantity: 2, savedPrice: 5000000 });
  const row = after.data.items.find((item) => item.cardId === CARD.cardId && item.list === "have");
  assert.equal(row.quantity, 4); // thẻ trùng → cộng số lượng, không tạo dòng mới

  const want = await kenji.post("/api/collection", { list: "want", card: CARD, variant: "holo" });
  assert.equal(want.data.items.find((item) => item.list === "want" && item.cardId === CARD.cardId).savedPrice, null); // không có giá ≠ 0đ

  const badImage = await kenji.post("/api/collection", { list: "have", card: { ...CARD, image: "https://evil.example/x.png" }, variant: "holo", condition: "NM" });
  assert.equal(badImage.data.field, "card");

  // Truy cập trái phép: Son sửa thẻ của Kenjiro
  const son = await loggedIn("son@example.com");
  assert.equal((await son.patch("/api/collection/" + row.id, { quantity: 99 })).status, 403);

  const guest = createClient();
  // Minh để riêng tư: người khác chỉ thấy "đang ẩn", chính chủ vẫn thấy
  assert.equal((await guest.get("/api/users/Minh_CardVault/collection")).data.hidden, true);
  assert.equal((await (await loggedIn("minh@example.com")).get("/api/users/Minh_CardVault/collection")).data.hidden, false);
  assert.equal((await guest.get("/api/users/Minh_CardVault/card")).data.collectionCount, null); // F54 không lộ số thẻ

  // Son công khai nhưng ẩn tổng giá trị; thẻ đang ký gửi có nhãn "Đang bán"
  const sonCollection = (await guest.get("/api/users/Son_Grail/collection")).data;
  assert.equal(sonCollection.totalValue, null);
  assert.equal(sonCollection.items.find((item) => item.cardId === "sv03.5-199").onSaleListingId, 1);
  assert.ok((await guest.get("/api/users/Kenjiro/collection")).data.totalValue > 0); // Kenjiro bật hiện tổng

  // Gộp bộ sưu tập trên trình duyệt: dòng hỏng bị bỏ qua
  const pika = await loggedIn("pikafan@example.com");
  const merged = await pika.post("/api/collection/merge", {
    items: [
      { list: "have", card: CARD, variant: "holo", condition: "LP", quantity: 1, savedPrice: 4000000 },
      { list: "want", card: { ...CARD, cardId: "sv08-238", number: "238/191" }, variant: "holo" },
      { list: "have", card: { cardId: "!!" }, variant: "holo", condition: "NM" },
    ],
  });
  assert.equal(merged.data.merged, 2);

  // Chuyển sang riêng tư → người khác chỉ thấy "đang ẩn"; chưa đăng nhập thì không đổi được cài đặt
  await pika.put("/api/collection/settings", { isPublic: false, showValue: false });
  assert.equal((await createClient().get("/api/users/PikaFan/collection")).data.hidden, true);
  assert.equal((await createClient().put("/api/collection/settings", { isPublic: true })).status, 401);
});

test("API-21 F43 đăng tin ký gửi: cần 2–6 ảnh, giá tối thiểu; tin mới chưa hiện công khai; thành viên / Mod không gọi được API kiểm định", async () => {
  const tuan = await loggedIn("tuan@example.com");
  const fields = { card: CARD, variant: "holo", condition: "NM", askingPrice: 6500000, description: "Thẻ test" };

  const oneImage = await tuan.post("/api/listings", photoForm(fields, 1));
  assert.equal(oneImage.data.field, "images");
  const cheap = await tuan.post("/api/listings", photoForm({ ...fields, askingPrice: 10000 }, 2));
  assert.equal(cheap.data.field, "askingPrice");

  const created = await tuan.post("/api/listings", photoForm(fields, 2));
  assert.equal(created.status, 201);
  assert.equal(created.data.code, "KG-0009");
  assert.equal(created.data.commission, 520000); // 8% của 6.500.000
  assert.equal(created.data.payout, 5980000);

  assert.equal((await createClient().get("/api/listings/9")).status, 404); // chưa kiểm định → chưa công khai
  assert.equal((await tuan.get("/api/listings/9")).data.listing.status, "pending"); // chủ tin vẫn xem được
  const market = (await createClient().get("/api/listings")).data.listings.map((card) => card.id);
  assert.equal(market.includes(9), false);

  assert.equal((await tuan.post("/api/admin/listings/9/verify", photoForm({ result: "pass" }, 1))).status, 403);
  const mod = await loggedIn("mod@jadecard.test");
  assert.equal((await mod.post("/api/admin/listings/9/verify", photoForm({ result: "pass" }, 1))).status, 403); // Mod không có quyền ký gửi
});

test("API-22 F44 kiểm định: Đạt cần thẻ thật + ảnh shop chụp → Đang bán có huy hiệu; Từ chối cần lý do", async () => {
  const admin = await loggedIn("admin@jadecard.test");
  const noPhoto = await admin.post("/api/admin/listings/9/verify", photoForm({ result: "pass", authentic: "1", conditionVerified: "LP", listPrice: 6000000 }, 0));
  assert.equal(noPhoto.data.field, "images");
  const fake = await admin.post("/api/admin/listings/9/verify", photoForm({ result: "pass", authentic: "0", conditionVerified: "LP", listPrice: 6000000 }, 1));
  assert.equal(fake.data.field, "authentic");

  const pass = await admin.post("/api/admin/listings/9/verify", photoForm({ result: "pass", authentic: "1", conditionVerified: "LP", listPrice: 6000000 }, 1));
  assert.equal(pass.data.status, "active");
  const detail = (await createClient().get("/api/listings/9")).data;
  assert.equal(detail.listing.verified, true);
  assert.equal(detail.listing.condition, "LP"); // tình trạng thực tế thay cho tình trạng tự khai
  assert.equal(detail.listing.price, 6000000);
  assert.equal(detail.listing.images.shop.length, 1);
  assert.equal((await admin.post("/api/admin/listings/9/verify", photoForm({ result: "pass" }, 1))).status, 400); // không kiểm định 2 lần

  // Tin khác bị từ chối
  const tuan = await loggedIn("tuan@example.com");
  const second = await tuan.post("/api/listings", photoForm({ card: CARD, variant: "holo", condition: "NM", askingPrice: 900000 }, 2));
  const noReason = await admin.post("/api/admin/listings/" + second.data.id + "/verify", photoForm({ result: "reject", authentic: "0" }, 0));
  assert.equal(noReason.data.field, "rejectReason");
  await admin.post("/api/admin/listings/" + second.data.id + "/verify", photoForm({ result: "reject", authentic: "0", rejectReason: "Nghi thẻ giả" }, 0));
  assert.equal(listingStatus(second.data.id), "rejected");
  assert.equal((await createClient().get("/api/listings/" + second.data.id)).status, 404);
});

test("API-23 F55 trả giá: 50% → dưới 100%, mỗi người 1 đề nghị chờ; chấp nhận → giữ 24 giờ, đề nghị khác bị từ chối", async () => {
  const tuan = await loggedIn("tuan@example.com");
  const bao = await loggedIn("bao@example.com");
  const kenji = await loggedIn("kenjiro@example.com");

  assert.equal((await tuan.post("/api/listings/9/offers", { amount: 5000000 })).status, 400); // không tự trả giá tin của mình
  assert.equal((await bao.post("/api/listings/9/offers", { amount: 2000000 })).data.field, "amount"); // dưới 50%
  assert.equal((await bao.post("/api/listings/9/offers", { amount: 6000000 })).data.field, "amount"); // bằng giá niêm yết
  const offer = await bao.post("/api/listings/9/offers", { amount: 5000000 });
  assert.equal(offer.status, 201);
  assert.equal((await bao.post("/api/listings/9/offers", { amount: 5100000 })).status, 409);
  await kenji.post("/api/listings/9/offers", { amount: 5200000 });

  assert.equal((await bao.post("/api/offers/" + offer.data.id + "/accept")).status, 403); // người mua không tự chấp nhận
  const accepted = await tuan.post("/api/offers/" + offer.data.id + "/accept");
  assert.ok(accepted.data.holdUntil);
  assert.equal(listingStatus(9), "held");
  assert.equal((await kenji.get("/api/listings/9")).data.myOffer.status, "declined");

  // Chỉ người trả giá mua được, với giá đã chốt
  const kenjiOrder = await kenji.post("/api/orders", {
    items: [{ type: "listing", id: 9 }], recipientName: "Kenjiro", phone: "0901234567", delivery: "pickup", payment: "cod", clientKey: "kenji-held-01",
  });
  assert.equal(kenjiOrder.data.code, "LISTING_UNAVAILABLE");
  const baoView = (await bao.get("/api/listings/9")).data;
  assert.equal(baoView.canBuy, true);
  assert.equal(baoView.buyPrice, 5000000);
});

test("API-24 F05/F47/F20 đặt hàng: chống đặt 2 lần, giữ tin ký gửi, xác nhận trừ kho, hoa hồng trên giá cuối, COD hoàn thành thì đã thanh toán", async () => {
  const bao = await loggedIn("bao@example.com");
  const order = {
    items: [{ type: "listing", id: 9 }, { type: "product", id: 15, quantity: 2 }],
    recipientName: "Bảo TCG", phone: "0901234567", delivery: "ship", address: "45 Đường Mẫu, Quận 3, TP.HCM", payment: "cod", clientKey: "bao-order-0001",
  };
  const badPhone = await bao.post("/api/orders", { ...order, phone: "12345", clientKey: "bao-order-bad" });
  assert.equal(badPhone.data.field, "phone");
  const noAddress = await bao.post("/api/orders", { ...order, address: "", clientKey: "bao-order-bad2" });
  assert.equal(noAddress.data.field, "address");
  const tooMany = await bao.post("/api/orders", { ...order, items: [{ type: "product", id: 1, quantity: 2 }], clientKey: "bao-order-bad3" });
  assert.equal(tooMany.status, 409); // vượt tồn kho

  const created = await bao.post("/api/orders", order);
  assert.equal(created.status, 201);
  assert.equal(created.data.order.total, 5000000 + 2 * 120000 + 30000); // giá đã chốt + pack + phí ship
  const again = await bao.post("/api/orders", order);
  assert.equal(again.data.duplicate, true);
  assert.equal(again.data.order.id, created.data.order.id); // bấm 2 lần không tạo 2 đơn
  assert.equal(listingStatus(9), "reserved");
  assert.equal(stockOf(15), 40); // chưa xác nhận thì chưa trừ kho

  const admin = await loggedIn("admin@jadecard.test");
  const orderId = created.data.order.id;
  await admin.post("/api/admin/orders/" + orderId + "/action", { action: "confirm" });
  assert.equal(stockOf(15), 38);
  const sold = db.prepare("SELECT status, final_price, commission, payout FROM listings WHERE id = 9").get();
  assert.deepEqual({ ...sold }, { status: "sold", final_price: 5000000, commission: 400000, payout: 4600000 });

  const itemId = db.prepare("SELECT id FROM order_items WHERE order_id = ? AND kind = 'listing'").get(orderId).id;
  assert.equal((await bao.post("/api/order-items/" + itemId + "/review", { stars: 5 })).status, 400); // chưa hoàn thành

  await admin.post("/api/admin/orders/" + orderId + "/action", { action: "advance" }); // Đang giao
  const done = await admin.post("/api/admin/orders/" + orderId + "/action", { action: "advance" }); // Hoàn thành
  assert.equal(done.data.order.status, "completed");
  assert.equal(done.data.order.paymentStatus, "paid");
});

test("API-25 F56 đánh giá người bán: 1–5 sao, mỗi dòng đơn một lần, chỉ người mua; điểm hiện trên hồ sơ", async () => {
  const bao = await loggedIn("bao@example.com");
  const itemId = db.prepare("SELECT id FROM order_items WHERE listing_id = 9").get().id;
  assert.equal((await bao.post("/api/order-items/" + itemId + "/review", { stars: 6 })).data.field, "stars");
  const kenji = await loggedIn("kenjiro@example.com");
  assert.equal((await kenji.post("/api/order-items/" + itemId + "/review", { stars: 1 })).status, 403); // không phải người mua
  assert.equal((await bao.post("/api/order-items/" + itemId + "/review", { stars: 4, comment: "<b>Ổn</b>" })).status, 201);
  assert.equal((await bao.post("/api/order-items/" + itemId + "/review", { stars: 5 })).status, 409);

  const profile = (await createClient().get("/api/users/Tuan_Poke")).data;
  assert.equal(profile.sellerStats.ratingCount, 2); // 1 từ dữ liệu mẫu + 1 vừa gửi
  assert.equal(profile.sellerStats.ratingAvg, 4.5);
  assert.equal(profile.sellerStats.successCount, 2);
});

test("API-26 F49 tất toán: chỉ tin Đã bán có đơn hoàn thành, không tất toán 2 lần, chỉ Admin", async () => {
  const admin = await loggedIn("admin@jadecard.test");
  const tuan = await loggedIn("tuan@example.com");
  assert.equal((await tuan.post("/api/admin/listings/9/settle")).status, 403);
  assert.equal((await admin.post("/api/admin/listings/1/settle")).status, 400); // đang bán
  const ok = await admin.post("/api/admin/listings/9/settle");
  assert.equal(ok.data.payout, 4600000);
  assert.equal((await admin.post("/api/admin/listings/9/settle")).status, 409);
  assert.equal(listingStatus(9), "settled");
});

test("API-27 F20 hủy đơn: hoàn kho đúng một lần, thiếu hàng không xác nhận được, tin ký gửi quay lại bán", async () => {
  const admin = await loggedIn("admin@jadecard.test");
  const kenji = await loggedIn("kenjiro@example.com");
  const base = { recipientName: "Kenjiro", phone: "0901234567", delivery: "pickup", payment: "transfer" };

  const order = await kenji.post("/api/orders", { ...base, items: [{ type: "product", id: 14, quantity: 1 }, { type: "listing", id: 5 }], clientKey: "kenji-cancel-01" });
  const id = order.data.order.id;
  assert.equal(listingStatus(5), "reserved");
  const stock = stockOf(14);
  await admin.post("/api/admin/orders/" + id + "/action", { action: "confirm" });
  assert.equal(stockOf(14), stock - 1);
  await admin.post("/api/admin/orders/" + id + "/action", { action: "cancel", note: "Khách đổi ý" });
  assert.equal(stockOf(14), stock); // hoàn kho
  assert.equal((await admin.post("/api/admin/orders/" + id + "/action", { action: "cancel" })).status, 400);
  assert.equal(stockOf(14), stock); // không hoàn 2 lần
  assert.equal(listingStatus(5), "active");

  // Đặt khi còn hàng, sau đó kho về 0 → không xác nhận được
  const late = await kenji.post("/api/orders", { ...base, items: [{ type: "product", id: 13, quantity: 1 }], clientKey: "kenji-late-01" });
  db.prepare("UPDATE product_stock SET stock = 0 WHERE product_id = 13").run();
  assert.equal((await admin.post("/api/admin/orders/" + late.data.order.id + "/action", { action: "confirm" })).status, 409);

  // Khách tự hủy đơn còn Chờ xác nhận; đơn của người khác thì không
  const pika = await loggedIn("pikafan@example.com");
  assert.equal((await kenji.post("/api/orders/3/cancel")).status, 403);
  assert.equal((await pika.post("/api/orders/3/cancel")).status, 200);
  assert.equal((await kenji.get("/api/orders")).data.orders.every((o) => o.code !== "DH-00003"), true);
  assert.equal((await createClient().post("/api/orders", base)).status, 401);
});

test("API-28 F50 gắn tin vào topic Mua bán: chỉ tin của mình, mỗi tin một topic, thẻ sản phẩm theo trạng thái mới nhất", async () => {
  const son = await loggedIn("son@example.com");
  const bao = await loggedIn("bao@example.com");
  const prefix = (await son.get("/api/forums/F368/threads")).data.prefixes.find((p) => p.name === "Mua bán");
  const thread = { prefixId: prefix.id, title: "[Mua bán] Thử gắn tin", content: "Nội dung" };

  assert.equal((await bao.post("/api/forums/F368/threads", { ...thread, listingId: 4 })).status, 403); // tin của Son
  assert.equal((await son.post("/api/forums/F368/threads", { ...thread, listingId: 1 })).status, 409); // tin 1 đã có topic
  const attachable = (await son.get("/api/my/attachable-listings")).data.listings.map((card) => card.id);
  assert.deepEqual(attachable, [4]);

  const created = await son.post("/api/forums/F368/threads", { ...thread, listingId: 4 });
  assert.equal(created.status, 201);
  const view = (await createClient().get("/api/threads/" + created.data.id)).data;
  assert.equal(view.listing.cardName, "Pikachu (Illustration Rare)");
  assert.equal(view.listing.verified, true);

  // Topic có tin "Chờ kiểm định" (dữ liệu mẫu, Greninja của Bao) → thẻ hiện Chưa xác thực
  const pendingThread = db.prepare("SELECT id FROM threads WHERE listing_id = 6").get().id;
  assert.equal((await createClient().get("/api/threads/" + pendingThread)).data.listing.verified, false);
  // Tin đã bán thì danh sách topic hiện ĐÃ BÁN
  db.prepare("UPDATE listings SET status = 'sold' WHERE id = 4").run();
  const row = (await createClient().get("/api/forums/F368/threads")).data.threads.find((t) => t.id === created.data.id);
  assert.equal(row.listing.sold, true);
  db.prepare("UPDATE listings SET status = 'active' WHERE id = 4").run();
});

test("API-29 F42 kiểm duyệt: báo cáo, ẩn bài trừ like của tác giả, khóa tài khoản, thành viên không gọi được quyền Mod", async () => {
  const kenji = await loggedIn("kenjiro@example.com");
  const mod = await loggedIn("mod@jadecard.test");
  const post = db.prepare(
    "SELECT p.id, p.thread_id, p.like_count FROM posts p JOIN users u ON u.id = p.user_id WHERE u.display_name = 'Son_Grail' AND p.like_count > 0 AND p.id NOT IN (SELECT MIN(id) FROM posts GROUP BY thread_id) LIMIT 1"
  ).get();

  assert.equal((await kenji.post("/api/posts/" + post.id + "/report", { reason: "Không có lý do này" })).data.field, "reason");
  assert.equal((await kenji.post("/api/posts/" + post.id + "/report", { reason: "Spam / quảng cáo" })).status, 201);
  assert.equal((await kenji.post("/api/posts/" + post.id + "/report", { reason: "Spam / quảng cáo" })).status, 409);
  assert.ok((await mod.get("/api/mod/reports")).data.reports.some((r) => r.post.id === post.id));
  assert.equal((await kenji.get("/api/mod/reports")).status, 403);
  assert.equal((await kenji.post("/api/threads/" + post.thread_id + "/moderate", { action: "lock" })).status, 403);

  const likes = likesOf("Son_Grail");
  await mod.post("/api/posts/" + post.id + "/moderate", { action: "hide" });
  assert.equal(likesOf("Son_Grail"), likes - post.like_count); // like của bài ẩn không còn tính
  assert.equal((await mod.get("/api/mod/reports")).data.reports.some((r) => r.post.id === post.id), false); // ẩn bài → báo cáo được xử lý
  await mod.post("/api/posts/" + post.id + "/moderate", { action: "unhide" });
  assert.equal(likesOf("Son_Grail"), likes);

  const firstPost = db.prepare("SELECT MIN(id) AS id FROM posts WHERE thread_id = ?").get(post.thread_id).id;
  assert.equal((await mod.post("/api/posts/" + firstPost + "/moderate", { action: "hide" })).status, 400);

  await mod.post("/api/threads/" + post.thread_id + "/moderate", { action: "hide" });
  assert.equal((await createClient().get("/api/threads/" + post.thread_id)).status, 404);
  assert.equal((await mod.get("/api/threads/" + post.thread_id)).status, 200);
  await mod.post("/api/threads/" + post.thread_id + "/moderate", { action: "unhide" });

  assert.equal((await mod.post("/api/users/Admin_Jade/ban", { banned: true })).status, 403);
  const nam = await loggedIn("nam@example.com");
  await mod.post("/api/users/Nam_Eevee/ban", { banned: true });
  assert.equal((await nam.get("/api/auth/me")).data.user, null); // bị đăng xuất ngay
  assert.equal((await createClient().login("nam@example.com")).data.code, "BANNED");
  await mod.post("/api/users/Nam_Eevee/ban", { banned: false });

  const review = db.prepare("SELECT id FROM seller_reviews LIMIT 1").get().id;
  await mod.post("/api/reviews/" + review + "/moderate", { action: "hide" });
  assert.equal((await createClient().get("/api/users/Tuan_Poke")).data.reviews.some((r) => r.id === review), false);
});

test("API-30 Truy cập trái phép và hết hạn: A rút tin của B, A hủy trả giá của B; tin quá 7 ngày chưa kiểm định tự hết hạn", async () => {
  const kenji = await loggedIn("kenjiro@example.com");
  const son = await loggedIn("son@example.com");
  assert.equal((await kenji.post("/api/listings/1/withdraw")).status, 403);
  const huyOffer = db.prepare("SELECT id FROM offers WHERE listing_id = 1 AND status = 'pending'").get().id;
  assert.equal((await kenji.post("/api/offers/" + huyOffer + "/cancel")).status, 403);
  assert.equal((await kenji.get("/api/my/listings")).data.listings.every((card) => card.seller.displayName === "Kenjiro"), true);

  // Son rút tin → trả giá đang chờ bị từ chối
  assert.equal((await son.post("/api/listings/1/withdraw")).status, 200);
  assert.equal(db.prepare("SELECT status FROM offers WHERE id = ?").get(huyOffer).status, "declined");

  db.prepare("UPDATE listings SET verify_deadline = '2000-01-01T00:00:00.000Z' WHERE id = 6").run();
  await createClient().get("/api/health"); // mọi yêu cầu API đều chạy bước cập nhật hết hạn
  assert.equal(listingStatus(6), "expired_verify");
});

// ---------------------------------------------------------------------
// HASHTAG THẺ / BỘ TRONG BÀI VIẾT + OTP CHẾ ĐỘ LẬP TRÌNH
// ---------------------------------------------------------------------

test("API-31 Hashtag: nhận diện #thẻ / #bộ khi đăng và sửa bài, trang hashtag, gợi ý hàng shop đang bán", async () => {
  const guest = createClient();
  const member = createClient();
  await member.login("tuan@example.com");

  // Dữ liệu mẫu đã có hashtag + ảnh (server/seed-forum-media.js)
  const seeded = await guest.get("/api/tags/PikachuEx_SV08_238");
  assert.equal(seeded.status, 200);
  assert.equal(seeded.data.tag.ref, "sv08-238");
  assert.ok(seeded.data.total >= 1);
  assert.ok(seeded.data.threads.some((thread) => thread.cover)); // topic có ảnh hiện ảnh bìa

  // Gắn hashtag đã có: không cần gọi TCGdex. Khách không gắn được.
  assert.equal((await guest.post("/api/tags", { kind: "set", ref: "sv08" })).status, 401);
  const tag = await member.post("/api/tags", { kind: "set", ref: "sv08" });
  assert.equal(tag.status, 201);
  assert.equal(tag.data.tag.slug, "SurgingSparks");
  assert.equal((await member.post("/api/tags", { kind: "card", ref: "../../x" })).status, 400);

  // Đăng topic có hashtag (viết thường vẫn nhận), hashtag lạ và "#" trong link thì bỏ qua
  const bocThe = db.prepare("SELECT p.id FROM prefixes p JOIN forums f ON f.id = p.forum_id WHERE f.code = 'F368' AND p.name = 'Bóc thẻ'").get();
  const created = await member.post("/api/forums/F368/threads", {
    prefixId: bocThe.id,
    title: "Thử hashtag trong bài",
    content: "Xé #surgingsparks ra #PikachuEx_SV08_238, còn #KhongCo và link https://a.vn/x#Set151",
  });
  assert.equal(created.status, 201);
  const thread = await guest.get("/api/threads/" + created.data.id);
  const slugs = thread.data.posts[0].tags.map((item) => item.slug).sort();
  assert.deepEqual(slugs, ["PikachuEx_SV08_238", "SurgingSparks"]);
  assert.ok("listingStats" in thread.data);

  // Sửa bài bỏ hashtag → bài không còn gắn hashtag đó
  const postId = thread.data.posts[0].id;
  const edited = await member.patch("/api/posts/" + postId, { content: "Chỉ còn #SurgingSparks" });
  assert.deepEqual(edited.data.tags.map((item) => item.slug), ["SurgingSparks"]);

  // Gợi ý khi tìm: hàng shop đang bán (thẻ lẻ + bộ có pack / box)
  const search = await guest.get("/api/tags/search?q=surging");
  assert.ok(search.data.shop.some((item) => item.kind === "set" && item.ref === "sv08" && item.sold));
  assert.equal((await guest.get("/api/tags/KhongCo")).status, 404);
});

test("API-32 OTP chế độ lập trình: không bao giờ lộ mã khi chạy thử nghiệm / đã cấu hình Gmail", async () => {
  const res = await createClient().get("/api/auth/dev-code?email=new.player@example.com");
  assert.equal(res.status, 200);
  assert.equal(res.data.enabled, false);
  assert.equal(res.data.code, undefined);
});
