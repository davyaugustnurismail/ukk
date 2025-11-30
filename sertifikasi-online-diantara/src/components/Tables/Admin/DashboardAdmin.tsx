import React, { useEffect, useState, useCallback } from "react";
import {
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import axios from "@/lib/axios";

// Update interface to match both frontend and backend expectations
interface RecentActivity {
  id: number;
  name?: string;
  activity_name?: string;
  date: string;
  participants_count: number;
  certificates_issued: number;
}

interface DashboardStats {
  total_activities: number;
  total_participants: number;
  certificates_issued: number;
  certificates_pending: number;
  activities_this_month: number;
  participants_this_month: number;
  completion_rate: number;
  recent_activities: RecentActivity[];
  // optional trend info (percentage, and sign)
  total_activities_trend?: { value: number; isPositive: boolean };
  total_participants_trend?: { value: number; isPositive: boolean };
  activities_this_month_trend?: { value: number; isPositive: boolean };
  participants_this_month_trend?: { value: number; isPositive: boolean };
  completion_rate_trend?: { value: number; isPositive: boolean };
}

interface PendingActivity {
  id: number;
  name?: string;
  date?: string;
  participants_count: number;
  certificates_issued: number;
  certificates_pending: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

// Helper component for a loading spinner
const Spinner = () => (
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
);

// Komponen untuk kartu statistik
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  loading = false 
}) => (
  <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
              </p>
                          {/* trend display removed per request */}
            </>
          )}
        </div>
      </div>
      <div className={`rounded-full p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const DashboardAdmin: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingActivities, setPendingActivities] = useState<PendingActivity[] | null>(null);
  const [pendingLoading, setPendingLoading] = useState<boolean>(false);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (!token) {
        setError('Token autentikasi tidak ditemukan. Silakan login kembali.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Configure axios with auth token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      };

      // Fallback zero data when API doesn't return usable payload
      const zeroData: DashboardStats = {
        total_activities: 0,
        total_participants: 0,
        certificates_issued: 0,
        certificates_pending: 0,
        activities_this_month: 0,
        participants_this_month: 0,
        completion_rate: 0,
        recent_activities: [],
      };

      // Try to fetch real dashboard stats from backend
      try {
        const res = await axios.get("/dashboard/stats", config);
        console.log('Dashboard API Response:', res.data);
        
        // Check if response is successful
        if (res.data?.success && res.data?.data) {
          const apiData = res.data.data;
          
          // Map the API response to match your expected structure
          const finalData: DashboardStats = {
            total_activities: apiData.total_activities || apiData.totals?.activities || 0,
            total_participants: apiData.total_participants || apiData.totals?.users || 0,
            certificates_issued: apiData.certificates_issued || 0,
            certificates_pending: apiData.certificates_pending || 0,
            activities_this_month: apiData.activities_this_month || 0,
            participants_this_month: apiData.participants_this_month || 0,
            completion_rate: apiData.completion_rate || 0,
            recent_activities: apiData.recent_activities || [],
            // Include trends if available
            total_activities_trend: apiData.total_activities_trend,
            total_participants_trend: apiData.total_participants_trend,
            activities_this_month_trend: apiData.activities_this_month_trend,
            participants_this_month_trend: apiData.participants_this_month_trend,
            completion_rate_trend: apiData.completion_rate_trend,
          };

          setStats(finalData);
        } else {
          console.warn('API returned unsuccessful response:', res.data);
          setStats(zeroData);
        }
      } catch (err: any) {
        console.error("Error fetching dashboard stats:", err);
        
        // Handle specific error types
        if (err.response?.status === 401) {
          setError('Sesi Anda telah berakhir. Silakan login kembali.');
          // Optionally redirect to login page
          // window.location.href = '/login';
        } else if (err.response?.status === 403) {
          setError('Anda tidak memiliki akses ke dashboard ini.');
        } else if (err.response?.status === 500) {
          // Log more details for 500 errors
          console.error('Server error details:', {
            message: err.response?.data?.message,
            error: err.response?.data?.error,
            data: err.response?.data
          });
          setError('Terjadi kesalahan server. Silakan coba lagi nanti.');
        } else if (err.code === 'ERR_NETWORK') {
          setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        } else {
          setError('Gagal memuat data dashboard.');
        }
        
        setStats(zeroData);
      }
    } catch (error: any) {
      console.error("Unexpected error loading dashboard:", error);
      setError('Terjadi kesalahan tak terduga.');
      setStats({
        total_activities: 0,
        total_participants: 0,
        certificates_issued: 0,
        certificates_pending: 0,
        activities_this_month: 0,
        participants_this_month: 0,
        completion_rate: 0,
        recent_activities: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch per-activity pending breakdown from backend
  const fetchPendingByActivity = useCallback(async () => {
    setPendingLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        setPendingActivities(null);
        setPendingLoading(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
      const res = await axios.get('/dashboard/pending-by-activity?per_page=100', config);
      if (res.data?.success && res.data?.data) {
        const acts = (res.data.data.activities || []).map((a: any) => ({
          id: a.id,
          name: a.name || a.activity_name,
          date: a.date,
          participants_count: a.participants_count ?? 0,
          certificates_issued: a.certificates_issued ?? 0,
          certificates_pending: a.certificates_pending ?? Math.max(0, (a.participants_count ?? 0) - (a.certificates_issued ?? 0)),
        }));
        setPendingActivities(acts);
      } else {
        setPendingActivities(null);
      }
    } catch (e) {
      console.error('Failed to fetch pending-by-activity', e);
      setPendingActivities(null);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // After we have base stats, also try to load detailed pending-by-activity list (non-blocking)
  useEffect(() => {
    if (!loading) fetchPendingByActivity();
  }, [loading, fetchPendingByActivity]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  // Helper function to get activity name
  const getActivityName = (activity: RecentActivity): string => {
    return activity.activity_name || activity.name || `Kegiatan #${activity.id}`;
  };

  // Show error state
  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">
                Gagal Memuat Dashboard
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-60"
              >
                {refreshing ? <Spinner /> : null}
                {refreshing ? "Mencoba lagi..." : "Coba Lagi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show detailed pending lists for activities that actually have pending certificates
  const filteredPendingActivities = (pendingActivities || []).filter(a => (a.certificates_pending ?? 0) > 0);
  const filteredRecentPending = (stats?.recent_activities || []).filter(a => {
    const pending = (a.participants_count ?? 0) - (a.certificates_issued ?? 0);
    return pending > 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Admin
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Overview sistem manajemen sertifikat
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 disabled:opacity-60"
        >
          {refreshing ? <Spinner /> : null}
          {refreshing ? "Memuat..." : "Refresh Data"}
        </button>
      </div>

      {/* Error Alert (if error but stats exist) */}
      {error && stats && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-orange-800 dark:text-orange-200">
                Peringatan
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Kegiatan"
          value={stats?.total_activities || 0}
          icon={CalendarDaysIcon}
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          title="Total Peserta"
          value={stats?.total_participants || 0}
          icon={UserGroupIcon}
          color="bg-green-500"
          loading={loading}
        />
        <StatCard
          title="Sertifikat Terkirim"
          value={stats?.certificates_issued || 0}
          icon={DocumentCheckIcon}
          color="bg-indigo-500"
          loading={loading}
        />
        <StatCard
          title="Sertifikat Pending"
          value={stats?.certificates_pending || 0}
          icon={ClockIcon}
          color="bg-orange-500"
          loading={loading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Kegiatan Bulan Ini"
          value={stats?.activities_this_month || 0}
          icon={ChartBarIcon}
          color="bg-purple-500"
          loading={loading}
        />
        <StatCard
          title="Peserta Bulan Ini"
          value={stats?.participants_this_month || 0}
          icon={UserGroupIcon}
          color="bg-teal-500"
          loading={loading}
        />
  {/* 'Tingkat Penyelesaian' card removed as requested */}
      </div>

      {/* Recent Activities Table */}
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Kegiatan Terbaru
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {stats?.recent_activities?.length || 0} kegiatan terakhir
          </span>
        </div>
        
        {loading ? (
          <div className="py-8 text-center">
            <Spinner />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Memuat data kegiatan...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="w-8 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    No
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Nama Kegiatan
                  </th>
                  <th className="w-24 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Tanggal
                  </th>
                  <th className="w-20 p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Peserta
                  </th>
                  <th className="w-24 p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Sertifikat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats && stats.recent_activities && stats.recent_activities.length > 0 ? (
                  stats.recent_activities.map((activity, idx) => (
                    <tr key={activity.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                        {getActivityName(activity)}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-3 text-center text-gray-900 dark:text-gray-100">
                        {activity.participants_count || 0}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-gray-900 dark:text-gray-100">
                            {activity.certificates_issued || 0}
                          </span>
                          {activity.certificates_issued === activity.participants_count ? (
                            <div className="h-2 w-2 rounded-full bg-green-500" title="Semua sertifikat terkirim"></div>
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-orange-500" title="Ada sertifikat pending"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      Belum ada data kegiatan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

  {/* Alert/Warning Section */}
  {stats && stats.certificates_pending > 0 && (filteredPendingActivities.length > 0 || filteredRecentPending.length > 0) && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-orange-800 dark:text-orange-200">
                Perhatian: Sertifikat Pending
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                Terdapat {stats.certificates_pending} sertifikat yang belum terkirim. 
                Silakan periksa dan proses sertifikat yang tertunda.
              </p>
              {/* Prefer detailed pendingActivities returned by backend; fallback to recent_activities */}
              {pendingLoading ? (
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">Memuat rincian kegiatan yang pending...</div>
              ) : (filteredPendingActivities.length > 0) ? (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">Rincian Pending per Kegiatan</h4>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {filteredPendingActivities.map((act) => (
                      <li key={act.id} className="flex items-center justify-between gap-3">
                        <div className="truncate">
                          <a href={`/admin/activity-management/${act.id}`} className="font-medium text-orange-900 dark:text-orange-100 hover:underline">
                            {act.name}
                          </a>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{act.participants_count || 0} peserta</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-200">{act.certificates_pending} pending</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                // fallback to recent_activities if detailed list not available
                filteredRecentPending.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">Rincian Pending per Kegiatan (terbaru)</h4>
                    <ul className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {filteredRecentPending.map((act) => {
                        const pending = (act.participants_count || 0) - (act.certificates_issued || 0);
                        return (
                          <li key={act.id} className="flex items-center justify-between gap-3">
                            <div className="truncate">
                              <a href={`/admin/activity-management/${act.id}`} className="font-medium text-orange-900 dark:text-orange-100 hover:underline">
                                {getActivityName(act)}
                              </a>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{act.participants_count || 0} peserta</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-200">{pending} pending</div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;