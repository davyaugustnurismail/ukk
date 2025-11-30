"use client";
const Spinner = () => (
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
);

function DescriptionCell({ description }: { description: string }) {
  const hasImage = /<img\s/i.test(description);
  const textOnly = description.replace(/<[^>]+>/g, "").trim();

  return (
    <div className="flex items-center gap-1.5 px-2">
      {hasImage && (
        <span title="Ada foto di deskripsi">
          <PhotoIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
        </span>
      )}
      <div className="truncate" title={textOnly}>
        {textOnly || (hasImage ? "(Hanya gambar)" : "-")}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import NProgress from "nprogress";
import Link from "next/link";
import { toast } from "react-toastify";
import axios from "@/lib/axios";
import {
  PhotoIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

import { getActivities } from "@/lib/fetch-activity-management";
import { getActivityTypes, ActivityType } from "@/lib/fetch-activity-types";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import "../../Admin/nprogress-style.css";

type SortKey =
  | "activity_name"
  | "date"
  | "created_at"
  | "activity_type_id"
  | "time_start"
  | "instruktur_name"
  | "description";

interface Activity {
  id: number;
  activity_name: string;
  date: string;
  created_at?: string;
  time_start?: string;
  time_end?: string;
  activity_type_id: number;
  activity_type_name?: string;
  description: string;
  instruktur_name?: string;
  instruktur_id?: number; // tambahkan ini
  activityType?: ActivityType;
}

export function DashboardInstruktur({ className }: { className?: string }) {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);
  const [search, setSearch] = useState("");
  // default: newest created first
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );

  const handleDelete = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedActivity) return;
    try {
      await axios.delete(`/data-activities/${selectedActivity.id}`);
      toast.success("Aktivitas berhasil dihapus!");
      setShowDeleteModal(false);
      setSelectedActivity(null);
      fetchActivities(); // Re-fetch activities
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Gagal menghapus aktivitas");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "-";
    const match = timeStr.match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : timeStr;
  };

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const [activitiesResult, activityTypesResult] = await Promise.all([
        getActivities(),
        getActivityTypes(),
      ]);
      setActivityTypes(activityTypesResult);

      // Ambil user_id dari localStorage (instruktur yang sedang login)
      const userIdStr =
        typeof window !== "undefined"
          ? localStorage.getItem("user_id")
          : null;
      const userId = userIdStr ? parseInt(userIdStr, 10) : null;

      // Filter aktivitas berdasarkan instruktur_id
      let filtered = userId
        ? activitiesResult.filter(
            (activity) => activity.instruktur_id === userId
          )
        : activitiesResult;

      const activitiesWithNames = filtered.map((activity) => ({
        ...activity,
        activity_type_name:
          activityTypesResult.find((t) => t.id === activity.activity_type_id)
            ?.type_name || "-",
      }));

      // Ensure newest items appear first by default:
      // Prefer server `created_at` if available, otherwise fall back to `id` (assuming auto-increment)
      const sortedByNewest = activitiesWithNames.sort((a, b) => {
        const ta = (a as any).created_at ? new Date((a as any).created_at).getTime() : (a.id ?? 0);
        const tb = (b as any).created_at ? new Date((b as any).created_at).getTime() : (b.id ?? 0);
        return tb - ta; // desc: newest first
      });

      setActivities(sortedByNewest);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
      setIsSorting(false);
    }
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setIsSorting(true);
    setTimeout(() => setIsSorting(false), 300);
  };

  const handleRowClick = (activityId: number | null | undefined) => {
    if (activityId) {
      NProgress.start();
      router.push(`/instruktur/activity/${activityId}`);
    }
  };

  const sortedAndFilteredActivities = React.useMemo(() => {
    let result = [...activities];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (act) =>
          act.activity_name.toLowerCase().includes(term) ||
          (act.activity_type_name || "").toLowerCase().includes(term) ||
          (act.instruktur_name || "").toLowerCase().includes(term),
      );
    }

    result.sort((a, b) => {
      let aVal, bVal;

      if (sortKey === "activity_type_id") {
        aVal = a.activity_type_name || "";
        bVal = b.activity_type_name || "";
      } else {
        aVal = String(a[sortKey] || "");
        bVal = String(b[sortKey] || "");
      }

      if (sortKey === "created_at") {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (da < db) return sortOrder === "asc" ? -1 : 1;
        if (da > db) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [activities, search, sortKey, sortOrder]);

  const paginatedActivities = sortedAndFilteredActivities.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const totalPages = Math.ceil(sortedAndFilteredActivities.length / perPage);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const SortableHeader = ({
    label,
    sortKey: key,
    className,
  }: {
    label: string;
    sortKey: SortKey;
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
          Daftar Aktivitas
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
          <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="w-16 p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                  No
                </th>
                <SortableHeader
                  label="Nama Aktivitas"
                  sortKey="activity_name"
                  className="w-48"
                />
                <SortableHeader
                  label="Tanggal"
                  sortKey="date"
                  className="w-36"
                />
                <SortableHeader
                  label="Tipe"
                  sortKey="activity_type_id"
                  className="w-36"
                />
                <th className="w-28 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Jam
                </th>
                <SortableHeader
                  label="Instruktur"
                  sortKey="instruktur_name"
                  className="w-36"
                />
                <th className="w-48 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Deskripsi
                </th>
                <th className="w-20 p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada data aktivitas yang ditemukan
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((activity, idx) => (
                  <tr
                    key={activity.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleRowClick(activity.id)}
                  >
                    <td
                      className="truncate p-3 text-center"
                      title={String(idx + 1 + (currentPage - 1) * perPage)}
                    >
                      {idx + 1 + (currentPage - 1) * perPage}
                    </td>
                    <td className="truncate p-3" title={activity.activity_name}>
                      {activity.activity_name}
                    </td>
                    <td
                      className="truncate p-3"
                      title={activity.date ? formatDate(activity.date) : "-"}
                    >
                      {activity.date ? formatDate(activity.date) : "-"}
                    </td>
                    <td
                      className="truncate p-3"
                      title={activity.activity_type_name}
                    >
                      {activity.activity_type_name}
                    </td>
                    <td
                      className="truncate p-3"
                      title={`${formatTime(
                        activity.time_start,
                      )} - ${formatTime(activity.time_end)}`}
                    >
                      {formatTime(activity.time_start)} -{" "}
                      {formatTime(activity.time_end)}
                    </td>
                    <td className="truncate p-3" title={activity.instruktur_name}>
                      {activity.instruktur_name}
                    </td>
                    <td
                      className="truncate p-3"
                      title={activity.description.replace(/<[^>]+>/g, "").trim()}
                    >
                      <DescriptionCell description={activity.description} />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/instruktur/activity/${activity.id}/edit`}
                          className="text-gray-500 transition hover:text-indigo-600"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            NProgress.start();
                          }}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(activity);
                          }}
                          className="text-gray-500 transition hover:text-red-600"
                          title="Hapus"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Menampilkan {paginatedActivities.length} dari{" "}
          {sortedAndFilteredActivities.length} data
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
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50"></div>
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Yakin ingin menghapus aktivitas &quot;
                {selectedActivity?.activity_name}&quot;?
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
}