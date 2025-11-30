<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserCertificate;
use App\Models\CertificateDownload;
use App\Models\Sertifikat;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Return dashboard summary for authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Allow roles 3, 4, and 5
        if (empty($user) || !in_array((int)($user->role_id ?? 0), [3, 4, 5])) {
            return response()->json(['status' => 'forbidden', 'message' => 'Akses tidak diizinkan'], 403);
        }

        // total certificates assigned that have been emailed by admin (sent_at not null)
        $total = UserCertificate::where('user_id', $user->id)
            ->whereHas('certificateDownload', function ($q) {
                $q->whereNotNull('sent_at');
            })->count();

        // latest 5 certificates (eager-load related data activity)
        $latest = UserCertificate::with(['certificateDownload.dataActivity'])
            ->where('user_id', $user->id)
            ->whereHas('certificateDownload', function ($q) {
                $q->whereNotNull('sent_at');
            })
            ->orderBy('assigned_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($uc) {
                $activity = $uc->certificateDownload->dataActivity ?? null;
                $activityName = $activity->title ?? $activity->activity_name ?? $uc->certificateDownload->filename ?? null;
                
                // determine activity id: prefer the related dataActivity id, fallback to user_certificate or certificate_download
                $activityId = $activity->id ?? $uc->data_activity_id ?? $uc->certificateDownload->data_activity_id ?? null;
                
                return [
                    'id' => $uc->id,
                    'certificate_number' => $uc->certificateDownload->certificate_number ?? null,
                    'filename' => $uc->certificateDownload->filename ?? null,
                    'activity_name' => $activityName,
                    'data_activity_id' => $activityId,
                    'assigned_at' => $uc->assigned_at?->toDateTimeString() ?? null,
                    'download_url' => url('/sertifikat-templates/download/' . ($uc->certificateDownload->token ?? '')),
                ];
            });

        return response()->json([
            'status' => 'ok',
            'data' => [
                'total_certificates' => $total,
                'latest' => $latest,
            ]
        ]);
    }

    /**
     * Return paginated certificates for the authenticated user.
     */
    public function myCertificates(Request $request)
    {
        $user = $request->user();

        if (empty($user) || !in_array((int)($user->role_id ?? 0), [3, 4, 5])) {
            return response()->json(['status' => 'forbidden', 'message' => 'Akses tidak diizinkan'], 403);
        }

        $perPage = (int) $request->query('per_page', 20);

        $query = UserCertificate::with(['certificateDownload.dataActivity'])
            ->where('user_id', $user->id)
            ->whereHas('certificateDownload', function ($q) {
                $q->whereNotNull('sent_at');
            })
            ->orderBy('assigned_at', 'desc');

        $page = (int) max(1, $request->query('page', 1));
        $items = $query->skip(($page - 1) * $perPage)->take($perPage)->get();
        $total = $query->count();

        $data = $items->map(function ($uc) use ($user) {
            $activity = $uc->certificateDownload->dataActivity ?? null;
            $activityName = $activity->title ?? $activity->activity_name ?? $uc->certificateDownload->filename ?? null;

            // determine activity id: prefer the related dataActivity id, fallback to user_certificate or certificate_download
            $activityId = $activity->id ?? $uc->data_activity_id ?? $uc->certificateDownload->data_activity_id ?? null;

            // fetch pivot 'type' from data_activity_user for this user and activity (if available)
            $pivotType = null;
            if ($activityId) {
                $pivotType = DB::table('data_activity_user')
                    ->where('user_id', $user->id)
                    ->where('data_activity_id', $activityId)
                    ->value('type');
            }

            // fetch nama instruktur and lokasi from DataActivity model (avoid typos)
            // DataActivity defines a relation ->instruktur (Instruktur model) and uses 'location' field
            $namaInstruktur = $activity?->instruktur?->name ?? null;
            $lokasi = $activity->location ?? null;

            return [
                'id' => $uc->id,
                'certificate_number' => $uc->certificateDownload->certificate_number ?? null,
                'filename' => $uc->certificateDownload->filename ?? null,
                'activity_name' => $activityName,
                'data_activity_id' => $activityId, // menambahkan ID kegiatan
                'type' => $pivotType,
                'nama_instruktur' => $namaInstruktur,
                'lokasi' => $lokasi,
                'assigned_at' => $uc->assigned_at?->toDateTimeString() ?? null,
                'download_url' => url('/sertifikat-templates/download/' . ($uc->certificateDownload->token ?? '')),
            ];
        });

        return response()->json([
            'status' => 'ok',
            'data' => $data,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
            ]
        ]);
    }

    /**
     * Return activities user participated in with pivot data.
     */
    public function activities(Request $request)
    {
        $user = $request->user();

        if (empty($user) || !in_array((int)($user->role_id ?? 0), [3, 4, 5])) {
            return response()->json(['status' => 'forbidden', 'message' => 'Akses tidak diizinkan'], 403);
        }

        $activities = $user->daftarActivity()->get()->map(function ($a) {
            return [
                'id' => $a->id,
                'activity_name' => $a->activity_name ?? null,
                'certificate_number' => $a->pivot->certificate_number ?? null,
                'tanggal_sertifikat' => $a->pivot->tanggal_sertifikat ?? null,
            ];
        });

        return response()->json(['status' => 'ok', 'data' => $activities]);
    }

    /**
     * Return certificate download + template data for preview.
     */
    public function previewCertificate(Request $request, $downloadId)
    {
        try {
            $user = $request->user();

            if (empty($user) || !in_array((int)($user->role_id ?? 0), [3, 4, 5])) {
                return response()->json(['status' => 'forbidden', 'message' => 'Akses tidak diizinkan'], 403);
            }

            $uc = UserCertificate::with(['certificateDownload'])
                ->where('user_id', $user->id)
                ->where('id', $downloadId)
                ->whereHas('certificateDownload', function ($q) {
                    $q->whereNotNull('sent_at');
                })->firstOrFail();

            $download = $uc->certificateDownload;
            if (!$download) return response()->json(['status' => 'error', 'message' => 'Certificate download not found'], 404);

            $template = Sertifikat::find($download->sertifikat_id);

            $backgroundAbsolute = null;
            if (!empty($template->background_image) && Storage::disk('public')->exists($template->background_image)) {
                $backgroundAbsolute = Storage::disk('public')->path($template->background_image);
            }

            // prepare minimal payload similar to previewByUserCertificate
            $qrTarget = rtrim(config('app.frontend_url') ?: config('app.url'), '/') . '/peserta?certificate_number=' . urlencode($download->certificate_number);
            $qrPng = null; // frontend can generate QR from qrTarget or use server endpoint

            return response()->json([
                'status' => 'ok',
                'data' => [
                    'download' => $download,
                    'template' => $template,
                    'background' => $backgroundAbsolute,
                    'qr_target' => $qrTarget,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['status' => 'error', 'message' => 'Not found'], 404);
        } catch (\Exception $e) {
            Log::error('previewCertificate error', ['err' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
    
