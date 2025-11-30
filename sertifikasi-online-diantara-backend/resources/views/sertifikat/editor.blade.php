<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Editor Sertifikat</title>
    <link href="{{ asset('css/all-fonts.css') }}" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
    /* Font face declarations for custom fonts */
    @font-face {
        font-family: 'Alice';
        src: url('/fonts/Alice/Alice-Regular.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
    }
    @font-face {
        font-family: 'Breathing';
        src: url('/fonts/breathing/Breathing Personal Use Only.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
    }
    @font-face {
        font-family: 'Brighter';
        src: url('/fonts/brighter/Brighter Regular.otf') format('opentype');
        font-weight: 400;
        font-style: normal;
    }
    @font-face {
        font-family: 'Brittany';
        src: url('/fonts/brittany_2/Brittany.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
    }
    /* Add more custom fonts */
    @font-face {
        font-family: 'Caitlin Angelica';
        src: url('/fonts/caitlin_angelica/Caitlin Angelica.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
    }
    @font-face {
        font-family: 'Cormorant Garamond';
        src: url('/fonts/Cormorant_Garamond/CormorantGaramond-Regular.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
    }
    @font-face {
        font-family: 'DM Sans';
        src: url('/fonts/DM_Sans/DMSans-Regular.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
    }
    /* ...and so on for other fonts... */
        :root {
            --primary-color: #3498db;
            --danger-color: #e74c3c;
            --success-color: #2ecc71;
            --warning-color: #f1c40f;
            --bg-color: #f5f6fa;
            --border-color: #dcdde1;
            --sidebar-width: 320px;
            --header-height: 60px;
            --preview-width: 842px;
            --preview-height: 595px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Montserrat', sans-serif;
            background-color: var(--bg-color);
            color: #333;
            line-height: 1.6;
            height: 100vh;
            overflow: hidden;
        }

        .container {
            display: grid;
            grid-template-columns: var(--sidebar-width) 1fr;
            grid-template-rows: var(--header-height) 1fr;
            height: 100vh;
            overflow: hidden;
        }

        .header {
            grid-column: 1 / -1;
            background: white;
            padding: 0 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-color);
        }

        .header h1 {
            font-size: 20px;
            color: #2d3436;
        }

        .sidebar {
            background: white;
            border-right: 1px solid var(--border-color);
            padding: 20px;
            height: calc(100vh - var(--header-height));
            overflow-y: auto;
        }

        .preview-area {
            height: calc(100vh - var(--header-height));
            background: #2d3436;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }

        .preview-toolbar {
            padding: 12px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
        }
        
        .preview-toolbar-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .preview-title {
            color: white;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .preview-size {
            color: rgba(255,255,255,0.5);
            font-size: 0.9em;
        }
        
        .preview-workspace {
            flex: 1;
            position: relative;
            overflow: auto;
            padding: 40px;
            display: grid;
            place-items: center;
        }
        
        .preview-grid {
            position: absolute;
            inset: 0;
            background-size: 20px 20px;
            background-image:
                linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px);
        }
        
        .preview-container {
            width: 842px;
            height: 595px;
            margin: 0 auto;
            background: white;
            position: relative;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            border-radius: 4px;
            overflow: hidden;
        }
        
        .button {
            padding: 8px;
            border: none;
            border-radius: 4px;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .button:hover {
            background: rgba(255,255,255,0.2) !important;
        }
        
        .preview-placeholder {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            background: rgba(255, 255, 255, 0.05);
            padding: 40px;
            border-radius: 12px;
            border: 2px dashed rgba(255, 255, 255, 0.1);
            width: 80%;
            max-width: 400px;
            transition: all 0.3s ease;
        }
        
        .preview-placeholder:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        .upload-icon {
            font-size: 48px;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 20px;
        }
        
        .upload-text {
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .upload-formats {
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
        }
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .preview-size {
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 12px;
        }

        .preview-workspace {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
            position: relative;
            overflow: hidden;
        }

        .preview-container {
            width: var(--preview-width);
            height: var(--preview-height);
            background: white;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            position: relative;
            overflow: hidden;
            border-radius: 4px;
            background-image: linear-gradient(45deg, #f1f1f1 25%, transparent 25%),
                            linear-gradient(-45deg, #f1f1f1 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #f1f1f1 75%),
                            linear-gradient(-45deg, transparent 75%, #f1f1f1 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            transition: transform 0.3s ease;
        }

        .preview-container::before {
            content: "";
            position: absolute;
            inset: 0;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
            pointer-events: none;
            z-index: 1;
        }

        .preview-grid {
            position: absolute;
            inset: 0;
            background-size: 20px 20px;
            background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            pointer-events: none;
        }

        .preview-container.has-bg {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #2d3436;
        }

        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 5px;
            font-size: 14px;
        }

        /* Style for font family select */
        #fontFamily option {
            padding: 8px;
            font-size: 14px;
            line-height: 1.5;
            min-height: 25px;
        }
        
        /* Apply the actual font to each option */
        #fontFamily option[value="Alice"] { font-family: 'Alice'; }
        #fontFamily option[value="Breathing"] { font-family: 'Breathing'; }
        #fontFamily option[value="Brighter"] { font-family: 'Brighter'; }
        #fontFamily option[value="Brittany"] { font-family: 'Brittany'; }
        #fontFamily option[value="Bryndan Write"] { font-family: 'Bryndan Write'; }
        #fontFamily option[value="Caitlin Angelica"] { font-family: 'Caitlin Angelica'; }
        #fontFamily option[value="Chau Philomene One"] { font-family: 'Chau Philomene One'; }
        #fontFamily option[value="Chewy"] { font-family: 'Chewy'; }
        #fontFamily option[value="Chunkfive"] { font-family: 'Chunkfive'; }
        #fontFamily option[value="Cormorant Garamond"] { font-family: 'Cormorant Garamond'; }
        #fontFamily option[value="DM Sans"] { font-family: 'DM Sans'; }
        #fontFamily option[value="DM Serif Display"] { font-family: 'DM Serif Display'; }
        #fontFamily option[value="Forum"] { font-family: 'Forum'; }
        #fontFamily option[value="Gentry Benedict"] { font-family: 'Gentry Benedict'; }
        #fontFamily option[value="Hammersmith One"] { font-family: 'Hammersmith One'; }
        #fontFamily option[value="Inria Serif"] { font-family: 'Inria Serif'; }
        #fontFamily option[value="Inter"] { font-family: 'Inter'; }
        #fontFamily option[value="League Gothic"] { font-family: 'League Gothic'; }
        #fontFamily option[value="Libre Baskerville"] { font-family: 'Libre Baskerville'; }
        #fontFamily option[value="Lora"] { font-family: 'Lora'; }
        #fontFamily option[value="Merriweather"] { font-family: 'Merriweather'; }
        #fontFamily option[value="More Sugar"] { font-family: 'More Sugar'; }
        #fontFamily option[value="Nunito"] { font-family: 'Nunito'; }
        #fontFamily option[value="Open Sans"] { font-family: 'Open Sans'; }
        #fontFamily option[value="Oswald"] { font-family: 'Oswald'; }
        #fontFamily option[value="Questrial"] { font-family: 'Questrial'; }
        #fontFamily option[value="Quicksand"] { font-family: 'Quicksand'; }
        #fontFamily option[value="Railey"] { font-family: 'Railey'; }
        #fontFamily option[value="Raleway"] { font-family: 'Raleway'; }
        #fontFamily option[value="Roboto"] { font-family: 'Roboto'; }
        #fontFamily option[value="Shrikhand"] { font-family: 'Shrikhand'; }
        #fontFamily option[value="Tenor Sans"] { font-family: 'Tenor Sans'; }
        #fontFamily option[value="Yeseva One"] { font-family: 'Yeseva One'; }
        #fontFamily option[value="Allura"] { font-family: 'Allura'; }
        #fontFamily option[value="Anonymous Pro"] { font-family: 'Anonymous Pro'; }
        #fontFamily option[value="Anton"] { font-family: 'Anton'; }
        #fontFamily option[value="Arapey"] { font-family: 'Arapey'; }
        #fontFamily option[value="Archivo Black"] { font-family: 'Archivo Black'; }
        #fontFamily option[value="Arimo"] { font-family: 'Arimo'; }
        #fontFamily option[value="Arial"] { font-family: Arial; }
        #fontFamily option[value="Barlow"] { font-family: 'Barlow'; }
        #fontFamily option[value="Bebas Neue"] { font-family: 'Bebas Neue'; }
        #fontFamily option[value="Belleza"] { font-family: 'Belleza'; }
        #fontFamily option[value="Bree Serif"] { font-family: 'Bree Serif'; }
        #fontFamily option[value="Great Vibes"] { font-family: 'Great Vibes'; }
        #fontFamily option[value="League Spartan"] { font-family: 'League Spartan'; }
        #fontFamily option[value="Montserrat"] { font-family: 'Montserrat'; }
        #fontFamily option[value="Playfair Display"] { font-family: 'Playfair Display'; }
        #fontFamily option[value="Poppins"] { font-family: 'Poppins'; }
        #fontFamily option[value="Times New Roman"] { font-family: "Times New Roman"; }
        #fontFamily option[value="Helvetica"] { font-family: Helvetica; }

        /* Style the select itself with the current font */
        #fontFamily {
            font-size: 14px;
            line-height: 1.5;
        }

        .form-group input[type="text"]:focus,
        .form-group input[type="number"]:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .file-input-wrapper {
            border: 2px dashed var(--border-color);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            background: #f8f9fa;
            transition: all 0.3s ease;
        }

        .file-input-wrapper:hover {
            border-color: var(--primary-color);
            background: white;
        }

        .element {
            position: absolute;
            cursor: move;
            user-select: none;
            display: inline-block;
            /* default transparent so text doesn't have white box */
            background: transparent;
            padding: 0;
            border-radius: 0;
            border: none;
            font-family: inherit;
            transition: box-shadow 0.2s ease;
            pointer-events: auto;
            touch-action: none;
            transform-origin: top left;
            box-sizing: border-box;
            min-width: 20px;
            min-height: 20px;
            z-index: 1;
            margin: 0;
            will-change: left, top;
        }
        
        .element:hover {
            background: rgba(255, 255, 255, 1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .element.selected {
            border: 2px solid var(--primary-color);
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        
        .element-content {
            display: inline-block;
            font-size: 14px;
            color: #2d3436;
            white-space: nowrap;
            background: transparent;
            padding: 0;
        }
        
        .element-qrcode {
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .element-qrcode svg {
            width: 100%;
            height: 100%;
            display: block;
        }
            min-width: 20px;
            min-height: 20px;
        }

        .element:hover {
            outline: 2px dashed var(--primary-color);
        }

        .element.selected {
            outline: 2px solid var(--primary-color);
        }

        .element[data-type="text"] {
            padding: 2px;
        }

        .element[data-type="image"] img {
            max-width: 100%;
            height: auto;
            display: block;
        }

        .element[data-type="qrcode"] {
            background: white;
            padding: 8px;
            border-radius: 4px;
        }

        .button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            background-color: var(--primary-color);
            color: white;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }

        .button:hover {
            opacity: 0.95;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .button.success {
            background-color: var(--success-color);
        }

        .button.danger {
            background-color: var(--danger-color);
        }

        .element-type-selector {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 8px;
        }

        .element-type-btn {
            flex: 1;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: white;
            color: #666;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        }

        .element-type-btn i {
            font-size: 20px;
        }

        .element-type-btn:hover {
            border-color: var(--primary-color);
            color: var(--primary-color);
            transform: translateY(-1px);
        }

        .element-type-btn.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .upload-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 20px;
            border: 2px dashed var(--border-color);
            border-radius: 8px;
            background: #f8f9fa;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
        }

        .upload-btn:hover {
            border-color: var(--primary-color);
            background: white;
        }

        .upload-btn i {
            font-size: 24px;
            color: var(--primary-color);
        }

        .upload-btn span {
            font-weight: 500;
        }

        .upload-btn small {
            color: #666;
        }

        .file-preview {
            margin-top: 12px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .file-details {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            font-size: 13px;
        }

        .file-size {
            color: #666;
        }

        .upload-progress {
            width: 100%;
            height: 4px;
            background-color: #f0f0f0;
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background-color: var(--primary-color);
            transition: width 0.3s ease;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .fa-spinner {
            animation: spin 1s linear infinite;
        }

        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .notification.success {
            background-color: var(--success-color);
        }

        .notification.error {
            background-color: var(--danger-color);
        }

        .highlight {
            border-color: var(--primary-color) !important;
            background-color: rgba(52, 152, 219, 0.1) !important;
        }

        .elements-list {
            margin-top: 20px;
            border-top: 1px solid var(--border-color);
            padding-top: 20px;
        }

        .element-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
            margin-bottom: 8px;
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            margin: 20px 0 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--primary-color);
            color: #2d3436;
        }

        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        }

        .notification.success {
            background-color: var(--success-color);
        }

        .notification.error {
            background-color: var(--danger-color);
        }

        .required-badge {
            background-color: var(--danger-color);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin-right: 8px;
            font-weight: 500;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>Editor Sertifikat</h1>
            <button class="button success" onclick="saveTemplate()">
                Simpan Template
            </button>
        </header>

        <div class="sidebar">
            <input type="hidden" id="merchantId" value="1">

            <div class="form-group">
                <label for="templateName">Nama Template</label>
                <input type="text" id="templateName" placeholder="Masukkan nama template">
            </div>

            <div class="form-group">
                <label for="backgroundFile">Background Sertifikat</label>
                <div class="file-input-wrapper">
                    <div class="file-input-container">
                        <input type="file" 
                               id="backgroundFile" 
                               name="background_image"
                               accept="image/jpeg,image/png,gif" 
                               onchange="handleFileSelect(event)" 
                               style="display: none;">
                        <label for="backgroundFile" class="upload-btn">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <span>Pilih File</span>
                            <small>atau drag & drop file di sini</small>
                        </label>
                    </div>
                    <div class="file-info" style="margin-top: 10px;">
                        <div class="file-preview">
                            <img id="backgroundPreview" style="display: none; max-width: 100%; border-radius: 4px; margin-top: 10px;">
                        </div>
                        <div class="file-details" style="margin-top: 8px;">
                            <span class="file-name">Belum ada file yang dipilih</span>
                            <span class="file-size"></span>
                        </div>
                        <button onclick="uploadBackground()" id="uploadButton" style="display: none; margin-top: 10px;" class="button success">
                            <i class="fas fa-upload"></i> Upload Background
                        </button>
                        <div class="upload-progress" style="display: none; margin-top: 10px;">
                            <div class="progress-bar" style="width: 0%;"></div>
                        </div>
                    </div>
                </div>
            </div>

                        <div class="section-title">Pengaturan Template</div>

            <div class="form-group">
                <label>Nama Peserta (Preview)</label>
                <input type="text" id="previewName" value="Nama Peserta" class="form-control">
            </div>

            <div class="form-group">
                <label>Nomor Sertifikat (Preview)</label>
                <input type="text" id="previewNumber" value="CERT-001" class="form-control">
            </div>

            <div class="form-group">
                <label>Tanggal (Preview)</label>
                <input type="text" id="previewDate" value="19 Agustus 2025" class="form-control">
            </div>

            <div class="form-group">
                <label>Nama Instruktur (Preview)</label>
                <input type="text" id="previewInstructor" value="Nama Instruktur" class="form-control">
            </div>

            <button onclick="updatePreview()" class="button">Update Preview</button>

            <div class="section-title">Tambah Elemen</div>

            <div class="element-type-selector">
                <button class="element-type-btn active" onclick="selectElementType(this, 'text')">
                    <i class="fas fa-font"></i>
                    <span>Teks</span>
                </button>
                <button class="element-type-btn" onclick="selectElementType(this, 'image')">
                    <i class="fas fa-image"></i>
                    <span>Gambar</span>
                </button>
                <button class="element-type-btn" onclick="selectElementType(this, 'qrcode')">
                    <i class="fas fa-qrcode"></i>
                    <span>QR Code</span>
                </button>
            </div>

            <input type="hidden" id="elementType" value="text">

            <div id="textOptions">
                <div class="form-group">
                    <label for="placeholderType">Tipe Placeholder</label>
                    <select id="placeholderType" onchange="updatePlaceholderText()">
                        <option value="custom">Teks Kustom</option>
                        <option value="nama">Nama Peserta ({NAMA})</option>
                        <option value="instruktur">Nama Instruktur ({INSTRUKTUR})</option>
                        <option value="nomor">Nomor Sertifikat ({NOMOR})</option>
                        <option value="tanggal">Tanggal ({TANGGAL})</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="elementText">Teks</label>
                    <input type="text" id="elementText" placeholder="Masukkan teks" readonly>
                </div>

                <div class="form-group">
                    <label for="fontSize">Ukuran Font (px)</label>
                    <input type="number" id="fontSize" value="16" min="8" max="72">
                </div>

                <div class="form-group">
                    <label for="fontFamily">Font</label>
                    <select id="fontFamily">
                        <option value="Alice">Alice</option>
                        <option value="Breathing">Breathing</option>
                        <option value="Brighter">Brighter</option>
                        <option value="Brittany">Brittany</option>
                        <option value="Bryndan Write">Bryndan Write</option>
                        <option value="Caitlin Angelica">Caitlin Angelica</option>
                        <option value="Chau Philomene One">Chau Philomene One</option>
                        <option value="Chewy">Chewy</option>
                        <option value="Chunkfive">Chunkfive</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                        <option value="DM Sans">DM Sans</option>
                        <option value="DM Serif Display">DM Serif Display</option>
                        <option value="Forum">Forum</option>
                        <option value="Gentry Benedict">Gentry Benedict</option>
                        <option value="Hammersmith One">Hammersmith One</option>
                        <option value="Inria Serif">Inria Serif</option>
                        <option value="Inter">Inter</option>
                        <option value="League Gothic">League Gothic</option>
                        <option value="Libre Baskerville">Libre Baskerville</option>
                        <option value="Lora">Lora</option>
                        <option value="Merriweather">Merriweather</option>
                        <option value="More Sugar">More Sugar</option>
                        <option value="Nunito">Nunito</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Oswald">Oswald</option>
                        <option value="Questrial">Questrial</option>
                        <option value="Quicksand">Quicksand</option>
                        <option value="Railey">Railey</option>
                        <option value="Raleway">Raleway</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Shrikhand">Shrikhand</option>
                        <option value="Tenor Sans">Tenor Sans</option>
                        <option value="Yeseva One">Yeseva One</option>
                        <option value="Allura">Allura</option>
                        <option value="Anonymous Pro">Anonymous Pro</option>
                        <option value="Anton">Anton</option>
                        <option value="Arapey">Arapey</option>
                        <option value="Archivo Black">Archivo Black</option>
                        <option value="Arimo">Arimo</option>
                        <option value="Arial">Arial</option>
                        <option value="Barlow">Barlow</option>
                        <option value="Bebas Neue">Bebas Neue</option>
                        <option value="Belleza">Belleza</option>
                        <option value="Bree Serif">Bree Serif</option>
                        <option value="Great Vibes">Great Vibes</option>
                        <option value="League Spartan">League Spartan</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Bebas Neue">Bebas Neue</option>
                        <option value="Belleza">Belleza</option>
                        <option value="Breathing">Breathing</option>
                        <option value="Brighter">Brighter</option>
                        <option value="Brittany">Brittany</option>
                        <option value="Bree Serif">Bree Serif</option>
                        <option value="Bryndan Write">Bryndan Write</option>
                        <option value="Caitlin Angelica">Caitlin Angelica</option>
                        <option value="Chau Philomene One">Chau Philomene One</option>
                        <option value="Chewy">Chewy</option>
                        <option value="Chunkfive">Chunkfive</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                        <option value="DM Sans">DM Sans</option>
                        <option value="DM Serif Display">DM Serif Display</option>
                        <option value="Forum">Forum</option>
                        <option value="Gentry Benedict">Gentry Benedict</option>
                        <option value="Great Vibes">Great Vibes</option>
                        <option value="Hammersmith One">Hammersmith One</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Inria Serif">Inria Serif</option>
                        <option value="Inter">Inter</option>
                        <option value="League Gothic">League Gothic</option>
                        <option value="League Spartan">League Spartan</option>
                        <option value="Libre Baskerville">Libre Baskerville</option>
                        <option value="Lora">Lora</option>
                        <option value="Merriweather">Merriweather</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="More Sugar">More Sugar</option>
                        <option value="Nunito">Nunito</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Oswald">Oswald</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Questrial">Questrial</option>
                        <option value="Quicksand">Quicksand</option>
                        <option value="Railey">Railey</option>
                        <option value="Raleway">Raleway</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Shrikhand">Shrikhand</option>
                        <option value="Tenor Sans">Tenor Sans</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Yeseva One">Yeseva One</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="fontWeight">Ketebalan Font</label>
                    <select id="fontWeight">
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="fontStyle">Gaya Font</label>
                    <select id="fontStyle">
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="textAlign">Perataan Teks</label>
                    <select id="textAlign">
                        <option value="left">Kiri</option>
                        <option value="center" selected>Tengah</option>
                        <option value="right">Kanan</option>
                    </select>
                </div>
            </div>

            <div id="imageOptions" style="display: none;">
                <div class="form-group">
                    <label for="imageFile">Upload Gambar</label>
                    <div class="file-input-wrapper">
                        <input type="file" 
                               id="imageFile" 
                               accept="image/jpeg,image/png,image/gif" 
                               onchange="handleImageSelect(event)">
                    </div>
                </div>

                <div class="form-group">
                    <label for="imageWidth">Lebar (px)</label>
                    <input type="number" id="imageWidth" value="100" min="10">
                </div>

                <div class="form-group">
                    <label for="imageHeight">Tinggi (px)</label>
                    <input type="number" id="imageHeight" value="100" min="10">
                </div>
            </div>

            <div id="qrcodeOptions" style="display: none;">
                <div class="form-group">
                    <label for="qrcodeSize">Ukuran QR Code (px)</label>
                    <input type="number" id="qrcodeSize" value="100" min="50" max="300" oninput="validateQRSize(this)">
                </div>
            </div>

            <button onclick="addElement()" class="button success">Tambah Elemen</button>

            <div class="elements-list">
                <h3>Daftar Elemen</h3>
                <div id="elementsList"></div>
            </div>
        </div>

        <div class="preview-area">
            <div class="preview-toolbar">
                <div class="preview-toolbar-left">
                    <div class="preview-title">
                        <i class="fas fa-eye"></i>
                        Preview Sertifikat
                    </div>
                    <div class="preview-size">A4 Landscape (842 × 595 px)</div>
                </div>
                <div class="preview-toolbar-right">
                    <button class="button" title="Download Preview" onclick="downloadPreview()" style="background: rgba(255,255,255,0.1)">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
            <div class="preview-workspace">
                <div class="preview-grid"></div>
                <div class="preview-container" id="certificate-preview">
                    <div id="preview-message" class="preview-placeholder">
                    <div class="upload-icon">
                        <i class="fas fa-file-image"></i>
                    </div>
                    <div class="upload-text">
                        Drag & drop background sertifikat disini
                    </div>
                    <div class="upload-formats">atau klik untuk memilih file (JPG, PNG, GIF)</div>
                </div>
                </div>
            </div>
        </div>
    </div>

    <script src="{{ asset('js/certificate-editor-new.js') }}"></script>
    <script src="{{ asset('js/dropzone.js') }}"></script>
    <script src="{{ asset('js/preview-handler.js') }}"></script>
    <script src="{{ asset('js/template-saver.js') }}"></script>
    <script src="{{ asset('js/placeholder-handler.js') }}"></script>
    <script src="{{ asset('js/template-preview.js') }}"></script>
    <script src="{{ asset('js/font-handler.js') }}"></script>
    <script src="{{ asset('js/custom-font-select.js') }}"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
    <script src="{{ asset('js/element-handler.js') }}"></script>
    <script src="{{ asset('js/drag-handler.js') }}"></script>
    <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>

    <script>
    function validateQRSize(input) {
        let value = parseInt(input.value);
        if (value < 50) input.value = 50;
        if (value > 300) input.value = 300;
    }
    </script>
</body>
</html>