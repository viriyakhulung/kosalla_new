<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Ticket $ticket) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $t = $this->ticket->loadMissing(['creator:id,name,email','organization:id,name','location:id,name','inventoryItem:id,name']);

        $subject = "[Kosalla] {$t->ticket_number} | subject : {$t->subject}";

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.ticket-created', [
    'ticket' => $t,
    'subjectLine' => $subject,
    'frontendUrl' => rtrim(config('app.frontend_url', ''), '/') . "/portal/tickets/{$t->id}",
]);

    }
}
