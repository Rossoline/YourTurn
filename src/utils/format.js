export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatClock(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });
}

export function todayDate() {
  return new Date().toISOString().split("T")[0];
}

export function toParticipantMap(participants) {
  const map = {};
  for (const p of participants) map[p.id] = p;
  return map;
}
