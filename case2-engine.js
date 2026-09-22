(function(){
'use strict';

function $(id){return document.getElementById(id)}

var RAIN_SAVE='mist-taiwan-rain-canon-v1';
var RAIN_CASE='rain-door-1958-v1';
var loading=false;
var loaded=false;
var failed=false;
var waiting=[];
var rainLoadError='';

function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function normalizeRainSave(){
 var v=parse(RAIN_SAVE);if(!v||v.caseId!==RAIN_CASE)return v;
 var changed=false;
 function set(k,val){if(v[k]===undefined||v[k]===null){v[k]=val;changed=true}}
 if(!v.visited||typeof v.visited!=='object'||Array.isArray(v.visited)){v.visited={home:true};changed=true}
 if(!Array.isArray(v.evidence)){v.evidence=[];changed=true}
 var validEvidence=['e01','e02','e03','e04','e05','e06','e07','e08','e09','e10','e11','e12'];
 var cleanEvidence=v.evidence.filter(function(id,index){return validEvidence.indexOf(id)>=0&&v.evidence.indexOf(id)===index});
 if(cleanEvidence.length!==v.evidence.length){v.evidence=cleanEvidence;changed=true}
 if(!Array.isArray(v.people)){v.people=[];changed=true}
 if(!v.flags||typeof v.flags!=='object'||Array.isArray(v.flags)){v.flags={};changed=true}
 if(!v.done||typeof v.done!=='object'||Array.isArray(v.done)){v.done={};changed=true}
 if(!Array.isArray(v.answers)){v.answers=[];changed=true}
 if(['home','corridor','entrance','yonghe','stairs','spare','rooftop'].indexOf(v.loc)<0){v.loc='home';changed=true}
 if(['investigate','deduction','done'].indexOf(v.phase)<0){v.phase=v.finished?'done':'investigate';changed=true}
 var deductionOrder=['who_knocked','moveout','timeline','belongings','sealed_letter','cause'],solved={};
 v.answers.forEach(function(a){if(a&&a.ok===true&&deductionOrder.indexOf(a.q)>=0)solved[a.q]=true});
 var expectedDeduction=0;while(expectedDeduction<deductionOrder.length&&solved[deductionOrder[expectedDeduction]])expectedDeduction++;
 if(typeof v.deduction!=='number'||!isFinite(v.deduction)||v.deduction<0||v.deduction>=deductionOrder.length||v.deduction!==expectedDeduction){v.deduction=expectedDeduction;changed=true}
 if(typeof v.focus!=='number'||!isFinite(v.focus)||v.focus<0||v.focus>4){v.focus=4;changed=true}
 set('feedback','');set('finished',false);set('ending',null);
 if(v.feedback==='帆布已經發硬，提把磨得起毛。靠近袋口的布條上仍能看見三個繡字：許月琴。'){v.feedback='';changed=true}
 if(changed){try{localStorage.setItem(RAIN_SAVE,JSON.stringify(v))}catch(e){}}
 return v;
}
function setStatus(text){var status=$('bootStatus');if(status)status.textContent=text||''}
function installProgressiveVisibility(){
 if($('case2ProgressiveVisibilityStyle'))return;
 var style=document.createElement('style');
 style.id='case2ProgressiveVisibilityStyle';
 style.textContent='.c2-btn:disabled:not(.done),.c2-map button:disabled{display:none!important}';
 document.head.appendChild(style);
}
function installCasePickerStyle(){
 if($('casePickerStyle'))return;
 var style=document.createElement('style');
 style.id='casePickerStyle';
 style.textContent='.case-picker{margin-top:14px;padding:14px;border:1px solid #3a3d33;border-radius:14px;background:#171914}.case-picker label{display:block;margin-bottom:8px;color:#aaa799;font-size:.75rem;letter-spacing:.08em}.case-picker-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.case-picker select{min-width:0;width:100%;border:1px solid #3b3e34;background:#181a16;color:#ece8dc;border-radius:12px;padding:12px 13px}.case-picker button{border:1px solid #8c7b50;background:#242318;color:#ece8dc;border-radius:12px;padding:12px 14px}.case-picker small{display:block;margin-top:8px;color:#858276;line-height:1.45}@media(max-width:420px){.case-picker-row{grid-template-columns:1fr}.case-picker button{width:100%}}';
 document.head.appendChild(style);
}
function ensureCasePicker(){
 var start=$('startScreen'),load=$('loadBtn'),old=$('casePicker');
 if(!start||!load)return;
 if(old)return;
 installCasePickerStyle();
 var box=document.createElement('div');
 box.id='casePicker';box.className='case-picker';
 box.innerHTML='<label for="casePickerSelect">案件選擇</label><div class="case-picker-row"><select id="casePickerSelect"><option value="case1">第一案｜失落的三頁</option><option value="case2">第二案｜雨夜敲門</option></select><button id="casePickerGo" type="button">進入案件</button></div><small>測試用入口；既有存檔仍依各案件原本規則讀取。</small>';
 load.insertAdjacentElement('afterend',box);
 var go=$('casePickerGo');
 if(go)go.onclick=function(){
  var select=$('casePickerSelect'),choice=select&&select.value;
  if(choice==='case2'){startRain();return}
  var first=$('startBtn');if(first)first.click();
 };
}

function settle(ok){
 var callbacks=waiting.slice();waiting.length=0;
 callbacks.forEach(function(fn){try{fn(ok)}catch(e){console.error(e)}});
}
function reportLoadError(src){
 failed=true;loading=false;
 rainLoadError='案件二資源載入失敗：'+src;
 console.error(rainLoadError);
 setStatus('案件二資源載入失敗，請重新整理頁面後再試。');
 settle(false);
}
function loadScript(src,next){
 var script=document.createElement('script'),settled=false;
 function finish(ok){if(settled)return;settled=true;if(typeof next==='function')next(ok)}
 script.src=src;script.async=false;
 script.onload=function(){finish(true)};
 script.onerror=function(){console.error('Script load failed:',src);finish(false)};
 document.head.appendChild(script);
}
function flushLoaded(){loaded=true;loading=false;failed=false;rainLoadError='';settle(true)}

function patchCase1ObservationUI(){
 var game=$('gameScreen'),img=$('sceneImage'),grid=$('actionGrid'),note=$('visualNote'),old=$('case1ObserveSceneBtn');
 if(!img||!grid)return;
 if(typeof img.onclick==='function'){
  img.__case1ObserveHandler=img.onclick;
  img.onclick=null;
 }
 if(!game||game.classList.contains('hidden')||typeof img.__case1ObserveHandler!=='function'||!img.getAttribute('src')){
  if(old)old.remove();
  return;
 }
 if(note&&note.textContent.indexOf('點擊圖片觀察｜')===0){
  var hint=note.textContent.slice('點擊圖片觀察｜'.length);
  if(hint)img.__case1ObserveHint=hint;
  if(note.textContent)note.textContent='';
 }
 var seen=!!(note&&note.textContent.indexOf('已觀察｜')===0),button=old;
 if(!button){
  button=document.createElement('button');
  button.id='case1ObserveSceneBtn';button.type='button';button.className='action-btn';
  button.onclick=function(){var fn=img.__case1ObserveHandler;if(typeof fn==='function')fn.call(img)};
  grid.insertBefore(button,grid.firstChild);
 }
 var detail=seen?'已觀察，可再次查看':(img.__case1ObserveHint||'查看場景細節');
 var html='<strong>觀察現場</strong><small>'+detail+'</small>';
 if(button.innerHTML!==html)button.innerHTML=html;
}

function loadRainRuntime(done){
 if(loaded&&window.Case2RainCanon){done(true);return}
 if(failed){done(false);return}
 waiting.push(done);
 if(loading)return;
 loading=true;

 function loadEngine(){
  if(window.Case2RainCanon){flushLoaded();return}
  loadScript('case2-rain-canon-engine.js?v=13',function(ok){
   if(!ok||!window.Case2RainCanon){reportLoadError('case2-rain-canon-engine.js?v=13');return}
   flushLoaded();
  });
 }

 if(window.CASE2_RAIN_CANON){loadEngine();return}
 loadScript('case2-rain-canon.js?v=9',function(ok){
  if(!ok||!window.CASE2_RAIN_CANON){reportLoadError('case2-rain-canon.js?v=9');return}
  loadEngine();
 });
}

function startRain(){
 normalizeRainSave();
 var next=$('nextCaseBtn'),originalText=next&&next.textContent;
 if(next){next.disabled=true;next.textContent='讀取《雨夜敲門》…'}
 setStatus('');
 loadRainRuntime(function(ok){
  if(next){next.disabled=false;if(originalText)next.textContent=originalText}
  if(!ok){setStatus('案件二資源載入失敗，請重新整理頁面後再試。');return}
  if(window.Case2RainCanon&&typeof window.Case2RainCanon.start==='function'){
   window.Case2RainCanon.start();return;
  }
  reportLoadError('Case2RainCanon.start');
 });
}

function patchEntryPoints(){
 var resume=$('rainResumeBtn');if(resume)resume.remove();
 var next=$('nextCaseBtn');
 if(next){var label='開始案件二：《雨夜敲門》';if(next.textContent!==label)next.textContent=label;if(next.onclick!==startRain)next.onclick=startRain}
 var chip=$('caseChip'),root=$('v2Rain');
 if(chip&&root&&!root.classList.contains('hidden')&&chip.textContent!=='CASE 02・雨夜敲門')chip.textContent='CASE 02・雨夜敲門';
}

installProgressiveVisibility();
ensureCasePicker();
patchEntryPoints();
patchCase1ObservationUI();
if(window.MutationObserver){new MutationObserver(function(){patchEntryPoints();patchCase1ObservationUI()}).observe(document.documentElement,{childList:true,subtree:true})}
})();
