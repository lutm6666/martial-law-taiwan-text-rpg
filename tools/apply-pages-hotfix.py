from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Existing continuity fix: worker / teacher role actions explicitly make the
# runner remember that complete written pages went to the bookstall.
continuity_marker = "if(['worker','teacher'].indexOf(state.role)!==-1)gain('runner_account');"
if continuity_marker not in text:
    old = "if(['worker','teacher','merchant','homemaker'].indexOf(state.role)!==-1)unlock('bookstall');return{complete:state.role!=='student'||has('wrapped_scrap'),lines:t[state.role]||['你換了一個熟悉的角度觀察市場。']}}}"
    new = "if(['worker','teacher'].indexOf(state.role)!==-1)gain('runner_account');if(['worker','teacher','merchant','homemaker'].indexOf(state.role)!==-1)unlock('bookstall');return{complete:state.role!=='student'||has('wrapped_scrap'),lines:t[state.role]||['你換了一個熟悉的角度觀察市場。']}}}"
    if old in text:
        text = text.replace(old, new, 1)

# Role-specific evidence. Every background now creates at least one real clue
# in the case record rather than only changing prose.
if "student_context:{name:'排版與頁序比對'" not in text:
    old = " consent_note:{name:'頁邊鉛筆註記',type:'文字線索',desc:'第 21 頁寫著：「秋月：不要真名。」'}\n};"
    new = """ consent_note:{name:'頁邊鉛筆註記',type:'文字線索',desc:'第 21 頁寫著：「秋月：不要真名。」'},
 student_context:{name:'排版與頁序比對',type:'身分情報・學生',desc:'你從版式、頁序與相鄰內容判斷，失頁原本與工廠夜班訪談相連。'},
 worker_handling:{name:'廢紙搬運習慣',type:'身分情報・工人',desc:'你從捆紙與搬運方式確認，印刷行廢紙平常確實由市場跑腿少年帶走。'},
 clerk_audit:{name:'帳簿連續性',type:'身分情報・公務員',desc:'前後欄位、墨色與流水號連續；十三日的歸還紀錄不像事後補寫。'},
 reporter_last_touch:{name:'最後接觸者說法',type:'身分情報・記者',desc:'周老闆承認當晚最後整理桌面的人是他自己，讓追問焦點從「誰可疑」轉成「紙如何被處理」。'},
 teacher_context:{name:'訪談用途說明',type:'身分情報・教師',desc:'把資料說明為未公開的生活訪談後，周老闆明顯降低戒心，證明他的防備與資料用途有關。'},
 merchant_flow:{name:'廢紙物流習慣',type:'身分情報・商人',desc:'少量廢紙不值得正式出售，通常直接流向市場，再依可用程度被分給攤販或舊書攤。'},
 veteran_boundary:{name:'目擊與推測分離',type:'身分情報・退伍軍人',desc:'你把「確實看見的行為」與「旁人推測的目的」分開記錄，避免把緊張反應誤當成證據。'},
 homemaker_network:{name:'街坊紙張流向',type:'身分情報・持家者',desc:'麻繩、竹籃與攤販習慣顯示，印刷行與市場之間一直存在非正式的紙張往來。'}
};"""
    if old not in text:
        raise SystemExit('role patch pattern not found: evidence dictionary')
    text = text.replace(old, new, 1)

