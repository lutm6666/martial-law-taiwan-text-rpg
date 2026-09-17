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
 tea:{alt:'1958 年臺北茶行・傍晚',before:'先看看桌上的冊子與周遭。',after:'你注意到冊子攤開在桌面，17、21、22 頁缺失，裝訂處留下連續的斜裂口。',observed:['你把視線從阿川移到桌面。訪談冊攤開著，17、21、22 頁不見了，三處裂口的方向相近。','你把頁碼和裂口形狀記下，接下來可以問阿川冊子最後帶到哪裡，也可以對照缺口前後的內容。']},
 print:{alt:'1958 年臺北印刷行・午後',before:'先看看帳簿、紙堆與工作區。',after:'你看見工作區裡帳簿、鉛字與廢紙各有固定位置，牆邊還留著綁紙用的麻繩。',observed:['你沿著工作桌看了一圈。帳簿放在一側，鉛字盒與紙堆分開，牆邊堆著整理過的廢紙與麻繩。','後間紙捆之間空了一塊，像是最近才有一捆被搬走。']},
 market:{alt:'1958 年臺北市場・白天',before:'先看看攤位、包貨紙與人流。',after:'你看見紙張在市場裡被反覆拿來墊箱、包貨，不少紙已沾上油漬或折痕。',observed:['你沿著攤位慢慢看。墊箱、包花生、包雜貨的紙來源不一，很多已經被折過或撕過。','攤販拿紙時通常不特別分來源，幾張寫過字的紙也混在其中。']},
 bookstall:{alt:'1958 年臺北舊書攤・下午',before:'先看看書堆、夾紙與櫃檯。',after:'你發現幾本工具書比旁邊厚，頁縫裡還露出零散紙角。',observed:['你掃過書攤。幾本工具書明顯比旁邊厚，書頁之間也夾著零散紙片。','櫃檯旁還放著一疊待整理的舊紙，老闆似乎習慣把還能用的紙先留下。']}
};

var evidence={
 missing_index:{name:'缺頁編號',type:'現場紀錄',desc:'訪談冊缺少第 17、21、22 頁，裝訂處留下相連的斜裂痕。'},
 print_ledger:{name:'鉛字盒借用簿',type:'帳目',desc:'阿川十二日借出鉛字盒，歸還欄卻記在十三日。'},
 waste_route:{name:'廢紙去向',type:'流程情報',desc:'印刷行的少量廢紙平常由市場跑腿少年帶走。'},
 zhou_motive:{name:'周老闆的顧慮',type:'證詞',desc:'周老闆真正害怕的是寫有人名的訪談紙從自己店裡流出，替生意與自己惹麻煩。'},
 wrapped_scrap:{name:'包花生的紙角',type:'紙片',desc:'市場找到帶有阿川筆跡與「夜班」字樣的紙角。'},
 runner_account:{name:'紙張交接確認',type:'證詞',desc:'跑腿少年把幾張較完整、寫滿字的紙交給舊書攤老闆。'},
 archive_pages:{name:'三頁失落筆記',type:'關鍵物證',desc:'舊字典裡找到第 17、21、22 頁，裂痕與原冊缺口吻合。'},
 postal_stub:{name:'錯投郵件存根',type:'存根',desc:'市場裡的郵務人員當天在處理錯投地址，存根上的地址與阿川、印刷行都不同。'},
 consent_note:{name:'頁邊鉛筆註記',type:'文字線索',desc:'第 21 頁右側寫著：「受訪者：不要真名。」阿川說這是整理訪談時特別留下的提醒。'}
};
var people={
 achuan:{name:'阿川',desc:'你的舊同學。整理普通人的生活訪談，因此格外在意姓名與來源。'},
 zhou:{name:'周老闆',desc:'印刷行老闆。起初避談寫有人名的廢紙如何流出店外，之後才交代當天收桌流程。'},
 runner:{name:'跑腿少年',desc:'替市場攤商搬貨，也替印刷行帶走少量廢紙。'},
 bookseller:{name:'舊書攤老闆',desc:'會把仍可使用、寫過字的紙暫時夾進舊書保存。'}
};
var locations={
 tea:{name:'茶行',sub:'案件起點',intro:['茶行快打烊了。阿川把一本缺了三頁的訪談冊推到你面前。','他把杯子往旁邊挪開，騰出桌面讓你仔細看冊子。'],actions:['tea_index','tea_ask','tea_compare']},
 print:{name:'印刷行',sub:'油墨與紙堆',intro:['機器剛停，空氣裡仍有油墨味。周老闆正在整理鉛字與紙張。','你走近櫃檯時，他手上的動作慢了一下，目光落在你帶來的冊子上。'],actions:['print_ledger','print_zhou','print_waste']},
 market:{name:'市場',sub:'物流與傳聞',intro:['攤販、搬貨與叫賣聲混在一起。紙在這裡被拿來墊箱、包貨，也常跟著貨物轉手。','不遠處有人提起一名穿制服、四處問地址的人，話頭很快被旁人接了過去。'],actions:['market_stalls','market_runner','market_postman']},
 bookstall:{name:'舊書攤',sub:'紙頁之間',intro:['騎樓深處堆著一排排舊書。幾本工具書的書頁已經發脆。','老闆蹲在櫃檯後整理一疊舊紙，旁邊幾本工具書塞得微微鼓起。'],actions:['book_owner','book_search','book_stub','book_pages']}
};

