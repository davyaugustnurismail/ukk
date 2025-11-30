"use client";
import React, { Suspense, useEffect, useRef } from "react";
import { Award } from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import { useAuth } from "@/hooks/useAuth";
import { useQRScanner } from "@/hooks/useQRScanner";
import { useCertificateValidation } from "@/hooks/useCertificateValidation";
import { Header } from "@/components/certificate-validation/Header";
import { ConflictBanner } from "@/components/certificate-validation/ConflictBanner";
import { QRScanner } from "@/components/certificate-validation/QRScanner";
import { ValidationForm } from "@/components/certificate-validation/ValidationForm";
import { ValidationResult } from "@/components/certificate-validation/ValidationResult";
import { NotFoundResult } from "@/components/certificate-validation/NotFoundResult";
import { TrustSection } from "@/components/certificate-validation/TrustSection";

const Page = () => {
  const { isLoggedIn, conflictRole, handleLogin, setConflictRole } = useAuth();
  const {
    certificateNumber,
    setCertificateNumber,
    isValidating,
    validationResult,
    notFound,
    validateCertificate,
    resetValidation,
  } = useCertificateValidation();

  const {
    showQRScanner,
    videoRef,
    canvasRef,
    startQRScan,
    stopCamera,
  } = useQRScanner((code) => {
    setCertificateNumber(code);
    validateCertificate(code);
  });

  const [isMobile, setIsMobile] = React.useState(false);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    // Check mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle certificate number from URL parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const params = new URLSearchParams(window.location.search);
      const param = params.get("certificate_number") || params.get("certificateNumber");
      
      if (param && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        const decodedCertNumber = decodeURIComponent(param);
        setCertificateNumber(decodedCertNumber);
        
        setTimeout(() => {
          validateCertificate(decodedCertNumber);
        }, 50);
      }
    } catch (e) {
      console.error("Error parsing URL parameters:", e);
    }
  }, [setCertificateNumber, validateCertificate]);

  return (
    <ClientOnly>
      <Suspense>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-auto">
          {/* Background elements */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-20 left-10 w-32 h-32 bg-green-200 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-emerald-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <Header isLoggedIn={isLoggedIn} onLogin={handleLogin} />

          {conflictRole && (
            <ConflictBanner conflictRole={conflictRole} onDismiss={() => setConflictRole(null)} />
          )}

          <main className="relative z-10 px-4 pb-20">
            <div className="max-w-md mx-auto pt-8 lg:pt-16">
              {/* Hero Section */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-6">
                  <Award className="relative mx-auto h-14 w-14 lg:h-16 lg:w-16 text-green-600" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-3">
                  Validasi Sertifikat
                </h1>
                <p className="text-green-700 mb-4 text-base lg:text-lg">
                  Verifikasi keaslian sertifikat Anda dengan cepat dan aman
                </p>
              </div>

              {/* Main Card */}
              <div className="relative group mb-8">
                <div className="relative rounded-2xl bg-white/95 backdrop-blur-lg border border-green-100 shadow-lg p-6 lg:p-8">
                  {showQRScanner ? (
                    <QRScanner videoRef={videoRef} canvasRef={canvasRef} onCancel={stopCamera} />
                  ) : validationResult ? (
                    <ValidationResult result={validationResult} onReset={resetValidation} />
                  ) : notFound ? (
                    <NotFoundResult onReset={resetValidation} />
                  ) : (
                    <ValidationForm
                      certificateNumber={certificateNumber}
                      setCertificateNumber={setCertificateNumber}
                      isValidating={isValidating}
                      onValidate={() => validateCertificate(certificateNumber)}
                      onStartQRScan={startQRScan}
                      isMobile={isMobile}
                    />
                  )}
                </div>
              </div>

              <TrustSection />
            </div>
          </main>
        </div>
      </Suspense>
    </ClientOnly>
  );
};

export default Page;