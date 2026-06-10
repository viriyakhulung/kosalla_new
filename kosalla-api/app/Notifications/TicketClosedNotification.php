<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketClosedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
        public ?string $closerName = null
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $t = $this->ticket->loadMissing([
            'creator:id,name,email',
            'organization:id,name',
            'location:id,name',
            'inventoryItem:id,name',
        ]);

        $subject = "[Kosalla] {$t->ticket_number} | CLOSED | subject : {$t->subject}";
        $frontendUrl = rtrim(config('app.frontend_url', ''), '/') . "/portal/tickets/{$t->id}";

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.ticket-closed', [
                'ticket' => $t,
                'subjectLine' => $subject,
                'frontendUrl' => $frontendUrl,
                'closerName' => $this->closerName,
            ]);
    }
}