# Print-shop role action: role choice now changes evidence and, for several
# backgrounds, can open a different route into the market investigation.
if "gain('clerk_audit')" not in text:
    pattern = r" print_role:\{label:'從自己的身分切入',special:true,run:function\(\)\{.*?\}\},\n market_stalls:"
    replacement = """ print_role:{label:'從自己的身分切入',special:true,run:function(){var lines=[];if(state.role==='student'){gain('student_context');lines=['你沒有先追問周老闆，而是翻看桌上的試印紙。行距、標題位置和阿川冊子的記法相近。','這不能直接證明失頁去向，卻讓你確認阿川確實在這裡處理過同一批訪談。'];}else if(state.role==='worker'){gain('worker_handling');gain('waste_route');unlock('market');lines=['你先幫著把一捆紙移回牆邊。繩結和重量都很像市場搬貨常用的捆法。','周老闆順口說出跑腿少年固定來拿廢紙。你不必等他完整承認，市場已經成為可查的去向。'];}else if(state.role==='clerk'){gain('print_ledger');gain('clerk_audit');lines=['你先看流水號、欄位和墨色，而不是只看阿川的名字。十二日借出、十三日歸還，前後紀錄連續。','這筆紀錄不像臨時補寫。你取得一條能直接拿來追問周老闆的程序證據。'];}else if(state.role==='reporter'){gain('reporter_last_touch');know('zhou');lines=['你不問「誰拿走紙」，改問每個人最後做了什麼。周老闆承認，當晚最後整理桌面的人是他自己。','這不是自白，但它把問題縮小成：他整理桌面時，哪些紙被當成廢紙處理。'];}else if(state.role==='teacher'){gain('teacher_context');lines=['你先說明阿川整理的是尚未公開的生活訪談，不是要散發的印刷品。','周老闆的肩膀明顯鬆了一點。你記下：他的戒心與「這些紙會被拿去做什麼」有關。'];}else if(state.role==='merchant'){gain('merchant_flow');gain('waste_route');unlock('market');lines=['你先問廢紙值多少錢、通常賣給誰。周老闆笑了一聲：量太少，不值得正式賣。','這種紙通常直接讓市場的人帶走。你從交易習慣得到一條不靠口供也成立的物流路線。'];}else if(state.role==='veteran'){gain('veteran_boundary');lines=['周老闆停頓時，你沒有把緊張直接記成可疑。你只分開寫下：阿川來過；周老闆最後整理桌面；失頁去向未知。','把事實與推測拆開後，你反而更清楚下一步需要的是時間紀錄，而不是再逼問一次。'];}else if(state.role==='homemaker'){gain('homemaker_network');gain('waste_route');unlock('market');lines=['你注意到後間的粗麻繩、空竹籃和墊箱紙，都和市場攤販平常使用的東西相同。','這不是偶然一次的接觸。印刷行與市場一直有日常往來，市場因此被標進地圖。'];}return{complete:true,lines:lines};}},
 market_stalls:"""
    text, n = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit('role patch pattern not found: print_role')

# Market role action: every role now changes route access or creates evidence,
# while preserving the common solution path for replay fairness.
if "state.role==='reporter'&&has('reporter_last_touch')" not in text:
    pattern = r" market_role:\{label:'從自己的身分切入',special:true,run:function\(\)\{.*?\}\},\n book_search:"
    replacement = """ market_role:{label:'從自己的身分切入',special:true,run:function(){var lines=[];if(state.role==='student'){if(!has('wrapped_scrap'))return{complete:false,lines:['你知道自己能比對語氣與頁面，但眼前還缺一張真正來自市場的紙。','先找到帶有阿川筆跡的紙片，再用你的頁序筆記確認它。']};gain('student_context');unlock('bookstall');lines=['你把紙角上的「夜班」和相鄰頁內容並排，句型與用字接得上。','你拿著比對結果問攤販，有人想起完整、寫滿字的紙曾被送往舊書攤。'];}else if(state.role==='worker'){gain('worker_handling');gain('runner_account');unlock('bookstall');know('runner');lines=['你沒有站著盤問少年，而是先幫他搬完兩箱貨。','他喘著氣主動想起：完整、寫滿字的紙沒有拿去墊箱，而是交給了舊書攤老闆。'];}else if(state.role==='clerk'){gain('clerk_audit');gain('runner_account');unlock('bookstall');lines=['你把三家攤販說的收紙日期逐一排在一起，發現它們指向同一個固定跑腿少年。','其中一名攤販補充：完整的紙通常會被送去舊書攤。固定流程比任何單一證詞都更可靠。'];}else if(state.role==='reporter'){state.flags.postmanRumor=true;unlock('bookstall');lines=['你把三個攤販分開問，刻意不告訴後一個人前一個說了什麼。','只有「穿郵務制服」和「問地址」能交叉確認；「在找阿川」沒有第一手來源。最早提到那名郵務人員的人，是舊書攤老闆。'];}else if(state.role==='teacher'){gain('teacher_context');gain('runner_account');unlock('bookstall');know('runner');lines=['少年原本只說記不得。你沒有催他，而是按時間、地點、手上搬的貨慢慢帶他回想。','他終於想起：幾張完整紙被送去舊書攤。你的身分讓這段回憶比一般追問更早出現。'];}else if(state.role==='merchant'){gain('merchant_flow');unlock('bookstall');lines=['你不問誰「看過紙」，而是問廢紙怎麼分：能墊箱的、能包貨的、還能再利用的。','幾個攤販很快把流向拼起來——完整、乾淨、寫滿字的紙最後多半會到舊書攤。'];}else if(state.role==='veteran'){state.flags.postmanRumor=true;unlock('bookstall');lines=['你把每句話拆成「看見什麼」與「猜他要做什麼」。','真正的第一手目擊只到郵務制服與問地址；最早能確認位置的人在舊書攤。你決定去找那個第一手來源。'];}else if(state.role==='homemaker'){gain('homemaker_network');unlock('bookstall');lines=['你先聊的是哪家攤子缺紙、誰會留乾淨紙、誰不拿有字的紙包食物。','有人順口提起舊書攤老闆的習慣：完整又寫滿字的紙，他常會先夾進書裡。'];}return{complete:true,lines:lines};}},
 book_search:"""
    text, n = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit('role patch pattern not found: market_role')

