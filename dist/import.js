function parseQuiz(html){
  const template=document.createElement('template');
  template.innerHTML=html;
  const doc=template.content;
  const rows=[];
  function add(en,opts,answer,note=''){
    en=en.trim();opts=opts.map(x=>x.trim());
    if(en&&opts.length>=2&&opts.length<=4&&opts.every(Boolean)&&answer>=0&&answer<opts.length&&!rows.some(q=>q.en===en))rows.push({en,opts,answer,note});
  }
  for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){
    function visit(x){
      if(!x||typeof x!=='object')return;
      if(x['@type']==='Question'&&x.acceptedAnswer){
        const correct=[x.acceptedAnswer].flat()[0]?.text;
        const choices=[x.suggestedAnswer||[]].flat().map(a=>a.text).filter(Boolean);
        if(correct&&choices.length){if(!choices.includes(correct))choices.push(correct);add(String(x.text||x.name||''),choices,choices.indexOf(correct));}
      }
      Object.values(x).forEach(visit);
    }
    try{visit(JSON.parse(script.textContent));}catch{}
  }
  for(const group of doc.querySelectorAll('fieldset,.question,[data-question]')){
    const title=group.querySelector('legend,h2,h3,h4,.question-text');
    const labels=[...group.querySelectorAll('label')];
    const marked=labels.filter(label=>label.matches('.correct,[data-correct="true"]')||label.querySelector('[data-correct="true"],.correct'));
    if(title&&marked.length===1)add(title.textContent,labels.map(label=>label.textContent),labels.indexOf(marked[0]),group.querySelector('.explanation')?.textContent.trim()||'');
  }
  doc.querySelectorAll('script,style,noscript,iframe').forEach(n=>n.remove());
  doc.querySelectorAll('br,p,div,li,h1,h2,h3,h4,section,tr,label,legend').forEach(n=>{n.before('\n');n.after('\n');});
  const lines=doc.textContent.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  let stem='',opts=[];
  for(const line of lines){
    const answer=line.match(/^(?:correct\s+answer|answer|正确答案|答案)\s*[:：]\s*([A-D])(?:\b|[.、）)])/i);
    const opt=line.match(/^([A-D])[.、）):]\s*(.+)/i);
    if(answer){add(stem,opts,'ABCD'.indexOf(answer[1].toUpperCase()));stem='';opts=[];}
    else if(/^(?:explanation|解析)[:：]/i.test(line)&&!stem&&rows.length)rows[rows.length-1].note=line.replace(/^[^:：]+[:：]\s*/,'');
    else if(opt&&'ABCD'.indexOf(opt[1].toUpperCase())===opts.length)opts.push(opt[2]);
    else if(!opts.length||/^(?:Q(?:uestion)?\s*)?\d+[.)：:]/i.test(line)){stem=line.replace(/^(?:Q(?:uestion)?\s*)?\d+[.)：:]\s*/i,'');opts=[];}
  }
  return rows;
}
function importPage(){
  root.innerHTML='<section class="panel">'+button('← 返回首页','home')+'<h2>导入网页题目</h2><p>选择 HTML 文件。支持标有 A–D 选项和「Answer: B」答案行的题目，以及带 Question 结构化数据的网页。每次最多 20 题。</p><input type="file" accept=".html,.htm,text/html"><p><label>原网页链接 <input type="url" placeholder="https://…"></label></p><div class="preview"></div><button class="primary" disabled>确认加入公共网络题库</button><p role="status"></p></section>';
  const [file,url]=root.querySelectorAll('input'), preview=root.querySelector('.preview'),submit=root.querySelector('.primary'),status=root.querySelector('[role=status]');
  let rows=[];
  file.onchange=async()=>{
    rows=[];preview.replaceChildren();submit.disabled=true;
    const f=file.files[0];if(!f)return;
    if(f.size>2000000){status.textContent='请选择小于 2 MB 的网页。';return;}
    try{rows=parseQuiz(await f.text());}catch{status.textContent='无法读取文件。';return;}
    if(file.files[0]!==f)return;
    status.textContent=rows.length?'已识别 '+rows.length+' 题，请核对答案并填写来源。':'未识别到带明确答案的题目。';
    rows.forEach(q=>{const p=document.createElement('p');p.textContent=q.en+'　'+q.opts.map((s,i)=>'ABCD'[i]+'. '+s).join('　')+'　正确答案：'+'ABCD'[q.answer];preview.append(p);});
    submit.disabled=!rows.length||rows.length>20;if(rows.length>20)status.textContent='超过 20 题，请拆分后导入。';
  };
  submit.onclick=async()=>{
    if(!/^https?:\/\//i.test(url.value)||!url.validity.valid){status.textContent='请填写有效的原网页链接。';return;}
    submit.disabled=true;
    try{const res=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:url.value,rows})});if(!res.ok)throw Error();
      const {added}=await res.json();localStorage.setItem('ca-network-enabled','true');status.textContent='已新增 '+added+' 题，重复题已跳过。';const back=button('刷新并进入题库','reloadBank');preview.innerHTML=back;preview.querySelector('button').onclick=()=>location.reload();
    }catch{status.textContent='导入失败，请检查来源、题目长度和网络后重试。';submit.disabled=false;}
  };
}
