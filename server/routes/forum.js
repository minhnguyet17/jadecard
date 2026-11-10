// ======================================================================
// API DIỄN ĐÀN
//   GET   /api/forum                      trang chủ diễn đàn (F34) + thành viên nổi bật tuần (F53)
//   GET   /api/forums/:code/threads       danh sách topic của một forum (F35)
//   POST  /api/forums/:code/threads       tạo topic (F37)
//   GET   /api/threads/:id                xem topic + các bài (F36), đếm lượt xem (F52)
//   POST  /api/threads/:id/posts          trả lời (F38)
//   PATCH /api/posts/:id                  sửa bài của chính mình (F38)
//   POST  /api/posts/:id/like             like / bỏ like (F39)
//   GET   /api/my/attachable-listings     tin ký gửi của tôi gắn được vào topic Mua bán (F50)
// Hashtag thẻ / bộ trong bài (#PikachuEx_SV08_238, #SurgingSparks): xem server/tags.js
// ======================================================================
const crypto = require("node:crypto");
const express = require("express");
const { db, transaction, nowIso } = require("../db");
const { ApiError } = require("../errors");
const { requireLogin } = require("../session");
const { authorFromRow, authorColumns } = require("../users");
const { uploadImages, checkImages, saveImages } = require("../uploads");
const v = require("../validate");
const c = require("../consign");
const { REPORT_REASONS } = require("./moderation");
const tags = require("../tags");

const router = express.Router();

const PAGE_SIZE = 20; // 20 topic mỗi trang (F35), 20 bài mỗi trang (F36)
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const VIEW_WINDOW_MS = 60 * 60 * 1000; // 1 người được tính tối đa 1 lượt xem mỗi giờ (F52)

const isStaff = (user) => Boolean(user && (user.role === "mod" || user.role === "admin"));

// ---------- Các hàm đọc dữ liệu dùng chung ----------

function findForum(code) {
  const forum = db.prepare("SELECT * FROM forums WHERE code = ?").get(String(code).toUpperCase());
  if (!forum) throw new ApiError(404, "Không tìm thấy forum này.");
  return forum;
}

function forumView(forum) {
  return {
    code: forum.code,
    name: forum.name,
    description: forum.description,
    staffOnly: Boolean(forum.staff_only),
  };
}

function prefixView(row) {
  if (!row.prefix_id) return null;
  return { id: row.prefix_id, name: row.prefix_name, color: row.prefix_color };
}

// Câu SELECT cho một dòng topic: kèm tag tiền tố, người mở topic, người trả lời cuối
// và tin ký gửi được gắn (topic Mua bán, F50)
const THREAD_SELECT = `
  SELECT t.*, p.name AS prefix_name, p.color AS prefix_color,
         ${authorColumns("a")}, ${authorColumns("l", "last_")},
         ls.image AS listing_image, COALESCE(ls.list_price, ls.asking_price) AS listing_price, ls.status AS listing_status
  FROM threads t
  LEFT JOIN prefixes p ON p.id = t.prefix_id
  JOIN users a ON a.id = t.user_id
  LEFT JOIN users l ON l.id = t.last_post_user_id
  LEFT JOIN listings ls ON ls.id = t.listing_id`;

function threadSummary(row) {
  return {
    id: row.id,
    title: row.title,
    prefix: prefixView(row),
    pinned: Boolean(row.pinned),
    locked: Boolean(row.locked),
    hidden: Boolean(row.hidden),
    replyCount: row.reply_count,
    viewCount: row.view_count,
    createdAt: row.created_at,
    lastPostAt: row.last_post_at,
    author: authorFromRow(row),
    lastPoster: row.last_id ? authorFromRow(row, "last_") : null,
    // Tin ký gửi gắn kèm: ảnh nhỏ + giá + trạng thái ngay trên danh sách topic (F50)
    listing: row.listing_id
      ? {
          id: row.listing_id,
          image: row.listing_image,
          price: row.listing_price,
          status: row.listing_status,
          statusLabel: c.STATUS_LABELS[row.listing_status],
          verified: !["pending", "rejected", "expired_verify", "withdrawn"].includes(row.listing_status),
          sold: ["sold", "settled"].includes(row.listing_status),
        }
      : null,
  };
}

// Topic ẩn chỉ Mod/Admin thấy. Người khác nhận lỗi 404 như topic không tồn tại.
function findVisibleThread(id, user) {
  const threadId = v.toPositiveInt(id);
  const row = threadId && db.prepare(THREAD_SELECT + " WHERE t.id = ?").get(threadId);
  if (!row || (row.hidden && !isStaff(user))) throw new ApiError(404, "Không tìm thấy topic này.");
  return row;
}

