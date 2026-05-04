# Hướng Dẫn Sử Dụng Hệ Thống Chấm Công Dành Cho Phòng Nhân Sự

## 1. Cập Nhật Danh Sách Nhân Viên

- Mở bảng **Thông Tin Nhân Viên**, view **Cần chấm công**.
- Nếu nhân viên nào không cần chấm công, hãy tick vào ô **Không Cần Chấm Công** để ẩn đi khỏi danh sách.
- Nếu nhân viên nào đã nghỉ việc (không cần tính lương cho tháng đó), hãy tick vào ô **Đã Nghỉ Việc** để ẩn khỏi danh sách.

## 2. Điều Chỉnh Giờ Công

- Dành cho các trường hợp HR hỗ trợ điều chỉnh giờ công cho nhân viên: Ví dụ: 1-2 ngày đầu nhân viên đi làm chưa được đồng bộ trong bảng lương, hoặc các trường hợp đặc biệt khác.
    - Đây là tính năng của hệ thống chấm công, nên 1-2 ngày đầu chưa setup chấm công, hoặc có chấm công nhưng sẽ không được đồng bộ sang file Kết Quả Chấm Công, cần HR chủ động cộng số ngày nhân viên đi làm đầu tiên vào bảng Tổng Kết Chấm Công.
- Truy cập bảng Tổng Kết Ngày Công và cập nhật thông tin ở các cột tương ứng:
    - Điều chỉnh ngày công
    - Điều chỉnh OT ngày thường
    - Điều chỉnh OT cuối tuần
    - Giải Thích Các Điều Chỉnh
    - HR Xác Nhận
- Kiểm tra các cột **Ngày Công, OT Ngày Thường, OT Cuối tuần** đã được cập nhật theo điều chỉnh.

## 3. Ghi Nhận Ngày Lễ/Sự Kiện Nghỉ Có Lương Của Công Ty

- Dùng để ghi nhận các ngày lễ, ngày nghỉ sự kiện có lương (ví dụ như Company Trips).

**CỰC KỲ LƯU Ý: Cần thiết lập ngày lễ ở hai nơi Lark Attendance và Kết Quả Chấm Công cho hai mục đích khác nhau, do Lark chưa hỗ trợ đồng bộ ngày lễ từ Lark Attendance về file Kết Quả Chấm Công (sẽ được cập nhật lại khi Lark hỗ trợ tốt hơn):**

- Setup ngày lễ ở **Lark Attendance** TRƯỚC KHI ngày lễ diễn ra để nhân viên có thể gửi OT vào ngày lễ.
    - Ví dụ: Nếu không setup, NV Văn Phòng (có ca làm trong 9h-18h), nếu tăng ca từ 8h-10h, sẽ không thể gửi approval cho giờ đó được, vì Lark vẫn hiểu đó là giờ làm việc bình thường.
- Setup ngày lễ trong file **Kết Quả Chấm Công** để có thể công thức tính giờ công cho các ngày lễ tự động.

### 3.1 Setup Trên Lark Attendance

- Truy cập **Attendance**.
- Vào phần **Holiday**
- Bấm vào tên lịch nghỉ tương ứng (có hai lịch tương ứng với hai team là Văn Phòng và Sales).
- Bấm **Create** để tạo ngày nghỉ mới.
- Nhập thông tin chi tiết và bấm **Confirm** để hoàn tất.
    - Name: Tên ngày nghỉ (ví dụ Tết Âm Lịch 2025).
    - Start and end dates: Ngày bắt đầu và kết thúc ngày nghỉ (ví dụ 25/01/2025 - 03/02/2025).
    - Festival date: Ngày nghỉ được trả lương (ví dụ: 25/01, 27/01, 28/01, 29/01, 30/01, 31/01)
    - Working day in lieu: Ngày đi làm bù (ví dụ: 19/01).

### 3.2 Setup Trên File Kết Quả Chấm Công

- Truy cập bảng **Ngày Lễ-Sự Kiện**.
- Nhập **Tên Ngày Nghỉ** và **Ngày**. Nếu ngày nghỉ kéo dài nhiều ngày, mỗi ngày tạo thành 1 dòng. Ví dụ. Nếu Company Trip kéo dài 3 ngày, 15-16-17 tháng 8. Nhập thành 3 dòng:
    - Company Trip Ngày 1 - 13/08/2024.
    - Company Trip Ngày 2 - 14/08/2024.
    - Company Trip Ngày 3 - 15/08/2024.
- Kiểm tra ở bảng **Chấm Công Hàng Ngày** để xác nhận có hiệu lực: Nhân viên không cần chấm công, hệ thống sẽ ghi nhận ngày đó là 1 ngày công - 8 tiếng.

## 4. Cập Nhật Ngày Phép Của Nhân Viên

- Đây là hướng dẫn cho trường hợp điều chỉnh một vài nhân viên (số lượng ít). Nếu cần điều chỉnh hàng loạt, liên hệ phòng Công Nghệ để được hỗ trợ.
- Truy cập mục **Leave Balance**.
- Tìm nhân viên cần điều chỉnh và bấm **Details**:
- Bấm **Modify Balance**
- Nhập chi tiết để thêm, bớt ngày phép tương ứng.

## 5. Điều Chỉnh Thời Gian Tự Động Chạy Các Tác Vụ

- Một số tác vụ được thiết lập để tự động chạy khi đến thời điểm nhất định. Hướng dẫn này sẽ giúp phòng Nhân Sự có khả năng tự điều chỉnh các thời gian này theo nhu cầu thực tế.

Để thực hiện, tiến hành các bước sau:

1. Truy cập bảng **Tác Vụ Tự**
2. 
3. **Động** (trong cùng file).
4. Điều chỉnh thời gian tương ứng ở ba cột: **Ngày** , **Giờ** , **Phút** **=> Hoàn tất**
5. [Tùy chọn] Xem thời gian được trình bày dễ hiểu ở cột **Giải Thích**

**Note:** Khi cần thêm tác vụ tự động nào mới, hãy gửi ticket yêu cầu đến phòng Công Nghệ để được hỗ trợ thiết lập.