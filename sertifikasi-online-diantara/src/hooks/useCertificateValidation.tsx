import { useState } from 'react';
import api from '@/lib/axios';
import { formatWithDay } from '@/lib/format-date';

type ValidationResult = {
  activity_name: string;
  date: string;
  certificate_number: string;
  recipient_name: string;
  instruktur_name?: string;
  member_type?: string;
  location?: string;
};

export const useCertificateValidation = () => {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const validateCertificate = async (certNum: string) => {
    certNum = (certNum || '').trim();
    if (!certNum) return;
    
    setIsValidating(true);
    setValidationResult(null);
    setNotFound(false);

    try {
      const res = await api.post(`/sertifikat/validate/peserta`, {
        certificate_number: certNum
      });

      const data = res.data;
      
      if (data && data.data) {
        const payload = data.data;
        console.log('Certificate validation payload:', payload);
        const rawDate = payload.date || payload.tanggal || payload.certificate_date;
        const normalizedDate = formatWithDay(rawDate) || "-";

        const mapped: ValidationResult = {
          activity_name: payload.activity_name || payload.activity?.name || "-",
          date: normalizedDate,
          certificate_number: payload.certificate_number || certNum,
          recipient_name: payload.recipient_name || payload.nama || "-",
          instruktur_name: payload.instruktur_name || payload.instruktur?.name,
          member_type: (payload.member_type || payload.type_member) === 'users' ? 'peserta' : (payload.member_type || payload.type_member),
          location: payload.location || payload.data_activity?.location || payload.activity?.location || payload.activity_location || "-",
        };

        setValidationResult(mapped);
        setNotFound(false);
      } else {
        setValidationResult(null);
        setNotFound(true);
      }
    } catch (err) {
      setValidationResult(null);
      setNotFound(true);
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
    setCertificateNumber("");
    setNotFound(false);
  };

  return {
    certificateNumber,
    setCertificateNumber,
    isValidating,
    validationResult,
    notFound,
    validateCertificate,
    resetValidation,
  };
};