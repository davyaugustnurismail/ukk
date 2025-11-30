<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sertifikat</title>
  <link href="{{ asset('css/all-fonts.css') }}" rel="stylesheet">
  <style>
    @php
      // Ukuran halaman (pt)
      $pageWidth  = $layout['width']  ?? 842;
      $pageHeight = $layout['height'] ?? 595;

      // --- Helper: normalisasi path storage ke data URI ---
      $toDataUri = function (?string $path) {
          if (!$path) return null;
          if (strpos($path, 'data:image') === 0) return $path; // sudah data URI
          // Hilangkan prefix /storage, storage/, public/storage
          $p = preg_replace('~^(?:/)?(?:public/)?(?:storage/)~i', '', $path);
          $full = storage_path('app/public/'.ltrim($p,'/'));
          if (!file_exists($full)) return null;
          $ext = strtolower(pathinfo($full, PATHINFO_EXTENSION) ?: 'png');
          $b64 = base64_encode(@file_get_contents($full));
          return "data:image/{$ext};base64,{$b64}";
      };

      // --- Helper: normalisasi font family dari payload aneh (mis. "sans-serif/Arial-Regular.ttf") ---
      $normalizeFontFamily = function ($fontFamilyRaw) {
          if (!$fontFamilyRaw) return 'Arial';

          // If the value already matches a common font family name, return it
          $knownStatic = [
            'Arial','Helvetica','Times New Roman','Inter','Poppins','Roboto','Montserrat','Nunito',
            'Open Sans','Oswald','Lora','Merriweather','Quicksand','Raleway','DM Sans','Barlow',
            'Cormorant Garamond','Playfair Display','Poppins','Arimo','League Spartan'
          ];
          if (in_array($fontFamilyRaw, $knownStatic, true)) return $fontFamilyRaw;

          // Try to infer family from a path or filename like "sans-serif/Arial-Regular.ttf"
          $basename = basename((string)$fontFamilyRaw);
          $noExt    = preg_replace('/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/', '', $basename);
          $parts = preg_split('/[-_]/', $noExt);
          $candidate = $parts[0] ?: null;

          // Dynamically build a map of available font folders in public/fonts
          $fontsBase = public_path('fonts');
          $available = [];
          try {
              if (is_dir($fontsBase)) {
                  foreach (scandir($fontsBase) as $entry) {
                      if ($entry === '.' || $entry === '..') continue;
                      // if folder: use name as family (e.g. "Montserrat")
                      $familyName = $entry;
                      // humanize folder name (replace underscores/dashes)
                      $familyName = str_replace(['_', '-'], ' ', $familyName);
                      // Upper-case words
                      $familyName = implode(' ', array_map('ucfirst', explode(' ', $familyName)));
                      $available[strtolower($familyName)] = $familyName;

                      // Also try to detect fonts by file basenames inside folder
                      $sub = $fontsBase . DIRECTORY_SEPARATOR . $entry;
                      if (is_dir($sub)) {
                          foreach (scandir($sub) as $f) {
                              if (preg_match('/\.(ttf|otf|woff2?)$/i', $f)) {
                                  $b = preg_replace('/\.(ttf|otf|woff2?)$/i', '', $f);
                                  // Clean common tokens used in your font filenames like _120pt, _24pt, _SemiCondensed
                                  $clean = preg_replace('/_(?:\d+pt|SemiCondensed|Semi-Condensed)$/i', '', $b);
                                  $bParts = preg_split('/[-_]/', $clean);
                                  $nameGuess = $bParts[0] ?: null;
                                  if ($nameGuess) {
                                      $available[strtolower($nameGuess)] = $familyName;
                                      // also map the cleaned full name (with spaces) -> family, e.g. "merriweather semi condensed"
                                      $available[strtolower(str_replace(['_','-'], ' ', $clean))] = $familyName;
                                  }
                              }
                          }
                      }
                  }
              }
          } catch (\Throwable $e) {
              // ignore scanning errors and fall back to static list
          }

          if ($candidate) {
              $key = strtolower($candidate);
              if (isset($available[$key])) return $available[$key];
              // Try trimmed candidate with ucfirst words
              $candidateHuman = implode(' ', array_map('ucfirst', explode(' ', str_replace(['_','-'], ' ', $candidate))));
              if (in_array($candidateHuman, $knownStatic, true)) return $candidateHuman;
              if (isset($available[strtolower($candidateHuman)])) return $available[strtolower($candidateHuman)];
          }

          // last resort: try a loose match against available fonts
          if (!empty($available)) {
              foreach ($available as $k => $v) {
                  if (stripos($v, (string)$fontFamilyRaw) !== false || stripos($k, (string)$fontFamilyRaw) !== false) {
                      return $v;
                  }
              }
          }

          // fallback
          return 'Arial';
      };

      // --- Helper: normalisasi weight/style dari payload ---
      $normalizeWeight = function ($w) {
          // Bisa "normal" | "Regular" | 400 | "700" | "Bold" dst.
          $map = [
            'thin'=>100,'extralight'=>200,'ultralight'=>200,'light'=>300,'regular'=>400,'normal'=>400,
            'medium'=>500,'semibold'=>600,'demibold'=>600,'bold'=>700,'extrabold'=>800,'black'=>900,'heavy'=>900
          ];
          if (is_numeric($w)) return (int)$w;
          $k = strtolower((string)$w);
          return $map[$k] ?? 400;
      };
      $normalizeStyle = fn($s) => strtolower((string)$s) === 'italic' ? 'italic' : 'normal';

      // --- Data utama dari controller (fallback) ---
      $bgImage = $background_image
        ?? ($data['background_image'] ?? null)
        ?? ($template['background_image'] ?? null);

      // Pastikan elements array
      $els = [];
      if (isset($elements) && is_array($elements))       $els = $elements;
      elseif (isset($data['elements']) && is_array($data['elements'])) $els = $data['elements'];
      elseif (isset($template['elements']) && is_array($template['elements'])) $els = $template['elements'];
    @endphp

    @page { margin:0; padding:0; size:{{ $pageWidth }}pt {{ $pageHeight }}pt; }
    body { margin:0; padding:0; width:{{ $pageWidth }}pt; height:{{ $pageHeight }}pt; position:relative; font-family:Arial, sans-serif; }
    .certificate-container { position:relative; width:100%; height:100%; overflow:hidden; }
    .background { position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; }
    .element { position:absolute; z-index:2; line-height:1.2; }
    /* Text elements should not wrap; keep them on a single line and preserve absolute position */
    .element-text {
      white-space: nowrap;
      overflow: visible;
      text-overflow: clip;
      display: inline-block;
    }
  .element-image img, .element-qrcode img { width:100%; height:100%; object-fit:contain; display:block; }
  /* Signature images: preserve original aspect ratio and center in box to avoid "gepeng" (stretched) look */
  .element-signature { display:flex; align-items:center; justify-content:center; }
  .element-signature img { max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; display:block; }
  </style>
  @if(!empty($fontCss))
            <style type="text/css">
            {!! $fontCss !!}
            </style>
          @endif
