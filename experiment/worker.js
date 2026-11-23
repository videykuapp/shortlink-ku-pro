export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Create new shortlinks on this domain only; existing KV entries are never modified.
    if (request.method === "POST" && url.pathname === "/api/shorten") {
      let body;
      try { body = await request.json(); } catch {
        return Response.json({ error: "Invalid request." }, { status: 400 });
      }
      if (typeof body.url !== "string" || body.url.length > 2048) {
        return Response.json({ error: "Enter a valid URL." }, { status: 400 });
      }
      let destination;
      try { destination = new URL(body.url.trim()); } catch {
        return Response.json({ error: "Enter a valid URL." }, { status: 400 });
      }
      if (!["http:", "https:"].includes(destination.protocol) || destination.username || destination.password) {
        return Response.json({ error: "Only valid HTTP or HTTPS URLs are allowed." }, { status: 400 });
      }
      const host = destination.hostname.toLowerCase().replace(/^\\[|\\]$/g, "");
      if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
          host.endsWith(".internal") || /^(127\\.|10\\.|192\\.168\\.|169\\.254\\.)/.test(host) ||
          /^172\\.(1[6-9]|2\\d|3[01])\\./.test(host) || host === "::1" ||
          host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) {
        return Response.json({ error: "That destination address is not allowed." }, { status: 400 });
      }
      if (!env.SHORTLINKS) {
        return Response.json({ error: "Shortlink storage is not configured." }, { status: 500 });
      }

      let code = null;
      for (let i = 0; i < 5; i++) {
        const bytes = new Uint8Array(7);
        crypto.getRandomValues(bytes);
        const candidate = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").slice(0, 10);
        if ((await env.SHORTLINKS.get(candidate)) === null) {
          code = candidate;
          break;
        }
      }
      if (!code) return Response.json({ error: "Could not create a unique code. Please try again." }, { status: 503 });

      await env.SHORTLINKS.put(code, destination.href);
      return Response.json({
        code,
        shortUrl: new URL("/" + code, url.origin).href,
        destination: destination.href
      }, { headers: { "cache-control": "no-store" } });
    }

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
      if (url.pathname === "/") {
        const home = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>VLinkGo</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:24px;display:grid;place-items:center;background:#0d111b;color:#f7f8fc;font-family:Arial,sans-serif}
main{width:min(100%,480px);padding:30px 24px;border:1px solid #283247;border-radius:20px;background:#151d2c;box-shadow:0 18px 60px #0006}
h1{font-size:25px;margin:0 0 10px}p{color:#aeb9cb;line-height:1.55}
label{display:block;margin:22px 0 8px;font-weight:700}input{width:100%;padding:15px;border:1px solid #39465d;border-radius:10px;background:#0d1523;color:#fff;font-size:16px}
button{width:100%;margin-top:13px;padding:15px;border:0;border-radius:10px;background:#2865e8;color:white;font-size:16px;font-weight:800;cursor:pointer}
button:disabled{opacity:.6}.result{display:none;margin-top:20px;padding:16px;background:#0d1523;border-radius:12px;overflow-wrap:anywhere}.result a{color:#8db5ff;font-weight:700}
.small{font-size:13px;color:#8492a8}
</style>
</head>
<body><main>
<h1>Create your video link</h1>
<p>Paste your destination URL to create a new VLinkGo shortlink.</p>
<form id="form">
<label for="destination">Destination URL</label>
<input id="destination" type="url" placeholder="https://example.com/video" required maxlength="2048" autocomplete="url">
<button id="submit" type="submit">Create shortlink</button>
</form>
<section class="result" id="result" aria-live="polite">
<strong>Your shortlink is ready</strong>
<p><a id="short" href="#" target="_blank" rel="noopener"></a></p>
<p class="small">Destination: <span id="target"></span></p>
<button id="copy" type="button">Copy link</button>
</section>
<p class="small">Share responsibly. Only shorten links you have permission to share.</p>
<script>
const form=document.getElementById('form'),input=document.getElementById('destination'),submit=document.getElementById('submit'),result=document.getElementById('result'),short=document.getElementById('short'),target=document.getElementById('target'),copy=document.getElementById('copy');
form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;submit.textContent='Creating...';result.style.display='none';
try{const res=await fetch('/api/shorten',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:input.value.trim()})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not create link.');short.href=data.shortUrl;short.textContent=data.shortUrl;target.textContent=data.destination;result.style.display='block';}
catch(err){alert(err.message)}finally{submit.disabled=false;submit.textContent='Create shortlink';}});
copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(short.href);copy.textContent='Copied!';}catch{alert('Please copy the link manually.')}});
</script></main></body></html>`;
        return new Response(home, {
          headers: {
            "content-type": "text/html; charset=UTF-8",
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
            "referrer-policy": "no-referrer",
            "content-security-policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
          }
        });
      }
      return new Response("VLinkGo page not found", { status: 404 });
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