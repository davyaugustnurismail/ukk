<?php

namespace App\Http\Controllers\Sertifikat;

use App\Http\Controllers\Controller;
use App\Models\Sertifikat;
use App\Models\CertificateDownload;
use App\Models\User;
use App\Models\UserCertificate;
use App\Mail\CertificateGenerated;
use App\Models\DataActivity;
use App\Models\CertificateTask;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class SertifikatPesertaController extends Controller
{
    private $pdfWidth = 842;  // A4 Landscape width
    private $pdfHeight = 595; // A4 Landscape height

    /**
     * Convert relative path on 'public' disk to data URI (base64).
     */
    private function generatePlaceholderImage(int $width, int $height, string $bgColor, string $label): string
    {
        try {
            // Buat image dengan GD
            $image = imagecreatetruecolor($width, $height);
            
            // Parse color (format #RRGGBB)
            $bgColor = ltrim($bgColor, '#');
            $r = hexdec(substr($bgColor, 0, 2));
            $g = hexdec(substr($bgColor, 2, 2));
            $b = hexdec(substr($bgColor, 4, 2));
            
            $bgColorId = imagecolorallocate($image, $r, $g, $b);
            $borderColorId = imagecolorallocate($image, 150, 150, 150);
            $textColorId = imagecolorallocate($image, 100, 100, 100);
            
            // Fill background
            imagefilledrectangle($image, 0, 0, $width, $height, $bgColorId);
            
            // Draw border
            imagerectangle($image, 0, 0, $width - 1, $height - 1, $borderColorId);
            
            // Add label text di tengah
            $fontSize = 2; // GD built-in font size
            $textWidth = strlen($label) * imagefontwidth($fontSize);
            $textHeight = imagefontheight($fontSize);
            $x = ($width - $textWidth) / 2;
            $y = ($height - $textHeight) / 2;
            
            imagestring($image, $fontSize, (int)$x, (int)$y, $label, $textColorId);
            
            // Konversi ke PNG
            ob_start();
            imagepng($image);
            $imageData = ob_get_clean();
            imagedestroy($image);
            
            return 'data:image/png;base64,' . base64_encode($imageData);
        } catch (\Exception $e) {
            Log::warning('Failed to generate placeholder image', ['error' => $e->getMessage()]);
            // Fallback: transparent PNG
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
        }
    }

    /**
     * Convert relative path on 'public' disk to data URI (base64).
     */
    private function toDataUriFromPublicDisk(?string $relativePath): ?string
    {
        try {
            if (!$relativePath) return null;

            // normalize common typos and prefixes
            $relativePath = str_replace('public/storages/', '', $relativePath);
            $relativePath = ltrim($relativePath, '/');

            // if already data: or http(s), return as-is
            if (preg_match('~^(data:|https?://)~i', $relativePath)) {
                return $relativePath;
            }

            $disk = Storage::disk('public');

            // try as-is (e.g., "signatures/abc.png")
            if ($disk->exists($relativePath)) {
                $full = $disk->path($relativePath);
            } else {
                // try removing "storage/" prefix if present
                $alt = preg_replace('~^storage/~', '', $relativePath);
                if ($disk->exists($alt)) {
                    $full = $disk->path($alt);
                } else {
                    return null;
                }
            }

            $mime = @mime_content_type($full) ?: 'image/png';
            $bin  = @file_get_contents($full);
            if ($bin === false) return null;

            return 'data:' . $mime . ';base64,' . base64_encode($bin);
        } catch (\Throwable $e) {
            Log::warning('toDataUriFromPublicDisk failed', ['err' => $e->getMessage(), 'path' => $relativePath]);
            return null;
        }
    }

    /**
     * Resolve instructor signature from data_activity → instruktur->signature into data URI.
     */
    private function resolveInstrukturSignatureDataUri(?int $dataActivityId): ?string
    {
        try {
            if (!$dataActivityId) return null;
            $activity = DataActivity::with('instruktur')->find($dataActivityId);
            $sig = $activity->instruktur->signature ?? null; // usually "signatures/xxx.png"
            return $this->toDataUriFromPublicDisk($sig);
        } catch (\Throwable $e) {
            Log::warning('resolveInstrukturSignatureDataUri failed', [
                'err' => $e->getMessage(),
                'data_activity_id' => $dataActivityId
            ]);
            return null;
        }
    }

    /**
     * Generate certificate numbers and tokens only (no PDFs).
     */

    private function locateFontAbsolutePath(string $spec): ?string
    {
        $spec = trim($spec);
        if ($spec === '') return null;

        // Normalisasi dasar
        $specNorm = ltrim(str_replace('\\', '/', $spec), '/');
        $specNoStorage = preg_replace('~^storage/|^fonts/~i', '', $specNorm);

        // Buat varian nama folder/file:
        $variants = [];
        $push = function ($rel) use (&$variants) {
            $rel = ltrim($rel, '/');
            if (!in_array($rel, $variants, true)) $variants[] = $rel;
        };

        // Asli
        $push($specNoStorage);

        // Ubah "_" ↔ " " pada segmen folder
        $parts = explode('/', $specNoStorage);
        if (count($parts) >= 2) {
            $folder = $parts[0];
            $file   = implode('/', array_slice($parts, 1));

            $folderUnderscore = str_replace(' ', '_', $folder);
            $folderSpace      = str_replace('_', ' ', $folder);

            if ($folderUnderscore !== $folder) $push($folderUnderscore . '/' . $file);
            if ($folderSpace !== $folder)      $push($folderSpace . '/' . $file);

            // Coba tambahkan/kurangi subfolder "static/"
            $push($folder . '/static/' . $file);
            $push($folderSpace . '/static/' . $file);
            $push($folderUnderscore . '/static/' . $file);
        }

        // Lokasi root font
        $roots = [
            public_path('storage/fonts'),       // utama: public/storage/fonts
            storage_path('app/public/fonts'),   // alternatif: storage/app/public/fonts
            public_path('fonts'),               // opsional
        ];

        // 1) Coba direct exact path untuk semua kombinasi
        foreach ($roots as $root) {
            foreach ($variants as $rel) {
                $cand = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel);
                if (is_file($cand)) return $cand;
            }
        }

        // 2) Case-insensitive & recursive: cari berdasarkan basename file
        $basename = basename($specNoStorage); // contoh: "Montserrat-Regular.ttf"
        foreach ($roots as $root) {
            if (!is_dir($root)) continue;

            // Cari family folder by name (approx) kalau ada
            $folderCandidates = [];
            if (count($parts) >= 2) {
                $familyRaw = $parts[0]; // "Cormorant_Garamond" / "DM_Sans" / "Open_Sans"
                $familyVariants = array_values(array_unique([
                    $familyRaw,
                    str_replace('_', ' ', $familyRaw),
                    str_replace(' ', '_', $familyRaw),
                    strtolower($familyRaw),
                    strtolower(str_replace('_', ' ', $familyRaw)),
                    strtolower(str_replace(' ', '_', $familyRaw)),
                ]));

                // scan 1 level untuk nyocokin nama folder (case-insensitive)
                $scan = @scandir($root) ?: [];
                foreach ($scan as $entry) {
                    if ($entry === '.' || $entry === '..') continue;
                    $full = $root . DIRECTORY_SEPARATOR . $entry;
                    if (!is_dir($full)) continue;
                    foreach ($familyVariants as $fv) {
                        if (strcasecmp($entry, $fv) === 0) {
                            $folderCandidates[] = $full;
                            break;
                        }
                    }
                }
            }

            // Jika ada kandidat folder family, cari file di dalamnya (termasuk "static/")
            $searchDirs = $folderCandidates ?: [$root];

            foreach ($searchDirs as $dir) {
                // cari exact basename dulu di dua level umum
                $c1 = $dir . DIRECTORY_SEPARATOR . $basename;
                $c2 = $dir . DIRECTORY_SEPARATOR . 'static' . DIRECTORY_SEPARATOR . $basename;
                if (is_file($c1)) return $c1;
                if (is_file($c2)) return $c2;

                // terakhir: recursive search by basename (hati-hati performa; tapi font dir biasanya kecil)
                $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS));
                foreach ($it as $file) {
                    /** @var \SplFileInfo $file */
                    if (!$file->isFile()) continue;
                    if (strcasecmp($file->getFilename(), $basename) === 0) {
                        return $file->getRealPath();
                    }
                }
            }
        }

        // 3) Fuzzy matching: try to match by cleaned basename (strip tokens like _120pt, _24pt, _SemiCondensed)
        $cleanTarget = strtolower(preg_replace('/_(?:\d+pt|SemiCondensed|Semi-Condensed)$/i', '', preg_replace('/\.(ttf|otf|woff2?)$/i', '', $basename)));
        if ($cleanTarget !== '') {
            foreach ($roots as $root) {
                if (!is_dir($root)) continue;
                $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS));
                foreach ($it as $file) {
                    if (!$file->isFile()) continue;
                    $fn = $file->getFilename();
                    $fnClean = strtolower(preg_replace('/_(?:\d+pt|SemiCondensed|Semi-Condensed)$/i', '', preg_replace('/\.(ttf|otf|woff2?)$/i', '', $fn)));
                    // exact cleaned match or contains
                    if ($fnClean === $cleanTarget || strpos($fnClean, $cleanTarget) !== false || strpos($cleanTarget, $fnClean) !== false) {
                        return $file->getRealPath();
                    }
                }
            }
        }

        // 4) If spec looks like a family folder (no extension), try to find the folder and pick a sensible default file (Regular/Medium/first)
        $specNoExt = preg_replace('/\.(ttf|otf|woff2?)$/i', '', $specNoStorage);
        if ($specNoExt && !preg_match('/\\.(ttf|otf|woff2?)$/i', $spec)) {
            $familyCandidates = array_values(array_unique([
                $specNoExt,
                str_replace('_', ' ', $specNoExt),
                str_replace(' ', '_', $specNoExt),
                strtolower($specNoExt),
            ]));
            foreach ($roots as $root) {
                if (!is_dir($root)) continue;
                $scan = @scandir($root) ?: [];
                foreach ($scan as $entry) {
                    if ($entry === '.' || $entry === '..') continue;
                    $full = $root . DIRECTORY_SEPARATOR . $entry;
                    if (!is_dir($full)) continue;
                    foreach ($familyCandidates as $fc) {
                        if (strcasecmp($entry, $fc) === 0) {
                            // pick preferred file inside folder
                            $preferred = null;
                            $files = @scandir($full) ?: [];
                            foreach ($files as $f) {
                                if (preg_match('/\.(ttf|otf|woff2?)$/i', $f)) {
                                    $lf = strtolower($f);
                                    if (preg_match('/(regular|medium|normal)/i', $lf)) { $preferred = $full . DIRECTORY_SEPARATOR . $f; break; }
                                    if ($preferred === null) $preferred = $full . DIRECTORY_SEPARATOR . $f;
                                }
                            }
                            if ($preferred && is_file($preferred)) return $preferred;
                        }
                    }
                }
            }
        }

        Log::warning('Font file not found for PDF embedding', ['spec' => $spec]);
        return null;
    }

    private function buildFontFaceCss(array $elements): string
    {
        $pairs = []; // displayName => spec (relative spec di payload)
        foreach ($elements as $el) {
            if (!is_array($el) || ($el['type'] ?? '') !== 'text') continue;
            $display = trim((string)($el['fontFamily'] ?? ''));
            $spec    = trim((string)($el['font']['family'] ?? ''));
            if ($display === '' || $spec === '') continue;
            $pairs[$display] ??= $spec;
        }
        if (!$pairs) return '';

        $css = '';
        foreach ($pairs as $displayName => $spec) {
            $abs = $this->locateFontAbsolutePath($spec);
            if (!$abs) {
                Log::warning('Font file not found for PDF embedding', ['spec' => $spec]);
                continue;
            }

            $ext    = strtolower(pathinfo($abs, PATHINFO_EXTENSION));
            $format = match ($ext) {
                'ttf'   => 'truetype',
                'otf'   => 'opentype',
                'woff'  => 'woff',
                'woff2' => 'woff2',
                default => 'truetype',
            };

            $src     = 'file://' . $abs;
            $low     = strtolower(basename($abs));
            $weight  = (str_contains($low, 'bold') || str_contains($low, '-bd')) ? 'bold' : 'normal';
            $style   = (str_contains($low, 'italic') || str_contains($low, 'ital')) ? 'italic' : 'normal';

            $css .= "@font-face{font-family:'" . addslashes($displayName) . "';src:url('{$src}') format('{$format}');font-weight:{$weight};font-style:{$style};}\n";
        }

        return $css;
    }

    /**
     * Generate certificate numbers and tokens only (no PDFs).
     * Supports multiple roles per user in the same activity.
     */
    public function generateBulkNumber(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'recipients' => 'required|array|min:1',
                'recipients.*.recipient_name' => 'required|string',
                'recipients.*.email' => 'required|email',
                'recipients.*.date' => 'required|date',
                'certificate_number_format' => 'nullable|string',
                'merchant_id' => 'required|exists:merchants,id',
                'data_activity_id' => 'required|exists:data_activity,id',
                'instruktur' => 'required|string'
            ]);

            $template = Sertifikat::findOrFail($id);
            $dataActivity = DataActivity::find($validated['data_activity_id']);
            
            if (!$dataActivity) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data activity tidak ditemukan'
                ], 404);
            }

            $activityName = $dataActivity->activity_name ?? 'Activity';
            $results = [];
            $errors = [];

            // ✅ GROUP recipients by email untuk handle multiple roles
            $recipientsByEmail = [];
            foreach ($validated['recipients'] as $recipient) {
                $email = $recipient['email'];
                if (!isset($recipientsByEmail[$email])) {
                    $recipientsByEmail[$email] = [];
                }
                $recipientsByEmail[$email][] = $recipient;
            }

            foreach ($recipientsByEmail as $email => $recipients) {
                try {
                    // 1️⃣ FIND USER
                    $user = User::where('email', $email)->first();

                    if (!$user) {
                        $errors[] = [
                            'email' => $email,
                            'message' => 'User tidak ditemukan'
                        ];
                        continue;
                    }

                    // 2️⃣ GET ALL ROLES untuk user ini di activity ini
                    $userRoles = DB::table('data_activity_user')
                        ->where('data_activity_id', $validated['data_activity_id'])
                        ->where('user_id', $user->id)
                        ->get(['type', 'id as pivot_id']); // Ambil pivot id untuk update nanti

                    if ($userRoles->isEmpty()) {
                        $errors[] = [
                            'email' => $email,
                            'message' => 'User tidak terdaftar di activity ini'
                        ];
                        continue;
                    }

                    // 3️⃣ GENERATE SERTIFIKAT UNTUK SETIAP ROLE
                    foreach ($userRoles as $roleData) {
                        $pivotType = $roleData->type;
                        $pivotId = $roleData->pivot_id;

                        // 3a. Tentukan prefix berdasarkan type di pivot
                        $rolePrefix = '';
                        switch ($pivotType) {
                            case 'panitia':
                                $rolePrefix = 'P/';
                                break;
                            case 'narasumber':
                                $rolePrefix = 'N/';
                                break;
                            default: // peserta
                                $rolePrefix = '';
                                break;
                        }

                        // 3b. Generate base certificate number (numeric part)
                        $baseCertificateNumber = $this->generateCertificateNumber(
                            $template,
                            $validated['certificate_number_format'] ?? null,
                            $validated['data_activity_id']
                        );

                        // 3c. Combine prefix + base number
                        $certificateNumber = $rolePrefix . $baseCertificateNumber;

                        // 3d. Generate unique token
                        $downloadToken = Str::random(12);

                        // 3e. Generate filename
                        $filename = sprintf(
                            'sertifikat_%s_%s_%s_%s.pdf',
                            Str::slug($certificateNumber),
                            Str::slug($user->name),
                            Str::slug($activityName),
                            Str::slug($pivotType) // ← TAMBAHAN: role type di filename
                        );

                        // 4️⃣ CREATE CERTIFICATE DOWNLOAD RECORD
                        $download = CertificateDownload::create([
                            'sertifikat_id'      => $id,
                            'token'              => $downloadToken,
                            'filename'           => $filename,
                            'recipient_name'     => $user->name,
                            'instruktur_name'    => $validated['instruktur'] ?? null,
                            'certificate_number' => $certificateNumber,
                            'user_id'            => $user->id,
                            'merchant_id'        => $validated['merchant_id'],
                            'data_activity_id'   => $validated['data_activity_id']
                        ]);

                        // 5️⃣ CREATE USER CERTIFICATE RECORD
                        UserCertificate::create([
                            'user_id'                 => $user->id,
                            'certificate_download_id' => $download->id,
                            'status'                  => 'active',
                            'assigned_at'             => now(),
                            'merchant_id'             => $validated['merchant_id'],
                            'data_activity_id'        => $validated['data_activity_id']
                        ]);

                        // 6️⃣ UPDATE PIVOT TABLE dengan certificate number
                        try {
                            // Ambil tanggal dari recipients (ambil yang pertama karena user sama)
                            $date = isset($recipients[0]['date'])
                                ? Carbon::parse($recipients[0]['date'])->format('Y-m-d')
                                : null;

                            // ✅ UPDATE PIVOT BERDASARKAN PIVOT ID (lebih akurat)
                            DB::table('data_activity_user')
                                ->where('id', $pivotId) // ← Gunakan pivot ID, bukan kombinasi user_id + activity_id + type
                                ->update([
                                    'certificate_number' => $certificateNumber,
                                    'tanggal_sertifikat' => $date,
                                    'updated_at' => now()
                                ]);

                            Log::info('Pivot updated successfully', [
                                'pivot_id' => $pivotId,
                                'user_id' => $user->id,
                                'activity_id' => $validated['data_activity_id'],
                                'type' => $pivotType,
                                'certificate_number' => $certificateNumber
                            ]);

                        } catch (\Exception $e) {
                            Log::error('Failed to update pivot data_activity_user', [
                                'error' => $e->getMessage(),
                                'pivot_id' => $pivotId,
                                'user_id' => $user->id,
                                'data_activity_id' => $validated['data_activity_id'],
                                'type' => $pivotType
                            ]);
                        }

                        // 7️⃣ Determine role caption from pivot (for this user+activity+role)
                        $roleCaption = '';
                        try {
                            $pivot = DB::table('data_activity_user')
                                ->where('data_activity_id', $validated['data_activity_id'])
                                ->where('user_id', $user->id)
                                ->where('type', $pivotType)
                                ->first();
                            if ($pivot && !empty($pivot->type)) {
                                $roleCaption = 'Sebagai ' . $pivot->type;
                            }
                        } catch (\Throwable $e) {
                            Log::warning('Failed to fetch pivot for role caption', ['err' => $e->getMessage()]);
                        }

                        // 8️⃣ ADD TO RESULTS
                        $results[] = [
                            'recipient_name'     => $user->name,
                            'email'              => $email,
                            'role_type'          => $pivotType, // ← PENTING: info role type
                            'role_caption'       => $roleCaption,
                            'certificate_number' => $certificateNumber,
                            'token'              => $downloadToken,
                            'download_url'       => url('/sertifikat-templates/download/' . $downloadToken),
                            'preview_url'        => url('/sertifikat-templates/preview-by-user/' . $user->id)
                        ];
                    }

                } catch (\Exception $e) {
                    Log::error('Error processing recipient', [
                        'email' => $email,
                        'error' => $e->getMessage()
                    ]);
                    
                    $errors[] = [
                        'email' => $email,
                        'message' => 'Gagal memproses: ' . $e->getMessage()
                    ];
                }
            }

            // 8️⃣ PREPARE RESPONSE
            $response = [
                'status'  => 'success',
                'message' => 'Nomor sertifikat berhasil dibuat',
                'data'    => $results,
                'summary' => [
                    'total_recipients' => count($recipientsByEmail),
                    'total_certificates' => count($results),
                    'total_errors' => count($errors)
                ]
            ];

            if (!empty($errors)) {
                $response['errors'] = $errors;
            }

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Error generating bulk numbers', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat nomor sertifikat.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function previewByUserCertificate($userId)
    {
        try {
            // Ambil data_activity_id dari query parameter
            $dataActivityId = request()->query('data_activity_id');

            // Buat query dasar
            $query = UserCertificate::with(['certificateDownload.dataActivity.instruktur'])
                ->where('user_id', $userId)
                ->where('status', 'active');

            // Tambah filter berdasarkan data_activity_id jika ada
            if ($dataActivityId) {
                $query->where('data_activity_id', $dataActivityId);
            }

        // Ambil sertifikat
        $userCert = $query->orderBy('assigned_at', 'desc')
            ->firstOrFail();

            $download = $userCert->certificateDownload;
            if (!$download) {
                return response()->json(['message' => 'Data sertifikat tidak ditemukan'], 404);
            }

            $template = Sertifikat::find($download->sertifikat_id ?? $userCert->sertifikat_id ?? null);
            if (!$template) {
                return response()->json(['message' => 'Template sertifikat tidak ditemukan'], 404);
            }

            // === Resolve background absolute path (untuk dikirim ke Blade) ===
            $backgroundAbsolute = null;
            try {
                if (!empty($template->background_image) && Storage::disk('public')->exists($template->background_image)) {
                    $backgroundAbsolute = Storage::disk('public')->path($template->background_image);
                }
            } catch (\Throwable $e) {
                Log::warning('Unable to resolve background for previewByUserCertificate', ['err' => $e->getMessage()]);
            }

            // === Ambil nilai dasar pengganti ===
            $recipientName     = $download->recipient_name ?? $userCert->recipient_name ?? '';
            $certificateNumber = $download->certificate_number ?? '';

            // Determine activity title for {JUDUL}/{TITLE}
            $activityTitle = null;
            // Prefer title from the user_certificate pivot's data_activity_id if present
            try {
                if (!empty($userCert->data_activity_id)) {
                    $da = DataActivity::find($userCert->data_activity_id);
                    if ($da && !empty($da->activity_name)) $activityTitle = $da->activity_name;
                }
            } catch (\Exception $e) {
                Log::warning('Failed to resolve DataActivity from user certificate pivot', ['err' => $e->getMessage(), 'user_certificate_id' => $userCert->id]);
            }
            // fallback to download->data_activity or its related model
            if (empty($activityTitle)) {
                try {
                    if (!empty($download->data_activity_id)) {
                        $da2 = DataActivity::find($download->data_activity_id);
                        if ($da2 && !empty($da2->activity_name)) $activityTitle = $da2->activity_name;
                    }
                    if (empty($activityTitle) && !empty($download->dataActivity->activity_name)) {
                        $activityTitle = $download->dataActivity->activity_name;
                    }
                } catch (\Exception $e) {
                    // ignore
                }
            }
            if (empty($activityTitle)) {
                $activityTitle = $template->title ?? 'Sertifikat';
            }

            // Jika belum ada nomor, generate sekali lalu simpan (agar konsisten di preview berikutnya)
            if (empty($certificateNumber)) {
                try {
                    $certificateNumber = $this->generateCertificateNumber(
                            $template,
                            $template->certificate_number_format ?? null,
                            $download->data_activity_id ?? ($download->dataActivity->id ?? null)
                        );
                    $download->certificate_number = $certificateNumber;
                    $download->save();
                } catch (\Exception $e) {
                    Log::warning('Failed to generate certificate number on preview, continuing without number', ['err' => $e->getMessage()]);
                    $certificateNumber = '';
                }
            }

            // Tanggal (prioritas dari dataActivity, fallback assigned_at, fallback now)
            setlocale(LC_TIME, 'id_ID');
            Carbon::setLocale('id');
            $dateText = '';
            if (!empty($download->dataActivity->date)) {
                $dateText = Carbon::parse($download->dataActivity->date)->translatedFormat('d F Y');
            } elseif (!empty($userCert->assigned_at)) {
                $dateText = Carbon::parse($userCert->assigned_at)->translatedFormat('d F Y');
            } else {
                $dateText = now()->translatedFormat('d F Y');
            }

            $instrukturName = $download->dataActivity->instruktur->name ?? '';

            // === QR in-memory (TANPA simpan file) ===
            $frontendUrl = (string) (config('app.frontend_url') ?: config('app.url') ?: '');
            $qrTarget    = rtrim($frontendUrl, '/') . '/peserta?certificate_number=' . urlencode($certificateNumber);

            // Pilih PNG Data-URI (agar cocok dengan placeholder __QR_DATA_URI__ yang sudah dipakai di bulk)
            $qrPng     = QrCode::format('png')->size(300)->margin(1)->errorCorrection('H')->generate($qrTarget);
            $qrDataUri = 'data:image/png;base64,' . base64_encode($qrPng);

            // === Build replacements (adopsi dari bulk) ===
            $repl = [
                '{JUDUL}'         => $activityTitle,
                '{TITLE}'         => $activityTitle,
                '{NAMA}'          => $recipientName,
                '{NOMOR}'         => $certificateNumber,
                '{TANGGAL}'       => $dateText,
                '{INSTRUKTUR}'    => $instrukturName,
                '__QR_DATA_URI__' => $qrDataUri, // dipakai oleh elemen qrcode
            ];

            // === ROLE_CAPTION: derive from data_activity_user pivot if possible ===
            try {
                $roleCaption = '';
                $daId = $download->data_activity_id ?? ($download->dataActivity->id ?? null);
                if (!empty($daId) && !empty($userCert->user_id)) {
                    $p = DB::table('data_activity_user')
                        ->where('data_activity_id', $daId)
                        ->where('user_id', $userCert->user_id)
                        ->orderBy('id', 'desc')
                        ->first();
                    if ($p && !empty($p->type)) {
                        $roleCaption = 'Sebagai ' . $p->type;
                    }
                }
                if ($roleCaption !== '') $repl['{ROLE_CAPTION}'] = $roleCaption;
            } catch (\Throwable $e) {
                Log::warning('Failed to compute ROLE_CAPTION in preview', ['err' => $e->getMessage()]);
            }

            // Alias token supaya kompatibel dengan variasi placeholder di desain
            $aliasMap = [
                '{INSTRUCTURE}'          => $instrukturName,
                '{INSTRUCTOR}'           => $instrukturName,
                '{CERTIFICATE_NUMBER}'   => $certificateNumber,
                '{CERTIFICATE_NO}'       => $certificateNumber,
                '{DATE}'                 => $dateText,
            ];
            foreach ($aliasMap as $k => $v) {
                if (!isset($repl[$k])) $repl[$k] = $v;
            }

            // Signature (opsional) → data URI
            $sigDataUri = $this->resolveInstrukturSignatureDataUri($download->data_activity_id ?? ($download->dataActivity->id ?? null));
            if ($sigDataUri) {
                $repl['{INSTRUKTUR_SIGNATURE}'] = $sigDataUri;
            }

            // === Apply ke elements (adopsi fungsi dari bulk) ===
            $elementsDef = is_array($template->elements) ? $template->elements : [];
            $elements    = $this->prepareElements($elementsDef, $repl);
            $fontCss = $this->buildFontFaceCss($elementsDef);

            // === Ukuran halaman dari layout template (fallback A4 landscape 842x595 pt) ===
            $pageW = (float) ($template->layout['width']  ?? 842);
            $pageH = (float) ($template->layout['height'] ?? 595);
            $orient = strtolower($template->layout['orientation'] ?? 'landscape');

            // === Render Dompdf STREAM (tanpa simpan PDF) ===
            $pdf = Pdf::loadView('sertifikat.template', [
                    // Blade kamu sebelumnya sudah menangani elements & background
                    'template'         => $template,
                    'elements'         => $elements,
                    'background_image' => $backgroundAbsolute,
                    'pageWidth'        => $pageW,
                    'pageHeight'       => $pageH,

                    // Beberapa var umum bila Blade membutuhkan
                    'name'               => $recipientName,
                    'certificate_number' => $certificateNumber,
                    'date_text'          => $dateText,
                    'instructure'        => $instrukturName, // variasi nama
                    'instruktur'         => $instrukturName, // variasi nama
                    'title'              => $template->title ?? null,
                    'qrDataUri'          => $qrDataUri,
                    'signatureDataUri'   => $sigDataUri,
                    'layout'             => [
                        'width'  => $pageW,
                        'height' => $pageH,
                    ],
                    'fontCss'        => $fontCss, // tambahan khusus untuk font-face
                    'role_caption'   => $repl['{ROLE_CAPTION}'] ?? '',
                ])
                ->setPaper([0, 0, $pageW, $pageH], $orient === 'portrait' ? 'portrait' : 'landscape')
                ->setOptions([
                    'isRemoteEnabled'     => true,
                    'isHtml5ParserEnabled'=> true,
                    'chroot' => public_path(),
                    'dpi' => 96,
                ]);

            $filename = CertificateDownload::find($download->id)->filename ?? 'sertifikat.pdf';
            return $pdf->stream($filename);

        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Sertifikat peserta tidak ditemukan'], 404);
        } catch (\Exception $e) {
            Log::error('Error generating preview by user certificate', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal menampilkan sertifikat peserta: ' . $e->getMessage()], 500);
        }
    }

    public function previewDummy($templateId)
    {
        try {
            // Ambil template
            $template = Sertifikat::findOrFail($templateId);

            // Resolve background absolute path (opsional, agar Blade bisa <img src="file://...">)
            $backgroundAbsolute = null;
            try {
                if (!empty($template->background_image) && Storage::disk('public')->exists($template->background_image)) {
                    $backgroundAbsolute = Storage::disk('public')->path($template->background_image);
                }
            } catch (\Throwable $e) {
                Log::warning('Unable to resolve background for previewDummy', ['err' => $e->getMessage()]);
            }

            // Ukuran halaman
            $pageW   = (float) ($template->layout['width']  ?? 842);
            $pageH   = (float) ($template->layout['height'] ?? 595);

            // ==== DUMMY QR Code & Signature (Placeholder Images) ====
            // Buat placeholder images sebagai data URI (dengan konten visual, tidak transparan)
            // QR Code placeholder: persegi dengan grid pattern
            $qrPlaceholder = $this->generatePlaceholderImage(100, 100, '#E8E8E8', 'QR');
            
            // Signature placeholder: kotak dengan label
            $signaturePlaceholder = $this->generatePlaceholderImage(200, 80, '#F0F0F0', 'TTD');

            // ==== REPLACEMENTS DUMMY ====
            // Hanya untuk elemen yang butuh gambar (QR & signature).
            // Placeholder teks seperti {NAMA} dibiarkan TIDAK terganti agar preview menunjukkan placeholder.
            $repl = [
                '__QR_DATA_URI__'        => $qrPlaceholder,              // QR code placeholder dengan visual
                '{INSTRUKTUR_SIGNATURE}' => $signaturePlaceholder,       // placeholder tanda tangan instruktur
            ];

            // Siapkan elements dengan prepareElements
            // Fungsi ini akan:
            // - Menangani signature element dengan placeholder {INSTRUKTUR_SIGNATURE}
            // - Menangani QR code element dengan placeholder __QR_DATA_URI__
            // - Menangani shape element (rectangle, circle, dll)
            // - Normalisasi posisi & ukuran untuk semua tipe element
            $elementsDef = is_array($template->elements) ? $template->elements : [];
            
            $elements = $this->prepareElements($elementsDef, $repl, $pageW, $pageH);
            $fontCss = $this->buildFontFaceCss($elementsDef);
            
            // Ukuran & orientasi halaman (default A4 landscape 842x595 pt)
            $orient  = strtolower($template->layout['orientation'] ?? 'landscape');

            // Variabel untuk Blade (biarkan placeholder tampil apa adanya)
            $pdf = Pdf::loadView('sertifikat.template', [
                    'template'           => $template,
                    'elements'           => $elements,
                    'background_image'   => $backgroundAbsolute,
                    'pageWidth'          => $pageW,
                    'pageHeight'         => $pageH,

                    // Biarkan Blade tetap punya variabel standar, tapi berisi placeholder
                    'name'               => '{NAMA}',
                    'certificate_number' => '{NOMOR}',
                    'date_text'          => '{TANGGAL}',
                    'instruktur'         => '{INSTRUKTUR}',
                    'instructure'        => '{INSTRUKTUR}',
                    'title'              => $template->title ?? '{JUDUL}',
                    'qrDataUri'          => $qrPlaceholder,           // Placeholder QR dengan visual
                    'signatureDataUri'   => $signaturePlaceholder,    // Placeholder signature dengan visual
                    'layout'             => [
                        'width'  => $pageW,
                        'height' => $pageH,
                    ],
                    'fontCss'        => $fontCss, // tambahan khusus untuk font-face
                    'role_caption'   => '',
                    ])
                ->setPaper([0, 0, $pageW, $pageH], $orient === 'portrait' ? 'portrait' : 'landscape')
                ->setOptions([
                    'isRemoteEnabled'       => true,
                    'isHtml5ParserEnabled'  => true,
                    'chroot' => public_path(),
                    'dpi' => 96,
                ]);

            $filename = 'preview_dummy_' . ($template->id ?? 'template') . '.pdf';
            return $pdf->stream($filename);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Template sertifikat tidak ditemukan'], 404);
        } catch (\Exception $e) {
            Log::error('Error generating previewDummy', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal menampilkan preview dummy: ' . $e->getMessage()], 500);
        }
    }

    public function downloadByUserCertificate($userId)
    {
        try {
            $userCert = UserCertificate::with('certificateDownload')
                ->where('user_id', $userId)
                ->where('status', 'active')
                ->orderBy('assigned_at', 'desc')
                ->firstOrFail();

            $download = $userCert->certificateDownload;
            if(!$download) {
                return response()->json(['message' => 'Data sertifikat tidak ditemukan'], 404);
            }

            if (method_exists($download, 'isExpired') && $download->isExpired()) {
                return response()->json(['message' => 'Link download kadaluarsa'], 410);
            }

            $filepath = 'certificates/generated/' . $download->filename;
            if (!Storage::disk('public')->exists($filepath)) {
                return response()->json(['message' => 'File tidak ditemukan'], 404);
            }

            if (method_exists($download, 'incrementDownloadCount')) {
                $download->incrementDownloadCount();
            }

            return response()->download(Storage::disk('public')->path($filepath), $download->filename);
        } catch (ModelNotFoundException $e) {
            // Fallback using query params
            try {
                $req = request();
                $certNumber    = $req->query('certificate_number');
                $recipientName = $req->query('recipient_name');
                $dataActivityId= $req->query('data_activity_id');

                $download = null;
                if (!empty($certNumber)) {
                    $download = CertificateDownload::whereCertificateNumberNormalized($certNumber)->first();
                }

                if (!$download && !empty($recipientName) && !empty($dataActivityId)) {
                    $download = CertificateDownload::where('recipient_name', $recipientName)
                        ->where('data_activity_id', $dataActivityId)
                        ->first();
                }

                if (!$download && !empty($recipientName)) {
                    $download = CertificateDownload::where('recipient_name', $recipientName)->first();
                }

                if (!$download) {
                    return response()->json(['message' => 'Sertifikat peserta tidak ditemukan'], 404);
                }

                if (method_exists($download, 'isExpired') && $download->isExpired()) {
                    return response()->json(['message' => 'Link download kadaluarsa'], 410);
                }

                $filepath = 'certificates/generated/' . $download->filename;
                if (!Storage::disk('public')->exists($filepath)) {
                    return response()->json(['message' => 'File tidak ditemukan'], 404);
                }

                if (method_exists($download, 'incrementDownloadCount')) {
                    $download->incrementDownloadCount();
                }

                return response()->download(Storage::disk('public')->path($filepath), $download->filename);
            } catch (\Exception $ex) {
                Log::error('Error in fallback downloadByUserCertificate', ['error' => $ex->getMessage()]);
                return response()->json(['message' => 'Sertifikat peserta tidak ditemukan'], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error downloading PDF by user certificate', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal mengunduh sertifikat peserta'], 500);
        }
    }

    /**
     * Helper to queue certificate email. Returns true on queued, false on failure.
     */
    public function sendMailWithCertificate($recipientEmail, $recipientName, $certificateNumber, $downloadUrl, $downloadToken = null, $isNewUser = false)
    {
        try {
            Mail::to($recipientEmail)->queue(new CertificateGenerated(
                $recipientName,
                $certificateNumber,
                $downloadUrl,
                $downloadToken,
                $isNewUser
            ));
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send certificate email', ['error' => $e->getMessage(), 'email' => $recipientEmail]);
            return false;
        }
    }

    public function sendMailPeserta(Request $request)
    {
        try {
            $validated = $request->validate([
                'recipients' => 'required|array|min:1',
                'recipients.*.email' => 'required|email',
                'recipients.*.token' => 'nullable|string',
                'recipients.*.certificate_number' => 'nullable|string',
                'recipients.*.send' => 'required|boolean'
            ]);

            $results = [];

            foreach ($validated['recipients'] as $recipient) {
                if (empty($recipient['send'])) {
                    $results[] = ['email' => $recipient['email'], 'sent' => false, 'reason' => 'not_selected'];
                    continue;
                }

                $download = null;
                if (!empty($recipient['token'])) {
                    $download = CertificateDownload::where('token', $recipient['token'])->first();
                }
                if (!$download && !empty($recipient['certificate_number'])) {
                    $download = CertificateDownload::where('certificate_number', $recipient['certificate_number'])->first();
                }

                // Fallback: if still not found, try to resolve by user email (useful when sending to panitia/narasumber)
                if (!$download) {
                    try {
                        $user = User::where('email', $recipient['email'])->first();
                        if ($user) {
                            // If frontend provided data_activity_id, prefer that download
                            if (!empty($recipient['data_activity_id'])) {
                                $download = CertificateDownload::where('user_id', $user->id)
                                    ->where('data_activity_id', $recipient['data_activity_id'])
                                    ->orderBy('created_at', 'desc')
                                    ->first();
                            }

                            // otherwise pick the most recent download for that user
                            if (!$download) {
                                $download = CertificateDownload::where('user_id', $user->id)
                                    ->orderBy('created_at', 'desc')
                                    ->first();
                            }
                        }
                    } catch (\Exception $ex) {
                        Log::warning('Fallback lookup by user email failed in sendMailPeserta', ['email' => $recipient['email'], 'err' => $ex->getMessage()]);
                    }
                }

                if (!$download) {
                    Log::warning('CertificateDownload not found for sendMailPeserta', ['recipient' => $recipient]);
                    $results[] = ['email' => $recipient['email'], 'sent' => false, 'reason' => 'download_not_found'];
                    continue;
                }

                // compute role caption for this download (if possible)
                $roleCaption = '';
                try {
                    $daId = $download->data_activity_id ?? ($download->dataActivity->id ?? null);
                    $userId = $download->user_id ?? null;
                    if (!empty($daId) && !empty($userId)) {
                        $p = DB::table('data_activity_user')
                            ->where('data_activity_id', $daId)
                            ->where('user_id', $userId)
                            ->orderBy('id', 'desc')
                            ->first();
                        if ($p && !empty($p->type)) {
                            $roleCaption = 'Sebagai ' . $p->type;
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('Failed to compute role_caption in sendMailPeserta', ['err' => $e->getMessage()]);
                }

                $params = http_build_query([
                    'recipient_name'     => $download->recipient_name ?? '',
                    'instructure'        => $download->instruktur_name ?? '',
                    'certificate_number' => $download->certificate_number ?? '',
                    'date'               => $download->dataActivity->date ?? '',
                    'data_activity_id'   => (string)($download->data_activity_id ?? ''),
                    'role_caption'       => $roleCaption,
                ]);
                $downloadUrl = url('/sertifikat-templates/preview-by-user/' . $download->user_id) . '?' . $params;

                // cek apakah user punya akun dan masih pakai password default
                $isNewUser = false;
                $user = User::where('email', $recipient['email'])->first();
                if ($user) {
                    $isNewUser = \Illuminate\Support\Facades\Hash::check('password', $user->password);
                }

                $sent = $this->sendMailWithCertificate(
                    $recipient['email'],
                    $download->recipient_name ?? '',
                    $download->certificate_number ?? '',
                    $downloadUrl,
                    $download->token ?? null,
                    $isNewUser
                );

                // If email was queued successfully, mark the download as sent_at
                if ($sent) {
                    try {
                        // ensure we have the filename like in previewByUserCertificate
                        $filename = CertificateDownload::find($download->id)->filename ?? 'sertifikat.pdf';

                        $download->sent_at = Carbon::now();
                        $download->save();
                    } catch (\Exception $ex) {
                        Log::warning('Failed to set sent_at on CertificateDownload', ['id' => $download->id, 'err' => $ex->getMessage()]);
                    }
                }

                $results[] = ['email' => $recipient['email'], 'sent' => (bool)$sent];
            }

            return response()->json(['status' => 'success', 'data' => $results]);
        } catch (\Exception $e) {
            Log::error('Error in sendMailPeserta', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Gagal mengirim email peserta'], 500);
        }
    }

    /**
 * Normalisasi dan inject placeholder untuk semua elemen kanvas.
 *
 * @param  array  $elements  Definisi elemen dari template (array of associative arrays)
 * @param  array  $repl      Map placeholder -> nilai (mis. '{NAMA}' => 'Indra')
 * @param  float  $pageWidth Lebar halaman (pt)
 * @param  float  $pageHeight Tinggi halaman (pt)
 * @return array  Elemen siap render (x/y tervalidasi, sumber gambar/QR terset)
 */
    private function prepareElements(array $elements, array $repl, float $pageWidth = 842, float $pageHeight = 595): array
    {
        // -------- 1) Lengkapkan alias placeholder umum --------
        // TITLE ↔ JUDUL
        if (isset($repl['{JUDUL}']) && !isset($repl['{TITLE}'])) {
            $repl['{TITLE}'] = $repl['{JUDUL}'];
        }
        if (isset($repl['{TITLE}']) && !isset($repl['{JUDUL}'])) {
            $repl['{JUDUL}'] = $repl['{TITLE}'];
        }

        // INSTRUKTUR / INSTRUCTOR / INSTRUCTURE
        if (isset($repl['{INSTRUKTUR}'])) {
            $repl += [
                '{INSTRUCTOR}'  => $repl['{INSTRUKTUR}'],
                '{INSTRUCTURE}' => $repl['{INSTRUKTUR}'],
            ];
        } elseif (isset($repl['{INSTRUCTOR}'])) {
            $repl += [
                '{INSTRUKTUR}'  => $repl['{INSTRUCTOR}'],
                '{INSTRUCTURE}' => $repl['{INSTRUCTOR}'],
            ];
        } elseif (isset($repl['{INSTRUCTURE}'])) {
            $repl += [
                '{INSTRUKTUR}'  => $repl['{INSTRUCTURE}'],
                '{INSTRUCTOR}'  => $repl['{INSTRUCTURE}'],
            ];
        }

        // Tanggal & nomor alternatif
        if (isset($repl['{TANGGAL}']) && !isset($repl['{DATE}'])) {
            $repl['{DATE}'] = $repl['{TANGGAL}'];
        }
        if (isset($repl['{NOMOR}'])) {
            $repl += [
                '{CERTIFICATE_NUMBER}' => $repl['{NOMOR}'],
                '{CERTIFICATE_NO}'     => $repl['{NOMOR}'],
            ];
        }

        // -------- 2) Helper konversi path -> data URI --------
        $toDataUri = function (?string $path): ?string {
            if (!$path) return null;
            if (preg_match('~^(data:|https?://)~i', $path)) return $path; // sudah URL/URI
            // buang prefix umum
            $p = preg_replace('~^(?:/)?(?:public/)?(?:storage/)~i', '', $path);
            $full = storage_path('app/public/'.ltrim($p, '/'));
            if (!is_file($full)) return null;
            $ext  = strtolower(pathinfo($full, PATHINFO_EXTENSION) ?: 'png');
            $mime = $ext === 'svg' ? 'image/svg+xml' : (in_array($ext, ['jpg','jpeg']) ? 'image/jpeg' : 'image/png');
            $b64  = base64_encode(@file_get_contents($full));
            return 'data:'.$mime.';base64,'.$b64;
        };

        // Gambar: coba ganti placeholder & konversi source jadi data URI
        $replaceImageSrc = function (array $in) use ($repl, $toDataUri) {
            foreach (['image_path', 'imageUrl', 'src', 'url'] as $f) {
                if (!empty($in[$f]) && is_string($in[$f])) {
                    $val = strtr($in[$f], $repl);
                    if (!preg_match('~^(data:|https?://)~i', $val)) {
                        $maybe = $toDataUri($val);
                        if ($maybe) $val = $maybe;
                    }
                    $in[$f] = $val;
                }
            }
            return $in;
        };

        // -------- 3) Replacer rekursif untuk string di dalam element --------
        $replacer = null;
        $replacer = function (&$value) use (&$replacer, $repl) {
            if (is_array($value)) { foreach ($value as &$v) $replacer($v); return; }
            if (is_string($value)) $value = strtr($value, $repl);
        };

        // -------- 4) Normalisasi posisi & ukuran --------
        $normalizeBox = function (array $e) use ($pageWidth, $pageHeight) {
            // cast angka
            foreach (['x','y','width','height','rotation','rotate','opacity','strokeWidth','borderRadius'] as $k) {
                if (isset($e[$k]) && $e[$k] !== '') $e[$k] = (float) $e[$k];
            }
            $e['x'] = isset($e['x']) ? (float)$e['x'] : 0.0;
            $e['y'] = isset($e['y']) ? (float)$e['y'] : 0.0;

            // Posisi negatif → geser dari kanan/bawah
            if ($e['x'] < 0) $e['x'] = max(0.0, $pageWidth + $e['x']);
            if ($e['y'] < 0) $e['y'] = max(0.0, $pageHeight + $e['y']);

            // Default ukuran per tipe
            $type = $e['type'] ?? '';
            if (!isset($e['width']) || $e['width'] <= 0) {
                $e['width'] = match($type) {
                    'qrcode'    => 100.0,
                    'signature' => 200.0,
                    'shape'     => 60.0,
                    default     => ($e['width'] ?? 200.0),
                };
            }
            if (!isset($e['height']) || $e['height'] <= 0) {
                $e['height'] = match($type) {
                    'qrcode'    => 100.0,
                    'signature' => 80.0,
                    'shape'     => 60.0,
                    default     => ($e['height'] ?? 40.0),
                };
            }

            // Clamp agar tetap di halaman
            $e['x'] = min(max(0.0, $e['x']), max(0.0, $pageWidth  - $e['width']));
            $e['y'] = min(max(0.0, $e['y']), max(0.0, $pageHeight - $e['height']));

            // Samakan field rotation
            if (!isset($e['rotation']) && isset($e['rotate'])) $e['rotation'] = (float)$e['rotate'];

            return $e;
        };

        // -------- 5) Map & per-tipe handling --------
        return array_map(function ($el) use ($repl, $replaceImageSrc, $replacer, $normalizeBox) {
            if (!is_array($el)) return $el;

            // deep copy + replace semua string
            $copy = $el;
            $replacer($copy);

            // normalisasi posisi/ukuran
            $copy = $normalizeBox($copy);

            $type = $copy['type'] ?? '';

            if ($type === 'image') {
                $copy = $replaceImageSrc($copy);
                return $copy;
            }

            if ($type === 'signature') {
                $copy = $replaceImageSrc($copy);
                $sigToken = '{INSTRUKTUR_SIGNATURE}';
                if ((empty($copy['imageUrl']) || !is_string($copy['imageUrl'])) && isset($repl[$sigToken])) {
                    $copy['imageUrl'] = $repl[$sigToken];
                }
                return $copy;
            }

            if ($type === 'qrcode') {
                // Prioritas pakai data-uri dari controller (tanpa file)
                if (!empty($repl['__QR_DATA_URI__']) && is_string($repl['__QR_DATA_URI__'])) {
                    $copy['qrcode']  = $repl['__QR_DATA_URI__'];
                    $copy['imageUrl'] = $repl['__QR_DATA_URI__'];
                } else {
                    // fallback: bila ada image_path/imageUrl, tetap pakai
                    $copy = $replaceImageSrc($copy);
                    if (!empty($copy['imageUrl']) && is_string($copy['imageUrl'])) {
                        $copy['qrcode'] = $copy['imageUrl'];
                    }
                }
                // jaga-jaga ukuran minimum
                if (($copy['width'] ?? 0) < 40)  $copy['width']  = 100;
                if (($copy['height'] ?? 0) < 40) $copy['height'] = 100;
                return $copy;
            }

            if ($type === 'shape') {
                // pastikan properti wajib ada
                $copy['fillColor']   = $copy['fillColor']   ?? '#000000';
                $copy['strokeColor'] = $copy['strokeColor'] ?? 'transparent';
                $copy['strokeWidth'] = isset($copy['strokeWidth']) ? (float)$copy['strokeWidth'] : 0.0;
                $copy['borderRadius']= isset($copy['borderRadius'])? (float)$copy['borderRadius']: 0.0;
                $copy['opacity']     = isset($copy['opacity']) ? max(0, min(1, (float)$copy['opacity'])) : 1.0;
                $copy['shapeType']   = strtolower($copy['shapeType'] ?? 'rectangle');
                return $copy;
            }

            // TEXT & lainnya: sudah direplace placeholder-nya di $replacer
            // Pastikan default font bila tidak ada
            if ($type === 'text') {
                $copy['fontSize']   = isset($copy['fontSize']) ? (float)$copy['fontSize'] : 16.0;
                $copy['fontWeight'] = $copy['fontWeight'] ?? 'normal';
                $copy['fontStyle']  = $copy['fontStyle']  ?? 'normal';
                $copy['textAlign']  = $copy['textAlign']  ?? 'left';
                $copy['fontFamily'] = $copy['font']['family'] ?? ($copy['fontFamily'] ?? 'Arial');
            }

            $family = $copy['fontFamily'] ?? null;
            if (!$family) {
                $raw = $copy['font']['family'] ?? null; // contoh: "Montserrat/Montserrat-Regular.ttf"
                if (is_string($raw) && $raw !== '') {
                    $base  = basename($raw); // "Montserrat-Regular.ttf"
                    $noext = preg_replace('/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/', '', $base);
                    $parts = preg_split('/[-_]/', $noext); // ["Montserrat","Regular"]
                    $family = $parts[0] ?: 'Arial';
                }
            }
            $copy['fontFamily'] = $family ?: 'Arial';

            return $copy;
        }, $elements);
    }

        private function generateCertificateNumber($template, $format = null, $dataActivityId = null)
        {
            try {
                $format = $format ?? $template->certificate_number_format;
                if (empty($format)) throw new \Exception('Format nomor sertifikat belum diatur');

                preg_match_all('/(?:^|[\/\-_])([X]+)(?=[\/\-_]|$)/', $format, $matches, PREG_OFFSET_CAPTURE);
                if (empty($matches[1])) throw new \Exception('Format harus mengandung placeholder X');

                $placeholder = $matches[1][0][0];
                $placeholderPosition = $matches[1][0][1];
                $placeholderLength = strlen($placeholder);

                // If dataActivityId is provided, maintain a per-activity counter so
                // numbering can reset for each activity. Otherwise fall back to
                // template-level last_certificate_number.
                if (!empty($dataActivityId)) {
                    // Use a transaction + lock to avoid race conditions when multiple
                    // requests generate numbers concurrently for the same activity.
                    $nextNumber = DB::transaction(function () use ($dataActivityId) {
                        $current = DB::table('data_activity')
                            ->where('id', $dataActivityId)
                            ->lockForUpdate()
                            ->value('last_certificate_number');
                        $current = $current ?? 0;
                        $next = $current + 1;
                        DB::table('data_activity')->where('id', $dataActivityId)->update([
                            'last_certificate_number' => $next,
                            // mark this activity as having had certificates generated
                            'generated' => true,
                        ]);
                        return $next;
                    });
                } else {
                    $nextNumber = $template->last_certificate_number + 1;
                    $template->update(['last_certificate_number' => $nextNumber]);
                }
                $formattedNumber = str_pad($nextNumber, $placeholderLength, '0', STR_PAD_LEFT);

                return substr_replace($format, $formattedNumber, $placeholderPosition, $placeholderLength);
            } catch (\Exception $e) {
                Log::error('Error generating certificate number: ' . $e->getMessage());
                throw $e;
            }
        }

       
        public function getUserCertificates($id)
        {
            try {
                $user = User::findOrFail($id);
                $certificates = UserCertificate::with('certificateDownload.dataActivity')
                    ->where('user_id', $id)->where('status', 'active')->get()
                    ->map(function ($cert) {
                        if (!$cert->certificateDownload) return null;
                        return [
                            'id' => $cert->id,
                            'recipient_name' => $cert->certificateDownload->recipient_name,
                            'certificate_number' => $cert->certificateDownload->certificate_number,
                            'activity_name' => $cert->certificateDownload->dataActivity->activity_name ?? 'N/A',
                            'view_url' => url('/sertifikat-templates/preview/' . $cert->certificateDownload->token),
                            'download_url' => url('/sertifikat-templates/download/' . $cert->certificateDownload->token),
                        ];
                    })->filter()->values();
                return response()->json(['status' => 'success', 'data' => $certificates]);
            } catch (\Exception $e) {
                Log::error('Error fetching user certificates', ['error' => $e->getMessage()]);
                return response()->json(['status' => 'error', 'message' => 'Gagal mengambil data sertifikat.'], 500);
            }
        }

        public function getCertificateByNumber(Request $request)
    {
        try {
            $number = $request->input('certificate_number');
            if (empty($number)) {
                return response()->json(['message' => 'Nomor sertifikat diperlukan'], 400);
            }

            // Cek apakah certificate_number ada di tabel certificate_downloads
            $certDownload = CertificateDownload::with('dataActivity.instruktur')
                ->where('certificate_number', $number)
                ->first();

            // Jika tidak ditemukan di certificate_downloads, cari di data_activity_user
            if (!$certDownload) {
                // Cari di pivot table data_activity_user
                $pivotData = DB::table('data_activity_user')
                    ->where('certificate_number', $number)
                    ->first();

                if (!$pivotData) {
                    return response()->json([
                        'status' => 'error', 
                        'message' => 'Sertifikat tidak ditemukan'
                    ], 404);
                }

                // Ambil data activity dan user dari pivot
                $dataActivity = DB::table('data_activities')->where('id', $pivotData->data_activity_id)->first();
                $user = DB::table('users')->where('id', $pivotData->user_id)->first();
                $instruktur = null;
                
                if ($dataActivity && $dataActivity->instruktur_id) {
                    $instruktur = DB::table('users')->where('id', $dataActivity->instruktur_id)->first();
                }

                // Ambil type langsung dari pivot (panitia/narasumber/peserta)
                $memberType = $pivotData->type ?? 'peserta';
                
                // Map member_type ke role_id untuk konsistensi
                $roleId = match (strtolower($memberType)) {
                    'panitia' => 4,
                    'narasumber' => 5,
                    'peserta' => 3,
                    default => 3,
                };

                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'activity_name'      => $dataActivity->activity_name ?? null,
                        'member_type'        => $memberType,
                        'role_id'            => $roleId,
                        'location'           => $dataActivity->location ?? null,
                        'date'               => $dataActivity->date ?? null,
                        'certificate_number' => $number,
                        'recipient_name'     => $user->name ?? 'N/A',
                        'instruktur_name'    => $instruktur->name ?? 'N/A',
                    ]
                ]);
            }

            // Jika ditemukan di certificate_downloads
            $location = $certDownload->dataActivity->location ?? null;
            $memberType = 'peserta'; // default
            $roleId = 3; // default

            if (!empty($certDownload->user_id) && $certDownload->dataActivity) {
                // Query ke data_activity_user dengan kolom 'type'
                $pivotData = DB::table('data_activity_user')
                    ->where('data_activity_id', $certDownload->dataActivity->id)
                    ->where('user_id', $certDownload->user_id)
                    ->first();

                if ($pivotData && isset($pivotData->type)) {
                    // Ambil type langsung dari pivot
                    $memberType = $pivotData->type;
                    
                    // Map member_type ke role_id
                    $roleId = match (strtolower($memberType)) {
                        'panitia' => 4,
                        'narasumber' => 5,
                        'peserta' => 3,
                        default => 3,
                    };
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'activity_name'      => $certDownload->dataActivity->activity_name ?? null,
                    'member_type'        => $memberType,
                    'role_id'            => $roleId,
                    'location'           => $location,
                    'date'               => $certDownload->dataActivity->date ?? null,
                    'certificate_number' => $certDownload->certificate_number,
                    'recipient_name'     => $certDownload->recipient_name,
                    'instruktur_name'    => $certDownload->dataActivity->instruktur->name ?? 'N/A',
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching certificate by number', [
                'error' => $e->getMessage(),
                'number' => $request->input('certificate_number')
            ]);
            return response()->json([
                'status' => 'error', 
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }
        public function removeParticipants(Request $request)
        {
            $validated = $request->validate([
                'data_activity_id' => 'required|exists:data_activity,id',
                'user_ids' => 'required|array|min:1',
                'user_ids.*' => 'required|integer|distinct',
                'type' => 'nullable|in:peserta,panitia,narasumber',
            ]);

            $activity = DataActivity::findOrFail($validated['data_activity_id']);
            $userIds = array_map('intval', $validated['user_ids']);
            $requestedType = $validated['type'] ?? null;

            $possible = ['peserta', 'panitia', 'narasumber'];

            $results = [];
            $totalRemovedDownloads = 0;

            try {
                DB::transaction(function () use ($activity, $userIds, $requestedType, $possible, &$results, &$totalRemovedDownloads) {
                    // For each user, determine relation (or use requested type) and remove
                    foreach ($userIds as $uid) {
                        $relationName = $requestedType;

                        // load user for logging and existence
                        $user = User::find($uid);
                        if (!$user) {
                            $results[] = ['user_id' => $uid, 'removed' => false, 'reason' => 'user_not_found'];
                            continue;
                        }

                        if (!$relationName) {
                            foreach ($possible as $rel) {
                                try {
                                    if ($activity->{$rel}()->where('user_id', $uid)->exists()) {
                                        $relationName = $rel;
                                        break;
                                    }
                                } catch (\Throwable $ex) {
                                    // ignore missing relation
                                }
                            }
                        }

                        if (!$relationName) {
                            $results[] = ['user_id' => $uid, 'removed' => false, 'reason' => 'not_attached_to_activity'];
                            continue;
                        }

                        // Detach from relation (try Eloquent relation, fallback to pivot delete by type)
                        try {
                            $activity->{$relationName}()->detach($uid);
                        } catch (\Throwable $ex) {
                            DB::table('data_activity_user')
                                ->where('data_activity_id', $activity->id)
                                ->where('user_id', $uid)
                                ->where('type', $relationName)
                                ->delete();
                        }

                        // Delete associated downloads and user certificates
                        $downloads = CertificateDownload::where('user_id', $uid)
                            ->where('data_activity_id', $activity->id)
                            ->get();

                        $removedCount = 0;
                        foreach ($downloads as $dl) {
                            UserCertificate::where('certificate_download_id', $dl->id)->delete();
                            $dl->delete();
                            $removedCount++;
                        }

                        $totalRemovedDownloads += $removedCount;
                        $results[] = ['user_id' => $uid, 'removed' => true, 'removed_certificate_downloads' => $removedCount, 'type' => $relationName];
                        // reset relationName for next user if requestedType was null
                        $relationName = $requestedType;
                    }
                });

                return response()->json([
                    'status' => 'success',
                    'message' => 'Users removed from activity',
                    'total_removed_certificate_downloads' => $totalRemovedDownloads,
                    'results' => $results
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to remove participants batch from activity', [
                    'error' => $e->getMessage(),
                    'data_activity_id' => $activity->id,
                    'user_ids' => $userIds,
                ]);
                return response()->json(['status' => 'error', 'message' => 'Gagal menghapus peserta dari aktivitas'], 500);
            }
        }

        /**
         * Remove a single user from a DataActivity (supports peserta/panitia/narasumber)
         * DELETE /data-activities/{activity}/users/{user}
         */
        public function removeParticipant(Request $request, DataActivity $activity, User $user)
        {
            $validated = $request->validate([
                'type' => 'nullable|in:peserta,panitia,narasumber',
            ]);

            $requestedType = $validated['type'] ?? null;
            $possible = ['peserta', 'panitia', 'narasumber'];

            try {
                $relationName = $requestedType;

                if (!$relationName) {
                    foreach ($possible as $rel) {
                        try {
                            if ($activity->{$rel}()->where('user_id', $user->id)->exists()) {
                                $relationName = $rel;
                                break;
                            }
                        } catch (\Throwable $ex) {
                            // ignore
                        }
                    }
                }

                if (!$relationName) {
                    return response()->json(['message' => 'User tidak ditemukan pada aktivitas ini'], 404);
                }

                $removedDownloads = 0;
                DB::transaction(function () use ($activity, $user, $relationName, &$removedDownloads) {
                    try {
                        $activity->{$relationName}()->detach($user->id);
                    } catch (\Throwable $ex) {
                        DB::table('data_activity_user')
                            ->where('data_activity_id', $activity->id)
                            ->where('user_id', $user->id)
                            ->where('type', $relationName)
                            ->delete();
                    }

                    $downloads = CertificateDownload::where('user_id', $user->id)
                        ->where('data_activity_id', $activity->id)
                        ->get();

                    foreach ($downloads as $dl) {
                        UserCertificate::where('certificate_download_id', $dl->id)->delete();
                        $dl->delete();
                        $removedDownloads++;
                    }
                });

                return response()->json(['status' => 'success', 'message' => ucfirst($relationName) . ' dihapus dari aktivitas', 'removed_certificate_downloads' => $removedDownloads]);
            } catch (\Exception $e) {
                Log::error('Failed to remove single participant from activity', ['error' => $e->getMessage(), 'user_id' => $user->id, 'data_activity_id' => $activity->id]);
                return response()->json(['status' => 'error', 'message' => 'Gagal menghapus user dari aktivitas'], 500);
            }
        }
    }
