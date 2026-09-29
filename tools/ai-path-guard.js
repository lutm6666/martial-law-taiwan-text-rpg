#!/usr/bin/env node
'use strict';

const agent=(process.env.AI_AGENT||'human').toLowerCase();
const files=(process.env.AI_CHANGED_FILES||'')
  .split(/\r?\n/)
  .map(function(s){return s.trim()})
  .filter(Boolean);

const claudeProtected=[
  /^case.*-canon\.js$/,
  /^case.*-engine\.js$/,
  /^CASE.*_DESIGN\.md$/,
  /^CASE.*_IMPLEMENTATION\.md$/,
  /^tools\/(test-|validate-)/,
  /^\.github\/workflows\//,
  /^AI_WORKFLOW\.md$/,
  /^AGENTS\.md$/
];

const codexUi=[
  /^index\.html$/,
  /^case.*-ui\.js$/,
  /(^|\/)styles?\.(css|scss)$/,
  /^assets\/.*\.(css|html)$/
];

function matchesAny(file,rules){return rules.some(function(r){return r.test(file)})}
function gh(kind,msg){
  if(process.env.GITHUB_ACTIONS==='true')console.log('::'+kind+'::'+msg);
  else console.log(kind.toUpperCase()+': '+msg);
}

let fail=false;
if(agent==='claude'){
  const bad=files.filter(function(f){return matchesAny(f,claudeProtected)});
  if(bad.length){
    gh('error','Claude-owned PR crossed protected logic/CI boundaries: '+bad.join(', '));
    fail=true;
  }
}
if(agent==='codex'){
  const ui=files.filter(function(f){return matchesAny(f,codexUi)});
  if(ui.length)gh('warning','Codex PR modifies UI-owned files and requires Claude review: '+ui.join(', '));
}
if(agent==='handoff'){
  gh('notice','Handoff PR is cross-boundary by design; both agent reviews are required.');
}
if(!files.length)gh('warning','No changed files were supplied to AI path guard.');
if(fail)process.exit(1);
console.log('AI path guard passed for agent='+agent+'; files='+files.length);
