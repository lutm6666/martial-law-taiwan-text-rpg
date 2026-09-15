(function(){
'use strict';

function $(id){return document.getElementById(id)}

function loadScript(src,next){
 var script=document.createElement('script');
 var settled=false;
 function finish(){
  if(settled)return;
  settled=true;
  if(typeof next==='function')next();
 }
 script.src=src;
 script.async=false;
 script.onload=finish;
 script.onerror=function(){
  console.error('Script load failed:',src);
  finish();
 };
 document.head.appendChild(script);
}

function patchCaseTwoCopy(){
 var next=$('nextCaseBtn');
 if(next&&next.textContent!=='案件二：雨夜敲門')next.textContent='案件二：雨夜敲門';

 var complete=$('completeScreen');
 if(complete){
  Array.prototype.forEach.call(complete.querySelectorAll('.summary-item'),function(item){
   var strong=item.querySelector('strong');
   if(strong&&strong.textContent.trim()==='下一案'){
    item.innerHTML='<strong>下一案</strong><br>《雨夜敲門》。臺北一戶人家連續三個雨夜聽見敲門聲；有人在利用怪談，但第一夜仍留下無法用同一套手法解釋的時間缺口。';
   }
  });
 }

 var chip=$('caseChip');
 if(chip&&$('v2Rain')&&!$('v2Rain').classList.contains('hidden'))chip.textContent='CASE 02・雨夜敲門';

 var build=document.querySelector('.build');
 if(build&&build.textContent.indexOf('V2・CHAPTER 01 EXPANDED')!==-1)build.textContent='BUILD 5.2・CASE 02';
}

patchCaseTwoCopy();

loadScript('image-lightbox.js?v=1',function(){
 loadScript('v2-rain-engine.js?v=9',function(){
  patchCaseTwoCopy();
  loadScript('v2-rain-art-override.js?v=8',patchCaseTwoCopy);
 });
});

new MutationObserver(function(){patchCaseTwoCopy()}).observe(document.documentElement,{childList:true,subtree:true});
})();
