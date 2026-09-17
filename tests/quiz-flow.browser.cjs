const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const theme of ['history']){
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:8080/${theme}/`);await page.locator('#password-input').fill('9800');await page.locator('.password-btn').click();
 assert.equal(await page.locator('.test-options #start').count(),1);
 await page.locator('#start').click();assert.equal(await page.locator('body').getAttribute('data-view'),'question');
 const total=18;
 for(let i=0;i<total;i++){await page.waitForFunction(i=>document.querySelector('.question-number')?.textContent.startsWith(`第 ${i+1} 问`),i);await page.locator('[data-answer="2"]').click();}
 if(theme==='sins'){for(let i=0;i<2;i++){await page.locator('[data-confirm="both"]').click();await page.locator('#confirm-choice').click();}}
 await page.locator('.result-name').first().waitFor();assert.equal(await page.locator('body').getAttribute('data-view'),'result');
 await page.locator('#home').click();await page.locator('#start').click();await page.locator('.result-name').first().waitFor();
 await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);await page.close();console.log('PASS: '+theme+' compact start, auto result, home/resume, mobile layout');
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