var prologue=[
 {date:'1958 年 9 月・臺北',title:'收音機沒有停過',html:'<p>城市仍照常上工、上課、做生意。傍晚的店家把鐵門拉下一半，收音機裡的聲音從街角一路飄進騎樓。</p><p class="quote-line">阿川在口信裡只寫了一句：「有三頁紙不見了，能不能過來幫我看看？」</p>'},
 {date:'你家・傍晚',title:'長輩教你的事',html:'<p>家中長輩熟悉地方民俗與科儀。你從小跟在旁邊，看過符式怎麼畫、祭儀怎麼排，也聽過同一件舊事被不同人說成不同模樣。</p><p>久而久之，你習慣把聽到的話和眼前留下的東西一起記下來，再慢慢拼出事情的先後。</p>'},
 {date:'茶行門口',title:'阿川找上你',html:'<p>阿川近來在整理工人、學生、店家與家屬的生活訪談。今天收冊子時，他才發現中間少了三頁。</p><p class="quote-line">「你眼睛細，幫我看看這三頁到底怎麼不見的。」</p><p>你推門進去。桌上已經擺著那本缺頁的冊子。</p>'}
];

var deduction=[
 {q:'第一問：三頁失頁最可能怎麼離開印刷行？',opts:[['steal','有人趁周老闆不注意偷走'],['waste','整理時混進廢紙，被一起帶去市場'],['achuan','阿川故意把三頁交給陌生人']],correct:'waste',need:'wrapped_scrap',teach:'哪一條線索把印刷行和市場接在一起？'},
 {q:'第二問：周老闆一開始為什麼說得含糊？',opts:[['cover','他知道有人偷走筆記，正在掩護對方'],['risk','他怕寫有人名的紙從自己店裡流出去會惹麻煩'],['forget','他完全不記得阿川來過']],correct:'risk',need:'zhou_motive',teach:'回想他在借物簿面前改口時，真正顧忌的是什麼。'},
 {q:'第三問：市場裡的郵務人員與失頁有什麼關係？',opts:[['tracker','他就是在追查阿川的筆記'],['rumor','大家都這樣說，所以應列為主要嫌疑人'],['postal','他當時在處理錯投郵件，存根上的地址另有其處']],correct:'postal',need:'postal_stub',teach:'把攤販轉述和郵件存根放在一起看。'},
 {q:'第四問：哪件證物能直接確認找回的三頁就是原頁？',opts:[['ledger','鉛字盒借用簿'],['pages','三頁失落筆記本身'],['runner','紙張交接確認']],correct:'pages',need:'archive_pages',teach:'把找回的三頁和原冊缺口放在一起比對。'}
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
 tea_index:{label:'檢查缺頁位置',hint:'先確定少了什麼',run:function(){gain('missing_index');return{lines:['你把冊子攤平。第 17、21、22 頁不在，裝訂斷口連成同一條斜線。','三頁的裂口方向相近，像是在相近時間被一起扯離。你把頁碼和裂口形狀記下。']}}},
 tea_ask:{label:'問阿川最後在哪裡用過冊子',hint:'追最後可確認地點',run:function(){know('achuan');unlock('print');return{lines:['阿川說前一晚曾把冊子帶到周老闆的印刷行排字，隔天也回去歸還借用的鉛字盒。','你把「印刷行」標進地圖，準備去問周老闆那晚的情況。']}}},
 tea_compare:{label:'比對缺口前後內容',hint:'確認失頁原本屬於哪段訪談',run:function(){return{lines:['第 16 頁還在談工廠夜班，第 18 頁卻已換了話題。','你記下：失頁至少有一部分原本與夜班訪談相連。三頁原本的內容範圍因此縮小了一些。']}}},
 print_ledger:{label:'查看借物簿',hint:'用帳目固定日期',run:function(){gain('print_ledger');return{lines:['借物簿記著：十二日借出鉛字盒，十三日歸還。前後欄位、流水號與墨色連續。','十二、十三日兩筆登記前後相連。你記下十三日，準備拿這個日期追問周老闆。']}}},
 print_zhou:{label:'用帳目追問周老闆',hint:'分清隱瞞與惡意',requires:['print_ledger'],run:function(){know('zhou');gain('waste_route');gain('zhou_motive');unlock('market');return{lines:['你把借物簿轉向周老闆。他沉默後承認：十三日收桌時，一捆廢紙照平常流程交給市場跑腿少年。','他真正顧忌的是那些紙上寫著人名。承認紙從自己店裡流出去，可能替生意與自己惹麻煩。','市場被標進地圖。']}}},
 print_waste:{label:'檢查廢紙處理方式',hint:'看看平常怎麼處理廢紙',dynamic:true,run:function(){return{lines:has('waste_route')?['後間少了一捆紙，牆邊留下的麻繩與竹籃都顯示這不是第一次往市場送廢紙。','麻繩、竹籃和缺掉的紙捆位置對得上，這批廢紙平常就是這樣被送出後間。']:['後間紙捆之間空了一塊，但周老闆現在只肯說「處理掉了」。','你記下紙捆空位的位置。周老闆只說「處理掉了」，借物簿也許能把日期對上。'],complete:has('waste_route')}}},
 market_stalls:{label:'沿攤位找被拿來包貨的紙',hint:'找實物流向',run:function(){gain('wrapped_scrap');return{lines:['花生攤腳邊壓著一小角較白的紙。末尾還看得見「夜班」兩字，筆跡與阿川的冊子一致。','印刷行的紙確實進了市場。現在可以拿這個具體特徵去問跑腿少年。']}}},
 market_runner:{label:'找跑腿少年問那捆紙',hint:'用紙角喚回具體記憶',requires:['wrapped_scrap'],run:function(){know('runner');gain('runner_account');unlock('bookstall');return{lines:['少年看過紙角後想起那一捆。大多數紙拿去墊箱，幾張完整、寫滿字的紙，他覺得拿來包吃的東西不妥，就交給舊書攤老闆。','舊書攤被標進地圖。']}}},
 market_postman:{label:'追查「穿制服的人四處問地址」',hint:'拆開目擊與傳聞',run:function(){state.flags.postmanRumor=true;return{lines:['第一個人只看見郵務制服；第二個人記得他問過地址；傳到第三個人口中，已經變成「在找阿川的紙」。','三個人口中的細節越傳越多。你記下制服和問地址這兩件最早出現的資訊，打算再找當天留下的郵務紀錄。']}}},
 book_owner:{label:'詢問老闆收紙經過',hint:'確認交接是否為第一手',requires:['runner_account'],run:function(){know('bookseller');return{lines:['老闆確認，是跑腿少年親手把幾張完整紙交給他。','「寫滿字的紙拿來包吃的，我看了不舒服，就先夾著。」他的說法和少年能互相核對。']}}},
 book_search:{label:'翻找夾過紙的舊工具書',hint:'找能與原冊直接比對的紙',requires:['runner_account'],run:function(){gain('archive_pages');return{lines:['一本破字典中段明顯厚了一截。三張摺過的紙從書脊旁滑出來：17、21、22。','裂痕與阿川冊上的缺口正好接回去。']}}},
 book_stub:{label:'核對櫃檯下的郵件存根',hint:'檢驗市場傳聞',run:function(){gain('postal_stub');return{lines:[state.flags.postmanRumor?'老闆找到一張錯投郵件存根。昨天那名郵務人員是在確認送錯巷口的地址。':'櫃檯下夾著一張錯投郵件存根；老闆想起昨天確實有郵務人員來確認地址。','存根上的地址在另一條巷子，收件人姓陳，和阿川、印刷行的人都對不上。市場裡那段傳聞至此有了另一個來源。']}}},
 book_pages:{label:'仔細閱讀找回的三頁',hint:'結案前確認紙上的人',requires:['archive_pages'],run:function(){gain('consent_note');state.flags.deductionReady=true;return{lines:['你把三頁按頁碼排好。第 21 頁右側有一行很淡的鉛筆字：「受訪者：不要真名。」','阿川看到那行鉛筆字，立刻把第 21 頁收近一些。你在自己的紀錄上只寫「受訪者」，把原名留在原頁裡。','推理頁面已開放。']}}}
};

