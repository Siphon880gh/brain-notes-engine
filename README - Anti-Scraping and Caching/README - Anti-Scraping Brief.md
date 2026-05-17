With a large number of published notes, your site can become a target for botnets that scan and scrape web pages. If you have thousands of notes, automated traffic can quickly overwhelm your CPU, crash your site for real visitors, and potentially get your VPS flagged by your hosting provider for excessive resource usage.

When my site was listed on a botnet, my CPU spiked to around **200%**. Hostinger warned me that my VPS could be removed for “fraudulent activity,” even though the issue was not fraud — it was automated bot traffic overwhelming the server. During these spikes, my website also became unstable and crashed.

Several layers of protection reduced the load. Efficiency improvements also helped — slow processes amplify CPU impact during attacks:

* **Throttled repeated requests from the same IP at the PHP level**
  My Markdown notes were served through `local-open.php`, which allowed me to control access and rate-limit repeated requests instead of letting bots freely hammer the files.

* **Blocked direct public access to raw `.md` files**
  At the Nginx vhost level, I blocked visitors and bots from directly opening Markdown files. This forced access through the PHP layer where throttling and controls could be applied.

* **Added `ETag` headers for the pre-rendered Coder Notes navigation**
  This allowed browsers to revalidate cached content instead of repeatedly downloading the same navigation data.

* **Pre-compressed the large generated files with gzip and brotli**
  Every build writes `.br` (brotli quality 11) and `.gz` (gzip level 9) variants alongside the cached files. The server serves the pre-built variant the client accepts, cutting first-load body size by ~94–96% (e.g. ~1.9 MB HTML → ~104 KB) with zero per-request CPU.

* **Adjusted Cloudflare caching rules**
  Cloudflare’s caching behavior was interfering with my origin-side `ETag` revalidation strategy. To fix this, I matched the Coder Notes URL pattern in Cloudflare and bypassed Cloudflare cache for that route, allowing requests to reach the origin when revalidation was needed.

* **Geo-blocked non-US traffic at the Cloudflare level**
  My audience is US-only, so I added a Cloudflare Security Rule that blocks all non-US traffic. This alone cut a significant share of bot traffic before any per-request logic ran.

* **Added non-interactive Cloudflare challenges**
  I applied non-interactive challenges to my Coder Notes pages so Cloudflare could filter suspicious bot traffic without forcing normal visitors through visible verification prompts.

* **Enabled Cloudflare proxying on DNS records**
  Proxying my DNS records helped hide the real A record IP address of my VPS.

  However, because the botnet had already saved my original server IP, simply enabling Cloudflare proxying was not enough. I could still see attacks hitting the server IP directly in the logs, rather than coming through the domain.

  Since Hostinger did not support changing the VPS IP without wiping the server files, I moved to Hetzner, where I could use floating IPs. Ideally, only the floating IP should ever be exposed in DNS, not the server’s original IP. With Cloudflare proxying enabled, the origin IP stays hidden from normal DNS lookups, even if Cloudflare has an outage or interruption on their side.

After applying these protections, CPU usage dropped to around **5%**.
