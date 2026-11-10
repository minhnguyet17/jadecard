-- ======================================================================
-- CƠ SỞ DỮ LIỆU JadeCard (SQLite)
-- File này chạy mỗi lần server khởi động. Mọi lệnh đều có "IF NOT EXISTS" nên chạy lại
-- không làm mất dữ liệu: bảng nào chưa có thì tạo thêm (tiện khi dự án có bảng mới).
-- Muốn tạo lại từ đầu (mất dữ liệu cũ): npm run db:reset
--
-- Quy ước:
--   * Thời gian lưu dạng chuỗi ISO, giờ UTC, ví dụ "2026-11-09T07:30:00.000Z".
--     So sánh chuỗi ISO cũng chính là so sánh thời gian.
--   * Cột 0/1 là kiểu đúng/sai (SQLite không có kiểu boolean riêng).
-- ======================================================================

-- ---------------------------------------------------------------------
-- TÀI KHOẢN (F30–F33)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL UNIQUE,                    -- luôn lưu chữ thường
  display_name   TEXT NOT NULL UNIQUE COLLATE NOCASE,     -- "Kenjiro" và "kenjiro" coi là trùng
  password_hash  TEXT NOT NULL,                           -- bcrypt, không bao giờ lưu mật khẩu thật
  role           TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'mod', 'admin')),
  email_verified INTEGER NOT NULL DEFAULT 0,              -- 0 = Chưa xác thực, 1 = đã nhập đúng OTP
  likes_received INTEGER NOT NULL DEFAULT 0,              -- tổng like nhận được → chức vụ (F40)
  post_count     INTEGER NOT NULL DEFAULT 0,              -- số bài đã đăng (gồm bài mở topic)
  failed_logins  INTEGER NOT NULL DEFAULT 0,              -- số lần sai mật khẩu liên tiếp
  locked_until   TEXT,                                    -- sai 5 lần → khóa đăng nhập 15 phút
  banned         INTEGER NOT NULL DEFAULT 0,              -- Mod/Admin khóa tài khoản (F42)
  created_at     TEXT NOT NULL
);

-- Mã OTP 6 số. Chỉ lưu bản băm (hash) của mã, không lưu mã thật.
CREATE TABLE IF NOT EXISTS email_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('verify', 'reset')),  -- xác thực email / quên mật khẩu
  code_hash  TEXT NOT NULL,
  expires_at TEXT NOT NULL,                  -- tạo lúc + 10 phút
  attempts   INTEGER NOT NULL DEFAULT 0,     -- số lần nhập sai, tối đa 5
  created_at TEXT NOT NULL                   -- dùng để chặn "gửi lại" trong 60 giây
);

-- Phiên đăng nhập. Trình duyệt giữ mã phiên trong cookie httpOnly,
-- server chỉ lưu bản băm của mã đó (lộ file CSDL cũng không dùng được cookie).
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,               -- sha256(mã phiên)
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- DIỄN ĐÀN (F34–F42, F52, F53)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forums (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,          -- "F368"
  name        TEXT NOT NULL,                 -- "Thợ săn tiền thưởng"
  description TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  staff_only  INTEGER NOT NULL DEFAULT 0     -- 1 = chỉ Admin được mở topic (F100)
);

-- Tag tiền tố của topic: [Bóc thẻ], [Định giá], [Mua bán]...
CREATE TABLE IF NOT EXISTS prefixes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  forum_id         INTEGER NOT NULL REFERENCES forums(id),
  name             TEXT NOT NULL,
  color            TEXT NOT NULL,            -- tên màu trong SCSS: cyan, purple, yellow, emerald, pink
  requires_listing INTEGER NOT NULL DEFAULT 0 -- 1 = phải gắn tin ký gửi (Mua bán, F50) — mở khi làm Ký gửi
);

