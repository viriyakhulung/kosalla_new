<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2 style="margin:0 0 12px 0;">[Kosalla] {{ $ticket->ticket_number }} | subject : {{ $ticket->subject }}</h2>

    <p style="margin:0 0 12px 0;">
      Ticket baru dibuat oleh: <b>{{ $ticket->creator?->name }}</b>
      ({{ $ticket->creator?->email }})
    </p>

    <h3 style="margin:16px 0 8px 0;">Basic Information</h3>
    <ul>
      <li><b>Status:</b> {{ $ticket->status }}</li>
      <li><b>Priority:</b> {{ $ticket->priority }}</li>
      <li><b>Category:</b> {{ $ticket->category }}</li>
      <li><b>Inventory:</b> {{ $ticket->inventoryItem?->name }}</li>
      <li><b>Organization:</b> {{ $ticket->organization?->name }}</li>
      <li><b>Reporter:</b> {{ $ticket->creator?->name }}</li>
      <li><b>Tagging Word:</b> {{ $ticket->tagging_word }}</li>
      <li><b>Requested Date:</b> {{ $ticket->requested_resolution_date }}</li>
      <li><b>Expected Date (PS):</b> {{ $ticket->expected_date }}</li>
      <li><b>Created At:</b> {{ $ticket->created_at }}</li>
    </ul>

    <h3 style="margin:16px 0 8px 0;">Issue Details (Description)</h3>
    <div style="border:1px solid #eee; padding:12px; border-radius:8px;">
      {!! $ticket->description_html !!}
    </div>

    @if(!empty($frontendUrl))
      <p style="margin-top:16px;">
        <a href="{{ $frontendUrl }}" target="_blank">View Ticket</a>
      </p>
    @endif
  </body>
</html>
