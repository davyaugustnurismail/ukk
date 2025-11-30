"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchAdmins,
  deleteUser,
  AdminType,
} from "@/lib/fetch-admin-management";
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import CreateUserModal from "./Modals/createAdminModal";
import EditUserModal from "./Modals/editAdminModal";
import ConfirmDeleteModal from "./Modals/confirmDeleteModal";
import React from "react";
import axios from "@/lib/axios";

// Helper component for a loading spinner
const Spinner = () => (
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
);

export default function AdminManagementTable() {
  const [admins, setAdmins] = useState<AdminType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminType | null>(null);
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const getAdmins = useCallback(async () => {
    setLoading(true);
    try {
      // Try to obtain merchant_id from /auth/me and use it to scope admin fetches
      let merchantId: number | null = null;
      try {
        const meRes = await axios.get("/auth/me");
        merchantId = meRes?.data?.merchant_id ?? meRes?.data?.user?.merchant_id ?? null;
        // Store current user email for validation
        const userEmail = meRes?.data?.email ?? meRes?.data?.user?.email ?? null;
        setCurrentUserEmail(userEmail);
      } catch (e) {
        merchantId = null;
      }

      // If fetchAdmins accepts an optional merchantId param, pass it. Otherwise fallback to filtering by localStorage
      let data: AdminType[] = [];
      try {
        // @ts-ignore - fetchAdmins may not accept params in current signature
        data = merchantId ? await fetchAdmins(merchantId) : await fetchAdmins();
      } catch (e) {
        // as a fallback, call without params
        data = await fetchAdmins();
      }

      const merchantIdFromStorage = Number(localStorage.getItem("merchant_id"));
      const effectiveMerchantId = merchantId ?? (merchantIdFromStorage > 0 ? merchantIdFromStorage : null);
      if (effectiveMerchantId) {
        const filtered = data.filter((a: AdminType) => a.merchant_id === effectiveMerchantId);
        setAdmins(filtered);
      } else {
        setAdmins(data);
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Gagal mengambil data admin",
      );
      setAdmins([]);
    } finally {
      setLoading(false);
      setIsSorting(false);
    }
  }, []);

  useEffect(() => {
    getAdmins();
  }, [getAdmins]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setIsSorting(true);
    setTimeout(() => setIsSorting(false), 300);
  };

  const handleDeleteClick = (id: number) => {
    // Find the admin to check if it's the current user
    const adminToDelete = admins.find((a) => a.id === id);
    
    if (adminToDelete && currentUserEmail && adminToDelete.email === currentUserEmail) {
      toast.error("Anda tidak dapat menghapus akun yang sedang Anda gunakan");
      return;
    }
    
    setSelectedUserId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUserId) return;
    try {
      await deleteUser(selectedUserId);
      toast.success("Admin berhasil dihapus");
      getAdmins();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menghapus admin");
    } finally {
      setShowDeleteModal(false);
      setSelectedUserId(null);
    }
  };

  const sortedAndFilteredAdmins = React.useMemo(() => {
    let result = [...admins];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s),
      );
    }

    result.sort((a, b) => {
      if (sortKey === "created_at") {
        const ta = (a as any).created_at ? new Date((a as any).created_at).getTime() : (a.id ?? 0);
        const tb = (b as any).created_at ? new Date((b as any).created_at).getTime() : (b.id ?? 0);
        if (ta < tb) return sortOrder === "asc" ? -1 : 1;
        if (ta > tb) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      const aVal = a[sortKey as keyof AdminType] || "";
      const bVal = b[sortKey as keyof AdminType] || "";
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [admins, search, sortKey, sortOrder]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginatedAdmins = sortedAndFilteredAdmins.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const totalPages = Math.ceil(sortedAndFilteredAdmins.length / perPage);

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
        {label}
        {sortKey === key &&
          (isSorting ? (
            <Spinner />
          ) : sortOrder === "asc" ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          ))}
      </div>
    </th>
  );

  return (
    <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Data Admin
        </h2>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 sm:w-48"
          />
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            <option value={5}>5 per halaman</option>
            <option value={10}>10 per halaman</option>
            <option value={25}>25 per halaman</option>
            <option value={50}>50 per halaman</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Tambah Admin
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center gap-2">
              <Spinner />
              <span className="sr-only">Loading</span>
            </div>
          </div>
        ) : (
          <table className="w-full min-w-[500px] table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "5rem" }} />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="w-20 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">No</th>
                <SortableHeader label="Nama" sortKey="name" />
                <SortableHeader label="Email" sortKey="email" />
                <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedAdmins.map((admin, idx) => (
                <tr
                  key={admin.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="p-3 text-sm text-gray-700 dark:text-gray-200 text-left">{(currentPage - 1) * perPage + idx + 1}</td>
                  <td className="p-3">{admin.name}</td>
                  <td className="truncate p-3">{admin.email}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditAdmin(admin)}
                        className="text-gray-500 transition hover:text-indigo-600"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(admin.id)}
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
          Menampilkan {paginatedAdmins.length} dari{" "}
          {sortedAndFilteredAdmins.length} data
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
          {/* per-page selector moved beside search input */}
        </div>
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={() => {
            toast.success("Admin berhasil ditambahkan");
            getAdmins();
          }}
        />
      )}

      {editAdmin && (
        <EditUserModal
          user={editAdmin}
          onClose={() => setEditAdmin(null)}
          onUserUpdated={() => {
            toast.success("Admin berhasil diperbarui");
            getAdmins();
          }}
        />
      )}
      {showDeleteModal && selectedUserId && (
        <ConfirmDeleteModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}