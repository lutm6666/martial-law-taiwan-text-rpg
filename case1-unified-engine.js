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
 tea:{alt:'1958 年臺北茶行・傍晚',before:'先看一眼桌面和阿川留下的冊子。',after:'冊子顯然已被反覆翻看；桌上的冷茶、鉛筆與便條都還停在阿川剛才整理的位置。',observed:['你先沒有去碰那些缺口，只把桌上的東西看了一遍。茶早已冷透，鉛筆擱在冊子旁，幾張便條壓著翻得發毛的紙角。','阿川顯然已經來回檢查過很多次。真正值得細看的不是桌面有多亂，而是那些被抽走的頁到底留下了什麼痕跡。']},
 print:{alt:'1958 年臺北印刷行・午後',before:'先看印刷行怎麼運作，不急著追任何一捆紙。',after:'工作桌、鉛字盒與借物簿各有固定位置；後間則比前場更雜，像是所有暫時用不到的東西都先往裡放。',observed:['你先沿著排字桌走了一圈。鉛字盒一格格靠牆排開，紙張按大小壓在桌角，借物簿則壓在玻璃底下。','周老闆收東西很有順序：能歸位的都歸位，暫時說不清用途的才往後間送。要追失頁，得把某一天的流程拆開來看。']},
 market:{alt:'1958 年臺北市場・白天',before:'先看人和貨怎麼流動，再決定從哪一攤追紙。',after:'人、貨與包材不停換手；紙一旦進了市場，很快就混進日常交易裡。',observed:['你站在市場口看了一會。菜籃、木箱、秤盤在人群間不斷移動，攤販說話時手也沒停，收錢、找零、包貨幾乎同時進行。','紙在這裡只是眾多耗材之一。真正要找的不是「哪裡有紙」，而是哪一張紙保留了能和阿川冊子對上的特徵。']},
 bookstall:{alt:'1958 年臺北舊書攤・下午',before:'先看看攤位的格局和老闆平常怎麼收書。',after:'書架又深又密，工具書、舊報與零散收購品混在同一個狹窄空間；光靠第一眼很難知道紙被放去了哪裡。',observed:['你沒有立刻翻書，只先把攤位看了一圈。靠街的一側較亮，裡面幾排書架越往下越暗，櫃檯後還堆著尚未分類的收購品。','老闆知道每一類書大概在哪裡，卻不會替零散紙張另外編位置。要找跑腿少年帶來的東西，還是得先問他當時怎麼處理。']}
};

