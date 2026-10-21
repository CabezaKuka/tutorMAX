// Prueba de humo: abre la app en Chromium sin pantalla, valida el contenido,
// recorre todas las sesiones y ejercicios y revisa que nada se desborde en el celular.
// Uso: npm test   (o: node tests/smoke.js)
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const ROOT=path.join(__dirname,'..'),URL='file://'+path.join(ROOT,'index.html');
const fails=[];const fail=m=>{fails.push(m);console.log('  ✕ '+m)};
const ok=m=>console.log('  ✓ '+m);

(async()=>{
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await b.newPage({viewport:{width:360,height:740}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()=='error'&&!/fonts\.googleapis|ERR_FILE_NOT_FOUND|net::/.test(m.text()))errs.push(m.text())});
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

errs.length?errs.slice(0,10).forEach(e=>fail('error de JavaScript: '+e)):ok('sin errores de JavaScript');
await b.close();
console.log(fails.length?`\n${fails.length} problema(s)`:'\nTodo bien');process.exit(fails.length?1:0)})().catch(e=>{console.error(e);process.exit(1)});
