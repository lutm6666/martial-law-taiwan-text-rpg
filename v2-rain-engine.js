(function(){
'use strict';

var SAVE_KEY='mist-taiwan-v2-rain-ch1';
var CASE1_KEY='mist-taiwan-case-save-v4';
var MAX_FOCUS=4;
var s=null;

function $(id){return document.getElementById(id)}
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(s))}catch(e){}}
function case1Profile(){var p=parse(CASE1_KEY)||{};return{name:typeof p.name==='string'&&p.name.trim()?p.name.trim():'林默',role:p.role||'student'}}
function notify(msg){var t=$('toast');if(!t)return;t.textContent=msg;t.className='toast show';clearTimeout(window.__v2toast);window.__v2toast=setTimeout(function(){t.className='toast'},1700)}

var evidence={
 low_scratches:{name:'門框低位刮痕',type:'物證',desc:'幾道新刮痕集中在門框下緣，位置低於一般成年人手部高度。'},
 rain_channel:{name:'屋簷落水線',type:'現場紀錄',desc:'雨水會沿屋簷固定落在門前右側；昨夜泥痕有一段不在自然落水區內。'},
 torn_talisman:{name:'被撕動的鎮宅符',type:'家學觀察',desc:'符紙不是自行脫落，而是自下緣被拉扯；符式屬鎮宅用途，但不能因此證明存在鬼祟。'},
 small_print:{name:'窄底鞋印',type:'物證',desc:'巷口泥面留有一組較窄鞋印，步幅偏短，從後巷方向接近委託人住宅。'},
 son_account:{name:'阿信的說法',type:'證詞',desc:'阿信承認第三次敲門後曾開門，只看到巷尾像有人影轉過去；他沒有看清臉。'},
 neighbor_version:{name:'鄰居的怪談版本',type:'證詞',desc:'鄰居說「三更三叩不可應門」，但承認這個說法是最近兩週才在附近傳開。'},
 timing_gap:{name:'時間缺口',type:'推理紀錄',desc:'有人確實能從後巷接近門口，但第一晚的敲門發生時，已知可疑人物仍在另一處被多人看見。'}
};

var locations={
 house:{name:'林宅門前',sub:'委託人住宅',intro:'雨剛停。木門下緣發黑，屋簷仍一滴一滴落水。門框右側貼著一張舊黃符，底角被撕開。',actions:[
  {id:'door',name:'檢查門板與門框',desc:'確認敲門與刮痕是否留下實體痕跡。',gain:'low_scratches',text:'你蹲下來看。新的刮痕集中在門框下緣，沒有形成規律敲擊痕。有人或某件東西曾在很低的位置碰撞門框。'},
  {id:'eaves',name:'查看屋簷與積水',desc:'比對雨水與昨夜泥痕。',gain:'rain_channel',text:'屋簷右側的落水很集中。自然形成的濕痕應向外散開，但門前有一小段泥印逆著水流方向。'},
  {id:'talisman',name:'用家學檢查黃符',desc:'辨識符式與破損方式。',gain:'torn_talisman',text:'你沒有先談鬼神，只看紙纖維。裂口朝上，像是有人從下方拉過。符式本身是常見的鎮宅用法，並沒有任何東西能單憑這張紙證明「門外有鬼」。'}]},
 alley:{name:'後巷',sub:'住宅後方',intro:'巷子比正門窄得多。牆腳積著泥，幾戶人家的後門幾乎貼在一起。',lockedBy:['low_scratches','rain_channel'],actions:[
  {id:'prints',name:'沿泥痕找腳印',desc:'確認是否有人從後巷接近。',gain:'small_print',text:'在排水溝旁，你找到一組較窄的鞋印。步幅不大，方向從後巷往林宅，再折回巷尾。'},
  {id:'route',name:'重走可疑路線',desc:'估算從巷口到門前所需時間。',text:'從巷尾繞到林宅門前只要不到兩分鐘。若有人刻意裝神弄鬼，這條路線很方便。'}]},
 room:{name:'阿信房間',sub:'林宅內側',intro:'房間不大，桌上放著課本和一把還沒乾的黑傘。阿信不太願意談那晚。',lockedBy:['torn_talisman'],actions:[
  {id:'askson',name:'詢問阿信開門那晚',desc:'追問第三次敲門後發生了什麼。',gain:'son_account',text:'阿信最後承認，他確實在第三次敲門後開了門。門外沒有人站著，但巷尾像有一道身影轉了過去。他沒有看清是誰。'},
  {id:'umbrella',name:'檢查黑傘',desc:'確認阿信昨晚是否外出。',text:'傘面仍濕，但泥點只在外側。這只能證明昨晚有人用過它，不能直接說明敲門者是誰。'}]},
 neighbor:{name:'隔壁騎樓',sub:'鄰居住處',intro:'隔壁陳太太一看到你就壓低聲音，說這條巷子以前就「不乾淨」。',lockedBy:['son_account'],actions:[
  {id:'legend',name:'追問「三次敲門」傳聞',desc:'確認傳聞流傳多久、從哪裡開始。',gain:'neighbor_version',text:'她說「三更三叩不可應門」是老人家的規矩，但追問之後承認：至少這個版本，是最近兩週才有人開始在附近講。'},
  {id:'firstnight',name:'核對第一次敲門時間',desc:'找出第一晚是否有人能作證。',gain:'timing_gap',requires:['small_print','neighbor_version'],text:'你把幾個人的時間重新排過。後巷確實有人走動，但第一晚敲門發生時，最可疑的那個人仍在街口雜貨店，被三個人同時看見。人為路線存在，卻無法解釋所有敲門。'}]}
};

