const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createAssessment } = require('../scripts/create-assessment.cjs');

test('生成独立底版，正确替换配置，并拒绝覆盖和目录穿越', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'assessment-template-'));
  fs.cpSync(path.resolve(__dirname, '../templates'), path.join(root, 'templates'), { recursive: true });
  const options = { slug: 'demo', title: '关系 & <探索>', password: '12345678' };
  const target = createAssessment(options, root);
  const html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');
  assert.ok(html.includes('<title>关系 &amp; &lt;探索&gt;</title>'));
  assert.ok(html.includes('code: "12345678"'));
  assert.ok(html.includes('assessment_demo_history_v1'));
  assert.ok(!html.includes('sins_full35_history_v1'));
  assert.ok(html.includes('href="theme.css"'));
  assert.ok(fs.readFileSync(path.join(target, 'full.js'), 'utf8').includes('maxLength=8'));
  assert.ok(fs.readFileSync(path.join(target, 'ASSESSMENT.md'), 'utf8').includes('尚未适配'));
  assert.throws(() => createAssessment(options, root), /已存在/);
  assert.equal(fs.readFileSync(path.join(target, 'index.html'), 'utf8'), html);
  assert.throws(() => createAssessment({ ...options, slug: '../escape' }, root), /slug/);
  assert.throws(() => createAssessment({ ...options, slug: 'other', password: 'abc' }, root), /数字密码/);
  assert.ok(!fs.existsSync(path.join(root, 'other')));
  const second = createAssessment({ ...options, slug: 'second' }, root);
  assert.ok(fs.readFileSync(path.join(second, 'index.html'), 'utf8').includes('assessment_second_history_v1'));
  console.log(`验证样例保存在系统临时目录：${root}`);
});
