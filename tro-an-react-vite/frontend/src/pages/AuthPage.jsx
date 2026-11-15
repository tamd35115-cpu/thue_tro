import { useState } from 'react'
import { normalizeUser, unwrapData } from '../services/api.js'

export default function AuthPage({ mode, api, navigate, onSuccess }) {
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true); setError('')
    const body = isRegister
      ? { full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password }
      : { email: form.email.trim(), password: form.password }
    try {
      const result = await api.post(isRegister ? '/auth/register' : '/auth/login', body)
      const payload = unwrapData(result)
      const user = normalizeUser(payload.user ?? {})
      const token = payload.accessToken ?? payload.access_token ?? ''
      if (!token || !user.id) throw new Error('Máy chủ chưa trả về đầy đủ thông tin phiên đăng nhập.')
      onSuccess({ accessToken: token, user })
    } catch (requestError) {
      setError(requestError.message)
    } finally { setBusy(false) }
  }

  return (
    <main className="auth-page container">
      <div className="auth-aside">
        <span className="section-kicker">TRỌ AN · KẾT NỐI THUÊ TRỌ</span>
        <h1>{isRegister ? 'Tạo tài khoản để bắt đầu hành trình mới.' : 'Chào mừng bạn quay trở lại.'}</h1>
        <p>{isRegister ? 'Lưu lại những căn phòng phù hợp, nhắn tin với chủ trọ qua Zalo và quản lý tin đăng ngay trên một nền tảng.' : 'Đăng nhập để xem phòng đã lưu, quản lý tin đăng và kết nối với chủ trọ qua Zalo.'}</p>
        <div className="auth-benefits"><span>✓ Tìm phòng theo khu vực và ngân sách</span><span>✓ Lưu tin đăng yêu thích</span><span>✓ Kết nối trực tiếp với chủ trọ</span></div>
        <div className="auth-aside-art"><span>⌂</span><div><b>Một nơi ở phù hợp</b><small>bắt đầu từ một tìm kiếm tốt</small></div></div>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-form-head"><span className="section-kicker">TÀI KHOẢN TRỌ AN</span><h2>{isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'}</h2><p>{isRegister ? 'Điền thông tin cơ bản để tạo tài khoản.' : 'Nhập thông tin tài khoản của bạn để tiếp tục.'}</p></div>
        {error && <div className="inline-error">{error}</div>}
        {isRegister && <label>Họ và tên<input name="full_name" value={form.full_name} onChange={update} placeholder="Họ tên" minLength="2" maxLength="120" required /></label>}
        <label>Email<input type="email" name="email" value={form.email} onChange={update} placeholder="Email" autoComplete="email" required /></label>
        {isRegister && <label>Số điện thoại<input name="phone" value={form.phone} onChange={update} placeholder="Số điện thoại" inputMode="numeric" maxLength="20" required /></label>}
        <label>Mật khẩu<input type="password" name="password" value={form.password} onChange={update} placeholder="Tối thiểu 8 ký tự" minLength="8" autoComplete={isRegister ? 'new-password' : 'current-password'} required /></label>
        <button className="primary-submit" disabled={busy}>{busy ? 'Đang xử lý...' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
        <div className="auth-switch">{isRegister ? 'Bạn đã có tài khoản?' : 'Bạn chưa có tài khoản?'} <button type="button" onClick={() => navigate(isRegister ? '/login' : '/register')}>{isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</button></div>
      </form>
    </main>
  )
}