function fresh(){var p=case1Profile();return{caseId:'rain-ch1',name:p.name,focus:MAX_FOCUS,loc:'house',visited:{house:true},done:{},evidence:[],feedback:'',phase:'investigate',deduction:0,answers:[],finished:false}}
function load(){var v=parse(SAVE_KEY);if(!v||v.caseId!=='rain-ch1')return null;return v}
function has(id){return s.evidence.indexOf(id)!==-1}
function gain(id){if(id&&evidence[id]&&!has(id)){s.evidence.push(id);notify('新增紀錄：'+evidence[id].name)}}
function unlocked(id){var l=locations[id];if(!l.lockedBy)return true;return l.lockedBy.every(has)}
function requirementsMet(a){return !a.requires||a.requires.every(has)}

function injectStyle(){if($('v2RainStyle'))return;var st=document.createElement('style');st.id='v2RainStyle';st.textContent='\
#v2Rain{padding-bottom:86px}.v2-head{padding:14px 15px;margin-bottom:12px}.v2-head h2{margin:0 0 5px;font-size:1rem}.v2-meta{font-size:.72rem;color:#9b988b}.v2-dots{display:flex;gap:5px;margin-top:8px}.v2-dots i{width:10px;height:10px;border-radius:50%;background:#44473e}.v2-dots i.on{background:#c7b16f}.v2-grid{display:grid;gap:9px}.v2-scene{padding:17px}.v2-scene h2{margin:4px 0 10px}.v2-scene p{line-height:1.72}.v2-actions{display:grid;gap:9px;margin-top:12px}.v2-btn{border:1px solid #3d4036;background:#1b1d18;color:#ece8dc;border-radius:13px;padding:12px;text-align:left}.v2-btn strong{display:block}.v2-btn small{display:block;color:#969386;margin-top:4px;line-height:1.45}.v2-btn.done{opacity:.58}.v2-map{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.v2-map button{border:1px solid #3a3d33;background:#191b17;color:#ded9cb;border-radius:12px;padding:11px;text-align:left}.v2-map button.locked{display:none}.v2-map button.current{border-color:#9b8754;background:#292719}.v2-note{margin-top:12px;padding:11px 12px;border-left:3px solid #8d7853;background:#211e18;line-height:1.62;color:#c8c1b1}.v2-records{margin-top:12px}.v2-rec{padding:11px;border:1px solid #35382f;border-radius:11px;background:#171914;margin-top:8px}.v2-rec strong{display:block}.v2-rec small{display:block;margin-top:4px;color:#9c998d;line-height:1.5}.v2-deduction{padding:17px}.v2-deduction h2{margin:4px 0 10px}.v2-option{display:block;width:100%;margin-top:9px;border:1px solid #41443a;background:#1b1e18;color:#eee9dc;border-radius:12px;padding:12px;text-align:left;line-height:1.55}.v2-chapter-end{padding:19px}.v2-chapter-end h2{margin:5px 0 10px}.v2-chapter-end p{line-height:1.75}@media(min-width:640px){.v2-actions{grid-template-columns:1fr 1fr}.v2-map{grid-template-columns:repeat(4,1fr)}}';document.head.appendChild(st)}

