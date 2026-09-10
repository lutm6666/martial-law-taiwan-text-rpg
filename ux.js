(()=>{'use strict';
let moving=false;
function movePassiveAfterMainText(){if(moving)return;const story=document.getElementById('sceneText');if(!story)return;const passive=story.querySelector('.identity-text');if(!passive||story.lastElementChild===passive)return;moving=true;story.appendChild(passive);moving=false;}
const observer=new MutationObserver(movePassiveAfterMainText);
window.addEventListener('DOMContentLoaded',()=>{const story=document.getElementById('sceneText');if(story)observer.observe(story,{childList:true,subtree:false});movePassiveAfterMainText();});
})();