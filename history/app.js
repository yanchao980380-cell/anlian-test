'use strict';
const { questions, profiles, dimensions, match } = HistoryQuiz;
const OPTIONS = ['很不符合', '不太符合', '视情况而定', '比较符合', '非常符合'];
const STORAGE_KEY = 'history-quiz-v2';
const main = document.getElementById('main-content');
let state = { unlocked: false, current: 0, answers: Array(questions.length).fill(null), completed: false, checks: Array(7).fill(false) };
let timer = null;
let busy = false;
let storageAvailable = true;

try {
  const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
  if (saved && saved.unlocked === true && Array.isArray(saved.answers) && saved.answers.length === questions.length && saved.answers.every(v => v === null || Number.isInteger(v) && v >= 0 && v <= 4) && Number.isInteger(saved.current) && saved.current >= 0 && saved.current < questions.length) {
    state = { ...state, ...saved, completed: saved.completed === true && saved.answers.every(v => v !== null), checks: Array.isArray(saved.checks) && saved.checks.length === 7 ? saved.checks.map(v => v === true) : Array(7).fill(false) };
  }
} catch (_) { storageAvailable = false; }

function save() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (_) { storageAvailable = false; }
}
function stopTransition() { clearTimeout(timer); timer = null; busy = false; }
function render(html, focusSelector) {
  document.body.classList.toggle('view-result', html.includes('class="result-card'));
  document.body.dataset.view = html.includes('class="result-card') ? 'result' : html.includes('class="question-card') ? 'question' : html.includes('class="password-card') ? 'password' : 'start';
  main.innerHTML = html;
  if (focusSelector) main.querySelector(focusSelector)?.focus({ preventScroll: true });
}
function scrollTop() { window.scrollTo({ top: 0, behavior: 'instant' }); }
function notify(message) {
  const el = document.getElementById('notice');
  el.textContent = message;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 3500);
}
function landscape() {
  return '<svg class="landscape" viewBox="0 0 420 110" aria-hidden="true"><circle cx="318" cy="29" r="21" fill="#d9bb80" opacity=".6"/><path d="M0 99L62 38 101 74 165 19 221 75 270 50 333 98Z" fill="#c9cfb6"/><path d="M44 110L129 60 174 87 225 36 311 99 358 65 420 110Z" fill="#91a38c"/><path d="M0 110L52 87 103 105 177 70 223 108 291 87 346 104 392 85 420 110Z" fill="#365b48"/><path d="M168 110Q227 94 205 87T216 72" fill="none" stroke="#f7f0df" stroke-width="2"/><path d="M58 28q8-7 16 0m0 0q8-7 16 0" fill="none" stroke="#708674" stroke-width="1.5"/></svg>';
}
function showPassword() {
  render(`<section class="password-card">${landscape()}<span class="seal" aria-hidden="true">启卷</span><h2 class="password-title">一卷人物志，等你开启</h2><p class="password-desc">在古人的故事里，发现自己的处事风格</p><form id="password-form"><label class="password-label" for="password-input">访问密码</label><input class="password-input" id="password-input" type="password" inputmode="numeric" maxlength="4" placeholder="请输入四位密码" autocomplete="off" required aria-describedby="password-error"><p class="password-error" id="password-error" role="alert"></p><button class="password-btn" type="submit">解锁人物志 →</button></form><p class="password-hint">请使用你获得的访问密码</p></section><div class="feature-strip" style="color:#d3d9c9"><span>日常情境探索</span><span>8 位历史人物</span><span>专属行动建议</span></div>`);
  document.getElementById('password-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('password-input');
    if (input.value !== '9800') {
      document.getElementById('password-error').textContent = '密码不正确，请检查后重试。';
      input.setAttribute('aria-invalid', 'true'); input.select(); return;
    }
    state.unlocked = true; save(); showStart();
  });
  document.getElementById('password-input').addEventListener('input', e => { e.target.removeAttribute('aria-invalid'); document.getElementById('password-error').textContent = ''; });
}
function showStart() {
  stopTransition();
  const count = state.answers.filter(v => v !== null).length;
  render(`<div class="test-options"><button class="test-option" id="start"><span class="option-icon">史</span><span><span class="option-title">${state.completed ? '查看我的完整报告' : count ? '继续我的探索' : '开启我的人物志'}</span><span class="option-desc">发现与你处事风格相近的历史人物<br>8位人物原型 · 专属行动建议</span></span><span class="entry-arrow" aria-hidden="true">→</span></button></div><div class="flow-meta"><span>单题自动切换</span><span>雷达图解读</span><span>7天行动清单</span></div>${count ? `<div class="flow-resume"><p class="resume-info">已保留本页的作答进度${state.completed ? '与报告' : '，可以继续'}。</p><button class="text-btn" id="fresh">重新开始一份作答</button></div>` : ''}<aside class="flow-guide"><strong>开始前，给自己一点真实的空间</strong><p>按近期通常的表现选择，没有标准答案。选择后自动进入下一题，完成最后一题直接展示报告；可随时返回修改。</p><p>原创娱乐与自我探索，不属于专业心理测评。只保存当前标签页内的进度，不采集姓名和联系方式。</p></aside>${!storageAvailable ? '<p class="storage-note">当前浏览器无法保留进度，请尽量一次完成。</p>' : ''}`);
  document.getElementById('start').onclick = () => { if (state.completed) showResult(); else showQuestion(); scrollTop(); };
  document.getElementById('fresh')?.addEventListener('click', restart);
}
function restart() {
  if (state.answers.some(v => v !== null) && !window.confirm('重新开始会清除本次答案和行动勾选，确定继续吗？')) return;
  stopTransition(); state.current = 0; state.answers.fill(null); state.checks.fill(false); state.completed = false; save(); showQuestion(); scrollTop();
}
function showQuestion() {
  stopTransition();
  const q = questions[state.current];
  const count = state.answers.filter(v => v !== null).length;
  render(`<div class="progress-container"><div class="progress-info"><span>人物志 · 日常选择</span><span><strong>${String(state.current + 1).padStart(2, '0')}</strong> / ${questions.length}</span></div><div class="progress-bar" role="progressbar" aria-label="答题完成进度" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${count}"><div class="progress-fill" style="width:${count / questions.length * 100}%"></div></div></div><section class="question-card"><div class="question-number">第 ${state.current + 1} 问 · 没有标准答案</div><h2 class="question-text" id="question-heading" tabindex="-1">${q.text}</h2><div class="options-grid" role="group" aria-labelledby="question-heading">${OPTIONS.map((label, i) => `<button class="option-item${state.answers[state.current] === i ? ' selected' : ''}" data-answer="${i}" aria-pressed="${state.answers[state.current] === i}"><span class="option-radio" aria-hidden="true">${state.answers[state.current] === i ? '✓' : String.fromCharCode(65 + i)}</span><span>${label}</span></button>`).join('')}</div></section><div class="navigation"><button class="btn btn-secondary" id="previous" ${state.current === 0 ? 'disabled' : ''}>← 上一题</button><button class="btn btn-primary" id="next" ${state.answers[state.current] === null ? 'disabled' : ''}>${state.current === questions.length - 1 ? '展开我的人物志' : '下一题 →'}</button></div><p class="auto-next-hint">${state.current === questions.length - 1 ? '最后一题：选择后自动查看完整报告' : '选择后自动下一题 · 可返回修改'}</p><button class="text-btn" id="pause">暂存并返回介绍</button>`, '#question-heading');
  main.querySelectorAll('[data-answer]').forEach(button => button.onclick = () => selectOption(Number(button.dataset.answer)));
  document.getElementById('previous').onclick = () => { stopTransition(); if (state.current > 0) { state.current--; save(); showQuestion(); } };
  document.getElementById('next').onclick = advance;
  document.getElementById('pause').onclick = () => { stopTransition(); save(); showStart(); };
}
function selectOption(value) {
  if (busy) return;
  state.answers[state.current] = value; state.completed = false; state.checks.fill(false); save();
  main.querySelectorAll('[data-answer]').forEach(button => {
    const selected = Number(button.dataset.answer) === value;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected));
    button.querySelector('.option-radio').textContent = selected ? '✓' : String.fromCharCode(65 + Number(button.dataset.answer));
  });
  document.getElementById('next').disabled = false;
  busy = true; timer = setTimeout(advance, 350);
}
function advance() {
  stopTransition();
  if (state.answers[state.current] === null) return;
  if (state.current < questions.length - 1) { state.current++; save(); showQuestion(); }
  else if (state.answers.some(v => v === null)) { state.current = state.answers.indexOf(null); save(); showQuestion(); }
  else { state.completed = true; save(); showResult(); scrollTop(); }
}
function section(n, title, body) { return `<section class="section-card" id="report-${n}"><h3 class="section-title"><span>${n}</span>${title}</h3>${body}</section>`; }
function paragraphs(text) { return `<div class="section-content">${text.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>`; }
function list(items) { return `<ul class="report-list">${items.map(item => `<li>${item}</li>`).join('')}</ul>`; }
const PERSON_TAGS = {
  sushi: ['旷达表达', '生活热忱', '善于联结'], liqingzhao: ['细腻感知', '独立审美', '用心表达'],
  zhugeliang: ['全局视野', '有序推进', '长期担当'], wangyangming: ['原则清晰', '知行相伴', '主动实践'],
  xuxiake: ['亲身探索', '独立出发', '好奇不止'], shenkuo: ['追问原理', '观察求证', '细节洞察'],
  simaqian: ['长线投入', '记录沉淀', '坚定书写'], wangxizhi: ['细节打磨', '审美表达', '专注练习']
};
function radarChart(scores) {
  const point = (i, value, radius = 88) => { const angle = -Math.PI / 2 + i * Math.PI / 3; return [160 + Math.cos(angle) * radius * value, 126 + Math.sin(angle) * radius * value]; };
  const points = value => dimensions.map((_, i) => point(i, value).join(',')).join(' ');
  return `<div class="radar-wrap"><svg viewBox="0 0 320 252" role="img" aria-label="六维偏好雷达图，具体分数见下方。图形大小不代表能力高低。"><title>本次作答的六维偏好</title>${[.25, .5, .75, 1].map(v => `<polygon points="${points(v)}" fill="none" stroke="#d7d8c6" stroke-width="1"/>`).join('')}${dimensions.map((_, i) => `<line x1="160" y1="126" x2="${point(i, 1)[0]}" y2="${point(i, 1)[1]}" stroke="#d7d8c6"/>`).join('')}<polygon points="${dimensions.map((d, i) => point(i, scores[d.id] / 4).join(',')).join(' ')}" fill="#50775b" fill-opacity=".2" stroke="#365e48" stroke-width="2" stroke-linejoin="round"/>${dimensions.map((d, i) => { const [x, y] = point(i, scores[d.id] / 4); const [tx, ty] = point(i, 1, 112); return `<circle cx="${x}" cy="${y}" r="3" fill="#b59860" stroke="#faf6eb" stroke-width="1.5"/><text x="${tx}" y="${ty + 4}" text-anchor="middle" fill="#56664f" font-size="10">${d.name}</text>`; }).join('')}</svg><span class="radar-caption">每一种形状，都有自己的节奏</span></div>`;
}
function resultHero(p) {
  const portrait = window.HistoryPortraits?.[p.id];
  return `<section class="result-card result-dossier${portrait ? ' has-portrait' : ''}"><div class="dossier-topline"><span>人物志 / PERSONAL ARCHIVE</span><span>NO. ${String(profiles.indexOf(p) + 1).padStart(2, '0')}</span></div><div class="portrait-layout"><div class="identity"><div class="result-kicker">本次与你最相近的人物</div><h2 class="result-name" tabindex="-1">${p.name}</h2><div class="result-era">${p.era}</div><span class="seal" aria-hidden="true">${p.seal}</span></div>${portrait ? `<div class="portrait-art"><img class="person-portrait" src="${portrait}" alt="${p.name}的原创卡通形象" width="512" height="512" fetchpriority="high"><span class="portrait-caption">原创趣味演绎</span></div>` : ''}</div><div class="identity-summary"><div class="result-type">${p.style}</div><p class="result-line">${p.line}</p><div class="person-tags">${PERSON_TAGS[p.id].map(t => `<span>${t}</span>`).join('')}</div></div><div class="dossier-bottomline"><span>以古人为镜</span><span>看见你自己的可能</span></div></section>`;
}
function extraAdvice(result) {
  const d = [...dimensions].sort((a, b) => result.scores[a.id] - result.scores[b.id])[0];
  const score = result.scores[d.id];
  const description = score < 1.75 ? `你更认同“${d.low}”的节奏。` : score > 2.25 ? `你更认同“${d.high}”的节奏。` : '你的答案在两种节奏之间较为均衡，可能会随情境调整。';
  return `本次「${d.name}」为${Number((score * 25).toFixed(1))}/100。${description}这不是能力高低的判断，也无需为了分数改变自己。\n\n如果想拓展自己的做法，可以尝试这个小行动：${d.tip}`;
}
function showResult() {
  stopTransition();
  let result;
  try { result = match(state.answers); } catch (_) { state.completed = false; state.current = Math.max(0, state.answers.indexOf(null)); showQuestion(); return; }
  state.completed = true; save();
  const p = result.primary;
  const summaryNote = result.flat ? '你每题都选择了同一选项，答案区分度有限；以下仍给出本规则下的明确匹配。可返回按具体情境重新选择。' : result.tied ? `本次与${result.secondary.name}原型同分，按固定人物顺序展示${p.name}；两种风格都值得参考。` : result.close ? `本次最接近${p.name}，与${result.secondary.name}的差距较小；你可能同时认同两者的一些特点。` : '这是本次答案与8个原创人物原型比较后的最接近结果，不是相似概率或能力评价。';
  render(`${resultHero(p)}<p class="result-note result-explanation">${summaryNote}</p><nav class="report-nav" aria-label="报告章节"><a href="#report-01">匹配线索</a><a href="#report-03">人物解读</a><a href="#report-08">行动指南 <span>7天</span></a></nav><div class="report-intro"><span>属于你的，九页人物小传</span><span>向下展开 ↓</span></div>
    ${section('01', '为什么是这位人物', `<p class="quiet">以下选取与你的结果原型较贴近的三处回答。它们是本次作答的线索，不代表你在所有情境中都如此。</p>${result.evidence.map(q => `<div class="evidence"><blockquote>“${q.text}”</blockquote><p>你的选择：<strong>${OPTIONS[q.answer]}</strong><br>对应「${dimensions.find(d => d.id === q.dim).name}」：${q.reverse ? 4 - q.answer >= 3 ? '更靠近主动投入的一端' : 4 - q.answer <= 1 ? '更靠近另一种节奏' : '会随情境调整' : q.answer >= 3 ? '更靠近主动投入的一端' : q.answer <= 1 ? '更靠近另一种节奏' : '会随情境调整'}。</p></div>`).join('')}`)}
    ${section('02', '你的六种处事偏好', `<p class="quiet">每项由3道题汇总。分数表示对右侧偏好的认同程度，并非能力分；两端都没有高下之分。</p>${radarChart(result.scores)}<div class="dimension-grid">${dimensions.map(d => `<div class="dimension-item"><div class="dimension-label"><span>${d.name}</span><small>${Number((result.scores[d.id] * 25).toFixed(1))} / 100</small></div><div class="dimension-bar"><div class="dimension-fill" style="width:${result.scores[d.id] * 25}%"></div></div><div class="dimension-ends"><span>${d.low}</span><span>${d.high}</span></div></div>`).join('')}</div>`)}
    ${section('03', '读懂你的处事风格', paragraphs(p.analysis))}
    ${section('04', '值得发挥的三个优势', list(p.strengths))}
    ${section('05', '容易卡住的地方', `<p class="quiet">这些是该风格可能遇到的情境，不是对你的定论。只保留与你实际经历相符的部分。</p>${list(p.risks)}`)}
    ${section('06', '把理解带回真实生活', p.scenarios.map(s => { const [title, content] = s.split('｜'); return `<div class="scenario"><strong>${title}</strong>${content}</div>`; }).join(''))}
    ${section('07', '给本次作答的一点补充', paragraphs(extraAdvice(result)))}
    ${section('08', '接下来7天，试着这样做', `<p class="quiet">每天选一个小动作。可以调整顺序，也可以跳过不适用的建议。勾选仅在当前标签页内保留，建议保存报告供后续回看。</p><div class="plan-progress"><div class="plan-count" id="plan-count" role="status">已完成 ${state.checks.filter(Boolean).length} / 7</div><div class="plan-track"><div id="plan-fill" style="width:${state.checks.filter(Boolean).length / 7 * 100}%"></div></div></div>${p.plan.map((item, i) => `<label class="plan-item"><input type="checkbox" data-day="${i}" ${state.checks[i] ? 'checked' : ''}><span><b>DAY ${String(i + 1).padStart(2, '0')}</b>${item}</span></label>`).join('')}`)}
    ${section('09', '人物小笺', `<div class="section-content">${p.history}</div><p class="quiet">上述风格、优势和建议属于本互动的原创解读，不是对历史人物的心理测量。</p><a class="quiet" href="${p.source}" target="_blank" rel="noopener noreferrer">阅读人物背景资料 ↗</a>`)}
    <div class="encourage-box">${p.closing}</div><details class="report-details"><summary>这份结果如何产生？</summary><p>18道题分为6个维度，每维度3题，其中包含反向表述。答案换算为0–4分后取维度均值，再与8个创作原型进行等权平方距离比较，距离最小者为结果。同分时按固定人物顺序展示，不随机分配。所有原型参数均为本互动的创作设定，未经过心理学效度验证；不推断性别、疾病、职业适配或命运。</p><p>人物池：${profiles.map(person => person.name).join('、')}。历史人物是多面的，结果只借用部分文化意象。</p></details><div class="navigation"><button class="btn btn-secondary" id="copy">复制报告</button><button class="btn btn-primary" id="download">保存完整报告 ↓</button></div><div class="navigation"><button class="btn btn-secondary" id="review">回看并修改答案</button><button class="btn btn-secondary" id="restart">重新探索</button></div><p class="auto-next-hint">保存为文字文件，包含分析与行动清单，方便随时回看。</p>`, '.result-name');
  main.querySelectorAll('[data-day]').forEach(input => input.onchange = () => { state.checks[Number(input.dataset.day)] = input.checked; save(); document.getElementById('plan-count').textContent = `已完成 ${state.checks.filter(Boolean).length} / 7`; document.getElementById('plan-fill').style.width = `${state.checks.filter(Boolean).length / 7 * 100}%`; });
  main.insertAdjacentHTML('beforeend', '<div class="navigation flow-result-actions"><button class="btn btn-primary" id="home">返回测试首页</button><a class="btn btn-secondary" href="../" style="text-decoration:none;text-align:center">更多测试</a></div>');
  document.getElementById('home').onclick = () => { showStart(); scrollTop(); };
  document.getElementById('restart').onclick = restart;
  document.getElementById('review').onclick = () => { state.current = 0; state.completed = false; save(); showQuestion(); scrollTop(); };
  document.getElementById('download').onclick = downloadReport;
  document.getElementById('copy').onclick = async () => {
    try { await navigator.clipboard.writeText(reportText()); notify('完整报告已复制，可以粘贴保存。'); }
    catch (_) { notify('浏览器暂不支持复制，请使用“保存完整报告”。'); }
  };
}
function reportText() {
  const r = match(state.answers), p = r.primary;
  return [`人物志｜你最像历史中的谁？`, `本次结果：${p.name} · ${p.style}`, p.line,
    r.flat ? '提示：本次选项完全相同，结果区分度有限。' : '', r.tied ? `提示：与${r.secondary.name}同分，按固定顺序展示。` : r.close ? `提示：与${r.secondary.name}的距离较接近。` : '',
    '\n为什么是这位人物', ...r.evidence.map(q => `${q.text}\n你的选择：${OPTIONS[q.answer]}`),
    '\n六种处事偏好（非能力分）', ...dimensions.map(d => `${d.name}：${Number((r.scores[d.id] * 25).toFixed(1))}/100（${d.low} ← → ${d.high}）`),
    '\n处事风格', p.analysis, '\n三个优势', ...p.strengths, '\n容易卡住的地方', ...p.risks,
    '\n生活中的应用', ...p.scenarios, '\n本次作答的补充', extraAdvice(r),
    '\n7天行动清单', ...p.plan.map((item, i) => `${state.checks[i] ? '[已完成]' : '[待尝试]'} 第${i + 1}天：${item}`),
    '\n人物小笺', p.history, p.source, '\n写给你', p.closing,
    '\n原创趣味互动，非专业心理测评。人物原型与建议为创作设定，不预测命运，不代表完整历史人物或能力高低。',
    '匹配方式：六维度与八个原创原型等权平方距离比较，同分按固定顺序展示。'
  ].filter(Boolean).join('\n\n');
}
function downloadReport() {
  const p = match(state.answers).primary;
  const url = URL.createObjectURL(new Blob(['\uFEFF' + reportText()], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `我的人物志-${p.name}.txt`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('已发起报告下载，可在浏览器下载记录中查看。');
}
if (!state.unlocked) showPassword();
else if (state.completed) showResult();
else showStart();
