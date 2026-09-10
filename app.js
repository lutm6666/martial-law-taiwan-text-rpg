(() => {
  'use strict';

  const SAVE_KEY = 'mist-taiwan-rpg-save-v1';

  const backgrounds = {
    student: { label: '學生', stats: { insight: 2, knowledge: 2, composure: 0, rapport: 0 } },
    worker: { label: '工人', stats: { insight: 0, knowledge: 0, composure: 2, rapport: 2 } },
    clerk: { label: '職員', stats: { insight: 1, knowledge: 0, composure: 0, rapport: 3 } }
  };

  const scenes = {
    intro: {
      chapter: '第一章・雨夜', location: '臺北・大稻埕', date: '1958 年 9 月',
      title: '一封不該出現在桌上的信',
      text: [
        '傍晚的雨把街上的招牌洗得發亮。你回到住處時，發現門縫底下壓著一封沒有署名的信。',
        '信裡只有幾行字：一位你認識的舊同學阿川，希望你明晚到一家茶行見面，並特別提醒你「不要向別人提起」。',
        '這年代裡，一句過於神祕的邀請，既可能只是朋友的麻煩，也可能帶來你不想碰上的事情。'
      ],
      choices: [
        { label: '把信收好，明晚赴約', hint: '好奇會帶你進入事件核心', next: 'tea_shop', effects: { stress: 1 }, log: '你決定赴阿川的約。' },
        { label: '先找共同朋友打聽阿川近況', hint: '較謹慎，也可能留下痕跡', next: 'ask_friend', effects: { suspicion: 1 }, log: '你先向共同朋友打聽阿川。' },
        { label: '燒掉信，當作沒有看見', hint: '避開風險，但故事仍會找上門', next: 'ignored_letter', effects: { composure: 1 }, log: '你選擇不回應那封信。' }
      ]
    },

    ask_friend: {
      chapter: '第一章・雨夜', location: '臺北・城中', date: '1958 年 9 月',
      title: '不完整的消息',
      text: [
        '你找到共同朋友美惠。她聽見阿川的名字時明顯停頓了一下，接著只說他最近常往書店與印刷行跑。',
        '她壓低聲音補了一句：「他不像在做壞事，但他現在太相信一句話能改變很多事。」',
        '你注意到街角有人停留得有點久，也可能只是你開始多心。'
      ],
      choices: [
        { label: '停止追問，改天直接見阿川', next: 'tea_shop', effects: { rapport: 1 }, log: '你沒有為難美惠，仍決定赴約。' },
        { label: '追問印刷行的位置', next: 'print_shop', effects: { suspicion: 1, insight: 1 }, log: '你查到阿川常去的印刷行。' }
      ]
    },

    ignored_letter: {
      chapter: '第一章・雨夜', location: '臺北・住處', date: '1958 年 9 月',
      title: '沉默並沒有讓事情消失',
      text: [
        '你把信處理掉，照常生活。兩天後，美惠卻主動來找你。',
        '她說阿川突然沒有再出現，茶行老闆則託人轉交一只普通的火柴盒。盒底寫著一個地址，正是你曾路過的印刷行。',
        '你本來想離事件遠一點，但現在你知道：什麼都不做，也是一種選擇。'
      ],
      choices: [
        { label: '去印刷行看看', next: 'print_shop', effects: { stress: 1 }, log: '你循著地址前往印刷行。' },
        { label: '把火柴盒交給可信任的長輩', next: 'elder', effects: { rapport: 1 }, log: '你決定先向可信任的長輩求助。' }
      ]
    },

    tea_shop: {
      chapter: '第二章・暗語', location: '臺北・茶行', date: '1958 年 9 月',
      title: '茶香裡的兩種說法',
      text: [
        '隔天晚上，你依約走進茶行。阿川已經坐在最裡面的桌子旁，神情比你記憶中疲憊。',
        '他說有人正在整理一份關於地方工廠勞動情況與校園思想管制的私人筆記，只希望留下紀錄，並不打算公開煽動任何行動。問題是，其中幾頁不見了。',
        '「我怕落到不該拿到的人手上。」他說。你無法立刻判斷，他害怕的是筆記造成誤會，還是另有隱情。'
      ],
      choices: [
        { label: '答應幫他找遺失的頁面', next: 'investigate', effects: { rep: 1, stress: 1 }, log: '你答應協助尋找遺失的筆記。' },
        { label: '要求先看剩下的筆記', next: 'read_notes', effects: { knowledge: 1 }, log: '你要求先理解筆記內容。' },
        { label: '勸阿川立刻停止並把剩餘資料封存', next: 'withdraw', effects: { composure: 1 }, log: '你勸阿川先保全自己。' }
      ]
    },

    read_notes: {
      chapter: '第二章・暗語', location: '臺北・茶行', date: '1958 年 9 月',
      title: '紙上的日常',
      text: [
        '你翻看剩餘筆記。內容不像宣言，更像剪報、工資數字、課堂紀錄與個人見聞。',
        '其中一頁記著一句話：「真正值得保存的，不一定是英雄的故事，也可能只是普通人今天害怕了什麼。」',
        '你開始理解阿川為什麼執著，但也更清楚這些紙張一旦脫離上下文，可能被不同的人作出完全不同的解讀。'
      ],
      choices: [
        { label: '幫他找回失頁，但要求不再擴散', next: 'investigate', effects: { insight: 1 }, log: '你同意協助，但要求控制風險。' },
        { label: '主張把筆記交給一位可信任的學者保管', next: 'professor', effects: { knowledge: 1, suspicion: 1 }, log: '你提出交由可信任的學者保管。' }
      ]
    },

    withdraw: {
      chapter: '第二章・暗語', location: '臺北・茶行後巷', date: '1958 年 9 月',
      title: '退後一步',
      text: [
        '阿川沒有生氣，只是沉默很久。他最後把剩餘資料收回袋子，說會重新考慮。',
        '你們離開時，茶行老闆提醒你們最近附近常有人打聽陌生面孔。',
        '你可以就此離開，也可以至少確認阿川安全回家。'
      ],
      choices: [
        { label: '送阿川一段路，觀察是否有人跟著', next: 'tail', effects: { stress: 1, insight: 1 }, log: '你陪阿川離開並留意四周。' },
        { label: '就此退出', ending: 'quiet_life', effects: { suspicion: -1 }, log: '你決定退出事件。' }
      ]
    },

    print_shop: {
      chapter: '第二章・暗語', location: '臺北・印刷行', date: '1958 年 9 月',
      title: '鉛字與油墨',
      text: [
        '印刷行白天看起來再普通不過。老闆姓周，桌上堆著喜帖、商號傳單與帳本。',
        '你提到阿川後，周老闆先否認認識，過了片刻才問：「你是來找人，還是找紙？」',
        '他的語氣不像威脅，更像在測量你究竟知道多少。'
      ],
      choices: [
        { label: '坦白說你只想確認阿川是否平安', next: 'printer_truth', effects: { rapport: 1 }, log: '你向周老闆坦白來意。' },
        { label: '假裝來詢問印製社團刊物的價格', next: 'printer_bluff', effects: { suspicion: 1 }, log: '你用社團刊物當藉口試探。' },
        { label: '觀察店內細節再決定', next: 'printer_observe', requires: { insight: 2 }, lockedHint: '需要觀察 ≥ 2', effects: { insight: 1 }, log: '你先仔細觀察印刷行。' }
      ]
    },

    printer_observe: {
      chapter: '第二章・暗語', location: '臺北・印刷行', date: '1958 年 9 月',
      title: '被撕掉的一角',
      text: [
        '你沒有立刻回答，而是看見廢紙簍裡有半張被撕掉的校刊樣稿。紙質與阿川信中的紙很像。',
        '更重要的是，周老闆手邊有一張借物清單，上面寫著「川：鉛字盒一只，星期三歸還」。',
        '至少他確實認識阿川。你把視線收回來，沒有揭穿他。'
      ],
      choices: [
        { label: '以你觀察到的線索換取實話', next: 'printer_truth', effects: { rep: 1 }, log: '你用線索讓周老闆知道沒必要再否認。' },
        { label: '悄悄離開，轉而找美惠', next: 'meet_meihui', effects: { suspicion: -1 }, log: '你沒有逼問周老闆。' }
      ]
    },

    printer_bluff: {
      chapter: '第二章・暗語', location: '臺北・印刷行', date: '1958 年 9 月',
      title: '一句太完整的謊話',
      text: [
        '你說得太詳細，反而讓周老闆皺起眉。他沒有拆穿你，只把價格單推過來。',
        '離開前，他低聲說：「年輕人，這種時候，真正保護人的通常不是聰明，是知道什麼時候別再多說。」',
        '你沒拿到答案，卻得到一個警告。'
      ],
      choices: [
        { label: '改口坦白', next: 'printer_truth', effects: { stress: 1 }, log: '你放棄試探，改為坦白。' },
        { label: '離開，去找美惠', next: 'meet_meihui', effects: { suspicion: -1 }, log: '你離開印刷行尋找其他線索。' }
      ]
    },

    printer_truth: {
      chapter: '第三章・失頁', location: '臺北・印刷行後間', date: '1958 年 9 月',
      title: '失去的不是一整份筆記',
      text: [
        '周老闆終於承認阿川來過。那天阿川借地方整理資料，離開時少了三頁。',
        '周老闆說，當晚另有一名常替商家跑腿的少年進來躲雨。他不認為對方知道紙上寫了什麼，但那三頁可能混進了廢紙。',
        '那些廢紙隔天被送去市場包貨。事情突然從祕密行動，變成了一場荒謬而危險的尋紙。'
      ],
      choices: [
        { label: '去市場找跑腿少年', next: 'market', effects: { rapport: 1 }, log: '你前往市場尋找跑腿少年。' },
        { label: '先把消息告訴阿川', next: 'tell_achuan', effects: { composure: 1 }, log: '你先回去通知阿川。' }
      ]
    },

    investigate: {
      chapter: '第三章・失頁', location: '臺北・街區', date: '1958 年 9 月',
      title: '從最普通的地方開始',
      text: [
        '阿川最後記得的地方有三個：茶行、印刷行，以及回家路上的市場。',
        '你們決定分開查找，減少一起出現的次數。你手上沒有偵探的工具，只有記憶、觀察，與人情。'
      ],
      choices: [
        { label: '從印刷行查起', next: 'print_shop', log: '你選擇先查印刷行。' },
        { label: '從市場查起', next: 'market', effects: { rapport: 1 }, log: '你選擇先查市場。' }
      ]
    },

    market: {
      chapter: '第三章・失頁', location: '臺北・市場', date: '1958 年 9 月',
      title: '一張包過花生的紙',
      text: [
        '市場裡沒有人在意你的祕密。大家只在意今天魚價多少、雨會不會再下，以及貨能不能賣完。',
        '問了幾攤後，你找到那名跑腿少年。他記得拿過一疊廢紙，其中幾張被拿去包花生，剩下的則給了附近舊書攤。',
        '他還說，一名穿制服的人昨天也問過類似的問題。你無法確定那只是例行查訪，還是有人已經注意到這件事。'
      ],
      choices: [
        { label: '立刻去舊書攤', next: 'bookstall', effects: { stress: 1 }, log: '你趕往舊書攤。' },
        { label: '先問清楚制服人士的特徵', next: 'uniform_question', requires: { rapport: 2 }, lockedHint: '需要人情 ≥ 2', effects: { insight: 1 }, log: '你耐心詢問制服人士的細節。' }
      ]
    },

    uniform_question: {
      chapter: '第三章・失頁', location: '臺北・市場', date: '1958 年 9 月',
      title: '也許只是例行，也許不是',
      text: [
        '少年只記得對方態度並不兇，問的是「有沒有看到印著奇怪文字的紙」。',
        '這讓你稍微安心：對方似乎還不知道具體內容。但也代表失頁可能已被第三方看見。',
        '你必須更快找到它們，同時避免自己因慌張而變得更顯眼。'
      ],
      choices: [
        { label: '平靜前往舊書攤', next: 'bookstall', effects: { composure: 1, suspicion: -1 }, log: '你保持平靜前往舊書攤。' }
      ]
    },

    bookstall: {
      chapter: '第四章・選擇', location: '臺北・舊書攤', date: '1958 年 9 月',
      title: '三頁紙，兩個版本的未來',
      text: [
        '舊書攤老闆從一本缺頁字典裡抽出三張折好的紙。原來他看見內容不像普通包裝紙，就先收了起來。',
        '失頁找回來了。上面沒有組織名單，也沒有行動計畫，只是幾段訪談摘要與觀察紀錄。',
        '但現在真正的問題已經不是「找不找得到」，而是「找到之後要怎麼辦」。你知道資訊一旦存在，就可能保存記憶，也可能給持有者帶來風險。'
      ],
      choices: [
        { label: '把三頁交還阿川，要求他完整封存', next: 'archive_choice', effects: { rep: 1 }, log: '你主張把資料完整封存。' },
        { label: '說服阿川銷毀可識別個人的細節，只保留匿名紀錄', next: 'redact_choice', requires: { knowledge: 2 }, lockedHint: '需要知識 ≥ 2', effects: { knowledge: 1 }, log: '你主張去除個人識別資訊後保存。' },
        { label: '把三頁交給可信任的長輩或學者判斷', next: 'professor', effects: { suspicion: 1 }, log: '你尋求第三方保管與判斷。' }
      ]
    },

    tell_achuan: {
      chapter: '第三章・失頁', location: '臺北・河岸', date: '1958 年 9 月',
      title: '阿川的急躁',
      text: [
        '阿川聽完後立刻想去市場逐攤詢問。你看得出他很焦慮，甚至開始把每個陌生人都想成可能的監視者。',
        '你提醒他，恐懼有時會讓人自己製造更多痕跡。阿川沉默後點了點頭。'
      ],
      choices: [
        { label: '由你單獨去市場', next: 'market', effects: { composure: 1 }, log: '你讓阿川暫時不要露面。' },
        { label: '兩人一起去，但保持自然', next: 'market', effects: { rep: 1, suspicion: 1 }, log: '你與阿川一起去市場。' }
      ]
    },

    meet_meihui: {
      chapter: '第三章・失頁', location: '臺北・公車站', date: '1958 年 9 月',
      title: '美惠知道的另一半',
      text: [
        '美惠聽完你的經過，告訴你阿川前幾天曾在市場幫印刷行搬廢紙。她一直以為那只是普通差事。',
        '她也提醒你，不要把每個模糊線索都想成陰謀。「有時候一張紙真的就只是被風吹走。」',
        '她的話讓你重新把注意力放回最實際的方向。'
      ],
      choices: [
        { label: '去市場', next: 'market', effects: { composure: 1 }, log: '你採納美惠的判斷，去市場追查。' }
      ]
    },

    tail: {
      chapter: '第三章・失頁', location: '臺北・街道', date: '1958 年 9 月',
      title: '身後的腳步聲',
      text: [
        '你陪阿川走過兩條街，確實有一名男子在相近方向走了很久。你們沒有奔跑，也沒有刻意躲藏，只在一家麵攤停下。',
        '男子繼續往前，沒有回頭。也許只是同路。你忽然明白，在高壓環境裡，最難分辨的往往不是危險，而是危險的可能性。',
        '阿川冷靜了一些，決定把事情處理得更保守。'
      ],
      choices: [
        { label: '協助他找回失頁後就封存', next: 'investigate', effects: { composure: 1 }, log: '你們決定務實處理失頁問題。' }
      ]
    },

    elder: {
      chapter: '第二章・旁觀者', location: '臺北・家中', date: '1958 年 9 月',
      title: '長輩的經驗',
      text: [
        '你把事情告訴一位你信任的長輩。他沒有立刻要你把東西交給誰，也沒有鼓勵你冒險。',
        '他只說：「先弄清楚你手上的東西究竟是什麼，再決定。不要因為害怕就替別人定罪，也不要因為相信朋友就忽略風險。」',
        '這是你今晚聽到最不戲劇化，卻也最有用的一句話。'
      ],
      choices: [
        { label: '依照建議去印刷行查證', next: 'print_shop', effects: { knowledge: 1, composure: 1 }, log: '你先查證，再下判斷。' },
        { label: '選擇不再介入', ending: 'quiet_life', effects: { stress: -1 }, log: '你把界線停在這裡。' }
      ]
    },

    professor: {
      chapter: '第四章・選擇', location: '臺北・教授宿舍', date: '1958 年 9 月',
      title: '保存本身也是一種責任',
      text: [
        '你們找到一位可信任、做事謹慎的教授。他看完資料後沒有評論政治立場，只指出其中最危險的是可辨認受訪者身分的細節。',
        '他建議把姓名、單位與可追溯資訊分離保存，並只留下必要的歷史紀錄。這不是萬全之策，但至少同時考慮記憶與人的安全。',
        '阿川第一次願意承認，保存一切並不一定等於保護真相。'
      ],
      choices: [
        { label: '採用匿名封存方案', ending: 'careful_archive', effects: { rep: 2, suspicion: -1 }, log: '你們採用匿名封存的方式保存紀錄。' },
        { label: '決定暫時不保留任何可辨認資料', ending: 'protect_people', effects: { composure: 2 }, log: '你把人的安全放在紀錄完整之前。' }
      ]
    },

    archive_choice: {
      chapter: '終章・封存', location: '臺北・茶行', date: '1958 年 9 月',
      title: '完整，卻不公開',
      text: [
        '阿川接受你的條件：資料不再複製，也不公開流傳，而是封入兩層信封，由不同的人分別保存目錄與內容。',
        '你們沒有改變時代，也沒有成為任何故事裡的英雄。只是讓一些普通人的話，多了一點留下來的可能。'
      ],
      choices: [
        { label: '完成封存', ending: 'sealed_memory', effects: { rep: 1 }, log: '資料被完整但低調地封存。' }
      ]
    },

    redact_choice: {
      chapter: '終章・去名', location: '臺北・印刷行', date: '1958 年 9 月',
      title: '留下事情，不留下名字',
      text: [
        '你們花了一整晚重新整理紀錄，把姓名、住址、單位與可以推回特定個人的線索全部分開。',
        '留下的是事件、數字、感受與日期。失去的是一部分細節，但也因此降低了某些人因文字被辨認的風險。',
        '阿川說他原本以為「真實」等於「全部留下」。現在他開始理解，紀錄也有倫理。'
      ],
      choices: [
        { label: '完成匿名紀錄', ending: 'careful_archive', effects: { rep: 2, composure: 1 }, log: '你們完成匿名化的紀錄。' }
      ]
    }
  };

  const endings = {
    quiet_life: {
      title: '結局：保持距離',
      text: '你選擇不再介入。日子恢復成原來的樣子，但偶爾經過那家茶行時，你還是會想起那封信。這不是懦弱或勇敢的簡單分類，而是一個人在不確定環境裡為自己劃出的界線。'
    },
    careful_archive: {
      title: '結局：無名的檔案',
      text: '你們保留了事件，卻盡量移除能傷及個人的辨識資訊。多年後，這些筆記也許會成為理解那個年代的一小塊拼圖。沒有人知道你的名字，而這正是你們當時希望的結果。'
    },
    protect_people: {
      title: '結局：人比紙重要',
      text: '你們決定不留下可辨認個人的資料。某些細節因此永遠消失，但幾個普通人的生活不必因幾張紙承擔額外風險。你接受了歷史保存與個人安全之間沒有完美答案。'
    },
    sealed_memory: {
      title: '結局：封存的記憶',
      text: '資料被完整保存，卻沒有在當下公開。你不知道它何時才會被重新打開，但你知道自己做的不是讓聲音變大，而是讓它不至於完全消失。'
    }
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    startScreen: $('startScreen'), gameScreen: $('gameScreen'), endingScreen: $('endingScreen'),
    nameInput: $('nameInput'), backgroundChoices: $('backgroundChoices'), startBtn: $('startBtn'), loadStartBtn: $('loadStartBtn'),
    playerName: $('playerName'), playerBg: $('playerBg'), stress: $('stress'), rep: $('rep'), suspicion: $('suspicion'),
    chapter: $('chapter'), location: $('location'), sceneDate: $('sceneDate'), sceneTitle: $('sceneTitle'), sceneText: $('sceneText'), choices: $('choices'),
    saveBtn: $('saveBtn'), logBtn: $('logBtn'), restartBtn: $('restartBtn'), logPanel: $('logPanel'), logList: $('logList'), closeLogBtn: $('closeLogBtn'),
    endingTitle: $('endingTitle'), endingText: $('endingText'), endingStats: $('endingStats'), againBtn: $('againBtn'),
    menuBtn: $('menuBtn'), menu: $('menu'), menuClose: $('menuClose'), menuSave: $('menuSave'), menuLoad: $('menuLoad'), menuRestart: $('menuRestart'), backdrop: $('backdrop'), toast: $('toast')
  };

  let selectedBg = null;
  let state = null;
  let toastTimer = null;

  function newState(name, bg) {
    const base = backgrounds[bg];
    return {
      version: 1,
      name: name.trim() || '無名旅人',
      bg,
      scene: 'intro',
      stress: 0,
      rep: 0,
      suspicion: 0,
      attributes: { insight: base.stats.insight, knowledge: base.stats.knowledge, composure: base.stats.composure, rapport: base.stats.rapport },
      log: [{ title: '故事開始', text: '1958 年 9 月，你收到一封沒有署名的信。' }],
      finished: false
    };
  }

  function clamp(n, min = 0, max = 99) { return Math.max(min, Math.min(max, n)); }

  function applyEffects(effects = {}) {
    ['stress', 'rep', 'suspicion'].forEach(key => {
      if (typeof effects[key] === 'number') state[key] = clamp(state[key] + effects[key]);
    });
    ['insight', 'knowledge', 'composure', 'rapport'].forEach(key => {
      if (typeof effects[key] === 'number') state.attributes[key] = clamp(state.attributes[key] + effects[key], 0, 20);
    });
  }

  function requirementsMet(req = {}) {
    return Object.entries(req).every(([key, value]) => {
      if (key in state.attributes) return state.attributes[key] >= value;
      return state[key] >= value;
    });
  }

  function formatParagraphs(arr) {
    return arr.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function renderStatus() {
    el.playerName.textContent = state.name;
    el.playerBg.textContent = `${backgrounds[state.bg].label}｜觀察 ${state.attributes.insight}・知識 ${state.attributes.knowledge}・沉著 ${state.attributes.composure}・人情 ${state.attributes.rapport}`;
    el.stress.textContent = state.stress;
    el.rep.textContent = state.rep;
    el.suspicion.textContent = state.suspicion;
  }

  function renderScene() {
    const scene = scenes[state.scene];
    if (!scene) return showToast('找不到場景資料');

    showScreen('game');
    renderStatus();
    el.chapter.textContent = scene.chapter;
    el.location.textContent = scene.location;
    el.sceneDate.textContent = scene.date;
    el.sceneTitle.textContent = scene.title;
    el.sceneText.innerHTML = formatParagraphs(scene.text);
    el.choices.innerHTML = '';

    scene.choices.forEach(choice => {
      const unlocked = requirementsMet(choice.requires);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `choice-btn${unlocked ? '' : ' locked'}`;
      button.disabled = !unlocked;
      button.innerHTML = `<strong>${escapeHtml(choice.label)}</strong>${choice.hint ? `<small>${escapeHtml(choice.hint)}</small>` : ''}${!unlocked && choice.lockedHint ? `<small>${escapeHtml(choice.lockedHint)}</small>` : ''}`;
      button.addEventListener('click', () => choose(choice));
      el.choices.appendChild(button);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function choose(choice) {
    if (!state || !requirementsMet(choice.requires)) return;
    applyEffects(choice.effects);
    if (choice.log) state.log.unshift({ title: scenes[state.scene].title, text: choice.log });

    if (state.stress >= 8 && !choice.ending) {
      state.stress = 6;
      state.log.unshift({ title: '壓力過高', text: '你暫時停下腳步，花了一些時間讓自己恢復冷靜。' });
    }

    if (choice.ending) {
      finish(choice.ending);
      return;
    }
    state.scene = choice.next;
    autoSave();
    renderScene();
  }

  function finish(id) {
    const ending = endings[id];
    if (!ending) return;
    state.finished = true;
    state.ending = id;
    autoSave();
    showScreen('ending');
    el.endingTitle.textContent = ending.title;
    el.endingText.textContent = ending.text;
    el.endingStats.innerHTML = `
      <span>壓力<b>${state.stress}</b></span>
      <span>聲望<b>${state.rep}</b></span>
      <span>疑心<b>${state.suspicion}</b></span>`;
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderLog() {
    el.logList.innerHTML = state.log.length
      ? state.log.map(entry => `<div class="log-entry"><b>${escapeHtml(entry.title)}</b><br>${escapeHtml(entry.text)}</div>`).join('')
      : '<div class="log-entry">尚無紀錄。</div>';
  }

  function save() {
    if (!state) return showToast('目前沒有可保存的進度');
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      showToast('進度已保存在此裝置');
    } catch (err) {
      showToast('瀏覽器目前無法保存進度');
    }
  }

  function autoSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function load() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (_) { data = null; }
    if (!data || !data.name || !data.bg) return showToast('找不到有效存檔');
    state = data;
    closeMenu();
    if (state.finished && state.ending) finish(state.ending);
    else renderScene();
    showToast('已讀取存檔');
  }

  function restart() {
    const ok = window.confirm('要放棄目前進度並回到開始畫面嗎？');
    if (!ok) return;
    state = null;
    selectedBg = null;
    el.nameInput.value = '';
    [...el.backgroundChoices.querySelectorAll('.bg-choice')].forEach(b => b.classList.remove('selected'));
    el.startBtn.disabled = true;
    closeMenu();
    showScreen('start');
  }

  function showScreen(which) {
    el.startScreen.classList.toggle('hidden', which !== 'start');
    el.gameScreen.classList.toggle('hidden', which !== 'game');
    el.endingScreen.classList.toggle('hidden', which !== 'ending');
  }

  function openMenu() {
    el.menu.classList.remove('hidden');
    el.backdrop.classList.remove('hidden');
  }

  function closeMenu() {
    el.menu.classList.add('hidden');
    el.backdrop.classList.add('hidden');
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add('show');
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 1900);
  }

  el.backgroundChoices.addEventListener('click', (event) => {
    const btn = event.target.closest('.bg-choice');
    if (!btn) return;
    selectedBg = btn.dataset.bg;
    [...el.backgroundChoices.querySelectorAll('.bg-choice')].forEach(b => b.classList.toggle('selected', b === btn));
    el.startBtn.disabled = !selectedBg;
  });

  el.startBtn.addEventListener('click', () => {
    if (!selectedBg) return;
    state = newState(el.nameInput.value, selectedBg);
    autoSave();
    renderScene();
  });

  el.loadStartBtn.addEventListener('click', load);
  el.saveBtn.addEventListener('click', save);
  el.logBtn.addEventListener('click', () => { renderLog(); el.logPanel.classList.toggle('hidden'); });
  el.closeLogBtn.addEventListener('click', () => el.logPanel.classList.add('hidden'));
  el.restartBtn.addEventListener('click', restart);
  el.againBtn.addEventListener('click', restart);

  el.menuBtn.addEventListener('click', openMenu);
  el.menuClose.addEventListener('click', closeMenu);
  el.backdrop.addEventListener('click', closeMenu);
  el.menuSave.addEventListener('click', save);
  el.menuLoad.addEventListener('click', load);
  el.menuRestart.addEventListener('click', restart);

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
})();
