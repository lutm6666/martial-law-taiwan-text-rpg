(function(){
'use strict';

var SAVE_KEY='mist-taiwan-rain-full-v3';
var OLD_SAVE_KEYS=['mist-taiwan-v2-rain-ch1-v2','mist-taiwan-v2-rain-ch1'];
var CASE1_KEY='mist-taiwan-case-save-v4';
var CASE_ID='rain-full-v3';
var MAX_FOCUS=4;
var s=null;
var ART='assets/v2/rain-house-front.jpg?v=7';

function $(id){return document.getElementById(id)}
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(s))}catch(e){}}
function profile(){var p=parse(CASE1_KEY)||{};return{name:typeof p.name==='string'&&p.name.trim()?p.name.trim():'林默'}}
function has(id){return s.evidence.indexOf(id)!==-1}
function notify(msg){var t=$('toast');if(!t)return;t.textContent=msg;t.className='toast show';clearTimeout(window.__rainToast);window.__rainToast=setTimeout(function(){t.className='toast'},1800)}
function addEvidence(id){if(evidence[id]&&!has(id)){s.evidence.push(id);notify('新增紀錄：'+evidence[id].name)}}
function requirementsMet(a){return !a.requires||a.requires.every(has)}
function locationUnlocked(id){
 var l=locations[id];
 if(!l)return false;
 if(l.phase&&l.phase>s.stage)return false;
 return !l.lockedBy||l.lockedBy.every(has);
}

var evidence={
 door_marks:{name:'門框低位刮痕',type:'物證',desc:'新刮痕集中在門框下緣，位置低於成人自然敲門高度。'},
 rain_line:{name:'逆向泥痕',type:'現場紀錄',desc:'屋簷落水本應往巷心散開，但門邊有一段泥痕逆著水流貼近門框。'},
 torn_talisman:{name:'被撕動的鎮宅符',type:'家學觀察',desc:'紙纖維由下往上翻裂，顯示近期受過外力，不像單純受潮。'},
 talisman_age:{name:'黃符張貼時間',type:'證詞核對',desc:'黃符兩個月前已貼好；林太太在第二次敲門後才發現新的裂口。'},
 client_timeline:{name:'三夜時間表',type:'證詞',desc:'第一夜約十一點四十分，第二夜接近午夜，第三夜則在午夜後不久。'},
 sound_difference:{name:'第一夜聲音差異',type:'證詞細節',desc:'第二、三夜是清楚的三下木響；第一夜較悶，像從側牆或隔著木板傳來。'},
 son_account:{name:'阿信的說法',type:'證詞',desc:'第三夜開門後，阿信只看見巷尾有模糊身影轉過牆角，沒有看清臉。'},
 umbrella_mud:{name:'阿信傘鞋的灰白泥',type:'物證',desc:'阿信傘與鞋上的灰白細泥，與林宅後巷的深褐黏泥不同。'},
 small_print:{name:'後巷窄底鞋印',type:'物證',desc:'窄底鞋印由巷尾靠近林宅再折返，步幅偏短。'},
 nail_mark:{name:'鞋跟缺釘痕',type:'物證',desc:'右腳鞋跟壓痕少了一角方形鞋釘，是可比對的個別特徵。'},
 son_excluded:{name:'阿信暫時排除',type:'交叉比對',desc:'阿信的鞋泥與後巷鞋印環境不符，不能只因為他開過門就把他當成行動者。'},
 neighbor_version:{name:'怪談的新版本',type:'證詞',desc:'「三更三叩不可應門」的完整說法是最近兩週才在附近出現。'},
 source_elder:{name:'傳聞來源：許伯',type:'人物線索',desc:'街坊最早從替德安宮送香燭的許伯口中聽到夜間應門的禁忌。'},
 bell_time:{name:'雜貨店打烊鐘聲',type:'時間證詞',desc:'第一夜敲門前不久，街口雜貨店剛敲過打烊銅鈴，多人能互相印證。'},
 route_window:{name:'後巷往返時間',type:'現場紀錄',desc:'從街口繞到林宅後巷，快走仍約四分鐘；若再折返，時間更長。'},
 timing_gap:{name:'第一夜時間缺口',type:'推理紀錄',desc:'已知人為路線可以解釋第二、三夜的一部分，卻塞不進第一夜的外部時間點。'},
 incense_ledger:{name:'香燭店送貨簿',type:'帳簿',desc:'阿祿只在第二、第三個雨夜前後送貨進林宅一帶；第一夜沒有他的送貨紀錄。'},
 waxed_cord:{name:'上蠟細麻線',type:'物證',desc:'香燭店常用的細麻線表面上蠟，遇雨不易立刻吸水變軟。'},
 wooden_toggle:{name:'缺口小木墜',type:'物證',desc:'香燭店後間少了一個用來壓線的小木墜；形狀與門框低位刮痕寬度相近。'},
 pressure_note:{name:'催售字條',type:'文件',desc:'蔡掌櫃曾催林太太處理屋後小倉間，但字條只談租售與欠款，沒有指示裝神弄鬼。'},
 elder_original:{name:'許伯原話',type:'證詞',desc:'許伯只說「夜深有人叫門，先問姓名再開」；他否認說過「三更三叩」。'},
 apprentice_phrase:{name:'阿祿改寫怪談',type:'證詞核對',desc:'許伯記得阿祿曾追問「若敲三次是不是更忌諱」；完整的三叩版本很可能由阿祿加工後散開。'},
 heel_match:{name:'阿祿鞋跟吻合',type:'關鍵物證',desc:'阿祿右鞋鞋跟正少一枚方釘，位置與後巷鞋印的缺口一致。'},
 cord_trace:{name:'線蠟與門框殘留',type:'交叉比對',desc:'門框刮痕邊緣有淡蠟質，與香燭店上蠟麻線相符；可解釋低位敲擊、逆向泥痕與符角被勾起。'},
 awning_bamboo:{name:'鬆動的竹落水管',type:'現場物證',desc:'林宅側牆的舊竹落水管在積水後會擺動，竹端能碰到薄木隔板。'},
 bamboo_abrasion:{name:'竹端新磨痕',type:'物證',desc:'竹管末端有新鮮磨白，隔板同高位置也有撞痕；聲音較悶，符合第一夜描述。'},
 rain_recreation:{name:'第一夜聲音重現',type:'實驗紀錄',desc:'灌水使竹管增重後，側牆可重現近似第一夜的悶響；它不是第二、三夜清脆的門框聲。'},
 apprentice_confession:{name:'阿祿的承認',type:'證詞',desc:'阿祿承認第二、第三夜用細線與木墜製造三下敲門，想把林家嚇到願意搬走。'},
 owner_boundary:{name:'蔡掌櫃責任邊界',type:'推理紀錄',desc:'蔡掌櫃確實施壓催售，但目前沒有證據證明他授意阿祿假造鬧鬼；兩種責任不能混成一件事。'}
};