</head>
<body>
  <div class="certificate-container">
    {{-- Background --}}
    @php
      $bgSrc = null;
      if ($bgImage) {
          // Terima "certificates/xxx.png" atau "/storage/certificates/xxx.png"
          $bgSrc = $toDataUri($bgImage);
          if (!$bgSrc && file_exists($bgImage)) {
              // Jika controller sudah kasih absolute path
              $ext = strtolower(pathinfo($bgImage, PATHINFO_EXTENSION) ?: 'png');
              $bgSrc = 'data:image/'.$ext.';base64,'.base64_encode(file_get_contents($bgImage));
          }
      }
    @endphp
    @if($bgSrc)
      <img src="{{ $bgSrc }}" class="background" alt="background">
    @endif

    {{-- Elements --}}
    @foreach($els as $element)
      @php
        // Koordinat & ukuran (anggap pt)
        $x = (float)($element['x'] ?? 0);
        $y = (float)($element['y'] ?? 0);
        $w = isset($element['width'])  ? (float)$element['width']  : null;
        $h = isset($element['height']) ? (float)$element['height'] : null;

        // Rotasi & skala (dukung "rotation" & "rotate", "scale" & "scaleX/scaleY")
        $rotate = isset($element['rotate'])   ? (float)$element['rotate']   : ((float)($element['rotation'] ?? 0));
        $scaleX = isset($element['scaleX'])   ? (float)$element['scaleX']   : (isset($element['scale']) ? (float)$element['scale'] : 1);
        $scaleY = isset($element['scaleY'])   ? (float)$element['scaleY']   : (isset($element['scale']) ? (float)$element['scale'] : 1);

        $transformParts = [];
        if ($rotate !== 0) $transformParts[] = "rotate({$rotate}deg)";
        if ($scaleX !== 1 || $scaleY !== 1) $transformParts[] = "scale({$scaleX}, {$scaleY})";
        $transformCss = count($transformParts) ? 'transform:'.implode(' ', $transformParts).';' : '';

        $type = $element['type'] ?? 'text';
      @endphp

      {{-- TEXT --}}
      @if($type === 'text')
        @php
          $font = $element['font'] ?? [];
          // Family bisa datang dari banyak bentuk
          $fontFamily = $element['fontFamily']
                        ?? ($font['family'] ?? null)
                        ?? ($element['font']['fontFamily'] ?? null);
          $fontFamily = $normalizeFontFamily($fontFamily);

          $fontWeight = $normalizeWeight($element['fontWeight'] ?? ($font['weight'] ?? '400'));
          $fontStyle  = $normalizeStyle($element['fontStyle']  ?? ($font['style']  ?? 'normal'));
          $fontSize   = (float)($element['fontSize'] ?? 16);
          
          $color      = $element['color'] ?? '#000000';
          $text       = (string)($element['text'] ?? '');
          $textAlign  = $element['textAlign'] ?? 'left';
          $widthPt    = $w ? "{$w}pt" : 'auto';

          // Right align butuh perhitungan right offset biar posisi fix
          if ($textAlign === 'right' && $w) {
              $style = "position:absolute; right:" . ($pageWidth - $x - $w) . "pt; top:{$y}pt; width:{$widthPt}; "
                     . "font-family:'{$fontFamily}', Arial, sans-serif; font-size:{$fontSize}pt; font-weight:{$fontWeight}; font-style:{$fontStyle}; color:{$color}; text-align:{$textAlign}; {$transformCss}";
          } else if ($textAlign === 'center' && $w) {
              // center: gunakan left + width, tapi text-align center
              $style = "position:absolute; left:{$x}pt; top:{$y}pt; width:{$widthPt}; "
                     . "font-family:'{$fontFamily}', Arial, sans-serif; font-size:{$fontSize}pt; font-weight:{$fontWeight}; font-style:{$fontStyle}; color:{$color}; text-align:center; {$transformCss}";
          } else {
              $style = "position:absolute; left:{$x}pt; top:{$y}pt; width:{$widthPt}; "
                     . "font-family:'{$fontFamily}', Arial, sans-serif; font-size:{$fontSize}pt; font-weight:{$fontWeight}; font-style:{$fontStyle}; color:{$color}; text-align:{$textAlign}; {$transformCss}";
          }
        @endphp
  @php
    // fallback replacements in template: allow direct use of some controller-provided variables
    $renderText = $text ?? '';
    if (!empty($role_caption)) $renderText = strtr($renderText, ['{ROLE_CAPTION}' => $role_caption]);
  @endphp
  <div class="element element-text" style="{!! $style !!}">{!! e($renderText) !!}</div>

      {{-- IMAGE / QRCODE --}}
      @elseif($type === 'image' || $type === 'qrcode')
        @php
          $src = null;
          if ($type === 'image') {
              $imgPath = $element['image_path'] ?? $element['imageUrl'] ?? $element['src'] ?? null;
              $src = $toDataUri($imgPath);
          } else {
              // QR: harapkan controller sudah inject data URI di $element['qrcode']
              $src = $element['qrcode'] ?? null;
          }
          $box = "left:{$x}pt; top:{$y}pt;".($w ? " width:{$w}pt;" : "").($h ? " height:{$h}pt;" : "")." {$transformCss}";
        @endphp
        @if($src)
          <div class="element element-{{$type}}" style="position:absolute; {!! $box !!}">
            <img src="{{ $src }}" alt="{{$type}}">
          </div>
        @endif

      {{-- SIGNATURE --}}
      @elseif($type === 'signature')
        @php
          $sigPath = $element['imageUrl'] ?? $element['src'] ?? $element['value'] ?? $element['signature'] ?? null;
          $sigSrc  = $toDataUri($sigPath) ?? (strpos((string)$sigPath,'http')===0 ? $sigPath : null);
          $box = "left:{$x}pt; top:{$y}pt;".($w ? " width:{$w}pt;" : "").($h ? " height:{$h}pt;" : "")." {$transformCss}";
        @endphp
        @if($sigSrc)
          <div class="element element-signature" style="position:absolute; {!! $box !!}">
            <img src="{{ $sigSrc }}" alt="signature">
          </div>
        @endif

      {{-- SHAPE --}}
      {{-- SHAPE --}}
