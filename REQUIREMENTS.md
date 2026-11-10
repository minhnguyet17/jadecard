# Requirements — JadeCard

> **Phiên bản 2.1 (09/11/2026):** sau khi duyệt giao diện Stitch, thêm lượt xem, thành viên nổi bật tuần, thẻ xem nhanh khi rê avatar, **trả giá tin ký gửi** và **đánh giá người bán** (F52–F56). Chi tiết: [docs/stitch-review-cong-dong.md](docs/stitch-review-cong-dong.md).
>
> **Phiên bản 2.0 (09/11/2026): mở rộng thành cửa hàng + cộng đồng.** Thêm Tài khoản xác thực bằng OTP, Diễn đàn và Ký gửi tại cửa hàng (kế hoạch và các quyết định: [docs/ke-hoach-cong-dong.md](docs/ke-hoach-cong-dong.md)). Các phần còn lại giữ như bản 1.0.
>
> **Phiên bản 1.0 (đã chốt, 07/11/2026).** Bản này được tổng hợp từ khảo sát đối thủ, phân tích của AI thứ nhất ([01-phan-tich-yeu-cau.md](docs/ai-analysis/01-phan-tich-yeu-cau.md)), phản biện của AI thứ hai ([02-phan-bien.md](docs/ai-analysis/02-phan-bien.md)) và **bảng quyết định của Jade** (mục 3 của file 02). Các mã **PBxx** trong file này trỏ tới ý kiến phản biện tương ứng.

## 1. Mục tiêu dự án

**Mục tiêu kinh doanh**
- Bán hàng Pokémon TCG nguyên hộp và **thẻ lẻ** trực tuyến.
- Tạo **nguồn hàng thẻ lẻ từ chính cộng đồng** qua chức năng thu mua: JadeCard mua thẻ đạt ngưỡng giá với giá thấp hơn giá tham khảo, rồi bán lại.
- Dùng **Check thẻ** và **Bộ sưu tập** để kéo người dùng quay lại, kể cả khi họ chưa có nhu cầu mua.
- **Xây cộng đồng** (từ v2.0): diễn đàn để người chơi khoe bóc thẻ, hỏi giá, bàn chiến thuật và lên chức vụ; **ký gửi** để người chơi bán thẻ qua JadeCard, JadeCard thu hoa hồng. Vòng lặp mong muốn: **Mua → Check → Bán / Ký gửi → Mua tiếp**.

**Giá trị cho khách hàng**
- Biết **giá tham khảo quốc tế** của thẻ, đã quy đổi ra VND, chỉ trong vài giây.
- Có kênh bán thẻ **minh bạch**: công thức giá công khai, có kiểm định, theo dõi được trạng thái.
- Mua được **đúng thẻ lẻ** đang cần, có ghi rõ tình trạng thẻ.

**Cơ sở của mục tiêu (PB01).** Đây là **cơ hội quan sát được trong phạm vi khảo sát**: website của 3 shop TCG lớn trong nước (khảo sát ngày 07/11/2026) không bán thẻ lẻ Pokémon và không có công cụ định giá. Khảo sát này chưa xét các kênh khác như Facebook hay cửa hàng trực tiếp, và chưa xác nhận nhu cầu của khách hàng. Nhu cầu được kiểm tra thêm bằng một khảo sát nhỏ người chơi ([docs/customer-survey.md](docs/customer-survey.md)).

## 2. Phạm vi

### Trong phạm vi (MVP)
- **Cửa hàng chỉ bán Pokémon TCG** (PB03): danh sách và chi tiết sản phẩm (hàng nguyên hộp và thẻ lẻ), tìm kiếm, lọc, sắp xếp, giỏ hàng, đặt hàng (COD hoặc chuyển khoản, xác nhận thủ công; giao hàng hoặc nhận tại cửa hàng), theo dõi đơn.
- **Check thẻ cho thẻ Pokémon bản tiếng Anh:** tải hoặc chụp ảnh → OCR → chọn đúng thẻ và biến thể → giá tham khảo quy đổi VND và giá thu mua dự kiến. Nếu OCR đọc sai, người dùng tìm thẻ bằng cách nhập tay.
- **Bộ sưu tập (bản gọn):** *Đang có* và *Đang săn*. Chưa đăng nhập thì lưu trên trình duyệt; từ v2.0 đăng nhập thì lưu theo tài khoản, và **thành viên khác xem được trên hồ sơ** (F27), là điểm thu hút của cộng đồng.
- **Bán thẻ cho shop (bán đứt), mỗi yêu cầu một thẻ** (PB15), giữ đơn giản: khách **gửi yêu cầu online** → chủ shop xem trước ảnh và thông tin để kiểm tra sơ bộ → khách **tự mang thẻ đến cửa hàng** → kiểm định, chốt giá và trả tiền **trực tiếp tại quầy** → nhập kho thẻ lẻ.
- Trang quản trị cơ bản.
- **Tài khoản** (v2.0): đăng ký, xác thực email bằng **OTP 6 số**, đăng nhập, quên mật khẩu.
- **Diễn đàn** (v2.0) kiểu VOZ: forum Fxx (F100 Thông báo, F368 Thợ săn tiền thưởng, F666 Thần bài), topic có tag tiền tố, trả lời, trích dẫn, like, **chức vụ theo số like**, hồ sơ thành viên, kiểm duyệt cơ bản.
- **Ký gửi tại cửa hàng** (v2.0): thành viên đăng tin, **mang thẻ đến cửa hàng để kiểm định**, shop giữ thẻ và bán hộ, bán xong trả tiền **tại quầy** sau khi trừ hoa hồng. Tin ký gửi được gắn vào topic **Mua bán** của F368.