var locations={
 house:{phase:1,name:'林宅門前',sub:'第一現場',intro:'雨剛停。舊木門被水氣浸得發黑，右側貼著一張褪色黃符。第三次敲門後，林太太已不敢讓兒子單獨靠近這扇門。',actions:[
  {id:'door',name:'檢查門板與門框',desc:'先找實體接觸痕跡。',gain:'door_marks',text:'門板中央沒有新撞痕，反而是下緣靠右有幾道新刮痕。若有人徒手敲門，這個高度不自然；器物、繩線或低矮物件反而更合理。'},
  {id:'rain',name:'沿屋簷查看積水',desc:'比對雨水自然流向與泥痕。',gain:'rain_line',text:'落水正常會往巷心散開，門邊卻有短泥痕逆向貼近門框。像有細東西在濕泥裡被拉回。'},
  {id:'talisman',name:'用家學檢查黃符',desc:'解讀紙、墨與受力，不把符本身當證明。',gain:'torn_talisman',text:'符式只是常見鎮宅用法。真正值得注意的是裂口：紙纖維向上翻，受力方向由下往上，像被某種細物勾過。'},
  {id:'age',name:'追問黃符何時破損',desc:'把破損與三夜事件對時。',gain:'talisman_age',requires:['torn_talisman'],text:'黃符兩個月前已貼上，第二次敲門隔天才出現翹角。符很舊，裂口很新。'}]},
 parlor:{phase:1,name:'林宅客廳',sub:'委託人陳述',intro:'煤油燈照著桌面。林太太反覆說「三個雨夜都一樣」，但每次講到第一夜，她都會停頓。',lockedBy:['door_marks'],actions:[
  {id:'timeline',name:'逐夜重建時間',desc:'把三次事件拆開。',gain:'client_timeline',text:'寫成時間後差異很明顯：第一夜約十一點四十分；第二夜接近午夜；第三夜在午夜後。'},
  {id:'sound',name:'追問三夜聲音差異',desc:'確認是否真是同一種聲音。',gain:'sound_difference',requires:['client_timeline'],text:'林太太承認，第二、三夜是清楚的三下木響；第一夜較悶，像從側牆或隔著木板傳來。她先前因為害怕，把三次聲音記成了同一件事。'},
  {id:'fear',name:'問她真正害怕什麼',desc:'分開怪談與現實風險。',text:'她真正害怕的是第三夜阿信開門後，巷尾真的出現了人影。她要你查的是「是否有人盯上這個家」，不是替她證明有鬼。'}]},
 room:{phase:1,name:'阿信房間',sub:'家屬證詞',intro:'課本壓著作業紙，床邊靠著還沒全乾的黑傘。阿信不願讓母親聽見全部談話。',lockedBy:['client_timeline'],actions:[
  {id:'son',name:'單獨詢問阿信',desc:'讓他按自己的順序說第三夜。',gain:'son_account',text:'第三下後阿信立刻開門。門前沒人，但巷尾似乎有身影轉過牆角。他沒看清臉，也不能確定那人是不是敲門者。'},
  {id:'umbrella',name:'檢查黑傘與鞋底',desc:'確認他昨夜走過哪種地面。',gain:'umbrella_mud',text:'傘下緣與鞋側沾的是灰白細泥，林宅後巷卻是深褐黏泥。阿信昨夜外出過，但這組泥不能把他連到後巷。'},
  {id:'pressure',name:'追問他為何敢開門',desc:'查怪談是否已傳到孩子之間。',text:'阿信說同學早就在講「第三次不能開門」，所以他反而想抓惡作劇的人。怪談已經離開這條巷子。'}]},
 alley:{phase:1,name:'林宅後巷',sub:'可能的撤離路線',intro:'後巷窄而陰濕。若有人想靠近林宅又避開正街視線，這裡很方便。',lockedBy:['door_marks','rain_line'],actions:[
  {id:'prints',name:'沿泥面找鞋印',desc:'確認是否有人靠近林宅後側。',gain:'small_print',text:'排水溝旁有一組窄底鞋印，由巷尾靠近林宅再折返，步幅不大。'},
  {id:'nail',name:'細看鞋跟壓痕',desc:'找能區分鞋子的個別特徵。',gain:'nail_mark',requires:['small_print'],text:'右腳鞋跟少了一角方形壓痕，像缺一枚鞋釘。這比單看鞋碼更有用。'},
  {id:'route',name:'實際重走街口到後巷',desc:'估算完成一次往返需要多久。',gain:'route_window',requires:['client_timeline'],text:'從雜貨店快走到後巷仍約四分鐘；若還要布置、敲門再折返，時間更長。'},
  {id:'compare',name:'比對阿信鞋泥',desc:'用反證避免先入為主。',gain:'son_excluded',requires:['umbrella_mud','small_print'],text:'阿信鞋側的灰白細泥與後巷深褐黏泥不符。至少目前，沒有證據支持他是後巷行動者。'}]},
 neighbor:{phase:1,name:'陳太太騎樓',sub:'街坊傳聞',intro:'陳太太堅稱巷子「以前就不乾淨」。你要求她把舊禁忌與最近才出現的說法分開。',lockedBy:['son_account'],actions:[
  {id:'legend',name:'拆開怪談的每一句',desc:'確認哪些是舊禁忌，哪些是新說法。',gain:'neighbor_version',text:'她承認小時候只聽過夜裡不要隨便應門；「三更三叩不可應門」這句完整話，是最近兩週才有人講得這麼具體。'},
  {id:'source',name:'追問最早來源',desc:'把傳聞變成可追查的人。',gain:'source_elder',requires:['neighbor_version'],text:'最早提起夜間應門禁忌的人，是替附近德安宮送香燭的許伯。怪的是，許伯並不住這條巷子。'},
  {id:'bell',name:'核對第一夜時間',desc:'用外部事件固定時間點。',gain:'bell_time',requires:['client_timeline'],text:'第一夜她在街口買醬油，雜貨店打烊前敲過銅鈴。店主與兩名客人都能證明。林宅那陣悶響就在鐘聲後不久。'},
  {id:'gap',name:'把鐘聲與路線疊在一起',desc:'測試同一人是否能完成第一夜。',gain:'timing_gap',requires:['bell_time','route_window','source_elder'],text:'如果第一夜也用「街口—後巷—林宅」這條路線，時間塞不進去。第一夜必須另找解釋。'}]},
 incense:{phase:2,name:'永順香燭舖',sub:'傳聞與工具的交會點',intro:'店裡混著線香、蠟與潮紙的氣味。許伯替德安宮跑腿，年輕學徒阿祿則負責附近送貨。',lockedBy:['source_elder','timing_gap'],actions:[
  {id:'ledger',name:'查送貨簿',desc:'先確認誰在三個雨夜出現在附近。',gain:'incense_ledger',text:'送貨簿寫得很清楚：阿祿在第二、第三個雨夜前後都送貨進林宅一帶；第一夜沒有。這與三夜「不是同一件事」的方向吻合。'},
  {id:'cord',name:'查看包貨用線',desc:'比對能否留下門邊痕跡。',gain:'waxed_cord',text:'店裡用細麻線綁香紙，線上抹薄蠟防潮。濕地上拉動時不易立刻吸水鬆垮。'},
  {id:'toggle',name:'查看後間工具',desc:'找能產生低位敲擊的物件。',gain:'wooden_toggle',requires:['waxed_cord'],text:'後間一排壓線小木墜少了一個。剩下的寬度與門框低位刮痕接近。單獨看不能定罪，但方法開始成形。'},
  {id:'pressure_note',name:'問蔡掌櫃與林家的關係',desc:'找可能的現實動機。',gain:'pressure_note',text:'蔡掌櫃拿出一張催售字條：林家屋後小倉間欠著租款，他一直想把相鄰空間併進店後倉。字條語氣強硬，但沒有任何「鬧鬼」指示。'}]},
 temple:{phase:2,name:'德安宮側殿',sub:'追查許伯原話',intro:'雨水從廟埕石縫往外退。許伯聽完「三更三叩」後皺眉，說那不是自己講的話。',lockedBy:['incense_ledger'],actions:[
  {id:'elder',name:'請許伯逐字重述',desc:'把原始說法與街坊版本分開。',gain:'elder_original',text:'許伯只說過：「夜深有人叫門，先問姓名再開。」那是老人提醒晚輩的小心話，沒有三更、沒有三叩，更沒有第三次開門會出事。'},
  {id:'apprentice',name:'問誰曾追問禁忌細節',desc:'找版本被加工的節點。',gain:'apprentice_phrase',requires:['elder_original'],text:'許伯想起阿祿曾笑著問：「若敲三次，是不是更忌諱？」幾天後，巷子裡就開始流傳完整的三叩版本。'},
  {id:'ritual',name:'用家學核對「三叩」說法',desc:'確認這是否為固定科儀禁忌。',text:'你熟悉的家傳科儀裡沒有「三更三叩不可應門」這條固定規矩。不同地方當然有夜間禁忌，但這個版本更像後來拼裝成的故事，而不是可追溯的完整傳統。'}]},
 cobbler:{phase:2,name:'巷口修鞋攤',sub:'鞋印比對',intro:'修鞋師傅看一眼你拓下的鞋跟缺口，就說這種方釘補法他最近才做過。',lockedBy:['nail_mark','incense_ledger'],actions:[
  {id:'heel',name:'比對阿祿的鞋',desc:'用個別缺損而不是鞋碼指認。',gain:'heel_match',text:'阿祿右鞋鞋跟正少一枚方釘，缺口位置與後巷鞋印一致。師傅還記得，他前幾天嫌下雨麻煩，說改天再來補。'},
  {id:'trace',name:'把鞋印與門框痕跡一起比對',desc:'把「人」與「方法」串起來。',gain:'cord_trace',requires:['heel_match','waxed_cord','wooden_toggle'],text:'你回看門框刮痕，邊緣有一層極淡的蠟質。上蠟麻線拖過濕泥再拉回門邊，能同時解釋逆向泥痕、低位刮痕與被勾起的符角。'}]},
 eaves:{phase:2,name:'林宅側牆雨棚',sub:'第一夜的另一個來源',intro:'第一夜聲音比較悶，而且時間對不上後巷路線。你改查側牆，而不是繼續盯著正門。',lockedBy:['sound_difference','timing_gap'],actions:[
  {id:'bamboo',name:'檢查竹落水管',desc:'找能在雨勢變化時自行碰撞的東西。',gain:'awning_bamboo',text:'一節老竹落水管的綁繩鬆了。平時貼著牆，積水變重後會往外擺，竹端正好能碰到薄木隔板。'},
  {id:'abrasion',name:'比對竹端與隔板',desc:'確認是否真的發生過碰撞。',gain:'bamboo_abrasion',requires:['awning_bamboo'],text:'竹端有新鮮磨白，隔板同高位置也有淡撞痕。這組痕跡的高度與正門低位刮痕不同，是另一套機制。'},
  {id:'recreate',name:'重現第一夜聲音',desc:'用可重複的現象檢驗推測。',gain:'rain_recreation',requires:['bamboo_abrasion','sound_difference'],text:'你往竹管灌水，重量增加後它擺向隔板，連著敲出幾下悶響。林太太站回客廳，立刻說：「第一夜比較像這個。」第一夜不必假設有人在門外。'}]},
 backroom:{phase:2,name:'香燭舖後間',sub:'對質與責任',intro:'證據已經足夠讓阿祿不能只用「我只是送貨」帶過。蔡掌櫃也在場，但兩人的責任仍要分開。',lockedBy:['heel_match','cord_trace','apprentice_phrase','rain_recreation'],actions:[
  {id:'confess',name:'按時間順序對質阿祿',desc:'不要先講鬼神，先講他無法迴避的物證。',gain:'apprentice_confession',text:'鞋跟、送貨時間、蠟線與木墜一項項擺出來後，阿祿終於承認：第二、第三夜是他做的。他聽到林家第一夜受驚，又知道掌櫃想催搬，便把許伯的話改成「三叩」怪談，再用細線拖著木墜敲門。第三夜阿信突然開門，他才從後巷逃走。'},
  {id:'boundary',name:'追問蔡掌櫃是否授意',desc:'分清楚施壓、默許與直接指使。',gain:'owner_boundary',requires:['apprentice_confession','pressure_note'],text:'蔡掌櫃承認催得很兇，也知道阿祿常替自己去林家附近跑腿，但堅稱沒有叫他裝鬼。阿祿也說「是我自己想的」。你可以批評蔡掌櫃的施壓，卻不能把沒有證據的指使寫進結論。'}]}
};