@elseif($type === 'shape')
  @php
    $shapeType   = strtolower($element['shapeType'] ?? 'rectangle');
    $styleArr    = $element['style'] ?? [];
    $fillColor   = $element['fillColor']   ?? ($styleArr['fillColor']   ?? '#000000');
    $strokeColor = $element['strokeColor'] ?? ($styleArr['strokeColor'] ?? '#000000');
    $strokeWidth = isset($element['strokeWidth']) ? (float)$element['strokeWidth'] : 1;
    $opacity     = isset($element['opacity']) ? (float)$element['opacity'] : 1;
    $borderRadius= $element['borderRadius'] ?? ($styleArr['borderRadius'] ?? 0);
    $svgW        = $w ?: 100;
    $svgH        = $h ?: 100;
  @endphp


  @if($shapeType === 'rectangle')
    <div class="element element-shape"
         style="left:{{$x}}pt; top:{{$y}}pt; width:{{$svgW}}pt; height:{{$svgH}}pt;
                background:{{$fillColor}};
                border:{{$strokeWidth}}pt solid {{$strokeColor}};
                border-radius:{{$borderRadius}}pt;
                opacity:{{$opacity}};
                {{$transformCss}}">
    </div>

  @elseif($shapeType === 'circle')
    <div class="element element-shape" style="left:{{$x}}pt; top:{{$y}}pt; width:{{$svgW}}pt; height:{{$svgH}}pt; {{$transformCss}}">
      <div style="width:100%; height:100%; border-radius:50%; background:{{ $fillColor }}; border:{{$strokeWidth}}pt solid {{$strokeColor}}; opacity:{{$opacity}};"></div>
    </div>

  @elseif($shapeType === 'line')
    <div class="element element-shape"
         style="left:{{$x}}pt; top:{{ $y + ($svgH/2) - ($strokeWidth/2) }}pt;
                width:{{$svgW}}pt; height:{{$strokeWidth}}pt;
                background:{{$strokeColor}};
                opacity:{{$opacity}};
                {{$transformCss}}">
    </div>

  @else
    @php
      // Render shapes using DIV/CSS instead of SVG for better renderer consistency
      $minSide = min($svgW, $svgH);
      $centerOffsetLeft = ($svgW - $minSide) / 2;
      $centerOffsetTop  = ($svgH - $minSide) / 2;
      // helper for rgba opacity handling if needed
      $fill = $fillColor === 'transparent' ? 'transparent' : $fillColor;
    @endphp


    @if($shapeType === 'triangle')
      {{-- CSS triangle, pointing up, full width/height --}}
      <div class="element element-shape" style="left:{{$x}}pt; top:{{$y}}pt; width:{{$svgW}}pt; height:{{$svgH}}pt; {{$transformCss}};">
        <div style="width:0; height:0; margin:0 auto;
                    border-left:{{ $svgW/2 }}pt solid transparent;
                    border-right:{{ $svgW/2 }}pt solid transparent;
                    border-bottom:{{ $svgH }}pt solid {{ $fill }};
                    opacity:{{$opacity}};"></div>
      </div>


    @elseif($shapeType === 'diamond')
      {{-- Diamond as a rotated square, centered --}}
      <div class="element element-shape" style="left:{{$x}}pt; top:{{$y}}pt; width:{{$svgW}}pt; height:{{$svgH}}pt; display:flex; align-items:center; justify-content:center; {{$transformCss}};">
        <div style="width:{{ $minSide }}pt; height:{{ $minSide }}pt; background:{{ $fill }}; transform:rotate(45deg); border:{{$strokeWidth}}pt solid {{ $strokeColor }}; opacity:{{$opacity}};"></div>
      </div>


    @elseif($shapeType === 'star')
      {{-- Render star using a Unicode glyph sized to the element dimensions and centered like frontend preview. --}}
      @php
        // Use the smaller side to size the glyph, apply a small inset so glyph doesn't touch edges
        $minSide = min($svgW, $svgH);
        $glyphSize = (int) max(1, floor($minSide * 0.9));
      @endphp
      <div class="element element-shape"
           style="left:{{$x}}pt; top:{{$y}}pt; width:{{$svgW}}pt; height:{{$svgH}}pt; display:flex; align-items:center; justify-content:center; padding:0; {{$transformCss}}; opacity:{{$opacity}};">
        <span style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:{{$fill}}; font-family:'Segoe UI','DejaVu Sans','Arial Unicode MS','Segoe UI Symbol','Arial',sans-serif; font-size:{{$glyphSize}}pt; line-height:{{$glyphSize}}pt;">&#9733;</span>
      </div>

    @elseif($shapeType === 'arrow')
      {{-- Left-pointing arrow with corrected proportions --}}
      @php
        $shaftW = max(1, (int)($svgW * 0.7));
        $headW  = $svgW - $shaftW;
        $shaftH = max(1, (int)($svgH * 0.4));
        $shaftTop = ($svgH - $shaftH) / 2;
      @endphp
      <div class="element element-shape" style="left:{{$x}}pt; top:{{$y}}pt; width:{{$svgW}}pt; height:{{$svgH}}pt; position:relative; {{$transformCss}};">
        <div style="position:absolute; left:{{$headW}}pt; top:{{$shaftTop}}pt; width:{{$shaftW}}pt; height:{{$shaftH}}pt; background:{{ $fill }}; opacity:{{$opacity}};"></div>
        <div style="position:absolute; left:0; top:0; width:0; height:0;
                    border-top:{{ $svgH/2 }}pt solid transparent; border-bottom:{{ $svgH/2 }}pt solid transparent; border-right:{{$headW}}pt solid {{ $fill }}; opacity:{{$opacity}};"></div>
      </div>

    @else
      {{-- Default polygon fallback -> square/rectangle look using div (covers unexpected types) --}}
      <div class="element element-shape"
           style="left:{{$x}}pt; top:{{$y}}pt; width:{{$svgW}}pt; height:{{$svgH}}pt;
                  background-color:{{$fill}};
                  border:{{$strokeWidth}}pt solid {{$strokeColor}};
                  border-radius:{{$borderRadius}}pt;
                  opacity:{{$opacity}};
                  {{$transformCss}}">
      </div>
    @endif
  @endif
@endif

    @endforeach
  </div>
</body>
</html>
