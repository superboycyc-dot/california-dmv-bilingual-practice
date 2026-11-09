const root = document.querySelector('#app');
const modes = ['顺序练习','随机练习','模拟考试'];
const storageKey = 'ca-road-study-v1';
let session, review = false;
let englishOnly=false,networkEnabled=false;
try{networkEnabled=localStorage.getItem('ca-network-enabled')==='true';}catch{}
const networkIds=bank.filter(q=>q.kind==='network').map(q=>q.id).sort((a,b)=>a-b);
const originalIds=bank.filter(q=>q.kind==='official').map(q=>q.id);

const languageKey='ca-road-question-language';
try{englishOnly=localStorage.getItem(languageKey)==='en';}catch{}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(session));}catch{}}
try{
  const x=JSON.parse(localStorage.getItem(storageKey));
  if(x && modes[x.mode] && Array.isArray(x.ids) && (x.mode===2?x.ids.length===30:(x.ids.length>0&&x.ids.length<=40)) && x.ids.every(i=>Number.isInteger(i)&&bank[i]) && new Set(x.ids).size===x.ids.length && Array.isArray(x.answers) && x.answers.length===x.ids.length && x.answers.every((a,j)=>a===null||(Number.isInteger(a)&&a>=0&&a<bank[x.ids[j]].options.length)) && Number.isInteger(x.pos)&&x.pos>=0&&x.pos<x.ids.length) session=x;
  if(session && !Array.isArray(session.drafts)) session.drafts=[...session.answers];
}catch{}
function shuffled(ids){
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids;
}
function start(mode,set=0,networkSet=false){
  let ids=mode===0?(networkSet?networkIds:originalIds):[...originalIds,...(networkEnabled?networkIds:[])];
  if(mode) shuffled(ids);
  if(mode===2){const seen=new Set();ids=ids.filter(i=>{const stem=bank[i].en;if(seen.has(stem))return false;seen.add(stem);return true;}).slice(0,30);}
  if(mode===0){const size=networkSet?20:10;ids=ids.slice(set*size,(set+1)*size);}
  if(mode===1) ids=ids.slice(0,10);
  session={mode,ids,answers:Array(ids.length).fill(null),drafts:Array(ids.length).fill(null),pos:0,done:false};review=false;save();question();
}
function button(label,act,cls='plain',disabled=false){return '<button class="'+cls+'" data-action="'+act+'" '+(disabled?'disabled':'')+'>'+label+'</button>';}
const favoritesKey='ca-road-favorites-v1';
let favorites=new Set();
try{favorites=new Set(JSON.parse(localStorage.getItem(favoritesKey)||'[]').filter(id=>Number.isInteger(id)&&bank[id]));}catch{}
function remember(id,remove=false){
  if(remove) favorites.delete(id); else favorites.add(id);
  try{localStorage.setItem(favoritesKey,JSON.stringify([...favorites]));return true;}catch{return false;}
}
function collection(){
  const entries=[...favorites].map(id=>{
    const q=bank[id];
    return '<article class="saved"><details><summary>'+origin(id)+'　'+(englishOnly||!q.zh?english(q.en):q.zh)+'</summary>'+q.options.map(([zh,en],i)=>'<p>'+'ABCD'[i]+'. '+reviewText(zh,en)+'</p>').join('')+'<strong>答案 '+'ABCD'[q.key]+'</strong><p>'+q.notes[0]+'</p><p>'+q.notes[2]+'</p></details>'+button('移除','remove'+id)+'</article>';
  });
  root.innerHTML='<section class="panel">'+button('← 练习首页','home')+'<h2>我的收藏</h2>'+(entries.join('')||'<p>暂无收藏。答题时双击题卡即可收藏。</p>')+'</section>';
}
function origin(id){if(bank[id].kind==='network')return (id < 100 ? '网络 · 公开资料整理' : '网络 · 用户上传')+' · ID '+id;return '官方 · 第 '+(Math.floor(id/10)+1)+' 套 · 第 '+(id%10+1)+' 题';}
function networkSets(){
  if(!networkEnabled)return '';
  const buttons=[];
  for(let i=0;i<networkIds.length;i+=20){
    const group=networkIds.slice(i,i+20);
    buttons.push(button('第 '+(i/20+1)+' 集 · '+group.length+' 题（ID '+group[0]+'–'+group[group.length-1]+'）','webset'+i/20));
  }
  return '<h2>网络题库</h2><div class="set-grid">'+buttons.join('')+'</div>';
}
function sets(){
  root.innerHTML='<section class="panel">'+button('← 练习首页','home')+'<h2>官方试卷</h2><div class="set-grid">'+[1,2,3,4].map(i=>button('第 '+i+' 套 · 10 题','set'+(i-1))).join('')+'</div>'+networkSets()+'</section>';
}
function home(){
  review=false;
  root.innerHTML='<section class="hero"><small>CALIFORNIA DRIVER HANDBOOK</small><h1>加州驾照笔试练习</h1><p>普通 C 类驾照　/　40 道官方样题　/　'+networkIds.length+' 道网络练习题</p><p>网络题库含用户上传及公开资料整理的练习题，答案请注意辨别。</p></section><div class="mode-heading"><h2>选择练习方式</h2><div class="bank-switches"><button type="button" class="plain language" data-action="network" aria-pressed="'+networkEnabled+'"><span class="switch-track" aria-hidden="true"></span>网络题库</button><button type="button" class="plain language" data-action="language" aria-pressed="'+englishOnly+'"><span class="switch-track" aria-hidden="true"></span>纯英文题目</button></div></div><div class="modes">'+modes.map((m,i)=>'<button class="card" data-action="start'+i+'"><span class="modeicon" aria-hidden="true">'+['☷','⤨','◷'][i]+'</span><b>'+m+'</b><small>'+['按题集顺序作答','每组随机抽取 10 题','随机抽取 30 题，交卷后评分'][i]+'</small><strong>开始 ↗</strong></button>').join('')+'</div><div class="library-link">'+button('☆ 我的收藏（'+favorites.size+'）','library')+' '+button('导入网页题目','import')+'</div><p class="gesture-help">左右滑切题，提交后上滑看解析。长距离下拉回首页，双击题卡收藏。</p>'+(session?'<p class="resume">'+button(session.done?'查看上次成绩':'继续上次的'+modes[session.mode]+'（第 '+(session.pos+1)+' 题）','resume')+'</p>':'');
}
function correctCount(){return session.answers.filter((a,j)=>a===bank[session.ids[j]].key).length;}
function chineseOnly(text){
  return text.replace(/DMV/g,'車輛管理局').replace(/ ?\((?:HOV|SR-1|DON.T WALK)\)/g,'');
}
function question(showEnglish=false){
  const {ids,pos,answers,mode}=session,q=bank[ids[pos]],a=answers[pos], graded=review||(mode!==2&&a!==null);
  const selected=session.drafts[pos], visible=graded;
  const displayText=s=>visible?s:chineseOnly(s);
  const en=s=>'<span class="en" lang="en">'+s+'</span>';
  const englishQuestion=englishOnly||q.kind==='network';
  const translationButton=graded||englishQuestion?'':'<button type="button" class="plain translation-toggle" data-action="english" aria-expanded="'+showEnglish+'">'+(showEnglish?'收起英文':'查看英文')+'</button>';
  const translated=!englishQuestion&&(graded||showEnglish);
  const completed=answers.filter(answer=>answer!==null).length;
  const toolbar=`<div class="quiz-toolbar">
    <progress aria-label="已提交题数" max="${ids.length}" value="${completed}"></progress>
    <div class="quiz-nav">
      <button class="home-pill" data-action="home"><i aria-hidden="true"></i>返回首页</button>
      <div class="quiz-location"><strong>第 ${pos+1} / ${ids.length} 题</strong><small>${origin(ids[pos])}</small></div>
      <span class="completion">已完成 ${completed}/${ids.length}</span>
    </div>
    <div class="quiz-tools">${review?button('返回成绩','results'):''}${button(favorites.has(ids[pos])?'★ 已收藏':'☆ 收藏','bookmark')}</div>
  </div>`;
  root.innerHTML='<section class="panel quiz-card">'+toolbar+'<div class="card-scroll"><h2 class="question">'+(englishQuestion?english(q.en):displayText(!visible&&ids[pos]===0?'什麼時候可以駛離道路超越另一輛車？':q.zh))+'</h2>'+translationButton+(translated?en(q.en):'')+q.options.map(([zh,eng],i)=>'<button class="option '+(graded&&i===q.key?'correct':selected===i?(graded?'wrong':'chosen'):'')+'" data-action="pick'+i+'" aria-pressed="'+(selected===i)+'" '+(graded?'disabled':'')+'><b>'+'ABCD'[i]+'</b><span>'+(englishQuestion?english(eng):displayText(zh))+(translated?en(eng):'')+'</span></button>').join('')+(graded?'<div class="notes"><h3>'+(a===q.key?'✓ 回答正确':'回答有误')+' · 答案 '+'ABCD'[q.key]+'</h3><p>'+q.notes[0]+'</p>'+(englishOnly?'':en(q.notes[1]))+(q.notes[2]?'<details><summary>延伸考点</summary><p>'+q.notes[2]+'</p>'+(englishOnly?'':en(q.notes[3]))+'</details>':'')+'<p><a href="'+q.source+'" target="_blank" rel="noopener">查看题目来源 ↗</a></p></div>':'')+ '</div><div class="actions">'+button('上一题','prev','plain',pos===0)+(!visible?button(mode===2?(pos===ids.length-1?'提交并查看成绩':'提交并进入下一题'):'提交本題','submit','primary',selected===null):button(pos===ids.length-1?(review?'返回成绩':mode===2?'交卷评分':'查看成绩'):'下一题 →','next','primary',a===null))+'</div></section>';
  const panel=root.querySelector('.quiz-card');
  if(graded){
    const notes=panel.querySelector('.notes');
    const sheet=document.createElement('section');
    sheet.className='answer-sheet';
    sheet.innerHTML=button('↓ 返回题目','closeSheet')+'<h2>答案与解析</h2><p>'+reviewText(...q.options[q.key])+'</p>'+notes.outerHTML;
    panel.append(sheet);
    const actions=panel.querySelector('.actions');
    actions.insertAdjacentHTML('afterbegin','<button class="plain sheet-link" data-action="sheet">答案与解析 ↑</button>');
  }
}
function advance(){
  if(session.pos+1<session.ids.length){
    session.pos++;
  }else{
    const missing=session.answers.indexOf(null);
    if(missing<0){
      review=false;
      session.done=true;
      save();
      results();
      return;
    }
    session.pos=missing;
  }
  if(!review)save();
  question();
}
function english(text){return '<span lang="en">'+text+'</span>';}
function reviewText(zh,en){return (englishOnly||!zh)?english(en):zh+'<span class="en" lang="en">'+en+'</span>';}
function results(){
  review=false;
  const n=session.ids.length,c=correctCount();
  const numbers=[],mistakes=[];
  session.ids.forEach((id,j)=>{
    const q=bank[id],answer=session.answers[j],right=answer===q.key;
    const symbol=right?'✓':'×';
    numbers.push('<button class="number '+(right?'pass':'miss')+'" data-action="jump'+j+'" aria-label="查看第 '+(j+1)+' 题，'+(right?'正确':'错误')+'">'+(j+1)+' '+symbol+'</button>');
    if(right)return;
    const choice=i=>'ABCD'[i]+'. '+reviewText(...q.options[i]);
    mistakes.push('<article class="mistake"><div class="bar"><strong>第 '+(j+1)+' 题</strong>'+button('查看解析 →','jump'+j)+'</div><h3>'+reviewText(q.zh,q.en)+'</h3><p class="response miss"><strong>× 你的选择</strong>'+choice(answer)+'</p><p class="response pass"><strong>✓ 正确答案</strong>'+choice(q.key)+'</p></article>');
  });
  root.innerHTML='<section class="panel"><div class="bar">'+button('← 练习首页','home')+'<strong>'+modes[session.mode]+'</strong></div><h2>本次成绩</h2><div class="score">'+Math.round(100*c/n)+'%</div><p>答对 '+c+' 题　·　答错 '+(n-c)+' 题　·　共 '+n+' 题</p><div class="numbers" aria-label="按题号回顾">'+numbers.join('')+'</div><h2>错题回顾</h2>'+(mistakes.join('')||'<p>全部答对，本次没有错题。</p>')+'<div class="actions">'+button('逐题回顾','review')+button('再做一组','start'+session.mode,'primary')+'</div></section>';
}
root.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
  const act=b.dataset.action;
  if(act==='network'){
    networkEnabled=!networkEnabled;
    try{localStorage.setItem('ca-network-enabled',networkEnabled);}catch{}
    b.setAttribute('aria-pressed',String(networkEnabled));
    return;
  }
  if(act.startsWith('webset')&&networkEnabled){start(0,Number(act.slice(6)),true);window.scrollTo(0,0);return;}
  if(act==='language'){
    englishOnly=!englishOnly;
    try{localStorage.setItem(languageKey,englishOnly?'en':'zh');}catch{}
    b.setAttribute('aria-pressed',String(englishOnly));
    return;
  }
  if(act==='english'){
    question(b.getAttribute('aria-expanded')!=='true');
    root.querySelector('[data-action="english"]').focus({preventScroll:true});
    return;
  }
  if(act==='sheet'||act==='closeSheet'){root.querySelector('.quiz-card').classList.toggle('reading',act==='sheet');return;}
  if(act==='bookmark'){bookmark();return;}
  if(act==='import')importPage();
  else if(act==='library')collection();
  else if(act.startsWith('remove')){remember(Number(act.slice(6)),true);collection();}
  else if(act==='start0')sets();
  else if(act.startsWith('set'))start(0,Number(act.slice(3)));
  else if(act==='home')home();
  else if(act.startsWith('start'))start(Number(act.slice(-1)));
  else if(act==='resume')session.done?results():question();
  else if(act==='results')results();
  else if(act==='review'||act.startsWith('jump')){review=true;session.pos=act==='review'?0:Number(act.slice(4));question();}
  else if(act.startsWith('pick')){session.drafts[session.pos]=Number(act.slice(-1));session.answers[session.pos]=null;save();question(!!root.querySelector('.translation-toggle[aria-expanded="true"]'));return;}
  else if(act==='submit'){
    const {pos,drafts}=session;
    if(drafts[pos]===null)return;
    session.answers[pos]=drafts[pos];
    if(session.mode===2) advance();
    else {save();question();}
  }
  else if(act==='prev'){session.pos--;if(!review)save();question();}
  else if(act==='next') advance();
  window.scrollTo(0,0);
});
home();