function mount(){if($('v2Rain'))return;injectStyle();var root=document.createElement('section');root.id='v2Rain';root.className='hidden';root.innerHTML='<div id="v2RainMain"></div>';document.querySelector('main.app').appendChild(root)}
function hideBase(){['startScreen','prologueScreen','gameScreen','completeScreen','failScreen','case2Screen'].forEach(function(id){var el=$(id);if(el)el.classList.add('hidden')})}
function showRoot(){mount();hideBase();$('v2Rain').classList.remove('hidden');$('caseChip').textContent='CASE 02・雨夜敲門';var build=document.querySelector('.build');if(build)build.textContent='V2 PREVIEW・CHAPTER 01'}
function renderFocus(){var out='';for(var i=0;i<MAX_FOCUS;i++)out+='<i class="'+(i<s.focus?'on':'')+'"></i>';return out}
function allCore(){return ['low_scratches','rain_channel','torn_talisman','small_print','son_account','neighbor_version','timing_gap'].every(has)}

function render(){showRoot();var box=$('v2RainMain');if(s.finished){box.innerHTML='<article class="v2-chapter-end card paper"><p class="eyebrow" style="color:#715c34">CHAPTER 01 COMPLETE</p><h2>門外不只有一種答案</h2><p>你已確認：有人確實能利用後巷與新近流傳的怪談製造敲門；但第一晚的時間線仍留下缺口。現有證據不足以把所有異常都歸給同一個人，也不足以宣告真的有鬼。</p><p>陳太太最後提到，最早說起「第三次不要開門」的人，並不是這條巷子的住戶，而是一名替附近廟宇送香燭的老人。</p><p class="note">下一章將開放新的地點與人物。這個預覽版先停在第一章結尾。</p><button id="v2Home" class="primary" type="button">回到標題</button></article>';$('v2Home').onclick=function(){location.reload()};return}
 if(s.phase==='deduction'){renderDeduction();return}
 var l=locations[s.loc],html='<div class="v2-head card"><h2>'+esc(s.name)+'・私家偵探</h2><div class="v2-meta">案件二《雨夜敲門》・第一章｜先查明發生了什麼，再決定要不要相信有鬼。</div><div class="v2-dots">'+renderFocus()+'</div></div>';
 html+='<article class="v2-scene card"><small>'+esc(l.sub)+'</small><h2>'+esc(l.name)+'</h2><p>'+esc(l.intro)+'</p><div class="v2-actions">';
 l.actions.forEach(function(a){var done=!!s.done[a.id],ok=requirementsMet(a);if(!ok)return;html+='<button class="v2-btn '+(done?'done':'')+'" data-act="'+a.id+'"><strong>'+esc(a.name)+'</strong><small>'+esc(done?'已調查':a.desc)+'</small></button>'});
 html+='</div>'+(s.feedback?'<div class="v2-note">'+esc(s.feedback)+'</div>':'')+'</article>';
 html+='<article class="section-card card" style="margin-top:11px"><h3>地點</h3><div class="v2-map">';Object.keys(locations).forEach(function(id){var loc=locations[id];html+='<button data-loc="'+id+'" class="'+(unlocked(id)?'':'locked')+' '+(s.loc===id?'current':'')+'"><strong>'+esc(loc.name)+'</strong></button>'});html+='</div></article>';
 html+='<article class="section-card card v2-records"><h3>案件紀錄</h3>';if(!s.evidence.length)html+='<p class="note">目前還沒有可保存的關鍵紀錄。</p>';s.evidence.forEach(function(id){var e=evidence[id];html+='<div class="v2-rec"><strong>'+esc(e.name)+'</strong><small>'+esc(e.type)+'｜'+esc(e.desc)+'</small></div>'});html+='</article>';
 if(allCore())html+='<button id="v2Deduce" class="primary" type="button">整理第一章推理</button>';
 box.innerHTML=html;box.querySelectorAll('[data-act]').forEach(function(b){b.onclick=function(){doAction(b.getAttribute('data-act'))}});box.querySelectorAll('[data-loc]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-loc');if(unlocked(id)){s.loc=id;s.feedback='';s.visited[id]=true;save();render()}}});var d=$('v2Deduce');if(d)d.onclick=function(){s.phase='deduction';s.deduction=0;s.feedback='';save();render()};
}

