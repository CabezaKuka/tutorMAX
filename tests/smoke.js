// Prueba de humo: abre la app en Chromium sin pantalla, valida el contenido,
// recorre todas las sesiones y ejercicios y revisa que nada se desborde en el celular.
// Uso: npm test   (o: node tests/smoke.js). Levanta un servidor local propio.
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const http=require('http');
const ROOT=path.join(__dirname,'..');
// Servidor local mínimo (el service worker y las fuentes necesitan http)
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2'};
let swExtra='';
// Tutor: la función real de Netlify, contra una API de Anthropic simulada
const seen=[];const mock=http.createServer((q,r)=>{let d='';q.on('data',c=>d+=c);q.on('end',()=>{seen.push({url:q.url,h:q.headers,b:JSON.parse(d||'{}')});
 r.writeHead(200,{'Content-Type':'application/json'});r.end(JSON.stringify({id:'msg_1',type:'message',role:'assistant',model:'claude-opus-5-5',content:[{type:'text',text:'Respuesta de prueba: el V de G mayor es D.'}],stop_reason:'end_turn',stop_sequence:null,usage:{input_tokens:1,output_tokens:1}}))})});
let tutorFn=null;
const srv=http.createServer(async(q,r)=>{if(q.url.startsWith('/api/tutor')){if(!tutorFn){r.writeHead(404);return r.end()}
 let d='';for await(const c of q)d+=c;const res=await tutorFn(new Request('http://x'+q.url,{method:q.method,headers:q.headers,body:q.method=='POST'?d:undefined}),{ip:'127.0.0.1'});
 r.writeHead(res.status,{'Content-Type':'application/json'});return r.end(await res.text())}
 let f=decodeURIComponent(q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';const fp=path.join(ROOT,path.normalize(f));
 if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.writeHead(404);return r.end()}
 let body=fs.readFileSync(fp);if(f=='/sw.js')body=Buffer.concat([body,Buffer.from(swExtra)]);
 r.writeHead(200,{'Content-Type':TYPES[path.extname(fp)]||'application/octet-stream','Cache-Control':'no-cache'});r.end(body)});
const fails=[];const fail=m=>{fails.push(m);console.log('  ✕ '+m)};
const ok=m=>console.log('  ✓ '+m);

(async()=>{
await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));await new Promise(ok=>mock.listen(0,'127.0.0.1',ok));
Object.assign(process.env,{ANTHROPIC_API_KEY:'clave-de-prueba',ANTHROPIC_BASE_URL:`http://127.0.0.1:${mock.address().port}`,TUTOR_CLAVE:'guitarra'});
tutorFn=(await import(require('url').pathToFileURL(path.join(ROOT,'netlify/functions/tutor.mjs')))).default;const URL=`http://127.0.0.1:${srv.address().port}/`;
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await b.newContext({viewport:{width:360,height:740}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()=='error'&&!/Failed to load resource|net::/.test(m.text()))errs.push(m.text())});
await p.goto(URL);await p.waitForFunction(()=>typeof A=='object');

console.log('Contenido');
const v=await p.evaluate(()=>{const out=[];
 for(const [k,l] of Object.entries(LX)){['n','p','k','e','x','m','r','q'].forEach(f=>{if(!l[f])out.push(`lección ${k}: falta "${f}"`)});
  (l.q||[]).forEach((q,i)=>{if(!(q[2]>=0&&q[2]<q[1].length))out.push(`lección ${k}, pregunta ${i+1}: respuesta fuera de rango`);if(new Set(q[1]).size!=q[1].length)out.push(`lección ${k}, pregunta ${i+1}: opciones repetidas`)})}
 for(let w=1;w<=12;w++)for(let s=1;s<=5;s++)if(!LX[w+'.'+s])out.push('falta la lección '+w+'.'+s);
 const keep=JSON.stringify(S);S.w=12;S.s=5;S.cfg.lv='all';let n=0;
 for(const d of Object.keys(DN))for(let i=0;i<300;i++){let q;try{q=genQ(d)}catch(e){out.push(`genQ(${d}) falla: ${e.message}`);break}n++;
  if(new Set(q.o).size!=q.o.length)out.push(`genQ(${d}) opciones repetidas: ${q.t}`);
  if(!(q.a>=0&&q.a<q.o.length))out.push(`genQ(${d}) respuesta fuera de rango`);
  (q.play||[]).forEach(c=>{if(c[0]!='~'&&c!='_'&&!parse(c))out.push(`genQ(${d}) acorde ilegible: ${c}`)})}
 S=JSON.parse(keep);return{out:[...new Set(out)],n,lx:Object.keys(LX).length}});
