# Hướng Dẫn Đọc Kết Quả Chấm Công & Sử Dụng Lark Attendance

## 1. Tầm Quan Trọng Của Việc Sắp Xếp Lịch Làm Việc (Schedule)

Việc sắp xếp lịch làm việc là điều kiện cần để hệ thống có thể đối soát và tính toán công rạng rỡ.

- Hầu hết các đề xuất như: **Nghỉ phép, Tăng ca, Làm việc từ xa** chỉ có thể được gửi nếu ngày đó nhân viên đã được xếp lịch làm việc (Shift).
- Nếu không được xếp lịch, hệ thống sẽ mặc định ngày đó là ngày nghỉ không lương và không cho phép gửi đề xuất nghỉ phép (vì hệ thống hiểu đang nghỉ sẵn).

## 2. Cách Sắp Xếp Lịch Làm Việc

Người quản lý/supervisor thực hiện các bước sau:

1. Mở ứng dụng Attendance, vào **Settings** > **Group settings**.
2. Chọn mục **Schedule** để mở giao diện quản lý lịch trực.
3. Chọn loại lịch và sắp xếp ca làm việc (Shift) cụ thể cho từng nhân viên.

## 3. Khắc Phục Lỗi "0 Ngày Nghỉ"

Nếu nhân viên gửi đề xuất nghỉ phép nhưng hệ thống hiển thị tổng số ngày nghỉ là 0:

- **Nguyên nhân**: Do ngày đó chưa được xếp lịch làm việc (hệ thống hiểu đang nghỉ sẵn).
- **Cách xử lý**: Quản lý cần chủ động gán một ca làm việc (Shift) bất kỳ cho ngày đó, sau đó nhân viên mới có thể gửi đề xuất nghỉ phép thành công.

## 4. Kiểm Tra và Theo Dõi Kết Quả

- Kết quả chấm công (Check-in/Check-out) được hiển thị minh bạch cho từng nhân viên.
- Mọi dữ liệu từ Attendance sẽ được tự động đồng bộ sang hệ thống **Lark Base** vào lúc **4:00 AM** mỗi ngày để phục vụ đối soát lương.
