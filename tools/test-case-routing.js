'use strict';

const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');

function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function assert(ok,msg){if(!ok)throw new Error(msg)}

const index=read('index.html');
const router=read('case2-engine.js');

assert(index.includes('<script src="case1-unified-engine.js?v=14"></script>'),'index must still load Case 1 runtime');
assert(index.includes('<script src="case2-engine.js?v=43"></script>'),'index must still load production case router');
assert(router.includes('case2-rain-canon.js?v=16'),'Case 2 must load current Canon data');
assert(router.includes('.c2-map button:disabled:not(.current){display:none!important}'),'Case 2 map must hide only locked locations');
assert(router.includes('.c2-map button.current:disabled{opacity:1}'),'Case 2 map must keep current location readable');
assert(router.includes('case2-rain-canon-engine.js?v=17'),'Case 2 must load the updated save/Canon runtime');
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
 'case3-film-ui.js?v=4'
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
