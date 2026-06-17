<?php 

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\UpdateTicketStatusRequest;
use App\Models\Ticket;

class TicketStatusController extends Controller
{
    public function update(UpdateTicketStatusRequest $request, Ticket $ticket)
    {
        $data = $request->validated();

        $ticket->update([
            'status' => $data['status'],
            'team_group_id' => $data['team_group_id'] ?? $ticket->team_group_id,
            'assigned_to' => $data['assigned_to'] ?? $ticket->assigned_to,
            'last_activity_at' => now(),
            'resolved_at' => in_array($data['status'], ['resolved','closed']) ? now() : null,
            'closed_at' => $data['status'] === 'closed' ? now() : null,
            // sinkron dgn closed_at: terisi saat closed, di-null-kan saat reopen
            'closed_by' => $data['status'] === 'closed' ? $request->user()->id : null,
        ]);

        return $ticket->load(['assignee','teamGroup']);
    }
}
