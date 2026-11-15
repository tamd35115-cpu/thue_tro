# Cập nhật liên hệ người đăng bằng Zalo

## Những thay đổi

- Khi đăng ký, backend tự chuẩn hóa số điện thoại và tạo `https://zalo.me/<so-dien-thoai>`, sau đó lưu vào `users.zalo_link`.
- Nếu người dùng đổi số điện thoại ở phần hồ sơ, backend tạo lại `zalo_link` tương ứng.
- API chi tiết phòng trả `owner_zalo_link` để giao diện hiển thị nút **Nhắn tin qua Zalo**.
- Với tài khoản cũ chưa có giá trị `zalo_link`, backend tạm tạo link từ `users.phone` khi trả chi tiết phòng.
- Phần `contact_requests`, cron hết hạn và tab yêu cầu liên hệ cũ được giữ nguyên; trang chi tiết phòng không gửi yêu cầu liên hệ mới nữa.

## Cơ sở dữ liệu

Backend đang sử dụng cột `users.zalo_link` kiểu `VARCHAR(255)` (cho phép `NULL`). Bạn đã thêm cột này trong database thì không cần chạy thêm lệnh `ALTER TABLE`.

Có thể kiểm tra cột bằng:

```sql
SHOW COLUMNS FROM users LIKE 'zalo_link';
```

## Cách áp dụng

1. Giải nén gói cập nhật vào thư mục cha của dự án để ghi đè các file mã nguồn tương ứng.
2. Giữ nguyên các file `.env` đang có trong máy của bạn. Gói cập nhật không chứa `.env`, `node_modules` hoặc `.git`.
3. Khởi động lại backend và frontend.
4. Tạo một tài khoản thử nghiệm rồi kiểm tra:

```sql
SELECT id, full_name, phone, zalo_link
FROM users
ORDER BY id DESC
LIMIT 5;
```

5. Mở trang chi tiết một tin đăng của tài khoản khác và bấm **Nhắn tin qua Zalo**.

## Lưu ý về link Zalo

Link theo số điện thoại chỉ mở đúng tài khoản nếu số đó đang được dùng cho Zalo và cài đặt quyền riêng tư của tài khoản cho phép người khác tìm thấy qua số điện thoại. Link có chứa số điện thoại, nên người đăng cần đồng ý công khai cách liên hệ này.
