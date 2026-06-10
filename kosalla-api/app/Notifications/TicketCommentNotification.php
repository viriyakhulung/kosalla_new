<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
        public TicketComment $comment
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
            'inventoryItem:id,name',
        ]);

        $c = $this->comment->loadMissing([
            'user:id,name,email',
        ]);

        $subject = "[Kosalla] {$t->ticket_number} | subject : {$t->subject}";

        $frontendUrl = rtrim(config('app.frontend_url', ''), '/') . "/portal/tickets/{$t->id}";

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.ticket-comment', [
                'ticket' => $t,
                'comment' => $c,
                'subjectLine' => $subject,
                'frontendUrl' => $frontendUrl,
            ]);
    }
}
