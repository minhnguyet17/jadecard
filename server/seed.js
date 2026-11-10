// ======================================================================
// DỮ LIỆU MẪU cho diễn đàn (thành viên, forum, topic, bài, like)
//   - Tự chạy khi server khởi động lần đầu (chưa có file data/jadecard.db).
//   - Tạo lại từ đầu: dừng server rồi chạy  npm run db:reset
// Mọi tên, email đều là dữ liệu mẫu (đuôi example.com / jadecard.test), không phải người thật.
// Mật khẩu của mọi tài khoản mẫu: jadecard123
// ======================================================================
const fs = require("node:fs");
const path = require("node:path");

// ---------- npm run db:reset: xóa CSDL cũ TRƯỚC khi mở kết nối ----------
if (require.main === module && process.argv.includes("--reset")) {
  require("./config");
  const dataDir = path.join(__dirname, "..", "data");
  const dbFile = process.env.DB_FILE || path.join(dataDir, "jadecard.db");
  try {
    for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(dbFile + suffix, { force: true });
    fs.rmSync(path.join(dataDir, "uploads"), { recursive: true, force: true });
  } catch (error) {
    console.error("Không xóa được CSDL cũ. Hãy dừng server (Ctrl + C) rồi chạy lại lệnh.\n", error.message);
    process.exit(1);
  }
}

const bcrypt = require("bcryptjs");
const { db, transaction, isNew } = require("./db");
const { seedShop } = require("./seed-shop");
const { upgradeDemoForum } = require("./seed-forum-media");

const HOUR = 60 * 60 * 1000;
const DEMO_PASSWORD = "jadecard123";

