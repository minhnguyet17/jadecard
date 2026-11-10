# Vai trò người dùng

| Vai trò | Nhiệm vụ chính | Quyền hạn dự kiến |
|---|---|---|
| **Khách chưa đăng nhập** | Tìm và xem sản phẩm, **dùng thử Check thẻ**, thêm vào giỏ | Xem thông tin công khai. Bộ sưu tập và giỏ hàng chỉ lưu trên trình duyệt đang dùng. Không đặt hàng, không gửi yêu cầu bán. |
| **Khách hàng (thành viên)** | Mua hàng và theo dõi đơn, quản lý bộ sưu tập (*Đang có* / *Đang săn*), **bán thẻ cho shop** và theo dõi yêu cầu. Từ v2.0: **viết bài, like trên diễn đàn, ký gửi thẻ** | Quản lý thông tin, đơn hàng, yêu cầu bán, bài viết, tin ký gửi và bộ sưu tập **của chính mình**. Từ v2.0, bộ sưu tập lưu theo tài khoản và người khác xem được (trừ khi chủ để riêng tư). Phải **xác thực email bằng OTP** mới được viết bài, like, ký gửi. |
| **Điều hành viên (Mod)** (v2.0) | Giữ trật tự diễn đàn | Ghim, khóa, ẩn topic hoặc bài; xử lý báo cáo. Không có quyền về đơn hàng, thu mua, ký gửi. |
| **Quản trị viên** (chủ shop, kiêm nhân viên kiểm định trong MVP) | Quản lý sản phẩm và tồn kho, xử lý đơn hàng, **xử lý yêu cầu thu mua** (kiểm tra sơ bộ online, duyệt; kiểm định, chốt giá và trả tiền tại quầy; nhập kho thẻ lẻ), cấu hình tỉ giá và hệ số. Từ v2.0: **kiểm định và tất toán ký gửi**, đăng thông báo ở F100 | Toàn bộ nghiệp vụ quản trị, gồm cả quyền của Mod |

**Vì sao cho khách chưa đăng nhập dùng Check thẻ?** Check thẻ là "cửa vào" của website. Bắt đăng nhập ngay từ đầu sẽ làm mất người dùng mới. Chỉ khi khách muốn **bán thẻ** hoặc **đặt hàng** thì mới cần tài khoản, vì lúc đó cần thông tin liên hệ. Việc trả tiền thu mua diễn ra tại cửa hàng, nên hệ thống không thu thông tin tài khoản ngân hàng.

**Mở rộng sau MVP:** tách vai trò *Nhân viên kiểm định* (chỉ xử lý yêu cầu thu mua) khỏi *Quản trị viên* (toàn quyền) khi shop có nhiều nhân sự.

## Ma trận quyền

| Chức năng | Khách | Khách hàng | Admin |
|---|:-:|:-:|:-:|
| Xem, tìm sản phẩm (F01–F03) | ✅ | ✅ | ✅ |
| Giỏ hàng (F04) | ✅ | ✅ | |
| Đặt hàng, theo dõi đơn (F05, F07) | | ✅ | |
| Check thẻ (F08–F12) | ✅ | ✅ | ✅ |
| Bộ sưu tập (F13, F14) | ✅ *(lưu trên trình duyệt)* | ✅ *(lưu trên trình duyệt)* | |
| Bán thẻ cho shop: gửi và theo dõi yêu cầu (F16–F18) | | ✅ | |
| Xử lý thu mua: kiểm tra online, ghi kết quả giao dịch tại quầy (F21) | | | ✅ |
| Quản trị sản phẩm, đơn hàng, cấu hình giá (F19, F20, F22) | | | ✅ |

### Bổ sung từ v2.0 (Tài khoản, Diễn đàn, Ký gửi, Bộ sưu tập công khai)

| Chức năng | Khách | Thành viên | Mod | Admin |
|---|:-:|:-:|:-:|:-:|
| Đăng ký, xác thực OTP, quên mật khẩu (F30–F33) | ✅ | ✅ | ✅ | ✅ |
| Đọc diễn đàn, xem hồ sơ thành viên (F34–F36, F41) | ✅ | ✅ | ✅ | ✅ |
| Xem bộ sưu tập công khai của người khác (F27) | ✅ | ✅ | ✅ | ✅ |
| Tạo topic, trả lời, trích dẫn, like, báo cáo (F37–F39, F42) | | ✅ *(đã xác thực)* | ✅ | ✅ |
| Sửa bài, sửa bộ sưu tập **của mình** | | ✅ | ✅ | ✅ |
| Đăng topic ở F100 Thông báo | | | | ✅ |
| Ghim, khóa, ẩn topic/bài; xử lý báo cáo (F42) | | | ✅ | ✅ |
| Khóa tài khoản | | | | ✅ |
| Đăng tin ký gửi, theo dõi, rút tin của mình (F43, F48); gắn tin của mình vào topic Mua bán (F50) | | ✅ *(đã xác thực)* | | |
| Xem và mua tin ký gửi đang bán (F45–F47) | ✅ *(xem, thêm giỏ)* | ✅ | ✅ | ✅ |
| Kiểm định, tất toán ký gửi (F44, F49) | | | | ✅ |
| Trả giá tin ký gửi của người khác (F55) | | ✅ *(đã xác thực)* | | |
| Chấp nhận / từ chối trả giá cho tin **của mình** (F55) | | ✅ | | |
| Đánh giá người bán sau đơn hoàn thành (F56) | | ✅ *(người mua của đơn đó)* | | |
| Ẩn nhận xét đánh giá vi phạm (F56) | | | ✅ | ✅ |
