// ======================================================================
// NÂNG CẤP DỮ LIỆU MẪU DIỄN ĐÀN: ảnh chụp + hashtag thẻ / bộ cho các topic mẫu
//   - Chạy MỘT lần (ghi dấu "forum_media_v1" trong bảng app_meta).
//   - Chạy được cả với CSDL cũ (không cần npm run db:reset, không đụng tài khoản thật):
//     chỉ sửa bài mở topic của các topic mẫu (tìm theo tiêu đề), bài đã được sửa tay thì bỏ qua.
//   - Ảnh chụp: images/forum/ (nguồn Pexels, xem images/forum/NGUON-ANH.md).
//     Ảnh scan thẻ: images/cards/ (TCGdex).
// Trong nội dung bên dưới, {{card:sv08-238}} / {{set:sv08}} được thay bằng hashtag thật (#PikachuEx_SV08_238...).
// ======================================================================
const { db, transaction, nowIso } = require("./db");
const tags = require("./tags");

const FLAG = "forum_media_v1";
const HOUR = 60 * 60 * 1000;

// Hashtag dùng trong dữ liệu mẫu (thông tin chép sẵn từ TCGdex để seed chạy được khi không có mạng)
const TCGDEX = "https://assets.tcgdex.net/en";
const SEED_TAGS = [
  { kind: "card", ref: "sv08-238", name: "Pikachu ex", setId: "sv08", setName: "Surging Sparks", number: "238/191", image: `${TCGDEX}/sv/sv08/238` },
  { kind: "card", ref: "sv08.5-161", name: "Umbreon ex", setId: "sv08.5", setName: "Prismatic Evolutions", number: "161/131", image: `${TCGDEX}/sv/sv08.5/161` },
  { kind: "card", ref: "sv03.5-199", name: "Charizard ex", setId: "sv03.5", setName: "151", number: "199/165", image: `${TCGDEX}/sv/sv03.5/199` },
  { kind: "card", ref: "sv03.5-006", name: "Charizard ex", setId: "sv03.5", setName: "151", number: "006/165", image: `${TCGDEX}/sv/sv03.5/006` },
  { kind: "card", ref: "base1-4", name: "Charizard", setId: "base1", setName: "Base Set", number: "4/102", image: `${TCGDEX}/base/base1/4` },
  { kind: "card", ref: "neo1-70", name: "Pikachu", setId: "neo1", setName: "Neo Genesis", number: "70/111", image: `${TCGDEX}/neo/neo1/70` },
  { kind: "card", ref: "sv07-170", name: "Terapagos ex", setId: "sv07", setName: "Stellar Crown", number: "170/142", image: `${TCGDEX}/sv/sv07/170` },
  { kind: "set", ref: "sv08", name: "Surging Sparks", setId: "sv08", setName: "Surging Sparks", image: `${TCGDEX}/sv/sv08/logo` },
  { kind: "set", ref: "sv08.5", name: "Prismatic Evolutions", setId: "sv08.5", setName: "Prismatic Evolutions", image: `${TCGDEX}/sv/sv08.5/logo` },
  { kind: "set", ref: "sv03.5", name: "151", setId: "sv03.5", setName: "151", image: `${TCGDEX}/sv/sv03.5/logo` },
  { kind: "set", ref: "sv07", name: "Stellar Crown", setId: "sv07", setName: "Stellar Crown", image: `${TCGDEX}/sv/sv07/logo` },
  { kind: "set", ref: "sv04.5", name: "Paldean Fates", setId: "sv04.5", setName: "Paldean Fates", image: `${TCGDEX}/sv/sv04.5/logo` },
];

const IMG = "/images/forum/";
const CARD = "/images/cards/";

