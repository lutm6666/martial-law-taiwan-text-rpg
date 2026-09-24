;(function(global){
'use strict';

var C = {
  id:'case3-film',
  title:'第十三張底片',
  label:'CASE 03・第十三張底片',
  year:'1958・臺北',
  saveKey:'mist-taiwan-case3-film-v1',
  version:1,

  locations:{
    studio:{name:'明光照相館',sub:'前台與完成件區'},
    darkroom:{name:'暗房／工作間',sub:'沖洗與放大作業區'},
    alley:{name:'後巷側門',sub:'照片中的位置'},
    newsstand:{name:'街口書報攤',sub:'街角攤位'},
    supplier:{name:'照相材料行',sub:'配送與取件櫃台'},
    chen_home:{name:'陳家',sub:'陳啟明住處'}
  },

  people:{
    zheng:{name:'鄭文雄',role:'明光照相館老闆'},
    shen:{name:'沈瑞芳',role:'業餘攝影者'},
    qiming:{name:'陳啟明',role:'明光照相館工作人員'},
    xiulian:{name:'陳秀蓮',role:'陳啟明的妹妹'},
    hong:{name:'洪明義',role:'照相材料行送件人員'},
    cai:{name:'蔡阿成',role:'街口書報攤主人'}
  },

  evidence:{
    E01:{name:'A-217 接觸印樣',type:'照片／文件',desc:'接觸印樣保留案件標示的第 11～15 格；第 13 格在印樣上可見。'},
    E02:{name:'A-217 現存負片',type:'底片',desc:'目前保存的負片分為 11｜12 與 14｜15 兩段。'},
    E03:{name:'A-217 底片封套',type:'工作文件',desc:'記載沈瑞芳、9 月 16 日拍攝註記、9 月 17 日收件與 9 月 22 日預定取件。'},
    E04:{name:'沖洗／工作紀錄',type:'帳目',desc:'記錄 A-217 的收件、沖洗、接觸印樣與完成件流程。'},
    E05:{name:'B-084 單格放大照片',type:'照片',desc:'由第 13 格追加製作的單格放大照片；袋面可見不完整的「…317」與部分店家標記。'},
    E06:{name:'B-084 追加放大紀錄',type:'帳目',desc:'B-084／原片單格放大／影格 13／9 月 19 日完成與取件／操作鄭文雄。'},
    E07:{name:'材料行配送簿',type:'帳目',desc:'M-317／9 月 16 日／明光照相館／送件洪明義。'},
    E08:{name:'明光照相館收貨紀錄',type:'帳目',desc:'M-317／9 月 16 日／後側門收件／經手陳啟明。'},
    E09:{name:'明光店務／值班紀錄',type:'帳目',desc:'例行店務紀錄顯示 9 月 21 日晚秀蓮代班、整理完成件。'},
    E10:{name:'舊零片中的單格負片',verifiedName:'A-217 第 13 格原片',type:'底片',desc:'在長期未辨識的舊零片中找到的一格負片；身分必須經比對確認。'}
  },

  conclusions:{
    C01:{text:'接觸印樣製作時，第 13 格原片存在；目前保存的這組底片中，第 13 格原片缺失。',requires:{evidence:['E01','E02']}},
    C02:{text:'第 13 格原片至少存在到接觸印樣製作時；之後某時才從目前保存的底片組中消失。',requires:{evidence:['E01','E04']}},
    C04:{text:'現有證據一致支持第 13 格屬於這組連續拍攝影像。',requires:{frame:['personMovement','movingObject','fixedBackground']}},
    C05:{text:'第 12～14 格共同支持一只紙袋由一名男子轉到另一名男子手中。',requires:{conclusions:['C04']}},
    C07:{text:'9 月 19 日製作 B-084 時，第 13 格原片仍存在且可用於單格放大。',requires:{evidence:['E05','E06']}},
    C10:{text:'現有影像、供貨方紀錄與收貨方紀錄一致支持：9 月 16 日洪明義曾將編號 M-317 的包件交給明光照相館，陳啟明為收件經手人。',requires:{evidence:['E07','E08'],conclusions:['C05']}},
    C13:{text:'9 月 21 日晚，秀蓮屬於能接觸 A-217 的人員之一。',requires:{evidence:['E09']}},
    C14:{text:'找到的單格負片可確認就是 A-217 中缺失的第 13 格。',requires:{evidence:['E10'],conclusions:['C04']}}
  },

  testimonies:{
    T_CAI_XIULIAN:{speaker:'蔡阿成',text:'秀蓮在 20 日前後看過 B-084。',verification:'unverified'},
    T_XIULIAN_GOODS:{speaker:'陳秀蓮',text:'哥哥說那只是店裡的貨。',verification:'unverified'},
    T01:{speaker:'陳秀蓮',text:'在 9 月 21 日以前，她除了看過照片，也已聽到「後巷偷偷交東西」、「可能是文件」等更嚴重的說法。',verification:'partially_supported'},
    T02:{speaker:'陳秀蓮',text:'她表示自己剪下原片，是因為擔心照片繼續被利用並使哥哥受到牽連。',verification:'self_report'}
  },

  hypotheses:{
    H_SIDE_DOOR:{text:'側門可能代表刻意避開他人視線。'},
    H_CIRCULATION_LINK:{text:'第 13 格原片的缺失，可能與 B-084 後來的流傳有關。'},
    H_XIULIAN:{text:'秀蓮可能與第 13 格離開 A-217 有關。'}
  },

  predicates:{
    canFindB084Ledger:function(s){return !!(s.keys&&s.keys.b084)},
    canTracePackage:function(s){return !!(s.frameAnalysis&&s.frameAnalysis.continuityComplete&&s.keys&&s.keys.packageMarkPartial)},
    canCheckReceivingLedger:function(s){return !!(s.keys&&s.keys.m317)},
    canVisitChenHome:function(s){return !!(s.flags&&s.flags.xiulianSawPhoto)},
    canSearchLooseFilms:function(s){return !!(s.flags&&s.flags.looseFilmProcedureKnown&&hasConclusion(s,'C07')&&hasConclusion(s,'C13'))},
    canVerifyE10:function(s){return hasEvidence(s,'E10')&&!!(s.frameAnalysis&&s.frameAnalysis.continuityComplete)},
    canFinalAskXiulian:function(s){return !!(s.flags&&s.flags.e10Verified&&s.flags.xiulianAccessWindowKnown)},
    canStartDeduction:function(s){
      return hasConclusion(s,'C07') &&
        !!(s.frameAnalysis&&s.frameAnalysis.continuityComplete&&s.frameAnalysis.handoffSupported) &&
        hasConclusion(s,'C10') && !!(s.flags&&s.flags.e10Verified&&s.flags.xiulianAdmission);
    }
  },

  actions:{
    studio_opening:{location:'studio',label:'檢查 A-217',hint:'先核對接觸印樣、現存負片與封套。',effects:['gain:E01','gain:E02','gain:E03','conclude:C01','unlock:darkroom','unlock:alley','unlock:newsstand']},
    studio_b084_ledger:{location:'studio',label:'查找 B-084',hint:'用照片袋上的工作號碼回查追加放大紀錄。',requires:'canFindB084Ledger',effects:['gain:E06','conclude:C07']},
    studio_receiving:{location:'studio',label:'查找 M-317 收貨紀錄',hint:'用完整包件編號核對照相館的收貨帳。',requires:'canCheckReceivingLedger',effects:['gain:E08','conclude:C10']},
    studio_duty:{location:'studio',label:'查看店務紀錄',hint:'核對 9 月 21 日晚完成件由誰整理。',effects:['gain:E09','conclude:C13']},
    studio_loose_procedure:{location:'studio',label:'詢問單格底片如何處理',hint:'了解無法立即歸件的單格負片通常放在哪裡。',effects:['flag:looseFilmProcedureKnown']},
    studio_loose_search:{location:'studio',label:'查看舊零片',hint:'依照相館的整理方式，檢查尚未歸件的單格負片。',requires:'canSearchLooseFilms',effects:['gain:E10','flag:e10Found']},
    studio_verify_e10:{location:'studio',label:'比對這格負片',hint:'把它與接觸印樣及相鄰影格重新核對。',requires:'canVerifyE10',effects:['conclude:C14','flag:e10Verified']},

    darkroom_workflow:{location:'darkroom',label:'了解 A-217 處理流程',hint:'查看收件、沖洗、接觸印樣與完成件如何流轉。',effects:['gain:E04','conclude:C02']},

    alley_frames:{location:'alley',label:'比對第 11～15 格',hint:'分別檢查人物位置、移動物體與固定背景。',effects:['mechanic:frame_compare']},

    newsstand_visit:{location:'newsstand',label:'查看蔡阿成收到的照片',hint:'確認沈瑞芳追加製作的照片現在是什麼樣子。',effects:['gain:E05','key:b084','key:packageMarkPartial','flag:b084SeenOutsideStudio']},
    newsstand_xiulian:{location:'newsstand',label:'詢問誰看過這張照片',hint:'只記錄蔡阿成實際記得的人與說法。',effects:['testimony:T_CAI_XIULIAN','flag:xiulianSawPhoto','unlock:chen_home']},

    supplier_trace:{location:'supplier',label:'追查紙袋上的標記',hint:'用照片中可辨認的部分標記查找配送紀錄。',requires:'canTracePackage',effects:['gain:E07','key:m317']},

    chen_first:{location:'chen_home',label:'詢問陳秀蓮',hint:'詢問她看過的照片，以及後來聽到的說法。',requires:'canVisitChenHome',effects:['testimony:T_XIULIAN_GOODS','testimony:T01','flag:strongerInterpretationKnown']},
    chen_final:{location:'chen_home',label:'再次詢問陳秀蓮',hint:'只告訴她第 13 格已經找到，不透露發現位置。',requires:'canFinalAskXiulian',effects:['flag:xiulianAdmission','testimony:T02']}
  },

  frameAnalysis:{
    categories:{
      personMovement:{label:'人物位置變化'},
      movingObject:{label:'移動物體連續性'},
      fixedBackground:{label:'固定背景一致性'}
    },
    completeRequires:['personMovement','movingObject','fixedBackground'],
    onComplete:['conclude:C04','conclude:C05']
  },

  deductions:[
    {id:'q1',question:'第 13 格原片發生了什麼？',correct:'第 13 格正常形成，接觸印樣製作時存在，9 月 19 日又曾以原片製作 B-084；之後才從 A-217 被取下。'},
    {id:'q2',question:'第 13 格與 11～15 是什麼關係？',correct:'現有證據一致支持第 13 格屬於這組連續拍攝影像。'},
    {id:'q3',question:'單看 12～14 格的影像序列，可以支持什麼？',correct:'一名男子將一只紙袋交到另一名男子手中。'},
    {id:'q4',question:'M-317 相關資料增加了什麼資訊？',correct:'供貨方與收貨方兩套獨立紀錄，提供一套與照片中的紙袋交接相符的日常業務背景。'},
    {id:'q5',question:'關於第 13 格被取下，目前證據能支持到哪一步？',correct:'秀蓮剪下並藏起第 13 格的行為有多項資料相互支持；她所陳述的內在動機仍應與行為事實分開記錄。'},
    {id:'q6',question:'目前證據允許我們對整起事件下什麼結論？',correct:'照片記錄了真實瞬間；外部資料能補足背景，但照片本身不能證明紙袋內容或秘密活動，缺片也不能反過來證明那些附加解讀。'}
  ],

  endings:{
    image_literalism:{name:'影像迷信'},
    overcorrection:{name:'過度修正'},
    forced_origin:{name:'強求源頭'},
    evidence_boundary:{name:'證據邊界'}
  }
};

function hasEvidence(s,id){return !!(s&&Array.isArray(s.evidence)&&s.evidence.indexOf(id)!==-1)}
function hasConclusion(s,id){return !!(s&&Array.isArray(s.conclusions)&&s.conclusions.indexOf(id)!==-1)}

C.helpers={hasEvidence:hasEvidence,hasConclusion:hasConclusion};
global.CASE3_FILM_CANON=C;
})(window);
