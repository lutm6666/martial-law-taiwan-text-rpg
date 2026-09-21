(()=>{'use strict';
const CORE_KEY='mist-taiwan-rpg-save-v4';
const EXP_KEY='mist-taiwan-rpg-expansion-v1';
const META_KEY='mist-taiwan-rpg-narrative-state-v3';
const OLD_META='mist-taiwan-rpg-narrative-state-v2';

const ACTION={
'先從紙張與措辭判斷它像不像校內流傳的手抄信':'你把信紙挪到燈下，拇指壓住微微翹起的紙角。墨色深淺不一，幾個字的收筆也帶著匆忙；你翻到背面，又沿著折痕看了一遍。像是學生常用的紙，卻沒有哪個細節足以讓你說出寄信人的名字。你把信重新折好，收進口袋。既然紙本身給不了答案，阿川本人或許可以。',
'檢查它刻意缺少哪些正式書信欄位':'你把信攤平，從第一行看到末尾。沒有日期、沒有寄件地址，也沒有落款。你盯著空白處看了一會兒，才把紙重新摺起來。有人刻意少留下了幾樣東西，但那不代表你已經知道原因。你決定先去找美惠，問清楚阿川最近究竟去了哪裡。',
'把它當成一條未證實線索，先查阿川最近的公開行蹤':'你沒有急著替那句「別向別人提起」找解釋。你先記下時間與阿川的名字，從最容易確認的地方查起。幾個熟人都只知道零碎消息，最後仍把你指向美惠。',
'先想想阿川以前在學校最信任哪些人':'你沿著記憶把幾張熟悉的臉一一想過。最後停在美惠身上——若阿川真有事，她多半會知道一點。你把信收好，隔天去找她。',
'不急著判斷威脅，先確認阿川是否真的失聯':'你先去確認一件最基本的事：阿川究竟只是沒回家，還是真的沒人知道他在哪。問過兩個共同朋友後，你去找美惠，想把時間線補完整。',
'先閱讀剩餘筆記':'你把阿川剩下的紙一張張攤開。工資、剪報、課堂見聞和訪談片段混在一起，有些頁角還留著改過的日期。你讀得越久，越難把它們當成某種單一目的的文件；它們更像一個人笨拙地試著把生活留下來。',
'答應幫忙找回失頁':'你點了點頭，把三頁缺口的位置重新問了一遍。阿川原本緊繃的肩膀稍微放下來，隨即又把茶杯握緊。他能說出的只有最後幾個可能出現紙張的地方：茶行、印刷行，還有市場。',
'先和工友建立信任':'你沒有一上來就問秋月。機器聲從牆後一陣陣傳出來，你先和幾名工友聊夜班、請假和最近缺人的情況。話題繞了好一會兒，才有人壓低聲音說，秋月的父親病了，她這幾天都在家照顧。',
'直接去秋月留下的地址':'你照著抄下的地址走進巷子，門牌比你想像中更難找。敲門後，秋月只把門開了一條縫。她沒有先問阿川，也沒有先問那些紙，而是盯著你手上的地址問：「你怎麼知道我住這裡？」',
'請工友代為傳話，讓秋月決定是否願意見面':'你把姓名與來意寫在一小張紙上，請工友代為帶去，沒有要求他替你領路。過了一段時間，回話才送回來：秋月願意見你，但只談阿川留下的紀錄。等你走到門前時，她已經知道敲門的人是誰。',
'尊重她的條件，回去重新整理':'你沒有再追問。離開前，只把她說的那句「不要留我的名字」重新確認一次。回到印刷行，阿川把原稿、索引和抄本全搬到桌上；你們逐張找出能指回秋月身分的地方，連原本看起來無關緊要的住址與班別也重新檢查。',
'把她的條件一條條記下，讓她自己確認':'你把筆記本轉向秋月，讓她看著你寫。姓名、住址、家人、工作單位、今天新說的話——每一項都停下來問一次。她起初只搖頭或點頭，後來開始自己補充：「這個也不要寫。這句可以留，但不要說是哪一間廠。」',
'主動提出：沒有她同意，不把今天的談話寫進任何報導':'你先把相機袋往椅腳邊推遠一點，告訴她今天不是採訪。沒有她的同意，剛才到現在說過的話都不會變成新聞。秋月看了你一會兒，才把原本握得很緊的杯子放回桌面。',
'不催促她填滿沉默，只確認最必要的界線':'秋月幾次說到一半便停住。你沒有接著追問，只把必須確認的幾件事問完：名字能不能留、住址能不能留、家人的事要不要寫。屋裡安靜了很久，但那份安靜沒有被你硬填滿。',
'先問哪些家人完全不希望被提到':'你沒有從她的家庭繼續追故事，而是把紙上的親屬稱謂一一指出來。秋月用手指壓住其中兩處，說這些人和訪談沒有關係。你當著她的面把那幾行做了記號。',
'先核對誰曾經接觸過檔案':'你把桌上的紙先挪到一旁，找來空白紙張，從最早的日期開始寫人名。誰借過、誰搬過、誰只是幫忙整理；每寫下一個名字，就有人補上一段時間或一句「那天我其實沒碰到」。原本含糊的記憶慢慢排成了一條線。',
'先去找美惠，確認阿川今晚是否平安':'你披上外套先去找美惠。她剛聽見阿川的名字就站了起來。兩人先核對他最後一次傳話的時間，再分頭問幾個共同朋友；紙條暫時被你折回口袋，因為此刻你更想知道阿川人在哪裡。',
'分頭通知阿川、美惠與周老闆，到茶行碰面':'你沒有一次把消息撒出去，而是一個個確認。美惠回了話，周老闆也說會到；只有阿川那邊始終沒有消息。等茶行半扇門拉下來時，桌邊便自然空出了一個位置。',
'先找紙袋，不急著追究責任':'你們把櫃子裡的文件一疊疊搬出來，連桌腳邊的舊紙都翻過。沒有人先問「誰拿的」，只反覆確認紙袋最後放在哪裡。這讓幾個原本怕被懷疑的人也開始主動回想，自己前幾天究竟移動過什麼。',
'逐一確認最後看見紙袋的時間':'你在紙上劃出一條時間線，把每個人的記憶分開記。有人確定傍晚看見過，有人只記得旁邊的木箱被動過。最後留下的是一小段誰也說不清的空白，而不是一個可以直接指認的人。',
'不靠近，等阿川自己過來':'你停在柱子另一側，讓人流從面前一波波穿過。阿川沒有朝你這邊走。那名男子從牛皮紙袋裡抽出幾張紙，看了兩眼，折好收進自己的外套；紙袋仍留在阿川手上。直到對方離開，阿川才朝你走來。',
'走到能被他看見的位置，但不插話':'你往前走了幾步，停在阿川抬頭就能看見的位置。他果然注意到你，說到一半停了一瞬，卻沒有離開。陌生人走後，他沒有等你開口，便拿著紙袋朝你走來。',
'先觀察兩人是否真的在交換檔案':'你沒有盯著兩人的表情猜測，而只看他們手上的紙袋。陌生人抽走幾頁，沒有接過整只袋子；阿川也沒有把其餘資料交出去。這一幕很短，卻足以排除你一路上最擔心的那種情況。',
'先問阿川為何沒有把行程告訴任何人':'你沒有先問那個男人是誰。你盯著阿川手裡的紙袋，直接問他為什麼沒有告訴任何人自己會來車站。阿川張了張口，原本準備好的解釋像是一下子失去了作用。',
'繼續，但建立「失聯與異常狀況」的共同規則':'回到茶行後，你們沒有再用「下次記得說」收尾。美惠拿出紙筆，逐條寫下：臨時改行程要留話、帶走檔案要註記、無法赴約至少要讓一個人知道。阿川看著那張紙皺了很久的眉，最後還是把自己的名字簽在旁邊。',
'暫停所有新增訪談，只整理既有資料':'你把桌上那疊尚未聯絡的新名單收進抽屜。接下來幾天，沒有人再去約新的訪談；印刷行後間只剩翻紙、核對日期和重抄索引的聲音。事情忽然慢了下來，也因此有些原本被忙碌遮住的問題第一次露出來。',
'只拿出與學校委託直接相關的帳目':'你把學校委託的帳本從櫃裡抽出來，放在桌面中央，其他紙張仍留在後間。對方問哪一筆，你們便翻到哪一頁。整場談話始終停留在日期、紙張數量和費用上。',
'請對方明天白天再來，今晚不再翻資料':'周老闆把手從櫃門上收回來，說帳本已經收妥，請對方明天下午再來。對方看了眼快關上的門板，沒有堅持，只把時間記進本子裡便離開。腳步聲遠去後，屋裡幾個人才重新開始說話。',
'讓他親自確認自己的資料與同意範圍':'你把屬於那名青年的資料單獨抽出來，一頁頁攤在他面前。哪些人看過、哪些地方還留著、哪些細節能指回他本人，全都當面說清楚。最後拿筆做記號的人不是你，而是他自己。',
'依他的要求刪除全部可辨識資訊':'你們從名字開始，接著是工作單位、住處、家人，再到幾句單獨看似普通、合在一起卻可能讓熟人猜出身分的描述。青年坐在旁邊看完整個過程，直到最後一處被劃掉，才把一直捏在手裡的帽沿鬆開。',
'重新開始，但把「徵詢本人」放在蒐集之前':'重新開始後，第一張拿出來的不再是訪談問題，而是一張簡短說明。用途、保存方式、哪些人會接觸、日後能不能反悔——都先說清楚。有人因此選擇不談，有人只答幾題，但留下來的每一句話都比以前更有來處。',
'只完成現有檔案，不再新增內容':'你把還沒聯絡的人名從名單上劃掉，只留下已經答應要整理完的那一批。桌面上的工作沒有因此變輕，但至少不會再一邊收新的紙，一邊讓舊的紙繼續堆著。'
};

const ROLE_SCENE={
student:{'茶香裡的委託':'你下意識去看頁碼與紙張邊角。三頁缺口的位置比阿川說出口的「三頁」更具體，也更像一道可以慢慢補起來的空白。','三頁紙':'你很快認出幾個和剩餘筆記相同的記號，卻仍把三頁放回桌上重新核對，沒有只靠熟悉感下結論。'},
worker:{'筆記裡的名字':'牆後機器的節奏你並不陌生。工友談到夜班時省掉了很多解釋，因為你知道那些作息如何把一天切碎。','秋月的選擇':'秋月不用花力氣解釋少一天工錢意味著什麼。你聽得懂她在幾個數字之間停頓的原因。'},
clerk:{'油墨與廢紙':'你的視線先落到帳本、借物欄和日期。人會記錯，但紙上的欄位至少能讓錯誤被找出來。','門外的腳步':'你先看對方帶來的文件，再看帳本年份。問題的範圍一旦清楚，桌上其他東西就沒有被翻出來的必要。'},
reporter:{'油墨與廢紙':'周老闆知道你的職業後，說話明顯慢了半拍。你沒有催他，只在心裡把親眼看見的、他親口說的和你自己的猜測分開。','秋月的選擇':'你注意到她幾次看向你的相機袋。於是你先把袋子移到腳邊，讓談話從「會不會被報導」這個問題開始。'},
teacher:{'茶香裡的委託':'阿川念出幾句訪談時，你先想到的不是內容本身，而是這些話如果被截掉前後文，會變成什麼樣子。','秋月的選擇':'談到弟妹時，秋月的語氣變得很輕。你沒有順勢追問，只記得自己曾在教室裡見過類似的沉默。'},
merchant:{'一張包過花生的紙':'你先看紙怎麼流動：印刷行的廢紙、跑腿少年、攤販、舊書攤。這條路徑比任何人的神情都更容易留下痕跡。','秋月的選擇':'桌上幾張帳單疊得整整齊齊。你只瞥了一眼便把視線移開，已經足以知道這個家的壓力不是一句「手頭緊」能說完的。'},
veteran:{'月臺上的背影':'你強迫自己只記住看見的動作：紙袋在阿川手上、陌生人伸手、幾頁紙被抽出。其餘意義都等事情做完再說。','門外的腳步':'敲門聲響起時，你先看周老闆的反應，再看門外那人的站姿和手上文件；緊張可以被看見，但不能直接當成答案。'},
homemaker:{'一張包過花生的紙':'市場裡的消息永遠比人走得快。你沒有直問那名少年，而是先從誰替誰跑腿、誰今天沒來擺攤聊起。','秋月的選擇':'屋裡的藥袋、飯鍋和晾著的衣服比任何訪談都先說明了一件事：這裡有人正在努力把日子撐住。'}
};

function core(){try{return JSON.parse(localStorage.getItem(CORE_KEY)||'null')}catch(_){return null}}
function exp(){try{return JSON.parse(localStorage.getItem(EXP_KEY)||'null')}catch(_){return null}}
function baseMeta(){return{version:3,choices:[],flags:{},known:{},relations:{achuan:0,meihui:0,zhou:0,qiuyue:0,runner:0},pending:null,lastChoice:'',lastSource:''}}
function loadMeta(){try{const v=JSON.parse(localStorage.getItem(META_KEY)||'null');if(v)return{...baseMeta(),...v,flags:{...(v.flags||{})},known:{...(v.known||{})},relations:{...baseMeta().relations,...(v.relations||{})}};const old=JSON.parse(localStorage.getItem(OLD_META)||'null');if(old)return{...baseMeta(),...old,version:3,pending:null}}catch(_){ }return baseMeta()}
function saveMeta(m){try{localStorage.setItem(META_KEY,JSON.stringify(m))}catch(_){}}
function resetMeta(){try{localStorage.removeItem(META_KEY);localStorage.removeItem(OLD_META)}catch(_){}}
function mark(m,k,v=true){m.flags[k]=v}function know(m,k,v=true){m.known[k]=v}function bump(m,k,n){m.relations[k]=(m.relations[k]||0)+n}
const RULES=[[/美惠/,m=>bump(m,'meihui',1)],[/先閱讀剩餘筆記|頁碼、筆跡|日期與編號|確定的事.*猜測/,m=>know(m,'readNotes')],[/哪些人看過筆記|接觸順序|接觸鏈/,m=>mark(m,'contactChainEarly')],[/不會把他的話當成公開消息|不把他的緊張當成有罪|坦白只想確認/,m=>bump(m,'zhou',1)],[/餐券送給少年|幫著搬一小段貨|聊學校/,m=>bump(m,'runner',1)],[/普通存根|錯投存根|收下存根/,m=>know(m,'postalVerified')],[/三頁完整交還|匿名化後再保存|可信任的學者|比對書目、頁碼|三頁加上來源|老闆還有誰看過/,m=>know(m,'pagesFound')],[/匿名|去名|不得留真名|可辨識資料分開|家庭地址|親屬/,m=>mark(m,'privacyFirst')],[/先從工廠那條訪談線問起/,m=>know(m,'factoryFromIndex')],[/先和工友建立信任|工作經驗和工友|弟妹是否需要協助/,m=>mark(m,'factoryTrust')],[/請工友代為傳話|由熟人轉達|鄰里確認她家|等秋月同意/,m=>{mark(m,'qiuyueMediated');bump(m,'qiuyue',2)}],[/直接去秋月留下的地址/,m=>{mark(m,'qiuyueUnannounced');bump(m,'qiuyue',-1)}],[/尊重她的條件|條件一條條記下|沒有她同意|哪些家庭內容|不催促她|哪些家人/,m=>{mark(m,'qiuyueConsent');bump(m,'qiuyue',2)}],[/核對誰曾經接觸過檔案/,m=>mark(m,'winterAccessAudit')],[/通知阿川、美惠與周老闆|所有人叫到茶行/,m=>mark(m,'winterMeeting')],[/先找紙袋，不急著追究責任/,m=>mark(m,'envelopeNoBlame')],[/最後看見紙袋的時間/,m=>mark(m,'envelopeTimeline')],[/不靠近，等阿川自己過來/,m=>mark(m,'stationWaited')],[/走到能被他看見的位置/,m=>mark(m,'stationSignaled')],[/觀察兩人是否真的在交換檔案/,m=>mark(m,'stationObserved')],[/為何沒有把行程告訴/,m=>{mark(m,'challengedAchuan');bump(m,'achuan',-1)}],[/失聯與異常狀況.*共同規則/,m=>{mark(m,'teamProtocol');bump(m,'achuan',2)}],[/暫停所有新增訪談|暫停一段時間|暫停一週/,m=>mark(m,'archivePaused')],[/只拿出與學校委託|逐項確認對方要查的範圍/,m=>mark(m,'scopeDiscipline')],[/親自確認自己的資料與同意範圍|刪除全部可辨識資訊/,m=>mark(m,'intervieweeReview')]];
function applyRules(m,label){RULES.forEach(([re,fn])=>{if(re.test(label))fn(m)})}
function hydrate(m,c){if(!c)return m;const inv=c.inventory||[];if(inv.includes('archive_pages'))m.known.pagesFound=true;if(inv.includes('postal_stub'))m.known.postalVerified=true;if(inv.includes('print_receipt'))m.known.printReceipt=true;if(inv.includes('family_note'))m.known.qiuyueFamilyContext=true;if(!m.flags.rebuilt&&Array.isArray(c.log)){[...c.log].reverse().forEach(x=>{const mm=(x.text||'').match(/「(.+?)」/);if(mm)applyRules(m,mm[1])});m.flags.rebuilt=true}return m}
function recordChoice(label){const m=hydrate(loadMeta(),core()),source=document.getElementById('sceneTitle')?.textContent.trim()||'',chapter=document.getElementById('chapter')?.textContent.trim()||'',location=document.getElementById('location')?.textContent.trim()||'';m.lastChoice=label;m.lastSource=source;m.pending={label,source,time:Date.now()};m.choices.push({label,source,chapter,location,time:Date.now()});if(m.choices.length>160)m.choices=m.choices.slice(-160);applyRules(m,label);saveMeta(m)}
function role(c){return c?.bg||'student'}function hasPages(c,m){return!!(c?.inventory?.includes('archive_pages')||m.known.pagesFound)}function rel(m,k){return m.relations?.[k]||0}
function routeBridge(title,m,c){if(title==='筆記裡的名字'&&!hasPages(c,m))return'你不是從那三張失頁知道秋月，而是順著阿川剩餘索引上的工廠名稱和介紹人找到這裡。失頁仍然沒有下落，所以眼前能確認的只有她確實接受過訪談。';if(title==='秋月的選擇'&&m.flags.qiuyueMediated)return'工友已經先替你帶過話。門打開時，秋月沒有問你是誰，只先確認：「是為阿川那些紙來的？」';if(title==='秋月的選擇'&&m.flags.qiuyueUnannounced)return'你剛說出阿川的名字，秋月便先把話打斷。她仍在等你解釋，那張住址究竟是怎麼到你手上的。';if(title==='新的方法'&&m.flags.qiuyueConsent)return'秋月說過的幾句話一路跟著你回到印刷行。阿川把原本的索引攤開，你們先從她要求刪去的那些欄位開始改。';if(title==='等待比追逐更難'&&/美惠|時間點/.test(m.lastChoice||''))return'你把剛才核對出的時間寫在紙上，美惠坐到對面，一個個補上能聯絡的人。等最後一個人也沒有消息時，桌上的時間線已經比最初清楚許多。';if(title==='門外的腳步'&&/安全|紙袋|等他回來/.test(m.lastChoice||''))return'電話掛斷後，你們和阿川約在印刷行碰面。等紙袋的事說清楚，幾個人才一起回到後間；門外的敲門聲就是在這時響起的。';return''}
function memoryLines(title,m,c){const out=[];if(title==='三頁紙')out.push(m.known.readNotes?'你認得其中幾個頁碼與記號。先前讀過的剩餘筆記在這時派上用場，紙張的來源很快被一處處對上。':'你只認得阿川描述過的紙張與折痕，於是把三頁先收好，準備帶回去和剩餘筆記逐一核對。');if(title==='秋月的選擇'){if(m.flags.factoryTrust)out.push('工友曾提過你沒有一來就追問她的事。秋月說這句話時沒有笑，但語氣比開門時鬆了一些。');if(rel(m,'qiuyue')<0)out.push('她的目光幾次落在你抄下的地址上。你知道，今天能不能繼續談，首先取決於你怎麼處理這件事。')}if(title==='新的方法'&&m.flags.qiuyueConsent)out.push('紙上第一個被重新檢查的名字是秋月。她的要求讓「受訪者可以決定是否留名」不再只是一句原則。');if(title==='窗縫裡的紙條'){if(m.flags.privacyFirst||m.flags.qiuyueConsent)out.push('你想起秋月問過的那些問題：誰看過、放在哪裡、名字是不是還留著。眼前這張沒有署名的紙條，也許同樣來自一個不知道自己資料去了哪裡的人。');if(m.flags.contactChainEarly)out.push('你曾經為三頁失頁列過一次經手順序。這次沒有人提醒，你已經自己伸手去拿空白紙了。')}if(title==='名單比記憶可靠'&&m.flags.contactChainEarly)out.push('同樣的名單你以前列過一次。你知道名字被寫上去，只代表某人曾經接觸過資料，還遠遠不是指控。');if(title==='沒有發生的那件事'){if(m.flags.stationWaited)out.push('你剛才一直站在原地，所以不需要阿川重述那段過程；你親眼看見紙袋始終留在他手上。');if(m.flags.stationObserved)out.push('你只盯著紙袋，反而看得最清楚：被拿走的是幾張紙，不是整份檔案。');if(m.flags.stationSignaled)out.push('阿川早就看見你在等。陌生人一離開，他便直接朝你走來。')}if(title==='信任不是沉默'&&m.flags.qiuyueConsent)out.push('幾天前，你們才答應秋月要說清楚誰能碰她的資料。現在阿川卻用沉默替大家做決定，這個矛盾很難讓你忽略。');if(title==='暫停之後'&&m.flags.archivePaused)out.push('抽屜裡那張沒有再往下新增的訪談名單還在。停筆這段時間，桌上多出的反而是一疊整理得更清楚的來源與同意紀錄。');if(title==='寫紙條的人'&&(m.flags.qiuyueConsent||m.flags.privacyFirst))out.push('青年說到「我不知道誰看過」時，你幾乎立刻想起秋月。兩個人用完全不同的方式，問的卻是同一件事。');return out}
function patchCoreText(title,m,c){const box=document.getElementById('sceneText');if(!box)return;const ps=[...box.children].filter(n=>n.tagName==='P'&&!n.classList.contains('choice-result')&&!n.classList.contains('identity-text'));if(title==='筆記裡的名字'&&!hasPages(c,m)&&ps[0])ps[0].textContent='阿川剩餘的訪談索引提到一名女工「秋月」，並留下工廠班別與介紹人的線索。你循著這些仍在手邊的資料來到工廠附近，卻發現她已數日沒有上班。';if(title==='秋月的選擇'&&m.flags.qiuyueMediated&&ps[0])ps[0].textContent='秋月已從工友那裡知道你的來意。你進門後先把阿川的筆記放在桌上，沒有立即翻開，只等她先開口。';if(title==='秋月的選擇'&&m.flags.qiuyueUnannounced&&ps[0])ps[0].textContent='秋月沒有預期你會出現在門口。她先問你如何取得住址，等你把來龍去脈說清楚後，才讓你進屋談阿川的筆記。'}
function relabelChoices(title,m,c){document.querySelectorAll('#choices .choice-btn strong').forEach(s=>{const t=s.textContent.trim();if(title==='筆記裡的名字'&&!hasPages(c,m)&&t==='直接去秋月留下的地址')s.textContent='請工友代為轉達，等秋月同意後再見面';if(title==='沒有人只活在一條線裡'&&t==='去秋月家，先徵詢她本人'&&c?.bg!=='worker')s.textContent='請工友先轉達來意，若秋月願意再登門';if(title==='窗縫裡的紙條'&&t==='把所有人叫到茶行一起商量')s.textContent='分頭通知阿川、美惠與周老闆，到茶行碰面'})}
function rewriteIdentity(title,c){const p=document.querySelector('#sceneText .identity-text');if(!p)return;const text=ROLE_SCENE[role(c)]?.[title];if(text){p.textContent=text;p.classList.add('immersive-role-text');p.style.display=''}else p.style.display='none'}
function addPara(text,prepend=false,cls='immersive-extra'){if(!text)return;const box=document.getElementById('sceneText');if(!box)return;const p=document.createElement('p');p.className=cls;p.textContent=text;prepend?box.prepend(p):box.appendChild(p)}
function actionResult(m,title){const p=m.pending;if(!p||!p.label||p.source===title||Date.now()-p.time>30000)return'';return ACTION[p.label]||''}
let lastSignature='';function applyScene(){const c=core(),m=hydrate(loadMeta(),c),title=document.getElementById('sceneTitle')?.textContent.trim()||'';if(!title)return;saveMeta(m);patchCoreText(title,m,c);relabelChoices(title,m,c);rewriteIdentity(title,c);const box=document.getElementById('sceneText');if(!box)return;const signature=[title,m.lastChoice,(exp()||{}).node||'',c?.scene||''].join('|');if(signature===lastSignature&&box.querySelector('.immersive-marker'))return;box.querySelectorAll('.immersive-action,.immersive-bridge,.immersive-memory,.immersive-marker').forEach(n=>n.remove());const action=actionResult(m,title);if(action){addPara(action,true,'immersive-action');m.pending=null;saveMeta(m)}const bridge=routeBridge(title,m,c);addPara(bridge,true,'immersive-bridge');memoryLines(title,m,c).slice(0,2).forEach(t=>addPara(t,false,'immersive-memory'));const marker=document.createElement('span');marker.className='immersive-marker';marker.hidden=true;box.appendChild(marker);lastSignature=signature}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyScene()})}
const style=document.createElement('style');style.textContent='#sceneText .identity-text,#sceneText .immersive-role-text{margin:1em 0!important;padding:0!important;border:0!important;background:none!important;color:inherit!important;font:inherit!important;line-height:1.8!important}#sceneText .immersive-action,#sceneText .immersive-bridge,#sceneText .immersive-memory{margin:0 0 1em!important;padding:0!important;border:0!important;background:none!important;color:inherit!important;font:inherit!important;line-height:1.8!important}';document.head.appendChild(style);
window.addEventListener('DOMContentLoaded',()=>{const choices=document.getElementById('choices');choices?.addEventListener('click',e=>{const b=e.target.closest('.choice-btn');if(!b||b.disabled)return;const label=b.querySelector('strong')?.textContent.trim();if(label)recordChoice(label)},true);document.getElementById('startBtn')?.addEventListener('click',()=>{resetMeta();saveMeta(baseMeta())},true);['restartBtn','menuRestart','againBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(()=>{if(!document.getElementById('startScreen')?.classList.contains('hidden'))resetMeta()},0)));const title=document.getElementById('sceneTitle');if(title)new MutationObserver(schedule).observe(title,{childList:true,characterData:true,subtree:true});window.addEventListener('pageshow',schedule);schedule()});
window.MistNarrativeState={get:()=>hydrate(loadMeta(),core())};
})();