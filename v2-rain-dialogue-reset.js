(function(){
'use strict';
var DIALOGUE_KEY='mist-taiwan-rain-dialogue-v1';
var CASE_KEY='mist-taiwan-rain-full-v3';
try{if(!localStorage.getItem(CASE_KEY))localStorage.removeItem(DIALOGUE_KEY)}catch(e){}
document.addEventListener('click',function(e){
 var t=e.target.closest&&e.target.closest('#v2Again,#v2Restart');
 if(!t)return;
 try{localStorage.removeItem(DIALOGUE_KEY)}catch(err){}
},true);
})();