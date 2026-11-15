# Backend website thuê trọ

Backend REST API sử dụng **Node.js 20+, Express 4, MySQL 8, JWT và Cloudinary**. Cấu trúc MVC + Service Layer. Backend chỉ kết nối người tìm phòng với người đăng tin, **không nhận hoặc giữ tiền và không có chức năng thanh toán**.

## 1. Yêu cầu

- Node.js 20 trở lên và npm.
- MySQL 8 (hoặc phiên bản MySQL tương thích với `CHECK` và `JSON`).
- Tài khoản Cloudinary nếu muốn upload ảnh.
- Database gốc được tạo từ file `database/schema.sql` (bản sao SQL gốc bạn đã cung cấp).

## 2. Cài đặt

Mở terminal tại thư mục `backend`:

```bash
npm install
```

Tạo file `.env` bằng cách sao chép `.env.example`, sau đó điền thông tin MySQL, JWT secret và Cloudinary.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Tạo 2 JWT secret ngẫu nhiên khác nhau (mỗi chuỗi ít nhất 32 ký tự). Không đưa `.env` lên GitHub.

## 3. Chuẩn bị database

1. Mở MySQL Workbench hoặc công cụ quản lý MySQL.
2. Chạy toàn bộ file `database/schema.sql` để tạo database `thue_tro` và 7 bảng gốc.
3. Chạy tiếp `database/migrations/001_contact_notifications_moderation.sql` đúng một lần.
4. Nếu database đã tồn tại trước bản sửa này, chạy thêm `database/migrations/002_review_rating_scale.sql` đúng một lần. Nếu tạo mới database từ `schema.sql` vừa cập nhật thì không cần chạy migration `002`.

Migration `001` thêm email và thời hạn cho yêu cầu liên hệ, cho phép gửi lại sau khi yêu cầu cũ đóng, đồng thời tạo bảng `notifications` và `room_moderation_logs`. Migration này có `DROP INDEX uq_contact_requests_room_customer`; chỉ chạy sau `database/schema.sql` và chỉ một lần. Migration `002` đồng bộ thang điểm đánh giá về 1–5 sao; chỉ chạy một lần nếu database đã tạo từ schema cũ có ràng buộc 0–10.

## 4. Chạy server

```bash
npm run dev
```

API mặc định: `http://localhost:3000/api/v1`

Kiểm tra: `GET http://localhost:3000/api/v1/health`

## 5. Tạo tài khoản admin đầu tiên

Đăng ký tài khoản bình thường qua `/auth/register`. Sau đó, chỉ trong môi trường phát triển, đổi role tài khoản đó bằng MySQL Workbench:

```sql
UPDATE users SET role = 'admin' WHERE email = 'email-cua-ban@example.com';
```

Không tạo endpoint đăng ký admin công khai. Tài khoản admin phải được cấp quyền từ thao tác quản trị đáng tin cậy.

## 6. API chính

Tất cả API có prefix `/api/v1`. API yêu cầu đăng nhập nhận header:

```http
Authorization: Bearer <accessToken>
```

Refresh token được đặt trong cookie `httpOnly`; frontend cần gửi `withCredentials: true` cho request login/refresh/logout và cấu hình CORS đúng origin.

### Auth

Các phản hồi thành công dùng định dạng `{ success, message, data }`. Access token nằm trong `data.accessToken`; refresh token chỉ nằm trong cookie `httpOnly`.

| Method | Endpoint | Quyền |
|---|---|---|
| POST | `/auth/register` | Công khai |
| POST | `/auth/login` | Công khai |
| POST | `/auth/refresh` | Cookie refresh |
| POST | `/auth/logout` | Cookie refresh |
| POST | `/auth/logout-all` | Đã đăng nhập |
| GET | `/auth/me` | Đã đăng nhập |

### User

| Method | Endpoint | Quyền |
|---|---|---|
| PATCH | `/users/me` | Đã đăng nhập |
| PATCH | `/users/me/password` | Đã đăng nhập |

### Rooms và ảnh

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/rooms` | Công khai; chỉ tin approved |
| GET | `/rooms/:id` | Công khai; chủ phòng/admin xem được tin chưa duyệt |
| GET | `/rooms/mine` | Đã đăng nhập |
| GET | `/rooms/mine/:id` | Chủ phòng; lấy chi tiết tin của chính mình để chỉnh sửa |
| POST | `/rooms` | Đã đăng nhập; tạo tin pending |
| PATCH | `/rooms/:id` | Chủ phòng; sửa sẽ chuyển tin về pending |
| DELETE | `/rooms/:id` | Chủ phòng; xóa mềm |
| POST | `/rooms/:id/images` | Chủ phòng; multipart field `images`, tối đa 10 ảnh, 5MB/ảnh |
| DELETE | `/rooms/:id/images/:imageId` | Chủ phòng |
| PATCH | `/rooms/:id/images/:imageId/cover` | Chủ phòng |

Bộ lọc `GET /rooms`: `keyword`, `province_name`, `commune_name`, `min_price`, `max_price`, `min_area`, `max_area`, `sort` (`newest`, `price_asc`, `price_desc`, `area_desc`), `page`, `limit`. Frontend mặc định gọi API tại `http://localhost:3000/api/v1` (cấu hình gốc `http://localhost:3000` trong `VITE_API_URL`).

