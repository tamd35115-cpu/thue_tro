import { useEffect, useState } from 'react'
import { normalizeRoom, unwrapData, unwrapList } from '../services/api.js'
import { money, dateText } from '../utils/format.js'

export default function AdminPage({ user, api, notify }) {
  const [rooms, setRooms] = useState([])
  const [users, setUsers] = useState([])
  const [dashboard, setDashboard] = useState({ users: 0, rooms: 0, pending_rooms: 0, active_contact_requests: 0 })
  const [tab, setTab] = useState('rooms')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    const [dashboardResult, roomResult, userResult] = await Promise.allSettled([
      api.get('/admin/dashboard'), api.get('/admin/rooms?limit=50'), api.get('/admin/users?limit=50'),
    ])
    if (dashboardResult.status === 'fulfilled') setDashboard(unwrapData(dashboardResult.value) || dashboard)
    if (roomResult.status === 'fulfilled') setRooms(unwrapList(roomResult.value).map(normalizeRoom))
    if (userResult.status === 'fulfilled') setUsers(unwrapList(userResult.value))
    const failed = [dashboardResult, roomResult, userResult].filter((item) => item.status === 'rejected')
    if (failed.length) setError(failed.map((item) => item.reason?.message).filter(Boolean).join(' · '))
    setLoading(false)
  }

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const moderate = async (room, action) => {
    setBusyId(room.id)
    try {
      await api.patch(`/admin/rooms/${room.id}/${action}`, {})
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action
      setRooms((old) => old.map((item) => item.id === room.id ? { ...item, status } : item))
      notify(action === 'approve' ? 'Đã duyệt tin đăng.' : 'Đã từ chối tin đăng.', 'success')
      setDashboard((old) => ({ ...old, pending_rooms: Math.max(0, old.pending_rooms - (room.status === 'pending' ? 1 : 0)) }))
    } catch (requestError) {
      notify(requestError.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const toggleUser = async (item) => {
    const locked = item.account_status === 'locked'
    const action = locked ? 'unlock' : 'lock'
    setBusyId(item.id)
    try {
      await api.patch(`/admin/users/${item.id}/${action}`, {})
      setUsers((old) => old.map((entry) => entry.id === item.id
        ? { ...entry, account_status: locked ? 'active' : 'locked' }
        : entry))
      notify(locked ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.', 'success')
    } catch (requestError) {
      notify(requestError.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const pending = rooms.filter((room) => room.status === 'pending').length

  return (
    <main className="container admin-page">
      <div className="admin-heading">
        <div><span className="section-kicker">KHU VỰC QUẢN TRỊ</span><h1>Bảng điều khiển</h1><p>Xin chào {user.full_name}. Theo dõi nội dung và hoạt động trên Trọ An.</p></div>
        <button className="secondary-submit" onClick={load} disabled={loading}>↻ Làm mới dữ liệu</button>
      </div>
      <div className="admin-stats">
        <article><span>TỔNG TIN ĐĂNG</span><b>{dashboard.rooms ?? rooms.length}</b><small>Danh sách tin trên hệ thống</small></article>
        <article><span>CHỜ DUYỆT</span><b>{dashboard.pending_rooms ?? pending}</b><small>Cần kiểm tra nội dung</small></article>
        <article><span>YÊU CẦU LIÊN HỆ</span><b>{dashboard.active_contact_requests ?? 0}</b><small>Yêu cầu đang xử lý</small></article>
        <article><span>TÀI KHOẢN</span><b>{dashboard.users ?? users.length}</b><small>Người dùng đã đăng ký</small></article>
      </div>
      <div className="admin-workspace">
        <nav className="admin-tabs">
          <button className={tab === 'rooms' ? 'active' : ''} onClick={() => setTab('rooms')}>Duyệt tin đăng <b>{pending}</b></button>
          <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Người dùng <b>{users.length}</b></button>
        </nav>
        <section className="admin-content">
          {error && <div className="inline-error">{error}</div>}
          {loading ? <div className="loading-panel"><span className="spinner" /> Đang tải...</div> : <>
            {tab === 'rooms' && <>
              <div className="account-section-head"><div><h2>Quản lý tin đăng</h2><p>Kiểm tra thông tin và hình ảnh trước khi công khai.</p></div><span className="count-pill">{rooms.length} tin</span></div>
              {rooms.length ? <div className="admin-list">{rooms.map((room) => <article className="admin-room-item" key={room.id}>
                <div className="admin-room-thumb">{room.cover_image ? <img src={room.cover_image} alt="" /> : '⌂'}</div>
                <div className="admin-room-info"><b>{room.title}</b><span>{room.address_detail}, {room.commune_name}, {room.province_name}</span><strong>{money(room.price)} / tháng · {room.area} m²</strong><small>{room.owner_name} · {dateText(room.created_at)}</small></div>
                <div className="admin-room-actions"><span className={`status-label status-${room.status}`}>{room.status === 'pending' ? 'Chờ duyệt' : room.status === 'rejected' ? 'Từ chối' : room.status === 'hidden' ? 'Đã ẩn' : 'Đã duyệt'}</span>
                  {room.status !== 'approved' && <button disabled={busyId === room.id} onClick={() => moderate(room, 'approve')}>Duyệt</button>}
                  {room.status !== 'rejected' && <button className="danger-text" disabled={busyId === room.id} onClick={() => moderate(room, 'reject')}>Từ chối</button>}
                </div>
              </article>)}</div> : <div className="empty-inline"><h3>Chưa có tin đăng</h3></div>}
            </>}
            {tab === 'users' && <>
              <div className="account-section-head"><div><h2>Quản lý tài khoản</h2><p>Theo dõi vai trò và trạng thái người dùng.</p></div><span className="count-pill">{users.length} tài khoản</span></div>
              {users.length ? <div className="contact-table-wrap"><table className="contact-table"><thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{users.map((item) => {
                const locked = item.account_status === 'locked'
                return <tr key={item.id}><td><b>{item.full_name}</b><small>{item.phone}</small></td><td>{item.email}</td><td>{item.role}</td><td>{locked ? 'Đã khóa' : 'Hoạt động'}</td><td><button disabled={busyId === item.id || item.role === 'admin'} onClick={() => toggleUser(item)}>{locked ? 'Mở khóa' : 'Khóa'}</button></td></tr>
              })}</tbody></table></div> : <div className="empty-inline"><h3>Không có dữ liệu người dùng</h3></div>}
            </>}
          </>}
        </section>
      </div>
    </main>
  )
}
