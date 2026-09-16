const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// Formateo manual, sin Intl/toLocaleString: el ICU de Node (SSR) y el del
// navegador pueden renderizar espacios distintos para "a. m." / separadores
// de miles, lo que rompe la hidratación de React aunque el texto se vea igual.
function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function clockTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function shortDate(date: Date): string {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return isSameDay(date, yesterday);
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin}m`;
  if (isSameDay(date, now)) return clockTime(date);

  const diffDays = Math.floor(diffMin / 60 / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return `${pad2(date.getDate())} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatMessageTime(iso: string): string {
  return clockTime(new Date(iso));
}

export function formatLeadCardDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  if (isSameDay(date, now)) return `Hoy ${clockTime(date)}`;
  if (isYesterday(date, now)) return `Ayer ${clockTime(date)}`;

  return shortDate(date);
}

export function formatNumber(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatCurrency(amount: number): string {
  return `${formatNumber(amount)} S/`;
}

export function formatMessageDay(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  if (isSameDay(date, now)) return "Hoy";
  if (isYesterday(date, now)) return "Ayer";

  return shortDate(date);
}
