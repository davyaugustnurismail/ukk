<?php

namespace App\Http\Controllers\DataActivity;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\DataActivity;
use App\Models\Instruktur;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Sertifikat;
use Dflydev\DotAccessData\Data;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class DataActivityController extends Controller
{
    /**
     * Helper function to handle Base64 encoded images embedded in a string.
     * It saves them as files and replaces the src attribute with the new URL.
     */


    public function updateSertifikatTemplate(Request $request, $id)
    {
        try {
            $request->validate([
                'sertifikat_template_id' => 'required|exists:sertifikats,id',
            ]);

            $dataActivity = DataActivity::findOrFail($id);
            $dataActivity->sertifikat_id = $request->sertifikat_template_id;
            $dataActivity->save();

            // Tambahkan data sertifikat ke response
            $dataActivity->load('sertifikat');  // Eager load relasi sertifikat

            return response()->json([
                'message' => 'Template sertifikat berhasil disimpan',
                'data' => $dataActivity
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menyimpan template sertifikat',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getCertificateTemplates(Request $request)
    {
    $user = $request->user();
    if(!$user) {
        return response()->json([
            'message' => 'User not authorized',
            'error' => 'Unauthenticated'
        ], 401);
    }
    $templates = Sertifikat::select('id', 'name', 'is_active')
                            ->where('is_active', true)
                            ->where('merchant_id', $user->merchant_id)
                            ->get();
    return response()->json([
        'data' => $templates,
        'message' => 'Template sertifikat berhasil diambil'
    ]);


    }


    private function handleEmbeddedImages($description)
    {
        $pattern = '/<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/i';
        return preg_replace_callback($pattern, function ($matches) {
            $ext = $matches[1];
            $base64 = $matches[2];
            $imageData = base64_decode($base64);
            $filename = 'activity_images/' . uniqid() . '.' . $ext;

            try {
                // Ensure directory exists on the public disk
                if (!Storage::disk('public')->exists('activity_images')) {
                    Storage::disk('public')->makeDirectory('activity_images');
                }

                // Store the file on the public disk
                Storage::disk('public')->put($filename, $imageData);
                // Storage::url may not be available for the configured driver; use asset() to keep behavior consistent
                $url = asset('storage/' . $filename);
            } catch (\Exception $e) {
                // Fallback: try writing directly to public/storage
                $path = public_path('storage/' . $filename);
                $dir = dirname($path);
                if (!is_dir($dir)) {
                    @mkdir($dir, 0755, true);
                }
                @file_put_contents($path, $imageData);
                $url = asset('storage/' . $filename);
            }
            return '<img src="' . $url . '" />';
        }, $description);
    }

    /**
     * Display a listing of the resource with search, sort, and pagination.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'message' => 'User not authenticated',
                'error' => 'Unauthorized'
            ], 401);
        }

        $perPage = max(5, (int) $request->input('perPage', 10));

        $query = DataActivity::with(['activityType', 'instruktur', 'peserta'])
            ->where('merchant_id', $user->merchant_id);

        if ($user->role_id == 2) {
            $query->where('instruktur_id', $user->id);
        }

        $activities = $query->orderBy('created_at', 'desc')->get();
        // Format response
        $result = $activities->map(function ($item) {
            return [
                'id' => $item->id,
                'activity_name' => $item->activity_name,
                'date' => $item->date,
                'time_start' => $item->time_start,
                'time_end' => $item->time_end,
                'activity_type_id' => $item->activity_type_id,
                'activity_type_name' => $item->activityType->type_name ?? null,
                'location' => $item->location,
                'description' => $item->description,
                'status' => $item->status,
                'instruktur_id' => $item->instruktur_id,
                'instruktur_name' => $item->instruktur->name ?? null,
                'total_peserta' => $item->peserta->count(),
                'merchant_id' => $item->merchant_id,
                'generated' => $item->generated ? true : false,
            ];
        });

        $total = $activities->count();
        $totalPages = (int) max(1, ceil($total / $perPage));

        return response()->json([
            'total' => $total,
            'total_pages' => $totalPages,
            'per_page' => $perPage,
            'message' => 'Data kegiatan berhasil diambil.',
            'data' => $result,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'activity_name' => 'required|string|max:255',
            'date' => 'required|date|after_or_equal:' . now()->subWeek()->format('Y-m-d'),
            'time_start' => 'required|date_format:H:i',
            'time_end' => 'required|date_format:H:i|after:time_start',
            'activity_type_id' => 'required|exists:data_activity_types,id',
            'location' => 'required|string',
            'description' => 'nullable|string',
            'instruktur_id' => 'required|exists:instrukturs,id',
            'merchant_id' => 'required|exists:merchants,id',
        ]);

        $description = $request->description ? $this->handleEmbeddedImages($request->description) : null;

        $dataActivity = DataActivity::create([
            'activity_name' => $request->activity_name,
            'date' => $request->date,
            'time_start' => $request->time_start,
            'time_end' => $request->time_end,
            'activity_type_id' => $request->activity_type_id,
            'location' => $request->location,
            'description' => $description,
            'instruktur_id' => $request->instruktur_id,
            'merchant_id' => $request->merchant_id,
        ]);

        // Create a notification for the assigned instruktur (non-blocking)
        try {
            if ($dataActivity->instruktur_id) {
                // Ensure instruktur_id is numeric before querying
                if (is_numeric($dataActivity->instruktur_id)) {
                    $instruktur = Instruktur::find((int) $dataActivity->instruktur_id);
                    if ($instruktur) {
                        // Use notification format similar to admin notifications
                        \App\Models\InstrukturNotification::create([
                            'instruktur_id' => $instruktur->id,
                            'message' => 'Anda ditugaskan sebagai instruktur untuk kegiatan "' . $dataActivity->activity_name . '"',
                            'data' => [
                                'data_activity_id' => $dataActivity->id,
                                'date' => Carbon::parse($dataActivity->date)->toDateString(),
                            ],
                            'is_read' => false
                        ]);
                    }
                } else {
                    Log::warning('Skipped creating instruktur notification because instruktur_id is not numeric: ' . var_export($dataActivity->instruktur_id, true));
                }
            }
        } catch (\Exception $e) {
            // Log the notification failure but don't fail the request
            Log::warning('Failed to create instruktur notification: ' . $e->getMessage());
        }
        return response()->json([
            'data' => $dataActivity,
            'message' => 'Data kegiatan berhasil dibuat.'
        ], 201);
    }

    /**
     * Display the specified resource along with the total participant count.
     */
    public function show(string $id)
    {
        $dataActivity = DataActivity::with(['activityType', 'instruktur', 'peserta', 'panitia', 'narasumber', 'sertifikat', 'certificateDownloads'])
            ->find($id);

        if (!$dataActivity) {
            return response()->json(['message' => 'Data kegiatan tidak ditemukan.'], 404);
        }

        // Compute latest sent_at (from certificate_downloads) safely before building the response
        $latestSentAt = null;
        try {
                if ($dataActivity->relationLoaded('certificateDownloads')) {
                    $sentAt = $dataActivity->certificateDownloads->pluck('sent_at')->filter()->max();
                } else {
                    $sentAt = DB::table('certificate_downloads')
                        ->where('data_activity_id', $dataActivity->id)
                        ->whereNotNull('sent_at')
                        ->max('sent_at');
                }

            $latestSentAt = $sentAt ? Carbon::parse($sentAt)->toDateTimeString() : null;
        } catch (\Exception $e) {
            Log::warning('Failed to compute latest sent_at for data_activity ' . $dataActivity->id . ': ' . $e->getMessage());
            $latestSentAt = null;
        }

        // Use certificate_downloads to compute sent/pending counts and map sent status to peserta
    $certDownloads = $dataActivity->certificateDownloads ?? collect();

        $sentCount = $certDownloads->whereNotNull('sent_at')->count();
        $pendingCount = $certDownloads->whereNull('sent_at')->count();

        // Map certificate downloads by user_id for quick lookup (some downloads may be for users)
    $downloadsByUser = $certDownloads->groupBy('user_id');

            // Annotate peserta list with certificate status
            // Use the relation collections as source-of-truth (pivot.type indicates role at activity level)
            $annotatedPeserta = $dataActivity->peserta->map(function ($user) use ($downloadsByUser) {
                $userDownloads = $downloadsByUser->get($user->id, collect());
                $latest = $userDownloads->pluck('sent_at')->filter()->max();
                return array_merge($user->toArray(), [
                    'certificate_sent' => $latest ? true : false,
                    'sent_at' => $latest ? Carbon::parse($latest)->toDateTimeString() : null,
                    // expose activity-level role from pivot (panitia/peserta/narasumber)
                    'activity_role' => $user->pivot->type ?? null,
                ]);
            });

            $annotatedPanitia = $dataActivity->panitia->map(function ($user) use ($downloadsByUser) {
                $userDownloads = $downloadsByUser->get($user->id, collect());
                $latest = $userDownloads->pluck('sent_at')->filter()->max();
                return array_merge($user->toArray(), [
                    'certificate_sent' => $latest ? true : false,
                    'sent_at' => $latest ? Carbon::parse($latest)->toDateTimeString() : null,
                    'activity_role' => $user->pivot->type ?? null,
                ]);
            });

            $annotatedNarasumber = $dataActivity->narasumber->map(function ($user) use ($downloadsByUser) {
                $userDownloads = $downloadsByUser->get($user->id, collect());
                $latest = $userDownloads->pluck('sent_at')->filter()->max();
                return array_merge($user->toArray(), [
                    'certificate_sent' => $latest ? true : false,
                    'sent_at' => $latest ? Carbon::parse($latest)->toDateTimeString() : null,
                    'activity_role' => $user->pivot->type ?? null,
                ]);
            });

        // (removed redundant filtered annotatedPanitia / annotatedNarasumber —
        // we use the relation collections directly above and annotate them)

        // Format respons agar lebih jelas
        $result = [
            'id' => $dataActivity->id,
            'activity_name' => $dataActivity->activity_name,
            'date' => $dataActivity->date,
            'time_start' => $dataActivity->time_start,
            'time_end' => $dataActivity->time_end,
            'activity_type_id' => $dataActivity->activityType->id ?? null,
            'activity_type_name' => $dataActivity->activityType->type_name ?? null,
            'location' => $dataActivity->location ?? null,
            'description' => $dataActivity->description,
            'status' => $dataActivity->status,
            'instruktur_id' => $dataActivity->instruktur->id ?? null,
            'instruktur_name' => $dataActivity->instruktur->name ?? null,
            'peserta' => $annotatedPeserta,
            'panitia' => $annotatedPanitia,
            'narasumber' => $annotatedNarasumber,
            // totals derived from the annotated collections (consistent with payload arrays)
            'total_peserta' => $annotatedPeserta->count(),
            'total_panitia' => $annotatedPanitia->count(),
            'total_narasumber' => $annotatedNarasumber->count(),
            'sertifikat_id' => $dataActivity->sertifikat_id,
            'sertifikat' => $dataActivity->sertifikat,
            'merchant_id' => $dataActivity->merchant_id,
            // sent_at derived from certificate_downloads (latest sent_at)
            'sent_at' => $latestSentAt,
            'certificates' => [
                'sent' => $sentCount,
                'pending' => $pendingCount,
            ],
        ];

        return response()->json([
            'data' => $result,
            'message' => 'Detail data kegiatan berhasil diambil.'
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $dataActivity = DataActivity::find($id);

        if (!$dataActivity) {
            return response()->json(['message' => 'Data kegiatan tidak ditemukan.'], 404);
        }

        $request->validate([
            'activity_name' => 'sometimes|required|string|max:255',
            'date' => 'sometimes|required|date|after_or_equal:' . now()->subWeek()->format('Y-m-d'),
            'time_start' => 'sometimes|required|date_format:H:i',
            'time_end' => 'sometimes|required|date_format:H:i|after:time_start',
            'activity_type_id' => 'sometimes|required|exists:data_activity_types,id',
            'location' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'instruktur_id' => 'sometimes|required|exists:instrukturs,id',
            'merchant_id' => 'sometimes|required|exists:merchants,id',
        ]);

        $payload = $request->all();

        if ($request->has('description')) {
            $payload['description'] = $request->description ? $this->handleEmbeddedImages($request->description) : null;
        }

        $dataActivity->update($payload);

        return response()->json([
            'data' => $dataActivity,
            'message' => 'Data kegiatan berhasil diperbarui.'
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $dataActivity = DataActivity::find($id);

        if (!$dataActivity) {
            return response()->json(['message' => 'Data kegiatan tidak ditemukan.'], 404);
        }

        $dataActivity->delete();

        return response()->json(['message' => 'Data kegiatan berhasil dihapus.'], 200);
    }

    public function attachTemplates(Request $request, $activityId)
    {
        // Validasi ActivityId
        if (!is_numeric($activityId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter activityId harus berupa angka.'
            ], 400);
        }
        // Request Data Untuk Dikirim
        try {
            $validated = $request->validate([
                'sertifikat_id' => 'required|array',
                'admin_id' => 'required|exists:admins,id',
                'sertifikat_id.*' => 'exists:sertifikats,id'
            ]);

            $dataActivity = DataActivity::findOrFail($activityId);
            // Status dibuat menjadi Pending
            $dataActivity->status = "Pending";
            $dataActivity->save();

            // Ambil admin yang login
            $admin_id = (int) $validated['admin_id'];
            $admin = Admin::where('id', $admin_id)->first();
            $adminName = $admin ? $admin->name : null;
            if (!$adminName) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin tidak ditemukan.'
                ], 403);
            }

            // Validasi merchant_id pada dataActivity
            if (!$dataActivity->merchant_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'merchant_id tidak ditemukan pada data activity.'
                ], 400);
            }

            // Validasi instruktur memiliki signature
            if ($dataActivity->instruktur_id) {
                if (is_numeric($dataActivity->instruktur_id)) {
                    $instruktur = Instruktur::find((int) $dataActivity->instruktur_id);
                    if (!$instruktur) {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Instruktur tidak ditemukan.'
                        ], 404);
                    }
                    if (empty($instruktur->signature)) {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Instruktur belum memiliki signature.'
                        ], 422);
                    }
                } else {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'instruktur_id tidak valid.'
                    ], 400);
                }
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data activity tidak memiliki instruktur yang ditugaskan.'
                ], 400);
            }

            $alreadySent = [];
            $attachedTemplates = []; // Mengambil data Template yang dikirim melalui array
            foreach ($validated['sertifikat_id'] as $templateId) {
                $existing = $dataActivity->sertifikat()
                    ->wherePivot('sertifikat_id', $templateId)
                    ->wherePivot('status', '!=', 'approved')
                    ->first();

                if ($existing) {
                    $alreadySent[] = $templateId;
                    continue;
                }

                // Tambahkan nama admin ke kolom pivot (pastikan kolomnya ada)
                $dataActivity->sertifikat()->attach($templateId, [
                    'status' => 'pending',
                    'is_active' => false,
                    'sent_by_admin_name' => $adminName,
                    'sent_at' => Carbon::now()
                ]);

                // collect for notification to instruktur later
                $attachedTemplates[] = $templateId;

                // Jika merchant_id = 1, attach juga ke instruktur dengan merchant_id = 1
                if ($dataActivity->merchant_id == 1) {
                    if (is_numeric($dataActivity->instruktur_id)) {
                        $instruktur = Instruktur::find((int) $dataActivity->instruktur_id);
                        if ($instruktur && $instruktur->merchant_id == 1) {
                            // Di sini bisa tambahkan logika khusus jika perlu
                            // Misal: update kolom pivot lain, atau log, dsb.
                        }
                    } else {
                        Log::warning('attachTemplates skipped instruktur lookup because instruktur_id is not numeric: ' . var_export($dataActivity->instruktur_id, true));
                    }
                }
            }

            if (!empty($alreadySent)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Beberapa template sudah pernah dikirim dan belum di-approve.',
                    'already_sent' => $alreadySent
                ], 409);
            }

            // Notify the assigned instruktur that new templates were attached (non-blocking)
            try {
                if (!empty($attachedTemplates) && $dataActivity->instruktur_id) {
                    if (is_numeric($dataActivity->instruktur_id)) {
                        $instruktur = Instruktur::find((int) $dataActivity->instruktur_id);
                        if ($instruktur) {
                            $message = 'Admin mengirim ' . count($attachedTemplates) . ' template baru untuk kegiatan "' . $dataActivity->activity_name . '".';
                            // Use admin-like payload: include data_activity_id and sertifikat_ids
                            \App\Models\InstrukturNotification::create([
                                'instruktur_id' => $instruktur->id,
                                'message' => $message,
                                'data' => [
                                    'data_activity_id' => $dataActivity->id,
                                    'sertifikat_ids' => $attachedTemplates,
                                    'date' => Carbon::parse($dataActivity->date)->toDateString(),
                                ],
                                'is_read' => false
                            ]);
                        }
                    } else {
                        Log::warning('attachTemplates skipped creating instruktur notification because instruktur_id is not numeric: ' . var_export($dataActivity->instruktur_id, true));
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Failed to create instruktur notification (attachTemplates): ' . $e->getMessage());
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Templates attached successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error attaching templates: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menampilkan semua template yang terpasang pada data activity
     */
    public function listTemplates($activityId)
    {
        if (!is_numeric($activityId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter activityId harus berupa angka.'
            ], 400);
        }
        try {
            $dataActivity = DataActivity::findOrFail($activityId);
            
            $templates = $dataActivity->sertifikat()
                ->with(['downloads']) // Include any needed relations
                ->get()
                ->map(function ($template) {
                    return [
                        'id' => $template->id,
                        'name' => $template->name,
                        'background_image' => $template->background_image,
                        'status' => $template->pivot->status,
                        'is_active' => $template->pivot->is_active,
                        'sent_by_admin_name' => $template->pivot->sent_by_admin_name ?? null,
                        'sent_at' => $template->pivot->sent_at ? Carbon::parse($template->pivot->sent_at)->toDateTimeString() : null,
                        'preview_url' => $template->background_image, // Adjust based on your preview logic
                        'created_at' => $template->pivot->created_at
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => $templates
            ]);

        } catch (\Exception $e) {
            Log::error('Error listing templates: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve template and reject others
     */
    public function approveTemplate(Request $request, $activityId)
    {
        if (!is_numeric($activityId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter activityId harus berupa angka.'
            ], 400);
        }
        try {
            $validated = $request->validate([
                'sertifikat_id' => 'required|exists:sertifikats,id'
            ]);

            DB::beginTransaction();

            $dataActivity = DataActivity::findOrFail($activityId);

            $dataActivity->sertifikat_id = $validated['sertifikat_id'];
            $dataActivity->status = "Aktif";
            $dataActivity->save();

            // Set all templates to rejected first
            $dataActivity->sertifikat()->updateExistingPivot(
                $dataActivity->sertifikat()->pluck('sertifikats.id'),
                ['status' => 'rejected', 'is_active' => false]
            );

            // Set the chosen template as approved and active
            $dataActivity->sertifikat()->updateExistingPivot(
                $validated['sertifikat_id'],
                ['status' => 'approved', 'is_active' => true]
            );

            // Update sertifikat_id di data activity agar template terpasang
            $dataActivity->sertifikat_id = $validated['sertifikat_id'];
            $dataActivity->save();

            // Hapus data pivot yang berstatus rejected
            DB::table('certificate_data_activity')
                ->where('data_activity_id', $activityId)
                ->where('status', 'rejected')
                ->delete();

            DB::commit();

            // Create notifications for admins of the same merchant so Next.js header can show them
            try {
                $admins = \App\Models\Admin::where('merchant_id', $dataActivity->merchant_id)->get();
                $message = 'Instruktur telah meng-approve sertifikat untuk kegiatan "' . $dataActivity->activity_name . '"';
                foreach ($admins as $admin) {
                    \App\Models\AdminNotification::create([
                        'admin_id' => $admin->id,
                        'message' => $message,
                        'data' => [
                            'data_activity_id' => $dataActivity->id,
                            'sertifikat_id' => $validated['sertifikat_id']
                        ],
                        'is_read' => false
                    ]);
                }
            } catch (\Exception $e) {
                // Log but don't fail the main request
                Log::warning('Failed to create admin notifications: ' . $e->getMessage());
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Template approved and attached successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error approving template: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate dan kirim sertifikat kepada peserta
     */
    public function sendCertificatesToParticipants(Request $request, $activityId)
    {
        if (!is_numeric($activityId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter activityId harus berupa angka.'
            ], 400);
        }

        try {
            $dataActivity = DataActivity::findOrFail($activityId);

            // Validasi bahwa template sudah di-approve
            if (!$dataActivity->sertifikat_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Sertifikat belum di-approve'
                ], 400);
            }

            // Ambil semua peserta (peserta, panitia, narasumber)
            $participants = collect();
            $participants = $participants->merge($dataActivity->peserta);
            $participants = $participants->merge($dataActivity->panitia);
            $participants = $participants->merge($dataActivity->narasumber);

            $createdCount = 0;
            $updatedCount = 0;

            foreach ($participants as $participant) {
                // ✅ Cek apakah sudah ada record di certificate_downloads
                $certDownload = \App\Models\CertificateDownload::where('user_id', $participant->id)
                    ->where('data_activity_id', $activityId)
                    ->first();

                if ($certDownload) {
                    // ✅ Jika sudah ada dan belum dikirim, update sent_at
                    if (!$certDownload->sent_at) {
                        $certDownload->update([
                            'sent_at' => Carbon::now()
                        ]);
                        $updatedCount++;
                    }
                } else {
                    // ✅ Jika belum ada, create baru dengan sent_at
                    \App\Models\CertificateDownload::create([
                        'user_id' => $participant->id,
                        'data_activity_id' => $activityId,
                        'sertifikat_id' => $dataActivity->sertifikat_id,
                        'token' => bin2hex(random_bytes(32)),
                        'filename' => "sertifikat_{$participant->id}_{$activityId}.pdf",
                        'recipient_name' => $participant->name,
                        'certificate_number' => $this->generateCertificateNumber($dataActivity),
                        'sent_at' => Carbon::now()
                    ]);
                    $createdCount++;
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Sertifikat berhasil dikirim',
                'data' => [
                    'created' => $createdCount,
                    'updated' => $updatedCount,
                    'total' => $participants->count()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error sending certificates: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate nomor sertifikat
     */
    private function generateCertificateNumber($dataActivity)
    {
        $lastNumber = $dataActivity->last_certificate_number ?? 0;
        $newNumber = $lastNumber + 1;
        
        // Update last_certificate_number
        $dataActivity->update(['last_certificate_number' => $newNumber]);
        
        // Format: SOD-2025-001, SOD-2025-002, dll
        return sprintf('SOD-%s-%03d', date('Y'), $newNumber);
    }

    /**
     * Get pending templates for instructor approval
     */
    public function getPendingTemplates($activityId)
    {
        if (!is_numeric($activityId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter activityId must be a number.'
            ], 400);
        }

        try {
            $activity = DataActivity::findOrFail($activityId);
            // Get all templates attached to this activity
            $templates = $activity->sertifikat()->get();

            // Transform the templates to match the frontend expected format
            $transformedTemplates = $templates->map(function ($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->name,
                    'background_image' => $template->background_image,
                    'elements' => $template->elements,
                    'status' => $template->pivot ? $template->pivot->status : 'pending',
                    'sent_by_admin_name' => $template->pivot ? $template->pivot->sent_by_admin_name : null,
                    'sent_at' => $template->pivot && $template->pivot->sent_at ? Carbon::parse($template->pivot->sent_at)->toDateTimeString() : null,
                    'created_at' => $template->created_at,
                    'updated_at' => $template->updated_at
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $transformedTemplates
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching pending templates: ' . $e->getMessage()
            ], 500);
        }
    }
}
