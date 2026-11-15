import { dateText, money } from '../utils/format.js'

export default function RoomCard({ room, onSelect, onFavorite, isFavorite = false }) {
  const image = room.cover_image || room.images?.[0]
  return (
    <article className="room-card">
      <button className="room-card-image" onClick={() => onSelect(room.id)} aria-label={`Xem ${room.title}`}>
        {image ? <img src={image} alt={room.title} loading="lazy" /> : <span className="image-fallback">⌂</span>}
        <span className="image-count">▧ {room.images?.length || 1} ảnh</span>
        <span className="room-status">Đang cho thuê</span>
      </button>
      <div className="room-card-content">
        <div className="room-card-meta"><span className="room-type">PHÒNG TRỌ</span><span>•</span><span>{dateText(room.created_at)}</span></div>
        <button className="room-card-title" onClick={() => onSelect(room.id)}>{room.title}</button>
        <div className="room-card-location"><span>⌖</span> {room.commune_name}{room.commune_name && room.province_name ? ', ' : ''}{room.province_name}</div>
        <p className="room-card-address">{room.address_detail}</p>
        <div className="room-card-specs"><span><b>▱</b>{room.area ? `${room.area} m²` : 'Chưa rõ diện tích'}</span><span><b>★</b>{room.rating ? `${room.rating}/5 (${room.review_count || 0})` : 'Chưa đánh giá'}</span></div>
        <div className="room-card-bottom">
          <div className="room-price"><strong>{money(room.price)}</strong><span>/ tháng</span></div>
          <button className={`favorite-button ${isFavorite ? 'saved' : ''}`} onClick={() => onFavorite?.(room)} aria-label={isFavorite ? 'Bỏ lưu tin' : 'Lưu tin'} title={isFavorite ? 'Bỏ lưu tin' : 'Lưu tin'}>{isFavorite ? '♥' : '♡'}</button>
          <button className="view-detail-button" onClick={() => onSelect(room.id)}>Xem chi tiết</button>
        </div>
      </div>
    </article>
  )
}
