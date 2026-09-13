(function(){
'use strict';

function loadScript(src,next){
 var script=document.createElement('script');
 script.src=src;
 script.async=false;
 if(typeof next==='function')script.onload=next;
 script.onerror=function(){console.error('Script load failed:',src)};
 document.head.appendChild(script);
}

loadScript('image-lightbox.js?v=2',function(){
 loadScript('v2-rain-engine.js?v=1');
});
})();
