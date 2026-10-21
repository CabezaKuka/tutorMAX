/* ===== Micrófono: afinador y ejercicio "Tocá en la guitarra" =====
   Se carga antes de app.js; solo define funciones y estado, que usan app.js en tiempo de ejecución.
   Detección de altura: método McLeod (NSDF) sobre 2048 muestras, unas 16 veces por segundo. */
const NN=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const MIC={on:0,st:null,an:null,src:null,buf:null,id:0,rec:[],err:''};
let MV=null;

function pitchOf(b,sr){const n=b.length;let e=0;for(let i=0;i<n;i++)e+=b[i]*b[i];if(Math.sqrt(e/n)<.006)return-1;
const mn=Math.floor(sr/1100),mx=Math.min(Math.floor(sr/70),n>>1),W=n-mx,d=new Float32Array(mx+2);
for(let t=mn;t<=mx+1;t++){let a=0,m=0;for(let i=0;i<W;i++){const x=b[i],y=b[i+t];a+=x*y;m+=x*x+y*y}d[t]=m?2*a/m:0}
let t=mn;while(t<mx&&d[t]>0)t++;let g=0;for(let k=t;k<=mx;k++)if(d[k]>g)g=d[k];if(g<.6)return-1;
for(let k=Math.max(t,mn+1);k<=mx;k++)if(d[k]>=.88*g&&d[k]>=d[k-1]&&d[k]>=d[k+1]){const a=d[k-1],c=d[k+1],den=a-2*d[k]+c,s=den?.5*(a-c)/den:0;return sr/(k+s)}
return-1}
const midiOf=f=>69+12*Math.log2(f/440);
const pcName=p=>nES(NN[((p%12)+12)%12]);

async function micStart(){if(MIC.on)return;MIC.err='';
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){MIC.err='Este navegador no deja usar el micrófono. Abrí la app desde su dirección https.';micMsg();return}
try{const c=ac();if(c.state=='suspended')await c.resume();
MIC.st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
MIC.src=c.createMediaStreamSource(MIC.st);MIC.an=c.createAnalyser();MIC.an.fftSize=2048;MIC.src.connect(MIC.an);MIC.buf=new Float32Array(MIC.an.fftSize);
MIC.on=1;MIC.rec=[];clearInterval(MIC.id);MIC.id=setInterval(micTick,60);micMsg()}
catch(e){MIC.err=e&&e.name=='NotAllowedError'?'No diste permiso para usar el micrófono. Habilitalo en los ajustes del navegador para este sitio y volvé a intentar.':'No se pudo abrir el micrófono.';micStop();micMsg()}}
function micStop(){clearInterval(MIC.id);MIC.id=0;MIC.on=0;try{MIC.src&&MIC.src.disconnect()}catch(e){}if(MIC.st)MIC.st.getTracks().forEach(t=>t.stop());MIC.st=MIC.src=MIC.an=null}
function micMsg(){const e=$('#mst');if(e)e.innerHTML=MIC.err?`<div class="fb b"><span class=fi>!</span><div>${esc(MIC.err)}</div></div>`:MIC.on?'':`<button class=btn data-a=micon>${IC.mic} Activar el micrófono</button>`}

// Lectura estable: la misma nota durante ~5 lecturas seguidas
function micTick(){if(!MIC.an)return;MIC.an.getFloatTimeDomainData(MIC.buf);const f=pitchOf(MIC.buf,AC.sampleRate);
if(MV&&MV.mute>Date.now()){MIC.rec=[];return}
if(f<0){MIC.rec.push(null);if(MIC.rec.length>6)MIC.rec.shift();if(MIC.rec.slice(-4).every(x=>x==null))tunShow(null);return}
const m=midiOf(f);MIC.rec.push(m);if(MIC.rec.length>6)MIC.rec.shift();
const ok=MIC.rec.filter(x=>x!=null),md=ok.slice().sort((a,b)=>a-b)[ok.length>>1];
const pcs=MIC.rec.slice(-5),stable=pcs.length==5&&pcs.every(x=>x!=null&&Math.round(x)%12==Math.round(md)%12);
if(MV&&MV.m=='tun')tunShow(md,f);
if(MV&&MV.m=='ex'&&stable)exHear(Math.round(md)%12)}

