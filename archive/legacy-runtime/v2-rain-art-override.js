(function(){
'use strict';

var PRIMARY='assets/v2/rain-house-front.jpg?v=7';
var FALLBACK='assets/v2/rain-ch1-scene.svg?v=7';

function patchImage(img){
  if(!img||img.dataset.v2RainArtPatched==='1')return;
  var src=img.getAttribute('src')||'';
  var alt=img.getAttribute('alt')||'';
  if(src.indexOf('rain-ch1-concept.webp')===-1&&src.indexOf('rain-ch1-scene.svg')===-1&&alt.indexOf('雨夜中的林宅')===-1)return;
  img.dataset.v2RainArtPatched='1';
  img.onerror=function(){
    if(img.dataset.v2RainFallback==='1')return;
    img.dataset.v2RainFallback='1';
    img.src=FALLBACK;
  };
  img.src=PRIMARY;
}

function scan(root){
  if(!root)return;
  if(root.tagName==='IMG')patchImage(root);
  if(root.querySelectorAll)root.querySelectorAll('img').forEach(patchImage);
}

scan(document);
new MutationObserver(function(records){
  records.forEach(function(record){
    record.addedNodes.forEach(scan);
  });
}).observe(document.documentElement,{childList:true,subtree:true});
})();
