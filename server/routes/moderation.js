// ======================================================================
// API KIỂM DUYỆT (F42)
//   POST /api/posts/:id/report            thành viên báo cáo bài vi phạm
//   GET  /api/mod/reports                 Mod/Admin: báo cáo đang chờ xử lý
//   POST /api/mod/reports/:id/resolve     Mod/Admin: đánh dấu đã xử lý
//   POST /api/threads/:id/moderate        Mod/Admin: pin | unpin | lock | unlock | hide | unhide
//   POST /api/posts/:id/moderate          Mod/Admin: hide | unhide một bài trả lời
//   POST /api/users/:name/ban             Mod/Admin: khóa / mở khóa tài khoản
//   POST /api/reviews/:id/moderate        Mod/Admin: ẩn / hiện nhận xét người bán (F56)
// Quy tắc like (F39): bài bị ẩn thì like của bài không còn tính cho tác giả → trừ ra; bỏ ẩn thì cộng lại.
// ======================================================================
const express = require("express");
const { db, transaction, nowIso } = require("../db");
const { ApiError } = require("../errors");
const { requireLogin, requireRole, endAllSessions } = require("../session");
const { authorFromRow, authorColumns } = require("../users");
const v = require("../validate");

const router = express.Router();
const staffOnly = requireRole("mod", "admin");

const REPORT_REASONS = ["Spam / quảng cáo", "Mua bán ngoài Ký gửi", "Lừa đảo / thẻ giả", "Xúc phạm, công kích", "Khác"];

// ---------- Báo cáo bài ----------
router.post("/posts/:id/report", requireLogin, (req, res) => {
  const postId = v.toPositiveInt(req.params.id);
  const post = postId && db.prepare("SELECT * FROM posts WHERE id = ? AND hidden = 0").get(postId);
  if (!post) throw new ApiError(404, "Không tìm thấy bài viết này.");
  if (post.user_id === req.user.id) throw new ApiError(400, "Bạn không thể báo cáo bài của chính mình.");
  const reason = String(req.body.reason || "");
  if (!REPORT_REASONS.includes(reason)) throw new ApiError(400, "Hãy chọn lý do báo cáo.", { field: "reason" });
  const note = v.cleanText(req.body.note, { field: "note", label: "Ghi chú", min: 0, max: 300 });
  if (db.prepare("SELECT 1 FROM reports WHERE post_id = ? AND user_id = ? AND status = 'open'").get(post.id, req.user.id)) {
    throw new ApiError(409, "Bạn đã báo cáo bài này, Mod đang xử lý.");
  }
  db.prepare("INSERT INTO reports (post_id, user_id, reason, created_at) VALUES (?, ?, ?, ?)").run(
    post.id,
    req.user.id,
    note ? `${reason}: ${note}` : reason,
    nowIso()
  );
  res.status(201).json({ ok: true });
});

