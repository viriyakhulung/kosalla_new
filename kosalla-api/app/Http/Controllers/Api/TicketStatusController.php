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
            'assigned_team_group_id' => $data['assigned_team_group_id'] ?? $ticket->assigned_team_group_id,
            'assigned_to' => $data['assigned_to'] ?? $ticket->assigned_to,
            'last_activity_at' => now(),
            'resolved_at' => in_array($data['status'], ['resolved','closed']) ? now() : null,
            'closed_at' => $data['status'] === 'closed' ? now() : null,
        ]);

        return $ticket->load(['assignee','assignedTeamGroup']);
    }
}
