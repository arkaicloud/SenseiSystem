// client/src/lib/formatters.ts
export const onlyDigits = (v?: string | null) => (v || "").replace(/\D+/g, "");

export function formatCPF(v?: string | null) {
  const s = onlyDigits(v);
  return s
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}
export function unformatCPF(v?: string | null) {
  return onlyDigits(v).slice(0, 11);
}

export function formatRG(v?: string | null) {
  const s = onlyDigits(v).slice(0, 9);
  if (s.length <= 2) return s;
  if (s.length <= 5) return s.replace(/^(\d{2})(\d+)/, "$1.$2");
  if (s.length <= 8) return s.replace(/^(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  return s.replace(/^(\d{2})(\d{3})(\d{3})(\d)/, "$1.$2.$3-$4");
}
export const unformatRG = (v?: string | null) => onlyDigits(v).slice(0, 9);

export function formatPhone(v?: string | null) {
  const s = onlyDigits(v).slice(0, 11);
  if (s.length <= 10) {
    return s.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3").trim();
  }
  return s.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3").trim();
}
export const unformatPhone = (v?: string | null) => onlyDigits(v).slice(0, 11);

export function formatCEP(v?: string | null) {
  return onlyDigits(v).slice(0, 8).replace(/^(\d{5})(\d{0,3})$/, "$1-$2").trim();
}
export const unformatCEP = (v?: string | null) => onlyDigits(v).slice(0, 8);

export function toDisplayDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
export function toISODate(display?: string | null) {
  if (!display) return null;
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}