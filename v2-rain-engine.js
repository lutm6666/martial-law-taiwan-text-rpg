(function(){
'use strict';

var SAVE_KEY='mist-taiwan-v2-rain-ch1-v2';
var OLD_SAVE_KEY='mist-taiwan-v2-rain-ch1';
var CASE1_KEY='mist-taiwan-case-save-v4';
var MAX_FOCUS=4;
var s=null;
var ART='assets/v2/rain-ch1-concept.webp';

function $(id){return document.getElementById(id)}
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(s))}catch(e){}}
function profile(){var p=parse(CASE1_KEY)||{};return{name:typeof p.name==='string'&&p.name.trim()?p.name.trim():'林默'}}
function has(id){return s.evidence.indexOf(id)!==-1}
function notify(msg){var t=$('toast');if(!t)return;t.textContent=msg;t.className='toast show';clearTimeout(window.__v2toast);window.__v2toast=setTimeout(function(){t.className='toast'},1800)}
function addEvidence(id){if(evidence[id]&&!has(id)){s.evidence.push(id);notify('新增紀錄：'+evidence[id].name)}}
function requirementsMet(a){return !a.requires||a.requires.every(has)}
function unlocked(id){var l=locations[id];return !!l&&(!l.lockedBy||l.lockedBy.every(has))}

var evidence={
 door_marks:{name:'門框低位刮痕',type:'物證',desc:'新刮痕集中在門框下緣，位置低於成人自然敲門高度。'},
 rain_line:{name:'屋簷落水線',type:'現場紀錄',desc:'自然雨水會向門前右側匯流，但昨夜有一段泥痕逆著落水方向。'},
 torn_talisman:{name:'被撕動的鎮宅符',type:'家學觀察',desc:'紙纖維由下往上拉裂，較像外力撕動，而不是受潮自行脫落。'},
 talisman_age:{name:'黃符張貼時間',type:'證詞核對',desc:'林太太說黃符兩個月前就已貼上；新裂口卻明顯較近期。'},
 client_timeline:{name:'林太太的三夜時間表',type:'證詞',desc:'敲門分別出現在三個雨夜；第三夜阿信開門，第一夜則比其他兩次早了近半小時。'},
 son_account:{name:'阿信的說法',type:'證詞',desc:'阿信第三夜開門後只看到巷尾有人影轉過去，沒有看清臉。'},
 umbrella_mud:{name:'黑傘上的灰白泥點',type:'物證',desc:'阿信黑傘下緣沾的是偏灰白細泥，與林宅後巷的深褐泥不同。'},
 small_print:{name:'後巷窄底鞋印',type:'物證',desc:'一組窄底鞋印由巷尾靠近林宅再折返，步幅偏短。'},
 nail_mark:{name:'鞋跟缺釘痕',type:'物證',desc:'其中一隻鞋跟留下不完整方形凹痕，像鞋跟少了一枚釘。'},
 son_excluded:{name:'阿信鞋泥不符',type:'交叉比對',desc:'阿信的鞋與雨傘泥色都和後巷鞋印不同，現階段不能把他當成後巷那名行動者。'},
 neighbor_version:{name:'陳太太的怪談版本',type:'證詞',desc:'「三更三叩不可應門」這個完整說法，其實是最近兩週才在附近傳開。'},
 source_elder:{name:'傳聞來源：送香燭老人',type:'人物線索',desc:'陳太太承認，最早把完整說法帶進巷子的是一名替附近廟宇送香燭的老人。'},
 bell_time:{name:'雜貨店打烊鐘聲',type:'時間證詞',desc:'第一夜敲門前後，街口雜貨店剛敲過打烊鐘；多人可互相作證。'},
 route_window:{name:'後巷往返時間',type:'現場紀錄',desc:'從雜貨店到林宅後巷最快仍需約四分鐘；第一夜的已知可疑人物沒有足夠時間完成往返。'},
 timing_gap:{name:'第一夜時間缺口',type:'推理紀錄',desc:'人為路線可以解釋部分敲門，但第一夜目前無法由同一名已知行動者完成。'}
};

