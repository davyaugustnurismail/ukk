<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\DataActivity;
use App\Models\Sertifikat;
use App\Models\Instruktur;
use App\Models\CertificateTask;
use App\Models\CertificateDownload;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Return statistics for admin dashboard.
     */
    public function stats(Request $request)
    {
        try {
            $merchantId = $request->user() ? $request->user()->merchant_id : null;

            // Get current month dates (use DataActivity.date for month filters)
            $currentMonth = Carbon::now()->startOfMonth();
            $endOfCurrentMonth = Carbon::now()->endOfMonth();
            $lastMonth = Carbon::now()->subMonth()->startOfMonth();
            $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

            // Basic counts with error handling
            // Total participants should be counted from activities (data_activity_user pivot)
            $totalUsers = $this->getParticipantsCountByActivities($merchantId);
            $totalActivities = $this->getModelCount(DataActivity::class, $merchantId);
            $totalTemplates = $this->getModelCount(Sertifikat::class, $merchantId);
            $totalInstrukturs = $this->getModelCount(Instruktur::class, $merchantId);

            // Monthly counts for activities based on DataActivity.date
            $activitiesThisMonth = $this->getModelCount(DataActivity::class, $merchantId, $currentMonth, $endOfCurrentMonth);
            $activitiesLastMonth = $this->getModelCount(DataActivity::class, $merchantId, $lastMonth, $endOfLastMonth);

            // Monthly counts for participants (users) — count participants of activities whose data_activity.date falls in the month
            $participantsThisMonth = $this->getParticipantsCountByActivities($merchantId, $currentMonth, $endOfCurrentMonth);
            $participantsLastMonth = $this->getParticipantsCountByActivities($merchantId, $lastMonth, $endOfLastMonth);

            // Certificate statistics
            $certificatesIssued = $this->getCertificatesCount($merchantId, 'issued');
            $certificatesPending = $this->getCertificatesCount($merchantId, 'pending');

            // Completion rate calculation
            $completionRate = $totalActivities > 0 ? 
                round(($certificatesIssued / ($totalActivities * 10)) * 100, 1) : 0; // Assuming avg 10 participants per activity

            // Recent activities with participant counts
            $recentActivities = $this->getRecentActivities($merchantId);

            // Calculate trends
            $calculateTrend = function($current, $previous) {
                if ($previous == 0) {
                    return $current > 0 ? ['value' => 100, 'isPositive' => true] : null;
                }
                $change = (($current - $previous) / $previous) * 100;
                return [
                    'value' => abs(round($change, 1)),
                    'isPositive' => $change >= 0
                ];
            };

            // Prepare response data
            $responseData = [
                // Main stats
                'total_activities' => $totalActivities,
                'total_participants' => $totalUsers,
                'certificates_issued' => $certificatesIssued,
                'certificates_pending' => $certificatesPending,
                'activities_this_month' => $activitiesThisMonth,
                'participants_this_month' => $participantsThisMonth,
                'completion_rate' => $completionRate,
                
                // Recent activities
                'recent_activities' => $recentActivities,
                
                // Trends (only if we have previous month data)
                'activities_this_month_trend' => $calculateTrend($activitiesThisMonth, $activitiesLastMonth),
                'participants_this_month_trend' => $calculateTrend($participantsThisMonth, $participantsLastMonth),
                
                // Legacy structure for compatibility
                'totals' => [
                    'users' => $totalUsers,
                    'activities' => $totalActivities,
                    'templates' => $totalTemplates,
                    'instrukturs' => $totalInstrukturs,
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $responseData,
                'message' => 'Dashboard statistics fetched successfully.'
            ]);

        } catch (\Exception $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return a proper error response
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard statistics.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'data' => [
                    // Return zero data so frontend can still display
                    'total_activities' => 0,
                    'total_participants' => 0,
                    'certificates_issued' => 0,
                    'certificates_pending' => 0,
                    'activities_this_month' => 0,
                    'participants_this_month' => 0,
                    'completion_rate' => 0,
                    'recent_activities' => [],
                    'totals' => [
                        'users' => 0,
                        'activities' => 0,
                        'templates' => 0,
                        'instrukturs' => 0,
                    ],
                ]
            ], 500);
        }
    }

    /**
     * Get count with optional date range filtering
     */
    private function getModelCount($modelClass, $merchantId = null, $startDate = null, $endDate = null)
    {
        try {
            $query = $modelClass::query();
            
            if ($merchantId) {
                $query->where('merchant_id', $merchantId);
            }
            
            // For DataActivity, use 'date' field; for others use 'created_at'
            if ($startDate && $endDate) {
                $dateField = ($modelClass === DataActivity::class) ? 'date' : 'created_at';
                $query->whereBetween($dateField, [$startDate, $endDate]);
            } elseif ($startDate) {
                $dateField = ($modelClass === DataActivity::class) ? 'date' : 'created_at';
                $query->where($dateField, '>=', $startDate);
            }
            
            return $query->count();
        } catch (\Exception $e) {
            Log::warning("Count query failed for {$modelClass}: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get certificates count by status (issued or pending)
     */
    private function getCertificatesCount($merchantId = null, $status = 'issued')
    {
        try {
            $query = CertificateDownload::query();

            if ($merchantId) {
                $query->whereHas('dataActivity', function($q) use ($merchantId) {
                    $q->where('merchant_id', $merchantId);
                });
            }

            if ($status === 'issued') {
                $query->whereNotNull('sent_at');
            } elseif ($status === 'pending') {
                $query->whereNull('sent_at');
            }

            return $query->count();
        } catch (\Exception $e) {
            Log::warning("Certificates count query failed for status {$status}: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get recent activities with safe loading
     */
    private function getRecentActivities($merchantId = null)
    {
        try {
            $query = DataActivity::query();
            
            if ($merchantId) {
                $query->where('merchant_id', $merchantId);
            }
            
            $activities = $query
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            return $activities->map(function ($activity) {
                // Count participants using the peserta relationship
                $participantsCount = 0;
                $certificatesIssued = 0;
                
                try {
                    // Use the peserta relationship that exists in the model
                    $participantsCount = $activity->peserta()->count();
                    
                    // Count certificates through certificateDownloads relationship
                    $certificatesIssued = $activity->certificateDownloads()->count();
                } catch (\Exception $e) {
                    Log::warning("Error counting participants/certificates for activity {$activity->id}: " . $e->getMessage());
                }

                return [
                    'id' => $activity->id,
                    'name' => $activity->activity_name ?? 'Kegiatan #' . $activity->id,
                    'activity_name' => $activity->activity_name ?? 'Kegiatan #' . $activity->id,
                    'date' => $activity->date ? 
                        Carbon::parse($activity->date)->format('Y-m-d') : 
                        $activity->created_at->format('Y-m-d'),
                    'participants_count' => $participantsCount,
                    'certificates_issued' => $certificatesIssued,
                ];
            })->toArray();
            
        } catch (\Exception $e) {
            Log::warning("Recent activities query failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count activity participations from data_activity_user pivot (one user attending two activities counts as 2).
     * Optionally restrict to merchant and date range via DataActivity.date.
     */
    private function getParticipantsCountByActivities($merchantId = null, $startDate = null, $endDate = null)
    {
        try {
            // Build query joining data_activity so we can filter by activity.date and merchant
            $query = DB::table('data_activity_user')
                ->join('data_activity', 'data_activity.id', '=', 'data_activity_user.data_activity_id');

            if ($merchantId) {
                $query->where('data_activity.merchant_id', $merchantId);
            }

            if ($startDate) {
                // Ensure we compare date strings (data_activity.date is likely DATE)
                $start = $startDate instanceof \Carbon\Carbon ? $startDate->format('Y-m-d') : (string)$startDate;
                if ($endDate) {
                    $end = $endDate instanceof \Carbon\Carbon ? $endDate->format('Y-m-d') : (string)$endDate;
                    $query->whereBetween('data_activity.date', [$start, $end]);
                } else {
                    $query->where('data_activity.date', '>=', $start);
                }
            }

            // Count pivot rows (each participation)
            return (int) $query->count();
        } catch (\Exception $e) {
            Log::warning('Participants count by activities failed: ' . $e->getMessage());
            return 0;
        }
    }

    public function pendingByActivity(Request $request)
    {
        $perPage = min(100, (int) $request->query('per_page', 25));
        $page = max(1, (int) $request->query('page', 1));
        $recentOnly = filter_var($request->query('recent_only', false), FILTER_VALIDATE_BOOLEAN);
        $sort = $request->query('sort', null);

        // Base query for activities
        $query = DataActivity::query();

        if ($recentOnly) {
            $query->orderBy('date', 'desc');
        }

        // join with peserta (participants) count
        $query->withCount('peserta as participants_count');

        // Count certificates issued (rows in certificate_downloads with sent_at set)
        $query->withCount([
            'certificateDownloads as certificates_issued' => function ($q) {
                $q->whereNotNull('sent_at');
            }
        ]);

        // you might want to limit to activities that have any pending: we'll compute pending later
        $result = $query->paginate($perPage);

        $activities = $result->getCollection()->map(function ($act) {
                $participants = (int) ($act->participants_count ?? 0);
                $issued = (int) ($act->certificates_issued ?? 0);
                $pending = max(0, $participants - $issued);
            return [
                'id' => $act->id,
                'name' => $act->name ?? $act->activity_name ?? 'Kegiatan #' . $act->id,
                'date' => optional($act->date)->toDateString() ?? null,
                'participants_count' => $participants,
                'certificates_issued' => $issued,
                'certificates_pending' => $pending,
            ];
        });

        // Simpler: compute total pending as total participants (pivot rows) - total issued (downloads with sent_at)
        $totalParticipants = DB::table('data_activity_user')->count();
        $totalIssued = DB::table('certificate_downloads')->whereNotNull('sent_at')->count();
        $total_certificates_pending = max(0, $totalParticipants - $totalIssued);

        return response()->json([
            'success' => true,
            'data' => [
                'total_certificates_pending' => (int) $total_certificates_pending,
                'activities' => $activities,
                'meta' => [
                    'page' => $result->currentPage(),
                    'per_page' => $result->perPage(),
                    'total' => $result->total(),
                ],
            ],
        ]);
    }
}