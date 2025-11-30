"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import {
  UserType,
  getUsers,
  deleteUser,
} from "@/lib/fetch-user-peserta-management";
import axios from "@/lib/axios";
import CreatePesertaModal from "./Modals/createPesertaModal";
import EditPesertaModal from "./Modals/editPesertaModal";
import ConfirmDeleteModal from "./Modals/confirmDeleteModal";

// Helper component for a loading spinner
const Spinner = () => (
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
);

// Tooltip for showing more activities
const ActivityTooltip = ({ activities }: { activities: any[] }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setShow(false)}>
      <span
        className="cursor-pointer rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
        tabIndex={0}
        onMouseEnter={() => setShow(true)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        +{activities.length - 3} lainnya
      </span>
      {show && (
        <div className="absolute left-0 z-50 mt-2 w-48 rounded-md bg-white p-2 shadow-lg dark:bg-gray-800">
          {activities.slice(3).map((act) => (
            <div
              key={act.id}
              className="py-1 text-sm text-gray-700 dark:text-gray-300"
            >
              {act.activity_name || act.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Tooltip for showing more member types (roles)
const MemberTypeTooltip = ({ types }: { types: Array<{ type: string; source: string }> }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setShow(false)}>
      <span
        className="cursor-pointer rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
        tabIndex={0}
        onMouseEnter={() => setShow(true)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        +{types.length - 3} lainnya
      </span>
      {show && (
        <div className="absolute left-0 z-50 mt-2 w-48 rounded-md bg-white p-2 shadow-lg dark:bg-gray-800">
          {types.slice(3).map((tObj, i) => (
            <div key={`${tObj.type}-${i}`} className="py-1 text-sm text-gray-700 dark:text-gray-300">
              <span className={`inline-block mr-2 rounded px-2 py-0.5 text-xs font-semibold ${tObj.source === 'user' ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'bg-rose-600 text-white dark:bg-rose-500'}`}>
                {tObj.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function PesertaManagementTable() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [rawResponse, setRawResponse] = useState<any | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [search, setSearch] = useState("");
  // Local debounced search input to avoid rapid API calls while typing
  const [localSearch, setLocalSearch] = useState<string>(search);
  const searchDebounceRef = useRef<number | null>(null);
  const [sortKey, setSortKey] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPeserta, setEditPeserta] = useState<UserType | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      // Attempt to get merchant_id from backend via /auth/me
      let merchantId: number | null = null;
      try {
        const meRes = await axios.get("/auth/me");
        merchantId = meRes?.data?.merchant_id ?? meRes?.data?.user?.merchant_id ?? null;
      } catch (e) {
        merchantId = null;
      }

      // Use helper which now accepts optional merchantId and returns array or paginated shape
      // Build params for listing
      const params: any = {
        page: currentPage,
        perPage,
        sort: sortKey,
        order: sortOrder,
      };
      if (search) params.search = search;
      if (merchantId) params.merchant_id = merchantId;

      const res = await axios.get("/users", { params });
      const data = res.data;

      if (Array.isArray(data)) {
        setUsers(data as UserType[]);
        setTotalItems(data.length);
        setTotalPages(1);
      } else if (data && data.data) {
        setUsers(data.data || []);
        setTotalItems(data.total || data.meta?.total || 0);
        setTotalPages(data.last_page || data.meta?.last_page || 1);
        if (typeof window !== "undefined") {
          (window as any).__LAST_USERS_RESPONSE = data;
          setRawResponse(data);
        }
      } else {
        setUsers([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Gagal mengambil data peserta",
      );
      setUsers([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsSorting(false);
    }
  }, [currentPage, perPage, sortKey, sortOrder, search]);

  // Utility: extract member types from user object using several possible shapes
  // Return array of member types with a source tag so we can style them differently
  const getMemberTypes = (user: any): Array<{ type: string; source: 'user' | 'data_activity_user' | 'activity_pivot' | 'other' }> => {
    const map = new Map<string, Set<string>>();

    // Helper to capitalize first letter
    const capitalize = (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const add = (t: string, src: string) => {
      if (t === null || t === undefined) return;
      const s = capitalize(String(t).trim());
      if (!s) return;
      if (!map.has(s)) map.set(s, new Set());
      map.get(s)!.add(src);
    };

    const pushFromValue = (val: any, src: string) => {
      if (!val && val !== 0) return;
      if (Array.isArray(val)) {
        val.forEach(v => { if (v || v === 0) add(String(v), src); });
        return;
      }
      if (typeof val === 'string') {
        String(val).split(/[,;|]/).map(s => s.trim()).filter(Boolean).forEach(s => add(s, src));
        return;
      }
      if (typeof val === 'object') {
        if (val?.type_member) pushFromValue(val.type_member, src);
      }
    };

    // 1) explicit user.type_member or role_id -> source 'user'
    if (user?.type_member) pushFromValue(user.type_member, 'user');
    if (typeof user?.role_id !== 'undefined' && user.role_id !== null) {
      // map numeric role_id to a human label when possible (already capitalized)
      const roleMap: Record<string, string> = { '3': 'Peserta', '4': 'Panitia', '5': 'Narasumber' };
      const mapped = roleMap[String(user.role_id)];
      if (mapped) add(mapped, 'user');
    }

    // 2) data_activity_users pivot entries
    if (Array.isArray(user?.data_activity_users)) {
      user.data_activity_users.forEach((d: any) => pushFromValue(d.type_member ?? d.type, 'data_activity_user'));
    }

    // 3) activities array may include pivot with type_member or data on pivot
    if (Array.isArray(user?.activities)) {
      user.activities.forEach((a: any) => {
        if (a?.pivot) pushFromValue(a.pivot.type_member ?? a.pivot.type ?? a.pivot.role, 'activity_pivot');
        if (a?.data_activity_user) pushFromValue(a.data_activity_user.type_member ?? a.data_activity_user.type, 'data_activity_user');
        if (a?.type_member) pushFromValue(a.type_member, 'activity_pivot');
      });
    }

    // build result array with preferred source: prefer 'user' over 'data_activity_user' over 'activity_pivot'
    const result: Array<{ type: string; source: 'user' | 'data_activity_user' | 'activity_pivot' | 'other' }> = [];
    for (const [t, sources] of map.entries()) {
      let src: 'user' | 'data_activity_user' | 'activity_pivot' | 'other' = 'other';
      if (sources.has('user')) src = 'user';
      else if (sources.has('data_activity_user')) src = 'data_activity_user';
      else if (sources.has('activity_pivot')) src = 'activity_pivot';
      result.push({ type: t, source: src });
    }
    return result;
  };

  // Fetch users when pagination, sorting, or search parameters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, currentPage, perPage, sortKey, sortOrder]);

  // Keep localSearch in sync when external `search` changes
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder(key === "created_at" ? "desc" : "asc");
    }
    setIsSorting(true);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, [sortKey, sortOrder]);

  const handleDeleteClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUserId) return;
    try {
      await deleteUser(selectedUserId);
      fetchUsers();
      toast.success("Users berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus peserta");
    } finally {
      setShowDeleteModal(false);
      setSelectedUserId(null);
    }
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

  // Client-side sorting & filtering (mirrors ActivityManagementTable behavior)
  // Client-side sorting & filtering (mirrors ActivityManagementTable behavior)
  const sortedAndFilteredUsers = React.useMemo(() => {
    let result = [...users];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter((u) => {
        // Search in basic fields
        const nameMatch = (u.name || "").toLowerCase().includes(term);
        const emailMatch = (u.email || "").toLowerCase().includes(term);
        const phoneMatch = (u.no_hp || "").toLowerCase().includes(term);
        const institutionMatch = (u.asal_institusi || "").toLowerCase().includes(term);
        
        // Search in activities
        const activitiesMatch = (u.activities || [])
          .map((a: any) => (a.activity_name || a.name || ""))
          .join(" ")
          .toLowerCase()
          .includes(term);
        
        // Search in member types
        const memberTypes = getMemberTypes(u);
        const typesMatch = memberTypes
          .map(t => t.type)
          .join(" ")
          .toLowerCase()
          .includes(term);
        
        return nameMatch || emailMatch || phoneMatch || institutionMatch || activitiesMatch || typesMatch;
      });
    }

    result.sort((a, b) => {
      let aVal: any = (a as any)[sortKey as keyof UserType];
      let bVal: any = (b as any)[sortKey as keyof UserType];

      if (sortKey === "created_at") {
        const ta = (a as any).created_at ? new Date((a as any).created_at).getTime() : (a.id ?? 0);
        const tb = (b as any).created_at ? new Date((b as any).created_at).getTime() : (b.id ?? 0);
        if (ta < tb) return sortOrder === "asc" ? -1 : 1;
        if (ta > tb) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }

      // special-case activities_count
      if (sortKey === "activities_count") {
        aVal = (a.activities || []).length;
        bVal = (b.activities || []).length;
      }

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, search, sortKey, sortOrder]);

  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedAndFilteredUsers.slice(start, start + perPage);
  }, [sortedAndFilteredUsers, currentPage, perPage]);

  const totalItemsComputed = sortedAndFilteredUsers.length;
  const totalPagesComputed = Math.max(1, Math.ceil(totalItemsComputed / perPage));

  return (
    <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-900">
      {/* Debug panel: show raw response if available and users empty */}
      {typeof window !== 'undefined' && (window as any).__LAST_USERS_RESPONSE && users.length === 0 && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/10">
          <div className="flex items-center justify-between">
            <div>Data pengguna kosong — ditemukan respons mentah dari server. Klik untuk lihat.</div>
            <button
              onClick={() => setShowRawResponse((s) => !s)}
              className="ml-2 rounded bg-yellow-200 px-2 py-1 text-xs font-medium"
            >
              {showRawResponse ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          {showRawResponse && (
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs">
              {JSON.stringify((window as any).__LAST_USERS_RESPONSE, null, 2)}
            </pre>
          )}
        </div>
      )}
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Data Users
          </h2>
          <button
            onClick={() => setShowRawResponse((s) => !s)}
            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800"
            title="Toggle raw response debug"
          >
            Raw
          </button>
          {rawResponse && users.length === 0 && (
            <button
              onClick={() => {
                // try to locate array in rawResponse and merge into users
                const findArray = (obj: any): any[] | null => {
                  if (!obj) return null;
                  if (Array.isArray(obj)) return obj;
                  if (obj && Array.isArray(obj.data)) return obj.data;
                  if (obj && Array.isArray(obj.users)) return obj.users;
                  if (obj && typeof obj === 'object') {
                    for (const k of Object.keys(obj)) {
                      const v = obj[k];
                      if (Array.isArray(v)) return v;
                    }
                  }
                  return null;
                };
                const candidate = findArray(rawResponse);
                if (candidate && candidate.length > 0) {
                  setUsers(candidate as UserType[]);
                  toast.success(`Menambahkan ${candidate.length} user dari respons mentah ke tampilan.`);
                } else {
                  toast.info('Tidak menemukan array pengguna di respons mentah.');
                }
              }}
              className="ml-2 rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white"
            >
              Merge
            </button>
          )}
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Cari..."
            value={localSearch}
            onChange={(e) => {
              const v = e.target.value;
              setLocalSearch(v);
              if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
              // debounce 450ms
              searchDebounceRef.current = window.setTimeout(() => {
                setSearch(v);
                setCurrentPage(1);
              }, 450) as unknown as number;
              // if Enter pressed, user will submit via onKeyDown
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
                setSearch(localSearch);
                setCurrentPage(1);
                fetchUsers();
              }
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
            Tambah Users
          </button>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <colgroup>
              <col style={{ width: "5rem" }} />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="w-20 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">No</th>
                <SortableHeader label="Nama" sortKey="name" />
                <SortableHeader label="Telepon" sortKey="no_hp" />
                <SortableHeader
                  label="Asal Institusi"
                  sortKey="asal_institusi"
                />
                <SortableHeader label="Email" sortKey="email" />
                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Tipe Anggota</th>
                <SortableHeader
                  label="Kegiatan Diikuti"
                  sortKey="activities_count"
                />
                <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.map((user: UserType, idx) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="p-3 text-sm text-gray-700 dark:text-gray-200 text-left">{(currentPage - 1) * perPage + idx + 1}</td>
                  <td className="p-3" title={user.name}>
                    {user.name}
                  </td>
                  <td className="p-3" title={user.no_hp || "-"}>
                    {user.no_hp || "-"}
                  </td>
                  <td className="p-3" title={user.asal_institusi || "-"}>
                    {user.asal_institusi || "-"}
                  </td>
                  <td className="p-3" title={user.email}>
                    {user.email}
                  </td>
                  <td className="p-3">
                    {(() => {
                      const typesArr = getMemberTypes(user);
                      if (typesArr.length > 0) {
                        // split into primary (user) and secondary (others)
                        const primary = typesArr.filter(t => t.source === 'user');
                        const secondary = typesArr.filter(t => t.source !== 'user');

                        return (
                          <div className="flex flex-col items-start gap-1">
                            {/* primary row: user-derived types (if any) */}
                            {primary.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {primary.slice(0, 3).map((tObj, ti: number) => (
                                  <span
                                    key={`${user.id}-type-user-${ti}-${tObj.type}`}
                                    className={`inline-block max-w-[100px] truncate rounded px-2 py-0.5 text-xs font-semibold bg-indigo-600 text-white dark:bg-indigo-500`}
                                    title={tObj.type}
                                  >
                                    {tObj.type}
                                  </span>
                                ))}
                                {primary.length > 3 && (
                                  <MemberTypeTooltip types={primary} />
                                )}
                              </div>
                            ) : null}

                            {/* secondary row: pivot/data_activity_user/other types */}
                            {secondary.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {secondary.slice(0, 3).map((tObj, si: number) => (
                                  <span
                                    key={`${user.id}-type-sec-${si}-${tObj.type}`}
                                    className={`inline-block max-w-[100px] truncate rounded px-2 py-0.5 text-xs font-semibold bg-rose-600 text-white dark:bg-rose-500`}
                                    title={tObj.type}
                                  >
                                    {tObj.type}
                                  </span>
                                ))}
                                {secondary.length > 3 && (
                                  <MemberTypeTooltip types={secondary} />
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      }

                      // fallback to activities display if no member types
                      if (user.activities && user.activities.length > 0) {
                        return (
                          <div className="flex flex-wrap items-center gap-1">
                            {user.activities.slice(0, 3).map((act: any, ai: number) => (
                              <span
                                key={`${user.id}-act-${ai}-${String(act.id || act.activity_name || act.name)}`}
                                className="inline-block max-w-[100px] truncate rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                                title={act.activity_name || act.name}
                              >
                                {act.activity_name || act.name}
                              </span>
                            ))}
                            {user.activities.length > 3 && <ActivityTooltip activities={user.activities} />}
                          </div>
                        );
                      }
                      return <span className="text-gray-400">-</span>;
                    })()}
                  </td>
                  <td className="p-3">
                    {user.activities && user.activities.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                            {user.activities.slice(0, 3).map((act: any, ai: number) => (
                              <span
                                key={`${user.id}-act-${ai}-${String(act.id || act.activity_name || act.name)}`}
                                className="inline-block max-w-[100px] truncate rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                                title={act.activity_name || act.name}
                              >
                                {act.activity_name || act.name}
                              </span>
                            ))}
                        {user.activities.length > 3 && (
                          <ActivityTooltip activities={user.activities} />
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditPeserta(user)}
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
      </div>
      <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Menampilkan {paginatedUsers.length} dari {totalItemsComputed} data
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
            Halaman {currentPage} dari {totalPagesComputed}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPagesComputed))}
            disabled={currentPage === totalPagesComputed}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Berikutnya
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreatePesertaModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={fetchUsers}
        />
      )}
      {editPeserta && (
        <EditPesertaModal
          user={editPeserta}
          onClose={() => setEditPeserta(null)}
          onUserUpdated={() => {
            toast.success("Users berhasil diperbarui");
            fetchUsers();
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
