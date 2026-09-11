(()=>{'use strict';
const SAVE_KEY='mist-taiwan-case-save-v4';
const $=id=>document.getElementById(id);
const roles={student:'學生',worker:'工人',clerk:'公務員',reporter:'記者',teacher:'教師',merchant:'商人',veteran:'退伍軍人',homemaker:'持家者'};
const evidence={
 missing_index:{name:'缺頁編號',type:'筆記',desc:'訪談冊缺少第 17、21、22 頁，裝訂處留下相連的斜裂痕。'},
 print_ledger:{name:'鉛字盒借用簿',type:'帳目',desc:'阿川十二日借出鉛字盒，歸還欄卻記在十三日。'},
 waste_route:{name:'廢紙去向',type:'情報',desc:'印刷行的廢紙固定交給市場跑腿少年帶走。'},
 wrapped_scrap:{name:'包花生的紙角',type:'紙片',desc:'市場找到帶有阿川筆跡與「夜班」字樣的紙角。'},
 runner_account:{name:'少年說法',type:'證詞',desc:'少年把較完整、寫滿字的紙交給舊書攤老闆。'},
 archive_pages:{name:'三頁失落筆記',type:'關鍵證物',desc:'舊字典裡找到第 17、21、22 頁，裂痕與原冊缺口吻合。'},
 postal_stub:{name:'錯投郵件存根',type:'存根',desc:'能解釋市場裡郵務人員四處問地址的原因，與阿川無關。'},
 consent_note:{name:'頁邊鉛筆註記',type:'文字線索',desc:'第 21 頁寫著：「秋月：不要真名。」'}
};
const people={
 achuan:{name:'阿川',desc:'你的舊同學，正在整理訪談紀錄。'},
 zhou:{name:'周老闆',desc:'印刷行老闆。他對紙張去向說得含糊，但含糊本身不等於有罪。'},
 runner:{name:'跑腿少年',desc:'替市場攤商搬貨，也替印刷行帶走廢紙。'},
 bookseller:{name:'舊書攤老闆',desc:'習慣把仍可使用、寫過字的紙夾進舊書保存。'}
};
const locations={
 tea:{name:'茶行',sub:'案件起點・教學',intro:'茶行快打烊了。阿川沒有立刻把冊子攤開，而是先看了一眼靠近門口的客人。等那人離開，他才把聲音壓低，將缺了三頁的訪談冊推到你面前。',actions:['tea_index','tea_ask','tea_compare']},
 print:{name:'印刷行',sub:'油墨與紙堆',intro:'機器剛停，空氣裡仍有油墨味。牆邊貼著防諜宣傳。周老闆看到你翻出阿川的名字時，手上的鉛字停了一下。',actions:['print_ledger','print_zhou','print_waste','print_role']},
 market:{name:'市場',sub:'貨聲與傳言',intro:'攤販、搬貨與叫賣聲混在一起。最近人人都對制服、陌生面孔與反覆詢問格外敏感；一句沒人能確認來源的話，很快就能傳成另一件事。',actions:['market_stalls','market_runner','market_postman','market_role']},
 bookstall:{name:'舊書攤',sub:'紙頁之間',intro:'騎樓深處堆著一排排舊書。老闆看見你拿出寫滿名字的紙角，只說：「這種東西別站在路邊看。」',actions:['book_search','book_owner','book_stub','book_pages']}
};
const prologue=[
 {title:'九月的收音機',text:['1958 年 9 月，臺北。','收音機裡一遍遍播著金門前線的消息。街上談論戰事的人不少，但真正提到名字、信件與「誰跟誰見過面」時，聲音往往會自己低下去。','你已經習慣這種反差：新聞可以很大聲，人的生活卻必須很小心。']},
 {title:'紙上的名字',text:['傍晚，你收到阿川託人帶來的一張便條。上面只有約見地點，沒有寫原因。','送信的人把便條交到你手上後，只提醒一句：「看完就收好。」','在這個年代，紙不只是紙。上面寫了誰、落到誰手裡，有時比內容本身更讓人不安。']},
 {title:'茶行',text:['你沿著騎樓走到茶行。門外有人在收攤，遠處傳來收音機模糊的播音聲。','阿川坐在最裡面的位置。桌上沒有茶，只有一本布面冊子。','他等你坐下，才說：「少了三頁。」','——案件一〈失落的三頁〉開始。']}
];
let state=null,currentTab='scene',prologueIndex=0;
const has=id=>state.evidence.includes(id);
function freshState(name,role){return{name:(name||'無名調查者').trim(),role,caseId:'case1',location:'tea',unlocked:['tea'],visited:['tea'],evidence:[],people:[],done:[],flags:{actionResults:{},deductionReady:false},focus:5,maxFocus:5,deductionStep:0,finished:false,failed:false,history:[]};}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch(_){}}
function load(){try{const v=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');return v&&v.caseId==='case1'?v:null}catch(_){return null}}
function toast(msg){window.caseToast?window.caseToast(msg):null}
function gain(id){if(!state.evidence.includes(id)){state.evidence.push(id);toast('新增證物：'+evidence[id].name)}}
function know(id){if(!state.people.includes(id))state.people.push(id)}
function unlock(id){if(!state.unlocked.includes(id))state.unlocked.push(id)}
function result(lines,complete=true){return{lines,complete}}
const actions={
 tea_index:{label:'檢查缺頁位置',run(){gain('missing_index');return result(['你把冊子攤平，沿著裝訂處一頁頁摸過去。第 17、21、22 頁不見了，缺口不像單張撕除，更像幾張一起被抽走。','阿川沒有催你下結論。你先把頁碼和裂痕方向記進案件筆記。'])}},
 tea_ask:{label:'詢問阿川最後在哪裡使用筆記',run(){know('achuan');unlock('print');return result(['阿川回想了一會兒，說前一晚曾帶著冊子到印刷行排字。','他記得離開時把紙塞回布袋，卻不能確定失頁當時是否仍在冊子裡。你在地圖上記下印刷行。'])}},
 tea_compare:{label:'翻閱缺口前後的內容',run(){return state.role==='student'?result(['你把第 16 與 18 頁並排。第 16 頁談到工廠夜班，第 18 頁卻已跳到另一段訪談。','第 17 頁很可能仍屬於夜班那段內容，但「很可能」還不是證據。']):result(['第 16 頁在一段工廠訪談中停住，第 18 頁已換了話題。','你在缺口旁畫了一個問號，暫時不替那三頁補上不存在的內容。'])}},
 print_ledger:{label:'查看櫃檯旁的借物簿',run(){gain('print_ledger');return state.role==='clerk'?result(['你先看欄位而不是故事。借出日期是十二日，歸還卻記在十三日，而且前後筆跡連續。','阿川把時間記錯了一天。這是可以核對的落差，不等於他在說謊。']):result(['借物簿裡找到阿川的名字：十二日借出，十三日才歸還。','人的記憶會錯，帳目因此值得留下。'])}},
 print_zhou:{label:'追問周老闆那晚的情況',run(){know('zhou');if(has('print_ledger')){gain('waste_route');unlock('market');state.flags.zhouCracked=true;return result(['你把借物簿轉向周老闆，沒有問「是不是你弄丟的」，只指著十三日的歸還紀錄。','他沉默很久，才承認阿川隔天確實又回來過。當天收桌時，他把一捆廢紙交給市場跑腿少年帶走。','「我不想有人說，是我這裡把有名字的東西往外送。」他把聲音壓得很低。你第一次明白，他先前的含糊更像自保，不是認罪。','市場被標進地圖。'])}return result(['周老闆說那晚人多、事情雜，記不得阿川留下過什麼。你再追問，他只重複「不知道」。','他顯然不想把自己和那些訪談紙張扯在一起，但現在還沒有東西能固定日期。'],false)}},
 print_waste:{label:'檢查後間廢紙堆',run(){return state.flags.zhouCracked?result(['靠牆的廢紙少了一捆，空位大小和周老闆描述的差不多。','這不能證明失頁一定在裡面，但紙確實有一條通往市場的日常路徑。']):result(['廢紙整齊捆在牆邊，其中一處留下空位。','你問少掉的那捆去哪裡，周老闆只回了一句：「早就處理掉了。」目前還無法證明它和失頁有關。'],false)}},
 print_role:{label:'從自己的身分切入',special:true,run(){const t={student:['你翻看校刊尺寸的試印紙。周老闆見你認得版式，承認阿川確實在這裡排過訪談標題。'],worker:['你幫忙把紙捆搬到牆邊。周老闆順口提起，市場那個跑腿少年常來拿廢紙。'],clerk:['你比對前後幾筆借物紀錄，沒有發現補寫或跳號。'],reporter:['你改問「最後一個碰桌面的人是誰」，周老闆回答是他自己，卻立刻補一句：「只是收桌。」'],teacher:['你提到訪談裡有學生與工人的名字。周老闆的表情反而更緊：「所以我才不想碰。」'],merchant:['你先問廢紙平常怎麼處理。周老闆說量不多，通常讓市場少年帶去墊箱。'],veteran:['你沒有把周老闆的停頓當成罪證，只把「阿川來過」和「失頁去向未知」分開記。'],homemaker:['你注意到後間有市場攤販用的粗麻繩與空竹籃。周老闆承認附近商販常來拿廢紙墊箱。']};return result(t[state.role]||['你換了一個熟悉的角度觀察現場，但暫時沒有新的結論。'])}},
 market_stalls:{label:'沿攤位尋找被拿來包貨的紙',run(){gain('wrapped_scrap');return result(['你在菜葉、麻繩與包裝紙間慢慢翻找，最後從花生攤腳邊抽出一角較白的紙。','紙上只剩半句字，末尾卻清楚寫著「夜班」。筆跡與阿川的冊子一致。'])}},
 market_runner:{label:'詢問跑腿少年那捆廢紙',run(){know('runner');if(has('wrapped_scrap')||['worker','teacher'].includes(state.role)){gain('runner_account');unlock('bookstall');return result(['少年看過紙角後想起來了。那捆紙大多被拿去墊箱，幾張完整、又寫滿字的紙則被他交給舊書攤老闆。','他不是想藏東西，只是不想拿寫著人名的紙去包吃的。舊書攤被標進地圖。'])}return result(['少年搖頭，說每天搬的東西太多，想不起是哪一捆。','他不是拒絕回答；你的問題只是還不夠具體。'],false)}},
 market_postman:{label:'追查「有人四處問地址」的傳言',run(){state.flags.postmanRumor=true;return result(['幾名攤販都記得昨天有個穿郵務制服的人反覆問地址。','第一個人只說「問地址」；第二個人說「好像在找紙」；傳到第三個人時，已經變成「可能在找阿川」。','沒有人真的聽見那名郵務人員說出阿川的名字。你把這條情報標成「傳言鏈」，而不是嫌疑。'])}},
 market_role:{label:'從自己的身分切入',special:true,run(){const t={student:['你把紙角上的「夜班」與第 16 頁內容比對，語句結構十分接近。'],worker:['你幫少年搬完兩箱貨，他主動提到曾把幾張完整紙送去舊書攤。'],clerk:['三個攤販都說廢紙每兩三天會來一次，流向相當固定。'],reporter:['你分開詢問三個攤販，不讓後一個人先聽到前一個人的說法。只有「郵務制服」和「問地址」能被多方證實。'],teacher:['少年重新想了一遍那天的事情，終於想起完整紙張被送去舊書攤。'],merchant:['你問的是哪些攤位會用印刷廢紙，很快拼出墊箱、包貨、剩下完整紙張的流向。'],veteran:['你把「看到郵務人員」與「郵務人員在找阿川」分成兩條記錄。後者目前沒有直接證詞。'],homemaker:['你先從攤販日常聊起，舊書攤老闆「有字的完整紙會留下」的習慣自然被提了出來。']};if(['worker','teacher','merchant','homemaker'].includes(state.role))unlock('bookstall');return result(t[state.role]||['你換了一個熟悉的角度觀察市場。'])}},
 book_search:{label:'翻找可能夾過紙的舊工具書',run(){if(!has('runner_account')&&state.role!=='student')return result(['你翻了幾本字典與簿冊，只找到舊收據和空白紙。','範圍太大。若能先知道少年把紙交給老闆時的情況，會比較容易縮小。'],false);gain('archive_pages');return result(['你逐本翻過幾本最常被拿來夾紙的工具書。一本破字典中段明顯厚了一截。','三張摺過的紙滑出來：17、21、22。裂痕與阿川冊上的缺口正好接回去。'])}},
 book_owner:{label:'詢問老闆紙張來源',run(){know('bookseller');return has('runner_account')?result(['老闆很快想起那名少年。「他說拿來包東西太可惜，我就先夾著。」','這和少年的說法一致；兩份互不依賴的證詞開始接上。']):result(['老闆說有些寫滿字的紙是市場跑腿少年塞給他的。','這提供了一條方向，但你還沒直接確認少年記得的是不是同一捆。'])}},
 book_stub:{label:'檢查櫃檯下的舊存根',run(){gain('postal_stub');return state.flags.postmanRumor?result(['你找到一張錯投郵件存根。老闆想起昨天那名郵務人員是在找一封送錯市場巷口的信。','存根地址與阿川、印刷行都無關。那條越傳越可怕的消息，最後只是把真實的「問地址」黏上了不存在的目的。']):result(['你找到一張錯投郵件存根。老闆說昨天確實有郵務人員來確認地址。','地址與阿川、印刷行都無關。'])}},
 book_pages:{label:'仔細閱讀找回的三頁',run(){if(!has('archive_pages'))return result(['三頁還沒找到。你現在能讀的只有架上的舊書。'],false);gain('consent_note');state.flags.deductionReady=true;return result(['你把三頁按頁碼排好。第 21 頁右側有一行很淡的鉛筆字：「秋月：不要真名。」','阿川找的紙已經回來，但這行註記讓你意識到：在這個年代，找回資料和「有沒有權利保留它」是兩個不同問題。','推理頁面現在可以進行結案。'])}}
};
const deduction=[
 {q:'第一問：三頁失頁最可能怎麼離開印刷行？',opts:[['steal','周老闆趁阿川不注意偷走'],['waste','整理時混進廢紙，被一起帶去市場'],['achuan','阿川故意交給陌生人']],correct:'waste',need:'wrapped_scrap'},
 {q:'第二問：周老闆一開始含糊其辭，最合理的判斷是？',opts:[['guilty','他在隱瞞自己偷走筆記'],['protect','他害怕承認店裡讓寫有人名的紙流出去，因此先自保'],['proof','只要他沉默，就足以證明他有罪']],correct:'protect',need:'print_ledger'},
 {q:'第三問：市場裡的郵務人員與失頁有什麼關係？',opts:[['tracker','他在追查阿川筆記'],['rumor','目擊是真的，但「在找阿川」是傳言逐步放大的內容'],['unknown','既然穿制服，就應先當主要嫌疑人']],correct:'rumor',need:'postal_stub'},
 {q:'第四問：哪件證物能直接確認找回的紙就是原失頁？',opts:[['ledger','鉛字盒借用簿'],['pages','三頁失落筆記本身'],['runner','少年說法']],correct:'pages',need:'archive_pages'}
];
function hideAll(){['startScreen','prologueScreen','gameScreen','completeScreen','failScreen'].forEach(id=>$(id)?.classList.add('hidden'))}
function renderPrologue(){hideAll();$('prologueScreen').classList.remove('hidden');const p=prologue[prologueIndex];$('prologueStep').textContent=`${prologueIndex+1} / ${prologue.length}`;$('prologueTitle').textContent=p.title;$('prologueText').innerHTML='';p.text.forEach(t=>{const x=document.createElement('p');x.textContent=t;$('prologueText').appendChild(x)});$('prologueNext').textContent=prologueIndex===prologue.length-1?'前往茶行':'繼續'}
function nextPrologue(){if(prologueIndex<prologue.length-1){prologueIndex++;renderPrologue();return}showGame()}
function renderFocus(){const box=$('focusDots');box.innerHTML='';for(let i=0;i<state.maxFocus;i++){const d=document.createElement('i');if(i<state.focus)d.classList.add('on');box.appendChild(d)}}
function tutorial(msg){$('tutorialNote').textContent=msg}
function showGame(){hideAll();$('gameScreen').classList.remove('hidden');$('playerLabel').textContent=`${state.name}・${roles[state.role]}`;renderFocus();caseTab(currentTab)}
function caseTab(tab){currentTab=tab;document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));const panels={scene:'scenePanel',map:'mapPanel',record:'recordPanel',deduction:'deductionPanel'};Object.values(panels).forEach(id=>$(id).classList.add('hidden'));$(panels[tab]||panels.scene).classList.remove('hidden');if(tab==='scene'){tutorial('教學：調查現場取得情報。若當時條件不足，取得新線索後可以再問一次。');renderScene()}if(tab==='map'){tutorial('教學：只有取得線索的地點才會開放。');renderMap()}if(tab==='record'){tutorial('教學：證物、情報與人物說法都只是材料。先問來源，再問它真正能證明到哪一步。');renderRecords()}if(tab==='deduction'){tutorial('教學：錯誤推論會消耗推理專注。本案有 5 次容錯；降到 0 時案件失敗。後續案件容錯會更少。');renderDeduction()}}
function appendLines(lines){const box=$('sceneBody');box.innerHTML='';lines.forEach(t=>{const p=document.createElement('p');p.textContent=t;box.appendChild(p)})}
function renderScene(){const loc=locations[state.location];$('locationName').textContent=loc.name;$('locationSub').textContent=loc.sub;const last=state.flags.lastResult;appendLines(last&&last.location===state.location?last.lines:[loc.intro]);const grid=$('actionGrid');grid.innerHTML='';loc.actions.forEach(id=>{const a=actions[id],b=document.createElement('button'),done=state.done.includes(id);b.type='button';b.className='action-btn'+(a.special?' special':'')+(done?' done':'');b.innerHTML=`<strong>${a.label}</strong><small>${done?'已取得結果，可再次查看':'進行調查'}</small>`;b.onclick=()=>runAction(id);grid.appendChild(b)})}
function runAction(id){const a=actions[id];let r;if(state.done.includes(id)&&state.flags.actionResults[id])r={lines:state.flags.actionResults[id],complete:true};else{r=a.run()||result(['你沒有找到新的東西。']);if(r.complete){state.done.push(id);state.flags.actionResults[id]=r.lines}}state.flags.lastResult={location:state.location,lines:r.lines};state.history.push({type:'action',location:state.location,id});save();renderScene()}
function renderMap(){const grid=$('mapGrid');grid.innerHTML='';Object.entries(locations).forEach(([id,l])=>{const unlocked=state.unlocked.includes(id),b=document.createElement('button');b.type='button';b.className='map-btn'+(state.visited.includes(id)?' visited':'')+(unlocked?'':' locked');b.disabled=!unlocked;b.innerHTML=`<strong>${l.name}</strong><small>${unlocked?l.sub:'尚未取得前往線索'}</small>`;b.onclick=()=>{state.location=id;if(!state.visited.includes(id))state.visited.push(id);state.flags.lastResult=null;save();caseTab('scene')};grid.appendChild(b)})}
function renderRecords(){const ev=$('evidenceGrid'),pp=$('peopleGrid');ev.innerHTML='';pp.innerHTML='';if(!state.evidence.length)ev.innerHTML='<div class="evidence-card"><strong>尚無證物</strong><small>調查後取得的物件與情報會收在這裡。</small></div>';state.evidence.forEach(id=>{const e=evidence[id],d=document.createElement('div');d.className='evidence-card';d.innerHTML=`<strong>${e.name}</strong><small>${e.desc}</small><span class="tag">${e.type}</span>`;ev.appendChild(d)});if(!state.people.length)pp.innerHTML='<div class="person-card"><strong>尚無人物紀錄</strong><small>交談後會加入相關人物。</small></div>';state.people.forEach(id=>{const p=people[id],d=document.createElement('div');d.className='person-card';d.innerHTML=`<strong>${p.name}</strong><small>${p.desc}</small>`;pp.appendChild(d)});$('evidenceCount').textContent=state.evidence.length}
function loseFocus(msg){state.focus=Math.max(0,state.focus-1);state.flags.deductionFeedback=msg;save();renderFocus();if(state.focus<=0){failCase();return}renderDeduction()}
function renderDeduction(){const box=$('deductionBox');box.innerHTML='';if(!state.flags.deductionReady){box.innerHTML='<h2>推理尚未開放</h2><p>至少先找到三頁失落筆記並仔細閱讀。你不需要把每個人的話都當成真相。</p>';return}const step=deduction[state.deductionStep];if(!step){finishCase();return}box.innerHTML=`<h2>${step.q}</h2><p>選出你的推論。答對之後，還要提出能支撐它的證物。</p>`;const opts=document.createElement('div');opts.className='deduction-options';step.opts.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='deduction-option';b.innerHTML=`<strong>${label}</strong>`;b.onclick=()=>{if(id!==step.correct){loseFocus('這個推論超出了目前證據能證明的範圍。推理專注 -1。');return}renderEvidencePicker(step)};opts.appendChild(b)});box.appendChild(opts);if(state.flags.deductionFeedback){const f=document.createElement('div');f.className='feedback';f.textContent=state.flags.deductionFeedback;box.appendChild(f)}}
function renderEvidencePicker(step){const box=$('deductionBox');box.innerHTML='<h2>提出證物</h2><p>哪一件你已取得的證物，最能支撐剛才的推論？</p>';const opts=document.createElement('div');opts.className='deduction-options';state.evidence.forEach(id=>{const e=evidence[id],b=document.createElement('button');b.type='button';b.className='deduction-option';b.innerHTML=`<strong>${e.name}</strong><small>${e.type}</small>`;b.onclick=()=>{if(id!==step.need){loseFocus('這件證物和案件有關，但不能直接支撐剛才那句話。推理專注 -1。');return}state.deductionStep++;state.flags.deductionFeedback='';save();toast('推理成立');renderDeduction()};opts.appendChild(b)});box.appendChild(opts);const back=document.createElement('button');back.type='button';back.className='secondary';back.textContent='先回去調查';back.onclick=()=>caseTab('scene');box.appendChild(back)}
function finishCase(){state.finished=true;save();hideAll();$('completeScreen').classList.remove('hidden');const box=$('completeText');box.innerHTML='';['你把三頁紙按頁碼放回阿川面前。它們不是被誰刻意偷走，而是在印刷行整理時混進廢紙，跟著跑腿少年到了市場，最後被舊書攤老闆夾進破字典。','周老闆確實隱瞞了一部分事實，但他的目的不是偷走筆記，而是不想承認寫有人名的紙張從自己的店裡流出去。市場裡的郵務人員也真的出現過，只是「他在追查阿川」這件事，是傳言自己長出來的。','阿川看見第 21 頁邊上的鉛筆字：「秋月：不要真名。」你們都沒有立刻說話。第一案教你的不是怎麼找出「壞人」，而是怎麼分辨一個人為什麼沒有把話說完整。'].forEach(t=>{const p=document.createElement('p');p.textContent=t;box.appendChild(p)})}
function failCase(){state.failed=true;save();hideAll();$('failScreen').classList.remove('hidden')}
function start(name,role){state=freshState(name,role);save();prologueIndex=0;renderPrologue()}
function resume(){const s=load();if(!s)return false;state=s;if(state.failed){hideAll();$('failScreen').classList.remove('hidden');return true}if(state.finished){finishCase();return true}showGame();return true}
function retry(){const name=state?.name||'',role=state?.role||'student';state=freshState(name,role);save();showGame()}
function restart(){localStorage.removeItem(SAVE_KEY);location.reload()}
window.MistCase={start,resume,retry,restart,tab:caseTab,nextPrologue,showEvidence(){ $('evidenceSection').classList.remove('hidden');$('peopleSection').classList.add('hidden');$('recordEvidenceBtn').classList.add('active');$('recordPeopleBtn').classList.remove('active')},showPeople(){ $('peopleSection').classList.remove('hidden');$('evidenceSection').classList.add('hidden');$('recordPeopleBtn').classList.add('active');$('recordEvidenceBtn').classList.remove('active')},hasSave:()=>!!load()};
})();