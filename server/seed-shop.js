// ======================================================================
// DỮ LIỆU MẪU: KÝ GỬI, ĐƠN HÀNG, BỘ SƯU TẬP, TRẢ GIÁ, ĐÁNH GIÁ, TOPIC MUA BÁN
// Được seed.js gọi sau khi đã tạo thành viên và diễn đàn.
// Ảnh dùng ảnh thẻ có sẵn trong images/cards/ (nguồn TCGdex) để chạy được khi không có mạng.
// ======================================================================
const { db } = require("./db");
const { products, findProduct } = require("./products");
const { commissionFor } = require("./consign");

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Thông tin thẻ lấy từ js/data/products.js theo mã thẻ TCGdex
function cardInfo(cardId) {
  const product = products.find((p) => p.cardId === cardId);
  return {
    cardId,
    name: product.name,
    setName: product.set,
    number: product.number,
    image: "/" + product.image,
    refPrice: product.price,
  };
}

function seedShop(userIds) {
  const now = Date.now();
  const iso = (offsetMs) => new Date(now + offsetMs).toISOString();
  const adminId = userIds["Admin_Jade"];

  // ---------- Tin ký gửi ----------
  // status, ngày đăng (số ngày trước), giá mong muốn, giá niêm yết, tình trạng khai / thực tế
  function addListing({ seller, cardId, condition, verified, asking, listPrice, status, daysAgo, description }) {
    const card = cardInfo(cardId);
    const created = now - daysAgo * DAY;
    const verifiedAt = status === "pending" ? null : created + 6 * HOUR;
    const result = db
      .prepare(
        `INSERT INTO listings (seller_id, card_id, card_name, set_name, card_number, image, variant, ref_price, description,
           condition_declared, asking_price, status, verify_deadline, condition_verified, authentic, list_price,
           verified_by, verified_at, list_expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'holo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(userIds[seller], card.cardId, card.name, card.setName, card.number, card.image, card.refPrice, description || "",
        condition, asking, status, new Date(created + 7 * DAY).toISOString(),
        verifiedAt ? verified || condition : null, verifiedAt ? 1 : null, verifiedAt ? listPrice : null,
        verifiedAt ? adminId : null, verifiedAt ? new Date(verifiedAt).toISOString() : null,
        verifiedAt ? new Date(verifiedAt + 60 * DAY).toISOString() : null, new Date(created).toISOString());
    const id = Number(result.lastInsertRowid);
    const insertImage = db.prepare("INSERT INTO listing_images (listing_id, path, source) VALUES (?, ?, ?)");
    insertImage.run(id, card.image, "seller");
    insertImage.run(id, card.image, "seller");
    if (verifiedAt) insertImage.run(id, card.image, "shop");
    return id;
  }

  const charizard = addListing({ seller: "Son_Grail", cardId: "sv03.5-199", condition: "NM", asking: 7500000, listPrice: 7500000, status: "active", daysAgo: 3,
    description: "Bóc từ pack 151, cho vào sleeve + toploader ngay. Mặt trước và 4 góc rất đẹp." });
  const umbreon = addListing({ seller: "Kenjiro", cardId: "sv08.5-161", condition: "NM", verified: "LP", asking: 28500000, listPrice: 26900000, status: "active", daysAgo: 2,
    description: "Góc trên bên phải có vệt trắng nhỏ, shop kiểm định LP nên mình hạ giá." });
  const pikachu = addListing({ seller: "Minh_CardVault", cardId: "sv08-238", condition: "NM", asking: 5900000, listPrice: 5900000, status: "active", daysAgo: 4 });
  const pikachuIr = addListing({ seller: "Son_Grail", cardId: "sv03.5-173", condition: "NM", asking: 1350000, listPrice: 1350000, status: "active", daysAgo: 6 });
  const rayquaza = addListing({ seller: "Nam_Eevee", cardId: "swsh7-218", condition: "LP", asking: 29000000, listPrice: 29000000, status: "active", daysAgo: 1,
    description: "Thẻ của anh trai để lại, nhờ JadeCard bán hộ." });
  const greninja = addListing({ seller: "Bao_TCG", cardId: "sv06-214", condition: "NM", asking: 5500000, listPrice: null, status: "pending", daysAgo: 1 });
  const mew = addListing({ seller: "Tuan_Poke", cardId: "sv03.5-205", condition: "NM", asking: 520000, listPrice: 520000, status: "active", daysAgo: 20 });
  const lugia = addListing({ seller: "Kenjiro", cardId: "swsh12-186", condition: "NM", asking: 10900000, listPrice: 10900000, status: "active", daysAgo: 15 });

  // ---------- Đơn hàng đã hoàn thành có tin ký gửi (để có giao dịch thành công, tất toán, đánh giá) ----------
  function addOrder({ buyer, delivery, payment, status, paid, daysAgo, items, address }) {
    const created = iso(-daysAgo * DAY);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = delivery === "ship" ? 30000 : 0;
    const result = db
      .prepare(
        `INSERT INTO orders (user_id, client_key, recipient_name, phone, delivery, address, payment, payment_status, status,
           subtotal, shipping_fee, total, stock_deducted, created_at, updated_at)
         VALUES (?, ?, ?, '0901234567', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(userIds[buyer], "seed-" + buyer + "-" + daysAgo, buyer.replace(/_/g, " ") + " (mẫu)", delivery, address || "", payment,
        paid ? "paid" : "unpaid", status, subtotal, shipping, subtotal + shipping, status === "pending" ? 0 : 1, created, created);
    const orderId = Number(result.lastInsertRowid);
    return items.map((item) => {
      const line = db
        .prepare("INSERT INTO order_items (order_id, kind, product_id, listing_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(orderId, item.kind, item.productId || null, item.listingId || null, item.name, item.image, item.price, item.quantity);
      return { orderId, itemId: Number(line.lastInsertRowid) };
    });
  }

  function sellListing(listingId, buyer, daysAgo, settled) {
    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
    const [line] = addOrder({
      buyer, delivery: "pickup", payment: "cod", status: "completed", paid: true, daysAgo,
      items: [{ kind: "listing", listingId, name: `${row.card_name} · ${row.card_number} (KG-${String(listingId).padStart(4, "0")})`, image: row.image, price: row.list_price, quantity: 1 }],
    });
    const money = commissionFor(row.list_price);
    db.prepare(
      `UPDATE listings SET status = ?, order_id = ?, final_price = ?, commission = ?, payout = ?, sold_at = ?, settled_at = ?, settled_by = ? WHERE id = ?`
    ).run(settled ? "settled" : "sold", line.orderId, row.list_price, money.commission, money.payout, iso(-daysAgo * DAY),
      settled ? iso(-(daysAgo - 1) * DAY) : null, settled ? adminId : null, listingId);
    return line;
  }

  // Mew ex: Huy mua, đã tất toán cho Tuan, Huy đã đánh giá 5 sao
  const mewLine = sellListing(mew, "Huy_Collector", 5, true);
  db.prepare(
    "INSERT INTO seller_reviews (order_item_id, listing_id, seller_id, buyer_id, stars, comment, created_at) VALUES (?, ?, ?, ?, 5, ?, ?)"
  ).run(mewLine.itemId, mew, userIds["Tuan_Poke"], userIds["Huy_Collector"], "Thẻ đúng như ảnh, bác Tuan trả lời nhanh. Sẽ ủng hộ tiếp!", iso(-4 * DAY));
  // Lugia V: Minh mua, đơn hoàn thành, chờ Admin tất toán cho Kenjiro; Minh chưa đánh giá
  sellListing(lugia, "Minh_CardVault", 2, false);

  // Đơn đang chờ xác nhận (sản phẩm của shop) để Admin thử xác nhận / trừ kho
  const pack = findProduct(15);
  const tin = findProduct(14);
  addOrder({
    buyer: "PikaFan", delivery: "ship", payment: "transfer", status: "pending", paid: false, daysAgo: 0.1,
    address: "45 Đường Mẫu, Phường 1, Quận 3, TP.HCM (dữ liệu mẫu)",
    items: [
      { kind: "product", productId: pack.id, name: pack.name, image: pack.image, price: pack.price, quantity: 3 },
      { kind: "product", productId: tin.id, name: tin.name, image: tin.image, price: tin.price, quantity: 1 },
    ],
  });

  // ---------- Trả giá đang chờ người bán trả lời (F55) ----------
  db.prepare("INSERT INTO offers (listing_id, buyer_id, amount, expires_at, created_at) VALUES (?, ?, ?, ?, ?)").run(
    charizard, userIds["Huy_Collector"], 6800000, iso(40 * HOUR), iso(-8 * HOUR)
  );

  // ---------- Topic Mua bán gắn tin ký gửi (F50, F51) ----------
  const f368 = db.prepare("SELECT id FROM forums WHERE code = 'F368'").get().id;
  const muaBan = db.prepare("SELECT id FROM prefixes WHERE forum_id = ? AND name = 'Mua bán'").get(f368).id;
  function addSaleThread(author, hoursAgo, title, listingId, posts) {
    const created = now - hoursAgo * HOUR;
    const times = posts.map((_, i) => iso(-hoursAgo * HOUR + (i * hoursAgo * HOUR * 0.8) / posts.length));
    const thread = db
      .prepare(
        `INSERT INTO threads (forum_id, user_id, prefix_id, title, listing_id, reply_count, view_count, last_post_at, last_post_user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(f368, userIds[author], muaBan, title, listingId, posts.length - 1, 40 + posts.length * 30, times[times.length - 1],
        userIds[posts[posts.length - 1][0]], new Date(created).toISOString());
    posts.forEach(([user, content], i) => {
      db.prepare("INSERT INTO posts (thread_id, user_id, content, created_at) VALUES (?, ?, ?, ?)").run(thread.lastInsertRowid, userIds[user], content, times[i]);
    });
  }

  addSaleThread("Son_Grail", 30, "[Mua bán] Charizard ex SIR · 151 · 199/165 — NM cực đẹp", charizard, [
    ["Son_Grail", "Lá này mình bóc từ pack 151, đã mang qua JadeCard kiểm định: NM, thẻ thật.\n\nGiá niêm yết 7.500.000 ₫. Bác nào quan tâm bấm **Thêm vào giỏ** ở thẻ phía trên, hoặc trả giá trên tin ký gửi nhé."],
    ["Kenjiro", "Màu đẹp quá bác. Giá này hợp lý so với giá tham khảo."],
    ["Minh_CardVault", "Ai thích hệ Điện thì mình cũng đang ký gửi Pikachu ex SIR cùng đời nè: http://localhost:5500/listing.html?id=" + pikachu],
  ]);
  addSaleThread("Minh_CardVault", 50, "[Mua bán] Pikachu ex SIR Surging Sparks 238/191 NM", pikachu, [
    ["Minh_CardVault", "Ký gửi tại JadeCard, đã kiểm định NM. Ưu tiên anh em F368 nhé."],
    ["Tuan_Poke", "Mình bóc được một lá rồi nên nhường bác khác 😄"],
  ]);
  addSaleThread("Bao_TCG", 10, "[Mua bán] Greninja ex SIR 214/167 — chờ kiểm định", greninja, [
    ["Bao_TCG", "Mai mình mang thẻ ra shop kiểm định. Tin đang ở trạng thái Chờ kiểm định, xác thực xong mới mua được nha."],
  ]);

  // ---------- Bộ sưu tập theo tài khoản (F27) ----------
  function addItem(user, list, cardId, condition, quantity) {
    const card = cardInfo(cardId);
    db.prepare(
      `INSERT INTO collection_items (user_id, list, card_id, card_name, set_name, card_number, image, variant, condition, quantity, saved_price, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'holo', ?, ?, ?, ?)`
    ).run(userIds[user], list, cardId, card.name, card.setName, card.number, card.image, list === "have" ? condition : "",
      quantity, list === "have" ? card.refPrice : null, iso(-10 * DAY));
  }
  // Kenjiro: công khai, cho hiện tổng giá trị
  addItem("Kenjiro", "have", "sv08.5-161", "LP", 1);
  addItem("Kenjiro", "have", "base1-4", "LP", 1);
  addItem("Kenjiro", "have", "sv08-238", "NM", 2);
  addItem("Kenjiro", "want", "sv03.5-199", null, 1);
  addItem("Kenjiro", "want", "swsh7-215", null, 1);
  db.prepare("INSERT INTO user_settings (user_id, collection_public, show_value) VALUES (?, 1, 1)").run(userIds["Kenjiro"]);
  // Son_Grail: công khai, ẩn tổng giá trị (mặc định); 2 thẻ đang ký gửi → nhãn "Đang bán"
  addItem("Son_Grail", "have", "sv03.5-199", "NM", 1);
  addItem("Son_Grail", "have", "sv03.5-173", "NM", 1);
  addItem("Son_Grail", "have", "sv03.5-205", "NM", 2);
  addItem("Son_Grail", "want", "swsh7-215", null, 1);
  // Minh_CardVault: riêng tư
  addItem("Minh_CardVault", "have", "swsh7-218", "NM", 1);
  db.prepare("INSERT INTO user_settings (user_id, collection_public, show_value) VALUES (?, 0, 0)").run(userIds["Minh_CardVault"]);

  // ---------- Một báo cáo đang chờ Mod xử lý (F42) ----------
  const spamPost = db.prepare("SELECT id, user_id FROM posts WHERE content = 'Up cho anh em xem.' LIMIT 1").get();
  if (spamPost) {
    db.prepare("INSERT INTO reports (post_id, user_id, reason, created_at) VALUES (?, ?, ?, ?)").run(
      spamPost.id, userIds["PikaFan"] === spamPost.user_id ? userIds["Nam_Eevee"] : userIds["PikaFan"], "Spam / quảng cáo", iso(-2 * HOUR)
    );
  }

  return { charizard, umbreon, pikachu, pikachuIr, rayquaza, greninja, mew, lugia };
}

module.exports = { seedShop };