var evidence={
 missing_index:{name:'缺頁編號',type:'現場紀錄',images:['assets/case1/evidence01.png','assets/case1/evidence02.png'],desc:'第 17、21、22 頁遭抽離；殘留紙根的裂向近似，21、22 頁位置形成連續缺口。'},
 print_ledger:{name:'借物簿',type:'帳目',images:['assets/case1/evidence03.png'],desc:'借物簿記載阿川十二日借出鉛字盒，十三日歸還；前後欄位與墨色連續。'},
 waste_route:{name:'廢紙去向',type:'流程情報',desc:'周老闆承認十三日收桌時有一捆廢紙交給市場跑腿少年，這也是店裡平常的處理方式。'},
 zhou_motive:{name:'周老闆的顧慮',type:'證詞',desc:'周老闆說自己避談廢紙去向，是因為那些紙上可能留著受訪者姓名，他怕事情從自己店裡惹出去。'},
 wrapped_scrap:{name:'包花生的紙角',type:'紙片',images:['assets/case1/evidence04.png'],desc:'花生攤找到一角較白的紙，殘留「夜班」二字；筆跡與阿川的訪談冊相符。'},
 runner_account:{name:'紙張交接確認',type:'證詞',desc:'跑腿少年說，多數廢紙拿去墊箱；幾張寫滿字、較完整的紙則被他交給舊書攤老闆。'},
 archive_pages:{name:'三頁失落筆記',type:'關鍵物證',images:['assets/case1/evidence05.png'],desc:'舊字典裡找到第 17、21、22 頁；頁碼、筆跡與紙根裂口都能與原冊對回。'},
 postal_stub:{name:'問路地址便條',type:'便條',images:['assets/case1/evidence07.png'],desc:'舊書攤老闆順手抄下「陳先生」與另一條巷子的門牌；他記得郵務人員前一天下午曾來問這個地址。'},
 consent_note:{name:'頁邊鉛筆註記',type:'文字線索',images:['assets/case1/evidence06.png'],desc:'第 21 頁右側有阿川的鉛筆註記：「受訪者：不要真名。」'}
};
var people={
 achuan:{name:'阿川',desc:'你的舊同學。近來替普通人做生活訪談，說話快，寫字更快；但提到受訪者姓名時總會先停一下。'},
 zhou:{name:'周老闆',desc:'印刷行老闆。熟悉阿川，也熟悉哪些紙可以當廢紙、哪些紙上的字會替人惹麻煩。'},
 runner:{name:'跑腿少年',desc:'替市場攤商搬貨，也替印刷行帶廢紙。每天走同幾條巷子，對紙張去向的記憶比對人名更清楚。'},
 bookseller:{name:'舊書攤老闆',desc:'收舊書也收能再利用的紙。覺得寫滿字的紙拿來包吃食不妥，便常順手夾進工具書裡。'}
};
var locations={
 tea:{name:'茶行',sub:'案件起點',intro:['茶行快打烊了。半扇鐵門已經拉下來，街上的光從門縫斜切進桌面。阿川沒有碰眼前那杯茶，只把一本線裝訪談冊推到你手邊。','「我下午整理才發現少了三頁。」他壓低聲音。冊子裡夾著幾張便條，邊角被翻得發毛；真正空掉的地方卻很乾淨。'],actions:['tea_index','tea_ask','tea_compare']},
 print:{name:'印刷行',sub:'油墨與紙堆',intro:['最後一聲鉛字碰撞剛停，店裡還浮著油墨、紙灰與熱機器混在一起的味道。周老闆正把鉛字歸回格子，你一進門，他先看見你手裡的冊子。','「阿川叫你來的？」他擦了擦手，語氣很平，動作卻慢了一拍。後間比前場昏暗，紙堆與工具靠牆塞得很滿，單看一眼分不出哪一樣和失頁有關。'],actions:['print_ledger','print_zhou','print_waste']},
 market:{name:'市場',sub:'物流與傳聞',intro:['市場正是最吵的時候。菜販叫價、腳踏車鈴、木箱落地的聲音混成一片；在這裡，紙很少只做一次紙。','你才走過兩排攤位，就聽見有人提起昨天那個「穿制服、到處問地址的人」。一句話從魚攤傳到花生攤，細節也跟著多了一層。'],actions:['market_stalls','market_runner','market_postman']},
 bookstall:{name:'舊書攤',sub:'紙頁之間',intro:['騎樓深處比街上暗一截。書架從地面一路疊到肩高，舊紙受潮後特有的氣味混著樟腦味。','老闆正坐在櫃檯後整理一疊剛收來的舊書。你提到跑腿少年，他手上的動作停了一下：「昨天是有個孩子來過。」'],actions:['book_owner','book_search','book_stub','book_pages']}
};

var prologue=[
 {date:'1958 年 9 月・臺北',title:'傍晚的口信',html:'<p>天色剛沉，街上的店家一間間把鐵門拉下一半。收音機從茶行、理髮店、雜貨舖裡各自傳出不同節目，聲音疊在騎樓下，誰也沒有特別去聽清楚。</p><p>阿川的口信就是這時送到的。紙條折得很窄，只寫了一句：</p><p class="quote-line">「我少了三頁訪談稿。你有空的話，過來幫我看一眼。」</p>'},
 {date:'你家・傍晚',title:'長輩留下的習慣',html:'<p>你家裡的人懂地方科儀。小時候跟在長輩身邊，你看過同一場祭儀被三個人說成三種來歷，也看過一個禁忌在幾年裡越講越完整，完整得像真的發生過。</p><p>長輩從不急著拆穿誰，只會把香案、時辰、做法和每個人的說法分開記。久了，你也養成同樣的習慣：先把留下來的東西擺在一起，再看故事是從哪裡長出來的。</p>'},
 {date:'茶行門口',title:'缺掉的三頁',html:'<p>阿川近來在替工人、學生、店家與家屬做生活訪談。那些筆記很碎，薪水、夜班、家裡的事、街坊閒話，全都擠在同一本冊子裡。</p><p>今晚，他把冊子留在最裡面的桌上等你。茶已經冷了，缺頁的位置卻一眼就看得出來。</p><p class="quote-line">「我想不起來是在哪裡少的。你幫我從頭看。」</p>'}
];

