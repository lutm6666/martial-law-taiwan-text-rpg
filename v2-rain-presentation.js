(function(){
'use strict';
var sceneArt={
 '永順香燭舖':'assets/v2/rain-incense-shop.svg?v=1',
 '德安宮側殿':'assets/v2/rain-temple.svg?v=1',
 '巷口修鞋攤':'assets/v2/rain-cobbler.svg?v=1',
 '林宅側牆':'assets/v2/rain-sidewall.svg?v=1',
 '香燭舖後間':'assets/v2/rain-backroom.svg?v=1'
};
var speakerByScene={
 '林宅門前':'調查筆記','林宅客廳':'林太太','阿信房間':'阿信','林宅後巷':'調查筆記','陳太太騎樓':'陳太太',
 '永順香燭舖':'蔡掌櫃／店內紀錄','德安宮側殿':'許伯','巷口修鞋攤':'修鞋師傅','林宅側牆':'調查筆記','香燭舖後間':'對質紀錄'
};
var lastAction='';
function addStyle(){if(document.getElementById('rainPresentationStyle'))return;var s=document.createElement('style');s.id='rainPresentationStyle';s.textContent='\
#v2Rain .v2-scene{position:relative}.rain-scene-art{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;border-bottom:1px solid #34362e;background:#10120f}.rain-dialogue{position:relative;margin-top:14px;padding:14px 14px 14px 16px;border:1px solid #454237;border-left:3px solid #b69b5f;border-radius:12px;background:linear-gradient(180deg,#242119,#1b1a16);color:#d8d2c4;line-height:1.72}.rain-dialogue:before{content:attr(data-speaker);display:block;margin-bottom:6px;color:#c8ad70;font-size:.72rem;font-weight:700;letter-spacing:.08em}.rain-dialogue[data-mode="note"]{border-left-color:#777568}.rain-dialogue[data-mode="note"]:before{color:#aaa799}.rain-action-title{display:block;color:#8e8a7d;font-size:.68rem;margin:0 0 5px;letter-spacing:.04em}.rain-scene-caption{position:absolute;left:12px;top:12px;padding:6px 9px;border-radius:999px;background:rgba(10,11,9,.78);border:1px solid rgba(220,205,168,.24);color:#ddd5c2;font-size:.68rem;backdrop-filter:blur(4px)}.rain-stage-card{margin-bottom:12px;padding:12px 14px;border:1px solid #3c3e35;border-radius:14px;background:#171914;color:#aaa799;font-size:.78rem;line-height:1.6}.rain-stage-card strong{color:#d6c9a7}.v2-btn:not(.done){transition:transform .12s ease,border-color .12s ease}.v2-btn:not(.done):active{transform:scale(.985);border-color:#8d7951}@media(max-width:480px){.rain-dialogue{font-size:.92rem}.rain-scene-caption{font-size:.62rem}}';document.head.appendChild(s)}
function sceneName(){var root=document.querySelector('#v2Rain .v2-scene');var h=root&&root.querySelector('h2');return h?h.textContent.trim():''}
function decorateScene(){var card=document.querySelector('#v2Rain .v2-scene');if(!card)return;var name=sceneName(),src=sceneArt[name];if(src&&!card.querySelector('.rain-scene-art')){var img=document.createElement('img');img.className='rain-scene-art';img.src=src;img.alt=name+'場景';var body=card.querySelector('.v2-scene-body');card.insertBefore(img,body||card.firstChild);var cap=document.createElement('span');cap.className='rain-scene-caption';cap.textContent='1958・臺北｜'+name;card.appendChild(cap)}
 var note=card.querySelector('.v2-note');if(note&&!note.classList.contains('rain-dialogue')){var speaker=speakerByScene[name]||'調查筆記';var txt=note.textContent.trim();note.classList.add('rain-dialogue');note.setAttribute('data-speaker',lastAction?speaker:'調查筆記');note.setAttribute('data-mode',lastAction?'dialogue':'note');if(lastAction){var t=document.createElement('span');t.className='rain-action-title';t.textContent='調查：'+lastAction;note.insertBefore(t,note.firstChild)}}}
function decorateStage(){var main=document.getElementById('v2RainMain');if(!main||main.querySelector('.rain-stage-card'))return;var phase=main.querySelector('.v2-phase');var scene=main.querySelector('.v2-scene');if(!phase||!scene)return;var d=document.createElement('div');d.className='rain-stage-card';if(phase.textContent.indexOf('第二階段')>=0)d.innerHTML='<strong>調查轉折</strong>　第一階段已證明「有人利用怪談」，但尚未解釋第一夜。現在要把傳聞來源、工具來源、鞋印與時間線接成同一條證據鏈。';else d.innerHTML='<strong>案件目標</strong>　不要先決定有沒有鬼。先把三個雨夜拆開，確認聲音、時間、現場痕跡是否真的屬於同一件事。';main.insertBefore(d,scene)}
function decorate(){addStyle();decorateScene();decorateStage()}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-action]');if(a){var s=a.querySelector('strong');lastAction=s?s.textContent.trim():'';return}var l=e.target.closest&&e.target.closest('[data-loc]');if(l)lastAction='';},true);
new MutationObserver(function(){decorate()}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate);else decorate();
})();