CREATE TABLE IF NOT EXISTS threads (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  forum_id          INTEGER NOT NULL REFERENCES forums(id),
  user_id           INTEGER NOT NULL REFERENCES users(id),
  prefix_id         INTEGER REFERENCES prefixes(id),
  title             TEXT NOT NULL,
  listing_id        INTEGER,                 -- tin ký gửi được gắn (F50), làm ở đợt Ký gửi
  pinned            INTEGER NOT NULL DEFAULT 0,
  locked            INTEGER NOT NULL DEFAULT 0,
  hidden            INTEGER NOT NULL DEFAULT 0,
  reply_count       INTEGER NOT NULL DEFAULT 0,   -- số bài trả lời (không tính bài mở topic)
  view_count        INTEGER NOT NULL DEFAULT 0,   -- F52
  last_post_at      TEXT NOT NULL,
  last_post_user_id INTEGER REFERENCES users(id),
  created_at        TEXT NOT NULL
);

-- Bài viết. Bài đầu tiên của topic chính là nội dung topic.
CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id  INTEGER NOT NULL REFERENCES threads(id),
  user_id    INTEGER NOT NULL REFERENCES users(id),
  content    TEXT NOT NULL,                  -- chữ thuần; khi hiển thị mới chuyển thành HTML an toàn
  like_count INTEGER NOT NULL DEFAULT 0,
  hidden     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  edited_at  TEXT
);

CREATE TABLE IF NOT EXISTS post_images (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  path    TEXT NOT NULL                      -- ví dụ "/uploads/forum/3f9a...c1.jpg"
);

-- Mỗi người like một bài một lần: khóa chính gồm 2 cột (F39)
CREATE TABLE IF NOT EXISTS likes (
  post_id    INTEGER NOT NULL REFERENCES posts(id),
  user_id    INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- Báo cáo bài vi phạm (F42)
CREATE TABLE IF NOT EXISTS reports (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL REFERENCES posts(id),
  user_id    INTEGER NOT NULL REFERENCES users(id),
  reason     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TEXT NOT NULL
);

-- Lượt xem topic (F52): mỗi người / mỗi trình duyệt tối đa 1 lượt mỗi giờ
CREATE TABLE IF NOT EXISTS thread_views (
  thread_id  INTEGER NOT NULL REFERENCES threads(id),
  viewer_key TEXT NOT NULL,                  -- "u:12" (thành viên) hoặc "g:<mã trình duyệt>" (khách)
  viewed_at  TEXT NOT NULL,
  PRIMARY KEY (thread_id, viewer_key)
);

-- Hashtag thẻ / bộ thẻ (set) gắn vào bài viết, ví dụ #PikachuEx_SV08_238, #SurgingSparks.
-- Thông tin lấy từ TCGdex (server tự tra, không tin chữ trình duyệt gửi lên).
-- Nếu shop có bán thẻ / pack của bộ đó thì bài viết hiện thẻ mời mua (CTA).
CREATE TABLE IF NOT EXISTS tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE COLLATE NOCASE, -- chữ sau dấu # (không dấu, không khoảng trắng)
  kind       TEXT NOT NULL CHECK (kind IN ('card', 'set')),
  ref        TEXT NOT NULL,                  -- mã TCGdex: "sv08-238" (thẻ) hoặc "sv08" (bộ)
  name       TEXT NOT NULL,                  -- "Pikachu ex" / "Surging Sparks"
  set_id     TEXT NOT NULL,                  -- bộ chứa thẻ (thẻ) hoặc chính nó (bộ)
  set_name   TEXT NOT NULL,
  number     TEXT,                           -- số thẻ "238/191" (chỉ thẻ)
  image      TEXT,                           -- ảnh thẻ hoặc logo bộ
  created_at TEXT NOT NULL,
  UNIQUE (kind, ref)
);

-- Bài viết nào nhắc tới hashtag nào (server tự đọc các #... trong nội dung khi đăng / sửa bài)
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id),
  tag_id  INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);

