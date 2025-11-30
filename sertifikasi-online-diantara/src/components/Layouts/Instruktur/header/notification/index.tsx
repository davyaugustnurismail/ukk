"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "./icons";

type NotificationItem = {
  id: number;
  message: string;
  data?: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
};

// Base API URL: prefer NEXT_PUBLIC_BACKEND_URL, then NEXT_PUBLIC_API_BASE_URL.
// If neither is set, fall back to an empty string which makes fetch use the current origin.
const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token") || localStorage.getItem("api_token") || localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let _csrfEnsured = false;
async function ensureCsrf() {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("token") || localStorage.getItem("api_token") || localStorage.getItem("access_token")) {
    _csrfEnsured = true;
    return true;
  }
  if (_csrfEnsured) return true;
  try {
    const res = await fetch(`${API_BASE}/sanctum/csrf-cookie`, { method: "GET", credentials: "include" });
    if (!res.ok) return false;
    _csrfEnsured = true;
    return true;
  } catch (err) {
    console.error("CSRF request failed", err);
    return false;
  }
}

export default function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  async function fetchNotifications() {
    await ensureCsrf();
    try {
      const headers = { "Content-Type": "application/json", Accept: "application/json", ...getAuthHeaders() } as Record<string, string>;
      const res = await fetch(`${API_BASE}/instruktur/notifications`, { method: "GET", headers, credentials: "include" });
      if (!res.ok) return;
      const body = await res.json();
      setNotifications(body.data || []);
    } catch (err) {
      console.error("Failed fetching instruktur notifications", err);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markRead(id: number) {
    await ensureCsrf();
    try {
      const headers = { "Content-Type": "application/json", Accept: "application/json", ...getAuthHeaders() } as Record<string, string>;
      const res = await fetch(`${API_BASE}/instruktur/notifications/${id}/read`, { method: "POST", headers, credentials: "include" });
      if (!res.ok) return false;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      return true;
    } catch (err) {
      console.error("Failed mark read", err);
      return false;
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => markRead(n.id)));
  }

  // When opening the notifications dropdown, consider all as read.
  // We optimistically mark them read in UI then call the backend to persist.
  async function handleToggle() {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      // Optimistic UI update so unread badge disappears immediately
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      try {
        await markAllRead();
      } catch (e) {
        // If marking fails, we refetch to get authoritative state
        console.error('Failed to mark all notifications read', e);
        fetchNotifications();
      }
    }
  }

  function timeAgo(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    return `${days}d`;
  }

  // Return just the date portion in YYYY-MM-DD for display
  function formatDate(iso?: string) {
    if (!iso) return "";
    try {
      // Normalize space-separated datetime to ISO-like to ensure Date parsing
      const normalized = iso.includes(" ") && !iso.includes("T") ? iso.replace(" ", "T") : iso;
      const d = new Date(normalized);
      if (isNaN(d.getTime())) {
        // Fallback: if string looks like 'YYYY-MM-DD HH:MM:SS', split by space
        const parts = iso.split(" ");
        return parts[0] ?? iso;
      }
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    } catch (e) {
      return iso.split(" ")[0] ?? iso;
    }
  }

  const onItemClick = async (n: NotificationItem) => {
    await markRead(n.id);
    const activityId = n.data?.data_activity_id ?? n.data?.activity_id ?? n.data?.id;
    if (activityId) router.push(`/instruktur/activity/${activityId}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="View Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 w-80 mt-2 rounded-lg border bg-white shadow-lg dark:bg-gray-800 z-40">
          <div className="px-4 py-3 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="font-medium">Notifications</div>
            </div>
          </div>

          <div className="max-h-64 overflow-auto">
            {notifications.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
            )}

            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`cursor-pointer px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  item.is_read ? "" : "bg-gray-50 dark:bg-gray-700/20"
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.message}</div>
                <div className="mt-2 flex items-center justify-end">
                  <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
