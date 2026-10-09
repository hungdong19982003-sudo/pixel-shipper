# AGENTS.md - Quy định Phát triển Dự án Pixel Shipper

Tất cả các agent làm việc trên codebase này phải tuân thủ:
1. Danh mục tài liệu tại thư mục `docs/`:
   - [docs/prd.md](file:///c:/Users/hungd/Desktop/Game1/docs/prd.md): Yêu cầu tính năng và sản phẩm.
   - [docs/tech_architecture.md](file:///c:/Users/hungd/Desktop/Game1/docs/tech_architecture.md): Kiến trúc kỹ thuật và mô hình dữ liệu.
   - [docs/plan.md](file:///c:/Users/hungd/Desktop/Game1/docs/plan.md): Danh sách các task chia theo Phase, có checkbox `[ ]` và `[x]`.
   - [docs/rules.md](file:///c:/Users/hungd/Desktop/Game1/docs/rules.md): Quy tắc làm việc, kiểm tra chất lượng code và tiêu chuẩn mỹ thuật.

2. Sau khi hoàn thành và test xong bất kỳ task nào, **bắt buộc** cập nhật checkbox từ `[ ]` thành `[x]` trong [docs/plan.md](file:///c:/Users/hungd/Desktop/Game1/docs/plan.md) và cập nhật số lượng task đã hoàn thành tại bảng tiến độ.

3. Skill kiểm thử trình duyệt của dự án nằm tại [skill/playwright/SKILL.md](skill/playwright/SKILL.md). Đọc skill này khi kiểm thử trực tiếp giao diện/gameplay trên trình duyệt. Các skill Phaser, pixel art và Web Audio hiện có nằm trong `.agents/skills/`.
