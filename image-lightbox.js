(function(){
'use strict';

function matchesImage(el){
 return !!(el&&el.matches&&el.matches('.scene-visual img,.c2-recap-card img'));
}

function install(){
 if(document.getElementById('mistImageLightbox'))return;
 var style=document.createElement('style');
 style.id='mistImageLightboxStyle';
 style.textContent='.mist-lightbox{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(4,5,4,.94);padding:max(18px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));touch-action:none}.mist-lightbox.hidden{display:none!important}.mist-lightbox__inner{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center}.mist-lightbox__img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}.mist-lightbox__close{position:absolute;top:0;right:0;z-index:2;border:1px solid rgba(255,255,255,.35);background:rgba(18,19,16,.88);color:#f2eee3;border-radius:999px;min-width:44px;min-height:44px;padding:9px 13px;font:inherit;font-size:.82rem;cursor:pointer;-webkit-tap-highlight-color:transparent}.scene-visual img,.c2-recap-card img{cursor:zoom-in}.mist-lightbox-open{overflow:hidden!important;touch-action:none}';
 document.head.appendChild(style);

 var overlay=document.createElement('div');
 overlay.id='mistImageLightbox';
 overlay.className='mist-lightbox hidden';
 overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label','圖片放大檢視');
 overlay.innerHTML='<div class="mist-lightbox__inner"><button type="button" class="mist-lightbox__close" aria-label="關閉圖片">關閉</button><img class="mist-lightbox__img" alt=""></div>';
 document.body.appendChild(overlay);
 var image=overlay.querySelector('.mist-lightbox__img');
 var closeButton=overlay.querySelector('.mist-lightbox__close');
 var previousFocus=null;

 function decorate(root){
  if(!root||!root.querySelectorAll)return;
  root.querySelectorAll('.scene-visual img,.c2-recap-card img').forEach(function(img){
   img.setAttribute('role','button');
   if(!img.hasAttribute('tabindex'))img.tabIndex=0;
   img.setAttribute('aria-label','放大查看：'+(img.alt||'案件圖片'));
  });
 }
 function open(img){
  previousFocus=img;
  image.src=img.currentSrc||img.src;
  image.alt=img.alt||'案件圖片';
  overlay.classList.remove('hidden');
  document.documentElement.classList.add('mist-lightbox-open');
  document.body.classList.add('mist-lightbox-open');
  closeButton.focus({preventScroll:true});
 }
 function close(){
  if(overlay.classList.contains('hidden'))return;
  overlay.classList.add('hidden');
  image.removeAttribute('src');
  document.documentElement.classList.remove('mist-lightbox-open');
  document.body.classList.remove('mist-lightbox-open');
  if(previousFocus&&previousFocus.focus)previousFocus.focus({preventScroll:true});
  previousFocus=null;
 }

 closeButton.addEventListener('click',function(e){e.stopPropagation();close()});
 overlay.addEventListener('click',function(e){if(e.target===overlay||e.target.classList.contains('mist-lightbox__inner'))close()});
 document.addEventListener('click',function(e){if(matchesImage(e.target))open(e.target)});
 document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&!overlay.classList.contains('hidden')){e.preventDefault();close();return}
  if((e.key==='Enter'||e.key===' ')&&matchesImage(e.target)){e.preventDefault();open(e.target)}
 });

 decorate(document);
 if(window.MutationObserver){
  new MutationObserver(function(records){
   records.forEach(function(r){r.addedNodes.forEach(function(n){if(n.nodeType===1){if(matchesImage(n)){n.setAttribute('role','button');if(!n.hasAttribute('tabindex'))n.tabIndex=0;n.setAttribute('aria-label','放大查看：'+(n.alt||'案件圖片'))}decorate(n)}})})
  }).observe(document.body,{childList:true,subtree:true});
 }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
