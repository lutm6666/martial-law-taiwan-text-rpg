(function(){
'use strict';

window.CASE2_RAIN_CANON={
  id:'rain-door-1958-v1',
  title:'雨夜敲門',
  year:1958,
  city:'臺北',
  protagonistMethod:'雨聲裡留下的每一件東西，都有自己的時間。',

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
    e10:{name:'提袋內物品',type:'物件組',image:'assets/v2/canon/e10-bag-contents.png',desc:'工作手冊、妹妹家書、姐妹照片、針線、梳子、錢包與普通讀物等日常物品。',proof:['許月琴留下的是普通生活用品','她與妹妹保持聯繫'],notProof:['許月琴參與政治組織','許月琴從事情報工作']},
    e11:{name:'未寄出的明信片',type:'文字證物',image:'assets/v2/canon/e11-unsent-postcard.png',desc:'明信片沒有郵票、郵戳與地址。內容：「秋蘭：如果我很久沒有回家，不要來找我。月琴。」',proof:['許月琴曾預期自己可能長時間無法回家'],notProof:['她知道自己會被誰帶走','她已知信件內容']},
    e12:{name:'未拆封信件',type:'文件',image:'assets/v2/canon/e12-sealed-letter.png',desc:'普通泛黃紙信封，膠封完整，沒有郵票、郵戳或醒目特殊標誌。',proof:['信件至今未被拆開'],notProof:['信中內容','許月琴是否知道信中內容','信件是否涉及政治活動']}
  },

  people:{
    lin:{name:'林秀雲',desc:'201號現住戶。1956年入住。連續三個雨夜聽見敲門聲。'},
    landlord:{name:'黃先生',desc:'房東。對許月琴的過往答得含糊，堅稱她早已搬走。'},
    chen:{name:'陳太太',desc:'老住戶。記得201以前住過一名姓許的年輕女子。'},
    shopkeeper:{name:'吳添福',desc:'永和行老闆。記得許月琴在1955年6月17日仍到店內買東西。'},
    yueqin:{name:'許月琴',desc:'201號前租客。1955年一個雨夜後失去消息。'},
    qiulan:{name:'許秋蘭',desc:'許月琴的妹妹。1958年為尋找姐姐留下的物品而來到此處。'},
    wende:{name:'張文德',desc:'曾住樓上空置房。留下紙條與屋頂鑰匙。'}
  },

  locations:{
    home:{name:'林家玄關／客廳',sub:'案件起點',image:'assets/v2/canon/01_林家玄關客廳.png',initial:true,actions:['inspect_footprints','inspect_yue_mark','ask_lin']},
    corridor:{name:'二樓公共走廊',sub:'證詞與現場核對',image:'assets/v2/canon/02_二樓公共走廊.png',unlock:['e01','e02'],actions:['check_rain_path','ask_chen']},
    entrance:{name:'一樓入口／住戶板',sub:'租住紀錄',image:'assets/v2/canon/03_一樓入口住戶板區.png',unlockFlags:['chen_mentions_xu'],actions:['inspect_board','inspect_ledger','confront_landlord']},
    yonghe:{name:'永和行雜貨店',sub:'時間線交叉驗證',image:'assets/v2/canon/04_永和行雜貨店.png',unlock:['e03','e04'],actions:['ask_shopkeeper','inspect_yonghe_ledger']},
    stairs:{name:'樓梯間',sub:'第一次異常事件',image:'assets/v2/canon/05_樓梯間.png',unlockFlags:['timeline_conflict'],actions:['staircase_event']},
    spare:{name:'空置舊租客房',sub:'張文德留下的東西',image:'assets/v2/canon/06_空置舊租客房.png',unlockFlags:['staircase_event_seen'],actions:['inspect_sisters_photo','inspect_wende_note','find_rooftop_key']},
    rooftop:{name:'屋頂曬衣場／儲藏間',sub:'核心證物',image:'assets/v2/canon/07_屋頂雜物間.png',unlock:['e08'],actions:['open_storage','inspect_bag','inspect_bag_contents','inspect_postcard','inspect_sealed_letter']}
  },

  actions:{
    inspect_footprints:{gain:'e01',text:'門外的水泥地還泛著濕光。幾枚窄鞋底的腳印沿走廊來到201門前，最後一枚正停在門檻外，之後便斷了。'},
    inspect_yue_mark:{gain:'e02',text:'門框上有一道很舊的「月」字刻痕。它比林秀雲入住的時間早得多。'},
    ask_lin:{know:'lin',text:'林秀雲說，第二晚從門縫看見一名全身濕透的年輕女子。她問「妳找誰」，對方沒有回答。'},
    check_rain_path:{text:'你沿著屋簷和排水溝看了一遍。雨水往欄杆外側流，門前那串腳印卻是從走廊另一頭一步步靠近201，方向完全不同。'},
    ask_chen:{know:'chen',set:{chen_mentions_xu:true},text:'陳太太記得201以前住過一名姓許的年輕女子，名字中似乎有個「月」字。'},
    inspect_board:{gain:'e04',text:'住戶板上的紙卡都很新，201寫著林秀雲。板子旁邊的舊租冊卻厚得多，邊角已經磨黑，顯然記過好幾輪房客。'},
    inspect_ledger:{gain:'e03',text:'201那一欄先寫著「許月琴，民國42年入住」。後面的「民國44年5月搬離」顏色更深，字勢也不同，像是隔了一段時間才補上去。'},
    confront_landlord:{requires:['e03'],know:'landlord',text:'你把租冊翻到201那頁。黃先生只瞥了一眼便說：「就是那年搬走的。」問到五月是哪一天，他停了一會，只說記不得了。'},
    ask_shopkeeper:{know:'shopkeeper',text:'吳添福把眼鏡往上推了推，說那年六月有個雨夜，許月琴來買洋火、棉線和肥皂。她付帳前幾次回頭看店外，像是在等人，又像怕有人跟上來。'},
    inspect_yonghe_ledger:{gain:'e05',set:{timeline_conflict:true},text:'賒帳簿翻到民國44年6月17日，許月琴的名字還在。洋火一盒、棉線一卷、肥皂一塊——三樣尋常日用品，日期卻比租冊上的「五月搬離」晚了整整一個多月。'},
    staircase_event:{once:true,set:{staircase_event_seen:true},text:'樓梯間窗邊站著一名濕透的女子。樓下忽然傳來門聲；你回頭再看，她已不見，只剩水跡往樓上延伸。'},
    inspect_sisters_photo:{gain:'e06',text:'照片背面寫著「月琴、秋蘭」。兩姐妹外貌相近。'},
    inspect_wende_note:{gain:'e07',know:'wende',text:'紙條被壓在抽屜最裡面，只有幾個字：「若她回來，東西還在樓上。別交給別人。——文德」沒有日期，也沒有寫出那個「她」是誰。'},
    find_rooftop_key:{gain:'e08',text:'抽屜夾層裡找到一把標示「屋頂」的舊鑰匙。'},
    open_storage:{requires:['e08'],gain:'e09',text:'鑰匙打開屋頂儲藏間。木箱後方放著一只老舊帆布提袋，袋面縫著「許月琴」的姓名標籤。'},
    inspect_bag:{requires:['e09'],text:'帆布已經發硬，提把磨得起毛。靠近袋口的布條上仍能看見三個繡字：許月琴。'},
    inspect_bag_contents:{requires:['e09'],gain:'e10',text:'袋裡沒有什麼神祕物件：一本工作手冊、幾封家書、針線、梳子、錢包、普通讀物，還有那張姐妹合照。東西收得很整齊，像是主人原本還打算再來拿。'},
    inspect_postcard:{requires:['e10'],gain:'e11',text:'一張明信片夾在工作手冊後面，沒有地址，也沒有貼郵票。背面只寫著：「秋蘭：如果我很久沒有回家，不要來找我。月琴。」'},
    inspect_sealed_letter:{requires:['e10'],gain:'e12',set:{final_ready:true},text:'袋底還壓著一封泛黃的信。封口膠仍完整，表面沒有地址、郵戳，也沒有任何特別標記。你翻看正反兩面，信封始終沒有被拆開過。'}
  },

  events:{
    qiulan_reveal:{trigger:{all:['e06','e09','e11'],flag:'final_ready'},text:'你把帆布袋帶回201不久，門外又響起三下、停一拍、再兩下。這次女子沒有躲開。她看見袋上的名字，臉色一下變了：「那是我姐姐的。」她說自己叫許秋蘭，幾天前收到一張沒有署名的紙條，只寫著姐姐的東西還留在舊住處。',set:{qiulan_revealed:true},know:'qiulan'},
    final_knock:{after:'correct_final_deduction',text:'許秋蘭抱著帆布袋離開後，雨聲又填滿走廊。過了一會，門外忽然傳來三下、停一拍、再兩下。你立刻開門——走廊空著。回到客廳時，門檻內多出一串剛留下的濕腳印，一路延伸到桌前；原本扣著的姐妹合照，不知何時已翻到正面。'}
  },

  deductions:[
    {id:'who_knocked',q:'前三晚敲門的女子最可能是誰？',requires:['e06'],correct:'qiulan',options:[
      {id:'yueqin',text:'許月琴'},
      {id:'qiulan',text:'許秋蘭'},
      {id:'ghost',text:'無法判斷是否為人'}
    ],explain:'照片裡的秋蘭和門外女子極為相像，而她本人也說出了來此處的原因。前三晚的敲門者至此有了身分。'},
    {id:'moveout',q:'許月琴是否真的在租冊記載的1955年5月搬走？',requires:['e03','e05'],correct:'no',options:[
      {id:'yes',text:'是'},
      {id:'no',text:'否'},
      {id:'unknown',text:'無法判斷'}
    ],explain:'租冊寫五月搬離，永和行卻在六月十七日仍記著她的名字與賒購品項。兩筆日期無法同時成立。'},
    {id:'cause',q:'目前證據能否證明許月琴因為什麼事情失蹤？',requires:['e07','e11','e12'],correct:'unknown',options:[
      {id:'politics',text:'參與地下政治組織'},
      {id:'intel',text:'替人傳遞情報'},
      {id:'landlord',text:'被房東陷害'},
      {id:'unknown',text:'不能確定'}
    ],explain:'紙條、明信片和密封信都留下了不安的痕跡，卻沒有交代她最後遭遇了什麼。那封信甚至至今未拆。'}
  ],

  ending:{
    correctTitle:'她曾經存在',
    correctText:'你仍不知道許月琴最後去了哪裡。能留下來的，是她確實住過201、六月仍在附近生活，以及那只被藏了三年的帆布袋。秋蘭把姐姐留下的東西抱在懷裡，第一次有人把這段往事完整地說出她的名字。',
    weakTitle:'雨夜怪談',
    weakText:'你把一切都歸進雨夜怪談。住戶很快有了新的版本：有人說是女鬼，有人說是索命。至於許月琴曾經住過201、留下過什麼，反而沒有人再提。',
    falseAccusationTitle:'錯誤的名字',
    falseAccusationText:'你把一個人的名字寫進結論，卻沒能把那個名字和許月琴的失蹤接起來。新的說法很快蓋過舊的空白，而真正發生過什麼，仍舊沒有人知道。'
  }
};
})();