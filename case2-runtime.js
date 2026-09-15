(function(){
'use strict';

function currentUrl(){
  try{return new URL(window.location.href)}catch(e){return null}
}

function wantsCase2(){
  var u=currentUrl();
  if(!u)return window.location.hash==='#case2';
  return u.hash==='#case2'||u.searchParams.get('case')==='2';
}

function setCase2Route(){
  var u=currentUrl();
  if(!u)return;
  if(u.hash==='#case2'&&u.searchParams.get('case')!=='2')return;
  u.searchParams.delete('case');
  u.hash='case2';
  try{history.replaceState(null,'',u.pathname+u.search+u.hash)}catch(e){}
}

function clearCase2Route(){
  var u=currentUrl();
  if(!u)return;
  u.searchParams.delete('case');
  u.hash='';
  try{history.replaceState(null,'',u.pathname+u.search)}catch(e){}
}

function openCase2FromRoute(){
  if(!wantsCase2())return;
  var btn=document.getElementById('nextCaseBtn');
  if(!btn||typeof btn.onclick!=='function')return;
  window.setTimeout(function(){
    var screen=document.getElementById('case2Screen');
    if(screen&&!screen.classList.contains('hidden'))return;
    btn.click();
  },0);
}

document.addEventListener('click',function(ev){
  var t=ev.target&&ev.target.closest?ev.target.closest('button,a'):null;
  if(!t)return;
  if(t.id==='nextCaseBtn'){
    setCase2Route();
    return;
  }
  if(t.id==='c2Home'){
    clearCase2Route();
  }
},true);

window.addEventListener('hashchange',function(){
  if(wantsCase2())openCase2FromRoute();
});

openCase2FromRoute();
})();
