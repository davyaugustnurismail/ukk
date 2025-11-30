"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import {
  getUsers,
  deleteUser,
} from "@/lib/fetch-user-instruktur-management";
import axios from "@/lib/axios";

interface UserType {
  id: number;
  name: string;
  email: string;
  signature?: string;
  signature_url?: string;
  phone_number?: string;
  asal_institusi?: string;
  jabatan?: string;
  jenis_kelamin?: string;
  created_at?: string;
}

import CreateUserModal from "./Modals/createInstrukturModal";
import EditUserModal from "./Modals/editInstrukturModal";
import ConfirmDeleteModal from "./Modals/confirmDeleteModal";
import React from "react";

// Helper component for a loading spinner
const Spinner = () => (
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
);

export function InstrukturManagementTable() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  // default newest items first
  const [sortKey, setSortKey] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Try to obtain merchant_id from /auth/me (uses axios so it includes Authorization)
      let merchantId: number | null = null;
      try {
        const meRes = await axios.get("/auth/me");
        merchantId = meRes?.data?.merchant_id ?? meRes?.data?.user?.merchant_id ?? null;
      } catch (e) {
        merchantId = null;
      }

      const data = merchantId ? await getUsers(merchantId) : await getUsers();
      // Normalize signature field: backend may return signature, signature_url, or both
      // Check multiple fields: signature_url, signature, or signature_path
      const normalized: UserType[] = (data || []).map((u: any) => ({
        ...u,
        // Check signature_url first (commonly used for actual file path), then signature
        signature: u.signature_url || u.signature || u.signature_path || undefined,
      }));
      setUsers(normalized);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Gagal mengambil data instruktur",
      );
      setUsers([]);
    } finally {
      setLoading(false);
      setIsSorting(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleDeleteClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUserId) return;
    try {
      await deleteUser(selectedUserId);
      fetchUsers();
      (toast.success("Instruktur berhasil dihapus"), {});
    } catch (error) {
      toast.error("Gagal menghapus instruktur");
    } finally {
      setShowDeleteModal(false);
      setSelectedUserId(null);
    }
  };

  const sortedAndFilteredUsers = React.useMemo(() => {
    let result = [...users];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s),
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
      const aVal = a[sortKey as keyof UserType] || "";
      const bVal = b[sortKey as keyof UserType] || "";
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, search, sortKey, sortOrder]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginatedUsers = sortedAndFilteredUsers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const totalPages = Math.ceil(sortedAndFilteredUsers.length / perPage);

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
          Data Instruktur
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
            Tambah Instruktur
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
          <table className="w-full min-w-[600px] table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "5rem" }} />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="w-20 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">No</th>
                  <SortableHeader label="Nama" sortKey="name" />
                  <SortableHeader label="Email" sortKey="email" />
                  <SortableHeader label="Telepon" sortKey="phone_number" />
                  <SortableHeader label="Asal Institusi" sortKey="asal_institusi" />
                  <SortableHeader label="Jenis Kelamin" sortKey="jenis_kelamin" />
                  <SortableHeader label="Jabatan" sortKey="jabatan" />
                  <th className="cursor-default p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Signature
                  </th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Aksi
                  </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                    <td className="p-3 text-sm text-gray-700 dark:text-gray-200 text-left">{(currentPage - 1) * perPage + idx + 1}</td>
                  <td className="p-3">{user.name}</td>
                  <td className="truncate p-3">{user.email}</td>
                  <td className="p-3" title={user.phone_number || "-"}>{user.phone_number || "-"}</td>
                  <td className="p-3" title={user.asal_institusi || "-"}>{user.asal_institusi || "-"}</td>
                  <td className="p-3" title={user.jenis_kelamin || "-"}>{user.jenis_kelamin || "-"}</td>
                  <td className="p-3" title={user.jabatan || "-"}>{user.jabatan || "-"}</td>
                  <td className="p-3 text-center">
                    {user.signature && user.signature.trim() ? (
                      <span
                        title="Instruktur sudah mengirim signature"
                        aria-label="Has signature"
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
                      >
                        <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        <span className="hidden sm:inline">Signed</span>
                      </span>
                    ) : (
                      <span
                        title="Belum mengirim signature"
                        aria-label="No signature"
                        className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500 shadow-sm transition-colors dark:bg-gray-700 dark:text-gray-300"
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                        </svg>
                        <span className="hidden sm:inline">No</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditUser(user)}
                        className="text-gray-500 transition hover:text-indigo-600"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.id)}
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
          Menampilkan {paginatedUsers.length} dari{" "}
          {sortedAndFilteredUsers.length} data
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
          onUserCreated={fetchUsers}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUserUpdated={fetchUsers}
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
