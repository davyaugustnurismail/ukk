"use client";

import React, { useState, useEffect } from "react";
import axios from "@/lib/axios";
import Image from "next/image";
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface Template {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  sent_at?: string;
  status: string;
  is_active?: boolean;
  background_image?: string;
  elements?: any[];
  sertifikat_id?: number;
  sent_by_admin_name?: string;
}

export default function TemplateApprovalSection({
  activityId,
}: {
  activityId: string;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  // Dropdown preview selalu tertutup saat pertama kali tampil
  const [showPreview, setShowPreview] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const [approving, setApproving] = useState(false);

  // Fetch pending templates for this activity
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(
          `/data-activities/${activityId}/templates/pending`,
        );
        setTemplates(res.data.data || []);
        // Reset preview dropdown to closed for all templates
        const previewState: { [key: number]: boolean } = {};
        (res.data.data || []).forEach((t: Template) => {
          previewState[t.id] = false;
        });
        setShowPreview(previewState);
      } catch (err) {
        setTemplates([]);
      }
    };
    fetchTemplates();
  }, [activityId]);

  // Format tanggal
  const formatDate = (dateString: string) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  // Handle toggle section expansion
  const toggleSectionExpansion = () => {
    setIsSectionExpanded(!isSectionExpanded);
  };

  // Handle toggle preview
  const togglePreview = (templateId: number) => {
    setShowPreview((prev) => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  // Approve one template, reject others, and update data-activity
  const handleApprove = async (templateId: number) => {
    setApproving(true);
    setLoading((prev) => ({ ...prev, [templateId]: true }));
    try {
      // Call backend approve endpoint
      await axios.post(`/data-activities/${activityId}/templates/approve`, {
        sertifikat_id: templateId,
      });
      // After approve, fetch updated templates (should only one approved, others rejected)
      const res = await axios.get(
        `/data-activities/${activityId}/templates/pending`,
      );
      setTemplates(res.data.data || []);
      // Reset preview dropdown to closed for all templates
      const previewState: { [key: number]: boolean } = {};
      (res.data.data || []).forEach((t: Template) => {
        previewState[t.id] = false;
      });
      setShowPreview(previewState);
      // Optionally, fetch activity detail to update UI if needed
    } catch (err) {
      // handle error
    }
    setLoading((prev) => ({ ...prev, [templateId]: false }));
    setApproving(false);
  };

  // Render certificate preview asli (background + elemen)
  const renderCertificatePreview = (template: Template) => {
    if (!template.background_image && !template.elements) {
      return <div className="text-center text-gray-400">Tidak ada preview</div>;
    }
    // Gunakan komponen TemplatePreview jika ada, atau render manual
    // Untuk contoh, render background dan elemen text
    return (
      <div className="flex justify-center py-4">
        <div className="relative aspect-[11.69/8.27] w-full max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
          {template.background_image && (
            <Image
              src={
                template.background_image.startsWith("http")
                  ? template.background_image
                  : `${(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')}/storage/${template.background_image.replace(/^storage\//, "")}`
              }
              alt={template.name}
              fill
              className="object-cover"
              style={{ zIndex: 1 }}
              priority
            />
          )}
          {template.elements &&
            template.elements.map((el, idx) => {
              if (el.type === "text") {
                return (
                  <div
                    key={el.id || idx}
                    style={{
                      position: "absolute",
                      left: `${el.x || 0}px`,
                      top: `${el.y || 0}px`,
                      fontSize: el.fontSize || 16,
                      color: el.color || "#000",
                      fontFamily: el.fontFamily || "Arial",
                      fontWeight: el.fontWeight || 500,
                      zIndex: 10,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {el.text}
                  </div>
                );
              }
              // Tambah render image/shape jika perlu
              return null;
            })}
        </div>
      </div>
    );
  };

  // Render status badge dengan animasi
  const renderStatusBadge = (template: Template) => {
    if (template.status === "approved") {
      return (
        <div className="flex items-center">
          <span className="animate-fadeIn inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 transition-all duration-500 ease-in-out dark:bg-green-900 dark:text-green-200">
            <CheckCircleIcon className="mr-2 h-4 w-4 animate-bounce" />
            Sertifikat Di Setujui
          </span>
        </div>
      );
    } else if (template.status === "rejected") {
      return (
        <div className="flex items-center">
          <span className="animate-fadeIn inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 transition-all duration-500 ease-in-out dark:bg-red-900 dark:text-red-200">
            <XCircleIcon className="mr-2 h-4 w-4" />
            Sertifikat Ditolak
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-amber-400"></div>
            Menunggu Persetujuan
          </span>
        </div>
      );
    }
  };

  const displayTemplates = templates;
  const pendingCount = templates.filter((t) => t.status === "pending").length;
  const approvedCount = templates.filter((t) => t.status === "approved").length;
  const rejectedCount = templates.filter((t) => t.status === "rejected").length;

  return (
    <div className="mt-8">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 5000px;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
            max-height: 5000px;
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
            max-height: 0;
          }
        }

        @keyframes bounceRotate {
          0%,
          20%,
          50%,
          80%,
          100% {
            transform: rotate(0deg);
          }
          40% {
            transform: rotate(-10deg);
          }
          60% {
            transform: rotate(10deg);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-bounceRotate {
          animation: bounceRotate 0.6s ease-in-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .section-content {
          max-height: 5000px;
          opacity: 1;
          transform: translateY(0);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .section-content-collapsed {
          max-height: 0;
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
      `}</style>

      <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
        {/* Header Section - Always Visible with Toggle */}
        <div
          className="group cursor-pointer border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 dark:border-gray-700 dark:from-blue-900 dark:to-indigo-900 dark:hover:from-blue-800 dark:hover:to-indigo-800"
          onClick={toggleSectionExpansion}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-2 transition-colors duration-200 group-hover:bg-blue-200 dark:bg-blue-900 dark:group-hover:bg-blue-800">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 transition-colors duration-200 group-hover:text-blue-700 dark:text-gray-100 dark:group-hover:text-blue-300">
                  Template Approval
                </h2>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Kelola persetujuan template sertifikat dari admin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Stats */}
              <div className="hidden items-center gap-3 sm:flex">
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 dark:bg-amber-900">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400"></div>
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      {pendingCount} pending
                    </span>
                  </div>
                )}
                {approvedCount > 0 && (
                  <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      {approvedCount} approved
                    </span>
                  </div>
                )}
                {rejectedCount > 0 && (
                  <div className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 dark:bg-red-900">
                    <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      {rejectedCount} rejected
                    </span>
                  </div>
                )}
              </div>

              {/* Toggle Button */}
              <button
                className="group/toggle flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSectionExpansion();
                }}
              >
                <div className="relative">
                  {isSectionExpanded ? (
                    <ChevronUpIcon className="group-hover/toggle:animate-bounceRotate h-6 w-6 transition-all duration-300" />
                  ) : (
                    <ChevronDownIcon className="group-hover/toggle:animate-bounceRotate h-6 w-6 transition-all duration-300" />
                  )}
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity group-hover/toggle:opacity-20"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        <div
          className={
            isSectionExpanded ? "section-content" : "section-content-collapsed"
          }
        >
          <div className="p-8">
            {displayTemplates.length === 0 ? (
              <div className="py-12 text-center">
                <DocumentTextIcon className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                  Tidak ada template yang menunggu persetujuan
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Semua template telah diproses atau belum ada template baru
                  yang dikirim
                </p>
              </div>
            ) : (
              <div className="grid gap-8">
                {displayTemplates.map((template, index) => (
                  <div
                    key={template.id}
                    className="animate-fadeInUp space-y-0 opacity-0"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animationFillMode: "forwards",
                    }}
                  >
                    {/* Preview Section - Shows above when toggled */}
                    {showPreview[template.id] && (
                      <div className="animate-slideDown overflow-hidden rounded-t-xl border border-b-0 border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
                        <div className="p-4">
                          <div className="text-center">
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                              Preview Sertifikat: {template.name}
                            </h4>
                            {renderCertificatePreview(template)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main Template Card */}
                    <div
                      className={`${showPreview[template.id] ? "rounded-b-xl rounded-t-none border-t-0" : "rounded-xl"} border p-6 shadow-sm transition-all duration-500 ease-in-out hover:shadow-md ${
                        template.status === "approved"
                          ? "border-green-200 bg-gradient-to-r from-green-50 to-white dark:border-green-800 dark:from-green-900 dark:to-gray-800"
                          : template.status === "rejected"
                            ? "border-red-200 bg-gradient-to-r from-red-50 to-white dark:border-red-800 dark:from-red-900 dark:to-gray-800"
                            : "border-gray-200 bg-gradient-to-r from-gray-50 to-white dark:border-gray-700 dark:from-gray-800 dark:to-gray-800"
                      }`}
                    >
                      <div className="space-y-6">
                        {/* Header with status */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                              {template.name}
                            </h3>
                            <div className="flex items-center gap-3">
                              {renderStatusBadge(template)}
                            </div>
                          </div>

                          <p className="line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>

                          {/* Preview Button (opens streamed PDF in new tab) */}
                          <div className="flex justify-start">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                                const url = `${base}/sertifikat-templates/preview/${template.id}`;
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                              className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              title={`Preview PDF: ${template.name}`}
                            >
                              <EyeIcon className="mr-2 h-4 w-4" />
                              Buka Preview PDF
                            </button>
                          </div>
                        </div>

                        {/* Compact Info Cards */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-lg bg-gray-50 p-3 transition-all duration-200 hover:scale-105 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600">
                            <div className="flex items-center gap-2">
                              <div className="rounded-md bg-blue-100 p-1.5 dark:bg-blue-900">
                                <UserIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Admin
                                </p>
                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {/* Tampilkan nama admin jika tersedia di data (sent_by_admin_name) */}
                                  {template.sent_by_admin_name
                                    ? template.sent_by_admin_name
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3 transition-all duration-200 hover:scale-105 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600">
                            <div className="flex items-center gap-2">
                              <div className="rounded-md bg-green-100 p-1.5 dark:bg-green-900">
                                <CalendarIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Dikirim
                                </p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {/* Use sent_at from certificate_data_activity pivot */}
                                  {template.sent_at
                                    ? formatDate(template.sent_at)
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {template.status === "pending" && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApprove(template.id)}
                              disabled={loading[template.id] || approving}
                              className="group relative inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:from-green-600 hover:to-green-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {loading[template.id] ? (
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              ) : (
                                <CheckCircleIcon className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                              )}
                              <span className="relative">Setujui & Pasang</span>
                            </button>
                          </div>
                        )}

                        {/* Success Message */}
                        {template.status === "approved" && (
                          <div className="animate-fadeIn rounded-lg bg-green-50 p-4 dark:bg-green-900">
                            <div className="flex items-center">
                              <CheckCircleIcon className="h-5 w-5 text-green-400 dark:text-green-300" />
                              <p className="ml-3 text-sm font-medium text-green-800 dark:text-green-200">
                                Template telah disetujui dan siap digunakan
                                untuk kegiatan.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Rejection Message */}
                        {template.status === "rejected" && (
                          <div className="animate-fadeIn rounded-lg bg-red-50 p-4 dark:bg-red-900">
                            <div className="flex items-center">
                              <XCircleIcon className="h-5 w-5 text-red-400 dark:text-red-300" />
                              <p className="ml-3 text-sm font-medium text-red-800 dark:text-red-200">
                                Template ditolak. Admin perlu merevisi dan
                                mengirim ulang.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
