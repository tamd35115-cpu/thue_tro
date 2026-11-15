import { useEffect, useState } from 'react'
import RoomCard from '../components/RoomCard.jsx'
import Sidebar from '../components/Sidebar.jsx'
import { normalizeRoom, unwrapList, unwrapPagination } from '../services/api.js'

const initialFilters = { q: '', tinh: '', xa: '', minPrice: '', maxPrice: '', minArea: '', maxArea: '' }
const cities = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'];

function buildQuery(filters, page, sort) {
  const query = new URLSearchParams()
  const pairs = {
    keyword: filters.q,
    province_name: filters.tinh,
    commune_name: filters.xa,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    min_area: filters.minArea,
    max_area: filters.maxArea,
    page,
    limit: 8,
    sort,
  }
  Object.entries(pairs).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) query.set(key, value)
  })
  return query.toString()
}

export default function HomePage({ api, user, navigate, notify, onRequireLogin }) {
  const [filters, setFilters] = useState(initialFilters)
  const [draft, setDraft] = useState(initialFilters)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [rooms, setRooms] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favoriteIds, setFavoriteIds] = useState([])

  const load = async (nextFilters = filters, nextPage = page, nextSort = sort) => {
    try {
      const result = await api.get(`/rooms?${buildQuery(nextFilters, nextPage, nextSort)}`)
      const list = unwrapList(result).map(normalizeRoom)
      setRooms(list)
      setPagination(unwrapPagination(result))
    } catch (requestError) {
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        setRooms(demoRooms.map(normalizeRoom))
        setPagination({ page: 1, total: demoRooms.length, totalPages: 1 })
      } else {
        setRooms([])
        setPagination(null)
        setError(requestError.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void Promise.resolve().then(() => load(initialFilters, 1, 'newest')) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) { setFavoriteIds([]); return undefined }
    let alive = true
    api.get('/favorites').then((result) => {
      if (!alive) return
      const ids = unwrapList(result).map((item) => Number(item.room_id ?? item.id)).filter(Number.isFinite)
      setFavoriteIds(ids)
    }).catch(() => { if (alive) setFavoriteIds([]) })
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateDraft = (event) => setDraft((old) => ({ ...old, [event.target.name]: event.target.value }))
  const submitSearch = (event) => {
    event.preventDefault()
    setFilters(draft)
    setPage(1)
    setLoading(true); setError('')
    void load(draft, 1, sort)
  }
  const quickFilter = (next) => {
    if (next.openRoomId) { navigate(`/rooms/${next.openRoomId}`); return }
    const updated = { ...initialFilters, ...next };
    setDraft(updated)
    setFilters(updated)
    setPage(1)
    setLoading(true); setError('')
    void load(updated, 1, sort)
  }
  const changeSort = (event) => {
    const value = event.target.value
    setSort(value)
    setPage(1)
    setLoading(true); setError('')
    void load(filters, 1, value)
  }
  const changePage = (nextPage) => {
    setPage(nextPage)
    setLoading(true); setError('')
    void load(filters, nextPage, sort)
    window.scrollTo({ top: 500, behavior: 'smooth' })
  }

  const toggleFavorite = async (room) => {
    if (!user) { onRequireLogin(); return }
    const id = Number(room.id)
    const alreadySaved = favoriteIds.includes(id)
    try {
      const favoriteKey = room.id
      if (alreadySaved) {
        await api.delete(`/favorites/${favoriteKey}`)
        setFavoriteIds((old) => old.filter((item) => item !== id))
        notify('Đã bỏ phòng khỏi danh sách yêu thích.', 'success')
      } else {
        await api.post(`/favorites/${favoriteKey}`, {})
        setFavoriteIds((old) => [...old, id])
        notify('Đã lưu phòng vào danh sách yêu thích.', 'success')
      }
    } catch (requestError) { notify(requestError.message, 'error') }
  }

  return (
    <main className="home-page">
      <section className="home-intro">
        <div className="container">
          <div className="breadcrumb"><span>Trang chủ</span><b>›</b><span>Cho thuê phòng trọ</span></div>
          <h1>Cho thuê phòng trọ, nhà trọ <span>giá tốt</span></h1>
          <p className="intro-description">Tìm phòng nhanh theo khu vực, mức giá và diện tích. Xem thông tin rõ ràng, kết nối trực tiếp với người cho thuê.</p>
          <div className="intro-stats"><span><b>01</b> Tìm theo nhu cầu</span><i /> <span><b>02</b> Xem tin chi tiết</span><i /> <span><b>03</b> Chủ động liên hệ</span></div>
        </div>
      </section>

      <section className="container search-wrap" id="search">
        <form className="traditional-search" onSubmit={submitSearch}>
          <label className="search-control keyword-control"><span className="control-icon">⌕</span><span className="control-text"><small>Từ khóa</small><input name="q" value={draft.q} onChange={updateDraft} placeholder="Nhập tên đường, khu vực, từ khóa..." /></span></label>
          <label className="search-control"><span className="control-icon">⌖</span><span className="control-text"><small>Tỉnh / thành phố</small><select name="tinh" value={draft.tinh} onChange={updateDraft}><option value="">Toàn quốc</option>{cities.map((city) => <option key={city}>{city}</option>)}</select></span></label>
          <label className="search-control"><span className="control-icon">▦</span><span className="control-text"><small>Giá thuê</small><select value={`${draft.minPrice}|${draft.maxPrice}`} onChange={(event) => { const [minPrice, maxPrice] = event.target.value.split('|'); setDraft((old) => ({ ...old, minPrice, maxPrice })) }}><option value="|">Tất cả mức giá</option><option value="0|2000000">Dưới 2 triệu</option><option value="2000000|3000000">2 – 3 triệu</option><option value="3000000|5000000">3 – 5 triệu</option><option value="5000000|7000000">5 – 7 triệu</option><option value="7000000|">Trên 7 triệu</option></select></span></label>
          <label className="search-control"><span className="control-icon">▱</span><span className="control-text"><small>Diện tích</small><select value={`${draft.minArea}|${draft.maxArea}`} onChange={(event) => { const [minArea, maxArea] = event.target.value.split('|'); setDraft((old) => ({ ...old, minArea, maxArea })) }}><option value="|">Tất cả diện tích</option><option value="0|20">Dưới 20 m²</option><option value="20|30">20 – 30 m²</option><option value="30|50">30 – 50 m²</option><option value="50|">Trên 50 m²</option></select></span></label>
          <button className="search-submit" type="submit"><span>⌕</span> Tìm kiếm</button>
        </form>
        <div className="popular-areas"><b>Khu vực phổ biến:</b>{cities.slice(0, 4).map((city) => <button key={city} onClick={() => quickFilter({ tinh: city })}>{city}</button>)}</div>
      </section>

      <section className="container location-shortcuts">
        <div className="location-heading"><div><span className="section-kicker">KHÁM PHÁ KHU VỰC</span><h2>Tìm phòng theo tỉnh thành</h2></div><span className="heading-note">Chọn nơi bạn muốn sinh sống</span></div>
        <div className="location-grid">
          <button className="location-tile location-hanoi" onClick={() => quickFilter({ tinh: 'Hà Nội' })}><span className="location-tile-label">THỦ ĐÔ</span><b>Phòng trọ Hà Nội</b><small>Khám phá phòng cho thuê <span>→</span></small></button>
          <button className="location-tile location-hcm" onClick={() => quickFilter({ tinh: 'Hồ Chí Minh' })}><span className="location-tile-label">THÀNH PHỐ NĂNG ĐỘNG</span><b>Phòng trọ TP. Hồ Chí Minh</b><small>Khám phá phòng cho thuê <span>→</span></small></button>
          <button className="location-tile location-dn" onClick={() => quickFilter({ tinh: 'Đà Nẵng' })}><span className="location-tile-label">THÀNH PHỐ BIỂN</span><b>Phòng trọ Đà Nẵng</b><small>Khám phá phòng cho thuê <span>→</span></small></button>
        </div>
      </section>

      <section className="container listing-layout">
        <div className="listing-main">
          <div className="listing-heading">
            <div><span className="section-kicker">DANH SÁCH TIN ĐĂNG</span><h2>Phòng trọ mới nhất</h2><p>Tin đăng đã được kiểm duyệt và đang mở cho thuê.</p></div>
            <label className="sort-select"><span>Sắp xếp:</span><select value={sort} onChange={changeSort}><option value="newest">Mới nhất</option><option value="price_asc">Giá thấp trước</option><option value="price_desc">Giá cao trước</option></select></label>
          </div>
          {error && <div className="inline-error"><b>Không tải được danh sách phòng.</b> {error}{' '}<button onClick={() => load(filters, page, sort)}>Thử lại</button></div>}
          {import.meta.env.VITE_DEMO_MODE === 'true' && <div className="demo-notice">Đang bật chế độ xem minh họa. Dữ liệu này không lấy từ cơ sở dữ liệu.</div>}
          {loading ? <div className="loading-panel"><span className="spinner" /> Đang tải tin đăng...</div> : rooms.length ? (
            <>
              <div className="result-count">Tìm thấy <b>{pagination?.total ?? rooms.length}</b> phòng trọ phù hợp</div>
              <div className="room-list">{rooms.map((room) => <RoomCard key={room.id} room={room} onSelect={(id) => navigate(`/rooms/${id}`)} onFavorite={toggleFavorite} isFavorite={Boolean(user && favoriteIds.includes(Number(room.id)))} />)}</div>
              {Number(pagination?.totalPages || 1) > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => changePage(page - 1)}>← Trước</button><span>Trang <b>{page}</b> / {pagination.totalPages}</span><button disabled={page >= pagination.totalPages} onClick={() => changePage(page + 1)}>Sau →</button></div>}
            </>
          ) : !error ? <div className="empty-results"><span>⌂</span><h3>Chưa có phòng phù hợp</h3><p>Hãy thử thay đổi khu vực hoặc mức giá để tìm thêm lựa chọn.</p><button onClick={() => { setDraft(initialFilters); setFilters(initialFilters); setPage(1); setLoading(true); setError(''); void load(initialFilters, 1, 'newest') }}>Xóa bộ lọc</button></div> : null}
        </div>
        <Sidebar onQuickFilter={quickFilter} rooms={rooms} />
      </section>

      <section className="container how-section"><div className="how-copy"><span className="section-kicker">THUÊ PHÒNG ĐƠN GIẢN</span><h2>Ba bước để tìm<br />nơi ở phù hợp</h2><p>Trọ An giúp bạn tiếp cận thông tin phòng trọ thuận tiện hơn và chủ động liên hệ với người cho thuê.</p><button onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}>Bắt đầu tìm phòng <span>→</span></button></div><div className="how-steps"><article><b>01</b><div><h3>Tìm kiếm theo nhu cầu</h3><p>Chọn tỉnh thành, khoảng giá và diện tích phù hợp.</p></div></article><article><b>02</b><div><h3>Xem thông tin phòng</h3><p>Tham khảo hình ảnh, mô tả, địa chỉ và đánh giá.</p></div></article><article><b>03</b><div><h3>Gửi yêu cầu liên hệ</h3><p>Để lại thông tin, kết nối trực tiếp với chủ trọ.</p></div></article></div></section>
      <section className="container landlord-cta"><div><span className="section-kicker">DÀNH CHO CHỦ TRỌ</span><h2>Bạn đang có phòng trống?</h2><p>Đăng tin miễn phí để tiếp cận người đang có nhu cầu thuê phòng.</p></div><button onClick={() => navigate(user ? '/post-room' : '/register')}>Đăng tin ngay <span>→</span></button></section>
    </main>
  )
}
