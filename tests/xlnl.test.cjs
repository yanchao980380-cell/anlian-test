const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../xlnl/index.html'),'utf8');
const source=html.slice(html.indexOf('const QUESTIONS'),html.indexOf('// --- APP LOGIC'));
const {QUESTIONS,RESULTS,calculatePsychAge}=new Function(source+';return {QUESTIONS,RESULTS,calculatePsychAge};')();
test('40 道题、五档画像和原版年龄边界一致',()=>{
 assert.equal(QUESTIONS.length,40);assert.equal(RESULTS.length,5);
 QUESTIONS.forEach(q=>assert.deepEqual(q.options.map(o=>o.score),[1,2,3,4]));
 for(const [score,age] of [[40,6],[69,12],[70,13],[92,19],[93,20],[100,25],[115,35],[116,36],[138,55],[139,60],[160,80]])assert.equal(calculatePsychAge(score),age);
 for(let score=40;score<=160;score++){assert.equal(RESULTS.filter(r=>score>=r.minScore&&score<=r.maxScore).length,1);assert.ok(calculatePsychAge(score)>=6&&calculatePsychAge(score)<=80);}
 RESULTS.forEach(r=>{assert.equal(r.chartData.length,8);assert.ok(r.chartData.every(d=>d.A>=0&&d.A<=100));});
});
