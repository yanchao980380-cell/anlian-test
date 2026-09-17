const {test}=require('node:test');
const assert=require('node:assert/strict');
const {questions,profiles,virtues,score}=require('../sins/data.js');
test('18 questions cover all 14 dimensions',()=>{assert.equal(questions.length,18);assert.equal(profiles.length,7);assert.equal(virtues.length,7);for(const p of [...profiles,...virtues])assert.ok(questions.some(q=>q.dim===p.id));});
test('sin and virtue independently reach 100 together',()=>{const r=score(Array(18).fill(4));assert.ok(Object.values(r.scores).every(v=>v===100));assert.equal(r.sinMean,100);assert.equal(r.virtueMean,100);});
test('each of fourteen dimensions can lead its own group',()=>{for(const p of [...profiles,...virtues]){const r=score(questions.map(q=>q.dim===p.id?4:0));assert.equal(r.scores[p.id],100);assert.equal((profiles.includes(p)?r.primary:r.virtuePrimary).id,p.id);}});
test('ties and empty answers are explicit',()=>{const r=score(Array(18).fill(2));assert.equal(r.tied.length,7);assert.equal(r.virtueTied.length,7);assert.equal(r.flat,true);for(const a of [[],Array(18).fill(null),Array(18).fill(5)])assert.throws(()=>score(a));});
test('means are equal dimension weight',()=>{const r=score(questions.map(q=>q.dim==='pride'?4:0));assert.equal(r.sinMean,14.29);assert.equal(r.virtueMean,0);});

test('ties require explicit confirmation without changing scores',()=>{const a=Array(18).fill(2),r=score(a);assert.deepEqual(r.pending,['sin','virtue']);const chosen=score(a,{sin:'greed',virtue:'chastity'});assert.equal(chosen.primary.id,'greed');assert.equal(chosen.virtuePrimary.id,'chastity');assert.deepEqual(chosen.scores,r.scores);assert.deepEqual(chosen.pending,[]);const both=score(a,{sin:'both',virtue:'both'});assert.equal(both.sinLeaders.length,7);assert.equal(both.virtueLeaders.length,7);assert.deepEqual(both.pending,[]);});
test('only tied candidates may be confirmed',()=>{const a=questions.map(q=>['greed','wrath'].includes(q.dim)?4:0);const r=score(a,{sin:'pride'});assert.ok(r.pending.includes('sin'));});
