// Copia solo los archivos de la app a _site/ (lo que Netlify publica cuando el sitio
// está conectado a GitHub; ver netlify.toml). Así no se publican pruebas ni herramientas.
// Uso: npm run publicar
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'_site');
const APP=['index.html','sw.js','manifest.webmanifest','_headers','css','js','fonts','icons'];
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT);
for(const f of APP)fs.cpSync(path.join(ROOT,f),path.join(OUT,f),{recursive:true});
console.log('_site/ listo:',APP.join(', '));
