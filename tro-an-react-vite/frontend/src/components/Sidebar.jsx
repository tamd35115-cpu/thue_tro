import { money } from '../utils/format.js'

const priceLinks = [
  ['Dưới 2 triệu', 0, 2_000_000], ['Từ 2 – 3 triệu', 2_000_000, 3_000_000],
  ['Từ 3 – 5 triệu', 3_000_000, 5_000_000], ['Từ 5 – 7 triệu', 5_000_000, 7_000_000],
]
const areaLinks = [['Dưới 20 m²', 0, 20], ['20 – 30 m²', 20, 30], ['30 – 50 m²', 30, 50], ['Trên 50 m²', 50, 500]]

export default function Sidebar({ onQuickFilter, rooms = [] }) {
  const latest = [...rooms].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 4)
  return (
    <aside className="home-sidebar">
      <section className="sidebar-box">
        <h3><span className="sidebar-heading-icon">⌕</span> Tìm theo khoảng giá</h3>
        <div className="sidebar-link-list">{priceLinks.map(([label, minPrice, maxPrice]) => <button key={label} onClick={() => onQuickFilter({ minPrice, maxPrice })}><span>{label}</span><b>›</b></button>)}</div>
      </section>
      <section className="sidebar-box">
        <h3><span className="sidebar-heading-icon">▱</span> Tìm theo diện tích</h3>
        <div className="sidebar-link-list">{areaLinks.map(([label, minArea, maxArea]) => <button key={label} onClick={() => onQuickFilter({ minArea, maxArea })}><span>{label}</span><b>›</b></button>)}</div>
      </section>
      <section className="sidebar-box latest-box">
        <h3><span className="sidebar-heading-icon">◷</span> Tin mới đăng</h3>
        {latest.length ? latest.map((room) => <button className="latest-room" key={room.id} onClick={() => onQuickFilter({ openRoomId: room.id })}>
          <span className="latest-room-thumb">{room.cover_image ? <img src={room.cover_image} alt="" /> : '⌂'}</span>
          <span className="latest-room-info"><b>{room.title}</b><strong>{money(room.price)} / tháng</strong><small>{room.province_name}</small></span>
        </button>) : <p className="sidebar-empty">Tin mới sẽ được hiển thị tại đây.</p>}
      </section>
      <section className="sidebar-help">
        <div className="help-icon">?</div><h3>Cần hỗ trợ tìm phòng?</h3><p>Chuẩn bị mức giá, khu vực và diện tích mong muốn để lọc kết quả nhanh hơn.</p><a href="https://mail.google.com/mail/?view=cm&fs=1&to=tamd35117@gmail.com" target="_blank">
  tamd35117@gmail.com
</a>
      </section>
    </aside>
  )
}
