'use strict';

const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');

function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function assert(ok,msg){if(!ok)throw new Error(msg)}

const index=read('index.html');
const router=read('case2-engine.js');
const pages=read('.github/workflows/pages.yml');
const site=process.argv.includes('--site')?path.join(root,'_site'):root;

assert(index.includes('<script src="case1-unified-engine.js?v=12"></script>'),'index must still load Case 1 runtime');
assert(index.includes('<script src="case2-engine.js?v=38"></script>'),'index must still load production case router');
assert(router.includes('<option value="case3">第三案｜第十三張底片</option>'),'case picker must expose Case 3');
assert(router.includes("if(choice==='case3'){startCase3();return}"),'case picker must route Case 3');
assert(router.includes("next.textContent='開始案件三：《第十三張底片》';next.onclick=startCase3"),'correct Case 2 ending must expose Case 3 progression');
assert(router.includes("save.ending!=='correct'"),'Case 2 → Case 3 sequential button must require the correct Case 2 ending');
assert(router.includes("window.Case3FilmUI.mount('case3ProductionRoot',{playerName:currentPlayerName()})"),'production router must mount the Case 3 UI');
assert(!router.includes('case3-preview.html'),'production routing must not depend on the standalone preview page');

const ordered=[
 'case3-film-canon.js?v=1',
 'case3-art-manifest.js?v=1',
 'case3-film-engine.js?v=1',
 'case3-film-ui.js?v=2'
];
let last=-1;
for(const asset of ordered){
 const pos=router.indexOf(asset);
 assert(pos>last,'Case 3 runtime assets must load in dependency order: '+asset);
 last=pos;
}

for(const file of ['index.html','case1-unified-engine.js','case2-engine.js','case2-rain-canon.js','case2-rain-canon-engine.js',
                    'case3-film-canon.js','case3-art-manifest.js','case3-film-engine.js','case3-film-ui.js']){
 assert(fs.existsSync(path.join(site,file)),'missing production runtime: '+file);
}
for(const file of ['case3-film-canon.js','case3-art-manifest.js','case3-film-engine.js','case3-film-ui.js']){
 assert(pages.includes('cp '+file+' _site/'),'Pages workflow must publish '+file);
}
assert(pages.includes('cp -R assets/case3 _site/assets/case3'),'Pages workflow must publish Case 3 artwork');

const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(read('case3-art-manifest.js'),sandbox,{filename:'case3-art-manifest.js'});
const manifest=sandbox.window.CASE3_ART_MANIFEST;
assert(manifest,'Case 3 art manifest must initialize');
for(const group of ['scenes','frames','evidence']){
 for(const [id,item] of Object.entries(manifest[group]||{})){
  assert(item.status==='ready',group+' '+id+' must be ready before production routing');
  assert(item.path&&fs.existsSync(path.join(site,item.path)),group+' '+id+' missing production asset: '+item.path);
 }
}

console.log('PASS production case routing');