// Sửa bài mở topic (và vài bài trả lời) của topic mẫu đã có: [tiêu đề, nội dung mới, ảnh, { số thứ tự bài trả lời: nội dung }]
const UPDATES = [
  ["Xé 1 box Surging Sparks ra Pikachu ex SIR, run tay thật sự",
    "Pack thứ 31/36, đang định bỏ cuộc thì lá cuối là {{card:sv08-238}}. Đã cho vào sleeve + toploader ngay lập tức.\n\n" +
    "Ảnh 2 là đống thẻ thường của 35 pack trước 😅 Box {{set:sv08}} lần này vẫn đáng tiền.\n\nAnh em nghĩ nên giữ hay đem ký gửi?",
    [CARD + "sv08-238.webp", IMG + "cards-fanned-backs.jpg"]],
  ["Nhờ các bác định giá giúp Umbreon ex SIR Prismatic Evolutions",
    "Em có lá {{card:sv08.5-161}}, góc trên bên phải hơi trắng một chút (ảnh scan để các bác nhận đúng lá). " +
    "Theo các bác tình trạng này là NM hay LP, và tầm giá bao nhiêu ạ?",
    [CARD + "sv08.5-161.webp"]],
  ["Lần đầu mua ETB, ra toàn thẻ thường mà vẫn vui",
    "Lần đầu mua Elite Trainer Box {{set:sv08.5}}, không ra lá hiếm nào nhưng được bộ sleeve với hộp đựng xịn. " +
    "Bày hết lên ghế chụp kỷ niệm. Có ai mới chơi như mình không?",
    [IMG + "cards-sofa-pile.jpg"]],
  ["Charizard ex SIR 151 bản LP thì tầm giá bao nhiêu?",
    "Lá {{card:sv03.5-199}}, mặt trước đẹp nhưng mặt sau có vết xước nhẹ. Bác nào có kinh nghiệm định giá giúp.",
    [CARD + "sv03.5-199.webp"]],
  ["Thẻ Pikachu cũ ở nhà có giá trị không ạ?",
    "Nhà em có vài lá Pikachu từ hồi xưa, mặt sau có logo Pokémon màu xanh. Em chụp 1 lá đây, tra trên mạng thì hình như là {{card:neo1-70}}. " +
    "Làm sao biết có giá trị không ạ?",
    [IMG + "pikachu-neo-hand.jpg"]],
  ["Pack 151 bản tiếng Anh: tỉ lệ ra SIR có thấp quá không?",
    "Bóc 2 box {{set:sv03.5}} mà chỉ ra 1 SIR. Anh em thấy tỉ lệ có thấp hơn các set khác không?", []],
  ["Bóc 5 pack Surging Sparks giờ nghỉ trưa",
    "Không ra gì nhưng vui. Lá đẹp nhất là một holo rare. Mai thử tiếp {{set:sv08}} xem đổi vận không.", []],
  ["Ai đã bóc Stellar Crown chưa?",
    "Đang phân vân có nên mua box {{set:sv07}} không, nghe nói tỉ lệ ổn.", [],
    { 1: "Mình bóc 1 box, ra 1 SIR {{card:sv07-170}}." }],
  ["Paldean Fates: 10 pack ra 2 shiny, hên chưa",
    "Ra Shiny Charmander với Shiny Pikachu. Set {{set:sv04.5}} này vui thật.", []],
  ["Kỷ niệm 1 năm chơi Pokémon TCG",
    "Cảm ơn anh em F368 đã chỉ giáo suốt 1 năm qua.\n\nKhoe luôn góc trưng bày nhỏ: Dark Blastoise bản Nhật, lá cũ đầu tiên mình mua bằng lương tháng đầu.",
    [IMG + "blastoise-display-shelf.jpg"]],
  ["Khoe binder Eevee-lution sau 2 năm săn",
    "Sau 2 năm cuối cùng cũng đủ 9 Eevee-lution bản SIR. Lá khó nhất là {{card:sv08.5-161}}, săn mãi mới có.", []],
  ["Tổng kết 1 tháng săn Surging Sparks",
    "3 box {{set:sv08}}, 2 SIR, 5 full art. Lãi lỗ không quan trọng, vui là chính.", []],
  ["Chia sẻ deck Charizard ex cho người mới",
    "Deck này dễ chơi, lá không quá đắt. Ý tưởng chính: lên {{card:sv03.5-006}} nhanh bằng Rare Candy, đánh mạnh dần theo số Prize đối thủ đã lấy.\n\n" +
    "Ai cần danh sách 60 lá thì reply, mình gửi.", []],
  ["Hàng mới về: Booster Pack và Booster Box Surging Sparks",
    "Shop đã nhập thêm Booster Pack và Booster Box {{set:sv08}} (bản tiếng Anh). Giá và số lượng cập nhật trên trang Sản phẩm.\n\n" +
    "Nhắc lại: thẻ hiếm ra ngẫu nhiên, mua vì thích bóc là chính nhé anh em.", []],
];

// Topic mẫu mới (có nhiều ảnh): [forum, tag, tác giả, số giờ trước, tiêu đề, [[người viết, nội dung, ảnh?], ...]]
const NEW_THREADS = [
  ["F368", "Bóc thẻ", "Kenjiro", 7, "Khoe bộ Charizard sau 3 năm săn, đã vào magnetic case hết", [
    ["Kenjiro",
      "Sau 3 năm cuối cùng cũng gom được bộ Charizard mình thích nhất. Lá cưng nhất vẫn là {{card:base1-4}} — mua lại của một bác chơi từ 1999.\n\n" +
      "Ảnh 3 là 2 lá Charizard GX / VMAX shiny. Đang săn thêm {{card:sv03.5-199}} cho đủ bộ hiện đại.",
      [IMG + "charizard-collection-hand.jpg", IMG + "charizard-base-case.jpg", IMG + "charizard-gx-cases.jpg"]],
    ["Minh_CardVault", "Lá Base Set kia còn đẹp quá bác, góc gần như không trắng."],
    ["Tuan_Poke", "Ước mơ của em 😭"],
    ["Huy_Collector", "Bác chụp ảnh có tâm thật. Magnetic case loại nào vậy bác?"],
    ["Kenjiro", "Loại 35pt thường thôi bác, shop mình cũng có bán."],
  ]],
];