v.out.length?v.out.slice(0,30).forEach(fail):ok(`${v.lx} lecciones y ${v.n} preguntas generadas sin problemas`);

console.log('Versión');
const swv=(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8').match(/guitarra12-v(\d+)/)||[])[1];
const apv=await p.evaluate(()=>typeof VER!='undefined'?String(VER):null);
swv&&swv==apv?ok('sw.js y app.js dicen v'+swv):fail(`la versión no coincide: sw.js=${swv} app.js=${apv}`);

console.log('Recorrido');
const over=async n=>{const o=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>0)fail(`${n}: la página se desborda ${o}px a 360px de ancho`)};
for(const t of ['est','pra','exp','prog','cfg']){await p.evaluate(t=>A.tab(t),t);await over('pestaña '+t)}
for(const e of await p.evaluate(()=>Object.keys(DGT))){await p.evaluate(e=>{A.tab('exp');A.exd(e)},e);await over('mapa '+e)}
await p.evaluate(()=>A.home());await p.click('.card [data-a=cont]');
for(let i=0;i<12;i++){await p.click('[data-a=qa][data-v="0"]');await p.click('[data-a=qn]')}
await p.click('[data-a=st0]');let ns=0;
for(let w=1;w<=12;w++)for(const s of await p.evaluate(w=>sOrd(w),w)){ns++;await p.evaluate(([w,s])=>A.gs(w+':'+s),[w,s]);
 const n=await p.evaluate(()=>steps().length);
 for(let i=0;i<n;i++){await p.evaluate(i=>A.go(i),i);await over(`sesión ${w}.${s} paso ${i+1}`);
  while(await p.$('[data-a=lq]')){await p.click('[data-a=lq] >> nth=0');const q=await p.$('[data-a=qnext]');if(q)await q.click();else break}}
 await p.evaluate(()=>{A.go(steps().length-1)});if(await p.$('[data-a=rate]')){await p.click('[data-a=rate][data-v="3"]');await p.fill('#so','Canción de prueba');await p.click('[data-a=fin]')}}
ok(ns+' sesiones recorridas');
for(const d of await p.evaluate(()=>Object.keys(DN))){await p.evaluate(d=>{A.tab('pra');A.dstart(d)},d);for(let i=0;i<10;i++){await p.click('[data-a=qa][data-v="1"]');await p.click('[data-a=qn]')}await over('resultado '+d);await p.evaluate(()=>A.qexit())}
ok('ejercicios de Practicar completos');
await p.evaluate(()=>{A.tab('prog')});await over('progreso con datos');

console.log('Respaldo');
await p.evaluate(()=>A.tab('cfg'));const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-a=bkdl]')]);
const bk=fs.readFileSync(await dl.path(),'utf8'),nl=JSON.parse(bk).logs.length;
nl>0?ok(`archivo de respaldo (${dl.suggestedFilename()}, ${nl} sesiones)`):fail('el archivo de respaldo está vacío');
await p.evaluate(()=>A.wp()||A.wp());await p.evaluate(()=>A.tab('cfg'));
await p.setInputFiles('#bkf',{name:'r.json',mimeType:'application/json',buffer:Buffer.from(bk)});await p.waitForTimeout(300);
(await p.evaluate(()=>S.logs.length))==nl?ok('abrir el archivo restaura el progreso'):fail('importar el archivo no restauró el progreso');
const bad=await p.evaluate(()=>{const keep=JSON.stringify(S);const o=JSON.parse(keep);o.w=13;o.s=9;o.t4=[{d:'x',w:1,a:1,n:2,c:'<img src=x onerror=alert(1)>'}];
 localStorage.setItem('gtr12',JSON.stringify(o));return keep});
