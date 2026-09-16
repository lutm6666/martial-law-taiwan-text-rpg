(function(){
'use strict';

function $(id){return document.getElementById(id)}

var caseOneLoadHandler=$('loadBtn')&&$('loadBtn').onclick;
var RAIN_SAVE='mist-taiwan-rain-full-v3';
var RAIN_CASE='rain-full-v3';

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

function rainSave(){
 try{return JSON.parse(localStorage.getItem(RAIN_SAVE)||'null')}catch(e){return null}
}

function sanitizeRainSave(){
 var v=rainSave();
 if(v&&v.caseId!==RAIN_CASE){try{localStorage.removeItem(RAIN_SAVE)}catch(e){}}
}

function restoreCaseOneLoad(){
 var load=$('loadBtn');
 if(load&&typeof caseOneLoadHandler==='function')load.onclick=caseOneLoadHandler;
}

function startRainFromHiddenButton(){
 var next=$('nextCaseBtn');
 if(next&&typeof next.onclick==='function')next.onclick();
}

function ensureRainResume(){
 var start=$('startScreen'),load=$('loadBtn');
 if(!start||!load)return;
 var old=$('rainResumeBtn');if(old)old.remove();
 var v=rainSave();if(!v||v.caseId!==RAIN_CASE)return;
 var b=document.createElement('button');
 b.id='rainResumeBtn';b.type='button';b.className='secondary';
 b.textContent=v.finished?'查看案件二《雨夜敲門》':'繼續案件二《雨夜敲門》';
 b.onclick=startRainFromHiddenButton;
 load.insertAdjacentElement('afterend',b);
}

function replaceLegacyText(root){
 if(!root)return;
 var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
 var node;
 while((node=walker.nextNode())){
  var p=node.parentElement;if(!p||/^(SCRIPT|STYLE)$/.test(p.tagName))continue;
  var t=node.nodeValue||'';
  if(t.indexOf('秋月：不要真名。')>=0)t=t.replace(/秋月：不要真名。/g,'受訪者：不要真名。');
  if(t.indexOf('秋月的名字')>=0)t=t.replace(/秋月的名字/g,'那名受訪者的名字');
  if(t.indexOf('案件二：秋月的條件')>=0)t=t.replace(/案件二：秋月的條件/g,'案件二：雨夜敲門');
  if(t.indexOf('《秋月的條件》')>=0)t=t.replace(/《秋月的條件》/g,'《雨夜敲門》');
  if(t!==node.nodeValue)node.nodeValue=t;
 }
}

function patchCaseTwoCopy(){
 var next=$('nextCaseBtn');
 if(next&&next.textContent!=='案件二：雨夜敲門')next.textContent='案件二：雨夜敲門';

 var complete=$('completeScreen');
 if(complete){
  Array.prototype.forEach.call(complete.querySelectorAll('.summary-item'),function(item){
   var strong=item.querySelector('strong');
   if(strong&&strong.textContent.trim()==='下一案'){
    item.innerHTML='<strong>下一案</strong><br>《雨夜敲門》。臺北一戶人家連續三個雨夜聽見敲門聲；越像同一件怪事的三個晚上，越需要先證明它們是否真的有同一個原因。';
   }
  });
 }

 replaceLegacyText($('gameScreen'));
 replaceLegacyText($('completeScreen'));
 replaceLegacyText($('failScreen'));

 var chip=$('caseChip');
 if(chip&&$('v2Rain')&&!$('v2Rain').classList.contains('hidden'))chip.textContent='CASE 02・雨夜敲門';
 restoreCaseOneLoad();
 ensureRainResume();
}

sanitizeRainSave();
patchCaseTwoCopy();

loadScript('image-lightbox.js?v=1',function(){
 loadScript('v2-rain-engine.js?v=11',function(){
  restoreCaseOneLoad();
  patchCaseTwoCopy();
  loadScript('v2-rain-art-override.js?v=9',function(){
   patchCaseTwoCopy();
   loadScript('v2-rain-presentation.js?v=2',function(){
    patchCaseTwoCopy();
    loadScript('v2-rain-dialogue.js?v=1',function(){
     patchCaseTwoCopy();
     loadScript('v2-rain-dialogue-reset.js?v=1',function(){
      patchCaseTwoCopy();
      loadScript('v2-rain-evidence-confrontation.js?v=2',patchCaseTwoCopy);
     });
    });
   });
  });
 });
});

new MutationObserver(function(){patchCaseTwoCopy()}).observe(document.documentElement,{childList:true,subtree:true});
})();