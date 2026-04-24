# Throttle Note Requests — Anti-Scraping for `local-open.php`

Companion to [README - Protect MD Files Guide.md](README - Protect MD Files Guide.md). That guide blocks the direct `.md` URL. This guide rate-limits the PHP endpoint that legitimately serves notes, so a scraper can't just walk `?id=1`, `?id=2`, `?id=3`, … and pull the whole knowledge base.

---

## 1. What this does

[local-open.php](local-open.php) is the single entry point for note content (see §2 of the Protect MD Files Guide). Before it resolves `?id=N`, it now keeps a short sliding-window counter per client IP. If a client exceeds the configured rate, the endpoint returns **HTTP 429 Too Many Requests** with a `Retry-After` header and a friendly cooldown message that the frontend renders in place of the note body.

Defaults (from [config-throttle.json](config-throttle.json)):
- **4 requests per 30 seconds** per IP.
- Authenticated PRIVATE users bypass the limit.
- `X-Forwarded-For` is **not** trusted by default (flip this on behind CloudPanel / reverse proxies).

## 2. How it works

```mermaid
sequenceDiagram
    participant B as Browser
    participant P as local-open.php
    participant C as temp/throttle/&lt;sha256(ip)&gt;.json

    B->>P: GET local-open.php?id=N
    P->>P: load config-throttle.json
    alt config missing / enabled=false
        Note over P: fail-open — skip throttle
    else enabled=true
        P->>P: resolve client IP (REMOTE_ADDR, optionally XFF)
        P->>C: read timestamps in last window_seconds
        alt count &gt;= max_requests
            P-->>B: 429 Too Many Requests<br/>Retry-After: window_seconds<br/>YAML envelope with cooldown_message
        else under limit
            P->>C: append now + save
            P->>P: continue to id lookup + PRIVATE gate + file_get_contents
            P-->>B: 200 with note body
        end
    end
```

Key properties:

- **Sliding window**, not fixed bucket. Old timestamps (outside `window_seconds`) are dropped every read, so the counter self-heals — a user who waits out the window is immediately unblocked.
- **File-per-IP-hash** under `temp/throttle/`. No database, no PHP extension (APCu/Redis) required. Works on every shared host that runs the rest of the app.
- **sha256(ip)** for the filename so the directory contents don't read as a list of visitor IPs. The IP itself never lands on disk.
- **Fail-open** if the config file is missing, unreadable, or the storage dir is not writable. The goal is to never cost you a reader because of a misconfiguration.
- **Opportunistic cleanup** on ~1% of requests removes counter files untouched for 24h, so the folder doesn't grow unboundedly.

## 3. Configuration — [config-throttle.json](config-throttle.json)

```json
{
    "enabled": true,
    "max_requests": 4,
    "window_seconds": 30,
    "storage_dir": "temp/throttle",
    "cooldown_message": "**Slow down.** You're opening notes too quickly. Please wait a moment and try again.",
    "bypass_authenticated_private": true,
    "trust_forwarded_for": false
}
```

| Field | Type | Default | Meaning |
|---|---|---|---|
| `enabled` | bool | `true` | Master switch. Set `false` to disable throttling entirely without removing the code. |
| `max_requests` | int | `4` | How many note opens are allowed inside `window_seconds`. The N-th+1 request in the window returns 429. |
| `window_seconds` | int | `30` | Rolling window length. |
| `storage_dir` | string | `"temp/throttle"` | Where per-IP counter files live. Absolute paths OK; relative paths resolve against the script dir. Auto-created with `0755`. |
| `cooldown_message` | string | (see json) | Shown to the user when throttled. Markdown is rendered by the frontend's existing `markdown-it`. |
| `bypass_authenticated_private` | bool | `true` | If `true`, visitors who unlocked private notes via the 🔑 key icon (session flag `private_auth`) skip the throttle. |
| `trust_forwarded_for` | bool | `false` | If `true`, the IP is read from `X-Real-IP` / `X-Forwarded-For`. Only enable this behind a trusted reverse proxy (e.g. CloudPanel 443 → 8080); otherwise clients can spoof headers and evade the limit. |

### When to change the defaults

- **Tighten** (`max_requests: 2`, `window_seconds: 60`) if you're under active scraping. A legitimate human rarely opens more than a couple of notes in a minute.
- **Loosen** (`max_requests: 10`, `window_seconds: 30`) if you have power users who click through quickly — e.g. while answering a question from the notes.
- **Disable** (`enabled: false`) for local dev so a fast refresh loop doesn't trip on itself.

### Tuning rule of thumb

Think of a real reading session: click a note → read for ≥5s → click the next. Even a fast reader does ~6 notes per 30s. Defaults (4/30s) are intentionally below that to catch scrapers but the `bypass_authenticated_private` lets you keep real power usage untouched if you're logged into private notes. If you find yourself getting throttled during normal use, that's a signal to raise `max_requests` rather than disable the feature.

## 4. Running behind a reverse proxy (CloudPanel, Cloudflare, nginx 443→8080)

The PHP script sees `$_SERVER['REMOTE_ADDR']`. When PHP is on the internal 8080 tier that only talks to the 443 front-end, `REMOTE_ADDR` is `127.0.0.1` for **every** visitor — which means all your readers share a single counter and throttle each other. Symptom: "the limit trips way too fast under real traffic."

Fix: enable the header-based path **and** make sure the 443 block forwards the header.

1. In [config-throttle.json](config-throttle.json):
    ```json
    "trust_forwarded_for": true
    ```
2. In your CloudPanel / Nginx 443 server block (the public-facing one), confirm the PHP `location` passes the original client IP to the backend:
    ```nginx
    location ~ \.php$ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    ```

