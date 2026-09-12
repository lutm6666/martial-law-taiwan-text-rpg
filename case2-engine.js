(function(){
'use strict';

var CASE1_KEY='mist-taiwan-case-save-v4';
var CASE2_KEY='mist-taiwan-case2-save-v1';
var MAX_FOCUS=3;
var s=null;
var activeTab='testimony';
var selectedStatement=null;
var pendingStatement=null;

var roles={student:'學生',worker:'工人',clerk:'公務員',reporter:'記者',teacher:'教師',merchant:'商人',veteran:'退伍軍人',homemaker:'持家者'};

var evidence={
 margin_note:{name:'頁邊鉛筆註記',type:'第一案帶入',desc:'失落筆記第 21 頁留下：「秋月：不要真名。」這能證明匿名要求存在，卻不能單獨說明她同意資料被如何使用。'},
 recovered_pages:{name:'找回的三頁筆記',type:'第一案帶入',desc:'第 17、21、22 頁已找回。內容屬於工廠生活訪談，但原頁沒有寫著「可以公開」或「可以轉交」。'},
 question_card:{name:'阿川的提問卡',type:'文字證物',desc:'阿川留下的索引卡寫著：「這段可以留在你整理的訪談冊裡嗎？」問的是保留在訪談冊，而不是公開發表。'},
 meihui_scrap:{name:'美惠的隨手記',type:'同期筆記',desc:'美惠當天記下：「秋月：可留／真名 ×／住處—未問／給人看—未問。」能區分當天原話與她後來補上的擔心。'},
 no_proxy:{name:'美惠的轉達界線',type:'證詞',desc:'阿川曾問美惠能不能讓其他人閱讀；美惠當時明確回答，她不能替秋月答應。'},
 direct_scope:{name:'秋月的直接說法',type:'本人證詞',desc:'秋月確認：她答應的是保留那段經歷，讓阿川繼續整理；她當時沒有答應對外公開。'},
 indirect_id:{name:'間接辨識風險',type:'本人證詞',desc:'秋月指出，即使不用真名，班別、住處、年齡與家庭資訊放在一起，也可能讓熟人猜出她是誰。'},
 reuse_boundary:{name:'再次使用的條件',type:'本人證詞',desc:'秋月希望若資料要交給原本以外的人閱讀、抄寫或公開，應先再次詢問她。'},
 role_student:{name:'語句層級辨析',type:'身分情報・學生',desc:'「留下」「整理」「給別人看」「公開」是不同動作；一句同意不能自動跨到另一個動作。'},
 role_worker:{name:'夜班辨識風險',type:'身分情報・工人',desc:'在熟人多的工廠裡，只寫夜班、年資與工作位置，有時就足以讓同事猜出受訪者。'},
 role_clerk:{name:'授權範圍缺口',type:'身分情報・公務員',desc:'現有筆記能找到「可以留下」與「不要真名」，卻沒有任何一筆寫明可以公開或轉交。'},
 role_reporter:{name:'來源使用界線',type:'身分情報・記者',desc:'願意接受訪談、願意讓採訪者保存內容、願意讓第三人閱讀，三者不能直接視為同一件事。'},
 role_teacher:{name:'提問語境',type:'身分情報・教師',desc:'回答的範圍取決於當時被問了什麼；若問題只談「留下」，就不能事後把回答擴張成「公開」。'},
 role_merchant:{name:'流通範圍改變',type:'身分情報・商人',desc:'一份手稿被抄寫、轉交或展示後，接觸它的人已經和最初不同；用途沒有變，流通範圍也可能已經變了。'},
 role_veteran:{name:'風險與事實分離',type:'身分情報・退伍軍人',desc:'擔心被辨識是合理顧慮，但不能因此反推一定有人正在追查她；要把已發生的事與可能風險分開。'},
 role_homemaker:{name:'熟人網絡辨識',type:'身分情報・持家者',desc:'街坊與家人往往不需要真名；住處、班別、家庭情況的組合就可能讓人認出某個人。'}
};

var people={
 achuan:{name:'阿川',desc:'第一案的委託人。他想把訪談整理完整，但現在必須釐清「可以留下」究竟允許到哪裡。'},
 qiuyue:{name:'秋月',desc:'頁邊註記中的受訪者。你已知道她要求不要使用真名，但一開始還不知道她對閱讀與公開的界線。'},
 meihui:{name:'美惠',desc:'秋月的同事，也是當天在場的人之一。她願意回想，但她自己的擔心可能混進記憶。'}
};

var witnesses=[
 {
  id:'achuan',name:'阿川',place:'茶行後間',intro:'兩天後，阿川沒有把三頁重新裝訂。他把紙平放在桌上，先問你：那句「不要真名」，到底代表他還能做什麼？',required:'a2',next:'meihui',nextLabel:'前往工廠外找美惠',
  statements:[
   {id:'a1',text:'「秋月答應我把那段訪談留下來。」',press:'你請他把「答應」前面的問題完整重說一次。阿川翻了很久，從冊子夾層找到一張索引卡。',gain:'question_card'},
   {id:'a2',text:'「她只說不要真名，所以內容照原樣整理，應該就沒問題。」',press:'你問：「這是秋月說的，還是你根據『不要真名』推下去的？」阿川停了一下，承認後半句是自己的理解。',correct:'question_card',success:'你把提問卡放到桌上。原問題只問「能不能留在訪談冊」，沒有問公開、轉交或讓第三人閱讀。阿川把剛才那句話改掉：他能確定的是「可以留下」，不能把範圍自行擴大。'},
   {id:'a3',text:'「至於給誰看，我那時沒有特別問。」',press:'阿川想起當時還有一名同事在旁邊，叫美惠。後來他曾私下問過她能不能讓別人看，但美惠沒有替秋月回答。',person:'meihui'}
  ]
 },
 {
  id:'meihui',name:'美惠',place:'工廠外的騎樓',intro:'換班前，美惠只肯在工廠外說幾分鐘。她先確認你不會記她的全名，才開始回想那天的對話。',required:'m1',next:'qiuyue',nextLabel:'請美惠轉達，與秋月見面',
  statements:[
   {id:'m1',text:'「我記得秋月還說過：住哪裡也不要寫。」',press:'你請她分清楚「當天原話」和「後來想到的擔心」。美惠皺眉想了很久，承認自己隔了幾週才重新回想這件事。',correct:'meihui_scrap',success:'你把她當天的隨手記攤開。上面清楚寫著「住處—未問」。美惠看了一會兒，改口說：住處不能寫，是她後來替秋月擔心時補上的，不是當天聽到的原話。這是記憶混合，不是故意說謊。'},
   {id:'m2',text:'「我那天有隨手記幾個字，應該還留著。」',press:'美惠從舊便當袋的夾層摸出一張折得很小的紙。紙上的字很少，但時間比現在的記憶更接近當天。',gain:'meihui_scrap'},
   {id:'m3',text:'「阿川後來問我能不能讓其他人看；我只說，我不能替秋月答應。」',press:'這句話她記得很清楚，因為她當時就是怕自己替別人作主。她願意幫你轉達，問秋月是否願意親自把界線說清楚。',gain:'no_proxy',contact:true}
  ]
 },
 {
  id:'qiuyue',name:'秋月',place:'離工廠兩條街的麵攤',intro:'秋月沒有帶任何紙。她只說，如果你們真的想把訪談留下，就先把「當時答應了什麼」說準。',required:'q1',next:null,nextLabel:'整理案件結論',
  statements:[
   {id:'q1',text:'「我答應的是：那段經歷可以留下來，讓阿川整理。」',press:'你把問題縮回當天的語境。秋月說，她記得阿川問的是能不能留在那本訪談冊裡。',gain:'direct_scope',correct:'question_card',success:'提問卡與秋月現在的說法彼此吻合：原始同意的範圍是「保留、整理」，不是自動包含公開。這裡沒有矛盾；證物是在確認界線。'},
   {id:'q2',text:'「不用真名還不一定夠。夜班、住處、家裡的事放在一起，熟的人還是可能猜到我。」',press:'她沒有說一定有人會因此找麻煩。她只希望你們別把「改一個名字」當成已經完全匿名。',gain:'indirect_id'},
   {id:'q3',text:'「如果以後要給原本以外的人看，先再來問我一次。」',press:'她把「留下」與「再使用」分開。這不是要你們銷毀訪談，而是要求新的用途不要沿用舊的同意。',gain:'reuse_boundary'}
  ]
 }
];

var finalQuestions=[
 {prompt:'秋月當時可以確認的同意範圍是什麼？',correct:'preserve',options:[
  {id:'publish',text:'只要不用真名，就可以對外公開整份訪談。'},
  {id:'preserve',text:'可以把這段經歷留在阿川原本的訪談整理中。'},
  {id:'freeuse',text:'既然接受過訪談，以後任何形式都能繼續使用。'}]},
 {prompt:'如果要保護秋月的身分，最合理的做法是？',correct:'anonymize',options:[
  {id:'nameonly',text:'只把「秋月」換成另一個假名，其他細節全部保留。'},
  {id:'erase',text:'把整段訪談銷毀，這樣才不會有任何風險。'},
  {id:'anonymize',text:'保留經歷，但移除真名與可能讓熟人重新辨識的組合資訊。'}]},
 {prompt:'如果阿川之後想把訪談交給原本以外的人閱讀或公開，應該怎麼做？',correct:'renew',options:[
  {id:'renew',text:'再次詢問秋月，並把新的閱讀或公開範圍記清楚。'},
  {id:'friend',text:'只要美惠認為沒問題，就可以代替秋月答應。'},
  {id:'silent',text:'不特別說明用途，只要內容沒有改動就可以。'}]}
];

function $(id){return document.getElementById(id)}
function roleClue(role){return 'role_'+(roles[role]?role:'student')}
function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function case1Profile(){var p=parse(CASE1_KEY)||{};return{name:typeof p.name==='string'&&p.name.trim()?p.name.trim():'無名調查者',role:roles[p.role]?p.role:'student'}}
function save(){try{localStorage.setItem(CASE2_KEY,JSON.stringify(s))}catch(e){}}
function normalizeSave(v){if(!v||v.caseId!=='case2')return null;var p=case1Profile();v.version=1;v.name=typeof v.name==='string'&&v.name.trim()?v.name.trim():p.name;v.role=roles[v.role]?v.role:p.role;v.focus=typeof v.focus==='number'&&isFinite(v.focus)?Math.max(0,Math.min(MAX_FOCUS,Math.floor(v.focus))):MAX_FOCUS;v.witnessIndex=typeof v.witnessIndex==='number'&&isFinite(v.witnessIndex)?Math.max(0,Math.min(witnesses.length-1,Math.floor(v.witnessIndex))):0;v.pressed=v.pressed&&typeof v.pressed==='object'&&!Array.isArray(v.pressed)?v.pressed:{};v.solved=v.solved&&typeof v.solved==='object'&&!Array.isArray(v.solved)?v.solved:{};v.evidence=Array.isArray(v.evidence)?v.evidence.filter(function(id){return !!evidence[id]}):[];['margin_note','recovered_pages',roleClue(v.role)].forEach(function(id){if(v.evidence.indexOf(id)===-1)v.evidence.push(id)});v.people=Array.isArray(v.people)?v.people.filter(function(id){return !!people[id]}):[];['achuan','qiuyue'].forEach(function(id){if(v.people.indexOf(id)===-1)v.people.push(id)});v.flags=v.flags&&typeof v.flags==='object'&&!Array.isArray(v.flags)?v.flags:{};v.finalStep=typeof v.finalStep==='number'&&isFinite(v.finalStep)?Math.max(0,Math.min(finalQuestions.length,Math.floor(v.finalStep))):0;v.finished=!!v.finished;v.failed=v.finished?false:(!!v.failed||v.focus<=0);v.feedback=typeof v.feedback==='string'?v.feedback:'';v.history=Array.isArray(v.history)?v.history:[];return v}
function load(){return normalizeSave(parse(CASE2_KEY))}
function fresh(){var p=case1Profile(),r=roleClue(p.role);return{caseId:'case2',version:1,name:p.name,role:p.role,focus:MAX_FOCUS,witnessIndex:0,pressed:{},solved:{},evidence:['margin_note','recovered_pages',r],people:['achuan','qiuyue'],flags:{},finalStep:0,finished:false,failed:false,feedback:'',history:[]}}
function has(id){return s.evidence.indexOf(id)!==-1}
function gain(id){if(id&&evidence[id]&&!has(id)){s.evidence.push(id);notify('新增紀錄：'+evidence[id].name)}}
function know(id){if(id&&people[id]&&s.people.indexOf(id)===-1)s.people.push(id)}
function notify(msg){var t=$('toast');if(!t)return;t.textContent=msg;t.className='toast show';clearTimeout(window.__case2Toast);window.__case2Toast=setTimeout(function(){t.className='toast'},1800)}
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function allPressed(w){for(var i=0;i<w.statements.length;i++)if(!s.pressed[w.statements[i].id])return false;return true}
function witnessReady(w){return allPressed(w)&&!!s.solved[w.required]}
function currentWitness(){return witnesses[Math.max(0,Math.min(witnesses.length-1,s.witnessIndex))]}

function injectStyle(){if($('case2Style'))return;var st=document.createElement('style');st.id='case2Style';st.textContent='\
#case2Screen{padding-bottom:84px}.c2-banner{border:1px solid #4d4938;background:#211f16;border-radius:13px;padding:11px 13px;margin-bottom:12px;color:#c8bc96;font-size:.79rem;line-height:1.55}.c2-status{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:14px 15px;margin-bottom:12px}.c2-status h2{font-size:1rem;margin:0 0 5px}.c2-meta{font-size:.72rem;color:#9f9b8d;line-height:1.5}.c2-dots{display:flex;gap:5px;padding-top:3px}.c2-dots i{width:10px;height:10px;border-radius:50%;background:#45483f}.c2-dots i.on{background:#c7b16f}.c2-dots i.danger{background:#b86f61}.c2-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:0 0 12px}.c2-tab{border:1px solid #3a3d33;background:#1a1c17;color:#9c998d;border-radius:12px;padding:10px 8px}.c2-tab.active{background:#323429;color:#f0eadb;border-color:#64604d}.c2-panel-title{font-size:.73rem;letter-spacing:.08em;color:#a4a193;margin:0 0 8px}.c2-witness{padding:16px;margin-bottom:11px}.c2-witness small{color:#999587}.c2-witness h2{margin:4px 0 10px}.c2-witness p{line-height:1.72;margin:0}.c2-statement-list{display:grid;gap:9px}.c2-statement{border:1px solid #36392f;background:#181a16;border-radius:14px;padding:13px;cursor:pointer;-webkit-tap-highlight-color:transparent}.c2-statement.selected{border-color:#8e7c4f;background:#242318}.c2-statement.solved{border-color:#697657}.c2-statement blockquote{margin:0;line-height:1.65;font-size:.94rem}.c2-statement .state{margin-top:7px;color:#8f8d82;font-size:.69rem}.c2-examine{margin-top:9px;padding:13px;border-left:3px solid #8e7c56;background:#201d17;border-radius:0 11px 11px 0;line-height:1.65;color:#cbc5b5}.c2-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.c2-actions.single{grid-template-columns:1fr}.c2-actions.single{grid-template-columns:1fr}.c2-actions button,.c2-next,.c2-option,.c2-evidence-btn{border:1px solid #41443a;background:#1c1e19;color:#eee9dc;border-radius:12px;padding:11px;cursor:pointer}.c2-actions button.primaryish,.c2-next{border-color:#b7a36e;background:#cdbb89;color:#29251b;font-weight:650}.c2-next{width:100%;margin-top:11px}.c2-feedback{margin-top:11px;padding:12px;border:1px solid #4b4638;border-radius:12px;color:#c8c1ae;line-height:1.65;background:#1e1d18}.c2-record-grid{display:grid;gap:9px}.c2-record{border:1px solid #35382f;border-radius:12px;padding:12px;background:#171914}.c2-record strong{display:block}.c2-record small{display:block;color:#9f9c90;margin-top:5px;line-height:1.55}.c2-type{display:inline-block;margin-top:7px;border:1px solid #47493f;border-radius:999px;padding:3px 7px;color:#aaa799;font-size:.65rem}.c2-recap-note{margin:8px 0 10px;color:#969386;font-size:.72rem;line-height:1.55}.c2-recap-strip{display:flex;gap:10px;overflow-x:auto;padding:2px 1px 9px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}.c2-recap-card{flex:0 0 min(82vw,360px);scroll-snap-align:start;border:1px solid #36392f;border-radius:13px;overflow:hidden;background:#151713}.c2-recap-card img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#0f100e}.c2-recap-caption{padding:9px 10px 10px}.c2-recap-caption strong{display:block;font-size:.8rem;color:#ddd7c8}.c2-recap-caption small{display:block;margin-top:3px;color:#908d80;line-height:1.45}.c2-final{padding:17px}.c2-final h2{margin:4px 0 9px}.c2-final p{line-height:1.65}.c2-options{display:grid;gap:9px;margin-top:12px}.c2-option{text-align:left;line-height:1.55}.c2-complete{padding:19px}.c2-complete h2{margin:4px 0 10px}.c2-complete p{line-height:1.75}.c2-modal{position:fixed;inset:0;z-index:100;background:rgba(5,6,5,.82);display:flex;align-items:flex-end;justify-content:center;padding:18px max(14px,env(safe-area-inset-left)) calc(18px + env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-right))}.c2-modal.hidden{display:none}.c2-sheet{width:min(720px,100%);max-height:78vh;overflow:auto;background:#191b16;border:1px solid #3b3e34;border-radius:18px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.45)}.c2-sheet h3{margin:0 0 5px}.c2-sheet p{margin:0 0 12px;color:#9d9a8d;font-size:.78rem;line-height:1.5}.c2-evidence-list{display:grid;gap:8px}.c2-evidence-btn{text-align:left}.c2-evidence-btn strong{display:block}.c2-evidence-btn small{display:block;color:#979487;margin-top:4px;line-height:1.45}.c2-close{width:100%;margin-top:10px;border:0;background:transparent;color:#aaa799;padding:10px}.c2-role-note{border-left:3px solid #756c4e;padding:10px 12px;margin:0 0 12px;background:#1e1d17;color:#bbb4a2;font-size:.8rem;line-height:1.6}@media(min-width:640px){.c2-actions{grid-template-columns:160px 160px}.c2-actions.single{grid-template-columns:minmax(0,320px)}.c2-statement-list{gap:10px}}';document.head.appendChild(st)}

function mount(){if($('case2Screen'))return;injectStyle();var root=document.createElement('section');root.id='case2Screen';root.className='hidden';root.innerHTML='<div id="c2Main"><div class="c2-banner">案件二不再提示哪一句「看起來可疑」。先追問證詞，再決定是否提出證物。記憶不同不等於說謊；找到一句話，也不代表你可以替它擴張用途。</div><div class="c2-status card"><div><h2 id="c2Player">—</h2><div class="c2-meta"><span>案件二・秋月的條件</span><br><span id="c2FocusLabel"></span></div></div><div id="c2Dots" class="c2-dots"></div></div><div class="c2-tabs"><button class="c2-tab active" data-c2tab="testimony">證詞</button><button class="c2-tab" data-c2tab="record">紀錄</button><button class="c2-tab" data-c2tab="final">結論</button></div><section id="c2Testimony"></section><section id="c2Record" class="hidden"></section><section id="c2Final" class="hidden"></section><button id="c2Home" class="secondary" type="button">回到標題</button></div><div id="c2Complete" class="hidden"></div><div id="c2Failed" class="hidden"></div><div id="c2Modal" class="c2-modal hidden"><div class="c2-sheet"><h3>提出哪一項紀錄？</h3><p>只會列出目前真正取得的證物與情報。</p><div id="c2EvidenceList" class="c2-evidence-list"></div><button id="c2Close" class="c2-close" type="button">取消</button></div></div>';document.querySelector('main.app').appendChild(root);root.querySelectorAll('.c2-tab').forEach(function(b){b.onclick=function(){setTab(b.getAttribute('data-c2tab'))}});$('c2Home').onclick=function(){location.reload()};$('c2Close').onclick=closeEvidence;$('c2Modal').onclick=function(e){if(e.target===$('c2Modal'))closeEvidence()};}
function hideBase(){['startScreen','prologueScreen','gameScreen','completeScreen','failScreen'].forEach(function(id){var el=$(id);if(el)el.classList.add('hidden')})}
function showRoot(){mount();hideBase();$('case2Screen').classList.remove('hidden');$('caseChip').textContent='CASE 02・秋月的條件';var build=document.querySelector('.build');if(build)build.textContent='BUILD 5.1・CASE 02'}
function setTab(tab){activeTab=tab;document.querySelectorAll('.c2-tab').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-c2tab')===tab)});$('c2Testimony').classList.toggle('hidden',tab!=='testimony');$('c2Record').classList.toggle('hidden',tab!=='record');$('c2Final').classList.toggle('hidden',tab!=='final');render()}
function renderFocus(){var dots=$('c2Dots');dots.innerHTML='';for(var i=0;i<MAX_FOCUS;i++){var d=document.createElement('i');if(i<s.focus)d.classList.add('on');if(s.focus===1&&i===0)d.classList.add('danger');dots.appendChild(d)}$('c2FocusLabel').textContent='推理專注 '+s.focus+'/'+MAX_FOCUS}
function roleText(){var id=roleClue(s.role);return evidence[id]?evidence[id].desc:''}

function render(){if(!s)return;showRoot();$('c2Player').textContent=s.name+'・'+roles[s.role];renderFocus();if(s.finished){renderComplete();return}if(s.failed){renderFailed();return}$('c2Main').classList.remove('hidden');$('c2Complete').classList.add('hidden');$('c2Failed').classList.add('hidden');if(activeTab==='testimony')renderTestimony();if(activeTab==='record')renderRecord();if(activeTab==='final')renderFinal()}
function renderTestimony(){var w=currentWitness(),box=$('c2Testimony');if(selectedStatement&&w.statements.every(function(x){return x.id!==selectedStatement}))selectedStatement=null;var html='<p class="c2-panel-title">證詞 '+(s.witnessIndex+1)+' / '+witnesses.length+'</p><article class="c2-witness card"><small>'+esc(w.place)+'</small><h2>'+esc(w.name)+'</h2><p>'+esc(w.intro)+'</p></article><div class="c2-role-note"><strong>'+esc(roles[s.role])+'的觀察：</strong> '+esc(roleText())+'</div><div class="c2-statement-list">';w.statements.forEach(function(st){var cls='c2-statement'+(selectedStatement===st.id?' selected':'')+(s.solved[st.id]?' solved':'');var status=s.solved[st.id]?'已核對':(s.pressed[st.id]?'已追問':'尚未追問');html+='<div class="'+cls+'" data-st="'+st.id+'"><blockquote>'+esc(st.text)+'</blockquote><div class="state">'+status+'</div></div>';if(selectedStatement===st.id){if(s.pressed[st.id])html+='<div class="c2-examine">'+esc(st.press)+'</div>';html+='<div class="c2-actions'+(s.pressed[st.id]?'':' single')+'"><button type="button" data-press="'+st.id+'" class="primaryish">'+(s.pressed[st.id]?'再次確認':'追問')+'</button>'+(s.pressed[st.id]?'<button type="button" data-present="'+st.id+'">提出證物</button>':'')+'</div>';}});html+='</div>';if(s.feedback)html+='<div class="c2-feedback">'+esc(s.feedback)+'</div>';if(witnessReady(w))html+='<button id="c2NextWitness" type="button" class="c2-next">'+esc(w.nextLabel)+'</button>';box.innerHTML=html;box.querySelectorAll('[data-st]').forEach(function(el){el.onclick=function(){selectedStatement=el.getAttribute('data-st');s.feedback='';save();renderTestimony()}});box.querySelectorAll('[data-press]').forEach(function(b){b.onclick=function(){pressStatement(b.getAttribute('data-press'))}});box.querySelectorAll('[data-present]').forEach(function(b){b.onclick=function(){openEvidence(b.getAttribute('data-present'))}});var n=$('c2NextWitness');if(n)n.onclick=advanceWitness;}
function findStatement(id){for(var i=0;i<witnesses.length;i++)for(var j=0;j<witnesses[i].statements.length;j++)if(witnesses[i].statements[j].id===id)return witnesses[i].statements[j];return null}
function pressStatement(id){var st=findStatement(id);if(!st)return;s.pressed[id]=true;if(st.gain)gain(st.gain);if(st.person)know(st.person);if(st.contact){s.flags.qContact=true;know('qiuyue')}s.feedback=st.press;s.history.push({type:'press',id:id});save();renderTestimony();renderFocus()}
function openEvidence(id){pendingStatement=id;var list=$('c2EvidenceList');list.innerHTML='';s.evidence.forEach(function(eid){var e=evidence[eid];if(!e)return;var b=document.createElement('button');b.type='button';b.className='c2-evidence-btn';b.innerHTML='<strong>'+esc(e.name)+'</strong><small>'+esc(e.type)+'｜'+esc(e.desc)+'</small>';b.onclick=function(){presentEvidence(eid)};list.appendChild(b)});$('c2Modal').classList.remove('hidden')}
function closeEvidence(){$('c2Modal').classList.add('hidden');pendingStatement=null}
function presentEvidence(eid){var id=pendingStatement,st=findStatement(id);$('c2Modal').classList.add('hidden');pendingStatement=null;if(!st)return;if(!st.correct){loseFocus('這一句目前沒有需要用證物推翻的地方。你把一項紀錄硬塞進證詞裡，反而模糊了問題。');return}if(st.correct!==eid){loseFocus('這項紀錄和你正在核對的句子沒有直接關係。先回到「這句話到底聲稱了什麼」。');return}s.solved[id]=true;s.feedback=st.success;s.history.push({type:'present',statement:id,evidence:eid,result:'correct'});save();render();}
function loseFocus(msg){s.focus=Math.max(0,s.focus-1);s.feedback=msg;s.history.push({type:'mistake',message:msg});if(s.focus<=0)s.failed=true;save();render()}
function advanceWitness(){var w=currentWitness();if(!witnessReady(w))return;if(s.witnessIndex<witnesses.length-1){s.witnessIndex++;selectedStatement=null;s.feedback='';activeTab='testimony';save();render();return}s.flags.finalReady=true;s.feedback='三段證詞已整理。現在可以把「保留」「匿名」「再次使用」分開下結論。';activeTab='final';save();render();}

function renderRecord(){
 var box=$('c2Record'),html='<p class="c2-panel-title">案件紀錄</p><article class="section-card card"><h3>證物與情報</h3><div class="c2-record-grid">';
 s.evidence.forEach(function(id){var e=evidence[id];if(e)html+='<div class="c2-record"><strong>'+esc(e.name)+'</strong><small>'+esc(e.desc)+'</small><span class="c2-type">'+esc(e.type)+'</span></div>'});
 html+='</div></article><article class="section-card card" style="margin-top:11px"><h3>目前知道的人</h3><div class="c2-record-grid">';
 s.people.forEach(function(id){var p=people[id];if(!p)return;var desc=p.desc;if(id==='qiuyue'&&s.flags.qContact)desc='美惠已替你轉達。秋月願意親自說明：她當時允許保留什麼，又沒有允許什麼。';html+='<div class="c2-record"><strong>'+esc(p.name)+'</strong><small>'+esc(desc)+'</small></div>'});
 html+='</div></article>';
 html+='<article class="section-card card" style="margin-top:11px"><h3>案件一回顧</h3><p class="c2-recap-note">情境重構・非證物。這些場景圖只幫助回想第一案的調查路線，不會新增線索，也不能直接拿來反駁證詞。</p><div class="c2-recap-strip">'
  +'<figure class="c2-recap-card"><img src="assets/case1/tea.webp?v=7" loading="lazy" alt="案件一茶行情境重構"><figcaption class="c2-recap-caption"><strong>茶行</strong><small>缺頁最初被發現的地方。</small></figcaption></figure>'
  +'<figure class="c2-recap-card"><img src="assets/case1/print.webp?v=7" loading="lazy" alt="案件一印刷行情境重構"><figcaption class="c2-recap-caption"><strong>印刷行</strong><small>借用簿與廢紙去向把調查帶往市場。</small></figcaption></figure>'
  +'<figure class="c2-recap-card"><img src="assets/case1/market.webp?v=7" loading="lazy" alt="案件一市場情境重構"><figcaption class="c2-recap-caption"><strong>市場</strong><small>紙張流向與跑腿少年的說法在這裡交會。</small></figcaption></figure>'
  +'<figure class="c2-recap-card"><img src="assets/case1/bookstall.webp?v=7" loading="lazy" alt="案件一舊書攤情境重構"><figcaption class="c2-recap-caption"><strong>舊書攤</strong><small>三頁筆記最後從書堆中被找回。</small></figcaption></figure>'
  +'</div></article>';
 box.innerHTML=html;
}

function renderFinal(){var box=$('c2Final');if(!s.flags.finalReady){box.innerHTML='<p class="c2-panel-title">案件結論</p><article class="c2-final card"><h2>還不能下結論</h2><p>目前還有證詞沒有整理完。案件二不會先把尚未發現的問題列給你看。</p><button id="c2BackTestimony" class="c2-next" type="button">回到證詞</button></article>';$('c2BackTestimony').onclick=function(){setTab('testimony')};return}if(s.finalStep>=finalQuestions.length){finish();return}var q=finalQuestions[s.finalStep],html='<p class="c2-panel-title">案件結論 '+(s.finalStep+1)+' / '+finalQuestions.length+'</p><article class="c2-final card"><h2>'+esc(q.prompt)+'</h2><p>選擇你現在能用證詞與紀錄支持的結論。</p><div class="c2-options">';q.options.forEach(function(o){html+='<button class="c2-option" type="button" data-final="'+o.id+'">'+esc(o.text)+'</button>'});html+='</div>';if(s.feedback)html+='<div class="c2-feedback">'+esc(s.feedback)+'</div>';html+='</article>';box.innerHTML=html;box.querySelectorAll('[data-final]').forEach(function(b){b.onclick=function(){answerFinal(b.getAttribute('data-final'))}})}
function answerFinal(id){var q=finalQuestions[s.finalStep];if(!q)return;if(id!==q.correct){loseFocus('這個結論把現有證詞推得太遠了。案件中的「沒有證據」不能自動補成「已經同意」。');return}s.finalStep++;s.feedback=s.finalStep===1?'範圍先固定下來：可以保留，不等於可以公開。':s.finalStep===2?'匿名不是只換名字；要看熟人能否從細節重新辨識。':'新的閱讀或公開用途，需要新的確認。';s.history.push({type:'final',step:s.finalStep,result:'correct'});save();if(s.finalStep>=finalQuestions.length){finish();return}renderFinal();}
function finish(){s.finished=true;s.feedback='';save();renderComplete()}
function renderComplete(){$('c2Main').classList.add('hidden');$('c2Failed').classList.add('hidden');var box=$('c2Complete');box.classList.remove('hidden');box.innerHTML='<article class="c2-complete card paper"><p class="eyebrow" style="color:#715c34">CASE CLOSED・CONSENT BOUNDARY</p><h2>秋月的條件</h2><p>阿川沒有把三頁銷毀，也沒有直接拿去給更多人看。你們把訪談留下，但移除真名與容易讓熟人重新辨識秋月的組合資訊；原稿另外註明：當時同意的是保存與整理，若要擴大閱讀範圍，必須重新詢問。</p><div class="summary-list"><div class="summary-item"><strong>保留不等於公開</strong><br>一句「可以留下」只回答了當時那個問題，不能事後自動變成無限用途。</div><div class="summary-item"><strong>記憶不同不等於說謊</strong><br>美惠把後來的擔心混進了原本記憶；同期隨手記讓你們把兩者重新分開。</div><div class="summary-item"><strong>匿名不只是換名字</strong><br>在熟人社群裡，班別、住處與家庭資訊的組合也可能重新指向某個人。</div></div><div class="history-note"><strong>敘事說明</strong><br>本案人物與事件為虛構。遊戲把 1958 年戒嚴社會中的工作、家庭、名譽與政治聯想等壓力放進人物選擇，但不把每一個匿名要求都解釋成政治偵查；玩家要處理的是能被證明的同意範圍。</div><button id="c2CompleteHome" class="primary" type="button">回到標題</button></article>';$('c2CompleteHome').onclick=function(){location.reload()};$('caseChip').textContent='CASE 02・已結案';}
function renderFailed(){$('c2Main').classList.add('hidden');$('c2Complete').classList.add('hidden');var box=$('c2Failed');box.classList.remove('hidden');box.innerHTML='<article class="fail-card card"><p class="eyebrow">CASE FAILED</p><h2>證詞關係中斷</h2><p>你連續把不相干的紀錄當成反證，也把記憶差異逼成了「一定有人說謊」。</p><p>美惠不再願意替你傳話。阿川把三頁重新收進布袋，決定先停止整理。</p><p class="note">這次沒有誰被證明在欺騙你；你失去的是繼續確認界線的機會。</p><button id="c2Retry" class="primary" type="button">重新調查案件二</button><button id="c2FailHome" class="secondary" type="button">回到標題</button></article>';$('c2Retry').onclick=function(){try{localStorage.removeItem(CASE2_KEY)}catch(e){}startCase2(true)};$('c2FailHome').onclick=function(){location.reload()};$('caseChip').textContent='CASE 02・調查失敗';}

function startCase2(reset){mount();if(reset){try{localStorage.removeItem(CASE2_KEY)}catch(e){}}s=load()||fresh();activeTab=s.flags&&s.flags.finalReady?'final':'testimony';selectedStatement=null;save();render()}
function resumeCase2(){s=load();if(!s){startCase2(true);return}activeTab=s.finished||s.failed?'testimony':(s.flags&&s.flags.finalReady?'final':'testimony');selectedStatement=null;render()}

function wrapClear(id){var el=$(id);if(!el||el.__c2Wrapped)return;var old=el.onclick;el.onclick=function(e){try{localStorage.removeItem(CASE2_KEY)}catch(err){}if(typeof old==='function')return old.call(el,e)};el.__c2Wrapped=true}
function install(){mount();var next=$('nextCaseBtn');if(next)next.onclick=function(){startCase2(false)};var loadBtn=$('loadBtn'),saved=load();if(loadBtn&&saved){loadBtn.disabled=false;loadBtn.textContent=saved.finished?'查看案件二結案':'繼續案件二';var boot=$('bootStatus');if(boot)boot.textContent=saved.finished?'案件二已有結案紀錄。':'找到案件二進度。';loadBtn.onclick=resumeCase2}wrapClear('startBtn');wrapClear('restartBtn');wrapClear('retryBtn');}

install();
})();