// "{{card:sv08-238}}" → "#PikachuEx_SV08_238"
function fillTags(text, slugOf) {
  return text.replace(/\{\{(card|set):([^}]+)\}\}/g, (match, kind, ref) => "#" + slugOf[kind + ":" + ref]);
}

function upgradeDemoForum() {
  if (db.prepare("SELECT 1 FROM app_meta WHERE key = ?").get(FLAG)) return;

  transaction(() => {
    const slugOf = {};
    for (const info of SEED_TAGS) slugOf[info.kind + ":" + info.ref] = tags.saveTag(info).slug;

    const insertImage = db.prepare("INSERT INTO post_images (post_id, path) VALUES (?, ?)");
    const postsOf = db.prepare("SELECT id, content, edited_at FROM posts WHERE thread_id = ? ORDER BY id");
    const updatePost = db.prepare("UPDATE posts SET content = ? WHERE id = ?");

    // 1. Topic mẫu đã có: thêm hashtag + ảnh
    for (const [title, firstContent, images, replies = {}] of UPDATES) {
      const thread = db.prepare("SELECT id FROM threads WHERE title = ? ORDER BY id LIMIT 1").get(title);
      if (!thread) continue; // CSDL không có topic mẫu này
      const posts = postsOf.all(thread.id);
      const edits = { 0: firstContent, ...replies };
      for (const [index, content] of Object.entries(edits)) {
        const post = posts[Number(index)];
        if (!post || post.edited_at) continue; // bài đã được người dùng sửa thì giữ nguyên
        const filled = fillTags(content, slugOf);
        updatePost.run(filled, post.id);
        tags.syncPostTags(post.id, filled);
      }
      const first = posts[0];
      const hasImages = first && db.prepare("SELECT 1 FROM post_images WHERE post_id = ?").get(first.id);
      if (first && !hasImages) for (const path of images) insertImage.run(first.id, path);
    }

    // 2. Topic mẫu mới
    const userId = (name) => db.prepare("SELECT id FROM users WHERE display_name = ?").get(name)?.id;
    for (const [forumCode, prefixName, author, hoursAgo, title, posts] of NEW_THREADS) {
      if (db.prepare("SELECT 1 FROM threads WHERE title = ?").get(title)) continue;
      const forum = db.prepare("SELECT id FROM forums WHERE code = ?").get(forumCode);
      const prefix = forum && db.prepare("SELECT id FROM prefixes WHERE forum_id = ? AND name = ?").get(forum.id, prefixName);
      if (!forum || !prefix || posts.some(([name]) => !userId(name))) continue;

      const createdMs = Date.now() - hoursAgo * HOUR;
      const times = posts.map((_, i) => new Date(createdMs + (hoursAgo * HOUR * 0.85 * i) / posts.length).toISOString());
      const last = posts[posts.length - 1];
      const thread = db
        .prepare(
          `INSERT INTO threads (forum_id, user_id, prefix_id, title, reply_count, view_count, last_post_at, last_post_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(forum.id, userId(author), prefix.id, title, posts.length - 1, 214, times[times.length - 1], userId(last[0]), times[0]);

      posts.forEach(([name, content, images = []], i) => {
        const filled = fillTags(content, slugOf);
        const post = db
          .prepare("INSERT INTO posts (thread_id, user_id, content, created_at) VALUES (?, ?, ?, ?)")
          .run(thread.lastInsertRowid, userId(name), filled, times[i]);
        for (const path of images) insertImage.run(post.lastInsertRowid, path);
        tags.syncPostTags(post.lastInsertRowid, filled);
        db.prepare("UPDATE users SET post_count = post_count + 1 WHERE id = ?").run(userId(name));

        // Bài mở topic được vài thành viên like (không ai tự like bài mình)
        if (i === 0) {
          for (const liker of ["Minh_CardVault", "Son_Grail", "Tuan_Poke", "Huy_Collector", "Bao_TCG"]) {
            if (!userId(liker)) continue;
            db.prepare("INSERT OR IGNORE INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)").run(post.lastInsertRowid, userId(liker), times[i]);
          }
          const likes = db.prepare("SELECT COUNT(*) AS n FROM likes WHERE post_id = ?").get(post.lastInsertRowid).n;
          db.prepare("UPDATE posts SET like_count = ? WHERE id = ?").run(likes, post.lastInsertRowid);
          db.prepare("UPDATE users SET likes_received = likes_received + ? WHERE id = ?").run(likes, userId(name));
        }
      });
    }

    db.prepare("INSERT INTO app_meta (key, value) VALUES (?, ?)").run(FLAG, nowIso());
  });
}

module.exports = { upgradeDemoForum, SEED_TAGS };