await p.reload();await p.waitForFunction(()=>typeof A=='object');
const st=await p.evaluate(()=>{A.tab('prog');return{w:S.w,s:S.s,img:!!document.querySelector('#app img')}});
st.w>=0&&st.w<=12?ok('un respaldo con semana inválida no rompe la app'):fail('semana inválida aceptada: '+st.w);
st.img?fail('texto importado se muestra sin escapar'):ok('texto importado escapado');
await p.evaluate(k=>localStorage.setItem('gtr12',k),bad);

console.log('Accesibilidad');
await p.reload();await p.waitForFunction(()=>typeof A=='object');
await p.evaluate(()=>A.tab('cfg'));await p.focus('[data-a=cfg][data-v="fs:1"]');await p.keyboard.press('Enter');
const f=await p.evaluate(()=>{const e=document.activeElement;return e&&e.dataset?e.dataset.v:null});
f=='fs:1'?ok('el foco se conserva después de redibujar'):fail('el foco se pierde al redibujar (quedó en '+f+')');

console.log('Sin conexión y versión nueva');
await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
await ctx.setOffline(true);await p.reload();const off=await p.evaluate(()=>typeof A=='object'&&!!document.querySelector('#app').children.length);
off?ok('la app abre sin conexión'):fail('la app no abre sin conexión');await ctx.setOffline(false);
swExtra='\n// cambio de prueba';await p.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r.update()));
try{await p.waitForSelector('#upd [data-a=upd]',{timeout:8000});ok('aparece el aviso de versión nueva');
 await Promise.all([p.waitForEvent('load',{timeout:8000}),p.click('#upd [data-a=upd]')]);ok('“Actualizar” recarga con la versión nueva')}catch(e){fail('aviso de versión nueva: '+e.message.split('\n')[0])}
console.log('Tutor');
await p.evaluate(()=>A.tab('tut'));await p.waitForSelector('#tq');
await p.fill('#tcl','otra');await p.fill('#tq','¿Cuál es el V de G mayor?');await p.click('[data-a=ask]');
await p.waitForFunction(()=>TC.length&&TC[TC.length-1][1]!='Pensando…');
(await p.evaluate(()=>TC[TC.length-1][1])).includes('clave')?ok('con la clave incorrecta no responde'):fail('el tutor respondió sin la clave correcta');
await p.fill('#tcl','guitarra');await p.fill('#tq','¿Cuál es el V de G mayor?');await p.click('[data-a=ask]');
await p.waitForFunction(()=>TC[TC.length-1][1]!='Pensando…');const ans=await p.evaluate(()=>TC[TC.length-1][1]),call=seen[seen.length-1]||{b:{},h:{}};
ans.includes('Respuesta de prueba')?ok('el tutor responde a través de la función de Netlify'):fail('respuesta del tutor: '+ans);
call.b.model=='claude-opus-5-5'&&call.b.fallbacks=='default'&&String(call.h['anthropic-beta']).includes('server-side-fallback-2026-07-01')&&/Pregunta del alumno: ¿Cuál es el V/.test(JSON.stringify(call.b.messages))&&!String(call.h['x-api-key']).includes('undefined')?ok('pedido a la API correcto (modelo, respaldo, contexto)'):fail('pedido a la API: '+JSON.stringify(call.b).slice(0,300));
const lim=[];for(let i=0;i<40;i++)lim.push((await tutorFn(new Request('http://x/api/tutor',{method:'POST',headers:{'x-tutor-clave':'guitarra'},body:'{"pregunta":"hola"}'}),{ip:'9.9.9.9'})).status);
lim.includes(429)?ok('límite de preguntas por hora'):fail('no hay límite de preguntas');

