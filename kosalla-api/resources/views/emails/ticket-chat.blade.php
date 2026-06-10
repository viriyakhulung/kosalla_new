<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2 style="margin:0 0 12px 0;">{{ $subjectLine }}</h2>

    @if(!empty($isSelf) && $isSelf)
      <p style="margin:0 0 12px 0;">
        Ini adalah <b>konfirmasi</b> bahwa pesan Anda berhasil dikirim pada ticket berikut.
      </p>
    @endif

    <p style="margin:0 0 12px 0;">
      Pesan terakhir dari:
      <b>
        @if(!empty($isSelf) && $isSelf)
          Anda
        @else
          {{ $comment->user?->name ?? $senderName }}
        @endif
      </b>

      @if(empty($isSelf) || !$isSelf)
        @if($comment->user?->email)
          ({{ $comment->user?->email }})
        @endif
      @endif
    </p>

    <div style="background:#f3f4f6;padding:12px;border-radius:14px;max-width:680px;">
      <div style="background:#ffffff;padding:12px;border-radius:14px;border:1px solid #e5e7eb;">
        {!! $comment->body !!}
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
