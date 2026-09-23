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
#v2Rain{padding-bottom:96px}.c2-head{padding:14px 15px;margin-bottom:12px}.c2-head h2{margin:0 0 5px;font-size:1rem}.c2-meta{font-size:.72rem;color:#9b988b;line-height:1.55}.c2-scene{overflow:hidden;padding:0}.c2-art-wrap{position:relative;background:#111}.c2-art{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;filter:saturate(.82) contrast(1.04)}.c2-art-fallback{display:none;aspect-ratio:3/2;align-items:center;justify-content:center;padding:20px;background:linear-gradient(135deg,#29261f,#151612);color:#aaa392;text-align:center}.c2-body{padding:17px}.c2-body h2{margin:4px 0 10px}.c2-body p{line-height:1.8}.c2-scene-intro{line-height:1.95}.c2-scene-intro p{margin:0 0 .95em}.c2-scene-intro p:last-child{margin-bottom:0}.c2-actions{display:grid;gap:9px;margin-top:12px}.c2-btn,.c2-map button,.c2-option{border:1px solid #3d4036;background:#1b1d18;color:#ece8dc;border-radius:13px;padding:12px;text-align:left}.c2-btn strong,.c2-map strong{display:block}.c2-btn small,.c2-map small{display:block;color:#969386;margin-top:4px;line-height:1.48}.c2-btn.done{opacity:.58}.c2-btn:disabled{opacity:.35}.c2-note{margin-top:12px;padding:11px 12px;border-left:3px solid #8d7853;background:#211e18;line-height:1.68;color:#c8c1b1}.c2-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:13px 0}.c2-tabs button{border:1px solid #3c3e35;background:#181a16;color:#aaa69a;border-radius:11px;padding:9px}.c2-tabs button.active{background:#302d21;color:#eee4ce;border-color:#8f7a4d}.c2-map{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.c2-map button.current{border-color:#9b8754;background:#292719}.c2-map button:disabled{opacity:.32}.c2-record{margin-top:9px;padding:11px;border:1px solid #35382f;border-radius:11px;background:#171914}.c2-record strong{display:block}.c2-record small{display:block;margin-top:4px;color:#9c998d;line-height:1.58}.c2-record img{width:100%;margin-top:9px;border-radius:9px;display:block;max-height:280px;object-fit:cover}.c2-deduction,.c2-ending{padding:18px}.c2-deduction h2,.c2-ending h2{line-height:1.45}.c2-option{display:block;width:100%;margin-top:9px;line-height:1.58}.c2-dots{display:flex;gap:5px;margin:8px 0 12px}.c2-dots i{width:10px;height:10px;border-radius:50%;background:#44473e}.c2-dots i.on{background:#c7b16f}.c2-warning{font-size:.78rem;color:#c99789;margin-top:10px}.c2-story{margin-top:14px;padding:16px 16px 15px;border-left:3px solid #8d7853;background:rgba(182,155,95,.08);border-radius:0 12px 12px 0;line-height:1.9}.c2-story-title{margin-bottom:10px;font-size:.75rem;font-weight:700;letter-spacing:.08em;color:#cdbb8d}.c2-story p{margin:0 0 .9em}.c2-story p:last-child{margin-bottom:0}.c2-dialogue{font-weight:650;color:#f1e4bf}.c2-ending-lead{font-size:1rem;line-height:1.9}.c2-ending-lead p{margin:.7em 0}.c2-opening{padding:22px 20px}.c2-opening h2{margin:5px 0 16px;font-size:1.65rem}.c2-opening-text{font-size:1.02rem;line-height:2}.c2-opening-text p{margin:0 0 1.15em}.c2-opening-text p:last-child{margin-bottom:0}.c2-opening .primary{margin-top:20px}.paper .c2-story{background:rgba(86,66,31,.07);border-left-color:#8f7745;color:#332d21}.paper .c2-story-title{color:#715c34}.paper .c2-dialogue{color:#3a2d16}.c2-summary{display:grid;gap:9px;margin:14px 0}.c2-summary div{padding:11px;border:1px solid rgba(65,54,32,.22);border-radius:10px;line-height:1.62}.c2-kicker{font-size:.68rem;letter-spacing:.12em;color:#9a917c}.c2-home-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}@media(min-width:640px){.c2-actions{grid-template-columns:1fr 1fr}.c2-map{grid-template-columns:repeat(3,1fr)}}';
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
function actionReady(a){return (!a.requires||hasAll(a.requires))&&(!a.requiresFlags||flagsAll(a.requiresFlags))}
function finalReady(){return flag('qiulan_revealed')&&flag('last_seen_account')&&flag('landlord_admitted_edit')&&hasAll(['e03','e05','e06','e07','e09','e11','e12'])}

