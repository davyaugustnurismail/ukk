// src/components/peserta/utils/certificateUtils.ts
function extractCertificateSeq(cert?: string | null): number {
  if (!cert) return Number.POSITIVE_INFINITY;
  try {
    const s = String(cert);
    const m = s.match(/(\d+)(?!.*\d)/);
    if (m && m[1]) return Number(m[1]);
  } catch (e) {}
  return Number.POSITIVE_INFINITY;
}

export function sortPesertaByCertificate(list: any[]): any[] {
  if (!Array.isArray(list)) return list;
  return [...list].sort((a, b) => {
    const aNum = extractCertificateSeq(
      a?.certificate_number ?? a?.nomor_sertifikat ?? a?.certificate_no ?? null
    );
    const bNum = extractCertificateSeq(
      b?.certificate_number ?? b?.nomor_sertifikat ?? b?.certificate_no ?? null
    );
    return aNum - bNum;
  });
}