var interimDeductions=[
 {q:'目前最能確定的是什麼？',opts:[
  {t:'三次敲門都已證實是鬼神現象',ok:false,fb:'未知不等於鬼神。現場反而有多項人為介入痕跡。'},
  {t:'至少第二、第三夜存在人為操作的可能，而且第一夜需要分開處理',ok:true,fb:'低位刮痕、後巷鞋印與時間缺口都支持把三夜拆開。'},
  {t:'阿信在自導自演',ok:false,fb:'阿信鞋泥與後巷不符，現在指控他反而忽略了反證。'}]},
 {q:'怪談本身最值得追的是什麼？',opts:[
  {t:'它聽起來很像民俗，所以不必查來源',ok:false,fb:'越具體的說法越應該追來源，尤其它最近才出現。'},
  {t:'「三叩」版本最近才形成，而且能追到許伯這個具體來源',ok:true,fb:'傳聞有傳播鏈，就有可能找出在哪一段被加工。'},
  {t:'只要去廟裡問神明即可',ok:false,fb:'家學可以提供脈絡，但案件仍需靠可核對的人、物與時間線。'}]},
 {q:'第一夜為什麼不能直接套用後巷路線？',opts:[
  {t:'因為第一夜沒有下雨',ok:false,fb:'第一夜同樣是雨夜。'},
  {t:'打烊鐘聲提供了外部時間點，已知後巷往返需要的時間塞不進去',ok:true,fb:'這是目前最硬的矛盾。'},
  {t:'因為黃符證明有另一個靈體',ok:false,fb:'黃符只能證明受過外力，不能證明靈體。'}]},
 {q:'下一步最有效率的調查方向？',opts:[
  {t:'追查許伯、香燭舖與第一夜不同聲音的來源',ok:true,fb:'這能同時追傳聞、人員流動、工具來源與第一夜缺口。'},
  {t:'立刻公開說林宅鬧鬼是假的',ok:false,fb:'你還沒有完成第二、第三夜的行動者指認，也沒解釋第一夜。'},
  {t:'只盯著阿信，不再查其他人',ok:false,fb:'現有物證並不支持這種單一路線。'}]}
];