var locations={
 house:{name:'林宅門前',sub:'第一現場',intro:'雨剛停。舊木門被水氣浸得發黑，門框右側貼著一張褪色黃符。林太太說，第三次敲門後，她已不敢再讓兒子靠近這扇門。',actions:[
  {id:'door',name:'檢查門板與門框',desc:'先找實體接觸痕跡，而不是先猜敲門者。',gain:'door_marks',text:'門板正中央沒有新痕，反而是下緣靠右的位置有幾道新刮痕。若真有人用手敲門，這個高度顯得異常；但也可能是器物、繩索或低矮物件碰撞。'},
  {id:'rain',name:'沿屋簷查看積水',desc:'比對雨水自然流向與泥痕。',gain:'rain_line',text:'屋簷右側漏水最重，正常泥水應往巷心散開；門邊卻有一道短泥痕逆向靠近門框，像有東西在雨停前被拖過。'},
  {id:'talisman',name:'用家學檢查黃符',desc:'看紙、墨與破損，不把符本身當成鬼神證明。',gain:'torn_talisman',text:'符式屬常見鎮宅用途，真正值得注意的是裂口：紙纖維朝上翻，受力方向由下往上。這不像受潮脫落，而像有人從下方拉過。'},
  {id:'age',name:'追問黃符何時貼上',desc:'確認破損是否和敲門事件同時發生。',gain:'talisman_age',requires:['torn_talisman'],text:'林太太說，這張符兩個月前就貼好了，之前一直完整。她是在第二次敲門隔天才發現底角翹起。符本身很舊，裂口卻很新。'}]},
 parlor:{name:'林宅客廳',sub:'委託人陳述',intro:'煤油燈照著桌面。林太太把三個雨夜一再重述，但每次說到第一夜，她都會停一下，像是在確認自己是否記錯。',lockedBy:['door_marks'],actions:[
  {id:'timeline',name:'逐夜重建敲門時間',desc:'把三次事件拆開，不把它們當成同一件事。',gain:'client_timeline',text:'第一夜約十一點四十分；第二夜接近午夜；第三夜則在午夜後不久。林太太原本一直說「都是半夜」，但寫成時間表後，第一夜其實早了不少。'},
  {id:'sound',name:'追問敲門聲的差異',desc:'確認三次聲音是否真的完全一樣。',text:'她想了很久才承認：第二、三夜是清楚的三下木響；第一夜比較悶，像隔著門板或牆傳來。這個差異之前被她自己忽略了。'},
  {id:'fear',name:'詢問為何找上私家偵探',desc:'了解委託人的判斷與顧慮。',text:'她先問過鄰居，也去廟裡求過平安。真正讓她害怕的不是傳聞，而是第三夜阿信真的開了門。她想知道究竟有人盯上這個家，還是自己漏看了什麼。'}]},
 room:{name:'阿信房間',sub:'家屬證詞',intro:'課本壓著一張作業紙，床邊靠著還沒全乾的黑傘。阿信不太願意讓母親聽見自己說了什麼。',lockedBy:['client_timeline'],actions:[
  {id:'son',name:'單獨詢問阿信',desc:'讓他按自己的順序描述第三夜。',gain:'son_account',text:'阿信說，第三下之後他立刻開門。門前沒人，但巷尾似乎有一道影子轉過牆角。他追到門外兩步就被母親拉回。他沒看清臉，也不能確定那是不是人。'},
  {id:'umbrella',name:'檢查黑傘與鞋底',desc:'確認阿信昨夜是否走過後巷。',gain:'umbrella_mud',text:'黑傘下緣和鞋側沾著灰白細泥，像大路邊較乾的土。林宅後巷則是深褐黏泥。阿信昨夜確實外出過，但這組泥色還不能把他連到後巷。'},
  {id:'pressure',name:'追問他為何開門',desc:'確認是否有人事先誘導他。',text:'阿信說，他前兩天就聽同學講過「第三次不能開門」，反而更想知道是誰在惡作劇。這表示怪談已經離開巷子，傳到孩子之間。'}]},
 alley:{name:'林宅後巷',sub:'可能的接近路線',intro:'後巷比正門窄得多。牆腳積著深褐色黏泥，幾戶後門彼此很近；如果有人想靠近林宅又不被正街看見，這裡確實方便。',lockedBy:['door_marks','rain_line'],actions:[
  {id:'prints',name:'沿泥面找鞋印',desc:'確認是否有人從後巷靠近林宅。',gain:'small_print',text:'排水溝旁有一組較窄鞋印，從巷尾進來，在林宅後方停過，再折回去。它不是昨夜所有行人的唯一鞋印，但保存得最完整。'},
  {id:'nail',name:'細看鞋跟壓痕',desc:'找能區分鞋子的細節。',gain:'nail_mark',requires:['small_print'],text:'其中一腳鞋跟有個小缺口：方形釘痕少了一角。這比鞋印大小更有辨識力，日後若找到鞋，可以直接比對。'},
  {id:'route',name:'實際重走巷口路線',desc:'估算從街口到林宅需要多久。',gain:'route_window',requires:['client_timeline'],text:'你從街口雜貨店走到後巷，再到林宅門前，快走仍要約四分鐘；若還要折返，時間更長。這條路可用來裝神弄鬼，但不是瞬間能完成。'},
  {id:'compare',name:'比對阿信鞋泥與後巷',desc:'避免因為「他開過門」就直接懷疑他。',gain:'son_excluded',requires:['umbrella_mud','small_print'],text:'後巷泥土深褐、顆粒粗；阿信鞋側與傘上的泥偏灰白，質地也細。兩者不符。至少目前，沒有證據支持阿信就是後巷那名行動者。'}]},
 neighbor:{name:'陳太太騎樓',sub:'街坊傳聞',intro:'陳太太一開始堅稱這條巷子「以前就不乾淨」。但當你要求她分清楚「以前聽過什麼」和「最近才有人怎麼說」時，她的版本開始鬆動。',lockedBy:['son_account'],actions:[
  {id:'legend',name:'拆開怪談的每一句話',desc:'確認哪些是舊禁忌，哪些是新說法。',gain:'neighbor_version',text:'她承認，小時候只聽過夜裡不要隨便應門；「三更三叩不可應門」這句完整說法，是最近兩週才有人講得這麼具體。'},
  {id:'source',name:'追問最早是誰這樣說',desc:'找到傳聞的可追查來源。',gain:'source_elder',requires:['neighbor_version'],text:'她最後想起，是一名替附近廟宇送香燭的老人先說的。老人沒住這條巷子，只在下雨天來過幾次。'},
  {id:'bell',name:'核對第一夜的街口時間',desc:'找外部事件固定時間點。',gain:'bell_time',requires:['client_timeline'],text:'第一夜她正好在街口買醬油。雜貨店打烊前敲過一次銅鈴，店主和兩名客人都在。她說林宅的第一聲敲門大約就在那之後不久。'},
  {id:'gap',name:'把鐘聲與路線時間疊在一起',desc:'檢查同一人是否能完成第一夜行動。',gain:'timing_gap',requires:['bell_time','route_window','source_elder'],text:'如果把第一夜最可疑的人放在街口，他從鐘聲後離開、繞到後巷、製造敲門再回到原處，時間不夠。人為手法存在，但「同一個人解釋全部三夜」這個說法站不住。'}]}
};

