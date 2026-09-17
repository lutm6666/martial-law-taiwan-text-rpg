(function(){
'use strict';

var DATA=window.CASE2_RAIN_CANON;
if(!DATA){console.error('CASE2_RAIN_CANON missing');return;}

var SAVE_KEY='mist-taiwan-rain-canon-v1';
var CASE1_KEY='mist-taiwan-case-save-v4';
var MAX_FOCUS=4;
var s=null;

function $(id){return document.getElementById(id)}
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function parse(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(s))}catch(e){}}
function playerName(){var p=parse(CASE1_KEY)||{};return p&&typeof p.name==='string'&&p.name.trim()?p.name.trim():'林默'}
function has(id){return s.evidence.indexOf(id)!==-1}
function flag(id){return !!s.flags[id]}
function hasAll(ids){return (ids||[]).every(has)}
function flagsAll(ids){return (ids||[]).every(flag)}
function notify(msg){var t=$('toast');if(!t)return;t.textContent=msg;t.className='toast show';clearTimeout(window.__case2Toast);window.__case2Toast=setTimeout(function(){t.className='toast'},1800)}
function addEvidence(id){if(DATA.evidence[id]&&!has(id)){s.evidence.push(id);notify('新增證物：'+DATA.evidence[id].name)}}
function know(id){if(id&&s.people.indexOf(id)<0)s.people.push(id)}
function setFlags(obj){if(!obj)return;Object.keys(obj).forEach(function(k){s.flags[k]=obj[k]})}
function actionDone(id){return !!s.done[id]}

function fresh(){return{caseId:DATA.id,name:playerName(),loc:'home',visited:{home:true},evidence:[],people:[],flags:{},done:{},feedback:'',phase:'investigate',deduction:0,answers:[],focus:MAX_FOCUS,finished:false,ending:null}}
function load(){var v=parse(SAVE_KEY);if(!v||v.caseId!==DATA.id)return null;v.visited=v.visited||{};v.evidence=Array.isArray(v.evidence)?v.evidence:[];v.people=Array.isArray(v.people)?v.people:[];v.flags=v.flags||{};v.done=v.done||{};v.answers=Array.isArray(v.answers)?v.answers:[];return v}

