(function(){
'use strict';

function $(id){return document.getElementById(id)}

var caseOneLoadHandler=$('loadBtn')&&$('loadBtn').onclick;
var RAIN_SAVE='mist-taiwan-rain-canon-v1';
var RAIN_CASE='rain-door-1958-v1';
var rainLoadError='';

function reportLoadError(src){
 rainLoadError='案件二資源載入失敗：'+src;
 console.error(rainLoadError);
 var status=$('bootStatus');if(status)status.textContent='案件二資源載入失敗，請重新整理頁面後再試。';
}
function loadScript(src,next){
 var script=document.createElement('script');
 var settled=false;
 function finish(){if(settled)return;settled=true;if(typeof next==='function')next()}
 script.src=src;script.async=false;script.onload=finish;script.onerror=function(){if(settled)return;settled=true;reportLoadError(src)};
 document.head.appendChild(script);
}
function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function restoreCaseOneLoad(){var load=$('loadBtn');if(load&&typeof caseOneLoadHandler==='function'&&load.onclick!==caseOneLoadHandler)load.onclick=caseOneLoadHandler}
function startRain(){
 if(window.Case2RainCanon&&typeof window.Case2RainCanon.start==='function'){window.Case2RainCanon.start();return}
 var status=$('bootStatus');if(status)status.textContent=rainLoadError?'案件二資源載入失敗，請重新整理頁面後再試。':'案件二仍在載入，請稍後再試。';
}
function hasRainSave(){var v=parse(RAIN_SAVE);return !!(v&&v.caseId===RAIN_CASE)}

function ensureRainResume(){
 var start=$('startScreen'),load=$('loadBtn'),old=$('rainResumeBtn');if(!start||!load)return;
 if(!hasRainSave()){if(old)old.remove();return}
 var v=parse(RAIN_SAVE)||{};var label=v.finished?'查看案件二《雨夜敲門》':'繼續案件二《雨夜敲門》';
 if(old){if(old.textContent!==label)old.textContent=label;if(old.onclick!==startRain)old.onclick=startRain;return}
 var b=document.createElement('button');b.id='rainResumeBtn';b.type='button';b.className='secondary';b.textContent=label;b.onclick=startRain;load.insertAdjacentElement('afterend',b);
}

function patchCopy(){
 var next=$('nextCaseBtn');if(next){var nextLabel='開始案件二：《雨夜敲門》';if(next.textContent!==nextLabel)next.textContent=nextLabel;if(next.onclick!==startRain)next.onclick=startRain}
 var complete=$('completeScreen');if(complete){Array.prototype.forEach.call(complete.querySelectorAll('.summary-item'),function(item){var strong=item.querySelector('strong');if(strong&&strong.textContent.trim()==='下一案'){var copy='<strong>下一案</strong><br>《雨夜敲門》。1958年的雨夜，一名女子反覆來到201號門前；你必須把眼前的敲門者，和三年前被抹去的前住戶分開調查。';if(item.innerHTML!==copy)item.innerHTML=copy}})}
 var chip=$('caseChip');if(chip&&$('v2Rain')&&!$('v2Rain').classList.contains('hidden')&&chip.textContent!=='CASE 02・雨夜敲門')chip.textContent='CASE 02・雨夜敲門';
 restoreCaseOneLoad();ensureRainResume();
}

patchCopy();
loadScript('case2-rain-canon.js?v=2',function(){
 if(!window.CASE2_RAIN_CANON){reportLoadError('case2-rain-canon.js?v=2');return}
 loadScript('case2-rain-canon-engine.js?v=2',function(){
  if(!window.Case2RainCanon){reportLoadError('case2-rain-canon-engine.js?v=2');return}
  patchCopy();
  loadScript('image-lightbox.js?v=1',patchCopy);
 });
});

new MutationObserver(function(){patchCopy()}).observe(document.documentElement,{childList:true,subtree:true});
})();