-- Ghi nhớ các bước nâng cấp dữ liệu mẫu đã chạy (ví dụ "forum_media_v1")
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Chỉ mục giúp các truy vấn hay dùng chạy nhanh
CREATE INDEX IF NOT EXISTS idx_threads_forum ON threads(forum_id, pinned, last_post_at);
CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(thread_id, id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created ON likes(created_at);

-- ---------------------------------------------------------------------
-- BỘ SƯU TẬP THEO TÀI KHOẢN (F13, F14, F27)
-- Thông tin thẻ (tên, set, số, ảnh) lấy từ TCGdex lúc thêm và được lưu lại,
-- để trang không phải gọi TCGdex mỗi lần mở.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collection_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list        TEXT NOT NULL CHECK (list IN ('have', 'want')),   -- Đang có / Đang săn
  card_id     TEXT NOT NULL,                 -- mã thẻ trên TCGdex, vd "sv03.5-199"
  card_name   TEXT NOT NULL,
  set_name    TEXT NOT NULL,
  card_number TEXT NOT NULL,                 -- vd "199/165"
  image       TEXT NOT NULL,                 -- link ảnh thẻ
  variant     TEXT NOT NULL,                 -- normal / holo / reverse
  condition   TEXT NOT NULL DEFAULT '',      -- NM / LP / MP / HP ('' với Đang săn)
  quantity    INTEGER NOT NULL DEFAULT 1,
  saved_price INTEGER,                       -- giá tham khảo VND lúc lưu (NULL = chưa có giá)
  saved_at    TEXT NOT NULL,
  UNIQUE (user_id, list, card_id, variant, condition)  -- thẻ trùng thì cộng số lượng
);

-- Cài đặt riêng tư của bộ sưu tập (F27): mặc định công khai danh sách, ẩn tổng giá trị
CREATE TABLE IF NOT EXISTS user_settings (
  user_id           INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  collection_public INTEGER NOT NULL DEFAULT 1,
  show_value        INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- KÝ GỬI TẠI CỬA HÀNG (F43–F49, F55)
-- Trạng thái tin (status):
--   pending          Chờ kiểm định (chưa hiện công khai, hạn mang thẻ đến 7 ngày)
--   rejected         Từ chối (không đạt / thẻ giả)
--   expired_verify   Hết hạn kiểm định (quá 7 ngày chưa mang thẻ đến)
--   active           Đang bán (đã kiểm định, có huy hiệu JadeCard đã xác thực)
--   held             Đang giữ cho người trả giá (24 giờ, F55)
--   reserved         Đã có đơn hàng, đang giữ thẻ (F47)
--   sold             Đã bán (đơn đã được xác nhận)
--   settled          Đã tất toán (đã trả tiền cho người bán tại quầy, F49)
--   withdrawn        Đã rút (người bán rút tin, nhận lại thẻ)
--   expired_listing  Hết hạn niêm yết (quá 60 ngày chưa bán, trả lại thẻ)
-- Mã tin hiển thị "KG-0042" = id 42 (không cần cột riêng).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id          INTEGER NOT NULL REFERENCES users(id),
  card_id            TEXT NOT NULL,
  card_name          TEXT NOT NULL,
  set_name           TEXT NOT NULL,
  card_number        TEXT NOT NULL,
  image              TEXT NOT NULL,
  variant            TEXT NOT NULL,
  ref_price          INTEGER,                -- giá tham khảo quốc tế VND lúc đăng (để so sánh)
  description        TEXT NOT NULL DEFAULT '',
  condition_declared TEXT NOT NULL,          -- tình trạng người bán tự đánh giá
  asking_price       INTEGER NOT NULL,       -- giá người bán mong muốn
  status             TEXT NOT NULL DEFAULT 'pending',
  verify_deadline    TEXT NOT NULL,          -- tạo tin + 7 ngày
  -- Kết quả kiểm định tại quầy (F44)
  condition_verified TEXT,
  authentic          INTEGER,                -- 1 thật, 0 nghi giả
  list_price         INTEGER,                -- giá niêm yết đã thống nhất với người bán
  reject_reason      TEXT,
  verified_by        INTEGER REFERENCES users(id),
  verified_at        TEXT,
  list_expires_at    TEXT,                   -- kiểm định + 60 ngày
  -- Trả giá được chấp nhận (F55): giữ 24 giờ cho đúng người mua với giá đã chốt
  hold_buyer_id      INTEGER REFERENCES users(id),
  hold_price         INTEGER,
  hold_until         TEXT,
  -- Bán và tất toán (F47, F49)
  order_id           INTEGER,
  final_price        INTEGER,                -- giá bán cuối cùng
  commission         INTEGER,                -- hoa hồng = 8% giá bán, tối thiểu 20.000 ₫
  payout             INTEGER,                -- người bán nhận = giá bán − hoa hồng
  sold_at            TEXT,
  settled_at         TEXT,
  settled_by         INTEGER REFERENCES users(id),
  created_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  path       TEXT NOT NULL,
  source     TEXT NOT NULL CHECK (source IN ('seller', 'shop'))  -- người bán chụp / shop chụp khi kiểm định
);

