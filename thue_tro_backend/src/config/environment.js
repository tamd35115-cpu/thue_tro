import dotenv from 'dotenv';
dotenv.config();

const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}. Hãy tạo file .env từ .env.example.`);
}

for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
  if (process.env[key].length < 32) {
    throw new Error(`${key} phải có ít nhất 32 ký tự.`);
  }
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3000),
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME,
  DB_CONNECTION_LIMIT: Number(process.env.DB_CONNECTION_LIMIT || 10),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || '7d',
  REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME || 'thue_tro_refresh',
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'lax',
  FRONTEND_URLS: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((v) => v.trim()).filter(Boolean),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'thue-tro',
  CONTACT_NEW_TTL_HOURS: Number(process.env.CONTACT_NEW_TTL_HOURS || 48),
  CONTACT_CALLED_TTL_HOURS: Number(process.env.CONTACT_CALLED_TTL_HOURS || 24)
});
