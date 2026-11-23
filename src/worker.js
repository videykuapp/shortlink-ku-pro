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

function randomToken(bytes=32){
 const data=new Uint8Array(bytes);crypto.getRandomValues(data);
 return Array.from(data,b=>b.toString(16).padStart(2,"0")).join("");
}
function isCrawler(request){return /facebookexternalhit|Facebot/i.test(request.headers.get("user-agent")||"");}
function getSession(request){
 const m=(request.headers.get("cookie")||"").match(/(?:^|;\s*)vg_session=([a-f0-9]{32})/i);
 return m?m[1]:null;
}
function cookieHeader(session){return "vg_session="+session+"; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax";}
async function gateRequest(env,path,body){
 if(!env.GATE_TOKENS)throw new Error("GATE_TOKENS binding missing");
 const id=env.GATE_TOKENS.idFromName("vlinkgo-gate:"+body.code);
 return env.GATE_TOKENS.get(id).fetch("https://gate.internal"+path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
}
async function handleGateStart(request,env,code){
 let session=getSession(request),fresh=false;if(!session){session=randomToken(16);fresh=true;}
 const challenge=randomToken(24);
 const r=await gateRequest(env,"/start",{challenge,code,session,now:Date.now()});
 if(!r.ok)return json({error:"Tidak dapat memulai pemeriksaan."},503);
 const headers=new Headers({"content-type":"application/json;charset=UTF-8","cache-control":"no-store"});
 if(fresh)headers.set("set-cookie",cookieHeader(session));
 return new Response(JSON.stringify({challenge}),{headers});
}
async function handleGateIssue(request,env,code){
 const session=getSession(request);if(!session)return json({error:"Sesi tidak ditemukan. Muat ulang halaman."},401);
 let body;try{body=await request.json()}catch{return json({error:"Permintaan tidak valid."},400)}
 if(typeof body.challenge!=="string"||!/^[a-f0-9]{48}$/.test(body.challenge))return json({error:"Tantangan tidak valid."},400);
 const r=await gateRequest(env,"/issue",{challenge:body.challenge,code,session,now:Date.now()});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)return json({error:d.error||"Pemeriksaan belum selesai."},r.status);
 return json({token:d.token});
}
function interstitialHtml(code){
 const c=JSON.stringify(code);
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Your video is ready</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:22px;background:#101827;color:#f8fafc;font:16px Arial,sans-serif}main{width:min(100%,430px);padding:30px 24px;text-align:center;border:1px solid #26364d;border-radius:20px;background:#172337;box-shadow:0 18px 60px #0005}.mark{font-size:42px;margin-bottom:12px}h1{font-size:25px;margin:0 0 10px}p{color:#b7c4d6;line-height:1.5;margin:0 0 24px}button{width:100%;padding:17px;border:0;border-radius:12px;background:#2878f0;color:#fff;font-size:17px;font-weight:700;cursor:pointer;touch-action:manipulation}button:disabled{opacity:.55;cursor:not-allowed}.hint{font-size:13px;margin-top:15px;color:#9aabc1;min-height:18px}</style></head><body><main><div class="mark">▶</div><h1>Your video is ready</h1><p id="message">Please wait while we prepare your video.</p><button id="play" type="button" disabled>PLEASE WAIT…</button><div class="hint" id="hint">The button will be ready in 3 seconds.</div></main><script>const code='+c+',button=document.getElementById("play"),message=document.getElementById("message"),hint=document.getElementById("hint");let challenge=null,ready=false,holding=false,holdTimer=null;(async()=>{try{const r=await fetch("/__gate/start/"+code,{method:"POST",credentials:"same-origin"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not start.");challenge=d.challenge;let n=3;const tick=()=>{if(n>0){hint.textContent="Button ready in "+n+"…";n--;setTimeout(tick,1000)}else{ready=true;button.disabled=false;button.textContent="▶ PLAY VIDEO";hint.textContent="Press and hold the button briefly to continue."}};tick()}catch(e){message.textContent="Unable to prepare the video. Please reload this page.";hint.textContent=e.message}})();async function proceed(){if(!ready||!challenge)return;button.disabled=true;button.textContent="PLEASE WAIT…";hint.textContent="Verifying…";try{const r=await fetch("/__gate/issue/"+code,{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({challenge})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Verification failed.");location.replace("/go/"+code+"?token="+encodeURIComponent(d.token))}catch(e){button.disabled=false;button.textContent="▶ PLAY VIDEO";hint.textContent=e.message}}function down(e){if(!ready||button.disabled)return;e.preventDefault();holding=true;button.textContent="HOLD…";holdTimer=setTimeout(()=>{if(holding)proceed()},1000)}function up(){holding=false;if(holdTimer)clearTimeout(holdTimer);if(ready&&!button.disabled)button.textContent="▶ PLAY VIDEO"}button.addEventListener("pointerdown",down);button.addEventListener("pointerup",up);button.addEventListener("pointerleave",up);button.addEventListener("pointercancel",up);</script></body></html>';
}
export class OneTimeGate {
 constructor(state,env){this.state=state;this.env=env;}
 async fetch(request){
  const url=new URL(request.url);if(request.method!=="POST")return json({error:"Method not allowed."},405);
  let body;try{body=await request.json()}catch{return json({error:"Invalid JSON."},400)}
  if(url.pathname==="/start"){
   if(!/^[a-f0-9]{48}$/.test(body.challenge||"")||!/^[a-f0-9]{10}$/.test(body.code||"")||!/^[a-f0-9]{32}$/.test(body.session||""))return json({error:"Invalid challenge."},400);
   const now=Number(body.now)||Date.now();await this.state.storage.put("challenge:"+body.challenge,{code:body.code,session:body.session,createdAt:now,expiresAt:now+60000});return json({ok:true});
  }
  if(url.pathname==="/issue"){
   const result=await this.state.storage.transaction(async()=>{
    const key="challenge:"+body.challenge,record=await this.state.storage.get(key),now=Number(body.now)||Date.now();
    if(!record||record.code!==body.code||record.session!==body.session||record.expiresAt<now)return {error:"Challenge expired. Reload the page."};
    if(now-record.createdAt<3900)return {error:"Please wait and hold the button."};
    await this.state.storage.delete(key);const token=randomToken(32);await this.state.storage.put("token:"+token,{code:body.code,session:body.session,expiresAt:now+60000});return {token};
   });
   return result.error?json({error:result.error},403):json({token:result.token});
  }
  if(url.pathname==="/consume"){
   const valid=await this.state.storage.transaction(async()=>{
    const key="token:"+body.token,record=await this.state.storage.get(key),now=Number(body.now)||Date.now();
    if(!record||record.code!==body.code||record.session!==body.session||record.expiresAt<now)return false;
    await this.state.storage.delete(key);return true;
   });return json({valid});
  }
  return json({error:"Not found."},404);
 }
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==="GET"&&url.pathname==="/__migrate-ui")return new Response(MIGRATION_HTML,{headers:{"content-type":"text/html;charset=UTF-8","cache-control":"no-store","referrer-policy":"no-referrer","content-security-policy":"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
  if(request.method==="POST"&&url.pathname==="/__audit"){
   if(!env.MIGRATION_SECRET||request.headers.get("authorization")!=="Bearer "+env.MIGRATION_SECRET)return json({error:"Tidak diizinkan."},401);
   if(!env.OLD_CF_API_TOKEN||!env.SHORTLINKS)return json({error:"Secret token lama atau binding KV belum dikonfigurasi."},500);
   let body;try{body=await request.json()}catch{return json({error:"Permintaan tidak valid."},400)}
   if(!env.OLD_CF_ACCOUNT_ID||!env.OLD_CF_NAMESPACE_ID)return json({error:"OLD_CF_ACCOUNT_ID atau OLD_CF_NAMESPACE_ID belum dikonfigurasi."},500);
   const apiBase="https://api.cloudflare.com/client/v4/accounts/"+encodeURIComponent(env.OLD_CF_ACCOUNT_ID)+"/storage/kv/namespaces/"+encodeURIComponent(env.OLD_CF_NAMESPACE_ID),params=new URLSearchParams({limit:"20"});
   if(typeof body.cursor==="string"&&body.cursor)params.set("cursor",body.cursor);
   const listRes=await fetch(apiBase+"/keys?"+params.toString(),{headers:{"authorization":"Bearer "+env.OLD_CF_API_TOKEN}});
   if(!listRes.ok)return json({error:"Gagal membaca daftar KV lama (HTTP "+listRes.status+")."},502);
   const listData=await listRes.json();if(!listData.success||!Array.isArray(listData.result))return json({error:"Respons daftar KV lama tidak valid."},502);
   let matched=0,missing=0,mismatch=0;
   for(const item of listData.result){const valueRes=await fetch(apiBase+"/values/"+encodeURIComponent(item.name),{headers:{"authorization":"Bearer "+env.OLD_CF_API_TOKEN}});if(!valueRes.ok)return json({error:"Gagal membaca nilai KV lama (HTTP "+valueRes.status+")."},502);const oldValue=await valueRes.text(),newValue=await env.SHORTLINKS.get(item.name);if(newValue===null)missing++;else if(newValue!==oldValue)mismatch++;else matched++;}
   const nextCursor=listData.result_info&&listData.result_info.cursor?listData.result_info.cursor:null;return json({checked:listData.result.length,matched,missing,mismatch,done:!nextCursor,cursor:nextCursor});
  }
  if(request.method==="POST"&&url.pathname==="/__migrate"){
   if(!env.MIGRATION_SECRET||request.headers.get("authorization")!=="Bearer "+env.MIGRATION_SECRET)return json({error:"Tidak diizinkan."},401);
   if(!env.OLD_CF_API_TOKEN||!env.SHORTLINKS)return json({error:"Secret token lama atau binding KV belum dikonfigurasi."},500);
   let body;try{body=await request.json()}catch{return json({error:"Permintaan tidak valid."},400)}
   if(!env.OLD_CF_ACCOUNT_ID||!env.OLD_CF_NAMESPACE_ID)return json({error:"OLD_CF_ACCOUNT_ID atau OLD_CF_NAMESPACE_ID belum dikonfigurasi."},500);
   const apiBase="https://api.cloudflare.com/client/v4/accounts/"+encodeURIComponent(env.OLD_CF_ACCOUNT_ID)+"/storage/kv/namespaces/"+encodeURIComponent(env.OLD_CF_NAMESPACE_ID),params=new URLSearchParams({limit:"20"});
   if(typeof body.cursor==="string"&&body.cursor)params.set("cursor",body.cursor);
   const listRes=await fetch(apiBase+"/keys?"+params.toString(),{headers:{"authorization":"Bearer "+env.OLD_CF_API_TOKEN}});
   if(!listRes.ok)return json({error:"Gagal membaca daftar KV lama (HTTP "+listRes.status+")."},502);
   const listData=await listRes.json();if(!listData.success||!Array.isArray(listData.result))return json({error:"Respons daftar KV lama tidak valid."},502);
   const values=[];for(const item of listData.result){const valueRes=await fetch(apiBase+"/values/"+encodeURIComponent(item.name),{headers:{"authorization":"Bearer "+env.OLD_CF_API_TOKEN}});if(!valueRes.ok)return json({error:"Gagal membaca salah satu data KV (HTTP "+valueRes.status+")."},502);values.push({key:item.name,value:await valueRes.text()});}
   let copied=0,alreadyPresent=0;for(const item of values){const existing=await env.SHORTLINKS.get(item.key);if(existing!==null){if(existing!==item.value)return json({error:"Ada kode yang sudah terpakai dengan tujuan berbeda. Tidak ada data lama yang ditimpa; hentikan dan periksa konflik."},409);alreadyPresent++;}else{await env.SHORTLINKS.put(item.key,item.value);copied++;}}
   const nextCursor=listData.result_info&&listData.result_info.cursor?listData.result_info.cursor:null;return json({copied,alreadyPresent,done:!nextCursor,cursor:nextCursor});
  }
  const start=url.pathname.match(/^\/__gate\/start\/([a-f0-9]{10})$/),issue=url.pathname.match(/^\/__gate\/issue\/([a-f0-9]{10})$/);
  if(request.method==="POST"&&start){if(isCrawler(request))return new Response(null,{status:204});try{return await handleGateStart(request,env,start[1]);}catch{return json({error:"Gate service unavailable."},503);}}
  if(request.method==="POST"&&issue){if(isCrawler(request))return new Response(null,{status:204});try{return await handleGateIssue(request,env,issue[1]);}catch{return json({error:"Gate service unavailable."},503);}}
  if(request.method==="GET"&&url.pathname==="/")return new Response(HTML,{headers:{"content-type":"text/html;charset=UTF-8","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
  if(request.method==="POST"&&url.pathname==="/api/shorten"){
   let body;try{body=await request.json()}catch{return json({error:"Format permintaan tidak valid."},400)}
   if(typeof body.url!=="string"||body.url.length>2048)return json({error:"URL tidak valid atau terlalu panjang."},400);
   const destination=validateUrl(body.url.trim());if(!destination)return json({error:"Masukkan URL HTTP/HTTPS yang valid dan bukan alamat lokal."},400);
   if(!env.SHORTLINKS)return json({error:"Penyimpanan belum dikonfigurasi. Hubungkan KV namespace SHORTLINKS."},500);
   let code;for(let i=0;i<5;i++){code=randomCode();if(!(await env.SHORTLINKS.get(code)))break;code=null;}
   if(!code)return json({error:"Gagal membuat kode. Coba lagi."},503);
   await env.SHORTLINKS.put(code,destination.href);return json({code,shortUrl:new URL("/"+code,url.origin).href,destination:destination.href});
  }
  if(request.method==="GET"){
   const gm=url.pathname.match(/^\/go\/([a-f0-9]{10})$/);
   if(gm){
    const code=gm[1];if(isCrawler(request))return new Response(null,{status:204,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
    const session=getSession(request),token=url.searchParams.get("token");
    if(!session||!token||!/^[a-f0-9]{64}$/.test(token))return Response.redirect(new URL("/"+code,url.origin),303);
    const destination=await env.SHORTLINKS?.get(code);if(!destination)return new Response("Tautan tidak ditemukan.",{status:404});
    try{const r=await gateRequest(env,"/consume",{token,code,session,now:Date.now()}),d=await r.json();if(!r.ok||!d.valid)return Response.redirect(new URL("/"+code,url.origin),303);}
    catch{return new Response("Layanan verifikasi sedang tidak tersedia.",{status:503});}
    return new Response(null,{status:302,headers:{"location":destination,"cache-control":"no-store","referrer-policy":"no-referrer"}});
   }
   const code=url.pathname.slice(1);
   if(/^[a-f0-9]{10}$/.test(code)&&env.SHORTLINKS){
    const destination=await env.SHORTLINKS.get(code);if(destination){
     if(isCrawler(request))return new Response(null,{status:204,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
     const headers=new Headers({"content-type":"text/html;charset=UTF-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"});
     if(!getSession(request))headers.set("set-cookie",cookieHeader(randomToken(16)));
     return new Response(interstitialHtml(code),{headers});
    }
   }
  }
  return new Response("Halaman tidak ditemukan.",{status:404,headers:{"content-type":"text/plain;charset=UTF-8"}});
 }
};
