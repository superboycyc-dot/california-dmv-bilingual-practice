import { readFile, writeFile, mkdir } from 'node:fs/promises';
const types={'index.html':'text/html','style.css':'text/css','app.js':'text/javascript','import.js':'text/javascript'};
const assets={};
for(const [name,type] of Object.entries(types))assets['/'+name]=[type,await readFile('dist/'+name,'utf8')];
assets['/question-license.txt']=['text/plain',await readFile('db/NOTICE.txt','utf8')];
const seed=JSON.parse(await readFile('db/questions.json','utf8'));
const handler=await readFile('db/worker.mjs','utf8');
await mkdir('dist/server',{recursive:true});
await writeFile('dist/server/index.js','const assets='+JSON.stringify(assets)+';\nconst seed='+JSON.stringify(seed)+';\n'+handler);
