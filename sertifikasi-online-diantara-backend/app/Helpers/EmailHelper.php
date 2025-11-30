<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailHelper
{
    public static function sendCertificateEmail($recipientEmail, $recipientName, $certificateNumber, $downloadUrl, $pdfContent)
    {
        try {
            $mail = new PHPMailer(true);

            // Server settings without SMTP
            $mail->isMail();                    // Use PHP mail() function
            $mail->isHTML(true);
            $mail->CharSet = 'UTF-8';

            // Recipients
            $mail->setFrom(config('mail.from.address'), config('mail.from.name'));
            $mail->addAddress($recipientEmail, $recipientName);

            // Content
            $mail->Subject = 'Sertifikat Anda Telah Diterbitkan';
            
            // Email body
            $body = '
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Selamat ' . htmlspecialchars($recipientName) . '!</h2>
                <p>Sertifikat Anda telah berhasil diterbitkan dengan detail sebagai berikut:</p>
                <ul>
                    <li>Nomor Sertifikat: ' . htmlspecialchars($certificateNumber) . '</li>
                    <li>Tanggal Terbit: ' . date('d F Y') . '</li>
                </ul>
                <p style="color: #666; font-size: 12px;">Tautan ini akan kadaluarsa dalam 30 hari.</p>
                <hr>
                <p style="color: #888; font-size: 12px;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            </div>';

            $mail->Body = $body;
            $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $body));

            // Attach PDF
            $mail->addStringAttachment($pdfContent, "sertifikat_{$certificateNumber}.pdf", 'base64', 'application/pdf');

            // Send email
            $mail->send();
            return true;

        } catch (Exception $e) {
            Log::error('Email sending failed: ' . $e->getMessage());
            return false;
        }
    }
}