router.get("/mod/reports", staffOnly, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.id, r.reason, r.created_at, p.id AS post_id, p.content, p.hidden AS post_hidden, p.thread_id, t.title,
              ${authorColumns("rep", "reporter_")}, ${authorColumns("au")},
              (SELECT COUNT(*) FROM posts p2 WHERE p2.thread_id = p.thread_id AND p2.id <= p.id) AS position
       FROM reports r JOIN posts p ON p.id = r.post_id JOIN threads t ON t.id = p.thread_id
       JOIN users rep ON rep.id = r.user_id JOIN users au ON au.id = p.user_id
       WHERE r.status = 'open' ORDER BY r.id`
    )
    .all();
  res.json({
    reports: rows.map((row) => ({
      id: row.id,
      reason: row.reason,
      createdAt: row.created_at,
      reporter: authorFromRow(row, "reporter_"),
      post: {
        id: row.post_id,
        content: row.content.slice(0, 400),
        hidden: Boolean(row.post_hidden),
        threadId: row.thread_id,
        threadTitle: row.title,
        page: Math.ceil(row.position / 20),
        author: authorFromRow(row),
      },
    })),
  });
});

router.post("/mod/reports/:id/resolve", staffOnly, (req, res) => {
  const result = db.prepare("UPDATE reports SET status = 'resolved' WHERE id = ? AND status = 'open'").run(v.toPositiveInt(req.params.id) || 0);
  if (!result.changes) throw new ApiError(404, "Không tìm thấy báo cáo đang chờ.");
  res.json({ ok: true });
});

// ---------- Cộng / trừ số đếm khi ẩn / hiện bài ----------
// sign = -1 khi ẩn, +1 khi bỏ ẩn. Chỉ áp dụng cho các bài đang hiển thị trong topic.
function adjustCounters(posts, sign) {
  for (const post of posts) {
    db.prepare("UPDATE users SET likes_received = likes_received + ?, post_count = post_count + ? WHERE id = ?").run(
      sign * post.like_count,
      sign,
      post.user_id
    );
  }
}

// Bài cuối cùng còn hiện của topic (để cột "Trả lời cuối" đúng sau khi ẩn bài)
function refreshLastPost(threadId) {
  const last = db.prepare("SELECT user_id, created_at FROM posts WHERE thread_id = ? AND hidden = 0 ORDER BY id DESC LIMIT 1").get(threadId);
  const replies = db.prepare("SELECT COUNT(*) AS n FROM posts WHERE thread_id = ? AND hidden = 0").get(threadId).n - 1;
  if (last) {
    db.prepare("UPDATE threads SET last_post_at = ?, last_post_user_id = ?, reply_count = ? WHERE id = ?").run(
      last.created_at,
      last.user_id,
      Math.max(0, replies),
      threadId
    );
  }
}

// ---------- Ghim / khóa / ẩn topic ----------
router.post("/threads/:id/moderate", staffOnly, (req, res) => {
  const threadId = v.toPositiveInt(req.params.id);
  const thread = threadId && db.prepare("SELECT * FROM threads WHERE id = ?").get(threadId);
  if (!thread) throw new ApiError(404, "Không tìm thấy topic này.");

  const simple = { pin: ["pinned", 1], unpin: ["pinned", 0], lock: ["locked", 1], unlock: ["locked", 0] };
  const action = req.body.action;
  if (simple[action]) {
    const [column, value] = simple[action];
    db.prepare(`UPDATE threads SET ${column} = ? WHERE id = ?`).run(value, thread.id);
  } else if (action === "hide" || action === "unhide") {
    const hide = action === "hide";
    if (Boolean(thread.hidden) !== hide) {
      transaction(() => {
        const visiblePosts = db.prepare("SELECT user_id, like_count FROM posts WHERE thread_id = ? AND hidden = 0").all(thread.id);
        adjustCounters(visiblePosts, hide ? -1 : 1);
        db.prepare("UPDATE threads SET hidden = ? WHERE id = ?").run(hide ? 1 : 0, thread.id);
      });
    }
  } else {
    throw new ApiError(400, "Thao tác không hợp lệ.");
  }
  res.json({ ok: true });
});

// ---------- Ẩn / hiện một bài trả lời ----------
router.post("/posts/:id/moderate", staffOnly, (req, res) => {
  const postId = v.toPositiveInt(req.params.id);
  const post = postId && db.prepare("SELECT p.*, t.hidden AS thread_hidden FROM posts p JOIN threads t ON t.id = p.thread_id WHERE p.id = ?").get(postId);
  if (!post) throw new ApiError(404, "Không tìm thấy bài viết này.");
  const first = db.prepare("SELECT id FROM posts WHERE thread_id = ? ORDER BY id LIMIT 1").get(post.thread_id);
  if (first.id === post.id) throw new ApiError(400, "Đây là bài mở topic: hãy ẩn cả topic.");

  const hide = req.body.action === "hide";
  if (req.body.action !== "hide" && req.body.action !== "unhide") throw new ApiError(400, "Thao tác không hợp lệ.");
  if (Boolean(post.hidden) !== hide) {
    transaction(() => {
      if (!post.thread_hidden) adjustCounters([post], hide ? -1 : 1);
      db.prepare("UPDATE posts SET hidden = ? WHERE id = ?").run(hide ? 1 : 0, post.id);
      if (hide) db.prepare("UPDATE reports SET status = 'resolved' WHERE post_id = ? AND status = 'open'").run(post.id);
      refreshLastPost(post.thread_id);
    });
  }
  res.json({ ok: true });
});

// ---------- Khóa / mở khóa tài khoản ----------
router.post("/users/:name/ban", staffOnly, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE display_name = ?").get(String(req.params.name).normalize("NFC"));
  if (!user) throw new ApiError(404, "Không tìm thấy thành viên này.");
  if (user.role !== "member") throw new ApiError(403, "Không thể khóa tài khoản nhân viên (Admin, Mod).");
  const banned = req.body.banned === true;
  db.prepare("UPDATE users SET banned = ? WHERE id = ?").run(banned ? 1 : 0, user.id);
  if (banned) endAllSessions(user.id); // đăng xuất ngay trên mọi thiết bị
  res.json({ ok: true, banned });
});

// ---------- Ẩn / hiện nhận xét người bán (F56) ----------
router.post("/reviews/:id/moderate", staffOnly, (req, res) => {
  const hide = req.body.action === "hide";
  const result = db.prepare("UPDATE seller_reviews SET hidden = ? WHERE id = ?").run(hide ? 1 : 0, v.toPositiveInt(req.params.id) || 0);
  if (!result.changes) throw new ApiError(404, "Không tìm thấy nhận xét này.");
  res.json({ ok: true });
});

module.exports = router;
module.exports.REPORT_REASONS = REPORT_REASONS;