### Ngoài phạm vi (không làm trong đồ án)
- Thanh toán trực tuyến qua cổng thanh toán (VNPay, MoMo, thẻ quốc tế).
- Bán và Check thẻ cho các dòng khác (One Piece, Yu-Gi-Oh!, MTG...). Dữ liệu vẫn có trường `game` để mở rộng sau.
- Check thẻ cho thẻ tiếng Nhật và các ngôn ngữ khác.
- Bán nhiều thẻ trong một yêu cầu thu mua.
- Gửi thẻ qua bưu điện, thanh toán thu mua online, hoặc lưu thông tin nhận tiền (số tài khoản) của khách trên hệ thống. Mọi giao dịch thu mua diễn ra tại cửa hàng.
- % hoàn thành set. Ghép tự động "ai đang có lá bạn săn" để thành viên tự trao đổi với nhau (vì mọi mua bán phải qua Ký gửi).
- Sàn mua bán trực tiếp giữa người dùng (P2P), tức thành viên tự giao dịch với nhau. Mọi mua bán giữa thành viên phải qua **Ký gửi**. Ngoài ra: biểu đồ lịch sử giá, đấu giá, chấm điểm thẻ (grading), ứng dụng di động riêng.
- Ký gửi kiểu giữ tiền online (escrow), gửi thẻ ký gửi qua bưu điện, trả tiền ký gửi qua chuyển khoản tự động.
- Diễn đàn: nhắn tin riêng, theo dõi topic / thành viên và thông báo, trình soạn thảo định dạng phức tạp, đăng nhập bằng Google / Facebook / Apple. (Đã xét lại khi duyệt Stitch ngày 09/11/2026: vẫn ngoài phạm vi.)
- Xác thực thật/giả bằng AI. Việc kiểm định do con người thực hiện khi nhận thẻ. Video kiểm định được quay và lưu **ngoài hệ thống**.

## 3. Người dùng

| Vai trò | Nhiệm vụ chính | Quyền hạn |
|---|---|---|
| Khách chưa đăng nhập | Xem và tìm sản phẩm, **dùng thử Check thẻ**, dùng Bộ sưu tập | Xem thông tin công khai. Thêm vào giỏ. Bộ sưu tập và giỏ hàng chỉ lưu trên trình duyệt đang dùng. |
| Khách hàng (thành viên) | Mua hàng, bán thẻ cho shop, **viết bài và like trên diễn đàn, ký gửi thẻ** (cần xác thực email) | Quản lý thông tin, đơn hàng, yêu cầu bán, bài viết và tin ký gửi **của chính mình** |
| Điều hành viên (Mod, từ v2.0) | Giữ trật tự diễn đàn | Ghim, khóa, ẩn topic hoặc bài; xử lý báo cáo. Không có quyền về đơn hàng, thu mua, ký gửi |
| Quản trị viên (chủ shop, kiêm nhân viên kiểm định) | Quản lý sản phẩm, đơn hàng, yêu cầu thu mua, **kiểm định và tất toán ký gửi** | Toàn bộ nghiệp vụ quản trị, gồm cả quyền của Mod |

Xem chi tiết và ma trận quyền tại [docs/user-roles.md](docs/user-roles.md).

## 4. Yêu cầu chức năng

Mức độ ưu tiên: **Bắt buộc** (phải có trong MVP) · **Nên có** (làm nếu kịp tiến độ) · **Nâng cao** (ngoài MVP).
Giai đoạn: **GĐ3** = frontend, JavaScript và localStorage · **GĐ4** = cần backend và cơ sở dữ liệu.

### 4.1 Cửa hàng

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F01 | Xem danh sách sản phẩm | Lưới sản phẩm theo danh mục: *Hàng nguyên hộp* (pack, box, ETB, tin) và *Thẻ lẻ* | Khách | Bắt buộc (GĐ3) | Hiển thị đúng ảnh, tên, giá, nhãn còn/hết hàng. Danh sách đổi theo danh mục được chọn. Sản phẩm bị ẩn không xuất hiện. |
| F02 | Xem chi tiết sản phẩm | Ảnh, tên, giá, mô tả, **số lượng tồn** ("Còn X"). **Thẻ lẻ** có thêm: set, số thẻ (vd. 025/165), độ hiếm, ngôn ngữ, biến thể (normal/holo/reverse holo), **tình trạng (NM/LP/MP/HP)** và giá tham khảo quốc tế để so sánh. | Khách | Bắt buộc (GĐ3) | Thẻ lẻ hiển thị đủ 7 trường thông tin và số tồn. Nút "Thêm vào giỏ" bị khóa khi hết hàng. |
| F03 | Tìm kiếm, lọc, sắp xếp | Tìm **trong các sản phẩm đang bán** theo tên **hoặc số thẻ** (vd. `025/165`). Lọc theo loại sản phẩm, set, khoảng giá, tình trạng. Sắp xếp theo giá hoặc mới nhất. *(Khác F10: F10 tra cứu toàn bộ danh mục thẻ Pokémon, kể cả thẻ shop không có.)* | Khách | Bắt buộc (GĐ3) | Tìm "pikachu" ra đúng các sản phẩm có chữ Pikachu. Nhập đúng số thẻ thì ra đúng thẻ đó. Kết hợp được bộ lọc với từ khóa. Không có kết quả thì hiện thông báo. |
| F04 | Giỏ hàng | Thêm, sửa số lượng, xóa, tính tổng. Lưu lại khi tải lại trang. | Khách / Khách hàng | Bắt buộc (GĐ3) | Không chọn được số lượng vượt tồn kho đang hiển thị. Tổng tiền đúng. Tải lại trang không mất giỏ. |
| F05 | Đặt hàng | Chọn **cách nhận hàng**: giao hàng (phí cố định) hoặc nhận tại cửa hàng (miễn phí, giữ đơn 7 ngày). Chọn **COD hoặc chuyển khoản**. Xem tổng tiền (đã gồm phí) **trước khi** xác nhận. | Khách hàng | Bắt buộc (GĐ3 giao diện, GĐ4 lưu đơn) | Kiểm tra định dạng SĐT và các trường bắt buộc (nhận tại cửa hàng thì không cần địa chỉ). Tổng tiền = tiền hàng + phí. Tạo được mã đơn. Giỏ được xóa sau khi đặt. Có ghi chú "Đơn chưa giữ hàng cho đến khi shop xác nhận" (PB12). Bấm "Đặt hàng" hai lần không tạo hai đơn. |
| F06 | Đăng ký / đăng nhập | Tài khoản bằng email và mật khẩu. **Từ v2.0 chia nhỏ thành F30–F33** (mục 4.8) | Khách | Bắt buộc (GĐ4) | Không đăng ký trùng email. Phải đăng nhập mới đặt hàng hoặc gửi yêu cầu bán. |
| F07 | Theo dõi đơn hàng | Danh sách đơn, **trạng thái đơn** và **trạng thái thanh toán** (xem mục 4.6) | Khách hàng | Bắt buộc (GĐ4) | Chỉ thấy đơn của chính mình. Sau khi admin cập nhật, khách **tải lại trang** thì thấy trạng thái mới. |

