// Run with NODE_PATH pointing to an installed Playwright package directory.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { questions, profiles } = require('../history/data.js');
const output = process.env.HISTORY_TEST_OUTPUT || path.join(require('node:os').tmpdir(), 'history-preview');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8080/');
    await page.locator('a[href="history/"]').click();
    await page.locator('#password-input').waitFor();
    await page.screenshot({ path: path.join(output, 'password-mobile.png'), fullPage: true });
    await page.locator('#password-input').fill('1111');
    await page.locator('.password-btn').click();
    assert.match(await page.locator('#password-error').innerText(), /不正确/);
    assert.equal(await page.locator('#start').count(), 0);
    await page.locator('#password-input').fill('9800');
    await page.locator('#password-input').press('Enter');
    await page.locator('#start').click();
    assert.equal(await page.locator('#next').isDisabled(), true);
    await page.screenshot({ path: path.join(output, 'question-mobile.png'), fullPage: true });
    const target = profiles[0];
    const answers = questions.map(q => q.reverse ? 4 - target.vector[q.dim] : target.vector[q.dim]);
    for (let i = 0; i < questions.length; i++) {
      await page.waitForFunction(index => document.querySelector('.question-number')?.textContent.startsWith(`第 ${index + 1} 问`), i);
      await page.locator(`[data-answer="${answers[i]}"]`).click();
      if (i === 4) {
        await page.waitForFunction(() => document.querySelector('.question-number')?.textContent.startsWith('第 6 问'));
        await page.reload();
        assert.match(await page.locator('.resume-info').innerText(), /已保留本页的作答进度/);
        await page.locator('#start').click();
        await page.locator('#previous').click();
        assert.equal(await page.locator(`[data-answer="${answers[4]}"]`).getAttribute('aria-pressed'), 'true');
        await page.locator('#next').click();
      }
    }
    await page.locator('#next').click();
    assert.equal(await page.locator('.result-name').innerText(), '苏轼');
    assert.equal(await page.locator('.section-card').count(), 9);
    assert.equal(await page.locator('.plan-item').count(), 7);
    const reportBody = await page.locator('#main-content').innerText();
    for (const paragraph of target.analysis.split('\n\n')) assert.ok(reportBody.includes(paragraph));
    for (const advice of target.plan) assert.ok(reportBody.includes(advice));
    await page.locator('[data-day="0"]').check();
    await page.reload();
    assert.equal(await page.locator('[data-day="0"]').isChecked(), true);
    await page.screenshot({ path: path.join(output, 'report-mobile.png'), fullPage: true });
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#download').click();
    const download = await downloadPromise;
    await download.saveAs(path.join(output, download.suggestedFilename()));
    const downloaded = fs.readFileSync(path.join(output, download.suggestedFilename()), 'utf8');
    assert.match(downloaded, /苏轼/);
    assert.match(downloaded, /\[已完成\] 第1天/);
    assert.match(downloaded, /7天行动清单/);
    for (const profile of profiles) {
      const values = questions.map(q => q.reverse ? 4 - profile.vector[q.dim] : profile.vector[q.dim]);
      await page.evaluate(values => sessionStorage.setItem('history-quiz-v2', JSON.stringify({ unlocked: true, current: 17, answers: values, completed: true, checks: Array(7).fill(false) })), values);
      await page.reload();
      assert.equal(await page.locator('.result-name').innerText(), profile.name);
      assert.equal(await page.locator('.plan-item').count(), 7);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${profile.name} should fit mobile`);
    }
    // Neutral answers must not be described as a preference for either end.
    await page.evaluate(() => sessionStorage.setItem('history-quiz-v2', JSON.stringify({ unlocked: true, current: 17, answers: Array(18).fill(2), completed: true })));
    await page.reload();
    assert.match(await page.locator('.result-note').innerText(), /区分度有限/);
    const supplement = await page.locator('.section-card').nth(6).innerText();
    assert.ok(!supplement.includes('更偏向'), 'neutral scores must not claim an end preference');
    await page.locator('#review').click();
    await page.locator('[data-answer="4"]').click();
    await page.locator('#next').click();
    await page.waitForTimeout(400);
    assert.match(await page.locator('.question-number').innerText(), /第 2 问/);
    await page.locator('#pause').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#fresh').click();
    assert.equal(await page.locator('#next').isDisabled(), true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#pause').click();
    await page.screenshot({ path: path.join(output, 'start-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 320, height: 740 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => { Storage.prototype.setItem = function () { throw new Error('storage blocked'); }; });
    const blockedPage = await blocked.newPage();
    await blockedPage.goto('http://127.0.0.1:8080/history/');
    await blockedPage.locator('#password-input').fill('9800');
    await blockedPage.locator('.password-btn').click();
    await blockedPage.locator('#start').click();
    assert.equal(await blockedPage.locator('.question-number').count(), 1);
    console.log('PASS: password, 18-question flow, resume, backtracking, eight results, checklist, export, neutral answer disclosure, rapid navigation, reset, mobile/desktop layout, blocked storage; no page errors.');
    console.log('Screenshots and report:', output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