function renderMap(){var grid=$('mapGrid');grid.innerHTML='';Object.keys(locations).forEach(function(id){var l=locations[id],open=state.unlocked.indexOf(id)>=0,b=document.createElement('button');b.className='map-btn'+(state.visited.indexOf(id)>=0?' visited':'')+(open?'':' locked');b.disabled=!open;b.innerHTML='<strong>'+l.name+'</strong><small>'+(open?l.sub:'尚未取得前往線索')+'</small>';b.onclick=function(){state.location=id;if(state.visited.indexOf(id)<0)state.visited.push(id);state.flags.lastResult=null;save();setTab('scene')};grid.appendChild(b)})}
function renderRecords(){var ev=$('evidenceGrid'),pp=$('peopleGrid');ev.innerHTML='';pp.innerHTML='';if(!state.evidence.length)ev.innerHTML='<div class="evidence-card"><strong>尚無案件紀錄</strong><small>可核對的物證、文件與證詞會收在這裡。</small></div>';state.evidence.forEach(function(id){var e=evidence[id],d=document.createElement('div');d.className='evidence-card';d.innerHTML='<strong>'+e.name+'</strong><small>'+e.desc+'</small><span class="tag">'+e.type+'</span>';ev.appendChild(d)});if(!state.people.length)pp.innerHTML='<div class="person-card"><strong>尚無人物紀錄</strong><small>與案件相關的人會在交談後加入。</small></div>';state.people.forEach(function(id){var p=people[id],d=document.createElement('div');d.className='person-card';d.innerHTML='<strong>'+p.name+'</strong><small>'+p.desc+'</small>';pp.appendChild(d)});$('evidenceCount').textContent=state.evidence.length}
function showEvidence(){renderRecords();$('evidenceSection').classList.remove('hidden');$('peopleSection').classList.add('hidden');$('recordEvidenceBtn').classList.add('active');$('recordPeopleBtn').classList.remove('active')}
function showPeople(){renderRecords();$('peopleSection').classList.remove('hidden');$('evidenceSection').classList.add('hidden');$('recordPeopleBtn').classList.add('active');$('recordEvidenceBtn').classList.remove('active')}
function loseFocus(msg){state.focus=Math.max(0,state.focus-1);state.flags.mistakes++;state.flags.deductionFeedback=msg;save();renderFocus();if(state.focus<=0){failCase();return}renderDeduction()}
function renderDeduction(){var box=$('deductionBox');box.innerHTML='';if(!state.flags.deductionReady){box.innerHTML='<h2>推理尚未開放</h2><p>先找到三頁失落筆記並仔細閱讀。</p><div class="method-note"><strong>手上的線索</strong><br>目前還差找回三頁筆記，推理會在那之後開放。</div>';return}var step=deduction[state.deductionStep];if(!step){finishCase();return}box.innerHTML='<h2>'+step.q+'</h2><p>選一個你認為最符合目前線索的說法，再挑出最關鍵的紀錄。</p><div class="method-note">'+step.teach+'</div><div class="failure-warning">選錯推論會消耗推理專注。</div>';var opts=document.createElement('div');opts.className='deduction-options';step.opts.forEach(function(pair){var b=document.createElement('button');b.className='deduction-option';b.innerHTML='<strong>'+pair[1]+'</strong>';b.onclick=function(){if(pair[0]!==step.correct){loseFocus('這個說法和你目前找到的線索對不上。');return}renderEvidencePicker(step)};opts.appendChild(b)});box.appendChild(opts);if(state.flags.deductionFeedback){var f=document.createElement('div');f.className='feedback';f.textContent=state.flags.deductionFeedback;box.appendChild(f)}}
function renderEvidencePicker(step){var box=$('deductionBox');if(!has(step.need)){box.innerHTML='<h2>還缺少直接證據</h2><p>推論方向可能合理，但目前沒有能直接支撐它的紀錄。</p><button class="deduction-option" id="backInvestigate"><strong>回到調查</strong></button>';$('backInvestigate').onclick=function(){setTab('scene')};return}box.innerHTML='<h2>提出證物</h2><p>哪一件已取得的案件紀錄最能直接支撐剛才的推論？</p>';var opts=document.createElement('div');opts.className='deduction-options';state.evidence.forEach(function(id){var e=evidence[id],b=document.createElement('button');b.className='deduction-option';b.innerHTML='<strong>'+e.name+'</strong><small>'+e.type+'</small>';b.onclick=function(){if(id!==step.need){loseFocus('這件紀錄和剛才的推論連得不夠直接。');return}state.deductionStep++;state.flags.deductionFeedback='';save();toast('推理成立');renderDeduction()};opts.appendChild(b)});box.appendChild(opts)}
function finishCase(){state.finished=true;save();hideAll();$('completeScreen').classList.remove('hidden');$('caseChip').textContent='CASE 01・CLOSED';var build=document.querySelector('.build');if(build)build.textContent='BUILD 6.0・CASE 01';var box=$('completeText');box.innerHTML='<p>三頁紙在印刷行整理時混進日常廢紙，沿著平常的市場物流離開，最後被舊書攤老闆夾進工具書保存。</p><p>周老闆一開始少說了那捆廢紙的去向，原因是紙上寫著人名，他擔心從店裡流出去會惹麻煩。市場裡那名郵務人員當天則在處理錯投地址，後來的轉述把他和失頁扯到了一起。</p><p>你把第 21 頁的原名遮住，只在整理好的紀錄上寫「受訪者」。阿川把三頁重新夾回冊子，準備另做一份匿名抄本。</p>'}
function failCase(){state.failed=true;save();hideAll();$('failScreen').classList.remove('hidden');$('caseChip').textContent='CASE 01・FAILED';$('failDetail').textContent='你在本案做出了 '+state.flags.mistakes+' 次錯誤推論。'}
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