### 4.2 Check thẻ (điểm khác biệt)

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F08 | Quét thẻ bằng ảnh | Tải ảnh lên hoặc chụp bằng camera điện thoại. OCR (Tesseract.js) đọc **tên thẻ** và **số thẻ** (PB07). Worker OCR được khởi tạo sẵn khi mở trang và dùng lại cho các lần quét sau. | Khách | Bắt buộc (GĐ3) | Đo trên **bộ ảnh kiểm thử cố định** gồm 10 ảnh rõ, 3 ảnh khó (chụp nghiêng, thẻ holo bị lóa) và 2 ảnh ngoài phạm vi (thẻ tiếng Nhật, ảnh không phải thẻ) (PB11). **(a)** Ít nhất 7/10 ảnh rõ có thẻ đúng nằm trong danh sách kết quả của F09. **(b)** Ảnh ngoài phạm vi không được tự báo giá; hệ thống phải báo "Không nhận ra thẻ" hoặc chuyển sang F10. Có thông báo khi không đọc được. |
| F09 | Chọn thẻ và biến thể | Tìm trong nguồn dữ liệu thẻ, hiển thị tối đa 5 thẻ khớp (ảnh, tên, set, số). Người dùng **xác nhận đúng thẻ**, sau đó **chọn biến thể** (normal / holo / reverse holo, chỉ hiện những biến thể thẻ đó có). Có nút **"Không có thẻ phù hợp"** để chuyển sang F10. | Khách | Bắt buộc (GĐ3) | Không hiện giá trước khi người dùng xác nhận cả thẻ và biến thể. Không tự chọn thay khi có nhiều thẻ khớp. Thẻ đã chọn được lưu kèm `cardId`, set, số, ngôn ngữ và biến thể. |
| F10 | Tìm thẻ thủ công | Tra cứu **toàn bộ danh mục thẻ Pokémon** bằng tên và/hoặc số thẻ, có thể lọc theo set để thu hẹp kết quả | Khách | Bắt buộc (GĐ3) | Có lối vào từ màn hình kết quả OCR, từ nút "Không có thẻ phù hợp" và từ menu. Kết quả dẫn tiếp vào bước chọn biến thể (F09). |
| F11 | Xem giá tham khảo | **"Giá tham khảo quốc tế (quy đổi VND)"** = giá market của **đúng biến thể** từ nguồn giá × tỉ giá của **đúng loại tiền** nguồn trả về (PB08). Hiển thị giá gốc, tên nguồn và thời điểm cập nhật. | Khách | Bắt buộc (GĐ3) | Giá VND = giá gốc × tỉ giá cấu hình (sai số làm tròn ≤ 1.000đ). Luôn có nhãn "tham khảo". Không có giá cho biến thể đã chọn thì hiện **"Chưa có giá tham khảo"**: không hiện 0đ, không lấy giá của biến thể khác (PB09). Nếu đang dùng dữ liệu mẫu thì có nhãn **"Dữ liệu mô phỏng"**. |
| F12 | Giá thu mua dự kiến | **"Giá thu mua dự kiến"** theo công thức ở mục 4.5, hiển thị cho từng tình trạng NM/LP/MP/HP. Ghi rõ "giá chốt sau kiểm định". | Khách | Bắt buộc (GĐ3) | Giá đúng công thức. Thẻ dưới ngưỡng hiện "Thẻ chưa đạt ngưỡng giá thu mua". Thẻ chưa có giá tham khảo thì không hiện giá thu mua và không cho gửi yêu cầu bán. |

### 4.3 Bộ sưu tập (GĐ3 lưu trên trình duyệt; từ v2.0 gắn với tài khoản và xem được trên hồ sơ)

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F13 | Đang có (Have) | Thêm thẻ từ kết quả Check thẻ hoặc tìm thủ công. Lưu `cardId`, biến thể, số lượng, tình trạng, **giá tham khảo và ngày lưu**. Hiển thị **"Tổng giá tham khảo tại thời điểm lưu"** (PB19). Mỗi thẻ có nút **"Bán thẻ này"** (xem F16). | Khách / Khách hàng | Bắt buộc (GĐ3) | Tổng = Σ(giá lúc lưu × số lượng), chỉ tính các thẻ có giá. Thẻ chưa có giá được đếm riêng ("X thẻ chưa có giá"), không tính là 0đ. Thêm, sửa, xóa được. Dữ liệu còn sau khi tải lại trang. |
| F14 | Đang săn (Want) | Danh sách thẻ muốn có. Hiện nhãn **"JadeCard đang có hàng"** kèm link mua khi kho có sản phẩm thẻ lẻ **cùng `cardId` và biến thể**, **đang hiển thị** và **tồn > 0** (PB20). Nhãn được tính lại mỗi lần mở trang, không có thông báo đẩy. | Khách / Khách hàng | Bắt buộc (GĐ3) | Có hàng thì hiện nhãn và link đúng trang chi tiết. Sản phẩm hết hàng, bị ẩn hoặc khác biến thể thì không hiện nhãn. |
| F16 | *(Gộp vào F17)* | Nút "Bán thẻ này" trong *Đang có* chỉ là **một lối vào** của F17, dùng chung biểu mẫu và điền sẵn thông tin thẻ (PB05). Không có quy trình riêng. | Khách hàng | Bắt buộc, cùng F17 | Bấm "Bán thẻ này" thì form F17 có sẵn thẻ, biến thể và tình trạng. |
| F27 | Bộ sưu tập theo tài khoản, xem bộ sưu tập của thành viên khác (v2.0) | Khi đăng nhập, *Đang có* và *Đang săn* được lưu trên server. **Bấm vào avatar hoặc tên một thành viên** (trong diễn đàn, tin ký gửi) thì mở hồ sơ, có tab **Bộ sưu tập** của người đó. | Mọi người xem / Thành viên sửa của mình | Bắt buộc (GĐ4) | Chỉ chủ bộ sưu tập sửa được. Mặc định **công khai danh sách thẻ** nhưng **ẩn tổng giá trị**; chủ có thể bật hiện tổng giá trị hoặc chuyển cả bộ sưu tập sang riêng tư. Riêng tư thì người khác chỉ thấy "Bộ sưu tập đang ẩn". Thẻ đang ký gửi có nhãn "Đang bán" kèm link. |