var deduction=[
 {q:'第一問：三頁紙是怎麼離開印刷行的？',opts:[['steal','有人趁周老闆不注意偷走'],['waste','收桌時混進廢紙，被一起帶到市場'],['achuan','阿川自己把三頁交給了陌生人']],correct:'waste',need:'wrapped_scrap',teach:'把印刷行後間、跑腿少年的路線和市場裡那張紙角接起來。'},
 {q:'第二問：周老闆為什麼一開始避談那捆廢紙？',opts:[['cover','他知道有人偷紙，正在替對方遮掩'],['risk','他怕寫著人名的紙從自己店裡流出去惹麻煩'],['forget','他其實完全不記得阿川來過']],correct:'risk',need:'zhou_motive',teach:'想想他真正停頓的是「阿川來過」還是「紙上寫了什麼」。'},
 {q:'第三問：市場裡那名郵務人員當天在找什麼？',opts:[['tracker','阿川遺失的訪談筆記'],['rumor','市場裡傳聞的可疑文件'],['postal','另一條巷子的陳姓收件人']],correct:'postal',need:'postal_stub',teach:'把市場裡的轉述和便條上的姓氏、巷址放在一起。'},
 {q:'第四問：哪一件東西能把找回的紙和原冊直接接回去？',opts:[['ledger','借物簿'],['pages','找回的三頁筆記'],['runner','跑腿少年的說法']],correct:'pages',need:'archive_pages',teach:'頁碼、筆跡和裂口都在同一件物證上。'}
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
 tea_index:{label:'檢查缺頁位置',hint:'看看紙是怎麼離開冊子的',run:function(){gain('missing_index');return{lines:['你把線裝冊攤平，用指腹壓住翻翹的紙角。第 17 頁只剩一道斜斜的紙根；往後翻到 21、22 頁，缺口更寬，兩頁像是連著被扯走。','阿川原先用鉛筆寫下的頁碼還在。你把三個缺口的方向和位置抄進自己的筆記，順手畫了小圖。']}}},
 tea_ask:{label:'問阿川最後在哪裡用過冊子',hint:'把冊子最後幾次移動排出來',run:function(){know('achuan');unlock('print');return{lines:['阿川皺著眉想了一會兒。前一晚，他把冊子帶去周老闆的印刷行，挑幾段訪談試排；第二天又回去歸還借來的鉛字盒。','「回茶行以後我就塞進抽屜，今天下午才重翻。」他說。你在紙上寫下兩個時間點，把「印刷行」圈了起來。']}}},
 tea_compare:{label:'比對缺口前後內容',hint:'看看三頁原本夾在哪些訪談裡',run:function(){return{lines:['第 16 頁還在記一名女工的夜班，第 18 頁已接到工資與輪班；第 20 頁末尾換成另一段訪談開頭，23 頁則已是別人的家務瑣事。','三個缺頁不屬於同一段完整文章，卻都出現在阿川最近整理、準備排字的幾組訪談之間。你把「夜班」兩字特別畫了一道線。']}}},
 print_ledger:{label:'查看借物簿',hint:'把阿川來店裡的日期對清楚',run:function(){gain('print_ledger');return{lines:['玻璃底下的借物簿沾著指印。十二日那欄寫著「川：鉛字盒一只」，十三日的歸還欄又有一筆同樣的名字；上下幾筆字跡、墨色都連得起來。','周老闆站在旁邊沒催你。你把十三日抄下來，再抬頭時，他已經把擦手布折了兩次。']}}},
 print_zhou:{label:'拿借物簿追問周老闆',hint:'問清十三日收桌後發生了什麼',requires:['print_ledger'],run:function(){know('zhou');gain('waste_route');gain('zhou_motive');unlock('market');return{lines:['你把借物簿轉過去，手指停在十三日。周老闆盯著那一格很久，才說那天收桌時確實清過一批紙：試印、裁邊、寫錯的便條，全綁成一捆，照平常交給替市場跑腿的少年。','你問他為什麼剛才只說「不知道」。他把聲音壓低：「那些紙有名字。要是從我店裡出去，又有人拿去亂傳，最後誰來說得清？」','他沒有再往下辯。只告訴你那孩子下午多半在市場北口一帶。']}}},
 print_waste:{label:'檢查廢紙怎麼被送出去',hint:'看看後間留下的痕跡',dynamic:true,run:function(){return{lines:has('waste_route')?['你到後間重新看那個空位。竹籃底沾著紙灰，麻繩長度正好夠綁一捆四開紙；後門門檻還卡著幾小片被拖碎的白紙。','周老闆說，跑腿少年通常連竹籃一起提走，傍晚再空手送回。眼前這些痕跡和他說的日常流程對得上。']:['後間紙堆中間缺了一捆，竹籃擺在靠門的位置，麻繩卻還沒收好。你蹲下看見門檻卡著幾片新鮮紙屑。','「昨天清過一次。」周老闆只答這一句，隨即轉身去收鉛字。桌上的借物簿或許能把這個「昨天」釘得更準。'],complete:has('waste_route')}}},
 market_stalls:{label:'沿攤位找被拿來包貨的紙',hint:'先追紙，不追傳聞',run:function(){gain('wrapped_scrap');return{lines:['你從菜攤一路看到花生攤。木箱底下塞著報紙，秤盤旁的紙已被油浸透；只有一張被壓在竹簍腳邊的白紙顏色比較新。','你抽出露在外面的紙角。上頭只剩半行字，末尾兩個字還看得清楚——「夜班」。墨水與阿川冊子裡的一樣偏淡，筆勢也熟悉。']}}},
 market_runner:{label:'拿紙角問跑腿少年',hint:'讓他從實物回想那捆紙',requires:['wrapped_scrap'],run:function(){know('runner');gain('runner_account');unlock('bookstall');return{lines:['少年先認出的是紙，不是字。「周老闆那一捆？」他把紙角翻過來看了兩次。大部分廢紙被攤販拿去墊箱、包貨；其中幾張寫得密密麻麻，他嫌拿來包花生難看，就另外抽了出來。','「我給舊書攤的伯仔了。他什麼紙都留。」少年朝騎樓另一頭比了比。你順著他的手勢，在地圖上多標了一個位置。']}}},
 market_postman:{label:'問清「穿制服的人」',hint:'把每個人真正看見的部分分開',run:function(){state.flags.postmanRumor=true;return{lines:['魚販只記得那人穿郵務制服；隔壁攤主記得他拿著一張紙問巷名；到了第三個人口中，已經變成「那個郵差在找阿川丟掉的東西」。','你請三個人各自重說一次，不替前一個人補細節。留下來的共同部分其實很少：郵務制服、問地址、昨天午後。舊書攤離這裡不遠，也許有人記得他當時問的是哪個地址。']}}},
 book_owner:{label:'問老闆那幾張紙怎麼來的',hint:'把跑腿少年的說法接上',requires:['runner_account'],run:function(){know('bookseller');return{lines:['老闆聽你形容紙角，從鼻子裡「嗯」了一聲。「是那孩子拿來的。幾張寫滿字，我看拿去包吃的不好，就先塞書裡。」','他想不起頁碼，卻記得紙很薄、折過一次，而且其中一張邊上有鉛筆字。這和跑腿少年說的幾張完整紙接得起來。']}}},
 book_search:{label:'翻找夾過紙的工具書',hint:'從書脊和厚度找異常',requires:['runner_account'],run:function(){gain('archive_pages');return{lines:['你從最下層開始抽書。一本舊字典在「工」字部附近鼓得特別明顯，書脊也被撐開一點。你把它平放在櫃檯上，三張對折的紙從頁間滑了出來。','17、21、22。阿川的字、阿川的頁碼。你把紙邊貼回冊子缺口旁，幾處斜裂像拼圖一樣接上。老闆在旁邊看了一眼，沒有說話。']}}},
 book_stub:{label:'查看櫃檯下的地址便條',hint:'看看昨天那名郵務人員問的是哪個地址',run:function(){gain('postal_stub');return{lines:[state.flags.postmanRumor?'老闆聽你提到那名郵務人員，從櫃檯下抽出一張折過的小紙片：「昨天他問一個陳先生住哪裡，我怕自己講錯路，就順手把名字和門牌抄下來了。」':'你在櫃檯下看見一張折過的小紙片。老闆想了一會兒，說昨天有名郵務人員來問路；他怕自己記錯，便把對方口中的收件人和門牌順手抄在廢紙上。','便條上只有「陳先生」和一個不同巷子的門牌。上頭沒有阿川、茶行或印刷行的名字。市場裡越傳越大的那段話，到這裡只剩下一個普通的問路地址。']}}},
 book_pages:{label:'仔細讀找回的三頁',hint:'看看紙上除了正文還留下什麼',requires:['archive_pages'],run:function(){gain('consent_note');state.flags.deductionReady=true;return{lines:['你把三頁按順序攤開。第 21 頁右側有一行幾乎被手掌磨淡的鉛筆字：「受訪者：不要真名。」','阿川看到那行字，先是愣了一下，接著把頁面往自己這邊收近。「這個我記得。她特別交代的。」','你在自己的索引上只寫「受訪者」，把原名留在原稿裡。三頁找回來了，接下來才輪到把整條路徑重新拼一次。']}}}
};

