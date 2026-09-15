(function(){
'use strict';

var STORE='mist-taiwan-rain-dialogue-v1';
var bypass=false;
var active=null;

function loadDone(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch(e){return{}}}
function saveDone(v){try{localStorage.setItem(STORE,JSON.stringify(v))}catch(e){}}
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

var scripts={
 timeline:{title:'逐夜重建時間',nodes:{
  start:{speaker:'林太太',text:'「都是半夜。差不多……我真的記不清了。」她把三個晚上說成同一團雨聲。',choices:[
   {t:'不要問「差不多」，請她從第一夜開始逐晚回想',next:'night1'},
   {t:'先問她是不是覺得那東西不是人',next:'ghost'}]},
  ghost:{speaker:'林太太',text:'「我就是不知道才找你來。」她的語氣立刻緊起來。若先替她決定答案，只會讓時間細節更模糊。',choices:[{t:'改回時間線：第一夜發生在幾點？',next:'night1'}]},
  night1:{speaker:'林太太',text:'第一夜她記得比較早，因為那時阿信還沒睡。她估計約十一點四十分。',choices:[{t:'第二夜呢？不要用「差不多」帶過',next:'night2'}]},
  night2:{speaker:'林太太',text:'第二夜接近午夜。她停了一下，開始意識到第一夜其實比另外兩夜早。',choices:[{t:'第三夜也單獨確認',next:'finish'}]},
  finish:{speaker:'調查筆記',text:'三個雨夜不是完全重疊的時間點。把它們拆開記錄，才有可能檢查是不是同一種手法。',commit:true}
 }},
 son:{title:'單獨詢問阿信',nodes:{
  start:{speaker:'阿信',text:'「我開門而已。我媽把事情講得很誇張。」他盯著門口，明顯不想讓母親聽見。',choices:[
   {t:'先請林太太離遠一點，再讓阿信自己從第三下開始說',next:'alone'},
   {t:'直接問他是不是在說謊',next:'accuse'}]},
  accuse:{speaker:'阿信',text:'他立刻閉嘴：「那你就當我騙人好了。」強硬指控讓他只剩防衛，卻沒有增加任何可核對資訊。',choices:[{t:'收回指控，改問他開門後第一眼看見什麼',next:'alone'}]},
  alone:{speaker:'阿信',text:'「第三下剛停我就拉門。門前沒人，可是巷尾有東西轉過去。」',choices:[
   {t:'你看清楚臉了嗎？',next:'face'},
   {t:'你確定那個身影就是敲門的人？',next:'identity'}]},
  face:{speaker:'阿信',text:'「沒有。雨很大，我連是不是男人都不能確定。」',choices:[{t:'那你能確定的只有「巷尾有身影」？',next:'finish'}]},
  identity:{speaker:'阿信',text:'他搖頭：「不能。我只是覺得時間太巧。」他第一次把「看見」和「自己猜的」分開。',choices:[{t:'只把你能確定的部分記進證詞',next:'finish'}]},
  finish:{speaker:'調查筆記',text:'阿信的證詞只能支持「第三夜開門後，巷尾有模糊身影」。身分與是否為敲門者仍待物證確認。',commit:true}
 }},
 legend:{title:'拆開怪談的每一句',nodes:{
  start:{speaker:'陳太太',text:'「這條巷子以前就不乾淨，老人早就說過三更三叩不能應門。」',choices:[
   {t:'你小時候真的聽過「三更三叩」這六個字嗎？',next:'wording'},
   {t:'先問她誰家以前遇過鬼',next:'story'}]},
  story:{speaker:'陳太太',text:'她一口氣講出三四件「聽人家說」的舊事，但沒有一件能確認時間、地點與第一手目擊。',choices:[{t:'回到原句：你最早何時聽到「三更三叩」？',next:'wording'}]},
  wording:{speaker:'陳太太',text:'她沉默了一會：「小時候只說晚上別亂開門。三更三叩……這句是最近才有人講。」',choices:[{t:'最近是多久？',next:'recent'}]},
  recent:{speaker:'陳太太',text:'「大概兩個禮拜。下雨那幾天講得最多。」原本像古老禁忌的句子，突然有了很近的時間邊界。',choices:[{t:'把舊禁忌和新版本分開記錄',next:'finish'}]},
  finish:{speaker:'調查筆記',text:'「夜裡別隨便應門」可能是舊有生活禁忌；具體的「三更三叩」版本則是近期才成形。',commit:true}
 }},
 source:{title:'追問最早來源',nodes:{
  start:{speaker:'陳太太',text:'「大家都這樣講，我哪知道最早是誰。」她先把來源推回「大家」。',choices:[
   {t:'不要問大家。回想第一個在你面前說出完整版本的人',next:'first'},
   {t:'問是不是廟裡的人都知道',next:'temple_guess'}]},
  temple_guess:{speaker:'陳太太',text:'「廟裡？也許吧。」這只是新的猜測，沒有把來源往前推一步。',choices:[{t:'回到第一個具體的人：誰在你面前說過？',next:'first'}]},
  first:{speaker:'陳太太',text:'她慢慢想起：「許伯。就是替德安宮送香燭那個老人。」',choices:[{t:'許伯住這條巷子嗎？',next:'outsider'}]},
  outsider:{speaker:'陳太太',text:'「沒有。他只有送東西才會過來。」一個不住在巷內的人，反而成了怪談傳入巷內的可追查節點。',choices:[{t:'記下姓名、工作與出現理由',next:'finish'}]},
  finish:{speaker:'調查筆記',text:'傳聞不再是無來源的「大家都說」：第一個可具名追查的節點是替德安宮送香燭的許伯。',commit:true}
 }},
 pressure_note:{title:'問蔡掌櫃與林家的關係',nodes:{
  start:{speaker:'蔡掌櫃',text:'「做生意歸做生意，林家的事跟我這店沒關係。」他說得太快，手卻壓住帳本旁一張摺過的紙。',choices:[
   {t:'不先談怪談，只問林家屋後那間小倉間',next:'store'},
   {t:'直接問是不是他叫人去裝鬼',next:'accuse'}]},
  accuse:{speaker:'蔡掌櫃',text:'他立刻冷下臉：「有證據就拿出來，沒有就別亂講。」目前你的確還不能把施壓等同於指使。',choices:[{t:'改問租款、倉間與催搬紀錄',next:'store'}]},
  store:{speaker:'蔡掌櫃',text:'他承認想把林家屋後的小倉間併進店後倉，並說租款拖了幾個月。',choices:[{t:'有沒有留下書面催告？',next:'paper'}]},
  paper:{speaker:'蔡掌櫃',text:'他把摺紙推過來。字條語氣很硬，只談租款、期限和搬空，沒有任何怪談或恐嚇指示。',choices:[{t:'把「施壓」與「指使裝鬼」分開記錄',next:'finish'}]},
  finish:{speaker:'調查筆記',text:'蔡掌櫃確實有催搬動機與施壓行為，但這張字條本身不能證明他授意任何鬧鬼手法。',commit:true}
 }},
 elder:{title:'請許伯逐字重述',nodes:{
  start:{speaker:'許伯',text:'「三更三叩？我沒這樣講。」他皺起眉，顯然對傳到巷裡的版本很不滿。',choices:[
   {t:'請他不要解釋，先逐字說自己原本怎麼講',next:'original'},
   {t:'問這是不是德安宮的正式禁忌',next:'ritual'}]},
  ritual:{speaker:'許伯',text:'「哪有什麼正式規矩。老人提醒孩子晚上小心而已。」他先否定了「固定科儀」這個說法。',choices:[{t:'那你原話是什麼？',next:'original'}]},
  original:{speaker:'許伯',text:'「夜深有人叫門，先問姓名再開。」沒有三更、沒有三叩，也沒有「第三次開門會出事」。',choices:[{t:'你在哪裡、對誰說過這句？',next:'context'}]},
  context:{speaker:'許伯',text:'他說是在送香燭休息時隨口提醒幾個年輕人，阿祿當時也在旁邊。',choices:[{t:'把原話與流傳版本分列',next:'finish'}]},
  finish:{speaker:'調查筆記',text:'許伯的原話是一般性的夜間安全提醒。具體的「三更三叩」並非他的原句。',commit:true}
 }},
 apprentice:{title:'問誰追問過禁忌細節',nodes:{
  start:{speaker:'許伯',text:'「誰會把一句提醒改成那樣，我也想知道。」',choices:[
   {t:'回想有人特別問過「幾次」「幾更」之類的細節嗎？',next:'memory'},
   {t:'問是不是陳太太自己添油加醋',next:'neighbor'}]},
  neighbor:{speaker:'許伯',text:'「她愛講話是真的，但我沒看見她最早怎麼傳。」這條路仍停在猜測。',choices:[{t:'改問曾在你面前追問細節的人',next:'memory'}]},
  memory:{speaker:'許伯',text:'他忽然想起：「阿祿有笑著問過——敲三次是不是更忌諱。」',choices:[{t:'那是在怪談傳開之前還是之後？',next:'timing'}]},
  timing:{speaker:'許伯',text:'「之前。沒幾天，巷子裡就開始講三叩。」時間順序第一次把阿祿和怪談加工連了起來。',choices:[{t:'只記錄可確認的問話與先後，不直接說他就是散播者',next:'finish'}]},
  finish:{speaker:'調查筆記',text:'阿祿在怪談成形前曾主動追問「敲三次」的禁忌性。這是版本加工的重要線索，但仍需與其他證據交叉。',commit:true}
 }},
 confess:{title:'按時間順序對質阿祿',nodes:{
  start:{speaker:'阿祿',text:'「我就是送貨。鞋子少顆釘，也不能說我去敲門。」他還在試圖把每一件證據拆開。',choices:[
   {t:'先不談動機，依序擺出送貨簿、鞋跟與蠟線',next:'chain'},
   {t:'先說你已經知道是他做的，逼他認',next:'push'}]},
  push:{speaker:'阿祿',text:'「你知道？那你還問什麼。」他反而抓住你沒有說明證據鏈的空隙。',choices:[{t:'改用證據鏈，一項一項問',next:'chain'}]},
  chain:{speaker:'調查筆記',text:'第二、第三夜他都在附近；後巷鞋跟缺口與他的右鞋一致；門框殘留可由店裡上蠟麻線解釋；後間又少了一個尺寸相近的小木墜。',choices:[{t:'問他第三夜阿信突然開門後發生什麼',next:'third'}]},
  third:{speaker:'阿祿',text:'他的臉色變了：「我沒想到他真的會開門。」這句話第一次承認他就在現場。',choices:[{t:'第二夜也是你？怪談又是怎麼來的？',next:'admit'}]},
  admit:{speaker:'阿祿',text:'他終於承認，第一夜林家真的被不明聲音嚇到後，他把許伯的提醒加工成「三叩」版本；第二、第三夜用細線拖木墜敲門，想把林家嚇到搬走。',choices:[{t:'記錄承認內容，但把第一夜仍留給物證解釋',next:'finish'}]},
  finish:{speaker:'調查筆記',text:'阿祿的承認與鞋印、送貨簿、工具和門框痕跡互相吻合；第二、第三夜的人為部分形成完整證據鏈。',commit:true}
 }},
 boundary:{title:'追問蔡掌櫃是否授意',nodes:{
  start:{speaker:'蔡掌櫃',text:'「我催他們搬，這我認。但裝神弄鬼不是我叫的。」阿祿站在旁邊沒有抬頭。',choices:[
   {t:'先問阿祿：掌櫃有沒有明確叫你製造敲門？',next:'ask_apprentice'},
   {t:'直接把蔡掌櫃寫成主使者',next:'overreach'}]},
  overreach:{speaker:'調查筆記',text:'催搬動機很強，但你手上的字條與目前證詞都沒有「指使裝鬼」這一步。把它直接寫成主使會超過證據。',choices:[{t:'改問兩人的具體對話與指示',next:'ask_apprentice'}]},
  ask_apprentice:{speaker:'阿祿',text:'「他只一直說林家最好快點搬。我自己想到那個辦法。」',choices:[{t:'蔡掌櫃知道你在雨夜去林家附近嗎？',next:'knowledge'}]},
  knowledge:{speaker:'蔡掌櫃',text:'「我知道他送貨會經過，但不知道他拿線去敲門。」這仍可能顯示管理與施壓問題，卻不足以證明直接授意。',choices:[{t:'把可證明與不可證明的責任分開',next:'finish'}]},
  finish:{speaker:'調查筆記',text:'蔡掌櫃的催搬施壓是重要背景；目前可確認的恐嚇手法則由阿祿自行設計。兩種責任不能合併成同一結論。',commit:true}
 }}
};

function addStyle(){
 if(document.getElementById('rainDialogueStyle'))return;
 var s=document.createElement('style');s.id='rainDialogueStyle';s.textContent='\
.rain-q-backdrop{position:fixed;inset:0;z-index:140;background:rgba(7,8,6,.78);display:flex;align-items:flex-end;justify-content:center;padding:16px env(safe-area-inset-right) calc(16px + env(safe-area-inset-bottom)) env(safe-area-inset-left);backdrop-filter:blur(3px)}.rain-q-panel{width:min(720px,100%);max-height:82vh;overflow:auto;border:1px solid #4a483d;border-radius:18px 18px 14px 14px;background:linear-gradient(180deg,#20221c,#151713);box-shadow:0 18px 55px rgba(0,0,0,.45);padding:17px}.rain-q-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.rain-q-kicker{font-size:.67rem;letter-spacing:.12em;color:#8f8b7e}.rain-q-title{margin:4px 0 0;font-size:1.05rem}.rain-q-close{border:1px solid #41443a;background:#171914;color:#aaa799;border-radius:10px;padding:7px 10px}.rain-q-speaker{margin-top:16px;color:#c8ad70;font-weight:700;font-size:.78rem;letter-spacing:.05em}.rain-q-text{margin:7px 0 0;line-height:1.82;color:#e5dfd1}.rain-q-choices{display:grid;gap:9px;margin-top:16px}.rain-q-choice{border:1px solid #41443a;background:#1c1f19;color:#eee9dc;border-radius:13px;padding:12px 13px;text-align:left;line-height:1.55}.rain-q-choice:active{transform:scale(.99);border-color:#8d7951}.rain-q-finish{background:#d4c18e;color:#242116;border-color:#d4c18e;font-weight:700}.rain-q-progress{margin-top:13px;font-size:.7rem;color:#7f7d72}.rain-q-note{margin-top:12px;padding:9px 11px;border-left:3px solid #6e6b5e;background:#191b17;color:#9d9a8e;font-size:.76rem;line-height:1.55}@media(min-width:720px){.rain-q-backdrop{align-items:center}.rain-q-panel{border-radius:18px}}';document.head.appendChild(s);
}

function closeBox(){var b=document.getElementById('rainQuestionBox');if(b)b.remove();active=null}
function currentNode(){return active&&scripts[active.id]&&scripts[active.id].nodes[active.node]}
function renderBox(){
 addStyle();var script=scripts[active.id],node=currentNode();if(!script||!node){closeBox();return}
 var old=document.getElementById('rainQuestionBox');if(old)old.remove();
 var wrap=document.createElement('div');wrap.id='rainQuestionBox';wrap.className='rain-q-backdrop';
 var html='<div class="rain-q-panel"><div class="rain-q-top"><div><div class="rain-q-kicker">WITNESS QUESTIONING</div><h3 class="rain-q-title">'+esc(script.title)+'</h3></div><button class="rain-q-close" type="button">暫停追問</button></div><div class="rain-q-speaker">'+esc(node.speaker||'調查筆記')+'</div><p class="rain-q-text">'+esc(node.text)+'</p><div class="rain-q-choices">';
 if(node.commit){html+='<button class="rain-q-choice rain-q-finish" data-commit="1" type="button">完成追問並記入案件紀錄</button>'}
 else (node.choices||[]).forEach(function(c,i){html+='<button class="rain-q-choice" data-choice="'+i+'" type="button">'+esc(c.t)+'</button>'});
 html+='</div><div class="rain-q-note">追問的目的不是找「看起來最可疑」的人，而是把證詞拆成可以核對的時間、行為與原話。</div></div>';
 wrap.innerHTML=html;document.body.appendChild(wrap);
 wrap.querySelector('.rain-q-close').onclick=closeBox;
 Array.prototype.forEach.call(wrap.querySelectorAll('[data-choice]'),function(btn){btn.onclick=function(){var c=node.choices[Number(this.getAttribute('data-choice'))];if(!c)return;active.node=c.next;renderBox()}});
 var commit=wrap.querySelector('[data-commit]');if(commit)commit.onclick=finishConversation;
}
function finishConversation(){
 if(!active)return;var id=active.id,button=active.button;var done=loadDone();done[id]=true;saveDone(done);closeBox();
 if(button&&document.documentElement.contains(button)){bypass=true;try{button.click()}finally{bypass=false}}
}
function begin(id,button){active={id:id,node:'start',button:button};renderBox()}

document.addEventListener('click',function(e){
 if(bypass)return;
 var btn=e.target.closest&&e.target.closest('#v2Rain [data-action]');if(!btn)return;
 var id=btn.getAttribute('data-action');var script=scripts[id];if(!script)return;
 if(btn.classList.contains('done'))return;
 var done=loadDone();if(done[id])return;
 e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();begin(id,btn);
},true);

})();