(()=>{'use strict';
const ART={
 default:{icon:'霧',label:'夜色壓在城市上',sub:'有些事情，知道得太早未必是好事。'},
 tea_shop:{icon:'茶',label:'茶行・後巷',sub:'門簾晃了一下。沒有人確定剛才是風。'},
 print_shop:{icon:'印',label:'印刷行',sub:'機器停了，油墨味卻還留在空氣裡。'},
 market:{icon:'市',label:'市場',sub:'人聲很多，真正重要的話反而說得很小聲。'},
 bookstall:{icon:'書',label:'舊書攤',sub:'紙頁之間，也許夾著不該留下的名字。'},
 professor:{icon:'學',label:'教授住處',sub:'窗簾沒有完全拉上。街對面有人停得太久。'},
 station:{icon:'站',label:'車站',sub:'廣播聲蓋過腳步。你不知道誰正看著誰。'},
 police:{icon:'檢',label:'臨檢',sub:'證件被接過去的那一刻，時間忽然變慢。'}
};
function key(){const s=((document.getElementById('sceneTitle')?.textContent||'')+' '+(document.getElementById('location')?.textContent||'')).toLowerCase();if(/茶|tea/.test(s))return'tea_shop';if(/印刷|print/.test(s))return'print_shop';if(/市場|market/.test(s))return'market';if(/書攤|書店|book/.test(s))return'bookstall';if(/教授|professor/.test(s))return'professor';if(/車站|火車|station/.test(s))return'station';if(/臨檢|警察|憲兵|盤查/.test(s))return'police';return'default'}
function mount(){const card=document.querySelector('.story-card');if(!card)return;let v=document.getElementById('sceneVisual');if(!v){v=document.createElement('div');v.id='sceneVisual';v.className='scene-visual';card.insertBefore(v,card.firstChild)}const k=key(),a=ART[k];if(v.dataset.sceneKey!==k){v.dataset.sceneKey=k;v.innerHTML=`<div class="scene-art-mark">${a.icon}</div><div><strong>${a.label}</strong><small>${a.sub}</small></div>`}const ch=document.getElementById('choices');if(ch){ch.classList.add('concealed-consequences');[...ch.querySelectorAll('button')].forEach(b=>{b.removeAttribute('title');b.querySelectorAll('.risk,.reward,.effect,.consequence').forEach(x=>x.style.display='none')})}}
function pressure(){const s=+(document.getElementById('stress')?.textContent||0),q=+(document.getElementById('suspicion')?.textContent||0);document.body.classList.toggle('high-pressure',s+q>=8)}
let scheduled=false;function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();pressure()})}
const obs=new MutationObserver(refresh);addEventListener('DOMContentLoaded',()=>{mount();pressure();const g=document.getElementById('gameScreen');if(g)obs.observe(g,{subtree:true,childList:true,characterData:true})});
})();