// Bộ sinh số "ngẫu nhiên" cố định (mulberry32): chạy lại seed luôn ra cùng một dữ liệu
function createRandom(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Thành viên mẫu ----------
// oldLikes / oldPosts: like và bài "từ trước" (giả lập lịch sử hoạt động) để có đủ các chức vụ.
// Like và bài tạo trong seed này sẽ được cộng thêm vào.
const USERS = [
  { name: "Admin_Jade", email: "admin@jadecard.test", role: "admin", oldLikes: 120, oldPosts: 40, joined: "2025-03-01" },
  { name: "Mod_Khang", email: "mod@jadecard.test", role: "mod", oldLikes: 330, oldPosts: 210, joined: "2025-03-02" },
  { name: "Kenjiro", email: "kenjiro@example.com", oldLikes: 2790, oldPosts: 860, joined: "2025-04-12" },
  { name: "Minh_CardVault", email: "minh@example.com", oldLikes: 1180, oldPosts: 790, joined: "2025-06-20" },
  { name: "Son_Grail", email: "son@example.com", oldLikes: 490, oldPosts: 330, joined: "2025-09-03" },
  { name: "Bao_TCG", email: "bao@example.com", oldLikes: 210, oldPosts: 150, joined: "2025-11-15" },
  { name: "Tuan_Poke", email: "tuan@example.com", oldLikes: 70, oldPosts: 64, joined: "2026-02-08" },
  { name: "Huy_Collector", email: "huy@example.com", oldLikes: 14, oldPosts: 21, joined: "2026-06-30" },
  { name: "Nam_Eevee", email: "nam@example.com", oldLikes: 2, oldPosts: 5, joined: "2026-10-01" },
  { name: "PikaFan", email: "pikafan@example.com", oldLikes: 0, oldPosts: 0, joined: "2026-11-02" },
];

// ---------- Forum và tag tiền tố ----------
const FORUMS = [
  {
    code: "F100",
    name: "Thông báo JadeCard",
    description: "Tin hàng về, sự kiện tại cửa hàng và quy định diễn đàn. Chỉ Admin đăng topic.",
    staffOnly: 1,
    prefixes: [["Thông báo", "yellow"], ["Sự kiện", "pink"]],
  },
  {
    code: "F368",
    name: "Thợ săn tiền thưởng",
    description: "Bóc thẻ, khoe thẻ, định giá thẻ. Mua bán bắt buộc qua Ký gửi JadeCard.",
    staffOnly: 0,
    prefixes: [["Bóc thẻ", "purple"], ["Định giá", "cyan"], ["Mua bán", "yellow", 1]],
  },
  {
    code: "F666",
    name: "Thần bài",
    description: "Luật chơi, xây deck, sức mạnh của thẻ và meta giải đấu.",
    staffOnly: 0,
    prefixes: [["Hỏi đáp", "emerald"], ["Deck", "cyan"], ["Luật chơi", "purple"], ["Meta", "pink"]],
  },
];

// ---------- Topic mẫu ----------
// [forum, tag, tác giả, số giờ trước, tiêu đề, [[người trả lời, nội dung], ...], tùy chọn]
// Bài đầu tiên trong danh sách là nội dung topic.
const THREADS = [
  ["F100", "Thông báo", "Admin_Jade", 700, "Quy định diễn đàn JadeCard (đọc trước khi đăng bài)", [
    ["Admin_Jade",
      "Chào mừng các thợ săn đến với diễn đàn JadeCard!\n\n" +
      "**1. Mua bán bắt buộc qua Ký gửi JadeCard.** Không rao bán, không để số điện thoại hay tài khoản ngân hàng trong bài. Thẻ được kiểm định tận tay tại cửa hàng trước khi bán.\n" +
      "**2. Không lừa đảo, không đăng thẻ giả** (proxy, counterfeit) dưới bất kỳ hình thức nào.\n" +
      "**3. Tôn trọng nhau.** Không xúc phạm, không công kích cá nhân, không spam.\n" +
      "**4. Đăng đúng forum, đúng tag:** khoe thẻ ở F368 tag Bóc thẻ, hỏi giá ở tag Định giá, hỏi luật ở F666.\n" +
      "**5. Like cho bài hay.** Chức vụ tính theo tổng like nhận được: Chiếu mới → Học việc → Thợ săn sơ cấp → Thợ săn chuyên nghiệp → Thợ săn lão làng → Master → Grand Master.\n\n" +
      "Bài vi phạm sẽ bị ẩn. Vi phạm nhiều lần sẽ bị khóa tài khoản. Thấy bài vi phạm, hãy bấm Báo cáo."],
  ], { pinned: 1, locked: 1 }],
  ["F100", "Sự kiện", "Admin_Jade", 30, "Thứ 7 này: buổi bóc box Surging Sparks tại cửa hàng", [
    ["Admin_Jade", "Thứ 7 tuần này, 15:00 tại cửa hàng (123 Đường Mẫu, Quận 1 — dữ liệu mẫu), JadeCard tổ chức buổi bóc box Surging Sparks chung.\n\nAi muốn mang thẻ đến nhờ kiểm định để ký gửi thì đến luôn trong buổi này nhé. Không bán vé, không bốc thăm có thưởng, chỉ là gặp gỡ anh em."],
    ["Kenjiro", "Có mặt! Mang theo binder Eevee cho anh em xem luôn."],
    ["Huy_Collector", "Em mới chơi, đến xem có được không ạ?"],
    ["Mod_Khang", "@Huy_Collector được bạn nhé, người mới càng nên đến."],
  ]],
  ["F100", "Thông báo", "Admin_Jade", 120, "Hàng mới về: Booster Pack và Booster Box Surging Sparks", [
    ["Admin_Jade", "Shop đã nhập thêm Booster Pack và Booster Box Surging Sparks (bản tiếng Anh). Giá và số lượng cập nhật trên trang Sản phẩm.\n\nNhắc lại: thẻ hiếm ra ngẫu nhiên với tỉ lệ thấp, giá thẻ lẻ có thể tăng hoặc giảm. Mua pack vì vui là chính nhé!"],
    ["Tuan_Poke", "Chốt 1 box tối nay 🔥"],
  ]],

  ["F368", "Mua bán", "Mod_Khang", 600, "Nội quy F368: mua bán bắt buộc qua Ký gửi JadeCard", [
    ["Mod_Khang",
      "Muốn bán thẻ trong F368, các bạn làm theo 3 bước:\n" +
      "1. Đăng tin ở trang Ký gửi (chọn thẻ, tình trạng, ảnh, giá mong muốn).\n" +
      "2. Mang thẻ đến cửa hàng trong 7 ngày để kiểm định.\n" +
      "3. Mở topic tag Mua bán và gắn tin ký gửi của mình vào.\n\n" +
      "Topic Mua bán không có tin ký gửi đi kèm sẽ bị ẩn. Phí ký gửi 8% (tối thiểu 20.000 ₫), tiền trả tại quầy khi thẻ bán được."],
  ], { pinned: 1, locked: 1 }],
  ["F368", "Bóc thẻ", "Tuan_Poke", 0.8, "Xé 1 box Surging Sparks ra Pikachu ex SIR, run tay thật sự", [
    ["Tuan_Poke", "Pack thứ 31/36, đang định bỏ cuộc thì lá cuối là Pikachu ex SIR 238/191. Đã cho vào sleeve + toploader ngay lập tức.\n\nAnh em nghĩ nên giữ hay đem ký gửi?"],
    ["Kenjiro", "Chúc mừng bác! Lá này đẹp nhất set, nếu không cần tiền thì giữ."],
    ["Son_Grail", "Kiểm tra kỹ 4 góc với mặt sau trước nhé, NM thì giá khác hẳn LP."],
    ["Huy_Collector", "Ước gì em cũng hên vậy 😭"],
    ["Minh_CardVault", "Giữ đi bác, set này còn lên."],
  ]],
  ["F368", "Định giá", "Huy_Collector", 2, "Nhờ các bác định giá giúp Umbreon ex SIR Prismatic Evolutions", [
    ["Huy_Collector", "Em có lá Umbreon ex 161/131, góc trên bên phải hơi trắng một chút. Theo các bác tình trạng này là NM hay LP, và tầm giá bao nhiêu ạ?"],
    ["Son_Grail", "Góc trắng thấy được bằng mắt thường thì thường xếp LP. Bạn tra giá tham khảo bằng Check thẻ trên web rồi trừ đi một chút cho LP."],
    ["Mod_Khang", "Muốn chắc chắn thì mang qua shop kiểm định miễn phí khi ký gửi nhé."],
  ]],
  ["F368", "Bóc thẻ", "Nam_Eevee", 5, "Lần đầu mua ETB, ra toàn thẻ thường mà vẫn vui", [
    ["Nam_Eevee", "Lần đầu mua Elite Trainer Box, không ra lá hiếm nào nhưng được bộ sleeve với hộp đựng xịn. Có ai mới chơi như mình không?"],
    ["PikaFan", "Có mình! Mới chơi được 1 tuần."],
    ["Bao_TCG", "ETB đáng tiền vì phụ kiện mà, thẻ hiếm là phần thưởng thêm."],
  ]],
  ["F368", "Định giá", "Bao_TCG", 9, "Charizard ex SIR 151 bản LP thì tầm giá bao nhiêu?", [
    ["Bao_TCG", "Lá 199/165, mặt trước đẹp nhưng mặt sau có vết xước nhẹ. Bác nào có kinh nghiệm định giá giúp."],
    ["Kenjiro", "Xước mặt sau nhẹ thì LP, giá thường thấp hơn NM khá nhiều. Bạn xem giá tham khảo quốc tế trên Check thẻ để có mốc."],
    ["Minh_CardVault", "Đồng ý với bác Kenjiro."],
  ]],
  ["F368", "Bóc thẻ", "Minh_CardVault", 14, "Khoe binder Eevee-lution sau 2 năm săn", [
    ["Minh_CardVault", "Sau 2 năm cuối cùng cũng đủ 9 Eevee-lution bản SIR. Lá khó nhất là Umbreon, săn mãi mới có."],
    ["Kenjiro", "Binder đẹp quá bác ơi."],
    ["Son_Grail", "Respect 🙏"],
    ["Tuan_Poke", "Bao giờ em mới được như này."],
  ]],
  ["F368", "Bóc thẻ", "Kenjiro", 20, "Pack 151 bản tiếng Anh: tỉ lệ ra SIR có thấp quá không?", [
    ["Kenjiro", "Bóc 2 box 151 mà chỉ ra 1 SIR. Anh em thấy tỉ lệ có thấp hơn các set khác không?"],
    ["Son_Grail", "Mỗi box mỗi khác, đừng lấy 2 box ra kết luận nha bác."],
  ]],
  ["F368", "Định giá", "PikaFan", 26, "Thẻ Pikachu cũ ở nhà có giá trị không ạ?", [
    ["PikaFan", "Nhà em có vài lá Pikachu từ hồi xưa, mặt sau có logo Pokémon màu xanh. Làm sao biết có giá trị không ạ?"],
    ["Mod_Khang", "Bạn dùng Check thẻ trên web: chụp ảnh lá thẻ, hệ thống đọc tên và số thẻ rồi tra giá tham khảo. Thẻ bản tiếng Anh mới tra được nhé."],
  ]],
  ["F368", "Bóc thẻ", "Son_Grail", 31, "Paldean Fates: 10 pack ra 2 shiny, hên chưa", [
    ["Son_Grail", "Ra Shiny Charmander với Shiny Pikachu. Set này vui thật."],
    ["Bao_TCG", "Hên quá bác."],
  ]],
  ["F368", "Định giá", "Tuan_Poke", 40, "Hỏi cách phân biệt NM và LP cho người mới", [
    ["Tuan_Poke", "Các bác cho em hỏi nhìn vào đâu để biết thẻ NM hay LP ạ?"],
    ["Son_Grail", "Xem 4 góc (có trắng không), 4 cạnh (có sứt không), mặt thẻ (có xước không) dưới đèn. Gần như hoàn hảo là NM, có vài lỗi nhỏ là LP, lỗi thấy rõ là MP, hư hại nặng là HP."],
    ["Kenjiro", "Bài của bác Son nên ghim lại."],
  ]],
  ["F368", "Bóc thẻ", "Bao_TCG", 46, "Bóc 5 pack Surging Sparks giờ nghỉ trưa", [["Bao_TCG", "Không ra gì nhưng vui. Lá đẹp nhất là một holo rare."]]],
  ["F368", "Bóc thẻ", "Huy_Collector", 52, "Ra lá full art đầu tiên trong đời", [
    ["Huy_Collector", "Không phải SIR nhưng là full art đầu tiên của em, vui cả ngày."],
    ["Tuan_Poke", "Chúc mừng bác!"],
  ]],
  ["F368", "Định giá", "Nam_Eevee", 60, "Sylveon ex SIR bản tiếng Anh giá tham khảo bao nhiêu?", [["Nam_Eevee", "Em định gom lá này mà chưa biết giá. Ai có kinh nghiệm cho em xin ý kiến."]]],
  ["F368", "Bóc thẻ", "Minh_CardVault", 70, "Mở tin Prismatic Evolutions: không trúng nhưng tin đẹp", [["Minh_CardVault", "Tin để đựng thẻ được, bỏ phí thì tiếc."]]],
  ["F368", "Bóc thẻ", "Tuan_Poke", 80, "Ai đã bóc Stellar Crown chưa?", [
    ["Tuan_Poke", "Đang phân vân có nên mua box Stellar Crown không, nghe nói tỉ lệ ổn."],
    ["Kenjiro", "Mình bóc 1 box, ra 1 SIR Terapagos."],
  ]],
  ["F368", "Định giá", "Son_Grail", 90, "Giá thẻ Pikachu illustrator rare có đáng tin không?", [["Son_Grail", "Thấy nhiều bài trên mạng nói giá cao chót vót. Theo anh em nên tin nguồn nào để tham khảo giá?"]]],
  ["F368", "Bóc thẻ", "PikaFan", 100, "Pack đầu tiên trong đời", [["PikaFan", "Ra Pikachu thường thôi nhưng là Pikachu nên vẫn vui 😆"]]],
  ["F368", "Bóc thẻ", "Bao_TCG", 110, "Review sleeve và toploader ở shop", [["Bao_TCG", "Sleeve vừa khít, toploader cứng. Ổn cho người mới."]]],
  ["F368", "Định giá", "Huy_Collector", 130, "Thẻ bị cong nhẹ có làm giảm giá nhiều không?", [
    ["Huy_Collector", "Lá của em bị cong nhẹ do để trong túi quần 😢"],
    ["Son_Grail", "Cong thì thường xuống LP hoặc MP tùy mức độ. Lần sau nhớ dùng toploader."],
  ]],
  ["F368", "Bóc thẻ", "Kenjiro", 150, "Tổng kết 1 tháng săn Surging Sparks", [["Kenjiro", "3 box, 2 SIR, 5 full art. Lãi lỗ không quan trọng, vui là chính."]]],
  ["F368", "Bóc thẻ", "Nam_Eevee", 170, "Có nên mua pack lẻ hay mua box?", [
    ["Nam_Eevee", "Người mới nên mua pack lẻ hay gom tiền mua box ạ?"],
    ["Minh_CardVault", "Thích cảm giác bóc thì pack lẻ, muốn lá cụ thể thì mua thẻ lẻ sẽ rẻ hơn."],
  ]],
  ["F368", "Định giá", "Tuan_Poke", 190, "Giá thẻ tăng giảm theo mùa giải không?", [["Tuan_Poke", "Thấy giá vài lá tăng mạnh sau giải lớn, có đúng không các bác?"]]],
  ["F368", "Bóc thẻ", "Son_Grail", 220, "Kỷ niệm 1 năm chơi Pokémon TCG", [["Son_Grail", "Cảm ơn anh em F368 đã chỉ giáo suốt 1 năm qua."]]],

  ["F666", "Luật chơi", "Mod_Khang", 500, "Tổng hợp luật cơ bản cho người mới (đọc trước khi hỏi)", [
    ["Mod_Khang",
      "**Deck:** đúng 60 lá, tối đa 4 lá cùng tên (trừ Năng lượng cơ bản).\n" +
      "**Thắng khi:** lấy hết 6 lá Prize, hoặc đối thủ hết Pokémon trên sân, hoặc đối thủ không rút được bài đầu lượt.\n" +
      "**Mỗi lượt:** rút 1 lá; gắn tối đa 1 Năng lượng; chơi tối đa 1 Supporter; tiến hóa, dùng Item thoải mái; tấn công thì kết thúc lượt.\n" +
      "Câu hỏi luật cụ thể, các bạn mở topic tag Hỏi đáp nhé."],
  ], { pinned: 1 }],
  ["F666", "Hỏi đáp", "PikaFan", 3, "Lượt đầu tiên có được tấn công không ạ?", [
    ["PikaFan", "Em đọc luật thấy người đi trước không được tấn công ở lượt đầu, đúng không ạ?"],
    ["Mod_Khang", "Đúng rồi bạn. Người đi trước không được tấn công và không được chơi Supporter ở lượt đầu tiên."],
    ["Kenjiro", "Bổ sung: người đi sau thì được làm tất cả ngay từ lượt đầu."],
  ]],
  ["F666", "Deck", "Kenjiro", 12, "Chia sẻ deck Charizard ex cho người mới", [
    ["Kenjiro", "Deck này dễ chơi, lá không quá đắt. Ý tưởng chính: lên Charizard ex nhanh bằng Rare Candy, đánh mạnh dần theo số Prize đối thủ đã lấy.\n\nAi cần danh sách 60 lá chi tiết thì trả lời bên dưới nhé."],
    ["Bao_TCG", "Xin list với bác ơi."],
    ["Huy_Collector", "Em cũng xin."],
  ]],
  ["F666", "Meta", "Son_Grail", 48, "Meta hiện tại: deck nào đang mạnh?", [
    ["Son_Grail", "Theo anh em deck nào đang thống trị các giải gần đây?"],
    ["Kenjiro", "Thấy Dragapult ex với Gardevoir ex vẫn nhiều."],
  ]],
  ["F666", "Hỏi đáp", "Nam_Eevee", 75, "Pokémon ex bị hạ thì đối thủ lấy mấy Prize?", [
    ["Nam_Eevee", "Em thấy có người lấy 2 lá, đúng luật không ạ?"],
    ["Mod_Khang", "Đúng: hạ Pokémon ex thì lấy 2 Prize, Pokémon thường lấy 1."],
  ]],
  ["F666", "Deck", "Minh_CardVault", 140, "Deck Eevee vui vẻ, không cần thắng", [["Minh_CardVault", "Deck toàn Eevee-lution cho vui, chơi với bạn bè cuối tuần."]]],
];

// Câu trả lời ngắn để tạo một topic dài (kiểm tra phân trang 20 bài / trang)
const SHORT_REPLIES = [
  "Hóng kết quả!", "Chúc mừng bác 🎉", "Đẹp quá.", "Lưu lại học hỏi.", "Cảm ơn bác chia sẻ.",
  "Mình cũng nghĩ vậy.", "Hay quá bác ơi.", "Up cho anh em xem.", "Like mạnh.", "Thông tin hữu ích.",
];

function seedDatabase() {
  const random = createRandom(368);
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  transaction(() => {
    // Thành viên
    const userIds = {};
    const insertUser = db.prepare(
      `INSERT INTO users (email, display_name, password_hash, role, email_verified, created_at)
       VALUES (?, ?, ?, ?, 1, ?)`
    );
    for (const user of USERS) {
      const result = insertUser.run(user.email, user.name, passwordHash, user.role || "member", iso(Date.parse(user.joined + "T03:00:00Z")));
      userIds[user.name] = Number(result.lastInsertRowid);
    }

    // Forum + tag
    const forumIds = {};
    const prefixIds = {};
    FORUMS.forEach((forum, index) => {
      const result = db
        .prepare("INSERT INTO forums (code, name, description, sort_order, staff_only) VALUES (?, ?, ?, ?, ?)")
        .run(forum.code, forum.name, forum.description, index + 1, forum.staffOnly);
      forumIds[forum.code] = Number(result.lastInsertRowid);
      for (const [name, color, requiresListing] of forum.prefixes) {
        const prefix = db
          .prepare("INSERT INTO prefixes (forum_id, name, color, requires_listing) VALUES (?, ?, ?, ?)")
          .run(forumIds[forum.code], name, color, requiresListing || 0);
        prefixIds[forum.code + "/" + name] = Number(prefix.lastInsertRowid);
      }
    });

    // Thêm một topic dài 26 bài để thấy phân trang trong topic
    const longReplies = [];
    for (let i = 0; i < 25; i++) {
      longReplies.push([USERS[2 + (i % 8)].name, SHORT_REPLIES[i % SHORT_REPLIES.length]]);
    }
    const allThreads = THREADS.concat([
      ["F368", "Bóc thẻ", "Kenjiro", 4, "Livestream bóc 1 case Surging Sparks: cập nhật liên tục", [
        ["Kenjiro", "Mình bóc 1 case (6 box), cập nhật kết quả từng box ở topic này. Anh em vào hóng nhé."],
      ].concat(longReplies)],
    ]);

    const insertThread = db.prepare(
      `INSERT INTO threads (forum_id, user_id, prefix_id, title, pinned, locked, reply_count, last_post_at, last_post_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertPost = db.prepare("INSERT INTO posts (thread_id, user_id, content, created_at) VALUES (?, ?, ?, ?)");
    const insertLike = db.prepare("INSERT OR IGNORE INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)");
    const memberNames = USERS.map((u) => u.name);

    for (const [forumCode, prefixName, author, hoursAgo, title, posts, options = {}] of allThreads) {
      const createdMs = now - hoursAgo * HOUR;
      // Các bài trả lời rải đều từ lúc mở topic tới gần hiện tại
      const postTimes = posts.map((_, i) => createdMs + (hoursAgo * HOUR * 0.9 * i) / Math.max(1, posts.length));
      const lastIndex = posts.length - 1;

      const thread = insertThread.run(
        forumIds[forumCode],
        userIds[author],
        prefixIds[forumCode + "/" + prefixName],
        title,
        options.pinned || 0,
        options.locked || 0,
        posts.length - 1,
        iso(postTimes[lastIndex]),
        userIds[posts[lastIndex][0]],
        iso(createdMs)
      );

      posts.forEach(([postAuthor, content], i) => {
        const post = insertPost.run(thread.lastInsertRowid, userIds[postAuthor], content, iso(postTimes[i]));
        // Vài người like ngẫu nhiên (không ai tự like bài mình)
        const likeCount = Math.floor(random() * (i === 0 ? 7 : 4));
        for (let k = 0; k < likeCount; k++) {
          const liker = memberNames[Math.floor(random() * memberNames.length)];
          if (liker === postAuthor) continue;
          const likeMs = Math.min(now - 60 * 1000, postTimes[i] + random() * 6 * HOUR);
          insertLike.run(post.lastInsertRowid, userIds[liker], iso(likeMs));
        }
      });
    }

    // Ký gửi, đơn hàng, bộ sưu tập, trả giá, đánh giá, topic Mua bán (server/seed-shop.js)
    seedShop(userIds);

    // Lượt xem "từ trước" (giả lập), tỉ lệ với số bài trả lời; lượt xem mới do F52 đếm thật
    const setViews = db.prepare("UPDATE threads SET view_count = ? WHERE id = ?");
    for (const thread of db.prepare("SELECT id, reply_count FROM threads").all()) {
      setViews.run(Math.floor((thread.reply_count + 1) * (8 + random() * 25)), thread.id);
    }

    // Đồng bộ các con số đếm từ dữ liệu thật vừa tạo
    db.exec("UPDATE posts SET like_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id)");
    const updateCounts = db.prepare(
      `UPDATE users SET
         likes_received = ? + (SELECT COUNT(*) FROM likes lk JOIN posts po ON po.id = lk.post_id WHERE po.user_id = users.id),
         post_count = ? + (SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id)
       WHERE id = ?`
    );
    for (const user of USERS) updateCounts.run(user.oldLikes, user.oldPosts, userIds[user.name]);
  });

  // Ảnh chụp + hashtag thẻ / bộ cho các topic mẫu (server/seed-forum-media.js)
  upgradeDemoForum();
}

module.exports = { seedDatabase, DEMO_PASSWORD };

// Chạy trực tiếp: npm run db:reset
if (require.main === module) {
  if (!isNew) {
    console.log("CSDL đã có dữ liệu. Muốn tạo lại từ đầu: dừng server rồi chạy  npm run db:reset");
  } else {
    seedDatabase();
    console.log("Đã tạo CSDL mới kèm dữ liệu mẫu. Mật khẩu mọi tài khoản mẫu:", DEMO_PASSWORD);
  }
}
