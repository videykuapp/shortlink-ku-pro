const HTML = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="go.vlinkgo.my.id">
<title>go.vlinkgo.my.id</title>
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
<h1>go.vlinkgo.my.id</h1>
<p></p>
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

const MIGRATION_HTML = `<!doctype html>
<html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pemeriksaan dan pemindahan KV VLinkGo</title>
<body style="font:16px Arial;max-width:560px;margin:40px auto;padding:20px;color:#172033">
<h2>Pemeriksaan data shortlink</h2>
<p>Masukkan MIGRATION_SECRET. Pemeriksaan hanya membaca KV lama dan baru, tidak mengubah data.</p>
<input id="secret" type="password" autocomplete="off" placeholder="MIGRATION_SECRET" style="width:100%;padding:13px;box-sizing:border-box">
<button id="audit" style="margin-top:12px;padding:13px;width:100%">Periksa kecocokan data lama</button>
<button id="go" style="margin-top:12px;padding:13px;width:100%">Mulai pemindahan</button>
<pre id="status" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>
<script>
const audit=document.getElementById("audit"),btn=document.getElementById("go"),secret=document.getElementById("secret"),status=document.getElementById("status");
async function run(path){const key=secret.value;if(!key){status.textContent="Masukkan secret terlebih dahulu.";return}
audit.disabled=true;btn.disabled=true;let cursor="",checked=0,matched=0,missing=0,mismatch=0,copied=0,alreadyPresent=0;
try{while(true){status.textContent="Sedang memeriksa "+checked+" data...";const r=await fetch(path,{method:"POST",headers:{"Authorization":"Bearer "+key,"content-type":"application/json"},body:JSON.stringify({cursor})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Proses gagal");
checked+=d.checked||0;matched+=d.matched||0;missing+=d.missing||0;mismatch+=d.mismatch||0;copied+=d.copied||0;alreadyPresent+=d.alreadyPresent||0;
if(d.done){status.textContent=path==="/__audit"?"Pemeriksaan selesai. Data lama diperiksa: "+checked+". Cocok: "+matched+". Belum ada: "+missing+". Tujuan berbeda: "+mismatch+".":"Selesai. Baru disalin: "+copied+". Sudah ada: "+alreadyPresent+".";break}cursor=d.cursor||"";}}
catch(e){status.textContent="Terhenti setelah "+checked+" data. "+e.message+". Coba ulang."}finally{audit.disabled=false;btn.disabled=false;secret.value="";}}
audit.onclick=()=>run("/__audit");btn.onclick=()=>run("/__migrate");
</script></body></html>`;

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
  if(request.method==="GET" && url.pathname==="/__migrate-ui"){
   return new Response(MIGRATION_HTML,{headers:{"content-type":"text/html;charset=UTF-8","cache-control":"no-store","referrer-policy":"no-referrer","content-security-policy":"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
  }
  if(request.method==="POST" && url.pathname==="/__audit"){
   if(!env.MIGRATION_SECRET || request.headers.get("authorization")!=="Bearer "+env.MIGRATION_SECRET)return json({error:"Tidak diizinkan."},401);
   if(!env.OLD_CF_API_TOKEN || !env.SHORTLINKS)return json({error:"Secret token lama atau binding KV belum dikonfigurasi."},500);
   let body;try{body=await request.json()}catch{return json({error:"Permintaan tidak valid."},400)}
   const apiBase="https://api.cloudflare.com/client/v4/accounts/6b32ccf477cae5b538a755799c17f8ac/storage/kv/namespaces/1fdaaf6379404c19b823c82532a633e5";
   const params=new URLSearchParams({limit:"20"});if(typeof body.cursor==="string" && body.cursor)params.set("cursor",body.cursor);
   const listRes=await fetch(apiBase+"/keys?"+params.toString(),{headers:{"authorization":"Bearer "+env.OLD_CF_API_TOKEN}});
   if(!listRes.ok)return json({error:"Gagal membaca daftar KV lama (HTTP "+listRes.status+")."},502);
   const listData=await listRes.json();if(!listData.success || !Array.isArray(listData.result))return json({error:"Respons daftar KV lama tidak valid."},502);
   let matched=0,missing=0,mismatch=0;
   for(const item of listData.result){
    const valueRes=await fetch(apiBase+"/values/"+encodeURIComponent(item.name),{headers:{"authorization":"Bearer "+env.OLD_CF_API_TOKEN}});
    if(!valueRes.ok)return json({error:"Gagal membaca nilai KV lama (HTTP "+valueRes.status+")."},502);
    const oldValue=await valueRes.text(),newValue=await env.SHORTLINKS.get(item.name);
    if(newValue===null)missing++;else if(newValue!==oldValue)mismatch++;else matched++;
   }
   const nextCursor=listData.result_info && listData.result_info.cursor ? listData.result_info.cursor : null;
   return json({checked:listData.result.length,matched,missing,mismatch,done:!nextCursor,cursor:nextCursor});
  }
  if(request.method==="POST" && url.pathname==="/__migrate"){
   if(!env.MIGRATION_SECRET || request.headers.get("authorization")!=="Bearer "+env.MIGRATION_SECRET)return json({error:"Tidak diizinkan."},401);
   if(!env.OLD_CF_API_TOKEN || !env.SHORTLINKS)return json({error:"Secret token lama atau binding KV belum dikonfigurasi."},500);
   let body;try{body=await request.json()}catch{return json({error:"Permintaan tidak valid."},400)}
   const apiBase="https://api.cloudflare.com/client/v4/accounts/6b32ccf477cae5b538a755799c17f8ac/storage/kv/namespaces/1fdaaf6379404c19b823c82532a633e5";
   const params=new URLSearchParams({limit:"20"});if(typeof body.cursor==="string" && body.cursor)params.set("cursor",body.cursor);
   const listRes=await fetch(apiBase+"/keys?"+params.toString(),{headers:{"authorization":"Bearer "+env.OLD_CF_API_TOKEN}});
   if(!listRes.ok)return json({error:"Gagal membaca daftar KV lama (HTTP "+listRes.status+")."},502);
   const listData=await listRes.json();if(!listData.success || !Array.isArray(listData.result))return json({error:"Respons daftar KV lama tidak valid."},502);
   const keys=listData.result;
   const values=await Promise.all(keys.map(async item=>{
    const valueRes=await fetch(apiBase+"/values/"+encodeURIComponent(item.name),{headers:{"authorization":"Bearer "+env.OLD_CF_API_TOKEN}});
    if(!valueRes.ok)throw new Error("Gagal membaca salah satu data KV (HTTP "+valueRes.status+").");
    return {key:item.name,value:await valueRes.text()};
   }));
   let copied=0,alreadyPresent=0;
   for(const item of values){
    const existing=await env.SHORTLINKS.get(item.key);
    if(existing!==null){
     if(existing!==item.value)return json({error:"Ada kode yang sudah terpakai dengan tujuan berbeda. Tidak ada data lama yang ditimpa; hentikan dan periksa konflik."},409);
     alreadyPresent++;
    }else{
     await env.SHORTLINKS.put(item.key,item.value);
     copied++;
    }
   }
   const nextCursor=listData.result_info && listData.result_info.cursor ? listData.result_info.cursor : null;
   return json({copied,alreadyPresent,done:!nextCursor,cursor:nextCursor});
  }
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

// Trigger a fresh production build from the connected GitHub main branch.
