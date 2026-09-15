(function(){
'use strict';

var bypass=false;
var active=null;

var challenges=[
 {
  trigger:'先不談動機，依序擺出送貨簿、鞋跟與蠟線',
  title:'對質阿祿：建立證據鏈',
  intro:'不要一次把結論丟出去。依序提出能證明「人在附近 → 人與鞋印吻合 → 手法與現場吻合」的證物。',
  steps:[
   {need:'香燭店送貨簿',ask:'先證明阿祿在第二、第三個雨夜有機會出現在林宅一帶。',ok:'送貨簿把阿祿和第二、第三夜的時間窗口連起來。'},
   {need:'阿祿鞋跟吻合',ask:'再證明後巷留下的不是「任何人的鞋印」，而是能和阿祿個別比對的痕跡。',ok:'缺釘位置吻合，讓鞋印從一般痕跡變成可指向特定人的物證。'},
   {need:'線蠟與門框殘留',ask:'最後證明他有一套能實際造成低位敲擊與拖痕的方法。',ok:'蠟線殘留把工具來源、門框刮痕與泥痕接成同一種手法。'}
  ]
 },
 {
  trigger:'把可證明與不可證明的責任分開',
  title:'界定蔡掌櫃的責任',
  intro:'這裡不是在替誰開脫，而是要分清楚「確實施壓」和「直接指使恐嚇」是否都有證據。',
  steps:[
   {need:'催售字條',ask:'先提出能直接證明蔡掌櫃確實對林家施加搬遷壓力的文件。',ok:'字條證明催搬與利益衝突確實存在。'},
   {need:'阿祿的承認',ask:'再提出目前最能說明「裝神弄鬼的具體手法是誰設計」的證詞。',ok:'阿祿承認手法由自己設計；目前沒有直接證據把這一步推回蔡掌櫃。'}
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

function addStyle(){
 if(document.getElementById('rainEvidenceStyle'))return;
 var s=document.createElement('style');s.id='rainEvidenceStyle';s.textContent='\
.rain-ev-backdrop{position:fixed;inset:0;z-index:180;background:rgba(5,6,5,.84);display:flex;align-items:flex-end;justify-content:center;padding:14px env(safe-area-inset-right) calc(14px + env(safe-area-inset-bottom)) env(safe-area-inset-left);backdrop-filter:blur(4px)}.rain-ev-panel{width:min(760px,100%);max-height:88vh;overflow:auto;border:1px solid #514d3e;border-radius:18px 18px 14px 14px;background:linear-gradient(180deg,#22231d,#141611);box-shadow:0 22px 65px rgba(0,0,0,.52);padding:17px}.rain-ev-kicker{font-size:.66rem;letter-spacing:.12em;color:#9d9889}.rain-ev-title{margin:4px 0 7px;font-size:1.08rem}.rain-ev-intro{margin:0;color:#aaa697;line-height:1.65;font-size:.82rem}.rain-ev-step{margin-top:14px;padding:12px;border:1px solid #454237;border-radius:12px;background:#1a1c17}.rain-ev-step strong{display:block;color:#d6c79e;margin-bottom:5px}.rain-ev-step span{color:#c1bbae;line-height:1.58;font-size:.86rem}.rain-ev-picked{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}.rain-ev-chip{padding:5px 8px;border:1px solid #5a5546;border-radius:999px;color:#bdb5a2;font-size:.68rem}.rain-ev-list{display:grid;gap:8px;margin-top:14px}.rain-ev-item{border:1px solid #3e4137;background:#191b16;color:#e6e0d3;border-radius:12px;padding:11px 12px;text-align:left}.rain-ev-item strong{display:block}.rain-ev-item small{display:block;margin-top:4px;color:#8f8c80;line-height:1.5}.rain-ev-item:active{transform:scale(.99);border-color:#9b8754}.rain-ev-feedback{margin-top:12px;padding:10px 11px;border-left:3px solid #8d7853;background:#211e18;color:#c9c1b0;line-height:1.55;font-size:.8rem}.rain-ev-feedback.bad{border-left-color:#8c5f58;color:#d0aaa2}.rain-ev-cancel{margin-top:13px;width:100%;border:1px solid #41443a;background:#171914;color:#aaa799;border-radius:11px;padding:10px}.rain-q-choice.rain-needs-evidence:before{content:"證物";display:inline-block;margin-right:7px;padding:2px 6px;border:1px solid #776b4c;border-radius:999px;color:#cbb782;font-size:.6rem;vertical-align:1px}@media(min-width:720px){.rain-ev-backdrop{align-items:center}.rain-ev-panel{border-radius:18px}.rain-ev-list{grid-template-columns:1fr 1fr}}';
 document.head.appendChild(s);
}

function closePicker(){var x=document.getElementById('rainEvidencePicker');if(x)x.remove();active=null}
function renderPicker(feedback,bad){
 addStyle();if(!active)return;var spec=active.spec,step=spec.steps[active.step],items=records();
 var old=document.getElementById('rainEvidencePicker');if(old)old.remove();
 var wrap=document.createElement('div');wrap.id='rainEvidencePicker';wrap.className='rain-ev-backdrop';
 var chips='';active.picked.forEach(function(n){chips+='<span class="rain-ev-chip">'+esc(n)+'</span>'});
 var html='<div class="rain-ev-panel"><div class="rain-ev-kicker">PRESENT EVIDENCE</div><h3 class="rain-ev-title">'+esc(spec.title)+'</h3><p class="rain-ev-intro">'+esc(spec.intro)+'</p><div class="rain-ev-step"><strong>證物 '+(active.step+1)+' / '+spec.steps.length+'</strong><span>'+esc(step.ask)+'</span></div><div class="rain-ev-picked">'+chips+'</div>';
 if(feedback)html+='<div class="rain-ev-feedback '+(bad?'bad':'')+'">'+esc(feedback)+'</div>';
 html+='<div class="rain-ev-list">';
 items.forEach(function(r){html+='<button class="rain-ev-item" data-evidence="'+esc(r.name)+'" type="button"><strong>'+esc(r.name)+'</strong><small>'+esc(r.meta+(r.desc?'｜'+r.desc:''))+'</small></button>'});
 html+='</div><button class="rain-ev-cancel" type="button">暫停對質</button></div>';
 wrap.innerHTML=html;document.body.appendChild(wrap);
 wrap.querySelector('.rain-ev-cancel').onclick=closePicker;
 Array.prototype.forEach.call(wrap.querySelectorAll('[data-evidence]'),function(btn){btn.onclick=function(){chooseEvidence(this.getAttribute('data-evidence'))}});
}
function chooseEvidence(name){
 if(!active)return;var spec=active.spec,step=spec.steps[active.step];
 if(name!==step.need){renderPicker('這件紀錄和案件可能有關，但不能直接支撐目前這一問。請換一件能正面證明這一步的證物。',true);return}
 active.picked.push(name);active.step+=1;
 if(active.step>=spec.steps.length){
  var btn=active.button;var msg=step.ok;closePicker();
  var note=document.querySelector('#rainQuestionBox .rain-q-note');if(note)note.textContent='證據鏈成立：'+msg;
  if(btn&&document.documentElement.contains(btn)){bypass=true;try{btn.click()}finally{bypass=false}}
  return;
 }
 renderPicker(step.ok,false);
}
function begin(spec,button){
 for(var i=0;i<spec.steps.length;i++){
  if(!hasRecord(spec.steps[i].need)){
   var note=document.querySelector('#rainQuestionBox .rain-q-note');if(note)note.textContent='你還缺少必要證物：「'+spec.steps[i].need+'」。先回現場取得能直接支撐對質的紀錄。';
   return;
  }
 }
 active={spec:spec,button:button,step:0,picked:[]};renderPicker();
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
