;(function(global){
'use strict';

var C=global.CASE3_FILM_CANON;
if(!C){console.error('CASE3_FILM_CANON is required before case3-film-engine.js');return}

var KEY=C.saveKey;

function fresh(name){
 return {
  version:C.version,playerName:name||'',phase:'investigate',loc:'studio',
  visited:['studio'],unlocked:['studio'],
  evidence:[],conclusions:[],testimonies:[],hypotheses:{},
  actionsDone:{},observations:{},
  frameAnalysis:{personMovement:false,movingObject:false,fixedBackground:false,continuityComplete:false,handoffSupported:false},
  keys:{b084:false,packageMarkPartial:false,m317:false},
  flags:{
   b084SeenOutsideStudio:false,b084LedgerMatched:false,xiulianSawPhoto:false,
   strongerInterpretationKnown:false,xiulianAccessWindowKnown:false,
   looseFilmProcedureKnown:false,frameCompareOpen:false,e10Found:false,e10Verified:false,xiulianAdmission:false
  },
  deduction:{index:0,answers:[],ending:null}
 };
}
function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function uniq(a){return a.filter(function(v,i){return a.indexOf(v)===i})}
function add(a,v){if(a.indexOf(v)<0)a.push(v)}
function hasEvidence(s,id){return s.evidence.indexOf(id)>=0}
function hasConclusion(s,id){return s.conclusions.indexOf(id)>=0}
function hasTestimony(s,id){return s.testimonies.indexOf(id)>=0}

function normalize(raw){
 var s=obj(raw),base=fresh(typeof s.playerName==='string'?s.playerName:'');
 s.version=C.version;
 s.playerName=base.playerName;
 s.phase=['investigate','deduction','done'].indexOf(s.phase)>=0?s.phase:'investigate';
 s.loc=C.locations[s.loc]?s.loc:'studio';
 s.visited=uniq(arr(s.visited).filter(function(x){return !!C.locations[x]}));
 if(s.visited.indexOf(s.loc)<0)s.visited.push(s.loc);
 s.unlocked=uniq(arr(s.unlocked).filter(function(x){return !!C.locations[x]}));
 if(s.unlocked.indexOf('studio')<0)s.unlocked.unshift('studio');
 s.evidence=uniq(arr(s.evidence).filter(function(x){return !!C.evidence[x]}));
 s.conclusions=uniq(arr(s.conclusions).filter(function(x){return !!C.conclusions[x]}));
 s.testimonies=uniq(arr(s.testimonies).filter(function(x){return !!C.testimonies[x]}));
 s.hypotheses=obj(s.hypotheses);
 Object.keys(s.hypotheses).forEach(function(k){
  if(!C.hypotheses[k]){delete s.hypotheses[k];return}
  var h=obj(s.hypotheses[k]);
  h.status=['active','revised','withdrawn'].indexOf(h.status)>=0?h.status:'active';
  h.revision=Number.isFinite(h.revision)?Math.max(0,h.revision):0;
  h.text=typeof h.text==='string'?h.text:C.hypotheses[k].text;
  h.history=arr(h.history);
  s.hypotheses[k]=h;
 });
 s.actionsDone=obj(s.actionsDone);s.observations=obj(s.observations);
 s.frameAnalysis=Object.assign(base.frameAnalysis,obj(s.frameAnalysis));
 ['personMovement','movingObject','fixedBackground','continuityComplete','handoffSupported'].forEach(function(k){s.frameAnalysis[k]=!!s.frameAnalysis[k]});
 s.keys=Object.assign(base.keys,obj(s.keys));Object.keys(base.keys).forEach(function(k){s.keys[k]=!!s.keys[k]});
 s.flags=Object.assign(base.flags,obj(s.flags));Object.keys(base.flags).forEach(function(k){s.flags[k]=!!s.flags[k]});
 s.deduction=Object.assign(base.deduction,obj(s.deduction));
 s.deduction.answers=arr(s.deduction.answers);
 s.deduction.index=Number.isFinite(s.deduction.index)?Math.max(0,Math.min(C.deductions.length,s.deduction.index)):0;
 s.deduction.ending=C.endings[s.deduction.ending]?s.deduction.ending:null;
 derive(s);
 return s;
}

function derive(s){
 if(hasConclusion(s,'C04')){
  s.frameAnalysis.continuityComplete=true;
 }
 if(hasConclusion(s,'C05'))s.frameAnalysis.handoffSupported=true;
 if(hasConclusion(s,'C13'))s.flags.xiulianAccessWindowKnown=true;
 if(hasConclusion(s,'C14'))s.flags.e10Verified=true;
 if(hasEvidence(s,'E06'))s.flags.b084LedgerMatched=true;
 if(hasEvidence(s,'E10'))s.flags.e10Found=true;
 if(s.actionsDone.studio_opening){
  ['darkroom','alley','newsstand'].forEach(function(x){add(s.unlocked,x)});
 }
 if(s.flags.xiulianSawPhoto)add(s.unlocked,'chen_home');
 if(C.predicates.canTracePackage(s))add(s.unlocked,'supplier');
 return s;
}

function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch(e){return false}}
function load(){try{return normalize(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(e){return fresh('')}}
function reset(name){var s=fresh(name);save(s);return s}

function predicate(s,name){var fn=C.predicates[name];return typeof fn==='function'?!!fn(s):false}
function actionAvailable(s,id){
 if(s.phase!=='investigate')return false;
 var a=C.actions[id];
 if(!a||a.location!==s.loc)return false;
 if(s.actionsDone[id])return false;
 return !a.requires||predicate(s,a.requires);
}
function availableActions(s){
 return Object.keys(C.actions).filter(function(id){return actionAvailable(s,id)}).map(function(id){return C.actions[id]});
}
function visibleLocations(s){
 derive(s);
 return s.unlocked.filter(function(id){return !!C.locations[id]});
}
function travel(s,id){
 derive(s);
 if(s.phase!=='investigate')return {ok:false,reason:'phase',state:s};
 if(!C.locations[id]||s.unlocked.indexOf(id)<0)return {ok:false,reason:'locked',state:s};
 s.loc=id;add(s.visited,id);save(s);return {ok:true,state:s};
}

function canConclude(s,id){
 var c=C.conclusions[id];if(!c)return false;
 var r=c.requires||{};
 if(arr(r.evidence).some(function(x){return !hasEvidence(s,x)}))return false;
 if(arr(r.conclusions).some(function(x){return !hasConclusion(s,x)}))return false;
 if(arr(r.frame).some(function(x){return !s.frameAnalysis[x]}))return false;
 return true;
}
function tryConclude(s,id){
 if(hasConclusion(s,id))return true;
 if(!canConclude(s,id))return false;
 add(s.conclusions,id);
 if(id==='C04')s.frameAnalysis.continuityComplete=true;
 if(id==='C05')s.frameAnalysis.handoffSupported=true;
 if(id==='C13')s.flags.xiulianAccessWindowKnown=true;
 if(id==='C14')s.flags.e10Verified=true;
 return true;
}
function effectValid(s,effect){
 var p=String(effect).split(':'),kind=p.shift(),id=p.join(':');
 if(kind==='gain')return !!C.evidence[id];
 if(kind==='conclude')return !!C.conclusions[id];
 if(kind==='testimony')return !!C.testimonies[id];
 if(kind==='unlock')return !!C.locations[id];
 if(kind==='flag')return Object.prototype.hasOwnProperty.call(s.flags,id);
 if(kind==='key')return Object.prototype.hasOwnProperty.call(s.keys,id);
 if(kind==='mechanic')return id==='frame_compare';
 return false;
}
function applyEffect(s,effect){
 var p=String(effect).split(':'),kind=p.shift(),id=p.join(':');
 if(kind==='gain')add(s.evidence,id);
 else if(kind==='conclude')tryConclude(s,id);
 else if(kind==='testimony')add(s.testimonies,id);
 else if(kind==='unlock')add(s.unlocked,id);
 else if(kind==='flag')s.flags[id]=true;
 else if(kind==='key')s.keys[id]=true;
 else if(kind==='mechanic'&&id==='frame_compare')s.flags.frameCompareOpen=true;
}
function runAction(s,id){
 var a=C.actions[id];
 if(!a)return {ok:false,reason:'unknown_action',state:s};
 if(s.phase!=='investigate')return {ok:false,reason:'phase',state:s};
 if(a.location!==s.loc)return {ok:false,reason:'wrong_location',state:s};
 if(a.requires&&!predicate(s,a.requires))return {ok:false,reason:'requirements',state:s};
 if(s.actionsDone[id])return {ok:false,reason:'done',state:s};
 var effects=arr(a.effects);
 if(effects.some(function(e){return !effectValid(s,e)}))return {ok:false,reason:'invalid_effect',state:s};
 effects.forEach(function(e){applyEffect(s,e)});
 s.actionsDone[id]=true;
 derive(s);save(s);
 return {ok:true,state:s};
}

function observeFrame(s,category){
 if(!C.frameAnalysis.categories[category])return {ok:false,reason:'unknown_category',state:s};
 s.frameAnalysis[category]=true;s.observations['frame:'+category]=true;
 var ready=C.frameAnalysis.completeRequires.every(function(k){return s.frameAnalysis[k]});
 if(ready){
  s.frameAnalysis.continuityComplete=true;
  tryConclude(s,'C04');tryConclude(s,'C05');
 }
 derive(s);save(s);return {ok:true,complete:ready,state:s};
}

function createHypothesis(s,id){
 if(!C.hypotheses[id])return {ok:false,reason:'unknown_hypothesis',state:s};
 if(s.hypotheses[id])return {ok:false,reason:'exists',state:s};
 s.hypotheses[id]={status:'active',revision:0,text:C.hypotheses[id].text,createdAt:s.loc,history:[]};
 save(s);return {ok:true,state:s};
}
function reviewHypothesis(s,id,decision,text){
 var h=s.hypotheses[id];
 if(!h)return {ok:false,reason:'not_created',state:s};
 if(['active','revised','withdrawn'].indexOf(decision)<0)return {ok:false,reason:'bad_decision',state:s};
 h.history.push({from:h.status,to:decision,text:h.text});
 h.status=decision;
 if(decision==='revised'){
  h.revision+=1;
  if(typeof text==='string'&&text.trim())h.text=text.trim();
 }
 save(s);return {ok:true,state:s};
}

function evidenceView(s,id){
 var e=C.evidence[id];if(!e)return null;
 return {id:id,name:(id==='E10'&&s.flags.e10Verified?e.verifiedName:e.name),type:e.type,desc:e.desc};
}
function testimonyView(s,id){
 var t=C.testimonies[id];if(!t)return null;
 var verification=t.verification;
 if(id==='T_XIULIAN_GOODS'&&hasEvidence(s,'E07')&&hasEvidence(s,'E08'))verification='supported';
 return {id:id,speaker:t.speaker,text:t.text,verification:verification};
}

function startDeduction(s){
 if(!C.predicates.canStartDeduction(s))return {ok:false,reason:'requirements',state:s};
 s.phase='deduction';s.deduction.index=0;s.deduction.answers=[];s.deduction.ending=null;save(s);
 return {ok:true,state:s};
}
function answerDeduction(s,answer){
 if(s.phase!=='deduction')return {ok:false,reason:'not_deduction',state:s};
 var q=C.deductions[s.deduction.index];if(!q)return {ok:false,reason:'complete',state:s};
 var a=obj(answer);
 s.deduction.answers.push({q:q.id,ok:a.ok===true,errorType:a.errorType||null});
 s.deduction.index++;
 if(s.deduction.index>=C.deductions.length){
  var bad=s.deduction.answers.filter(function(x){return !x.ok});
  if(!bad.length)s.deduction.ending='evidence_boundary';
  else{
   var counts={image_literalism:0,overcorrection:0,forced_origin:0};
   bad.forEach(function(x){if(Object.prototype.hasOwnProperty.call(counts,x.errorType))counts[x.errorType]++});
   s.deduction.ending=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]})[0];
  }
  s.phase='done';
 }
 save(s);return {ok:true,state:s};
}

function snapshot(s){
 return {
  loc:s.loc,phase:s.phase,unlocked:s.unlocked.slice(),evidence:s.evidence.slice(),
  conclusions:s.conclusions.slice(),testimonies:s.testimonies.slice(),
  frameAnalysis:Object.assign({},s.frameAnalysis),keys:Object.assign({},s.keys),
  flags:Object.assign({},s.flags),hypotheses:JSON.parse(JSON.stringify(s.hypotheses))
 };
}

global.Case3FilmEngine={
 fresh:fresh,normalize:normalize,save:save,load:load,reset:reset,derive:derive,
 visibleLocations:visibleLocations,travel:travel,availableActions:availableActions,
 runAction:runAction,observeFrame:observeFrame,createHypothesis:createHypothesis,
 reviewHypothesis:reviewHypothesis,evidenceView:evidenceView,testimonyView:testimonyView,
 startDeduction:startDeduction,answerDeduction:answerDeduction,snapshot:snapshot,
 canConclude:canConclude,tryConclude:tryConclude
};
})(window);
