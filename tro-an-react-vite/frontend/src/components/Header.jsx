import { useState } from 'react'

export default function Header({ user, page, navigate, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const go = (target) => { setMenuOpen(false); navigate(target) }

  return (
    <>
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>Trang thông tin phòng trọ dành cho người thuê và chủ trọ</span>
          <div><span>Hotline hỗ trợ: <b>0876 052 006</b></span><span className="top-divider" /> <button onClick={() => go('/post-room')}>Đăng tin cho thuê</button></div>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-main">
          <button className="brand" onClick={() => go('/')} aria-label="Trọ An - Trang chủ">
            <span className="brand-icon">T<span>A</span></span>
            <span className="brand-copy"><b>TRỌ<span>AN</span></b><small>Ở tốt, sống an tâm</small></span>
          </button>
          <div className="header-search-hint"><span className="search-hint-icon">⌕</span><span><b>Tìm phòng trọ trên toàn quốc</b><small>Hàng ngàn lựa chọn phù hợp ngân sách</small></span></div>
          <div className="header-account">
            {user ? (
              <>
                <button className="header-user" onClick={() => go(user.role === 'admin' ? '/admin' : '/account')}>
                  <span className="user-avatar">{(user.full_name || 'U').slice(0, 1).toUpperCase()}</span>
                  <span className="header-user-copy"><b>{user.full_name || 'Tài khoản'}</b><small>{user.role === 'admin' ? 'Quản trị viên' : 'Tài khoản của tôi'}</small></span>
                  <span className="chevron">⌄</span>
                </button>
                <button className="header-text-button" onClick={onLogout}>Đăng xuất</button>
              </>
            ) : (
              <>
                <button className="header-text-button" onClick={() => go('/login')}>Đăng nhập</button>
                <button className="header-register" onClick={() => go('/register')}>Đăng ký</button>
              </>
            )}
            <button className="post-button" onClick={() => go(user ? '/post-room' : '/login')}><span>＋</span> Đăng tin miễn phí</button>
          </div>
          <button className="mobile-menu-button" aria-label="Mở menu" onClick={() => setMenuOpen((value) => !value)}>☰</button>
        </div>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          <div className="container main-nav-inner">
            <button className={page === 'home' ? 'active' : ''} onClick={() => go('/')}>Trang chủ</button>
            <button onClick={() => go('/')}>Cho thuê phòng trọ</button>
            <button onClick={() => go('/favorites')}>Tin đã lưu</button>
            <button onClick={() => go(user ? '/post-room' : '/register')}>Dành cho chủ trọ</button>
            {user && <button className={page === 'account' ? 'active' : ''} onClick={() => go(user.role === 'admin' ? '/admin' : '/account')}>{user.role === 'admin' ? 'Quản trị' : 'Quản lý tin'}</button>}
          </div>
        </nav>
      </header>
    </>
  )
}
