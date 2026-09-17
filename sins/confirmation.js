'use strict';
const CONFIRM_SCENARIOS={
 pride:'被别人质疑时，我更在意证明自己的判断、守住被认可的感觉。',
 greed:'遇到新的资源或机会时，我更想先握在手里，让未来多一些选择。',
 lust:'遇到有吸引力的人或体验时，我更容易被心动与新鲜感带着走。',
 envy:'看到别人走在前面时，我更容易比较差距，想追上对方。',
 gluttony:'正在享受喜欢的活动时，我更容易想“再多一会儿”，不急着结束。',
 wrath:'感到不公平或被冒犯时，我更容易立刻反驳，把边界说出来。',
 sloth:'遇到费力的任务时，我更容易先延后，等状态好一点再开始。',
 humility:'收到不同意见时，我会先检查自己是否漏掉了信息，再决定要不要调整。',
 kindness:'别人表现得不如预期时，我会先了解处境，给对方解释的空间。',
 patience:'进展缓慢或发生分歧时，我愿意听完、等一等，再表达自己的想法。',
 diligence:'即使没有人催促，我也愿意把答应的事拆成小步继续完成。',
 charity:'在自己有余力时，我愿意分享时间或经验，不要求立刻得到回报。',
 temperance:'享受一项活动时，我会留意自己的安排，并主动决定什么时候收尾。',
 chastity:'想靠近一个人时，我会先确认双方意愿，尊重彼此的相处边界。'
};
function showConfirmation(r){
 stopTransition();state.completed=false;save();
 const key=r.pending[0],items=key==='sin'?r.tied:r.virtueTied;
 const groups=[...(r.tied.length>1?['sin']:[]),...(r.virtueTied.length>1?['virtue']:[])];
 const number=18+groups.indexOf(key)+1,total=18+groups.length;
 render(`<div class="progress-container"><div class="progress-info"><span>同分情境确认 · ${key==='sin'?'宗罪侧':'美德侧'}</span><span>${number} / ${total}</span></div></div><section class="question-card confirmation-card"><div class="question-number">只在同分时出现</div><h2 class="question-text" id="question-heading" tabindex="-1">回想最近一次真实经历，下面哪种反应更像你？</h2><p class="quiet">${names(items)}的认同分都是 ${r.scores[items[0].id]}。这次选择只确认你更认同的主倾向，不修改雷达分数。</p><div class="options-grid" role="group" aria-labelledby="question-heading">${items.map(p=>`<button class="option-item" data-confirm="${p.id}" aria-pressed="false"><span>${CONFIRM_SCENARIOS[p.id]}</span></button>`).join('')}<button class="option-item" data-confirm="both" aria-pressed="false"><span>都差不多，暂时无法选出更像我的一种</span></button></div><button class="start-btn" id="confirm-choice" disabled style="margin-top:18px">确认我的选择 →</button></section><div class="navigation"><button class="btn btn-secondary" id="confirm-back">回看常规答案</button><button class="btn btn-secondary" id="confirm-pause">暂存并返回</button></div>`,'#question-heading');
 let selected=null;
 main.querySelectorAll('[data-confirm]').forEach(button=>button.onclick=()=>{selected=button.dataset.confirm;main.querySelectorAll('[data-confirm]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});document.getElementById('confirm-choice').disabled=false;});
 document.getElementById('confirm-choice').onclick=()=>{if(!selected)return;state.confirmations={...state.confirmations,[key]:selected};state.checks.fill(false);save();showResult();scrollTop();};
 document.getElementById('confirm-back').onclick=()=>{state.current=questions.length-1;save();showQuestion();scrollTop();};
 document.getElementById('confirm-pause').onclick=()=>{save();showStart();scrollTop();};
}
