(()=>{'use strict';
const SAVE='mist-taiwan-rpg-save-v4';
const roleName={student:'學生',worker:'工人',clerk:'公務員',reporter:'記者',teacher:'教師',merchant:'商人',veteran:'退伍軍人',homemaker:'持家者'};
const lens={
student:'你先整理眼前能讀出的脈絡，沒有替還不知道的部分補上答案。',
worker:'你更在意現場的人怎麼工作、怎麼說話，以及信任是不是在日常往來裡慢慢建立。',
clerk:'你習慣把日期、流程與可核對的紀錄分開，不讓一個印象直接變成結論。',
reporter:'你把親眼所見、轉述與推測分開；知道「有人這樣說」和知道「事情確實如此」並不是同一件事。',
teacher:'你在意一句話放回原本脈絡後還是不是同一個意思，也在意被記錄的人是否有機會修正。',
merchant:'你從人情、往來與物件實際經過誰的手來理解事情，不急著把日常流通想成陰謀。',
veteran:'你沒有因緊張氣氛就把最壞情況當成事實，而是先排除能排除的普通可能。',
homemaker:'你先想到紙外的人還有家庭與日常，不希望為了追一條線索又把更多無關的人牽進來。'};
function state(){try{return JSON.parse(localStorage.getItem(SAVE)||'null')}catch(_){return null}}
function lastChoice(s){const t=s?.log?.[0]?.text||'';const m=t.match(/「(.+?)」/);return m?m[1]:''}
function setStory(arr,title){const box=document.getElementById('sceneText');if(!box)return;const ps=[...box.children].filter(x=>x.tagName==='P'&&!x.classList.contains('choice-result')&&!x.classList.contains('identity-text')&&!x.classList.contains('history-note'));arr.forEach((t,i)=>{if(ps[i])ps[i].textContent=t});if(title)document.getElementById('sceneTitle').textContent=title;const id=box.querySelector('.identity-text');if(id)id.style.display='none'}
function fixMain(s){if(!s)return;const r=s.bg,l=lens[r]||'',prev=lastChoice(s),hasPages=s.inventory?.includes('archive_pages');
const map={
ask_friend:()=>[
prev==='檢查它刻意缺少哪些正式書信欄位'?'你檢查過信件格式後，知道那些缺漏只能說明寄信人不想留下完整資訊，不能說明原因。於是你把問題帶到共同朋友美惠這裡，補上「阿川最近去了哪裡」這塊最基本的資料。':'你找到共同朋友美惠，沒有先替那封信下判斷，只想確認阿川最近的行蹤。她聽見名字時停頓了一瞬，才說他近來常往書店與印刷行跑。',
'美惠補了一句：「他不是在做壞事，只是太相信留下文字很重要。」這是她對朋友的理解，不是證據；但「書店、印刷行」至少成了兩個可以繼續確認的地方。 '+l],
tea_shop:()=>[
'阿川比記憶中疲憊。桌上是尚未整理完的工廠勞動、校園生活與日常訪談，其中三頁不見了；他能確定的是遺失，卻不能確定紙最後經過誰的手。',
'他真正擔心的不是某一句話本身，而是姓名、住址或片段內容離開原本脈絡後傷到被記錄的人。你現在可以先答應尋找、先讀現有資料，或先把風險與界線問清楚。 '+l],
print_shop:()=>[
'印刷行裡是油墨、潮紙與趕工的聲音。周老闆桌上堆著喜帖、傳單、收據與借物帳；你提到阿川時，他先說不清楚，接著反問：「你是找人，還是找紙？」',
'角落廢紙簍裡有半張尺寸與阿川筆記相近的紙，但光靠相似不能證明來源。店裡同時留下帳目、搬動痕跡與街坊往來等不同方向，你得決定先查哪一種。 '+l],
market:()=>[
'市場裡沒有人停下生意等你查案。跑腿少年承認前幾天帶過一批印刷行廢紙：有些拿去包東西，其餘送到舊書攤；他又提到昨天有人來問過那批紙。',
'「有人問過」還太模糊。對方的衣著、實際行為、是否留下單據，以及紙最後去了哪裡，都必須分開確認；你還沒有替少年選定哪一種回想方式。 '+l],
factory_branch:()=>[
hasPages?'你從找回的三頁與阿川原有筆記中對到一名女工「秋月」。她談的是夜班、工傷與家中弟妹的學費。你循著可辨認的工作線索來到工廠附近，卻發現她已數日沒有上班。':'即使三頁失頁還沒有回到手邊，阿川剩餘的訪談索引與記憶仍提到一名女工「秋月」，內容與夜班、工傷和家中弟妹的學費有關。你循這條已知訪談線來到工廠附近，卻發現她已數日沒有上班。',
'工友目前只願意說「家裡出了事」。這句話還不能告訴你原因，也不能證明她遭遇了什麼；你可以先建立信任、查一般出勤背景，或決定是否直接聯絡她。 '+l],
qiuyue_home:()=>[
'你終於坐到秋月面前。她知道阿川曾記下自己的工作與家庭處境，因此對來意很謹慎；在你說明資料目前如何被處理後，她沉默了一會兒。',
'秋月沒有要求全部銷毀，只先說清楚一條界線：「我的名字不要留。」至於住址、家人與今天的新談話要不要記，仍應由她自己決定，你不能替她預先選完。 '+l],
elder:()=>[
prev==='先找可信任的長輩商量'?'你把火柴盒與事情經過一起帶去見長輩。他沒有把盒底地址當成證據，只問你目前究竟知道哪些事。':'你沒有急著把更多人牽進來，而是先找一位信得過的長輩，把那封信與自己目前的疑問說清楚。',
'他沒有鼓勵你冒險，也沒有要你因害怕立刻替誰下判斷，只提醒：「先弄清楚手上的東西是什麼。把知道的和猜的分開。」 '+l],
read_notes:()=>[
r==='student'?'你把自己的袖珍筆記本放在手邊，開始整理阿川留下的資料。工資、剪報、課堂見聞與訪談混在一起，比他口中的「三頁失頁」更像一份尚未完成的材料。':'你翻看阿川手邊剩餘的資料：工資、剪報、課堂見聞與訪談片段混在一起。它不像完成的文章，也沒有單一立場可以概括。',
r==='student'?'你已經有可以記錄的本子，因此茶行老闆只替你添了紙筆。真正要決定的，是繼續尋找、先討論保存方式，還是從資料本身反推下一個地點。 '+l:'茶行老闆拿出一本空白小冊子放在桌邊，說如果你真的要繼續查，可以拿去整理線索。你還沒有決定要不要收下，也還沒有決定下一步。 '+l],
printer_truth:()=>[
'周老闆終於承認阿川來過。整理店面時，那三頁確實可能混進一批廢紙，之後由替市場跑腿的少年帶走；他能說清楚的是紙的流向，不能保證三頁一定仍在同一批裡。',
r==='worker'?'你自己原本就帶著一張工廠餐券。周老闆提醒，那少年常餓著肚子跑腿；若你要去問，可以把人當人，不必把餐券當成交換答案的價碼。':'周老闆指了指桌邊一張工廠餐券，說那少年常餓著肚子跑腿；如果你決定帶去市場，可以把它當成一份照顧，而不是交換答案的價碼。'],
uniform:()=>[
prev.includes('分開問')?'你把少年剛才說的外觀與行為重新核對一遍，沒有再讓「制服」替他下身分結論。幾個細節彼此一致：那人穿著郵務制服，實際上一路在找一封寄錯地址的信。':'你繼續把少年能確認的細節拆開問。幾個說法最後對上：那名詢問者穿著郵務制服，而且一路在找一封寄錯地址的信。',
'這使「有人特地追查阿川筆記」少了一個根據，但並不能證明所有疑慮都消失。若要更確定，仍需要信封特徵、存根或其他能核對的資料。 '+l],
professor:()=>[
hasPages?'你帶著找回的三頁與現有筆記拜訪教授。他沒有先評論內容立場，而是逐項看哪些資訊能直接指回受訪者。':'你在失頁尚未完全釐清前先拜訪教授，討論的是「如果資料找回或繼續保存，應該遵守什麼界線」。他沒有假裝看過不存在於手邊的三頁，只從現有材料與你的描述談方法。',
'教授把問題拆成來源、查證、姓名、單位、住址與受訪者同意。保存不是「全部留下」或「全部丟掉」二選一；你接下來可以先替手邊資料建立規則，也可以回頭繼續找人與找紙。 '+l],
archive:()=>[
hasPages?'三頁已經回到手邊。阿川同意先不公開，也不再任意複製；你們把內容、姓名與其他可辨識資訊分開整理，再決定哪些部分能長期保存。':'失頁還沒有回到手邊，但你們決定先停止讓現有資料繼續散亂。阿川把手邊筆記收整、暫不公開，先建立姓名與內容分開保存的規則；失頁問題則仍被標成「未解決」，沒有假裝已經完成。',
'這次整理讓另一條已知訪談線浮上來：女工秋月曾擔心真名被留下。你可以在這裡停下，也可以沿著這條已知線索去確認她本人的意願。 '+l],
bookstall:()=>[
'舊書攤老闆從一本他近日收來的缺頁字典裡抽出三張折好的紙。那本字典只是書攤收來的舊書，和你隨身物品裡可能有的教材或字典不是同一本。',
'紙張、頁碼與阿川描述的特徵對得上：失頁終於找回。接下來的問題不再是「在哪裡」，而是要不要原樣交還、先匿名處理，或找第三方討論保存方式。 '+l],
factory_friend:()=>[
'工友把能確認的部分說清楚：秋月的父親病倒，她暫時回家照顧；他們也記得秋月曾擔心訪談留下真名。這些資訊解釋了缺勤，卻沒有替秋月決定資料該怎麼用。',
'你現在知道住家線索，但「知道地址」不等於應該直接登門。可以請熟人代為傳話、選擇不打擾，或在確認合適時機後再去問她本人。 '+l],
night_archive:()=>[
'回到整理桌前，你們把秋月親自說出的界線寫進規則：是否留名由受訪者決定；住址與家庭資料不和內容放在一起；今天新增的談話也不能自動視為可使用。',
'這套方法並不完美，但它把「記錄者想留下什麼」改成「被記錄的人同意留下什麼」。阿川原本只想把資料保存下來，如今才真正開始學習如何負責地保存。 '+l]};
const fn=map[s.scene];if(fn)setStory(fn());
if(s.scene==='archive'&&!hasPages)document.getElementById('sceneTitle').textContent='先保存手邊的資料';
if(s.scene==='professor'&&!hasPages){const labels=document.querySelectorAll('#choices .choice-btn strong');labels.forEach(x=>{const t=x.textContent;if(t==='採用匿名封存方案')x.textContent='先替手邊資料採用匿名封存，暫停追索失頁';else if(t==='把資料來源分級，另外留下查證紀錄')x.textContent='先替現有資料分級，建立查證紀錄';else if(t==='建立一份不含姓名的索引表')x.textContent='先為現有資料建立不含姓名的索引';else if(t==='把來源保護與事實查證分成兩套記錄')x.textContent='先把現有資料的來源保護與查證分開';else if(t==='把「未來如何解讀」也寫進保存規則')x.textContent='先替現有資料補上解讀與保存規則';else if(t==='把可辨識資料分開保管，降低單點風險')x.textContent='先把現有資料分開保管';});}}
function fixInventory(){const s=state();if(!s)return;const panel=document.getElementById('inventoryList');if(!panel)return;if(s.bg==='merchant'&&s.inventory?.includes('family_note')){[...panel.querySelectorAll('.item-card')].forEach(card=>{const strong=card.querySelector('strong'),small=card.querySelector('small');if(strong?.textContent==='秋月家的藥費單'){strong.textContent='秋月口述的支出摘要';if(small)small.textContent='經秋月同意，你只抄下她願意留下的幾項家庭支出背景，沒有帶走原始帳單。'}})}}
function fixToast(){const s=state(),t=document.getElementById('toast');if(!s||!t)return;if(s.bg==='merchant'&&t.textContent.includes('獲得 秋月家的藥費單'))t.textContent=t.textContent.replace('獲得 秋月家的藥費單','記下 秋月同意留下的支出摘要')}
let timer;function run(){clearTimeout(timer);timer=setTimeout(()=>{const s=state();fixMain(s);fixInventory();fixToast()},0)}
window.addEventListener('DOMContentLoaded',()=>{const game=document.getElementById('gameScreen'),inv=document.getElementById('inventoryPanel'),toast=document.getElementById('toast');if(game)new MutationObserver(run).observe(game,{subtree:true,childList:true,characterData:true});if(inv)new MutationObserver(run).observe(inv,{subtree:true,childList:true});if(toast)new MutationObserver(fixToast).observe(toast,{childList:true,characterData:true,subtree:true});run()});
})();