The PHP prefers `X-Real-IP` when present, then falls back to the first address in `X-Forwarded-For`. Both are already set by default in CloudPanel; if you're on bare Nginx, the snippet above is what you want.

**Only turn `trust_forwarded_for` on if you really do have a trusted proxy in front.** On a box that serves PHP directly to the internet, enabling it lets any scraper rotate fake `X-Forwarded-For` values and bypass the limit entirely.

## 5. What the client sees when throttled

The frontend fetches `local-open.php?id=N` with `fetch()`, which does not throw on 429 — it just returns the response body. The body is the same `title: … / html: | …` envelope that [assets/js/note-opener.js](assets/js/note-opener.js) already parses, so the cooldown message renders into the normal note-reading pane:

```
Title: Too many requests

Slow down. You're opening notes too quickly. Please wait a moment and try again.
```

Because `cooldown_message` goes through `markdown-it`, you can style it — bold, italics, a link to contact email, etc. — by editing the string in [config-throttle.json](config-throttle.json).

## 6. Testing

Temporarily set `max_requests: 2, window_seconds: 30` to make this easy to reproduce.

```bash
# Pick any real note id from cachedResData.json.
URL='https://your.host/app/devbrain/local-open.php?id=1'

# 1st and 2nd: 200 OK.
curl -s -o /dev/null -w "%{http_code}\n" "$URL"
curl -s -o /dev/null -w "%{http_code}\n" "$URL"

# 3rd inside the window: 429 Too Many Requests.
curl -s -o /dev/null -w "%{http_code}\n" "$URL"

# Headers confirm the throttle fired.
curl -sI "$URL" | grep -iE 'http/|retry-after'

# Wait out the window, then it clears.
sleep 35
curl -s -o /dev/null -w "%{http_code}\n" "$URL"
```

In a browser, you can reproduce by opening the same note repeatedly via `?open=<title>` or by mashing notes in the topics list. The note-reading pane will show the cooldown message instead of the note.

Don't forget to restore `max_requests`/`window_seconds` afterwards.

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Every real user shares one counter; limit trips under normal traffic | PHP sits behind a reverse proxy and sees `REMOTE_ADDR = 127.0.0.1`. The counter key is the same for everyone. | Set `trust_forwarded_for: true` and confirm the 443 block forwards `X-Real-IP` / `X-Forwarded-For`. See §4. |
| Nothing is ever throttled, even with a loop of 100 curls | `enabled: false`, config file missing, `storage_dir` not writable, or `bypass_authenticated_private` is on and you're logged in. | Check `ls -ld temp/throttle/` is writable by the PHP user; `cat config-throttle.json`; log out of private notes. |
| `temp/throttle/` does not exist after the first request | PHP user can't `mkdir` there. The throttle silently fails open. | `mkdir -p temp/throttle && chown <php-user> temp/throttle` (or `chmod 0775` if group-owned). |
| Users report "Slow down" message even after `npm run build-*` rebuild | Their counter file is still young (<30s). Also possible if you forgot to actually persist a config change — reload your editor, confirm JSON validity with `php -r "print_r(json_decode(file_get_contents('config-throttle.json'), true));"`. | Wait out the window, or delete the specific counter file: `rm temp/throttle/*.json`. |
| Malformed JSON throws a 500 | Every other read of `config-throttle.json` is defensive, but invalid JSON produces `null` and falls through to fail-open — the 500 would be from something else in the endpoint. | `php -l config-throttle.json` is not a thing; run `json_decode` as shown above, or use `jq . config-throttle.json`. |
| A scraper trivially evades the limit | They're either rotating IPs (you'd need a CDN-level rule like Cloudflare rate limiting) or forging `X-Forwarded-For` with `trust_forwarded_for` wrongly enabled on a host that is NOT behind a trusted proxy. | Leave `trust_forwarded_for: false` unless you have a proxy; for IP-rotation scrapers, move this logic up to the webserver or CDN layer (out of scope for this PHP-level throttle). |

## 8. What this does NOT cover

- **`search.php`** still runs an unthrottled `pcregrep` across the whole corpus. A determined scraper could harvest content through search queries. If that matters to you, extend this same pattern into [search.php](search.php) (read the config, key off IP, maintain a separate counter file under `temp/throttle/search/`).
- **Static assets under `curriculum/img/**`** are served by the webserver, not PHP, so this throttle never sees them. Those are public by definition.
- **Per-note ACLs.** Any visitor who stays under `max_requests` can still read every non-PRIVATE note. This is about slowing scraping, not about access control. Access control stays in [local-open.php](local-open.php)'s PRIVATE gate and [LLM_CODE_REFERENCE-private.md](LLM_CODE_REFERENCE-private.md).
- **Distributed scrapers** (rotating cloud IPs). File-based single-server throttling can't see them as a group. For that, a CDN-level rule (Cloudflare → "Rate Limiting Rules") or a WAF is the right layer.

## 9. Relationship to existing configs

This feature adds one new file ([config-throttle.json](config-throttle.json)) and one runtime directory (`temp/throttle/`, gitignored). It does not change:

- [.htaccess](.htaccess) — still the cache-control rules from the cached-files guide, plus the `.md` block from the protect guide.
- [local-open.php](local-open.php) — the PRIVATE gate and `file_get_contents` read are unchanged; the throttle runs as a self-contained block above them.
- [cachedResData.json](cachedResData.json) — unchanged.
- Frontend JS — unchanged. The existing `fetch` + YAML-envelope parsing naturally handles the 429 response because the body uses the same envelope shape.

Disable by flipping `enabled` to `false` in the config. No code change required.
