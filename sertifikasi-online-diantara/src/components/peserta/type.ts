// src/components/peserta/types.ts
export interface Peserta {
  id?: number | string;
  name: string;
  email: string;
  no_hp: string;
  asal_institusi: string;
  certificate_number?: string | null;
  tanggal_sertifikat?: string | null;
  merchant_id?: number | null;
  email_status: 'pending' | 'terkirim';
  email_sent_at?: string | null;
  certificate_sent?: boolean;
  _certificate_token?: string;
  _certificate_filename?: string;
  [key: string]: any;
}

export type StatusFilter = 'all' | 'pending' | 'terkirim';

export interface Notification {
  message: string;
  type: 'success' | 'error';
}