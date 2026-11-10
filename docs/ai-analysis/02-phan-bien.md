# AI thứ hai: Phản biện yêu cầu

- **Công cụ:** Astra 6
- **Ngày:** 07/11/2026
- **Prompt:** Prompt 2 của đề bài, đã điền thông tin dự án. Nguyên văn xem trong [02-prompt-phan-bien.md](02-prompt-phan-bien.md).
- **Đầu vào:** mô tả đề tài, kết quả khảo sát 3 website, bản phân tích của AI thứ nhất ([01-phan-tich-yeu-cau.md](01-phan-tich-yeu-cau.md)) và REQUIREMENTS.md v0.1. Theo Astra, công cụ cũng đã đọc quy trình nghiệp vụ, vai trò người dùng và kế hoạch dự án, và **không sửa file nào**.
- **Kết quả:** 24 ý kiến phản biện (PB01–PB24), chia thành 4 nhóm. Toàn văn ở [mục 2](#2-toàn-văn-phản-biện-của-astra-6).

## 1. Kiểm chứng các thông tin thực tế mà Astra 6 đưa ra

Không mặc định rằng AI thứ hai đúng. Các khẳng định có nguồn trích dẫn được mở lại và đối chiếu ngày 07/11/2026:

| Khẳng định của Astra 6 | Kết quả đối chiếu | Nguồn |
|---|---|---|
| Pokémon TCG API (pokemontcg.io) đã ngừng phát triển (deprecated), không nhận đăng ký mới, khóa API hiện có chạy đến 01/03/2027 | **Đúng.** Trang tài liệu ghi: *"The Pokémon TCG API is deprecated. New account registrations are no longer available. Existing API keys will continue to function through March 1, 2027."* Trang này đề nghị chuyển sang Scrydex. | [docs.pokemontcg.io](https://docs.pokemontcg.io/api-reference/cards/card-object/) |
| Giá TCGplayer tách theo biến thể và tính bằng USD; giá Cardmarket tính bằng EUR | **Đúng.** TCGplayer có các biến thể `normal`, `holofoil`, `reverseHolofoil`... (*"ALL PRICES ARE IN US DOLLARS"*). Cardmarket ghi *"ALL PRICES ARE IN EUROS"*, nhưng không tách biến thể theo cùng cách đó: giá reverse holo nằm trong các trường riêng. | như trên |
| Set có hai con số tổng là `printedTotal` và `total` | **Đúng.** `printedTotal` là số in trên thẻ và không gồm secret rare. `total` là toàn bộ set, gồm cả secret rare. Ví dụ: set swsh1 có printedTotal 202, total 216. | [set object](https://docs.pokemontcg.io/api-reference/sets/set-object/) |
| Tesseract.js: phần khởi tạo có thể chiếm phần lớn thời gian chạy; lần chạy đầu khác các lần sau | **Đúng một phần.** Tài liệu chỉ nói *"trong một số ứng dụng"* phần khởi tạo (`createWorker`) có thể chiếm phần lớn thời gian. Việc lần đầu chậm hơn vì phải tải dữ liệu ngôn ngữ thì **đúng**. Tài liệu khuyên khởi tạo worker trước và dùng lại. | [performance.md](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md) |

**Bổ sung từ kiểm chứng (Astra 6 không nêu): TCGdex là nguồn thay thế dùng được.**
- Theo tài liệu: TCGdex miễn phí, **không cần API key**, và mỗi thẻ có sẵn trường `pricing`. FAQ của TCGdex thừa nhận một số thẻ chưa có giá. Nguồn: [tcgdex.dev/markets-prices](https://tcgdex.dev/markets-prices), [tcgdex.dev/faq](https://tcgdex.dev/faq).
- Tài liệu không nói gì về CORS, nên đã gọi thử `GET https://api.tcgdex.net/v2/en/cards/swsh3-136` ngày 07/11/2026. Kết quả:
  - Máy chủ trả về `Access-Control-Allow-Origin: *`, nghĩa là **trình duyệt được phép gọi trực tiếp**, không cần backend trung gian.
  - Giá TCGplayer tính bằng `USD` và **tách theo biến thể** (`normal`, `reverse-holofoil`), có thời điểm cập nhật trong ngày. Giá Cardmarket tính bằng `EUR`.
  - Thẻ có trường `variants` cho biết thẻ có những biến thể nào (normal, reverse, holo...).
  - Set có hai con số tổng `cardCount.official` (189) và `cardCount.total` (201). Đây đúng là vấn đề PB21 nêu.
- Còn lại cho T3.5: thử bằng trang HTML thật trên trình duyệt, và đo tỉ lệ thẻ không có giá.

## 2. Toàn văn phản biện của Astra 6

> Phần dưới đây được giữ nguyên văn như câu trả lời của công cụ, chỉ định dạng lại tiêu đề.

**Nhận định chính: JadeCard có ý tưởng phù hợp cho đồ án, nhưng bản yêu cầu hiện tại chưa nên chốt để triển khai toàn bộ.** AI 1 mô tả khá đầy đủ tính năng, nhưng đánh giá thấp khối lượng thực hiện, biến một số giả định thành cam kết và bỏ sót các tình huống nghiệp vụ quan trọng.

Phản biện dưới đây đánh giá tài liệu yêu cầu; chưa phải kết luận về lỗi trong mã nguồn.

### 2.1 Vấn đề kinh doanh và phạm vi

| Mã/Nội dung | AI thứ nhất đề xuất | Ý kiến phản biện | Đề xuất điều chỉnh |
|---|---|---|---|
| PB01 — Cơ sở kinh doanh | Ba website được khảo sát thiếu thẻ lẻ Pokémon và công cụ định giá, từ đó xác định khoảng trống thị trường. | **Chưa thấy trên ba website không đủ chứng minh thị trường thiếu dịch vụ.** Một danh mục trống cũng chưa chứng minh shop không thu mua hoặc không bán qua kênh khác. Khảo sát đối thủ chưa xác nhận nhu cầu của khách hàng. | Diễn đạt là "cơ hội quan sát được trong phạm vi khảo sát". Phỏng vấn một nhóm nhỏ người sưu tầm để kiểm tra họ khó tìm giá, khó bán hay khó mua thẻ nào. |
| PB02 — Khả năng thực hiện | Một người mới học thực hiện F01–F22, chỉ F15 và F22 là "Nên có". | **20/22 chức năng bắt buộc khiến mức ưu tiên gần như mất tác dụng.** Dự án đồng thời chứa cửa hàng, nhận diện thẻ, định giá, bộ sưu tập và quy trình thu mua. Chia việc thành 1–3 giờ không làm giảm tổng khối lượng. | Giữ luồng mua hàng và một luồng khác biệt hoàn chỉnh: tra thẻ → giá tham khảo → gửi yêu cầu bán → admin xử lý. Đưa bộ sưu tập, bán nhiều thẻ và cấu hình giá bằng giao diện xuống mức làm sau. |
| PB03 — Phạm vi chưa nhất quán | Phân tích nói chỉ Pokémon, Check thẻ chỉ tiếng Anh; yêu cầu lại cho phép shop bán dòng khác. F15 vừa nằm trong MVP vừa là tùy chọn. | Người triển khai không biết giới hạn nào là chính thức. Điều này tác động trực tiếp đến dữ liệu, tìm kiếm và kiểm thử. | Chốt MVP chỉ bán Pokémon; Check thẻ tiếng Anh trong tập dữ liệu hỗ trợ xác định. Ghi rõ F15 không phải điều kiện hoàn thành MVP. |
| PB04 — Thứ tự triển khai | Làm mua hàng → Check thẻ → Đang có → thu mua → Đang săn. | Bộ sưu tập được ưu tiên trước khi hoàn thành luồng thu mua, trong khi thu mua mới trực tiếp giải quyết vấn đề khó bán thẻ. Người dùng đã có thể bán ngay từ kết quả Check thẻ. | Hoàn thành thu mua trước bộ sưu tập. Bộ sưu tập là phần mở rộng có ích, nhưng chưa đủ cơ sở để bắt buộc. |
| PB05 — Trùng lặp | F03 tìm sản phẩm; F10 tìm thẻ; F16 bán từ bộ sưu tập; F17 gửi yêu cầu bán. | Không nên gộp tất cả thành một chức năng: **kho sản phẩm đang bán khác danh mục thẻ có thể tra cứu**. Tuy nhiên, F16 chỉ là một lối vào F17, dễ bị triển khai thành hai quy trình riêng. | Giữ rõ F03 và F10. Dùng chung một biểu mẫu yêu cầu bán cho kết quả Check thẻ và bộ sưu tập; chỉ khác dữ liệu điền sẵn. |

### 2.2 Check thẻ và định giá: phần cần kiểm chứng sớm nhất

Có một phát hiện thực tế đáng chú ý: **tài liệu chính thức của Pokémon TCG API hiện thông báo dịch vụ đã deprecated, không nhận đăng ký mới; khóa hiện có tiếp tục hoạt động đến ngày 01/03/2027.** Vì vậy, phương án `pokemontcg.io` không còn có thể được xem như một lựa chọn ổn định đang chờ kiểm tra CORS. [Thông báo của Pokémon TCG API](https://docs.pokemontcg.io/api-reference/cards/card-object/)

| Mã/Nội dung | AI thứ nhất đề xuất | Ý kiến phản biện | Đề xuất điều chỉnh |
|---|---|---|---|
| PB06 — Nguồn giá | Chọn Pokémon TCG API hoặc TCGdex; kiểm tra ở giai đoạn 3. | Nguồn giá là đầu vào của F11, F12, bộ sưu tập và thu mua. Chưa xác minh được nguồn nhưng đã cam kết nhiều chức năng phụ thuộc vào nó. Thông báo ngừng dịch vụ nêu trên làm rủi ro này cụ thể hơn. | Thử nghiệm nguồn dữ liệu trước khi chốt phạm vi: lấy được đúng thẻ, đúng biến thể, trường giá, tiền tệ và ngày cập nhật. Chọn nguồn sau khi có kết quả; không mặc định nguồn thay thế tương đương. |
| PB07 — Nhận diện đúng thẻ | OCR đọc tên Pokémon và số thẻ, khách chọn một trong tối đa năm kết quả. | Đọc đúng tên và số chưa bảo đảm chọn đúng **phiên bản có giá tương ứng**. Dữ liệu giá có thể tách normal, holofoil và reverse holofoil. Ngoài ra "tên Pokémon" không bao quát thẻ Trainer/Energy. | Dùng "tên thẻ"; lưu ID thẻ, set, ngôn ngữ và biến thể. Yêu cầu xác nhận biến thể trước khi báo giá. Có lựa chọn "Không có thẻ phù hợp" và cách thu hẹp tìm kiếm nếu năm kết quả đầu không đúng. |
| PB08 — Ý nghĩa giá VND | Giá market USD × tỷ giá = "giá thị trường VND". | Phép đổi tiền không chứng minh đây là giá giao dịch ở Việt Nam. Việc gọi là "giá trị thẻ" còn dễ khiến khách hiểu rằng shop hoặc thị trường sẽ mua đúng mức đó. | Hiển thị "Giá tham khảo quốc tế quy đổi VND", tách biệt với "Giá thu mua dự kiến" và "Giá bán tại JadeCard". Gắn đúng tiền tệ của nguồn, không mặc định mọi nguồn đều USD. |
| PB09 — Thiếu giá và dữ liệu mẫu | API lỗi thì dùng JSON dự phòng. | JSON giúp demo được nhưng **không đáp ứng cùng lời hứa về giá thị trường cập nhật**. Chưa có quy tắc khi tìm được thẻ nhưng thiếu giá, sai biến thể hoặc giá quá cũ. | Dữ liệu mẫu phải mang nhãn mô phỏng. Thiếu giá thì hiện "Chưa có giá tham khảo", không đổi thành 0 hoặc lấy giá biến thể khác. Cho phép gửi yêu cầu để shop báo giá thủ công nếu chọn hỗ trợ trường hợp này. |
| PB10 — Công thức thu mua | Thu mua 60%, nhân hệ số tình trạng; ngưỡng 100.000đ để "chỉ thu thẻ hiếm". | Công thức minh bạch nhưng chưa chứng minh phù hợp kinh doanh. **Ngưỡng giá và độ hiếm là hai tiêu chí khác nhau.** Chưa rõ shop có mua mọi thẻ vượt ngưỡng hay còn xét nhu cầu và tồn kho. | Giữ hệ số dưới dạng giả định mô phỏng. Đổi mô tả thành "đạt ngưỡng giá thu mua"; công khai việc shop còn có thể từ chối vì tồn kho hoặc nhu cầu. |
| PB11 — Hiệu quả OCR | Đọc đúng 7/10 ảnh rõ, thời gian ≤10 giây trên điện thoại tầm trung. | "Đọc đúng" chưa được định nghĩa: đúng tên, đúng số hay thẻ đúng có trong kết quả? Mười ảnh rõ chỉ đủ thử nghiệm ban đầu. Mốc 10 giây chưa quy định thiết bị, mạng và lần tải đầu. | Tách tiêu chí đọc chữ và tìm đúng thẻ. Dùng bộ ảnh kiểm thử cố định có ảnh khó và ảnh ngoài phạm vi. Đo lần đầu và lần sau riêng; chỉ chốt mốc thời gian sau thử nghiệm. |

Cơ sở kỹ thuật cho PB07–PB08: tài liệu API phân biệt giá theo biến thể; giá TCGplayer dùng USD, còn Cardmarket dùng EUR. [Cấu trúc dữ liệu thẻ và giá](https://docs.pokemontcg.io/api-reference/cards/card-object/)

Với PB11, chính tài liệu Tesseract.js lưu ý thời gian khởi tạo có thể chiếm phần lớn thời gian chạy và lần đầu khác các lần sau do dữ liệu ngôn ngữ được lưu đệm. [Hướng dẫn hiệu năng Tesseract.js](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md)

### 2.3 Quy trình mua hàng và thu mua còn thiếu các quy tắc quyết định

| Mã/Nội dung | AI thứ nhất đề xuất | Ý kiến phản biện | Đề xuất điều chỉnh |
|---|---|---|---|
| PB12 — Tồn kho, F04/F19 | Giỏ không vượt tồn; trừ kho khi admin xác nhận. | Hai khách vẫn có thể đặt cùng bản thẻ cuối cùng. Kiểm tra ở giỏ không giải quyết việc tồn kho thay đổi sau đó. Chưa có quy tắc hoàn kho khi hủy. | Với MVP, cho phép đơn chờ xác nhận chưa giữ hàng nhưng phải thông báo rõ. Khi xác nhận, kiểm tra và trừ kho trong cùng giao dịch; thiếu hàng thì không xác nhận. Hủy đơn đã trừ kho phải hoàn đúng một lần. |
| PB13 — Đặt hàng, F05/F20 | COD/chuyển khoản; quy trình có nhận tại cửa hàng và phí ship. | F05 chưa bao quát những lựa chọn đã xuất hiện trong quy trình. Trạng thái giao hàng cũng chưa thể hiện trạng thái thanh toán; đơn nhận tại shop không phù hợp với "Đang giao". | Chốt cách nhận hàng, phí vận chuyển và tổng tiền trước khi đặt. Theo dõi riêng thanh toán chưa/đã nhận. Có trạng thái phù hợp cho nhận tại shop và quy tắc hủy đơn đã thanh toán. |
| PB14 — Khách chấp nhận giá mới, F18 | Khách xem giá chốt và lý do giảm giá. | Quy trình yêu cầu khách xác nhận giá mới, nhưng danh sách chức năng chỉ có **xem**. Thiếu thao tác đồng ý/từ chối, người thực hiện và thời điểm xác nhận. | Bổ sung ngay trong F18 thao tác chấp nhận hoặc từ chối báo giá, lưu mức giá đã xác nhận. Không chuyển sang thanh toán trước khi có chấp nhận hợp lệ. |
| PB15 — Một yêu cầu nhiều thẻ, F16/F17/F21 | Khách gửi nhiều thẻ trong một yêu cầu. | Một thẻ đạt, một thẻ bị giảm tình trạng và một thẻ bị từ chối thì trạng thái chung xử lý thế nào? Chức năng này kéo theo kiểm định, báo giá và trả lại theo từng dòng thẻ. | MVP nên giới hạn mỗi yêu cầu một thẻ. Nếu giữ nhiều thẻ, phải định nghĩa kết quả kiểm định, giá và quyết định chấp nhận cho từng dòng. |
| PB16 — Hiệu lực báo giá | Tình trạng đúng thì giữ giá tạm tính. | Khách có thể giao thẻ nhiều ngày sau. Chưa rõ giữ giá bao lâu; đổi tỷ giá hoặc hệ số có làm thay đổi yêu cầu đã gửi không. | Lưu giá, tỷ giá, hệ số và thời điểm tại lúc gửi yêu cầu. Quy định thời hạn báo giá; mọi đề nghị thay đổi sau đó cần khách xác nhận. |
| PB17 — Nhập kho sau thu mua, F21 | Thẻ hoàn tất được tạo thành sản phẩm thẻ lẻ. | Nếu sản phẩm tương ứng đã tồn tại thì tạo mới hay tăng số lượng? Bấm hoàn tất lại có nhập kho lần hai không? "Đã thanh toán / Hoàn tất" cũng chưa phân biệt rõ. | Định nghĩa sản phẩm theo thẻ, biến thể, ngôn ngữ và tình trạng. Ghi nhận nguồn nhập từ yêu cầu thu mua; mỗi dòng chỉ nhập một lần. Tách thanh toán, nhập kho và đăng bán. |
| PB18 — Kiểm định và trả thẻ | Kiểm định thủ công, quay video, trả thẻ nếu khách không đồng ý. | Đây là nghiệp vụ vận hành thật, nhưng chưa quy định ai trả phí gửi/trả, cách ghi nhận đã nhận thẻ và bằng chứng tình trạng. Quay video cũng chưa rõ là việc ngoài hệ thống hay chức năng phải xây. | Bổ sung chính sách ngắn về giao nhận, phí trả và lý do từ chối. MVP ghi nhận kết quả kiểm định; quay/lưu video để ngoài hệ thống nếu không phải yêu cầu môn học. |

### 2.4 Bộ sưu tập, bảo mật và tiêu chí nghiệm thu

| Mã/Nội dung | AI thứ nhất đề xuất | Ý kiến phản biện | Đề xuất điều chỉnh |
|---|---|---|---|
| PB19 — Giá trị bộ sưu tập, F13 | Lưu giá lúc thêm nhưng hiển thị "tổng giá trị bộ sưu tập". | Giá lúc thêm là dữ liệu lịch sử, không thể mặc nhiên gọi là giá trị hiện tại. Chưa rõ tính theo giá tham khảo hay giá thu mua, và tình trạng ảnh hưởng thế nào. | Nếu giữ F13, chọn một cách tính rõ ràng; MVP dùng "Tổng giá tham khảo tại thời điểm lưu". Thẻ chưa có giá được báo riêng, không coi là giá 0. |
| PB20 — Đang săn, F14 | Cùng set và số thẻ thì báo shop đang có hàng. | Có thể dẫn khách tới phiên bản hoặc ngôn ngữ không muốn mua; sản phẩm tồn tại nhưng đã hết hàng hoặc bị ẩn cũng không nên được tính là có hàng. | Chốt điều kiện khớp và chỉ hiện nhãn khi sản phẩm được đăng bán, tồn khả dụng >0. Không cần xây hệ thống thông báo nền cho MVP. |
| PB21 — Hoàn thành set, F15 | Số thẻ khác nhau / tổng số thẻ của set. | Chưa xác định "tổng số" là số in trên thẻ hay toàn bộ set; cũng chưa quy định biến thể có được đếm riêng. API thực tế phân biệt `printedTotal` và `total`. | Để sau MVP. Khi triển khai, chọn rõ tập thẻ mục tiêu và dùng cùng quy tắc cho cả tử số, mẫu số. [Tài liệu set của Pokémon TCG API](https://docs.pokemontcg.io/api-reference/sets/set-object/) |
| PB22 — localStorage và tài khoản | Khách lưu bộ sưu tập trên trình duyệt; thành viên quản lý dữ liệu của mình. | Chưa rõ sau đăng nhập dữ liệu được gộp, thay thế hay giữ riêng. Đăng xuất rồi đổi tài khoản trên cùng máy có thể hiển thị nhầm dữ liệu nếu không thiết kế rõ. | Tách bản mô phỏng frontend khỏi phiên bản có backend. Chốt quy tắc chuyển dữ liệu khách sang tài khoản và xử lý khi đăng xuất; có thể bỏ đồng bộ bộ sưu tập khỏi MVP. |
| PB23 — Phân quyền và dữ liệu nhạy cảm | Trang admin chỉ cho admin; khách chỉ thấy dữ liệu của mình; không lưu số tài khoản vào localStorage. | Đây mới là ý định, chưa đủ nghiệm thu. Ẩn nút hoặc chặn trang bằng JavaScript không chứng minh API được bảo vệ. Thông tin nhận tiền và ảnh yêu cầu bán cũng cần giới hạn người xem. | Kiểm tra quyền trên server cho từng yêu cầu. Thử tài khoản A truy cập đơn, ảnh và yêu cầu bán của B; thử khách gọi chức năng admin. Bản frontend chỉ được coi là mô phỏng phân quyền. [Hướng dẫn phân quyền OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) |
| PB24 — Kiểm thử | Chủ yếu nghiệm thu khi thao tác thành công. | Thiếu trường hợp API lỗi, không có giá, tồn kho thay đổi, bấm gửi hai lần, đổi trạng thái sai thứ tự và truy cập dữ liệu người khác. Một số tiêu chí như "khách thấy ngay" cũng chưa xác định có cần tự cập nhật hay tải lại trang. | Mỗi luồng chính cần ca thành công, dữ liệu không hợp lệ, lỗi phụ thuộc và thao tác lặp. Quy định rõ thời điểm cập nhật giao diện; MVP có thể cập nhật khi tải lại trang. |

### 2.5 Phạm vi Astra 6 đề xuất chốt

- **Giữ bắt buộc:** cửa hàng F01–F07; Check thẻ F08–F12 trong phạm vi dữ liệu đã kiểm chứng; yêu cầu bán và theo dõi F17–F18; quản trị F19–F21.
- **Thu gọn:** một thẻ mỗi yêu cầu bán; thanh toán xác nhận thủ công; admin nhập kết quả kiểm định; cấu hình giá trong một nơi thay vì làm ngay màn hình F22.
- **Làm sau:** F13–F16 về bộ sưu tập và bán từ bộ sưu tập, đặc biệt phần tổng giá trị và hoàn thành set.
- **Chốt trước khi triển khai:** nguồn giá sử dụng được, cách phân biệt phiên bản thẻ, quy tắc tồn kho và cơ chế khách xác nhận báo giá.

Điểm Astra 6 đồng ý với AI 1: giữ HTML/CSS/JavaScript thuần, có tìm thủ công khi OCR thất bại, yêu cầu khách xác nhận thẻ và kiểm định trực tiếp trước khi chốt thu mua. **Điểm Astra 6 không đồng ý là coi gần như toàn bộ hệ sinh thái này là MVP bắt buộc trước khi chứng minh luồng "nhận diện đúng thẻ → lấy đúng giá → thu mua" hoạt động được.**

## 3. Bảng tổng hợp quyết định

**Người quyết định:** Jade · **Ngày:** 07/11/2026 · **Kết quả:** REQUIREMENTS.md được nâng lên **v1.0**.

Kết quả chung: **đồng ý 18** · **đồng ý một phần 5** · **không đồng ý 1** (PB04). Bốn điểm có lựa chọn rõ ràng (PB02/PB04, PB03, PB15, PB01) đã được Jade chọn trực tiếp. Riêng luồng thu mua, Jade bổ sung một quyết định mà cả hai AI đều không đề xuất: **chỉ giao dịch tại cửa hàng**. Quyết định này giải quyết luôn PB14, PB18 và một phần PB23.

### 3.1 Bảng tóm tắt (theo mẫu của đề bài)

| Nội dung | AI thứ nhất đề xuất | AI thứ hai phản biện | Quyết định của nhóm |
|---|---|---|---|
| Luồng mua hàng (F01–F07) | Bắt buộc | Đồng ý, nhưng thiếu quy tắc tồn kho, cách nhận hàng, trạng thái thanh toán | **Giữ lại**, bổ sung các quy tắc còn thiếu |
| Check thẻ: OCR + chọn thẻ + giá (F08–F12) | Bắt buộc | Đồng ý giữ, nhưng phải phân biệt biến thể, đổi tên "giá thị trường" và xử lý trường hợp thiếu giá | **Giữ lại**, sửa mô tả và tiêu chí nghiệm thu |
| Nguồn giá | pokemontcg.io hoặc TCGdex, kiểm tra sau | pokemontcg.io đã ngừng phát triển; phải thử nguồn trước khi chốt | **Chọn TCGdex** (đã kiểm tra CORS và giá), bỏ pokemontcg.io |
| Bộ sưu tập: Đang có, Đang săn (F13, F14) | Bắt buộc | Nên để làm sau | **Giữ bắt buộc, làm bản gọn**: đây là phần localStorage của Buổi 3 |
| % hoàn thành set (F15) | Nên có | Để sau MVP | **Chuyển sang Nâng cao** |
| Bán từ bộ sưu tập (F16) | Bắt buộc, chọn nhiều thẻ | Chỉ là một lối vào F17 | **Gộp vào F17**, một nút "Bán thẻ này" |
| Một yêu cầu bán nhiều thẻ | Có | Nên giới hạn 1 thẻ | **1 thẻ / yêu cầu**, nhiều thẻ để Nâng cao |
| Giao nhận và thanh toán khi thu mua | Mang đến cửa hàng hoặc gửi bưu điện; trả tiền chuyển khoản | Thiếu chính sách phí gửi, trả thẻ, xác nhận giá mới | **Chỉ giao dịch tại cửa hàng**, trả tiền tại quầy, không lưu số tài khoản |
| Thứ tự triển khai | Mua hàng → Check thẻ → Bộ sưu tập → thu mua | Làm thu mua trước bộ sưu tập | **Giữ thứ tự cũ**: thu mua cần backend (GĐ4) |
| Dòng thẻ được bán | Pokémon; shop vẫn có thể bán dòng khác | Mâu thuẫn, nên chỉ Pokémon | **Chỉ bán Pokémon** trong MVP |
| Màn hình cấu hình giá (F22) | Nên có | Để tham số ở một chỗ thay vì làm màn hình | **Tham số trong `js/config.js`**, màn hình F22 vẫn là Nên có |

### 3.2 Bảng chi tiết theo từng ý kiến phản biện

| Mã | Ý kiến của AI thứ hai (tóm tắt) | Quyết định | Lý do / cách áp dụng |
|---|---|---|---|
| PB01 | Không thấy trên website chưa chứng minh thị trường thiếu; chưa xác nhận nhu cầu | **Đồng ý** | Đổi cách viết thành "cơ hội quan sát được trong phạm vi khảo sát (website, 07/11/2026)". Thêm khảo sát nhỏ khoảng 5 người chơi ([customer-survey.md](../customer-survey.md), T1.12). |
| PB02 | 20/22 chức năng bắt buộc, quá tải cho 1 người | **Đồng ý một phần** | F15 sang Nâng cao, F16 gộp vào F17, F22 vẫn Nên có, thu mua giới hạn 1 thẻ và giao dịch tại cửa hàng. **Không** hạ F13–F14, vì Buổi 3 yêu cầu JavaScript + localStorage và Bộ sưu tập là phần thể hiện tự nhiên nhất. Thêm thứ tự cắt khi trễ: F22 → F14 → bớt bộ lọc. |
| PB03 | Phạm vi Pokémon chưa nhất quán | **Đồng ý** | Chỉ bán Pokémon; Check thẻ cho thẻ tiếng Anh; F15 ra khỏi MVP. |
| PB04 | Làm thu mua trước bộ sưu tập | **Không đồng ý** | Luồng thu mua cần backend (admin phải thấy yêu cầu của khách, lưu trạng thái), mà backend chỉ có ở GĐ4. Bộ sưu tập chỉ cần localStorage nên làm được ở GĐ3. Thu mua vẫn bắt buộc và không bị cắt. |
| PB05 | F16 trùng F17; F03 và F10 phải tách rõ | **Đồng ý** | F16 chỉ còn là một lối vào F17, dùng chung biểu mẫu. Ghi rõ F03 tìm trong sản phẩm đang bán, còn F10 tra toàn bộ danh mục thẻ. |
| PB06 | Nguồn giá chưa kiểm chứng; pokemontcg.io đã ngừng phát triển | **Đồng ý, đã kiểm chứng** | Thông báo ngừng là đúng (mục 1). Đã gọi thử TCGdex: CORS mở, giá theo biến thể, cập nhật trong ngày. Chọn TCGdex; JSON mẫu có nhãn mô phỏng làm dự phòng. T3.5 thu hẹp thành thử trên trang HTML thật và đo tỉ lệ thẻ thiếu giá. |
| PB07 | Đọc đúng tên và số chưa đủ, cần biến thể; "tên Pokémon" không bao quát thẻ Trainer | **Đồng ý** | Dùng "tên thẻ"; lưu `cardId`, set, ngôn ngữ, biến thể. Thêm bước chọn biến thể và nút "Không có thẻ phù hợp". |
| PB08 | "Giá thị trường VND" gây hiểu nhầm | **Đồng ý** | Ba tên gọi riêng: "Giá tham khảo quốc tế (quy đổi VND)", "Giá thu mua dự kiến", "Giá bán tại JadeCard". Tỉ giá theo đúng loại tiền nguồn trả về. |
| PB09 | Chưa có quy tắc khi thiếu giá; JSON mẫu khác giá thật | **Đồng ý một phần** | Thiếu giá thì hiện "Chưa có giá tham khảo", không hiện 0đ, không lấy giá biến thể khác. Dữ liệu mẫu có nhãn "Dữ liệu mô phỏng". **Không làm** báo giá thủ công cho thẻ thiếu giá (để Nâng cao F29), vì thêm một nhánh quy trình. |
| PB10 | Ngưỡng giá ≠ độ hiếm; shop có mua mọi thẻ đạt ngưỡng không? | **Đồng ý** | Đổi thành "đạt ngưỡng giá thu mua". Ghi công khai: shop có thể từ chối vì đủ hàng hoặc ít người cần. Hệ số vẫn là giả định mô phỏng. |
| PB11 | Tiêu chí OCR chưa định nghĩa rõ, mốc 10 giây thiếu điều kiện | **Đồng ý** | Bộ ảnh cố định 15 ảnh (10 rõ, 3 khó, 2 ngoài phạm vi). Tiêu chí: thẻ đúng nằm trong kết quả ≥ 7/10 ảnh rõ, và ảnh ngoài phạm vi không được tự báo giá. Đo thời gian lần đầu và lần sau riêng; mốc chính thức chốt sau T3.6. |
| PB12 | Hai khách đặt cùng thẻ cuối; thiếu quy tắc hoàn kho | **Đồng ý** | Đơn chờ xác nhận chưa giữ hàng (có thông báo). Xác nhận thì kiểm tra và trừ kho cùng lúc; thiếu hàng thì không xác nhận. Hủy đơn hoàn kho đúng một lần. |
| PB13 | F05 thiếu cách nhận hàng, phí, trạng thái thanh toán | **Đồng ý** | Thêm giao hàng (30.000đ) / nhận tại cửa hàng (giữ 7 ngày). Trạng thái thanh toán theo dõi riêng. Có trạng thái "Chờ nhận tại cửa hàng". |
| PB14 | F18 thiếu thao tác chấp nhận / từ chối giá mới | **Đồng ý một phần, giải quyết khác** | Vì giao dịch tại cửa hàng, khách đồng ý hay không ngay tại quầy, nên web không cần nút chấp nhận. Admin ghi lại kết quả "Đã mua" (giá chốt) hoặc "Không mua" (lý do). |
| PB15 | Một yêu cầu nhiều thẻ khó xử lý trạng thái | **Đồng ý** | Jade chốt mỗi yêu cầu một thẻ. Nhiều thẻ → Nâng cao (F28). |
| PB16 | Chưa rõ hiệu lực báo giá | **Đồng ý** | Lưu giá, tỉ giá, hệ số và thời điểm khi gửi. Khách phải đến cửa hàng trong 7 ngày kể từ khi duyệt, quá hạn thì yêu cầu "Hết hạn". |
| PB17 | Nhập kho: tạo mới hay tăng tồn; nhập kho hai lần | **Đồng ý** | Sản phẩm thẻ lẻ xác định bởi `cardId` + biến thể + ngôn ngữ + tình trạng. Mỗi yêu cầu nhập kho một lần. Tách ba bước: Đã mua → Đã nhập kho → đăng bán. |
| PB18 | Thiếu chính sách giao nhận, phí trả, bằng chứng; video có phải chức năng không | **Đồng ý, đơn giản hóa** | Chỉ giao dịch tại cửa hàng, nên không có phí gửi hay phí trả. Kiểm định trước mặt khách. Video lưu ngoài hệ thống; hệ thống chỉ ghi kết quả. Chính sách ở REQUIREMENTS mục 4.7. |
| PB19 | "Tổng giá trị" dùng giá lịch sử | **Đồng ý** | Đổi thành "Tổng giá tham khảo tại thời điểm lưu"; thẻ chưa có giá được đếm riêng. |
| PB20 | Nhãn "có hàng" có thể sai biến thể, hết hàng, bị ẩn | **Đồng ý** | Khớp theo `cardId` + biến thể; chỉ hiện khi sản phẩm đang hiển thị và tồn > 0. Không có thông báo đẩy. |
| PB21 | "Tổng số thẻ của set" chưa rõ | **Đồng ý** | Đã thấy thực tế trên TCGdex: set Darkness Ablaze có `official` 189 và `total` 201. F15 chuyển sang Nâng cao, khi làm sẽ chốt một quy tắc. |
| PB22 | Bộ sưu tập và tài khoản chưa có quy tắc | **Đồng ý** | Bộ sưu tập gắn với trình duyệt, không gắn với tài khoản; có cảnh báo máy dùng chung. Đồng bộ theo tài khoản để Nâng cao (F27). |
| PB23 | Phân quyền mới là ý định; chặn bằng JavaScript chưa đủ | **Đồng ý** | GĐ3 ghi rõ "mô phỏng phân quyền". GĐ4 server kiểm tra quyền ở mọi yêu cầu, có ca kiểm thử A truy cập dữ liệu của B. Bỏ hẳn việc thu thông tin tài khoản ngân hàng nên giảm bớt dữ liệu nhạy cảm. |
| PB24 | Kiểm thử chỉ có ca thành công | **Đồng ý một phần** | Thêm mục 7 "Nguyên tắc kiểm thử" (4 loại ca + truy cập trái phép). "Khách thấy ngay" đổi thành "thấy sau khi tải lại trang". Bảng ca kiểm thử chi tiết để Giai đoạn 5, vì chưa có mã nguồn. |

### 3.3 Điều rút ra

- AI thứ hai phát hiện được **một sự thật mà AI thứ nhất bỏ sót**: pokemontcg.io đã ngừng phát triển. Nếu không kiểm tra, dự án sẽ phụ thuộc vào một nguồn chỉ còn chạy đến 01/03/2027, sát cuối học phần.
- AI thứ hai **không biết lộ trình môn học** (Buổi 3 chưa có backend), nên đề xuất thứ tự triển khai không làm được (PB04). Đây là chỗ nhóm phải tự quyết.
- Một số đề xuất có thể **đơn giản hơn cả hai AI**: chuyển việc chốt giá và trả tiền ra quầy giúp bỏ được nhiều trạng thái và dữ liệu nhạy cảm mà không mất giá trị nghiệp vụ.
