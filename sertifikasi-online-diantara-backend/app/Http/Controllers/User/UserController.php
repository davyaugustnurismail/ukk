<?php

namespace App\Http\Controllers\User;



use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Http\Controllers\Controller;
use App\Models\DataActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Throwable;
use App\Enums\MemberType;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    // Format nomor HP untuk menyimpan ke database

    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                    'error' => 'Unauthorized'
                ], 401);
            }

            // Ambil seluruh user untuk merchant yang sama; frontend yang akan handle paging/filter
            $query = User::with(['role', 'daftarActivity' => function ($q) {
                // jika diperlukan, bisa tambahkan eager load tambahan di sini
                $q->withPivot('type');
            }, 'merchant'])
                ->where('merchant_id', $user->merchant_id);

            $items = $query->get();

            // Parse perPage hanya untuk metadata; front-end boleh kirim perPage jika ingin
            $perPage = (int) $request->input('perPage', 10);
            if ($perPage <= 0) $perPage = 10;

            $total = $items->count();
            $totalPages = $perPage > 0 ? (int) ceil($total / $perPage) : 1;

            $result = $items->map(function ($item) {
                try {
                    // safe access untuk relasi yang mungkin null
                    $daftar = $item->daftarActivity ?? collect();

                    // kumpulkan semua tipe dari pivot (bisa lebih dari satu)
                    $typesFromPivot = $daftar->pluck('pivot.type')->filter()->unique()->values()->toArray();

                    // bentuk data_activity_users agar frontend yang mencari key ini dapat menemukannya
                    $dataActivityUsers = $daftar->map(function ($activity) {
                        return [
                            'activity_id' => $activity->id,
                            'type' => $activity->pivot->type ?? null,
                            // include pivot raw for compatibility if frontend expects pivot object
                            'pivot' => $activity->pivot ? (object) ['type' => ($activity->pivot->type ?? null)] : null,
                        ];
                    })->toArray();

                    // activities array dengan info pivot/type_member agar frontend menampilkannya di kolom kegiatan
                    $activities = $daftar->map(function ($activity) {
                        return [
                            'id' => $activity->id,
                            'activity_name' => $activity->activity_name ?? $activity->name ?? null,
                            // keep pivot->type for frontend convenience (also name it type_member for compatibility)
                            'pivot' => $activity->pivot ? (object) ['type' => ($activity->pivot->type ?? null)] : null,
                            'type_member' => $activity->pivot->type ?? null,
                        ];
                    })->toArray();

                    // tentukan single convenience value type_member (ambil yg pertama kalau ada)
                    $firstType = $daftar->pluck('pivot.type')->filter()->first();
                    $typeMemberSingle = $firstType
                        ? $firstType
                        : ($item->role ? $item->role->name : (isset($item->role_id) ? match ($item->role_id) {
                            4 => 'panitia',
                            5 => 'narasumber',
                            3 => 'peserta',
                            default => null,
                        } : null));

                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'no_hp' => $item->no_hp,
                        'asal_institusi' => $item->asal_institusi,
                        'email' => $item->email,
                        'role_id' => $item->role_id,
                        'role_name' => $item->role ? $item->role->name : null,
                        // list semua tipe yang ditemukan di pivot
                        'type_members' => $typesFromPivot,
                        // single convenience value (frontend juga membaca `type_member`)
                        'merchant_id' => $item->merchant_id,
                        'merchant' => $item->merchant,
                        // activities with pivot/type_member for frontend to read per-activity role
                        'activities' => $activities,
                        // also provide direct data_activity_users array (used by some frontend code)
                        'data_activity_users' => $dataActivityUsers,
                    ];
                } catch (\Exception $e) {
                    Log::error('Error formatting user data: ' . $e->getMessage() . ' for user ID: ' . $item->id);
                    return null;
                }
            })->filter();

            return response()->json([
                'success' => true,
                'total' => $total,
                'total_pages' => $totalPages,
                'per_page' => $perPage,
                'message' => 'User list fetched successfully.',
                'data' => array_values($result->toArray()),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data pengguna.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    private function formatNomorHP($nomor)
    {
        if (empty($nomor)) {
            return null;
        }

        // Remove all non-digit characters, allow leading + which we'll strip
        $nomor = preg_replace('/[^0-9]/', '', $nomor);

        // If number starts with country code 62 -> convert to leading 0
        if (substr($nomor, 0, 2) === '62') {
            $nomor = '0' . substr($nomor, 2);
        }

        // If number starts with single 8 (e.g. '8123...') -> prepend 0 to become '08...'
        if (substr($nomor, 0, 1) === '8') {
            $nomor = '0' . $nomor;
        }

        // Ensure it starts with 0
        if (substr($nomor, 0, 1) !== '0') {
            $nomor = '0' . $nomor;
        }

        // Optionally trim very long numbers to a reasonable max (15 digits)
        if (strlen($nomor) > 15) {
            $nomor = substr($nomor, 0, 15);
        }

        return $nomor;
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Scope uniqueness to the merchant_id of the authenticated user (or default 1)
            $merchantId = auth('sanctum')->user()->merchant_id ?? 1;

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'type_member' => ['required', 'string', Rule::in(MemberType::values())],
                'email' => [
                    'required',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique('users')->where(function ($query) use ($merchantId) {
                        return $query->where('merchant_id', $merchantId);
                    }),
                ],
                'no_hp' => [
                    'required',
                    'string',
                    'max:15',
                    Rule::unique('users', 'no_hp')->where(function ($query) use ($merchantId) {
                        return $query->where('merchant_id', $merchantId);
                    }),
                    // Accept inputs starting with +62, 62, 08
                    'regex:/^(\+?62|08|8)[0-9]{7,13}$/'
                ],
                'asal_institusi' => 'required|string|max:255',
                'password' => 'nullable|string|min:8|',
                // Optional activities to attach (nullable)
                'activities' => 'nullable|array',
                'activities.*' => 'integer|exists:data_activity,id',
            ], [
                'email.unique' => 'Email sudah terdaftar',
                'no_hp.unique' => 'Nomor HP sudah terdaftar',
                'password.required' => 'Password harus diisi',
                'password.min' => 'Password minimal 8 karakter',
                'password.confirmed' => 'Konfirmasi password tidak sesuai',
                'no_hp.regex' => 'Nomor HP harus diawali 62 atau 08 dan terdiri dari 8-15 digit angka',
                'no_hp.required' => 'Nomor HP harus diisi',
                'asal_institusi.required' => 'Asal institusi harus diisi',
                'name.required' => 'Nama harus diisi',
                'email.required' => 'Email harus diisi',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();
            // Normalize phone number to 08... format before saving
            if (!empty($validated['no_hp'])) {
                $validated['no_hp'] = $this->formatNomorHP($validated['no_hp']);
            }

            // Set merchant_id from authenticated user (consistent with validation scope)
            $validated['merchant_id'] = $merchantId;

            // Extract optional activities before creating user
            $activityIds = null;
            if (array_key_exists('activities', $validated)) {
                $activityIds = $validated['activities'];
                unset($validated['activities']);
            }

            DB::beginTransaction();
            try {
                // Set role_id based on type_member
                $typeMember = $validated['type_member'];
                $roleId = 3; // default peserta
                switch($typeMember) {
                    case 'panitia':
                        $roleId = 4;
                        break;
                    case 'narasumber':
                        $roleId = 5;
                        break;
                }
                
                $validated['role_id'] = $roleId;
                unset($validated['type_member']); // remove type_member from validated data
                
                $user = User::create($validated);

                if (!is_null($activityIds)) {
                    // Ensure activities belong to the same merchant and are not generated
                    $activities = DataActivity::whereIn('id', $activityIds)
                        ->where('merchant_id', $validated['merchant_id'])
                        ->get(['id', 'generated']);
                    $validActivityIds = $activities->pluck('id')->toArray();

                    // If any requested activity has already had certificates generated, block
                    $generatedIds = $activities->filter(fn($a) => (bool)$a->generated)->pluck('id')->toArray();
                    if (!empty($generatedIds)) {
                        DB::rollBack();
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Tidak dapat menambahkan peserta: beberapa kegiatan sudah memiliki sertifikat yang digenerate.',
                            'generated_ids' => $generatedIds
                        ], 409);
                    }

                    if (count($validActivityIds) !== count($activityIds)) {
                        DB::rollBack();
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Beberapa activity_id tidak valid atau tidak belong ke merchant Anda.',
                            'invalid_ids' => array_values(array_diff($activityIds, $validActivityIds))
                        ], 422);
                    }

                    // Attach with pivot 'type' so new users keep their type_member per activity
                    $syncPayload = [];
                    foreach ($validActivityIds as $aid) {
                        $syncPayload[$aid] = ['type' => $typeMember];
                    }
                    $user->daftarActivity()->syncWithoutDetaching($syncPayload);
                }

                DB::commit();

                return response([
                    'message' => 'User created successfully.',
                    'data' => $user
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat membuat user.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // Download template Excel untuk import peserta
    public function downloadTemplate()
    {
        $filePath = public_path('template/template_peserta.xlsx');
        if (!file_exists($filePath)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Template file not found.'
            ], 404);
        }
        return response()->download($filePath, 'template_peserta.xlsx');
    }


    // Import Users dari file Excel OR by existing user IDs
    public function import(Request $request, $id)
    {
        // 1️⃣ AMBIL TYPE DARI REQUEST (peserta/panitia/narasumber)
        $typeMemberEvent = $request->input('type_member', 'peserta');
        
        // 2️⃣ VALIDASI ACTIVITY EXISTS
        $dataActivity = DataActivity::findOrFail($id);

        // 3️⃣ BLOCK JIKA SUDAH GENERATE SERTIFIKAT
        if ($dataActivity->generated) {
            return response()->json([
                'status' => 'error',
                'message' => "Kegiatan sudah digenerate sertifikat, tidak bisa tambah peserta."
            ], 409);
        }

        // 4️⃣ MODE 1: IMPORT BY USER IDS (existing users)
        if ($request->has('user_ids')) {
            return $this->importByUserIds($request, $id, $typeMemberEvent);
        }

        // 5️⃣ MODE 2: IMPORT BY EXCEL
        $validator = Validator::make($request->all(), [
            'file_excel' => 'required|mimes:xlsx,xls|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file_excel');
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $data = $sheet->toArray();

            DB::beginTransaction();
            
            $importedCount = 0;
            $errors = [];
            $warnings = []; // ← BARU: untuk notifikasi user sudah ada
            $rowNumber = 1;

            $loggedInUser = auth('sanctum')->user();
            $merchant_id = $loggedInUser ? $loggedInUser->merchant_id : 1;

            foreach (array_slice($data, 1) as $row) {
                $rowNumber++;
                
                // Skip baris kosong
                if (!array_filter($row)) {
                    continue;
                }

                // 6️⃣ VALIDASI EMAIL
                $email = filter_var($row[1], FILTER_VALIDATE_EMAIL);
                if (!$email) {
                    $errors[] = "Baris {$rowNumber}: Email '{$row[1]}' tidak valid.";
                    continue;
                }

                // 7️⃣ VALIDASI & FORMAT NOMOR HP
                $nomorHpFormatted = $this->formatNomorHP($row[2]);
                if (!preg_match('/^0[0-9]{7,14}$/', $nomorHpFormatted)) {
                    $errors[] = "Baris {$rowNumber}: Nomor HP '{$row[2]}' tidak valid.";
                    continue;
                }

                // 8️⃣ CEK: APAKAH EMAIL SUDAH ADA?
                $existingUser = User::where('email', $email)
                    ->where('merchant_id', $merchant_id)
                    ->first();

                if ($existingUser) {
                    // ✅ USER SUDAH ADA - Proses attach/update
                    $result = $this->handleExistingUser(
                        $existingUser, 
                        $id, 
                        $typeMemberEvent, 
                        $nomorHpFormatted, 
                        $rowNumber
                    );
                    
                    if ($result['status'] === 'error') {
                        $errors[] = $result['message'];
                        continue;
                    }
                    
                    if ($result['status'] === 'warning') {
                        $warnings[] = $result['message'];
                    }
                    
                    $importedCount++;
                } else {
                    // ✅ USER BARU - Create user
                    $result = $this->createNewUser(
                        $row, 
                        $email, 
                        $nomorHpFormatted, 
                        $merchant_id, 
                        $id, 
                        $typeMemberEvent,
                        $rowNumber
                    );
                    
                    if ($result['status'] === 'error') {
                        $errors[] = $result['message'];
                        continue;
                    }
                    
                    $importedCount++;
                }
            }

            // 9️⃣ JIKA ADA ERROR, ROLLBACK
            if (!empty($errors)) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Beberapa data gagal diimpor.',
                    'errors' => $errors
                ], 422);
            }

            DB::commit();

            // 🔟 RESPONSE SUCCESS (dengan warnings jika ada)
            $response = [
                'status' => 'success',
                'message' => "Berhasil menambahkan {$importedCount} peserta ke kegiatan.",
            ];
            
            if (!empty($warnings)) {
                $response['warnings'] = $warnings;
            }

            return response()->json($response, 200);

        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan internal.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Display the specified resource.
     */
    public function inputUserDataActivity(Request $request, $id)
    {
       $dataActivity = DataActivity::findOrFail($id);

        $merchantId = auth('sanctum')->user()->merchant_id ?? 1;

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'type_member' => ['required', 'string', Rule::in(MemberType::values())],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->where(fn($q) => $q->where('merchant_id', $merchantId)),
            ],
            'no_hp' => [
                'required',
                'string',
                'max:15',
                Rule::unique('users', 'no_hp')->where(fn($q) => $q->where('merchant_id', $merchantId)),
                'regex:/^(62|08)[0-9]{7,13}$/'
            ],
            'asal_institusi' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        // Extract requested member type early so we can use it when attaching existing users
        $typeMember = $validated['type_member'] ?? 'peserta';

        // Cari user berdasarkan email within same merchant
        $existingUser = User::where('email', $validated['email'])->where('merchant_id', $merchantId)->first();

        // Jika user sudah ada -> attach ke activity jika belum ter-attach
        if ($existingUser) {
            if ($dataActivity->generated) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tidak dapat menambahkan peserta: kegiatan sudah memiliki sertifikat yang digenerate.'
                ], 409);
            }

            // Cek apakah sudah ada pivot untuk user di activity ini
            $existingPivot = DB::table('data_activity_user')
                ->where('data_activity_id', $id)
                ->where('user_id', $existingUser->id)
                ->first();

            if ($existingPivot) {
                // Jika sudah terdaftar dengan tipe yang sama -> skip
                if (!empty($existingPivot->type) && $existingPivot->type === $typeMember) {
                    return response()->json([
                        'message' => 'User sudah ada, tetapi sudah terdaftar sebagai ' . $typeMember . ' di kegiatan ini.',
                        'data' => $existingUser
                    ], 200);
                }

                // Jika sudah terdaftar dengan tipe berbeda -> tolak (tidak boleh multi-role di activity yang sama)
                return response()->json([
                    'status' => 'error',
                    'message' => 'User sudah terdaftar di kegiatan ini sebagai ' . ($existingPivot->type ?? 'unknown') . '. Tidak diperbolehkan menambah role ' . $typeMember . ' pada kegiatan yang sama.'
                ], 409);
            }

            // Attach with explicit pivot type
            $existingUser->daftarActivity()->syncWithoutDetaching([$id => ['type' => $typeMember]]);

            return response()->json([
                'message' => 'User sudah ada, berhasil ditambahkan ke kegiatan.',
                'data' => $existingUser
            ], 200);
        }

        // Jika belum ada -> buat user baru dan attach
        $validated['password'] = Hash::make('password');

        // Ensure merchant_id is set to current merchant
        $validated['merchant_id'] = $merchantId;

        // Set role_id based on type_member
        $typeMember = $validated['type_member'];
        $roleId = 3; // default peserta
        switch($typeMember) {
            case 'panitia':
                $roleId = 4;
                break;
            case 'narasumber':
                $roleId = 5;
                break;
        }
        
        $validated['role_id'] = $roleId;
        unset($validated['type_member']); // remove type_member from validated data

        // Normalize phone number
        if (!empty($validated['no_hp'])) {
            $validated['no_hp'] = $this->formatNomorHP($validated['no_hp']);
        }

        if ($dataActivity->generated) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menambahkan peserta: kegiatan sudah memiliki sertifikat yang digenerate.'
            ], 409);
        }

        try {
            DB::beginTransaction();

            // Create user
            $user = User::create($validated);
            
            // Attach user to activity using direct DB insert to ensure proper data
            DB::table('data_activity_user')->insert([
                'data_activity_id' => $id,
                'user_id' => $user->id,
                'type' => $typeMember,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            // Reload user with relationships
            $user = User::with(['daftarActivity'])->find($user->id);

            return response()->json([
                'message' => 'User berhasil dibuat dan ditambahkan ke kegiatan.',
                'data' => $user
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in inputUserDataActivity: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat membuat user dan menambahkan ke kegiatan.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id)
    {
        $data = User::find($id);
        if (is_null($data)) {
            return response([
                'message' => 'User not found.'
            ], 404);
        }

        return response([
            'message' => 'User founded!',
            'data' => $data
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::find($id);
        if (is_null($user)) {
            return response([
                'message' => 'User not found.'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type_member' => ['nullable', 'string', Rule::in(MemberType::values())],
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'no_hp' => [
                'required',
                'string',
                'max:15',
                'regex:/^(\\+?62|08|8)[0-9]{7,13}$/'
            ],
            'asal_institusi' => 'required|string|max:255',
            'password' => 'nullable|string|min:8|confirmed',
            // Optional activities array; when omitted -> no change; when empty array -> detach all
            'activities' => 'nullable|array',
            'activities.*' => 'integer|exists:data_activity,id',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        // If the request provided a type_member, map it to role_id and apply
        $requestTypeMember = $validated['type_member'] ?? null;
        if (!empty($requestTypeMember)) {
            $role_id = 3; // default peserta
            switch ($requestTypeMember) {
                case 'panitia':
                    $role_id = 4;
                    break;
                case 'narasumber':
                    $role_id = 5;
                    break;
            }

            // Check if user has any generated activities with their current role
            if ($user->role_id !== $role_id) {
                $hasGeneratedActivities = DB::table('data_activity_user')
                    ->join('data_activity', 'data_activity_user.data_activity_id', '=', 'data_activity.id')
                    ->where('data_activity_user.user_id', $user->id)
                    ->where('data_activity.generated', true)
                    ->exists();

                if ($hasGeneratedActivities) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Tidak dapat mengubah tipe anggota: user sudah terdaftar pada kegiatan yang sudah digenerate sertifikatnya.'
                    ], 409);
                }
            }

            $validated['role_id'] = $role_id;
            // remove type_member so update() won't try to write it (no such column)
            unset($validated['type_member']);
        }

        // Normalize phone number to 08... format before saving
        if (!empty($validated['no_hp'])) {
            $validated['no_hp'] = $this->formatNomorHP($validated['no_hp']);
        }

        // Extract activities if present
        $activityIds = null;
        if (array_key_exists('activities', $validated)) {
            $activityIds = $validated['activities'];
            unset($validated['activities']);
        }

        DB::beginTransaction();
        try {
            $user->update($validated);

            if (!is_null($activityIds)) {
                $auth = auth('sanctum')->user();
                $merchantId = $auth ? $auth->merchant_id : $user->merchant_id;

                // Validate activities belong to merchant
                $validActivityIds = DataActivity::whereIn('id', $activityIds)
                    ->where('merchant_id', $merchantId)
                    ->pluck('id')
                    ->toArray();

                if (count($validActivityIds) !== count($activityIds)) {
                    DB::rollBack();
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Beberapa activity_id tidak valid atau tidak belong ke merchant Anda.',
                        'invalid_ids' => array_values(array_diff($activityIds, $validActivityIds))
                    ], 422);
                }

                if (empty($validActivityIds)) {
                    // Provided an empty array -> detach all activities
                    // But first check if user is currently attached to any generated activities -> prevent mass-detach
                    $currentlyAttached = $user->daftarActivity()->pluck('id')->toArray();
                    $generatedAttached = DataActivity::whereIn('id', $currentlyAttached)
                        ->where('generated', true)
                        ->pluck('id')
                        ->toArray();

                    if (!empty($generatedAttached)) {
                        DB::rollBack();
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Tidak dapat menghapus kegiatan: user terdaftar pada kegiatan yang sudah digenerate sertifikatnya.',
                            'generated_attached_ids' => $generatedAttached
                        ], 409);
                    }

                    $user->daftarActivity()->detach();
                } else {
                    // Determine which activities are newly being attached (not currently attached)
                    $currentActivityIds = $user->daftarActivity()->pluck('id')->toArray();
                    $toAttach = array_values(array_diff($validActivityIds, $currentActivityIds));

                    // Determine which activities would be detached (currently attached but not in new list)
                    $toDetach = array_values(array_diff($currentActivityIds, $validActivityIds));

                    // If any of the activities to detach have already been generated, block the operation
                    if (!empty($toDetach)) {
                        $generatedToDetach = DataActivity::whereIn('id', $toDetach)
                            ->where('generated', true)
                            ->pluck('id')
                            ->toArray();

                        if (!empty($generatedToDetach)) {
                            DB::rollBack();
                            return response()->json([
                                'status' => 'error',
                                'message' => 'Tidak dapat menghapus kegiatan: beberapa kegiatan yang ingin dihapus sudah memiliki sertifikat yang digenerate.',
                                'generated_detach_ids' => $generatedToDetach
                            ], 409);
                        }
                    }

                    // If any of the activities to attach have already been generated, block the operation
                    if (!empty($toAttach)) {
                        $generatedIds = DataActivity::whereIn('id', $toAttach)
                            ->where('generated', true)
                            ->pluck('id')
                            ->toArray();

                        if (!empty($generatedIds)) {
                            DB::rollBack();
                            return response()->json([
                                'status' => 'error',
                                'message' => 'Tidak dapat menambahkan peserta: beberapa kegiatan yang ingin ditambahkan sudah memiliki sertifikat yang digenerate.',
                                'generated_ids' => $generatedIds
                            ], 409);
                        }
                    }

                    // Sync to exactly the provided list and ensure pivot 'type' matches the user's member type
                    // Determine pivot type: prefer requested type_member, otherwise derive from user's role_id
                    $appliedType = $requestTypeMember ?? null;
                    if (empty($appliedType)) {
                        $roleId = $user->role_id ?? $user->getAttribute('role_id');
                        $appliedType = match ($roleId) {
                            4 => 'panitia',
                            5 => 'narasumber',
                            3 => 'peserta',
                            default => 'peserta',
                        };
                    }

                    $syncPayload = [];
                    foreach ($validActivityIds as $aid) {
                        $syncPayload[$aid] = ['type' => $appliedType];
                    }

                    $user->daftarActivity()->sync($syncPayload);
                }
            }

            DB::commit();

            return response([
                'message' => 'User updated successfully.',
                'data' => $user
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating user activities: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memperbarui user.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::find($id);
        if (is_null($user)) {
            return response([
                'message' => 'User not found.'
            ], 404);
        }

        // Merchant scoping: prevent deleting users belonging to another merchant
        $auth = auth('sanctum')->user();
        if ($auth && isset($auth->merchant_id) && $auth->merchant_id && $auth->merchant_id !== $user->merchant_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'AKSES DITOLAK. Anda tidak bisa menghapus user dari merchant lain.'
            ], 403);
        }

        DB::beginTransaction();
        try {
            // Remove pivot entries for this user
            DB::table('data_activity_user')->where('user_id', $user->id)->delete();

            // Delete user
            $user->delete();

            DB::commit();

            return response([
                'message' => 'User deleted successfully!',
                'data' => $user
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting user: ' . $e->getMessage() . ' user_id: ' . $id);
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat menghapus user.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
        /**
     * Handle user yang sudah ada di database
     * 
     * @return array ['status' => 'success'|'error'|'warning', 'message' => '...']
     */
    private function handleExistingUser($user, $activityId, $type, $nomorHpFormatted, $rowNumber)
    {
        // 1️⃣ VALIDASI: NOMOR HP HARUS SAMA
        if ($user->no_hp !== $nomorHpFormatted) {
            return [
                'status' => 'error',
                'message' => "Baris {$rowNumber}: Email '{$user->email}' sudah terdaftar dengan nomor HP berbeda ('{$user->no_hp}' vs '{$nomorHpFormatted}')."
            ];
        }

        // 2️⃣ CEK: APAKAH USER SUDAH TERDAFTAR DI ACTIVITY INI?
        $existingPivot = DB::table('data_activity_user')
            ->where('data_activity_id', $activityId)
            ->where('user_id', $user->id)
            ->where('type', $type) // ← Cek type yang SAMA
            ->first();

        // 3️⃣ JIKA SUDAH ADA DENGAN TYPE YANG SAMA → SKIP
        if ($existingPivot) {
            return [
                'status' => 'warning',
                'message' => "Baris {$rowNumber}: {$user->name} sudah terdaftar sebagai {$type} di kegiatan ini (dilewati)."
            ];
        }

        // 4️⃣ CEK: APAKAH ADA DENGAN TYPE BERBEDA?
        $otherTypePivot = DB::table('data_activity_user')
            ->where('data_activity_id', $activityId)
            ->where('user_id', $user->id)
            ->first(); // ← Ambil tanpa filter type

        if ($otherTypePivot) {
            // Jika user sudah memiliki pivot untuk activity ini dengan tipe berbeda,
            // tolak penambahan role baru untuk menjaga aturan "satu user - satu role per activity".
            return [
                'status' => 'error',
                'message' => "Baris {$rowNumber}: {$user->name} sudah terdaftar sebagai {$otherTypePivot->type}. Tidak bisa tambah sebagai {$type}."
            ];
        }

        // 5️⃣ USER BELUM TERDAFTAR DI ACTIVITY INI → ATTACH
        DB::table('data_activity_user')->insert([
            'data_activity_id' => $activityId,
            'user_id' => $user->id,
            'type' => $type,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return [
            'status' => 'success',
            'message' => "Baris {$rowNumber}: {$user->name} berhasil ditambahkan sebagai {$type}."
        ];
    }

    /**
     * Create user baru dan attach ke activity
     */
    private function createNewUser($row, $email, $nomorHp, $merchantId, $activityId, $type, $rowNumber)
    {
        // 1️⃣ VALIDASI: NAMA TIDAK BOLEH KOSONG
        if (empty($row[0])) {
            return [
                'status' => 'error',
                'message' => "Baris {$rowNumber}: Nama tidak boleh kosong."
            ];
        }

        // 2️⃣ CEK: NOMOR HP SUDAH DIPAKAI USER LAIN?
        $existingByPhone = User::where('no_hp', $nomorHp)
            ->where('merchant_id', $merchantId)
            ->first();
        
        if ($existingByPhone) {
            return [
                'status' => 'error',
                'message' => "Baris {$rowNumber}: Nomor HP '{$nomorHp}' sudah terdaftar untuk email '{$existingByPhone->email}'."
            ];
        }

        // 3️⃣ TENTUKAN ROLE_ID BERDASARKAN TYPE
        $roleId = match($type) {
            'panitia' => 4,
            'narasumber' => 5,
            default => 3, // peserta
        };

        // 4️⃣ CREATE USER BARU
        $newUser = User::withoutEvents(function () use ($row, $email, $nomorHp, $merchantId, $roleId) {
            return User::create([
                'name' => $row[0],
                'email' => $email,
                'no_hp' => $nomorHp,
                'asal_institusi' => $row[3] ?? null,
                'password' => Hash::make('password'),
                'role_id' => $roleId,
                'merchant_id' => $merchantId,
            ]);
        });

        // 5️⃣ ATTACH KE ACTIVITY
        DB::table('data_activity_user')->insert([
            'data_activity_id' => $activityId,
            'user_id' => $newUser->id,
            'type' => $type,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return [
            'status' => 'success',
            'message' => "Baris {$rowNumber}: User baru '{$row[0]}' berhasil dibuat dan ditambahkan sebagai {$type}."
        ];
    }

    /**
     * Import users by existing user IDs (attach to activity)
     * 
     * @param Request $request
     * @param int $activityId
     * @param string $typeMemberEvent (peserta|panitia|narasumber)
     * @return \Illuminate\Http\JsonResponse
     */
    private function importByUserIds(Request $request, $activityId, $typeMemberEvent)
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $userIds = array_values(array_unique($request->input('user_ids', [])));
        $loggedInUser = auth('sanctum')->user();
        $merchant_id = $loggedInUser ? $loggedInUser->merchant_id : 1;

        // Check if activity already generated certificates
        $dataActivity = DataActivity::find($activityId);
        if ($dataActivity && $dataActivity->generated) {
            return response()->json([
                'status' => 'error',
                'message' => "Kegiatan dengan id {$activityId} sudah memiliki sertifikat yang digenerate. Tidak dapat menambahkan peserta."
            ], 409);
        }

        DB::beginTransaction();
        try {
            $errors = [];
            $warnings = [];
            $attached = 0;

            $users = User::whereIn('id', $userIds)->get()->keyBy('id');

            foreach ($userIds as $uid) {
                $user = $users->get($uid);
                
                // 1️⃣ Validasi: User exists
                if (!$user) {
                    $errors[] = "User id {$uid} tidak ditemukan.";
                    continue;
                }
                
                // 2️⃣ Validasi: User belongs to same merchant
                if ($user->merchant_id !== $merchant_id) {
                    $errors[] = "User id {$uid} ({$user->name}) tidak belong ke merchant Anda.";
                    continue;
                }

                // 3️⃣ Cek: Apakah sudah terdaftar dengan type yang SAMA?
                $existingWithSameType = DB::table('data_activity_user')
                    ->where('data_activity_id', $activityId)
                    ->where('user_id', $uid)
                    ->where('type', $typeMemberEvent)
                    ->exists();

                if ($existingWithSameType) {
                    $warnings[] = "{$user->name} sudah terdaftar sebagai {$typeMemberEvent} di kegiatan ini (dilewati).";
                    continue;
                }

                // 4️⃣ Cek: Apakah sudah terdaftar dengan type BERBEDA?
                $existingWithOtherType = DB::table('data_activity_user')
                    ->where('data_activity_id', $activityId)
                    ->where('user_id', $uid)
                    ->first();

                if ($existingWithOtherType) {
                    // TOLAK: user sudah terdaftar dengan tipe berbeda di activity yang sama
                    $errors[] = "{$user->name} sudah terdaftar sebagai {$existingWithOtherType->type} di kegiatan ini; tidak diperbolehkan menambahkan role {$typeMemberEvent}.";
                    continue;
                } else {
                    // 5️⃣ User belum terdaftar di activity ini → Attach
                    DB::table('data_activity_user')->insert([
                        'data_activity_id' => $activityId,
                        'user_id' => $uid,
                        'type' => $typeMemberEvent,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    $attached++;
                }
            }

            // 6️⃣ Jika ada error, rollback
            if (!empty($errors)) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Beberapa user gagal ditambahkan.',
                    'errors' => $errors
                ], 422);
            }

            DB::commit();

            // 7️⃣ Response sukses (dengan warnings jika ada)
            $response = [
                'status' => 'success',
                'message' => "Berhasil menambahkan {$attached} peserta ke kegiatan.",
            ];

            if (!empty($warnings)) {
                $response['warnings'] = $warnings;
            }

            return response()->json($response, 200);

        } catch (Throwable $e) {
            DB::rollBack();
            
            Log::error('Error in importByUserIds', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'activity_id' => $activityId,
                'user_ids' => $userIds
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan internal saat memproses request.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

}
