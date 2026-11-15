import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import RoomDetailPage from './pages/RoomDetailPage.jsx'
import RoomFormPage from './pages/RoomFormPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import { api, clearSession, getToken, normalizeUser, saveSession, storedUser, unwrapData } from './services/api.js'

function resolve(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { page: 'home' }
  if (path === '/login') return { page: 'login' }
  if (path === '/register') return { page: 'register' }
  if (path === '/account') return { page: 'account' }
  if (path === '/favorites') return { page: 'favorites' }
  if (path === '/admin') return { page: 'admin' }
  if (path === '/post-room') return { page: 'post-room' }
  const edit = path.match(/^\/rooms\/(\d+)\/edit$/)
  if (edit) return { page: 'edit-room', roomId: edit[1] }
  const room = path.match(/^\/rooms\/(\d+)$/)
  if (room) return { page: 'room', roomId: room[1] }
  return { page: 'not-found' }
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname)
  const [user, setUser] = useState(() => storedUser())
  const [notice, setNotice] = useState(null)
  const route = useMemo(() => resolve(pathname), [pathname])

  const navigate = useCallback((target) => {
    const url = new URL(target, window.location.origin)
    if (window.location.pathname + window.location.search !== url.pathname + url.search) {
      window.history.pushState({}, '', url.pathname + url.search)
    }
    setPathname(url.pathname)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const notify = useCallback((message, type = 'success') => {
    setNotice({ message, type, key: Date.now() })
  }, [])

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!getToken()) return undefined
    let alive = true
    api.get('/auth/me').then((result) => {
      if (!alive) return
      const nextUser = normalizeUser(unwrapData(result))
      setUser(nextUser)
      saveSession(getToken(), nextUser)
    }).catch(() => {
      if (!alive) return
      clearSession(); setUser(null)
    })
    return () => { alive = false }
  }, [])

  const handleLoginSuccess = ({ accessToken, user: nextUser }) => {
    const normalized = normalizeUser(nextUser)
    saveSession(accessToken, normalized)
    setUser(normalized)
    notify(`Xin chào ${normalized.full_name || 'bạn'}!`, 'success')
    navigate(normalized.role === 'admin' ? '/admin' : '/account')
  }

  const handleLogout = async () => {
    try { await api.post('/auth/logout', {}) } catch { /* Vẫn xóa phiên ở trình duyệt khi API không phản hồi. */ }
    clearSession(); setUser(null); navigate('/'); notify('Bạn đã đăng xuất.', 'success')
  }

  const requireLogin = () => { notify('Vui lòng đăng nhập để sử dụng chức năng này.', 'warning'); navigate('/login') }
  const updateUser = (updated) => {
    const normalized = normalizeUser(updated)
    setUser(normalized)
    saveSession(getToken(), normalized)
  }

  const page = route.page
  const authPage = page === 'login' || page === 'register'
  const adminAllowed = user?.role === 'admin'

  return (
    <div className="app-shell">
      {!authPage && <Header user={user} page={page} navigate={navigate} onLogout={handleLogout} />}
      {notice && <div className={`toast toast-${notice.type}`} role="status"><span>{notice.type === 'error' ? '!' : notice.type === 'warning' ? 'i' : '✓'}</span><p>{notice.message}</p><button onClick={() => setNotice(null)} aria-label="Đóng">×</button></div>}
      {page === 'home' && <HomePage api={api} user={user} navigate={navigate} notify={notify} onRequireLogin={requireLogin} />}
      {authPage && <AuthPage mode={page} api={api} navigate={navigate} onSuccess={handleLoginSuccess} notify={notify} />}
      {page === 'room' && <RoomDetailPage key={route.roomId} roomId={route.roomId} api={api} user={user} navigate={navigate} notify={notify} onRequireLogin={requireLogin} />}
      {page === 'post-room' && (user ? <RoomFormPage api={api} navigate={navigate} notify={notify} /> : <AuthPage mode="login" api={api} navigate={navigate} onSuccess={handleLoginSuccess} notify={notify} />)}
      {page === 'edit-room' && (user ? <RoomFormPage key={route.roomId} roomId={route.roomId} api={api} navigate={navigate} notify={notify} /> : <AuthPage mode="login" api={api} navigate={navigate} onSuccess={handleLoginSuccess} notify={notify} />)}
      {page === 'account' && (user ? <AccountPage user={user} api={api} navigate={navigate} notify={notify} onUserUpdated={updateUser} onLogout={handleLogout} /> : <AuthPage mode="login" api={api} navigate={navigate} onSuccess={handleLoginSuccess} notify={notify} />)}
      {page === 'favorites' && <FavoritesPage api={api} navigate={navigate} user={user} notify={notify} onRequireLogin={requireLogin} />}
      {page === 'admin' && (adminAllowed ? <AdminPage user={user} api={api} notify={notify} /> : <main className="container page-state"><h2>Khu vực dành cho quản trị viên</h2><p>Bạn cần đăng nhập bằng tài khoản có vai trò admin.</p><button className="primary-submit narrow-button" onClick={() => navigate(user ? '/account' : '/login')}>Tiếp tục</button></main>)}
      {page === 'not-found' && <NotFoundPage navigate={navigate} />}
      {!authPage && <Footer navigate={navigate} />}
    </div>
  )
}
