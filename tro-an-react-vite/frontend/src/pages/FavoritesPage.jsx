import { useEffect, useState } from 'react'
import RoomCard from '../components/RoomCard.jsx'
import { normalizeRoom, unwrapList } from '../services/api.js'

export default function FavoritesPage({ api, navigate, user, notify, onRequireLogin }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!user) return
    let alive = true
    api.get('/favorites').then((result) => {
      if (alive) setRooms(unwrapList(result).map((item) => normalizeRoom(item.room ?? item)))
    }).catch((requestError) => { if (alive) setError(requestError.message) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const remove = async (room) => {
    try {
      await api.delete(`/favorites/${room.listing_id || room.id}`)
      setRooms((old) => old.filter((item) => item.id !== room.id))
      notify('Đã bỏ lưu tin.', 'success')
    } catch (requestError) { notify(requestError.message, 'error') }
  }
  return <main className="container saved-page"><div className="page-heading"><span className="section-kicker">DANH SÁCH CÁ NHÂN</span><h1>Tin đăng đã lưu</h1><p>Lưu lại những lựa chọn phù hợp để xem lại bất cứ lúc nào.</p></div>{!user ? <div className="empty-inline"><h3>Đăng nhập để xem tin đã lưu</h3><button className="primary-submit narrow-button" onClick={onRequireLogin}>Đăng nhập</button></div> : loading ? <div className="loading-panel"><span className="spinner" /> Đang tải danh sách...</div> : error ? <div className="inline-error">{error}</div> : rooms.length ? <div className="saved-room-grid">{rooms.map((room) => <div key={room.id}><RoomCard room={room} onSelect={(id) => navigate(`/rooms/${id}`)} /><button className="remove-saved" onClick={() => remove(room)}>Bỏ khỏi danh sách đã lưu</button></div>)}</div> : <div className="empty-inline"><span>♡</span><h3>Bạn chưa lưu tin đăng nào</h3><p>Nhấn biểu tượng trái tim ở tin đăng để lưu phòng yêu thích.</p><button className="secondary-submit" onClick={() => navigate('/')}>Khám phá phòng trọ</button></div>}</main>
}
