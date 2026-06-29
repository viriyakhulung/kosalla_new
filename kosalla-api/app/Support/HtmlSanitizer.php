<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;

/**
 * Sanitizer HTML berbasis DOM (tanpa dependency tambahan).
 *
 * Dipakai untuk membersihkan body_html Knowledge Base sebelum dirender ke PDF
 * oleh DomPDF. Strategi: whitelist tag + attribute. Tag berbahaya dibuang
 * beserta isinya, tag tak dikenal di-"unwrap" (isi/teks dipertahankan).
 *
 * Catatan keamanan:
 * - Semua attribute event handler (on*) otomatis hilang (tidak ada di whitelist).
 * - href hanya boleh http/https/mailto/anchor/relative (javascript: & data: ditolak).
 * - img hanya boleh data:image base64 (tertanam) -> tidak ada fetch jaringan,
 *   konsisten dengan DomPDF isRemoteEnabled = false.
 */
class HtmlSanitizer
{
    /** Tag yang boleh tetap ada di output. */
    private const ALLOWED_TAGS = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'blockquote', 'code', 'pre', 'a', 'img', 'span', 'div', 'hr',
    ];

    /** Tag yang dibuang total beserta seluruh isinya. */
    private const DANGEROUS_TAGS = [
        'script', 'style', 'iframe', 'object', 'embed', 'form', 'input',
        'button', 'select', 'option', 'textarea', 'link', 'meta', 'base',
        'frame', 'frameset', 'applet', 'audio', 'video', 'source', 'track',
        'svg', 'math', 'noscript',
    ];

    /** Attribute yang diizinkan per tag (selain ini dibuang). */
    private const ALLOWED_ATTRS = [
        'a'   => ['href', 'title'],
        'img' => ['src', 'alt', 'width', 'height'],
        'td'  => ['colspan', 'rowspan'],
        'th'  => ['colspan', 'rowspan'],
    ];

    public static function clean(?string $html): string
    {
        $html = (string) $html;
        if (trim($html) === '') {
            return '';
        }

        $dom = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);

        // Bungkus dengan root tunggal + paksa UTF-8. LIBXML_NONET cegah akses jaringan.
        $wrapped = '<?xml encoding="UTF-8"?><div id="__kb_root__">' . $html . '</div>';
        $dom->loadHTML($wrapped, LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET);

        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $xpath = new DOMXPath($dom);
        $root = $xpath->query('//*[@id="__kb_root__"]')->item(0);
        if (!$root) {
            return '';
        }

        self::sanitizeChildren($root);

        $out = '';
        foreach (iterator_to_array($root->childNodes) as $child) {
            $out .= $dom->saveHTML($child);
        }

        return trim($out);
    }

    private static function sanitizeChildren(DOMNode $node): void
    {
        // Salin ke array dulu: koleksi bisa berubah saat node dimodifikasi.
        foreach (iterator_to_array($node->childNodes) as $child) {
            self::sanitizeNode($child);
        }
    }

    private static function sanitizeNode(DOMNode $node): void
    {
        // Buang komentar HTML.
        if ($node->nodeType === XML_COMMENT_NODE) {
            $node->parentNode?->removeChild($node);
            return;
        }

        // Text node aman, biarkan.
        if (!($node instanceof DOMElement)) {
            return;
        }

        $tag = strtolower($node->nodeName);

        // Tag berbahaya -> buang beserta isinya.
        if (in_array($tag, self::DANGEROUS_TAGS, true)) {
            $node->parentNode?->removeChild($node);
            return;
        }

        // Bersihkan anak lebih dulu (rekursif).
        self::sanitizeChildren($node);

        // Tag tak dikenal -> unwrap (pertahankan isi/teks).
        if (!in_array($tag, self::ALLOWED_TAGS, true)) {
            self::unwrap($node);
            return;
        }

        self::cleanAttributes($node, $tag);
    }

    private static function cleanAttributes(DOMElement $el, string $tag): void
    {
        $allowed = self::ALLOWED_ATTRS[$tag] ?? [];

        foreach (iterator_to_array($el->attributes) as $attr) {
            $name = strtolower($attr->nodeName);

            // Bukan whitelist (termasuk semua on*, style, class) -> buang.
            if (!in_array($name, $allowed, true)) {
                $el->removeAttribute($attr->nodeName);
                continue;
            }

            $value = trim($attr->nodeValue ?? '');

            if ($name === 'href' && !self::isSafeHref($value)) {
                $el->removeAttribute($attr->nodeName);
            }

            if ($name === 'src' && !self::isSafeImgSrc($value)) {
                // src remote/berbahaya -> buang elemen img agar tidak fetch jaringan.
                $el->parentNode?->removeChild($el);
                return;
            }
        }
    }

    private static function isSafeHref(string $url): bool
    {
        if ($url === '') {
            return false;
        }
        // Anchor & path relatif aman.
        if (str_starts_with($url, '#') || str_starts_with($url, '/')) {
            return true;
        }
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        if ($scheme === '') {
            return true; // relative (mis. "halaman.html")
        }
        return in_array($scheme, ['http', 'https', 'mailto'], true);
    }

    private static function isSafeImgSrc(string $url): bool
    {
        if ($url === '') {
            return false;
        }
        // Hanya izinkan data URI gambar (tertanam). Cegah fetch jaringan.
        return (bool) preg_match('#^data:image/[a-z0-9.+\-]+;base64,#i', $url);
    }

    private static function unwrap(DOMElement $el): void
    {
        $parent = $el->parentNode;
        if (!$parent) {
            return;
        }
        while ($el->firstChild) {
            $parent->insertBefore($el->firstChild, $el);
        }
        $parent->removeChild($el);
    }
}
