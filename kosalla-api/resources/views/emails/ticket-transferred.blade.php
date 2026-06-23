<!doctype html>
<html>
  <body>
    <h2>{{ $subjectLine }}</h2>

    <p>Sebuah tiket telah <strong>ditransfer ke tim Anda</strong>.</p>

    <p>
      Ticket: <strong>{{ $ticket->ticket_number }}</strong><br>
      Subject: {{ $ticket->subject }}<br>
      Dari tim: <strong>{{ $fromTeamName }}</strong><br>
      Ke tim: <strong>{{ $toTeamName }}</strong><br>
      Ditransfer oleh: <strong>{{ $byUserName }}</strong><br>
      Reporter: {{ optional($ticket->creator)->name }} ({{ optional($ticket->creator)->email }})
    </p>

    <p>
      Catatan/alasan:<br>
      <em>{{ $note }}</em>
    </p>

    <p>
      <a href="{{ $frontendUrl }}">Buka Ticket</a>
    </p>
  </body>
</html>