var finalDeductions=[
 {q:'三個雨夜應該如何分類？',opts:[
  {t:'三夜都是阿祿用同一套方法製造',ok:false,fb:'第一夜沒有阿祿送貨紀錄，時間也不合，而且聲音能由側牆竹管重現。'},
  {t:'第一夜是雨水使竹落水管敲擊側牆；第二、第三夜是阿祿利用怪談人為製造',ok:true,fb:'這個結論同時解釋聲音差異、時間線與物證。'},
  {t:'第一夜是真的鬼，後兩夜是模仿',ok:false,fb:'第一夜已有可重複的自然機制，沒有必要越過證據加入鬼神假設。'}]},
 {q:'哪一組證據最能把阿祿連到第二、第三夜？',opts:[
  {t:'他年輕、會下雨天送貨，所以很可疑',ok:false,fb:'身分與機會不能替代物證。'},
  {t:'缺釘鞋跟吻合＋送貨簿時間＋上蠟麻線與門框殘留',ok:true,fb:'這組證據同時連到人、時間與方法。'},
  {t:'陳太太覺得他眼神閃爍',ok:false,fb:'印象不是可靠指認。'}]},
 {q:'「三更三叩不可應門」應如何判斷？',opts:[
  {t:'是德安宮固定傳承的禁忌',ok:false,fb:'許伯原話和家學核對都不支持。'},
  {t:'以舊有夜間禁忌為底，被阿祿加工成更具體、可用來恐嚇的版本',ok:true,fb:'這保留民俗背景，也指出故事被人利用的節點。'},
  {t:'完全沒有任何民俗背景，全部憑空捏造',ok:false,fb:'許伯確實說過較一般的夜間應門提醒。'}]},
 {q:'蔡掌櫃在案件中的責任應怎麼寫？',opts:[
  {t:'直接寫他指使阿祿裝鬼',ok:false,fb:'沒有直接證據。催售壓力與具體指使必須分開。'},
  {t:'他確實以欠款與空間問題施壓催搬，但目前只能確認阿祿自行設計恐嚇手法',ok:true,fb:'這個表述不替蔡掌櫃開脫，也不超過證據。'},
  {t:'完全與案件無關',ok:false,fb:'催售壓力是阿祿行動的重要現實背景。'}]},
 {q:'最穩健的結案說法是？',opts:[
  {t:'本案證明世上沒有鬼',ok:false,fb:'一個案件只能處理這個案件的證據，不能替所有未知現象下總結。'},
  {t:'本案三夜已有足夠的人為與自然解釋；沒有證據需要引入鬼神，但也不把家學與民俗當笑話',ok:true,fb:'你說明了能證明的部分，也保留了方法上的界線。'},
  {t:'只要把阿祿交出去，第一夜就不必再解釋',ok:false,fb:'這會留下最關鍵的矛盾。'}]}
];

