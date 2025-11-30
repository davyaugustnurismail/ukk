<?php

namespace App\Http\Controllers\Instruktur;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Instruktur;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class InstrukturManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if(!$user) {
            return response()->json([
                'message' => 'User not authenticated',
                'error' => 'Unauthorized'
            ], 401);
        }
        // Return full list so frontend handles search/sort/pagination
        $query = Instruktur::with(['merchant'])
            ->where('merchant_id', $user->merchant_id);

        $instrukturs = $query->get();

        // Parse perPage for metadata calculation
        $perPage = (int) $request->input('perPage', 10);
        if ($perPage <= 0) $perPage = 10;

        $total = $instrukturs->count();
        $totalPages = $perPage > 0 ? (int) ceil($total / $perPage) : 1;

        // Format response
        $result = $instrukturs->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'email' => $item->email,
                'role_id' => $item->role_id,
                'merchant_id' => $item->merchant_id,
                'merchant' => $item->merchant,
                // 'signature' => $item->signature ?? null,
                'signature_url' => !empty($item->signature) ? Storage::url($item->signature) : null,
                'has_signature' => !empty($item->signature),
                'phone_number' => $item->phone_number ?? null,
                'jenis_kelamin' => $item->jenis_kelamin ?? null,
                'asal_institusi' => $item->asal_institusi ?? null,
                'jabatan' => $item->jabatan ?? null,
            ];
        });

        return response()->json([
            'success' => true,
            'total' => $total,
            'total_pages' => $totalPages,
            'per_page' => $perPage,
            'message' => 'Data instructors fetched successfully.',
            'data' => $result,
        ]);
    }

    /**
     * Normalize phone number to 08 format
     * Converts +62xxx to 08xxx
     */
    private function normalizePhoneNumber($phone)
    {
        if (empty($phone)) {
            return null;
        }

        // Remove all spaces, dashes, and parentheses
        $phone = preg_replace('/[\s\-\(\)]/', '', $phone);

        // Convert +62 to 08
        if (strpos($phone, '+62') === 0) {
            $phone = '0' . substr($phone, 3);
        }
        // Convert 62 (without +) at the start to 08
        elseif (strpos($phone, '62') === 0 && strlen($phone) > 10) {
            $phone = '0' . substr($phone, 2);
        }

        return $phone;
    }

    /**
     * Attempt to parse a multipart/form-data PUT body for a single file field and store it.
     * Returns stored path on success or null.
     */
    private function parseMultipartPutForField($fieldName)
    {
        try {
            $raw = file_get_contents('php://input');
            if (empty($raw)) return null;

            // Try to extract boundary
            if (!preg_match('/boundary=(.*)$/', $_SERVER['CONTENT_TYPE'] ?? '', $matches)) {
                return null;
            }
            $boundary = trim($matches[1], '"');
            $parts = preg_split('/-+' . preg_quote($boundary, '/') . '/', $raw);
            foreach ($parts as $part) {
                if (stripos($part, "name=\"$fieldName\"") !== false) {
                    // extract filename
                    if (preg_match('/filename="(.*?)"/i', $part, $m)) {
                        $filename = $m[1];
                    } else {
                        $filename = uniqid($fieldName . '_');
                    }
                    // extract body after double CRLF
                    $seg = preg_split("/\r\n\r\n/", $part, 2);
                    if (count($seg) < 2) continue;
                    $body = $seg[1];
                    // strip trailing CRLF--
                    $body = preg_replace('/\r\n$/', '', $body);
                    // store file
                    $ext = pathinfo($filename, PATHINFO_EXTENSION) ?: 'bin';
                    $storeName = 'signatures/' . uniqid('sig_') . '.' . $ext;
                    Storage::disk('public')->put($storeName, $body);
                    return $storeName;
                }
            }
            return null;
        } catch (\Exception $e) {
            Log::error('Error parsing multipart PUT body', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Parse multipart/form-data PUT body and merge non-file fields into the request.
     * Stores files to disk and returns array with stored file paths keyed by field name.
     * This avoids relying on PHP to populate $_POST when PUT multipart isn't parsed.
     */
    private function parseMultipartPutAndMerge($request)
    {
        try {
            $raw = file_get_contents('php://input');
            if (empty($raw)) return [];

            if (!preg_match('/boundary=(.*)$/', $_SERVER['CONTENT_TYPE'] ?? '', $matches)) {
                return [];
            }
            $boundary = trim($matches[1], '"');
            $parts = preg_split('/-+' . preg_quote($boundary, '/') . '/', $raw);

            $fields = [];
            $storedFiles = [];

            foreach ($parts as $part) {
                $part = ltrim($part, "\r\n");
                if (empty(trim($part))) continue;

                $seg = preg_split("/\r\n\r\n/", $part, 2);
                if (count($seg) < 2) continue;
                $rawHeaders = $seg[0];
                $body = $seg[1];
                // strip trailing CRLF and possible ending --
                $body = preg_replace('/\r\n?--?$/', '', $body);

                if (!preg_match('/name="([^"]+)"/i', $rawHeaders, $m)) continue;
                $name = $m[1];

                // if this part is a file
                if (preg_match('/filename="(.*?)"/i', $rawHeaders, $m2)) {
                    $filename = $m2[1] ?: uniqid($name . '_');
                    $ext = pathinfo($filename, PATHINFO_EXTENSION) ?: 'bin';
                    $storeName = 'signatures/' . uniqid('sig_') . '.' . $ext;
                    // store raw body as file
                    Storage::disk('public')->put($storeName, $body);
                    // do not overwrite request input field (so validation image rules stay optional)
                    // expose parsed path under a reserved key
                    $storedFiles[$name] = $storeName;
                } else {
                    // treat as normal form field
                    // trim any trailing CRLF
                    $value = preg_replace('/\r\n$/', '', $body);
                    $fields[$name] = $value;
                }
            }

            if (!empty($fields)) {
                $request->merge($fields);
            }
            // merge parsed file paths under reserved keys like _parsed_{field}
            foreach ($storedFiles as $field => $path) {
                $request->merge(["_parsed_{$field}" => $path]);
            }

            return ['fields' => $fields, 'files' => $storedFiles];
        } catch (\Exception $e) {
            Log::error('Error parsing multipart PUT into request', ['error' => $e->getMessage()]);
            return [];
        }
    }

    public function show($id)
    {
        $instruktur = Instruktur::findOrFail($id);

        if (!$instruktur) {
            return response()->json(['message' => 'Instruktur not found'], 404);
        }

        return response()->json($instruktur, 200);
    }

    public function store(Request $request)
    {
        try {
            // Get merchant_id dari user yang sedang login so validation can scope uniqueness
            $merchant_id = auth('sanctum')->user()->merchant_id ?? 1;

            $request->validate([
                'name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'email',
                    Rule::unique('instrukturs', 'email')->where(function ($q) use ($merchant_id) {
                        return $q->where('merchant_id', $merchant_id);
                    }),
                ],
                'password' => 'required|string|min:6',
                'signature' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'asal_institusi' => 'required|string|max:255',
                'jabatan' => 'required|string|max:255',
                'phone_number' => 'sometimes|nullable|string|max:20|regex:/^[\+]?[0-9\s\-\(\)]+$/',
                'jenis_kelamin' => 'sometimes|nullable|in:Laki-laki,Perempuan',
            ], [
                'phone_number.regex' => 'Format nomor telepon tidak valid. Gunakan angka, +, spasi, atau tanda hubung.'
            ]);

            // Normalize phone number
            $phoneNumber = $this->normalizePhoneNumber($request->phone_number);

            $data = [
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => '2',
                'merchant_id' => $merchant_id,
                'asal_institusi' => $request->asal_institusi,
                'jabatan' => $request->jabatan,
                'phone_number' => $phoneNumber,
                'jenis_kelamin' => $request->jenis_kelamin,
            ];

            // handle optional signature file
            if ($request->hasFile('signature')) {
                $path = $request->file('signature')->store('signatures', 'public');
                $data['signature'] = $path;
            } elseif ($request->filled('signature')) {
                $data['signature'] = $request->signature;
            }

            $instruktur = Instruktur::create($data);

            return response()->json($instruktur, 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while creating the instructor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $instruktur = Instruktur::findOrFail($id);
            // If request is PUT and multipart but PHP didn't parse files, try to parse signature from raw input
            $putParsedSignaturePath = null;
            $contentType = $request->header('Content-Type') ?? '';
            // If incoming is PUT multipart, parse body into request (fields + files)
            if (strtoupper($request->method()) === 'PUT' && strpos($contentType, 'multipart/form-data') !== false) {
                $parsed = $this->parseMultipartPutAndMerge($request);
                $putParsedSignaturePath = $parsed['files']['signature'] ?? ($parsed['files']['_signature'] ?? null) ?? null;
                // also support legacy single-field parser
                if (!$putParsedSignaturePath) {
                    $putParsedSignaturePath = $this->parseMultipartPutForField('signature');
                    if ($putParsedSignaturePath) {
                        $request->merge(['_parsed_signature_path' => $putParsedSignaturePath]);
                    }
                }
            }
            // Debug info to help diagnose file upload issues with PUT
            Log::info('Instruktur update request', [
                'method' => $request->method(),
                'content_type' => $request->header('Content-Type'),
                'hasFile_signature' => $request->hasFile('signature'),
                'file_keys' => array_keys($request->files->all())
            ]);

            $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => [
                    'sometimes',
                    'required',
                    'email',
                    Rule::unique('instrukturs', 'email')->where(function ($q) use ($instruktur) {
                        return $q->where('merchant_id', $instruktur->merchant_id);
                    })->ignore($instruktur->id),
                ],
                'signature' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'asal_institusi' => 'sometimes|required|string|max:255',
                'jabatan' => 'sometimes|required|string|max:255',
                'phone_number' => 'sometimes|nullable|string|max:20|regex:/^[\+]?[0-9\s\-\(\)]+$/',
                'jenis_kelamin' => 'sometimes|nullable|in:Laki-laki,Perempuan',
            ], [
                'phone_number.regex' => 'Format nomor telepon tidak valid. Gunakan angka, +, spasi, atau tanda hubung.'
            ]);

            // Siapkan data yang akan diupdate
            $data = [];
            
            // Handle basic fields
            if ($request->has('name')) {
                $data['name'] = $request->input('name');
            }
            if ($request->has('email')) {
                $data['email'] = $request->input('email');
            }
            if ($request->has('asal_institusi')) {
                $data['asal_institusi'] = $request->input('asal_institusi');
            }
            if ($request->has('jabatan')) {
                $data['jabatan'] = $request->input('jabatan');
            }

            // Handle phone_number (including null values)
            if ($request->exists('phone_number')) {
                $phoneValue = $request->input('phone_number');
                $data['phone_number'] = $phoneValue !== null ? $this->normalizePhoneNumber($phoneValue) : null;
            }

            // Handle jenis_kelamin (including null values)
            if ($request->exists('jenis_kelamin')) {
                $jenisKelaminValue = $request->input('jenis_kelamin');
                $data['jenis_kelamin'] = $jenisKelaminValue !== '' ? $jenisKelaminValue : null;
            }

            // Handle password if provided
            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            // Debug log untuk melihat data yang akan diupdate
            Log::info('Data yang akan diupdate:', [
                'request_all' => $request->all(),
                'prepared_data' => $data
            ]);

            // handle signature upload
            $signatureAction = null; // 'added' or 'replaced' or 'removed' or null
            
            // Check if signature should be removed (explicit null or empty string)
            if ($request->has('signature') && ($request->input('signature') === null || $request->input('signature') === '')) {
                if (!empty($instruktur->signature) && Storage::disk('public')->exists($instruktur->signature)) {
                    Storage::disk('public')->delete($instruktur->signature);
                    $signatureAction = 'removed';
                }
                $data['signature'] = null;
            }
            // Handle file upload
            elseif ($request->hasFile('signature')) {
                $existing = !empty($instruktur->signature) && Storage::disk('public')->exists($instruktur->signature);
                if ($existing) {
                    // replace: delete old
                    Storage::disk('public')->delete($instruktur->signature);
                    $signatureAction = 'replaced';
                } else {
                    $signatureAction = 'added';
                }
                $path = $request->file('signature')->store('signatures', 'public');
                $data['signature'] = $path;
            } 
            // Handle signature string/data URI
            elseif ($request->filled('signature')) {
                $sig = $request->input('signature');
                // If signature is a data URI (base64), decode and store
                if (strpos($sig, 'data:image') === 0) {
                    try {
                        // parse data uri
                        preg_match('/^data:image\/(\w+);base64,/', $sig, $matches);
                        $ext = $matches[1] ?? 'png';
                        $base64 = preg_replace('#^data:image/\w+;base64,#i', '', $sig);
                        $decoded = base64_decode($base64);
                        if ($decoded === false) throw new \Exception('Base64 decode failed');
                        $filename = 'signatures/' . uniqid('sig_') . '.' . $ext;
                        Storage::disk('public')->put($filename, $decoded);

                        // delete old
                        $existing = !empty($instruktur->signature) && Storage::disk('public')->exists($instruktur->signature);
                        if ($existing) {
                            Storage::disk('public')->delete($instruktur->signature);
                            $signatureAction = 'replaced';
                        } else {
                            $signatureAction = 'added';
                        }

                        $data['signature'] = $filename;
                    } catch (\Exception $e) {
                        Log::error('Failed to save signature data URI', ['error' => $e->getMessage()]);
                    }
                } else {
                    // treat as path or url string
                    $data['signature'] = $sig;
                }
            }

            // if we parsed a signature from PUT raw body, use it
            // Note: we also merged this path into the request earlier as '_parsed_signature_path'
            $parsedPath = $putParsedSignaturePath ?: ($request->input('_parsed_signature_path') ?? null);
            if (!$request->hasFile('signature') && $parsedPath && !isset($data['signature'])) {
                $existing = !empty($instruktur->signature) && Storage::disk('public')->exists($instruktur->signature);
                $signatureAction = $existing ? 'replaced' : 'added';
                // delete old only if replacing
                if ($existing) {
                    Storage::disk('public')->delete($instruktur->signature);
                }
                $data['signature'] = $parsedPath;
            }

            $instruktur->update($data);

            $response = $instruktur->toArray();
            if ($signatureAction) $response['signature_action'] = $signatureAction;
            
            // Add signature URL to response if signature exists
            if (!empty($instruktur->signature)) {
                $response['signature_url'] = Storage::url($instruktur->signature);
            }

            return response()->json($response, 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while updating the instructor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $instruktur = Instruktur::findOrFail($id);

        if (!$instruktur) {
            return response()->json(['message' => 'Instruktur not found'], 404);
        }

        $instruktur->delete();

        return response()->json(['message' => 'Instruktur deleted successfully'], 200);
    }
}