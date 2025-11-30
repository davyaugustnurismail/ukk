'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BellIcon } from './icons';



type NotificationItem = {
  id: number;
  message: string;
  data?: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
};

function getAuthHeaders(): Record<string, string> {
  // If your frontend uses Bearer token auth, read token from localStorage.
  if (typeof window === 'undefined') return {};
  // Prefer the simple 'token' key used by some auth flows, fall back to older keys
  const token = localStorage.getItem('token') || localStorage.getItem('api_token') || localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Helper: programmatically set / remove API token (useful for testing)
export function setApiToken(token: string) {
  if (typeof window === 'undefined') return;
  // store under common keys so different helpers can find it
  localStorage.setItem('token', token);
  localStorage.setItem('api_token', token);
  localStorage.setItem('access_token', token);
}

export function removeApiToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('api_token');
  localStorage.removeItem('access_token');
}

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || localStorage.getItem('api_token') || localStorage.getItem('access_token');
}

// Helper: perform login via Laravel Sanctum (CSRF + credentials).
// Returns { ok, body } where body is parsed JSON when possible.
export async function loginWithCredentials(email: string, password: string) {
  await ensureCsrf();
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    let body: any = null;
    try { body = await res.json(); } catch (e) { body = await res.text().catch(() => null); }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error('Login error', err);
    return { ok: false, status: 0, body: err };
  }
}

// Helper: logout (invalidates session on backend)
export async function logout() {
  try {
    const res = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('Logout error', err);
    return { ok: false, status: 0 };
  }
}

// Base API URL: prefer NEXT_PUBLIC_BACKEND_URL, then NEXT_PUBLIC_API_BASE_URL.
// If neither is set, fall back to an empty string which makes fetch use the current origin.
const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

// For Laravel Sanctum cookie-based auth: request CSRF cookie first.
let _csrfEnsured = false;
async function ensureCsrf() {
  // If we have an API token, we won't need CSRF cookie (token auth uses Authorization header)
  if (getStoredToken()) {
    _csrfEnsured = true;
    return true;
  }
  if (_csrfEnsured) return true;
  try {
    const res = await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      console.warn('Failed to get CSRF cookie', { status: res.status, url: res.url });
      return false;
    }
    _csrfEnsured = true;
    return true;
  } catch (err) {
    console.error('Error requesting CSRF cookie', err);
    return false;
  }
}

export function Notification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      await ensureCsrf();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      };

      const res = await fetch(`${API_BASE}/admin/notifications`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '<no body>');
        console.warn('Failed to fetch notifications', { status: res.status, requested: `${API_BASE}/admin/notifications`, url: res.url, body: text });
        setLoading(false);
        return;
      }
      const body = await res.json();
      setNotifications(body.data || []);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: number) => {
    try {
      await ensureCsrf();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      };

      const res = await fetch(`${API_BASE}/admin/notifications/${id}/read`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '<no body>');
        console.warn('Failed to mark read', { status: res.status, requested: `${API_BASE}/admin/notifications/${id}/read`, url: res.url, body: text });
        return false;
      }
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      return true;
    } catch (err) {
      console.error('Error marking read', err);
      return false;
    }
  };

  // Mark all currently-unread notifications as read (optimistic UI then backend)
  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => markRead(n.id)));
  };

  const handleToggle = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      try {
        await markAllRead();
      } catch (e) {
        console.error('Failed to mark all notifications read', e);
        fetchNotifications();
      }
    }
  };

  const onItemClick = async (n: NotificationItem) => {
    await markRead(n.id);
    // If notification carries data_activity_id (or similar), navigate to activity page
    const activityId = n.data?.data_activity_id ?? n.data?.activity_id ?? n.data?.id;
    if (activityId) {
      // client-side navigation
      router.push(`/admin/activity-management/${activityId}`);
      return;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 w-80 mt-2 rounded-lg border bg-white shadow-lg dark:bg-gray-800 z-40">
          <div className="px-4 py-3 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="font-medium">Notifications</div>
              <div className="text-sm text-gray-500">{loading ? 'Loading...' : `${notifications.length} total`}</div>
            </div>
          </div>

          <div className="max-h-64 overflow-auto">
            {notifications.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onItemClick(n)}
                className={`cursor-pointer px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${n.is_read ? '' : 'bg-gray-50 dark:bg-gray-700/20'}`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.message}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notification;