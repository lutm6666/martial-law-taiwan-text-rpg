(function(){
'use strict';

var SAVE_KEY='mist-taiwan-case-save-v4';
var MAX_FOCUS=4;
var state=null,currentTab='scene',prologueIndex=0;

function $(id){return document.getElementById(id)}
function toast(msg){var t=$('toast');if(!t)return;t.textContent=msg;t.className='toast show';clearTimeout(window.__mistToast);window.__mistToast=setTimeout(function(){t.className='toast'},1800)}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch(e){}}
function parse(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch(e){return null}}
function has(id){return state.evidence.indexOf(id)!==-1}
function done(id){return state.done.indexOf(id)!==-1}
function gain(id){if(evidence[id]&&!has(id)){state.evidence.push(id);toast('新增紀錄：'+evidence[id].name)}}
function know(id){if(people[id]&&state.people.indexOf(id)===-1)state.people.push(id)}
function unlock(id){if(locations[id]&&state.unlocked.indexOf(id)===-1)state.unlocked.push(id)}
function hideAll(){['startScreen','prologueScreen','gameScreen','completeScreen','failScreen'].forEach(function(id){var el=$(id);if(el)el.classList.add('hidden')})}

var art={
 tea:'assets/case1/tea.webp?v=9',
 print:'assets/case1/print.webp?v=9',
 market:'assets/case1/market.webp?v=9',
 bookstall:'assets/case1/bookstall.webp?v=9',
 failed:'assets/case1/failed.webp?v=9'
};
var visualMeta={
 tea:{alt:'1958 年臺北茶行・傍晚',before:'先看看桌上的冊子與周遭。',after:'你注意到冊子攤開在桌面，缺頁集中在同一本裝訂中；桌上沒有明顯翻找或爭搶留下的凌亂。',observed:['你把視線從阿川移到桌面。訪談冊攤開著，缺頁集中在同一段裝訂位置，桌上的紙張與茶具則沒有被匆忙翻動的跡象。','這些只能先說明「紙從冊子裡少了」，還不能說明是誰拿走、又為什麼拿走。']},
 print:{alt:'1958 年臺北印刷行・午後',before:'先看看帳簿、紙堆與工作區。',after:'你看見工作區裡帳簿、鉛字與廢紙各有固定位置；紙張確實會經過整理與集中。',observed:['你沿著工作桌看了一圈。帳簿放在一側，鉛字盒與紙堆分開，牆邊則有整理過的廢紙與麻繩。','這裡的紙不是靜止不動的物件，而是會依照日常工作流程被搬動、集中，再交出去。']},
 market:{alt:'1958 年臺北市場・白天',before:'先看看攤位、包貨紙與人流。',after:'你看見紙張在市場裡被反覆拿來墊箱、包貨；同一張紙很容易在不同攤位之間轉手。',observed:['你沒有先追著議論聲走，而是看攤位怎麼使用紙。墊箱、包花生、包雜貨的紙來源不一，很多都已經被折過或撕過。','如果失頁真的到了市場，它最可能先留下的是實物痕跡，而不是一段完整故事。']},
 bookstall:{alt:'1958 年臺北舊書攤・下午',before:'先看看書堆、夾紙與櫃檯。',after:'你發現老闆會把仍能使用的零散紙張夾進舊書；書脊與頁縫因此值得逐本查看。',observed:['你掃過書攤。幾本工具書明顯比旁邊厚，書頁之間也夾著零散紙片，像是老闆隨手保存可再利用的紙。','這裡真正值得找的不是「可疑的人」，而是哪一本書裡夾著能和原冊缺口直接比對的紙。']}
};

var evidence={
 missing_index:{name:'缺頁編號',type:'現場紀錄',desc:'訪談冊缺少第 17、21、22 頁，裝訂處留下相連的斜裂痕。'},
 print_ledger:{name:'鉛字盒借用簿',type:'帳目',desc:'阿川十二日借出鉛字盒，歸還欄卻記在十三日。'},
 waste_route:{name:'廢紙去向',type:'流程情報',desc:'印刷行的少量廢紙平常由市場跑腿少年帶走。'},
 zhou_motive:{name:'周老闆的顧慮',type:'證詞',desc:'周老闆真正害怕的是寫有人名的訪談紙從自己店裡流出，替生意與自己惹麻煩。'},
 wrapped_scrap:{name:'包花生的紙角',type:'紙片',desc:'市場找到帶有阿川筆跡與「夜班」字樣的紙角。'},
 runner_account:{name:'紙張交接確認',type:'證詞',desc:'跑腿少年把幾張較完整、寫滿字的紙交給舊書攤老闆。'},
 archive_pages:{name:'三頁失落筆記',type:'關鍵物證',desc:'舊字典裡找到第 17、21、22 頁，裂痕與原冊缺口吻合。'},
 postal_stub:{name:'錯投郵件存根',type:'存根',desc:'市場裡的郵務人員是在處理錯投地址；目前沒有證據顯示他與失頁有關。'},
 consent_note:{name:'頁邊鉛筆註記',type:'文字線索',desc:'第 21 頁寫著：「受訪者：不要真名。」提醒你找回紙張不等於可以忽略紙上的人。'}
};
var people={
 achuan:{name:'阿川',desc:'你的舊同學。整理普通人的生活訪談，因此格外在意姓名與來源。'},
 zhou:{name:'周老闆',desc:'印刷行老闆。對失頁去向有所保留，但保留不等於犯罪。'},
 runner:{name:'跑腿少年',desc:'替市場攤商搬貨，也替印刷行帶走少量廢紙。'},
 bookseller:{name:'舊書攤老闆',desc:'會把仍可使用、寫過字的紙暫時夾進舊書保存。'}
};
var locations={
 tea:{name:'茶行',sub:'案件起點',intro:['茶行快打烊了。阿川把一本缺了三頁的訪談冊推到你面前。','你從小跟著家中長輩接觸民俗與科儀，早就知道「大家都這樣說」和「事情真的如此」不是同一件事。這次也一樣：先看痕跡，再問人。'],actions:['tea_index','tea_ask','tea_compare']},
 print:{name:'印刷行',sub:'油墨與紙堆',intro:['機器剛停，空氣裡仍有油墨味。周老闆正在整理鉛字與紙張。','你沒有把他的緊張直接記成可疑，只先找日期、流程與最後接觸紙張的人。'],actions:['print_ledger','print_zhou','print_waste']},
 market:{name:'市場',sub:'物流與傳聞',intro:['攤販、搬貨與叫賣聲混在一起。紙在這裡可能被拿來墊箱、包貨，也可能再被轉手。','幾個人正談一名穿制服、四處問地址的人。你把「親眼看到」和「後來猜的目的」分開記下。'],actions:['market_stalls','market_runner','market_postman']},
 bookstall:{name:'舊書攤',sub:'紙頁之間',intro:['騎樓深處堆著一排排舊書。幾本工具書的書頁已經發脆。','你已追到紙張的實際流向；現在要找的不是最可疑的人，而是能和原冊直接比對的紙。'],actions:['book_owner','book_search','book_stub','book_pages']}
};

var prologue=[
 {date:'1958 年 9 月・臺北',title:'收音機沒有停過',html:'<p>城市仍照常上工、上課、做生意，但談到姓名、印刷品與陌生詢問時，人們往往比平常更謹慎。</p><p class="quote-line">有人會說謊，有人會少說一點，也有人只是記錯。調查的第一步不是判斷誰可疑，而是先分清楚哪一部分能被證明。</p>'},
 {date:'你家・傍晚',title:'家學不是答案',html:'<p>家中長輩熟悉地方民俗與科儀。你從小耳濡目染，能看懂一些符式、禁忌與儀式，也看過同一句規矩在不同人口中越傳越具體。</p><p>因此你養成一個習慣：家學可以幫你辨認脈絡，但案件要成立，仍要回到物證、原話、時間與可重複的現象。</p>'},
 {date:'茶行門口',title:'阿川找上你',html:'<p>阿川近來在整理工人、學生、店家與家屬的生活訪談。三頁紙不見後，他沒有先報失竊，也沒有先指控誰。</p><p class="quote-line">「我找你，是因為你不會先替事情取名字。」</p><p>你推門進去。第一案從一本缺頁的冊子開始。</p>'}
];

var deduction=[
 {q:'第一問：三頁失頁最可能怎麼離開印刷行？',opts:[['steal','有人趁周老闆不注意偷走'],['waste','整理時混進廢紙，被一起帶去市場'],['achuan','阿川故意把三頁交給陌生人']],correct:'waste',need:'wrapped_scrap',teach:'先找能把印刷行與市場直接連起來的紙張或流程。'},
 {q:'第二問：周老闆一開始為什麼說得含糊？',opts:[['cover','他知道有人偷走筆記，正在掩護對方'],['risk','他怕寫有人名的紙從自己店裡流出去會惹麻煩'],['forget','他完全不記得阿川來過']],correct:'risk',need:'zhou_motive',teach:'矛盾不一定等於惡意；先確認他真正想避開的是哪一件事。'},
 {q:'第三問：市場裡的郵務人員與失頁有什麼關係？',opts:[['tracker','他就是在追查阿川的筆記'],['rumor','大家都這樣說，所以應列為主要嫌疑人'],['postal','他在處理錯投郵件；沒有證據顯示與失頁有關']],correct:'postal',need:'postal_stub',teach:'多人重複同一個說法，不等於多人親眼看見同一個目的。'},
 {q:'第四問：哪件證物能直接確認找回的三頁就是原頁？',opts:[['ledger','鉛字盒借用簿'],['pages','三頁失落筆記本身'],['runner','紙張交接確認']],correct:'pages',need:'archive_pages',teach:'最後一步回到能直接比對的物證。'}
];

function fresh(name){return{name:(name||'林默').trim()||'林默',caseId:'case1',schema:6,location:'tea',unlocked:['tea'],visited:['tea'],evidence:[],people:[],done:[],flags:{actionResults:{},visualSeen:{},mistakes:0,deductionReady:false,postmanRumor:false},focus:MAX_FOCUS,deductionStep:0,finished:false,failed:false}}
function normalize(v){
 if(!v||typeof v!=='object'||v.caseId!=='case1')return null;
 var n=fresh(typeof v.name==='string'?v.name:'林默');
 var validEvidence={};Object.keys(evidence).forEach(function(id){validEvidence[id]=1});
 (Array.isArray(v.evidence)?v.evidence:[]).forEach(function(id){if(validEvidence[id]&&n.evidence.indexOf(id)<0)n.evidence.push(id)});
 n.people=(Array.isArray(v.people)?v.people:[]).filter(function(id){return !!people[id]});
 n.done=(Array.isArray(v.done)?v.done:[]).filter(function(id){return !!actions[id]});
 n.unlocked=(Array.isArray(v.unlocked)?v.unlocked:['tea']).filter(function(id){return !!locations[id]});if(n.unlocked.indexOf('tea')<0)n.unlocked.unshift('tea');
 n.visited=(Array.isArray(v.visited)?v.visited:['tea']).filter(function(id){return !!locations[id]});
 n.location=locations[v.location]&&n.unlocked.indexOf(v.location)>=0?v.location:'tea';if(n.visited.indexOf(n.location)<0)n.visited.push(n.location);
 n.focus=Math.max(0,Math.min(MAX_FOCUS,Number.isFinite(Number(v.focus))?Math.floor(Number(v.focus)):MAX_FOCUS));
 n.deductionStep=Math.max(0,Math.min(deduction.length,Number.isFinite(Number(v.deductionStep))?Math.floor(Number(v.deductionStep)):0));
 n.flags={actionResults:{},visualSeen:{},mistakes:0,deductionReady:false,postmanRumor:false};
 if(v.flags&&typeof v.flags==='object'){
  if(v.flags.actionResults&&typeof v.flags.actionResults==='object')n.flags.actionResults=v.flags.actionResults;
  if(v.flags.visualSeen&&typeof v.flags.visualSeen==='object')n.flags.visualSeen=v.flags.visualSeen;
  n.flags.mistakes=Number.isFinite(Number(v.flags.mistakes))?Math.max(0,Math.floor(Number(v.flags.mistakes))):0;
  n.flags.postmanRumor=!!v.flags.postmanRumor;
 }
 if(n.done.indexOf('tea_ask')>=0)unlockFor(n,'print');
 if(n.evidence.indexOf('waste_route')>=0||n.evidence.indexOf('zhou_motive')>=0)unlockFor(n,'market');
 if(n.evidence.indexOf('runner_account')>=0)unlockFor(n,'bookstall');
 n.flags.deductionReady=n.evidence.indexOf('archive_pages')>=0&&n.evidence.indexOf('consent_note')>=0;
 n.finished=!!v.finished&&n.deductionStep>=deduction.length;
 n.failed=!n.finished&&n.focus<=0;
 return n;
}
function unlockFor(n,id){if(locations[id]&&n.unlocked.indexOf(id)<0)n.unlocked.push(id)}
function load(){return normalize(parse())}

function showPrologue(){hideAll();$('prologueScreen').classList.remove('hidden');prologueIndex=0;renderPrologue()}
function renderPrologue(){var p=prologue[prologueIndex];$('prologueDate').textContent=p.date;$('prologueTitle').textContent=p.title;$('prologueText').innerHTML=p.html;$('prologueCounter').textContent=(prologueIndex+1)+' / '+prologue.length;$('prologueNext').textContent=prologueIndex===prologue.length-1?'走進茶行':'繼續'}
function nextPrologue(){if(prologueIndex<prologue.length-1){prologueIndex++;renderPrologue();return}state=fresh($('nameInput').value);save();currentTab='scene';showGame()}
function showGame(){hideAll();$('gameScreen').classList.remove('hidden');$('playerLabel').textContent=state.name+'・民俗家學調查者';$('caseChip').textContent='CASE 01・失落的三頁';var build=document.querySelector('.build');if(build)build.textContent='BUILD 6.0・UNIFIED PROTAGONIST';if($('failImage'))$('failImage').src=art.failed;renderFocus();setTab(currentTab)}
function renderFocus(){var box=$('focusDots');box.innerHTML='';for(var i=0;i<MAX_FOCUS;i++){var d=document.createElement('i');if(i<state.focus)d.classList.add('on');if(state.focus===1&&i===0)d.classList.add('danger');box.appendChild(d)}$('focusLabel').textContent='推理專注 '+state.focus+'/'+MAX_FOCUS}
function setTab(tab){currentTab=tab;var panels={scene:'scenePanel',map:'mapPanel',record:'recordPanel',deduction:'deductionPanel'};document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});Object.keys(panels).forEach(function(k){$(panels[k]).classList.toggle('hidden',k!==tab)});if(tab==='scene')renderScene();if(tab==='map')renderMap();if(tab==='record')renderRecords();if(tab==='deduction')renderDeduction()}
function observeScene(){var m=visualMeta[state.location];state.flags.visualSeen[state.location]=true;state.flags.lastResult=m&&m.observed?{location:state.location,lines:m.observed}:null;save();renderScene()}
function renderVisual(){var box=$('sceneVisual'),img=$('sceneImage'),note=$('visualNote'),m=visualMeta[state.location];if(!m){box.classList.add('hidden');return}box.classList.remove('hidden');img.src=art[state.location];img.alt=m.alt;img.onclick=observeScene;note.textContent=state.flags.visualSeen[state.location]?'已觀察｜'+m.after:'點擊圖片觀察｜'+m.before;box.classList.toggle('seen',!!state.flags.visualSeen[state.location])}
function appendLines(lines){var box=$('sceneBody');box.innerHTML='';lines.forEach(function(t){var p=document.createElement('p');p.textContent=t;box.appendChild(p)})}
function renderScene(){renderVisual();var loc=locations[state.location];$('locationName').textContent=loc.name;$('locationSub').textContent=loc.sub;var last=state.flags.lastResult;appendLines(last&&last.location===state.location?last.lines:loc.intro);var grid=$('actionGrid');grid.innerHTML='';loc.actions.forEach(function(id){var a=actions[id];if(a.requires&&!a.requires.every(has))return;var b=document.createElement('button');b.className='action-btn'+(done(id)?' done':'');b.innerHTML='<strong>'+a.label+'</strong><small>'+(done(id)?'已調查，可再次查看':a.hint||'進行調查')+'</small>';b.onclick=function(){runAction(id)};grid.appendChild(b)})}
function completeAction(id,lines){if(!done(id))state.done.push(id);state.flags.actionResults[id]=lines}
function runAction(id){var a=actions[id],res;if(done(id)&&state.flags.actionResults[id]&&!a.dynamic){res={complete:true,lines:state.flags.actionResults[id]}}else{res=a.run();if(res.complete!==false)completeAction(id,res.lines)}state.flags.lastResult={location:state.location,lines:res.lines};save();renderScene();renderFocus()}