function notice(message){
  let toast=document.querySelector('.gesture-notice');
  if(!toast){
    toast=document.createElement('output');
    toast.className='gesture-notice';
    document.body.append(toast);
  }
  toast.textContent=message;
  clearTimeout(notice.timer);
  notice.timer=setTimeout(()=>toast.remove(),1350);
}
function bookmark(){
  const id=session.ids[session.pos];
  const stored=remember(id);
  const control=root.querySelector('[data-action="bookmark"]');
  if(control)control.textContent='★ 已收藏';
  notice(stored?'★ 已加入收藏夹':'已在本次打开中收藏，浏览器未允许本地存储');
}

const mobileQuiz=matchMedia('(max-width: 760px), (pointer: coarse) and (max-height: 640px)');
let gesture=null,lastTap=null,blockClickUntil=0,settling=false;
function point(event){return event.changedTouches[0];}
root.addEventListener('touchstart',event=>{
  const panel=event.target.closest('.quiz-card');
  if(event.target.closest('.quiz-toolbar')||!mobileQuiz.matches||!panel||settling||event.touches.length!==1){gesture=null;return;}
  const touch=point(event);
  const scroller=event.target.closest('.answer-sheet,.card-scroll');
  gesture={panel,scroller,x:touch.clientX,y:touch.clientY,time:performance.now(),top:scroller?.scrollTop||0,axis:null,dx:0,dy:0};
},{passive:true});
function canGrade(){return review||(session.mode!==2&&session.answers[session.pos]!==null);}
function navigate(dir){
  const panel=root.querySelector('.quiz-card');
  if(dir==='up'){panel.classList.add('reading');return;}
  if(dir==='down'){if(panel.classList.contains('reading'))panel.classList.remove('reading');else home();return;}
  if(dir==='right'){session.pos--;if(!review)save();question();}
  else advance();
}
root.addEventListener('touchmove',event=>{
  if(!gesture||event.touches.length!==1)return;
  const g=gesture,t=point(event);
  g.dx=t.clientX-g.x;g.dy=t.clientY-g.y;
  if(!g.axis){
    if(Math.max(Math.abs(g.dx),Math.abs(g.dy))<8)return;
    g.axis=Math.abs(g.dx)>Math.abs(g.dy)*1.15?'x':'y';
    if(g.axis==='y'&&g.scroller){
      const bottom=g.scroller.scrollHeight-g.scroller.clientHeight-g.top;
      if((g.dy<0&&bottom>2)||(g.dy>0&&g.top>2))g.axis='scroll';
    }
  }
  if(g.axis==='scroll')return;
  if(event.cancelable)event.preventDefault();
  const d=g.axis==='x'?g.dx:g.dy;
  const reading=g.panel.classList.contains('reading');
  const limited=(g.axis==='x'&&d>0&&session.pos===0)||(g.axis==='y'&&d<0&&(reading||!canGrade()));
  const offset=d*(limited?.16:1);
  g.panel.style.transform=g.axis==='x'?'translateX('+offset+'px)':'translateY('+offset+'px)';
},{passive:false});
function settle(g,dir){
  const panel=g.panel;
  const horizontal=dir==='left'||dir==='right';
  const sign=dir==='left'||dir==='up'?-1:1;
  const distance=horizontal?panel.clientWidth:panel.clientHeight;
  const frame=v=>horizontal?'translateX('+v+'px)':'translateY('+v+'px)';
  const start=panel.style.transform||'none';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration=reduce?0:155;
  settling=true;
  const finish=()=>{
    panel.style.transform='';
    if(dir){
      navigate(dir);
      const next=root.querySelector('.quiz-card')||root.firstElementChild;
      if(next&&next.animate&&!reduce)next.animate([{transform:frame(-sign*distance*.35),opacity:.65},{transform:'none',opacity:1}],{duration:170,easing:'ease-out'});
    }
    settling=false;
  };
  if(!panel.animate||!duration){finish();return;}
  panel.animate([{transform:start},{transform:dir?frame(sign*distance):'none'}],{duration,easing:'ease-out'}).finished.then(finish,finish);
}
root.addEventListener('touchend',event=>{
  const g=gesture;gesture=null;
  if(!g)return;
  const t=point(event),dx=t.clientX-g.x,dy=t.clientY-g.y,now=performance.now();
  if(!g.axis&&Math.hypot(dx,dy)<12&&now-g.time<350){
    const id=session.ids[session.pos];
    if(!event.target.closest('.actions,.translation-toggle,a,summary,[data-action="closeSheet"]')&&lastTap&&lastTap.id===id&&now-lastTap.time<340&&Math.hypot(t.clientX-lastTap.x,t.clientY-lastTap.y)<25){
      if(event.cancelable)event.preventDefault();
      blockClickUntil=now+350;lastTap=null;bookmark();
    }else lastTap={id,time:now,x:t.clientX,y:t.clientY};
    return;
  }
  lastTap=null;
  if(!g.axis||g.axis==='scroll')return;
  if(event.cancelable)event.preventDefault();
  blockClickUntil=now+350;
  let dir=null;
  const reading=g.panel.classList.contains('reading');
  if(g.axis==='x'&&Math.abs(dx)>Math.min(95,g.panel.clientWidth*.22)){
    if(dx<0)dir='left';else if(session.pos>0)dir='right';
  }else if(g.axis==='y'&&dy< -65&&!reading){
    if(canGrade())dir='up';else notice(session.mode===2?'交卷后可查看答案':'请先提交本题');
  }else if(g.axis==='y'&&dy>0){
    if(reading&&dy>65)dir='down';
    if(!reading&&dy>Math.max(140,g.panel.clientHeight*.25)&&now-g.time>260)dir='down';
  }
  if(dir==='left'&&session.pos===session.ids.length-1&&session.answers.includes(null)&&session.pos===session.answers.indexOf(null)){notice('请先提交本题');dir=null;}
  settle(g,dir);
},{passive:false});
root.addEventListener('touchcancel',()=>{if(gesture)gesture.panel.style.transform='';gesture=null;lastTap=null;});
root.addEventListener('click',event=>{if(settling||performance.now()<blockClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