var PHASE1_CORE=['door_marks','rain_line','torn_talisman','talisman_age','client_timeline','sound_difference','son_account','umbrella_mud','small_print','nail_mark','son_excluded','neighbor_version','source_elder','bell_time','route_window','timing_gap'];
var PHASE2_CORE=['incense_ledger','waxed_cord','wooden_toggle','pressure_note','elder_original','apprentice_phrase','heel_match','cord_trace','awning_bamboo','bamboo_abrasion','rain_recreation','apprentice_confession','owner_boundary'];

function fresh(){return{caseId:CASE_ID,name:profile().name,focus:MAX_FOCUS,stage:1,loc:'house',visited:{house:true},done:{},evidence:[],feedback:'',phase:'investigate',deduction:0,answers:[],finished:false,failed:false}}
function importOldEvidence(old,n){
 var known={low_scratches:'door_marks',rain_channel:'rain_line',torn_talisman:'torn_talisman',small_print:'small_print',son_account:'son_account',neighbor_version:'neighbor_version',timing_gap:'timing_gap'};
 var arr=Array.isArray(old&&old.evidence)?old.evidence:[];
 arr.forEach(function(id){var mapped=evidence[id]?id:known[id];if(mapped&&evidence[mapped]&&n.evidence.indexOf(mapped)<0)n.evidence.push(mapped)});
}
function migrateOld(){
 for(var i=0;i<OLD_SAVE_KEYS.length;i++){
  var old=parse(OLD_SAVE_KEYS[i]);if(!old)continue;
  var n=fresh();importOldEvidence(old,n);return n;
 }
 return null;
}
function normalize(v){
 if(!v||typeof v!=='object'||v.caseId!==CASE_ID)return null;
 var n=fresh(),validEvidence={},actionById={};
 Object.keys(evidence).forEach(function(id){validEvidence[id]=true});
 Object.keys(locations).forEach(function(locId){locations[locId].actions.forEach(function(a){actionById[a.id]=a})});
 n.name=typeof v.name==='string'&&v.name.trim()?v.name.trim():n.name;
 var f=Number(v.focus);n.focus=Number.isFinite(f)?Math.max(0,Math.min(MAX_FOCUS,Math.floor(f))):MAX_FOCUS;
 n.stage=v.stage===2?2:1;
 (Array.isArray(v.evidence)?v.evidence:[]).forEach(function(id){if(validEvidence[id]&&n.evidence.indexOf(id)<0)n.evidence.push(id)});
 function hasN(id){return n.evidence.indexOf(id)!==-1}
 n.done={};
 if(v.done&&typeof v.done==='object')Object.keys(v.done).forEach(function(id){var a=actionById[id];if(!a||!v.done[id])return;if(a.requires&&!a.requires.every(hasN))return;if(a.gain&&!hasN(a.gain))return;n.done[id]=true});
 n.visited={house:true};
 if(v.visited&&typeof v.visited==='object')Object.keys(v.visited).forEach(function(id){if(locations[id]&&v.visited[id])n.visited[id]=true});
 n.loc=typeof v.loc==='string'&&locationUnlockedFor(v.loc,n.stage,n.evidence)?v.loc:'house';n.visited[n.loc]=true;
 n.feedback=typeof v.feedback==='string'?v.feedback:'';
 n.phase=(v.phase==='interim'||v.phase==='final'||v.phase==='done'||v.phase==='failed')?v.phase:'investigate';
 n.deduction=Number.isFinite(Number(v.deduction))?Math.max(0,Math.floor(Number(v.deduction))):0;
 n.answers=Array.isArray(v.answers)?v.answers.slice():[];
 n.finished=!!v.finished;n.failed=!!v.failed;
 if(n.finished)n.phase='done';
 if(n.failed&&!n.finished)n.phase='failed';
 return n;
}
function locationUnlockedFor(id,stage,ev){
 var l=locations[id];if(!l||l.phase>stage)return false;
 return !l.lockedBy||l.lockedBy.every(function(x){return ev.indexOf(x)!==-1});
}
function load(){var v=parse(SAVE_KEY);if(!v)v=migrateOld();return normalize(v)||v}
function all(ids){return ids.every(has)}