function doAction(id){var l=locations[s.loc],a=l.actions.find(function(x){return x.id===id});if(!a||!requirementsMet(a))return;s.done[id]=true;if(a.gain)gain(a.gain);s.feedback=a.text;save();render()}

var deductions=[
 {q:'目前能否證明敲門事件全部都是鬼怪造成？',correct:'no',opts:[['yes','可以，鎮宅符被撕就是直接證據。'],['no','不可以；目前已有明確的人為行動痕跡。']]},
 {q:'目前能否把所有敲門都歸給同一名裝神弄鬼者？',correct:'gap',opts:[['same','可以，後巷鞋印已足以解釋全部事件。'],['gap','不可以；第一晚的時間線仍留下無法由目前嫌疑人解釋的缺口。']]},
 {q:'第一章最合理的暫時結論是？',correct:'both',opts:[['ghost','已證實真正的鬼在敲門。'],['fake','已證實所有怪事都是人為。'],['both','人為假象確實存在，但仍有一部分異常尚未解釋。']]}
];
function renderDeduction(){var box=$('v2RainMain'),q=deductions[s.deduction],html='<div class="v2-head card"><h2>第一章推理</h2><div class="v2-meta">'+(s.deduction+1)+' / '+deductions.length+'</div><div class="v2-dots">'+renderFocus()+'</div></div><article class="v2-deduction card"><h2>'+esc(q.q)+'</h2>';q.opts.forEach(function(o){html+='<button class="v2-option" data-answer="'+o[0]+'">'+esc(o[1])+'</button>'});if(s.feedback)html+='<div class="v2-note">'+esc(s.feedback)+'</div>';html+='</article>';box.innerHTML=html;box.querySelectorAll('[data-answer]').forEach(function(b){b.onclick=function(){answer(b.getAttribute('data-answer'))}})}
function answer(id){var q=deductions[s.deduction];if(id!==q.correct){s.focus=Math.max(0,s.focus-1);s.feedback='這個結論超出了目前證據。把「存在異常」直接當成「已證實鬼怪」，或把一條人為線索擴張成全部答案，都會漏掉時間線中的矛盾。';if(s.focus===0){s.focus=1;s.feedback+=' 本章預覽不會讓你因教學推理失敗而重置進度。'}save();renderDeduction();return}s.deduction++;s.feedback='';if(s.deduction>=deductions.length){s.finished=true;save();render();return}save();renderDeduction()}

function start(reset){mount();if(reset){try{localStorage.removeItem(SAVE_KEY)}catch(e){}}s=load()||fresh();save();render()}
function install(){mount();var next=$('nextCaseBtn');if(next){next.textContent='進入案件二《雨夜敲門》';next.onclick=function(){start(false)}}var oldLoad=$('loadBtn'),saved=load();if(oldLoad&&saved&&!parse(CASE1_KEY)){oldLoad.disabled=false;oldLoad.textContent='繼續《雨夜敲門》';oldLoad.onclick=function(){start(false)}}}

install();
})();