var actions={
 tea_index:{label:'檢查缺頁位置',hint:'先確定少了什麼',run:function(){gain('missing_index');return{lines:['你把冊子攤平。第 17、21、22 頁不在，裝訂斷口連成同一條斜線。','這不像有人逐頁挑選，更像幾張紙一起被抽離。你先記頁碼，不先猜拿走紙的人。']}}},
 tea_ask:{label:'問阿川最後在哪裡用過冊子',hint:'追最後可確認地點',run:function(){know('achuan');unlock('print');return{lines:['阿川說前一晚曾把冊子帶到周老闆的印刷行排字，隔天也回去歸還借用的鉛字盒。','你把「印刷行」標進地圖。先追紙真正出現過的地方，而不是追最容易讓人害怕的猜測。']}}},
 tea_compare:{label:'比對缺口前後內容',hint:'確認失頁原本屬於哪段訪談',run:function(){return{lines:['第 16 頁還在談工廠夜班，第 18 頁卻已換了話題。','你記下：失頁至少有一部分原本與夜班訪談相連。內容能縮小範圍，但還不能證明紙去了哪裡。']}}},
 print_ledger:{label:'查看借物簿',hint:'用帳目固定日期',run:function(){gain('print_ledger');return{lines:['借物簿記著：十二日借出鉛字盒，十三日歸還。前後欄位、流水號與墨色連續。','這筆帳比「我記得」更穩。你把十三日這個時間點留著，準備追問周老闆。']}}},
 print_zhou:{label:'用帳目追問周老闆',hint:'分清隱瞞與惡意',requires:['print_ledger'],run:function(){know('zhou');gain('waste_route');gain('zhou_motive');unlock('market');return{lines:['你把借物簿轉向周老闆。他沉默後承認：十三日收桌時，一捆廢紙照平常流程交給市場跑腿少年。','真正讓他吞吞吐吐的不是「有人偷紙」，而是那些紙上寫著人名。他怕承認紙從自己店裡流出去，會替生意與自己惹麻煩。','市場被標進地圖。']}}},
 print_waste:{label:'檢查廢紙處理方式',hint:'確認這是不是平常流程',dynamic:true,run:function(){return{lines:has('waste_route')?['後間少了一捆紙，牆邊留下的麻繩與竹籃都顯示這不是第一次往市場送廢紙。','你得到的是一條日常物流，而不是一次神祕交接。']:['後間紙捆之間空了一塊，但周老闆現在只肯說「處理掉了」。','空位值得記住，卻還不足以替它指定去向。先用帳目把他那一天的流程固定下來。'],complete:has('waste_route')}}},
 market_stalls:{label:'沿攤位找被拿來包貨的紙',hint:'找實物流向',run:function(){gain('wrapped_scrap');return{lines:['花生攤腳邊壓著一小角較白的紙。末尾還看得見「夜班」兩字，筆跡與阿川的冊子一致。','印刷行的紙確實進了市場。現在可以拿這個具體特徵去問跑腿少年。']}}},
 market_runner:{label:'找跑腿少年問那捆紙',hint:'用紙角喚回具體記憶',requires:['wrapped_scrap'],run:function(){know('runner');gain('runner_account');unlock('bookstall');return{lines:['少年看過紙角後想起那一捆。大多數紙拿去墊箱，幾張完整、寫滿字的紙，他覺得拿來包吃的東西不妥，就交給舊書攤老闆。','舊書攤被標進地圖。']}}},
 market_postman:{label:'追查「穿制服的人四處問地址」',hint:'拆開目擊與傳聞',run:function(){state.flags.postmanRumor=true;return{lines:['第一個人只看見郵務制服；第二個人記得他問過地址；傳到第三個人口中，已經變成「在找阿川的紙」。','你沒有把轉述最多的版本當成最可靠的版本。若能找到當天留下的郵務紀錄，才有辦法判斷。']}}},
 book_owner:{label:'詢問老闆收紙經過',hint:'確認交接是否為第一手',requires:['runner_account'],run:function(){know('bookseller');return{lines:['老闆確認，是跑腿少年親手把幾張完整紙交給他。','「寫滿字的紙拿來包吃的，我看了不舒服，就先夾著。」他的說法和少年能互相核對。']}}},
 book_search:{label:'翻找夾過紙的舊工具書',hint:'找能與原冊直接比對的紙',requires:['runner_account'],run:function(){gain('archive_pages');return{lines:['一本破字典中段明顯厚了一截。三張摺過的紙從書脊旁滑出來：17、21、22。','裂痕與阿川冊上的缺口正好接回去。']}}},
 book_stub:{label:'核對櫃檯下的郵件存根',hint:'檢驗市場傳聞',run:function(){gain('postal_stub');return{lines:[state.flags.postmanRumor?'老闆找到一張錯投郵件存根。昨天那名郵務人員是在確認送錯巷口的地址。':'櫃檯下夾著一張錯投郵件存根；老闆想起昨天確實有郵務人員來確認地址。','地址與阿川、印刷行都無關。你不需要證明郵務人員「絕對無關所有事情」，只需要確認目前沒有證據把他和失頁連起來。']}}},
 book_pages:{label:'仔細閱讀找回的三頁',hint:'結案前確認紙上的人',requires:['archive_pages'],run:function(){gain('consent_note');state.flags.deductionReady=true;return{lines:['你把三頁按頁碼排好。第 21 頁右側有一行很淡的鉛筆字：「受訪者：不要真名。」','紙找回來了，但你從家學裡早就學過一件相似的事：知道一個名字，不代表你有權把名字拿去替故事增加真實感。','推理頁面已開放。']}}}
};

