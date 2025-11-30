"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "@/lib/axios";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function PesertaSection({ activityId }: { activityId: string }) {
  // --- STATE MANAGEMENT ---

  // States for Data and Loading
  const [peserta, setPeserta] = useState<any[]>([]);
  const [panitia, setPanitia] = useState<any[]>([]);
  const [narasumber, setNarasumber] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState<"peserta" | "panitia" | "narasumber">("peserta");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for Modals
  const [addModal, setAddModal] = useState(false);
  const [showAddModalAnimation, setShowAddModalAnimation] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [showEditModalAnimation, setShowEditModalAnimation] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [showImportModalAnimation, setShowImportModalAnimation] =
    useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<any | null>(
    null,
  );

  // States for Form Data and Actions
  const [editPeserta, setEditPeserta] = useState<any | null>(null);
  const [newPeserta, setNewPeserta] = useState({
    name: "",
    email: "",
    no_hp: "",
    asal_institusi: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  // States for Action Status
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setImporting] = useState(false);

  // Ref for File Input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DATA FETCHING ---

  const fetchPeserta = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/data-activities/${activityId}`);
      // The activity payload contains peserta, panitia, and narasumber arrays
      const data = res.data.data || {};
      setPeserta(data.peserta || []);
      setPanitia(data.panitia || []);
      setNarasumber(data.narasumber || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Gagal memuat data peserta");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchPeserta();
  }, [fetchPeserta]);

  // Helper to return the currently selected list based on currentTab
  const getCurrentList = useCallback(() => {
    if (currentTab === "peserta") return peserta || [];
    if (currentTab === "panitia") return panitia || [];
    if (currentTab === "narasumber") return narasumber || [];
    return [] as any[];
  }, [currentTab, peserta, panitia, narasumber]);

  // --- MODAL ANIMATION LOGIC ---

  const openAddModal = () => {
    setAddModal(true);
    const timer = setTimeout(() => setShowAddModalAnimation(true), 10);
    return () => clearTimeout(timer);
  };

  const closeAddModal = () => {
    setShowAddModalAnimation(false);
    const timer = setTimeout(() => {
      setAddModal(false);
      // Reset form on close
      setNewPeserta({
        name: "",
        email: "",
        no_hp: "",
        asal_institusi: "",
        password: "",
      });
      setConfirmPassword("");
      setError(null);
    }, 300);
    return () => clearTimeout(timer);
  };

  const openEditModal = (peserta: any) => {
    setEditPeserta(peserta);
    setEditModal(true);
    const timer = setTimeout(() => setShowEditModalAnimation(true), 10);
    return () => clearTimeout(timer);
  };

  const closeEditModal = () => {
    setShowEditModalAnimation(false);
    const timer = setTimeout(() => {
      setEditModal(false);
      setEditPeserta(null);
      setError(null);
    }, 300);
    return () => clearTimeout(timer);
  };

  const openImportModal = () => {
    setImportModal(true);
    const timer = setTimeout(() => setShowImportModalAnimation(true), 10);
    return () => clearTimeout(timer);
  };

  const closeImportModal = () => {
    setShowImportModalAnimation(false);
    const timer = setTimeout(() => {
      setImportModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError(null);
    }, 300);
    return () => clearTimeout(timer);
  };

  // --- FORM HANDLERS ---

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPeserta.password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }
    setIsAdding(true);
    setError(null);
    try {
      await axios.post(`/data-activities/${activityId}/users`, {
        ...newPeserta,
        password_confirmation: confirmPassword,
        role_id: 3,
      });
      fetchPeserta();
      closeAddModal();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Gagal menambah peserta");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editPeserta) return;
    try {
      await axios.put(`/users/${editPeserta.id}`, {
        name: editPeserta.name,
        no_hp: editPeserta.no_hp,
        asal_institusi: editPeserta.asal_institusi,
        email: editPeserta.email,
      });
      setEditModal(false);
      fetchPeserta();
    } catch (e: any) {
      // It's better to show errors in the UI than using alert
      setError(e?.response?.data?.message || "Gagal memperbarui data peserta");
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Pilih file terlebih dahulu");
      return;
    }
    setImporting(true);
    setError(null);
    const formData = new FormData();
    formData.append("file_excel", file);
    formData.append("activity_id", activityId);
    try {
      await axios.post(`/data-activities/${activityId}/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportModal(false);
      fetchPeserta();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Gagal import data");
    } finally {
      setImporting(false);
    }
  };

  const handleDeletePeserta = async () => {
    if (!deleteConfirmation) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/users/${deleteConfirmation.id}`);
      setDeleteConfirmation(null);
      fetchPeserta();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Gagal menghapus peserta");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-8 rounded-lg bg-white p-8 shadow-lg dark:bg-[#122031]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daftar Peserta</h1>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              // switch to peserta
              // using local state doesn't need anything else
              setCurrentTab("peserta");
            }}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentTab === "peserta"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200"
            }`}>
            Peserta
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("panitia")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentTab === "panitia"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200"
            }`}>
            Panitia
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("narasumber")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentTab === "narasumber"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200"
            }`}>
            Narasumber
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 whitespace-nowrap dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/30">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">No</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Nama</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Telepon</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Asal Institusi</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800/50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Memuat data...</td>
              </tr>
            ) : getCurrentList().length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Tidak ada data.</td>
              </tr>
            ) : (
              getCurrentList().map((p: any, idx: number) => (
                <tr key={`${p.id}-${idx}`}>
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{idx + 1}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{p.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{p.no_hp || p.phone_number || "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{p.asal_institusi || "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{p.email || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// end of file
