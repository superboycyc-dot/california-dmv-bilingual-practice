const fields='id,kind,source,en,zh,options_json,answer_index,notes_json';
async function loadQuestions(db){
  const query=db.prepare('SELECT '+fields+' FROM questions ORDER BY id');
  let {results}=await query.all();
  if(results.length<seed.length){
    // One atomic batch; concurrent first requests can safely insert the same IDs.
    const insert=db.prepare('INSERT OR IGNORE INTO questions ('+fields+') VALUES (?,?,?,?,?,?,?,?)');
    await db.batch(seed.map(q=>insert.bind(q.id,q.kind,q.source,q.en,q.zh,JSON.stringify(q.options),q.key,JSON.stringify(q.notes))));
    ({results}=await query.all());
  }
  return results.map(({options_json,answer_index,notes_json,...row})=>({...row,options:JSON.parse(options_json),key:answer_index,notes:JSON.parse(notes_json)}));
}
export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(path==='/api/import')return importQuestions(request,env.DB);
    if(path==='/questions.js'){
      const rows=await loadQuestions(env.DB);
      return new Response('const bank=[]; for(const item of '+JSON.stringify(rows)+')bank[item.id]=item;', {headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'}});
    }
    const file=assets[path==='/'?'/index.html':path];
    if(!Array.isArray(file))return new Response('Not found',{status:404});
    return new Response(file[1],{headers:{'Content-Type':file[0]+'; charset=utf-8','Cache-Control':'no-store'}});
  }
};
async function importQuestions(request,db){
  const fail=(status)=>new Response(null,{status});
  if(request.method!=='POST')return fail(405);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return fail(403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return fail(415);
  if(!request.body)return fail(400);
  const reader=request.body.getReader(),chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>64000){await reader.cancel();return fail(413);}chunks.push(value);}
  let data,src;
  try{data=JSON.parse(await new Blob(chunks).text());src=new URL(data.source);}catch{return fail(400);}
  if(!['http:','https:'].includes(src.protocol)||src.username||src.password||src.href.length>2048)return fail(400);
  const clean=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&!/[<>]/.test(s);
  if(!Array.isArray(data.rows)||!data.rows.length||data.rows.length>20)return fail(400);
  for(const q of data.rows)if(!q||!clean(q.en,1200)||!Array.isArray(q.opts)||q.opts.length<2||q.opts.length>4||!q.opts.every(o=>clean(o,600))||new Set(q.opts.map(o=>o.trim())).size!==q.opts.length||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.opts.length)return fail(400);
  const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'","&#39;");
  const insert=db.prepare('INSERT INTO questions(kind,source,en,zh,options_json,answer_index,notes_json) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM questions WHERE en=? COLLATE NOCASE)');
  const result=await db.batch(data.rows.map(q=>{
    const en=esc(q.en.trim());
    return insert.bind('network',esc(src.href),en,'',JSON.stringify(q.opts.map(o=>['',esc(o.trim())])),q.answer,JSON.stringify([clean(q.note,2000)?'来源网页解析：'+esc(q.note):'答案来自用户上传的网页，尚未独立核验。','','','']),en);
  }));
  return Response.json({added:result.reduce((n,r)=>n+r.meta.changes,0)});
}
