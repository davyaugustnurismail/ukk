<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail as FacadesMail;
use Illuminate\Support\Facades\Storage;
use Mail;


class CertificateGenerated extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public string $recipientName,
        public string $certificateNumber,
        public string $downloadUrl,
        public ?string $downloadToken,
        public bool $isNewUser = false
    ) {
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Certificate Generated',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.certificate-generated',
            with: [
                'recipientName' => $this->recipientName,
                'certificateNumber' => $this->certificateNumber,
                'downloadUrl' => $this->downloadUrl,
                'downloadToken' => $this->downloadToken,
                'isNewUser' => $this->isNewUser,
            ],
        );
    }

    /**
     * Static helper to send certificate email via queue
     */
    public static function sendCertificateEmail($recipientEmail, $recipientName, $certificateNumber, $downloadUrl, $downloadToken, $isNewUser = false)
    {
        FacadesMail::to($recipientEmail)->queue(
            new self($recipientName, $certificateNumber, $downloadUrl, $downloadToken, $isNewUser)
        );
    }

    // public function attachments(): array
    // {
    //     // Attachment will be read at send time by the queue worker from storage
    //     if (Storage::disk('public')->exists($this->pdfPath)) {
    //         $data = Storage::disk('public')->get($this->pdfPath);
    //         return [
    //             Attachment::fromData(fn () => $data, $this->pdfFilename)->withMime('application/pdf')
    //         ];
    //     }

    //     return [];
    // }
}
