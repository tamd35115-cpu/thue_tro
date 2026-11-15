import "./src/config/environment.js";
import app from "./src/app.js";
import { env } from "./src/config/environment.js";
import { pool } from "./src/config/database.js";
import { startScheduledJobs } from "./src/jobs/index.js";

const server = app.listen(env.PORT, () => {
  console.log(`API đang chạy tại http://localhost:${env.PORT}`);
  console.log(`Môi trường: ${env.NODE_ENV}`);
  startScheduledJobs();
});

async function shutdown(signal) {
  console.log(`\nNhận ${signal}, đang đóng server...`);
  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error("Lỗi khi đóng MySQL pool:", error);
      process.exit(1);
    }
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
