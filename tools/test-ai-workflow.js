'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const p = require('./ai-workflow');
let count = 0;
async function test(name, fn) { await fn(); count++; console.log('PASS ' + name); }
const sha = 'a'.repeat(40), owner = 'owner';
const human = {login: owner, type: 'User'};
const bot = {login: 'github-actions[bot]', type: 'Bot'};
const comment = body => ({id: 1, body, user: bot, performed_via_github_app: {id: 15368}});
const pr = (agent='codex', overrides={}) => ({number: 1, state: 'open', draft: false, labels: [{name:'ai:'+agent}], head: {sha, ref: agent+'/test', repo:{full_name:'owner/repo'}}, base:{sha:'base',ref:'main'}, ...overrides});
function mock({issue, pull=pr(), comments=[], files=[], reviews=[], permission='write', permissionError, failure}={}) {
  const calls = [], checks = [];
  const record = (name, args) => { calls.push({name, args}); if (failure === name) throw new Error('API unavailable'); };
  const issues = {
    get: async args => {record('getIssue',args); return {data:issue};},
    listComments: 'comments',
    addLabels: async args => {record('addLabels',args); const target=issue||pull; target.labels.push(...args.labels.map(name=>({name})));},
    removeLabel: async args => {record('removeLabel',args); const target=issue||pull; target.labels=target.labels.filter(l=>l.name!==args.name);},
    createComment: async args => {record('createComment',args); const c={...comment(args.body),id:comments.length+1};comments.push(c); return {data:c};},
    updateComment: async args => {record('updateComment',args); comments.find(c=>c.id===args.comment_id).body=args.body;}
  };
  const github = {rest: {issues, pulls:{get:async args=>{record('getPr',args);return {data:pull};},listFiles:'files',listReviews:'reviews'}, repos:{getCollaboratorPermissionLevel: async args=>{record('permission',args);if(permissionError)throw new Error('403 Forbidden');return {data:{permission}};}}, checks:{listForRef:'checks',create:async args=>{record('createCheck',args);const c={...args,id:checks.length+1,app:{id:15368}};checks.push(c);return {data:c};},update:async args=>{record('updateCheck',args);Object.assign(checks.find(c=>c.id===args.check_run_id),args);}}}, paginate:async (method)=>({comments,files,reviews,checks})[method]};
  const context={repo:{owner,repo:'repo'},actor:'writer',runId:42,payload:{action:'opened',issue:{number:1},pull_request:{number:1}}};
  const core={info(){},setFailed(message){calls.push({name:'failed',message});}};
  return {github,context,core,calls,comments,checks,issue,pull};
}
const ready = body => ({number:1,state:'open',body,labels:[{name:'dispatch:ready'},{name:'unrelated'}]});
const body='### Workstream\n\nCanon / Logic / State / Tests\n\n### Goal\nFrontend / UI / Responsive / Accessibility';
const approve=[{user:human,body:'/ai approve-handoff '+sha}];
(async()=>{
await test('classification ignores Goal keywords',()=>assert.equal(p.routeIssue(body).agent,'codex'));
await test('exact UI field routes Claude',()=>assert.equal(p.routeIssue('### Area\nFrontend / UI').agent,'claude'));
await test('admin routes handoff',()=>assert.equal(p.routeIssue('### Workstream\nRepository admin / Settings').area,'area:admin'));
await test('unknown classification stops at handoff',()=>assert.equal(p.routeIssue('### Workstream\nUI-ish').agent,'handoff'));
await test('conflicting fields stop at handoff',()=>assert.equal(p.routeIssue('### Workstream\nFrontend / UI\n### Area\nCI / Tests').agent,'handoff'));
await test('duplicate field is a visible error',()=>assert.throws(()=>p.routeIssue('### Area\nCI / Tests\n### Area\nCI / Tests')));
await test('trusted marker requires Actions identity and app',()=>{assert(p.isActionsComment(comment('x')));assert(!p.isActionsComment({user:human,body:'x'}));assert(!p.isActionsComment({...comment('x'),performed_via_github_app:{id:1}}));});
await test('normal event repeats update one record',async()=>{const m=mock({issue:ready(body)});await p.dispatch(m);await p.dispatch(m);assert.equal(m.calls.filter(c=>c.name==='createComment').length,1);assert(m.issue.labels.some(l=>l.name==='unrelated'));});
await test('forged old marker cannot suppress dispatch',async()=>{const m=mock({issue:ready(body),comments:[{id:9,user:human,body:'<!-- ai-dispatch:v1 -->'}]});await p.dispatch(m);assert.equal(m.calls.filter(c=>c.name==='createComment').length,1);});
await test('trusted legacy record migrates in place',async()=>{const m=mock({issue:ready(body),comments:[comment('<!-- ai-dispatch:v1 -->')]});await p.dispatch(m);assert.equal(m.calls.filter(c=>c.name==='updateComment').length,1);assert(m.comments[0].body.includes('ai-dispatch:v2'));});
await test('edited body revises route and removes stale managed labels',async()=>{const m=mock({issue:ready(body)});await p.dispatch(m);m.issue.body='### Workstream\nFrontend / UI / Responsive / Accessibility';await p.dispatch(m);assert(m.issue.labels.some(l=>l.name==='ai:claude'));assert(!m.issue.labels.some(l=>l.name==='ai:codex'));assert.equal(m.comments.length,1);});
await test('read actor routes handoff',async()=>{const m=mock({issue:ready(body),permission:'read'});await p.dispatch(m);assert(m.issue.labels.some(l=>l.name==='ai:handoff'));});
await test('permission error fails without handoff mutation',async()=>{const m=mock({issue:ready(body),permissionError:true});await assert.rejects(p.dispatch(m));assert(!m.calls.some(c=>c.name==='addLabels'||c.name==='createComment'));});
await test('retry writer updates record and consumes label after success',async()=>{const m=mock({issue:ready(body)});await p.dispatch(m);m.issue.labels.push({name:'dispatch:retry'});Object.assign(m.context.payload,{action:'labeled',label:{name:'dispatch:retry'}});await p.dispatch(m);assert.equal(m.comments.length,1);assert(!m.issue.labels.some(l=>l.name==='dispatch:retry'));});
await test('retry failure retains label',async()=>{const i=ready(body);i.labels.push({name:'dispatch:retry'});const m=mock({issue:i,failure:'createComment'});Object.assign(m.context.payload,{action:'labeled',label:{name:'dispatch:retry'}});await assert.rejects(p.dispatch(m));assert(i.labels.some(l=>l.name==='dispatch:retry'));});
await test('retry reader rejected',async()=>{const i=ready(body);i.labels.push({name:'dispatch:retry'});const m=mock({issue:i,permission:'read'});Object.assign(m.context.payload,{action:'labeled',label:{name:'dispatch:retry'}});await assert.rejects(p.dispatch(m));});
await test('closed or not-ready issue does not dispatch',async()=>{for(const i of [{...ready(body),state:'closed'},{...ready(body),labels:[]}]){const m=mock({issue:i});await p.dispatch(m);assert(!m.calls.some(c=>c.name==='createComment'));}});
await test('cross review deduplicates current SHA',async()=>{const m=mock();await p.crossReview(m);await p.crossReview(m);assert.equal(m.calls.filter(c=>c.name==='createComment').length,1);assert(m.comments[0].body.includes('request sent'));});
await test('new head requires new request',async()=>{const m=mock();await p.crossReview(m);m.pull.head.sha='b'.repeat(40);await p.crossReview(m);assert.equal(m.calls.filter(c=>c.name==='createComment').length,2);});
await test('forged review marker does not suppress request',async()=>{const m=mock({comments:[{user:human,body:'<!-- cross-review:claude:'+sha+' -->'}]});await p.crossReview(m);assert.equal(m.calls.filter(c=>c.name==='createComment').length,1);});
await test('trusted legacy review marker deduplicates',async()=>{const m=mock({comments:[comment('<!-- cross-review:claude:'+sha+' -->')]});await p.crossReview(m);assert(!m.calls.some(c=>c.name==='createComment'));});
await test('review retry is explicit and consumed',async()=>{const m=mock();await p.crossReview(m);m.pull.labels.push({name:'review:retry'});Object.assign(m.context.payload,{action:'labeled',label:{name:'review:retry'}});await p.crossReview(m);await p.crossReview(m);assert.equal(m.calls.filter(c=>c.name==='createComment').length,2);assert(!m.pull.labels.some(l=>l.name==='review:retry'));});
await test('draft closed fork skip review',async()=>{for(const pull of [pr('codex',{draft:true}),pr('codex',{state:'closed'}),pr('codex',{head:{sha,ref:'codex/a',repo:{full_name:'fork/repo'}}})]){const m=mock({pull});await p.crossReview(m);assert(!m.calls.some(c=>c.name==='createComment'));}});
await test('conflicting ownership labels fail',()=>assert.throws(()=>p.classifyPr(pr('codex',{labels:[{name:'ai:codex'},{name:'ai:claude'}]}))));
await test('branch and label conflict fail',()=>assert.throws(()=>p.classifyPr(pr('claude',{head:{sha,ref:'codex/x'}}))));
await test('explicit sole handoff overrides old branch',()=>assert.equal(p.classifyPr(pr('handoff',{head:{sha,ref:'claude/x'}})),'handoff'));
await test('renamed engine remains protected',()=>assert.throws(()=>p.evaluateGuard({pr:pr('claude'),files:[{filename:'archive.js',previous_filename:'case1-engine.js'}],owner})));
await test('Claude cannot edit workflow even with approval',()=>assert.throws(()=>p.evaluateGuard({pr:pr('claude'),files:['.github/workflows/ci.yml'],comments:approve,owner})));
await test('Codex engine passes',()=>assert.equal(p.evaluateGuard({pr:pr(),files:['case1-engine.js'],owner}).agent,'codex'));
await test('Codex UI requires owner current SHA',()=>{assert.throws(()=>p.evaluateGuard({pr:pr(),files:['index.html'],owner}));assert(p.evaluateGuard({pr:pr(),files:['index.html'],comments:approve,owner}));});
await test('handoff requires owner even with no protected paths',()=>assert.throws(()=>p.evaluateGuard({pr:pr('handoff'),files:['assets/x.png'],owner})));
await test('human control change requires owner',()=>assert.throws(()=>p.evaluateGuard({pr:pr('human',{labels:[],head:{sha,ref:'feature/x'}}),files:['tools/ai-workflow.js'],owner})));
await test('old SHA other actor and bot cannot authorize',()=>{for(const c of [{user:human,body:'/ai approve-handoff '+'b'.repeat(40)},{user:{login:'other',type:'User'},body:approve[0].body},{user:{login:owner,type:'Bot'},body:approve[0].body}])assert(!p.ownerApproval([c],[],owner,sha));});
await test('latest owner review on exact SHA controls approval',()=>{const a={id:1,user:human,state:'APPROVED',commit_id:sha};assert(p.ownerApproval([],[a],owner,sha));assert(!p.ownerApproval([],[a,{...a,id:2,state:'CHANGES_REQUESTED'}],owner,sha));assert(!p.ownerApproval([],[{...a,commit_id:'old'}],owner,sha));});
await test('guard check uses exact required name and head; reuses own check',async()=>{const m=mock({files:['case1-engine.js']});await p.runGuard({...m,number:1,expectedBaseSha:'base'});await p.runGuard({...m,number:1,expectedBaseSha:'base'});assert.equal(m.checks.length,1);assert.equal(m.checks[0].name,'ai-ownership-policy');assert.equal(m.checks[0].head_sha,sha);assert.equal(m.checks[0].conclusion,'success');});
await test('guard violation creates failed head check',async()=>{const m=mock({files:['index.html']});await p.runGuard({...m,number:1,expectedBaseSha:'base'});assert.equal(m.checks[0].conclusion,'failure');assert(m.calls.some(c=>c.name==='failed'));});
await test('stale base is a failed check',async()=>{const m=mock();await p.runGuard({...m,number:1,expectedBaseSha:'old'});assert.equal(m.checks[0].conclusion,'failure');});
await test('checks permission failure propagates',async()=>{const m=mock({failure:'createCheck'});await assert.rejects(p.runGuard({...m,number:1,expectedBaseSha:'base'}));});
await test('owner comment refreshes the native PR guard on exact head',async()=>{
 const m=mock({files:['case1-engine.js']});m.context.eventName='issue_comment';
 m.checks.push({id:100,name:'guard',head_sha:sha,app:{id:15368},status:'completed',conclusion:'failure',external_id:'5774173f-ce89-5431-8e54-8878ee05cd34',details_url:'https://github.com/owner/repo/actions/runs/123/job/456'});
 await p.runGuard({...m,number:1,expectedBaseSha:'base'});
 assert.equal(m.checks[0].conclusion,'success');
});
await test('skipped native check cannot replace enforced guard',async()=>{
 const m=mock();m.context.eventName='issue_comment';
 m.checks.push({id:100,name:'guard',head_sha:sha,app:{id:15368},status:'completed',conclusion:'skipped',details_url:'https://github.com/owner/repo/actions/runs/123/job/456'});
 await assert.rejects(p.runGuard({...m,number:1,expectedBaseSha:'base'}),/No completed native PR guard/);
});
await test('comment without native head guard fails visibly',async()=>{
 const m=mock();m.context.eventName='issue_comment';
 await assert.rejects(p.runGuard({...m,number:1,expectedBaseSha:'base'}),/No completed native PR guard/);
});
await test('workflow contract and scripts compile',()=>{
  const guard=fs.readFileSync('.github/workflows/ai-path-guard.yml','utf8');
  assert(guard.includes('pull_request_target:'));assert(guard.includes('checks: write'));assert(!guard.includes('head.sha }}'));assert(guard.includes('path: trusted'));assert(/^  guard:/m.test(guard));
  assert(fs.readFileSync('.github/workflows/ai-cross-review.yml','utf8').includes('group: ai-cross-review-'));
  for(const file of ['ai-dispatch','ai-cross-review','ai-path-guard']){
    const yaml=fs.readFileSync('.github/workflows/'+file+'.yml','utf8');
    const scripts=[...yaml.matchAll(/          script: \|\n((?:            .*\n|\n)+)/g)];
    assert(scripts.length>0,file);
    for(const match of scripts)new vm.Script('(async function(){\n'+match[1].replace(/^            /gm,'')+'\n})');
  }
});
console.log('\n'+count+' regression cases passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
