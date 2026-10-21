/* ===== Utilidades y estado ===== */
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const K='gtr12';
const HT=()=>!!(window.claude&&typeof window.claude.use=='function');
const DEF=()=>({w:0,s:1,logs:[],crit:{},rec:{},tests:[],q:{},qc:{},dr:{},hist:[],t4:[],err:[],pr:{},tk:{},cfg:{fs:0,th:'dark',snd:true,goal:5,lv:'auto',v13:1}});
let S;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}
S=Object.assign(DEF(),S&&typeof S=='object'?S:{});
function fixS(){['tests','t4','hist','err','logs'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[]});['pr','tk','q','qc','dr','crit','rec'].forEach(k=>{if(!S[k]||typeof S[k]!='object')S[k]={}});S.cfg=Object.assign({fs:0,th:'dark',snd:true,goal:5,lv:'auto'},S.cfg&&typeof S.cfg=='object'?S.cfg:{});if(!S.cfg.v13){if(S.cfg.th=='auto')S.cfg.th='dark';S.cfg.v13=1}
// Semana y sesión válidas: un respaldo dañado no debe dejar la app sin abrir
S.w=Math.max(0,Math.min(12,parseInt(S.w)||0));S.s=parseInt(S.s)||1;if(!S.w||S.s<1||S.s>7||(S.s==7&&!LX[S.w+'.7']))S.s=1;
S.t4=S.t4.filter(t=>t&&typeof t=='object').map(t=>({d:String(t.d||''),w:+t.w||0,a:+t.a||0,n:+t.n||0,c:String(t.c||'')}))}
fixS();
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
const say=t=>{const e=document.getElementById('live');if(!e)return;e.textContent='';setTimeout(()=>{e.textContent=String(t).replace(/<[^>]+>/g,'')},60)};
let WKC=0,FLB='n';
let tab='est',view='home',QS=null,TC=[],TD='',SEL=null,wipe=0;
let ST={k:'',i:0,qi:0,a:[],ord:[],r:0,so:''};
const T={blk:'',base:0,left:0,run:0,t0:0};if(S.tmr&&typeof S.tmr=='object'){Object.assign(T,S.tmr);if(T.run&&T.base-Math.floor((Date.now()-T.t0)/1000)<=0){T.run=0;T.left=0}}
const saveT=()=>{S.tmr={blk:T.blk,base:T.base,left:T.left,run:T.run,t0:T.t0};save()};

