(function(){
'use strict';

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

loadScript('image-lightbox.js?v=1',function(){
 loadScript('case2-engine-core.js?v=1');
});
})();
