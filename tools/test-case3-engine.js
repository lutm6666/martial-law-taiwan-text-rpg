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
 s=go(s,'newsstand');s=act(s,'newsstand_visit');s=act(s,'newsstand_xiulian');
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

function saveIsolation(){
 storage['mist-taiwan-case-save-v4']='CASE1_SENTINEL';
 storage['mist-taiwan-rain-canon-v1']='CASE2_SENTINEL';
 let s=E.fresh('save');E.save(s);
 assert.strictEqual(storage['mist-taiwan-case-save-v4'],'CASE1_SENTINEL');
 assert.strictEqual(storage['mist-taiwan-rain-canon-v1'],'CASE2_SENTINEL');
 assert(storage[C.saveKey],'Case 3 save missing');
}

const results=[];
[['route A',routeA],['route B',routeB],['route C',routeC],['negative gates',negativeChecks],['narrative state',narrativeState],['save isolation',saveIsolation]].forEach(([name,fn])=>{
 fn();results.push('PASS '+name);
});
console.log(results.join('\n'));
console.log('PASS all Case 3 engine regression tests');
