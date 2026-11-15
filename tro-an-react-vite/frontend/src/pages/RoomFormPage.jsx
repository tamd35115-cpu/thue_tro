import { useEffect, useState } from 'react'
import { makeRoomPayload, normalizeRoom, unwrapData } from '../services/api.js'

const emptyForm = {
  title: '', description: '', price: '', area: '',
  address_detail: '', province_name: '', commune_name: '',
}
const MAX_IMAGES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default function RoomFormPage({ roomId, api, navigate, notify }) {
  const [form, setForm] = useState(emptyForm)
  const [serverImages, setServerImages] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(Boolean(roomId))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!roomId) return undefined
    let alive = true
    api.get(`/rooms/mine/${roomId}`).then((result) => {
      if (!alive) return
      const room = normalizeRoom(unwrapData(result))
      setForm({
        title: room.title,
        description: room.description,
        price: String(room.price || ''),
        area: String(room.area || ''),
        address_detail: room.address_detail,
        province_name: room.province_name,
        commune_name: room.commune_name,
      })
      setServerImages(room.room_images || [])
    }).catch((requestError) => {
      if (alive) setError(requestError.message)
    }).finally(() => {
      if (alive) setLoading(false)
    })
    return () => { alive = false }
  }, [roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [selectedFiles])

  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }))

  const chooseImages = (event) => {
    const files = Array.from(event.target.files || [])
    const remaining = MAX_IMAGES - serverImages.length - selectedFiles.length
    const accepted = files.filter((file) => {
      if (!ALLOWED_TYPES.has(file.type)) {
        notify(`${file.name}: chỉ chấp nhận JPG, PNG hoặc WEBP.`, 'warning')
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        notify(`${file.name}: dung lượng ảnh không được vượt quá 5MB.`, 'warning')
        return false
      }
      return true
    })
    if (accepted.length > remaining) {
      notify(`Mỗi phòng tối đa ${MAX_IMAGES} ảnh. Bạn chỉ có thể chọn thêm ${remaining} ảnh.`, 'warning')
    }
    setSelectedFiles((old) => [...old, ...accepted.slice(0, Math.max(0, remaining))])
    event.target.value = ''
  }

  const removeSelectedImage = (index) => {
    setSelectedFiles((old) => old.filter((_, itemIndex) => itemIndex !== index))
  }

  const removeServerImage = async (image) => {
    if (!image.id) return
    try {
      const result = await api.delete(`/rooms/${roomId}/images/${image.id}`)
      const updated = unwrapData(result)
      setServerImages(Array.isArray(updated) ? updated : serverImages.filter((item) => item.id !== image.id))
      notify('Đã xóa ảnh khỏi tin đăng.', 'success')
    } catch (requestError) {
      notify(requestError.message, 'error')
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = makeRoomPayload(form)
      const result = roomId
        ? await api.patch(`/rooms/${roomId}`, payload)
        : await api.post('/rooms', payload)
      const savedRoom = unwrapData(result)
      const targetRoomId = savedRoom?.id ?? savedRoom?.room_id ?? roomId

      if (selectedFiles.length && targetRoomId) {
        const formData = new FormData()
        selectedFiles.forEach((file) => formData.append('images', file))
        try {
          await api.upload(`/rooms/${targetRoomId}/images`, formData)
        } catch (uploadError) {
          notify(`Thông tin phòng đã được lưu, nhưng tải ảnh chưa thành công: ${uploadError.message}`, 'warning')
          navigate('/account')
          return
        }
      }

      notify(result.message || (roomId ? 'Đã cập nhật tin phòng.' : 'Đã gửi tin phòng để duyệt.'), 'success')
      navigate('/account')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <main className="container loading-panel"><span className="spinner" /> Đang tải thông tin phòng...</main>

  return (
    <main className="container room-form-page">
      <div className="breadcrumb"><button onClick={() => navigate('/')}>Trang chủ</button><b>›</b><span>{roomId ? 'Chỉnh sửa tin đăng' : 'Đăng tin cho thuê'}</span></div>
      <div className="form-page-heading"><span className="section-kicker">DÀNH CHO NGƯỜI CHO THUÊ</span><h1>{roomId ? 'Cập nhật thông tin phòng' : 'Đăng tin cho thuê phòng'}</h1><p>Thông tin càng đầy đủ, người tìm phòng càng dễ đưa ra lựa chọn.</p></div>
      {error && <div className="inline-error">{error}</div>}
      <form className="room-form" onSubmit={submit}>
        <section className="form-section">
          <div className="form-section-title"><b>01</b><div><h2>Thông tin cơ bản</h2><p>Thông tin chính sẽ hiển thị trong kết quả tìm kiếm.</p></div></div>
          <label className="full-field">Tiêu đề tin đăng<input name="title" value={form.title} onChange={update} required minLength="5" maxLength="200" placeholder="Ví dụ: Phòng trọ mới xây, gần Đại học..." /></label>
          <div className="form-two-col"><label>Giá thuê (VNĐ / tháng)<input type="number" name="price" value={form.price} onChange={update} min="0" max="100000000000" required placeholder="3500000" /></label><label>Diện tích (m²)<input type="number" name="area" value={form.area} onChange={update} min="0.1" max="100000" step="0.1" required placeholder="25" /></label></div>
          <label className="full-field">Mô tả chi tiết<textarea name="description" value={form.description} onChange={update} rows="5" maxLength="10000" placeholder="Mô tả tiện ích, nội thất, giờ giấc, an ninh và các thông tin cần thiết..." /></label>
        </section>
        <section className="form-section">
          <div className="form-section-title"><b>02</b><div><h2>Địa chỉ phòng trọ</h2><p>Giúp người thuê tìm kiếm phòng theo tỉnh thành và khu vực.</p></div></div>
          <label className="full-field">Địa chỉ chi tiết<input name="address_detail" value={form.address_detail} onChange={update} required minLength="5" maxLength="255" placeholder="Số nhà, tên đường, khu phố..." /></label>
          <div className="form-two-col"><label>Tỉnh / thành phố<input name="province_name" value={form.province_name} onChange={update} required minLength="2" maxLength="120" placeholder="Hà Nội" /></label><label>Xã / phường<input name="commune_name" value={form.commune_name} onChange={update} required minLength="2" maxLength="120" placeholder="Phường Cầu Giấy" /></label></div>
        </section>
        <section className="form-section">
          <div className="form-section-title"><b>03</b><div><h2>Hình ảnh phòng</h2><p>Tải ảnh JPG, PNG hoặc WEBP trực tiếp từ thiết bị (tối đa 10 ảnh, 5MB/ảnh).</p></div></div>
          <label className="full-field">Chọn ảnh phòng<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} disabled={serverImages.length + selectedFiles.length >= MAX_IMAGES} /></label>
          {(serverImages.length > 0 || previews.length > 0) && <div className="room-image-preview-grid">
            {serverImages.map((image) => <div className="room-image-preview" key={image.id ?? image.image_url}><img src={image.image_url} alt="Ảnh phòng đã tải lên" /><button type="button" onClick={() => removeServerImage(image)} aria-label="Xóa ảnh">×</button>{image.is_cover && <small>Ảnh đại diện</small>}</div>)}
            {previews.map((url, index) => <div className="room-image-preview" key={url}><img src={url} alt={`Ảnh mới ${index + 1}`} /><button type="button" onClick={() => removeSelectedImage(index)} aria-label="Bỏ ảnh">×</button><small>Chưa tải lên</small></div>)}
          </div>}
        </section>
        <div className="form-submit-row"><button type="button" className="cancel-button" onClick={() => navigate('/account')}>Hủy</button><button className="primary-submit" disabled={busy}>{busy ? 'Đang lưu...' : roomId ? 'Lưu thay đổi' : 'Gửi tin đăng'}</button></div>
      </form>
    </main>
  )
}
