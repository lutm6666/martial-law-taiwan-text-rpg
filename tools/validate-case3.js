/* Static/data validation for Case 3.
 * Run with: node tools/validate-case3.js
 */
'use strict';

const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const storage={};
const context={
  console,
  localStorage:{
    getItem:k=>Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:null,
    setItem:(k,v)=>{storage[k]=String(v)},
    removeItem:k=>{delete storage[k]}
  }
};
context.window=context;
vm.createContext(context);

function load(file){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
load('case3-film-canon.js');
load('case3-film-engine.js');

const C=context.CASE3_FILM_CANON;
const E=context.Case3FilmEngine;
const errors=[];
const warnings=[];

function err(msg){errors.push(msg)}
function warn(msg){warnings.push(msg)}
function keys(o){return Object.keys(o||{})}
function exists(o,id){return !!(o&&Object.prototype.hasOwnProperty.call(o,id))}
function expect(cond,msg){if(!cond)err(msg)}

expect(C&&typeof C==='object','CASE3_FILM_CANON missing');
expect(E&&typeof E==='object','Case3FilmEngine missing');
if(!C||!E){
  console.error(errors.join('\n'));
  process.exit(1);
}

['locations','people','evidence','conclusions','testimonies','hypotheses','predicates','actions','frameAnalysis','deductions','endings']
  .forEach(k=>expect(C[k]!=null,'canon.'+k+' missing'));

expect(C.saveKey==='mist-taiwan-case3-film-v1','unexpected Case 3 save key: '+C.saveKey);
expect(C.saveKey!=='mist-taiwan-case-save-v4','Case 3 collides with Case 1 save key');
expect(C.saveKey!=='mist-taiwan-rain-canon-v1','Case 3 collides with Case 2 save key');

const fresh=E.fresh('validator');
const flagKeys=keys(fresh.flags), keyKeys=keys(fresh.keys);

const allowedEffects=new Set(['gain','conclude','testimony','unlock','flag','key','mechanic']);
const allowedMechanics=new Set(['frame_compare']);

function parseEffect(effect){
  const parts=String(effect).split(':');
  return {kind:parts.shift(),id:parts.join(':')};
}

keys(C.actions).forEach(id=>{
  const a=C.actions[id];
  expect(a&&typeof a==='object','action '+id+' invalid');
  if(!a)return;
  expect(exists(C.locations,a.location),'action '+id+' references unknown location '+a.location);
  expect(typeof a.label==='string'&&a.label.trim(),'action '+id+' missing label');
  expect(typeof a.hint==='string'&&a.hint.trim(),'action '+id+' missing hint');
  expect(typeof a.result==='string'&&a.result.trim(),'action '+id+' missing player-visible result narrative');
  if(a.requires) expect(typeof C.predicates[a.requires]==='function','action '+id+' references unknown predicate '+a.requires);
  expect(Array.isArray(a.effects),'action '+id+' effects must be an array');
  (a.effects||[]).forEach(effect=>{
    const p=parseEffect(effect);
    expect(allowedEffects.has(p.kind),'action '+id+' has unknown effect kind '+p.kind);
    if(p.kind==='gain')expect(exists(C.evidence,p.id),'action '+id+' gains unknown evidence '+p.id);
    if(p.kind==='conclude')expect(exists(C.conclusions,p.id),'action '+id+' concludes unknown conclusion '+p.id);
    if(p.kind==='testimony')expect(exists(C.testimonies,p.id),'action '+id+' adds unknown testimony '+p.id);
    if(p.kind==='unlock')expect(exists(C.locations,p.id),'action '+id+' unlocks unknown location '+p.id);
    if(p.kind==='flag')expect(flagKeys.includes(p.id),'action '+id+' writes unknown flag '+p.id);
    if(p.kind==='key')expect(keyKeys.includes(p.id),'action '+id+' writes unknown key '+p.id);
    if(p.kind==='mechanic')expect(allowedMechanics.has(p.id),'action '+id+' opens unknown mechanic '+p.id);
  });
});

keys(C.conclusions).forEach(id=>{
  const c=C.conclusions[id],r=(c&&c.requires)||{};
  (r.evidence||[]).forEach(x=>expect(exists(C.evidence,x),'conclusion '+id+' requires unknown evidence '+x));
  (r.conclusions||[]).forEach(x=>expect(exists(C.conclusions,x),'conclusion '+id+' requires unknown conclusion '+x));
  (r.frame||[]).forEach(x=>expect(exists(C.frameAnalysis.categories,x),'conclusion '+id+' requires unknown frame category '+x));
});

const visiting=new Set(),visited=new Set();
function visitConclusion(id){
  if(visited.has(id))return;
  if(visiting.has(id)){err('conclusion dependency cycle detected at '+id);return}
  visiting.add(id);
  const deps=(((C.conclusions[id]||{}).requires||{}).conclusions)||[];
  deps.forEach(visitConclusion);
  visiting.delete(id);visited.add(id);
}
keys(C.conclusions).forEach(visitConclusion);

const frameReq=C.frameAnalysis.completeRequires||[];
frameReq.forEach(x=>expect(exists(C.frameAnalysis.categories,x),'frameAnalysis.completeRequires unknown category '+x));
(C.frameAnalysis.onComplete||[]).forEach(effect=>{
  const p=parseEffect(effect);
  expect(p.kind==='conclude'&&exists(C.conclusions,p.id),'frameAnalysis.onComplete invalid effect '+effect);
});

const deductionIds=new Set();
(C.deductions||[]).forEach((q,i)=>{
  expect(q&&typeof q.id==='string','deduction #'+(i+1)+' missing id');
  if(q&&q.id){
    expect(!deductionIds.has(q.id),'duplicate deduction id '+q.id);
    deductionIds.add(q.id);
  }
  expect(q&&typeof q.question==='string'&&q.question.trim(),'deduction '+(q&&q.id||i)+' missing question');
  expect(q&&typeof q.correct==='string'&&q.correct.trim(),'deduction '+(q&&q.id||i)+' missing correct text');
});
expect(C.deductions.length===6,'Case 3 should have exactly six final deduction questions');

['image_literalism','overcorrection','forced_origin','evidence_boundary']
  .forEach(id=>expect(exists(C.endings,id),'missing ending '+id));

const evidenceIds=keys(C.evidence);
for(let i=1;i<=10;i++){
  const id='E'+String(i).padStart(2,'0');
  expect(evidenceIds.includes(id),'missing core evidence '+id);
}
expect(C.evidence.E10&&C.evidence.E10.name==='舊零片中的單格負片','E10 unverified name changed');
expect(C.evidence.E10&&C.evidence.E10.verifiedName==='A-217 第 13 格原片','E10 verified name changed');

const banned=[
  /秘密交接/,
  /失竊底片/,
  /遭剪除/,
  /謠言來源/,
  /可疑妹妹/,
  /秀蓮的秘密/,
  /證明只是送貨/,
  /查明袋內內容/,
  /質問剪片者/,
  /搜索藏匿底片/,
  /被秀蓮藏/
];
function lintPublicText(scope,text){
  if(typeof text!=='string')return;
  banned.forEach(rx=>{if(rx.test(text))err('spoiler-prone UI text in '+scope+': '+text)});
}
keys(C.locations).forEach(id=>{
  expect(typeof C.locations[id].intro==='string'&&C.locations[id].intro.trim(),'location '+id+' missing intro narrative');
  lintPublicText('location '+id+' name',C.locations[id].name);
  lintPublicText('location '+id+' sub',C.locations[id].sub);
  lintPublicText('location '+id+' intro',C.locations[id].intro);
});
keys(C.actions).forEach(id=>{
  lintPublicText('action '+id+' label',C.actions[id].label);
  lintPublicText('action '+id+' hint',C.actions[id].hint);
  lintPublicText('action '+id+' result',C.actions[id].result);
});
keys(C.evidence).forEach(id=>{
  lintPublicText('evidence '+id+' name',C.evidence[id].name);
  if(C.evidence[id].verifiedName) lintPublicText('evidence '+id+' verifiedName',C.evidence[id].verifiedName);
});

const initialActions=E.availableActions(fresh).map(a=>a.label);
if(initialActions.includes('查看店務紀錄'))err('duty record is visible before Xiulian lead');
if(initialActions.includes('詢問單格底片如何處理'))err('loose-film procedure is visible before missing-window/access evidence');

if(warnings.length){
  warnings.forEach(x=>console.warn('WARN '+x));
}
if(errors.length){
  errors.forEach(x=>console.error('FAIL '+x));
  console.error('FAIL Case 3 validation: '+errors.length+' issue(s)');
  process.exit(1);
}
console.log('PASS Case 3 schema/reference validation');
console.log('PASS Case 3 narrative completeness');
console.log('PASS Case 3 anti-spoiler UI lint');
console.log('PASS Case 3 save-key isolation checks');
