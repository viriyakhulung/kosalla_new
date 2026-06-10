<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2 style="margin:0 0 12px 0;">{{ $subjectLine }}</h2>

    <p style="margin:0 0 12px 0;">
      Pesan terakhir dari:
      <b>{{ $comment->user?->name }}</b>
      ({{ $comment->user?->email }})
    </p>

    <div style="background:#f3f4f6;padding:12px;border-radius:14px;max-width:620px;">
      <div style="background:#ffffff;padding:12px;border-radius:14px;border:1px solid #e5e7eb;">
        {!! nl2br(e($comment->body)) !!}
      </div>
      <div style="font-size:12px;color:#6b7280;margin-top:6px;">
        {{ $comment->created_at }}
      </div>
    </div>

    <p style="margin-top:16px;">
      <a href="{{ $frontendUrl }}" target="_blank">View Ticket</a>
    </p>
  </body>
</html>