// ---------- F34 + F53: Trang chủ diễn đàn ----------
router.get("/forum", (req, res) => {
  const forums = db.prepare("SELECT * FROM forums ORDER BY sort_order").all();

  const countThreads = db.prepare("SELECT COUNT(*) AS n FROM threads WHERE forum_id = ? AND hidden = 0");
  const countPosts = db.prepare(
    `SELECT COUNT(*) AS n FROM posts po JOIN threads t ON t.id = po.thread_id
     WHERE t.forum_id = ? AND t.hidden = 0 AND po.hidden = 0`
  );
  const latestThread = db.prepare(THREAD_SELECT + " WHERE t.forum_id = ? AND t.hidden = 0 ORDER BY t.last_post_at DESC LIMIT 1");

  const forumList = forums.map((forum) => {
    const latest = latestThread.get(forum.id);
    return {
      ...forumView(forum),
      threadCount: countThreads.get(forum.id).n,
      postCount: countPosts.get(forum.id).n,
      latest: latest ? threadSummary(latest) : null,
    };
  });

  // F53: 5 người nhận nhiều like nhất trong 7 ngày (chỉ tính bài và topic chưa bị ẩn)
  const topRows = db
    .prepare(
      `SELECT ${authorColumns("u")}, COUNT(*) AS week_likes
       FROM likes lk
       JOIN posts po ON po.id = lk.post_id
       JOIN threads t ON t.id = po.thread_id
       JOIN users u ON u.id = po.user_id
       WHERE lk.created_at >= ? AND po.hidden = 0 AND t.hidden = 0 AND u.banned = 0
       GROUP BY u.id
       ORDER BY week_likes DESC, u.likes_received DESC
       LIMIT 5`
    )
    .all(nowIso(-WEEK_MS));

  // Số đếm thật từ CSDL (không dùng số liệu trang trí như bản Stitch)
  const totals = db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM threads WHERE hidden = 0) AS threads,
              (SELECT COUNT(*) FROM posts po JOIN threads t ON t.id = po.thread_id WHERE po.hidden = 0 AND t.hidden = 0) AS posts,
              (SELECT COUNT(*) FROM users WHERE email_verified = 1 AND banned = 0) AS members`
    )
    .get();

  res.json({
    forums: forumList,
    topMembers: topRows.map((row) => ({ user: authorFromRow(row), weekLikes: row.week_likes })),
    totals,
  });
});

// ---------- F35: Danh sách topic ----------
router.get("/forums/:code/threads", (req, res) => {
  const forum = findForum(req.params.code);
  const page = v.toPositiveInt(req.query.page, 1);
  const prefixId = v.toPositiveInt(req.query.prefix);

  // Các tag tiền tố kèm số topic của từng tag (hiện trên chip lọc)
  const prefixes = db
    .prepare(
      `SELECT p.*, (SELECT COUNT(*) FROM threads t WHERE t.prefix_id = p.id AND t.hidden = 0) AS thread_count
       FROM prefixes p WHERE p.forum_id = ? ORDER BY p.id`
    )
    .all(forum.id)
    .map((p) => ({ id: p.id, name: p.name, color: p.color, requiresListing: Boolean(p.requires_listing), count: p.thread_count }));

  // Mod/Admin thấy cả topic ẩn (có nhãn "Đã ẩn") để còn bỏ ẩn được
  const where = ["t.forum_id = ?"];
  const params = [forum.id];
  if (!isStaff(req.user)) where.push("t.hidden = 0");
  if (prefixId) {
    where.push("t.prefix_id = ?");
    params.push(prefixId);
  }
  const whereSql = " WHERE " + where.join(" AND ");

  // Topic ghim: luôn nằm trên cùng, chỉ hiện ở trang 1
  const pinned = page === 1 ? db.prepare(THREAD_SELECT + whereSql + " AND t.pinned = 1 ORDER BY t.last_post_at DESC").all(...params) : [];

  // Topic thường: sắp theo bài trả lời mới nhất, 20 topic mỗi trang
  const total = db.prepare("SELECT COUNT(*) AS n FROM threads t" + whereSql + " AND t.pinned = 0").get(...params).n;
  const threads = db
    .prepare(THREAD_SELECT + whereSql + " AND t.pinned = 0 ORDER BY t.last_post_at DESC LIMIT ? OFFSET ?")
    .all(...params, PAGE_SIZE, (page - 1) * PAGE_SIZE);

  const totalAll = db.prepare("SELECT COUNT(*) AS n FROM threads t WHERE t.forum_id = ? AND t.hidden = 0").get(forum.id).n;

  res.json({
    forum: forumView(forum),
    prefixes,
    totalAll,
    pinned: pinned.map(threadSummary),
    threads: threads.map(threadSummary),
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
    canCreate: Boolean(req.user) && (!forum.staff_only || req.user.role === "admin"),
  });
});

// ---------- F37: Tạo topic ----------
router.post("/forums/:code/threads", requireLogin, uploadImages(4), (req, res) => {
  const forum = findForum(req.params.code);
  if (forum.staff_only && req.user.role !== "admin") {
    throw new ApiError(403, `Chỉ Admin được mở topic trong ${forum.code}.`);
  }

  const prefix = db.prepare("SELECT * FROM prefixes WHERE id = ? AND forum_id = ?").get(v.toPositiveInt(req.body.prefixId), forum.id);
  if (!prefix) throw new ApiError(400, "Vui lòng chọn tag cho topic.", { field: "prefixId" });
  // F50: topic Mua bán phải gắn đúng một tin ký gửi của chính mình
  const listingId = prefix.requires_listing ? checkAttachableListing(req.body.listingId, req.user) : null;

  const title = v.cleanText(req.body.title, { field: "title", label: "Tiêu đề", min: 5, max: 120 });
  const content = v.cleanText(req.body.content, { field: "content", label: "nội dung", max: 10000 });
  const checkedImages = checkImages(req.files);

  const threadId = transaction(() => {
    const now = nowIso();
    const thread = db
      .prepare(
        `INSERT INTO threads (forum_id, user_id, prefix_id, title, listing_id, last_post_at, last_post_user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(forum.id, req.user.id, prefix.id, title, listingId, now, req.user.id, now);
    const post = db
      .prepare("INSERT INTO posts (thread_id, user_id, content, created_at) VALUES (?, ?, ?, ?)")
      .run(thread.lastInsertRowid, req.user.id, content, now);
    savePostImages(post.lastInsertRowid, checkedImages);
    tags.syncPostTags(post.lastInsertRowid, content);
    db.prepare("UPDATE users SET post_count = post_count + 1 WHERE id = ?").run(req.user.id);
    return Number(thread.lastInsertRowid);
  });

  res.status(201).json({ id: threadId });
});

