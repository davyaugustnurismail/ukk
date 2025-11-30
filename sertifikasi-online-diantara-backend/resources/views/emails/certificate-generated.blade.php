<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .note {
            font-size: 0.9em;
            color: #666;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h2>Sertifikat Anda Telah Diterbitkan</h2>
    
    <p>Halo {{ $recipientName }},</p>
    
    <p>Sertifikat Anda dengan nomor <strong>{{ $certificateNumber }}</strong> telah berhasil diterbitkan.</p>

    <p><a class="button" href="{{ url($downloadUrl) }}">Download Sertifikat</a></p>

    <div class="note">
        <p><strong>Catatan:</strong></p>
        <ul>
            @if($isNewUser)
            <li>Password akun anda adalah: " <em> password </em>"</li>
            @endif
            <li>Sertifikat juga terlampir dalam email ini</li>
            <li>Simpan email ini untuk referensi di masa mendatang</li>
        </ul>
    </div>
    <p>Terima kasih atas partisipasi Anda.</p>
</body>
</html>
