export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const goMatch = url.pathname.match(/^\/go\/([a-f0-9]{10})$/);
    if (goMatch) {
      const destination = await env.SHORTLINKS.get(goMatch[1]);
      if (!destination) return new Response("Link tidak ditemukan", { status: 404 });
      return Response.redirect(destination, 302);
    }

    const codeMatch = url.pathname.match(/^\/([a-f0-9]{10})$/);
    if (!codeMatch) {
      return new Response("VLinkGo interstitial test", {
        headers: { "content-type": "text/plain; charset=UTF-8" }
      });
    }

    const code = codeMatch[1];
    const destination = await env.SHORTLINKS.get(code);
    if (!destination) return new Response("Link tidak ditemukan", { status: 404 });

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Your video is ready</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:24px;display:grid;place-items:center;background:#0d111b;color:#f7f8fc;font-family:Arial,sans-serif}
main{width:min(100%,480px);padding:30px 24px;text-align:center;border:1px solid #283247;border-radius:20px;background:#151d2c;box-shadow:0 18px 60px #0006}
.mark{width:66px;height:66px;margin:0 auto 18px;border-radius:18px;display:grid;place-items:center;background:#253a65;color:#8db5ff;font-size:30px}
h1{font-size:25px;margin:0 0 10px}p{color:#aeb9cb;line-height:1.55;margin:0 0 22px}
.count{font-size:44px;font-weight:800;margin:14px 0}.hint{font-size:13px;color:#8492a8;margin-top:15px}
a{display:block;text-decoration:none;background:#2865e8;color:white;padding:16px 14px;border-radius:12px;font-weight:800}
</style>
</head>
<body><main>
<div class="mark" aria-hidden="true">▶</div>
<h1>Your video is ready</h1>
<p>You will continue to the destination in a moment.</p>
<div class="count" id="count" aria-live="polite">3</div>
<a id="play" href="/go/${code}">▶ PLAY VIDEO</a>
<div class="hint">Or tap PLAY VIDEO to continue now.</div>
</main>
<script>
(function(){
  var seconds=3, display=document.getElementById("count");
  var target="/go/${code}";
  var timer=setInterval(function(){
    seconds-=1;
    display.textContent=String(Math.max(seconds,0));
    if(seconds<=0){clearInterval(timer);window.location.assign(target);}
  },1000);
  document.getElementById("play").addEventListener("click",function(){clearInterval(timer);});
})();
</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
      }
    });
  }
};