# Trọ An — Frontend React + Vite

Frontend React + Vite cho website tìm kiếm và cho thuê phòng trọ. Giao diện tích hợp với backend Express/MySQL trong thư mục `thue_tro_backend`.

## 1. Cài đặt và chạy

Yêu cầu Node.js tương thích với Vite 8 (khuyến nghị Node.js 22.12 trở lên) và npm.

```bash
cd frontend
npm install
```

Tạo file `.env` từ `.env.example`:

```env
VITE_API_URL=http://localhost:3000
VITE_DEMO_MODE=false
```

Frontend tự thêm `/api/v1` vào URL trên. Bạn cũng có thể đặt trực tiếp `http://localhost:3000/api/v1`.

```bash
npm run dev
```

Build production:

```bash
npm run build
```

`VITE_DEMO_MODE=true` chỉ bật dữ liệu mẫu khi API không kết nối được; không dùng chế độ này khi kiểm thử dữ liệu thật.

## 2. Các màn hình

- Trang chủ: tìm kiếm theo từ khóa, tỉnh/thành, phường/xã, khoảng giá, diện tích; sắp xếp, phân trang, lưu tin yêu thích.
- Chi tiết phòng: thông tin phòng, ảnh, đánh giá và gửi yêu cầu liên hệ.
- Đăng nhập / đăng ký; access token và refresh cookie.
- Đăng tin / chỉnh sửa tin: thông tin phòng và tải ảnh trực tiếp từ thiết bị lên Cloudinary.
- Không gian người dùng: tin đã đăng, yêu cầu liên hệ đã nhận/đã gửi, thông báo, tin yêu thích, hồ sơ và đổi mật khẩu.
- Trang quản trị: duyệt/từ chối tin đăng, khóa/mở khóa tài khoản và xem số liệu tổng quan.

## 3. Luồng tích hợp API

Tất cả request được gửi đến backend với tiền tố `/api/v1`. API thành công trả về dạng `{ success, message, data }`; lớp `src/services/api.js` xử lý response, refresh token và chuẩn hóa dữ liệu.

Các nhóm endpoint frontend sử dụng:

| Nhóm | Endpoint chính |
|---|---|
| Xác thực | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` |
| Tài khoản | `/users/me`, `/users/me/password` |
| Phòng | `/rooms`, `/rooms/:id`, `/rooms/mine`, `/rooms/mine/:id`, `/rooms/:id/images` |
| Yêu thích | `/favorites`, `/favorites/:roomId` |
| Đánh giá | `/rooms/:roomId/reviews` |
| Liên hệ | `/contact-requests/rooms/:roomId`, `/contact-requests/sent`, `/contact-requests/received` và các thao tác trạng thái |
| Thông báo | `/notifications`, `/notifications/:id/read`, `/notifications/read-all` |
| Quản trị | `/admin/dashboard`, `/admin/rooms`, `/admin/users` |

### Luồng liên hệ

1. Người tìm phòng đăng nhập và gửi yêu cầu tại trang chi tiết phòng. Backend lấy họ tên, email và số điện thoại từ hồ sơ tài khoản; frontend chỉ gửi lời nhắn tùy chọn.
2. Chủ phòng xem yêu cầu trong mục **Yêu cầu liên hệ** và xác nhận đã liên hệ.
3. Kể từ thời điểm chủ phòng xác nhận, người tìm có thời hạn cấu hình trong backend để xác nhận đã nhận được liên hệ hoặc chưa nhận được.
4. Nếu hết hạn, job backend tự đóng yêu cầu và gửi thông báo cho hai bên. Người tìm cũng có thể hủy yêu cầu khi yêu cầu vẫn ở trạng thái mới.

Hệ thống chỉ ghi nhận trạng thái xác nhận của hai bên, không tự kiểm chứng cuộc gọi thực tế. Backend không xử lý thanh toán và không giữ tiền.

### Luồng ảnh phòng

1. Frontend tạo/cập nhật thông tin phòng qua `/rooms` hoặc `/rooms/:id`.
2. Ảnh được gửi dạng `multipart/form-data` với field `images` đến `/rooms/:id/images`.
3. Backend tải ảnh lên Cloudinary và lưu `cloudinary_public_id`, `image_url` trong bảng `room_images`.
4. Khi hiển thị phòng, frontend lấy danh sách URL ảnh từ API; khi xóa ảnh, backend xóa bản ghi và ảnh trên Cloudinary.

## 4. Cấu hình kết nối

- Backend mặc định chạy tại `http://localhost:3000`.
- Frontend mặc định chạy tại `http://localhost:5173`.
- Backend phải cho phép origin frontend trong `FRONTEND_URL` và bật credentials.
- Refresh token được lưu trong cookie `httpOnly`; frontend luôn gửi request với `credentials: include`.
- Cần cấu hình Cloudinary trong `.env` backend trước khi upload ảnh. Nếu chưa cấu hình, các API thông tin phòng vẫn dùng được nhưng tải ảnh sẽ trả lỗi rõ ràng.

## 5. Cấu trúc

```text
thue_tro_ui/
├── frontend/
│   ├── src/components/   # Header, footer, room card, sidebar
│   ├── src/pages/        # Trang chủ, chi tiết, auth, account, admin...
│   ├── src/services/     # API client, session, chuẩn hóa dữ liệu
│   ├── src/data/         # Dữ liệu demo
│   └── src/styles.css
└── README.md
```

Mã nguồn được đóng gói không kèm `node_modules`; cài dependency bằng `npm install` trong thư mục `frontend`.
