const fs = require('node:fs');
const path = require('node:path');

const escapeHtml = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function createAssessment({ slug, title, password }, root = path.resolve(__dirname, '..')) {
  if (!/^[a-z][a-z0-9-]{1,47}$/.test(slug || '')) throw new Error('slug 必须是 2–48 位小写英文、数字或连字符，以字母开头。');
  if (typeof title !== 'string' || !title.trim() || title.length > 80 || /[\r\n]/.test(title)) throw new Error('请填写 1–80 字的单行评测标题。');
  if (!/^[a-zA-Z0-9]{4,32}$/.test(password || '')) throw new Error('请指定 4–32 位字母或数字密码。');
  const target = path.join(root, slug);
  if (fs.existsSync(target)) throw new Error('目标目录已存在，未覆盖。');
  const source = path.join(root, 'templates/assessment-v1/source');
  const files = ['index.html', 'full.css', 'cover.css', 'framework.css', 'full.js'];
  const contents = Object.fromEntries(files.map(file => [file, fs.readFileSync(path.join(source, file), 'utf8')]));
  contents['index.html'] = contents['index.html']
    .replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(title.trim())}</title>`)
    .replace('code: "980380"', () => `code: "${password}"`)
    .replace('sins_full35_history_v1', () => `assessment_${slug}_history_v1`)
    .replace('<script src="full.js"></script>', '<link rel="stylesheet" href="theme.css">\n<script src="full.js"></script>');
  contents['full.js'] = contents['full.js'].replace("maxLength=6", `maxLength=${password.length}`);
  if (/[a-z]/i.test(password)) contents['full.js'] = contents['full.js'].replace("inputMode='numeric'", "inputMode='text'");
  fs.mkdirSync(target);
  for (const [file, content] of Object.entries(contents)) fs.writeFileSync(path.join(target, file), content);
  fs.writeFileSync(path.join(target, 'theme.css'), '/* 新主题样式覆盖：保留 framework.css 的导航与自适应行为。 */\n');
  fs.writeFileSync(path.join(target, 'ASSESSMENT.md'), `# ${title.trim()}\n\n状态：底版已初始化，主题内容尚未适配，不能作为新评测发布。\n\n参考 ../templates/assessment-v1/README.md。\n\n- [ ] 首页品牌、标题、模式、说明和视觉\n- [ ] 题库、维度、评分归一化与同分规则\n- [ ] 雷达图、主结论、丰富解读和行动建议\n- [ ] 下载标题及所有七宗罪示例残留\n- [ ] 各模式端到端与多尺寸显示验收\n- [ ] 确认完成后添加根目录合集卡片\n\n历史键：assessment_${slug}_history_v1\n`);
  return target;
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2), options = {};
    for (let i = 0; i < args.length; i += 2) {
      if (!['--slug', '--title', '--password'].includes(args[i]) || !args[i + 1]) throw new Error('用法：node scripts/create-assessment.cjs --slug example --title "评测标题" --password "数字密码"');
      options[args[i].slice(2)] = args[i + 1];
    }
    console.log(`已初始化：${createAssessment(options)}\n请按 ASSESSMENT.md 完成主题适配；当前仍含参考题库。`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { createAssessment };