// Các trạng thái tin còn gắn được vào topic (tin "Chờ kiểm định" vẫn gắn được, thẻ hiện "Chưa xác thực")
const ATTACHABLE = ["pending", "active", "held", "reserved"];

function checkAttachableListing(value, user) {
  const listingId = v.toPositiveInt(value);
  if (!listingId) throw new ApiError(400, "Topic Mua bán phải gắn một tin ký gửi của bạn.", { field: "listingId" });
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
  if (!listing || listing.seller_id !== user.id) {
    throw new ApiError(403, "Chỉ gắn được tin ký gửi của chính bạn.", { field: "listingId" });
  }
  if (!ATTACHABLE.includes(listing.status)) throw new ApiError(400, "Tin này không còn bán, không gắn được.", { field: "listingId" });
  if (db.prepare("SELECT 1 FROM threads WHERE listing_id = ?").get(listingId)) {
    throw new ApiError(409, "Tin này đã được gắn vào một topic khác.", { field: "listingId" });
  }
  return listingId;
}

// Tin của tôi chưa gắn topic nào (để chọn trong form tạo topic Mua bán)
router.get("/my/attachable-listings", requireLogin, (req, res) => {
  const marks = ATTACHABLE.map(() => "?").join(",");
  const rows = db
    .prepare(
      c.LISTING_SELECT +
        ` WHERE li.seller_id = ? AND li.status IN (${marks}) AND NOT EXISTS (SELECT 1 FROM threads t WHERE t.listing_id = li.id) ORDER BY li.id DESC`
    )
    .all(req.user.id, ...ATTACHABLE);
  res.json({ listings: rows.map(c.listingCard) });
});

function savePostImages(postId, checkedImages) {
  const paths = saveImages(checkedImages, "forum");
  const insert = db.prepare("INSERT INTO post_images (post_id, path) VALUES (?, ?)");
  for (const imagePath of paths) insert.run(postId, imagePath);
}