var deductions=[
 {q:'目前最能確定的是什麼？',opts:[
  {t:'三次敲門都已證實是鬼神現象',ok:false,fb:'你有家學線索，但家學只能解讀符式與習俗，不能把未知直接當成鬼。'},
  {t:'至少有一部分現場曾被人為接近或操作',ok:true,fb:'門框、逆向泥痕、被拉扯的黃符與後巷鞋印，彼此支持「有人介入」。'},
  {t:'阿信在自導自演',ok:false,fb:'阿信的泥色與後巷不符，現階段沒有足夠證據把他指認為行動者。'}]},
 {q:'後巷鞋印和阿信的證詞，能推出什麼？',opts:[
  {t:'看到人影就代表那一定是留下鞋印的人',ok:false,fb:'阿信只看到模糊身影，鞋印只能證明有人走過，兩者還不能直接鎖成同一人。'},
  {t:'阿信很可疑，所以泥色差異可以忽略',ok:false,fb:'物證不應因懷疑對象而被忽略。泥色不符正是需要保留的反證。'},
  {t:'第三夜可能有人從後巷撤離，但身份仍未確定',ok:true,fb:'這個結論同時尊重鞋印與目擊證詞，也沒有超出它們能證明的範圍。'}]},
 {q:'為什麼第一夜仍然是一個缺口？',opts:[
  {t:'因為第一夜沒有下雨',ok:false,fb:'第一夜同樣是雨夜。真正的問題是外部時間點和往返路線對不上。'},
  {t:'已知人為路線需要的時間，和第一夜的外部證詞衝突',ok:true,fb:'銅鈴時間與步行時間把第一夜卡住了：同一名已知行動者無法同時出現在兩處。'},
  {t:'因為黃符證明有另一個靈體',ok:false,fb:'黃符只證明被人拉扯過，不能直接證明存在另一個靈體。'}]},
 {q:'第一章結束時，最合理的下一步是？',opts:[
  {t:'立即對林宅作法驅邪，案件就能結束',ok:false,fb:'你還不知道誰在散播具體怪談，也沒解開第一夜。現在結案太早。'},
  {t:'追查送香燭老人與附近廟宇，確認怪談來源及其來巷子的理由',ok:true,fb:'這條線索同時連到傳聞、人員流動與家學背景，是下一章最具資訊價值的方向。'},
  {t:'公開說阿信在說謊',ok:false,fb:'現有證據反而替阿信排除了部分嫌疑，公開指控沒有依據。'}]}
];

