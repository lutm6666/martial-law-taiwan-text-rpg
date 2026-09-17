(function(){
'use strict';
function $(id){return document.getElementById(id)}
var start=$('startBtn'),boot=$('bootStatus'),name=$('nameInput');
if(boot)boot.textContent='寫下姓名，去赴阿川的約。';
if(!start)return;
var original=start.onclick;
start.onclick=function(e){
  if(original)original.call(this,e);
  var prologue=$('prologueScreen'),next=$('prologueNext'),guard=0;
  while(prologue&&next&&!prologue.classList.contains('hidden')&&guard<8){
    next.click();
    guard++;
  }
  var game=$('gameScreen');
  if(game&&!game.classList.contains('hidden')){
    var label=$('playerLabel');
    if(label)label.textContent=(name&&name.value.trim())||'林默';
    try{window.scrollTo({top:0,behavior:'instant'})}catch(err){window.scrollTo(0,0)}
  }else if(boot){
    boot.textContent='無法進入調查，請重新整理後再試一次。';
  }
};
})();
