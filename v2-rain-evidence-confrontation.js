(function(){
'use strict';

var bypass=false;
var active=null;

var challenges=[
 {
  key:'alu',
  witness:'阿祿',
  trigger:'先不談動機，依序擺出送貨簿、鞋跟與蠟線',
  title:'對質阿祿：建立證據鏈',
  intro:'不要一次把結論丟出去。依序提出能證明「人在附近 → 人與鞋印吻合 → 手法與現場吻合」的證物。',
  steps:[
   {need:'香燭店送貨簿',ask:'先證明阿祿在第二、第三個雨夜有機會出現在林宅一帶。',ok:'送貨簿把阿祿和第二、第三夜的時間窗口連起來。',react:'阿祿低頭看了一眼日期，沒有再否認那兩晚確實到過附近。'},
   {need:'阿祿鞋跟吻合',ask:'再證明後巷留下的不是「任何人的鞋印」，而是能和阿祿個別比對的痕跡。',ok:'缺釘位置吻合，讓鞋印從一般痕跡變成可指向特定人的物證。',react:'阿祿下意識把右腳往凳子底下收了半步。這次他沒有說「很多人都有這種鞋」。'},
   {need:'線蠟與門框殘留',ask:'最後證明他有一套能實際造成低位敲擊與拖痕的方法。',ok:'蠟線殘留把工具來源、門框刮痕與泥痕接成同一種手法。',react:'你把門框上的蠟質、店裡的防潮麻線與低位刮痕並排說明。阿祿沉默了；「只是送貨」已經無法同時解釋這三件事。'}
  ]
 },
 {
  key:'owner',
  witness:'蔡掌櫃',
  trigger:'把可證明與不可證明的責任分開',
  title:'界定蔡掌櫃的責任',
  intro:'這裡不是在替誰開脫，而是要分清楚「確實施壓」和「直接指使恐嚇」是否都有證據。',
  steps:[
   {need:'催售字條',ask:'先提出能直接證明蔡掌櫃確實對林家施加搬遷壓力的文件。',ok:'字條證明催搬與利益衝突確實存在。',react:'蔡掌櫃沒有否認字條。他改口只爭辯：「催他們搬，跟叫人裝鬼是兩回事。」'},
   {need:'阿祿的承認',ask:'再提出目前最能說明「裝神弄鬼的具體手法是誰設計」的證詞。',ok:'阿祿承認手法由自己設計；目前沒有直接證據把這一步推回蔡掌櫃。',react:'阿祿再次確認那套恐嚇手法是自己想到的。蔡掌櫃有施壓與利益動機，但你手上仍沒有「授意裝鬼」這一步的直接證據。'}
  ]
 }
];

function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(t){return String(t||'').replace(/^【出示證物】\s*/,'').trim()}
function challengeForText(t){t=norm(t);for(var i=0;i<challenges.length;i++)if(t===challenges[i].trigger)return challenges[i];return null}
function records(){
 var out=[];
 Array.prototype.forEach.call(document.querySelectorAll('#v2Rain .v2-rec'),function(card){
  var strong=card.querySelector('strong'),small=card.querySelector('small');if(!strong)return;
  var raw=strong.textContent.trim(),name=raw.split('｜')[0].trim();
  if(!name)return;
  out.push({name:name,meta:raw.indexOf('｜')>=0?raw.split('｜').slice(1).join('｜').trim():'案件紀錄',desc:small?small.textContent.trim():''});
 });
 return out;
}
function hasRecord(name){return records().some(function(r){return r.name===name})}

function wrongReaction(spec,stepIndex,name){
 if(spec.key==='alu'){
  if(stepIndex===0){
   if(name==='阿祿鞋跟吻合')return{speaker:'阿祿',text:'「鞋子像又怎樣？你還沒證明第二、第三晚我人在這裡。」',logic:'鞋印能連到人，但這一問先需要固定「時間與出現機會」。'};
   if(name==='線蠟與門框殘留')return{speaker:'阿祿',text:'「你說那條線能敲門，也不等於那兩晚是我在用。」',logic:'手法證據不能取代時間證據。'};
   if(name==='催售字條')return{speaker:'阿祿',text:'「那是掌櫃寫的。你拿他的字條，怎麼證明我那兩晚在哪？」',logic:'動機背景不能直接證明阿祿的行蹤。'};
   if(name==='第一夜聲音重現')return{speaker:'阿祿',text:'「那不是反而證明第一夜跟我沒關係？」',logic:'這件證物解釋第一夜，無法固定第二、第三夜阿祿的位置。'};
   return{speaker:'阿祿',text:'「這跟我第二、第三晚有沒有到林家附近，有直接關係嗎？」',logic:'先證明人在正確的時間窗口出現，再談其他層次。'};
  }
  if(stepIndex===1){
   if(name==='香燭店送貨簿')return{speaker:'阿祿',text:'「我承認有送貨。送過貨就代表後巷鞋印是我的？」',logic:'送貨簿只能證明機會，不能把特定鞋印指向特定人。'};
   if(name==='線蠟與門框殘留')return{speaker:'阿祿',text:'「就算有人用過蠟線，你還沒證明後巷那個人是我。」',logic:'這一步需要的是個別識別特徵，而不是手法。'};
   if(name==='上蠟細麻線')return{speaker:'阿祿',text:'「店裡綁香紙都用這種線。你要說後巷的人是我，光靠店裡有線不夠吧？」',logic:'共用工具來源的指認力弱於鞋跟缺釘這種個別特徵。'};
   return{speaker:'阿祿',text:'「你還是沒有把那個鞋印跟我這雙鞋直接接起來。」',logic:'現在要回答的是「後巷行動者是否能個別指向阿祿」。'};
  }
  if(stepIndex===2){
   if(name==='阿祿鞋跟吻合')return{speaker:'阿祿',text:'「好，就算我走過後巷。走過後巷等於我敲了門？」',logic:'人在場不等於已證明行為手法。'};
   if(name==='香燭店送貨簿')return{speaker:'阿祿',text:'「你已經說過我有送貨。那還是不能證明門是怎麼響的。」',logic:'時間與機會已成立，最後需要把工具與現場痕跡接起來。'};
   if(name==='上蠟細麻線')return{speaker:'阿祿',text:'「這是店裡的線，不是我一個人的。你怎麼知道門邊那道痕就是它留下的？」',logic:'工具存在本身不足，需要現場殘留的交叉比對。'};
   if(name==='缺口小木墜')return{speaker:'阿祿',text:'「少一個木墜，就一定是拿去敲林家的門？」',logic:'缺失工具是線索，但單獨無法證明使用位置與方式。'};
   return{speaker:'阿祿',text:'「你證明了別的事，還沒證明我是用什麼方法讓門響。」',logic:'最後一層必須直接連接工具、門框痕跡與拖動路徑。'};
  }
 }
 if(spec.key==='owner'){
  if(stepIndex===0){
   if(name==='阿祿的承認')return{speaker:'蔡掌櫃',text:'「他做了什麼是他的口供。你先說我到底做了什麼。」',logic:'阿祿的自白不能替代證明蔡掌櫃確實施壓的文件。'};
   if(name==='香燭店送貨簿')return{speaker:'蔡掌櫃',text:'「學徒出去送貨，這本來就是他的工作。這怎麼證明我逼林家搬？」',logic:'員工行蹤與掌櫃施壓是不同命題。'};
   if(name==='阿祿鞋跟吻合')return{speaker:'蔡掌櫃',text:'「那是他的鞋，不是我的。」',logic:'阿祿的個人物證不能直接證明蔡掌櫃對林家的催搬行為。'};
   return{speaker:'蔡掌櫃',text:'「你要說我施壓，就拿能證明我自己做過什麼的東西。」',logic:'先處理蔡掌櫃本人可直接確認的行為。'};
  }
  if(stepIndex===1){
   if(name==='催售字條')return{speaker:'蔡掌櫃',text:'「字條只寫搬空和欠款。哪一個字叫他去裝鬼？」',logic:'字條能證明施壓，卻不能再往前推成「指使恐嚇」。'};
   if(name==='阿祿鞋跟吻合')return{speaker:'蔡掌櫃',text:'「他的鞋印跟我下過什麼命令有什麼關係？」',logic:'行動者身分成立，不等於主使關係成立。'};
   if(name==='線蠟與門框殘留')return{speaker:'蔡掌櫃',text:'「那能證明怎麼敲門，不能證明是我叫他這樣做。」',logic:'手法證據仍缺少「指示關係」。'};
   return{speaker:'蔡掌櫃',text:'「你現在是在證明他做了什麼，還是在證明我叫他做？」',logic:'最後要分開行動者責任與可能的授意責任。'};
  }
 }
 return{speaker:spec.witness||'對質對象',text:'「這件東西能直接回答你現在問的問題嗎？」',logic:'證物與命題之間還缺一段直接連結。'};
}

function addStyle(){
 if(document.getElementById('rainEvidenceStyle'))return;
 var s=document.createElement('style');s.id='rainEvidenceStyle';s.textContent='\
.rain-ev-backdrop{position:fixed;inset:0;z-index:180;background:rgba(5,6,5,.84);display:flex;align-items:flex-end;justify-content:center;padding:14px env(safe-area-inset-right) calc(14px + env(safe-area-inset-bottom)) env(safe-area-inset-left);backdrop-filter:blur(4px)}.rain-ev-panel{width:min(760px,100%);max-height:88vh;overflow:auto;border:1px solid #514d3e;border-radius:18px 18px 14px 14px;background:linear-gradient(180deg,#22231d,#141611);box-shadow:0 22px 65px rgba(0,0,0,.52);padding:17px}.rain-ev-kicker{font-size:.66rem;letter-spacing:.12em;color:#9d9889}.rain-ev-title{margin:4px 0 7px;font-size:1.08rem}.rain-ev-intro{margin:0;color:#aaa697;line-height:1.65;font-size:.82rem}.rain-ev-step{margin-top:14px;padding:12px;border:1px solid #454237;border-radius:12px;background:#1a1c17}.rain-ev-step strong{display:block;color:#d6c79e;margin-bottom:5px}.rain-ev-step span{color:#c1bbae;line-height:1.58;font-size:.86rem}.rain-ev-picked{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}.rain-ev-chip{padding:5px 8px;border:1px solid #5a5546;border-radius:999px;color:#bdb5a2;font-size:.68rem}.rain-ev-list{display:grid;gap:8px;margin-top:14px}.rain-ev-item{border:1px solid #3e4137;background:#191b16;color:#e6e0d3;border-radius:12px;padding:11px 12px;text-align:left}.rain-ev-item strong{display:block}.rain-ev-item small{display:block;margin-top:4px;color:#8f8c80;line-height:1.5}.rain-ev-item:active{transform:scale(.99);border-color:#9b8754}.rain-ev-feedback{margin-top:12px;padding:10px 11px;border-left:3px solid #8d7853;background:#211e18;color:#c9c1b0;line-height:1.6;font-size:.8rem}.rain-ev-feedback.bad{border-left-color:#8c5f58;color:#d0aaa2}.rain-ev-speaker{display:block;margin-bottom:5px;color:#d3a79b;font-weight:700;font-size:.73rem;letter-spacing:.04em}.rain-ev-logic{display:block;margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.08);color:#999587;font-size:.74rem}.rain-ev-feedback.good .rain-ev-speaker{color:#c8ad70}.rain-ev-cancel{margin-top:13px;width:100%;border:1px solid #41443a;background:#171914;color:#aaa799;border-radius:11px;padding:10px}.rain-q-choice.rain-needs-evidence:before{content:"證物";display:inline-block;margin-right:7px;padding:2px 6px;border:1px solid #776b4c;border-radius:999px;color:#cbb782;font-size:.6rem;vertical-align:1px}@media(min-width:720px){.rain-ev-backdrop{align-items:center}.rain-ev-panel{border-radius:18px}.rain-ev-list{grid-template-columns:1fr 1fr}}';
 document.head.appendChild(s);
}

function closePicker(){var x=document.getElementById('rainEvidencePicker');if(x)x.remove();active=null}
function feedbackHtml(feedback,bad){
 if(!feedback)return'';
 if(typeof feedback==='string')return'<div class="rain-ev-feedback '+(bad?'bad':'good')+'">'+esc(feedback)+'</div>';
 return'<div class="rain-ev-feedback '+(bad?'bad':'good')+'"><span class="rain-ev-speaker">'+esc(feedback.speaker||'調查筆記')+'</span>'+esc(feedback.text||'')+(feedback.logic?'<span class="rain-ev-logic">證明力：'+esc(feedback.logic)+'</span>':'')+'</div>';
}
function renderPicker(feedback,bad){
 addStyle();if(!active)return;var spec=active.spec,step=spec.steps[active.step],items=records();
 var old=document.getElementById('rainEvidencePicker');if(old)old.remove();
 var wrap=document.createElement('div');wrap.id='rainEvidencePicker';wrap.className='rain-ev-backdrop';
 var chips='';active.picked.forEach(function(n){chips+='<span class="rain-ev-chip">'+esc(n)+'</span>'});
 var html='<div class="rain-ev-panel"><div class="rain-ev-kicker">PRESENT EVIDENCE</div><h3 class="rain-ev-title">'+esc(spec.title)+'</h3><p class="rain-ev-intro">'+esc(spec.intro)+'</p><div class="rain-ev-step"><strong>證物 '+(active.step+1)+' / '+spec.steps.length+'</strong><span>'+esc(step.ask)+'</span></div><div class="rain-ev-picked">'+chips+'</div>';
 html+=feedbackHtml(feedback,bad);
 html+='<div class="rain-ev-list">';
 items.forEach(function(r){html+='<button class="rain-ev-item" data-evidence="'+esc(r.name)+'" type="button"><strong>'+esc(r.name)+'</strong><small>'+esc(r.meta+(r.desc?'｜'+r.desc:''))+'</small></button>'});
 html+='</div><button class="rain-ev-cancel" type="button">暫停對質</button></div>';
 wrap.innerHTML=html;document.body.appendChild(wrap);
 wrap.querySelector('.rain-ev-cancel').onclick=closePicker;
 Array.prototype.forEach.call(wrap.querySelectorAll('[data-evidence]'),function(btn){btn.onclick=function(){chooseEvidence(this.getAttribute('data-evidence'))}});
}
function chooseEvidence(name){
 if(!active)return;var spec=active.spec,step=spec.steps[active.step],currentStep=active.step;
 if(name!==step.need){active.misses++;renderPicker(wrongReaction(spec,currentStep,name),true);return}
 active.picked.push(name);active.step+=1;
 var good={speaker:spec.witness||'調查筆記',text:step.react||step.ok,logic:step.ok};
 if(active.step>=spec.steps.length){
  var btn=active.button;closePicker();
  var note=document.querySelector('#rainQuestionBox .rain-q-note');if(note)note.textContent='證據鏈成立：'+step.ok;
  if(btn&&document.documentElement.contains(btn)){bypass=true;try{btn.click()}finally{bypass=false}}
  return;
 }
 renderPicker(good,false);
}
function begin(spec,button){
 for(var i=0;i<spec.steps.length;i++){
  if(!hasRecord(spec.steps[i].need)){
   var note=document.querySelector('#rainQuestionBox .rain-q-note');if(note)note.textContent='你還缺少必要證物：「'+spec.steps[i].need+'」。先回現場取得能直接支撐對質的紀錄。';
   return;
  }
 }
 active={spec:spec,button:button,step:0,picked:[],misses:0};renderPicker();
}
function decorateChoices(){
 addStyle();Array.prototype.forEach.call(document.querySelectorAll('#rainQuestionBox .rain-q-choice'),function(btn){if(challengeForText(btn.textContent))btn.classList.add('rain-needs-evidence')});
}

document.addEventListener('click',function(e){
 if(bypass)return;
 var btn=e.target.closest&&e.target.closest('#rainQuestionBox .rain-q-choice');if(!btn)return;
 var spec=challengeForText(btn.textContent);if(!spec)return;
 e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();begin(spec,btn);
},true);

new MutationObserver(function(){decorateChoices()}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateChoices);else decorateChoices();
})();
