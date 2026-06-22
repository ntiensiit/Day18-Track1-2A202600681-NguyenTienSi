# C2 Job Copilot — Day 18 Track 1

Prototype cho bài lab **Human-Centered AI Design**. Đây là một lát cắt từ dự án `C2-App-013`: AI hỗ trợ người vận hành tạo và duyệt một synthetic-dataset generation job cho YOLO, thay vì thiết kế lại toàn bộ pipeline.

## Chạy prototype

Không cần build tool hay API thật.

```bash
python -m http.server 8000
# mở http://localhost:8000
```

Hoặc mở trực tiếp `index.html` bằng trình duyệt. Dùng static server giúp trải nghiệm và font tải ổn định hơn.

## Cấu trúc

- `index.html` — các trạng thái và nội dung prototype
- `styles.css` — giao diện responsive, trạng thái, tín hiệu rủi ro và hierarchy
- `app.js` — luồng bấm, nhánh phục hồi, undo, feedback và các thay đổi trạng thái

## Lát cắt được thiết kế

**Feature:** Job Copilot cho synthetic-to-real YOLO dataset pipeline.

**Mục tiêu của người dùng:** chuyển một brief ngắn thành cấu hình dataset có thể kiểm tra, hiểu trade-off, và chỉ chạy job sau khi người dùng duyệt.

**Vì sao chọn lát cắt này:** C2-App-013 có các workflow mô phỏng/diffusion, quality gate và job API. Rủi ro lớn nhất về trải nghiệm không phải là thiếu tính năng AI, mà là người dùng hiểu nhầm một draft là job đã chạy, để AI tự chọn workflow tốn GPU/API, hoặc không có đường khôi phục khi backend diffusion không sẵn sàng.

## Kịch bản bắt buộc trong prototype

| Kịch bản | Nơi xem | AI làm gì | Quyền kiểm soát của người dùng |
|---|---|---|---|
| **T0 — Onboarding** | `01 Bắt đầu` | Nêu rõ AI có thể tạo draft và phát hiện input thiếu; nêu giới hạn không tự chạy job/không tự thay đổi benchmark | Bỏ qua, xem giới hạn, rút quyền dùng brief trong phiên |
| **T1 — Nhu cầu mơ hồ** | `02 Làm rõ yêu cầu` | Trích xuất “mug”, “300 ảnh”, “realism”; chỉ hỏi một lựa chọn có tác động mạnh | Sửa cách AI hiểu, dùng gợi ý hoặc viết lại brief |
| **T2 — Ask trước khi hành động** | `02 Làm rõ yêu cầu` | Không tự chọn SD1.5 hay sim-only vì lựa chọn làm đổi chi phí, latency và risk | Chọn workflow rồi mới tạo bản kế hoạch |
| **T3 — Explainability** | `03 Xem & duyệt` | Tách fact, assumption và constraint; hiển thị nguồn, logic và trade-off | Mở lớp bằng chứng, sửa cấu hình, xóa draft hoặc duyệt rõ ràng |
| **Failure 1 — Backend unavailable** | `04 Khôi phục` | Không âm thầm downgrade workflow khi SD1.5 backend không xác nhận | Retry, tạo preview sim-only nhỏ, hoặc lưu draft không hành động |
| **Failure 2 — Ambiguous object mapping** | `04 Khôi phục` | Không tự map `coffee cup` → `mug` ở confidence 62% | Xác nhận mapping cho job này hoặc chọn object khác |

## Act / Ask / Don't Act

| Mức tự chủ | Quyết định trong prototype | Lý do |
|---|---|---|
| **Act** | Tự thêm 5 preview images vào **draft** | Rủi ro thấp, không gọi GPU/API, người dùng thấy ngay và hoàn tác được |
| **Ask** | Chọn workflow và duyệt job trước khi kiểm tra/chạy | Có ảnh hưởng đáng kể tới cost, latency, output quality và cần user intent rõ ràng |
| **Don't Act** | Không tạo dữ liệu khi backend SD1.5 không xác nhận; không tự map object mơ hồ | Sai sẽ tạo output nhìn có vẻ thành công nhưng lệch mục tiêu; cần dữ kiện/authority từ người dùng |

## Feedback hai chiều

### User → System

- **Explicit:** sửa brief, chọn workflow, xác nhận/từ chối mapping, chọn rating và gửi ghi chú.
- **Implicit:** đổi workflow, undo preview, mở evidence, thời gian do dự trước khi duyệt.

Các implicit signal được chú thích trong UI như tín hiệu UX **không phải ground truth**: undo có thể là AI sai hoặc người dùng đổi ý.

### System → User

- **Explicit:** độ chắc chắn 62%, lý do hệ thống hỏi, evidence, trạng thái backend lỗi, điều đã/không được ghi nhớ.
- **Implicit:** hierarchy khiến nút “Duyệt & chạy” chỉ xuất hiện sau checklist; màu amber/red và đặt hành động risky sau evidence làm rõ mức rủi ro mà không chặn người dùng bằng modal liên tục.

## Rationale theo rủi ro và khả năng khôi phục

- **Không tự chạy SD1.5:** Workflow cần backend và có chi phí. Khi backend không xác nhận, tự chuyển sang sim-only full run có thể khiến người dùng tưởng output vẫn đạt realism. Sai sót này khó phát hiện sau khi dataset đã sinh hàng trăm ảnh.
- **Tự thêm preview 5 ảnh:** Đây là bước nhỏ, không gọi backend, có thể undo trước khi job thật chạy. Hành động tự động làm giảm công sức mà vẫn không cướp quyền quyết định.
- **Giữ mapping “coffee cup” là draft:** `mug` có thể hợp lý nhưng không chắc đủ để coi như dữ kiện. Xác nhận của người dùng được ghi là lựa chọn cho **job hiện tại**, không biến thành sự thật cho mọi lần sau.
- **Evidence layer:** Người dùng không cần lời giải thích về toàn bộ model. Họ cần biết đâu là fact từ brief/domain, đâu là assumption, và constraint nào khiến AI không thể tự hành động.

## Traceability tới C2-App-013

Domain content của prototype dựa trên repository nguồn: đối tượng `mug`, PyBullet synthetic generation, các workflow `none`/`sd15`, API jobs, và quality/realism trade-off. Prototype không gọi backend hoặc API thật; dữ liệu, trạng thái và phản hồi AI đều là mẫu để kiểm tra trải nghiệm.
