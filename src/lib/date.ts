import { format, isValid, parseISO } from "date-fns";

export const DATE_FORMAT = "yyyy-MM-dd";

export function todayDateString() {
  return format(new Date(), DATE_FORMAT);
}

export function toDateOnly(value: string) {
  const parsed = parseISO(`${value}T12:00:00.000Z`);

  if (!isValid(parsed)) {
    throw new Error("无效的日期");
  }

  return parsed;
}

export function toDateString(value: Date | string) {
  const parsed = typeof value === "string" ? parseISO(value) : value;
  return format(parsed, DATE_FORMAT);
}

export function formatDisplayDate(value: string) {
  return format(parseISO(`${value}T12:00:00.000Z`), "M 月 d 日");
}
