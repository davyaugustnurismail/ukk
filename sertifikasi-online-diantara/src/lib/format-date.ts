/**
 * Normalize various backend date formats into YYYY-MM-DD.
 * Accepts ISO strings with or without fractional seconds/timezone, Date objects,
 * or already formatted strings. Returns null if input is falsy or invalid.
 */
export function formatToYYYYMMDD(input: any): string | null {
  if (!input && input !== 0) return null;

  try {
    // If it's already a plain YYYY-MM-DD, return as-is
    if (typeof input === 'string') {
      const s = input.trim();
      // e.g. 2025-09-10
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

      // Try to parse ISO-like strings, remove fractional microseconds if present
      // Examples: 2025-09-10T00:00:00.000000Z or 2025-09-10T00:00:00Z
      const cleaned = s.replace(/\.(\d{1,})Z?$/, 'Z').replace(/Z$/, '');
      const iso = cleaned.endsWith('Z') ? cleaned : cleaned;
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }

      // fallback: try to extract YYYY-MM-DD from string
      const m = s.match(/(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
      return null;
    }

    if (input instanceof Date) {
      if (isNaN(input.getTime())) return null;
      const yyyy = input.getFullYear();
      const mm = String(input.getMonth() + 1).padStart(2, '0');
      const dd = String(input.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    // numbers (timestamp)
    if (typeof input === 'number') {
      const d = new Date(input);
      if (isNaN(d.getTime())) return null;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    // Try to coerce
    const coerced = new Date(String(input));
    if (!isNaN(coerced.getTime())) {
      const yyyy = coerced.getFullYear();
      const mm = String(coerced.getMonth() + 1).padStart(2, '0');
      const dd = String(coerced.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export function formatWithDay(input: any): string | null {
  const ymd = formatToYYYYMMDD(input);
  if (!ymd) return null;

  try {
    const date = new Date(ymd);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu"
    ];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember"
    ];

    const day = days[date.getDay()];
    const dd = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}, ${dd} ${month} ${year}`;
  } catch (e) {
    return null;
  }
}

export default formatToYYYYMMDD;
