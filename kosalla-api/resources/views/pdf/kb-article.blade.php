{{--
  Template PDF Knowledge Base resmi (DomPDF / A4 portrait).
  CSS sengaja sederhana & inline agar stabil di DomPDF:
  - tanpa flex/grid/position/transform/font external/remote CSS
  - layout header pakai <table> (paling reliable di DomPDF)
  Variabel: $logoBase64, $logoFound, $title, $articleId, $status, $version,
            $productName, $createdAt, $updatedAt, $generatedAt,
            $author, $publishedBy, $reviewedBy, $bodyHtml
--}}
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>{{ $title }}</title>
<style>
    @page {
        margin: 120px 40px 70px 40px; /* ruang untuk header (fixed) atas & footer bawah */
    }

    * { box-sizing: border-box; }

    body {
        font-family: DejaVu Sans, sans-serif;
        font-size: 12px;
        color: #1e293b;            /* slate-800 */
        line-height: 1.5;
        background: #ffffff;
        margin: 0;
    }

    /* ===== HEADER (muncul tiap halaman, di area margin atas) ===== */
    header {
        position: fixed;
        top: -100px;               /* relatif ke margin atas @page */
        left: 0;
        right: 0;
        height: 90px;
    }
    .head-table { width: 100%; border-collapse: collapse; }
    .head-table td { vertical-align: middle; padding: 0; }
    .head-logo-cell { width: 78px; }
    .head-logo { height: 50px; width: auto; }
    .head-text-cell { padding-left: 14px; text-align: center; }
    .head-logo-fallback {
        width: 70px; height: 50px;
        border: 1px solid #cbd5e1;
        text-align: center;
        font-size: 9px; font-weight: bold; color: #334155;
        line-height: 50px;
    }
    .company {
        font-size: 14px; font-weight: bold; color: #0f172a;  /* slate-900 */
        line-height: 1.3; margin: 0;
    }
    .company-sub {
        font-size: 11px; font-weight: bold; color: #0f766e;  /* teal-700 */
        line-height: 1.3; margin: 1px 0 0 0;
    }
    .company-meta {
        font-size: 9px; color: #64748b;                       /* slate-500 */
        line-height: 1.35; margin: 0;
    }
    .head-rule {
        border: 0;
        border-top: 2px solid #0f172a;
        margin: 8px 0 0 0;
    }

    /* ===== FOOTER (muncul tiap halaman) ===== */
    footer {
        position: fixed;
        bottom: -45px;
        left: 0; right: 0;
        height: 30px;
        font-size: 9px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
        padding-top: 6px;
    }
    .footer-table { width: 100%; border-collapse: collapse; }
    .footer-table td { padding: 0; }
    .footer-right { text-align: right; }
    .pagenum:after { content: counter(page); }
    .pagecount:after { content: counter(pages); }

    /* ===== TITLE ===== */
    .doc-subtitle {
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #0f766e;
        margin: 0 0 2px 0;
    }
    .doc-title {
        font-size: 20px;
        font-weight: bold;
        color: #0f172a;
        margin: 0 0 14px 0;
        line-height: 1.25;
    }

    /* ===== METADATA TABLE ===== */
    .meta {
        width: 100%;
        border-collapse: collapse;
        margin: 0 0 18px 0;
        border: 1px solid #e2e8f0;
    }
    .meta th, .meta td {
        border: 1px solid #e2e8f0;
        padding: 6px 9px;
        font-size: 11px;
        text-align: left;
        vertical-align: top;
    }
    .meta th {
        width: 150px;
        background: #f8fafc;        /* slate-50 */
        color: #475569;
        font-weight: bold;
    }
    .badge {
        display: inline-block;
        padding: 1px 7px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        background: #ecfdf5;
        color: #047857;
    }

    .section-label {
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 4px;
        margin: 0 0 10px 0;
    }

    /* ===== ARTICLE BODY ===== */
    .body { font-size: 12px; color: #1e293b; }
    .body h1 { font-size: 17px; }
    .body h2 { font-size: 15px; }
    .body h3 { font-size: 13px; }
    .body h1, .body h2, .body h3, .body h4 { color: #0f172a; margin: 12px 0 6px 0; }
    .body p { margin: 6px 0; }
    .body ul, .body ol { margin: 6px 0 6px 0; padding-left: 22px; }
    .body li { margin: 3px 0; }
    .body a { color: #0f766e; text-decoration: underline; }
    .body blockquote {
        border-left: 3px solid #cbd5e1;
        margin: 8px 0;
        padding: 2px 0 2px 12px;
        color: #475569;
    }
    .body pre {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 3px;
        padding: 8px;
        font-family: DejaVu Sans Mono, monospace;
        font-size: 10.5px;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
    .body code {
        background: #f1f5f9;
        padding: 1px 3px;
        border-radius: 2px;
        font-family: DejaVu Sans Mono, monospace;
        font-size: 10.5px;
    }
    .body table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
    }
    .body th, .body td {
        border: 1px solid #cbd5e1;
        padding: 5px 7px;
        font-size: 11px;
        text-align: left;
    }
    .body th { background: #f8fafc; }
    .body img { max-width: 100%; height: auto; }
</style>
</head>
<body>

    {{-- HEADER --}}
    <header>
        <table class="head-table">
            <tr>
                <td class="head-logo-cell">
                    @if($logoFound)
                        <img class="head-logo" src="{{ $logoBase64 }}" alt="Viriya">
                    @else
                        <div class="head-logo-fallback">VIRIYA</div>
                    @endif
                </td>
                <td class="head-text-cell">
                    <div class="company">PT Viriya Teknologi Data</div>
                    <div class="company-sub">Kosalla Knowledge Base</div>
                    <div class="company-meta" style="margin-top:3px;">Official Knowledge Base Document &nbsp;&bull;&nbsp; Generated: {{ $generatedAt }}</div>
                </td>
                <td class="head-logo-cell"></td>{{-- penyeimbang agar teks center di tengah halaman --}}
            </tr>
        </table>
        <hr class="head-rule">
    </header>

    {{-- FOOTER --}}
    <footer>
        <table class="footer-table">
            <tr>
                <td>Generated by Kosalla System &nbsp;|&nbsp; PT Viriya Teknologi Data</td>
                <td class="footer-right">Page <span class="pagenum"></span> / <span class="pagecount"></span></td>
            </tr>
        </table>
    </footer>

    {{-- TITLE --}}
    <div class="doc-subtitle">Knowledge Base Article</div>
    <h1 class="doc-title">{{ $title }}</h1>

    {{-- METADATA --}}
    <table class="meta">
        <tr>
            <th>Article ID</th>
            <td>{{ $articleId }}</td>
        </tr>
        <tr>
            <th>Status</th>
            <td><span class="badge">{{ ucfirst($status ?: '-') }}</span></td>
        </tr>
        @if($version)
        <tr>
            <th>Version</th>
            <td>{{ $version }}</td>
        </tr>
        @endif
        @if($productName)
        <tr>
            <th>Product</th>
            <td>{{ $productName }}</td>
        </tr>
        @endif
        @if($author)
        <tr>
            <th>Author</th>
            <td>{{ $author }}</td>
        </tr>
        @endif
        @if($reviewedBy)
        <tr>
            <th>Reviewed by</th>
            <td>{{ $reviewedBy }}</td>
        </tr>
        @endif
        @if($publishedBy)
        <tr>
            <th>Published by</th>
            <td>{{ $publishedBy }}</td>
        </tr>
        @endif
        <tr>
            <th>Created</th>
            <td>{{ $createdAt ?: '-' }}</td>
        </tr>
        <tr>
            <th>Updated</th>
            <td>{{ $updatedAt ?: '-' }}</td>
        </tr>
        <tr>
            <th>Generated</th>
            <td>{{ $generatedAt }}</td>
        </tr>
    </table>

    {{-- BODY --}}
    <div class="section-label">Content</div>
    <div class="body">
        @if(trim($bodyHtml) !== '')
            {!! $bodyHtml !!}
        @else
            <p style="color:#94a3b8;">(Artikel tidak memiliki konten.)</p>
        @endif
    </div>

</body>
</html>
