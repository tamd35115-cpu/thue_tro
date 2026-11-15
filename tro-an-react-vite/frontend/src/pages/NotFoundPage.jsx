export default function NotFoundPage({ navigate }) {
  return <main className="container not-found"><span>404</span><h1>Không tìm thấy trang</h1><p>Đường dẫn có thể đã thay đổi hoặc trang không còn tồn tại.</p><button className="primary-submit narrow-button" onClick={() => navigate('/')}>Về trang chủ</button></main>
}