### Favorites và reviews

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/favorites` | Đã đăng nhập |
| POST | `/favorites/:roomId` | Đã đăng nhập |
| DELETE | `/favorites/:roomId` | Đã đăng nhập |
| GET | `/favorites/:roomId/check` | Đã đăng nhập |
| GET | `/rooms/:roomId/reviews` | Công khai |
| POST | `/rooms/:roomId/reviews` | Đã đăng nhập |
| PATCH | `/reviews/:id` | Chủ đánh giá hoặc admin |
| DELETE | `/reviews/:id` | Chủ đánh giá hoặc admin |

### Contact requests

| Method | Endpoint | Quyền |
|---|---|---|
| POST | `/contact-requests/rooms/:roomId` | Người tìm đã đăng nhập |
| GET | `/contact-requests/sent` | Người gửi |
| GET | `/contact-requests/received` | Chủ phòng |
| GET | `/contact-requests/:id` | Người gửi, chủ phòng hoặc admin |
| PATCH | `/contact-requests/:id/called` | Chủ phòng |
| PATCH | `/contact-requests/:id/confirm-reached` | Người tìm |
| PATCH | `/contact-requests/:id/confirm-not-reached` | Người tìm |
| PATCH | `/contact-requests/:id/cancel` | Người tìm, khi còn new |

Quy trình: yêu cầu mới hết hạn sau 48 giờ; khi chủ phòng đánh dấu đã liên hệ, người tìm có 24 giờ để xác nhận. Nếu chưa nhận được liên hệ, người tìm chọn `confirm-not-reached`. Job kiểm tra mỗi 5 phút và tự đóng yêu cầu hết hạn. Hệ thống chỉ ghi nhận xác nhận của hai bên, không thể biết cuộc gọi thực tế có diễn ra hay không.

### Notifications và admin

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/notifications` | Đã đăng nhập |
| GET | `/notifications/unread-count` | Đã đăng nhập |
| PATCH | `/notifications/:id/read` | Chủ thông báo |
| PATCH | `/notifications/read-all` | Đã đăng nhập |
| GET | `/admin/dashboard` | Admin |
| GET | `/admin/users` | Admin |
| PATCH | `/admin/users/:id/lock` | Admin |
| PATCH | `/admin/users/:id/unlock` | Admin |
| DELETE | `/admin/users/:id` | Admin; xóa mềm |
| GET | `/admin/rooms` | Admin; hỗ trợ `status`, `page`, `limit` |
| PATCH | `/admin/rooms/:id/approve` | Admin |
| PATCH | `/admin/rooms/:id/reject` | Admin |
| PATCH | `/admin/rooms/:id/hide` | Admin |
| PATCH | `/admin/rooms/:id/restore` | Admin |

## 7. Cấu trúc thư mục

```text
backend/
├── database/migrations/
├── src/
│   ├── config/          # MySQL, Cloudinary, environment
│   ├── controllers/    # Nhận request, trả response
│   ├── services/       # Nghiệp vụ
│   ├── models/         # SQL queries
│   ├── routes/         # Khai báo API
│   ├── middlewares/    # Auth, role, validate, upload, error
│   ├── validations/    # Zod schemas
│   ├── jobs/           # Tác vụ chạy theo lịch
│   └── utils/          # Helper dùng chung
├── .env.example
├── package.json
└── server.js
```

## 8. Lưu ý trước khi đưa lên production

- Đăng ký public luôn tạo role `user`; không nhận `role` từ request.
- Cần cấu hình HTTPS, cookie `secure`, CORS domain production và secrets mạnh.
- Middleware upload kiểm tra MIME và dung lượng; với hệ thống thật nên bổ sung kiểm tra magic bytes/giải mã ảnh trước khi lưu.
- Cron job hiện chạy trong tiến trình API. Khi chạy nhiều bản sao backend, cần tách worker hoặc dùng distributed lock để tránh chạy job trùng.
- Danh sách admin hiện là phân trang cơ bản; có thể bổ sung tổng count/filter khi hoàn thiện dashboard.
- Backend này là nền tảng khởi đầu đã có các luồng chính, vẫn cần kiểm thử bằng Postman/Insomnia và đối chiếu cấu hình MySQL/Cloudinary thực tế trước khi triển khai công khai.
