/* Case 3 state-engine regression tests.
 * Run with: node tools/test-case3-engine.js
 */
'use strict';

const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
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
vm.runInContext(fs.readFileSync(path.join(root,'case3-film-canon.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'case3-film-engine.js'),'utf8'),context);
const C=context.CASE3_FILM_CANON,E=context.Case3FilmEngine;

function go(s,loc){let r=E.travel(s,loc);assert(r.ok,'travel '+loc+' failed: '+r.reason);return r.state}
function act(s,id){let r=E.runAction(s,id);assert(r.ok,'action '+id+' failed: '+r.reason);return r.state}
function frames(s){
 ['personMovement','movingObject','fixedBackground'].forEach(k=>{
  let r=E.observeFrame(s,k);assert(r.ok,'frame '+k+' failed');
 });
 return s;
}
function has(a,x){return a.indexOf(x)>=0}
function opening(s){s=act(s,'studio_opening');assert(has(s.unlocked,'darkroom')&&has(s.unlocked,'alley')&&has(s.unlocked,'newsstand'));assert.strictEqual(s.lastAction,'studio_opening');return s}
function b084(s){
 s=go(s,'newsstand');
 assert(!E.availableActions(s).some(a=>a.id==='newsstand_xiulian'),'newsstand follow-up leaked before viewing B-084');
 s=act(s,'newsstand_visit');
 assert(E.availableActions(s).some(a=>a.id==='newsstand_xiulian'),'newsstand follow-up did not unlock after viewing B-084');
 s=act(s,'newsstand_xiulian');
 s=go(s,'studio');s=act(s,'studio_b084_ledger');return s;
}
function supplier(s){
 s=go(s,'supplier');s=act(s,'supplier_trace');s=go(s,'studio');s=act(s,'studio_receiving');return s;
}
function accessAndRecovery(s){
 s=go(s,'studio');
 if(!s.actionsDone.studio_duty)s=act(s,'studio_duty');
 if(!s.actionsDone.studio_loose_procedure)s=act(s,'studio_loose_procedure');
 assert(C.predicates.canSearchLooseFilms(s),'loose-film search should be available');
 s=act(s,'studio_loose_search');
 assert.strictEqual(E.evidenceView(s,'E10').name,'舊零片中的單格負片','E10 leaked identity before verification');
 s=act(s,'studio_verify_e10');
 assert.strictEqual(E.evidenceView(s,'E10').name,'A-217 第 13 格原片','E10 did not rename after verification');
 s=go(s,'chen_home');s=act(s,'chen_final');
 assert(s.flags.xiulianAdmission,'Xiulian admission missing');
 assert(C.predicates.canStartDeduction(s),'deduction should unlock');
 return s;
}

function routeA(){
 let s=opening(E.fresh('A'));
 s=go(s,'darkroom');s=act(s,'darkroom_workflow');
 s=go(s,'alley');s=act(s,'alley_frames');s=frames(s);
 s=b084(s);
 assert(has(s.unlocked,'supplier'),'supplier not unlocked after continuity + mark');
 s=supplier(s);
 s=go(s,'chen_home');s=act(s,'chen_first');
 return accessAndRecovery(s);
}

function routeB(){
 let s=opening(E.fresh('B'));
 s=b084(s);
 s=go(s,'chen_home');s=act(s,'chen_first');
 assert(!has(s.unlocked,'supplier'),'supplier leaked before frame continuity');
 s=go(s,'darkroom');s=act(s,'darkroom_workflow');
 s=go(s,'alley');s=act(s,'alley_frames');s=frames(s);
 assert(has(s.unlocked,'supplier'),'supplier failed to unlock after delayed continuity');
 s=supplier(s);
 return accessAndRecovery(s);
}

function routeC(){
 let s=opening(E.fresh('C'));
 s=go(s,'darkroom');s=act(s,'darkroom_workflow');
 s=go(s,'alley');s=act(s,'alley_frames');s=frames(s);
 assert(!has(s.unlocked,'supplier'),'supplier leaked without package mark');
 s=b084(s);
 assert(has(s.unlocked,'supplier'),'supplier failed after package mark');
 s=supplier(s);
 s=go(s,'chen_home');s=act(s,'chen_first');
 return accessAndRecovery(s);
}

function negativeChecks(){
 let s=opening(E.fresh('N'));
 assert(!C.predicates.canTracePackage(s),'package tracing available too early');
 // Fresh state must not contain hypotheses until the player creates one.
 let n=E.fresh('H');assert.deepStrictEqual(Object.keys(n.hypotheses),[]);
 assert(!E.availableActions(s).some(a=>a.label==='查看店務紀錄'),'duty record leaked before Xiulian lead');
 let r=E.createHypothesis(n,'H_SIDE_DOOR');assert(r.ok);
 assert(n.hypotheses.H_SIDE_DOOR,'player-created hypothesis missing');
 r=E.reviewHypothesis(n,'H_SIDE_DOOR','withdrawn');assert(r.ok);
 assert.strictEqual(n.hypotheses.H_SIDE_DOOR.status,'withdrawn');

 let x=opening(E.fresh('X'));
 x=go(x,'newsstand');x=act(x,'newsstand_visit');
 assert(!C.predicates.canTracePackage(x),'package tracing bypassed continuity');
 assert(!has(x.conclusions,'C10'),'business context concluded before E07/E08');

 let y=opening(E.fresh('Y'));
 y=go(y,'studio');
 let duty=E.runAction(y,'studio_duty');
 assert(!duty.ok&&duty.reason==='requirements','duty record should remain gated before Xiulian lead');
 let loose=E.runAction(y,'studio_loose_procedure');
 assert(!loose.ok&&loose.reason==='requirements','loose-film procedure should remain gated before missing-window/access evidence');
 assert(!C.predicates.canSearchLooseFilms(y),'loose-film search available before narrowed missing window');
}

function narrativeState(){
 let s=opening(E.fresh('story'));
 assert(C.actions[s.lastAction]&&C.actions[s.lastAction].result,'lastAction result narrative missing');
 s=go(s,'darkroom');
 assert.strictEqual(s.lastAction,'','travel should clear location-specific action narrative');
 s=act(s,'darkroom_workflow');
 assert.strictEqual(s.lastAction,'darkroom_workflow');
 let loaded=E.normalize(JSON.parse(JSON.stringify(s)));
 assert.strictEqual(loaded.lastAction,'darkroom_workflow','normalize lost lastAction narrative state');
 loaded.lastAction='not_real';
 loaded=E.normalize(loaded);
 assert.strictEqual(loaded.lastAction,'','normalize should drop unknown lastAction ids');
}

function answerBy(s,pick){
 let start=E.startDeduction(s);assert(start.ok,'deduction failed to start: '+start.reason);s=start.state;
 C.deductions.forEach(q=>{
  let option=pick(q);
  assert(option,'missing deduction option for '+q.id);
  let r=E.answerDeduction(s,option.id);
  assert(r.ok,'answer failed for '+q.id+': '+r.reason);
  s=r.state;
 });
 assert.strictEqual(s.phase,'done','deduction did not finish');
 return s;
}

function deductionCorrect(){
 let s=routeA();
 s=answerBy(s,q=>q.options.find(o=>o.ok===true));
 assert.strictEqual(s.deduction.ending,'evidence_boundary','all-correct deduction should reach evidence boundary ending');
}

function deductionErrorEndings(){
 ['image_literalism','overcorrection','forced_origin'].forEach(type=>{
  let s=routeA();
  s=answerBy(s,q=>q.options.find(o=>o.errorType===type));
  assert.strictEqual(s.deduction.ending,type,'wrong ending classifier for '+type);
 });
}

function deductionTieBreak(){
 let s=routeA(),start=E.startDeduction(s);assert(start.ok);s=start.state;
 const order=['image_literalism','overcorrection','forced_origin','image_literalism','overcorrection','forced_origin'];
 C.deductions.forEach((q,i)=>{
  let option=q.options.find(o=>o.errorType===order[i]);assert(option);
  let r=E.answerDeduction(s,option.id);assert(r.ok);s=r.state;
 });
 assert.strictEqual(s.deduction.ending,'forced_origin','tied error counts should use the last selected tied error type');
}

function deductionIgnoresWithdrawnHypothesis(){
 let s=routeA();
 let h=E.createHypothesis(s,'H_XIULIAN');assert(h.ok);
 h=E.reviewHypothesis(s,'H_XIULIAN','withdrawn');assert(h.ok);
 s=answerBy(s,q=>q.options.find(o=>o.ok===true));
 assert.strictEqual(s.deduction.ending,'evidence_boundary','withdrawn hypothesis should not force a bad ending');
}

function deductionRejectsUnknownOption(){
 let s=routeA(),start=E.startDeduction(s);assert(start.ok);s=start.state;
 let before=s.deduction.index,r=E.answerDeduction(s,'not-a-real-option');
 assert(!r.ok&&r.reason==='unknown_option','unknown deduction option should be rejected');
 assert.strictEqual(s.deduction.index,before,'unknown option advanced deduction index');
}

function deductionSaveRepair(){
 let s=routeA(),start=E.startDeduction(s);assert(start.ok);s=start.state;
 for(let i=0;i<2;i++){
  const q=C.deductions[s.deduction.index],o=q.options.find(x=>x.ok===true);
  let r=E.answerDeduction(s,o.id);assert(r.ok);s=r.state;
 }
 let damaged=JSON.parse(JSON.stringify(s));
 damaged.phase='done';damaged.deduction.ending='image_literalism';damaged.deduction.index=99;
 let repaired=E.normalize(damaged);
 assert.strictEqual(repaired.phase,'deduction','partial deduction save should resume deduction');
 assert.strictEqual(repaired.deduction.index,2,'partial deduction save index should be derived from valid answers');
 assert.strictEqual(repaired.deduction.ending,null,'partial deduction save must discard stale ending');

 let complete=routeA();start=E.startDeduction(complete);assert(start.ok);complete=start.state;
 C.deductions.forEach(q=>{
  const o=q.options.find(x=>x.ok===true),r=E.answerDeduction(complete,o.id);assert(r.ok);complete=r.state;
 });
 let brokenComplete=JSON.parse(JSON.stringify(complete));
 brokenComplete.phase='deduction';brokenComplete.deduction.ending=null;brokenComplete.deduction.index=0;
 repaired=E.normalize(brokenComplete);
 assert.strictEqual(repaired.phase,'done','complete deduction answers should normalize to done');
 assert.strictEqual(repaired.deduction.ending,'evidence_boundary','complete answers should recompute ending');
}

function saveIsolation(){
 storage['mist-taiwan-case-save-v4']='CASE1_SENTINEL';
 storage['mist-taiwan-rain-canon-v1']='CASE2_SENTINEL';
 let s=E.fresh('save');E.save(s);
 assert.strictEqual(storage['mist-taiwan-case-save-v4'],'CASE1_SENTINEL');
 assert.strictEqual(storage['mist-taiwan-rain-canon-v1'],'CASE2_SENTINEL');
 assert(storage[C.saveKey],'Case 3 save missing');
}

const results=[];
[['route A',routeA],['route B',routeB],['route C',routeC],['negative gates',negativeChecks],['narrative state',narrativeState],['deduction correct',deductionCorrect],['deduction error endings',deductionErrorEndings],['deduction tie break',deductionTieBreak],['deduction ignores withdrawn hypothesis',deductionIgnoresWithdrawnHypothesis],['deduction rejects unknown option',deductionRejectsUnknownOption],['deduction save repair',deductionSaveRepair],['save isolation',saveIsolation]].forEach(([name,fn])=>{
 fn();results.push('PASS '+name);
});
console.log(results.join('\n'));
console.log('PASS all Case 3 engine regression tests');
