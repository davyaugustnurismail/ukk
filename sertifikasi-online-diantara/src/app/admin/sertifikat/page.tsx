import React from "react";
import CertificateCreate from "./components/CertificateCreate";
import ClientOnly from "@/components/ClientOnly";

const CreateCertificatePage = () => {
  return (
    <ClientOnly>
      <CertificateCreate />
    </ClientOnly>
  );
};

export default CreateCertificatePage;