-- Trả giá (F55). status: pending, accepted, declined, expired, cancelled
CREATE TABLE IF NOT EXISTS offers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  buyer_id   INTEGER NOT NULL REFERENCES users(id),
  amount     INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT NOT NULL,                  -- tạo + 48 giờ
  decided_at TEXT,
  created_at TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- ĐƠN HÀNG (F05, F07, F20, F47)
-- status: pending (Chờ xác nhận) → confirmed (Đã xác nhận) → shipping (Đang giao) /
--         ready (Chờ nhận tại cửa hàng) → completed (Hoàn thành); cancelled (Đã hủy)
-- payment_status: unpaid / paid. Mã đơn hiển thị "DH-00012" = id 12.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  client_key     TEXT NOT NULL,              -- mã ngẫu nhiên do trình duyệt tạo: bấm "Đặt hàng" 2 lần không tạo 2 đơn
  recipient_name TEXT NOT NULL,
  phone          TEXT NOT NULL,
  delivery       TEXT NOT NULL CHECK (delivery IN ('ship', 'pickup')),
  address        TEXT NOT NULL DEFAULT '',
  payment        TEXT NOT NULL CHECK (payment IN ('cod', 'transfer')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  status         TEXT NOT NULL DEFAULT 'pending',
  subtotal       INTEGER NOT NULL,
  shipping_fee   INTEGER NOT NULL,
  total          INTEGER NOT NULL,
  stock_deducted INTEGER NOT NULL DEFAULT 0, -- đã trừ kho chưa (để hoàn kho đúng một lần)
  admin_note     TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  UNIQUE (user_id, client_key)
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id),
  kind       TEXT NOT NULL CHECK (kind IN ('product', 'listing')),
  product_id INTEGER,                        -- sản phẩm của shop (js/data/products.js)
  listing_id INTEGER REFERENCES listings(id),-- hoặc tin ký gửi (số lượng luôn = 1)
  name       TEXT NOT NULL,
  image      TEXT NOT NULL,
  price      INTEGER NOT NULL,               -- đơn giá lúc đặt
  quantity   INTEGER NOT NULL
);

-- Tồn kho sản phẩm của shop. Lần đầu lấy từ js/data/products.js, sau đó trừ / hoàn khi xác nhận / hủy đơn.
CREATE TABLE IF NOT EXISTS product_stock (
  product_id INTEGER PRIMARY KEY,
  stock      INTEGER NOT NULL
);

-- Đánh giá người bán (F56): mỗi dòng đơn có tin ký gửi chỉ đánh giá một lần
CREATE TABLE IF NOT EXISTS seller_reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_item_id INTEGER NOT NULL UNIQUE REFERENCES order_items(id),
  listing_id    INTEGER NOT NULL REFERENCES listings(id),
  seller_id     INTEGER NOT NULL REFERENCES users(id),
  buyer_id      INTEGER NOT NULL REFERENCES users(id),
  stars         INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment       TEXT NOT NULL DEFAULT '',
  hidden        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status, created_at);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_user ON collection_items(user_id, list);
CREATE UNIQUE INDEX IF NOT EXISTS idx_threads_listing ON threads(listing_id) WHERE listing_id IS NOT NULL; -- mỗi tin gắn tối đa 1 topic (F50)
