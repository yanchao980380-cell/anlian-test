const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844},acceptDownloads:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));const out=path.join(require('node:os').tmpdir(),'xlnl-qa');fs.mkdirSync(out,{recursive:true});
 await p.goto('http://127.0.0.1:8080/xlnl/');await p.waitForTimeout(1000);await p.screenshot({path:path.join(out,'home.png'),fullPage:true});
 assert.equal(await p.locator('#quiz-home').isVisible(),false);assert.ok(!(await p.locator('#start-screen').innerText()).includes('40'));
 await p.locator('#start-btn').click();await p.locator('#auth-input').fill('wrong');await p.locator('#auth-input').press('Enter');assert.match(await p.locator('#auth-error').innerText(),/不正确/);await p.locator('#auth-input').fill('853804');await p.locator('#auth-input').press('Enter');await p.locator('#date-input-screen.active').waitFor();
 await p.selectOption('#input-year','2000');await p.selectOption('#input-month','2');assert.equal(await p.locator('#input-day option').count(),29);await p.selectOption('#input-year','2001');assert.equal(await p.locator('#input-day option').count(),28);await p.selectOption('#input-year','2000');await p.selectOption('#input-month','1');
 await p.getByText('进入测试',{exact:true}).click();await p.locator('#quiz-screen.active').waitFor();await p.screenshot({path:path.join(out,'question.png'),fullPage:true});
 await p.locator('#options-container button').first().click();await p.waitForTimeout(250);await p.locator('#previous-question').click();assert.equal(await p.locator('#options-container .chosen').count(),1);
 for(let i=0;i<40;i++){await p.waitForFunction(i=>document.querySelector('#question-counter').textContent===`第 ${i+1} 题`,i);await p.locator('#options-container button').nth(i%4).click();await p.waitForTimeout(230);}
 await p.locator('#submit-quiz').click();await p.locator('#result-screen.active').waitFor();await p.waitForTimeout(1000);assert.equal(await p.locator('#res-total-score').innerText(),'100');assert.equal(await p.locator('#res-psych-age').innerText(),'25');assert.ok((await p.locator('#result-screen').innerText()).length>500);await p.screenshot({path:path.join(out,'result.png'),fullPage:true});
 const event=p.waitForEvent('download');await p.locator('.export-report').click();const d=await event;await d.saveAs(path.join(out,'report.txt'));assert.ok(fs.readFileSync(path.join(out,'report.txt'),'utf8').includes('25'));
 await p.reload();await p.locator('#history-btn').click();await p.locator('.history-list button').first().click();assert.equal(await p.locator('#res-total-score').innerText(),'100');
 for(const width of [320,375,430,1440]){await p.setViewportSize({width,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'report overflow '+width);await p.waitForTimeout(400);await p.screenshot({path:path.join(out,`report-${width}.png`),fullPage:true});await p.locator('#quiz-home').click();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'home overflow '+width);await p.locator('#start-btn').click();await p.locator('#auth-input').press('Escape');assert.equal(await p.locator('#auth-dialog').isVisible(),false);await p.locator('#history-btn').click();await p.locator('.history-list button').first().click();}
 assert.deepEqual(errors,[]);console.log('PASS: 40 questions, source score 100/age 25, password, leap dates, answer revision, report, history, download, mobile/desktop; '+out);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
