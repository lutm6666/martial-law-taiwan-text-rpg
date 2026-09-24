;(function(global){
'use strict';

var C=global.CASE3_FILM_CANON;
var E=global.Case3FilmEngine;
if(!C||!E){console.error('Case 3 canon and engine are required before case3-film-ui.js');return}

var state=null,root=null,view='scene',recordFilter='E',notice='';

var FRAME_NOTES={
 personMovement:'人物位置在相鄰影格之間呈現連續變化。',
 movingObject:'畫面中的移動物體在相鄰影格間依序改變位置。',
 fixedBackground:'固定建築線條與背景參照物保持一致。'
};

function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function $(sel){return root?root.querySelector(sel):null}
function $all(sel){return root?Array.prototype.slice.call(root.querySelectorAll(sel)):[]}
function has(arr,id){return Array.isArray(arr)&&arr.indexOf(id)>=0}
function saveNotice(t){notice=t||''}
function ensureStyle(){
 if(document.getElementById('case3FilmStyle'))return;
 var st=document.createElement('style');st.id='case3FilmStyle';st.textContent='.c3-shell{--c3-bg:#10110e;--c3-panel:#191b16;--c3-ink:#ece8dc;--c3-muted:#9d9a8e;--c3-line:#3a3d33;--c3-accent:#b69b5f;color:var(--c3-ink);font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC",sans-serif;max-width:760px;margin:0 auto;padding:16px 16px 94px}.c3-card{background:linear-gradient(180deg,#1e211a,#181a16);border:1px solid #34372e;border-radius:17px;padding:16px;box-shadow:0 12px 30px rgba(0,0,0,.2)}.c3-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.c3-kicker{font-size:.68rem;letter-spacing:.12em;color:#9a917c}.c3-head h1{font-size:1.35rem;margin:4px 0}.c3-chip{border:1px solid #56594c;border-radius:999px;padding:6px 10px;font-size:.68rem;color:#c6c1b2;background:#171914;white-space:nowrap}.c3-sub{color:#99968a;font-size:.76rem;line-height:1.55}.c3-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.c3-tabs button,.c3-record-tabs button{border:1px solid #3a3d33;background:#181a16;color:#a6a397;border-radius:11px;padding:10px}.c3-tabs button.active,.c3-record-tabs button.active{background:#302d21;border-color:#8c7b50;color:#eee4ce}.c3-scene h2,.c3-card h2{margin:4px 0 10px}.c3-scene p{line-height:1.82;color:#d5d0c4}.c3-story{margin-top:12px;padding:13px 14px;border-left:3px solid #8d7853;background:rgba(182,155,95,.07);border-radius:0 12px 12px 0}.c3-story-title{font-size:.7rem;letter-spacing:.08em;color:#c5b482;font-weight:700;margin-bottom:7px}.c3-story p{margin:0;line-height:1.82;color:#ddd6c6}.c3-actions,.c3-map,.c3-record-list{display:grid;gap:9px;margin-top:12px}.c3-action,.c3-map button,.c3-frame-btn,.c3-hypothesis-btn{border:1px solid #3d4036;background:#1b1d18;color:#ece8dc;border-radius:13px;padding:12px;text-align:left}.c3-action strong,.c3-map strong,.c3-frame-btn strong{display:block}.c3-action small,.c3-map small,.c3-frame-btn small{display:block;color:#969386;margin-top:5px;line-height:1.5}.c3-action:disabled,.c3-map button:disabled,.c3-frame-btn:disabled{opacity:.42}.c3-map button.current{border-color:#9b8754;background:#292719}.c3-note{margin-top:12px;padding:11px 12px;border-left:3px solid #8d7853;background:#211e18;line-height:1.65;color:#c8c1b1}.c3-empty{color:#908d82;line-height:1.65}.c3-record-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}.c3-record{border:1px solid #35382f;border-radius:12px;padding:12px;background:#171914}.c3-record strong{display:block}.c3-record small{display:block;color:#9d9a8f;line-height:1.62;margin-top:5px}.c3-tag{display:inline-block;margin-top:8px;border:1px solid #4a4c42;border-radius:999px;padding:3px 7px;font-size:.66rem;color:#aaa79b}.c3-frame-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:13px 0}.c3-frame{aspect-ratio:3/2;border:1px solid #4a4b42;border-radius:8px;background:linear-gradient(145deg,#272a23,#11130f);display:flex;align-items:center;justify-content:center;color:#aaa799;font-weight:700}.c3-frame:nth-child(3){border-style:dashed;border-color:#8f7a4d}.c3-frame-grid{display:grid;gap:8px}.c3-frame-btn.done{border-color:#756b4b;background:#242318}.c3-status-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:12px}.c3-status{padding:10px;border:1px solid #34372f;border-radius:10px;background:#151713}.c3-status small{display:block;color:#8f8c80}.c3-status strong{display:block;margin-top:3px}.c3-reset{width:100%;margin-top:14px;border:1px solid #484a40;background:transparent;color:#aaa79b;border-radius:12px;padding:11px}.c3-ready{border-left-color:#b69b5f}.c3-locked{opacity:.66}.c3-footer{margin-top:14px;color:#77786f;font-size:.7rem;line-height:1.55}@media(min-width:640px){.c3-actions,.c3-map{grid-template-columns:1fr 1fr}.c3-frame-grid{grid-template-columns:repeat(3,1fr)}}';
 document.head.appendChild(st);
}

function getState(name){
 var raw=null;
 try{raw=localStorage.getItem(C.saveKey)}catch(e){}
 if(raw)return E.load();
 return E.reset(name||'林默');
}

function headerHtml(){
 var loc=C.locations[state.loc];
 return '<div class="c3-head"><div><div class="c3-kicker">'+esc(C.label)+'</div><h1>'+esc(C.title)+'</h1><div class="c3-sub">'+esc(C.year)+'｜'+esc(loc?loc.name:'')+'</div></div><div class="c3-chip">獨立 UI 原型</div></div>';
}
function tabHtml(){
 return '<div class="c3-tabs">'+
  tabBtn('scene','調查')+tabBtn('map','地圖')+tabBtn('records','紀錄')+tabBtn('deduction','推理')+
 '</div>';
}
function tabBtn(id,label){return '<button type="button" data-view="'+id+'" class="'+(view===id?'active':'')+'">'+label+'</button>'}

function render(){
 if(!root||!state)return;
 E.derive(state);
 var html='<div class="c3-shell">'+headerHtml()+tabHtml();
 if(notice)html+='<div class="c3-note">'+esc(notice)+'</div>';
 if(view==='map')html+=renderMap();
 else if(view==='records')html+=renderRecords();
 else if(view==='deduction')html+=renderDeduction();
 else html+=renderScene();
 html+='<button type="button" class="c3-reset" data-reset>重新開始第三案原型</button><div class="c3-footer">此頁為第三案獨立原型，不會修改第一、二案執行鏈；正式圖片與最終推理選項尚未接入。</div></div>';
 root.innerHTML=html;
 bind();
}

function sceneIntroText(){
 var l=C.locations[state.loc],text=(l&&l.intro)||'重新核對目前已有的紀錄。';
 if(state.loc==='studio'&&state.flags.e10Found&&!state.flags.e10Verified){
  return '你再次回到明光照相館。舊零片已經攤在工作桌上，其中有一格和第 13 格的畫面非常相似；現在真正要做的是驗證，而不是因為「看起來像」就直接替它命名。';
 }
 if(state.loc==='studio'&&has(state.conclusions,'C07')&&has(state.conclusions,'C13')&&!state.flags.e10Found){
  return '你帶著追加放大紀錄與 9 月 21 日店務紀錄回到前台。第 13 格最後一次確定存在的時間，以及誰有機會接觸 A-217，現在都比開場時清楚得多。';
 }
 if(state.loc==='chen_home'&&state.flags.e10Verified&&!state.flags.xiulianAdmission){
  return '你再次來到陳家。這次手上多了一格已完成比對的原片，但你沒有告訴秀蓮它是在哪裡找到的。';
 }
 return text;
}
function actionResultHtml(){
 var id=state.lastAction,a=id&&C.actions[id];
 if(!a||a.location!==state.loc||!a.result)return '';
 return '<div class="c3-story"><div class="c3-story-title">調查結果</div><p>'+esc(a.result)+'</p></div>';
}

function renderScene(){
 var l=C.locations[state.loc],actions=E.availableActions(state);
 var html='<article class="c3-card c3-scene"><div class="c3-kicker">'+esc(l.sub)+'</div><h2>'+esc(l.name)+'</h2><p>'+esc(sceneIntroText())+'</p>';
 html+=actionResultHtml();
 if(state.loc==='alley'&&state.flags.frameCompareOpen)html+=renderFrameCompare();
 html+='<div class="c3-actions">';
 if(actions.length){
  actions.forEach(function(a){html+='<button type="button" class="c3-action" data-action="'+esc(a.id)+'"><strong>'+esc(a.label)+'</strong><small>'+esc(a.hint)+'</small></button>'});
 }else{
  html+='<div class="c3-empty">目前沒有新的可執行動作。可以查看地圖或案件紀錄，帶著新線索再回來。</div>';
 }
 html+='</div></article>';
 return html;
}

function renderFrameCompare(){
 var cats=C.frameAnalysis.categories;
 var html='<div class="c3-note"><strong>影格比對</strong><br>先分開檢查人物、移動物體與固定背景，不直接替照片補上人物身分或行動目的。</div>';
 html+='<div class="c3-frame-strip">';
 [11,12,13,14,15].forEach(function(n){html+='<div class="c3-frame">第 '+n+' 格</div>'});
 html+='</div><div class="c3-frame-grid">';
 Object.keys(cats).forEach(function(k){
  var done=!!state.frameAnalysis[k];
  html+='<button type="button" class="c3-frame-btn '+(done?'done':'')+'" data-frame="'+esc(k)+'" '+(done?'disabled':'')+'><strong>'+esc(cats[k].label)+'</strong><small>'+(done?esc(FRAME_NOTES[k]):'進行這一類比較')+'</small></button>';
 });
 html+='</div>';
 if(state.frameAnalysis.continuityComplete)html+='<div class="c3-note c3-ready">三類觀察已完成；相關調查結論已寫入紀錄。</div>';
 return html;
}

function renderMap(){
 var ids=E.visibleLocations(state);
 var html='<article class="c3-card"><div class="c3-kicker">調查地圖</div><h2>目前可前往地點</h2><div class="c3-map">';
 ids.forEach(function(id){
  var l=C.locations[id],current=id===state.loc;
  html+='<button type="button" data-go="'+esc(id)+'" class="'+(current?'current':'')+'" '+(current?'disabled':'')+'><strong>'+esc(l.name)+'</strong><small>'+(current?'目前位置':esc(l.sub))+'</small></button>';
 });
 html+='</div></article>';
 return html;
}

function recordFilterBtn(id,label,count){
 return '<button type="button" data-record-filter="'+id+'" class="'+(recordFilter===id?'active':'')+'">'+label+' '+count+'</button>';
}
function renderRecords(){
 var hCount=Object.keys(state.hypotheses||{}).length;
 var html='<article class="c3-card"><div class="c3-kicker">案件紀錄</div><h2>分開保存證物、結論、證詞與假說</h2>';
 html+='<div class="c3-record-tabs">'+
  recordFilterBtn('E','證物',state.evidence.length)+
  recordFilterBtn('C','結論',state.conclusions.length)+
  recordFilterBtn('T','證詞',state.testimonies.length)+
  recordFilterBtn('H','假說',hCount)+
 '</div><div class="c3-record-list">';
 if(recordFilter==='E')html+=recordsEvidence();
 else if(recordFilter==='C')html+=recordsConclusions();
 else if(recordFilter==='T')html+=recordsTestimonies();
 else html+=recordsHypotheses();
 html+='</div></article>';
 return html;
}
function recordsEvidence(){
 if(!state.evidence.length)return '<div class="c3-empty">目前尚未取得證物。</div>';
 return state.evidence.map(function(id){
  var e=E.evidenceView(state,id);if(!e)return'';
  return '<div class="c3-record"><strong>'+esc(id+'｜'+e.name)+'</strong><small>'+esc(e.type+'｜'+e.desc)+'</small></div>';
 }).join('');
}
function recordsConclusions(){
 if(!state.conclusions.length)return '<div class="c3-empty">目前尚未建立調查結論。</div>';
 return state.conclusions.map(function(id){
  var c=C.conclusions[id];return c?'<div class="c3-record"><strong>'+esc(id)+'</strong><small>'+esc(c.text)+'</small></div>':'';
 }).join('');
}
function verificationLabel(v){
 var m={unverified:'未驗證',partially_supported:'部分支持',supported:'已有獨立資料支持',self_report:'人物自述'};
 return m[v]||v||'';
}
function recordsTestimonies(){
 if(!state.testimonies.length)return '<div class="c3-empty">目前尚未記錄人物證詞。</div>';
 return state.testimonies.map(function(id){
  var t=E.testimonyView(state,id);if(!t)return'';
  return '<div class="c3-record"><strong>'+esc(id+'｜'+t.speaker)+'</strong><small>'+esc(t.text)+'</small><span class="c3-tag">'+esc(verificationLabel(t.verification))+'</span></div>';
 }).join('');
}
function recordsHypotheses(){
 var ids=Object.keys(state.hypotheses||{});
 if(!ids.length)return '<div class="c3-empty">目前沒有已建立的假說。第三案不會替玩家自動建立錯誤假說；只有玩家主動提出的假說才會出現在這裡。</div>';
 return ids.map(function(id){
  var h=state.hypotheses[id];
  return '<div class="c3-record"><strong>'+esc(id+'｜'+h.text)+'</strong><small>狀態：'+esc(h.status)+'｜修訂 '+esc(h.revision)+'</small></div>';
 }).join('');
}

function renderDeduction(){
 var ready=C.predicates.canStartDeduction(state);
 var html='<article class="c3-card '+(ready?'c3-ready':'c3-locked')+'"><div class="c3-kicker">最終推理</div><h2>'+(ready?'六問已具備進入條件':'尚未具備結案條件')+'</h2>';
 if(!ready)html+='<p class="c3-empty">最終推理不以「蒐集全部物件」為門檻，而是檢查關鍵結論是否完成。繼續調查目前仍缺少的證據鏈。</p>';
 else html+='<p>核心證據鏈已形成。正式選項與四種結局判定會在下一階段接入；此 UI 骨架先確認 gate 與六問順序。</p>';
 html+='<div class="c3-record-list">';
 C.deductions.forEach(function(q,i){html+='<div class="c3-record"><strong>'+(i+1)+'｜'+esc(q.question)+'</strong><small>'+(ready?'待接正式選項':'尚未開始')+'</small></div>'});
 html+='</div><div class="c3-status-grid"><div class="c3-status"><small>影格連續性</small><strong>'+(state.frameAnalysis.continuityComplete?'已建立':'未完成')+'</strong></div><div class="c3-status"><small>M-317 業務背景</small><strong>'+(has(state.conclusions,'C10')?'已建立':'未完成')+'</strong></div><div class="c3-status"><small>第 13 格原片</small><strong>'+(state.flags.e10Verified?'已驗證':'未完成')+'</strong></div><div class="c3-status"><small>秀蓮最終詢問</small><strong>'+(state.flags.xiulianAdmission?'已完成':'未完成')+'</strong></div></div></article>';
 return html;
}

function changedNotice(before){
 var addedE=state.evidence.filter(function(id){return before.evidence.indexOf(id)<0});
 var addedC=state.conclusions.filter(function(id){return before.conclusions.indexOf(id)<0});
 var addedT=state.testimonies.filter(function(id){return before.testimonies.indexOf(id)<0});
 var parts=[];
 if(addedE.length)parts.push('新增證物：'+addedE.map(function(id){return E.evidenceView(state,id).name}).join('、'));
 if(addedC.length)parts.push('新增調查結論 '+addedC.join('、'));
 if(addedT.length)parts.push('新增人物紀錄 '+addedT.join('、'));
 return parts.join('｜')||'案件紀錄已更新。';
}

function bind(){
 $all('[data-view]').forEach(function(b){b.onclick=function(){view=b.getAttribute('data-view');notice='';render()}});
 $all('[data-record-filter]').forEach(function(b){b.onclick=function(){recordFilter=b.getAttribute('data-record-filter');render()}});
 $all('[data-go]').forEach(function(b){b.onclick=function(){
  var r=E.travel(state,b.getAttribute('data-go'));if(r.ok){state=r.state;view='scene';notice='';render()}else{saveNotice('目前還沒有足夠理由前往這個地點。');render()}
 }});
 $all('[data-action]').forEach(function(b){b.onclick=function(){
  var before=E.snapshot(state),r=E.runAction(state,b.getAttribute('data-action'));
  if(!r.ok){saveNotice('這個動作目前無法執行。');render();return}
  state=r.state;saveNotice(changedNotice(before));render();
 }});
 $all('[data-frame]').forEach(function(b){b.onclick=function(){
  var before=E.snapshot(state),r=E.observeFrame(state,b.getAttribute('data-frame'));
  if(r.ok){state=r.state;saveNotice(changedNotice(before));render()}
 }});
 var reset=$('[data-reset]');if(reset)reset.onclick=function(){state=E.reset(state.playerName||'林默');view='scene';recordFilter='E';notice='原型進度已重設。';render()};
}

function mount(target,options){
 ensureStyle();
 root=typeof target==='string'?document.getElementById(target):target;
 if(!root){console.error('Case3FilmUI target missing');return false}
 var opts=options||{};
 state=getState(opts.playerName||'林默');
 if(opts.reset===true)state=E.reset(opts.playerName||'林默');
 view='scene';recordFilter='E';notice='';
 render();return true;
}
function getSnapshot(){return state?E.snapshot(state):null}

global.Case3FilmUI={mount:mount,render:render,getSnapshot:getSnapshot};
})(window);