**Quy tắc lưu trữ (PB22, sửa ở v2.0):**
- **Chưa đăng nhập:** bộ sưu tập lưu trên **trình duyệt** như bản 1.0. Trang có ghi chú: "Bộ sưu tập được lưu trên trình duyệt này. Đăng nhập để lưu vào tài khoản và chia sẻ với cộng đồng."
- **Lần đầu đăng nhập:** nếu trình duyệt đang có bộ sưu tập, hệ thống hỏi có **gộp vào tài khoản** không. Thẻ trùng (cùng `cardId`, biến thể, tình trạng) thì cộng số lượng.
- **Đã đăng nhập:** đọc và ghi trên server. Đăng xuất thì trình duyệt không giữ bản sao.
- **Lý do ẩn tổng giá trị mặc định:** công khai bộ sưu tập giá trị cao có thể khiến người dùng bị nhắm tới khi giao dịch trực tiếp, nên để chủ tự quyết.

### 4.4 Bán thẻ cho shop (thu mua)

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F17 | Gửi yêu cầu bán | **Mỗi yêu cầu một thẻ** (PB15). Gồm thẻ và biến thể (điền sẵn từ Check thẻ hoặc Bộ sưu tập), tình trạng tự đánh giá, ảnh mặt trước và mặt sau, SĐT liên hệ. Hiển thị giá thu mua dự kiến. Khi gửi, hệ thống **lưu lại giá tham khảo, tỉ giá, các hệ số và thời điểm** (PB16), rồi cấp một **mã yêu cầu** để khách đọc khi đến cửa hàng. **Không có** lựa chọn gửi bưu điện và **không hỏi** thông tin nhận tiền. | Khách hàng | Bắt buộc (GĐ3 giao diện, GĐ4 lưu và gửi) | Phải đăng nhập. Thẻ phải có giá tham khảo và đạt ngưỡng. Phải đồng ý điều khoản "giá chốt sau kiểm định tại cửa hàng" và chính sách thu mua (mục 4.7). Ảnh JPG/PNG ≤ 5MB. Bấm gửi hai lần không tạo hai yêu cầu. Đổi tỉ giá hay hệ số sau đó không làm thay đổi giá đã lưu của yêu cầu. |
| F18 | Theo dõi yêu cầu bán | Xem trạng thái, mã yêu cầu, giá đã lưu, hạn mang thẻ đến cửa hàng và lý do nếu bị từ chối. Sau khi giao dịch tại quầy xong, khách xem được **giá chốt** và kết quả kiểm định. Việc chấp nhận giá mới diễn ra **trực tiếp tại quầy**, không cần thao tác trên web (PB14). | Khách hàng | Bắt buộc (GĐ4) | Chỉ thấy yêu cầu của chính mình. Có thể **hủy** khi yêu cầu còn ở "Chờ duyệt" hoặc "Đã duyệt". Sau khi giao dịch tại quầy kết thúc, khách tải lại trang thì thấy giá chốt và kết quả kiểm định. |

### 4.5 Quy tắc giá (áp dụng cho F11, F12, F17)

```
Giá tham khảo VND     = Giá market của biến thể (nguồn giá) × Tỉ giá của loại tiền đó
Giá thu mua dự kiến   = Giá tham khảo VND × Hệ số thu mua × Hệ số tình trạng
Giá bán tại JadeCard  = Admin tự đặt cho từng sản phẩm (gợi ý = Giá tham khảo VND × Hệ số bán)
```

| Tham số (nằm ở **một chỗ duy nhất** là `js/config.js`; F22 chỉ là màn hình để sửa các tham số này) | Giá trị mặc định (giả định) |
|---|---|
| Nguồn giá chính | TCGdex, giá TCGplayer (USD) theo biến thể |
| Tỉ giá USD → VND | 26.000 |
| Hệ số thu mua | 60% |
| Hệ số tình trạng | NM 100% · LP 85% · MP 70% · HP 50% · Hư hỏng (DMG): không thu |
| Ngưỡng giá thu mua | Giá tham khảo VND ≥ 100.000đ |
| Hệ số bán gợi ý | 100% |
| Hạn mang thẻ đến cửa hàng (giữ giá dự kiến) | 7 ngày kể từ khi yêu cầu được duyệt |
| Phí giao hàng | 30.000đ cố định toàn quốc |

**Ví dụ:** thẻ có giá market 20 USD → giá tham khảo 520.000đ → giá thu mua dự kiến ở tình trạng LP = 520.000 × 60% × 85% = **265.200đ**.

> Các con số trên là **giả định để mô phỏng**. Cần đối chiếu với giá thu mua thực tế trong cộng đồng (xem mục 6). **Đạt ngưỡng giá không có nghĩa là shop chắc chắn mua** (PB10): shop vẫn có thể từ chối vì đã đủ hàng hoặc ít người cần thẻ đó, và điều này được ghi công khai trong chính sách thu mua.

### 4.6 Quản trị

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F19 | Quản lý sản phẩm | Thêm, sửa, ẩn sản phẩm nguyên hộp và thẻ lẻ. Quản lý tồn kho. Một sản phẩm thẻ lẻ được xác định bởi **`cardId` + biến thể + ngôn ngữ + tình trạng** (PB17). | Admin | Bắt buộc (GĐ3 dữ liệu mẫu, GĐ4 quản trị) | Sản phẩm bị ẩn không hiện ở trang khách. Không tạo được hai sản phẩm trùng cả 4 thuộc tính trên. |
| F20 | Quản lý đơn hàng | Xem đơn, cập nhật trạng thái đơn và trạng thái thanh toán. **Quy tắc tồn kho (PB12):** khi xác nhận đơn, hệ thống kiểm tra tồn kho; đủ hàng thì trừ kho ngay trong cùng thao tác, thiếu hàng thì **không cho xác nhận**. Hủy một đơn đã trừ kho thì **hoàn kho đúng một lần**. | Admin | Bắt buộc (GĐ4) | Chỉ đổi trạng thái theo đúng thứ tự (xem business-workflow). Thiếu hàng thì không xác nhận được. Hủy đơn hai lần không hoàn kho hai lần. Đơn đã thanh toán mà bị hủy thì phải có ghi chú hoàn tiền. |
| F21 | Xử lý yêu cầu thu mua | **Online:** xem trước ảnh và thông tin, kiểm tra sơ bộ thẻ có thật không → **Duyệt** (hẹn khách mang thẻ đến trong 7 ngày) hoặc **Từ chối** (chọn lý do có sẵn). **Tại quầy:** tìm yêu cầu theo mã → kiểm định thẻ thật → ghi **kết quả giao dịch**: *Đã mua* (nhập tình trạng thực tế, giá chốt, hình thức trả tiền là tiền mặt hoặc chuyển khoản tại quầy) hoặc *Không mua* (lý do: thẻ giả, khách không đồng ý giá mới, hư hỏng). Sau "Đã mua" → **nhập kho**: nếu đã có sản phẩm trùng 4 thuộc tính thì tăng tồn thêm 1, nếu chưa có thì tạo sản phẩm mới ở trạng thái ẩn, chờ admin đặt giá rồi đăng bán (PB17). | Admin | Bắt buộc (GĐ4) | Chỉ ghi được kết quả giao dịch cho yêu cầu đã duyệt. Giao dịch (Đã mua), nhập kho và đăng bán là ba bước riêng. Mỗi yêu cầu chỉ nhập kho **một lần**: bấm lại không tăng tồn thêm. Sản phẩm tạo ra không phải nhập lại thông tin thẻ. |
| F22 | Màn hình cấu hình giá | Sửa tỉ giá, các hệ số và ngưỡng trên giao diện. Khi chưa có F22, tham số được sửa trực tiếp trong `js/config.js`. | Admin | Nên có | Đổi tham số thì giá ở F12 đổi theo. Yêu cầu bán đã gửi không bị ảnh hưởng. |

