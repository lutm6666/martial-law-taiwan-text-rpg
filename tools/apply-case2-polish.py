from pathlib import Path
import re

path = Path('case2-engine.js')
text = path.read_text(encoding='utf-8')
original = text

# 1) Before a statement has been pressed, show only one full-width Press button.
old_actions = "html+='<div class=\"c2-actions\"><button type=\"button\" data-press=\"'+st.id+'\" class=\"primaryish\">'+(s.pressed[st.id]?'再次確認':'追問')+'</button>'+(s.pressed[st.id]?'<button type=\"button\" data-present=\"'+st.id+'\">提出證物</button>':'<button type=\"button\" disabled>先追問</button>')+'</div>';"
new_actions = "html+='<div class=\"c2-actions'+(s.pressed[st.id]?'':' single')+'\"><button type=\"button\" data-press=\"'+st.id+'\" class=\"primaryish\">'+(s.pressed[st.id]?'再次確認':'追問')+'</button>'+(s.pressed[st.id]?'<button type=\"button\" data-present=\"'+st.id+'\">提出證物</button>':'')+'</div>';"
if old_actions in text:
    text = text.replace(old_actions, new_actions, 1)
elif 'disabled>先追問</button>' in text:
    raise SystemExit('case2 polish: testimony action markup changed unexpectedly')

# 2) Make the single-action layout span the available mobile width. This step
# must be idempotent: an earlier implementation matched the base .c2-actions
# rule on every deployment and kept appending the same .single rule, causing
# case2-engine.js to grow indefinitely. Collapse any historical duplicates,
# then add the rule only if it is missing.
base_actions_rule = '.c2-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}'
single_actions_rule = '.c2-actions.single{grid-template-columns:1fr}'
text = re.sub(r'(?:' + re.escape(single_actions_rule) + r')+', single_actions_rule, text)
if single_actions_rule not in text:
    text = text.replace(base_actions_rule, base_actions_rule + single_actions_rule, 1)

media_old = '@media(min-width:640px){.c2-actions{grid-template-columns:160px 160px}.c2-statement-list{gap:10px}}'
media_new = '@media(min-width:640px){.c2-actions{grid-template-columns:160px 160px}.c2-actions.single{grid-template-columns:minmax(0,320px)}.c2-statement-list{gap:10px}}'
if media_new not in text:
    text = text.replace(media_old, media_new, 1)

# 3) Add a mobile horizontal Case 1 visual recap to Records. These are context art,
# not evidence, so the UI says so explicitly and they never enter s.evidence.
recap_css = (
    '.c2-recap-note{margin:8px 0 10px;color:#969386;font-size:.72rem;line-height:1.55}'
    '.c2-recap-strip{display:flex;gap:10px;overflow-x:auto;padding:2px 1px 9px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}'
    '.c2-recap-card{flex:0 0 min(82vw,360px);scroll-snap-align:start;border:1px solid #36392f;border-radius:13px;overflow:hidden;background:#151713}'
    '.c2-recap-card img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#0f100e}'
    '.c2-recap-caption{padding:9px 10px 10px}'
    '.c2-recap-caption strong{display:block;font-size:.8rem;color:#ddd7c8}'
    '.c2-recap-caption small{display:block;margin-top:3px;color:#908d80;line-height:1.45}'
)
if recap_css not in text:
    text = text.replace('.c2-final{padding:17px}', recap_css + '.c2-final{padding:17px}', 1)

new_record = r'''function renderRecord(){
 var box=$('c2Record'),html='<p class="c2-panel-title">案件紀錄</p><article class="section-card card"><h3>證物與情報</h3><div class="c2-record-grid">';
 s.evidence.forEach(function(id){var e=evidence[id];if(e)html+='<div class="c2-record"><strong>'+esc(e.name)+'</strong><small>'+esc(e.desc)+'</small><span class="c2-type">'+esc(e.type)+'</span></div>'});
 html+='</div></article><article class="section-card card" style="margin-top:11px"><h3>目前知道的人</h3><div class="c2-record-grid">';
 s.people.forEach(function(id){var p=people[id];if(!p)return;var desc=p.desc;if(id==='qiuyue'&&s.flags.qContact)desc='美惠已替你轉達。秋月願意親自說明：她當時允許保留什麼，又沒有允許什麼。';html+='<div class="c2-record"><strong>'+esc(p.name)+'</strong><small>'+esc(desc)+'</small></div>'});
 html+='</div></article>';
 html+='<article class="section-card card" style="margin-top:11px"><h3>案件一回顧</h3><p class="c2-recap-note">情境重構・非證物。這些場景圖只幫助回想第一案的調查路線，不會新增線索，也不能直接拿來反駁證詞。</p><div class="c2-recap-strip">'
  +'<figure class="c2-recap-card"><img src="assets/case1/tea.webp?v=6" loading="lazy" alt="案件一茶行情境重構"><figcaption class="c2-recap-caption"><strong>茶行</strong><small>缺頁最初被發現的地方。</small></figcaption></figure>'
  +'<figure class="c2-recap-card"><img src="assets/case1/print.webp?v=6" loading="lazy" alt="案件一印刷行情境重構"><figcaption class="c2-recap-caption"><strong>印刷行</strong><small>借用簿與廢紙去向把調查帶往市場。</small></figcaption></figure>'
  +'<figure class="c2-recap-card"><img src="assets/case1/market.webp?v=6" loading="lazy" alt="案件一市場情境重構"><figcaption class="c2-recap-caption"><strong>市場</strong><small>紙張流向與市場端的交接線索在這裡接上。</small></figcaption></figure>'
  +'<figure class="c2-recap-card"><img src="assets/case1/bookstall.webp?v=6" loading="lazy" alt="案件一舊書攤情境重構"><figcaption class="c2-recap-caption"><strong>舊書攤</strong><small>三頁筆記最後從書堆中被找回。</small></figcaption></figure>'
  +'</div></article>';
 box.innerHTML=html;
}

function renderFinal'''
text, count = re.subn(r'function renderRecord\(\)\{.*?\n\nfunction renderFinal', new_record, text, count=1, flags=re.S)
if count != 1 and '案件一回顧' not in text:
    raise SystemExit('case2 polish: renderRecord marker not found')

# 4) Keep the in-engine build label aligned with the production hook.
text = text.replace("BUILD 5.0・CASE 02", "BUILD 5.1・CASE 02")
text = text.replace("BUILD 5.0.1・CASE 02", "BUILD 5.1・CASE 02")

if text == original:
    print('Case 2 polish already applied; no changes.')
else:
    path.write_text(text, encoding='utf-8')
    print('Applied idempotent Case 2 testimony UI polish and Case 1 visual recap.')