function injectStyle(){
 if($('v2RainStyle'))return;
 var st=document.createElement('style');st.id='v2RainStyle';st.textContent='\
#v2Rain{padding-bottom:92px}.v2-head{padding:14px 15px;margin-bottom:12px}.v2-head h2{margin:0 0 5px;font-size:1rem}.v2-meta{font-size:.72rem;color:#9b988b;line-height:1.55}.v2-phase{display:inline-block;margin-top:8px;border:1px solid #4b4d42;border-radius:999px;padding:4px 8px;font-size:.66rem;color:#bbb6a7}.v2-dots{display:flex;gap:5px;margin-top:8px}.v2-dots i{width:10px;height:10px;border-radius:50%;background:#44473e}.v2-dots i.on{background:#c7b16f}.v2-scene{padding:0;overflow:hidden}.v2-art{width:100%;display:block;aspect-ratio:3/2;object-fit:cover;filter:saturate(.78) contrast(1.05)}.v2-scene-body{padding:17px}.v2-scene h2{margin:4px 0 10px}.v2-scene p{line-height:1.82}.v2-actions{display:grid;gap:9px;margin-top:12px}.v2-btn{border:1px solid #3d4036;background:#1b1d18;color:#ece8dc;border-radius:13px;padding:12px;text-align:left}.v2-btn strong{display:block}.v2-btn small{display:block;color:#969386;margin-top:4px;line-height:1.48}.v2-btn.done{opacity:.58}.v2-map{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.v2-map button{border:1px solid #3a3d33;background:#191b17;color:#ded9cb;border-radius:12px;padding:11px;text-align:left}.v2-map button.current{border-color:#9b8754;background:#292719}.v2-note{margin-top:12px;padding:11px 12px;border-left:3px solid #8d7853;background:#211e18;line-height:1.68;color:#c8c1b1}.v2-records{margin-top:16px}.v2-rec{padding:11px;border:1px solid #35382f;border-radius:11px;background:#171914;margin-top:8px}.v2-rec strong{display:block}.v2-rec small{display:block;margin-top:4px;color:#9c998d;line-height:1.58}.v2-deduction,.v2-end,.v2-fail{padding:18px}.v2-deduction h2,.v2-end h2,.v2-fail h2{line-height:1.45}.v2-option{display:block;width:100%;margin-top:9px;border:1px solid #41443a;background:#1b1e18;color:#eee9dc;border-radius:12px;padding:12px;text-align:left;line-height:1.58}.v2-end p,.v2-fail p{line-height:1.8}.v2-summary{display:grid;gap:9px;margin:14px 0}.v2-summary div{padding:11px;border:1px solid rgba(65,54,32,.22);border-radius:10px;line-height:1.6}.v2-warning{font-size:.78rem;color:#c99789;margin-top:10px}@media(min-width:640px){.v2-actions{grid-template-columns:1fr 1fr}.v2-map{grid-template-columns:repeat(3,1fr)}}';
 document.head.appendChild(st);
}
function mount(){if($('v2Rain'))return;injectStyle();var root=document.createElement('section');root.id='v2Rain';root.className='hidden';root.innerHTML='<div id="v2RainMain"></div>';document.querySelector('main.app').appendChild(root)}
function hideBase(){['startScreen','prologueScreen','gameScreen','completeScreen','failScreen','case2Screen'].forEach(function(id){var el=$(id);if(el)el.classList.add('hidden')})}
function showRoot(){mount();hideBase();$('v2Rain').classList.remove('hidden');$('caseChip').textContent='CASE 02・雨夜敲門';var build=document.querySelector('.build');if(build)build.textContent='BUILD 5.3・CASE 02'}
function focusDots(){var out='';for(var i=0;i<MAX_FOCUS;i++)out+='<i class="'+(i<s.focus?'on':'')+'"></i>';return out}

