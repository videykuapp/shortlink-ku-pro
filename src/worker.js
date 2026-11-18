const HTML = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Buat tautan pendek dengan tujuan yang tetap terlihat jelas.">
<title>VLinkGo</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f3f5f9;color:#172033;font:16px Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:22px}
main{width:min(100%,540px);background:#fff;border:1px solid #e5e9f0;border-radius:18px;padding:28px;box-shadow:0 12px 38px #17203312}
h1{margin:0 0 8px;font-size:27px}p{color:#667085;line-height:1.5}.field{display:block;font-weight:700;margin:22px 0 8px}
input{width:100%;padding:15px;border:1px solid #cfd6e2;border-radius:10px;font-size:16px}
button{margin-top:13px;width:100%;padding:15px;border:0;border-radius:10px;background:#2457d6;color:white;font-size:16px;font-weight:700;cursor:pointer}
button:disabled{opacity:.6;cursor:wait}.result{display:none;margin-top:20px;padding:16px;background:#f5f7fb;border-radius:12px;overflow-wrap:anywhere}
.result a{display:block;margin:8px 0;color:#2457d6;font-weight:700}.small{font-size:13px;color:#667085}.error{color:#b42318}.foot{font-size:12px;margin-top:20px}
</style>
</head>
<body><main>
<h1>VLinkGo</h1>
<p>Buat tautan pendek dengan mudah. Alamat tujuan akan ditampilkan agar penerima tahu ke mana tautan mengarah.</p>
<form id="form">
<label class="field" for="destination">Tempel URL tujuan</label>
<input id="destination" type="url" placeholder="https://contoh.com/halaman" required maxlength="2048" autocomplete="url">
<button id="submit" type="submit">Buat Shortlink</button>
</form>
<section class="result" id="result" aria-live="polite">
<strong>Shortlink berhasil dibuat</strong>
<a id="short" href="#" target="_blank" rel="noopener"></a>
<div class="small">Tujuan: <span id="target"></span></div>
<button id="copy" type="button">Salin tautan</button>
</section>
<p class="small foot">Gunakan tautan secara bertanggung jawab. Tautan berbahaya atau menyesatkan dapat dinonaktifkan.</p>
<script>
const form=document.getElementById('form'), input=document.getElementById('destination'), submit=document.getElementById('submit'), result=document.getElementById('result'), short=document.getElementById('short'), target=document.getElementById('target'), copy=document.getElementById('copy');
form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;submit.textContent='Memproses...';result.style.display='none';
try{const res=await fetch('/api/shorten',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:input.value.trim()})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Tidak dapat membuat tautan.');short.href=data.shortUrl;short.textContent=data.shortUrl;target.textContent=data.destination;result.style.display='block';}
catch(err){alert(err.message)}finally{submit.disabled=false;submit.textContent='Buat Shortlink';}});
copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(short.href);copy.textContent='Tersalin!';setTimeout(()=>copy.textContent='Salin tautan',1600)}catch{alert('Salin alamat tautan secara manual.')}});
</script></main></body></html>`;

const BLOCKED_HOSTS = new Set(["localhost","localhost.localdomain"]);
function validateUrl(value) {
  let u;
  try { u = new URL(value); } catch { return null; }
  if (!["http:","https:"].includes(u.protocol)) return null;
  if (u.username || u.password) return null;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g,"");
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) return null;
  return u;
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=UTF-8","cache-control":"no-store","x-content-type-options":"nosniff"}});}
function randomCode(){const bytes=new Uint8Array(7);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("").slice(0,10);}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==="GET" && url.pathname==="/") return new Response(HTML,{headers:{"content-type":"text/html;charset=UTF-8","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
  if(request.method==="POST" && url.pathname==="/api/shorten"){
   let body;try{body=await request.json()}catch{return json({error:"Format permintaan tidak valid."},400)}
   if(typeof body.url!=="string" || body.url.length>2048)return json({error:"URL tidak valid atau terlalu panjang."},400);
   const destination=validateUrl(body.url.trim());if(!destination)return json({error:"Masukkan URL HTTP/HTTPS yang valid dan bukan alamat lokal."},400);
   if(!env.SHORTLINKS)return json({error:"Penyimpanan belum dikonfigurasi. Hubungkan KV namespace SHORTLINKS."},500);
   let code;for(let i=0;i<5;i++){code=randomCode();if(!(await env.SHORTLINKS.get(code)))break;code=null}
   if(!code)return json({error:"Gagal membuat kode. Coba lagi."},503);
   await env.SHORTLINKS.put(code,destination.href);
   return json({code,shortUrl:new URL("/"+code,url.origin).href,destination:destination.href});
  }
  if(request.method==="GET"){
   const code=url.pathname.slice(1);
   if(/^[a-f0-9]{10}$/.test(code) && env.SHORTLINKS){
    const destination=await env.SHORTLINKS.get(code);
    if(destination){return new Response(null,{status:302,headers:{"location":destination,"cache-control":"no-store","referrer-policy":"no-referrer"}})}
   }
  }
  return new Response("Halaman tidak ditemukan.",{status:404,headers:{"content-type":"text/plain;charset=UTF-8"}});
 }
};