function renderMap(){var grid=$('mapGrid');grid.innerHTML='';Object.keys(locations).forEach(function(id){var l=locations[id],open=state.unlocked.indexOf(id)>=0,b=document.createElement('button');b.className='map-btn'+(state.visited.indexOf(id)>=0?' visited':'')+(open?'':' locked');b.disabled=!open;b.innerHTML='<strong>'+l.name+'</strong><small>'+(open?l.sub:'尚未取得前往線索')+'</small>';b.onclick=function(){state.location=id;if(state.visited.indexOf(id)<0)state.visited.push(id);state.flags.lastResult=null;save();setTab('scene')};grid.appendChild(b)})}
function renderRecords(){var ev=$('evidenceGrid'),pp=$('peopleGrid');ev.innerHTML='';pp.innerHTML='';if(!state.evidence.length)ev.innerHTML='<div class="evidence-card"><strong>尚無案件紀錄</strong><small>可核對的物證、文件與證詞會收在這裡。</small></div>';state.evidence.forEach(function(id){var e=evidence[id],d=document.createElement('div');d.className='evidence-card';d.innerHTML='<strong>'+e.name+'</strong><small>'+e.desc+'</small><span class="tag">'+e.type+'</span>';ev.appendChild(d)});if(!state.people.length)pp.innerHTML='<div class="person-card"><strong>尚無人物紀錄</strong><small>與案件相關的人會在交談後加入。</small></div>';state.people.forEach(function(id){var p=people[id],d=document.createElement('div');d.className='person-card';d.innerHTML='<strong>'+p.name+'</strong><small>'+p.desc+'</small>';pp.appendChild(d)});$('evidenceCount').textContent=state.evidence.length}
function showEvidence(){renderRecords();$('evidenceSection').classList.remove('hidden');$('peopleSection').classList.add('hidden');$('recordEvidenceBtn').classList.add('active');$('recordPeopleBtn').classList.remove('active')}
function showPeople(){renderRecords();$('peopleSection').classList.remove('hidden');$('evidenceSection').classList.add('hidden');$('recordPeopleBtn').classList.add('active');$('recordEvidenceBtn').classList.remove('active')}
function loseFocus(msg){state.focus=Math.max(0,state.focus-1);state.flags.mistakes++;state.flags.deductionFeedback=msg;save();renderFocus();if(state.focus<=0){failCase();return}renderDeduction()}
function renderDeduction(){var box=$('deductionBox');box.innerHTML='';if(!state.flags.deductionReady){box.innerHTML='<h2>推理尚未開放</h2><p>先找到三頁失落筆記並仔細閱讀。</p><div class="method-note"><strong>主角方法</strong><br>家學可以提供脈絡，但推理頁只接受你已經能用案件紀錄支撐的說法。</div>';return}var step=deduction[state.deductionStep];if(!step){finishCase();return}box.innerHTML='<h2>'+step.q+'</h2><p>先選推論，再提出能直接支撐它的案件紀錄。</p><div class="method-note">'+step.teach+'</div><div class="failure-warning">無法被證據支撐的推論會消耗推理專注。</div>';var opts=document.createElement('div');opts.className='deduction-options';step.opts.forEach(function(pair){var b=document.createElement('button');b.className='deduction-option';b.innerHTML='<strong>'+pair[1]+'</strong>';b.onclick=function(){if(pair[0]!==step.correct){loseFocus('這個說法把尚未證明的部分當成了事實。');return}renderEvidencePicker(step)};opts.appendChild(b)});box.appendChild(opts);if(state.flags.deductionFeedback){var f=document.createElement('div');f.className='feedback';f.textContent=state.flags.deductionFeedback;box.appendChild(f)}}
function renderEvidencePicker(step){var box=$('deductionBox');if(!has(step.need)){box.innerHTML='<h2>還缺少直接證據</h2><p>推論方向可能合理，但目前沒有能直接支撐它的紀錄。</p><button class="deduction-option" id="backInvestigate"><strong>回到調查</strong></button>';$('backInvestigate').onclick=function(){setTab('scene')};return}box.innerHTML='<h2>提出證物</h2><p>哪一件已取得的案件紀錄最能直接支撐剛才的推論？</p>';var opts=document.createElement('div');opts.className='deduction-options';state.evidence.forEach(function(id){var e=evidence[id],b=document.createElement('button');b.className='deduction-option';b.innerHTML='<strong>'+e.name+'</strong><small>'+e.type+'</small>';b.onclick=function(){if(id!==step.need){loseFocus('這件紀錄可能重要，但不能直接支撐剛才那一句推論。');return}state.deductionStep++;state.flags.deductionFeedback='';save();toast('推理成立');renderDeduction()};opts.appendChild(b)});box.appendChild(opts)}
function finishCase(){state.finished=true;save();hideAll();$('completeScreen').classList.remove('hidden');$('caseChip').textContent='CASE 01・CLOSED';var build=document.querySelector('.build');if(build)build.textContent='BUILD 6.0・CASE 01';var box=$('completeText');box.innerHTML='<p>三頁紙在印刷行整理時混進日常廢紙，沿著平常的市場物流離開，最後被舊書攤老闆夾進工具書保存。</p><p>周老闆確實少說了一部分，但現有證據指向的是自保與對人名外流的顧慮，而不是偷竊。市場裡的郵務人員也真的存在；被傳聞補上的，是他的「目的」。</p><p>你把第 21 頁的姓名註記另外遮住。調查不是把所有知道的事情都公開，而是只使用完成案件所必要、且能被證明的部分。</p>'}
function failCase(){state.failed=true;save();hideAll();$('failScreen').classList.remove('hidden');$('caseChip').textContent='CASE 01・FAILED';$('failDetail').textContent='你在本案做出了 '+state.flags.mistakes+' 次無法被案件紀錄支撐的推測。'}
function restart(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}location.reload()}
function loadCase(){var n=load();if(!n){$('bootStatus').textContent='找不到可讀取的案件一存檔。';return}state=n;if(state.finished){finishCase();return}if(state.failed){failCase();return}currentTab='scene';showGame()}
function init(){
 $('startBtn').onclick=showPrologue;$('prologueNext').onclick=nextPrologue;$('loadBtn').onclick=loadCase;
 document.querySelectorAll('.tab-btn').forEach(function(b){b.onclick=function(){setTab(b.dataset.tab)}});
 $('recordEvidenceBtn').onclick=showEvidence;$('recordPeopleBtn').onclick=showPeople;
 $('restartBtn').onclick=function(){if(confirm('確定重新開始案件？目前案件一進度會被清除。'))restart()};
 $('retryBtn').onclick=restart;$('failHomeBtn').onclick=restart;$('homeBtn').onclick=restart;
 $('nextCaseBtn').onclick=function(){toast('案件二：《雨夜敲門》')};
 var old=parse();if(old&&old.caseId==='case1'&&typeof old.name==='string'&&old.name.trim())$('nameInput').value=old.name.trim();
 $('loadBtn').disabled=!load();$('bootStatus').textContent=load()?'可繼續案件一；也可以輸入姓名重新開始。':'固定主角背景：民俗家學調查者。輸入姓名後即可開始。';
}
init();
})();