/* --- Afinador --- */
const TSTR=[[40,'6'],[45,'5'],[50,'4'],[55,'3'],[59,'2'],[64,'1']];
function tunShow(m,f){const n=$('#mnote');if(!n)return;const nd=$('#mneedle'),c=$('#mcents'),h=$('#mhz'),card=$('#tun');
if(m==null){n.textContent='–';h.textContent=MIC.on?'Tocá una cuerda al aire':'';c.textContent='';nd.style.left='50%';card.classList.remove('in');return}
const r=Math.round(m),ct=Math.round((m-r)*100),ok=Math.abs(ct)<=5;n.innerHTML=`${pcName(r)}<small>${Math.floor(r/12)-1}</small>`;
const s=TSTR.find(x=>x[0]==r);h.textContent=f.toFixed(1)+' Hz'+(s?' · cuerda '+s[1]:'');
c.textContent=ok?'Afinada':(ct>0?'+':'')+ct+' cents · '+(ct>0?'bajala un poco':'subila un poco');nd.style.left=(50+Math.max(-50,Math.min(50,ct)))+'%';card.classList.toggle('in',ok)}
const tunHtml=()=>`<div class=qtop><button class=icb data-a=micx aria-label="Salir del afinador">${IC.x}</button><span class=eb>Afinador</span></div>
<div class="card tun" id=tun><div class=tn id=mnote aria-live=off>–</div><div class=m id=mhz>${MIC.on?'Tocá una cuerda al aire':''}</div><div class=meter aria-hidden=true><i></i><b id=mneedle></b></div><div class="m sm mc" id=mcents></div></div>
<div id=mst></div><h2 class=h2>Notas de referencia <small>afinación estándar · tocá para oírlas</small></h2>
<div class=chips>${TSTR.map(([m,s])=>`<button class=chip data-a=nt data-v=${m}><small>${s}.ª</small>${pcName(m)}${Math.floor(m/12)-1}</button>`).join('')}</div>
<p class="m sm">Funciona mejor en un lugar silencioso y con el teléfono cerca de la boca de la guitarra. Si dice “bajala”, aflojá la clavija; si dice “subila”, tensala.</p>`;

