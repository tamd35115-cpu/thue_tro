import { useEffect, useState } from 'react'
import { normalizeRoom, unwrapData, unwrapList } from '../services/api.js'
import { dateText, fullMoney } from '../utils/format.js'

export default function RoomDetailPage({ roomId, api, user, navigate, notify, onRequireLogin }) {
  const [room, setRoom] = useState(null)
  const [reviews, setReviews] = useState([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([
      api.get(`/rooms/${roomId}`),
      api.get(`/rooms/${roomId}/reviews`).catch(() => ({ data: [] })),
    ]).then(([roomResult, reviewResult]) => {
      if (!alive) return
      setRoom(normalizeRoom(unwrapData(roomResult)))
      setReviews(unwrapList(reviewResult))
    }).catch((requestError) => { if (alive) setError(requestError.message) })
    return () => { alive = false }
  }, [roomId]) // eslint-disable-line react-hooks/exhaustive-deps


  const addReview = async (event) => {
    event.preventDefault()
    if (!user) { onRequireLogin(); return }
    setBusy('review')
    try {
      await api.post(`/rooms/${roomId}/reviews`, {
        rating: Number(reviewForm.rating), comment: reviewForm.comment.trim() || null,
      })
      const result = await api.get(`/rooms/${roomId}/reviews`)
      setReviews(unwrapList(result))
      setReviewForm({ rating: 5, comment: '' })
      notify('Đã gửi đánh giá.', 'success')
    } catch (requestError) { notify(requestError.message, 'error') }
    finally { setBusy('') }
  }

  if (error) return <main className="container page-state"><h2>Không thể tải thông tin phòng</h2><p>{error}</p><button className="primary-submit narrow-button" onClick={() => navigate('/')}>Quay lại danh sách</button></main>
  if (!room) return <main className="container loading-panel detail-loading"><span className="spinner" /> Đang tải thông tin phòng...</main>
  const images = room.images?.length ? room.images : room.cover_image ? [room.cover_image] : []
  const ownerName = room.owner_name || room.tenChuTro || 'Chủ trọ'
  const ownerZaloLink = room.owner_zalo_link || ''

  return (
    <main className="container detail-page">
      <div className="breadcrumb"><button onClick={() => navigate('/')}>Trang chủ</button><b>›</b><span>Chi tiết phòng trọ</span></div>
      <div className="detail-title-row"><div><span className="section-kicker">THÔNG TIN PHÒNG CHO THUÊ</span><h1>{room.title}</h1><p>⌖ {room.address_detail}, {room.commune_name}, {room.province_name}</p></div><div className="detail-price"><strong>{fullMoney(room.price)}</strong><span>/ tháng</span></div></div>
      <div className="detail-layout">
        <div className="detail-content">
          <section className="detail-gallery">
            <div className="detail-main-image">{images[0] ? <img src={images[selectedImage] || images[0]} alt={room.title} /> : <span>⌂</span>}</div>
            {images.length > 1 && <div className="detail-thumbnails">{images.map((image, index) => <button key={`${image}-${index}`} className={selectedImage === index ? 'selected' : ''} onClick={() => setSelectedImage(index)}><img src={image} alt={`Ảnh phòng ${index + 1}`} /></button>)}</div>}
          </section>
          <section className="detail-panel"><h2>Thông tin chi tiết</h2><div className="detail-facts"><div><small>MỨC GIÁ</small><b>{fullMoney(room.price)} / tháng</b></div><div><small>DIỆN TÍCH</small><b>{room.area} m²</b></div><div><small>KHU VỰC</small><b>{room.commune_name || 'Đang cập nhật'}</b></div><div><small>NGÀY ĐĂNG</small><b>{dateText(room.created_at)}</b></div></div><h3>Mô tả phòng</h3><p className="detail-description">{room.description || 'Chủ trọ chưa cập nhật mô tả chi tiết.'}</p><p className="detail-address"><b>Địa chỉ:</b> {room.address_detail}, {room.commune_name}, {room.province_name}</p></section>
          <section className="detail-panel"><div className="panel-title-row"><h2>Đánh giá từ người thuê</h2><span className="review-average">★ {room.rating || '—'} <small>({room.review_count || reviews.length} đánh giá)</small></span></div>
            {reviews.length ? <div className="review-list">{reviews.map((review) => <article className="review-item" key={review.id}><span className="review-avatar">{(review.full_name || review.hoTen || 'U').slice(0, 1)}</span><div><b>{review.full_name || review.hoTen || 'Người dùng'}</b><span className="review-stars">{'★'.repeat(Math.round(review.rating ?? review.soSao ?? 5))}</span><p>{review.comment || review.binhLuan || 'Không có nội dung.'}</p></div></article>)}</div> : <p className="muted">Chưa có đánh giá cho phòng này.</p>}
            {user && String(room.user_id) !== String(user.id) && <form className="review-form" onSubmit={addReview}><h3>Chia sẻ đánh giá của bạn</h3><label>Số sao<select value={reviewForm.rating} onChange={(event) => setReviewForm((old) => ({ ...old, rating: Number(event.target.value) }))}><option value="5">5 sao - Rất tốt</option><option value="4">4 sao - Tốt</option><option value="3">3 sao - Bình thường</option><option value="2">2 sao - Chưa tốt</option><option value="1">1 sao - Không hài lòng</option></select></label><label>Nhận xét<textarea rows="3" maxLength="2000" value={reviewForm.comment} onChange={(event) => setReviewForm((old) => ({ ...old, comment: event.target.value }))} placeholder="Chia sẻ trải nghiệm của bạn..." /></label><button className="secondary-submit" disabled={busy === 'review'}>{busy === 'review' ? 'Đang gửi...' : 'Gửi đánh giá'}</button></form>}
          </section>
        </div>
        <aside className="detail-sidebar">
          <section className="owner-card"><h3>Thông tin người cho thuê</h3><div className="owner-profile"><span className="owner-avatar">{ownerName.slice(0, 1).toUpperCase()}</span><div><b>{ownerName}</b><small>Người đăng tin</small></div></div>
            {String(room.user_id) === String(user?.id) ? (
              <div className="contact-success">Đây là tin đăng của bạn.</div>
            ) : ownerZaloLink ? (
              <div className="zalo-contact-block">
                <h4>Liên hệ trực tiếp với người đăng</h4>
                <p>Nhắn tin cho chủ trọ qua Zalo để hỏi thêm thông tin và hẹn lịch xem phòng.</p>
                <a
                  className="zalo-chat-button"
                  href={ownerZaloLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="zalo-chat-mark">Zalo</span>
                  Nhắn tin qua Zalo
                </a>
              </div>
            ) : (
              <p className="muted">Người đăng chưa có liên kết Zalo.</p>
            )}
            <p className="safety-note">Không chuyển tiền đặt cọc khi chưa xem phòng và xác minh người cho thuê.</p>
          </section>
          <section className="sidebar-box detail-save-box"><button onClick={() => { if (!user) onRequireLogin(); else api.post(`/favorites/${room.id}`, {}).then(() => notify('Đã lưu tin yêu thích.', 'success')).catch((requestError) => notify(requestError.message, 'error')) }}>♡ Lưu tin này</button><button onClick={() => navigate('/')}>← Quay lại kết quả tìm kiếm</button></section>
        </aside>
      </div>
    </main>
  )
}
