"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeSlashIcon,
  EyeDropperIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify";
import api from "@/lib/axios";
import ConfirmDeleteModal from "./Modals/confirmDeleteModal";

export interface CertificateTemplate {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

const Spinner = () => (
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
);

const SertifikatTable: React.FC = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    NProgress.start();
    try {
      const response = await api.get("/sertifikat-templates");
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast.error("Gagal memuat data template.");
      setTemplates([]);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder(key === "created_at" ? "desc" : "asc");
    }
    setIsSorting(true);
    setTimeout(() => setIsSorting(false), 300);
  };

  const handleDeleteClick = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTemplateId) return;
    try {
      await api.delete(`/sertifikat-templates/${selectedTemplateId}`);
      fetchTemplates();
      toast.success("Template berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus template");
    } finally {
      setShowDeleteModal(false);
      setSelectedTemplateId(null);
    }
  };

  const sortedAndFilteredTemplates = useMemo(() => {
    let result = [...templates];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (template) =>
          template.name.toLowerCase().includes(term) ||
          (template.description || "").toLowerCase().includes(term),
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortKey as keyof CertificateTemplate] || "";
      const bVal = b[sortKey as keyof CertificateTemplate] || "";

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [templates, search, sortKey, sortOrder]);

  const paginatedTemplates = sortedAndFilteredTemplates.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const totalPages = Math.ceil(sortedAndFilteredTemplates.length / perPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const SortableHeader = ({
    label,
    sortKey: key,
  }: {
    label: string;
    sortKey: string;
  }) => (
    <th
      className="cursor-pointer p-3 text-left text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="h-4 w-4">
          {sortKey === key &&
            (isSorting ? (
              <Spinner />
            ) : sortOrder === "asc" ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            ))}
        </div>
      </div>
    </th>
  );

  return (
    <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Template Sertifikat
        </h2>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 sm:w-48"
          />
          <Link
            href="/admin/sertifikat"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            onClick={() => NProgress.start()}
          >
            Buat Template
          </Link>
          <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="5">5 per halaman</option>
              <option value="10">10 per halaman</option>
              <option value="25">25 per halaman</option>
              <option value="50">50 per halaman</option>
            </select>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        {loading ? (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">
            Memuat data...
          </p>
        ) : (
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">No</th>
                <SortableHeader label="Nama Template" sortKey="name" />
                <SortableHeader label="Dibuat Pada" sortKey="created_at" />
                <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTemplates.map((template, idx) => (
                <tr
                  key={template.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="p-3">{(currentPage - 1) * perPage + idx + 1}</td>
                  <td className="p-3" title={template.name}>
                    {template.name}
                  </td>
                  <td className="p-3">{formatDate(template.created_at)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Preview removed */}
                      <button
                        onClick={() => {
                          const base = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
                          const url = base ? `${base}/sertifikat-templates/preview/${template.id}` : `/api/sertifikat-templates/preview/${template.id}`;
                          window.open(url, "_blank", "noopener,noreferrer");
                        }}
                        title="Preview PDF"
                        className="text-gray-500 transition-colors hover:text-green-600"
                      >
                          <EyeIcon className="h-5 w-5" />
                      </button>
                      <Link
                        href={`/admin/sertifikat/${template.id}/edit`}
                        title="Edit Template"
                        className="text-gray-500 transition-colors hover:text-indigo-600"
                        onClick={() => NProgress.start()}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(template.id)}
                        className="text-gray-500 transition hover:text-red-600"
                        title="Hapus"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Menampilkan {paginatedTemplates.length} dari{" "}
          {sortedAndFilteredTemplates.length} data
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Sebelumnya
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Berikutnya
          </button>
        </div>
      </div>

      {showDeleteModal && selectedTemplateId && (
        <ConfirmDeleteModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default SertifikatTable;
