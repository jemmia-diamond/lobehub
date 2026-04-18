# Hướng Dẫn Đọc Kết Quả Chấm Công & Sử Dụng Lark Attendance

Kết quả check-in check-out thực tế của bạn sẽ được ghi nhận bằng **Lark Attendance**. Sau đó các kết quả chấm công và đề xuất sẽ được ghi nhận và xử lý bởi file **Kết Quả Chấm Công**. Hãy xem qua hướng dẫn này để biết cách sử dụng và đọc hiểu các thông tin.

---

## 1. Hướng Dẫn Đọc Kết Quả Chấm Công

Phần này giúp bạn dễ dàng đọc hiểu kết quả chấm công của mình. Chúng tôi sẽ sử dụng ca làm việc của khối văn phòng làm ví dụ, nhưng logic này áp dụng cho tất cả các khối và ca làm việc.

### Định nghĩa các thuật ngữ:

- **Giờ bắt đầu ca**: Thời điểm bạn cần bắt đầu làm việc trong ngày.
- **Giờ kết thúc ca**: Thời điểm bạn được phép kết thúc công việc trong ngày.
- **Giờ nghỉ giữa ca**: Khoảng thời gian nghỉ ngơi giữa ca làm việc của bạn.
- **Giờ đi muộn/về sớm được duyệt**: Thời gian đi muộn hoặc về sớm đã được quản lý chấp thuận.
- **Giờ check-in và check-out thực tế**: Thời gian bạn bắt đầu và kết thúc làm việc theo ghi nhận của hệ thống.
- **Giờ check-in và check-out bù**: Thời gian check-in hoặc check-out mà bạn đã gửi đề xuất bù, được quản lý chấp thuận.

> [!IMPORTANT]
> Nếu một buổi vừa không có giờ thực tế và vừa không có giờ đề xuất bù thì buổi đó không được tính công.

### 1.1 Cách tính giờ công

#### 1.1.1 Giờ công sáng (trước giờ nghỉ trưa)

**Mặc định:**

- **Nếu nghỉ phép có lương hoặc làm việc tại nhà:** Đủ công.
- **Nếu nghỉ phép không lương:** 0 giờ công.
- **Nếu đến đúng giờ hoặc sớm hơn** so với giờ bắt đầu ca hoặc giờ đi muộn được duyệt: `Giờ bắt đầu nghỉ trưa - Giờ bắt đầu ca`.
- **Nếu check in quá giờ** so với đề xuất đi muộn được duyệt: `Giờ bắt đầu nghỉ trưa - Giờ bắt đầu ca - Thời gian đến muộn hơn so với đề xuất được duyệt`.
- **Các trường hợp đi muộn khác:** `Giờ bắt đầu nghỉ trưa - Giờ check-in thực tế`.

> [!NOTE]
> Nếu có giờ check-out thực tế sớm hơn giờ bắt đầu nghỉ trưa, giờ công của bạn sẽ được tính theo giờ check-out thực tế.

#### 1.1.2 Giờ công chiều (sau giờ nghỉ trưa)

**Mặc định:**

- **Nếu nghỉ phép có lương hoặc làm việc tại nhà:** Đủ công.
- **Nếu nghỉ phép không lương:** 0 giờ công.
- **Nếu đến đúng giờ hoặc trễ hơn** so với giờ kết thúc ca hoặc giờ về sớm được duyệt: `Giờ kết thúc ca - Giờ kết thúc nghỉ trưa`.
- **Nếu check out sớm hơn** so với đề xuất về sớm được duyệt: `Giờ kết thúc ca - Giờ kết thúc nghỉ trưa - Thời gian về sớm hơn so với đề xuất được duyệt`.
- **Các trường hợp về sớm khác:** `Giờ check-out thực tế - Giờ kết thúc nghỉ trưa`.

> [!NOTE]
> Nếu có giờ check-in thực tế trễ hơn giờ kết thúc nghỉ trưa, giờ công của bạn sẽ được tính theo giờ check-in thực tế.

#### 1.1.3 Tổng giờ công trong ngày

Cộng giờ công sáng và giờ công chiều.

