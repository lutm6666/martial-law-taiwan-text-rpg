(()=>{'use strict';
const EXP_KEY='mist-taiwan-rpg-expansion-v1';
const CORE_KEY='mist-taiwan-rpg-save-v4';
const START_TITLE='新的方法';
const roleByLabel={'學生':'student','工人':'worker','公務員':'clerk','記者':'reporter','教師':'teacher','商人':'merchant','退伍軍人':'veteran','持家者':'homemaker'};
const scenes={
  winter_window:{chapter:'第十章・冬雨',location:'臺北・印刷行',date:'1958 年 12 月',title:'窗縫裡的紙條',text:[
    '入冬後，整理工作原本逐漸有了節奏。某個雨夜，周老闆卻在後門窗縫裡發現一張折得很小的紙條。',
    '紙上只有一句話：「阿川那批訪談，還有誰看過？」沒有署名，也沒有留下要你們回覆的方法。',
    '最令人不安的不是內容，而是對方似乎知道「那批訪談」存在。你們第一次必須把保存資料與保護仍在生活中的人放在同一張桌上衡量。'
  ],choices:[
    {label:'先核對誰曾經接觸過檔案',next:'access_log',fx:{knowledge:1,stress:1}},
    {label:'先去找美惠，確認阿川今晚是否平安',next:'empty_chair',fx:{rapport:1,stress:1}},
    {label:'把所有人叫到茶行一起商量',next:'tea_meeting',fx:{rep:1,suspicion:1}}
  ]},
  access_log:{chapter:'第十章・冬雨',location:'臺北・印刷行',date:'1958 年 12 月',title:'名單比記憶可靠',text:[
    '你們沒有先猜紙條是誰寫的，而是把借閱、整理與搬動資料的時間重新排過。',
    '結果比想像中普通：阿川、美惠、周老闆、你，以及兩名曾協助搬紙的熟人。真正的問題不是「誰可疑」，而是過去幾個月你們從沒把接觸紀錄當成重要的事。',
    '核對到最後，美惠忽然發現：其中一只裝匿名稿的牛皮紙袋不在原本的位置。'
  ],choices:[
    {label:'先找紙袋，不急著追究責任',next:'missing_envelope',fx:{composure:1}},
    {label:'逐一確認最後看見紙袋的時間',next:'missing_envelope',fx:{insight:1,suspicion:1}},
    {label:'用印刷收據比對那天紙張的去向',next:'receipt_clue',fx:{knowledge:1},requiresItem:'print_receipt',hint:'需要先前取得的印刷收據'}
  ]},
  tea_meeting:{chapter:'第十章・冬雨',location:'臺北・茶行',date:'1958 年 12 月',title:'一桌沒有說完的話',text:[
    '茶行提早拉下半扇門。阿川沒有來，空著的位置讓每個人的聲音都比平常小。',
    '周老闆主張立刻停止整理；美惠認為應先確認資料有沒有外流。兩種意見都說得通，也都無法讓不確定消失。',
    '就在你們爭執時，老闆娘從櫃檯下拿出一封下午送到的信。信封上寫著阿川的名字，裡面卻只有一張車票時刻抄本。'
  ],choices:[
    {label:'先查車票時刻，不替阿川猜目的',next:'station',fx:{insight:1}},
    {label:'先確認紙條與信封是不是同一種紙',next:'paper_compare',fx:{knowledge:1}},
    {label:'停止今晚所有討論，各自回去',next:'quiet_night',fx:{composure:1,rep:-1}}
  ]},
  empty_chair:{chapter:'第十一章・失約',location:'臺北・茶行',date:'1958 年 12 月',title:'阿川沒有赴約',text:[
    '美惠比你早到茶行。阿川下午曾託人帶話，說晚上會來，卻直到打烊都沒有出現。',
    '茶行老闆想起白天有兩個陌生人問過附近哪些店家替學生印過刊物，但他們沒有指名阿川，也沒有留下任何通知。',
    '一個失約、兩個陌生人、一張沒有署名的紙條。它們可能彼此相關，也可能只是被緊張的心情硬湊在一起。'
  ],choices:[
    {label:'只記下能確認的事，先找阿川留下的行程',next:'station',fx:{composure:1,insight:1}},
    {label:'回印刷行檢查檔案有沒有缺漏',next:'access_log',fx:{knowledge:1}},
    {label:'請美惠去問共同朋友，自己留在茶行等消息',next:'waiting_room',fx:{rapport:1}}
  ]},
  paper_compare:{chapter:'第十一章・紙張',location:'臺北・茶行',date:'1958 年 12 月',title:'相似，不等於相同',text:[
    '紙條和信封都偏黃，也都有粗糙纖維。第一眼很像，但放在燈下比較後，厚度與裁切方式並不一致。',
    '這個小小的差異沒有替你解開謎團，卻阻止你把兩件事過早連在一起。',
    '信裡抄下的班次指向臺北車站。距離末班車還有一段時間。'
  ],choices:[
    {label:'去車站，只確認阿川是否出現',next:'station',fx:{composure:1}},
    {label:'留下來整理所有可核對的時間點',next:'waiting_room',fx:{knowledge:1}},
    {label:'把判斷寫進筆記，避免之後又把兩種紙混為一談',next:'station',fx:{knowledge:1},requiresItem:'notebook',hint:'需要袖珍筆記本'}
  ]},
  receipt_clue:{chapter:'第十一章・紙張',location:'臺北・印刷行',date:'1958 年 12 月',title:'收據背面的鉛筆字',text:[
    '你把先前留下的印刷收據拿出來比對。周老闆翻到背面，才發現自己曾隨手記過一筆：「牛皮袋一只，川帶走。」',
    '這表示失去位置的紙袋至少曾被阿川本人拿走。它仍不能解釋紙條，但把「有人從印刷行偷走檔案」這個最可怕的想像往後推了一步。',
    '同一行旁邊還寫著一個時間：下午五點，臺北車站。'
  ],choices:[
    {label:'去車站確認',next:'station',fx:{stress:1,composure:1}},
    {label:'先把這條紀錄告訴美惠，再一起決定',next:'waiting_room',fx:{rapport:1}}
  ]},
  quiet_night:{chapter:'第十一章・靜默',location:'臺北・住處',date:'1958 年 12 月',title:'回到自己的房間',text:[
    '你選擇讓今晚停止。回到住處後，街聲慢慢安靜，事情卻沒有跟著消失。',
    '桌上那份你曾抄過的整理規則忽然顯得很實際：不把所有人的名字集中放在一起、不讓未確認的推測進入索引、保留每次修改的理由。',
    '你可以明天再介入，也可以到此為止。這一次，退出不是按下一個結局，而是承認自己也有承受風險的上限。'
  ],choices:[
    {label:'隔天重新加入，但只負責整理與查證',next:'waiting_room',fx:{composure:2}},
    {label:'把方法留下，正式退出這項工作',ending:{title:'結局：界線之外',text:'你沒有把自己留在每一個風險裡。整理方法仍被保留下來，而你回到自己的生活。多年後回想時，你知道退出也曾是一個經過衡量的選擇。'},fx:{composure:2}}
  ]},
  waiting_room:{chapter:'第十二章・等待',location:'臺北・茶行二樓',date:'1958 年 12 月',title:'等待比追逐更難',text:[
    '你們把能聯絡的人都問過一輪，仍沒有阿川的消息。沒有人知道的部分開始比已知的部分更多。',
    '美惠把桌上的線索分成三堆：確認過的、只有一人轉述的、純粹猜測的。當第三堆越來越厚，大家反而稍微冷靜下來。',
    '一小時後，樓下電話響起。是阿川。他說自己人在車站附近，請你們不要再找那只牛皮紙袋。'
  ],choices:[
    {label:'只問他現在是否安全，其他事等見面再談',next:'returning',fx:{rapport:1,composure:1}},
    {label:'追問紙袋在哪裡',next:'returning',fx:{suspicion:1,stress:1}},
    {label:'先用郵件存根確認今天出現的郵務線索是否無關',next:'postal_check',fx:{knowledge:1},requiresItem:'postal_stub',hint:'需要先前取得的郵件存根'}
  ]},
  station:{chapter:'第十二章・車站',location:'臺北・臺北車站',date:'1958 年 12 月',title:'月臺上的背影',text:[
    '車站裡的人比你預想得多。你沒有立刻找到阿川，只看見售票口前不斷移動的雨傘與行李。',
    '幾分鐘後，你在柱子旁看見熟悉的灰外套。阿川正和一名中年男子談話，手上就是那只牛皮紙袋。',
    '他也看見了你，卻只輕輕搖頭。你無法從那個動作判斷他是在叫你離開，還是在叫你不要誤會。'
  ],choices:[
    {label:'不靠近，等阿川自己過來',next:'station_wait',fx:{composure:1}},
    {label:'走到能被他看見的位置，但不插話',next:'station_wait',fx:{stress:1}},
    {label:'先觀察兩人是否真的在交換檔案',next:'station_wait',fx:{insight:1,suspicion:1}}
  ]},
  station_wait:{chapter:'第十二章・車站',location:'臺北・臺北車站',date:'1958 年 12 月',title:'沒有發生的那件事',text:[
    '中年男子最後沒有拿走紙袋。他從裡面抽出自己的幾頁稿紙，向阿川點頭後離開。',
    '阿川這才走向你。他承認牛皮袋裡混進一份別人的投稿，對方幾天來一直要求歸還；阿川怕在印刷行碰面讓事情更複雜，才約在車站。',
    '最可怕的猜測沒有成真。但阿川接著說，窗縫紙條不是那個人寫的。真正的問題仍留著。'
  ],choices:[
    {label:'回去重新檢查紙條本身',next:'note_origin',fx:{knowledge:1,stress:-1}},
    {label:'先問阿川為何沒有把行程告訴任何人',next:'trust_break',fx:{rapport:-1,suspicion:1}},
    {label:'先結束今晚，明天再處理紙條',next:'returning',fx:{composure:1}}
  ]},
  postal_check:{chapter:'第十二章・等待',location:'臺北・茶行二樓',date:'1958 年 12 月',title:'普通證據的價值',text:[
    '你把之前留下的郵件存根找出來，比對日期與地址。今天有人提到的郵務人員和那次錯投事件沒有連續關係。',
    '這沒有讓紙條變得安全，卻又排除了一條容易被想像放大的支線。',
    '電話另一頭，阿川終於說他很快會回來。'
  ],choices:[
    {label:'等他回來再談',next:'returning',fx:{composure:1,knowledge:1}}
  ]},
  trust_break:{chapter:'第十三章・裂縫',location:'臺北・車站外',date:'1958 年 12 月',title:'信任不是沉默',text:[
    '阿川被你的問題問得一怔。他說自己只是不想讓更多人擔心，卻也承認這幾個月他常把「保護別人」當成不解釋的理由。',
    '你忽然看見另一種風險：不是陌生人，而是團隊裡每個人都各自決定什麼可以告訴別人。資訊被切碎後，連朋友也可能把彼此當成最壞的可能。',
    '阿川問你：「那我們還要繼續嗎？」'
  ],choices:[
    {label:'繼續，但建立「失聯與異常狀況」的共同規則',next:'returning',fx:{knowledge:1,rapport:1}},
    {label:'暫停所有新增訪談，只整理既有資料',next:'archive_pause',fx:{composure:2}},
    {label:'告訴他自己不再接受被排除在重要資訊之外',next:'returning',fx:{rep:1,rapport:-1}}
  ]},
  returning:{chapter:'第十三章・回返',location:'臺北・印刷行',date:'1958 年 12 月',title:'門外的腳步',text:[
    '你們回到印刷行時已接近打烊。周老闆剛把門板裝上一半，外頭便有人敲門。',
    '來者是一名附近學校的職員，說校方正在清點曾委託民間印刷的刊物，想確認幾筆舊帳。周老闆認得他，卻仍明顯緊張。',
    '這件事本身可能完全正常；但在今晚，每個普通問題都像會把另一個問題帶進來。'
  ],choices:[
    {label:'只拿出與學校委託直接相關的帳目',next:'inspection',fx:{composure:1}},
    {label:'請對方明天白天再來，今晚不再翻資料',next:'after_knock',fx:{stress:1}},
    {label:'依公文與帳目習慣逐項確認對方要查的範圍',next:'inspection',fx:{knowledge:1},onlyRole:'clerk'},
    {label:'先確認周老闆是否認得對方，再決定怎麼談',next:'inspection',fx:{insight:1},onlyRole:'veteran'}
  ]},
  inspection:{chapter:'第十三章・回返',location:'臺北・印刷行',date:'1958 年 12 月',title:'只回答眼前的問題',text:[
    '職員核對的是學校刊物的數量、日期與紙張費用。他沒有問阿川，也沒有要求看後間。',
    '你們照著帳目回答。十幾分鐘後，他收起本子離開。直到腳步聲消失，周老闆才發現自己一直抓著桌沿。',
    '今晚第二次，最壞的猜測沒有成真。但真正的紙條來源仍然沒有答案。'
  ],choices:[
    {label:'現在才回頭處理那張紙條',next:'note_origin',fx:{composure:1}},
    {label:'承認大家已經太緊繃，先暫停一段時間',next:'archive_pause',fx:{stress:-2,composure:1}}
  ]},
  after_knock:{chapter:'第十三章・回返',location:'臺北・印刷行',date:'1958 年 12 月',title:'延後，不等於逃避',text:[
    '周老闆請對方明天下午再來，理由只是帳本已經收進櫃子。對方沒有爭辯，約好時間便離開。',
    '門重新關上後，阿川反而鬆了一口氣。你們約好明天由周老闆自己處理學校帳務，不把訪談檔案和普通生意混在一起。',
    '這個決定沒有解決所有問題，卻讓界線重新變得清楚。'
  ],choices:[
    {label:'回頭找紙條來源',next:'note_origin',fx:{knowledge:1}},
    {label:'先把檔案整理工作暫停一週',next:'archive_pause',fx:{composure:1}}
  ]},
  archive_pause:{chapter:'第十四章・停筆',location:'臺北・茶行',date:'1959 年 1 月',title:'暫停之後',text:[
    '你們真的停了一段時間。沒有新增訪談，也沒有再四處追線索，只把既有資料的來源、同意範圍與可辨識資訊重新核對。',
    '停下來後，很多問題反而更清楚：哪些內容值得保存、哪些名字其實沒有留下的必要、哪些決定應該交還給說話的人。',
    '新年過後，阿川問你是否願意讓這項工作以更慢、更小心的方式重新開始。'
  ],choices:[
    {label:'重新開始，但把「徵詢本人」放在蒐集之前',next:'final_choice',fx:{rep:2,rapport:1}},
    {label:'只完成現有檔案，不再新增內容',next:'final_choice',fx:{composure:2}},
    {label:'到這裡結束自己的參與',ending:{title:'結局：停筆之後',text:'你沒有等到所有謎團都有答案。留下的資料被整理到足以讓別人理解，也被限制到不必讓每個人承擔被記錄的代價。你選擇在一個可接受的位置停下。'},fx:{composure:2}}
  ]},
  note_origin:{chapter:'第十四章・紙條',location:'臺北・茶行',date:'1959 年 1 月',title:'寫紙條的人',text:[
    '幾天後，紙條的來源自己出現了。寫紙條的是曾接受阿川訪談的一名青年，他從朋友口中聽說資料正在被重新整理，卻不知道自己的內容是否仍保留。',
    '他不敢直接署名，只想確認「還有誰看過」。他的恐懼不是證明有人正在追查你們，而是證明你們過去沒有讓受訪者清楚知道資料會怎麼流動。',
    '紙條帶來的緊張沒有白費：它暴露了一個比陰謀更普通、也更真實的漏洞。'
  ],choices:[
    {label:'讓他親自確認自己的資料與同意範圍',next:'final_choice',fx:{rep:2,rapport:2}},
    {label:'依他的要求刪除全部可辨識資訊',next:'final_choice',fx:{composure:1,rep:1}},
    {label:'用家庭與日常風險重新檢查所有受訪者資料',next:'final_choice',fx:{rapport:1},requiresItem:'family_note',hint:'需要秋月家的藥費單作為提醒'}
  ]},
  missing_envelope:{chapter:'第十一章・紙袋',location:'臺北・印刷行',date:'1958 年 12 月',title:'不在原位的牛皮袋',text:[
    '你們把後間翻過一遍，沒有發現破壞或被強行開啟的痕跡。牛皮袋只是從固定位置消失了。',
    '美惠想起阿川前幾天曾說要把一份混進來的投稿還給原作者，但沒說哪一天。',
    '這個記憶讓車站時刻抄本忽然有了可能的解釋。'
  ],choices:[
    {label:'去車站確認阿川是否在那裡',next:'station',fx:{stress:1}},
    {label:'留在茶行等他聯絡',next:'waiting_room',fx:{composure:1}}
  ]},
  final_choice:{chapter:'第十五章・霧外',location:'臺北・印刷行',date:'1959 年 1 月',title:'不是答案，而是方法',text:[
    '跨過年後，你們把這幾個月的錯誤也寫進整理規則：誰能接觸、如何徵詢同意、如何處理失聯、如何標示未確認資訊，以及何時應該停止。',
    '你終於明白，真正讓人緊張的從來不只是外在環境。資訊不完整、朋友之間的沉默、自己的猜測，也都會把選擇推向不同方向。',
    '接下來沒有一條路能保證最好。你只能決定，自己願意承擔哪一種責任。'
  ],choices:[
    {label:'留下來，專門負責查證與受訪者同意',ending:{title:'結局：守門的人',text:'你沒有追求保存最多，而是讓每一份留下來的資料都有來源、界線與可以被撤回的理由。這項工作因此變慢，卻也更像是與人共同完成，而不是替人決定。'},fx:{rep:3,knowledge:1}},
    {label:'把方法交給更多可信任的協作者，自己退出核心工作',ending:{title:'結局：把方法留下',text:'你沒有成為檔案的主人。你留下的是一套能被別人質疑、修正與繼續使用的方法，然後回到自己的生活。'},fx:{composure:2,rep:1}},
    {label:'只保存已取得明確同意的內容，其餘全部停止整理',ending:{title:'結局：少一點，也完整一點',text:'最後留下的資料比原本少得多，但每一份都更清楚知道自己為何被保存。你接受歷史會因此留下空白，也接受空白有時是一種尊重。'},fx:{composure:2,rapport:2}}
  ]}
};
function core(){try{return JSON.parse(localStorage.getItem(CORE_KEY)||'null')}catch(_){return null}}
function saveCore(c){try{localStorage.setItem(CORE_KEY,JSON.stringify(c))}catch(_){}}
function exp(){try{return JSON.parse(localStorage.getItem(EXP_KEY)||'null')}catch(_){return null}}
function saveExp(s){try{localStorage.setItem(EXP_KEY,JSON.stringify(s))}catch(_){}}
function role(){return roleByLabel[document.getElementById('playerBg')?.textContent.trim()]||'student'}
function hasItem(id){const c=core();return !!c?.inventory?.includes(id)}
function toast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window.__expToast);window.__expToast=setTimeout(()=>t.classList.remove('show'),2300)}
function applyFx(fx={}){
  const s=exp()||{};s.delta=s.delta||{};
  const c=core();
  for(const [k,v] of Object.entries(fx)){s.delta[k]=(s.delta[k]||0)+v;if(c){if(['stress','rep','suspicion'].includes(k))c[k]=Math.max(0,Math.min(99,(c[k]||0)+v));else if(c.attributes&&k in c.attributes)c.attributes[k]=Math.max(0,Math.min(20,(c.attributes[k]||0)+v));}}
  if(c)saveCore(c);saveExp(s);renderStats();
  const labels={stress:'壓力',rep:'聲望',suspicion:'疑心',insight:'觀察',knowledge:'知識',composure:'沉著',rapport:'人情'};
  const bits=Object.entries(fx).filter(([,v])=>v).map(([k,v])=>`${labels[k]||k} ${v>0?'+':''}${v}`);
  if(bits.length)toast(bits.join('・'));
}
function renderStats(){
  const c=core();if(!c)return;
  const map={stress:'stress',rep:'rep',suspicion:'suspicion'};for(const [k,id] of Object.entries(map)){const el=document.getElementById(id);if(el)el.textContent=c[k]??0}
  const a=document.getElementById('attributeBar');if(a&&c.attributes)a.innerHTML=`<span>觀察 <b>${c.attributes.insight||0}</b></span><span>知識 <b>${c.attributes.knowledge||0}</b></span><span>沉著 <b>${c.attributes.composure||0}</b></span><span>人情 <b>${c.attributes.rapport||0}</b></span>`;
}
function visibleChoice(ch){return !ch.onlyRole||ch.onlyRole===role()}
function makeButton(ch){
  const b=document.createElement('button');b.className='choice-btn';
  const ok=!ch.requiresItem||hasItem(ch.requiresItem);if(!ok){b.classList.add('locked');b.disabled=true}
  b.innerHTML=`<strong>${ch.label}</strong>${!ok&&ch.hint?`<small>${ch.hint}</small>`:''}`;
  b.addEventListener('click',()=>choose(ch));return b
}
function renderNode(id){
  const n=scenes[id];if(!n)return;const s=exp()||{active:true};s.active=true;s.node=id;s.ending=null;saveExp(s);
  document.getElementById('startScreen')?.classList.add('hidden');document.getElementById('endingScreen')?.classList.add('hidden');document.getElementById('gameScreen')?.classList.remove('hidden');
  const set=(x,v)=>{const e=document.getElementById(x);if(e)e.textContent=v};set('chapter',n.chapter);set('location',n.location);set('sceneDate',n.date);set('sceneTitle',n.title);
  const text=document.getElementById('sceneText');if(text)text.innerHTML=n.text.map(p=>`<p>${p}</p>`).join('');
  const choices=document.getElementById('choices');if(choices){choices.innerHTML='';n.choices.filter(visibleChoice).forEach(ch=>choices.appendChild(makeButton(ch)))}
  renderStats();window.scrollTo({top:0,behavior:'smooth'});
}
function renderEnding(end){
  const s=exp()||{};s.active=true;s.ending=end;s.node=null;saveExp(s);
  document.getElementById('gameScreen')?.classList.add('hidden');document.getElementById('startScreen')?.classList.add('hidden');document.getElementById('endingScreen')?.classList.remove('hidden');
  const title=document.getElementById('endingTitle'),text=document.getElementById('endingText'),stats=document.getElementById('endingStats'),c=core();
  if(title)title.textContent=end.title;if(text)text.textContent=end.text;if(stats&&c)stats.innerHTML=`<span>壓力<b>${c.stress||0}</b></span><span>聲望<b>${c.rep||0}</b></span><span>疑心<b>${c.suspicion||0}</b></span>`;
  window.scrollTo({top:0,behavior:'smooth'});
}
function choose(ch){if(ch.fx)applyFx(ch.fx);if(ch.ending)return renderEnding(ch.ending);renderNode(ch.next)}
function offerExpansion(){
  const title=document.getElementById('sceneTitle')?.textContent.trim();if(title!==START_TITLE)return;
  const s=exp();if(s?.active){if(s.ending)renderEnding(s.ending);else if(s.node)renderNode(s.node);return}
  const choices=document.getElementById('choices');if(!choices||choices.dataset.expOffer==='1')return;choices.dataset.expOffer='1';choices.innerHTML='';
  const a=document.createElement('button');a.className='choice-btn';a.innerHTML='<strong>繼續協助整理，看看冬天之後發生了什麼</strong><small>進入新增章節</small>';a.onclick=()=>{saveExp({active:true,node:'winter_window',delta:{}});renderNode('winter_window')};
  const b=document.createElement('button');b.className='choice-btn';b.innerHTML='<strong>把方法交給阿川，但先不要立刻離開</strong><small>新增支線</small>';b.onclick=()=>{saveExp({active:true,node:'quiet_night',delta:{}});renderNode('quiet_night')};
  choices.append(a,b);
}
function maybeRestore(){
  const title=document.getElementById('sceneTitle')?.textContent.trim();
  if(title==='一封沒有署名的信'){localStorage.removeItem(EXP_KEY);return}
  const s=exp();
  if(s?.active){
    if(s.ending){
      const endingVisible=!document.getElementById('endingScreen')?.classList.contains('hidden');
      if(!endingVisible||document.getElementById('endingTitle')?.textContent.trim()!==s.ending.title)renderEnding(s.ending);
      return;
    }
    if(s.node&&scenes[s.node]){
      const gameVisible=!document.getElementById('gameScreen')?.classList.contains('hidden');
      if(!gameVisible||title!==scenes[s.node].title)renderNode(s.node);
      else renderStats();
      return;
    }
  }
  offerExpansion();
}
window.addEventListener('DOMContentLoaded',()=>{
  const game=document.getElementById('gameScreen'),saveBtn=document.getElementById('saveBtn'),menuSave=document.getElementById('menuSave'),restart=document.getElementById('restartBtn'),menuRestart=document.getElementById('menuRestart'),again=document.getElementById('againBtn');
  let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;maybeRestore()})};
  if(game)new MutationObserver(schedule).observe(game,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  const protectSave=e=>{const s=exp();if(!s?.active)return;e.stopImmediatePropagation();e.preventDefault();saveExp(s);toast('擴充章節進度已自動保存')};
  saveBtn?.addEventListener('click',protectSave,true);menuSave?.addEventListener('click',protectSave,true);
  const clearIfStart=()=>setTimeout(()=>{if(!document.getElementById('startScreen')?.classList.contains('hidden'))localStorage.removeItem(EXP_KEY)},0);
  restart?.addEventListener('click',clearIfStart);menuRestart?.addEventListener('click',clearIfStart);again?.addEventListener('click',()=>{localStorage.removeItem(EXP_KEY)});
  schedule();
});
})();