(()=>{'use strict';
const META_KEY='mist-taiwan-rpg-narrative-state-v1';
const CORE_KEY='mist-taiwan-rpg-save-v4';
const EXP_KEY='mist-taiwan-rpg-expansion-v1';

const CANON=Object.freeze({
  achuanPurpose:'阿川整理的是工廠勞動、校園生活與普通人的訪談紀錄；核心風險是內容脫離脈絡與可辨識資訊外流。',
  pages:'三頁筆記確實曾混入印刷行廢紙，最後在舊書攤被找回；若玩家尚未走到書攤，就不能預先知道這件事。',
  postal:'市場出現的郵務人員有可核對的錯投郵件理由；這條線不能被當成追查阿川的證據。',
  qiuyue:'秋月因父親生病暫時缺勤；她要求不保留真名，其他內容是否留存由她自己決定。',
  archive:'資料保存的固定原則是來源、同意、可辨識資訊與查證紀錄分開處理。',
  winterNote:'1958年12月印刷行收到匿名紙條，寫紙條的人是曾受訪的青年；答案揭曉前玩家只能把它視為未知來源。',
  envelope:'冬季篇的牛皮紙袋由阿川本人帶走，內有誤混的他人投稿；在車站確認前不能斷言遭竊。',
  schoolVisit:'印刷行晚間來訪的學校職員只核對校方印刷舊帳，並未詢問阿川或要求查看後間。'
});

const roleLabel={student:'學生',worker:'工人',clerk:'公務員',reporter:'記者',teacher:'教師',merchant:'商人',veteran:'退伍軍人',homemaker:'持家者'};
const baseMeta=()=>({
  version:1,
  choices:[],
  flags:{},
  known:{},
  relations:{achuan:0,meihui:0,zhou:0,qiuyue:0,runner:0},
  lastChoice:'',
  lastSource:'',
  lastChapter:'',
  lastLocation:'',
  startedAt:Date.now()
});

function core(){try{return JSON.parse(localStorage.getItem(CORE_KEY)||'null')}catch(_){return null}}
function exp(){try{return JSON.parse(localStorage.getItem(EXP_KEY)||'null')}catch(_){return null}}
function loadMeta(){try{return {...baseMeta(),...(JSON.parse(localStorage.getItem(META_KEY)||'null')||{})}}catch(_){return baseMeta()}}
function saveMeta(m){try{localStorage.setItem(META_KEY,JSON.stringify(m))}catch(_){}}
function resetMeta(){try{localStorage.removeItem(META_KEY)}catch(_){}}
function bump(m,k,n){m.relations=m.relations||{};m.relations[k]=(m.relations[k]||0)+n}
function mark(m,group,key,value=true){m[group]=m[group]||{};m[group][key]=value}

const rules=[
  [/先向共同朋友美惠打聽|最後一次出現的時間|街坊口中確認/,m=>{mark(m,'flags','consultedMeihui');bump(m,'meihui',1)}],
  [/追問印刷行的位置/,m=>{mark(m,'known','printShopFromMeihui');bump(m,'meihui',-1)}],
  [/處理掉信，當作沒有看見/,m=>mark(m,'flags','initiallyIgnored')],
  [/收下火柴盒|可信任的長輩/,m=>mark(m,'known','matchboxRoute')],
  [/答應幫忙找回失頁|協助找回失頁/,m=>{mark(m,'flags','committedToSearch');bump(m,'achuan',1)}],
  [/先閱讀剩餘筆記|頁碼、筆跡|補上日期與編號|確定的事.*阿川猜測/,m=>mark(m,'known','readNotes')],
  [/受訪者.*同意|來源保護|家庭地址|親屬姓名/,m=>mark(m,'flags','privacyConcernEarly')],
  [/哪些人看過筆記|接觸順序|接觸鏈/,m=>mark(m,'flags','contactChainEarly')],
  [/坦白只想確認阿川與失頁|不把他的緊張當成有罪|學校印刷需求|紙價與最近的生意/,m=>bump(m,'zhou',1)],
  [/採訪經驗分辨周老闆/,m=>bump(m,'zhou',-1)],
  [/不會把他的話當成公開消息/,m=>{bump(m,'zhou',2);mark(m,'flags','protectedZhouSource')}],
  [/把餐券送給少年|幫著搬一小段貨|聊學校，再問昨天的事/,m=>bump(m,'runner',1)],
  [/普通存根|錯投存根|收下存根/,m=>mark(m,'known','postalVerified')],
  [/三頁完整交還|匿名化後再保存|可信任的學者協助判斷|比對書目、頁碼|三頁加上來源|老闆還有誰看過|紙的價值.*內容的風險|家庭地址與親屬稱謂/,m=>mark(m,'known','pagesFound')],
  [/匿名|去名|可辨識資料分開|家庭地址、親屬|不得留真名/,m=>mark(m,'flags','redactionPriority')],
  [/採用匿名封存方案|完整.*封存|完成第一批封存/,m=>mark(m,'flags','sealedArchive')],
  [/先從工廠那條訪談線問起/,m=>mark(m,'known','factoryFromIndex')],
  [/先和工友建立信任|工作經驗和工友聊起輪班|弟妹是否需要協助/,m=>mark(m,'flags','factoryTrust')],
  [/請工友代為傳話|由熟人轉達|鄰里確認她家目前是否適合|等秋月同意後再見面/,m=>{mark(m,'flags','qiuyueMediated');bump(m,'qiuyue',1)}],
  [/直接去秋月留下的地址/,m=>{mark(m,'flags','qiuyueUnannounced');bump(m,'qiuyue',-1)}],
  [/尊重她的條件|條件一條條記下|不得留真名|沒有她同意|哪些家庭內容完全不要記|不催促她|哪些家人完全不希望/,m=>{mark(m,'flags','qiuyueConsentRecorded');bump(m,'qiuyue',2)}],
  [/核對誰曾經接觸過檔案/,m=>mark(m,'flags','winterAccessAudit')],
  [/分頭通知阿川、美惠與周老闆|所有人叫到茶行/,m=>mark(m,'flags','winterCalledMeeting')],
  [/先去找美惠，確認阿川今晚是否平安/,m=>{mark(m,'flags','winterCheckedAchuan');bump(m,'meihui',1)}],
  [/先找紙袋，不急著追究責任/,m=>mark(m,'flags','envelopeNoBlame')],
  [/逐一確認最後看見紙袋的時間/,m=>mark(m,'flags','envelopeTimeline')],
  [/不靠近，等阿川自己過來/,m=>mark(m,'flags','stationWaited')],
  [/走到能被他看見的位置/,m=>mark(m,'flags','stationSignaled')],
  [/觀察兩人是否真的在交換檔案/,m=>mark(m,'flags','stationObserved')],
  [/先問阿川為何沒有把行程告訴任何人/,m=>{mark(m,'flags','challengedAchuan');bump(m,'achuan',-1)}],
  [/失聯與異常狀況.*共同規則/,m=>{mark(m,'flags','teamProtocol');bump(m,'achuan',2)}],
  [/不再接受被排除/,m=>{mark(m,'flags','hardBoundary');bump(m,'achuan',-1)}],
  [/暫停所有新增訪談|暫停一段時間|暫停一週/,m=>mark(m,'flags','archivePaused')],
  [/只拿出與學校委託直接相關的帳目|逐項確認對方要查的範圍/,m=>mark(m,'flags','scopeDiscipline')],
  [/親自確認自己的資料與同意範圍|刪除全部可辨識資訊|重新檢查所有受訪者資料/,m=>mark(m,'flags','intervieweeReview')]
];

function applyRule(m,label){rules.forEach(([re,fn])=>{if(re.test(label))fn(m)})}

function hydrate(m,c){
  if(!c)return m;
  const inv=c.inventory||[];
  if(inv.includes('archive_pages'))m.known.pagesFound=true;
  if(inv.includes('postal_stub'))m.known.postalVerified=true;
  if(inv.includes('print_receipt'))m.known.printReceipt=true;
  if(inv.includes('family_note'))m.known.qiuyueFamilyContext=true;
  if(!m.flags._rebuiltCoreLog&&Array.isArray(c.log)){
    [...c.log].reverse().forEach(x=>{const mm=(x.text||'').match(/「(.+?)」/);if(mm)applyRule(m,mm[1])});
    m.flags._rebuiltCoreLog=true;
  }
  return m;
}

function record(label){
  const m=hydrate(loadMeta(),core());
  const title=document.getElementById('sceneTitle')?.textContent.trim()||'';
  const chapter=document.getElementById('chapter')?.textContent.trim()||'';
  const location=document.getElementById('location')?.textContent.trim()||'';
  m.lastChoice=label;m.lastSource=title;m.lastChapter=chapter;m.lastLocation=location;
  m.choices.push({label,source:title,chapter,location,time:Date.now()});
  if(m.choices.length>120)m.choices=m.choices.slice(-120);
  applyRule(m,label);saveMeta(m);
}

function hasPages(c,m){return !!(c?.inventory?.includes('archive_pages')||m.known.pagesFound)}
function lastIncludes(m,s){return (m.lastChoice||'').includes(s)}
function relation(m,k){return m.relations?.[k]||0}
function role(c){return c?.bg||Object.keys(roleLabel).find(k=>roleLabel[k]===document.getElementById('playerBg')?.textContent.trim())||'student'}

function contextLines(title,m,c){
  const out=[],r=role(c),pages=hasPages(c,m);
  if(title==='油墨與廢紙'&&m.flags.initiallyIgnored){out.push('你追到印刷行前，美惠又託人帶來消息：阿川已經回到住處。前兩天他臨時借宿朋友家，沒有先告知家人。你這才把「阿川沒回家」與「三頁紙不見」拆成兩件不同的事。')}
  if(title==='油墨與廢紙'&&m.known.printShopFromMeihui){out.push('你是循美惠提供的位置而來，因此知道「阿川最近常來」只是她的說法；眼前這間店與周老闆的反應，才是你第一次能直接核對的現場。')}
  if(title==='一張包過花生的紙'){
    if(relation(m,'zhou')>0)out.push('周老闆願意把廢紙批次與少年平常的跑腿路線說得更清楚；你在印刷行沒有把他的停頓直接當成有罪，現在換來的是比較完整的上下文。');
    if(relation(m,'runner')>0)out.push('少年記得你先把他當成一個正在做工的人，而不是只把他當線索來源。他回答時少了些防備，也更願意承認自己記不清的部分。');
  }
  if(title==='三頁紙'){
    if(m.known.readNotes)out.push('因為你先前讀過阿川剩下的筆記，頁碼、筆跡與引用方式都能交叉比對；你知道眼前三頁確實屬於同一批資料，而不是只因為「看起來很像」就下結論。');
    else out.push('你沒有讀過阿川全部剩餘筆記，因此只能先用他描述過的紙張、頁碼與書攤老闆的經手過程確認來源；內容本身仍要回去再核對。');
  }
  if(title==='保存也是責任'){
    if(pages)out.push('三頁已經在你手上，教授現在談的是眼前真實存在的資料：哪些細節能指回受訪者、哪些需要保留脈絡，以及哪些資訊其實沒有保存的必要。');
    else out.push('你手上還沒有那三頁。這次拜訪談的是「如果找回或繼續保存，應遵守哪些規則」，而不是讓教授對尚未看見的內容下判斷。');
    if(m.flags.privacyConcernEarly)out.push('你很早就追問過受訪者是否知道資料會被保存，因此這場談話不是突然轉向倫理問題，而是把你一路未解的疑問整理成可以實際遵守的規則。');
  }
  if(title==='筆記裡的名字'){
    if(!pages&&m.known.factoryFromIndex)out.push('你並沒有先看見失頁內容。這條工廠線來自阿川剩餘的訪談索引與他記得的介紹人；你目前知道的是「秋月曾受訪」與工作地點，還不知道遺失三頁最後寫了什麼。');
    if(pages)out.push('這一次你能把秋月的名字、班別與找回的三頁互相比對；但紙上留下的資訊越完整，你越清楚「能找到她」和「有權直接打擾她」不是同一件事。');
  }
  if(title==='秋月的選擇'){
    if(m.flags.qiuyueMediated)out.push('工友已經先替你轉達來意，秋月知道你會來。她的戒備仍在，但至少這不是一次突然出現在門口的拜訪；她也知道自己可以拒絕談下去。');
    else if(m.flags.qiuyueUnannounced)out.push('你是照著手邊線索直接找來的。秋月開門後第一個問題不是阿川，而是「你怎麼知道這裡？」你必須先把地址來源與來意說清楚，談話才有可能繼續。');
    else if(m.flags.factoryTrust)out.push('工友先前已經把你的來意說得較清楚。秋月仍然沒有立刻相信你，但她至少知道你不是來追問缺勤理由，而是來處理那份留下她話語的紀錄。');
    if(r==='reporter')out.push('你的記者身分讓她特別確認了一次：今天說的話是不是會變成報導。你必須把「訪談檔案」與「新聞採訪」的界線說得非常明白。');
  }
  if(title==='新的方法'){
    if(m.flags.qiuyueConsentRecorded)out.push('桌上的規則不再只是教授或阿川提出的原則，其中一部分直接來自秋月親自劃下的界線。這讓「同意」第一次從抽象概念變成你們真正遇過的具體決定。');
    if(m.flags.redactionPriority)out.push('你一路更傾向把姓名、住址與事件內容分開，因此新的整理方式對你而言不是重新開始，而是把先前零散做過的決定正式化。');
    if(m.flags.sealedArchive)out.push('先前封存資料的經驗也留下教訓：把箱子關起來只能阻止立即散失，卻不能回答「誰可以再打開」與「受訪者是否同意」這些問題。');
  }
  if(title==='窗縫裡的紙條'){
    if(m.flags.qiuyueConsentRecorded||m.flags.privacyConcernEarly)out.push('你第一個想到的不是「誰在監視」，而是受訪者是否曾被清楚告知資料會由哪些人接觸。秋月的經驗讓你知道，害怕有時來自資訊不透明，而不一定來自外部追查。');
    if(m.flags.contactChainEarly)out.push('你曾經替阿川整理過「誰看過筆記」的接觸順序。當時只是查失頁，現在同一種做法突然成為保護整批檔案的基本功。');
  }
  if(title==='名單比記憶可靠'&&m.flags.contactChainEarly){out.push('這不是你第一次列接觸鏈。早先查三頁失頁時，你就知道「某人可能看過」必須拆成時間、地點與經手順序；因此你沒有讓這份名單立刻變成嫌疑人名單。')}
  if(title==='一桌沒有說完的話'){
    if(m.flags.winterCalledMeeting)out.push('你分頭通知了美惠、周老闆與阿川。前兩人都回覆會到，只有阿川一直沒有消息，所以桌上那個空位不是你們故意把他排除在外。');
    if(relation(m,'achuan')>=2)out.push('你和阿川已經共同處理過不少難題，他這次毫無說明地缺席，才會讓你比平常更在意；信任越多，異常反而越顯眼。');
  }
  if(title==='阿川沒有赴約'&&m.flags.initiallyIgnored){out.push('幾個月前你也曾因「阿川沒有回家」把事情想得很重，後來才知道失聯本身不能證明原因。這一次，你特別提醒自己不要讓相似的情境自動得到相同答案。')}
  if(title==='不在原位的牛皮袋'){
    if(m.flags.envelopeNoBlame)out.push('你先把「不在原位」記成一個事實，而沒有把它改寫成「被偷走」。這個用詞差異讓大家還能繼續回想正常搬動與借用的可能。');
    if(m.flags.envelopeTimeline)out.push('你把最後看見紙袋的人與時間排成順序，發現真正的空白只有短短一段；這縮小了範圍，卻仍沒有資格替那段空白填上犯人。');
  }
  if(title==='等待比追逐更難'){
    if(lastIncludes(m,'先把這條紀錄告訴美惠'))out.push('你和美惠先把收據背面的時間核對完，才開始逐一聯絡可能知道阿川行程的人。這些電話與傳話沒有立刻給答案，卻讓「他最後在哪裡」慢慢有了較可靠的時間線。');
    else if(lastIncludes(m,'留下來整理所有可核對的時間點'))out.push('你沒有直接追去車站，而是留下來把信封、紙條、班次與每個人的說法分開。美惠隨後加入，你們才開始聯絡其他人補上空白。');
    else if(m.flags.winterCheckedAchuan)out.push('你原本就是為了確認阿川是否平安才來找美惠，因此這段等待不是臨時決定；你們只是把「先找到人」放在「先找紙」前面。');
  }
  if(title==='月臺上的背影'){
    if(relation(m,'achuan')>=2)out.push('你知道阿川有時會用沉默替別人做決定，但也知道他過去願意在被追問後把事情說清楚。眼前那個搖頭動作因此既像警告，也像他一貫不擅長解釋的習慣。');
    if(c?.suspicion>=5)out.push('一路累積的疑心讓你的第一個直覺偏向最壞解釋；你清楚這一點，所以刻意把「看見紙袋」和「看見資料被交出去」分成兩件事。');
  }
  if(title==='沒有發生的那件事'){
    if(m.flags.stationWaited)out.push('你沒有靠近，所以完整看見中年男子只抽走自己的稿紙。這個結果不是阿川事後告訴你的版本，而是你親眼確認的過程。');
    else if(m.flags.stationObserved)out.push('你原本就決定只觀察「是否真的交換檔案」，因此當男子只拿走幾頁自己的稿紙時，你能明確排除整只紙袋被交出去的猜測。');
    else if(m.flags.stationSignaled)out.push('你站在阿川能看見的位置，沒有插進談話。阿川知道你在等，結束後沒有離開，而是直接走過來解釋。');
  }
  if(title==='信任不是沉默'){
    if(m.flags.protectedZhouSource||m.flags.qiuyueConsentRecorded)out.push('你一路都要求別人說清楚資訊會被怎麼使用，因此阿川用「保護」作為不解釋的理由，反而顯得特別矛盾。保護別人不能自動等於替所有人決定什麼都不必知道。');
    if(relation(m,'achuan')>=2)out.push('正因為你和阿川累積過信任，這次爭執才不是單純懷疑他，而是要求這份信任必須包含必要的說明。');
  }
  if(title==='門外的腳步'){
    if(m.flags.scopeDiscipline||m.known.printReceipt)out.push('你曾經靠帳目與收據把模糊記憶變成可核對的事，因此這次也先把「學校舊帳」與「訪談檔案」切成兩個範圍，不因同在一間印刷行就混在一起。');
    if(r==='clerk')out.push('你熟悉公務與帳務往來，第一個問題不是對方「可不可疑」，而是他代表誰、要核對哪個年度、哪幾筆委託。範圍越清楚，越不需要把其他資料搬上桌。');
  }
  if(title==='暫停之後'&&m.flags.archivePaused){out.push('這次暫停是你們主動做出的決定，不是因為某個單一事件被證明危險。停筆期間留下的最大成果，反而是把過去那些「大家應該都知道」的默契改成明確規則。')}
  if(title==='寫紙條的人'){
    if(m.flags.qiuyueConsentRecorded||m.flags.privacyConcernEarly)out.push('答案讓你想起秋月：一個人不必反對自己的故事被保存，也仍然有理由害怕「不知道誰正在看」。紙條揭露的正是同一個問題——同意必須包含資料如何流動。');
    if(m.flags.contactChainEarly||m.flags.winterAccessAudit)out.push('你們後來能回答他的問題，並不是因為猜中紙條作者，而是因為已開始留下接觸紀錄。這讓「誰看過」第一次有了可以核對的答案。');
  }
  if(title==='不是答案，而是方法'){
    const tendencies=[];
    if(m.flags.privacyConcernEarly||m.flags.qiuyueConsentRecorded||m.flags.intervieweeReview)tendencies.push('把受訪者的界線放在保存之前');
    if(m.flags.contactChainEarly||m.flags.winterAccessAudit||m.flags.scopeDiscipline)tendencies.push('把可核對的流程放在猜測之前');
    if(relation(m,'meihui')>0||relation(m,'zhou')>0||m.flags.factoryTrust)tendencies.push('先累積信任，再要求別人提供資訊');
    if(m.flags.archivePaused)tendencies.push('知道什麼時候應該停下來');
    if(tendencies.length)out.push(`回頭看，你真正留下的不是一條完美路線，而是一組逐漸成形的習慣：${tendencies.slice(0,3).join('、')}。同一套規則，正是從你一路做過的選擇長出來的。`);
  }
  return out;
}

function routeBridge(title,m,c){
  if(title==='筆記裡的名字'&&!hasPages(c,m)&&m.known.factoryFromIndex){return '你是循阿川剩餘索引上的工廠名稱與介紹人來到這裡；失頁仍未找回，所以你現在只能從工友口中確認秋月是否仍在職，以及她是否願意被聯絡。'}
  if(title==='秋月的選擇'&&m.flags.qiuyueMediated){return '工友先替你傳了話。隔了一段時間，秋月才同意讓你過來短談；你沒有把「知道住址」當成直接登門的許可。'}
  if(title==='秋月的選擇'&&m.flags.qiuyueUnannounced){return '你直接循地址找到住處。秋月沒有預期你會出現，因此在談筆記前，你先花了一段時間解釋自己從哪裡取得這個地址。'}
  if(title==='等待比追逐更難'&&lastIncludes(m,'先把這條紀錄告訴美惠')){return '你先把收據背面的時間帶回茶行給美惠看。你們確認彼此理解一致後，才開始聯絡其他可能知道阿川行程的人。'}
  if(title==='門外的腳步'&&(lastIncludes(m,'只問他現在是否安全')||lastIncludes(m,'追問紙袋在哪裡')||lastIncludes(m,'等他回來再談'))){return '電話後，你們和阿川約定在印刷行碰面。等他回來把紙袋的事說清楚，大家才一起回到整理資料的地方。'}
  if(title==='一桌沒有說完的話'&&m.flags.winterCalledMeeting){return '你分頭傳了話。美惠與周老闆先後到了茶行；阿川沒有回覆，也沒有在約定時間出現。'}
  return '';
}

function relabelChoices(title,m,c){
  const btns=[...document.querySelectorAll('#choices .choice-btn')];
  if(title==='筆記裡的名字'&&!hasPages(c,m)){
    btns.forEach(b=>{const s=b.querySelector('strong');if(s?.textContent.trim()==='直接去秋月留下的地址'){s.textContent='請工友代為轉達，等秋月同意後再見面';b.dataset.continuityRelabel='qiuyue-mediated'}});
  }
  if(title==='窗縫裡的紙條'){
    btns.forEach(b=>{const s=b.querySelector('strong');if(s?.textContent.trim()==='把所有人叫到茶行一起商量')s.textContent='分頭通知阿川、美惠與周老闆，到茶行碰面'});
  }
  if(title==='沒有人只活在一條線裡'){
    btns.forEach(b=>{const s=b.querySelector('strong');if(s?.textContent.trim()==='去秋月家，先徵詢她本人'&&c?.bg!=='worker')s.textContent='請工友先轉達來意，若秋月願意再登門'});
  }
}

function inject(title,m,c){
  const box=document.getElementById('sceneText');if(!box)return;
  box.querySelectorAll('.memory-context,.continuity-bridge').forEach(n=>n.remove());
  const bridge=routeBridge(title,m,c);
  if(bridge){const p=document.createElement('div');p.className='continuity-bridge';p.textContent=bridge;box.prepend(p)}
  const lines=contextLines(title,m,c);
  if(lines.length){
    const wrap=document.createElement('div');wrap.className='memory-context';
    const head=document.createElement('div');head.className='memory-context-head';head.textContent='此刻的脈絡';wrap.appendChild(head);
    lines.slice(0,2).forEach(t=>{const p=document.createElement('p');p.textContent=t;wrap.appendChild(p)});
    box.appendChild(wrap);
  }
}

let applyQueued=false;
function applyScene(){
  applyQueued=false;
  const c=core(),m=hydrate(loadMeta(),c);saveMeta(m);
  const title=document.getElementById('sceneTitle')?.textContent.trim()||'';
  if(!title)return;
  relabelChoices(title,m,c);inject(title,m,c);
}
function schedule(){if(applyQueued)return;applyQueued=true;requestAnimationFrame(()=>requestAnimationFrame(applyScene))}

const style=document.createElement('style');
style.textContent=`
.memory-context{margin:16px 0 2px;padding:12px 13px;border-top:1px solid #806c4938;border-bottom:1px solid #806c4938;background:#7c68400c}
.memory-context-head{margin-bottom:6px;color:#725d34;font-size:.69rem;font-weight:900;letter-spacing:.12em}
.memory-context p{margin:0 0 .72em!important;color:#4b4233;font-size:.92rem;line-height:1.65}
.memory-context p:last-child{margin-bottom:0!important}
.continuity-bridge{margin:0 0 1em!important;padding:10px 12px;border-left:3px solid #76613b;background:#76613b12;color:#40382c}
.continuity-bridge:before{content:'承接上一個選擇';display:block;margin-bottom:4px;color:#745f38;font-family:-apple-system,BlinkMacSystemFont,"PingFang TC",sans-serif;font-size:.69rem;font-weight:900;letter-spacing:.08em}
`;document.head.appendChild(style);

window.addEventListener('DOMContentLoaded',()=>{
  const choices=document.getElementById('choices');
  choices?.addEventListener('click',e=>{
    const b=e.target.closest('.choice-btn');if(!b||b.disabled)return;
    const label=b.querySelector('strong')?.textContent.trim();if(label)record(label);
    schedule();
  },true);

  document.getElementById('startBtn')?.addEventListener('click',()=>{resetMeta();const m=baseMeta();saveMeta(m);schedule()},true);

  const scheduleButtons=['loadStartBtn','menuLoad','saveBtn','inventoryBtn','closeInventoryBtn'];
  scheduleButtons.forEach(id=>document.getElementById(id)?.addEventListener('click',schedule));

  ['restartBtn','menuRestart','againBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>{
    setTimeout(()=>{if(!document.getElementById('startScreen')?.classList.contains('hidden'))resetMeta()},0);
  }));

  window.addEventListener('pageshow',schedule);schedule();
});

window.MistNarrativeState={canon:CANON,get:()=>hydrate(loadMeta(),core())};
})();