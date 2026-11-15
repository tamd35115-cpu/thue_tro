import { useEffect, useState } from 'react'
import { normalizeRoom, unwrapData, unwrapList } from '../services/api.js'
import { dateText, money } from '../utils/format.js'

const TABS = [
  ['rooms', 'Tin đăng của tôi'],
  ['contacts', 'Yêu cầu liên hệ'],
  ['notifications', 'Thông báo'],
  ['favorites', 'Tin đã lưu'],
  ['profile', 'Thông tin tài khoản'],
]

export default function AccountPage({ user, api, navigate, notify, onUserUpdated, onLogout }) {
  const [active, setActive] = useState('rooms')
  const [rooms, setRooms] = useState([])
  const [favorites, setFavorites] = useState([])
  const [receivedContacts, setReceivedContacts] = useState([])
  const [sentContacts, setSentContacts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const [profile, setProfile] = useState({
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
  })
  const [password, setPassword] = useState({
    current_password: '',
    new_password: '',
  })

  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const loadAll = async () => {
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([
      api.get('/rooms/mine'),
      api.get('/favorites'),
      api.get('/contact-requests/received'),
      api.get('/contact-requests/sent'),
      api.get('/notifications?limit=30'),
    ])

    if (results[0].status === 'fulfilled') {
      setRooms(unwrapList(results[0].value).map(normalizeRoom))
    }
    if (results[1].status === 'fulfilled') {
      setFavorites(unwrapList(results[1].value).map((item) => normalizeRoom(item.room ?? item)))
    }
    if (results[2].status === 'fulfilled') {
      setReceivedContacts(unwrapList(results[2].value))
    }
    if (results[3].status === 'fulfilled') {
      setSentContacts(unwrapList(results[3].value))
    }
    if (results[4].status === 'fulfilled') {
      const notificationData = unwrapData(results[4].value) || {}
      setNotifications(unwrapList(results[4].value))
      setUnreadCount(Number(notificationData.unread_count || 0))
    }

    const failure = results.find((item) => item.status === 'rejected')
    if (failure) {
      setError(failure.reason?.message || 'Một số dữ liệu chưa tải được.')
    }
    setLoading(false)
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadAll())
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateContactStatus = async (contactId, action) => {
    setBusyId(contactId)
    const endpoint = {
      called: 'called',
      reached: 'confirm-reached',
      notReached: 'confirm-not-reached',
      cancel: 'cancel',
    }[action]

    try {
      await api.patch(`/contact-requests/${contactId}/${endpoint}`, {})
      await loadAll()
      const messages = {
        called: 'Đã ghi nhận bạn đã liên hệ với người tìm phòng.',
        reached: 'Đã xác nhận bạn nhận được liên hệ.',
        notReached: 'Đã ghi nhận bạn chưa nhận được liên hệ.',
        cancel: 'Đã hủy yêu cầu liên hệ.',
      }
      notify(messages[action], 'success')
    } catch (requestError) {
      notify(requestError.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const markNotificationRead = async (notification) => {
    if (notification.read_at) return
    try {
      await api.patch(`/notifications/${notification.id}/read`, {})
      setNotifications((old) =>
        old.map((item) =>
          item.id === notification.id
            ? { ...item, read_at: new Date().toISOString() }
            : item
        )
      )
      setUnreadCount((old) => Math.max(0, old - 1))
    } catch (requestError) {
      notify(requestError.message, 'error')
    }
  }

  const markAllNotificationsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {})
      setNotifications((old) =>
        old.map((item) => ({
          ...item,
          read_at: item.read_at || new Date().toISOString(),
        }))
      )
      setUnreadCount(0)
      notify('Đã đánh dấu tất cả thông báo là đã đọc.', 'success')
    } catch (requestError) {
      notify(requestError.message, 'error')
    }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    try {
      const result = await api.patch('/users/me', {
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
      })
      const updated = unwrapData(result) ?? { ...user, ...profile }
      onUserUpdated(updated)
      notify('Đã cập nhật thông tin tài khoản.', 'success')
    } catch (requestError) {
      notify(requestError.message, 'error')
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    try {
      await api.patch('/users/me/password', {
        current_password: password.current_password,
        new_password: password.new_password,
      })
      setPassword({ current_password: '', new_password: '' })
      notify('Đã cập nhật mật khẩu.', 'success')
    } catch (requestError) {
      notify(requestError.message, 'error')
    }
  }

  const hideRoom = async (room) => {
    if (!window.confirm('Bạn muốn xóa tin đăng này?')) return
    try {
      await api.delete(`/rooms/${room.id}`)
      setRooms((old) => old.filter((item) => item.id !== room.id))
      notify('Đã xóa tin đăng.', 'success')
    } catch (requestError) {
      notify(requestError.message, 'error')
    }
  }

  const renderRoomStatus = (status) => {
    if (status === 'pending' || status === 'cho_duyet') return 'Chờ duyệt'
    if (status === 'rejected' || status === 'tu_choi') return 'Bị từ chối'
    if (status === 'hidden' || status === 'da_an') return 'Đã ẩn'
    return 'Đang hiển thị'
  }

  return (
    <main className="container account-page">
      {/* Header */}
      <div className="account-heading">
        <div>
          <span className="section-kicker">KHÔNG GIAN CỦA BẠN</span>
          <h1>Xin chào, {user.full_name || 'bạn'}!</h1>
          <p>Quản lý tin đăng, yêu cầu liên hệ và thông tin cá nhân.</p>
        </div>
        <button className="primary-submit narrow-button" onClick={() => navigate('/post-room')}>
          ＋ Đăng tin mới
        </button>
      </div>

      <div className="account-layout">
        {/* Sidebar Menu */}
        <aside className="account-menu">
          <div className="account-user-card">
            <span className="account-avatar">
              {(user.full_name || 'U').slice(0, 1).toUpperCase()}
            </span>
            <b>{user.full_name}</b>
            <small>{user.email}</small>
          </div>

          {TABS.map(([key, label]) => (
            <button
              key={key}
              className={active === key ? 'active' : ''}
              onClick={() => setActive(key)}
            >
              <span>
                {key === 'rooms'
                  ? '▤'
                  : key === 'contacts'
                  ? '✉'
                  : key === 'notifications'
                  ? '●'
                  : key === 'favorites'
                  ? '♡'
                  : '♙'}
              </span>
              {label}
              {key === 'notifications' && unreadCount > 0 && (
                <small className="notification-count">{unreadCount}</small>
              )}
              <b>›</b>
            </button>
          ))}

          <button className="account-logout" onClick={onLogout}>
            ↪ Đăng xuất
          </button>
        </aside>

        {/* Workspace Content */}
        <section className="account-workspace">
          {error && <div className="inline-error">{error}</div>}

          {loading ? (
            <div className="loading-panel">
              <span className="spinner" /> Đang tải dữ liệu...
            </div>
          ) : (
            <>
              {/* Tab: Tin đăng của tôi */}
              {active === 'rooms' && (
                <div className="account-section">
                  <div className="account-section-head">
                    <div>
                      <h2>Tin đăng của tôi</h2>
                      <p>Theo dõi trạng thái các phòng bạn đang cho thuê.</p>
                    </div>
                    <span className="count-pill">{rooms.length} tin</span>
                  </div>

                  {rooms.length ? (
                    rooms.map((room) => (
                      <article className="manage-room-card" key={room.id}>
                        <div className="manage-room-image">
                          {room.cover_image ? <img src={room.cover_image} alt="" /> : '⌂'}
                        </div>
                        <div className="manage-room-info">
                          <b>{room.title}</b>
                          <span>
                            {room.commune_name}, {room.province_name}
                          </span>
                          <strong>{money(room.price)} / tháng</strong>
                          <small>Ngày đăng: {dateText(room.created_at)}</small>
                        </div>
                        <div className="manage-room-actions">
                          <span className={`status-label status-${room.status}`}>
                            {renderRoomStatus(room.status)}
                          </span>
                          <button onClick={() => navigate(`/rooms/${room.id}/edit`)}>
                            Chỉnh sửa
                          </button>
                          <button className="danger-text" onClick={() => hideRoom(room)}>
                            Xóa tin
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="empty-inline">
                      <span>▤</span>
                      <h3>Bạn chưa có tin đăng nào</h3>
                      <p>Đăng phòng đầu tiên để kết nối với người đang tìm chỗ ở.</p>
                      <button
                        className="primary-submit narrow-button"
                        onClick={() => navigate('/post-room')}
                      >
                        Đăng tin ngay
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Yêu cầu liên hệ */}
              {active === 'contacts' && (
                <div className="account-section">
                  <div className="account-section-head">
                    <div>
                      <h2>Yêu cầu liên hệ</h2>
                      <p>
                        Theo dõi yêu cầu bạn nhận được với tư cách chủ trọ và yêu cầu bạn đã gửi
                        khi tìm phòng.
                      </p>
                    </div>
                    <span className="count-pill">
                      {receivedContacts.length + sentContacts.length} yêu cầu
                    </span>
                  </div>

                  {receivedContacts.length + sentContacts.length ? (
                    <div className="contact-table-wrap">
                      <table className="contact-table">
                        <thead>
                          <tr>
                            <th>Loại yêu cầu</th>
                            <th>Người liên hệ</th>
                            <th>Phòng quan tâm</th>
                            <th>Ngày gửi</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receivedContacts.map((item) => (
                            <tr key={`received-${item.id}`}>
                              <td>
                                <b>Bạn nhận được</b>
                              </td>
                              <td>
                                <b>{item.customer_name || 'Người tìm phòng'}</b>
                                <small>{item.customer_phone}</small>
                                <small>{item.customer_email}</small>
                              </td>
                              <td>{item.room_title || `Phòng #${item.room_id}`}</td>
                              <td>{dateText(item.first_requested_at)}</td>
                              <td>
                                <span className={`status-label status-${item.status}`}>
                                  {item.status === 'new'
                                    ? 'Chờ bạn liên hệ'
                                    : item.status === 'called'
                                    ? 'Chờ người tìm xác nhận'
                                    : 'Đã đóng'}
                                </span>
                              </td>
                              <td>
                                {item.status === 'new' && (
                                  <button
                                    disabled={busyId === item.id}
                                    onClick={() => updateContactStatus(item.id, 'called')}
                                  >
                                    Xác nhận đã liên hệ
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}

                          {sentContacts.map((item) => (
                            <tr key={`sent-${item.id}`}>
                              <td>
                                <b>Bạn đã gửi</b>
                              </td>
                              <td>
                                <b>{item.owner_name || 'Chủ trọ'}</b>
                                <small>{item.message || 'Bạn đã gửi yêu cầu liên hệ.'}</small>
                              </td>
                              <td>{item.room_title || `Phòng #${item.room_id}`}</td>
                              <td>{dateText(item.first_requested_at)}</td>
                              <td>
                                <span className={`status-label status-${item.status}`}>
                                  {item.status === 'new'
                                    ? 'Chờ chủ trọ liên hệ'
                                    : item.status === 'called'
                                    ? 'Chờ bạn xác nhận'
                                    : item.close_reason === 'completed'
                                    ? 'Đã liên hệ thành công'
                                    : item.close_reason === 'not_reached'
                                    ? 'Chưa nhận được liên hệ'
                                    : item.close_reason === 'expired'
                                    ? 'Hết hạn'
                                    : 'Đã đóng'}
                                </span>
                              </td>
                              <td>
                                {item.status === 'called' && (
                                  <>
                                    <button
                                      disabled={busyId === item.id}
                                      onClick={() => updateContactStatus(item.id, 'reached')}
                                    >
                                      Đã nhận liên hệ
                                    </button>
                                    <button
                                      className="danger-text"
                                      disabled={busyId === item.id}
                                      onClick={() => updateContactStatus(item.id, 'notReached')}
                                    >
                                      Chưa nhận được
                                    </button>
                                  </>
                                )}
                                {item.status === 'new' && (
                                  <button
                                    className="danger-text"
                                    disabled={busyId === item.id}
                                    onClick={() => updateContactStatus(item.id, 'cancel')}
                                  >
                                    Hủy yêu cầu
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-inline">
                      <span>✉</span>
                      <h3>Chưa có yêu cầu liên hệ</h3>
                      <p>
                        Khi có người quan tâm phòng của bạn hoặc khi bạn gửi yêu cầu thuê phòng,
                        thông tin sẽ xuất hiện tại đây.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Thông báo */}
              {active === 'notifications' && (
                <div className="account-section">
                  <div className="account-section-head">
                    <div>
                      <h2>Thông báo</h2>
                      <p>Cập nhật về yêu cầu liên hệ và trạng thái tin đăng của bạn.</p>
                    </div>
                    <div className="notification-actions">
                      <span className="count-pill">{unreadCount} chưa đọc</span>
                      <button
                        className="secondary-submit"
                        disabled={unreadCount === 0}
                        onClick={markAllNotificationsRead}
                      >
                        Đọc tất cả
                      </button>
                      <button className="secondary-submit" onClick={loadAll}>
                        ↻ Làm mới
                      </button>
                    </div>
                  </div>

                  {notifications.length ? (
                    <div className="notification-list">
                      {notifications.map((notification) => (
                        <article
                          key={notification.id}
                          className={`notification-item ${
                            notification.read_at ? '' : 'unread'
                          }`}
                        >
                          <div className="notification-dot">
                            {notification.read_at ? '✓' : '●'}
                          </div>
                          <div className="notification-copy">
                            <b>{notification.title}</b>
                            <p>{notification.message}</p>
                            <small>
                              {dateText(notification.created_at)} ·{' '}
                              {notification.read_at ? 'Đã đọc' : 'Chưa đọc'}
                            </small>
                          </div>
                          {!notification.read_at && (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(notification)}
                            >
                              Đánh dấu đã đọc
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-inline">
                      <span>●</span>
                      <h3>Chưa có thông báo</h3>
                      <p>Thông báo về yêu cầu liên hệ và tin đăng sẽ hiển thị tại đây.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Tin đã lưu */}
              {active === 'favorites' && (
                <div className="account-section">
                  <div className="account-section-head">
                    <div>
                      <h2>Tin đã lưu</h2>
                      <p>Danh sách phòng trọ bạn muốn xem lại.</p>
                    </div>
                    <span className="count-pill">{favorites.length} tin</span>
                  </div>

                  {favorites.length ? (
                    <div className="compact-favorite-list">
                      {favorites.map((room) => (
                        <button key={room.id} onClick={() => navigate(`/rooms/${room.id}`)}>
                          <span>
                            {room.cover_image ? <img src={room.cover_image} alt="" /> : '⌂'}
                          </span>
                          <b>{room.title}</b>
                          <strong>{money(room.price)}</strong>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-inline">
                      <span>♡</span>
                      <h3>Danh sách yêu thích đang trống</h3>
                      <p>Lưu những phòng phù hợp để dễ dàng xem lại.</p>
                      <button className="secondary-submit" onClick={() => navigate('/')}>
                        Tìm phòng ngay
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Thông tin tài khoản */}
              {active === 'profile' && (
                <div className="account-section">
                  <div className="account-section-head">
                    <div>
                      <h2>Thông tin tài khoản</h2>
                      <p>Cập nhật thông tin để chủ trọ có thể liên hệ với bạn.</p>
                    </div>
                  </div>

                  <div className="profile-grid">
                    <form className="profile-card" onSubmit={saveProfile}>
                      <h3>Thông tin cá nhân</h3>
                      <label>
                        Họ và tên
                        <input
                          value={profile.full_name}
                          onChange={(e) =>
                            setProfile((old) => ({ ...old, full_name: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Email
                        <input type="email" value={profile.email} disabled />
                      </label>
                      <label>
                        Số điện thoại
                        <input
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile((old) => ({ ...old, phone: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <button className="primary-submit">Lưu thay đổi</button>
                    </form>

                    <form className="profile-card" onSubmit={changePassword}>
                      <h3>Đổi mật khẩu</h3>
                      <label>
                        Mật khẩu hiện tại
                        <input
                          type="password"
                          value={password.current_password}
                          onChange={(e) =>
                            setPassword((old) => ({ ...old, current_password: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Mật khẩu mới
                        <input
                          type="password"
                          minLength="8"
                          value={password.new_password}
                          onChange={(e) =>
                            setPassword((old) => ({ ...old, new_password: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <button className="secondary-submit">Cập nhật mật khẩu</button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}