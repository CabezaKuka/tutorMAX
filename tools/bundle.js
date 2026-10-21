// Junta index.html + css/ + js/ en un solo archivo (dist/guitarra12.html),
// para usar la app como un único HTML (por ejemplo, dentro de Claude, donde funciona el tutor).
// Uso: npm run bundle
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
let h=rd('index.html')
 .replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g,(_,f)=>`<style>\n${rd(f)}</style>`)
 .replace(/<script src="(js\/[^"]+)"><\/script>/g,(_,f)=>`<script>\n${rd(f).replace(/<\/script/gi,'<\\/script')}</script>`);
fs.mkdirSync(path.join(ROOT,'dist'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'dist','guitarra12.html'),h);
console.log('dist/guitarra12.html',(h.length/1024).toFixed(0)+' KB');
