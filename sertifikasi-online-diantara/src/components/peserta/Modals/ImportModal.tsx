// src/components/peserta/Modals/ImportModal.tsx
import { useState, useEffect, useRef } from 'react';
import { normalizeEmailKey } from '../utils/emailUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  onImportUsers: () => void;
  isImporting: boolean;
  isImportingUsers: boolean;
  error: string | null;
  certificatesGenerated: boolean;
  importTab: 'excel' | 'users';
  onTabChange: (tab: 'excel' | 'users') => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  // Users tab
  availableUsers: any[];
  usersLoading: boolean;
  userSearch: string;
  onUserSearchChange: (value: string) => void;
  usersPage: number;
  usersTotalPages: number;
  onUsersPageChange: (page: number) => void;
  selectedUserIdsToImport: number[];
  onSelectUser: (id: number) => void;
  onSelectAllUsersOnPage: () => void;
  selectAllUsers: boolean;
  // current role/tab in the parent (e.g. 'Peserta' | 'Panitia' | 'Narasumber')
  memberRole?: string;
}

export default function ImportModal({
  isOpen,
  onClose,
  onImport,
  onImportUsers,
  isImporting,
  isImportingUsers,
  error,
  certificatesGenerated,
  importTab,
  onTabChange,
  fileInputRef,
  // Users tab
  availableUsers,
  usersLoading,
  userSearch,
  onUserSearchChange,
  usersPage,
  usersTotalPages,
  onUsersPageChange,
  selectedUserIdsToImport,
  onSelectUser,
  onSelectAllUsersOnPage,
  selectAllUsers,
  memberRole,
}: ImportModalProps) {
  // Helper that checks whether a user object matches the requested role
  const matchesRole = (u: any, role?: string) => {
    if (!role) return true;
    const r = (role || '').toLowerCase();

    // Try common string fields
    const roleCandidates: string[] = [];
    if (u.role) roleCandidates.push(String(u.role));
    if (u.role_name) roleCandidates.push(String(u.role_name));
    if (u.type_member) roleCandidates.push(String(u.type_member));
    if (u.type) roleCandidates.push(String(u.type));
    if (u.roleName) roleCandidates.push(String(u.roleName));
    if (u.roles && Array.isArray(u.roles)) roleCandidates.push(u.roles.join(' '));
    if (u.roles && typeof u.roles === 'string') roleCandidates.push(u.roles);
    if (typeof u.role_id !== 'undefined') roleCandidates.push(String(u.role_id));
    if (u.pivot && u.pivot.role_name) roleCandidates.push(String(u.pivot.role_name));

    const normalized = roleCandidates.map((s) => (s || '').toLowerCase()).join(' ');
    if (normalized.includes(r)) return true;

    // numeric id fallback mapping (common convention)
    const id = String(u.role_id || u.role || '');
  const mapping: Record<string, string> = { '3': 'peserta', '4': 'panitia', '5': 'narasumber', '6': 'instruktur' };
    if (mapping[id] === r) return true;

    return false;
  };
  const handleUserSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onUsersPageChange(1);
    }
  };

  // Local debounced search to avoid firing requests on every keystroke
  const [localSearch, setLocalSearch] = useState<string>(userSearch || '');
  const debounceRef = useRef<number | null>(null);

  // keep localSearch in sync when parent prop changes
  useEffect(() => {
    setLocalSearch(userSearch || '');
  }, [userSearch]);

  const triggerSearch = (value: string) => {
    onUserSearchChange(value);
    onUsersPageChange(1);
  };

  const handleLocalSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // debounce 500ms
    debounceRef.current = window.setTimeout(() => {
      triggerSearch(value);
      debounceRef.current = null;
    }, 500) as unknown as number;
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Import Data Users</h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-white border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50 shadow-sm"
          >
            Tutup
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row">
          {/* Sidebar tab */}
          <div className="md:w-1/3">
            <nav className="flex flex-col gap-3">
              <button
                className={`text-left rounded-lg px-3 py-2 flex items-center gap-2 ${
                  importTab === 'excel'
                    ? 'bg-primary text-white shadow'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => onTabChange('excel')}
              >
                <span className="text-sm font-medium">Upload Excel</span>
              </button>
              <button
                className={`text-left rounded-lg px-3 py-2 flex items-center gap-2 ${
                  importTab === 'users'
                    ? 'bg-primary text-white shadow'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => onTabChange('users')}
              >
                <span className="text-sm font-medium">Import dari (Users)</span>
              </button>
            </nav>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {importTab === 'excel' ? (
                <p>Unggah file Excel berisi users. Gunakan template resmi untuk hasil terbaik.</p>
              ) : (
                <p>Pilih pengguna yang sudah terdaftar di sistem untuk ditambahkan ke kegiatan ini.</p>
              )}
            </div>
          </div>

          {/* Konten tab */}
          <div className="md:w-2/3">
            {importTab === 'excel' ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform ${
                    certificatesGenerated
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting || certificatesGenerated}
                  title={
                    certificatesGenerated
                      ? 'Tidak dapat mengimport setelah nomor sertifikat digenerate'
                      : 'Pilih & Upload File Excel'
                  }
                >
                  {isImporting ? 'Mengimpor...' : 'Pilih & Upload File Excel'}
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={onImport}
                  disabled={certificatesGenerated}
                />
                <a
                  href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/download-template`}
                  className="inline-block w-full rounded-lg bg-white border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:text-gray-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Template
                </a>
                {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Search & control bar (debounced) */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex w-full max-w-xl items-center gap-2">
                    <input
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      placeholder="Cari nama atau email… (jeniskan untuk mencari)"
                      value={localSearch}
                      onChange={(e) => handleLocalSearchChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') triggerSearch(localSearch);
                      }}
                    />
                    <button
                      onClick={() => triggerSearch(localSearch)}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
                    >
                      Cari
                    </button>
                    <button
                      onClick={() => {
                        setLocalSearch('');
                        triggerSearch('');
                      }}
                      className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100"
                      title="Reset"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Tabel daftar users */}
                <div className="max-h-64 overflow-auto rounded-lg border bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                  {usersLoading ? (
                    <div className="space-y-2 p-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                        />
                      ))}
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">Tidak ada pengguna.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-white text-left text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                        <tr>
                          <th className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={selectAllUsers}
                              onChange={onSelectAllUsersOnPage}
                            />
                          </th>
                          <th className="px-2 py-2 w-16">No</th>
                          <th className="px-2 py-2">Nama</th>
                          <th className="px-2 py-2">Email</th>
                          <th className="px-2 py-2">No. HP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableUsers.map((u, i) => {
                          const absoluteIndex = (Math.max(1, usersPage) - 1) * 25 + i + 1;
                          return (
                            <tr
                              key={u.id}
                              className="border-t hover:bg-white/60 dark:border-gray-700 dark:hover:bg-gray-700/60"
                            >
                              <td className="px-2 py-2 align-top">
                                <input
                                  type="checkbox"
                                  checked={selectedUserIdsToImport.includes(u.id)}
                                  onChange={() => onSelectUser(u.id)}
                                />
                              </td>
                              <td className="px-2 py-2 align-top text-gray-700 dark:text-gray-100">
                                {absoluteIndex}
                              </td>
                              <td className="px-2 py-2 align-top text-gray-700 dark:text-gray-100">
                                {u.name}
                              </td>
                              <td className="px-2 py-2 align-top text-gray-700 dark:text-gray-100">
                                {u.email}
                              </td>
                              <td className="px-2 py-2 align-top text-gray-700 dark:text-gray-100">
                                {u.no_hp || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Halaman {usersPage} / {usersTotalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={usersPage <= 1}
                      onClick={() => onUsersPageChange(Math.max(1, usersPage - 1))}
                      className={`rounded-lg border px-3 py-1 text-sm shadow-sm ${
                        usersPage <= 1
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      } dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100`}
                    >
                      ‹ Prev
                    </button>

                    {Array.from({ length: usersTotalPages }, (_, i) => i + 1)
                      .slice(Math.max(0, usersPage - 3), Math.min(usersTotalPages, usersPage + 2))
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => onUsersPageChange(p)}
                          className={`rounded-lg px-3 py-1 text-sm ${
                            p === usersPage
                              ? 'bg-primary text-white shadow'
                              : 'border hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}

                    <button
                      disabled={usersPage >= usersTotalPages}
                      onClick={() => onUsersPageChange(Math.min(usersTotalPages, usersPage + 1))}
                      className={`rounded-lg border px-3 py-1 text-sm shadow-sm ${
                        usersPage >= usersTotalPages
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      } dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100`}
                    >
                      Next ›
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      // reset selection
                    }}
                    className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={onImportUsers}
                    disabled={isImportingUsers || selectedUserIdsToImport.length === 0}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md ${
                      selectedUserIdsToImport.length === 0
                        ? 'bg-gray-300'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isImportingUsers
                      ? 'Mengimpor…'
                      : `Import (${selectedUserIdsToImport.length})`}
                  </button>
                </div>
                {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}