function injectStyle(){
 if($('case2CanonStyle'))return;
 var st=document.createElement('style');st.id='case2CanonStyle';st.textContent='\
#v2Rain{padding-bottom:96px}.c2-head{padding:14px 15px;margin-bottom:12px}.c2-head h2{margin:0 0 5px;font-size:1rem}.c2-meta{font-size:.72rem;color:#9b988b;line-height:1.55}.c2-scene{overflow:hidden;padding:0}.c2-art-wrap{position:relative;background:#111}.c2-art{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;filter:saturate(.82) contrast(1.04)}.c2-art-fallback{display:none;aspect-ratio:3/2;align-items:center;justify-content:center;padding:20px;background:linear-gradient(135deg,#29261f,#151612);color:#aaa392;text-align:center}.c2-body{padding:17px}.c2-body h2{margin:4px 0 10px}.c2-body p{line-height:1.8}.c2-actions{display:grid;gap:9px;margin-top:12px}.c2-btn,.c2-map button,.c2-option{border:1px solid #3d4036;background:#1b1d18;color:#ece8dc;border-radius:13px;padding:12px;text-align:left}.c2-btn strong,.c2-map strong{display:block}.c2-btn small,.c2-map small{display:block;color:#969386;margin-top:4px;line-height:1.48}.c2-btn.done{opacity:.58}.c2-btn:disabled{opacity:.35}.c2-note{margin-top:12px;padding:11px 12px;border-left:3px solid #8d7853;background:#211e18;line-height:1.68;color:#c8c1b1}.c2-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:13px 0}.c2-tabs button{border:1px solid #3c3e35;background:#181a16;color:#aaa69a;border-radius:11px;padding:9px}.c2-tabs button.active{background:#302d21;color:#eee4ce;border-color:#8f7a4d}.c2-map{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.c2-map button.current{border-color:#9b8754;background:#292719}.c2-map button:disabled{opacity:.32}.c2-record{margin-top:9px;padding:11px;border:1px solid #35382f;border-radius:11px;background:#171914}.c2-record strong{display:block}.c2-record small{display:block;margin-top:4px;color:#9c998d;line-height:1.58}.c2-record img{width:100%;margin-top:9px;border-radius:9px;display:block;max-height:280px;object-fit:cover}.c2-proof{margin-top:7px;font-size:.72rem;color:#a9a393;line-height:1.55}.c2-deduction,.c2-ending,.c2-fail{padding:18px}.c2-deduction h2,.c2-ending h2,.c2-fail h2{line-height:1.45}.c2-option{display:block;width:100%;margin-top:9px;line-height:1.58}.c2-dots{display:flex;gap:5px;margin:8px 0 12px}.c2-dots i{width:10px;height:10px;border-radius:50%;background:#44473e}.c2-dots i.on{background:#c7b16f}.c2-warning{font-size:.78rem;color:#c99789;margin-top:10px}.c2-event{border:1px solid #65593d;background:linear-gradient(135deg,#282319,#1b1b16);padding:14px;border-radius:13px;margin-top:12px;line-height:1.72}.c2-summary{display:grid;gap:9px;margin:14px 0}.c2-summary div{padding:11px;border:1px solid rgba(65,54,32,.22);border-radius:10px;line-height:1.62}.c2-kicker{font-size:.68rem;letter-spacing:.12em;color:#9a917c}.c2-home-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}@media(min-width:640px){.c2-actions{grid-template-columns:1fr 1fr}.c2-map{grid-template-columns:repeat(3,1fr)}}';
 document.head.appendChild(st);
}

function mount(){
 if($('v2Rain'))return;
 injectStyle();
 var root=document.createElement('section');root.id='v2Rain';root.className='hidden';root.innerHTML='<div id="v2RainMain"></div>';
 document.querySelector('main.app').appendChild(root);
}
function hideBase(){['startScreen','prologueScreen','gameScreen','completeScreen','failScreen','case2Screen'].forEach(function(id){var el=$(id);if(el)el.classList.add('hidden')})}
function showRoot(){mount();hideBase();$('v2Rain').classList.remove('hidden');var chip=$('caseChip');if(chip)chip.textContent='CASE 02・雨夜敲門';var build=document.querySelector('.build');if(build)build.textContent='BUILD 6.1・CASE 02 CANON'}

function locationUnlocked(id){
 var l=DATA.locations[id];if(!l)return false;if(l.initial)return true;
 if(l.unlock&&!hasAll(l.unlock))return false;
 if(l.unlockFlags&&!flagsAll(l.unlockFlags))return false;
 return true;
}
function actionReady(a){return !a.requires||hasAll(a.requires)}
function allEvidenceFound(){return Object.keys(DATA.evidence).every(has)}
function finalReady(){return flag('qiulan_revealed')&&hasAll(['e03','e05','e06','e07','e09','e11','e12'])}

function maybeQiulanReveal(){
 if(flag('qiulan_revealed'))return false;
 var ev=DATA.events.qiulan_reveal;
 if(!flag('final_ready')||!hasAll(ev.trigger.all))return false;
 setFlags(ev.set);know(ev.know);s.feedback=ev.text;notify('人物確認：許秋蘭');return true;
}

function enterLocation(id){
 if(!locationUnlocked(id))return;
 s.loc=id;s.visited[id]=true;
 if(id==='home')maybeQiulanReveal();
 save();render();
}

function doAction(id){
 var a=DATA.actions[id];if(!a||!actionReady(a))return;
 if(a.once&&actionDone(id))return;
 s.done[id]=true;
 if(a.gain)addEvidence(a.gain);
 if(a.know)know(a.know);
 setFlags(a.set);
 s.feedback=a.text||'';
 save();render();
}

