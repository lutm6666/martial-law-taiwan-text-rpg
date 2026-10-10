'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const KEY='mist-taiwan-rain-canon-v1';

function run(saved){
 const store={};if(saved!==undefined)store[KEY]=JSON.stringify(saved);
 const localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}};
 const nodes={};
 function element(){return{classList:{add(){},remove(){},contains(){return false}},appendChild(){},innerHTML:'',textContent:'',onclick:null}}
 const document={
  getElementById:id=>nodes[id]||(nodes[id]=element()),
  createElement:element,querySelector:element,querySelectorAll:()=>[],head:{appendChild(){}}
 };
 const context={window:{},document,localStorage,location:{reload(){}},console,setTimeout(){},clearTimeout(){}};
 vm.createContext(context);
 vm.runInContext(read('case2-rain-canon.js'),context);
 vm.runInContext(read('case2-rain-canon-engine.js'),context);
 context.window.Case2RainCanon.start();
 return {save:JSON.parse(store[KEY]),data:context.window.CASE2_RAIN_CANON};
}

const {data}=run();
const validEvidence=['e03','e05','e06','e07','e09','e11','e12'];
const base=()=>({
 caseId:data.id,name:'林默',loc:'home',visited:{home:true},evidence:validEvidence.slice(),people:[],
 flags:{qiulan_revealed:true,last_seen_account:true,landlord_admitted_edit:true,opening_seen:true},
 done:{},phase:'deduction',deduction:0,answers:[],focus:4,finished:false,ending:null
});
const correct=data.deductions.map(d=>({q:d.id,a:d.correct,ok:true}));
const first=data.deductions[0];
const wrong=first.options.find(o=>o.id!==first.correct);

let s=run({...base(),phase:'done',finished:true,ending:'correct'}).save;
assert.equal(s.finished,false,'forged ending without answers must be rejected');
assert.equal(s.ending,null);

s=run({...base(),phase:'done',finished:true,ending:'correct',answers:correct}).save;
assert.equal(s.finished,true,'legitimate completed run must remain completed');
assert.equal(s.ending,'correct');
assert.equal(s.deduction,data.deductions.length);

s=run({...base(),answers:correct.slice(0,3),deduction:999}).save;
assert.equal(s.deduction,3,'deduction index must be reconstructed from ordered answers');
assert.equal(s.phase,'deduction');

s=run({...base(),answers:[{q:first.id,a:wrong.id,ok:true}],deduction:999}).save;
assert.equal(s.answers[0].ok,false,'persisted ok bit cannot override canonical answer');
assert.equal(s.focus,3);
assert.equal(s.deduction,0);

s=run({...base(),answers:Array(4).fill({q:first.id,a:wrong.id,ok:false}),phase:'done',finished:true,ending:'correct'}).save;
assert.equal(s.finished,true,'legitimate focus exhaustion must preserve failure');
assert.notEqual(s.ending,'correct');
assert.equal(s.focus,0);

s=run({...base(),answers:correct,phase:'done',finished:true,ending:'correct',evidence:['bad']}).save;
assert.equal(s.finished,false,'missing prerequisite evidence must not yield a correct ending');
assert.equal(s.ending,null);
assert.equal(s.evidence.length,0);

s=run({...base(),loc:'unknown',evidence:['e03','e03','missing'],people:['unknown']}).save;
assert.equal(s.loc,'home');
assert.equal(s.evidence.length,1);
assert.equal(s.people.length,0);

s=run({caseId:data.id}).save;
assert.equal(s.phase,'investigate');
assert.equal(s.focus,4);
assert.equal(s.finished,false);

s=run({caseId:'wrong-case',phase:'done',finished:true,ending:'correct'}).save;
assert.equal(s.caseId,data.id);
assert.equal(s.finished,false);

const css=read('case2-rain-canon-engine.js');
assert(css.includes('.c2-record img{width:100%;margin-top:9px;border-radius:9px;display:block;max-height:none;height:auto;aspect-ratio:3/2;object-fit:contain}'),
 'evidence image must preserve the complete frame');
console.log('PASS Case 2 save/Canon normalization (10 scenarios)');
