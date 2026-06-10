<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketAttachment extends Model
{
    protected $fillable = [
        'ticket_id',
        'ticket_comment_id',
        'uploaded_by',
        'original_name',
        'path',
        'mime_type',
        'size',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function comment(): BelongsTo
    {
        return $this->belongsTo(TicketComment::class, 'ticket_comment_id');
    }
}