function phaseLabel(){
 if(flag('qiulan_revealed'))return '門外的人';
 if(flag('timeline_conflict'))return '六月十七';
 if(has('e03'))return '租冊上的五月';
 return '第三個雨夜';
}

function renderHeader(){return '<article class="c2-head card"><h2>'+esc(s.name)+'｜案件二・雨夜敲門</h2><div class="c2-meta">1958・臺北</div><span class="c2-kicker">'+esc(phaseLabel())+'</span></article>'}
function imageHtml(src,alt){return '<div class="c2-art-wrap"><img class="c2-art" src="'+esc(src)+'" alt="'+esc(alt)+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="c2-art-fallback">'+esc(alt)+'<br><small>正式圖片路徑已保留，等待素材同步。</small></div></div>'}

function renderInvestigation(){
 var l=DATA.locations[s.loc];
 var html=renderHeader();
 html+='<article class="c2-scene card">'+imageHtml(l.image,l.name)+'<div class="c2-body"><p class="c2-kicker">'+esc(l.sub)+'</p><h2>'+esc(l.name)+'</h2><p>'+esc(sceneIntro(s.loc))+'</p>';
 if(s.feedback)html+='<div class="c2-note">'+esc(s.feedback)+'</div>';
 if(s.loc==='home'&&flag('qiulan_revealed'))html+='<div class="c2-event"><strong>敲門者現身</strong><br>'+esc(DATA.events.qiulan_reveal.text)+'</div>';
 html+='<div class="c2-actions">';
 l.actions.forEach(function(id){var a=DATA.actions[id],ready=actionReady(a),done=actionDone(id);html+='<button class="c2-btn '+(done?'done':'')+'" data-action="'+esc(id)+'" '+(!ready||a.once&&done?'disabled':'')+'><strong>'+esc(actionLabel(id))+'</strong><small>'+esc(actionHint(id,a))+'</small></button>'});
 html+='</div></div></article>';
 html+=navHtml('scene');
 $('v2RainMain').innerHTML=html;
 bindCommon();
 Array.prototype.forEach.call(document.querySelectorAll('[data-action]'),function(b){b.onclick=function(){doAction(b.getAttribute('data-action'))}});
}

function sceneIntro(id){
 var t={
  home:'第三個雨夜。三下敲門聲停了一拍，又響了兩下。林秀雲拉開門時，走廊上已經沒有人，只有雨水沿欄杆滴落，門前留著幾枚濕腳印。',
  corridor:'二樓外廊被雨氣浸得發暗，欄杆外的街燈隔著雨幕發白。201在走廊深處，門旁幾盆花被風吹得輕輕晃動。',
  entrance:'一樓入口比樓上乾燥些。牆上的住戶板貼著一張張姓名紙卡，房東的小桌旁則堆著幾本用了多年的租冊。',
  yonghe:'永和行就在巷口。店裡混著肥皂、乾貨和木櫃的氣味，櫃檯後方疊著一冊冊賒帳簿，紙邊都被翻得發毛。',
  stairs:'你離開一樓時，雨勢忽然加重。樓梯間的窗沒有關緊，風把濕氣灌進來，木扶手摸上去一片冰涼。',
  spare:'這間房空了很久。灰塵覆在桌面和窗框上，抽屜拉開時帶出一股潮木味；幾樣被遺忘的小東西仍留在原處。',
  rooftop:'屋頂風很大，曬衣繩在雨裡啪啪作響。儲藏間的門鎖已經生鏽，裡頭堆著木箱、破竹籃和幾件多年沒人動過的雜物。'
 };return t[id]||'';
}
function actionLabel(id){var m={
 inspect_footprints:'檢查門外濕腳印',inspect_yue_mark:'查看門框刻痕',ask_lin:'詢問林秀雲',check_rain_path:'核對雨水流向',ask_chen:'詢問陳太太',inspect_board:'查看住戶一覽板',inspect_ledger:'翻查舊租冊',confront_landlord:'追問房東',ask_shopkeeper:'詢問永和行老闆',inspect_yonghe_ledger:'查看賒帳簿',staircase_event:'走近窗邊女子',inspect_sisters_photo:'查看姐妹合照',inspect_wende_note:'查看張文德紙條',find_rooftop_key:'翻找抽屜夾層',open_storage:'打開屋頂儲藏間',inspect_bag:'查看帆布提袋',inspect_bag_contents:'整理提袋內容',inspect_postcard:'查看未寄明信片',inspect_sealed_letter:'檢查密封信件'};return m[id]||id}
function actionHint(id,a){if(a.requires&&!hasAll(a.requires))return '需要先取得：'+a.requires.map(function(x){return DATA.evidence[x].name}).join('、');if(actionDone(id))return '已完成';return '調查'}

function navHtml(active){return '<div class="c2-tabs"><button data-view="scene" class="'+(active==='scene'?'active':'')+'">調查</button><button data-view="map" class="'+(active==='map'?'active':'')+'">地圖</button><button data-view="records" class="'+(active==='records'?'active':'')+'">紀錄 '+s.evidence.length+'/12</button></div>'}
function bindCommon(){Array.prototype.forEach.call(document.querySelectorAll('[data-view]'),function(b){b.onclick=function(){renderView(b.getAttribute('data-view'))}})}
function renderView(view){if(view==='map')return renderMap();if(view==='records')return renderRecords();renderInvestigation()}

function renderMap(){
 var html=renderHeader()+'<article class="card c2-body"><p class="c2-kicker">調查地圖</p><h2>前往地點</h2><div class="c2-map">';
 Object.keys(DATA.locations).forEach(function(id){var l=DATA.locations[id],u=locationUnlocked(id);html+='<button data-go="'+id+'" class="'+(s.loc===id?'current':'')+'" '+(!u?'disabled':'')+'><strong>'+esc(l.name)+'</strong><small>'+(u?esc(l.sub):'尚未解鎖')+'</small></button>'});
 html+='</div>';
 if(finalReady())html+='<button id="c2StartDeduction" class="primary" type="button">進入最終推理</button>';
 else if(flag('final_ready')&&!flag('qiulan_revealed'))html+='<div class="c2-note">帆布袋裡的東西已經看完。回201時，也許還有人會來敲門。</div>';
 html+='</article>'+navHtml('map');
 $('v2RainMain').innerHTML=html;bindCommon();
 Array.prototype.forEach.call(document.querySelectorAll('[data-go]'),function(b){b.onclick=function(){enterLocation(b.getAttribute('data-go'))}});
 var d=$('c2StartDeduction');if(d)d.onclick=function(){s.phase='deduction';s.deduction=0;s.feedback='';save();render()};
}

function evidenceImage(e){return '<img src="'+esc(e.image)+'" alt="'+esc(e.name)+'" loading="lazy" decoding="async" onerror="this.style.display=\'none\'">'}
function renderRecords(){
 var html=renderHeader()+'<article class="card c2-body"><p class="c2-kicker">案件紀錄</p><h2>手上的紀錄</h2>';
 if(!s.evidence.length)html+='<p class="note">目前尚未取得證物。</p>';
 s.evidence.forEach(function(id){var e=DATA.evidence[id];html+='<div class="c2-record"><strong>'+esc(id.toUpperCase()+'｜'+e.name)+'</strong><small>'+esc(e.type+'｜'+e.desc)+'</small>'+evidenceImage(e)+'</div>'});
 if(s.people.length){html+='<h2 style="margin-top:18px">人物紀錄</h2>';s.people.forEach(function(id){var p=DATA.people[id];if(p)html+='<div class="c2-record"><strong>'+esc(p.name)+'</strong><small>'+esc(p.desc)+'</small></div>'})}
 html+='</article>'+navHtml('records');$('v2RainMain').innerHTML=html;bindCommon();
}

function focusDots(){var h='<div class="c2-dots">';for(var i=0;i<MAX_FOCUS;i++)h+='<i class="'+(i<s.focus?'on':'')+'"></i>';return h+'</div>'}
function renderDeduction(){
 var d=DATA.deductions[s.deduction];if(!d){return finishCorrect()}
 var html=renderHeader()+'<article class="c2-deduction card"><p class="c2-kicker">最終推理 '+(s.deduction+1)+' / '+DATA.deductions.length+'</p><h2>'+esc(d.q)+'</h2>'+focusDots();
 if(s.feedback)html+='<div class="c2-note">'+esc(s.feedback)+'</div>';
 html+='<div class="c2-warning">每一步推論都會影響剩餘的推理專注。</div>';
 d.options.forEach(function(o){html+='<button class="c2-option" data-opt="'+esc(o.id)+'">'+esc(o.text)+'</button>'});html+='</article>';
 $('v2RainMain').innerHTML=html;
 Array.prototype.forEach.call(document.querySelectorAll('[data-opt]'),function(b){b.onclick=function(){answerDeduction(b.getAttribute('data-opt'))}});
}
function answerDeduction(id){
 var d=DATA.deductions[s.deduction];var ok=id===d.correct;s.answers.push({q:d.id,a:id,ok:ok});
 if(ok){s.feedback=d.explain;s.deduction++;save();render();return}
 s.focus--;
 if(s.focus<=0){s.ending=(id==='ghost')?'weak':'falseAccusation';s.finished=true;s.phase='done';save();render();return}
 s.feedback='這個說法和目前找到的線索對不上。'+d.explain;save();render();
}
function finishCorrect(){s.ending='correct';s.finished=true;s.phase='done';s.feedback='';save();render()}

function renderEnding(){
 var e=DATA.ending,kind=s.ending||'correct',title,text;
 if(kind==='weak'){title=e.weakTitle;text=e.weakText}
 else if(kind==='falseAccusation'){title=e.falseAccusationTitle;text=e.falseAccusationText}
 else{title=e.correctTitle;text=e.correctText}
 var html='<article class="c2-ending card paper"><p class="eyebrow" style="color:#715c34">CASE CLOSED・雨夜敲門</p><h2>'+esc(title)+'</h2><p>'+esc(text)+'</p>';
 if(kind==='correct')html+='<div class="c2-event"><strong>最後一次敲門</strong><br>'+esc(DATA.events.final_knock.text)+'</div><div class="c2-summary"><div><strong>留下來的紀錄</strong><br>許月琴曾住201；租冊上的1955年5月搬離日期與6月17日的賒帳紀錄衝突；1958年的敲門女子是前來尋找姐姐遺物的許秋蘭。</div><div><strong>仍然空著的位置</strong><br>許月琴最後去了哪裡、密封信裡寫了什麼、她是否知道信中內容，以及當年帶她離開的人究竟是誰。</div></div>';
 html+='<div class="c2-home-row"><button id="c2Home" class="primary" type="button">回到標題</button><button id="c2Again" class="secondary" type="button">重新調查</button></div></article>';
 $('v2RainMain').innerHTML=html;
 $('c2Home').onclick=function(){location.reload()};$('c2Again').onclick=function(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}s=fresh();save();render()};
}

function render(){showRoot();if(s.finished||s.phase==='done')return renderEnding();if(s.phase==='deduction')return renderDeduction();renderInvestigation()}
function start(){s=load()||fresh();save();render()}
function restart(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}s=fresh();save();render()}
function hasSave(){var v=load();return !!v}

mount();
window.Case2RainCanon={start:start,restart:restart,hasSave:hasSave,saveKey:SAVE_KEY,caseId:DATA.id};
})();