function fresh(){return{caseId:'rain-ch1-v2',name:profile().name,focus:MAX_FOCUS,loc:'house',visited:{house:true},done:{},evidence:[],feedback:'',phase:'investigate',deduction:0,answers:[],finished:false}}
function migrateOld(){var old=parse(OLD_SAVE_KEY);if(!old)return null;var n=fresh();var map={low_scratches:'door_marks',rain_channel:'rain_line',torn_talisman:'torn_talisman',small_print:'small_print',son_account:'son_account',neighbor_version:'neighbor_version',timing_gap:'timing_gap'};var oldEvidence=Array.isArray(old.evidence)?old.evidence:[];oldEvidence.forEach(function(id){var m=map[id];if(m&&n.evidence.indexOf(m)<0)n.evidence.push(m)});return n}
function normalize(v){if(!v||typeof v!=='object'||v.caseId!=='rain-ch1-v2')return null;var n=fresh(),validEvidence={},validActions={},actionById={};Object.keys(evidence).forEach(function(id){validEvidence[id]=true});Object.keys(locations).forEach(function(locId){locations[locId].actions.forEach(function(a){validActions[a.id]=true;actionById[a.id]=a})});n.name=typeof v.name==='string'&&v.name.trim()?v.name.trim():n.name;var f=Number(v.focus);n.focus=Number.isFinite(f)?Math.max(1,Math.min(MAX_FOCUS,Math.floor(f))):MAX_FOCUS;n.evidence=[];(Array.isArray(v.evidence)?v.evidence:[]).forEach(function(id){if(validEvidence[id]&&n.evidence.indexOf(id)<0)n.evidence.push(id)});function hasN(id){return n.evidence.indexOf(id)!==-1}n.done={};if(v.done&&typeof v.done==='object'){Object.keys(v.done).forEach(function(id){var a=actionById[id];if(!a||!v.done[id])return;if(a.requires&&!a.requires.every(hasN))return;if(a.gain&&!hasN(a.gain))return;n.done[id]=true})}n.visited={house:true};if(v.visited&&typeof v.visited==='object'){Object.keys(v.visited).forEach(function(id){var l=locations[id];if(!l||!v.visited[id])return;if(!l.lockedBy||l.lockedBy.every(hasN))n.visited[id]=true})}n.loc=typeof v.loc==='string'&&locations[v.loc]&&(!locations[v.loc].lockedBy||locations[v.loc].lockedBy.every(hasN))?v.loc:'house';n.visited[n.loc]=true;n.feedback=typeof v.feedback==='string'?v.feedback:'';var step=Number(v.deduction);n.deduction=Number.isFinite(step)?Math.max(0,Math.min(deductions.length,Math.floor(step))):0;n.answers=(Array.isArray(v.answers)?v.answers:[]).filter(function(x){return Number.isInteger(x)&&x>=0&&x<3}).slice(0,n.deduction);var core=['door_marks','rain_line','torn_talisman','talisman_age','client_timeline','son_account','umbrella_mud','small_print','nail_mark','son_excluded','neighbor_version','source_elder','bell_time','route_window','timing_gap'].every(hasN);n.finished=core&&n.deduction>=deductions.length;if(n.finished){n.phase='done';n.deduction=deductions.length}else if(v.phase==='deduction'&&core){n.phase='deduction'}else{n.phase='investigate';if(!core)n.deduction=0}return n}
function load(){var v=parse(SAVE_KEY);if(!v||v.caseId!=='rain-ch1-v2')v=migrateOld();return normalize(v)}
function allCore(){return ['door_marks','rain_line','torn_talisman','talisman_age','client_timeline','son_account','umbrella_mud','small_print','nail_mark','son_excluded','neighbor_version','source_elder','bell_time','route_window','timing_gap'].every(has)}

