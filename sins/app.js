'use strict';
const { questions, profiles, virtues, score } = SinsQuiz;
const OPTIONS = ['很不符合', '不太符合', '视情况而定', '比较符合', '非常符合'];
const STORAGE_KEY = 'sins-virtues-v2';
const main = document.getElementById('main-content');
let state = { unlocked: false, current: 0, answers: Array(questions.length).fill(null), completed: false, confirmations: {}, checks: Array(7).fill(false) };
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
function landscape(){return '<div class="dual-intro" aria-hidden="true"><span>DESIRE<small>欲望的回声</small></span><i>×</i><span>VIRTUE<small>善意的形状</small></span></div>';}
function showPassword() {
  render(`<section class="password-card">${landscape()}<span class="seal" aria-hidden="true">VII</span><h2 class="password-title">每一面，都有它的来处</h2><p class="password-desc">从日常选择出发，理解你的需要与回应方式。</p><form id="password-form"><label class="password-label" for="password-input">访问密码</label><input class="password-input" id="password-input" type="password" inputmode="numeric" maxlength="4" placeholder="请输入四位密码" autocomplete="off" required aria-describedby="password-error"><p class="password-error" id="password-error" role="alert"></p><button class="password-btn" type="submit">解锁双面档案 →</button></form><p class="password-hint">请使用你获得的访问密码</p></section><div class="feature-strip" ><span>日常情境探索</span><span>双面文学原型</span><span>专属行动建议</span></div>`);
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
  render(`<div class="test-options"><button class="test-option" id="start"><span class="option-icon">VII</span><span><span class="option-title">${state.completed ? '查看我的完整报告' : count ? '继续我的探索' : '开启我的双面档案'}</span><span class="option-desc">探索欲望与美德的独立倾向<br>双轴独立计分 · 专属行动建议</span></span><span class="entry-arrow" aria-hidden="true">→</span></button></div><div class="flow-meta"><span>单题自动切换</span><span>雷达图解读</span><span>7天行动清单</span></div>${count ? `<div class="flow-resume"><p class="resume-info">已保留本页的作答进度${state.completed ? '与报告' : '，可以继续'}。</p><button class="text-btn" id="fresh">重新开始一份作答</button></div>` : ''}<aside class="flow-guide"><strong>开始前，给自己一点真实的空间</strong><p>按近期通常的表现选择，没有标准答案。选择后自动进入下一题，完成常规作答后，同分时会邀请你补充情境选择，再展示报告；可随时返回修改。</p><p>原创娱乐与自我探索，不属于专业心理测评。只保存当前标签页内的进度，不采集姓名和联系方式。</p></aside>${!storageAvailable ? '<p class="storage-note">当前浏览器无法保留进度，请尽量一次完成。</p>' : ''}`);
  document.getElementById('start').onclick = () => { if (state.answers.every(v => v !== null)) showResult(); else showQuestion(); scrollTop(); };
  document.getElementById('fresh')?.addEventListener('click', restart);
}
function restart() {
  if (state.answers.some(v => v !== null) && !window.confirm('重新开始会清除本次答案和行动勾选，确定继续吗？')) return;
  stopTransition(); state.current = 0; state.answers.fill(null); state.checks.fill(false); state.completed = false; state.confirmations = {}; save(); showQuestion(); scrollTop();
}
function showQuestion() {
  stopTransition();
  const q = questions[state.current];
  const count = state.answers.filter(v => v !== null).length;
  render(`<div class="progress-container"><div class="progress-info"><span>双面档案 · 日常选择</span><span><strong>${String(state.current + 1).padStart(2, '0')}</strong> / ${questions.length}</span></div><div class="progress-bar" role="progressbar" aria-label="答题完成进度" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${count}"><div class="progress-fill" style="width:${count / questions.length * 100}%"></div></div></div><section class="question-card"><div class="question-number">第 ${state.current + 1} 问 · 没有标准答案</div><h2 class="question-text" id="question-heading" tabindex="-1">${q.text}</h2><div class="options-grid" role="group" aria-labelledby="question-heading">${OPTIONS.map((label, i) => `<button class="option-item${state.answers[state.current] === i ? ' selected' : ''}" data-answer="${i}" aria-pressed="${state.answers[state.current] === i}"><span class="option-radio" aria-hidden="true">${state.answers[state.current] === i ? '✓' : String.fromCharCode(65 + i)}</span><span>${label}</span></button>`).join('')}</div></section><div class="navigation"><button class="btn btn-secondary" id="previous" ${state.current === 0 ? 'disabled' : ''}>← 上一题</button><button class="btn btn-primary" id="next" ${state.answers[state.current] === null ? 'disabled' : ''}>${state.current === questions.length - 1 ? '查看我的完整档案' : '下一题 →'}</button></div><p class="auto-next-hint">${state.current === questions.length - 1 ? '常规作答最后一题：接下来确认结果' : '选择后自动下一题 · 可返回修改'}</p><button class="text-btn" id="pause">暂存并返回介绍</button>`, '#question-heading');
  main.querySelectorAll('[data-answer]').forEach(button => button.onclick = () => selectOption(Number(button.dataset.answer)));
  document.getElementById('previous').onclick = () => { stopTransition(); if (state.current > 0) { state.current--; save(); showQuestion(); } };
  document.getElementById('next').onclick = advance;
  document.getElementById('pause').onclick = () => { stopTransition(); save(); showStart(); };
}
function selectOption(value) {
  if (busy) return;
  state.answers[state.current] = value; state.completed = false; state.confirmations = {}; state.checks.fill(false); save();
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

if(!state.unlocked)showPassword();else if(state.completed)showResult();else showStart();
