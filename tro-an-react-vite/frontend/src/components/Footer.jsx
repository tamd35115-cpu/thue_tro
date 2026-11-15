export default function Footer({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <button className="brand footer-brand" onClick={() => navigate('/')}>
            <span className="brand-icon">T<span>A</span></span>
            <span className="brand-copy"><b>TRỌ<span>AN</span></b><small>Ở tốt, sống an tâm</small></span>
          </button>
          <p>Kết nối người có nhu cầu thuê phòng với chủ trọ. Thông tin rõ ràng, tìm kiếm thuận tiện và chủ động liên hệ.</p>
        </div>
        <div><h4>Về Trọ An</h4><a href="#about">Giới thiệu</a><a href="#guide">Hướng dẫn sử dụng</a><a href="#terms">Điều khoản sử dụng</a></div>
        <div><h4>Dành cho người thuê</h4><a href="#search" onClick={(event) => { event.preventDefault(); navigate('/') }}>Tìm phòng trọ</a><a href="#saved" onClick={(event) => { event.preventDefault(); navigate('/favorites') }}>Phòng đã lưu</a><a href="#safety">Lưu ý khi thuê phòng</a></div>
        <div><h4>Dành cho chủ trọ</h4><a href="#post" onClick={(event) => { event.preventDefault(); navigate('/post-room') }}>Đăng tin cho thuê</a><a href="#manage" onClick={(event) => { event.preventDefault(); navigate('/account') }}>Quản lý tin đăng</a><a href="#support">Trung tâm hỗ trợ</a></div>
      </div>
      <div className="footer-bottom"><div className="container"><span>© {new Date().getFullYear()} Trọ An. Nền tảng kết nối thuê trọ.</span><span>Thông tin đăng tải thuộc trách nhiệm của người đăng tin.</span></div></div>
    </footer>
  )
}