function injectStyle(){if($('v2RainStyle'))return;var st=document.createElement('style');st.id='v2RainStyle';st.textContent='\
#v2Rain{padding-bottom:86px}.v2-head{padding:14px 15px;margin-bottom:12px}.v2-head h2{margin:0 0 5px;font-size:1rem}.v2-meta{font-size:.72rem;color:#9b988b;line-height:1.5}.v2-dots{display:flex;gap:5px;margin-top:8px}.v2-dots i{width:10px;height:10px;border-radius:50%;background:#44473e}.v2-dots i.on{background:#c7b16f}.v2-scene{padding:0;overflow:hidden}.v2-art{width:100%;display:block;aspect-ratio:3/2;object-fit:cover;filter:saturate(.78) contrast(1.05)}.v2-scene-body{padding:17px}.v2-scene h2{margin:4px 0 10px}.v2-scene p{line-height:1.78}.v2-actions{display:grid;gap:9px;margin-top:12px}.v2-btn{border:1px solid #3d4036;background:#1b1d18;color:#ece8dc;border-radius:13px;padding:12px;text-align:left}.v2-btn strong{display:block}.v2-btn small{display:block;color:#969386;margin-top:4px;line-height:1.48}.v2-btn.done{opacity:.56}.v2-map{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.v2-map button{border:1px solid #3a3d33;background:#191b17;color:#ded9cb;border-radius:12px;padding:11px;text-align:left}.v2-map button.locked{display:none}.v2-map button.current{border-color:#9b8754;background:#292719}.v2-note{margin-top:12px;padding:11px 12px;border-left:3px solid #8d7853;background:#211e18;line-height:1.68;color:#c8c1b1}.v2-records{margin-top:12px}.v2-rec{padding:11px;border:1px solid #35382f;border-radius:11px;background:#171914;margin-top:8px}.v2-rec strong{display:block}.v2-rec small{display:block;margin-top:4px;color:#9c998d;line-height:1.55}.v2-deduction,.v2-chapter-end{padding:18px}.v2-option{display:block;width:100%;margin-top:9px;border:1px solid #41443a;background:#1b1e18;color:#eee9dc;border-radius:12px;padding:12px;text-align:left;line-height:1.58}.v2-chapter-end p{line-height:1.78}@media(min-width:640px){.v2-actions{grid-template-columns:1fr 1fr}.v2-map{grid-template-columns:repeat(5,1fr)}}';document.head.appendChild(st)}
function mount(){if($('v2Rain'))return;injectStyle();var root=document.createElement('section');root.id='v2Rain';root.className='hidden';root.innerHTML='<div id="v2RainMain"></div>';document.querySelector('main.app').appendChild(root)}
function hideBase(){['startScreen','prologueScreen','gameScreen','completeScreen','failScreen','case2Screen'].forEach(function(id){var el=$(id);if(el)el.classList.add('hidden')})}
function showRoot(){mount();hideBase();$('v2Rain').classList.remove('hidden');$('caseChip').textContent='CASE 02・雨夜敲門';var build=document.querySelector('.build');if(build)build.textContent='V2・CHAPTER 01 EXPANDED'}
function focusDots(){var out='';for(var i=0;i<MAX_FOCUS;i++)out+='<i class="'+(i<s.focus?'on':'')+'"></i>';return out}

