<?php

namespace App\Mail;

use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactFeedbackMail extends Mailable
{
    use Queueable, SerializesModels;

    public $contact;

    public function __construct(Contact $contact)
    {
        $this->contact = $contact;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New KeeType Feedback from ' . $this->contact->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;'>
                    <h2 style='color: #2563eb; margin-top: 0;'>New Feedback Message on KeeType ⌨️</h2>
                    <p style='color: #4b5563; font-size: 14px;'>You received a new contact message from your website:</p>
                    
                    <div style='background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                        <p style='margin: 5px 0; color: #1f2937;'><strong>Name:</strong> {$this->contact->name}</p>
                        <p style='margin: 5px 0; color: #1f2937;'><strong>Email:</strong> " . ($this->contact->email ?: 'Not provided') . "</p>
                        <p style='margin: 5px 0; color: #1f2937;'><strong>Date:</strong> " . $this->contact->created_at->format('d M Y, H:i') . "</p>
                    </div>

                    <div style='margin-top: 15px;'>
                        <strong style='color: #1f2937;'>Message:</strong>
                        <div style='background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px; margin-top: 8px; font-size: 14px; color: #374151; white-space: pre-wrap;'>{$this->contact->message}</div>
                    </div>

                    <hr style='border: none; border-top: 1px solid #eee; margin: 25px 0 15px 0;' />
                    <p style='font-size: 12px; color: #9ca3af; text-align: center; margin: 0;'>KeeType Automated Notification • <a href='https://keetype.my.id' style='color: #2563eb; text-decoration: none;'>keetype.my.id</a></p>
                </div>
            ",
        );
    }
}
