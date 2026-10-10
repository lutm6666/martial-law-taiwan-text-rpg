'use strict';

const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');

function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function assert(ok,msg){if(!ok)throw new Error(msg)}

const index=read('index.html');
const router=read('case2-engine.js');

assert(index.includes('<script src="case1-unified-engine.js?v=15"></script>'),'index must still load Case 1 runtime');
assert(index.includes('<script src="case2-engine.js?v=43"></script>'),'index must still load production case router');
assert(router.includes('case2-rain-canon-engine.js?v=18'),'Case 2 must load the updated save/Canon runtime');
assert(router.includes('<option value="case3">第三案｜第十三張底片</option>'),'case picker must expose Case 3');
assert(router.includes("if(choice==='case3'){startCase3();return}"),'case picker must route Case 3');
assert(router.includes("next.textContent='開始案件三：《第十三張底片》';next.onclick=startCase3"),'correct Case 2 ending must expose Case 3 progression');
assert(router.includes("save.ending!=='correct'"),'Case 2 → Case 3 sequential button must require the correct Case 2 ending');
assert(router.includes("window.Case3FilmUI.mount('case3ProductionRoot',{playerName:currentPlayerName()})"),'production router must mount the Case 3 UI');
assert(!router.includes('case3-preview.html'),'production routing must not depend on the standalone preview page');

const ordered=[
 'case3-film-canon.js?v=4',
 'case3-art-manifest.js?v=1',
 'case3-film-engine.js?v=3',
 'case3-film-ui.js?v=5'
];
let last=-1;
for(const asset of ordered){
 const pos=router.indexOf(asset);
 assert(pos>last,'Case 3 runtime assets must load in dependency order: '+asset);
 last=pos;
}

const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(read('case3-art-manifest.js'),sandbox,{filename:'case3-art-manifest.js'});
const manifest=sandbox.window.CASE3_ART_MANIFEST;
assert(manifest,'Case 3 art manifest must initialize');
for(const group of ['scenes','frames','evidence']){
 for(const [id,item] of Object.entries(manifest[group]||{})){
  assert(item.status==='ready',group+' '+id+' must be ready before production routing');
  assert(item.path&&fs.existsSync(path.join(root,item.path)),group+' '+id+' missing production asset: '+item.path);
 }
}

console.log('PASS production case routing');

// Loading old investigations must bypass the new first-case opening.
const firstContext={window:{}};vm.createContext(firstContext);
vm.runInContext(read('case1-unified-engine.js').replace(/init\(\);\s*\}\)\(\);\s*$/, 'window.Case1SaveTest={fresh:fresh,normalize:normalize};})();'),firstContext);
const first=firstContext.window.Case1SaveTest;
assert(first.fresh('new').flags.openingSeen===false,'new Case 1 starts with a prologue');
let old=first.fresh('old');old.evidence=['missing_index'];delete old.flags.openingSeen;
assert(first.normalize(old).flags.openingSeen===true,'old Case 1 progress must skip prologue');
old=first.fresh('seen');old.flags.openingSeen=true;
assert(first.normalize(old).flags.openingSeen===true,'opening acknowledgment must persist');
console.log('PASS Case 1 opening migration');

// Exercise the real Case 1 handlers with a small DOM; switching tabs must not
// send a player who already chose a correct inference back to the first stage.
const nodes={};
function element(){
 let html='';
 return {children:[],classList:{add(){},remove(){},toggle(){}},dataset:{},
  get innerHTML(){return html},set innerHTML(v){html=v;this.children=[]},
  appendChild(child){this.children.push(child)},textContent:''};
}
const nav=['scene','map','record','deduction'].map(tab=>Object.assign(element(),{dataset:{tab}}));
const readingContext={window:{scrollY:0,scrollTo(x,y){this.scrollY=y}},
 document:{getElementById(id){return nodes[id]||(nodes[id]=element())},createElement:element,querySelectorAll(){return nav}},
 localStorage:{setItem(){},getItem(){return null}},clearTimeout(){},setTimeout(){}};
vm.createContext(readingContext);
vm.runInContext(read('case1-unified-engine.js').replace(/init\(\);\s*\}\)\(\);\s*$/, `
 window.ReadingTest={prepare:function(){state=fresh('讀者');state.evidence=Object.keys(evidence);state.flags.deductionReady=true;currentTab='deduction';renderDeduction()},changeTab:changeTab,get:function(){return state},deduction:deduction};})();`),readingContext);
const reading=readingContext.window.ReadingTest;
reading.prepare();
const answerIndex=reading.deduction[0].opts.findIndex(o=>o[0]===reading.deduction[0].correct);
nodes.deductionBox.children[0].children[answerIndex].onclick();
assert(nodes.deductionBox.innerHTML.includes('提出證物'),'correct inference must open the evidence picker');
readingContext.window.scrollY=120;reading.changeTab('record');
assert(readingContext.window.scrollY===0,'a new view begins at its own reading position');
readingContext.window.scrollY=700;reading.changeTab('deduction');
assert(readingContext.window.scrollY===120,'return to deduction restores its reading position');
assert(nodes.deductionBox.innerHTML.includes('提出證物'),'record review must preserve the evidence selection stage');
let state=reading.get(),correctEvidence=state.evidence.indexOf(reading.deduction[0].need);
const wrongEvidence=correctEvidence===0?1:0;
nodes.deductionBox.children[0].children[wrongEvidence].onclick();
assert(reading.get().focus===3,'wrong evidence consumes one focus');
assert(nodes.deductionBox.innerHTML.includes('提出證物'),'wrong evidence stays in the evidence picker');
assert(nodes.deductionBox.children.some(n=>n.className==='feedback'),'wrong evidence shows feedback at the current stage');
nodes.deductionBox.children[0].children[correctEvidence].onclick();
assert(reading.get().deductionStep===1,'correct evidence advances exactly one question');
assert(!nodes.deductionBox.innerHTML.includes('提出證物'),'the next question starts with inference options');
reading.changeTab('record');
assert(readingContext.window.scrollY===700,'return to records restores the original reading position');
console.log('PASS Case 1 evidence-stage and reading-position regression');