### 4.7 Chính sách thu mua: giao dịch tại cửa hàng (PB18)

- **Chỉ giao dịch trực tiếp tại cửa hàng.** Khách mang thẻ đến và đọc mã yêu cầu. Chủ shop kiểm định trước mặt khách, nên kiểm tra thẻ thật/giả tốt hơn, và cả hai bên cùng thấy tình trạng thẻ.
- Trước khi khách đến, chủ shop đã xem ảnh và thông tin trong yêu cầu để **kiểm tra sơ bộ**. Yêu cầu có dấu hiệu bất thường thì bị từ chối ngay, khách không phải mất công đi.
- **Giá:** tình trạng đúng như khách khai thì mua đúng giá dự kiến đã lưu. Tình trạng thấp hơn thì shop báo giá mới tại quầy; khách đồng ý thì bán, không đồng ý thì mang thẻ về. Phát hiện thẻ giả thì từ chối, khách mang thẻ về.
- **Trả tiền tại quầy** bằng tiền mặt hoặc chuyển khoản ngay tại chỗ. Hệ thống không thu và không lưu thông tin tài khoản ngân hàng của khách.
- Khách phải mang thẻ đến trong **7 ngày** kể từ khi yêu cầu được duyệt. Quá hạn thì yêu cầu chuyển sang "Hết hạn", khách gửi yêu cầu mới (giá tính lại theo thời điểm đó).
- Lý do từ chối có sẵn: dưới ngưỡng giá, shop đã đủ hàng, nghi thẻ giả, ảnh không rõ, hư hỏng.
- Kiểm định có thể quay video làm bằng chứng. Video được lưu **ngoài hệ thống**; hệ thống chỉ ghi kết quả kiểm định.

### 4.8 Tài khoản (v2.0, GĐ4)

Xác thực email bằng **OTP 6 số** thay cho link. Lý do: link sẽ trỏ về `localhost`, bấm từ mail trên điện thoại không mở được web chạy trên máy tính, còn OTP nhập ở đâu cũng được. Cả hai cách đều cần gửi mail:
- Khi lập trình, server in OTP ra cửa sổ dòng lệnh.
- Khi demo, gửi qua Gmail SMTP + App Password (Nodemailer). Mật khẩu để trong `.env`.

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F30 | Đăng ký | Email, tên hiển thị, mật khẩu | Khách | Bắt buộc (GĐ4) | Email và tên hiển thị không trùng. Tên 3–20 ký tự, mật khẩu ít nhất 8 ký tự. Tài khoản mới ở trạng thái **Chưa xác thực**. |
| F31 | Xác thực email bằng OTP | Gửi mã 6 số về email | Khách | Bắt buộc (GĐ4) | Mã hết hạn sau 10 phút, sai tối đa 5 lần, gửi lại sau 60 giây. Server chỉ lưu hash của mã. Đúng mã thì kích hoạt và đăng nhập luôn. |
| F32 | Đăng nhập / đăng xuất | Email + mật khẩu, phiên bằng cookie | Thành viên | Bắt buộc (GĐ4) | Chưa xác thực thì chuyển sang nhập OTP. Sai 5 lần thì khóa 15 phút. Cookie `httpOnly`, `SameSite=Lax`. |
| F33 | Quên mật khẩu | OTP về email rồi đặt mật khẩu mới | Thành viên | Bắt buộc (GĐ4) | Thông báo giống nhau dù email có tồn tại hay không. Đổi mật khẩu xong thì mọi phiên cũ bị đăng xuất. |

### 4.9 Diễn đàn (v2.0, GĐ4)

**Cấu trúc:** Khu vực → Forum **Fxx** → Topic (có tag tiền tố) → Bài trả lời.

**Forum ban đầu:**

