#!/usr/bin/env node
'use strict';
const {evaluateGuard} = require('./ai-workflow.js');
try {
  const files = process.env.AI_CHANGED_FILES_JSON ? JSON.parse(process.env.AI_CHANGED_FILES_JSON)
    : (process.env.AI_CHANGED_FILES || '').split(/\r?\n/).filter(Boolean);
  const agent = process.env.AI_AGENT || 'human';
  const result = evaluateGuard({
    pr: {head: {ref: '', sha: process.env.AI_HEAD_SHA || 'local'}, labels: agent === 'human' ? [] : [{name: 'ai:' + agent}]},
    files, comments: JSON.parse(process.env.AI_COMMENTS_JSON || '[]'),
    reviews: JSON.parse(process.env.AI_REVIEWS_JSON || '[]'), owner: process.env.AI_REPO_OWNER || ''
  });
  console.log('AI path guard passed for agent=' + result.agent + '; paths=' + result.paths.length);
  for (const message of result.messages) console.log(message);
} catch (error) { console.error(error.message); process.exitCode = 1; }