// ---------- F36: Xem topic (+ F52 đếm lượt xem) ----------
router.get("/threads/:id", (req, res) => {
  const row = findVisibleThread(req.params.id, req.user);
  countView(req, res, row);

  const staff = isStaff(req.user);
  const hiddenFilter = staff ? "" : " AND po.hidden = 0";
  const totalPosts = db.prepare("SELECT COUNT(*) AS n FROM posts po WHERE po.thread_id = ?" + hiddenFilter).get(row.id).n;
  const pageCount = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));
  const page = Math.min(v.toPositiveInt(req.query.page, 1), pageCount);

  const postRows = db
    .prepare(
      `SELECT po.*, ${authorColumns("u")} FROM posts po JOIN users u ON u.id = po.user_id
       WHERE po.thread_id = ?${hiddenFilter} ORDER BY po.id LIMIT ? OFFSET ?`
    )
    .all(row.id, PAGE_SIZE, (page - 1) * PAGE_SIZE);

  // Bài đầu tiên của topic (để đánh dấu "Chủ thớt")
  const firstPost = db.prepare("SELECT id FROM posts WHERE thread_id = ? ORDER BY id LIMIT 1").get(row.id);

  // Những bài trong trang này mà người đang xem đã like
  const likedIds = new Set();
  if (req.user && postRows.length) {
    const marks = postRows.map(() => "?").join(",");
    db.prepare(`SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${marks})`)
      .all(req.user.id, ...postRows.map((p) => p.id))
      .forEach((like) => likedIds.add(like.post_id));
  }

  const imagesOf = db.prepare("SELECT path FROM post_images WHERE post_id = ? ORDER BY id");
  // Hashtag thẻ / bộ của từng bài + số tin ký gửi đang bán của các thẻ được nhắc (thẻ mời mua)
  const tagsByPost = tags.tagsForPosts(postRows.map((post) => post.id));
  const cardRefs = Object.values(tagsByPost).flat().filter((tag) => tag.kind === "card").map((tag) => tag.ref);
  const forum = db.prepare("SELECT * FROM forums WHERE id = ?").get(row.forum_id);

  res.json({
    forum: forumView(forum),
    thread: threadSummary(row),
    posts: postRows.map((post, index) => ({
      id: post.id,
      number: (page - 1) * PAGE_SIZE + index + 1, // số thứ tự #1, #2... trong topic
      isFirst: post.id === firstPost.id,
      content: post.content,
      createdAt: post.created_at,
      editedAt: post.edited_at,
      likeCount: post.like_count,
      likedByMe: likedIds.has(post.id),
      hidden: Boolean(post.hidden),
      images: imagesOf.all(post.id).map((image) => image.path),
      tags: tagsByPost[post.id] || [],
      author: authorFromRow(post),
      canEdit: Boolean(req.user) && req.user.id === post.user_id && !row.locked,
      canReport: Boolean(req.user) && req.user.id !== post.user_id && !post.hidden,
    })),
    page,
    pageCount,
    canReply: Boolean(req.user) && !row.locked,
    canModerate: staff,
    reportReasons: REPORT_REASONS,
    listingStats: tags.listingStats(cardRefs),
    // Thẻ sản phẩm ở đầu mọi trang của topic Mua bán, luôn theo trạng thái mới nhất (F50)
    listing: row.listing_id ? c.listingCard(c.findListing(row.listing_id)) : null,
  });
});

// F52: mỗi người (khách thì theo mã trình duyệt) tối đa 1 lượt mỗi giờ; tác giả xem bài mình không tính
function countView(req, res, thread) {
  if (req.user && req.user.id === thread.user_id) return;

  let viewerKey;
  if (req.user) {
    viewerKey = "u:" + req.user.id;
  } else {
    let browserId = req.cookies.vid;
    if (!/^[a-f0-9]{32}$/.test(browserId || "")) {
      browserId = crypto.randomBytes(16).toString("hex");
      res.cookie("vid", browserId, { httpOnly: true, sameSite: "lax", maxAge: 365 * 24 * 60 * 60 * 1000 });
    }
    viewerKey = "g:" + browserId;
  }

  const last = db.prepare("SELECT viewed_at FROM thread_views WHERE thread_id = ? AND viewer_key = ?").get(thread.id, viewerKey);
  if (last && last.viewed_at > nowIso(-VIEW_WINDOW_MS)) return; // đã tính trong vòng 1 giờ

  transaction(() => {
    db.prepare(
      `INSERT INTO thread_views (thread_id, viewer_key, viewed_at) VALUES (?, ?, ?)
       ON CONFLICT (thread_id, viewer_key) DO UPDATE SET viewed_at = excluded.viewed_at`
    ).run(thread.id, viewerKey, nowIso());
    db.prepare("UPDATE threads SET view_count = view_count + 1 WHERE id = ?").run(thread.id);
  });
  thread.view_count += 1;
}