# Merchant / homemaker can narrow the book search through their own logistics
# or neighborhood evidence instead of requiring the runner testimony.
text = text.replace(
    "if(!has('runner_account')&&state.role!=='student')return{complete:false",
    "if(!has('runner_account')&&state.role!=='student'&&!has('merchant_flow')&&!has('homemaker_network'))return{complete:false",
    1
)

# Reporter / veteran can use the first-hand-source route at the bookstall;
# clerk can use the reconstructed routine. All three still end up producing the
# shared runner_account evidence, but they reach it through different proof.
if "has('reporter_last_touch')||has('veteran_boundary')||has('clerk_audit')" not in text:
    pattern = r" book_owner:\{label:'詢問老闆紙是誰交來的',run:function\(\)\{.*?\}\},\n book_stub:"
    replacement = """ book_owner:{label:'詢問老闆紙是誰交來的',run:function(){know('bookseller');if(has('runner_account'))return{complete:true,lines:['老闆很快想起那名少年。「寫滿字的紙拿來包吃的，我看了不舒服，就先夾著。」','這和少年的說法一致。']};if(has('reporter_last_touch')||has('veteran_boundary')||has('clerk_audit')){gain('runner_account');return{complete:true,lines:state.role==='reporter'?['你先確認老闆是不是親眼接過那些紙，而不是聽別人轉述。答案是肯定的：跑腿少年把完整紙親手交給他。','你補上了這條第一手來源，少年說法加入案件紀錄。']:state.role==='veteran'?['你只問老闆親眼看見的部分。他確定跑腿少年把完整紙交到自己手上，至於紙從哪來，他沒有替少年猜。','這份界線清楚的證詞足以補上紙的下一段路。']:['你把市場固定收紙的流程與老闆記得的收紙時間對上。老闆確認那天確實是同一名跑腿少年把完整紙送來。','程序與記憶互相吻合，少年說法加入案件紀錄。']};}return{complete:false,lines:['老闆說有些寫滿字的紙是市場跑腿少年塞給他的，但時間記不清。','這是一條方向，卻還需要更能固定來源或時間的資訊。']};}},
 book_stub:"""
    text, n = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit('role patch pattern not found: book_owner')

# Teach the player that role actions have mechanical consequences.
text = text.replace(
    '教學案件：先調查，再推論。你不必一次把所有行動做完；地圖與案件紀錄可以隨時切換。',
    '教學案件：先調查，再推論。身分切入不只改變對話，也可能取得獨有情報、跳過前置條件或提早開啟調查路線。',
    1
)

# Visible version markers make stale Safari / Pages caches easy to spot.
for old in ['BUILD 4.0.2・DEBUG', 'BUILD 4.0.3・DEBUG']:
    text = text.replace(old, 'BUILD 4.1・ROLE PATHS')
for old in ['。BUILD 4.0.2', '。BUILD 4.0.3']:
    text = text.replace(old, '。BUILD 4.1')

if text == original:
    print('Pages role-path patch already present; no changes required')
    raise SystemExit(0)

path.write_text(text, encoding='utf-8')
print('Applied role-specific clue and route expansion to index.html')
