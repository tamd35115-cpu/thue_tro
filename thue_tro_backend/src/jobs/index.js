import { startExpireContactRequestsJob } from "./expireContactRequests.js";

let started = false;
export function startScheduledJobs() {
  if (started) return;
  started = true;
  startExpireContactRequestsJob();
  console.log("Đã khởi động scheduled jobs.");
}
