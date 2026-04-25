'use strict';

/*
 * cache_compress.js
 *
 * Writes pre-compressed brotli (.br) and gzip (.gz) variants for each generated
 * cache file at the repo root. Run as the final step of every `npm run build-*`
 * so the variants are always in lockstep with the source.
 *
 * Why pre-compress instead of letting the server compress on the fly:
 *   - Brotli at quality 11 is ~15-25% smaller than the ~level-4-5 brotli a
 *     server module produces under request-time CPU budget. The cached files
 *     are huge, redundant text (~2 MB HTML, ~2.5 MB JSON), so the absolute
 *     savings are real (tens to hundreds of KB per first-load visitor).
 *   - Quality 11 is slow (seconds per MB) but only runs once per rebuild,
 *     not once per request.
 *   - Cloudflare passes Content-Encoding: br through unchanged, so its edge
 *     cache also stores the smallest variant for every visitor.
 *
 * Output mtime is forced to match the source's mtime so Last-Modified /
 * If-Modified-Since revalidation behaves identically across encodings: a
 * browser that has the .br body cached and the server now serves a .gz still
 * gets the same 304 logic. See README - Cache Strategies Implementation.md §7.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;

const TARGETS = [
    'cachedResData.json',
    'cachedResDataImaged.json',
    'cachedResPartial.html'
];

function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function pct(part, whole) {
    if (!whole) return '0%';
    return ((1 - part / whole) * 100).toFixed(1) + '%';
}

function compressOne(filename) {
    const src = path.join(ROOT, filename);

    if (!fs.existsSync(src)) {
        console.warn('[cache_compress] skip (missing source): ' + filename);
        return;
    }

    const body = fs.readFileSync(src);
    const original = body.length;
    const srcStat = fs.statSync(src);

    const gzPath = src + '.gz';
    const gz = zlib.gzipSync(body, {
        level: zlib.constants.Z_BEST_COMPRESSION
    });
    fs.writeFileSync(gzPath, gz);
    fs.utimesSync(gzPath, srcStat.atime, srcStat.mtime);

    const brPath = src + '.br';
    const br = zlib.brotliCompressSync(body, {
        params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: original
        }
    });
    fs.writeFileSync(brPath, br);
    fs.utimesSync(brPath, srcStat.atime, srcStat.mtime);

    console.log(
        '[cache_compress] ' + filename +
        ': raw ' + fmtBytes(original) +
        '  gz ' + fmtBytes(gz.length) + ' (-' + pct(gz.length, original) + ')' +
        '  br ' + fmtBytes(br.length) + ' (-' + pct(br.length, original) + ')'
    );
}

console.log('[cache_compress] writing brotli (q=11) and gzip (level 9) variants');
const t0 = Date.now();
for (const f of TARGETS) compressOne(f);
console.log('[cache_compress] done in ' + ((Date.now() - t0) / 1000).toFixed(2) + 's');