---

### 1.2 Tính tăng ca

Hệ thống dựa vào việc sắp xếp ca làm việc, ngày lễ trong tháng để xác định đề xuất tăng ca của bạn thuộc trường hợp nào trong ba trường hợp:

1. Tăng ca ngày thường.
2. Tăng ca ngày nghỉ.
3. Tăng ca ngày lễ.

Số giờ tăng ca hiển thị trong bảng **Tổng Kết Ngày Công** là số giờ tăng ca thực tế cho từng trường hợp. Sau khi số liệu chuyển cho kế toán, kế toán sẽ nhân với hệ số theo từng trường hợp.

---

### 1.3 Tính giờ công cho ngày nghỉ/ngày lễ

#### 1.3.1 Ngày nghỉ thông thường

- **Ghi nhận:** "⭐Ngày Nghỉ"
- **Giờ công:** 0 giờ.

#### 1.3.2 Ngày lễ

**Đối với phòng kinh doanh và các phòng ban khác đi làm vào ngày lễ:**

- **Ghi nhận:** "💵Tính Vào OT".
- **Giờ công:** 0 giờ.
- **Tăng ca:** Bằng số giờ đi làm thực tế + Số giờ tăng ca theo đề xuất (nếu có).

**Đối với các phòng ban khác:**

- **Ghi nhận:** "🏖️Lễ/Sự Kiện"
- **Giờ công:** 8 giờ.

---

### 1.4 Ví dụ minh họa

| Trường hợp                                         | Chi tiết                                                                                                                  | Kết quả                                                                                                                                     |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ví dụ 1: Đi làm đúng giờ**                       | Giờ bắt đầu ca: 9:00. Check-in: 8:55. Giờ nghỉ trưa: 12:30-13:30. Check-out: 18:05.                                       | Giờ công sáng: 3.5 giờ (9:00 - 12:30).<br>Giờ công chiều: 4.5 giờ (13:30 - 18:00).<br>**Tổng giờ công: 8 giờ.**                             |
| **Ví dụ 2: Đi muộn hơn so với đề xuất được duyệt** | Giờ bắt đầu ca: 9:00. Giờ đi muộn được duyệt: 9:15. Check-in thực tế: 9:30. Giờ nghỉ trưa: 12:30-13:30.                   | Giờ công sáng: 3.25 giờ (3.5 giờ - 0.25 giờ đi muộn hơn đề xuất).<br>Giờ công chiều: 4.5 giờ (bình thường).<br>**Tổng giờ công: 7.75 giờ.** |
| **Ví dụ 3: Về sớm hơn so với đề xuất được duyệt**  | Giờ kết thúc ca: 18:00. Giờ về sớm được duyệt: 17:45. Check-out thực tế: 17:30.                                           | Giờ công sáng: 3.5 giờ (bình thường).<br>Giờ công chiều: 4.25 giờ (4.5 giờ - 0.25 giờ về sớm hơn đề xuất).<br>**Tổng giờ công: 7.75 giờ.**  |
| **Ví dụ 4: Về sớm mà không có đề xuất được duyệt** | Check-in thực tế: 9:05. Giờ kết thúc ca: 18:00. Check-out thực tế: 17:30.                                                 | Giờ công sáng: 3.5 giờ (bình thường).<br>Giờ công chiều: 4 giờ (4.5 giờ - 0.5 giờ về sớm).<br>**Tổng giờ công: 7.5 giờ.**                   |
| **Ví dụ 5: Tính công tháng có nghỉ lễ**            | Tổng ngày trong tháng: 30. Số ngày nghỉ: 2. Số ngày làm việc dịp lễ: 2. Giả sử các ngày còn lại làm việc đúng giờ đầy đủ. | **Tổng ngày công: 26 ngày** (30 - 2 - 2).<br>**Tổng số giờ tăng ca ngày lễ: 16 tiếng** (2 ngày x 8 tiếng).                                  |

---

## 2. Sử Dụng Lark Attendance

### 2.1 Chấm Công

#### 2.1.1 Thủ Công

