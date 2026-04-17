export function normalizeTimestamp(value: string): string {
  return value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
}

export function getBrtUtcRange(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const startUTC = `${year}-${month}-${day}T03:00:00+00:00`;

  const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12, 0, 0);
  const nextYear = nextDay.getFullYear();
  const nextMonth = String(nextDay.getMonth() + 1).padStart(2, "0");
  const nextDate = String(nextDay.getDate()).padStart(2, "0");
  const endUTC = `${nextYear}-${nextMonth}-${nextDate}T02:59:59+00:00`;

  return { startUTC, endUTC };
}

export function getBrtMonthUtcRange(date: Date) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0);

  return {
    ...getBrtUtcRange(startOfMonth),
    monthStart: startOfMonth,
    monthEnd: endOfMonth,
    endUTC: getBrtUtcRange(endOfMonth).endUTC,
  };
}

export function utcToBrtDate(utcStr: string): string {
  const d = new Date(normalizeTimestamp(utcStr));
  if (Number.isNaN(d.getTime())) return "";

  const brtMs = d.getTime() - 3 * 60 * 60 * 1000;
  const brt = new Date(brtMs);

  return `${brt.getUTCFullYear()}-${String(brt.getUTCMonth() + 1).padStart(2, "0")}-${String(brt.getUTCDate()).padStart(2, "0")}`;
}

export function utcToBrtTime(utcStr: string): string {
  const d = new Date(normalizeTimestamp(utcStr));
  if (Number.isNaN(d.getTime())) return "Sem horário";

  const brtMs = d.getTime() - 3 * 60 * 60 * 1000;
  const brt = new Date(brtMs);

  return `${String(brt.getUTCHours()).padStart(2, "0")}:${String(brt.getUTCMinutes()).padStart(2, "0")}`;
}