// ---------- F38: Trả lời ----------
router.post("/threads/:id/posts", requireLogin, uploadImages(4), (req, res) => {
  const thread = findVisibleThread(req.params.id, req.user);
  if (thread.locked) throw new ApiError(403, "Topic đã bị khóa, không thể trả lời.", { code: "THREAD_LOCKED" });

  const content = v.cleanText(req.body.content, { field: "content", label: "nội dung trả lời", max: 10000 });
  const checkedImages = checkImages(req.files);

  const postId = transaction(() => {
    const now = nowIso();
    const post = db
      .prepare("INSERT INTO posts (thread_id, user_id, content, created_at) VALUES (?, ?, ?, ?)")
      .run(thread.id, req.user.id, content, now);
    savePostImages(post.lastInsertRowid, checkedImages);
    tags.syncPostTags(post.lastInsertRowid, content);
    db.prepare(
      "UPDATE threads SET reply_count = reply_count + 1, last_post_at = ?, last_post_user_id = ? WHERE id = ?"
    ).run(now, req.user.id, thread.id);
    db.prepare("UPDATE users SET post_count = post_count + 1 WHERE id = ?").run(req.user.id);
    return Number(post.lastInsertRowid);
  });

  // Trang chứa bài vừa đăng, để giao diện chuyển tới đúng chỗ
  const visibleCount = db.prepare("SELECT COUNT(*) AS n FROM posts WHERE thread_id = ? AND hidden = 0").get(thread.id).n;
  res.status(201).json({ postId, page: Math.ceil(visibleCount / PAGE_SIZE) });
});

// Tìm một bài còn hiển thị (bài hoặc topic bị ẩn thì coi như không có)
function findVisiblePost(id) {
  const postId = v.toPositiveInt(id);
  const post =
    postId &&
    db
      .prepare(
        `SELECT po.*, t.locked AS thread_locked, t.hidden AS thread_hidden
         FROM posts po JOIN threads t ON t.id = po.thread_id WHERE po.id = ?`
      )
      .get(postId);
  if (!post || post.hidden || post.thread_hidden) throw new ApiError(404, "Không tìm thấy bài viết này.");
  return post;
}

// ---------- F38: Sửa bài của chính mình ----------
router.patch("/posts/:id", requireLogin, (req, res) => {
  const post = findVisiblePost(req.params.id);
  if (post.user_id !== req.user.id) throw new ApiError(403, "Bạn chỉ được sửa bài của chính mình.");
  if (post.thread_locked) throw new ApiError(403, "Topic đã bị khóa, không thể sửa bài.");

  const content = v.cleanText(req.body.content, { field: "content", label: "nội dung", max: 10000 });
  const editedAt = nowIso();
  transaction(() => {
    db.prepare("UPDATE posts SET content = ?, edited_at = ? WHERE id = ?").run(content, editedAt, post.id);
    tags.syncPostTags(post.id, content);
  });
  const postTags = tags.tagsForPosts([post.id])[post.id] || [];
  res.json({
    id: post.id,
    content,
    editedAt,
    tags: postTags,
    listingStats: tags.listingStats(postTags.filter((tag) => tag.kind === "card").map((tag) => tag.ref)),
  });
});

// ---------- F39: Like / bỏ like (làm thay đổi chức vụ của tác giả, F40) ----------
router.post("/posts/:id/like", requireLogin, (req, res) => {
  const post = findVisiblePost(req.params.id);
  if (post.user_id === req.user.id) throw new ApiError(400, "Bạn không thể tự like bài của mình.");

  const alreadyLiked = db.prepare("SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?").get(post.id, req.user.id);
  const change = alreadyLiked ? -1 : 1; // bấm lại để bỏ like

  transaction(() => {
    if (alreadyLiked) {
      db.prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?").run(post.id, req.user.id);
    } else {
      db.prepare("INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)").run(post.id, req.user.id, nowIso());
    }
    db.prepare("UPDATE posts SET like_count = like_count + ? WHERE id = ?").run(change, post.id);
    db.prepare("UPDATE users SET likes_received = likes_received + ? WHERE id = ?").run(change, post.user_id);
  });

  const likeCount = db.prepare("SELECT like_count FROM posts WHERE id = ?").get(post.id).like_count;
  res.json({ liked: !alreadyLiked, likeCount });
});

module.exports = router;