1. Vào phần tìm kiếm của Lark, tìm kiếm **Attendance**.
2. Chọn ứng dụng **Attendance**.
3. Bấm **Clock in** hoặc **Clock out** để ghi nhận.
4. Sau khi bấm, màn hình hiện "Attendance Recorded" kèm với thời gian cụ thể là thành công.

#### 2.1.2 Tự Động

**Bật tính năng tự động:**

1. Trong app Attendance, chọn **Settings**.
2. Ở phần **Express Attendance** (chấm công nhanh), bật hết 4 tùy chọn.

**Để app chấm công tự động:**

- Trước giờ vào làm và sau giờ tan làm, mở app Lark (đảm bảo có kết nối internet và trong phạm vi GPS của công ty).
- Chờ khoảng 5 giây.
- Nếu thành công, **Attendance Bot** sẽ gửi tin nhắn: "Express Clocked in/out successfully".

> [!TIP]
> (Không bắt buộc) Có thể bấm **View Details** để xem chi tiết thông tin trong ứng dụng Attendance.
> Nếu chờ tầm 10 giây vẫn không có tin nhắn, hãy chủ động chấm công thủ công.

#### 2.1.3 Cài Đặt Nhắc Nhở Check-in Check-out

Trong phần **Settings** của Attendance, bạn có thể cài đặt thời gian nhận nhắc nhở từ **Attendance Bot** để nhắc nhở chấm công thủ công hoặc tự động.

---

### 2.2 Kiểm Tra Kết Quả Chấm Công Hàng Ngày

- **Cách 1**: Kiểm tra trực tiếp trên ứng dụng Attendance.
- **Cách 2**: Kiểm tra trong file **Kết Quả Chấm Công**.

> [!IMPORTANT]
> **Lưu ý**: Kết quả chấm công sẽ được đồng bộ về file Kết Quả Chấm Công chậm hơn một ngày so với thực tế. Ví dụ: 5:00 sáng ngày 8-8 trên file mới đồng bộ kết quả chấm công ngày 7-8.
> Chỉ có kết quả được ghi nhận bằng 2 cách trên mới là kết quả cuối cùng xác nhận bạn có check-in check-out.

---

### 2.3 Gửi đề xuất Check-in Check-out Bù

Trong trường hợp quên chấm công, thực hiện như sau:

1. Truy cập **Lark Attendance** > **Requests**.
2. Điền các thông tin để gửi đề xuất.
3. Sau khi cấp trên duyệt, giờ check-in check-out bù sẽ được ghi nhận.

> [!WARNING]
> Nếu vừa không có check-in và vừa không có đề xuất check-in bù, bạn sẽ bị trừ lương buổi sáng. Cách tính cho buổi chiều tương tự.

---

### 2.4 Dành riêng cho phòng Kinh Doanh - Lên Lịch Cho Nhân Viên

Vào ngày làm việc cuối cùng của tuần, trưởng bộ phận sẽ sắp xếp lịch làm việc cho tuần kế tiếp.

- Cần phải sắp xếp lịch làm việc để nhân viên thực hiện được các đề xuất: nghỉ phép, tăng ca, làm việc từ xa, v.v.
- Ngày nào không xếp lịch, hệ thống mặc định là ngày nghỉ không lương.

**Cách thực hiện:**

1. Chọn **Settings** > **Group settings**.
2. Chọn mục **Schedule** để mở lịch làm việc.
3. Chọn lịch và sắp xếp ca làm việc (Shift) theo từng nhân viên.

---

## 3. Lưu Ý Đặc Biệt (Khắc Phục Lỗi "0 Ngày Nghỉ")

Nếu gửi **Đề Xuất Nghỉ Phép** mà hệ thống hiển thị tổng số ngày nghỉ là 0:

- **Nguyên nhân**: Do ngày đó chưa được xếp lịch làm việc (Lark hiểu ngày đó là ngày nghỉ sẵn, dẫn đến không thể xin nghỉ phép thêm).
- **Cách giải quyết**: Quản lý cần đặt lịch (chọn một ca bất kỳ) cho ngày đó, sau đó nhân viên mới có thể gửi đề xuất nghỉ phép thành công.