| Mã | Tên | Dành cho | Tag tiền tố |
|---|---|---|---|
| F100 | Thông báo JadeCard | Tin hàng về, sự kiện, quy định. Chỉ admin đăng topic | Thông báo, Sự kiện |
| F368 | Thợ săn tiền thưởng | Bóc thẻ, định giá thẻ, rao vặt | Bóc thẻ, Định giá, Mua bán |
| F666 | Thần bài | Luật chơi, deck, sức mạnh của thẻ | Hỏi đáp, Deck, Luật chơi, Meta |

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F34 | Trang chủ diễn đàn | Danh sách forum, số topic, số bài, topic mới nhất | Mọi người | Bắt buộc (GĐ4) | Khách chưa đăng nhập vẫn đọc được. |
| F35 | Danh sách topic | Topic ghim lên đầu, còn lại sắp theo bài mới nhất | Mọi người | Bắt buộc (GĐ4) | 20 topic mỗi trang. Lọc được theo tag tiền tố. |
| F36 | Xem topic | Các bài trả lời kèm khung tác giả | Mọi người | Bắt buộc (GĐ4) | 20 bài mỗi trang. Khung tác giả có tên, **tag chức vụ**, số bài, số like nhận được. |
| F37 | Tạo topic | Tiêu đề, tag tiền tố, nội dung, tối đa 4 ảnh | Thành viên đã xác thực | Bắt buộc (GĐ4) | Ảnh JPG/PNG/WebP ≤ 5MB. Nội dung được lọc HTML (chống XSS). F100 chỉ admin đăng topic. |
| F38 | Trả lời, trích dẫn | Trả lời cuối topic, trích dẫn bài khác | Thành viên đã xác thực | Bắt buộc (GĐ4) | Topic bị khóa thì không trả lời được. Chỉ sửa được bài của mình. |
| F39 | Like | Like / bỏ like một bài | Thành viên đã xác thực | Bắt buộc (GĐ4) | Mỗi người 1 like mỗi bài. Không tự like. Bài bị ẩn thì like của bài không còn được tính. |
| F40 | Chức vụ | Tag chức vụ cạnh tên ở mọi nơi | Hệ thống | Bắt buộc (GĐ4) | Tính theo **tổng like nhận được**, dùng chung mọi forum (bảng dưới). Admin, Mod có thêm tag nhân viên. |
| F41 | Hồ sơ thành viên | Mở khi bấm avatar hoặc tên ở bất kỳ đâu. Chức vụ, tiến độ tới chức vụ sau, số bài, like. Các tab: **Bộ sưu tập** (F27), Tin ký gửi đang bán, Topic gần đây | Mọi người | Bắt buộc (GĐ4) | Không hiện email. Tab Bộ sưu tập tuân theo cài đặt riêng tư ở F27. |
| F42 | Kiểm duyệt | Báo cáo bài; ghim, khóa, ẩn; khóa tài khoản | Thành viên / Mod / Admin | Bắt buộc (GĐ4) | Mọi quyền kiểm tra ở server. Có trang **Quy định diễn đàn**. |

**Bổ sung ở v2.1 (theo giao diện Stitch):**

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F52 | Lượt xem topic | Đếm và hiện số lượt xem ở danh sách topic | Hệ thống | Nên có (GĐ4) | Mỗi người (hoặc mỗi trình duyệt với khách) được tính tối đa 1 lượt xem cho một topic trong 1 giờ. Tác giả xem bài của mình không được tính. |
| F53 | Thành viên nổi bật tuần | Khối trên trang chủ diễn đàn: 5 người nhận nhiều like nhất trong 7 ngày gần nhất | Mọi người | Nên có (GĐ4) | Chỉ tính like trên bài chưa bị ẩn. Hiện tên, tag chức vụ, số like trong tuần. |
| F54 | Thẻ xem nhanh khi rê avatar | Rê chuột vào avatar hoặc tên: hiện tên, chức vụ, số thẻ trong bộ sưu tập, nút "Xem bộ sưu tập" | Mọi người | Nên có (GĐ4) | Trên điện thoại không có rê chuột: bấm avatar mở thẳng hồ sơ. Bộ sưu tập riêng tư thì không hiện số thẻ. |

**Bảng chức vụ (F40):**

| Chức vụ | Chiếu mới | Học việc | Thợ săn sơ cấp | Thợ săn chuyên nghiệp | Thợ săn lão làng | Master | Grand Master |
|---|---|---|---|---|---|---|---|
| Like nhận được từ | 0 | 10 | 50 | 150 | 400 | 1.000 | 2.500 |

Các ngưỡng là giả định ban đầu, chỉnh lại sau khi có dữ liệu thật.

### 4.10 Ký gửi tại cửa hàng (v2.0, GĐ4)

**Mô hình:** thành viên đăng tin → **mang thẻ đến cửa hàng trong 7 ngày** để kiểm định → shop giữ thẻ, niêm yết → người mua mua như sản phẩm của shop (giỏ hàng, đơn hàng F04, F05) → bán xong, shop trả tiền cho người bán **tại quầy** sau khi trừ hoa hồng.
- Không giữ tiền online, không gửi thẻ qua bưu điện, không lưu số tài khoản ngân hàng (giống chính sách thu mua ở mục 4.7).
- **Hoa hồng:** 8% giá bán, tối thiểu 20.000 ₫. Đây là giả định để mô phỏng, cấu hình được.
- **Thời hạn niêm yết:** 60 ngày. Hết hạn thì người bán đến lấy lại thẻ.

**Trạng thái tin:** Chờ kiểm định → Đang bán → Đã bán → Đã tất toán. Nhánh phụ:
- Từ chối (không đạt hoặc thẻ giả).
- Hết hạn kiểm định (quá 7 ngày chưa mang thẻ đến).
- Đã rút (người bán rút tin, nhận lại thẻ).
- Hết hạn niêm yết (quá 60 ngày chưa bán, trả lại thẻ).

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F43 | Đăng tin ký gửi | Chọn thẻ và biến thể, tình trạng tự đánh giá, 2–6 ảnh, giá mong muốn | Thành viên đã xác thực | Bắt buộc (GĐ4) | Hiện trước hoa hồng và số tiền dự kiến nhận. Tin mới ở trạng thái "Chờ kiểm định", **chưa hiện công khai**. Mỗi tin 1 thẻ. |
| F44 | Kiểm định tại quầy | Ghi thật/giả, tình trạng thực tế, giá niêm yết đã thống nhất, ảnh chụp tại shop | Admin | Bắt buộc (GĐ4) | Đạt thì chuyển "Đang bán" và có huy hiệu **JadeCard đã xác thực**. Không đạt thì ghi lý do. |
| F45 | Trang Ký gửi | Giao diện giống trang Sản phẩm, mỗi thẻ có thêm khung người bán (tên, tag chức vụ) | Mọi người | Bắt buộc (GĐ4) | Chỉ hiện tin "Đang bán". Lọc theo set, tình trạng, khoảng giá. |
| F46 | Chi tiết tin ký gửi | Ảnh người bán và ảnh shop chụp, kết quả kiểm định, thông tin người bán | Mọi người | Bắt buộc (GĐ4) | Có link sang topic F368 nếu tin đã được gắn. |
| F47 | Mua tin ký gửi | Dùng chung giỏ hàng và đơn hàng của shop | Khách hàng | Bắt buộc (GĐ4) | Số lượng luôn là 1. Có đơn thì tin bị giữ, đơn xác nhận thì chuyển "Đã bán". |
| F48 | Tin ký gửi của tôi | Theo dõi trạng thái, rút tin, xem số tiền sẽ nhận | Người bán | Bắt buộc (GĐ4) | Chỉ thấy tin của chính mình. |
| F49 | Tất toán | Ghi "đã trả tiền tại quầy" và số tiền sau hoa hồng | Admin | Bắt buộc (GĐ4) | Chỉ tất toán được tin "Đã bán". Không tất toán hai lần. |
| F50 | Gắn tin vào topic Mua bán (F368) | Khi tạo topic tag **Mua bán**, chọn một tin ký gửi của chính mình | Người bán | Bắt buộc (GĐ4) | Topic hiện **thẻ thông tin sản phẩm** ở đầu mọi trang, thay cho link. Thẻ luôn theo trạng thái mới nhất; tin đã bán thì hiện "ĐÃ BÁN". Mỗi topic gắn tối đa 1 tin và mỗi tin gắn tối đa 1 topic. Không gắn được tin của người khác. |
| F51 | Link tin ký gửi tự hiện thành thẻ | Dán link một tin ký gửi vào bài viết bất kỳ | Thành viên | Nên có (GĐ4) | Link được hiển thị thành thẻ sản phẩm thu nhỏ. |