/* --- Ejercicio: tocar la nota pedida --- */
function micQ(){const k=pick(LK()),sc=SC[k.id].split(' '),t=pick(['mastil','grado','grado','tercera','oido','oido']);
if(t=='mastil'){const cs=pick(lvW()>=4?[6,5,4]:[6,5]),op={6:40,5:45,4:50}[cs],f=R_(12),m=op+f;
return{t:`Tocá ${pcName(m)} en la cuerda ${cs}`,pc:m%12,ex:`La cuerda ${cs} al aire es ${pcName(op)}: ${pcName(m)} está en el traste ${f}${f==0?' (al aire)':''}.`}}
if(t=='grado'){const D=k.m=='M'?[0,3,4,5]:[0,2,5,6],i=pick(D),c=k.ch[i],r=parse(c).r,rom=(k.m=='M'?RM:Rm)[i];
return{t:`Tocá la raíz del ${rom} de ${k.n}`,pc:NPC(r),ex:`El ${rom} de ${k.n} es ${pretty(c)}: su raíz es ${nES(r)}.`}}
if(t=='tercera'){const c=pick(LTRI()),p=parse(c),N=majNotes(p.r),th=p.q=='m'?flatN(N[2]):N[2];
return{t:`Tocá la 3.ª de ${pretty(c)}`,pc:pcOf(th),ex:`${pretty(c)} = ${[N[0],th,N[4]].map(nES).join(' – ')}: la 3.ª es ${nES(th)}${p.q=='m'?' (3.ª menor, 3 trastes sobre la raíz)':' (3.ª mayor, 4 trastes sobre la raíz)'}.`}}
const n=pick(sc),m=40+((NPC(n)-4+12)%12)+pick([0,12]);
return{t:'Encontrá en la guitarra la nota que suena',pc:m%12,play:m,ex:`Era ${nES(n)}${k.n?' (de la escala de '+k.n+')':''}.`}}
function micEx(){MV={m:'ex',l:Array.from({length:10},micQ),i:0,res:[],tr:0,st:'listen',bad:null,mute:0};R();top0();micStart().then(micPlay)}
function micPlay(){const q=MV&&MV.m=='ex'&&MV.l[MV.i];if(!q||q.play==null)return;MV.mute=Date.now()+1900;try{ac();pluck(mf(q.play),AC.currentTime+.05,1.4,.3)}catch(e){}}
function exHear(p){const q=MV.l[MV.i];if(MV.st!='listen')return;
if(p==q.pc){MV.st='ok';MV.res[MV.i]=MV.tr==0;say('Correcto. '+q.ex);R();return}
if(p!==MV.bad){MV.bad=p;MV.tr++;const e=$('#mfb');if(e)e.innerHTML=`<div class="fb b"><span class=fi>✕</span><div>Eso suena a <b>${pcName(p)}</b>. Probá otra vez.</div></div>`}}
function micNext(){if(MV.st=='listen'){MV.st='ko';MV.res[MV.i]=false;R();return}
if(MV.i<MV.l.length-1){MV.i++;MV.st='listen';MV.tr=0;MV.bad=null;R();setTimeout(micPlay,250);return}
const ok=MV.res.filter(Boolean).length,x=S.dr.mic=S.dr.mic||{n:0,ok:0};x.n+=MV.l.length;x.ok+=ok;S.hist.push({d:today(),dr:'mic',n:MV.l.length,ok});S.hist=S.hist.slice(-200);save();MV.done=1;micStop();R();top0()}
function exHtml(){const n=MV.l.length;
if(MV.done){const ok=MV.res.filter(Boolean).length,p=Math.round(100*ok/n);return`<div class=res><span class=eb>Tocá en la guitarra</span><div class=score><b>${ok}</b><span>de ${n} al primer intento</span></div><div class="bar big"><i style="width:${p}%;background:var(${p>=80?'--ok':p>=60?'--acc':'--ko'})"></i></div><h1>${p>=80?'Muy bien.':p>=60?'Vas por buen camino.':'Seguí practicando.'}</h1>
<div class="card rev">${MV.l.map((q,i)=>`<div class=ln><span class="n ${MV.res[i]?'ok':'ko'}">${MV.res[i]?'✓':'✕'}</span><span>${esc(q.t)}<br><span class=m>${esc(q.ex)}</span></span></div>`).join('')}</div>
<button class="btn gh blk" data-a=micex>${IC.redo} Repetir</button><button class="btn gh blk" data-a=micx>${IC.prev} Volver a Practicar</button></div>`}
const q=MV.l[MV.i],st=MV.st;
return`<div class=qtop><button class=icb data-a=micx aria-label="Salir del ejercicio">${IC.x}</button><div class=seg>${MV.l.map((_,i)=>`<i class="${i<MV.i||(i==MV.i&&st!='listen')?(MV.res[i]?'d':'x'):i==MV.i?'c':''}"></i>`).join('')}</div></div>
<div class=qcard><div class=bh><span class="av c3">${IC.mic}</span><div class=tt><span class=eb>Tocá en la guitarra · ${MV.i+1}/${n}</span>${MV.i==0?'<span class=m>Tocá la nota en cualquier octava. La app escucha y te dice si es correcta.</span>':''}</div></div><h1 class=q>${esc(q.t)}</h1>${q.play!=null?`<button class="btn gh sm" data-a=micpl>${IC.play} Escuchar de nuevo</button>`:''}</div>
<div id=mst></div>${st=='listen'?`<div class="card mlive"><span class="mdot${MIC.on?' a p':''}"></span><span>${MIC.on?'Escuchando…':'Esperando el micrófono'}</span></div><div id=mfb></div><button class="btn gh blk" data-a=micnx>No la encuentro: ver la respuesta</button>`:
`<div class="fb ${st=='ok'?'g':'b'}"><span class=fi>${st=='ok'?iconOk:iconNo}</span><div><b>${st=='ok'?(MV.res[MV.i]?'Correcto.':'Correcto, al final.'):'Era '+esc(pcName(q.pc))+'.'}</b> ${esc(q.ex)}</div></div><button class="btn blk" data-a=micnx>${MV.i<n-1?'Siguiente':'Ver resultado'} ${IC.next}</button>`}`}
const micView=()=>{const h=MV.m=='tun'?tunHtml():exHtml();setTimeout(micMsg,0);return h};
