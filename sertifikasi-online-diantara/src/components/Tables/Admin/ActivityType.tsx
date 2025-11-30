import React, { useEffect, useState, useCallback } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import axios from "@/lib/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ActivityType {
  id: number;
  type_name: string;
}

// Helper component for a loading spinner
const Spinner = () => (
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
);

const ActivityTypeTable: React.FC = () => {
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [typeName, setTypeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"type_name" | "id">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);

  const fetchActivityTypes = useCallback(async () => {
    setLoading(true);
    try {
      // Try to get merchant_id from /auth/me — if available scope request by merchant
      let merchant_id: number | null = null;
      try {
        const meRes = await axios.get("/auth/me");
        merchant_id = meRes?.data?.merchant_id ?? meRes?.data?.user?.merchant_id ?? null;
      } catch (err) {
        // Ignore; fallback to existing localStorage/user fallback below
        merchant_id = null;
      }

      const url = merchant_id ? `/data-activity-types?merchant_id=${merchant_id}` : "/data-activity-types";
      const res = await axios.get(url);
      const data = res.data?.data || res.data || [];
      setActivityTypes(data);
    } catch (error) {
      toast.error("Gagal memuat data tipe aktivitas");
    } finally {
      setLoading(false);
      setIsSorting(false);
    }
  }, []);

  useEffect(() => {
    fetchActivityTypes();
  }, [fetchActivityTypes]);

  const handleSort = (key: "id" | "type_name") => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setIsSorting(true);
    setTimeout(() => setIsSorting(false), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return;
    setSaving(true);

    // Ambil merchant_id dari user/admin yang login
    let merchant_id: number | undefined = undefined;
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (typeof parsed.merchant_id === "number" && parsed.merchant_id > 0) merchant_id = parsed.merchant_id;
      } catch {}
    }
    if (!merchant_id || merchant_id === 0) {
      const merchantIdFromStorage = Number(localStorage.getItem("merchant_id"));
      if (merchantIdFromStorage > 0) merchant_id = merchantIdFromStorage;
    }
    const payload: { type_name: string; merchant_id: number } = {
      type_name: typeName,
      merchant_id: merchant_id ?? 1,
    };

    try {
      await axios.post("/data-activity-types", payload);
      setTypeName("");
      fetchActivityTypes();
      toast.success("Tipe aktivitas berhasil ditambahkan");
    } catch (error) {
      toast.error("Gagal menambahkan tipe aktivitas");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (type: ActivityType) => {
    setEditId(type.id);
    setEditName(type.type_name);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editId === null) {
      if (!editName.trim()) {
        toast.error("Nama tipe aktivitas tidak boleh kosong");
      }
      return;
    }
    setSaving(true);
    // Ambil merchant_id dari user/admin yang login
    let merchant_id: number | undefined = undefined;
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (typeof parsed.merchant_id === "number" && parsed.merchant_id > 0) merchant_id = parsed.merchant_id;
      } catch {}
    }
    if (!merchant_id || merchant_id === 0) {
      const merchantIdFromStorage = Number(localStorage.getItem("merchant_id"));
      if (merchantIdFromStorage > 0) merchant_id = merchantIdFromStorage;
    }
    try {
      await axios.put(`/data-activity-types/${editId}`, {
        type_name: editName,
        merchant_id: merchant_id ?? 1,
      });
      setEditId(null);
      setEditName("");
      fetchActivityTypes();
      toast.success("Tipe aktivitas berhasil diperbarui");
    } catch (error) {
      toast.error("Gagal memperbarui tipe aktivitas");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (type: ActivityType) => {
    setSelectedType(type);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedType) return;
    try {
      await axios.delete(`/data-activity-types/${selectedType.id}`);
      fetchActivityTypes();
      setShowDeleteModal(false);
      setSelectedType(null);
      toast.success("Tipe aktivitas berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus tipe aktivitas");
    }
  };

  const sortedAndFilteredTypes = React.useMemo(() => {
    let result = [...activityTypes];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter((type) =>
        type.type_name.toLowerCase().includes(term),
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [activityTypes, search, sortKey, sortOrder]);

  // Calculate paginated data
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Calculate paginated data
  const paginatedTypes = sortedAndFilteredTypes.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const totalPages = Math.ceil(sortedAndFilteredTypes.length / perPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const SortableHeader = ({
    label,
    sortKey: key,
    className,
  }: {
    label: string;
    sortKey: "id" | "type_name";
    className?: string;
  }) => (
    <th
      className={`cursor-pointer p-3 text-left text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${className}`}
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
          Manajemen Tipe Aktivitas
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
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="Nama Tipe Aktivitas Baru"
          value={typeName}
          onChange={(e) => setTypeName(e.target.value)}
          disabled={saving}
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 disabled:opacity-60"
          disabled={saving || !typeName.trim()}
        >
          {saving ? "Menyimpan..." : "Tambah"}
        </button>
      </form>
      <div className="w-full overflow-x-auto">
        {loading ? (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">
            Memuat data...
          </p>
        ) : (
          <table className="w-full min-w-[500px] table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="w-20 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">No</th>
                <SortableHeader
                  label="Nama Tipe Aktivitas"
                  sortKey="type_name"
                />
                <th className="w-28 p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTypes.map((type, idx) => (
                <tr key={type.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3">{(currentPage - 1) * perPage + idx + 1}</td>
                  <td className="p-3">
                    {editId === type.id ? (
                      <form onSubmit={handleEditSubmit} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={saving}
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                          disabled={saving}
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          onClick={() => setEditId(null)}
                          disabled={saving}
                        >
                          Batal
                        </button>
                      </form>
                    ) : (
                      type.type_name
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="text-gray-500 transition hover:text-indigo-600"
                        title="Edit"
                        disabled={saving || editId !== null}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(type)}
                        className="text-gray-500 transition hover:text-red-600"
                        title="Hapus"
                        disabled={saving}
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
          Menampilkan {paginatedTypes.length} dari{" "}
          {sortedAndFilteredTypes.length} data
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
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50"></div>
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Yakin ingin menghapus &quot;{selectedType?.type_name}&quot;?
              </h3>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 focus:outline-none dark:border-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTypeTable;
