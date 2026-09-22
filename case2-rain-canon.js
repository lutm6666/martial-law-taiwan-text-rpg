(function(){
'use strict';

window.CASE2_RAIN_CANON={
  id:'rain-door-1958-v1',
  title:'雨夜敲門',
  year:1958,
  city:'臺北',
  protagonistMethod:'雨聲裡留下的每一件東西，都有自己的時間。',

  opening:{
    kicker:'案件二・雨夜敲門',
    title:'第三個雨夜',
    text:'雨從傍晚開始，一直沒有停。201號房裡的窗紙被風壓得微微發響，林秀雲坐在燈下，說這已經是第三晚。\n\n前兩晚也是同樣的節奏——三下，停一拍，再兩下。沒有多，也沒有少。她說到這裡時，手指無意識地在膝上又敲了一遍。\n\n今晚，那個聲音再次落在門板上。等門真正打開時，走廊已經空了，只剩門檻外幾枚還沒有乾的濕腳印。\n\n你沒有急著替這件事取名字。雨夜會讓很多聲音變得可疑，但能留下來的東西，總比傳聞更值得先看。'
  },

  residents:{
    '101':'陳福來','102':'黃春枝','103':'李水旺','104':'張玉蘭','105':'王金發','106':'劉淑貞',
    '201':'林秀雲','202':'吳天送','203':'鄭美華','204':'高志明','205':'周麗琴','206':'蔡文和'
  },

  timeline:[
    {date:'1953',text:'許月琴入住201號房。'},
    {date:'1955-05',text:'租冊後來被補寫「1955年5月搬離」。'},
    {date:'1955-06-17',text:'永和行仍有許月琴賒購洋火、棉線、肥皂的紀錄。'},
    {date:'1956',text:'林秀雲入住201號房。'},
    {date:'1958',text:'林秀雲為201號現住戶；雨夜敲門事件發生。'}
  ],

  evidence:{
    e01:{name:'門外濕腳印',type:'現場物證',image:'assets/v2/canon/e01-wet-footprints.png',desc:'201號門外、門檻前留下數枚濕腳印。鞋底輪廓偏窄，像女用低跟鞋；腳印沒有延伸進屋內。',proof:['有人曾走到201門前'],notProof:['腳印屬於許月琴','腳印能證明鬼魂存在']},
    e02:{name:'門框上的「月」字',type:'現場線索',image:'assets/v2/canon/e02-doorframe-yue.png',desc:'201號老木門框上留有很淡的「月」字刻痕，年代明顯早於林秀雲入住。',proof:['此房過去可能和名字帶「月」的人有關'],notProof:['刻字者身分']},
    e03:{name:'房屋租賃登記簿',type:'文件',image:'assets/v2/canon/e03-rental-ledger.png',desc:'201號許月琴於民國42年入住；「民國44年5月搬離」使用不同筆跡與墨色補入。民國45年林秀雲入住同一房號。',proof:['許月琴曾住201','搬離日期存在後補痕跡'],notProof:['許月琴確實於5月搬走']},
    e04:{name:'住戶一覽板',type:'現況紀錄',image:'assets/v2/canon/e04-resident-board.png',desc:'1958年住戶板顯示201林秀雲、202吳天送、203鄭美華、204高志明、205周麗琴、206蔡文和。',proof:['1958年201現住戶是林秀雲'],notProof:['許月琴過去是否住過這裡']},
    e05:{name:'永和行賒帳簿',type:'帳簿',image:'assets/v2/canon/e05-yonghe-ledger.png',desc:'民國44年6月17日，許月琴賒購洋火一盒、棉線一卷、肥皂一塊。此日期晚於租冊聲稱的5月搬離。',proof:['租冊的5月搬離說法不可靠','6月17日許月琴仍在附近活動'],notProof:['她之後去了哪裡']},
    e06:{name:'許家姐妹合照',type:'照片',image:'assets/v2/canon/e06-sisters-photo.png',desc:'照片背面標註「月琴、秋蘭」。兩姐妹外貌相近，與雨夜來訪女子的外觀相符。',proof:['許月琴有一名妹妹許秋蘭','兩姐妹外貌相似'],notProof:['最初看到的女子一定是哪一人']},
    e07:{name:'張文德紙條',type:'紙條',image:'assets/v2/canon/e07-wende-note.png',desc:'紙條寫著：「若她回來，東西還在樓上。別交給別人。——文德」',proof:['有人刻意把某件物品藏在樓上'],notProof:['「她」是誰','物品內容']},
    e08:{name:'屋頂鑰匙',type:'物件',image:'assets/v2/canon/e08-rooftop-key.png',desc:'老式鑰匙，標示「屋頂」，可打開屋頂儲藏間。',proof:['可進入屋頂儲藏間'],notProof:[]},
    e09:{name:'許月琴帆布提袋',type:'物件',image:'assets/v2/canon/e09-canvas-bag.png',desc:'屋頂儲藏間找到的舊帆布提袋，縫有「許月琴」姓名標籤。',proof:['提袋屬於許月琴','張文德紙條所指物品很可能就是此袋'],notProof:['提袋中的物品具有犯罪性質']},
    e10:{name:'提袋內物品',type:'物件組',image:'assets/v2/canon/e10-bag-contents.png',desc:'工作手冊、妹妹家書、針線、梳子、錢包與普通讀物等日常物品。',proof:['許月琴留下的是普通生活用品','她與妹妹保持聯繫'],notProof:['許月琴參與政治組織','許月琴從事情報工作']},
    e11:{name:'未寄出的明信片',type:'文字證物',image:'assets/v2/canon/e11-unsent-postcard.png',desc:'明信片沒有郵票、郵戳與地址。內容：「秋蘭：如果我很久沒有回家，不要來找我。月琴。」',proof:['許月琴曾預期自己可能長時間無法回家'],notProof:['她知道自己會被誰帶走','她已知信件內容']},
    e12:{name:'未拆封信件',type:'文件',image:'assets/v2/canon/e12-sealed-letter.png',desc:'普通泛黃紙信封，膠封完整，沒有郵票、郵戳或醒目特殊標誌。',proof:['信件至今未被拆開'],notProof:['信中內容','許月琴是否知道信中內容','信件是否涉及政治活動']}
  },

  people:{
    lin:{name:'林秀雲',desc:'201號現住戶。說話很輕，每次提到敲門聲都會先數一次節奏：三下，停一拍，再兩下。她最在意的不是怪談，而是門外那個人究竟想找誰。'},
    landlord:{name:'黃先生',desc:'房東。談租金與房號時記性很好，一提到許月琴卻總把話縮成一句「早就搬了」。被問到日期時，他會先看租冊，再看你。'},
    chen:{name:'陳太太',desc:'住得比林秀雲久得多。她記人靠的是日常細節，不太記年份；提起201以前的年輕女房客時，先想起的是姓許、名字裡有個「月」。'},
    shopkeeper:{name:'吳添福',desc:'永和行老闆。認熟客的方式是先翻帳，再想起人。他對三年前的日期未必張口就來，卻很相信自己留下的賒帳筆跡。'},
    yueqin:{name:'許月琴',desc:'201號前租客。1955年一個雨夜後失去消息。'},
    qiulan:{name:'許秋蘭',desc:'許月琴的妹妹。和姐姐長得很像，卻比照片裡更消瘦。她收到匿名紙條後，一次次回到201門口，只為確認姐姐是否真的留下了東西。'},
    wende:{name:'張文德',desc:'曾住樓上那間如今空著的房。人已不在，留下的卻都是做過準備的痕跡：藏在抽屜深處的紙條、夾層裡的屋頂鑰匙，以及一句「別交給別人」。'}
  },

  locations:{
    home:{name:'林家玄關／客廳',sub:'案件起點',image:'assets/v2/canon/01_林家玄關客廳.png',initial:true,actions:['inspect_footprints','inspect_yue_mark','ask_lin']},
    corridor:{name:'二樓公共走廊',sub:'證詞與現場核對',image:'assets/v2/canon/02_二樓公共走廊.png',unlock:['e01','e02'],actions:['check_rain_path','ask_chen','ask_chen_last_seen']},
    entrance:{name:'一樓入口／住戶板',sub:'租住紀錄',image:'assets/v2/canon/03_一樓入口住戶板區.png',unlockFlags:['chen_mentions_xu'],actions:['inspect_board','inspect_ledger','confront_landlord','press_landlord_date','ask_landlord_upstairs']},
    yonghe:{name:'永和行雜貨店',sub:'時間線交叉驗證',image:'assets/v2/canon/04_永和行雜貨店.png',unlock:['e03','e04'],actions:['ask_shopkeeper','inspect_yonghe_ledger']},
    stairs:{name:'樓梯間',sub:'第一次異常事件',image:'assets/v2/canon/05_樓梯間.png',unlockFlags:['timeline_conflict'],actions:['staircase_event']},
    spare:{name:'空置舊租客房',sub:'張文德留下的東西',image:'assets/v2/canon/06_空置舊租客房.png',unlockFlags:['spare_access'],actions:['inspect_sisters_photo','inspect_wende_note','find_rooftop_key']},
    rooftop:{name:'屋頂曬衣場／儲藏間',sub:'核心證物',image:'assets/v2/canon/07_屋頂雜物間.png',unlock:['e08'],actions:['open_storage','inspect_bag_contents','inspect_postcard','inspect_sealed_letter']}
  },

  actions:{
    inspect_footprints:{gain:'e01',text:'你在門檻外蹲下，先看水痕，再看鞋底留下的邊緣。幾枚窄鞋底的腳印從走廊另一頭一路靠近201，水還沒有完全滲進水泥地。最後一枚正停在門檻外；再往前，屋內沒有對應的濕痕。腳印就斷在這裡。'},
    inspect_yue_mark:{gain:'e02',text:'你蹲到門框旁，用指腹把積灰抹開。木頭內側有一道很淺的「月」字，刻痕已被歲月磨鈍；林秀雲看了一會，搖頭說她搬進來時就有了。'},
    ask_lin:{know:'lin',text:'林秀雲把門關到只剩一條縫，照著第二晚的位置比給你看。「我就是從這裡看出去。」她停了一下，又低聲數：「三下，停一下，再兩下。」那晚門外站著一名全身濕透的年輕女子。她問「妳找誰」，女子只抬頭看她，沒有回答。'},
    check_rain_path:{text:'你沿著欄杆慢慢往外走，先看屋簷滴水的位置，再看地面哪一側最容易積水。雨水都順著坡度往欄杆外側流，留下的是一片片散開的水痕。回頭再比門前那串腳印，它們卻是一枚接一枚從走廊另一頭靠近201。兩種痕跡的方向並不相同。'},
    ask_chen:{know:'chen',set:{chen_mentions_xu:true},text:'陳太太原本只說「以前是個年輕小姐」。你提到門框上的刻字，她才皺著眉想了一陣：「姓許……對，名字裡好像也有個月字。」她記不得哪一年，只記得那女子住201時常一個人進出。'},
    inspect_board:{gain:'e04',text:'你站到住戶板前，把二樓一排房號逐一看過去。紙卡都還很新，201清楚寫著「林秀雲」，和她現在住在這裡完全對得上。板子本身只記現況；要往前追，旁邊那幾本邊角磨黑的舊租冊才有可能留下更早的名字。'},
    inspect_ledger:{gain:'e03',text:'201那一欄先寫著「許月琴，民國42年入住」。後面的「民國44年5月搬離」顏色更深，字勢也不同，像是隔了一段時間才補上去。'},
    confront_landlord:{requires:['e03'],know:'landlord',text:'你把租冊翻回201那頁，沒有先問人，只把那行「民國44年5月搬離」推到黃先生面前。他看了一眼，答得很快：「就是那年搬走的。」你接著問五月哪一天、誰替她收了房、鑰匙又是什麼時候交回來的。他的回答忽然慢了下來。停了一會，他只說：「那麼久了，我哪記得這麼細。」'},
    ask_shopkeeper:{know:'shopkeeper',text:'吳添福把眼鏡往上推了推，說那年六月有個雨夜，許月琴來買洋火、棉線和肥皂。她離開前幾次回頭看店外，像是在等人，又像怕有人跟上來。'},
    inspect_yonghe_ledger:{gain:'e05',set:{timeline_conflict:true},text:'賒帳簿翻到民國44年6月17日，許月琴的名字還在。洋火一盒、棉線一卷、肥皂一塊——三樣尋常日用品，日期卻比租冊上的「五月搬離」晚了整整一個多月。'},
    ask_chen_last_seen:{requires:['e05'],set:{last_seen_account:true},text:'你帶著六月十七日的日期再去問陳太太。她沉默很久，才想起那年六月後的一個雨夜：她在樓梯口看見許月琴和兩個從沒見過的男人一起往外走。她只看見幾步和背影，沒有聽見爭吵，也無法判斷月琴是自己跟著走，還是受了逼迫。「那之後，我就沒再見過她。」'},
    press_landlord_date:{requires:['e05'],set:{landlord_admitted_edit:true},text:'你把永和行六月十七日的賒帳日期壓在租冊旁。黃先生盯著兩筆紀錄看了很久，最後承認「五月搬離」是後來補上的。那陣子有人來問許月琴的事，他怕自己和這棟房子被牽進去，便把日期往前寫成五月，想讓紀錄看起來像她早已搬走。你問來問話的是誰，他只搖頭：「那時候我連問都不敢問。」'},
    ask_landlord_upstairs:{requiresFlags:['staircase_event_seen'],set:{spare_access:true,wende_room_known:true},know:'wende',text:'你問起樓梯上方那扇長期關著的房門。黃先生說，那間以前租給一個叫張文德的男人，三年前搬走後一直空著。他從抽屜找出空房鑰匙交給你，答應讓你查看，只要求裡面的東西照原樣放回。'},
    staircase_event:{once:true,eventImage:'',set:{staircase_event_seen:true},text:'你走到樓梯轉角時，先看見窗玻璃上的人影。濕透的女子站在半層平台，頭髮貼著臉側，沒有撐傘。樓下忽然傳來一聲關門響，你下意識回頭；再轉回來，平台已經空了。階梯邊緣只剩幾點新鮮水跡，一級一級往樓上去。'},
    inspect_sisters_photo:{gain:'e06',text:'抽屜底壓著一張已經翹角的合照。兩個年輕女子並肩站著，眉眼和臉形很像；翻到背面，褪色鉛筆寫著兩個名字：「月琴、秋蘭」。你想起林秀雲描述的雨夜女子。'},
    inspect_wende_note:{gain:'e07',know:'wende',text:'紙條被壓在抽屜最裡面，只有幾個字：「若她回來，東西還在樓上。別交給別人。——文德」沒有日期，也沒有寫出那個「她」是誰。'},
    find_rooftop_key:{gain:'e08',text:'抽屜拉到底時卡了一下。你摸到後板與底板之間有一道薄縫，撬開鬆動的木片，裡面躺著一把用布條包住的舊鑰匙；布條上只寫了兩個字：「屋頂」。'},
    open_storage:{requires:['e08'],gain:'e09',text:'舊鑰匙插進鎖孔時卡了兩次，你慢慢轉動，鏽住的鎖舌才終於退開。門往內推時帶起一層灰，潮木和舊布的氣味一起湧出來。你把靠門的雜物挪開，在木箱後方看見一只老舊帆布提袋。袋面縫著一塊已經泛黃的姓名標籤：許月琴。'},
    inspect_bag_contents:{requires:['e09'],gain:'e10',text:'你把帆布袋放平，一樣一樣把東西取出來。沒有密碼本，也沒有什麼異常物件；只有工作手冊、幾封家書、針線、梳子、錢包和幾本普通讀物。這些東西被收得很整齊，生活氣息反而比任何傳聞都更明顯；但只憑擺放方式，仍不能判斷她當時是否打算回來取走。'},
    inspect_postcard:{requires:['e10'],gain:'e11',text:'你翻到工作手冊後面時，一張薄紙從頁縫滑了出來。是一張明信片，正面沒有郵票，也沒有郵戳，連收件地址都沒寫。你把它翻到背面，字只有短短一行：「秋蘭：如果我很久沒有回家，不要來找我。月琴。」讀完後，紙面上沒有任何能告訴你它原本打算何時寄出的記號。'},
    inspect_sealed_letter:{requires:['e10'],gain:'e12',set:{final_ready:true},text:'袋底最後還壓著一封泛黃的信。你先看正面，再翻到背面：沒有地址、沒有郵戳，也沒有醒目的特殊標記。封口的膠仍完整，紙邊也沒有被撬開的痕跡。你把信放回桌面，沒有拆它。眼前能確定的只有一件事——這封信直到現在仍然封著。'}
  },

  events:{
    qiulan_reveal:{trigger:{all:['e06','e09','e11'],flag:'final_ready'},text:'你把帆布袋帶回201不久，門外又響起三下、停一拍、再兩下。這次女子沒有躲開。她看見袋上的名字，臉色一下變了：「那是我姐姐的。」她說自己叫許秋蘭，幾天前收到一張沒有署名的紙條，只寫著姐姐的東西還留在舊住處。匿名讓她一直懷疑這可能是陷阱，也怕三年前讓姐姐消失的人還在附近，所以只敢趁雨夜來，聽見有人靠近就離開。她看向林秀雲：「第二晚妳問我的時候，我本來想回答，可樓梯一有腳步聲，我就不敢了。」她又說，三下、停一拍、再兩下，是姊妹從小約好的敲門方式；走到姐姐住過的門前，她幾乎是下意識照著敲。「前幾晚也是我。」',set:{qiulan_revealed:true},know:'qiulan'},
    final_knock:{after:'correct_final_deduction',text:'許秋蘭抱著帆布袋離開後，雨聲又填滿走廊。過了一會，門外忽然傳來三下、停一拍、再兩下。你立刻開門——走廊空著。回到客廳時，門檻內多出一串剛留下的濕腳印，一路延伸到桌前；原本扣著的姐妹合照，不知何時已翻到正面。'}
  },

  deductions:[
    {id:'who_knocked',q:'前三晚的敲門者最可能是誰？',requires:['e06'],correct:'qiulan',options:[
      {id:'yueqin',text:'許月琴',failureType:'falseAccusation'},
      {id:'qiulan',text:'許秋蘭'},
      {id:'ghost',text:'無法判斷是否為人',failureType:'weak'}
    ],explain:'照片顯示秋蘭與月琴外貌相近，而秋蘭現身後也承認前幾晚都是她來敲門；三下、停一拍、再兩下，還是姊妹從小約好的敲門方式。'},
    {id:'moveout',q:'租冊上的「1955年5月搬離」能否直接當作可靠事實？',requires:['e03','e05'],correct:'no',options:[
      {id:'yes',text:'可以，租冊已足以確認她在五月搬離',failureType:'overreach'},
      {id:'no',text:'不行，後補字跡與六月賒帳使這個日期不可靠'},
      {id:'unknown',text:'完全無法判斷她是否曾經搬離201',failureType:'overreach'}
    ],explain:'租冊的五月搬離是後補字跡，六月十七日的賒帳又證明許月琴仍在附近出現；黃先生也承認日期是事後補寫。這足以否定五月日期的可靠性，但仍不能重建她真正離開201的確切時間。'},
    {id:'timeline',q:'依目前能確認的紀錄，下列哪一組時間順序最穩妥？',requires:['e03','e05','e06'],correct:'ordered',options:[
      {id:'ordered',text:'1953年入住201 → 1955年6月17日仍在附近留下賒帳 → 1958年秋蘭依匿名紙條來201尋物'},
      {id:'may_move',text:'1953年入住201 → 1955年5月確定搬離 → 1955年6月17日才第一次到永和行',failureType:'overreach'},
      {id:'returning',text:'1955年6月17日才入住201 → 1958年由許月琴本人回來敲門',failureType:'falseAccusation'}
    ],explain:'能直接排進時間線的是1953年的入住、1955年6月17日仍在附近留下的賒帳，以及1958年秋蘭來201尋找姐姐遺物；「五月搬離」本身已被證明不可靠。'},
    {id:'belongings',q:'張文德紙條和屋頂帆布袋放在一起，最能支持哪項結論？',requires:['e07','e09'],correct:'kept',options:[
      {id:'kept',text:'有人刻意把許月琴的物品留在樓上保管'},
      {id:'crime',text:'帆布袋裡一定藏有犯罪證據',failureType:'overreach'},
      {id:'whereabouts',text:'張文德知道許月琴最後去了哪裡',failureType:'overreach'}
    ],explain:'紙條說「東西還在樓上」，帆布袋又有許月琴姓名標籤。兩者能接出物品被刻意保留的事實，卻不能推出袋內內容或月琴最後去向。'},
    {id:'sealed_letter',q:'那封至今未拆的信，能否證明許月琴知道信中內容或曾參與政治活動？',requires:['e12'],correct:'no',options:[
      {id:'yes',text:'可以，既然信在她的袋子裡就足以證明',failureType:'overreach'},
      {id:'no',text:'不能，封口完整，內容與她是否知情都仍未知'},
      {id:'partial',text:'只能證明她知道內容，但不能證明政治活動',failureType:'overreach'}
    ],explain:'信封至今未拆，只能證明它被保存下來。內容是什麼、月琴是否知道內容，以及它是否涉及政治活動，都不能從封著的信推出。'},
    {id:'cause',q:'綜合目前證據，能否確定許月琴究竟因為什麼事情失蹤？',requires:['e07','e11','e12'],correct:'unknown',options:[
      {id:'politics',text:'參與地下政治組織',failureType:'overreach'},
      {id:'intel',text:'替人傳遞情報',failureType:'overreach'},
      {id:'landlord',text:'被房東陷害',failureType:'falseAccusation'},
      {id:'unknown',text:'仍然不能確定'}
    ],explain:'陳太太只記得月琴最後一次出現時與兩名陌生男子同行；紙條、明信片和密封信也都沒有交代她最後遭遇了什麼。能確認的事實與仍然未知的部分，必須分開留下。'}
  ],

  ending:{
    correctTitle:'她曾經存在',
    correctText:'你仍不知道許月琴最後去了哪裡。能留下來的，是她確實住過201、六月十七日仍在附近出現、曾把物品留在樓上，以及陳太太最後一次看見她時，她正和兩名陌生男子一起離開。那是不是自願、兩個男人是誰，都不能從現有證據判斷。秋蘭把姐姐留下的東西抱在懷裡，第一次有人把這段往事完整地說出她的名字。',
    weakTitle:'雨夜怪談',
    weakText:'你把一切都歸進雨夜怪談。住戶很快有了新的版本：有人說是女鬼，有人說是索命。至於許月琴曾經住過201、留下過什麼，反而沒有人再提。',
    falseAccusationTitle:'錯誤的名字',
    falseAccusationText:'你把一個人的名字寫進結論，卻沒能把那個名字和許月琴的失蹤接起來。新的說法很快蓋過舊的空白，而真正發生過什麼，仍舊沒有人知道。',
    overreachTitle:'超出證據的結論',
    overreachText:'你把幾個彼此相鄰的線索連成了一個完整故事，但其中有一段並沒有證據支撐。當推測被寫成事實，真正能確認的部分反而一起變得模糊。'
  }
};
})();