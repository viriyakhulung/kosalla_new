<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketChatNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
        public TicketComment $comment,
        public string $senderName
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

        // ? self-notification check (penerima adalah pengirim comment)
        $notifiableId = (int) ($notifiable?->id ?? 0);
        $commentUserId = (int) ($c?->user_id ?? 0);
        $isSelf = ($notifiableId > 0 && $commentUserId > 0 && $notifiableId === $commentUserId);

        // Subject beda untuk self
        if ($isSelf) {
            $subject = "[Kosalla] {$t->ticket_number} | Konfirmasi: pesan Anda terkirim";
        } else {
            $subject = "[Kosalla] {$t->ticket_number} | subject : {$t->subject}";
        }

        $frontendBase = rtrim((string) config('app.frontend_url', ''), '/');
        $frontendUrl = $frontendBase . "/portal/tickets/{$t->id}";

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.ticket-chat', [
                'ticket' => $t,
                'comment' => $c,
                'subjectLine' => $subject,
                'senderName' => $isSelf ? 'Anda' : $this->senderName,
                'frontendUrl' => $frontendUrl,

                // opsional untuk dipakai di blade kalau mau beda wording
                'isSelf' => $isSelf,
                'recipientName' => (string) ($notifiable?->name ?? ''),
            ]);
    }
}
