// /app/admin/sertifikat/[id]/edit/page.tsx

"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/axios";
import CertificateEditor from "../../components/CertificateEditor"; // Pastikan path ini benar
import { Loader2 } from "lucide-react";
import {
  CertificateElement,
  ImageElement,
  TextElement,
} from "../../components/interfaces";

interface TemplateData {
  id: number;
  name: string;
  background_image: string | null;
  elements: CertificateElement[];
}

const EditSertifikatPage = () => {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  const [initialData, setInitialData] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID sertifikat tidak ditemukan.");
      setLoading(false);
      return;
    }
    const fetchTemplateData = async () => {
      try {
        const response = await api.get(`/sertifikat-templates/${id}`);
        let data = response.data.data;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

        if (
          data.background_image &&
          !data.background_image.startsWith("http")
        ) {
          data.background_image = `${backendUrl}/storage/${data.background_image.replace(/^\/?(storage\/)?/, "")}`;
        }

        // Transform elements to ensure all required properties
        data.elements = data.elements.map((el: any) => {
          if (el.type === "text") {
            return {
              ...el,
              text: el.text || "",
              fontSize: el.fontSize || 16,
              fontFamily: el.fontFamily || "Arial",
              textAlign: el.textAlign || "left",
              placeholderType: el.placeholderType || "custom",
              fontWeight: el.fontWeight || "normal",
              fontStyle: el.fontStyle || "normal",
            };
          } else if (el.type === "image") {
            let imageUrl = el.imageUrl;
            if (imageUrl && !imageUrl.startsWith("http")) {
              imageUrl = `${backendUrl}/storage/${imageUrl.replace(/^\/?(storage\/)?/, "")}`;
            }
            return {
              ...el,
              imageUrl: imageUrl || "",
              width: el.width || 100,
              height: el.height || 100,
              rotation: typeof el.rotation === "number" ? el.rotation : 0,
              imageSizeMode: el.imageSizeMode === "full" ? "full" : "custom",
              scale: typeof el.scale === "number" ? el.scale : 1,
            };
          }
          return el;
        });

        setInitialData(data);
      } catch (err) {
        setError("Gagal memuat data template.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateData();
  }, [id]);

  const handleSaveSuccess = () => {
    // Arahkan kembali ke tabel setelah berhasil menyimpan
    router.push("/admin/tabel-sertifikat");
  };

  const handleCancel = () => {
    router.push("/admin/tabel-sertifikat");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Memuat Editor...</span>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {error || "Data tidak ditemukan."}
      </div>
    );
  }

  return (
    <CertificateEditor
      mode="edit"
      initialData={initialData}
      onSaveSuccess={handleSaveSuccess}
      onCancel={handleCancel} // <-- Prop onCancel yang dibutuhkan
    />
  );
};

export default EditSertifikatPage;
