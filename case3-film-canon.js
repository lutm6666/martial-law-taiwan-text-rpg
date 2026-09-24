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
    studio:{
      name:'明光照相館',sub:'前台與完成件區',
      intro:'店門半掩著，前台後方排著完成件封套與工作簿。鄭文雄把 A-217 放到桌面上：接觸印樣、現存負片與封套是三件不同的東西，先分開核對，才不會把後來的解釋混進眼前的物件。'
    },
    darkroom:{
      name:'暗房／工作間',sub:'沖洗與放大作業區',
      intro:'紅色安全燈照著放大機、藥盤與工作桌。牆邊掛著待乾的底片夾，桌上則是按日期排列的工作簿。這裡首先能說明的是照片怎麼被沖洗、接觸印樣與加洗。'
    },
    alley:{
      name:'後巷側門',sub:'照片中的位置',
      intro:'照片裡的側門就在這條窄巷。排水管、牆角與巷口的位置都還能辨認；若要判斷第 13 格是否真的接在前後影格之間，應先比對不會因說法而改變的畫面細節。'
    },
    newsstand:{
      name:'街口書報攤',sub:'街角攤位',
      intro:'報刊、香菸與零散照片擠在狹窄攤位上。蔡阿成從紙堆下取出一只照片袋，說沈瑞芳前幾天確實留了一張單格放大照給他。'
    },
    supplier:{
      name:'照相材料行',sub:'配送與取件櫃台',
      intro:'櫃台後堆著相紙、藥品與送貨用紙袋，靠牆的配送簿按日期記錄出貨。現在能追的是照片中袋面留下的標記，而不是先替紙袋內容下結論。'
    },
    chen_home:{
      name:'陳家',sub:'陳啟明住處',
      intro:'屋內陳設簡單。陳秀蓮坐在桌邊，回答得很慢。這裡要先分清她親眼看過什麼、別人對她說過什麼，以及她後來自己做過什麼。'
    }
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
    canCheckDutyRecord:function(s){return !!(s.flags&&s.flags.strongerInterpretationKnown)},
    canReviewLooseFilmProcedure:function(s){return hasConclusion(s,'C07')&&hasConclusion(s,'C13')},
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
    studio_opening:{
      location:'studio',
      label:'檢查 A-217',
      hint:'先核對接觸印樣、現存負片與封套。',
      result:'你把三樣東西並排。接觸印樣上能看到案件標示的第 11～15 格，第 13 格清楚存在；現存負片卻只剩 11｜12 與 14｜15 兩段。封套寫著沈瑞芳、9 月 16 日「明光附近街景」、9 月 17 日收件，以及 9 月 22 日預定取件。此刻能確定的只有：做接觸印樣時第 13 格存在，而現在保存的底片組裡沒有它。',
      effects:['gain:E01','gain:E02','gain:E03','conclude:C01','unlock:darkroom','unlock:alley','unlock:newsstand']
    },
    studio_b084_ledger:{
      location:'studio',
      label:'查找 B-084',
      hint:'用照片袋上的工作號碼回查追加放大紀錄。',
      requires:'canFindB084Ledger',
      result:'追加放大簿裡找到 B-084：原片單格放大、影格 13、9 月 19 日完成並取件，操作人記為鄭文雄。這表示第 13 格至少到 9 月 19 日仍能被拿來正常放大；缺片的時間必須再往後縮。',
      effects:['gain:E06','conclude:C07']
    },
    studio_receiving:{
      location:'studio',
      label:'查找 M-317 收貨紀錄',
      hint:'用完整包件編號核對照相館的收貨帳。',
      requires:'canCheckReceivingLedger',
      result:'明光自己的收貨簿也有 M-317：9 月 16 日、後側門收件、經手陳啟明。它和材料行的配送簿是兩套不同來源的紀錄；兩者能共同補足照片周圍的業務背景，但照片本身仍看不見紙袋內裝了什麼。',
      effects:['gain:E08','conclude:C10']
    },
    studio_duty:{
      location:'studio',
      label:'查看店務紀錄',
      hint:'核對近期代班與完成件整理紀錄。',
      requires:'canCheckDutyRecord',
      result:'例行店務簿記著 9 月 21 日晚陳秀蓮來店內幫忙，工作項目包含整理完成件。這只把她放進「能接觸 A-217 的人」之列，還不能單靠這一行紀錄決定第 13 格是誰取下的。',
      effects:['gain:E09','conclude:C13']
    },
    studio_loose_procedure:{
      location:'studio',
      label:'詢問單格底片如何處理',
      hint:'了解無法立即歸件的單格負片通常放在哪裡。',
      requires:'canReviewLooseFilmProcedure',
      result:'鄭文雄說，偶爾會碰到一時無法歸回原封套的單格負片。店裡不會立刻丟掉，而是先放進一只標作「未辨識零片」的舊紙袋，等日後確認來源再歸件。這提供了一個可以實際檢查的地方。',
      effects:['flag:looseFilmProcedureKnown']
    },
    studio_loose_search:{
      location:'studio',
      label:'查看舊零片',
      hint:'依照相館的整理方式，檢查尚未歸件的單格負片。',
      requires:'canSearchLooseFilms',
      result:'舊紙袋裡混著幾格來源不明的負片。你在其中挑出一格：畫面輪廓似乎也有那道側門與人物，但光憑肉眼相似還不夠。先把它記作「舊零片中的單格負片」，再和接觸印樣及相鄰影格比對。',
      effects:['gain:E10','flag:e10Found']
    },
    studio_verify_e10:{
      location:'studio',
      label:'比對這格負片',
      hint:'把它與接觸印樣及相鄰影格重新核對。',
      requires:'canVerifyE10',
      result:'放大後，這格負片的畫面與接觸印樣第 13 格一致；人物與移動物體的位置也能接上第 12、14 格。片幅、齒孔與裁切位置沒有出現互相矛盾之處。依目前能取得的資料，足以把這格零片確認為 A-217 缺失的第 13 格原片。',
      effects:['conclude:C14','flag:e10Verified']
    },

    darkroom_workflow:{
      location:'darkroom',
      label:'了解 A-217 處理流程',
      hint:'查看收件、沖洗、接觸印樣與完成件如何流轉。',
      result:'工作紀錄顯示 A-217 在 9 月 17 日收件後依一般流程完成沖洗與接觸印樣，再放入完成件區等待後續處理。這份紀錄沒有指出第 13 格何時離開原封套，只能把「它曾正常進入沖洗流程」這件事固定下來。',
      effects:['gain:E04','conclude:C02']
    },

    alley_frames:{
      location:'alley',
      label:'比對第 11～15 格',
      hint:'分別檢查人物位置、移動物體與固定背景。',
      result:'你把第 11～15 格排成一列。第 13 格不能只當成一張孤立照片來看；要先分別檢查人物、移動物體與固定背景的連續變化，再決定這組影像能支持到哪一步。',
      effects:['mechanic:frame_compare']
    },

    newsstand_visit:{
      location:'newsstand',
      label:'查看蔡阿成收到的照片',
      hint:'確認沈瑞芳追加製作的照片現在是什麼樣子。',
      result:'蔡阿成把照片袋推過來。裡面是一張只放大第 13 格的照片，沒有前後影格；紙袋上能辨認的標記只剩「…317」和一小部分店章。蔡說沈瑞芳覺得畫面「像電影」，才特地多洗一張給他，並不是請他保管什麼秘密證據。',
      effects:['gain:E05','key:b084','key:packageMarkPartial','flag:b084SeenOutsideStudio']
    },
    newsstand_xiulian:{
      location:'newsstand',
      label:'詢問誰看過這張照片',
      hint:'只記錄蔡阿成實際記得的人與說法。',
      result:'蔡阿成記得秀蓮在 20 日前後看過這張照片，也有人站在攤前說它像「偷偷交東西」。至於最早是誰先這樣說、之後又怎麼傳開，他說不準。這裡能留下的是誰看過照片，以及他實際記得的幾句話，不是一條完整的傳言來源鏈。',
      effects:['testimony:T_CAI_XIULIAN','flag:xiulianSawPhoto','unlock:chen_home']
    },

    supplier_trace:{
      location:'supplier',
      label:'追查紙袋上的標記',
      hint:'用照片中可辨認的部分標記查找配送紀錄。',
      requires:'canTracePackage',
      result:'配送簿在 9 月 16 日有一筆 M-317：送往明光照相館，送件人洪明義。簿上的編號能和照片中露出的「…317」對上，但這份資料本身沒有讓你從照片裡直接看見紙袋內容。',
      effects:['gain:E07','key:m317']
    },

    chen_first:{
      location:'chen_home',
      label:'詢問陳秀蓮',
      hint:'詢問她看過的照片，以及後來聽到的說法。',
      requires:'canVisitChenHome',
      result:'秀蓮承認自己看過蔡阿成那張單格照片。她說哥哥曾告訴她「那只是店裡的貨」，但當時她無法拿出帳目證明；她也記得後來有人把說法講成「偷偷交東西」，甚至說紙袋裡可能是文件。她把自己看見的照片、哥哥的說法和外面聽來的解讀混在一起時，明顯變得緊張。',
      effects:['testimony:T_XIULIAN_GOODS','testimony:T01','flag:strongerInterpretationKnown']
    },
    chen_final:{
      location:'chen_home',
      label:'再次詢問陳秀蓮',
      hint:'只告訴她第 13 格已經找到，不透露發現位置。',
      requires:'canFinalAskXiulian',
      result:'你只說：「第 13 格找到了。」秀蓮沉默了一會，先問：「是在那袋舊零片裡嗎？」你沒有回答。她接著承認，9 月 21 日整理完成件時把第 13 格剪下，塞進那袋零片。她說自己知道已經流出去的照片收不回來，只是不想讓原片再被加洗、再被拿去說更多事。藏匿位置與你的實際發現吻合；至於她心裡真正有多害怕、為什麼最後做出這個決定，仍主要來自她自己的陳述。',
      effects:['flag:xiulianAdmission','testimony:T02']
    }
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
