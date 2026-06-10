<!doctype html>
<html>
  <body>
    <h2>{{ $subjectLine }}</h2>

    <p>Ticket telah ditutup.</p>

    @if(!empty($closerName))
      <p>Ditutup oleh: <strong>{{ $closerName }}</strong></p>
    @endif

    <p>
      Ticket: <strong>{{ $ticket->ticket_number }}</strong><br>
      Subject: {{ $ticket->subject }}<br>
      Reporter: {{ optional($ticket->creator)->name }} ({{ optional($ticket->creator)->email }})
    </p>

    <p>
      <a href="{{ $frontendUrl }}">Buka Ticket</a>
    </p>
  </body>
</html>