function maybeQiulanReveal(){
 if(flag('qiulan_revealed'))return false;
 var ev=DATA.events.qiulan_reveal;
 if(!flag('final_ready')||!hasAll(ev.trigger.all))return false;
 setFlags(ev.set);know(ev.know);s.feedback=ev.text;notify('人物確認：許秋蘭');return true;
}

function revisitText(id){
 var t={
  home:'你重新回到201。林秀雲仍留在客廳，門外的雨聲沒有斷過。先前看過的門框與腳印都還在，現在可以把新取得的線索重新和這間房對在一起。',
  corridor:'你再次走上二樓外廊。雨仍沿著欄杆與牆面往下滑，201門前沒有新的動靜；先前查過的痕跡都還留在原處。',
  entrance:'你又回到一樓入口。住戶板與舊租冊仍擺在房東桌旁，沒有多出新的紙卡或更動。',
  yonghe:'你折回永和行。櫃檯後的賒帳簿仍在原位，店裡照常做生意；先前問到的那筆日期沒有改變。',
  stairs:flag('staircase_event_seen')?'你再走到樓梯轉角。半層平台空著，窗玻璃上只有雨水與街燈的反光。沒有任何人的蹤跡；先前那幾點新鮮水跡也已被濕氣與往來腳步抹淡。樓上樓下只剩雨聲。':'你再次走進樓梯間。窗沒有關緊，雨氣仍從縫裡灌進來，除此之外沒有新的異常。',
  spare:'你用黃先生交給你的空房鑰匙重新推開門。灰塵、舊家具和抽屜都還維持先前的樣子；已經翻過的地方沒有突然多出新的東西。',
  rooftop:'你再次上到屋頂。風和雨仍打在曬衣架與儲藏間外牆上，先前打開的地方都維持原狀。'
 };
 return t[id]||('你再次回到'+(DATA.locations[id]?DATA.locations[id].name:'這裡')+'，先前查過的地方沒有新的變化。');
}
function enterLocation(id){
 if(!locationUnlocked(id)||id===s.loc)return;
 var from=s.loc,firstVisit=!s.visited[id];
 s.flags.lastAction='';
 s.feedback=firstVisit?'':revisitText(id);
 if(id==='home'&&from!=='home')s.flags.returned_home=true;
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
 s.flags.lastAction=id;
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
function imageHtml(src,alt){return '<div class="c2-art-wrap"><img class="c2-art" src="'+esc(src)+'" alt="'+esc(alt)+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="c2-art-fallback">'+esc(alt)+'<br><small>圖片載入失敗，請重新整理頁面後再試。</small></div></div>'}
function narrativeHtml(text){
 var marked=String(text||'').replace(/。(?!」)/g,'。\n\n');
 return marked.split(/\n\n+/).filter(function(p){return p.trim()}).map(function(p){
  var h=esc(p.trim()).replace(/「([^」]+)」/g,'<span class="c2-dialogue">「$1」</span>');
  return '<p>'+h+'</p>';
 }).join('');
}
function sceneIntroHtml(text){
 return String(text||'').split(/\n\n+/).filter(function(p){return p.trim()}).map(function(p){
  return '<p>'+esc(p.trim())+'</p>';
 }).join('');
}
function shouldShowOpening(){
 return !!(DATA.opening&&!flag('opening_seen')&&s.phase==='investigate'&&s.loc==='home'&&!s.evidence.length&&Object.keys(s.done||{}).length===0);
}
function renderOpening(){
 var o=DATA.opening||{};
 var html='<article class="c2-opening card"><p class="c2-kicker">'+esc(o.kicker||'案件二・雨夜敲門')+'</p><h2>'+esc(o.title||'第三個雨夜')+'</h2><div class="c2-opening-text">'+sceneIntroHtml(o.text||'')+'</div><button id="c2OpeningNext" class="primary" type="button">開始調查</button></article>';
 $('v2RainMain').innerHTML=html;
 var next=$('c2OpeningNext');
 if(next)next.onclick=function(){s.flags.opening_seen=true;save();render()};
}

function activeEventAction(){
 var id=s.flags.lastAction;
 if(id&&DATA.actions[id]&&Object.prototype.hasOwnProperty.call(DATA.actions[id],'eventImage'))return id;
 if(s.loc==='stairs'&&actionDone('staircase_event')&&s.feedback===DATA.actions.staircase_event.text)return'staircase_event';
 return'';
}
function currentSceneImage(){
 var id=activeEventAction(),a=id&&DATA.actions[id];
 if(a)return a.eventImage||'';
 return DATA.locations[s.loc].image||'';
}
function currentSceneAlt(){
 var id=activeEventAction();
 return id?actionLabel(id):DATA.locations[s.loc].name;
}
function currentLocationSub(){
 if(s.loc==='stairs'&&actionDone('staircase_event')&&activeEventAction()!=='staircase_event')return'回訪・雨夜樓梯間';
 return DATA.locations[s.loc].sub;
}
function currentSceneHtml(){
 var showingQiulanEvent=s.loc==='home'&&flag('qiulan_revealed')&&s.feedback===DATA.events.qiulan_reveal.text;
 if(showingQiulanEvent)return '<div class="c2-story-title">敲門者現身</div>'+narrativeHtml(DATA.events.qiulan_reveal.text);
 if(s.feedback)return narrativeHtml(s.feedback);
 return sceneIntroHtml(sceneIntro(s.loc));
}
function renderInvestigation(){
 var l=DATA.locations[s.loc],src=currentSceneImage();
 var html=renderHeader();
 html+='<article class="c2-scene card">'+(src?imageHtml(src,currentSceneAlt()):'')+'<div class="c2-body"><p class="c2-kicker">'+esc(currentLocationSub())+'</p><h2>'+esc(l.name)+'</h2><div class="c2-scene-intro">'+currentSceneHtml()+'</div>';
 html+='<div class="c2-actions">';
 l.actions.forEach(function(id){var a=DATA.actions[id],ready=actionReady(a),done=actionDone(id);if(a.once&&done)return;html+='<button class="c2-btn '+(done?'done':'')+'" data-action="'+esc(id)+'" '+(!ready?'disabled':'')+'><strong>'+esc(actionLabel(id))+'</strong><small>'+esc(actionHint(id,a))+'</small></button>'});
 html+='</div></div></article>';
 html+=navHtml('scene');
 $('v2RainMain').innerHTML=html;
 bindCommon();
 Array.prototype.forEach.call(document.querySelectorAll('[data-action]'),function(b){b.onclick=function(){doAction(b.getAttribute('data-action'))}});
}

function sceneIntro(id){
 if(id==='home'&&flag('qiulan_revealed'))return '你帶著從屋頂找到的帆布袋回到201。林秀雲替你把門拉開，目光先落在袋面的姓名標籤上。\n\n外頭的雨還沒有停。這一次，屋裡已經不再只是第一次檢查過的門框與腳印；你手上多了許月琴留下的東西，也終於等到了那個反覆敲門的人。';
 if(id==='home'&&flag('returned_home'))return '你重新回到201。林秀雲仍留在客廳，門外的雨聲沒有斷過。\n\n先前檢查過的門框與腳印都還在，但現在你帶回了新的紀錄，可以把外面的線索和201重新對在一起。';
 var t={
  home:'門重新關上後，林秀雲沒有立刻回到桌邊。她仍站在玄關旁，不時往門縫的方向看。\n\n客廳裡很安靜，只有雨聲從窗外壓進來。門檻外那幾枚水光未乾的腳印還在，門框、地面和她的說法，都是現在能先核對的東西。',
  corridor:'你從201走出來，沿二樓外廊慢慢往前。雨氣貼在牆面上，欄杆外的街燈被雨幕磨成一團發白的光。\n\n這一層的房門大多關著，只有幾盆靠牆的花被風吹得輕輕碰著花架。回頭看，201就在走廊深處；要分清門前的痕跡是不是單純被雨帶進來，得把整條外廊一起看。',
  entrance:'你順著樓梯走到一樓，雨聲被牆面隔掉一層，空氣也比樓上乾一些。入口旁的住戶板貼著一張張姓名紙卡，像是把整棟樓此刻的住戶固定在牆上。\n\n房東的小桌就在旁邊，桌角壓著幾本用了多年的租冊。新紙卡和舊冊子放在同一處，正好把「現在住誰」和「以前住誰」分成兩種紀錄。',
  yonghe:'永和行就在巷口，門外的雨聲一進店裡就被木櫃和貨架吸掉大半。肥皂、乾貨與舊木頭的氣味混在一起，櫃檯後方則一冊冊疊著賒帳簿。\n\n這裡的記憶不像住戶口中的年份那麼模糊。買過什麼、欠了多少、哪一天記上一筆，只要帳還在，就有機會重新對出時間。',
  stairs:'你離開一樓時，雨勢忽然加重。樓梯間的窗沒有關緊，風一陣陣把濕氣灌進來，牆角的光也跟著忽明忽暗。\n\n木扶手摸上去一片冰涼。樓上沒有說話聲，只有雨點敲窗和你的腳步在轉角間來回反響。',
  spare:'你用黃先生交給你的空房鑰匙開門。門推開時比想像中更沉，窗框和桌面都覆著一層完整的灰，連光照進來都顯得發白。\n\n黃先生說這裡以前租給張文德，三年前搬走後便一直空著。屋裡沒有明顯被翻找過的痕跡，幾件留下來的舊家具仍在原位。',
  rooftop:'你帶著那把舊鑰匙走上屋頂。風比樓下強得多，曬衣繩被吹得一下下抽在鐵架上，遠處的屋瓦和街燈都浸在雨霧裡。\n\n儲藏間縮在屋頂一角，門鎖已經生鏽。從門縫只能聞到潮木和灰塵的氣味，看不清裡頭放了什麼；真正藏在樓上的東西，還隔著這一道門。'
 };return t[id]||'';
}
function actionLabel(id){var m={
 inspect_footprints:'檢查門外濕腳印',inspect_yue_mark:'查看門框刻痕',ask_lin:'詢問林秀雲',check_rain_path:'核對雨水流向',ask_chen:'詢問陳太太',inspect_board:'查看住戶一覽板',inspect_ledger:'翻查舊租冊',confront_landlord:'追問房東',ask_shopkeeper:'詢問永和行老闆',inspect_yonghe_ledger:'查看賒帳簿',ask_chen_last_seen:'追問最後一次見到月琴',press_landlord_date:'拿六月賒帳再問房東',ask_landlord_upstairs:'詢問樓上的空房',staircase_event:'查看半層平台',inspect_sisters_photo:'查看姐妹合照',inspect_wende_note:'查看張文德紙條',find_rooftop_key:'翻找抽屜夾層',open_storage:'打開屋頂儲藏間',inspect_bag_contents:'整理提袋內容',inspect_postcard:'查看未寄明信片',inspect_sealed_letter:'檢查密封信件'};return m[id]||id}
function actionHint(id,a){
 if(a.requires&&!hasAll(a.requires))return '需要先取得：'+a.requires.map(function(x){return DATA.evidence[x].name}).join('、');
 if(a.requiresFlags&&!flagsAll(a.requiresFlags))return '需要先追到前一段線索';
 if(actionDone(id))return '已完成';
 var m={
  inspect_footprints:'先確認腳印停在哪裡',
  inspect_yue_mark:'看看刻痕是新是舊',
  ask_lin:'把前三晚的敲門情形問清楚',
  check_rain_path:'比較腳印與屋簷雨水方向',
  ask_chen:'問問201以前住過誰',
  inspect_board:'先確認現在的住戶',
  inspect_ledger:'沿著201的舊紀錄往前查',
  confront_landlord:'拿租冊上的異常追問日期',
  ask_shopkeeper:'問問他是否還記得許月琴',
  inspect_yonghe_ledger:'用帳簿把記憶釘在日期上',
  ask_chen_last_seen:'把六月之後的記憶再往後追',
  press_landlord_date:'用六月十七日逼近那筆後補日期',
  ask_landlord_upstairs:'先弄清那扇空房門以前住過誰',
  staircase_event:'確認樓梯轉角是否有異常',
  inspect_sisters_photo:'辨認照片裡的兩個名字',
  inspect_wende_note:'讀清紙條留下的指向',
  find_rooftop_key:'看看抽屜深處還藏著什麼',
  open_storage:'用找到的鑰匙打開生鏽門鎖',
  inspect_bag_contents:'逐件確認袋裡留下的東西',
  inspect_postcard:'讀那張沒有寄出的字',
  inspect_sealed_letter:'先從未拆封的信封本身判斷'
 };
 return m[id]||'調查';
}

function navHtml(active){return '<div class="c2-tabs"><button data-view="scene" class="'+(active==='scene'?'active':'')+'">調查</button><button data-view="map" class="'+(active==='map'?'active':'')+'">地圖</button><button data-view="records" class="'+(active==='records'?'active':'')+'">紀錄 '+s.evidence.length+'/12</button></div>'}
function bindCommon(){Array.prototype.forEach.call(document.querySelectorAll('[data-view]'),function(b){b.onclick=function(){renderView(b.getAttribute('data-view'))}})}
function renderView(view){if(view==='map')return renderMap();if(view==='records')return renderRecords();renderInvestigation()}

function renderMap(){
 var html=renderHeader()+'<article class="card c2-body"><p class="c2-kicker">調查地圖</p><h2>前往地點</h2><div class="c2-map">';
 Object.keys(DATA.locations).forEach(function(id){var l=DATA.locations[id],u=locationUnlocked(id),current=s.loc===id,sub=(id==='stairs'&&actionDone('staircase_event'))?'雨夜樓梯間':l.sub;html+='<button data-go="'+id+'" class="'+(current?'current':'')+'" '+(!u||current?'disabled':'')+'><strong>'+esc(l.name)+'</strong><small>'+(current?'目前位置':u?esc(sub):'尚未解鎖')+'</small></button>'});
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
 var html=renderHeader()+'<article class="c2-deduction card"><p class="c2-kicker">'+esc(d.stage||'最終推理')+'｜'+(s.deduction+1)+' / '+DATA.deductions.length+'</p><h2>'+esc(d.q)+'</h2>'+focusDots();
 if(s.feedback)html+='<div class="c2-note">'+esc(s.feedback)+'</div>';
 html+='<div class="c2-warning">每一步推論都會影響剩餘的推理專注。</div>';
 d.options.forEach(function(o){html+='<button class="c2-option" data-opt="'+esc(o.id)+'">'+esc(o.text)+'</button>'});html+='</article>';
 $('v2RainMain').innerHTML=html;
 Array.prototype.forEach.call(document.querySelectorAll('[data-opt]'),function(b){b.onclick=function(){answerDeduction(b.getAttribute('data-opt'))}});
}
function answerFailureType(answer){
 if(!answer||answer.ok)return'';
 if(answer.failureType)return answer.failureType;
 for(var i=0;i<DATA.deductions.length;i++){var d=DATA.deductions[i];if(d.id!==answer.q)continue;for(var j=0;j<d.options.length;j++){var o=d.options[j];if(o.id===answer.a)return o.failureType||'overreach'}}
 return'overreach';
}
function dominantFailureEnding(lastType){
 var counts={weak:0,falseAccusation:0,overreach:0};
 (s.answers||[]).forEach(function(a){var t=answerFailureType(a);if(counts[t]!==undefined)counts[t]++});
 var max=Math.max(counts.weak,counts.falseAccusation,counts.overreach),leaders=Object.keys(counts).filter(function(k){return counts[k]===max});
 return leaders.indexOf(lastType)>=0?lastType:leaders[0]||lastType||'overreach';
}
function answerDeduction(id){
 var d=DATA.deductions[s.deduction],opt=null;for(var i=0;i<d.options.length;i++){if(d.options[i].id===id){opt=d.options[i];break}}
 var ok=id===d.correct,failType=ok?'':((opt&&opt.failureType)||'overreach');s.answers.push({q:d.id,a:id,ok:ok,failureType:failType});
 if(ok){s.feedback='上一題成立｜'+d.explain;s.deduction++;save();render();return}
 s.focus--;
 if(s.focus<=0){s.ending=dominantFailureEnding(failType);s.finished=true;s.phase='done';save();render();return}
 s.feedback='這個說法還跨過了一步證據。提示：'+(d.hint||'重新檢查直接證據與推測之間的界線。');save();render();
}
function finishCorrect(){s.ending='correct';s.finished=true;s.phase='done';s.feedback='';save();render()}

function renderEnding(){
 var e=DATA.ending,kind=s.ending||'correct',title,text;
 if(kind==='weak'){title=e.weakTitle;text=e.weakText}
 else if(kind==='falseAccusation'){title=e.falseAccusationTitle;text=e.falseAccusationText}
 else if(kind==='overreach'){title=e.overreachTitle;text=e.overreachText}
 else{title=e.correctTitle;text=e.correctText}
 var html='<article class="c2-ending card paper"><p class="eyebrow" style="color:#715c34">CASE CLOSED・雨夜敲門</p><h2>'+esc(title)+'</h2><div class="c2-ending-lead">'+narrativeHtml(text)+'</div>';
 if(kind==='correct')html+='<div class="c2-story"><div class="c2-story-title">最後一次敲門</div>'+narrativeHtml(DATA.events.final_knock.text)+'</div><div class="c2-summary"><div><strong>留下來的紀錄</strong><br>許月琴曾住201；房東承認「1955年5月搬離」是事後補寫；6月17日她仍在附近留下賒帳；陳太太最後一次看見她時，她正和兩名陌生男子一起離開；1958年的敲門者則是前來尋找姐姐遺物的許秋蘭。</div><div><strong>仍然空著的位置</strong><br>許月琴最後去了哪裡、兩名陌生男子是誰、她是否自願離開、密封信裡寫了什麼、她是否知道信中內容，以及把匿名紙條寄給秋蘭的人究竟是誰。</div></div>';
 html+='<div class="c2-home-row"><button id="c2Home" class="primary" type="button">回到標題</button><button id="c2Again" class="secondary" type="button">重新調查</button></div></article>';
 $('v2RainMain').innerHTML=html;
 $('c2Home').onclick=function(){location.reload()};$('c2Again').onclick=function(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}s=fresh();save();render()};
}

function render(){showRoot();if(s.finished||s.phase==='done')return renderEnding();if(s.phase==='deduction')return renderDeduction();if(shouldShowOpening())return renderOpening();renderInvestigation()}
function start(){s=load()||fresh();save();render()}
function restart(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}s=fresh();save();render()}
function hasSave(){var v=load();return !!v}

mount();
window.Case2RainCanon={start:start,restart:restart,hasSave:hasSave,saveKey:SAVE_KEY,caseId:DATA.id};
})();