function render(){showRoot();var box=$('v2RainMain');if(s.finished){box.innerHTML='<article class="v2-chapter-end card paper"><p class="eyebrow" style="color:#715c34">CHAPTER 01 COMPLETE</p><h2>有人在利用怪談，但怪談沒有解釋完一切</h2><p>你已能確認，林宅周邊存在人為操作：後巷有人進出、黃符被外力撕動，傳聞也在近期被重新塑造成「三次敲門」的具體版本。</p><p>然而第一夜仍留下時間缺口。這不代表鬼神成立，只表示目前的「同一個人、同一套手法」不足以解釋全部三夜。</p><p>下一條最值得追的線，指向那名送香燭的老人，以及他替哪一間廟宇辦事。</p><p class="note">下一章：香火從哪裡來。將開放香舖、廟宇側殿與更完整的家學調查。</p><button id="v2Home" class="primary" type="button">回到標題</button></article>';$('v2Home').onclick=function(){location.reload()};return}
 if(s.phase==='deduction'){renderDeduction();return}
 var l=locations[s.loc];var html='<div class="v2-head card"><h2>'+esc(s.name)+'・私家偵探</h2><div class="v2-meta">案件二《雨夜敲門》・第一章｜物證、證詞、時間線與家學觀察必須互相對得上。</div><div class="v2-dots">'+focusDots()+'</div></div>';
 html+='<article class="v2-scene card">'+(s.loc==='house'?'<img class="v2-art" src="'+ART+'" alt="雨夜中的林宅與臺北巷道">':'')+'<div class="v2-scene-body"><small>'+esc(l.sub)+'</small><h2>'+esc(l.name)+'</h2><p>'+esc(l.intro)+'</p><div class="v2-actions">';
 l.actions.forEach(function(a){if(!requirementsMet(a))return;var done=!!s.done[a.id];html+='<button class="v2-btn '+(done?'done':'')+'" data-action="'+esc(a.id)+'"><strong>'+esc(a.name)+'</strong><small>'+esc(done?'已調查｜可再次查看':a.desc)+'</small></button>'});
 html+='</div><div id="v2Feedback" class="v2-note">'+esc(s.feedback||'先查現場，再談怪異。新的資訊會開放新的地點與追問。')+'</div></div></article>';
 html+='<div class="v2-map">';Object.keys(locations).forEach(function(id){if(!unlocked(id))return;html+='<button data-loc="'+id+'" class="'+(id===s.loc?'current':'')+'">'+esc(locations[id].name)+'</button>'});html+='</div>';
 html+='<section class="v2-records"><h3>案件筆記 '+s.evidence.length+'/15</h3>';s.evidence.slice().reverse().forEach(function(id){var e=evidence[id];html+='<div class="v2-rec"><strong>'+esc(e.name)+'｜'+esc(e.type)+'</strong><small>'+esc(e.desc)+'</small></div>'});html+='</section>';
 if(allCore())html+='<button id="v2Deduce" class="primary" type="button">整理第一章推理</button>';
 box.innerHTML=html;
 Array.prototype.forEach.call(box.querySelectorAll('[data-action]'),function(b){b.onclick=function(){doAction(this.getAttribute('data-action'))}});
 Array.prototype.forEach.call(box.querySelectorAll('[data-loc]'),function(b){b.onclick=function(){s.loc=this.getAttribute('data-loc');s.visited[s.loc]=true;s.feedback='';save();render()}});
 var d=$('v2Deduce');if(d)d.onclick=function(){s.phase='deduction';s.deduction=0;s.feedback='';save();render()};
}
function doAction(id){var l=locations[s.loc],a=l.actions.filter(function(x){return x.id===id})[0];if(!a||!requirementsMet(a))return;s.done[id]=true;if(a.gain)addEvidence(a.gain);s.feedback=a.text;save();render()}
function renderDeduction(){var box=$('v2RainMain'),d=deductions[s.deduction];var html='<article class="v2-deduction card"><p class="eyebrow">第一章推理 '+(s.deduction+1)+' / '+deductions.length+'</p><h2>'+esc(d.q)+'</h2><div class="v2-dots">'+focusDots()+'</div>';if(s.feedback)html+='<div class="v2-note">'+esc(s.feedback)+'</div>';d.opts.forEach(function(o,i){html+='<button class="v2-option" data-opt="'+i+'">'+esc(o.t)+'</button>'});html+='</article>';box.innerHTML=html;Array.prototype.forEach.call(box.querySelectorAll('[data-opt]'),function(b){b.onclick=function(){answer(Number(this.getAttribute('data-opt')))}})}
function answer(i){var d=deductions[s.deduction],o=d.opts[i];if(!o)return;if(o.ok){s.answers.push(i);s.feedback=o.fb;s.deduction+=1;if(s.deduction>=deductions.length){s.finished=true;s.phase='done';s.feedback=''}save();render();return}s.focus=Math.max(1,s.focus-1);s.feedback='推理過度：'+o.fb;save();renderDeduction()}
function start(reset){s=reset?fresh():(load()||fresh());save();render()}
function install(){mount();var n=$('nextCaseBtn');if(n){n.textContent='開始《雨夜敲門》擴充第一章';n.onclick=function(){start(false)}}var l=$('loadBtn');if(l)l.onclick=function(){start(false)}}
install();
})();