/* ===== Música: acordes, tonalidades, audio ===== */
const PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
/* Acordes: tríadas, séptimas (7, maj7, m7) y bajo con barra (C/E). */
const NPC=n=>(PC[n[0]]+(n[1]=='#'?1:n[1]=='b'?-1:0)+12)%12;
function parse(ch){ch=String(ch).replace(/\|.*/,'');const m=ch.match(/^([A-G][#b]?)(maj7|m7|dim|sus2|sus4|add9|m|7|5)?(?:\/([A-G][#b]?))?$/);if(!m)return null;return{pc:NPC(m[1]),q:m[2]||'M',r:m[1],bs:m[3]||null,b:m[3]?NPC(m[3]):null}}
const QI={M:[0,4,7],m:[0,3,7],dim:[0,3,6],'7':[0,4,7,10],maj7:[0,4,7,11],m7:[0,3,7,10],sus2:[0,2,7],sus4:[0,5,7],add9:[0,4,7,14],'5':[0,7]};
const QSUF={M:'',m:'m',dim:'°','7':'7',maj7:'7M',m7:'m7',sus2:'sus2',sus4:'sus4',add9:'add9','5':'5'},QLONG={M:'mayor',m:'menor',dim:'disminuido','7':'con séptima',maj7:'con séptima mayor',m7:'menor con séptima',sus2:'sus2 (sin 3.ª, con 2.ª)',sus4:'sus4 (sin 3.ª, con 4.ª)',add9:'mayor con 9.ª agregada','5':'power chord (raíz y 5.ª)'};
const nES1=n=>n[0]+(n[1]=='#'?'♯':n[1]=='b'?'♭':'');
const QWORD={M:'mayor',m:'menor',dim:'dism.','7':'séptima',maj7:'7 mayor',m7:'menor 7',sus2:'sus2',sus4:'sus4',add9:'add9','5':'power'};
const esShort=ch=>{if(ch[0]=='~')return nES1(ch.slice(1).replace('+',''));const p=parse(ch);return p?QWORD[p.q]+(p.bs?' · bajo '+nES1(p.bs):'')+(ch.includes('|')?' · forma '+ch.split('|')[1]:''):ch};
const chordES=ch=>{const p=parse(ch);return p?nES1(p.r)+' '+QLONG[p.q]+(p.bs?', con '+nES1(p.bs)+' en el bajo':''):ch};
const mf=m=>440*Math.pow(2,(m-69)/12);
let AC;const ac=()=>{if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();try{const b=AC.createBuffer(1,1,22050),x=AC.createBufferSource();x.buffer=b;x.connect(AC.destination);x.start(0)}catch(e){}}if(AC.state=='suspended')AC.resume();return AC};
function pluck(f,t,d,v){if(S.cfg&&S.cfg.snd===false)return;const c=ac(),g=c.createGain(),g2=c.createGain(),o=c.createOscillator(),p=c.createOscillator();o.type='triangle';p.type='sine';o.frequency.value=f;p.frequency.value=f*2;g2.gain.value=.35;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);p.connect(g2);g2.connect(g);g.connect(c.destination);o.start(t);p.start(t);o.stop(t+d+.05);p.stop(t+d+.05)}
/* Si existe el diagrama, suena la misma forma que se ve (cuerdas 6 a 1). */
function chordNotes(ch){const f=SHP[ch];if(f){const op=[40,45,50,55,59,64];return f.map((v,i)=>v<0?-1:op[i]+v).filter(x=>x>=0)}const p=parse(ch),r=40+((p.pc-4+12)%12),iv=QI[p.q];if(p.b!=null){const b=40+((p.b-4+12)%12);return[b].concat(iv.map(x=>r+12+x))}return[r,r+(iv.includes(7)?7:6)].concat(iv.map(x=>r+12+x))}
/* '~C' = nota suelta (octava 4), '~C+' = octava arriba, '~C3' = octava indicada (C3 = raíz del C abierto). */
function playOne(ch,t,d){if(ch=='_')return;if(ch[0]=='~'){const m=ch.slice(1).match(/^([A-G][#b]?)(\d)?(\+)?$/);if(!m)return;const pc=NPC(m[1]),mid=m[2]?12*(+m[2]+1)+pc:60+pc+(m[3]?12:0);pluck(mf(mid),t,Math.min(d,m[2]?1.2:.9),m[2]?.32:.25)}else chordNotes(ch).forEach((n,i)=>pluck(mf(n),t+i*.03,d,.15))}
let TMS=[];
function mark(sel,i){if(!sel)return;document.querySelectorAll(sel+' .chip,'+sel+' .nt').forEach((e,j)=>e.classList.toggle('on',j==i))}
function stopSeq(){TMS.forEach(clearTimeout);TMS=[];DP.on=0}
function playSeq(chs,gap,sel,cb){try{stopSeq();const c=ac(),t0=c.currentTime+.05;chs.forEach((ch,i)=>{playOne(ch,t0+i*gap,gap*1.15);TMS.push(setTimeout(()=>{mark(sel,i);if(cb)cb(i)},50+i*gap*1000))});TMS.push(setTimeout(()=>{mark(sel,-1);if(cb)cb(-1)},200+chs.length*gap*1000))}catch(e){}}

const KEYS=[
{id:'C',n:'C mayor',m:'M',ch:['C','Dm','Em','F','G','Am','Bdim']},
{id:'G',n:'G mayor',m:'M',ch:['G','Am','Bm','C','D','Em','F#dim']},
{id:'D',n:'D mayor',m:'M',ch:['D','Em','F#m','G','A','Bm','C#dim']},
{id:'A',n:'A mayor',m:'M',ch:['A','Bm','C#m','D','E','F#m','G#dim']},
{id:'E',n:'E mayor',m:'M',ch:['E','F#m','G#m','A','B','C#m','D#dim']},
{id:'F',n:'F mayor',m:'M',ch:['F','Gm','Am','Bb','C','Dm','Edim']},
{id:'Am',n:'A menor',m:'m',ch:['Am','Bdim','C','Dm','Em','F','G'],V:'E'},
{id:'Em',n:'E menor',m:'m',ch:['Em','F#dim','G','Am','Bm','C','D'],V:'B'},
{id:'Dm',n:'D menor',m:'m',ch:['Dm','Edim','F','Gm','Am','Bb','C'],V:'A'},
{id:'Bm',n:'B menor',m:'m',ch:['Bm','C#dim','D','Em','F#m','G','A'],V:'F#'}];
const RM=['I','ii','iii','IV','V','vi','vii°'],Rm=['i','ii°','III','iv','v','VI','VII'];
const SC={C:'C D E F G A B',G:'G A B C D E F#',D:'D E F# G A B C#',A:'A B C# D E F# G#',E:'E F# G# A B C# D#',F:'F G A Bb C D E',Am:'A B C D E F G',Em:'E F# G A B C D',Dm:'D E F G A Bb C',Bm:'B C# D E F# G A'};
KEYS.forEach(k=>{k.sc=SC[k.id].split(' ')});
const chordOf=(k,r)=>{const i=(k.m=='M'?RM:Rm).indexOf(r);return i<0?k.V:k.ch[i]};
const PMaj=['I–IV–V','I–V–vi–IV','vi–IV–I–V','I–vi–IV–V','ii–V–I'],PMin=['i–VII–VI','i–VII–VI–V','i–iv–V','i–VI–III–VII'];

/* Formas de acordes (cuerdas 6 a 1; -1 = no se toca). Solo las que conozco con certeza. */
const SHP={C:[-1,3,2,0,1,0],D:[-1,-1,0,2,3,2],E:[0,2,2,1,0,0],G:[3,2,0,0,0,3],A:[-1,0,2,2,2,0],Am:[-1,0,2,2,1,0],Em:[0,2,2,0,0,0],Dm:[-1,-1,0,2,3,1],F:[1,3,3,2,1,1],Bm:[-1,2,4,4,3,2],B:[-1,2,4,4,4,2],'F#m':[2,4,4,2,2,2],'C#m':[-1,4,6,6,5,4],'G#m':[4,6,6,4,4,4],Bb:[-1,1,3,3,3,1],Gm:[3,5,5,3,3,3],Bdim:[-1,2,3,4,3,-1]};
/* Diagrama de acorde estilo Mesa: 4 trastes, puntos ámbar, × y ○ arriba. */
function diag(ch,w,dim){const f=SHP[ch];if(!f)return'';const pr=f.filter(x=>x>0),mx=pr.length?Math.max(...pr):0,mn=pr.length?Math.min(...pr):1,base=mx<=4?1:mn,NF=4,W_=118,H=150,x0=16,y0=34,sx=17.2,sy=27;
let s=`<svg class="cd${dim?' dim':''}" viewBox="0 0 ${W_} ${H}" width="${w||130}" role="img" aria-label="Forma de ${esc(ch.replace(/\|.*/,''))}">`;
for(let i=0;i<6;i++)s+=`<line x1="${x0+i*sx}" y1="${y0}" x2="${x0+i*sx}" y2="${y0+NF*sy}" class=fs />`;
for(let j=0;j<=NF;j++)s+=`<line x1="${x0}" y1="${y0+j*sy}" x2="${x0+5*sx}" y2="${y0+j*sy}" class="${j==0&&base==1?'nut':'fs'}"/>`;
if(base>1)s+=`<text x="${x0+5*sx+6}" y="${y0+sy*.62}" font-size="11" class=bf>${base}fr</text>`;
{const bi=f.map((v,i)=>v==mn&&v>0?i:-1).filter(i=>i>=0);if(bi.length>=2){const a=bi[0],z=bi[bi.length-1];if(z-a>=3&&f.slice(a,z+1).every(v=>v>=mn))s+=`<rect x="${x0+a*sx-7.5}" y="${y0+(mn-base+.5)*sy-7.5}" width="${(z-a)*sx+15}" height="15" rx="7.5" class=dt />`}}
f.forEach((v,i)=>{const x=x0+i*sx;if(v<0)s+=`<text x="${x}" y="${y0-11}" text-anchor="middle" font-size="14" class=mk>×</text>`;else if(v==0)s+=`<circle cx="${x}" cy="${y0-15}" r="5" class=op />`;else s+=`<circle cx="${x}" cy="${y0+(v-base+.5)*sy}" r="8" class=dt />`});
return s+'</svg>'}


/* Demos de audio por sesión de lección. '~X' = nota suelta, '+' = octava arriba. */
const DEMO={
'1.1':[['Escala de C mayor (sin alteraciones)',['~C','~D','~E','~F','~G','~A','~B','~C+']],['Escala de G mayor (notá el F♯)',['~G','~A','~B','~C+','~D+','~E+','~F#+','~G+']]],
'1.2':[['Los 7 acordes de C mayor',['C','Dm','Em','F','G','Am','Bdim']]],
'1.3':[['Los acordes de G mayor',['G','Am','Bm','C','D','Em','F#dim']],['Los acordes de D mayor',['D','Em','F#m','G','A','Bm','C#dim']]],
'1.4':[['Los acordes de A mayor',['A','Bm','C#m','D','E','F#m','G#dim']],['Los acordes de E mayor',['E','F#m','G#m','A','B','C#m','D#dim']]],
'1.5':[['I–IV–V en C',['C','F','G','C']],['I–IV–V en G',['G','C','D','G']]],
'2.1':[['I–IV–V–I: cierra en reposo',['C','F','G','C']],['I–IV–V: queda abierta',['C','F','G']]],
'2.2':[['V–I en C',['G','C']],['V–I en G',['D','G']],['V–I en D',['A','D']],['V–I en A',['E','A']]],
'2.3':[['I–V–vi–IV en C',['C','G','Am','F']],['I–V–vi–IV en G',['G','D','Em','C']],['I–V–vi–IV en D',['D','A','Bm','G']]],
'2.4':[['vi–IV–I–V en C',['Am','F','C','G']],['I–V–vi–IV en C (para comparar)',['C','G','Am','F']]],
'2.5':[['I–vi–IV–V en C',['C','Am','F','G']],['ii–V–I en C',['Dm','G','C']]],
'3.1':[['C mayor',['C','F','G','C']],['A menor, su relativa',['Am','Dm','E','Am']]],
'3.2':[['Los acordes de A menor natural',['Am','Bdim','C','Dm','Em','F','G']]],
'3.3':[['v menor (menor natural)',['Am','Dm','Em','Am']],['V mayor (menor armónica)',['Am','Dm','E','Am']]],
'3.4':[['i–VII–VI',['Am','G','F']],['i–VII–VI–V',['Am','G','F','E']],['i–VI–III–VII',['Am','F','C','G']]],
'3.5':[['Am–F–C–G: ¿C mayor o A menor?',['Am','F','C','G']]]};
const ORD=['1º','2º','3º','4º','5º','6º','7º'],EQ='Si alguna vez los ves en castellano: C = Do · D = Re · E = Mi · F = Fa · G = Sol · A = La · B = Si';
const exScale=k=>k.sc.map((n,i)=>`${ORD[i]} ${nES(n)}`).join(' · ');
const HELPX={bajo:q=>q.k?`<p class=m>Compará la nota grave con la tónica: contá cuántos trastes sube desde ${nES(q.k.sc[0])} en la cuerda 6 o 5. Notas de ${q.k.n}, por lugar:</p><p class=mono>${exScale(q.k)}</p>`:'<p class=m>Tocá el acorde y fijate si la nota más grave es la que le da nombre (raíz). Si no, contá desde la raíz: 3.ª = 3 o 4 trastes arriba, 5.ª = 7 trastes arriba.</p>',
sus:()=>'<p class=m>sus4 suena suspendido y pide resolver al acorde mayor. sus2 suena abierto, sin color mayor ni menor. Notas: sus2 = 1, 2 y 5 · sus4 = 1, 4 y 5 · power chord = 1 y 5 · add9 = 1, 3, 5 y la 2.ª (9.ª).</p>',
blues:()=>'<p class=m>Esquema: I7 I7 I7 I7 · IV7 IV7 I7 I7 · V7 IV7 I7 V7. El IV y el V son la 4.ª y la 5.ª nota de la escala mayor. Escala de blues = pentatónica menor + la 5.ª disminuida.</p>'};
function helpHtml(q){let h='';if(HELPX[q.d])h=HELPX[q.d](q);else 
if(q.k){const k=q.k,M=k.m=='M';h=`<p class=m>Tonalidad ${k.n}. Las notas de su escala, por lugar:</p><p class=mono>${exScale(k)}</p><p class=m>Cada acorde lleva el nombre de la nota de su lugar. ${M?'En una tonalidad mayor, los lugares 2º, 3º y 6º son acordes menores y el 7º es disminuido (dim).':'En una tonalidad menor, los lugares 1º, 4º y 5º son acordes menores, el 2º es disminuido (dim) y el 3º, 6º y 7º son mayores.'}</p>`}
else if(q.d=='oido')h='<p class=m>Primero contá cuántos acordes suenan. Con 3 acordes las opciones son pocas; con 4 son otras, así que ya descartás varias. Después fijate si el primer acorde se siente como “casa”.</p>';
else if(q.d=='tono')h='<p class=m>Mirá en qué acorde termina: casi siempre es la tónica. Después comprobá que los demás acordes sean de esa tonalidad. Si termina en un acorde menor, probá la tonalidad menor.</p>';
else if(q.d=='func')h='<p class=m>Tónica (casa): I, iii, vi. Predominante (se aleja): ii, IV. Dominante (tensión): V, vii°. Primero ubicá el número del acorde en la tonalidad.</p>';
else if(q.d=='mastil')h='<p class=m>Cada traste sube un semitono. Desde la nota al aire contá: C, C♯, D, D♯, E, F, F♯, G, G♯, A, A♯, B, y vuelve a C. Entre E–F y B–C hay un solo traste.</p>';
else if(q.d=='notas')h='<p class=m>Escribí la escala mayor de la raíz y tomá las notas 1, 3 y 5. Para un acorde menor, bajá la 3.ª un traste. En 7 y m7 se agrega la 7.ª nota de la escala bajada un traste; en maj7 (7M), la 7.ª tal cual.</p>';
else if(q.d=='capo')h='<p class=m>Cada traste de capo sube un semitono. Contá desde la forma: con formas de D y capo en el 2 suena E.</p>';
else if(q.d=='reposo')h='<p class=m>No siempre termina en casa. Fijate con qué acorde empieza, a cuál vuelve una y otra vez y cuál suena a “llegué”.</p>';
else if(q.d=='ogr')h='<p class=m>Compará con el acorde de casa. El IV se aleja con calma. El V genera tensión y pide volver. El vi suena a casa, pero triste. El ii y el iii son menores y más suaves.</p>';
else if(q.d=='sept')h='<p class=m>Un acorde con séptima tiene una nota más que le da un “picante”: suena como si pidiera moverse a otro acorde. Una tríada suena estable y cerrada.</p>';
else if(q.d=='ajenos')h='<p class=m>Escribí la escala de la tonalidad y buscá qué nota del acorde no aparece. bVII e iv vienen prestados de la tonalidad menor. V/V y V/vi son acordes con séptima que llevan al V o al vi.</p>';
else if(q.d=='penta')h='<p class=m>Pentatónica menor = escala menor sin la 2.ª ni la 6.ª nota. Pentatónica mayor = escala mayor sin la 4.ª ni la 7.ª nota.</p>';
else h='<p class=m>Para comparar, tocá C (mayor) y Am (menor) en tu guitarra y fijate cómo cambia el color del sonido.</p>';
return`<div class="card hl">${h}</div>`}
const GLO=`<details class=card><summary><b>Palabras que se usan</b></summary><p><b>Tono y semitono.</b> Son distancias entre notas. 1 tono = 2 trastes. 1 semitono = 1 traste.</p><p><b>Escala.</b> La serie de 7 notas que forma una tonalidad.</p><p><b>Tonalidad.</b> La escala con la que suena una canción, y su nota de reposo.</p><p><b>Tónica (el I).</b> La nota o el acorde donde la música “llega a casa”.</p><p><b>Grado.</b> El lugar que ocupa una nota o un acorde en la escala: 1º, 2º, 3º… Se escribe con números romanos: I, II, III, IV, V, VI, VII.</p><p><b>Mayúscula y minúscula.</b> I, IV y V son acordes mayores. ii, iii y vi son menores.</p><p><b>Raíz.</b> La nota que da nombre al acorde. En Dm es D.</p><p><b>Progresión.</b> Una secuencia de acordes.</p><p><b>Relativa menor.</b> La tonalidad menor que usa las mismas notas que una mayor.</p><p><b>dim (disminuido).</b> Un acorde tenso que casi no se usa.</p><p class="m sm">${EQ}</p></details>`;
const TX={
'1.1':[
['A','Armá la escala de C mayor y la de G mayor',[
'Una escala mayor son 7 notas seguidas. Entre una nota y la siguiente hay 1 tono (2 trastes) o 1 semitono (1 traste). El orden es: tono, tono, semitono, tono, tono, tono, semitono.',
'Poné un dedo en la cuerda 5, traste 3: es la nota C. Subí tocando los trastes 3, 5, 7, 8, 10, 12, 14 y 15. Decí en voz alta: C, D, E, F, G, A, B, C.',
'Ahora en la cuerda 6: empezá en el traste 3 (G) y tocá los trastes 3, 5, 7, 8, 10, 12, 14 y 15. Decí: G, A, B, C, D, E, F♯, G. La nota del traste 14 es F♯ (F sostenido), la única que cambia respecto a C.']],
['B','Escuchá la nota donde “descansa” una canción',[
'Tocá estas 4 notas, una por una, y escuchá cada una: C (cuerda 5, traste 3), E (cuerda 4, traste 2), G (cuerda 3, al aire) y C agudo (cuerda 2, traste 1). Si podés, repetí cada nota con la voz; si no, alcanza con escucharlas.',
'Elegí una canción que conozcas bien y tarareala hasta el final. Quedate en la última nota que cantás.',
'Buscá esa nota en la guitarra, probando de a una, hasta que suene igual. Esa es la nota de reposo (se llama tónica): la que suena a “llegué a casa”. No importa si no cantás afinado; lo que importa es escuchar.']]],
'1.2':[
['A','Armá los 7 acordes de C mayor',[
'Escribí las notas de la escala de C mayor: C, D, E, F, G, A, B.',
'Cada acorde se forma con 3 notas: tomás una nota de la escala, saltás una, tomás la siguiente, saltás otra y tomás la siguiente. Ejemplo con C: C, E, G. Con D: D, F, A. Con E: E, G, B.',
'Seguí con F, G, A y B. Te tienen que dar estos acordes: C, Dm, Em, F, G, Am y Bdim. Los primeros seis los vas a usar todo el tiempo; el último (Bdim, “disminuido”) casi no se usa, alcanza con saber que existe.',
'Tocá los seis primeros en orden. Si alguno no te sale, mirá su diagrama en el paso “Escuchalo” de la lección.']],
['B','Revisá si tus canciones usan estos acordes',[
'Elegí 3 canciones que sepas tocar y escribí los acordes de cada una.',
'Fijate si todos los acordes de una canción están en esta lista: C, Dm, Em, F, G, Am. Si es así, esa canción está en C mayor (o en su relativa, A menor, que vemos en la semana 3).',
'Anotá cuáles coinciden y cuáles no. Los que no coinciden son de otra tonalidad, y eso es lo que vamos a aprender a reconocer.']]],
'1.3':[
['A','Armá los acordes de G mayor y D mayor',[
'G mayor tiene un solo sostenido, F♯. Sus acordes son: G, Am, Bm, C, D, Em y F♯dim.',
'D mayor tiene dos sostenidos, F♯ y C♯. Sus acordes son: D, Em, F♯m, G, A, Bm y C♯dim.',
'Tocá los de G y después los de D. Los que no tengas a mano, como Bm y F♯m, se hacen con cejilla (un dedo apoyado sobre varias cuerdas).',
'Compará las dos listas y mirá cuáles cambian. Son los que llevan una nota con sostenido.']],
['B','Pasá una canción tuya a números (grados)',[
'Elegí una canción que sepas tocar y escribí sus acordes.',
'Buscá el acorde donde la canción descansa, por lo general el último. Ese es el I (el primero de la tonalidad).',
'Contá desde ahí con la lista de 7 acordes de esa tonalidad y ponele a cada acorde su número: I, ii, iii, IV, V, vi. Ejemplo en G mayor: G es I, C es IV y D es V.',
'Tocá solo la nota más grave de cada acorde (la raíz) y escuchá cómo se mueve.']]],
'1.4':[
['A','Armá los acordes de A mayor y E mayor',[
'A mayor tiene tres sostenidos (F♯, C♯ y G♯). Sus acordes son: A, Bm, C♯m, D, E, F♯m y G♯dim.',
'E mayor tiene cuatro sostenidos (F♯, C♯, G♯ y D♯). Sus acordes son: E, F♯m, G♯m, A, B, C♯m y D♯dim.',
'Para ubicar un acorde en el mástil usá dos cuerdas de referencia: la cuerda 6 al aire es E y la cuerda 5 al aire es A. Ejemplos: F♯ está en la cuerda 6, traste 2; B, en la cuerda 5, traste 2; C♯, en la cuerda 5, traste 4.',
'Tocá los acordes de las dos tonalidades que ya sepas y buscá la raíz de cada uno en esas cuerdas.']],
['B','Adiviná la tonalidad de 3 canciones',[
'Elegí 3 canciones y escribí sus acordes.',
'Para cada una, escribí qué tonalidad creés que es (tu hipótesis) y qué tan seguro estás: poco, medio o mucho.',
'Después comprobá: el acorde donde descansa la canción suele ser el I. Anotá cuántas acertaste.']]],
'1.5':[
['A','Escribí de memoria los 7 acordes de una tonalidad',[
'Elegí una tonalidad al azar entre C, G, D, A y E. También podés usar el ejercicio “Acordes de la tonalidad” en Practicar.',
'Sin mirar apuntes, escribí sus 7 acordes en orden.',
'Comprobá con la lista de la lección y repetí con otras dos tonalidades.']],
['B','Escribí una canción tuya en grados',[
'Elegí una canción y escribí sus acordes.',
'Cambialos por números romanos según la tonalidad. Mayúscula es acorde mayor (I, IV, V) y minúscula es acorde menor (ii, iii, vi).',
'Tocala leyendo solo los números. Si te trabás, volvé a la lista de acordes de esa tonalidad.']]],
'2.1':[
['A','Sentí qué hace cada acorde',[
'Tocá C, F, G y volvé a C (en C mayor). En cada cambio fijate qué sentís: C se siente como “casa”, F se aleja de casa y G genera tensión y pide volver.',
'Repetí en G mayor: G, C, D, G.',
'Esas tres sensaciones tienen nombre: tónica (casa: el I), predominante (se aleja: el IV) y dominante (tensión: el V).']],
['B','¿La frase queda cerrada o abierta?',[
'Elegí 3 canciones y escuchá cómo termina una frase de cada una (por ejemplo, el final de una estrofa).',
'Si al terminar sentís que “se cerró”, el final es en el I. Si sentís que falta algo, el final es en el V.',
'Anotá cuál es cada una.']]],
'2.2':[
['A','Tocá el movimiento V a I en cuatro tonalidades',[
'V–I significa pasar del acorde número 5 al acorde número 1. Es la forma más fuerte de “volver a casa”.',
'Tocalo así: G a C (en C), D a G (en G), A a D (en D) y E a A (en A).',
'Compará I–IV–V–I con I–V–I: los dos terminan igual de firme. El IV en el medio solo prepara el final.']],
['B','Escuchá si reposa o queda abierta',[
'Tocá C y después G: la música queda esperando algo.',
'Ahora tocá G y después C: la música descansa.',
'Escuchá frases de canciones tuyas y decidí para cada una si descansa o queda abierta.']]],
'2.3':[
['A','Tocá la progresión I–V–vi–IV en tres tonalidades',[
'I–V–vi–IV significa: acorde 1, acorde 5, acorde 6 y acorde 4, todos de la misma tonalidad. El acorde 6 es menor.',
'En C mayor: C, G, Am, F. En G mayor: G, D, Em, C. En D mayor: D, A, Bm, G.',
'Tocala en las tres, sin cambiar el orden de los números.']],
['B','Buscá este patrón en tus canciones',[
'Revisá los acordes de tus canciones y pasalos a números.',
'Fijate si alguna tiene cuatro acordes que sigan I–V–vi–IV.',
'Anotá cuáles y en qué tonalidad están.']]],
'2.4':[
['A','Dos patrones con los mismos acordes',[
'vi–IV–I–V en C mayor es: Am, F, C, G. Son los mismos acordes que C, G, Am, F, pero empezás por otro.',
'Tocá las dos progresiones, una después de la otra, y escuchá la diferencia de carácter. Al empezar en Am suele sonar más melancólico; al empezar en C, más firme.',
'Repetí en G mayor: Em, C, G, D.']],
['B','Pasá 3 canciones tuyas a números',[
'Elegí 3 canciones y anotá la tonalidad de cada una.',
'Escribí la progresión de la estrofa en números romanos.',
'Fijate si coincide con I–V–vi–IV, con vi–IV–I–V o con otra.']]],
'2.5':[
['A','Reconocé dos patrones más',[
'I–vi–IV–V en C es C, Am, F, G. Es una progresión muy usada en canciones de los años 50.',
'ii–V–I en C es Dm, G, C. Es común en jazz, así que por ahora alcanza con reconocerla.',
'Tocá las dos, sin memorizarlas.']],
['B','Clasificá 5 canciones por patrón',[
'Elegí 5 canciones y escribí en números la progresión de la estrofa.',
'Para cada una, fijate si coincide con alguno de los patrones de esta semana.',
'Anotá cuántas coincidieron: eso te dice qué tan común es cada patrón.']]],
'3.1':[
['A','Conocé la relativa menor',[
'Cada tonalidad mayor tiene una “prima” menor que usa las mismas notas pero descansa en otra. Está 3 trastes más abajo: C mayor y A menor, G mayor y E menor, D mayor y B menor.',
'La escala de A menor natural es la de C mayor empezando en A: A, B, C, D, E, F, G. Tocala en la cuerda 5 con los trastes 0, 2, 3, 5, 7, 8, 10 y 12.',
'Escuchá cómo suena: más oscura o seria que la de C mayor.']],
['B','Elegí una canción en menor',[
'Elegí una canción tuya que te suene seria o triste.',
'Fijate en qué acorde termina: ese es su acorde de reposo (por ejemplo Am o Em).',
'Tocá solo la raíz de ese acorde y comprobá que sea la nota donde “descansa” la melodía.']]],
'3.2':[
['A','Armá los acordes de A menor, E menor y D menor',[
'Los acordes de A menor son los de C mayor, ordenados desde A: Am, Bdim, C, Dm, Em, F y G. En números: i, ii°, III, iv, v, VI y VII.',
'E menor: Em, F♯dim, G, Am, Bm, C y D. D menor: Dm, Edim, F, Gm, Am, B♭ y C.',
'Tocá los de A menor, y después los de E menor y D menor que ya sepas.']],
['B','Seguí los bajos de tu canción en menor',[
'Retomá la canción en menor de la sesión anterior.',
'Tocá solo la nota más grave de cada acorde, en orden, y escuchá cómo suben o bajan.',
'Escribí esas notas: son las raíces de los acordes.']]],
'3.3':[
['A','Compará dos finales en A menor',[
'Tocá Am, Dm, Em, Am. Es el final con el v menor (Em): suena suave y poco decidido.',
'Ahora tocá Am, Dm, E, Am. Es el final con el V mayor (E): suena más decidido y empuja hacia Am. Eso pasa porque E tiene la nota G♯, que “pide” subir a A.',
'Repetí las dos varias veces hasta que notes la diferencia.']],
['B','Escuchá cuál usan tus canciones',[
'Escuchá canciones en menor y prestá atención al acorde que viene justo antes de volver al acorde de reposo (por ejemplo Am).',
'Fijate si suena suave (Em, menor) o decidido (E, mayor).',
'Anotá cuáles usan cada uno.']]],
'3.4':[
['A','Tocá tres patrones menores',[
'En A menor: i–VII–VI es Am, G, F. i–VII–VI–V es Am, G, F, E (se la llama cadencia andaluza). i–VI–III–VII es Am, F, C, G.',
'Tocalas una por una.',
'Notá cuál te gusta más y por qué.']],
['B','Buscalos en tu repertorio',[
'Revisá tus canciones en menor y escribí sus acordes en números.',
'Fijate si alguna coincide con alguno de los tres patrones.',
'Anotá cuáles.']]],
'3.5':[
['A','Mismos acordes, dos tonalidades posibles',[
'Am, F, C, G pueden ser vi–IV–I–V en C mayor o i–VI–III–VII en A menor. Son los mismos acordes; lo que cambia es dónde descansa la música.',
'Tocalos en orden y repetí varias veces. Fijate cuál se siente como “casa”: ¿Am o C?',
'Si descansa en C, la tonalidad es C mayor; si descansa en Am, es A menor.']],
['B','Decidí si una canción es mayor o menor',[
'Elegí una canción que use estos cuatro acordes (u otros que puedan ser de dos tonalidades).',
'Escribí tu hipótesis (mayor o menor) y qué tan seguro estás: poco, medio o mucho.',
'Comprobá después con Mesa y anotá si acertaste.']]]
};
Object.assign(DEMO,{
'1.2':[['Los 7 acordes de C mayor',['C','Dm','Em','F','G','Am','Bdim'],'C']],
'4.1':[['Solo el bajo de C–Am–F–G',['~C3','~A2','~F2','~G2']],['Los acordes completos',['C','Am','F','G'],'C']],
'4.2':[['C → Am',['C','Am'],'C'],['C → F',['C','F'],'C'],['C → G',['C','G'],'C'],['Solo el bajo: C → A y C → G (los dos bajan)',['~C3','~A2','~C3','~G2']],['C → F: el bajo puede subir 5 o bajar 7',['~C3','~F3','~C3','~F2']]],
'4.3':[['A y Am',['A','Am']],['E y Em',['E','Em']],['D y Dm',['D','Dm']]],
'4.4':[['Cuatro acordes de C mayor',['C','Am','F','G'],'C']],
'4.5':[['C, C/E y C/G',['C','C/E','C/G'],'C'],['Bajo que baja: C–G/B–Am',['C','G/B','Am'],'C']],
'5.1':[['I → IV (se aleja)',['C','F'],'C'],['I → V (tensión)',['C','G'],'C'],['I → vi (casa triste)',['C','Am'],'C']],
'5.2':[['V → I: llega',['G','C'],'C'],['I → V: queda esperando',['C','G'],'C']],
'5.3':[['I–IV–V en C',['C','F','G'],'C'],['I–V–vi–IV en C',['C','G','Am','F'],'C']],
'5.4':[['i–VII–VI',['Am','G','F'],'Am'],['i–iv–V',['Am','Dm','E','Am'],'Am']],
'6.1':[['I–V–vi–IV en C',['C','G','Am','F'],'C'],['La misma en G',['G','D','Em','C'],'G']],
'6.2':[['I–V–vi–IV en A',['A','E','F#m','D'],'A'],['I–V–vi–IV en E',['E','B','C#m','A'],'E']],
'6.3':[['F, G y A: la misma forma tipo E, movida',['F','G|E','A|E']]],
'6.4':[['Formas de C',['C','G','Am','F'],'C'],['Con capo en el 2: suena en D',['D','A','Bm','G'],'D']],
'6.5':[['i–VII–VI en A menor',['Am','G','F'],'Am'],['La misma en E menor',['Em','D','C'],'Em']],
'7.1':[['C, Cmaj7 y C7',['C','Cmaj7','C7']],['Am y Am7',['Am','Am7']]],
'7.2':[['G7 → C',['G7','C'],'C'],['D7 → G',['D7','G'],'G'],['E7 → A',['E7','A'],'A']],
'7.3':[['C, C/E y C/G',['C','C/E','C/G'],'C']],
'7.4':[['Notas de la tríada de C',['~C','~E','~G','~C+']]],
'7.5':[['C–G/B–Am–F',['C','G/B','Am','F'],'C']],
'8.1':[['C–B♭–F–C',['C','Bb','F','C'],'C']],
'8.2':[['C–F–Fm–C',['C','F','Fm','C'],'C'],['C–F–F–C (para comparar)',['C','F','F','C'],'C']],
'8.3':[['D7–G7–C',['D7','G7','C'],'C']],
'8.4':[['C–E7–Am',['C','E7','Am'],'C']],
'8.5':[['Cuatro ajenos en C',['C','Bb','Fm','D7','E7','Am'],'C']],
'9.1':[['A menor pentatónica',['~A','~C+','~D+','~E+','~G+','~A+']]],
'9.2':[['Base Am–F–C–G',['Am','F','C','G'],'Am']],
'9.3':[['Am y su nota A',['Am','~A']],['F y su nota A',['F','~A']],['C y su nota E',['C','~E+']]],
'9.4':[['C mayor pentatónica',['~C','~D','~E','~G','~A','~C+']]],
'10.2':[['Funciones en C',['C','F','G','C'],'C']],
'10.5':[['D–C–G (mixolidio)',['D','C','G','D'],'D'],['Dm–G (dórico)',['Dm','G','Dm','G'],'Dm']]});
Object.assign(SHP,{G7:[3,2,0,0,0,1],C7:[-1,3,2,3,1,0],D7:[-1,-1,0,2,1,2],A7:[-1,0,2,0,2,0],E7:[0,2,0,1,0,0],B7:[-1,2,1,2,0,2],'F#7':[2,4,2,3,2,2],Cmaj7:[-1,3,2,0,0,0],Am7:[-1,0,2,0,1,0],'C/E':[0,3,2,0,1,0],'C/G':[3,3,2,0,1,0],'G/B':[-1,2,0,0,0,3],Fm:[1,3,3,1,1,1],Cm:[-1,3,5,5,4,3],'F#':[2,4,4,3,2,2]});
const T11=['lenta en mayor','lenta en menor','de tempo medio en mayor','de tempo medio en menor','de cualquier tipo'];
Object.assign(TX,{
'4.1':[['A','Ubicá notas en las cuerdas 6 y 5',['La cuerda 6 al aire es E. Subí de a un traste diciendo cada nota: F (1), F♯ (2), G (3), G♯ (4), A (5), A♯ (6), B (7), C (8).','La cuerda 5 al aire es A: B (traste 2), C (3), D (5), E (7), F (8), G (10).','Elegí una nota al azar y encontrala en las dos cuerdas sin contar trastes con los dedos.']],
['B','Sacá el bajo de una canción que conocés',['Elegí una canción lenta que sepas tocar. Abrila en Mesa o Moises y dejá sonar solo el bajo.','En cada cambio de acorde, buscá en la cuerda 6 o 5 la nota que toca el bajo hasta que suene igual.','Compará esas notas con los acordes que ya sabés: casi siempre el bajo toca la raíz.']]],
'4.2':[['A','Imaginá la raíz antes de tocar',['Tocá C y dejalo sonar. Antes de cambiar, imaginá (o tarareá bajito) cómo va a sonar el bajo de Am.','Tocá Am y compará con lo que imaginaste.','Repetí con C → F y con C → G. No importa si no afinás con la voz: lo que cuenta es imaginar y comparar.']],
['B','Sacá el bajo de una estrofa conocida',['Con la canción de ayer, escuchá la estrofa sin mirar los acordes.','Tocá el bajo de memoria en la cuerda 6 o 5.','Verificá con el bajo aislado en Mesa. Anotá cuántos cambios acertaste.']]],
'4.3':[['A','Mayor o menor sobre la misma raíz',['Tocá A y Am seguidos. Solo cambia una nota: C♯ en A, C en Am.','Repetí con E y Em, y con D y Dm.','Hacé el ejercicio “Mayor o menor” en Practicar.']],
['B','Canción nueva: raíces y calidades',['Elegí una canción lenta que no sepas tocar.','Encontrá el bajo de los primeros 4 cambios: esas son las raíces.','Para cada raíz probá mayor y menor y elegí la que encaja. *Anotá tu hipótesis antes de verificar.*']]],
'4.4':[['A','Grabá 4 acordes para mañana',['Elegí 4 acordes de C mayor (por ejemplo C, Am, F, G) en un orden que no sea de una canción conocida.','Grabalos con el celular, 4 tiempos cada uno, sin decir los nombres.','Anotá el orden en un papel y no lo mires hasta mañana.']],
['B','Mayor o menor en la canción nueva',['Retomá la canción de ayer.','Escuchá cada acorde y confirmá si es mayor o menor.','Escribí la progresión de la estrofa con tu nivel de confianza (poca, media o mucha).']]],
'4.5':[['A','Reconstruí la grabación y probá inversiones',['Escuchá la grabación de ayer y escribí los 4 acordes con el método: bajo, raíz, mayor o menor. Comprobá con el papel.','Tocá C, después C/E (E en el bajo: cuerda 6 al aire) y C/G (G en el bajo: cuerda 6, traste 3).','Escuchá cómo cambia el peso del acorde. Los diagramas están en el paso “Escuchar”.']],
['B','Verificá tu hipótesis y contá aciertos',['Tomá tu hipótesis de la canción nueva.','Recién ahora, verificala con Mesa.','Anotá acordes correctos y total en Progreso → Prueba de canción.']]],
'5.1':[['A','Escuchá el color de cada grado',['Tocá C y después F; volvé a C y tocá G; volvé a C y tocá Am.','Describí cada cambio con una palabra (por ejemplo: calma, tensión, tristeza).','Repetí en G mayor: G con C, con D y con Em.']],
['B','¿El cambio va al IV o al V?',['Elegí 3 canciones tuyas en mayor.','En el primer cambio de acorde, decidí si va al IV o al V antes de mirar.','Comprobá con los acordes que ya sabés.']]],
'5.2':[['A','V → I y I → V',['Tocá G → C (llega) y C → G (queda esperando) varias veces.','Hacelo también en G (D → G) y en D (A → D).','Medí tu oído con el ejercicio “Oído: grados” en Practicar.']],
['B','Pausá y predecí',['Poné una canción conocida y pausala justo antes de un cambio.','Decí a qué grado creés que va.','Reanudá y comprobá. Hacelo con 10 cambios y anotá cuántos acertaste.']]],
'5.3':[['A','I–IV–V o I–V–vi–IV, sin mirar',['Tocá las dos progresiones en C: C–F–G y C–G–Am–F.','Grabalas en un orden al azar y después adiviná cuál es cada una.','Pista: contá los acordes y buscá el menor.']],
['B','Grados de 5 cambios',['Elegí una canción de la que no tengas los acordes.','Escribí en grados los primeros 5 cambios, de oído.','Verificá con Mesa.']]],
'5.4':[['A','Dos finales en menor',['Tocá Am–G–F (baja suave) y Am–Dm–E–Am (cierra con tensión).','Escuchá el G♯ de E: es la nota que empuja hacia A.','Repetí en E menor: Em–D–C y Em–Am–B–Em.']],
['B','Predecí en una canción menor',['Elegí una canción en menor.','Pausá antes de cada cambio y predecí: ¿VII, VI, iv o V?','Comprobá y anotá aciertos.']]],
'5.5':[['A','La misma progresión con otro ritmo',['Tocá C–G–Am–F con rasgueo lento, después arpegiado y después con un ritmo rápido.','Notá que el bajo y el reposo no cambian.','Usá el metrónomo de abajo para mantener el tempo.']],
['B','Canción nueva completa',['Elegí una canción nueva.','Aplicá el método: tonalidad, raíces, mayor o menor.','Anotá hipótesis y confianza; recién después verificá con Mesa.']]],
'6.1':[['A','El círculo de quintas',['Abrí Explorar → Círculo de quintas y tocá C, G, D, A y E.','Mirá cuántos sostenidos suma cada paso.','Escribí de memoria el I, IV y V de cada una (IV = vecina de la izquierda, V = vecina de la derecha).']],
['B','Transportá en papel',['Elegí una progresión tuya y escribila en grados.','Escribila en otra tonalidad, sin la guitarra.','Tocala para comprobar que suena igual, pero más aguda o más grave.']]],
'6.2':[['A','I–V–vi–IV en cuatro tonalidades',['G: G–D–Em–C. D: D–A–Bm–G. A: A–E–F♯m–D. E: E–B–C♯m–A.','Tocala 4 vueltas en cada una.','F♯m, C♯m, Bm y B se hacen con cejilla: mañana vemos las formas.']],
['B','Sin papel',['Elegí una de las cuatro tonalidades al azar.','Tocá la progresión sin mirar la lista.','Repetí hasta poder hacerlo en las cuatro.']]],
'6.3':[['A','Formas móviles con cejilla',['Forma tipo E: tocá F (cejilla en el traste 1). Movela al traste 3: es G; al 5: es A.','Forma tipo A: tocá B♭ (cejilla en el traste 1). Movela al traste 2: es B; al 3: es C.','Menores: forma tipo Em (F♯m en el traste 2) y forma tipo Am (Bm en el traste 2).']],
['B','Una canción con cejilla',['Elegí una canción que toques con acordes abiertos.','Tocala usando formas con cejilla para todos los acordes.','Compará el sonido: más compacto y parejo.']]],
'6.4':[['A','Transportá una sección',['Elegí una estrofa de tu repertorio y escribila en grados.','Pasala a otra tonalidad y tocala.','Probá también con capotraste: las mismas formas suenan en otro tono.']],
['B','Elegí el tono cómodo',['Tocá la sección en dos tonos distintos.','Decidí cuál te resulta más cómodo.','Anotá ese tono y el traste del capo, si lo usaste.']]],
'6.5':[['A','Transportá una canción menor',['Elegí una canción menor y escribila en grados (i, VII, VI…).','Pasala a otra tonalidad menor, por ejemplo de A menor a E menor.','Tocala para comprobar.']],
['B','Repaso del círculo',['Escribí de memoria las 5 tonalidades mayores y sus relativas menores.','Comprobá con Explorar → Círculo de quintas.','Hacé el ejercicio “Transporte” en Practicar.']]],
'7.1':[['A','Tres tipos de séptima',['Tocá C, después Cmaj7 y después C7. Cmaj7 suena suave; C7, tenso.','Tocá Am y Am7.','Las formas están en el paso “Escuchar”.']],
['B','Tríada o séptima, de oído',['Hacé el ejercicio “Tríada o séptima” en Practicar.','Grabá G y G7 en un orden al azar y después adiviná cuál es cada uno.','Anotá cuántas acertaste de 10.']]],
'7.2':[['A','V7 → I',['Tocá G7 → C, D7 → G, A7 → D y E7 → A.','Compará G → C con G7 → C: la séptima hace la llegada más fuerte.','Repetí cada una 4 veces.']],
['B','Reconocé el V7 antes de que resuelva',['Escuchá canciones tuyas y buscá un acorde con ese “picante” de tensión.','Predecí que el siguiente es el I.','Anotá en qué canciones aparece.']]],
'7.3':[['A','Inversiones de C',['Tocá C, C/E y C/G.','Escuchá cómo cambia el bajo: C, E, G.','Probá G/B: G con B en el bajo (cuerda 5, traste 2).']],
['B','Bajos que no son raíz',['Elegí una canción y aislá el bajo con Mesa.','Buscá un momento en que el bajo no coincida con la raíz del acorde.','Anotá cuál es la inversión.']]],
'7.4':[['A','Tríadas en las cuerdas 3, 2 y 1',['C en tres posiciones: trastes 0-1-0, 5-5-3 y 9-8-8.','F en tres posiciones: trastes 2-1-1, 5-6-5 y 10-10-8.','Pasá de C a F por la posición más cercana (0-1-0 → 2-1-1): casi no movés la mano.']],
['B','Aplicalo a un acompañamiento',['Elegí una canción con C y F (o transportala).','Tocá el acompañamiento solo con tríadas agudas.','Grabalo y compará con la versión de acordes completos.']]],
'7.5':[['A','Bajo descendente',['Tocá C – G/B – Am – F. El bajo hace C, B, A, F.','G/B: B en la cuerda 5, traste 2.','Repetí lento hasta que el bajo suene como una línea.']],
['B','Detectalo en canciones',['Escuchá canciones tuyas buscando un bajo que baja nota a nota.','Cuando lo encuentres, escribí los acordes con su bajo (con barra).','Verificá con Mesa.']]],
'8.1':[['A','bVII: C–B♭–F–C',['Tocá C–B♭–F–C. B♭ va con cejilla en el traste 1 (forma tipo A).','Notas de B♭: B♭, D, F. La que no está en C mayor es B♭.','En G mayor el bVII es F: tocá G–F–C–G.']],
['B','Buscá un bVII',['Revisá canciones de rock de tu repertorio.','Buscá un acorde mayor un tono abajo de la tónica (B♭ en C, F en G, C en D).','Anotá cuáles lo tienen.']]],
'8.2':[['A','IV y iv',['Tocá C–F–Fm–C. Fm va con cejilla en el traste 1 (forma tipo Em).','Compará con C–F–F–C.','En G: G–C–Cm–G (Cm con forma tipo Am en el traste 3).']],
['B','IV o iv, de oído',['Grabá C–F–C y C–Fm–C en un orden al azar.','Escuchá y decí cuál es cada una.','Hacé el ejercicio “Acordes ajenos” en Practicar.']]],
'8.3':[['A','V/V: D7–G7–C',['Tocá D7–G7–C varias veces.','Escuchá el F♯ de D7: no está en C mayor y empuja hacia G.','En G mayor: A7–D7–G.']],
['B','Reconocé el movimiento',['Buscá en tus canciones un acorde mayor o con séptima en el lugar 2 de la tonalidad.','Fijate si después viene el V.','Anotá los casos.']]],
'8.4':[['A','V/vi: C–E7–Am',['Tocá C–E7–Am.','Escuchá el G♯ de E7: empuja hacia A.','En G mayor: G–B7–Em.']],
['B','Un caso real',['Buscá una canción con un acorde mayor en el lugar 3 (E en C, B en G).','Fijate si después viene el vi.','Anotá la canción y el lugar.']]],
'8.5':[['A','Un acorde raro de una canción',['Elegí un acorde que no encaje en la tonalidad de una canción tuya.','Escribí sus notas y marcá la que sale de la escala.','Proponé 2 explicaciones: bVII, iv, V/V, V/vi o cambio de tonalidad.']],
['B','Confianza y verificación',['Anotá tu explicación preferida y tu confianza.','Verificá con Mesa o buscando el cifrado.','Hacé el ejercicio “Acordes ajenos” para medir el criterio de la semana.']]],
'9.1':[['A','Pentatónica menor, posición 1',['Ubicá A en la cuerda 6, traste 5.','Tocá la posición: cuerda 6 trastes 5 y 8; cuerdas 5, 4 y 3 trastes 5 y 7; cuerdas 2 y 1 trastes 5 y 8.','Subí y bajá lento. Cada vez que pises un A (cuerda 6 traste 5, cuerda 4 traste 7, cuerda 1 traste 5), decilo en voz alta.']],
['B','Tocá la melodía de una frase',['Elegí una frase corta de la melodía de una canción conocida.','Buscala nota por nota en la guitarra.','Fijate si sus notas están en la pentatónica.']]],
'9.2':[['A','Frases con pausas',['Grabá (o poné) una base Am–F–C–G, un acorde por compás, a 70–80 BPM.','Tocá 2 compases de frase y dejá 2 de silencio.','Repetí 8 veces.']],
['B','Repetí y variá una idea',['Inventá una frase de 3 o 4 notas.','Repetila cambiando solo el ritmo o la última nota.','Grabá una toma de 1 minuto.']]],
'9.3':[['A','Terminá en nota del acorde',['Antes de empezar, ubicá en la posición 1 estas notas: Am → A, C, E. F → A, C. C → C, E, G. G → G, D.','Sobre la base Am–F–C–G, terminá cada frase en una nota del acorde que suena.','Tocá 8 frases y contá cuántas terminaste bien.']],
['B','Compará con una nota de paso',['Terminá una frase sobre Am en D (no es del acorde).','Después terminala en A.','Describí la diferencia.']]],
'9.4':[['A','Mayor y menor con las mismas notas',['Sobre una base C–F–G, tocá la posición 1 apoyándote en C: es C mayor pentatónica.','Sobre una base Am–G–F, tocá la misma posición apoyándote en A.','Notá cómo el mismo grupo de notas cambia de carácter según dónde reposás.']],
['B','¿Cuál suena mejor?',['Improvisá sobre cada base.','Anotá cuál te gustó más en cada una.','Hacé el ejercicio “Pentatónica” en Practicar.']]],
'9.5':[['A','Base y 3 tomas',['Grabá una base de 4 acordes de 1 minuto.','Tocá 3 tomas encima, una detrás de otra, sin parar a corregir.','Guardalas para escucharlas mañana.']],
['B','Elegí la mejor',['Escuchá las 3 tomas.','Elegí la mejor: frases que terminan en nota del acorde, pausas e ideas que se repiten.','Escribí en 2 líneas por qué la elegiste.']]],
'10.1':[['A','Canción 1: tonalidad y estrofa',['Elegí una canción que te guste y no hayas analizado.','Encontrá dónde reposa: esa es la tonalidad.','Escribí la estrofa en grados.']],
['B','Verificá',['Anotá tu confianza.','Verificá con Mesa.','Corregí lo que falló y anotá por qué te confundiste.']]],
'10.2':[['A','Estribillo y estrofa',['Escribí el estribillo en grados.','Compará con la estrofa: ¿qué cambia?','Marcá el momento de más tensión.']],
['B','Funciones',['Debajo de cada grado escribí T, P o D.','Mirá cómo se mueve la tensión a lo largo de la canción.','Tocá la canción pensando en las funciones.']]],
'10.3':[['A','Ajenos, inversiones y bajo',['Buscá acordes ajenos y anotá la nota que sale de la escala.','Aislá el bajo con Mesa y buscá inversiones.','Proponé una explicación para cada caso.']],
['B','Ficha de la canción 1',['Armá la ficha: tonalidad, secciones en grados, funciones, ajenos y confianza.','Verificá con Mesa lo que falte.','Guardala (papel o nota del celular).']]],
'10.4':[['A','Canción 2 completa',['Elegí una segunda canción, de otro estilo.','Repetí el método completo.','Tratá de hacerlo más rápido que con la primera.']],
['B','Ficha de la canción 2',['Armá la ficha.','Comparala con la de la canción 1.','Anotá qué patrones tienen en común.']]],
'10.5':[['A','(Opcional) D mayor o D mixolidio',['Grabá un acorde de D sonando 1 minuto.','Encima, tocá la escala de D mayor (con C♯) y después con C natural.','Escuchá cómo el C natural le da un color más rockero.']],
['B','(Opcional) D menor o D dórico',['Sobre Dm sonando, tocá D menor (con B♭) y después con B natural.','El B natural le da un color menos triste.','Probá alternar Dm y G: es el sonido dórico.']]],
'12.1':[['A','Analizá una canción nueva',['Elegí una canción nueva.','Escribí tonalidad, grados y funciones.','Anotá tu confianza.']],['B','Verificá',['Verificá con Mesa.','Corregí y contá aciertos.','Guardá la ficha.']]],
'12.2':[['A','Una segunda canción',['Analizá una segunda canción con el mismo método.','Armá su ficha.','Anotá tu confianza.']],['B','Compará',['Poné las dos fichas lado a lado.','Anotá qué patrones se repiten.','Anotá qué te costó más en cada una.']]],
'12.3':[['A','Sacá de oído una tercera',['Elegí una canción nueva. Sin límite de tiempo, pero escribí la hipótesis antes de verificar.','Usá todo: bajo, inversiones, acordes ajenos.','Anotá tu confianza.']],['B','Hipótesis → Mesa',['Verificá con Mesa.','Registrá el resultado en Progreso → Prueba de canción.','Compará con tu resultado de la semana 4.']]],
'12.4':[['A','Transportá una canción completa',['Escribí la canción en grados.','Pasala a otra tonalidad (con o sin capo).','Tocala entera.']],['B','Tocala en el nuevo tono',['Tocala 3 veces sin mirar.','Grabala.','Comparala con el tono original.']]],
'12.5':[['A','Tu propia variación',['Elegí una canción que ya analizaste.','Cambiá algo del acompañamiento: un bajo que camina, un V7 antes del I o tríadas agudas.','Ensayala hasta que salga fluida.']],['B','Grabá y cerrá el programa',['Grabá tu versión.','Hacé la prueba de nivel final (en Practicar).','En Progreso, compará con tu punto de partida.']]]});
T11.forEach((t,i)=>{TX['11.'+(i+1)]=[['A','Canción nueva '+t+' (15 min)',['Elegí una canción '+t+' que no sepas tocar.','Poné un reloj de 15 minutos y aplicá el método: tonalidad, bajo, raíces, mayor o menor, patrones.','Antes de que termine el tiempo, escribí la estrofa y tu confianza.']],['B','Verificá y registrá',['Verificá con Mesa.','Contá acordes correctos sobre el total.','Registralo en Progreso → Prueba de canción, con tu confianza.']]]});
/* ===== Sesiones extra (opcionales, entre la sesión 5 y la prueba) ===== */
Object.assign(SHP,{'G|E':[3,5,5,4,3,3],'A|E':[5,7,7,6,5,5],Dsus2:[-1,-1,0,2,3,0],Dsus4:[-1,-1,0,2,3,3],Asus2:[-1,0,2,2,0,0],Asus4:[-1,0,2,2,3,0],Esus4:[0,2,2,2,0,0],Cadd9:[-1,3,2,0,3,0],E5:[0,2,2,-1,-1,-1],A5:[-1,0,2,2,-1,-1],G5:[3,5,5,-1,-1,-1],C5:[-1,3,5,5,-1,-1],D5:[-1,5,7,7,-1,-1],F5:[1,3,3,-1,-1,-1]});
const XW={7:['Acordes sus, add9 y power chords','Reconocer acordes que no son ni mayores ni menores.'],9:['Blues de 12 compases','La forma I7–IV7–V7 y la escala de blues.']};
Object.assign(DEMO,{
'7.7':[['D → Dsus4 → D',['D','Dsus4','D'],'D'],['D → Dsus2 → D',['D','Dsus2','D'],'D'],['A → Asus4 → A → Asus2',['A','Asus4','A','Asus2'],'A'],['C → Cadd9',['C','Cadd9'],'C'],['Power chords: E5–G5–A5',['E5','G5','A5']]],
'9.7':[['Blues en A (12 compases)',['A7','A7','A7','A7','D7','D7','A7','A7','E7','D7','A7','E7'],'A'],['Escala de blues de A',['~A','~C+','~D+','~Eb+','~E+','~G+','~A+']]]});
Object.assign(TX,{
'7.7':[['A','Sus y add9 en acordes abiertos',['Tocá D y después Dsus4: agregá el meñique en la cuerda 1, traste 3. Volvé a D y escuchá cómo la tensión se resuelve.','Ahora Dsus2: levantá el dedo de la cuerda 1 y dejala al aire. Volvé a D. El sus2 suena abierto, sin “pedir” tanto.','Repetí con A: A → Asus4 (cuerda 2, traste 3) → A → Asus2 (cuerda 2 al aire).','Tocá C y después Cadd9: en la cuerda 2 pasá del traste 1 al traste 3, con el meñique. Sigue sonando mayor, con más brillo.']],
['B','Power chords y oído',['E5: cuerdas 6, 5 y 4 en los trastes 0, 2 y 2. G5: cuerda 6 traste 3 y cuerdas 5 y 4 traste 5. A5: cuerda 5 al aire y cuerdas 4 y 3 traste 2.','Tocá E5–G5–A5 con la eléctrica y distorsión: suenan definidos donde un acorde completo se ensucia.','Hacé el ejercicio “Sus y power chords” de esta sesión.','Escuchá una canción de rock tuya y buscá acordes que no suenen ni mayores ni menores: anotá si son sus o power chords.']]],
'9.7':[['A','Tocá el blues de 12 compases',['En A: A7, A7, A7, A7 · D7, D7, A7, A7 · E7, D7, A7, E7. Un acorde por compás (4 tiempos).','Usá el metrónomo a 80 BPM y contá los compases en voz alta: así no te perdés en la forma.','Pasalo a E con el mismo esquema: E7, A7 y B7.']],
['B','Improvisá encima',['Grabá la base en A, cuatro vueltas.','Usá la pentatónica menor de A en la posición 1 (traste 5) y agregá la blue note E♭: cuerda 5 traste 6 y cuerda 3 traste 8.','Terminá las frases en notas del acorde: sobre A7, en A o E; sobre D7, en D o A; sobre E7, en E o D.','Hacé el ejercicio “Blues de 12 compases” de esta sesión.']]]});
const WD={1:'acordes',2:'oido',3:'acordes',4:'bajo',5:'ogr',6:'transporte',7:'sept',8:'ajenos',9:'penta',10:'grados',11:'ogr',12:'transporte'};

/* ===== Ejercicios autocorregidos ===== */
const R_=n=>Math.floor(Math.random()*n),pick=a=>a[R_(a.length)],shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=R_(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const mk=(t,right,wrong,ex)=>{const w=shuf(wrong.filter((x,i,a)=>x!=right&&a.indexOf(x)==i)).slice(0,3),o=shuf([right,...w]);return Object.assign({t,o,a:o.indexOf(right)},ex)};
const DN={bajo:'Oído: el bajo',sus:'Sus y power chords',blues:'Blues de 12 compases',tono:'¿En qué tonalidad está?',func:'Función del acorde',mastil:'Notas en el mástil',notas:'Notas de un acorde',capo:'Capotraste',reposo:'Oído: ¿dónde está la casa?',acordes:'Acordes de la tonalidad',grados:'Grado de un acorde',transporte:'Transporte',ajenos:'Acordes ajenos',penta:'Pentatónica',oido:'Oído: progresiones',ogr:'Oído: grados',calidad:'Mayor o menor',sept:'Tríada o séptima'};
const DS={bajo:'Bajo',sus:'Sus/power',blues:'Blues',tono:'Tonalidad',func:'Función',mastil:'Mástil',notas:'Notas acorde',capo:'Capotraste',reposo:'Casa (oído)',acordes:'Acordes',grados:'Grados',transporte:'Transporte',ajenos:'Ajenos',penta:'Pentatónica',oido:'Progresiones',ogr:'Oído grados',calidad:'May. o men.',sept:'Séptimas'};
const DD={bajo:'Suena el acorde de casa y después una nota grave: decís qué grado es. Desde la sesión 4.5 también aparece qué nota del acorde está en el bajo (raíz, 3.ª o 5.ª).',sus:'Escuchás un acorde y decís si es mayor, menor, sus2 o sus4, o elegís las notas de un sus, add9 o power chord.',blues:'Preguntas sobre el esquema de 12 compases, sus acordes y la escala de blues.',tono:'Te damos los acordes de una canción y en cuál termina. Vos decís la tonalidad.',func:'Te damos un acorde y la tonalidad. Vos decís si es tónica, predominante o dominante.',mastil:'Te damos cuerda y traste (o una nota). Vos encontrás la nota (o el traste).',notas:'Te damos un acorde. Vos elegís las notas que lo forman.',capo:'Te damos formas y un traste de capo. Vos decís en qué tonalidad suena.',reposo:'Suena una progresión. Vos elegís el acorde que se siente como casa.',acordes:'Te damos una tonalidad y un lugar de la escala. Vos decís qué acorde le corresponde.',grados:'Te damos un acorde y la tonalidad. Vos decís qué lugar (grado) ocupa.',transporte:'Te damos una progresión en números y una tonalidad. Vos elegís los acordes.',ajenos:'Te damos un acorde que no es de la tonalidad. Vos encontrás la nota que sobra o la explicación.',penta:'Te damos una pentatónica. Vos encontrás la nota que no le pertenece.',oido:'Primero suena el acorde de casa. Después, una progresión: elegís cuál de los patrones es.',ogr:'Suena el acorde de casa y después otro. Vos decís qué grado es el segundo.',calidad:'Escuchás un acorde y decís si suena mayor o menor.',sept:'Escuchás un acorde y decís si es una tríada o tiene séptima.'};
const GT=['acordes','grados','func','tono','transporte','ajenos','blues'],GG=['mastil','notas','capo','penta'],GO=['reposo','bajo','oido','ogr','calidad','sept','sus'],MONO=new Set(['acordes','grados','transporte','oido','ogr','reposo']);
const chordSp=(r,q)=>{const N=majNotes(r),t=q=='m'||q=='m7'?flatN(N[2]):N[2],a=[N[0],t,N[4]];if(q=='7'||q=='m7')a.push(flatN(N[6]));if(q=='maj7')a.push(N[6]);return a};
const flatN=n=>n.length>1&&n[1]=='#'?n[0]:n+'b',sharpN=n=>n.length>1&&n[1]=='b'?n[0]:n+'#';
const AJT={bVII:'bVII: prestado de la tonalidad menor',iv:'iv: prestado de la tonalidad menor',VV:'V/V: dominante del V',Vvi:'V/vi: dominante del vi'};
function ajeno(r,t){const N=majNotes(r);if(t=='bVII'){const x=flatN(N[6]);return{ch:x,notes:[x,N[1],N[3]],out:x}}if(t=='iv'){const x=flatN(N[5]);return{ch:N[3]+'m',notes:[N[3],x,N[0]],out:x}}if(t=='VV'){const x=sharpN(N[3]);return{ch:N[1]+'7',notes:[N[1],x,N[5],N[0]],out:x}}const x=sharpN(N[4]);return{ch:N[2]+'7',notes:[N[2],x,N[6],N[1]],out:x}}
/* Nivel: los ejercicios solo usan lo que ya se enseñó hasta la sesión actual. */
let LVF=0;
const lvW=()=>LVF||S.cfg.lv=='all'||!S.w?99:S.w;
function lvKeys(){const w=lvW(),s=w==99?9:S.s,o=['C'];if(w>1||s>=3)o.push('G','D');if(w>1||s>=4)o.push('A','E');if(w>=3)o.push('Am','Em','Dm','Bm');if(w>=6)o.push('F');return o}
const LK=()=>{const ids=lvKeys();return KEYS.filter(k=>ids.includes(k.id))},LMIN=()=>LK().some(k=>k.m=='m');
const LTRI=()=>[...new Set(LK().flatMap(k=>k.ch))].filter(c=>{const p=parse(c);return p&&(p.q=='M'||p.q=='m')});
const pickMode=pm=>{const mn=LMIN()&&Math.random()<pm;return pick(LK().filter(k=>k.m==(mn?'m':'M')))};
const BLS=['I7','I7','I7','I7','IV7','IV7','I7','I7','V7','IV7','I7','V7'],SUSX={sus2:'La 3.ª se reemplaza por la 2.ª.',sus4:'La 3.ª se reemplaza por la 4.ª.','5':'Solo raíz y 5.ª, sin 3.ª: no es mayor ni menor.',add9:'Tríada mayor más la 9.ª (la 2.ª, una octava arriba).'};
function genQ(d){
if(d=='bajo'){const w=lvW();if((w>4||(w==4&&S.s>=5))&&Math.random()<.4){const X=pick([['C','C/E','C/G'],['G','G/B','G/D'],['F','F/A','F/C'],['D','D/F#','D/A']]),i=R_(3),O=['La raíz','La 3.ª','La 5.ª'];return{d,t:'Suena un acorde. Escuchá la nota más grave: ¿qué nota del acorde está en el bajo?',o:O,a:i,play:[X[i]],ex:`Era ${pretty(X[i])}: ${O[i].toLowerCase()} (${nES(i?X[i].split('/')[1]:X[i])}) en el bajo.`}}
const k=pickMode(.3),D=k.m=='M'?(w>=5?[0,1,2,3,4,5]:[0,3,4,5]):[0,2,3,4,5,6],i=pick(D),n=k.sc[i],mid=40+((NPC(n)-4+12)%12),bn='~'+n+(Math.floor(mid/12)-1),lab=j=>`${ORD[j]} (${nES(k.sc[j])})`;
return mk(`Suena el acorde de casa (${pretty(k.ch[0])}, ${k.n}) y después una nota grave, dos veces. ¿Qué grado de la escala es?`,lab(i),D.map(lab),{d,k,play:[k.ch[0],bn,bn],ex:`Era el ${ORD[i]} grado: ${nES(n)}.`})}
if(d=='sus'){const r=pick(['C','D','E','G','A']);
if(Math.random()<.5){const T_=[['M','Mayor'],['m','Menor'],['sus2','sus2'],['sus4','sus4']],x=pick(T_),ch=r+(x[0]=='M'?'':x[0]);return{d,t:'Escuchá el acorde. ¿Es mayor, menor, sus2 o sus4?',o:T_.map(y=>y[1]),a:T_.indexOf(x),play:[ch],ex:`Era ${pretty(ch)}: ${chordES(ch)}.`}}
const q=pick(['sus2','sus4','5','add9']),N=majNotes(r),SP={sus2:[N[0],N[1],N[4]],sus4:[N[0],N[3],N[4]],'5':[N[0],N[4]],add9:[N[0],N[2],N[4],N[1]]},f=a=>a.map(nES).join(' – '),ch=r+q;
return mk(`¿Qué notas forman ${pretty(ch)}?`,f(SP[q]),[f([N[0],N[2],N[4]])].concat(Object.keys(SP).filter(z=>z!=q).map(z=>f(SP[z]))),{d,ex:`${pretty(ch)} = ${f(SP[q])}. ${SUSX[q]}`})}
if(d=='blues'){const r=pick(['A','E','G','C','D']),N=majNotes(r),C_={I7:N[0]+'7',IV7:N[3]+'7',V7:N[4]+'7'},v=R_(3),tn=nES(r);
if(v==0){const b=R_(12);return mk(`Blues de 12 compases en ${tn}, esquema estándar. ¿Qué acorde va en el compás ${b+1}?`,pretty(C_[BLS[b]]),Object.values(C_).map(pretty),{d,ex:`Esquema: ${BLS.slice(0,4).join(' ')} · ${BLS.slice(4,8).join(' ')} · ${BLS.slice(8).join(' ')}. El compás ${b+1} es ${BLS[b]}: ${pretty(C_[BLS[b]])}.`})}
if(v==1){const g=pick(['IV7','V7']);return mk(`En un blues en ${tn}, ¿cuál es el ${g}?`,pretty(C_[g]),[C_.I7,C_[g=='IV7'?'V7':'IV7'],N[1]+'7',N[5]+'7'].map(pretty),{d,ex:`En ${tn}: I7 = ${pretty(C_.I7)}, IV7 = ${pretty(C_.IV7)}, V7 = ${pretty(C_.V7)}. El IV y el V salen de la 4.ª y la 5.ª nota de la escala mayor.`})}
const pn=[N[0],flatN(N[2]),N[3],N[4],flatN(N[6])],bn=flatN(N[4]);
return mk(`¿Qué nota se agrega a la pentatónica menor de ${tn} (${pn.map(nES).join(', ')}) para formar la escala de blues?`,nES(bn),[flatN(N[1]),N[2],N[5]].map(nES),{d,ex:`Escala de blues de ${tn}: ${[pn[0],pn[1],pn[2],bn,pn[3],pn[4]].map(nES).join(', ')}. La nota agregada es la 5.ª disminuida (blue note).`})}
if(d=='acordes'){const k=pick(LK()),LB=k.m=='M'?RM:Rm,i=R_(7),r=LB[i];return mk(`Tonalidad: ${k.n}. ¿Qué acorde ocupa el lugar ${r}? (es el ${ORD[i]} acorde de la escala)`,pretty(k.ch[i]),k.ch.map(pretty),{d,k,ex:`La escala de ${k.n} es ${exScale(k)}. El ${ORD[i]} lugar (${r}) es el acorde ${pretty(k.ch[i])}.`})}
if(d=='grados'){const k=pick(LK()),LB=k.m=='M'?RM:Rm,i=R_(7);return mk(`Tonalidad: ${k.n}. ¿Qué lugar (grado) ocupa el acorde ${pretty(k.ch[i])}?`,LB[i],LB,{d,k,ex:`${pretty(k.ch[i])} nace de la ${ORD[i]} nota de la escala (${nES(k.sc[i])}), así que es el ${LB[i]}.`})}
if(d=='transporte'){const k=pick(LK()),P=(k.m=='M'?PMaj:PMin).filter(p=>p.split('–').length>=3),p=pick(P),c=p.split('–').map(r=>chordOf(k,r)),right=c.map(pretty).join('–'),wr=[];for(let n=0;n<14&&wr.length<3;n++){const x=c.slice();x[R_(x.length)]=pick(k.ch);const s=x.map(pretty).join('–');if(s!=right&&wr.indexOf(s)<0)wr.push(s)}return mk(`Pasá ${p} a acordes en ${k.n}. ¿Cuál es la progresión correcta?`,right,wr,{d,k,ex:`En ${k.n} los acordes son ${k.ch.map(pretty).join(' · ')}. ${p} es ${right}.`})}
if(d=='oido'){const k=pickMode(.4),mm=k.m,P=mm=='M'?PMaj:PMin,p=pick(P),c=p.split('–').map(r=>chordOf(k,r));return mk(`Primero suena el acorde de casa como referencia. Después, una progresión (tonalidad ${mm=='M'?'mayor':'menor'}). ¿Qué patrón es?`,p,P,{d,play:[k.ch[0],'_'].concat(c),ex:`Era ${p}. En ${k.n} suena ${c.map(pretty).join('–')}.`})}
if(d=='ogr'){const k=pickMode(.3),mm=k.m,G=mm=='M'?['ii','iii','IV','V','vi']:['III','iv','V','VI','VII'],r=pick(G),c=chordOf(k,r);
return mk(`Suena el acorde de casa (${mm=='M'?'I':'i'}) y después otro de la misma tonalidad ${mm=='M'?'mayor':'menor'}. ¿Qué grado es el segundo?`,r,G,{d,play:[k.ch[0],c],ex:`Era el ${r}: en ${k.n}, ${pretty(k.ch[0])} → ${pretty(c)}.`})}
if(d=='sept'){const r=pick(['C','D','E','G','A','B']),s=Math.random()<.5,c=s?r+'7':r;return{d,t:'Escuchá el acorde. ¿Es una tríada (3 notas, estable) o tiene séptima (4 notas, con tensión)?',o:['Tríada','Con séptima'],a:s?1:0,play:[c],ex:`Era ${c} (${chordES(c)}).`}}
if(d=='ajenos'){const r=pick(['C','G','D','F']),k=kinfo(r,0),t=pick(Object.keys(AJT)),x=ajeno(r,t),nm=pretty(x.ch);
if(Math.random()<.5)return mk(`Tonalidad: ${k.name}. Aparece el acorde ${nm} (notas: ${x.notes.map(nES).join(', ')}). ¿Qué nota no pertenece a la escala?`,nES(x.out),x.notes.map(nES),{d,ex:`La escala de ${k.name} es ${k.N.map(nES).join(', ')}. ${nES(x.out)} no está: es la nota ajena. Explicación: ${AJT[t]}.`});
return mk(`Tonalidad: ${k.name}. Aparece el acorde ${nm}. ¿Cuál es la explicación más probable?`,AJT[t],Object.values(AJT),{d,ex:`${nm} en ${k.name} es ${AJT[t]}. Su nota ajena es ${nES(x.out)}.`})}
if(d=='tono'){const MJ=LK().filter(x=>x.m=='M').map(x=>x.id),MR=MJ.filter(x=>LK().some(y=>y.id==kinfo(x,1).tn)),mn=MR.length>0&&Math.random()<.3,r=pick(mn?MR:MJ),k=kinfo(r,mn?1:0),P=pick(mn?PMin:PMaj),c=P.split('–').map(x=>{const i=k.rom.indexOf(x);return i<0?k.V:k.ch[i]});if(c[c.length-1]!=k.ch[0])c.push(k.ch[0]);
const ci=CROOTS.indexOf(r),iv=CROOTS[(ci+11)%12],v=CROOTS[(ci+1)%12];
return mk(`Una canción usa estos acordes, en este orden, y termina en el último: ${c.map(pretty).join(' – ')}. ¿En qué tonalidad está?`,k.name,[kinfo(r,mn?0:1).name,kinfo(iv,mn?1:0).name,kinfo(v,mn?1:0).name,kinfo(v,mn?0:1).name],{d,ex:`Termina y reposa en ${pretty(k.ch[0])}, y todos los acordes son de ${k.name}${mn?` (${pretty(k.V)} es el V mayor que se usa en menor)`:''}.`})}
if(d=='func'){const k=kinfo(pick(LK().filter(x=>x.m=='M').map(x=>x.id)),0),i=R_(7),FL={T:'Tónica (casa)',P:'Predominante (se aleja)',D:'Dominante (tensión)'};return{d,t:`Tonalidad: ${k.name}. ¿Qué función cumple ${pretty(k.ch[i])}?`,o:Object.values(FL),a:'TPD'.indexOf(FN[i]),ex:`${pretty(k.ch[i])} es el ${k.rom[i]} de ${k.name}: ${FL[FN[i]].toLowerCase()}. Tónica: I, iii, vi · predominante: ii, IV · dominante: V, vii°.`}}
if(d=='mastil'){const cs=lvW()<5?pick([6,5]):pick([6,6,5,5,4]),op={6:40,5:45,4:50}[cs],NN=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],nm=i=>nES(NN[((i%12)+12)%12]);
if(Math.random()<.5){const f=R_(13),n=op+f;return mk(`Cuerda ${cs} (al aire es ${nm(op)}), traste ${f}: ¿qué nota es?`,nm(n),[nm(n+1),nm(n-1),nm(n+2),nm(n-2)],{d,ex:`Desde ${nm(op)} al aire, ${f} trastes = ${f} semitonos: ${nm(n)}.`})}
const f=1+R_(11),n=op+f;return mk(`¿En qué traste de la cuerda ${cs} (al aire es ${nm(op)}) está ${nm(n)}?`,'Traste '+f,[1,-1,2,-2].map(x=>'Traste '+(f+x)).filter(x=>!/ (0|12|-1|13)$/.test(x)),{d,ex:`${nm(n)} está en el traste ${f} de la cuerda ${cs}.`})}
if(d=='notas'){const sev=lvW()>=7&&Math.random()<.4,NQ=sev?null:parse(pick(LTRI())),q=sev?pick(['7','7','maj7','m7']):NQ.q,r=sev?pick(q=='m7'?['C','D','E','G','A','B','F#']:['C','D','E','F','G','A','B']):NQ.r,ch=r+(q=='M'?'':q),a=chordSp(r,q),N=majNotes(r),f=x=>x.map(nES).join(' – '),alt=chordSp(r,q=='m'?'M':q=='M'?'m':q=='m7'?'7':'m7'),tail=a.slice(3);
return mk(`¿Qué notas forman el acorde ${pretty(ch)}?`,f(a),[f(alt),f([N[0],N[3],N[4]].concat(tail)),f([N[0],a[1],N[5]].concat(tail)),f([N[1],N[3],N[5]])],{d,ex:`${pretty(ch)} (${chordES(ch)}) = ${f(a)}.`})}
if(d=='capo'){const sh=pick(['C','G','D','A','E']),cp=1+R_(5),NN=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'],to=i=>nES(NN[(NPC(sh)+i+12)%12])+' mayor';
return mk(`Tocás con formas de ${nES(sh)} mayor y capotraste en el traste ${cp}. ¿En qué tonalidad suena?`,to(cp),[to(cp+1),to(cp-1),to(cp+2),to(0)],{d,ex:`Cada traste de capo sube un semitono: ${nES(sh)} + ${cp} trastes = ${to(cp)}.`})}
if(d=='reposo'){const k=pickMode(.35),mn=k.m=='m',P=mn?[['VI','VII','i'],['iv','VII','III','VI','V','i'],['VI','III','VII','i'],['iv','V','i'],['i','VII','VI','VII','i','VII','VI','V'],['i','iv','i','V']]:[['vi','IV','V','I'],['IV','V','iii','vi','ii','V','I'],['ii','IV','V','I'],['vi','ii','V','I'],['IV','I','V','I'],['I','IV','I','V'],['I','vi','IV','V','I','vi','IV','V'],['I','V','IV','V']],c=pick(P).map(r=>chordOf(k,r));
return mk('Escuchá la progresión. ¿En qué acorde la música se siente “en casa”?',pretty(k.ch[0]),[...new Set(c)].map(pretty),{d,play:c,ex:`Estaba en ${k.n}: la casa es ${pretty(k.ch[0])}. Sonó ${c.map(pretty).join(' – ')}.`})}
if(d=='penta'){const mn=Math.random()<.6,k=kinfo(pick(['C','G','D','A','E','F']),mn?1:0),idx=mn?[0,2,3,4,6]:[0,1,2,4,5],inn=idx.map(i=>k.notes[i]),out=k.notes.filter((_,i)=>!idx.includes(i)),tn=nES(k.notes[0]);
return mk(`¿Qué nota NO está en la pentatónica ${mn?'menor':'mayor'} de ${tn}?`,nES(pick(out)),shuf(inn).slice(0,3).map(nES),{d,ex:`${tn} ${mn?'menor':'mayor'} pentatónica: ${inn.map(nES).join(', ')}. Se quitan la ${mn?'2.ª y la 6.ª':'4.ª y la 7.ª'} nota de la escala.`})}
const c=pick(LTRI()),q=parse(c).q=='M'?'Mayor':'Menor';
return{d:'calidad',t:'Escuchá este acorde. ¿Suena mayor (más abierto y alegre) o menor (más oscuro y triste)?',o:['Mayor','Menor'],a:q=='Mayor'?0:1,play:[c],ex:`Era ${pretty(c)}: ${q.toLowerCase()}.`}}
const autoPlay=()=>{if(QS&&!QS.done){const q=QS.l[QS.i];if(q&&q.play)playSeq(q.play,q.play.length==1?1.6:1.1,'#nohl')}};

/* ===== Iconos ===== */
const svgi=(p,f)=>`<svg viewBox="0 0 24 24" fill="${f||'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={
logo:svgi('<path d="M7 4v16M12 9v11M17 4v16"/><path d="M4.5 8h5M9.5 13h5M14.5 9h5"/>'),
est:svgi('<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>'),
pra:svgi('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
exp:svgi('<path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z"/>'),
prog:svgi('<path d="M5 20v-7M12 20V5M19 20v-10"/>'),
tut:svgi('<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>'),
cfg:svgi('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
moon:svgi('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
sun:svgi('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
play:svgi('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>'),
pause:svgi('<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>'),
prev:svgi('<path d="M15 5l-7 7 7 7"/>'),
next:svgi('<path d="M9 5l7 7-7 7"/>'),
back:svgi('<path d="M15 5l-7 7 7 7"/>'),
check:svgi('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
x:svgi('<path d="M6 6l12 12M18 6L6 18"/>'),
flame:svgi('<path d="M12 2c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.2 1.6 1 2.2 1.8 2.2C10.5 7 11 4.5 12 2z" fill="currentColor" stroke="none"/>'),
redo:svgi('<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19 4v4.5h-4.5"/>'),
mesa:svgi('<path d="M7 4v16M12 9v11M17 4v16"/><path d="M4.5 8h5M9.5 13h5M14.5 9h5"/>')};
const DCOL={tono:4,func:2,mastil:3,notas:1,capo:5,reposo:1,acordes:0,grados:4,transporte:5,oido:3,calidad:1,ogr:0,sept:5,ajenos:2,penta:0,bajo:4,sus:5,blues:1,repaso:1,nivel:0};
const EXI={acordes:'AC',grados:'GR',func:'FN',tono:'TO',transporte:'TR',ajenos:'AJ',blues:'BL',mastil:'MA',notas:'NA',capo:'CP',penta:'PE',reposo:'CA',bajo:'BA',oido:'PR',ogr:'OG',calidad:'Mm',sept:'7ª',sus:'SU',repaso:'RE',nivel:'NV'};
const dn=d=>DN[d]||(d=='repaso'?'Repaso de errores':'Prueba de nivel');


/* ===== Repaso de errores (cajas de repaso espaciado) ===== */
if(!Array.isArray(S.err))S.err=[];
const dnum=()=>Math.floor(Date.now()/864e5),EDAYS=[0,1,3],ERRMAX=60;
const ekey=q=>q.d+'|'+q.t+'|'+(q.play||[]).join(',');
function errAdd(q){const o={d:q.d,t:q.t,o:q.o,a:q.a,ex:q.ex,play:q.play,kid:q.k?q.k.id:null,box:1,due:dnum()};o.key=ekey(o);S.err=S.err.filter(e=>e.key!=o.key);S.err.unshift(o);S.err=S.err.slice(0,ERRMAX)}
function errRes(q,ok){const key=ekey(q),e=S.err.find(x=>x.key==key);if(!e)return;if(!ok){e.box=1;e.due=dnum();return}e.box++;if(e.box>3)S.err=S.err.filter(x=>x!==e);else e.due=dnum()+EDAYS[e.box-1]}
const errDue=()=>S.err.filter(e=>e.due<=dnum());
function startReview(){const pool=errDue().length?errDue():S.err.slice();if(!pool.length)return;const l=pool.sort((a,b)=>a.box-b.box).slice(0,10).map(e=>Object.assign({},e,{k:e.kid?KEYS.find(k=>k.id==e.kid):undefined}));
QS={d:'repaso',l,i:0,ans:null,res:[],test:false,review:true,cmb:0,best:0};tab='pra';R();window.scrollTo(0,0);setTimeout(autoPlay,250)}

/* ===== Quiz ===== */
function startQuiz(d,n,from){const l=[];if(d=='nivel'){LVF=99;['acordes','grados','transporte','oido'].forEach(x=>{for(let i=0;i<3;i++)l.push(genQ(x))});LVF=0;QS={d,l:shuf(l),i:0,ans:null,res:[],test:true,cmb:0,best:0,from}}else{const seen=new Set();for(let i=0,g=0;i<(n||10)&&g<200;g++){const q=genQ(d),key=q.t+'|'+q.o[q.a];if(seen.has(key)&&g<150)continue;seen.add(key);l.push(q);i++}QS={d,l,i:0,ans:null,res:[],test:false,cmb:0,best:0,from}}tab=from?'est':'pra';R();window.scrollTo(0,0);setTimeout(autoPlay,250)}
function finishQuiz(){const by={};QS.l.forEach((q,i)=>{const b=by[q.d]=by[q.d]||[0,0];b[1]++;if(QS.res[i])b[0]++});
Object.keys(by).forEach(k=>{const x=S.dr[k]=S.dr[k]||{n:0,ok:0};x.n+=by[k][1];x.ok+=by[k][0]});
const ok=QS.res.filter(Boolean).length;if(QS.from&&QS.from.sk){const sc=Math.round(10*ok/QS.l.length);S.pr[QS.from.sk]=Math.max(S.pr[QS.from.sk]||0,sc)}S.hist.push({d:today(),dr:QS.d,n:QS.l.length,ok});S.hist=S.hist.slice(-200);
if(QS.test)S.tests.push({d:today(),w:S.w,n:QS.l.length,ok,by});save();QS.done=true;R();window.scrollTo(0,0)}

/* ===== Teoría visual: tonalidades, funciones y diagramas ===== */
const LET='CDEFGAB',MPC=[0,2,4,5,7,9,11],QL=['','m','m','','','m','dim'],FN=['T','P','T','P','D','T','D'];
const CROOTS=['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];
const pcOf=n=>(PC[n[0]]+(n[1]=='#'?1:n[1]=='b'?-1:0)+12)%12;
const nES=n=>n[0]+(n[1]=='#'?'♯':n[1]=='b'?'♭':'');
const pretty=n=>n.replace('#','♯').replace(/^([A-G])b/,'$1♭');
function majNotes(r){const li=LET.indexOf(r[0]),p=pcOf(r);return MPC.map((s,i)=>{const L=LET[(li+i)%7],d=(((p+s)%12-PC[L]+18)%12)-6;return L+(d==1?'#':d==-1?'b':'')})}
function kinfo(r,m){const N=majNotes(r),ch=N.map((n,i)=>n+QL[i]);let notes=N,c=ch;if(m){notes=N.slice(5).concat(N.slice(0,5));c=ch.slice(5).concat(ch.slice(0,5))}
const acc=N.filter(n=>n.length>1),sig=acc.length?(acc[0][1]=='#'?acc.length:-acc.length):0;
return{r,m:!!m,N,notes,ch:c,rom:m?Rm:RM,V:m?notes[4]:null,sig,acc,name:nES(notes[0])+(m?' menor':' mayor'),tn:notes[0]+(m?'m':'')}}
const fnOf=(k,c)=>{const i=k.ch.indexOf(c);return i>=0?FN[i]:k.V==c?'D':null};
const baseC=c=>c.replace(/\|.*/,'').replace(/\/.*/,'').replace(/(sus2|sus4|add9)$/,'').replace(/^([A-G][#b]?)5$/,'$1').replace(/maj7$/,'').replace(/m7$/,'m').replace(/7$/,'');
const keyOf=id=>{const m=/m$/.test(id)?1:0;for(const r of CROOTS){const k=kinfo(r,m);if(k.tn==id)return k}return null};
const FNAME={T:'Tónica',P:'Predominante',D:'Dominante'};
const legend=()=>`<div class=legend><span><i style="background:var(--fT)"></i>Tónica: casa, reposo</span><span><i style="background:var(--fP)"></i>Predominante: se aleja</span><span><i style="background:var(--fD)"></i>Dominante: tensión</span></div>`;
const legendX=()=>`<div class=legend><span><i style="background:transparent;border:2px dashed var(--t5f)"></i>✱ Fuera de la tonalidad (acorde ajeno)</span></div>`;
let CF={r:'C',m:0,l:''},EXD='stair';
const scaleSeq=(k,ns)=>{let prev=-1,oct=0;const o=(ns||k.notes).map((n,i)=>{const p=pcOf(n);if(i&&p<prev)oct=1;prev=p;return'~'+n+(oct?'+':'')});o.push('~'+k.notes[0]+'+');return o};
const rootMidi=k=>55+((pcOf(k.notes[0])+5)%12);
const IVM=[0,2,4,5,7,9,11,12],IVm=[0,2,3,5,7,8,10,12];
const fnChips=k=>`<div class=chips>${k.ch.map((c,i)=>`<button class="chip f${FN[i]}" data-a=pc data-v="${c}"><small>${k.rom[i]}</small>${esc(pretty(c))}</button>`).join('')}${k.V?`<button class="chip fD" data-a=pc data-v="${k.V}"><small>V</small>${esc(pretty(k.V))}</button>`:''}</div>`;
const QT=q=>q=='M'?'t1':q=='m'?'t4':'t6';

let FM='esc';
const FMI={esc:[0,1,2,3,4,5,6],pen:null,acd:[0,2,4]},fretNotes=k=>{const ix=FM=='pen'?(k.m?[0,2,3,4,6]:[0,1,2,4,5]):FMI[FM]||FMI.esc;return ix.map(i=>k.notes[i])};
function fretD(k){const op=[64,59,55,50,45,40],map={},sel=fretNotes(k);sel.forEach(n=>map[pcOf(n)]=n);const x0=30,fw=30,y0=20,sy=20,NF=12,rp=pcOf(k.notes[0]);
let s=`<svg viewBox="0 0 ${x0+NF*fw+10} ${y0+5*sy+26}" role="img" aria-label="Notas de ${esc(k.name)} en el mástil">`;
for(let f=0;f<=NF;f++)s+=`<line x1="${x0+f*fw}" y1="${y0}" x2="${x0+f*fw}" y2="${y0+5*sy}" class="${f?'fs':'nut'}"/>`;
for(let i=0;i<6;i++)s+=`<line x1="${x0}" y1="${y0+i*sy}" x2="${x0+NF*fw}" y2="${y0+i*sy}" class=fs stroke-width="${1+i*.35}"/>`;
[3,5,7,9,12].forEach(f=>{s+=`<text x="${x0+(f-.5)*fw}" y="${y0+5*sy+19}" text-anchor="middle" font-size="11" class=bf>${f}</text>`});
op.forEach((m,i)=>{for(let f=0;f<=NF;f++){const mid=m+f,pc=mid%12;if(map[pc]==null)continue;const cx=f?x0+(f-.5)*fw:x0-14,cy=y0+i*sy,root=pc==rp;
s+=`<g class=nt data-a=nt data-v="${mid}"><circle cx="${cx}" cy="${cy}" r="9" style="fill:${root?'var(--fT)':'var(--acc)'}"/><text class=tk x="${cx}" y="${cy+3.8}" text-anchor="middle" font-size="${FLB=='g'?11.5:10.5}">${FLB=='g'?k.notes.findIndex(x=>pcOf(x)==pc)+1:pretty(map[pc])}</text></g>`}});
return s+'</svg>'}

function stairD(k){const iv=k.m?IVm:IVM,names=k.notes.concat([k.notes[0]]),bw=44,gap=8,x0=6,base=186,h0=40,dh=14,W_=x0*2+8*bw+7*gap;
let s=`<svg viewBox="0 0 ${W_} ${base+26}" role="img" aria-label="Escalera de tonos y semitonos de ${esc(k.name)}, con el acorde de cada grado">`;
names.forEach((n,i)=>{const x=x0+i*(bw+gap),h=h0+i*dh,y=base-h,root=i==0||i==7;
const ci=i%7,ch=k.ch[ci],q=parse(ch).q,t=QT(q);
s+=`<g class=nt data-a=nn data-v="${i}"><rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="12" style="fill:var(--${t}b)${root?';stroke:var(--acc);stroke-width:3':''}"/><text x="${x+bw/2}" y="${y+22}" text-anchor="middle" font-size="${pretty(ch).length>3?12.5:15}" style="fill:var(--${t}f);font-weight:800">${pretty(ch).replace('dim','°')}</text><text x="${x+bw/2}" y="${y+36}" text-anchor="middle" font-size="9.5" style="fill:var(--${t}f);font-weight:600;opacity:.85">${q=='M'?'mayor':q=='m'?'menor':'dism.'}</text></g>`;
s+=`<text x="${x+bw/2}" y="${base+18}" text-anchor="middle" font-size="13" style="${root?'font-weight:800;fill:var(--accT)':'fill:var(--mut)'}">${k.rom[ci]}</text>`;
if(i<7){const d=iv[i+1]-iv[i],cx=x+bw+gap/2,cy=base-(h0+(i+1)*dh)-16,w=d==2?34:30;
s+=`<rect x="${cx-w/2}" y="${cy-11}" width="${w}" height="22" rx="11" style="fill:${d==2?'var(--sf3)':'var(--fD)'}"/><text x="${cx}" y="${cy+4.5}" text-anchor="middle" font-size="12" style="font-weight:800;fill:${d==2?'var(--ink)':'var(--onF)'}">${d==2?'T':'½'}</text>`}});
return s+'</svg>'}

function circD(){const R1=124,R2=80,c=160,sel=kinfo(CF.r,CF.m);
let s=`<svg viewBox="0 0 320 320" role="img" aria-label="Círculo de quintas"><circle cx="${c}" cy="${c}" r="${R1+25}" style="fill:var(--sf2)"/><circle cx="${c}" cy="${c}" r="${R2+22}" style="fill:var(--sf)"/>`;
CROOTS.forEach((r,i)=>{const a=(i*30-90)*Math.PI/180,co=Math.cos(a),si=Math.sin(a),on=CF.r==r;
const x1=c+R1*co,y1=c+R1*si,x2=c+R2*co,y2=c+R2*si,km=kinfo(r,1);
s+=`<g class=nt data-a=cn data-v="${i}:0"><circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="21" style="fill:${on&&!CF.m?'var(--acc)':'var(--sf)'};stroke:${on?'var(--acc)':'var(--line)'};stroke-width:2"/><text x="${x1.toFixed(1)}" y="${(y1+5.5).toFixed(1)}" text-anchor="middle" font-size="16" font-weight="800" style="fill:${on&&!CF.m?'var(--accInk)':'var(--ink)'}">${pretty(r)}</text></g>`;
s+=`<g class=nt data-a=cn data-v="${i}:1"><circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="18" style="fill:${on&&CF.m?'var(--t4f)':'var(--sf2)'};stroke:${on?'var(--t4f)':'transparent'};stroke-width:2"/><text x="${x2.toFixed(1)}" y="${(y2+4.5).toFixed(1)}" text-anchor="middle" font-size="12.5" font-weight="800" style="fill:${on&&CF.m?'var(--onF)':'var(--ink)'}">${pretty(km.tn)}</text></g>`});
const n=Math.abs(sel.sig);
s+=`<text x="${c}" y="${c+4}" text-anchor="middle" font-size="30" font-weight="800" style="fill:var(--ink)">${n}${sel.sig>0?'♯':sel.sig<0?'♭':''}</text><text x="${c}" y="${c+24}" text-anchor="middle" font-size="11" style="fill:var(--mut)">${n==0?'sin alteraciones':n==1?'alteración':'alteraciones'}</text>`;
return s+'</svg>'}

function funcD(k){const bw=128,gap=18,y0=26,rh=34,W_=3*bw+2*gap,H=232;
const grp=k.m?{T:[0,2,5],P:[3,1],D:[4,6]}:{T:[0,5,2],P:[3,1],D:[4,6]};
let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Mapa de funciones de ${esc(k.name)}"><defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9z" style="fill:var(--mut)"/></marker></defs>`;
['T','P','D'].forEach((f,gi)=>{const x=gi*(bw+gap),col='var(--f'+f+')',list=grp[f].slice();
s+=`<rect x="${x}" y="0" width="${bw}" height="168" rx="22" style="fill:${col};opacity:.13"/><text x="${x+bw/2}" y="${y0-6}" text-anchor="middle" font-size="12" font-weight="800" style="fill:${col};letter-spacing:.08em">${FNAME[f].toUpperCase()}</text>`;
list.forEach((d,j)=>{const c=d==4&&k.m?k.V:k.ch[d],r=d==4&&k.m?'V':k.rom[d],y=y0+4+j*(rh+8);
s+=`<g class=nt data-a=pc data-v="${c}"><rect x="${x+12}" y="${y}" width="${bw-24}" height="${rh}" rx="12" style="fill:${col}"/><text x="${x+bw/2}" y="${y+22}" text-anchor="middle" font-size="14" style="fill:var(--onF);font-weight:800">${r}  ${pretty(c)}</text></g>`})});
[0,1].forEach(i=>{const x=(i+1)*bw+i*gap;s+=`<path d="M${x+2} 84H${x+gap-2}" stroke-width="2.5" stroke-linecap="round" marker-end="url(#ar)" style="stroke:var(--mut);fill:none"/>`});
const xa=2*(bw+gap)+bw/2,xb=bw/2;
s+=`<path d="M${xa} 172C${xa} 222 ${xb} 222 ${xb} 174" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 6" marker-end="url(#ar)" style="stroke:var(--mut);fill:none"/><text x="${W_/2}" y="${H-24}" text-anchor="middle" font-size="12" style="fill:var(--mut)">vuelve a casa</text>`;
return s+'</svg>'}

function relD(){const a=kinfo(CF.r,0),b=kinfo(CF.r,1),sw=44,x0=6,y1=30,y2=150,bh=46,cx=sl=>x0+sl*sw+(sw-6)/2;
let s=`<svg viewBox="0 0 408 ${y2+bh+24}" role="img" aria-label="${esc(a.name)} y ${esc(b.name)} comparten los mismos acordes"><text x="6" y="18" font-size="13" font-weight="800" style="fill:var(--ink)">${esc(a.name)}</text><text x="6" y="${y2-10}" font-size="13" font-weight="800" style="fill:var(--ink)">${esc(b.name)}</text>`;
const box=(sl,y,ch,rom,tonic)=>{const q=parse(ch).q,t=QT(q),nm=pretty(ch).replace('dim','°');
return`<g class=nt data-a=pc data-v="${ch}"><rect x="${x0+sl*sw}" y="${y}" width="${sw-6}" height="${bh}" rx="10" style="fill:var(--${t}b)${tonic?';stroke:var(--acc);stroke-width:3':''}"/><text x="${cx(sl)}" y="${y+21}" text-anchor="middle" font-size="${nm.length>3?12:14}" style="fill:var(--${t}f);font-weight:800">${nm}</text><text x="${cx(sl)}" y="${y+35}" text-anchor="middle" font-size="9" style="fill:var(--${t}f);font-weight:600;opacity:.85">${q=='M'?'mayor':q=='m'?'menor':'dism.'}</text></g><text x="${cx(sl)}" y="${y+bh+14}" text-anchor="middle" font-size="11.5" style="fill:${tonic?'var(--accT)':'var(--mut)'};${tonic?'font-weight:800':''}">${rom}</text>`};
for(let i=0;i<7;i++)s+=box(i+2,y1,a.ch[i],a.rom[i],i==0);
for(let j=0;j<7;j++)s+=box(j,y2,b.ch[j],b.rom[j],j==0);
for(let sl=2;sl<=6;sl++)s+=`<line x1="${cx(sl)}" y1="${y1+bh+20}" x2="${cx(sl)}" y2="${y2-4}" stroke-width="2" stroke-dasharray="2 5" style="stroke:var(--dim)"/>`;
[7,8].forEach(sl=>{s+=`<line x1="${cx(sl)}" y1="${y1+bh+20}" x2="${cx(sl-7)}" y2="${y2-4}" stroke-width="2" stroke-dasharray="2 5" style="stroke:var(--dim)"/>`});
return s+'</svg>'}

const DGT={fret:'Mástil',stair:'Escalera',circ:'Círculo de quintas',fn:'Mapa de funciones',rel:'Relativas'};
const DGD={fret:'Dónde están las notas de la tonalidad en el diapasón.',stair:'Cómo se arma la escala y qué acorde nace en cada escalón.',circ:'Cómo se ordenan las tonalidades y cuántas alteraciones tiene cada una.',fn:'Qué papel cumple cada acorde: casa, alejarse o tensión.',rel:'Por qué una mayor y su relativa menor comparten los mismos acordes.'};
const kpick=()=>`<div class=kp><div class=sg2><button class="sg${!CF.m?' on':''}" data-a=cm data-v=0>Mayor</button><button class="sg${CF.m?' on':''}" data-a=cm data-v=1>Menor</button></div><div class="chips kr">${CROOTS.map(r=>`<button class="chip${CF.r==r?' on':''}" data-a=ck data-v="${r}">${pretty(kinfo(r,CF.m).tn)}</button>`).join('')}</div></div>`;
function dgInner(id){const k=kinfo(CF.r,CF.m);let h=`<div class=dgh><h3>${DGT[id]}</h3><span>${DGD[id]}</span></div>`,svg='',cap='',extra='';
if(id=='fret'){const tc=pretty(k.ch[0]),pn=fretNotes(k).map(pretty).join(', ');h+=kpick()+`<div class="sg2 wrap" style="margin-top:10px">${[['esc','Escala completa'],['pen','Pentatónica'],['acd','Acorde de tónica']].map(([v,l])=>`<button class="sg${FM==v?' on':''}" data-a=fm data-v=${v}>${l}</button>`).join('')}</div><div class=sg2 style="margin-top:8px"><button class="sg${FLB=='n'?' on':''}" data-a=flb data-v=n>Ver notas</button><button class="sg${FLB=='g'?' on':''}" data-a=flb data-v=g>Ver grados</button></div>`;svg=fretD(k);
cap=(FM=='esc'?`Las 7 notas de ${k.name}.`:FM=='pen'?`${k.name.replace(/ (mayor|menor)$/,'')} ${k.m?'menor':'mayor'} pentatónica: ${pn}. Son las 5 notas para improvisar sin chocar con la armonía.`:`Las 3 notas del acorde de casa, ${tc}: ${pn}. Son las notas más seguras para terminar una frase.`)+' En verde, la tónica. A la izquierda, las cuerdas al aire. Tocá un punto para oírlo.'+(FLB=='g'?' Los números son el lugar de cada nota en la escala: 1 es la tónica; 1, 3 y 5 forman el acorde de casa.':'');
extra=`<button class="btn gh sm" data-a=psc style="margin-top:12px">${IC.play} ${FM=='acd'?'Escuchar el arpegio':FM=='pen'?'Escuchar la pentatónica':'Escuchar la escala'}</button>`}
else if(id=='stair'){h+=kpick();svg=stairD(k);cap=(k.m?'La escala menor natural sube así: tono, semitono, tono, tono, semitono, tono, tono.':'La escala mayor sube con esta receta: tono, tono, semitono, tono, tono, tono, semitono.')+' Cada escalón muestra el acorde que se arma sobre esa nota; el color dice si es mayor o menor. El borde ámbar marca la tónica (casa).';extra=`<div class=legend><span><i style="background:var(--sf3)"></i>T = tono (2 trastes)</span><span><i style="background:var(--fD)"></i>½ = semitono (1 traste)</span><span><i style="background:var(--t1f)"></i>Mayor</span><span><i style="background:var(--t4f)"></i>Menor</span><span><i style="background:var(--t6f)"></i>Disminuido</span></div><button class="btn gh sm" data-a=psc style="margin-top:12px">${IC.play} Subir la escalera</button>`}
else if(id=='circ'){svg=circD();const n=Math.abs(k.sig);cap=`Cada paso a la derecha suma un sostenido; cada paso a la izquierda, un bemol. Afuera: tonalidades mayores. Adentro: su relativa menor. Tocá una para ver sus acordes.`;extra=`<p style="margin-top:12px"><b>${esc(k.name)}</b> · ${n==0?'sin alteraciones':n+' '+(k.sig>0?'sostenido':'bemol')+(n>1?'s':'')+': '+k.acc.map(pretty).join(', ')}</p>${fnChips(k)}<button class="btn gh sm" data-a=pfn style="margin-top:12px">${IC.play} Escuchar I–IV–V–I</button>`}
else if(id=='fn'){h+=kpick();svg=funcD(k);cap=`Los acordes de ${k.name} agrupados por función. La música sale de casa (verde), se aleja (azul), crea tensión (coral) y vuelve. Tocá un acorde. Es un esquema simplificado: el iii es ambiguo, y en menor el VI suele actuar como predominante y el VII como paso hacia el i o el III.`;extra=`<button class="btn gh sm" data-a=pfn style="margin-top:12px">${IC.play} Escuchar I–IV–V–I</button>`}
else{const a=kinfo(CF.r,0),b=kinfo(CF.r,1);h+=kpick();svg=relD();cap=`${a.name} y ${b.name} usan los mismos 7 acordes: el vi de ${a.name} (${pretty(a.ch[5])}) es el i de ${b.name}. Lo único que cambia es cuál suena como casa (borde ámbar). Tocá un acorde para oírlo.`;extra=`<div class=brow style="margin-top:12px"><button class="btn sm" data-a=pc data-v="${a.ch[0]}">${IC.play} ${esc(pretty(a.ch[0]))}</button><button class="btn gh sm" data-a=pc data-v="${b.ch[0]}">${IC.play} ${esc(pretty(b.ch[0]))}</button></div>`}
return`${h}<div class="dgs${id=='fret'?' w':''}">${svg}</div><p class=cap>${cap}</p>${id=='fn'||id=='circ'?legend():''}${extra}`}
const dgCard=id=>`<div class="card dg" data-dg="${id}">${dgInner(id)}</div>`;
const refreshDG=()=>document.querySelectorAll('[data-dg]').forEach(e=>{e.innerHTML=dgInner(e.dataset.dg)});
/* Qué mapa se muestra en cada lección, con qué tonalidad y modo de mástil. */
const DG={'1.1':['stair','fret'],'1.2':['stair','fn'],'1.3':['circ','stair'],'1.4':['fret','circ'],'1.5':['fn'],'2.1':['fn'],'2.2':['fn'],'2.3':['fn'],'2.4':['rel'],'2.5':['fn'],'3.1':['rel','stair'],'3.2':['rel','stair'],'3.3':['fn'],'3.4':['fn'],'3.5':['rel'],'4.1':['fret'],'4.3':['stair'],'5.1':['fn'],'5.4':['fn'],'6.1':['circ'],'6.2':['circ'],'6.5':['rel'],'9.1':['fret'],'9.3':['fret'],'9.4':['fret','rel'],'9.7':['fret'],'10.2':['fn']};
const DK={'1.3':['G',0],'1.4':['A',0],'3.1':['C',1],'3.2':['C',1],'3.3':['C',1],'3.4':['C',1],'3.5':['C',1],'5.4':['C',1],'9.1':['C',1],'9.3':['C',1],'9.4':['C',0],'9.7':['C',1],'6.5':['C',1]};
const DFM={'1.4':'acd','4.1':'acd','9.1':'pen','9.3':'acd','9.4':'pen','9.7':'pen'};

/* ===== Racha, meta semanal, metrónomo, ajustes ===== */
const ds=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const dset=()=>{const s=new Set();S.logs.forEach(l=>l.d&&s.add(l.d));S.hist.forEach(h=>h.d&&s.add(h.d));return s};
function streak(){const s=dset(),d=new Date();let n=0;if(!s.has(ds(d)))d.setDate(d.getDate()-1);while(s.has(ds(d))&&n<2000){n++;d.setDate(d.getDate()-1)}return n}
function weekDays(){const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));const o=[];for(let i=0;i<7;i++){o.push(ds(d));d.setDate(d.getDate()+1)}return o}
const weekSess=()=>{const w=weekDays();return S.logs.filter(l=>w.includes(l.d)).length};
const goalN=()=>Math.max(1,Math.min(6,+S.cfg.goal||5));
let MT={on:0,bpm:80,beat:0,next:0,id:0};
function clickAt(t,acc){if(S.cfg.snd===false)return;const c=ac(),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=acc?1600:1100;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.35,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+.06);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.08)}
function metTick(){const c=ac();while(MT.next<c.currentTime+.12){const acc=MT.beat%4==0,t=MT.next;clickAt(t,acc);setTimeout(()=>{const e=$('#mtd');if(e){e.className='mdot '+(acc?'a':'b');void e.offsetWidth;e.className+=' p'}},Math.max(0,(t-c.currentTime)*1000));MT.beat++;MT.next+=60/MT.bpm}}
function metStart(){try{const c=ac();MT.on=1;MT.beat=0;MT.next=c.currentTime+.05;metTick();clearInterval(MT.id);MT.id=setInterval(metTick,25)}catch(e){MT.on=0}}
function metStop(){MT.on=0;clearInterval(MT.id)}
const isDark=()=>S.cfg.th=='dark'||(S.cfg.th!='light'&&!!(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches));
function applyCfg(){try{const r=document.documentElement;r.style.setProperty('--z',[1,1.12,1.25][S.cfg.fs]||1);if(S.cfg.th=='light'||S.cfg.th=='dark')r.setAttribute('data-theme',S.cfg.th);else r.removeAttribute('data-theme');const m=document.querySelector('meta[name=theme-color]');if(m)m.content=isDark()?'#121215':'#F5F4F1'}catch(e){}}
const metHtml=()=>`<details class="card met"${MT.on?' open':''}><summary><span class="av c3">${IC.prog}</span><b>Metrónomo</b><span class=m>tocá para abrir</span></summary><div class=mbpm id=mbpm>${MT.bpm}<small>BPM</small></div><div class=mctl><button class=rnd data-a=bpm data-v=-5>−5</button><button class=rnd data-a=bpm data-v=-1>−1</button><button class=rnd data-a=bpm data-v=1>+1</button><button class=rnd data-a=bpm data-v=5>+5</button></div><input type=range id=mr min=40 max=200 value="${MT.bpm}" aria-label="Pulsos por minuto"><div class=mdot id=mtd></div><button class="btn blk${MT.on?' gh':''}" data-a=met>${MT.on?IC.pause+' Parar':IC.play+' Iniciar'}</button><p class="m sm">Cuatro tiempos; el primero suena más agudo. Empezá lento y subí de a poco.</p></details>`;
function testChart(ts){const W_=340,H=190,l=44,r=30,tp=24,b=34,n=ts.length,pts=ts.map((x,i)=>({x:n==1?(l+W_-r)/2:l+i*(W_-l-r)/(n-1),y:tp+(H-tp-b)*(1-pc(x.ok,x.n)/100),p:pc(x.ok,x.n),w:x.w}));
let s=`<svg class=chart viewBox="0 0 ${W_} ${H}" role="img" aria-label="Resultado de las pruebas de nivel">`;
[0,50,100].forEach(v=>{const y=tp+(H-tp-b)*(1-v/100);s+=`<line x1="${l}" y1="${y}" x2="${W_-r}" y2="${y}" stroke-width="1" style="stroke:var(--line)"/><text x="${l-6}" y="${y+4}" text-anchor="end">${v}%</text>`});
if(n>1){const path=pts.map((q,i)=>(i?'L':'M')+q.x.toFixed(1)+' '+q.y.toFixed(1)).join(' ');s+=`<path d="${path} L${pts[n-1].x.toFixed(1)} ${H-b} L${pts[0].x.toFixed(1)} ${H-b}z" style="fill:var(--acc);opacity:.12"/><path d="${path}" fill="none" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--acc)"/>`}
pts.forEach((q,i)=>{const last=i==n-1;s+=`<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${last?6:4}" style="fill:var(--acc);stroke:var(--sf);stroke-width:2"><title>Semana ${q.w}: ${q.p}%</title></circle>`;if(last||n<=4)s+=`<text class=v x="${q.x.toFixed(1)}" y="${(q.y-11).toFixed(1)}" text-anchor="middle">${q.p}%</text>`;s+=`<text x="${q.x.toFixed(1)}" y="${H-12}" text-anchor="middle">Sem. ${q.w}</text>`});
return s+'</svg>'}
const segc=(k,opts,cur)=>`<div class="sg2 wrap">${opts.map(([v,l])=>`<button class="sg${String(cur)==String(v)?' on':''}" data-a=cfg data-v="${k}:${v}">${l}</button>`).join('')}</div>`;

/* ===== Lecciones y sesión ===== */
const lk=()=>S.w+'.'+S.s,LS=()=>!S.w||S.s==6?null:LX[lk()]||null;
const HX=w=>!!LX[w+'.7'];
const wc=w=>'c'+((w-1)%6);
const done=(w,s)=>S.logs.some(l=>l.w==w&&l.s==s);
const lapp=k=>(S.qc[k]||0)>=4||(S.q[k]||0)>=2;
const sname=(w,s)=>s==6?'Prueba de la semana':s==7?(XW[w]?XW[w][0]:'Sesión extra'):(LX[w+'.'+s]?LX[w+'.'+s].n:'Sesión '+s);
const sOrd=w=>[1,2,3,4,5].concat(HX(w)?[7]:[],[6]);
const sShort=(w,s)=>s==6?`prueba sem. ${w}`:s==7?`extra sem. ${w}`:`sesión ${w}.${s}`;
function tasks(w,s){return W[w-1][3][s-1].split(' | ').map(x=>{const m=x.match(/^(\(Opcional\)\s*)?([AB]):\s*(.*)$/);return m?{b:m[2],t:m[3],o:!!m[1]}:{b:'·',t:x}})}
function steps(){if(!S.w)return['ini'];if(S.s==6)return['prueba','cierre'];return LS()?['teoria','ejemplo'].concat(DEMO[lk()]?['oir']:[],['chk','guit','cierre']):['guit','cierre']}
const SPX={1:['mastil','notas','acordes','acordes','grados'],2:['func','func','transporte','tono','grados'],3:['tono','acordes','calidad','transporte','reposo'],4:['mastil','bajo','calidad','bajo','bajo'],5:['ogr','ogr','oido','oido','reposo'],6:['transporte','transporte','mastil','capo','transporte'],7:['sept','sept','bajo','notas','grados',null,'sus'],8:['ajenos','ajenos','ajenos','ajenos','tono'],9:['penta','penta','notas','penta','penta',null,'blues'],10:['tono','func','ajenos','tono','grados'],11:['reposo','bajo','oido','ogr','tono'],12:['tono','func','reposo','capo','penta']};
function sesEx(x){const d=x||(SPX[S.w]&&SPX[S.w][S.s-1])||WD[S.w],b=S.pr[lk()+'|'+d],ok=b>=8;
return`<div class="card exc"><div class=bh><span class="av c${DCOL[d]||0}">${EXI[d]||'EJ'}</span><div class=tt><b>Ejercicio${x?'':' de la sesión'}: ${esc(DN[d])}</b><span class=m>${esc(DD[d])}</span></div>${b!=null?`<span class="badge${ok?' ok':''}">${ok?'✓ ':''}${b}/10</span>`:''}</div><p class="m sm">Se aprueba con 8 de 10.</p><button class="btn blk${ok?' gh':''}" data-a=lstart data-v=${d}>${ok?IC.redo+' Repetir (opcional)':b!=null?IC.redo+' Intentar de nuevo':IC.play+' Hacer 10 preguntas'}</button></div>`}
const sLabel=a=>a[1]==6?`la prueba de la semana ${a[0]}`:a[1]==7?`la sesión extra de la semana ${a[0]}`:`la sesión ${a[0]}.${a[1]}`;
const prevS=()=>{if(!S.w)return null;const w=S.w,s=S.s;if(s==7)return[w,5];if(s==6)return HX(w)?[w,7]:[w,5];if(s>1)return[w,s-1];return w>1?[w-1,6]:null},nextS=()=>{if(!S.w)return null;const w=S.w,s=S.s;if(s<5)return[w,s+1];if(s==5)return HX(w)?[w,7]:[w,6];if(s==7)return[w,6];return w<12?[w+1,1]:null};
const snav=()=>{const p=prevS(),n=nextS();return`<div class=snav>${p?`<button class="rw sm" data-a=gs data-v="${p.join(':')}"><span class=st>${IC.prev}</span><span class=tt><span>Sesión anterior</span><b>${esc(sname(p[0],p[1]))}</b></span></button>`:'<span></span>'}${n?`<button class="rw sm r" data-a=gs data-v="${n.join(':')}"><span class=tt><span>Sesión siguiente</span><b>${esc(sname(n[0],n[1]))}</b></span><span class=st>${IC.next}</span></button>`:''}</div>`};
let FLASH='',WS=0,DP={k:'',j:0,i:0,on:0};
const SG={ini:'Inicio',teoria:'Teoría',ejemplo:'Ejemplo',oir:'Escuchar',chk:'Chequeo',guit:'Práctica',prueba:'Prueba',cierre:'Cierre'};
const shufI=n=>shuf([...Array(n).keys()]);
const newST=()=>{const l=LS();return{k:lk(),i:0,qi:0,a:[],ord:l?l.q.map(q=>shufI(q[1].length)):[],r:0,so:''}};
const md=s=>esc(s).replace(/\*([^*]+)\*/g,'<b>$1</b>');
const fmtT=s=>String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0'),BDUR={A:1200,B:1500},bdur=b=>S.w==11&&b=='A'?900:BDUR[b];
const tmb=b=>{const on=T.blk==b,left=on?T.left:bdur(b);return`<button class="tmb${on&&T.run?' run':''}" id=tm${b} data-a=tb data-v=${b} aria-label="Reloj del bloque ${b}">${on&&T.run?'❚❚':'▶'} ${fmtT(left)}</button>`};
const chkDone=()=>{const l=LS();return!!l&&ST.a.filter(Boolean).length>=l.q.length};
const canNext=id=>id!='cierre'&&(id!='chk'||chkDone()||lapp(lk()));
const navRow=(t,ok=true,hint='')=>`${hint?`<p class="m sm hint">${hint}</p>`:''}<div class=navr>${ST.i>0?`<button class="btn gh" data-a=back aria-label="Paso anterior">${IC.prev} Atrás</button>`:''}<button class=btn data-a=nx ${ok?'':'disabled'}>${t} ${IC.next}</button></div>`;
const MESA_K=new Set(['3.5','7.3','7.5','8.5']);
const mesaOn=()=>[4,5,10,11,12].includes(S.w)||MESA_K.has(lk());
const mesaBox=()=>`<div class="card mesa"><div class=bh><span class="av c0">${IC.mesa}</span><div class=tt><b>Verificá en Mesa</b><span class=m>Siempre después de escribir tu hipótesis.</span></div></div><ol class=steps>
<li>Abrí la canción en Mesa y escuchala <b>sin mirar la pantalla</b>: primero, tu oído.</li>
<li>En <b>Pistas</b>, silenciá Guitarra, Voz y Piano: queda el <b>Bajo</b> solo, para seguir las raíces.</li>
<li>Marcá un loop <b>A–B</b> sobre la estrofa y usá <b>‹ c. ›</b> para avanzar compás a compás.</li>
<li>Escribí tu hipótesis: tonalidad, grados y confianza (poca, media o mucha).</li>
<li>Recién ahí mirá: arriba Mesa muestra la <b>tonalidad</b> y el <b>grado</b> de cada acorde (I, IV, V…). Compará con lo tuyo.</li>
<li>Mesa también puede equivocarse: si no coincide, decidí con el oído y anotá por qué.</li></ol></div>`;

/* Escenario de audio estilo Mesa */
function demoKey(seq,kid){const cs=seq.filter(c=>c[0]!='~');if(!cs.length)return null;let K=kid?keyOf(kid):null;
if(!K){let best=null;for(const m of[0,1])for(const r of CROOTS){const k=kinfo(r,m),b=cs.map(baseC);if(b.every(c=>k.ch.includes(c)||k.V==c)){const sc=(b[0]==k.tn?2:0)+(b[b.length-1]==k.tn?1:0);if(!best||sc>best.sc)best={k,sc}}}if(best)K=best.k}return K}
function demoFn(seq,kid){const K=demoKey(seq,kid),o={};if(K)seq.filter(c=>c[0]!='~').forEach(c=>{o[c]=fnOf(K,baseC(c))||'X'});return o}
const RSUF={'7':'7',maj7:'maj7',m7:'7',sus2:'sus2',sus4:'sus4',add9:'add9','5':'5'};
function romOf(K,c){if(!K)return'';if(c[0]=='~'){const n=c.slice(1).replace(/[+\d]/g,''),i=K.notes.findIndex(x=>pcOf(x)==pcOf(n));return i<0?'':(i+1)+'º'}const b=baseC(c),p=parse(c),i=K.ch.indexOf(b),sf=p&&RSUF[p.q]||'';if(i>=0)return K.rom[i]+sf;if(K.V==b)return'V'+sf;return'✱'}
const cName=x=>x[0]=='~'?nES1(x.slice(1).replace(/[+\d]/g,'')):pretty(x.replace(/\|.*/,'').split('/')[0]).replace('dim','°');
const cBass=x=>x[0]!='~'&&x.includes('/')?'/'+pretty(x.split('/')[1]):'';
const gapOf=seq=>seq[0][0]=='~'?(seq.every(c=>/\d/.test(c))?.9:.5):1.2;
function stageHtml(){const D=DEMO[lk()]||[];if(!D.length)return'';if(DP.k!=lk())DP={k:lk(),j:0,i:0,on:0};const d=D[DP.j]||D[0],seq=d[1],i=Math.min(DP.i,seq.length-1),K=demoKey(seq,d[2]),F=demoFn(seq,d[2]),c=seq[i],nx=seq[i+1];
const rs=[...new Set(seq.filter(x=>x[0]!='~').map(x=>romOf(K,x)))];
return`<div class=stage id=stage><div class=kl>${K?esc(K.name)+(rs.length?' · '+rs.join(' – '):''):'Notas sueltas'}</div>
<div class=stg><div class=sd>${c[0]!='~'?diag(c,140):''}</div>
<div class=big><div class="rm${F[c]?' f'+F[c]:''}">${romOf(K,c)||'&nbsp;'}</div><div class=nm>${cName(c)}<small>${cBass(c)}</small></div><div class=q>${esc(c[0]=='~'?'nota suelta':chordES(c))}</div></div>
<div class=nxt>${nx?`<span class=lb>Sigue</span><div class=rm>${romOf(K,nx)||'&nbsp;'}</div><div class=nm>${cName(nx)}<small>${cBass(nx)}</small></div>${nx[0]!='~'?diag(nx,84,1):''}`:'<span class=lb>Fin de la secuencia</span>'}</div></div>
<div class=pg><i style="width:${(100*(i+1)/seq.length).toFixed(1)}%"></i></div>
<div class=beats>${seq.map((_,j)=>`<i class="${j<i?'d':j==i?'c':''}"></i>`).join('')}</div>
<div class=ctl><button class=icb data-a=dprev aria-label="Acorde anterior" ${i?'':'disabled'}>${IC.prev}</button><button class="play${DP.on?' on':''}" data-a=dplay aria-label="${DP.on?'Parar':'Reproducir'}">${DP.on?IC.pause:IC.play}</button><button class=icb data-a=dnext aria-label="Acorde siguiente" ${nx?'':'disabled'}>${IC.next}</button></div></div>`}
const updStage=()=>{const e=$('#stage');if(e)e.outerHTML=stageHtml()};

const iconOk='✓',iconNo='✕';
function body(id){const w=S.w,s=S.s,l=LS(),x=w?(s==7&&XW[w]?XW[w]:W[w-1]):null;
if(id=='ini')return`<span class=eb>Empezamos</span><h1>Primero medimos tu punto de partida</h1><p class=lead>Hacé la prueba de nivel: 12 preguntas, unos 10 minutos. No es un examen: sirve para comparar cuando la repitas en las semanas 4, 8 y 12.</p><button class="btn blk" data-a=ltest>${IC.play} Hacer la prueba de nivel</button><button class="btn gh blk" data-a=st0>Saltear y empezar la semana 1</button>`;
if(id=='teoria'){if(CF.l!=lk()){const d=DK[lk()]||['C',0];CF={r:d[0],m:d[1],l:lk()};FM=DFM[lk()]||'esc'}
return`<span class=eb>Teoría${s==7?' · sesión extra (opcional)':''}</span><h1>${esc(l.n)}</h1>${s==7?'<p class=m>Es opcional: si preferís, pasá directo a la prueba de la semana con “Sesión siguiente”, al final de la página.</p>':''}
<div class=why><span class=lb>Para qué sirve</span><p>${md(l.p)}</p></div>
<div class=key><span class=lb>Idea clave</span><p>${md(l.k)}</p></div>
<h2 class=h2>Paso a paso</h2><ol class=steps>${l.e.map(t=>`<li>${md(t)}</li>`).join('')}</ol>
${(DG[lk()]||[]).length?`<h2 class=h2>Mirá y tocá <small>tocá cualquier elemento para oírlo</small></h2>${DG[lk()].map(dgCard).join('')}`:''}
${GLO}${HT()?`<button class="btn gh blk" data-a=askl>No lo entiendo: preguntarle al tutor</button>`:''}${navRow('Ver un ejemplo resuelto')}`}
if(id=='ejemplo')return`<span class=eb>Ejemplo resuelto</span><h1>${esc(l.x.t)}</h1><div class="card ex">${l.x.s.map((t,i)=>`<div class=ln><span class=n>${i+1}</span><span>${md(t)}</span></div>`).join('')}</div>
<div class="card err"><span class=lb>Error común</span><p>${md(l.m)}</p></div>
<div class=sum><span class=lb>En una línea</span><p>${md(l.r)}</p></div>${navRow(DEMO[lk()]?'Escucharlo':'Hacer el chequeo')}`;
if(id=='oir'){const D=DEMO[lk()]||[];if(DP.k!=lk())DP={k:lk(),j:0,i:0,on:0};const d=D[DP.j],F=demoFn(d[1],d[2]),hx=Object.values(F).includes('X');
return`<span class=eb>Escuchalo</span><h1>Escuchá y mirá la forma</h1><p class=sub>Arriba ves el grado y el acorde que suena, con su forma; a la derecha, el que sigue. Elegí una secuencia y dale play, o tocá un acorde suelto.</p>${stageHtml()}
<div class=chips>${d[1].map((c,i)=>{const f=F[c];return c[0]=='~'?`<button class=chip data-a=dchip data-v=${i}>${esc(cName(c))}</button>`:`<button class="chip${f=='X'?' out':f?' f'+f:''}" data-a=dchip data-v=${i}>${esc(cName(c))}${cBass(c)}<span class=es>${esc(esShort(c))}</span></button>`}).join('')}</div>${d[1].some(c=>c[0]!='~')?legend():''}${hx?legendX():''}
<h2 class=h2>Secuencias <small>${D.length}</small></h2><div class=rows>${D.map((q,j)=>`<button class="rw${DP.j==j?' cur':''}" data-a=dsel data-v=${j}><span class="av c${(j+2)%6}">${String(j+1).padStart(2,'0')}</span><span class=tt><b>${esc(q[0])}</b><span>${q[1].map(c=>cName(c)+cBass(c)).join(' · ')}</span></span><span class=st>${IC.play}</span></button>`).join('')}</div>${navRow('Hacer el chequeo')}`}
if(id=='chk'){const Q=l.q,n=Q.length,qi=ST.qi;
if(qi>=n){const sc=ST.a.filter(a=>a&&a[1]).length,ok=sc>=4;return`<span class=eb>Chequeo</span><h1>${sc} de ${n}${ok?' · aprobado':''}</h1><p class=lead>${ok?'Entendiste la lección. Si fallaste alguna, leé la explicación antes de seguir.':'Conviene repasar la teoría y el ejemplo, y repetir el chequeo (se aprueba con 4 de 5).'}</p><div class="card rev">${Q.map((q,j)=>{const a=ST.a[j];return`<div class=ln><span class="n ${a&&a[1]?'ok':'ko'}">${a&&a[1]?'✓':'✕'}</span><span><b>${esc(q[0])}</b><br><span class=m>${esc(q[1][q[2]])} — ${md(q[3])}</span></span></div>`}).join('')}</div>${ok?'':`<button class="btn gh blk" data-a=rq>${IC.redo} Repetir el chequeo</button>`}${navRow('Ir a la práctica con la guitarra')}`}
const q=Q[qi],r=ST.a[qi],ord=ST.ord[qi]||shufI(q[1].length);
return`${qi==0&&!r&&lapp(lk())?`<div class="card hl"><b>Ya aprobaste este chequeo.</b><p class="m sm">Podés repetirlo o saltarlo e ir directo a la práctica.</p><button class="btn gh sm" data-a=skipq>Saltar el chequeo ${IC.next}</button></div>`:''}<span class=eb>Chequeo · pregunta ${qi+1} de ${n}</span><div class=seg>${Q.map((_,j)=>`<i class="${ST.a[j]?(ST.a[j][1]?'d':'x'):j==qi?'c':''}"></i>`).join('')}</div><h1 class=q>${esc(q[0])}</h1>${ord.map((oi,j)=>`<button class="opt${r?(oi==q[2]?' ok':r[0]==oi?' ko':''):''}" data-a=lq data-v="${oi}"><span class=lt>${'ABCD'[j]}</span><span class=ot>${esc(q[1][oi])}</span></button>`).join('')}
${r?`<div class="fb ${r[1]?'g':'b'}"><span class=fi>${r[1]?iconOk:iconNo}</span><div><b>${r[1]?'Correcto.':'No: era “'+esc(q[1][q[2]])+'”.'}</b> ${md(q[3])}</div></div><button class="btn blk" data-a=qnext>${qi<n-1?'Siguiente pregunta':'Ver el resultado'} ${IC.next}</button>`:`<p class="m sm hint">Elegí una respuesta: después vas a ver por qué es correcta o no.</p>`}`}
if(id=='guit'){const tx=TX[lk()],t=tx?tx.map(k=>{const nd=k[2].filter((_,i)=>S.tk[lk()+k[0]+i]).length,dn_=nd==k[2].length;return`<div class="card blk${dn_?' bdone':''}"><div class=bh><span class="av ${k[0]=='A'?'c0':'c4'}">${k[0]}</span><div class=tt><b>${md(k[1])}</b><span class=bcnt>${dn_?'✓ Bloque completado':nd+' de '+k[2].length+' pasos'}</span></div>${tmb(k[0])}</div><ul class=stl>${k[2].map((p,i)=>{const key=lk()+k[0]+i;return`<li class="${S.tk[key]?'on':''}" data-a=tk data-v="${key}"><span class=cb>${S.tk[key]?'✓':''}</span><span class=tx2>${md(p)}</span></li>`}).join('')}</ul></div>`}).join(''):tasks(w,s).map(k=>`<div class="card blk"><div class=bh><span class="av ${k.b=='A'?'c0':'c4'}">${k.b}</span><div class=tt><b>${k.o?'(Opcional) ':''}${esc(k.t)}</b></div></div></div>`).join('');
return`<span class=eb>Con la guitarra</span><h1>Práctica de hoy</h1><p class=sub>Bloque A (${bdur('A')/60} min): la teoría tocada en la guitarra. Bloque B (${bdur('B')/60} min): oído y canciones. Hacé los pasos en orden y tocá cada uno para tacharlo. El botón ▶ de cada bloque inicia su reloj.</p>${t}${mesaOn()?mesaBox():''}${sesEx()}${metHtml()}${GLO}${navRow('Ir al cierre')}`}
if(id=='prueba'){const cp=[4,8,12].includes(w);return`<span class=eb>Prueba semanal</span><h1>${esc(x[0])}</h1><div class="card key"><span class=lb>Criterio de la semana</span><p>${esc(x[2])}</p><label class=ck><input type=checkbox data-a=cr ${S.crit[w]?'checked':''}> Lo cumplí</label></div><div class="card blk"><div class=bh><span class="av c0">1</span><div class=tt><b>Prueba (15 min)</b><span class=m>Hacé el ejercicio del criterio sin apuntes. Para medirte:</span></div></div></div>${sesEx(WD[w])}<div class="card blk"><div class=bh><span class="av c4">2</span><div class=tt><b>Repaso (15 min)</b><span class=m>Elegí dos conceptos de semanas anteriores y explicalos en voz alta sin mirar. Anotá cuál te costó más.</span></div></div></div><div class="card blk"><div class=bh><span class="av c1">3</span><div class=tt><b>Grabación (15 min)</b><span class=m>Grabá 1 minuto explicando la armonía de una canción de tu repertorio, y escuchalo.</span></div></div><label class=ck><input type=checkbox data-a=rc ${S.rec[w]?'checked':''}> Ya la grabé</label></div>${cp?`<div class="card hl"><b>Control de la semana ${w}</b><p class=m>Hacé la prueba de nivel para comparar con tu punto de partida.</p><button class="btn blk" data-a=ltest>${IC.play} Prueba de nivel</button></div>`:''}${navRow('Cerrar la sesión')}`}
const sc=ST.a.filter(k=>k&&k[1]).length,bq=S.qc[lk()];
return`<span class=eb>Cierre</span><h1>Terminaste la sesión</h1>${l?`<div class="card blk"><div class=bh><span class="av ${lapp(lk())?'c1':'c2'}">${bq!=null?bq+'/5':'–'}</span><div class=tt><b>Chequeo</b><span class=m>${lapp(lk())?'Lección aprobada.':ST.a.length?`Esta vez: ${sc} de ${l.q.length}. Conviene repasar y repetirlo.`:'Todavía no lo hiciste.'}</span></div></div>${lapp(lk())?'':`<button class="btn gh blk" data-a=rq>${IC.redo} Hacer el chequeo</button>`}</div>`:''}<div class=card><b>¿Cómo te salió?</b><div class=rate>${[1,2,3,4,5].map(n=>`<button class="rb${ST.r==n?' on':''}" data-a=rate data-v=${n}>${n}</button>`).join('')}</div><p class="m sm">1 = me costó mucho · 5 = me salió fácil</p><input type=text id=so placeholder="Canción que trabajaste (opcional)" value="${esc(ST.so||'')}"></div>${ST.r?'':'<p class="m sm hint">Elegí del 1 al 5 para poder guardar.</p>'}<div class=navr><button class="btn gh" data-a=back aria-label="Paso anterior">${IC.prev} Atrás</button><button class=btn data-a=fin ${ST.r?'':'disabled'}>Guardar y seguir ${IC.check}</button></div>`}
function finish(){S.logs.push({d:today(),w:S.w,s:S.s,m:45,e:ST.r,so:ST.so||''});const was=sLabel([S.w,S.s]),nx=nextS();if(nx){S.w=nx[0];S.s=nx[1]}else{FLASH='<b>¡Terminaste el programa de 12 semanas!</b> Compará tu prueba de nivel final en Progreso.';say(FLASH);save();ST=newST();view='home';WS=S.w;R();window.scrollTo(0,0);return}const wg=weekSess(),gn=goalN();FLASH=`<b>Guardaste ${was}.</b> Meta de la semana: ${wg}/${gn}${wg>=gn?' · ¡cumplida!':''}. Sigue ${sLabel([S.w,S.s])}${S.s==7?' (opcional)':''}.`;say(FLASH);save();ST=newST();T.run=0;T.blk='';T.base=T.left=0;saveT();tick();view='home';WS=S.w;R();window.scrollTo(0,0)}

/* ===== Vistas ===== */
const VIEW={};
const hdr=(t,sub,right='')=>`<header class=hd><div><h1 class=brand>${t}<small>${sub}</small></h1></div><div class=hdr>${right}<button class=icb data-a=theme aria-label="Cambiar tema claro u oscuro">${isDark()?IC.moon:IC.sun}</button></div></header>`;
function weekTile(w){const n=sOrd(w).filter(s=>s!=7).filter(s=>done(w,s)).length,ws=WS||S.w||1;return`<button class="wt${w==ws?' sel':''}" data-a=ws data-v=${w} aria-pressed="${w==ws}"><span class="art ${wc(w)}">${String(w).padStart(2,'0')}${w==S.w?'<i class=now>AHORA</i>':''}${S.crit[w]?'<i class=ck>✓</i>':''}</span><b>${esc(W[w-1][0])}</b><span>${n}/6 sesiones</span></button>`}
function sessRow(w,s){const k=w+'.'+s,dn_=done(w,s),cur=w==S.w&&s==S.s,av=s==6?'P':s==7?'+':k,l=LX[k];
const sub=s==6?'Criterio, repaso y grabación':s==7?'Opcional · '+(XW[w]?XW[w][1]:''):l?l.r:'';
const sc=s==6?(S.crit[w]?'CRIT<small>✓</small>':''):S.qc[k]!=null?`${S.qc[k]}/5<small>CHEQ</small>`:S.q[k]!=null?`${S.q[k]}/3<small>CHEQ</small>`:'';
return`<button class="rw${cur?' cur':''}" data-a=gs data-v="${w}:${s}"><span class="av ${wc(w)}">${av}</span><span class=tt><b>${esc(sname(w,s))}</b><span>${cur?'<em>Ahora</em> · ':''}${esc(sub)}</span></span><span class=mt>${sc}</span><span class="st${dn_?' ok':''}">${dn_?IC.check:cur?IC.play:''}</span></button>`}
function homeView(){const fl=FLASH;FLASH='';if(!WS)WS=S.w||1;const ws=WS,les=Object.keys(LX).filter(lapp).length,tl=Object.keys(LX).length,due=errDue().length,wg=weekSess(),gn=goalN();
return hdr('Guitarra','· 12 semanas',`<span class=pill><i class=dt></i>${IC.flame}${streak()} ${streak()==1?'día':'días'}</span><button class="btn hide-s" data-a=cont>${IC.play} ${S.w?'Continuar':'Empezar'}</button>`)+
(fl?`<div class="fb g top"><span class=fi>✓</span><div>${fl}</div></div>`:'')+
(S.w?`<button class=now-card data-a=cont><span class="av big ${wc(S.w)}">${S.s==6?'P':S.s==7?'+':lk()}</span><span class=tt><span class=eb>Continuar · semana ${S.w}</span><b>${esc(sname(S.w,S.s))}</b><span>${esc(W[S.w-1][0])}</span></span><span class=play>${IC.play}</span></button>`:`<div class="card hl start"><span class=eb>Punto de partida</span><h2>Primero medimos tu nivel</h2><p class=m>12 preguntas, unos 10 minutos. Sirve para comparar cuando la repitas en las semanas 4, 8 y 12.</p><div class=brow><button class=btn data-a=cont>${IC.play} Hacer la prueba de nivel</button><button class="btn gh" data-a=st0>Saltear y empezar</button></div></div>`)+
`<div class=minis><div class=mini><span class=lb>Meta semanal</span><b>${wg}<small>/${gn}</small></b><div class=dots>${Array.from({length:gn},(_,i)=>`<i class="${i<wg?'d':''}"></i>`).join('')}</div></div><div class=mini><span class=lb>Lecciones aprobadas</span><b>${les}<small>/${tl}</small></b><div class=bar><i style="width:${100*les/tl}%"></i></div></div><button class=mini data-a=${due?'rev':'tab'} ${due?'':'data-v=pra'}><span class=lb>Repaso de errores</span><b>${due}<small> hoy</small></b><span class=m>${S.err.length?'Tocá para repasar':'Sin errores guardados'}</span></button><div class=mini><span class=lb>Racha</span><b>${streak()}<small> ${streak()==1?'día':'días'}</small></b><span class=m>${dset().has(today())?'Hoy ya practicaste':'Practicá hoy para sumar'}</span></div></div>`+
`<h2 class=h2>Semanas <small>12</small></h2><div class=tiles>${W.map((_,i)=>weekTile(i+1)).join('')}</div>`+
`<h2 class=h2>Semana ${ws} <small>${esc(W[ws-1][0])}</small></h2><div class="card wkinfo"><p><span class=lb>Objetivo</span>${esc(W[ws-1][1])}</p><p><span class=lb>Criterio</span>${esc(W[ws-1][2])}${S.crit[ws]?' <b class=okc>✓ cumplido</b>':''}</p></div><div class=rows>${sOrd(ws).map(s=>sessRow(ws,s)).join('')}</div>`}
function sesView(){if(ST.k!=lk())ST=newST();const st=steps(),i=Math.min(ST.i,st.length-1),id=st[i],av=S.s==6?'P':S.s==7?'+':lk();
return`<div class=sbar><button class=icb data-a=home aria-label="Volver al inicio">${IC.back}</button><span class="av ${wc(S.w)}">${av}</span><div class=ttl><b>${esc(sname(S.w,S.s))}</b><span>Semana ${S.w} · ${esc(W[S.w-1][0])}</span></div><div class=tp><button class=icb data-a=back ${i?'':'disabled'} aria-label="Paso anterior">${IC.prev}</button><span class=sl>${SG[id]}<b>${i+1}/${st.length}</b></span><button class="icb acc" data-a=nx ${i<st.length-1&&canNext(id)?'':'disabled'} aria-label="Paso siguiente">${IC.next}</button></div></div>${st.length>1?stepper(st,i):''}<div class=stp>${body(id)}</div>${snav()}`}
function stepper(st,cur){const g=[];st.forEach((id,i)=>{const n=SG[id],l=g[g.length-1];if(l&&l.n==n)l.to=i;else g.push({n,from:i,to:i})});
return`<div class=stepper>${g.map(x=>{const s=cur>x.to?'d':cur>=x.from?'c':'';return`<button class="sp ${s}" ${s=='d'?`data-a=go data-v=${x.from} aria-label="Volver a ${x.n}"`:'tabindex=-1'}><i></i>${x.n}</button>`}).join('')}</div>`}
VIEW.est=()=>QS?quizView():view=='ses'&&S.w?sesView():homeView();
function quizView(){const q=QS.l[QS.i],n=QS.l.length,col=DCOL[QS.d]||0;
if(QS.done){const ok=QS.res.filter(Boolean).length,p=Math.round(100*ok/n),miss=QS.l.filter((x,i)=>!QS.res[i]),first=QS.test&&S.w==0,e=S.err.length;
return`<div class=res><span class=eb>${QS.test?'Prueba de nivel':esc(dn(QS.d))}</span><div class=score><b>${ok}</b><span>de ${n}</span></div><div class="bar big"><i style="width:${p}%;background:var(${p>=80?'--ok':p>=60?'--acc':'--ko'})"></i></div><h1>${p==100?'Perfecto.':p>=80?'Muy bien.':p>=60?'Vas por buen camino.':'Todavía falta práctica.'}</h1>${QS.best>=3?`<span class=pill>${IC.flame}${QS.best} seguidas</span>`:''}<p class=sub>${p>=80?'Seguí así.':p>=60?'Repasá lo que fallaste y volvé a intentar.':'Repetí el ejercicio y volvé a la lección.'}</p>
${miss.length?`<div class="card rev"><b>Lo que fallaste</b><p class="m sm">Quedó guardado en tu repaso de errores.</p>${miss.map(x=>`<div class=ln><span class="n ko">✕</span><span>${esc(x.t)}<br><span class="m mono">${esc(x.ex)}</span></span></div>`).join('')}</div>`:''}
${QS.from&&QS.from.sk?`<div class="fb ${p>=80?'g':'b'}"><span class=fi>${p>=80?'✓':'!'}</span><div><b>${p>=80?'Ejercicio de la sesión aprobado.':'Todavía no está aprobado.'}</b> ${p>=80?'Ya podés seguir con la lección.':'Se aprueba con 8 de 10. Podés repetirlo ahora o seguir y volver después.'}</div></div>`:''}
${first?`<button class="btn blk" data-a=st0>Empezar la semana 1 ${IC.next}</button>`:''}${QS.from&&!first?`<button class="btn blk" data-a=qexit>Volver a la lección ${IC.next}</button>`:''}${e&&!QS.review?`<button class="btn gh blk" data-a=rev>Repasar mis errores (${e})</button>`:''}<button class="btn gh blk" data-a=qagain>${IC.redo} Repetir</button>${QS.from||first?'':`<button class="btn gh blk" data-a=qexit>${IC.prev} Volver a Practicar</button>`}</div>`}
const a=QS.ans;
return`<div class=qs><div class=qtop><button class=icb data-a=qexit aria-label="Salir del ejercicio">${IC.x}</button><div class=seg>${QS.l.map((_,i)=>`<i class="${i<QS.i||(i==QS.i&&a!=null)?(QS.res[i]?'d':'x'):i==QS.i?'c':''}"></i>`).join('')}</div>${QS.cmb>1?`<span class=pill>${IC.flame}${QS.cmb}</span>`:''}</div>
<div class=qcard><div class=bh><span class="av c${col}">${EXI[QS.d]||'NV'}</span><div class=tt><span class=eb>${QS.test?'Prueba de nivel':esc(dn(QS.d))} · ${QS.i+1}/${n}</span>${QS.i==0&&!QS.test&&DD[QS.d]?`<span class=m>${esc(DD[QS.d])}</span>`:''}</div></div><h1 class=q>${esc(q.t)}</h1>${q.play?`<button class="btn gh sm" data-a=qp>${IC.play} Escuchar de nuevo</button>`:''}</div>
<button class=lnk data-a=qh>${QS.help?'Ocultar ayuda':'¿Necesitás ayuda? Tocá acá'}</button>${QS.help?helpHtml(q):''}<div id=nohl>${q.o.map((o,j)=>`<button class="opt${MONO.has(q.d)?' mono':''}${a!=null?(j==q.a?' ok':j==a?' ko':''):''}" data-a=qa data-v=${j}><span class=lt>${'ABCD'[j]}</span><span class=ot>${esc(o)}</span></button>`).join('')}</div>${a!=null?`<div class="fb ${a==q.a?'g':'b'}"><span class=fi>${a==q.a?iconOk:iconNo}</span><div><b>${a==q.a?'Correcto.':'No.'}</b> ${esc(q.ex)}</div></div><button class="btn blk" data-a=qn>${QS.i<n-1?'Siguiente':'Ver resultado'} ${IC.next}</button>`:''}${GLO}</div>`}
VIEW.pra=()=>{if(QS)return quizView();const acc=d=>{const x=S.dr[d];return x?Math.round(100*x.ok/x.n)+'% de aciertos':'Sin practicar'},due=errDue().length,all=S.err.length;
const tile=d=>`<button class=xt data-a=dstart data-v=${d}><span class="art c${DCOL[d]}">${EXI[d]}</span><b>${esc(DN[d])}</b><span>${acc(d)}</span></button>`;
return hdr('Practicar','· corrección inmediata')+`<p class="m sm">${lvW()==99?'Las preguntas cubren todo el programa.':`Las preguntas usan lo visto hasta la semana ${S.w}${S.w==1?', sesión '+Math.min(S.s,5):''}.`} Se cambia en Ajustes.</p>
<div class=feat><div class=tt><span class=eb>Medición</span><h2>Prueba de nivel</h2><p>12 preguntas mezcladas. Hacela en las semanas 0, 4, 8 y 12 para ver tu evolución.</p></div><button class=btn data-a=startTest>${IC.play} Empezar</button></div>
${all?`<button class="rw card-like" data-a=rev><span class="av c1">RE</span><span class=tt><b>Repaso de errores</b><span>${due?due+' para repasar hoy':'Nada vence hoy; podés repasar igual'} · ${all} guardados</span></span><span class=st>${IC.play}</span></button>`:''}
${[['Teoría','sin sonido',GT],['En la guitarra','sin sonido',GG],['Oído','con sonido',GO]].map(([h,s,g])=>`<h2 class=h2>${h} <small>${s}</small></h2><div class=grid>${g.map(tile).join('')}</div>`).join('')}
<details class=card><summary><b>¿Qué practico en cada uno?</b></summary>${Object.keys(DN).map(d=>`<p class=m><b style="color:var(--ink)">${esc(DN[d])}.</b> ${esc(DD[d])}</p>`).join('')}</details>`};
VIEW.exp=()=>hdr('Explorar','· mapas para ver la teoría')+`<p class=sub>Cinco mapas para entender la teoría con los ojos y los oídos. Tocá todo lo que veas.</p><div class=pills>${Object.keys(DGT).map(d=>`<button class="chip${EXD==d?' on':''}" data-a=exd data-v=${d}>${DGT[d]}</button>`).join('')}</div>${dgCard(EXD)}`;
VIEW.tut=()=>hdr('Tutor','· preguntas y correcciones')+`<p class=sub>Preguntale lo que no entiendas de la lección, o mandale tu análisis de una canción (tonalidad, grados y qué tan seguro estás) para que lo corrija. Puede equivocarse: ante una duda de teoría, contrastá con la lección.</p>${TC.map(m=>`<div class="msg${m[0]=='u'?' u':''}">${esc(m[1])}</div>`).join('')}<div class=chips><button class=chip data-a=qk data-v=1>Explicámelo de otra forma</button><button class=chip data-a=qk data-v=2>Dame un ejemplo</button><button class=chip data-a=qk data-v=3>Corregí mi análisis</button></div><textarea id=tq rows=3 placeholder="Escribí tu duda o tu análisis">${esc(TD)}</textarea><button class="btn blk" data-a=ask>Preguntar</button>`;
const pc=(a,b)=>b?Math.round(100*a/b):null;
const row=(l,p,c)=>`<div class=prow><span class="av sm c${c||0}"></span><span class=pl>${l}</span><div class=bar><i style="width:${p||0}%"></i></div><b>${p==null?'–':p+'%'}</b></div>`;
VIEW.prog=()=>{const les=Object.keys(LX).filter(lapp).length,tl=Object.keys(LX).length,tot=Object.values(S.dr).reduce((a,x)=>[a[0]+x.n,a[1]+x.ok],[0,0]);
const ts=S.tests,ch=ts.length>1?pc(ts[ts.length-1].ok,ts[ts.length-1].n)-pc(ts[0].ok,ts[0].n):null,lt=S.t4[S.t4.length-1],ac_=tot[0]?pc(tot[1],tot[0]):null;
return hdr('Progreso','· cómo vas')+`<div class=minis><div class=mini><span class=lb>Sesiones</span><b>${S.logs.length}</b></div><div class=mini><span class=lb>Lecciones aprobadas</span><b>${les}<small>/${tl}</small></b></div><div class=mini><span class=lb>Aciertos en ejercicios</span><b>${ac_==null?'–':ac_+'<small>%</small>'}</b></div><div class=mini><span class=lb>Racha</span><b>${streak()}<small> ${streak()==1?'día':'días'}</small></b></div></div>
<div class=card><b>Esta semana</b><div class=wdays>${weekDays().map((d,i)=>`<i class="${dset().has(d)?'d':d==today()?'t':''}">${'LMMJVSD'[i]}</i>`).join('')}</div><div class=prow><span class=pl>Meta: ${goalN()} sesiones</span><div class=bar><i style="width:${Math.min(100,100*weekSess()/goalN())}%"></i></div><b>${weekSess()}/${goalN()}</b></div><p class="m sm">La racha cuenta cualquier día en que terminás una sesión o un ejercicio.</p></div>
<div class=card><b>Pruebas de nivel</b>${ts.length?testChart(ts.slice(-8)):'<p class=m>Todavía no hiciste ninguna. Está en Practicar.</p>'}${ch!=null?`<p class=m>Cambio desde la primera: ${ch>=0?'+':''}${ch} puntos.</p>`:''}</div>
<div class=card><b>Aciertos por ejercicio</b>${Object.keys(DN).map(d=>row(esc(DS[d]),S.dr[d]?pc(S.dr[d].ok,S.dr[d].n):null,DCOL[d])).join('')}</div>
<div class=card><b>Repaso de errores</b><p class=m>${S.err.length?`${S.err.length} guardados, ${errDue().length} para repasar hoy. Cada acierto en el repaso los espacia más; al tercer acierto seguido salen de la lista.`:'No tenés errores guardados. Los que falles en los ejercicios aparecen acá.'}</p>${S.err.length?`<button class="btn gh blk" data-a=rev>Repasar ahora</button>`:''}</div>
<div class=card><b>Criterios por semana</b><div class=wk>${W.map((_,i)=>`<button class="wkb ${S.crit[i+1]?'d':i+1==S.w?'c':''}${WKC==i+1?' sel':''}" data-a=wkc data-v=${i+1} aria-label="Semana ${i+1}${S.crit[i+1]?', cumplida':''}">${i+1}</button>`).join('')}</div><p class="m sm">Lleno = criterio cumplido. Borde ámbar = semana actual. Tocá una semana para ver su criterio.</p>${WKC?`<div class=wkd><b>Semana ${WKC} · ${esc(W[WKC-1][0])}</b><p class=m>${esc(W[WKC-1][2])}</p><p><b style="color:var(${S.crit[WKC]?'--ok':'--mut'})">${S.crit[WKC]?'✓ Cumplido':'Pendiente'}</b></p><button class="btn gh sm" data-a=gs data-v="${WKC}:1">Ir a la semana ${WKC}</button></div>`:''}</div>
<div class=card><b>Prueba de canción</b><p class=m>Sacá de oído la estrofa de una canción nueva. Antes de verificar en Mesa, anotá tu confianza.</p><div class=f3><input type=number id=t4a min=0 placeholder="Correctos"><input type=number id=t4n min=1 placeholder="Total"><select id=t4c aria-label=Confianza><option value=baja>Confianza baja<option value=media selected>Confianza media<option value=alta>Confianza alta</select></div><button class="btn gh blk" data-a=t4s>Guardar</button>${S.t4.slice(-4).reverse().map(t=>`<div class=prow><span class=pl>Sem. ${t.w} · confianza ${esc(t.c)}</span><div class=bar><i style="width:${pc(t.a,t.n)}%"></i></div><b>${t.a}/${t.n}</b></div>`).join('')}${lt&&lt.c=='alta'&&pc(lt.a,lt.n)<60?'<p><b>Tu confianza fue alta y el acierto bajo.</b> Eso indica exceso de confianza: verificá más antes de dar por buena una hipótesis.</p>':''}</div>`};
VIEW.cfg=()=>hdr('Ajustes','· preferencias y respaldo')+`<div class=card><div class=cfgrow><b>Tema</b>${segc('th',[['dark','Oscuro'],['light','Claro'],['auto','Automático']],S.cfg.th)}</div><div class=cfgrow><b>Tamaño de letra</b>${segc('fs',[[0,'Normal'],[1,'Grande'],[2,'Muy grande']],S.cfg.fs)}</div><div class=cfgrow><b>Sonido</b>${segc('snd',[[1,'Activado'],[0,'Silenciado']],S.cfg.snd===false?0:1)}</div><div class=cfgrow><b>Meta semanal (sesiones)</b>${segc('goal',[[3,'3'],[4,'4'],[5,'5'],[6,'6']],goalN())}</div><div class=cfgrow><b>Ejercicios de Practicar</b>${segc('lv',[['auto','Según mi semana'],['all','Todo el programa']],S.cfg.lv=='all'?'all':'auto')}</div></div>
<div class=card><b>Respaldo de tu progreso</b><p class=m>El progreso vive en este navegador. Copiá este texto para guardarlo; pegalo acá y tocá Importar para restaurarlo.</p><textarea id=js rows=5>${esc(JSON.stringify(S))}</textarea><div class=brow><button class="btn gh" data-a=cp>Copiar</button><button class="btn gh" data-a=im>Importar</button><button class="btn gh danger" data-a=wp>Borrar todo</button></div><p id=ms class=m></p></div>`;

const NAV=[['est','Estudiar'],['pra','Practicar'],['exp','Explorar'],['prog','Progreso'],['tut','Tutor'],['cfg','Ajustes']];
// Al redibujar se conserva el foco (teclado y lectores de pantalla no pierden su lugar)
const focusKey=()=>{const e=document.activeElement;if(!e||e==document.body)return null;if(e.id)return'#'+CSS.escape(e.id);if(e.dataset&&e.dataset.a)return`[data-a="${CSS.escape(e.dataset.a)}"]`+(e.dataset.v!=null?`[data-v="${CSS.escape(e.dataset.v)}"]`:'');return null};
function R(){const fk=focusKey(),had=document.activeElement&&document.activeElement!=document.body;const due=errDue().length;$('#nv').innerHTML=`<button class=logo data-a=home aria-label="Inicio">${IC.logo}</button><div class=nvl>${NAV.filter(([k])=>k!='tut'||HT()).map(([k,l])=>`<button class="ni${k==tab?' on':''}${k=='cfg'?' cfg':''}" data-a=tab data-v=${k}${k=='pra'&&due?` aria-label="Practicar, ${due} errores para repasar"`:''}>${IC[k]}<span>${l}</span>${k=='pra'&&due?`<i class=tbb aria-hidden=true>${due>9?'9+':due}</i>`:''}</button>`).join('')}</div>`;$('#app').innerHTML=VIEW[tab]();const ts=document.querySelector('.tiles .wt.sel');if(ts){const c=ts.parentNode;c.scrollLeft=Math.max(0,ts.offsetLeft-c.offsetLeft-8)}updTimer();
const fe=fk&&document.querySelector(fk);if(fe&&!fe.disabled)fe.focus({preventScroll:true});else if(had){const a=$('#app');a.setAttribute('tabindex','-1');a.focus({preventScroll:true})}}
function updTimer(){if(T.run){T.left=Math.max(0,T.base-Math.floor((Date.now()-T.t0)/1000));if(!T.left){T.run=0;saveT();tick();say('Terminó el reloj del bloque '+T.blk+'.');try{ac();playOne('C',AC.currentTime+.02,1.6);playOne('G',AC.currentTime+.5,1.6);playOne('C',AC.currentTime+1,2)}catch(e){}}}
['A','B'].forEach(b=>{const e=$('#tm'+b);if(!e)return;const on=T.blk==b;e.textContent=(on&&T.run?'❚❚ ':'▶ ')+fmtT(on?T.left:bdur(b));e.classList.toggle('run',on&&!!T.run)})}

let TI=0;const tick=()=>{clearInterval(TI);TI=T.run?setInterval(updTimer,500):0};tick();

/* ===== Tutor ===== */
async function ask(){const q=(TD||'').trim();if(!q)return;TC.push(['u',q],['t','Pensando…']);TD='';R();
try{const sm=await window.claude.use('sample');if(!sm)throw 0;const l=LS(),h=TC.slice(-8,-2).map(m=>(m[0]=='u'?'Alumno: ':'Tutor: ')+m[1]).join('\n');
const r=await sm('Sos un tutor de guitarra y teoría musical (pop y rock en español) para un alumno adulto de nivel básico a intermedio. Respondé en español rioplatense con voseo, en un máximo de 120 palabras, con precisión. Si no estás seguro, decilo e indicá tu nivel de confianza. No inventes datos de canciones. Si el alumno manda un análisis, evaluá su hipótesis, señalá lo que esté mal y explicá por qué. Contexto: semana '+S.w+', sesión '+S.s+(S.w&&W[S.w-1]?' ('+W[S.w-1][0]+')':'')+'. Teoría de la lección de hoy: '+(l?l.k+' '+l.e.join(' '):'(no hay lección escrita para hoy)')+'\nHistorial:\n'+h+'\nAlumno: '+q,{cache:false});TC[TC.length-1]=['t',r.text]}
catch(e){TC[TC.length-1]=['t','El tutor no está disponible ahora (falta el permiso o se alcanzó el límite de uso).']}R()}

/* ===== Acciones ===== */
const playN=m=>{try{ac();pluck(mf(m),AC.currentTime+.02,1.3,.28)}catch(e){}};
const top0=()=>window.scrollTo(0,0);
const openSes=()=>{metStop();stopSeq();view='ses';tab='est';ST=newST();R();top0()};
function dPlayFrom(from){const d=(DEMO[lk()]||[])[DP.j];if(!d)return;const seq=d[1].slice(from);playSeq(seq,gapOf(d[1]),null,k=>{if(k<0){DP.on=0}else{DP.i=from+k}updStage()});DP.on=1;DP.i=from;updStage()}
const A={
tab:v=>{metStop();stopSeq();tab=v;if(v=='est'&&!QS){}R();top0()},
home:()=>{metStop();stopSeq();QS=null;tab='est';view='home';WS=S.w||1;R();top0()},
cont:()=>{if(!S.w){startQuiz('nivel',0,{});return}openSes()},
ws:v=>{WS=+v;R()},
theme:()=>{S.cfg.th=isDark()?'light':'dark';save();applyCfg();R()},
gs:v=>{const[w,s]=v.split(':').map(Number);S.w=w;S.s=s;save();openSes()},
met:()=>{if(MT.on)metStop();else metStart();R()},
bpm:v=>{MT.bpm=Math.max(40,Math.min(200,MT.bpm+ +v));const e=$('#mbpm'),r=$('#mr');if(e&&e.firstChild)e.firstChild.textContent=MT.bpm;if(r)r.value=MT.bpm},
wkc:v=>{WKC=WKC==+v?0:+v;R()},
cfg:v=>{const[k,x]=v.split(':');if(k=='th'||k=='lv')S.cfg[k]=x;else if(k=='snd')S.cfg.snd=x=='1';else S.cfg[k]=+x;save();applyCfg();R()},
plan:()=>A.home(),
st0:()=>{S.w=1;S.s=1;save();QS=null;openSes()},
nx:()=>{metStop();stopSeq();ST.i++;R();top0()},back:()=>{metStop();stopSeq();ST.i=Math.max(0,ST.i-1);R();top0()},
go:v=>{metStop();stopSeq();ST.i=+v;R();top0()},
rq:()=>{const l=LS();ST.a=[];ST.qi=0;ST.ord=l?l.q.map(q=>shufI(q[1].length)):[];ST.i=steps().indexOf('chk');R();top0()},
skipq:()=>{ST.i=steps().indexOf('guit');R();top0()},
lq:v=>{const l=LS(),q=l.q[ST.qi];if(!q||ST.a[ST.qi])return;const j=+v,ok=j==q[2];ST.a[ST.qi]=[j,ok];if(ST.a.filter(Boolean).length==l.q.length){const sc=ST.a.filter(a=>a[1]).length;S.qc[lk()]=Math.max(S.qc[lk()]||0,sc);save()}R();say(ok?'Correcto. '+q[3]:'No. La respuesta era '+q[1][q[2]]+'. '+q[3])},
qnext:()=>{ST.qi++;R();top0()},
dplay:()=>{if(DP.on){stopSeq();updStage();return}const d=(DEMO[lk()]||[])[DP.j];if(!d)return;dPlayFrom(DP.i>=d[1].length-1?0:DP.i)},
dsel:v=>{DP.j=+v;DP.i=0;R();dPlayFrom(0)},
dprev:()=>{stopSeq();DP.i=Math.max(0,DP.i-1);updStage();const d=DEMO[lk()][DP.j];try{ac();playOne(d[1][DP.i],AC.currentTime+.02,1.6)}catch(e){}},
dnext:()=>{stopSeq();const d=DEMO[lk()][DP.j];DP.i=Math.min(d[1].length-1,DP.i+1);updStage();try{ac();playOne(d[1][DP.i],AC.currentTime+.02,1.6)}catch(e){}},
dchip:v=>{stopSeq();DP.i=+v;updStage();const d=DEMO[lk()][DP.j];try{ac();playOne(d[1][DP.i],AC.currentTime+.02,1.8)}catch(e){}const st=$('#stage');if(st&&st.getBoundingClientRect().top<0)st.scrollIntoView({behavior:'smooth',block:'start'})},
tb:v=>{if(T.blk!=v){T.blk=v;T.base=T.left=bdur(v);T.run=0}if(T.run){T.run=0;T.base=T.left}else{if(!T.left)T.base=T.left=bdur(v);T.base=T.left;T.run=1;T.t0=Date.now()}saveT();tick();updTimer()},
tk:(v,b)=>{S.tk[v]=!S.tk[v];if(!S.tk[v])delete S.tk[v];save();b.classList.toggle('on',!!S.tk[v]);const c=b.querySelector('.cb');if(c)c.textContent=S.tk[v]?'✓':'';const cd=b.closest('.card');if(cd){const li=cd.querySelectorAll('.stl li'),n=[...li].filter(x=>x.classList.contains('on')).length,all=n==li.length,bc=cd.querySelector('.bcnt');cd.classList.toggle('bdone',all);if(bc)bc.textContent=all?'✓ Bloque completado':n+' de '+li.length+' pasos';if(all)say('Bloque completado.')}},
cr:(v,b)=>{S.crit[S.w]=b.checked;save()},rc:(v,b)=>{S.rec[S.w]=b.checked;save()},
rate:v=>{ST.r=+v;R()},fin:()=>{if(ST.r)finish()},
startTest:()=>startQuiz('nivel'),dstart:v=>startQuiz(v,10),rev:()=>startReview(),
qa:v=>{const q=QS.l[QS.i];if(QS.ans!=null)return;const ok=+v==q.a;QS.ans=+v;QS.res.push(ok);if(ok){QS.cmb++;QS.best=Math.max(QS.best,QS.cmb)}else QS.cmb=0;if(QS.review)errRes(q,ok);else if(!ok)errAdd(q);save();R();say(ok?'Correcto.':'No. La respuesta era '+q.o[q.a]+'.')},
qn:()=>{if(QS.i<QS.l.length-1){QS.i++;QS.ans=null;R();top0();setTimeout(autoPlay,200)}else finishQuiz()},
qh:()=>{QS.help=!QS.help;R()},
qp:()=>{const q=QS.l[QS.i];playSeq(q.play,q.play.length==1?1.6:1.1,'#nohl')},
qagain:()=>{if(QS.review)startReview();else startQuiz(QS.d,10,QS.from)},qexit:()=>{stopSeq();const f=QS&&QS.from;QS=null;if(f)tab='est';R();top0()},
lstart:v=>startQuiz(v,10,{sk:lk()+'|'+v}),ltest:()=>startQuiz('nivel',0,{}),
askl:()=>{TD=LS()?'No entiendo esta parte de la lección: ':'Necesito que me expliques la teoría de esta semana: ';tab='tut';R();top0()},
qk:v=>{TD={1:'Explicame la lección de hoy con otras palabras.',2:'Dame un ejemplo concreto de la lección de hoy.',3:'Corregí mi análisis. Tonalidad: … Grados: … Confianza: …'}[v];R()},
ask:ask,
exd:v=>{EXD=v;R()},ck:v=>{CF.r=v;refreshDG()},cm:v=>{CF.m=+v;refreshDG()},
cn:v=>{const[i,m]=v.split(':').map(Number);CF.r=CROOTS[i];CF.m=m;refreshDG();const k=kinfo(CF.r,CF.m);try{stopSeq();ac();playOne(k.ch[0],AC.currentTime+.02,1.6)}catch(e){}},
nt:v=>playN(+v),nn:v=>{const k=kinfo(CF.r,CF.m);playN(rootMidi(k)+(k.m?IVm:IVM)[+v])},
pc:v=>{try{stopSeq();ac();playOne(v,AC.currentTime+.02,1.8)}catch(e){}},
psc:(v,b)=>{const k=kinfo(CF.r,CF.m),e=b&&b.closest&&b.closest('[data-dg]'),st=e&&e.dataset.dg=='stair',fr=e&&e.dataset.dg=='fret';playSeq(scaleSeq(k,fr?fretNotes(k):null),.45,st?'[data-dg=stair]':'#nohl')},fm:v=>{FM=v;refreshDG()},flb:v=>{FLB=v;refreshDG()},
pfn:()=>{const k=kinfo(CF.r,CF.m);playSeq([k.ch[0],k.ch[3],k.m?k.V:k.ch[4],k.ch[0]],1.1,'#nohl')},
t4s:()=>{const a=+$('#t4a').value,n=+$('#t4n').value;if(!n||a<0||a>n)return;S.t4.push({d:today(),w:S.w,a,n,c:$('#t4c').value});save();R()},
cp:()=>{const t=$('#js');t.select();try{navigator.clipboard.writeText(t.value).catch(()=>{})}catch(e){}$('#ms').textContent='Copiado. Si no se copió, seleccioná el texto y copialo a mano.'},
im:()=>{try{const o=JSON.parse($('#js').value);if(!o||!Array.isArray(o.logs))throw 0;S=Object.assign(DEF(),o);fixS();save();applyCfg();ST=newST();R();$('#ms')&&($('#ms').textContent='Importado.')}catch(e){$('#ms').textContent='El texto no es un respaldo válido.'}},
wp:()=>{if(!wipe){wipe=1;$('#ms').textContent='Tocá “Borrar todo” otra vez para confirmar.';return}wipe=0;S=DEF();save();applyCfg();ST=newST();QS=null;view='home';WS=0;R()}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&!b.disabled&&A[b.dataset.a]){if(S.cfg.snd!==false){try{ac()}catch(x){}}A[b.dataset.a](b.dataset.v,b)}});
document.addEventListener('input',e=>{if(e.target.id=='tq')TD=e.target.value;if(e.target.id=='mr'){MT.bpm=+e.target.value;const m=$('#mbpm');if(m&&m.firstChild)m.firstChild.textContent=MT.bpm}if(e.target.id=='so')ST.so=e.target.value});
document.addEventListener('keydown',e=>{if(tab!='est'||view!='ses'||QS||/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))return;if(e.key=='ArrowRight'){const b=document.querySelector('.tp [data-a=nx]:not([disabled])');if(b){e.preventDefault();b.click()}}if(e.key=='ArrowLeft'){const b=document.querySelector('.tp [data-a=back]:not([disabled])');if(b){e.preventDefault();b.click()}}});
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(S.cfg.th=='auto'){applyCfg();R()}})}catch(e){}

applyCfg();R();
if('serviceWorker' in navigator&&location.protocol.indexOf('http')==0){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})})}