**Trả giá và đánh giá người bán (v2.1):**

| Mã | Chức năng | Mô tả | Người dùng | Ưu tiên | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| F55 | Trả giá tin ký gửi | Người mua đề nghị một giá thấp hơn giá niêm yết. Người bán chấp nhận hoặc từ chối | Thành viên đã xác thực / Người bán | Nên có (GĐ4) | Giá đề nghị từ **50% đến dưới 100%** giá niêm yết. Mỗi người mua có tối đa 1 đề nghị đang chờ cho một tin. Đề nghị hết hạn sau **48 giờ**. Người bán chấp nhận → tin chuyển **"Đang giữ cho người trả giá"** trong **24 giờ**, chỉ người đó mua được với giá đã chốt; các đề nghị khác tự bị từ chối. Quá 24 giờ chưa đặt hàng → tin trở lại "Đang bán". Hoa hồng tính trên **giá bán cuối cùng**. Không tự trả giá tin của mình. |
| F56 | Đánh giá người bán | Sau khi đơn có tin ký gửi **hoàn thành**, người mua chấm 1–5 sao và viết nhận xét ngắn (tối đa 500 ký tự) | Người mua | Nên có (GĐ4) | Mỗi dòng đơn chỉ đánh giá một lần. Hiện điểm trung bình và số đánh giá trên hồ sơ người bán và trên tin ký gửi. Nhận xét được lọc HTML; Mod/Admin ẩn được nhận xét vi phạm. **Phạm vi đánh giá:** vì JadeCard giữ thẻ và giao hàng, sao chỉ đánh giá **người bán**: ảnh và mô tả có đúng thẻ không, phản hồi trả giá nhanh không. Lỗi giao hàng không thuộc phần này. |

**Quy định diễn đàn:** mọi mua bán giữa thành viên phải qua Ký gửi. Bài rao bán bên ngoài ký gửi sẽ bị ẩn.

### 4.11 Nâng cao (ngoài MVP)

| Mã | Chức năng | Lý do để sau |
|---|---|---|
| F15 | % hoàn thành set | Phải chốt "tổng số thẻ" là số in trên thẻ hay toàn bộ set, vì nguồn dữ liệu có hai con số khác nhau (vd. 189 và 201) (PB21). Không ảnh hưởng doanh thu. |
| F23 | Thanh toán trực tuyến | Cần tích hợp cổng thanh toán, tài khoản doanh nghiệp, kiểm thử bảo mật |
| F24 | Bán và Check thẻ One Piece / Yu-Gi-Oh! | Mỗi dòng thẻ có bố cục khác nhau và cần thêm nguồn giá |
| F26 | Lịch sử giá và thông báo khi giá thay đổi | Cần lưu giá theo thời gian ở server |
| F28 | Bán nhiều thẻ trong một yêu cầu | Phải kiểm định, báo giá và trả lại riêng cho từng dòng thẻ (PB15) |
| F29 | Shop báo giá thủ công cho thẻ chưa có giá tham khảo | Thêm một nhánh quy trình (PB09) |

## 5. Yêu cầu phi chức năng

- **Responsive:** hiển thị tốt trên máy tính, máy tính bảng và điện thoại (kiểm tra ở các độ rộng 375, 768 và 1280px). Riêng Check thẻ ưu tiên điện thoại.
- **Kiểm tra dữ liệu đầu vào:** SĐT, email, số lượng, kích thước và định dạng ảnh (JPG/PNG, ≤ 5MB).
- **Phân quyền (PB23):**
  - Ở GĐ3, việc chặn trang admin bằng JavaScript **chỉ là mô phỏng** và được ghi rõ như vậy.
  - Từ GĐ4, **server kiểm tra quyền ở mọi yêu cầu**.
  - Ảnh và SĐT trong yêu cầu bán chỉ chủ yêu cầu và admin được xem.
- **Bảo mật tài khoản và nội dung (v2.0):**
  - Mật khẩu mã hóa bằng bcrypt; OTP chỉ lưu hash.
  - Giới hạn số lần thử khi đăng nhập, gửi OTP và nhập OTP.
  - Lọc HTML trong mọi nội dung người dùng nhập (chống XSS).
  - Mật khẩu Gmail và khóa phiên để trong `.env`, không đưa lên GitHub.
- **Minh bạch giá:** mọi giá lấy từ nguồn bên ngoài đều ghi tên nguồn, loại tiền gốc, thời điểm cập nhật và nhãn "tham khảo". Dữ liệu mẫu có nhãn "Dữ liệu mô phỏng".
- **Hiệu năng (PB11):**
  - Có trạng thái "Đang đọc thẻ..." khi OCR đang chạy.
  - Thời gian OCR được đo riêng cho **lần đầu** (phải tải dữ liệu ngôn ngữ) và **các lần sau**, trên một máy cụ thể được ghi lại trong tech-spike.
  - Mục tiêu tạm thời: từ lần thứ hai trở đi ≤ 10 giây. Mốc chính thức chốt sau T3.6.
- **Quyền riêng tư:**
  - Ảnh thẻ được xử lý ngay trên trình duyệt; chỉ tải lên server khi người dùng gửi yêu cầu bán.
  - Không thu thập thông tin tài khoản ngân hàng của khách bán thẻ, vì việc trả tiền diễn ra tại quầy.
