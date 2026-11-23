/**
 * VLinkGo interstitial Worker
 * Isolated implementation: does not modify the existing shortener Worker.
 *
 * Required binding:
 *   SHORTLINKS -> existing SHORTLINKS KV namespace (read-only access is sufficient)
 *
 * Routes:
 *   GET /<10-character-code>  -> interstitial page with 3-second countdown
 *   GET /go/<10-character-code> -> 302 to the stored destination
 */

const CODE_RE = /^[a-f0-9]{10}$/i;
const COUNTDOWN_SECONDS = 3;

function isFacebookCrawler(request) {
  const ua = request.headers.get("user-agent") || "";
  return /facebookexternalhit|facebot|facebookcatalog/i.test(ua);
}

function safeDestination(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function page(code) {
  const goPath = "/go/" + encodeURIComponent(code);
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="referrer" content="no-referrer">
  <title>Continue to video</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#10131b;color:#fff;font-family:Arial,Helvetica,sans-serif}
    main{width:min(100%,440px);text-align:center;background:#1b2130;border:1px solid #30394d;border-radius:20px;padding:32px 24px;box-shadow:0 18px 55px #0006}
    .brand{font-size:13px;letter-spacing:2px;color:#aab5ca;font-weight:700}
    h1{font-size:25px;margin:18px 0 10px}
    p{color:#b8c2d5;line-height:1.6;margin:0 0 22px}
    .timer{font-size:42px;font-weight:800;margin:12px 0 22px}
    a{display:block;padding:16px 18px;border-radius:12px;background:#2878ff;color:white;text-decoration:none;font-size:18px;font-weight:800}
    a[aria-disabled="true"]{opacity:.45;pointer-events:none}
    .note{font-size:12px;color:#8793a9;margin-top:18px}
  </style>
</head>
<body>
  <main>
    <div class="brand">VLINKGO</div>
    <h1>Your video is ready</h1>
    <p>Please wait a moment, then tap the button below to continue.</p>
    <div class="timer" id="timer" aria-live="polite">${COUNTDOWN_SECONDS}</div>
    <a id="continue" href="${goPath}" aria-disabled="true" tabindex="-1">▶ PLAY VIDEO</a>
    <div class="note">You will continue to the requested video.</div>
  </main>
  <script>
    (() => {
      let remaining = ${COUNTDOWN_SECONDS};
      const timer = document.getElementById("timer");
      const button = document.getElementById("continue");
      const tick = () => {
        remaining -= 1;
        timer.textContent = String(Math.max(remaining, 0));
        if (remaining <= 0) {
          button.removeAttribute("aria-disabled");
          button.removeAttribute("tabindex");
          timer.textContent = "0";
          return;
        }
        window.setTimeout(tick, 1000);
      };
      window.setTimeout(tick, 1000);
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (isFacebookCrawler(request)) {
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }

    if (path === "/health") {
      return new Response("VLinkGo interstitial is ready", {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
      });
    }

    const goMatch = path.match(/^\/go\/([a-f0-9]{10})$/i);
    const pageMatch = path.match(/^\/([a-f0-9]{10})$/i);
    const match = goMatch || pageMatch;

    if (!match) {
      return new Response("Not found", { status: 404 });
    }

    if (!env.SHORTLINKS) {
      return new Response("KV binding SHORTLINKS is not configured", { status: 500 });
    }

    const code = match[1].toLowerCase();
    const storedValue = await env.SHORTLINKS.get(code);
    const destination = safeDestination(storedValue);

    if (!destination) {
      return new Response("Shortlink not found or destination is invalid", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
      });
    }

    if (goMatch) {
      return Response.redirect(destination, 302);
    }

    return page(code);
  }
};
