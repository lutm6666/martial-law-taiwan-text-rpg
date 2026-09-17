(function(){
'use strict';

function $(id){return document.getElementById(id)}

var RAIN_SAVE='mist-taiwan-rain-full-v3';
var RAIN_CASE='rain-full-v3';
var loading=false;
var loaded=false;
var waiting=[];

function rainSave(){
 try{return JSON.parse(localStorage.getItem(RAIN_SAVE)||'null')}catch(e){return null}
}

function sanitizeRainSave(){
 var v=rainSave();
 if(v&&v.caseId!==RAIN_CASE){try{localStorage.removeItem(RAIN_SAVE)}catch(e){}}
}

function loadScript(src,next){
 var script=document.createElement('script');
 var settled=false;
 function finish(){if(settled)return;settled=true;if(typeof next==='function')next()}
 script.src=src;
 script.async=false;
 script.onload=finish;
 script.onerror=function(){console.error('Script load failed:',src);finish()};
 document.head.appendChild(script);
}

function flush(){
 loaded=true;loading=false;
 var callbacks=waiting.slice();waiting.length=0;
 callbacks.forEach(function(fn){try{fn()}catch(e){console.error(e)}});
}

function loadRainRuntime(done){
 if(loaded){done();return}
 waiting.push(done);
 if(loading)return;
 loading=true;
 loadScript('image-lightbox.js?v=1',function(){
  loadScript('v2-rain-engine.js?v=11',function(){
   loadScript('v2-rain-art-override.js?v=9',function(){
    loadScript('v2-rain-presentation.js?v=2',function(){
     loadScript('v2-rain-dialogue.js?v=1',function(){
      loadScript('v2-rain-dialogue-reset.js?v=1',function(){
       loadScript('v2-rain-evidence-confrontation.js?v=2',flush);
      });
     });
    });
   });
  });
 });
}

function enterRain(){
 var next=$('nextCaseBtn');
 var originalText=next&&next.textContent;
 if(next){next.disabled=true;next.textContent='讀取《雨夜敲門》…'}
 loadRainRuntime(function(){
  if(next){next.disabled=false;if(originalText)next.textContent=originalText}
  var current=$('nextCaseBtn');
  if(current&&typeof current.onclick==='function'&&current.onclick!==enterRain){current.onclick();return}
  console.error('Case 2 start handler was not initialized.');
 });
}

function ensureRainResume(){
 var start=$('startScreen'),load=$('loadBtn'),old=$('rainResumeBtn'),v=rainSave();
 if(!start||!load)return;
 if(!v||v.caseId!==RAIN_CASE){if(old)old.remove();return}
 var label=v.finished?'查看《雨夜敲門》':'繼續《雨夜敲門》';
 if(old){old.textContent=label;old.onclick=enterRain;return}
 var b=document.createElement('button');
 b.id='rainResumeBtn';b.type='button';b.className='secondary';b.textContent=label;b.onclick=enterRain;
 load.insertAdjacentElement('afterend',b);
}

sanitizeRainSave();
var next=$('nextCaseBtn');
if(next)next.onclick=enterRain;
ensureRainResume();
})();