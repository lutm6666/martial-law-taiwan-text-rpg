(function(){
'use strict';

function $(id){return document.getElementById(id)}

var RAIN_SAVE='mist-taiwan-rain-canon-v1';
var RAIN_CASE='rain-door-1958-v1';
var CASE1_SAVE='mist-taiwan-case-save-v4';
var loading=false;
var loaded=false;
var failed=false;
var waiting=[];
var rainLoadError='';
var case3Loading=false;
var case3Loaded=false;
var case3Failed=false;
var case3Waiting=[];
var case3LoadError='';

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
function currentPlayerName(){
 var v=parse(CASE1_SAVE)||{},name=typeof v.name==='string'?v.name.trim():'';
 if(name)return name;
 var input=$('nameInput'),typed=input&&typeof input.value==='string'?input.value.trim():'';
 return typed||'林默';
}
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
 style.textContent='.case-picker{margin-top:14px;padding:14px;border:1px solid #3a3d33;border-radius:14px;background:#171914}.case-picker label{display:block;margin-bottom:8px;color:#aaa799;font-size:.75rem;letter-spacing:.08em}.case-picker-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.case-picker select{min-width:0;width:100%;border:1px solid #3b3e34;background:#181a16;color:#ece8dc;border-radius:12px;padding:12px 13px}.case-picker button{border:1px solid #8c7b50;background:#242318;color:#ece8dc;border-radius:12px;padding:12px 14px}.case-picker small{display:block;margin-top:8px;color:#858276;line-height:1.45}#case3Production .c3-shell{padding:0 0 96px}#case3Production .c3-prod-home{display:block;width:100%;margin-top:12px;border:1px solid #8c7b50;background:#242318;color:#ece8dc;border-radius:13px;padding:12px;text-align:center}@media(max-width:420px){.case-picker-row{grid-template-columns:1fr}.case-picker button{width:100%}}';
 document.head.appendChild(style);
}
function ensureCasePicker(){
 var start=$('startScreen'),load=$('loadBtn'),old=$('casePicker');
 if(!start||!load)return;
 if(old)return;
 installCasePickerStyle();
 var box=document.createElement('div');
 box.id='casePicker';box.className='case-picker';
 box.innerHTML='<label for="casePickerSelect">案件選擇</label><div class="case-picker-row"><select id="casePickerSelect"><option value="case1">第一案｜失落的三頁</option><option value="case2">第二案｜雨夜敲門</option><option value="case3">第三案｜第十三張底片</option></select><button id="casePickerGo" type="button">進入案件</button></div><small>可直接進入任一案件；各案存檔彼此獨立。</small>';
 load.insertAdjacentElement('afterend',box);
 var go=$('casePickerGo');
 if(go)go.onclick=function(){
  var select=$('casePickerSelect'),choice=select&&select.value;
  if(choice==='case3'){startCase3();return}
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

function settleCase3(ok){
 var callbacks=case3Waiting.slice();case3Waiting.length=0;
 callbacks.forEach(function(fn){try{fn(ok)}catch(e){console.error(e)}});
}
function reportCase3LoadError(src){
 case3Failed=true;case3Loading=false;
 case3LoadError='案件三資源載入失敗：'+src;
 console.error(case3LoadError);
 setStatus('案件三資源載入失敗，請重新整理頁面後再試。');
 settleCase3(false);
}
function flushCase3Loaded(){case3Loaded=true;case3Loading=false;case3Failed=false;case3LoadError='';settleCase3(true)}

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
  loadScript('case2-rain-canon-engine.js?v=17',function(ok){
   if(!ok||!window.Case2RainCanon){reportLoadError('case2-rain-canon-engine.js?v=17');return}
   flushLoaded();
  });
 }

 if(window.CASE2_RAIN_CANON){loadEngine();return}
 loadScript('case2-rain-canon.js?v=14',function(ok){
  if(!ok||!window.CASE2_RAIN_CANON){reportLoadError('case2-rain-canon.js?v=14');return}
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

function loadCase3Runtime(done){
 if(case3Loaded&&window.Case3FilmUI){done(true);return}
 if(case3Failed){done(false);return}
 case3Waiting.push(done);
 if(case3Loading)return;
 case3Loading=true;
 var steps=[
  {src:'case3-film-canon.js?v=3',ready:function(){return !!window.CASE3_FILM_CANON}},
  {src:'case3-art-manifest.js?v=1',ready:function(){return !!window.CASE3_ART_MANIFEST}},
  {src:'case3-film-engine.js?v=3',ready:function(){return !!window.Case3FilmEngine}},
  {src:'case3-film-ui.js?v=4',ready:function(){return !!window.Case3FilmUI}}
 ];
 function next(i){
  if(i>=steps.length){flushCase3Loaded();return}
  var step=steps[i];
  if(step.ready()){next(i+1);return}
  loadScript(step.src,function(ok){
   if(!ok||!step.ready()){reportCase3LoadError(step.src);return}
   next(i+1);
  });
 }
 next(0);
}
function ensureCase3Root(){
 var root=$('case3Production');if(root)return root;
 var main=document.querySelector('main.app');if(!main)return null;
 root=document.createElement('section');root.id='case3Production';root.className='hidden';root.innerHTML='<div id="case3ProductionRoot"></div>';
 main.appendChild(root);return root;
}
function hideForCase3(){
 ['startScreen','prologueScreen','gameScreen','completeScreen','failScreen','case2Screen','v2Rain'].forEach(function(id){var el=$(id);if(el)el.classList.add('hidden')});
}
function patchCase3ProductionUI(){
 var host=$('case3Production');if(!host||host.classList.contains('hidden'))return;
 var chip=host.querySelector('.c3-chip');if(chip&&chip.textContent!=='正式案件')chip.textContent='正式案件';
 var reset=host.querySelector('[data-reset]');if(reset&&reset.textContent!=='重新調查第三案')reset.textContent='重新調查第三案';
 var footer=host.querySelector('.c3-footer');if(footer&&footer.textContent!=='案件三進度會保存在此裝置；返回標題後可由案件選擇再次進入。')footer.textContent='案件三進度會保存在此裝置；返回標題後可由案件選擇再次進入。';
 var ending=host.querySelector('.c3-ending');
 if(ending&&!$('c3Home')){
  var home=document.createElement('button');home.id='c3Home';home.type='button';home.className='c3-prod-home';home.textContent='回到標題';home.onclick=function(){location.reload()};ending.appendChild(home);
 }
 var topChip=$('caseChip');if(topChip&&topChip.textContent!=='CASE 03・第十三張底片')topChip.textContent='CASE 03・第十三張底片';
 var build=document.querySelector('.build');if(build&&build.textContent!=='BUILD 6.1・CASE 03 CANON')build.textContent='BUILD 6.1・CASE 03 CANON';
}
function startCase3(){
 setStatus('');
 loadCase3Runtime(function(ok){
  if(!ok){setStatus('案件三資源載入失敗，請重新整理頁面後再試。');return}
  var host=ensureCase3Root();
  if(!host||!window.Case3FilmUI||typeof window.Case3FilmUI.mount!=='function'){reportCase3LoadError('Case3FilmUI.mount');return}
  hideForCase3();host.classList.remove('hidden');
  window.Case3FilmUI.mount('case3ProductionRoot',{playerName:currentPlayerName()});
  patchCase3ProductionUI();
 });
}

function patchCase2EndingEntry(){
 var root=$('v2Rain');if(!root||root.classList.contains('hidden'))return;
 var save=parse(RAIN_SAVE),ending=root.querySelector('.c2-ending'),row=root.querySelector('.c2-home-row');
 if(!ending||!row||!save||save.ending!=='correct')return;
 if($('c2NextCase'))return;
 var next=document.createElement('button');next.id='c2NextCase';next.type='button';next.className='primary';next.textContent='開始案件三：《第十三張底片》';next.onclick=startCase3;ending.insertBefore(next,row);
}

function patchEntryPoints(){
 var resume=$('rainResumeBtn');if(resume)resume.remove();
 var next=$('nextCaseBtn');
 if(next){var label='開始案件二：《雨夜敲門》';if(next.textContent!==label)next.textContent=label;if(next.onclick!==startRain)next.onclick=startRain}
 var chip=$('caseChip'),root=$('v2Rain');
 if(chip&&root&&!root.classList.contains('hidden')&&chip.textContent!=='CASE 02・雨夜敲門')chip.textContent='CASE 02・雨夜敲門';
 patchCase2EndingEntry();
 patchCase3ProductionUI();
}

installProgressiveVisibility();
ensureCasePicker();
patchEntryPoints();
patchCase1ObservationUI();
if(window.MutationObserver){new MutationObserver(function(){patchEntryPoints();patchCase1ObservationUI()}).observe(document.documentElement,{childList:true,subtree:true})}
})();
