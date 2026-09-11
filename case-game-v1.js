(()=>{'use strict';
const SAVE_KEY='mist-taiwan-case-save-v1';
const roles={
 student:{label:'學生',desc:'擅長閱讀與比對文字；書面資料中較容易發現額外細節。'},
 worker:{label:'工人',desc:'熟悉勞動現場；和搬運、跑腿與工廠人物交談時較容易建立信任。'},
 clerk:{label:'公務員',desc:'熟悉帳目與流程；能從日期、欄位與行政紀錄看出不一致。'},
 reporter:{label:'記者',desc:'擅長追問來源與矛盾；部分人物會更戒備，但也會露出更多破綻。'},
 teacher:{label:'教師',desc:'較容易讓學生與年輕人願意把事情說完整。'},
 merchant:{label:'商人',desc:'熟悉貨物流向與日常交易；市場與帳目場景有額外觀察。'},
 veteran:{label:'退伍軍人',desc:'在緊張情況下較能把眼前事實與最壞猜測分開。'},
 homemaker:{label:'持家者',desc:'熟悉街坊與日常網絡；市場和家庭場合較容易聽見旁人忽略的資訊。'}
};
const evidence={
 missing_index:{name:'缺頁編號',type:'筆記',desc:'阿川的訪談冊缺了第 17、21、22 頁。頁邊殘留被整疊抽走時形成的斜裂痕。'},
 print_ledger:{name:'鉛字盒借用簿',type:'帳目',desc:'印刷行借物簿記著：九月十二日，阿川借用一只鉛字盒；歸還欄卻寫在隔天。'},
 waste_route:{name:'廢紙去向',type:'情報',desc:'周老闆承認，店裡每隔幾天會把廢紙交給市場跑腿少年帶走，拿去包貨或墊箱。'},
 wrapped_scrap:{name:'包花生的紙角',type:'紙片',desc:'市場攤位找到的紙角有阿川熟悉的筆跡，末尾還能看見「夜班」兩字。紙張與缺頁冊相同。'},
 runner_account:{name:'少年說法',type:'證詞',desc:'少年記得那天從印刷行帶走一捆廢紙，後來把比較完整的幾張交給舊書攤老闆，因為老闆不喜歡拿有字的紙包食物。'},
 archive_pages:{name:'三頁失落筆記',type:'關鍵證物',desc:'在舊書攤一本破字典裡找到的三頁紙。頁碼正是 17、21、22，裂痕也與阿川冊上的缺口吻合。'},
 postal_stub:{name:'錯投郵件存根',type:'存根',desc:'舊書攤老闆留下的郵件存根。地址與印刷行、阿川都無關，能解釋市場裡那名四處問地址的郵務人員。'},
 consent_note:{name:'頁邊鉛筆註記',type:'文字線索',desc:'第 21 頁邊緣寫著：「秋月：不要真名。」這不是案情答案，卻讓你意識到找回紙張之後還有另一個問題。'}
};
const people={
 achuan:{name:'阿川',desc:'你的舊同學。正在整理工廠、校園與普通人的訪談紀錄。'},
 meihui:{name:'美惠',desc:'與阿川相熟，擅長把零碎時間與人物關係整理清楚。'},
 zhou:{name:'周老闆',desc:'小印刷行老闆。起初對阿川是否來過說得很含糊。'},
 runner:{name:'跑腿少年',desc:'替市場攤商搬貨，也偶爾替印刷行帶走廢紙。'},
 bookseller:{name:'舊書攤老闆',desc:'會把還能用的紙夾進舊書裡保存，不喜歡直接丟掉寫過字的紙。'}
};
const locations={
 tea:{name:'茶行',sub:'案件起點',intro:'茶行已經快打烊。阿川把一本缺了三頁的訪談冊推到你面前，桌上還散著幾張沒有整理完的剪報。',actions:['tea_index','tea_ask','tea_compare']},
 print:{name:'印刷行',sub:'油墨與紙堆',intro:'機器剛停，空氣裡還有油墨味。周老闆一邊收鉛字，一邊說自己「不太記得」阿川那天到底做過什麼。',actions:['print_ledger','print_zhou','print_waste','print_role']},
 market:{name:'市場',sub:'貨聲與傳言',intro:'人聲、叫賣和搬貨聲混在一起。要從這裡找三張紙，比找一個人還難。',actions:['market_stalls','market_runner','market_postman','market_role']},
 bookstall:{name:'舊書攤',sub:'紙頁之間',intro:'舊書攤靠著騎樓最裡側。老闆把書按高低堆成幾列，最下面壓著幾本頁角發脆的工具書。',actions:['book_search','book_owner','book_stub','book_pages']}
};
const actions={
 tea_index:{label:'檢查缺頁位置',once:true,run(s){gain(s,'missing_index');return['你把冊子攤平，用手指沿著裝訂處慢慢摸過去。第 17、21、22 頁不在，缺口不是一張張撕掉，而像是有人一次抽走幾張。','阿川把頁碼念了一遍。你抄進自己的案件筆記。'];}},
 tea_ask:{label:'詢問阿川最後在哪裡用過這些紙',once:true,run(s){unlock(s,'print');knowPerson(s,'achuan');return['阿川閉上眼想了一會兒。「印刷行。」他說。前一晚他在周老闆那裡排過幾行字，還借了一只鉛字盒。','他記得離開時紙都塞回布袋，卻不能確定三頁是不是還在冊子裡。印刷行被記進地圖。'];}},
 tea_compare:{label:'翻閱剩餘筆記，找相鄰內容',once:true,run(s){return s.role==='student'?["你把第 16 與 18 頁並排。兩頁都在談工廠夜班，句子中間還留著同一個人的稱呼縮寫。缺掉的第 17 頁很可能屬於同一段訪談。","頁碼不是唯一線索；前後文也能幫你辨認失頁。"]:["你把缺口前後的頁面看了一遍。第 16 頁停在一段工廠訪談中間，第 18 頁卻已換了話題。","你先在筆記旁畫了一個問號：失頁內容可能不只是一段。"]; }},
 print_ledger:{label:'查看櫃檯旁的借物簿',once:true,run(s){gain(s,'print_ledger');return s.role==='clerk'?["你沒有先看內容，而是看欄位。借出日期是九月十二日，歸還卻寫在十三日；阿川口中的「當晚就還了」和帳本差了一天。","墨水顏色一致，不像事後補寫。你把這個日期差記下來。"]:["借物簿裡找到阿川的名字：九月十二日借鉛字盒，歸還欄卻寫著九月十三日。","阿川記錯了一天，至少證明他的時間記憶不能完全依賴。"];}},
 print_zhou:{label:'問周老闆：阿川那晚真的沒留下東西嗎？',once:true,run(s){knowPerson(s,'zhou');if(has(s,'print_ledger')){s.flags.zhouCracked=true;gain(s,'waste_route');unlock(s,'market');return['你把借物簿轉向周老闆，指著阿川的名字。「如果他十二日就走了，為什麼十三日才歸還？」','周老闆盯著那一格看了很久，最後把手裡的鉛字放下。「好，他隔天有回來。」他承認那天整理桌面時，也把一捆廢紙交給市場跑腿少年帶走。','市場被標進地圖。'];}return['周老闆搖頭。「那天人太多，我哪記得誰留下什麼。」','你繼續問，他仍只說不記得。也許需要一件能逼他把日期說清楚的東西。'];}},
 print_waste:{label:'檢查後間的廢紙堆',once:true,run(s){if(s.flags.zhouCracked){return['後間剩下的廢紙用麻繩捆著，最上面幾張還沾著油墨。旁邊空了一塊，大小正好能放另一捆。','周老闆既然已承認廢紙被帶去市場，這個空位只讓那條路徑更具體。'];}return['後間的廢紙分成幾捆，靠牆的位置卻空了一塊。你問少掉的那捆去哪了，周老闆只說「早就處理掉了」。','他沒有再解釋。'];}},
 print_role:{label:'從自己的身分切入',once:true,special:true,run(s){const t={student:['你翻看幾張校刊尺寸的試印紙，周老闆見你認得版式，才承認阿川確實曾來排過訪談標題。','這不直接指出失頁在哪，但證實阿川沒有記錯地點。'],worker:['你幫著把一捆紙移到牆邊。周老闆看你搬紙的動作不像外行，話也少了些防備：「這些廢紙平常都是市場那孩子來帶。」','你記住「市場那孩子」這幾個字。'],clerk:['你順著帳簿編號往前後看，很快確認那一頁沒有缺行，也沒有撕補痕跡。至少這筆日期不是臨時補上的。','帳目可以被誤記，但這裡沒有明顯改寫的跡象。'],reporter:['你沒有問「是不是有人拿走紙」，而問「那天最後一個碰桌面的人是誰」。周老闆先看了你一眼，才說是他自己整理的。','問題換一種問法，他就給出了之前沒有說的細節。'],teacher:['你提到阿川整理的是學生與工人的訪談，不是要刊登的傳單。周老闆的神情鬆了一點，但仍不願替任何內容作保。','他只補了一句：有字的廢紙通常不會直接燒掉。'],merchant:['你先問廢紙平常賣不賣。周老闆笑了一聲，說那點量不值得叫收紙商，都是讓市場跑腿少年順手帶走。','貨物流向比人的記憶清楚。'],veteran:['周老闆停頓時，你沒有立刻追問。過了一會兒，他反而自己補了一句：「人是來過，但來過不等於紙在我這。」','你把兩件事分開記下：阿川來過；失頁去向仍未知。'],homemaker:['你注意到後間有市場攤販用的粗麻繩和空竹籃。問起來，周老闆才說附近商販常請少年順路來拿廢紙墊箱。','印刷行和市場的日常往來，比周老闆一開始說得更密。']};return t[s.role];}},
 market_stalls:{label:'沿著攤位找被拿來包貨的紙',once:true,run(s){gain(s,'wrapped_scrap');return['你從菜葉、麻繩和幾張沾油的包裝紙一路找過去。花生攤腳邊壓著一小角較白的紙。','你把它抽出來。上面只剩半句字，末尾卻清楚看得見「夜班」兩字，筆跡和阿川的冊子一致。'];}},
 market_runner:{label:'找跑腿少年問那捆廢紙',once:true,run(s){knowPerson(s,'runner');if(has(s,'wrapped_scrap')||s.role==='worker'||s.role==='teacher'){gain(s,'runner_account');unlock(s,'bookstall');return s.role==='worker'?["少年先看你的手，再看你說的印刷行。他認出你也做過粗活，沒有繞太久。","那捆紙大多被拿去墊箱；比較完整、字又密的幾張，他嫌拿來包東西不妥，就交給舊書攤老闆。"]:s.role==='teacher'?["你先問他每天替幾家攤位跑腿，又問那天是不是特別忙。少年答著答著，自己想起那捆紙。","有幾張寫滿字，他沒拿去包貨，而是塞給舊書攤老闆。舊書攤被標進地圖。"]:["你把找到的紙角給少年看。他立刻認出那是自己從印刷行帶來的那一捆。","大部分紙被攤販拿走；幾張比較完整的，他交給舊書攤老闆。舊書攤被標進地圖。"]; }return['少年聽完就搖頭，說每天搬的東西太多，記不得哪一捆紙。','他準備轉身去搬下一箱貨。你需要更具體的東西喚起他的記憶，或換一種讓他願意多談的方式。'];}},
 market_postman:{label:'追查「有人四處問地址」的傳言',once:true,run(s){s.flags.postmanRumor=true;return['兩個攤販都提到一名穿郵務制服的人，昨天在市場裡反覆問地址。有人說他也問過「紙張」的事。','說法越傳越像有人在找阿川，但沒有一個人真的聽見對方說出阿川的名字。你把這條情報標成「未證實」。'];}},
 market_role:{label:'從自己的身分切入',once:true,special:true,run(s){const t={student:['你把紙角上的字和先前記下的相鄰頁內容比對。「夜班」前的句型很接近第 16 頁。','這讓紙角和缺頁之間的關聯更強。'],worker:['你沒有站著盤問少年，而是一起把兩箱貨搬完。他喘著氣時主動說，那天確實有幾張紙被他送去舊書攤。','舊書攤被標進地圖。'],clerk:['你問攤販是否有固定向印刷行取廢紙。三家說法一致：每兩三天一次，由同一名少年帶來。','這條固定路徑比「可能有人偷走」更符合目前看到的痕跡。'],reporter:['你分別問三個攤販同一個問題，不先告訴他們別人怎麼說。只有「郵務制服」與「問錯地址」在三份說法裡都重複出現。','至於「在找阿川」，沒有人能說出來源。'],teacher:['少年先喊你「老師」，你沒有糾正，只問那幾張寫滿字的紙最後怎麼處理。他很快想起舊書攤老闆。','舊書攤被標進地圖。'],merchant:['你問的不是誰拿過紙，而是哪些攤販會用印刷廢紙。三個攤位很快把流向拼出來：墊箱、包貨，剩下完整的給舊書攤。','紙張像貨一樣，有自己的路。'],veteran:['你把「看到郵差」和「郵差在找阿川」分成兩行記。前者有三人看見，後者沒有任何直接證詞。','市場裡最嚇人的那條傳言，暫時只能停在第二行。'],homemaker:['你先和幾個攤販聊今天誰沒出攤、誰又替誰顧孩子。話繞了一圈，舊書攤老闆的習慣自然被提起：有字的完整紙，他常拿去夾書。','舊書攤被標進地圖。']};if(['worker','teacher','merchant','homemaker'].includes(s.role))unlock(s,'bookstall');return t[s.role];}},
 book_search:{label:'翻找可能夾過紙的舊工具書',once:true,run(s){if(!has(s,'runner_account')&&s.role!=='student')return['你翻了幾本字典和簿冊，只有乾掉的書籤、舊收據和幾張空白紙。','範圍太大。若知道少年把紙交給老闆時的情況，也許比較容易縮小。'];gain(s,'archive_pages');return s.role==='student'?["你先找頁縫最鬆、常被拿來夾紙的工具書。一本破字典中段明顯厚了一截。","三張摺過的紙從書脊旁滑出來：17、21、22。裂痕和阿川冊上的缺口對得上。"]:["老闆指了幾本自己常拿來夾紙的舊書。你逐本翻過，在一本破字典中間摸到三張摺過的紙。","頁碼是 17、21、22。你把三頁並在一起，裂痕與阿川冊上的缺口正好接回去。'];}},
 book_owner:{label:'詢問老闆：紙是誰交來的？',once:true,run(s){knowPerson(s,'bookseller');return has(s,'runner_account')?["老闆很快想起那名少年。「他說拿來包花生太可惜，字又密，我就先夾著。」","這和少年的說法一致。"]:["老闆說紙是市場跑腿少年塞給他的，但時間記不清了。「有字的紙，我不喜歡拿去包吃的。」","你把這個人名記下來，市場那條線重新變得重要。'];}},
 book_stub:{label:'檢查櫃檯下的舊收據與存根',once:true,run(s){gain(s,'postal_stub');return s.flags.postmanRumor?["一張郵件存根夾在帳本裡。老闆想起昨天那名郵務人員是在找一封送錯市場巷口的信，還請他幫忙看過地址。","存根上的地址與阿川、印刷行都無關。市場裡那條越傳越可怕的傳言，終於有了普通得多的解釋。"]:["你在櫃檯下看到一張郵件存根。老闆說昨天有郵務人員來確認一封錯投的信。","地址與阿川、印刷行都無關。你暫時不知道這張紙是否有用，但還是收進案件紀錄。'];}},
 book_pages:{label:'仔細閱讀找回的三頁',once:true,run(s){if(!has(s,'archive_pages'))return['三頁還沒找到。你現在能讀的只有架上的舊書。'];gain(s,'consent_note');s.flags.deductionReady=true;return['你把三頁按頁碼排好。第 21 頁右側有一行很淡的鉛筆字：「秋月：不要真名。」','阿川找的東西已經回到手上，但這行註記讓「找到紙」不再等於「事情結束」。推理頁面現在可以進行結案。'];}}
};
let state=null,selectedRole=null,currentTab='scene';
const $=id=>document.getElementById(id);
function newState(name,role){return{name:(name||'無名調查者').trim(),role,caseId:'case1',location:'tea',unlocked:['tea'],visited:['tea'],evidence:[],people:[],done:[],flags:{},focus:5,deductionStep:0,deductionAnswers:{},deductionReady:false,finished:false,history:[]}}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch(_){}}
function load(){try{const v=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(v&&v.caseId==='case1')return v}catch(_){ }return null}
function unlock(s,id){if(!s.unlocked.includes(id))s.unlocked.push(id)}
function gain(s,id){if(!s.evidence.includes(id)){s.evidence.push(id);toast('新增證物：'+evidence[id].name)}}
function knowPerson(s,id){if(!s.people.includes(id))s.people.push(id)}
function has(s,id){return s.evidence.includes(id)}
function done(s,id){return s.done.includes(id)}
function toast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window.__caseToast);window.__caseToast=setTimeout(()=>t.classList.remove('show'),1800)}
function renderFocus(){const box=$('focusDots');if(!box)return;box.innerHTML='';for(let i=0;i<5;i++){const x=document.createElement('i');if(i<state.focus)x.classList.add('on');box.appendChild(x)}}
function showGame(){['startScreen','gameScreen','completeScreen'].forEach(id=>$(id)?.classList.add('hidden'));$('gameScreen').classList.remove('hidden');$('playerLabel').textContent=`${state.name}・${roles[state.role].label}`;renderFocus();switchTab(currentTab)}
function setTab(tab){currentTab=tab;document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));['scenePanel','mapPanel','recordPanel','deductionPanel'].forEach(id=>$(id).classList.add('hidden'));const map={scene:'scenePanel',map:'mapPanel',record:'recordPanel',deduction:'deductionPanel'};$(map[tab]).classList.remove('hidden');if(tab==='scene')renderScene();if(tab==='map')renderMap();if(tab==='record')renderRecords();if(tab==='deduction')renderDeduction()}
function appendText(lines){const box=$('sceneBody');box.innerHTML='';lines.forEach(t=>{const p=document.createElement('p');p.textContent=t;box.appendChild(p)})}
function renderScene(){const loc=locations[state.location];$('locationName').textContent=loc.name;$('locationSub').textContent=loc.sub;const last=state.flags.lastResult;if(last&&last.location===state.location){appendText(last.lines)}else appendText([loc.intro]);const grid=$('actionGrid');grid.innerHTML='';loc.actions.forEach(id=>{const a=actions[id],b=document.createElement('button');b.className='action-btn';if(a.special)b.classList.add('special');if(a.once&&done(state,id))b.classList.add('done');b.innerHTML=`<strong>${a.label}</strong><small>${a.once&&done(state,id)?'已調查，可再次查看結果':'進行調查'}</small>`;b.onclick=()=>runAction(id);grid.appendChild(b)});}
function runAction(id){const a=actions[id];if(!a)return;let lines;if(a.once&&done(state,id)&&state.flags.actionResults?.[id]){lines=state.flags.actionResults[id]}else{lines=a.run(state)||['你沒有找到新的東西。'];if(a.once&&!done(state,id))state.done.push(id);state.flags.actionResults=state.flags.actionResults||{};state.flags.actionResults[id]=lines;}state.flags.lastResult={location:state.location,lines};state.history.push({type:'action',location:state.location,id});save();renderScene();renderFocus();}
function renderMap(){const grid=$('mapGrid');grid.innerHTML='';Object.entries(locations).forEach(([id,l])=>{const b=document.createElement('button');b.className='map-btn';const unlocked=state.unlocked.includes(id);if(!unlocked)b.classList.add('locked');if(state.visited.includes(id))b.classList.add('visited');b.disabled=!unlocked;b.innerHTML=`<strong>${l.name}</strong><small>${unlocked?l.sub:'尚未取得前往線索'}</small>`;b.onclick=()=>{state.location=id;if(!state.visited.includes(id))state.visited.push(id);state.flags.lastResult=null;save();setTab('scene')};grid.appendChild(b)});}
function renderRecords(){const ev=$('evidenceGrid'),pp=$('peopleGrid');ev.innerHTML='';pp.innerHTML='';if(!state.evidence.length)ev.innerHTML='<div class="evidence-card"><strong>尚無證物</strong><small>在現場進行調查後，取得的物件與情報會收在這裡。</small></div>';state.evidence.forEach(id=>{const e=evidence[id],d=document.createElement('div');d.className='evidence-card';d.innerHTML=`<strong>${e.name}</strong><small>${e.desc}</small><span class="tag">${e.type}</span>`;ev.appendChild(d)});if(!state.people.length)pp.innerHTML='<div class="person-card"><strong>尚無人物紀錄</strong><small>與案件相關的人物會在交談後加入。</small></div>';state.people.forEach(id=>{const p=people[id],d=document.createElement('div');d.className='person-card';d.innerHTML=`<strong>${p.name}</strong><small>${p.desc}</small>`;pp.appendChild(d)});$('evidenceCount').textContent=state.evidence.length;}
const deduction=[
 {q:'第一問：三頁失頁最可能是怎麼離開印刷行的？',opts:[['steal','有人趁周老闆不注意偷走'],['waste','整理時混進廢紙，被一起帶去市場'],['achuan','阿川故意把三頁交給陌生人']],correct:'waste',need:'wrapped_scrap',explain:'市場找到的紙角，配合印刷行固定的廢紙去向，能把紙張從印刷行一路接到市場。'},
 {q:'第二問：市場裡「穿郵務制服的人四處問地址」與失頁有什麼關係？',opts:[['tracker','他就是在追查阿川的筆記'],['unknown','無法判斷，所以應把他當成主要嫌疑人'],['postal','他在處理一封錯投郵件，沒有證據顯示與失頁有關']],correct:'postal',need:'postal_stub',explain:'郵件存根提供了獨立、可核對的地址與時間，足以解釋那名郵務人員為何出現在市場。'},
 {q:'第三問：哪一件證物能直接確認找回的三頁就是阿川遺失的原頁？',opts:[['ledger','鉛字盒借用簿'],['pages','三頁失落筆記本身'],['runner','少年說法']],correct:'pages',need:'archive_pages',explain:'頁碼 17、21、22 與冊中缺口一致，裂痕也能接回裝訂處，這是最直接的物理比對。'}
];
function renderDeduction(){const box=$('deductionBox');box.innerHTML='';if(!state.flags.deductionReady){box.innerHTML='<h2>推理尚未開放</h2><p>目前的情報還不足以結案。至少先找到失落的三頁，並仔細閱讀它們。</p>';return}if(state.finished){renderComplete();return}const step=deduction[state.deductionStep];const h=document.createElement('h2');h.textContent=step.q;box.appendChild(h);const p=document.createElement('p');p.textContent='選出你的推論。若答案正確，還必須提出能支撐它的證物。';box.appendChild(p);const opts=document.createElement('div');opts.className='deduction-options';step.opts.forEach(([id,label])=>{const b=document.createElement('button');b.className='deduction-option';b.innerHTML=`<strong>${label}</strong>`;b.onclick=()=>answerDeduction(id);opts.appendChild(b)});box.appendChild(opts);if(state.flags.deductionFeedback){const f=document.createElement('div');f.className='feedback';f.textContent=state.flags.deductionFeedback;box.appendChild(f)}}
function loseFocus(msg){state.focus=Math.max(0,state.focus-1);state.flags.deductionFeedback=msg;if(state.focus===0){state.focus=2;state.flags.deductionFeedback+=' 你停下來重新整理案件紀錄，思路稍微恢復了一些。'}save();renderFocus();renderDeduction()}
function answerDeduction(id){const step=deduction[state.deductionStep];if(id!==step.correct)return loseFocus('這個說法把尚未證實的部分當成了事實。再看看你已取得的證物。');state.deductionAnswers[state.deductionStep]=id;renderEvidencePicker(step)}
function renderEvidencePicker(step){const box=$('deductionBox');box.innerHTML=`<h2>提出證物</h2><p>哪一件你已取得的證物，最能支撐剛才的推論？</p>`;const opts=document.createElement('div');opts.className='deduction-options';state.evidence.forEach(id=>{const e=evidence[id],b=document.createElement('button');b.className='deduction-option';b.innerHTML=`<strong>${e.name}</strong><small>${e.type}</small>`;b.onclick=()=>presentEvidence(id,step);opts.appendChild(b)});box.appendChild(opts)}
function presentEvidence(id,step){if(id!==step.need)return loseFocus('這件證物也許和案件有關，但無法直接支撐剛才那句推論。');state.flags.deductionFeedback='';state.deductionStep++;toast('推理成立');if(state.deductionStep>=deduction.length){state.finished=true;save();renderComplete();return}save();renderDeduction()}
function renderComplete(){['startScreen','gameScreen'].forEach(id=>$(id)?.classList.add('hidden'));$('completeScreen').classList.remove('hidden');$('completeText').innerHTML='';['你把三頁紙按頁碼放回阿川面前。它們不是被誰刻意偷走，而是在印刷行整理時混進廢紙，跟著跑腿少年到了市場，最後被舊書攤老闆夾進一本破字典。','那名在市場四處問地址的郵務人員，則只是另一件被緊張情緒黏到案子上的普通事件。','阿川接過紙時沒有立刻笑。他看見第 21 頁邊上的那行鉛筆字：「秋月：不要真名。」找回失頁解決了第一個問題，卻把下一個問題推到你們面前。'].forEach(t=>{const p=document.createElement('p');p.textContent=t;$('completeText').appendChild(p)});}
function restart(){localStorage.removeItem(SAVE_KEY);state=null;selectedRole=null;location.reload()}
window.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('.role-btn').forEach(b=>b.onclick=()=>{selectedRole=b.dataset.role;document.querySelectorAll('.role-btn').forEach(x=>x.classList.toggle('selected',x===b));$('startBtn').disabled=false});
 $('startBtn').onclick=()=>{state=newState($('nameInput').value,selectedRole);save();currentTab='scene';showGame()};
 $('loadBtn').onclick=()=>{const s=load();if(!s)return toast('找不到案件存檔');state=s;currentTab='scene';showGame()};
 document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
 $('recordEvidenceBtn').onclick=()=>{state.flags.recordMode='evidence';$('evidenceSection').classList.remove('hidden');$('peopleSection').classList.add('hidden');$('recordEvidenceBtn').classList.add('active');$('recordPeopleBtn').classList.remove('active')};
 $('recordPeopleBtn').onclick=()=>{state.flags.recordMode='people';$('evidenceSection').classList.add('hidden');$('peopleSection').classList.remove('hidden');$('recordEvidenceBtn').classList.remove('active');$('recordPeopleBtn').classList.add('active')};
 $('restartBtn').onclick=()=>{if(confirm('確定重新開始案件？目前案件存檔會被清除。'))restart()};
 $('legacyLink').onclick=()=>{location.href='legacy.html'};
 $('nextCaseBtn').onclick=()=>toast('案件二正在製作：秋月的條件');
 const s=load();if(s){$('loadBtn').disabled=false}else $('loadBtn').disabled=true;
});
})();