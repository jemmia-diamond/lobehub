# Hướng dẫn chấm công bằng Lark Attendance

## Tại sao lại chấm công bằng Lark Attendance

| Khi chấm công bằng máy chấm công                                    | Khi chấm công bằng Lark Attendance                                                                                                                    |
| :------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nhân viên thường xuyên quên chấm công.                              | Có tính năng thông báo thời gian check-in/check-out trước 5-10p (thông qua tin nhắn từ phần mềm Lark).                                                |
| Việc kết nối máy chấm công và tải giờ công còn mất nhiều thời gian. | Chỉ có thể chấm công ở trong phạm vi 100m định vị của văn phòng.                                                                                      |
| Không đồng bộ được dữ liệu chấm công của nhiều thiết bị.            | Có tính năng đề xuất chấm công lại trong trường hợp quên chấm công.                                                                                   |
|                                                                     | Hỗ trợ việc tự động check-in/check-out khi mở phần mềm Lark mà không cần nhân viên phải thao tác.                                                     |
|                                                                     | Đồng bộ được dữ liệu chấm công về Lark Base giảm thời gian tính công cho phòng nhân sự và kế toán.                                                    |
|                                                                     | Đồng bộ được với phần mềm Lark Approval để gửi đề xuất (nghỉ phép, tăng ca, làm việc tại nhà, ...) và tự tính toán giờ/ngày công thực tế trong tháng. |
|                                                                     | Giảm thiểu nguy cơ sai sót khi tính công hàng tháng.                                                                                                  |

---

## 1. Cài đặt chung - Theo quy định công ty

### 1.1 Đối với khối văn phòng

- **Thời gian làm việc**: 9h00 - 18h00.
- **Lịch làm việc**: Từ thứ 2 - thứ 6, thứ 7 làm cách tuần.
- **Thông báo từ Bot**: Bot sẽ gửi thông báo chấm công vào lúc **8h55** và **18h05** hàng ngày.

### 1.2 Đối với phòng kinh doanh

- **Thời gian làm việc**: Chia làm 2 ca:
  - **Ca 1**: 8h30 - 17h30.
  - **Ca 2**: 12h00 - 21h00.
- **Sắp xếp lịch**: Vào ngày làm việc cuối cùng của tuần, trưởng bộ phận sẽ sắp xếp lịch làm việc cho tuần kế tiếp.
- **Thông báo từ Bot**:
  - **Ca 1**: 8h25 và 17h25 hàng ngày.
  - **Ca 2**: 11h55 và 20h55 hàng ngày.

---

## 2. Hướng dẫn sử dụng

### 2.1 Sử dụng chung

#### 2.1.1 Chấm Công

1. Tìm kiếm và mở ứng dụng **Attendance** trên Lark.
2. Chọn **Cài đặt** và bật **Express clock in/out** để tự động chấm công khi mở app.
3. Có thể cài đặt thời gian nhắc chấm công tại đây.

> [!IMPORTANT]
> **Phần mềm sẽ tự động check-in/out khi:**
>
> - Mở Lark trong phạm vi của công ty.
> - Trong khoảng thời gian quy định: **Trước ca làm việc 60 phút** và **sau ca làm việc 480 phút**.

#### 2.1.2 Kiểm tra kết quả chấm công hàng ngày

- **Cách 1**: Kiểm tra trực tiếp trên app Attendance.
- **Cách 2**: Kiểm tra trong file **Kết Quả Chấm Công**.

> [!NOTE]
> Kết quả chấm công sẽ được đồng bộ về file chậm hơn một ngày so với thực tế. Ví dụ: 5:00 sáng ngày 8-8 trên file mới đồng bộ kết quả chấm công ngày 7-8.

#### 2.1.3 Gửi đề xuất Check-in Check-out Bù

Trong trường hợp quên chấm công, nhân viên thực hiện:

1. Truy cập **Lark Attendance** > **Requests**.
2. Điền thông tin và gửi đề xuất.
3. Sau khi cấp trên duyệt, giờ bù sẽ được ghi nhận.

### 2.2 Dành riêng cho phòng Kinh Doanh

#### 2.2.1 Đặt lịch (Dành cho Quản lý)

1. Vào **Settings** > **Group settings**.
2. Chọn **Schedule** để mở lịch làm việc.
3. Chọn lịch và sắp xếp ca làm việc (Shift) theo từng nhân viên.

> [!IMPORTANT]
> Thời gian chấm công sẽ được update vào Base vào lúc **4h00 hàng ngày** tại **Lark Base: Synced From Attendance**.

---

## 3. Lưu Ý (Khắc Phục Lỗi "0 Ngày Nghỉ")

Nếu gửi **Đề Xuất Nghỉ Phép** mà hệ thống hiển thị tổng số ngày nghỉ là 0:

- **Nguyên nhân**: Do ngày đó chưa được xếp lịch làm việc (hệ thống hiểu là ngày nghỉ nên không thể xin nghỉ phép vào ngày nghỉ).
- **Cách giải quyết**: Quản lý cần đặt lịch (chọn đại một ca) cho ngày đó, sau đó nhân viên mới có thể gửi đề xuất thành công.
