'use strict';

// Issue text is an untrusted planning hint. PR paths, not this result, determine
// reviewer requirements and the owner approval gate.
const TEMPLATE_HEADINGS = new Set([
  'workstream',
  'area',
  'goal',
  'relevant files / scope',
  'scope',
  'acceptance criteria',
  'constraints / canon notes',
  'constraints',
  '限制',
]);
const CONSTRAINT_HEADINGS = new Set(['constraints / canon notes', 'constraints', '限制']);

const PATTERNS = {
  control: /\b(?:workflow|workflows|ruleset|rulesets|governance|control|policy|policies|guard|codeowners|ci|github actions|branch protection|required checks|permissions?|approval|security)\b|\brepository admin settings\b|工作流程|控制層|守門|規則集|治理|政策|權限|安全|核准|審批|分支保護/u,
  canon: /\b(?:canon|canonical|schema|schemas|predicate|predicates|deduction|testimony|hypothesis|hypotheses)\b|正典|案件設定|資料結構|證據鏈|證詞|推理條件|假說/u,
  engine: /\b(?:engine|state machine|state transition|game state|save state|quest state|battle state|combat state|save|saves|migration|migrations|logic)\b|引擎|狀態機|狀態轉換|存檔|遷移|遊戲邏輯/u,
  ui: /\b(?:ui|frontend|front end|css|scss|html|responsive|accessibility|a11y|layout|animation|animations|renderer|mobile|safari|typography|display|buttons?)\b|介面|前端|排版|版面|視覺|響應式|行動版|手機|無障礙|動畫|畫面|顯示|渲染|可讀性|按鈕|字體|樣式|玩家呈現/u,
  assets: /\b(?:asset|assets|image|images|sprite|sprites|art|artwork|illustration|illustrations|portrait|portraits|webp|png|jpeg|jpg|svg|icon|icons)\b|圖片|圖像|素材|美術|插圖|立繪|肖像|證物圖|場景圖/u,
  tier1: /\b(?:test|tests|validator|validators|validation|docs|documentation|readme|regression|smoke)\b|測試|驗證器|驗證腳本|文件|文檔|說明文件|回歸測試/u,
  mixed: /\b(?:mixed|cross boundary|handoff)\b|混合|跨界|跨領域|交接/u,
};

function issueText(title, body) {
  const lines = (typeof body === 'string' ? body : '').split(/\r?\n/);
  const included = [];
  let inConstraints = false;
  for (const line of lines) {
    const heading = /^\s*#{1,6}\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const name = heading[1].normalize('NFKC').trim().toLowerCase();
      if (TEMPLATE_HEADINGS.has(name)) {
        inConstraints = CONSTRAINT_HEADINGS.has(name);
        continue;
      }
      inConstraints = false;
    }
    // Exclusions such as "do not change engine" are not requested work, while
    // positive constraints can still add a real cross-boundary requirement.
    const exclusion = /^\s*(?:(?:[-*+]|\d+[.)])\s+)?(?:\[[ xX]\]\s*)?(?:do not|don't|avoid|never|keep\b.*\bunchanged|不得|不要|請勿|勿|避免)/i.test(line);
    if (!inConstraints || !exclusion) included.push(line);
  }
  return ((typeof title === 'string' ? title : '') + '\n' + included.join('\n'))
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[_./\\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function routeIssue({title, body} = {}) {
  const text = issueText(title, body);
  const signals = Object.entries(PATTERNS)
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name);
  const has = name => signals.includes(name);
  const logic = has('control') || has('canon') || has('engine');
  const presentation = has('ui') || has('assets');

  if (has('mixed') || (logic && presentation)) {
    return {
      agent: 'handoff', primary: 'codex', tier: 3, area: 'area:logic',
      reason: 'Issue spans logic/control and presentation, or explicitly requests handoff.', signals,
    };
  }
  if (has('control')) {
    return {
      agent: 'codex', primary: 'codex', tier: 3, area: 'area:admin',
      reason: 'Issue describes workflow, policy, or governance changes.', signals,
    };
  }
  if (has('canon') || has('engine')) {
    return {
      agent: 'codex', primary: 'codex', tier: 3, area: 'area:logic',
      reason: 'Issue describes Canon or engine changes.', signals,
    };
  }
  if (presentation) {
    return {
      agent: 'claude', primary: 'claude', tier: 2,
      area: has('ui') ? 'area:ui' : 'area:art',
      reason: 'Issue describes UI or asset changes.', signals,
    };
  }
  if (has('tier1')) {
    return {
      agent: 'codex', primary: 'codex', tier: 1, area: 'area:logic',
      reason: 'Issue describes tests, validators, or documentation only.', signals,
    };
  }
  return {
    agent: 'handoff', primary: null, tier: 3, area: 'area:logic',
    reason: 'Issue scope is not clear enough to assign safely.', signals,
  };
}

module.exports = {routeIssue};
