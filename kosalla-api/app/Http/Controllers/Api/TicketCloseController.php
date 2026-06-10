<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketClosedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class TicketCloseController extends Controller
{
    // PATCH /api/tickets/{ticket}/close
    public function close(Request $request, Ticket $ticket)
    {
        // Role sudah dijaga oleh middleware master_role:viriyastaff,superadmin
        $status = strtolower((string) $ticket->status);
        $isClosed = in_array($status, ['closed', 'close'], true);

        if ($isClosed) {
            return response()->json([
                'ok' => true,
                'message' => 'Ticket sudah closed.',
                'data' => $ticket,
            ]);
        }

        $ticket->status = 'closed';
        $ticket->closed_at = now(); // opsional, kalau kolom ada
        $ticket->save();

        // === SEND EMAIL NOTIF: user (creator) + viriyastaff (role id 2) ===
        $staff = User::query()
	    ->where('master_role_id', 2)
 		 ->whereNotNull('email')
 		   ->get();


        $ticket->loadMissing('creator');
        $creator = $ticket->creator;

        $recipients = $staff->push($creator)
            ->filter(fn ($u) => $u && !empty($u->email))
            ->unique('id');

        Notification::send(
            $recipients,
            new TicketClosedNotification($ticket, auth()->user()->name ?? null)
        );

        return response()->json([
            'ok' => true,
            'message' => 'Ticket berhasil di-close.',
            'data' => $ticket,
        ]);
    }
}