console.log('Micrófono');
// Detección de altura con señales sintéticas tipo guitarra (E2 a E5, ±20 cents)
const pe=await p.evaluate(()=>{const out=[];for(const sr of [44100,48000])for(let m=40;m<=76;m++)for(const det of [0,-20,20]){const f=440*2**((m-69+det/100)/12),b=new Float32Array(2048);
 for(let i=0;i<2048;i++){let x=0;for(let h=1;h<=8;h++)x+=(h==1&&m<48?.4:1)/h*Math.sin(2*Math.PI*f*h*i/sr+h);b[i]=.2*x+.01*(Math.random()-.5)}
 const g=pitchOf(b,sr),gm=g>0?69+12*Math.log2(g/440):0;if(Math.abs(gm-m-det/100)>.06)out.push(`${m}${det>0?'+':''}${det||''}c → ${gm.toFixed(2)}`)}
 if(pitchOf(new Float32Array(2048),48000)>0)out.push('detecta algo en el silencio');return out});
pe.length?fail('detección de altura: '+pe.slice(0,5).join(', ')):ok('detección de notas exacta de E2 a E5');
// Micrófono simulado: un archivo con A3 (220 Hz) sonando
const os=require('os'),wav=path.join(os.tmpdir(),'g12-a3.wav'),sr=48000,N=sr*6,dv=Buffer.alloc(44+N*2);
dv.write('RIFF',0);dv.writeUInt32LE(36+N*2,4);dv.write('WAVEfmt ',8);dv.writeUInt32LE(16,16);dv.writeUInt16LE(1,20);dv.writeUInt16LE(1,22);dv.writeUInt32LE(sr,24);dv.writeUInt32LE(sr*2,28);dv.writeUInt16LE(2,32);dv.writeUInt16LE(16,34);dv.write('data',36);dv.writeUInt32LE(N*2,40);
for(let i=0;i<N;i++){let x=0;for(let h=1;h<=6;h++)x+=Math.sin(2*Math.PI*220*h*i/sr)/h;dv.writeInt16LE(Math.round(6000*x),44+i*2)}fs.writeFileSync(wav,dv);
const mb=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+wav,'--autoplay-policy=no-user-gesture-required']});
const mc=await mb.newContext({viewport:{width:360,height:740}});await mc.grantPermissions(['microphone']);const mp=await mc.newPage();mp.on('pageerror',e=>errs.push(e.message));
await mp.goto(URL);await mp.waitForFunction(()=>typeof A=='object');await mp.evaluate(()=>A.tab('pra'));await mp.click('[data-a=mictun]');
try{await mp.waitForFunction(()=>/^A3/.test(($('#mnote')||{}).textContent||''),null,{timeout:8000});ok('el afinador reconoce A3 por el micrófono')}catch(e){fail('el afinador no reconoció A3: '+await mp.evaluate(()=>($('#mnote')||{}).textContent+' '+MIC.err))}
{const o=await mp.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>0)fail('afinador: la página se desborda '+o+'px')}
await mp.click('[data-a=micx]');await mp.click('[data-a=micex]');await mp.evaluate(()=>{MV.l=MV.l.map(q=>Object.assign(q,{pc:9,play:null}));MV.mute=0});
try{await mp.waitForFunction(()=>MV&&MV.st=='ok',null,{timeout:8000});ok('“Tocá en la guitarra” da por buena la nota correcta')}catch(e){fail('el ejercicio no reconoció la nota')}
for(let i=0;i<10;i++){await mp.evaluate(()=>{MV.st='ok';MV.res[MV.i]=true});await mp.evaluate(()=>A.micnx())}
const md=await mp.evaluate(()=>({done:MV&&MV.done,dr:S.dr.mic,on:MIC.on}));md.done&&md.dr&&!md.on?ok('resultado guardado y micrófono apagado al terminar'):fail('fin del ejercicio de micrófono: '+JSON.stringify(md));
await mb.close();
errs.length?errs.slice(0,10).forEach(e=>fail('error de JavaScript: '+e)):ok('sin errores de JavaScript');
await b.close();srv.close();mock.close();
console.log(fails.length?`\n${fails.length} problema(s)`:'\nTodo bien');process.exit(fails.length?1:0)})().catch(e=>{console.error(e);process.exit(1)});
