# QUY TẮC PHÁT TRIỂN DỰ ÁN (PROJECT DEVELOPMENT RULES)
## Dự án: Pixel Shipper: City Tales (Phố Cuối Ngày)

Tài liệu này định nghĩa các nguyên tắc bắt buộc phải tuân thủ trong suốt vòng đời phát triển dự án, áp dụng cho cả lập trình viên và AI Assistant.

---

## 1. QUY TẮC QUẢN LÝ TIẾN ĐỘ & CẬP NHẬT TASK (Task Governance)

1. **Tuân thủ Kế hoạch Tuyệt đối:**
   - Mọi công việc triển khai phải căn cứ theo danh sách task đã được phân rã trong [docs/plan.md](file:///c:/Users/hungd/Desktop/Game1/docs/plan.md).
   - Không được tự ý triển khai tính năng ngoài phạm vi hoặc đốt cháy giai đoạn khi các task nền tảng chưa hoàn thành.
2. **Quy trình Tick Checkbox `[x]`:**
   - Chỉ được đánh dấu `[x]` khi và chỉ khi:
     - [x] Code đã được viết đầy đủ, không còn lỗi biên dịch TypeScript.
     - [x] Tính năng đã được kiểm thử thực tế và đạt tiêu chuẩn nghiệm thu của task.
   - Ngay sau khi tick `[x]`, phải cập nhật lại số lượng task hoàn thành ở bảng tổng quan đầu trang [docs/plan.md](file:///c:/Users/hungd/Desktop/Game1/docs/plan.md) (ví dụ: `1/8`, `2/8`...).
3. **Báo cáo Minh bạch:**
   - Sau mỗi task hoàn thành, tóm tắt ngắn gọn những gì đã làm, đính kèm đường link file đã chỉnh sửa và xác nhận task tiếp theo sẽ làm.

---

## 2. QUY TẮC KIẾN TRÚC & TIÊU CHUẨN CODE (Code Standards)

1. **Cấu trúc Thư mục Chuẩn mực:**
   - Tuân thủ nghiêm ngặt sơ đồ thư mục đã định nghĩa trong [docs/tech_architecture.md](file:///c:/Users/hungd/Desktop/Game1/docs/tech_architecture.md).
   - Không đặt các file mã nguồn bừa bãi ngoài thư mục gốc `src/`.
2. **TypeScript & Kiểu dữ liệu Nghiêm ngặt:**
   - Không sử dụng `any` trừ trường hợp bất khả kháng với API bên ngoài.
   - Mọi thực thể (Player, Vehicle, Order, Hazard, Stats) đều phải có interface/type tương ứng trong `src/types/index.ts`.
3. **Nguyên tắc No-Magic-Numbers:**
   - Tất cả các hằng số cấu hình (tốc độ xe, gia tốc, sát thương ổ gà, tỉ lệ trừ tiền, thời gian ngày đêm) phải được tập trung quản lý tại `src/config/GameConfig.ts`.
4. **Tách biệt Logic và Trình bày (Separation of Concerns):**
   - Logic chuyển động nhân vật/xe máy nằm trong Entity class (`Player.ts`, `Vehicle.ts`).
   - Logic tính toán độ nguyên vẹn thức ăn nằm trong Manager (`IntegrityManager.ts`).
   - Giao diện người dùng và điện thoại smartphone nằm trong Scene/Overlay riêng (`UIScene.ts` / `PhoneUI.ts`).

---

## 3. QUY TẮC ĐỒ HỌA & MỸ THUẬT (Art & Aesthetic Standards)

1. **Phong cách Pixel Art Đồng nhất:**
   - Mọi texture được tạo bởi `AssetGenerator.ts` phải tuân thủ kích thước lưới pixel chuẩn (16x16 hoặc 32x32), không kéo giãn sai tỉ lệ (tránh hiện tượng pixel shimmering / non-uniform pixels).
   - Bảng màu: Sử dụng bảng màu ấm cúng Á Đông (gam màu pastel ấm, ánh vàng đèn đường, màu xanh lá cây, màu đỏ biển hiệu phố thị).
2. **Trải nghiệm Giao diện Cao cấp (Premium UX):**
   - Smartphone Shipper App phải mang lại cảm giác hiện đại: Có animation trượt mở, viền bo tròn, các thẻ đơn hàng có đổ bóng nhẹ, badge trạng thái rõ ràng.
   - Khi lái xe, giao diện tự động thu gọn để người chơi có tầm nhìn tối đa bao quát đường phố.

---

## 4. QUY TẮC ÂM THANH & PHẢN HỒI XÚC GIÁC (Game Feel & Feedback)

1. **Phản hồi Đa giác quan (Juicy Game Feel):**
   - Mọi tương tác quan trọng đều phải có phản hồi thị giác + thính giác:
     - Lên/Xuống xe: Hiệu ứng nhún xe + âm thanh khởi động máy.
     - Vấp ổ gà: Màn hình rung giật (camera shake) + âm thanh xóc nảy + số % độ nguyên vẹn đỏ nhấp nháy bay lên.
     - Giao hàng thành công: Âm thanh ting-ting vui tươi + sao rơi lấp lánh + tiền bay vào ví.
2. **Tôn trọng Người chơi:**
   - Luôn có nút Bật/Tắt âm thanh (Mute/Unmute) trực quan trên giao diện màn hình.
   - Nhạc nền Lo-fi phải có âm lượng dịu nhẹ, không lấn át hiệu ứng âm thanh gameplay.