- **Mã nguồn:** tổ chức rõ ràng (tách HTML, CSS, JS, dữ liệu). Phần gọi nguồn giá gom vào một chỗ (`js/services/price-service.js`) để dễ đổi nguồn. Không công khai API key, mật khẩu hay dữ liệu cá nhân thật.

## 6. Giới hạn và giả định

- **Nhân lực:** 1 người. Phạm vi giữ ở mức MVP, ưu tiên làm hoàn chỉnh từng luồng hơn là làm nhiều tính năng. **Nếu trễ tiến độ, cắt theo thứ tự:** F22 → F54 → F52 → F53 → F56 → F55 → F51 → F14 → bớt bộ lọc ở F03. Không cắt luồng mua hàng, luồng thu mua và vòng ký gửi.
- **Thứ tự triển khai theo lộ trình môn học:** luồng mua hàng (GĐ3) → Check thẻ (GĐ3) → Bộ sưu tập (GĐ3, localStorage) → thu mua và quản trị (GĐ4, cần backend). Phản biện PB04 đề nghị làm thu mua trước bộ sưu tập. Đề nghị này **không được áp dụng** vì thu mua cần backend để admin thấy yêu cầu của khách, mà backend chỉ có ở GĐ4. Tuy vậy, thu mua vẫn là chức năng bắt buộc.
- **Công nghệ:** HTML, CSS (viết bằng SCSS, không dùng framework CSS) và JavaScript thuần theo lộ trình môn học; three.js chỉ dùng cho thẻ 3D ở trang chủ.
- **Backend (chốt 09/11/2026):** Node.js + Express + SQLite, gửi mail bằng Nodemailer. Nếu đề buổi backend yêu cầu công nghệ khác, ghi lại độ lệch và cách xử lý.
- **Nguồn giá (PB06):**
  - Nguồn chính là **TCGdex**. Đã kiểm tra ngày 07/11/2026: miễn phí, không cần API key, cho phép trình duyệt gọi trực tiếp (CORS), có giá TCGplayer theo từng biến thể.
  - **Không dùng pokemontcg.io**: dịch vụ đã ngừng phát triển, không nhận đăng ký mới, khóa API chỉ hoạt động đến 01/03/2027.
  - Rủi ro còn lại: một số thẻ không có giá, nguồn có thể thay đổi. Phương án dự phòng là file giá mẫu (JSON) có nhãn "Dữ liệu mô phỏng".
- **Độ chính xác OCR:** phụ thuộc chất lượng ảnh. Hệ thống luôn có bước người dùng xác nhận (F09) và tìm thủ công (F10). Chỉ cam kết hỗ trợ thẻ tiếng Anh.
- **Giá quốc tế ≠ giá Việt Nam:** giá chỉ mang tính tham khảo. Các hệ số ở mục 4.5 là giả định, cần đối chiếu với giá thu mua thực tế trong cộng đồng.
- **Nhu cầu khách hàng:** hiện dựa trên quan sát đối thủ và hiểu biết cá nhân về cộng đồng. Đang kiểm tra bằng khảo sát nhỏ khoảng 5 người chơi.
- **Dữ liệu:** dùng dữ liệu mẫu, ảnh thẻ lấy từ nguồn dữ liệu có ghi nguồn. Không dùng dữ liệu cá nhân thật.

## 7. Nguyên tắc kiểm thử (PB24)

Mỗi luồng chính (mua hàng, Check thẻ, yêu cầu bán, xử lý thu mua, **đăng ký và OTP, viết bài và like, ký gửi**) có đủ **4 loại ca kiểm thử**:
1. **Thành công:** thao tác đúng thì cho kết quả đúng.
2. **Dữ liệu không hợp lệ:** thiếu trường, sai định dạng, ảnh quá lớn, số lượng vượt tồn.
3. **Lỗi phụ thuộc:** nguồn giá không phản hồi, thẻ không có giá, OCR không đọc được.
4. **Thao tác lặp hoặc sai thứ tự:** bấm gửi hai lần, đổi trạng thái sai thứ tự, hủy đơn hai lần, nhập kho hai lần, ghi kết quả giao dịch cho yêu cầu chưa duyệt hoặc đã hết hạn.

Từ GĐ4 có thêm ca **truy cập trái phép**: tài khoản A mở đơn, ảnh hoặc yêu cầu bán của B; A sửa bài hoặc gắn tin ký gửi của B; thành viên gọi chức năng của Mod hoặc admin; tự like bài mình. Giao diện được cập nhật khi **tải lại trang**; MVP không yêu cầu tự cập nhật theo thời gian thực. Bảng ca kiểm thử chi tiết được lập ở Giai đoạn 5.

## Lịch sử phiên bản

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 0.1 | 07/11/2026 | Bản nháp từ khảo sát và phân tích của AI thứ nhất (22 chức năng, 20 bắt buộc) |
| 2.1 | 09/11/2026 | Sau khi duyệt giao diện Stitch: thêm F52 Lượt xem topic, F53 Thành viên nổi bật tuần, F54 Thẻ xem nhanh khi rê avatar, F55 Trả giá tin ký gửi, F56 Đánh giá người bán (đều là Nên có). Không làm: nhắn tin riêng, theo dõi / thông báo, đăng nhập mạng xã hội, tự tạo topic khi đăng ký gửi, đăng nhập bằng tên hiển thị. |
| 2.0 | 09/11/2026 | Mở rộng thành cửa hàng + cộng đồng: Tài khoản với OTP (F30–F33), Diễn đàn Fxx và chức vụ (F34–F42), Ký gửi tại cửa hàng (F43–F49, đưa F25 vào phạm vi), gắn tin ký gửi vào F368 (F50, F51), bộ sưu tập theo tài khoản và xem được trên hồ sơ thành viên (đưa F27 vào phạm vi, sửa PB22). Thêm vai trò Mod. Chốt backend Node.js + Express + SQLite. Vẫn không làm P2P tự giao dịch, escrow online. |
| 1.0 | 07/11/2026 | Áp dụng phản biện của AI thứ hai theo bảng quyết định. Thu gọn phạm vi: chỉ bán Pokémon, 1 thẻ mỗi yêu cầu bán, F15 chuyển sang Nâng cao, F16 gộp vào F17. Đổi nguồn giá sang TCGdex. Thu mua chỉ giao dịch tại cửa hàng (không gửi bưu điện, không lưu thông tin nhận tiền). Làm rõ biến thể thẻ, quy tắc tồn kho, nhập kho và nguyên tắc kiểm thử. |