function render(){
 showRoot();var box=$('v2RainMain');
 if(s.finished||s.phase==='done'){renderEnding();return}
 if(s.failed||s.phase==='failed'){renderFailure();return}
 if(s.phase==='interim'){renderDeduction(interimDeductions,'第一階段推理');return}
 if(s.phase==='final'){renderDeduction(finalDeductions,'最終推理');return}
 var l=locations[s.loc];
 var html='<div class="v2-head card"><h2>'+esc(s.name)+'・私家偵探</h2><div class="v2-meta">案件二《雨夜敲門》｜物證、證詞、時間線與家學觀察必須互相對得上。</div><span class="v2-phase">'+(s.stage===1?'第一階段・林宅周邊':'第二階段・追查怪談來源')+'</span><div class="v2-dots">'+focusDots()+'</div></div>';
 html+='<article class="v2-scene card">'+(s.loc==='house'?'<img class="v2-art" src="'+ART+'" alt="雨夜中的林宅與臺北巷道">':'')+'<div class="v2-scene-body"><small>'+esc(l.sub)+'</small><h2>'+esc(l.name)+'</h2><p>'+esc(l.intro)+'</p><div class="v2-actions">';
 l.actions.forEach(function(a){if(!requirementsMet(a))return;var done=!!s.done[a.id];html+='<button class="v2-btn '+(done?'done':'')+'" data-action="'+esc(a.id)+'"><strong>'+esc(a.name)+'</strong><small>'+esc(done?'已調查｜可再次查看':a.desc)+'</small></button>'});
 html+='</div><div class="v2-note">'+esc(s.feedback||defaultHint())+'</div></div></article>';
 html+='<div class="v2-map">';Object.keys(locations).forEach(function(id){if(!locationUnlocked(id))return;html+='<button data-loc="'+id+'" class="'+(id===s.loc?'current':'')+'">'+esc(locations[id].name)+'</button>'});html+='</div>';
 html+='<section class="v2-records"><h3>案件筆記 '+s.evidence.length+'/'+Object.keys(evidence).length+'</h3>';s.evidence.slice().reverse().forEach(function(id){var e=evidence[id];html+='<div class="v2-rec"><strong>'+esc(e.name)+'｜'+esc(e.type)+'</strong><small>'+esc(e.desc)+'</small></div>'});html+='</section>';
 if(s.stage===1&&all(PHASE1_CORE))html+='<button id="v2Deduce" class="primary" type="button">整理第一階段推理</button>';
 if(s.stage===2&&all(PHASE2_CORE))html+='<button id="v2Deduce" class="primary" type="button">提出最終結論</button>';
 box.innerHTML=html;
 Array.prototype.forEach.call(box.querySelectorAll('[data-action]'),function(b){b.onclick=function(){doAction(this.getAttribute('data-action'))}});
 Array.prototype.forEach.call(box.querySelectorAll('[data-loc]'),function(b){b.onclick=function(){s.loc=this.getAttribute('data-loc');s.visited[s.loc]=true;s.feedback='';save();render()}});
 var d=$('v2Deduce');if(d)d.onclick=function(){s.phase=s.stage===1?'interim':'final';s.deduction=0;s.answers=[];s.feedback='';save();render()};
}
function defaultHint(){
 if(s.stage===1)return'先查現場，再談怪異。把三個雨夜拆開，新的資訊會開放新的地點。';
 return'第二階段不要只追「誰可疑」；要同時證明人、時間、方法，並解開第一夜。';
}
function doAction(id){
 var l=locations[s.loc],a=l.actions.filter(function(x){return x.id===id})[0];if(!a||!requirementsMet(a))return;
 s.done[id]=true;if(a.gain)addEvidence(a.gain);s.feedback=a.text;save();render();
}
function renderDeduction(set,label){
 var box=$('v2RainMain'),d=set[s.deduction];
 if(!d){completeDeduction();return}
 var html='<article class="v2-deduction card"><p class="eyebrow">'+esc(label)+' '+(s.deduction+1)+' / '+set.length+'</p><h2>'+esc(d.q)+'</h2><div class="v2-dots">'+focusDots()+'</div>';
 if(s.feedback)html+='<div class="v2-note">'+esc(s.feedback)+'</div>';
 html+='<div class="v2-warning">錯誤推論會消耗推理專注；專注歸零，本次結案判定失敗。</div>';
 d.opts.forEach(function(o,i){html+='<button class="v2-option" data-opt="'+i+'">'+esc(o.t)+'</button>'});html+='</article>';
 box.innerHTML=html;
 Array.prototype.forEach.call(box.querySelectorAll('[data-opt]'),function(b){b.onclick=function(){answer(Number(this.getAttribute('data-opt')),set)}});
}
function answer(i,set){
 var d=set[s.deduction],o=d&&d.opts[i];if(!o)return;
 if(o.ok){s.answers.push(i);s.feedback=o.fb;s.deduction+=1;save();render();return}
 s.focus=Math.max(0,s.focus-1);s.feedback='推理過度：'+o.fb;
 if(s.focus<=0){s.failed=true;s.phase='failed';save();render();return}
 save();renderDeduction(set,s.stage===1?'第一階段推理':'最終推理');
}
function completeDeduction(){
 if(s.phase==='interim'){
  s.stage=2;s.phase='investigate';s.loc='incense';s.visited.incense=true;s.focus=MAX_FOCUS;s.feedback='第一階段結論：至少第二、第三夜有人為介入；第一夜必須另找來源。追查許伯與香燭舖。';s.deduction=0;s.answers=[];save();render();return;
 }
 if(s.phase==='final'){s.finished=true;s.phase='done';s.feedback='';save();renderEnding()}
}
function renderFailure(){
 var box=$('v2RainMain');
 box.innerHTML='<article class="v2-fail card"><p class="eyebrow">CASE FAILED</p><h2>你把推測寫得比證據更快</h2><p>林宅的傳聞已經夠混亂。若調查者再把「可能」寫成「確定」，只會替下一個版本的怪談增加權威。</p><p class="note">你可以保留已取得的案件筆記，回到調查階段重新整理；不必從頭重跑所有場景。</p><button id="v2Recover" class="primary" type="button">保留筆記，重新整理</button><button id="v2Restart" class="secondary" type="button">重新調查本案</button></article>';
 $('v2Recover').onclick=function(){s.failed=false;s.phase='investigate';s.focus=2;s.deduction=0;s.answers=[];s.feedback='重新檢查證據邊界：哪些是看見的，哪些只是推測。';save();render()};
 $('v2Restart').onclick=function(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}s=fresh();save();render()};
}
function renderEnding(){
 var box=$('v2RainMain');
 box.innerHTML='<article class="v2-end card paper"><p class="eyebrow" style="color:#715c34">CASE CLOSED・雨夜敲門</p><h2>三個雨夜，兩種原因</h2><p>第一夜的悶響來自鬆動竹落水管在積水後敲擊側牆。它真的嚇到了林家，也給了後來的人一個可利用的故事。</p><p>第二、第三夜則是阿祿刻意製造。他把許伯原本普通的夜間提醒改成「三更三叩」，利用上蠟麻線與小木墜從後巷敲擊門框；第三夜阿信突然開門，看到的正是他撤離時的身影。</p><div class="v2-summary"><div><strong>關於怪談</strong><br>它不是純粹憑空捏造：舊有的夜間禁忌提供了外殼，但具體的「三叩」版本是在近期被加工，用來放大恐懼。</div><div><strong>關於蔡掌櫃</strong><br>他確實以欠款與空間問題向林家施壓，但現有證據不足以證明他指使阿祿假造鬧鬼。案件紀錄必須保留這條責任邊界。</div><div><strong>關於你的家學</strong><br>符式與民俗知識幫你辨識「什麼像傳統、什麼像後來拼裝」，但最後讓案件成立的仍是可重複的現象、物證、證詞與時間線。</div></div><p class="history-note"><strong>結案原則</strong><br>本案沒有證據需要引入鬼神作為解釋；這不等於對所有民俗或未知現象作總判決。能證明到哪裡，就寫到哪裡。</p><button id="v2Home" class="primary" type="button">回到標題</button><button id="v2Again" class="secondary" type="button">重新調查《雨夜敲門》</button></article>';
 $('v2Home').onclick=function(){location.reload()};
 $('v2Again').onclick=function(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}s=fresh();save();render()};
}
function start(reset){s=reset?fresh():(load()||fresh());save();render()}
function install(){
 mount();
 var n=$('nextCaseBtn');if(n){n.textContent='開始案件二：《雨夜敲門》';n.onclick=function(){start(false)}}
 var l=$('loadBtn');if(l)l.onclick=function(){start(false)}
}
install();
})();