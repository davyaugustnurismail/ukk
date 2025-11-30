<?php

namespace App\Http\Controllers\Sertifikat;

use App\Http\Controllers\Controller;
use App\Models\Sertifikat;
use App\Models\DataActivity;
use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\AutoEncoder;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class SertifikatTemplateController extends Controller
{

    

    /**
     * Return available weight variants for a font folder in public/fonts/{font}
     * Response: JSON array of objects: [{ key: "regular", file: "Font-Regular.ttf" }, ...]
     */
    public function fontWeights($font)
    {
        // Prevent path traversal and build folder path
        $fontFolder = basename(urldecode($font));
        $dir = public_path('fonts' . DIRECTORY_SEPARATOR . $fontFolder);

        if (!is_dir($dir)) {
            // return empty array (200) so client can fallback gracefully
            return response()->json([]);
        }

        $files = array_values(array_filter(scandir($dir), function ($f) use ($dir) {
            if ($f === '.' || $f === '..') return false;
            $full = $dir . DIRECTORY_SEPARATOR . $f;
            if (!is_file($full)) return false;
            return preg_match('/\.(ttf|otf|woff2?|woff)$/i', $f);
        }));

        // Map logical keys to tokens and css weight
        $mapping = [
            'regular'  => ['css' => '400', 'tokens' => ['regular', '-regular']],
            'medium'   => ['css' => '500', 'tokens' => ['medium', '-medium']],
            'semibold' => ['css' => '600', 'tokens' => ['semibold', 'semi-bold', 'semi_bold', '-semibold']],
            'bold'     => ['css' => '700', 'tokens' => ['bold', '-bold']]
        ];

        $found = [];

        foreach ($files as $file) {
            $low = strtolower($file);

            // skip italic files here; style/italic controlled by client
            if (strpos($low, 'italic') !== false) {
                continue;
            }

            foreach ($mapping as $key => $info) {
                foreach ($info['tokens'] as $token) {
                    if (strpos($low, $token) !== false) {
                        if (!isset($found[$key])) {
                            $found[$key] = [
                                'key' => $key,
                                'file' => $file,
                                'cssWeight' => $info['css'],
                                'label' => ucfirst(str_replace(['-', '_'], ' ', $key)),
                                'style' => 'normal'
                            ];
                        }
                    }
                }
            }

            // If no token matched, try numeric weight detection
            if (preg_match('/\b(100|200|300|400|500|600|700|800|900)\b/i', $low, $m)) {
                $num = intval($m[1]);
                $key = null;
                if ($num === 400) $key = 'regular';
                elseif ($num === 500) $key = 'medium';
                elseif ($num === 600) $key = 'semibold';
                elseif ($num === 700) $key = 'bold';
                if ($key && !isset($found[$key])) {
                    $found[$key] = [
                        'key' => $key,
                        'file' => $file,
                        'cssWeight' => (string)$num,
                        'label' => ucfirst(str_replace(['-', '_'], ' ', $key)),
                        'style' => 'normal'
                    ];
                }
            }
        }

        // Keep only allowed order
        $order = ['regular', 'medium', 'semibold', 'bold'];
        $result = [];
        foreach ($order as $k) {
            if (isset($found[$k])) $result[] = $found[$k];
        }

        // Fallback: if nothing found, use first available file as regular
        if (empty($result) && count($files) > 0) {
            $first = $files[0];
            $result[] = [
                'key' => 'regular',
                'file' => $first,
                'cssWeight' => '400',
                'label' => 'Regular',
                'style' => 'normal'
            ];
        }

        return response()->json($result);
    }

    /**
     * Lebar PDF dalam satuan points untuk A4 Landscape.
     * @var int
     */
    private $pdfWidth = 842;

    /**
     * Tinggi PDF dalam satuan points untuk A4 Landscape.
     * @var int
     */
    private $pdfHeight = 595;

    /**
     * Mengunggah dan memproses gambar (background atau element).
     */
    public function uploadImage(Request $request)
    {
        try {
            $inputName = null;
            if ($request->hasFile('background_image')) {
                $inputName = 'background_image';
            } elseif ($request->hasFile('element_image')) {
                $inputName = 'element_image';
            }

            if (!$inputName) {
                return response()->json(['status' => 'error', 'message' => 'No image file found.'], 400);
            }

            // allow optional attach_instruktur_signature and data_activity_id
            $rules = [
                $inputName => 'required|image|mimes:jpeg,png,jpg|max:10240',
                'attach_instruktur_signature' => 'sometimes|boolean',
                'data_activity_id' => 'sometimes|integer|exists:data_activity,id',
            ];
            $request->validate($rules);

            $file = $request->file($inputName);
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            // store element images in a separate folder
            if ($inputName === 'element_image') {
                $path = 'element-image/' . $filename;
            } else {
                // default (background_image) keep existing certificates/ folder
                $path = 'certificates/' . $filename;
            }

            $manager = new ImageManager(new Driver());
            $image = $manager->read($file->getRealPath())
                ->scaleDown(width: 2000)
                ->encode(new AutoEncoder(quality: 90));

            // Simpan gambar yang sudah diproses
            Storage::disk('public')->put($path, (string) $image);
            $url = Storage::url($path);

            Log::info('Image uploaded successfully', ['path' => $path, 'url' => $url]);

            $response = [
                'message' => 'Image uploaded successfully',
                'status' => 'success',
                'url' => $url
            ];

            // If frontend requested to attach instructor signature, fetch signature from the activity's instructor
            if ($request->boolean('attach_instruktur_signature') && $request->filled('data_activity_id')) {
                try {
                    $activity = DataActivity::with('instruktur')->find($request->input('data_activity_id'));
                    if ($activity && $activity->instruktur && !empty($activity->instruktur->signature) && Storage::disk('public')->exists($activity->instruktur->signature)) {
                        $response['instruktur_signature_url'] = Storage::url($activity->instruktur->signature);
                    } else {
                        $response['instruktur_signature_url'] = null;
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to fetch instructor signature for uploadImage', ['error' => $e->getMessage(), 'data_activity_id' => $request->input('data_activity_id')]);
                    $response['instruktur_signature_url'] = null;
                }
            }

            return response()->json($response);

        } catch (ValidationException $e) {
            Log::error('Image upload validation failed', ['errors' => $e->errors()]);
            return response()->json(['status' => 'error', 'message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error uploading image', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['status' => 'error', 'message' => 'Could not upload image: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Menampilkan semua template sertifikat.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if(!$user) {
            return response()->json([
                'message' => 'User not authorized',
                'error' => 'Unauthenticated'
            ]);
        }
        $templates = Sertifikat::all()
        ->where('merchant_id', $user->merchant_id);
        return response()->json(['status' => 'success', 'data' => $templates]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'background_image' => 'required|string',
                'elements' => 'required|array',
                'certificate_number_format' => 'nullable|string',
                'merchant_id' => 'required|exists:merchants,id'
            ]);

            $merchant = Merchant::find($request->merchant_id);
            if (!$merchant) {
                $merchant = Merchant::create([
                    'id' => $request->merchant_id,
                    'name' => 'Merchant ' . $request->merchant_id,
                ]);
            }

            $background_path = str_replace(Storage::url(''), '', $validated['background_image']);
            if (!Storage::disk('public')->exists($background_path)) {
                return response()->json(['status' => 'error', 'message' => 'Background image not found on storage.'], 404);
            }

            $template = new Sertifikat();
            $template->name = $validated['name'];
            $template->background_image = $background_path;

            $processedElements = array_map(function($element) {
                if ($element['type'] === 'image' && !empty($element['imageUrl'])) {
                    $element['imageUrl'] = str_replace(Storage::url(''), '', $element['imageUrl']);
                }
                return $element;
            }, $validated['elements']);

            $template->elements = $processedElements;
            
            $template->layout = [
                'width' => $this->pdfWidth,
                'height' => $this->pdfHeight,
                'orientation' => 'landscape'
            ];
            // merchant_id is a foreign key integer column; store the id directly
            $template->merchant_id = (int) $merchant->id;

            if (!$template->save()) {
                throw new \Exception('Failed to save template');
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Template created successfully',
                'data' => $template,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating template: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $template = Sertifikat::findOrFail($id);
            return response()->json(['status' => 'success', 'data' => $template]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Template not found'], 404);
        }
    }

    /**
     * Memperbarui template yang ada.
     */
    public function update(Request $request, $id)
    {
        try {
            $template = Sertifikat::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'background_image' => 'sometimes|required|string',
                'elements' => 'sometimes|required|array',
                'certificate_number_format' => 'sometimes|nullable|string',
                'merchant_id' => 'sometimes|required|exists:merchants,id'
            ]);

            if (isset($validated['background_image'])) {
                $validated['background_image'] = str_replace(Storage::url(''), '', $validated['background_image']);
            }
            if (isset($validated['elements'])) {
                // Do not apply PDF scaling when persisting template elements.
                // Keep the raw editor values (px-based) so subsequent edits are idempotent.
                $processedElements = array_map(function($element) {
                    if (is_array($element) && ($element['type'] ?? '') === 'image' && !empty($element['imageUrl'])) {
                        $element['imageUrl'] = str_replace(Storage::url(''), '', $element['imageUrl']);
                    }
                    return $element;
                }, $validated['elements']);

                $validated['elements'] = $processedElements;
            }

            // Validate certificate number format if provided
            if (isset($validated['certificate_number_format'])) {
                if (
                    $validated['certificate_number_format'] !== null &&
                    !preg_match('/X+/', $validated['certificate_number_format'])
                ) {
                    throw new \Exception('Format nomor sertifikat harus mengandung minimal satu X sebagai placeholder nomor');
                }
            }

            // Some deployments remove the `certificate_number_format` column from the
            // `sertifikats` table (migration may drop it). To avoid SQL errors when
            // updating the template, don't attempt to persist this field if it
            // exists in the validated payload but not in the model's table.
            if (array_key_exists('certificate_number_format', $validated)) {
                // keep validation behavior above, but remove the key so update() won't try to write it
                unset($validated['certificate_number_format']);
            }

            $template->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Template updated successfully',
                'data' => $template
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating template', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Failed to update template: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Menghapus template.
     */
    public function destroy($id)
    {
        try {
            $template = Sertifikat::findOrFail($id);
            Storage::disk('public')->delete($template->background_image);
            $template->delete();

            return response()->json(['status' => 'success', 'message' => 'Template deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Template not found'], 404);
        }
    }

    /**
     * Update shape in certificate template
     */
    public function updateShape(Request $request, $id, $shapeId)
    {
        try {
            $template = Sertifikat::findOrFail($id);

            $validated = $request->validate([
                'type' => [
                    \Illuminate\Validation\Rule::in([
                        'rectangle',
                        'circle',
                        'triangle',
                        'star',
                        'diamond',
                        'pentagon',
                        'hexagon',
                        'line',
                        'arrow',
                        'heart',
                        'cross'
                    ])
                ],
                'x' => 'numeric',
                'y' => 'numeric',
                'width' => 'numeric|min:1',
                'height' => 'numeric|min:1',
                'rotation' => 'numeric',
                'style' => 'array',
                'style.color' => 'string',
                'style.fillColor' => 'string',
                'style.strokeWidth' => 'numeric|min:0',
                'style.opacity' => 'numeric|min:0|max:1',
                'style.borderRadius' => 'numeric|min:0',
                'zIndex' => 'integer',
                'isVisible' => 'boolean'
            ]);

            $elements = $template->elements ?? [];
            $shapeFound = false;

            // Find and update the shape
            foreach ($elements as &$element) {
                if ($element['id'] === $shapeId && $element['type'] === 'shape') {
                    // Update only provided fields
                    foreach ($validated as $key => $value) {
                        if ($key === 'type') {
                            $element['shapeType'] = $value;
                        } elseif ($key === 'style' && is_array($value)) {
                            $element['style'] = array_merge($element['style'] ?? [], $value);
                        } else {
                            $element[$key] = $value;
                        }
                    }
                    $shapeFound = true;
                    break;
                }
            }

            if (!$shapeFound) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Shape not found'
                ], 404);
            }

            $template->elements = $elements;
            $template->save();

            Log::info('Shape updated successfully', ['shape_id' => $shapeId, 'template_id' => $id]);

            return response()->json([
                'status' => 'success',
                'message' => 'Shape updated successfully',
                'data' => $element
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating shape: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete shape from certificate template
     */
    public function deleteShape($id, $shapeId)
    {
        try {
            $template = Sertifikat::findOrFail($id);
            $elements = $template->elements ?? [];

            // Filter out the shape to delete
            $filteredElements = array_filter($elements, function ($element) use ($shapeId) {
                return !($element['id'] === $shapeId && $element['type'] === 'shape');
            });

            // Check if any element was removed
            if (count($filteredElements) === count($elements)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Shape not found'
                ], 404);
            }

            $template->elements = array_values($filteredElements); // Re-index array
            $template->save();

            Log::info('Shape deleted successfully', ['shape_id' => $shapeId, 'template_id' => $id]);

            return response()->json([
                'status' => 'success',
                'message' => 'Shape deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting shape: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all shapes from certificate template
     */
    public function getShapes($id)
    {
        try {
            $template = Sertifikat::findOrFail($id);
            $elements = $template->elements ?? [];

            // Filter only shape elements
            $shapes = array_filter($elements, function ($element) {
                return $element['type'] === 'shape';
            });

            // Sort by zIndex
            usort($shapes, function ($a, $b) {
                return ($a['zIndex'] ?? 0) <=> ($b['zIndex'] ?? 0);
            });

            return response()->json([
                'status' => 'success',
                'data' => array_values($shapes)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Template not found'
            ], 404);
        }
    }

    /**
     * Update shapes order (z-index)
     */
    public function updateShapesOrder(Request $request, $id)
    {
        try {
            $template = Sertifikat::findOrFail($id);

            $validated = $request->validate([
                'shapes' => 'required|array',
                'shapes.*.id' => 'required|string',
                'shapes.*.zIndex' => 'required|integer'
            ]);

            $elements = $template->elements ?? [];

            // Update z-index for shapes
            foreach ($validated['shapes'] as $shapeData) {
                foreach ($elements as &$element) {
                    if ($element['id'] === $shapeData['id'] && $element['type'] === 'shape') {
                        $element['zIndex'] = $shapeData['zIndex'];
                        break;
                    }
                }
            }

            $template->elements = $elements;
            $template->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Shapes order updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating shapes order: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    
}
