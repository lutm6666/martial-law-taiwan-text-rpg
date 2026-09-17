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
function hasRainSave(){var v=parse(RAIN_SAVE);return !!(v&&v.caseId===RAIN_CASE)}
function setStatus(text){var status=$('bootStatus');if(status)status.textContent=text||''}
function installProgressiveVisibility(){
 if($('case2ProgressiveVisibilityStyle'))return;
 var style=document.createElement('style');
 style.id='case2ProgressiveVisibilityStyle';
 style.textContent='.c2-btn:disabled:not(.done),.c2-map button:disabled{display:none!important}';
 document.head.appendChild(style);
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

function ensureSharedLightbox(){
 if($('mistImageLightbox')){window.__case2LightboxRequested=true;return}
 if(window.__case2LightboxRequested)return;
 window.__case2LightboxRequested=true;
 loadScript('image-lightbox.js?v=1',function(){});
}
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
  if(note.textContent!=='點擊圖片可放大')note.textContent='點擊圖片可放大';
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
  loadScript('case2-rain-canon-engine.js?v=4',function(ok){
   if(!ok||!window.Case2RainCanon){reportLoadError('case2-rain-canon-engine.js?v=4');return}
   if(window.__case2LightboxRequested){flushLoaded();return}
   window.__case2LightboxRequested=true;
   loadScript('image-lightbox.js?v=1',function(){flushLoaded()});
  });
 }

 if(window.CASE2_RAIN_CANON){loadEngine();return}
 loadScript('case2-rain-canon.js?v=3',function(ok){
  if(!ok||!window.CASE2_RAIN_CANON){reportLoadError('case2-rain-canon.js?v=3');return}
  loadEngine();
 });
}

function startRain(){
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

function ensureRainResume(){
 var start=$('startScreen'),load=$('loadBtn'),old=$('rainResumeBtn');
 if(!start||!load)return;
 if(!hasRainSave()){if(old)old.remove();return}
 var v=parse(RAIN_SAVE)||{},label=v.finished?'查看案件二《雨夜敲門》':'繼續案件二《雨夜敲門》';
 if(old){if(old.textContent!==label)old.textContent=label;if(old.onclick!==startRain)old.onclick=startRain;return}
 var b=document.createElement('button');
 b.id='rainResumeBtn';b.type='button';b.className='secondary';b.textContent=label;b.onclick=startRain;
 load.insertAdjacentElement('afterend',b);
}

function patchEntryPoints(){
 var next=$('nextCaseBtn');
 if(next){var label='開始案件二：《雨夜敲門》';if(next.textContent!==label)next.textContent=label;if(next.onclick!==startRain)next.onclick=startRain}
 ensureRainResume();
 var chip=$('caseChip'),root=$('v2Rain');
 if(chip&&root&&!root.classList.contains('hidden')&&chip.textContent!=='CASE 02・雨夜敲門')chip.textContent='CASE 02・雨夜敲門';
}

installProgressiveVisibility();
ensureSharedLightbox();
patchEntryPoints();
patchCase1ObservationUI();
if(window.MutationObserver){new MutationObserver(function(){patchEntryPoints();patchCase1ObservationUI()}).observe(document.documentElement,{childList:true,subtree:true})}
})();