function renderMap(){var grid=$('mapGrid');grid.innerHTML='';Object.keys(locations).forEach(function(id){var l=locations[id],open=state.unlocked.indexOf(id)>=0,b=document.createElement('button');b.className='map-btn'+(state.visited.indexOf(id)>=0?' visited':'')+(open?'':' locked');b.disabled=!open;b.innerHTML='<strong>'+l.name+'</strong><small>'+(open?l.sub:'尚未取得前往線索')+'</small>';b.onclick=function(){state.location=id;if(state.visited.indexOf(id)<0)state.visited.push(id);state.flags.lastResult=null;save();setTab('scene')};grid.appendChild(b)})}
function evidenceMedia(e){if(!e.images||!e.images.length)return '';return '<div class="evidence-media'+(e.images.length>1?' multi':'')+'">'+e.images.map(function(src,i){return '<img src="'+src+'?v=1" alt="'+e.name+(e.images.length>1?'・'+(i+1):'')+'" loading="lazy">'}).join('')+'</div>'}
function renderRecords(){var ev=$('evidenceGrid'),pp=$('peopleGrid');ev.innerHTML='';pp.innerHTML='';if(!state.evidence.length)ev.innerHTML='<div class="evidence-card"><strong>尚無案件紀錄</strong><small>可核對的物證、文件與證詞會收在這裡。</small></div>';state.evidence.forEach(function(id){var e=evidence[id],d=document.createElement('div');d.className='evidence-card';d.innerHTML='<strong>'+e.name+'</strong><small>'+e.desc+'</small>'+evidenceMedia(e)+'<span class="tag">'+e.type+'</span>';ev.appendChild(d)});if(!state.people.length)pp.innerHTML='<div class="person-card"><strong>尚無人物紀錄</strong><small>與案件相關的人會在交談後加入。</small></div>';state.people.forEach(function(id){var p=people[id],d=document.createElement('div');d.className='person-card';d.innerHTML='<strong>'+p.name+'</strong><small>'+p.desc+'</small>';pp.appendChild(d)});$('evidenceCount').textContent=state.evidence.length}
function showEvidence(){renderRecords();$('evidenceSection').classList.remove('hidden');$('peopleSection').classList.add('hidden');$('recordEvidenceBtn').classList.add('active');$('recordPeopleBtn').classList.remove('active')}
function showPeople(){renderRecords();$('peopleSection').classList.remove('hidden');$('evidenceSection').classList.add('hidden');$('recordPeopleBtn').classList.add('active');$('recordEvidenceBtn').classList.remove('active')}
function loseFocus(msg){state.focus=Math.max(0,state.focus-1);state.flags.mistakes++;state.flags.deductionFeedback=msg;save();renderFocus();if(state.focus<=0){failCase();return}renderDeduction()}
function renderDeduction(){var box=$('deductionBox');box.innerHTML='';if(!state.flags.deductionReady){box.innerHTML='<h2>還拼不完整</h2><p>三頁紙的去向還沒走到盡頭。先把它們找回來，再回頭整理整條路徑。</p><div class="method-note"><strong>目前缺的那一塊</strong><br>找到失頁本身，看看紙上還留下哪些能和前面線索接起來的細節。</div>';return}var step=deduction[state.deductionStep];if(!step){finishCase();return}box.innerHTML='<h2>'+step.q+'</h2><p>把一路記下來的物件、時間和說法排在一起，選出最能把它們接成一條線的解釋。</p><div class="method-note">'+step.teach+'</div><div class="failure-warning">選錯推論會消耗推理專注。</div>';var opts=document.createElement('div');opts.className='deduction-options';step.opts.forEach(function(pair){var b=document.createElement('button');b.className='deduction-option';b.innerHTML='<strong>'+pair[1]+'</strong>';b.onclick=function(){if(pair[0]!==step.correct){loseFocus('這條說法接不上你手裡的幾個關鍵細節。');return}renderEvidencePicker(step)};opts.appendChild(b)});box.appendChild(opts);if(state.flags.deductionFeedback){var f=document.createElement('div');f.className='feedback';f.textContent=state.flags.deductionFeedback;box.appendChild(f)}}
function renderEvidencePicker(step){var box=$('deductionBox');if(!has(step.need)){box.innerHTML='<h2>還缺少直接證據</h2><p>推論方向可能合理，但目前沒有能直接支撐它的紀錄。</p><button class="deduction-option" id="backInvestigate"><strong>回到調查</strong></button>';$('backInvestigate').onclick=function(){setTab('scene')};return}box.innerHTML='<h2>提出證物</h2><p>哪一件已取得的案件紀錄最能直接支撐剛才的推論？</p>';var opts=document.createElement('div');opts.className='deduction-options';state.evidence.forEach(function(id){var e=evidence[id],b=document.createElement('button');b.className='deduction-option';b.innerHTML='<strong>'+e.name+'</strong><small>'+e.type+'</small>';b.onclick=function(){if(id!==step.need){loseFocus('這件紀錄很重要，但不是剛才那個推論最關鍵的一環。');return}state.deductionStep++;state.flags.deductionFeedback='';save();toast('推理成立');renderDeduction()};opts.appendChild(b)});box.appendChild(opts)}
function finishCase(){state.finished=true;save();hideAll();$('completeScreen').classList.remove('hidden');$('caseChip').textContent='CASE 01・CLOSED';var build=document.querySelector('.build');if(build)build.textContent='BUILD 6.0・CASE 01';var box=$('completeText');box.innerHTML='<p>三頁紙沒有被藏進什麼祕密地方。它們在印刷行收桌時混進廢紙，跟著竹籃到了市場；一部分紙被拿去墊箱、包貨，寫得較滿的幾張則被跑腿少年抽出來，最後夾進舊書攤的一本字典。</p><p>周老闆確實把那一段省掉了。他怕的不是阿川，而是紙上的人名從自己店裡流出去，日後有人循著那些字找回說話的人。至於市場裡那個越傳越可疑的郵務人員，最後只剩下一張老闆順手抄下的問路地址：另一條巷子、另一個姓陳的收件人。</p><p>回到茶行時，阿川把三頁一張張放回原位。第 21 頁的原名被另外覆住，索引只留下「受訪者」三個字。冊子重新完整了，卻和失去那三頁以前不太一樣——你們現在知道，一份紀錄除了記下別人的話，也會把別人的生活一起帶在身上。</p><p>阿川闔上冊子，外頭的鐵門正一扇扇落下。你忽然覺得，找回三頁紙其實是最短的那一段路。</p>'}
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
