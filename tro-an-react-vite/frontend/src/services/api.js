const configuredBase = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");
const API_BASE = configuredBase.endsWith("/api/v1")
  ? configuredBase
  : `${configuredBase}/api/v1`;
const NO_REFRESH = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
]);
let refreshPromise = null;

function getFreshToken() {
  if (!refreshPromise) {
    refreshPromise = refreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function getToken() {
  return localStorage.getItem("troAnAccessToken") || "";
}

export function saveSession(accessToken, user) {
  if (accessToken) localStorage.setItem("troAnAccessToken", accessToken);
  if (user)
    localStorage.setItem("troAnUser", JSON.stringify(normalizeUser(user)));
}

export function clearSession() {
  localStorage.removeItem("troAnAccessToken");
  localStorage.removeItem("troAnUser");
}

export function storedUser() {
  try {
    const raw = JSON.parse(localStorage.getItem("troAnUser") || "null");
    return raw ? normalizeUser(raw) : null;
  } catch {
    return null;
  }
}

export function normalizeUser(user = {}) {
  return {
    ...user,
    id: user.id ?? user.user_id,
    full_name: user.full_name ?? user.fullName ?? user.hoTen ?? user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? user.soDienThoai ?? "",
    zalo_link: user.zalo_link ?? user.zaloLink ?? "",
    role: user.role ?? user.vaiTro ?? "user",
    account_status: user.account_status ?? "active",
    avatar_url: user.avatar_url ?? user.avatarUrl ?? user.anhDaiDien ?? "",
  };
}

export function normalizeRoom(room = {}) {
  const rawImages = room.images ?? room.room_images ?? room.anhPhong ?? [];
  const roomImages = Array.isArray(rawImages)
    ? rawImages
        .map((image, index) =>
          typeof image === "string"
            ? { id: null, image_url: image, is_cover: index === 0 }
            : {
                ...image,
                id: image.id ?? image.image_id ?? null,
                image_url: image.image_url ?? image.duongDan ?? image.url ?? "",
              },
        )
        .filter((image) => image.image_url)
    : [];
  const cover =
    room.cover_image ??
    room.cover_url ??
    room.anhDaiDien ??
    roomImages.find((image) => image.is_cover)?.image_url ??
    roomImages[0]?.image_url ??
    "";
  return {
    ...room,
    id: room.id ?? room.room_id ?? room.phongId ?? room.roomId,
    title: room.title ?? room.tieuDe ?? room.name ?? "Phòng trọ cho thuê",
    description: room.description ?? room.moTaTinDang ?? room.moTaPhong ?? "",
    price: Number(room.price ?? room.giaThue ?? 0),
    area: Number(room.area ?? room.dienTich ?? 0),
    address_detail: room.address_detail ?? room.diaChi ?? "",
    province_name: room.province_name ?? room.diaChiTinh ?? room.province ?? "",
    commune_name: room.commune_name ?? room.diaChiXa ?? room.commune ?? "",
    status:
      room.status ??
      room.trangThai ??
      room.trangThaiTinDang ??
      room.trangThaiPhong ??
      "approved",
    cover_image: cover,
    room_images: roomImages,
    images: roomImages.length
      ? roomImages.map((image) => image.image_url)
      : cover
        ? [cover]
        : [],
    owner_name: room.owner_name ?? room.tenChuTro ?? room.full_name ?? "",
    owner_phone: room.owner_phone ?? room.dienThoaiChuTro ?? "",
    owner_zalo_link: room.owner_zalo_link ?? room.zalo_link ?? room.ownerZaloLink ?? "",
    rating: room.rating ?? room.diemDanhGia ?? null,
    review_count: Number(room.review_count ?? room.soDanhGia ?? 0),
    created_at: room.created_at ?? room.ngayTao ?? room.createdAt,
  };
}

export function unwrapData(result) {
  return result?.data ?? result;
}

export function unwrapList(result) {
  if (Array.isArray(result)) return result;
  const payload = unwrapData(result);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  for (const key of [
    "rooms",
    "favorites",
    "items",
    "notifications",
    "users",
    "reviews",
    "contacts",
  ]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

export function unwrapPagination(result) {
  const payload = unwrapData(result);
  return payload?.pagination ?? result?.pagination ?? result?.meta ?? null;
}

async function readResponse(response) {
  const raw = await response.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }
  if (!response.ok) {
    const error = new Error(
      data.message || data.error || `Lỗi máy chủ (${response.status})`,
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function refreshToken() {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const result = await readResponse(response);
  const payload = unwrapData(result);
  const accessToken = payload?.accessToken ?? payload?.access_token;
  if (!accessToken) throw new Error("Máy chủ không trả về access token mới.");
  saveSession(accessToken, payload.user);
  return accessToken;
}

export async function request(path, options = {}, allowRefresh = true) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const token = getToken();
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE}${normalizedPath}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error(
      "Không kết nối được máy chủ. Kiểm tra backend và VITE_API_URL trong file .env.",
    );
  }

  const requestPath = normalizedPath.split("?")[0];
  if (
    response.status === 401 &&
    allowRefresh &&
    token &&
    !NO_REFRESH.has(requestPath)
  ) {
    try {
      await getFreshToken();
      return request(normalizedPath, options, false);
    } catch {
      clearSession();
    }
  }
  return readResponse(response);
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: (path, body) =>
    request(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", body: formData }),
};

export function makeRoomPayload(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    price: Number(form.price),
    area: Number(form.area),
    address_detail: form.address_detail.trim(),
    province_name: form.province_name.trim(),
    commune_name: form.commune_name.trim(),
    deposit:
      form.deposit === "" || form.deposit === undefined
        ? null
        : Number(form.deposit),
  };
}

export { API_BASE };
