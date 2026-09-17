// Local integration of the supplied reference, retaining the requested short quiz.
let tieChoices={};
const fullBasic=[...basicQuestions],fullVs=[...vsQuestions];
basicQuestions.splice(0,basicQuestions.length,...fullBasic.filter((q,i)=>i<14||[14,15,18,20].includes(i)));
vsQuestions.splice(0,vsQuestions.length,...fullVs.filter((q,i)=>i<14||[14,15,21,25].includes(i)));
questions=basicQuestions;
const originalStart=startTest,originalLoading=showLoading,originalVs=renderVsResultFromData,originalBasic=renderBasicResultFromData;
let optionTimer=null;
startTest=function(){clearTimeout(optionTimer);tieChoices={};viewingHistory=false;originalStart();};
selectOption=function(value){clearTimeout(optionTimer);answers[current]=value;tieChoices={};document.querySelectorAll('#options-container .option-btn').forEach((btn,i)=>btn.classList.toggle('selected',options[i].value===value));$('next-btn').disabled=false;if(current<questions.length-1)optionTimer=setTimeout(nextQuestion,180);};
const nextOriginal=nextQuestion,previousOriginal=prevQuestion;
nextQuestion=function(){clearTimeout(optionTimer);nextOriginal();};
prevQuestion=function(){clearTimeout(optionTimer);previousOriginal();};
function tiedGroups(payload){return [{key:'sin',scores:payload.sinScores},...(activeMode==='vs'?[{key:'virtue',scores:payload.virtueScores}]:[])].map(g=>({...g,ids:Object.keys(g.scores).filter(k=>g.scores[k]===Math.max(...Object.values(g.scores)))})).filter(g=>g.ids.length>1);}
const confirmationPage=document.createElement('section');confirmationPage.id='confirmation-page';confirmationPage.className='page quiz-page';document.querySelector('main.app').appendChild(confirmationPage);
showLoading=function(){const payload=calculate(),groups=tiedGroups(payload),pending=groups.find(g=>tieChoices[g.key]!=='both'&&!g.ids.includes(tieChoices[g.key]));if(!pending){originalLoading();return;}const number=questions.length+groups.indexOf(pending)+1;
 confirmationPage.innerHTML=`<div class="quiz-top"><h2>同分情境确认</h2><p>${number} / ${questions.length+groups.length}</p></div><div class="question-card"><h2>回想近期的真实经历，哪种反应更像你？</h2><p class="replica-note">${pending.ids.map(k=>dimensions[k].name).join('、')}认同分相同。此选择只确认主倾向，雷达不加分。</p><div id="tie-options">${pending.ids.map(k=>`<button class="option-btn" data-tie="${k}"><span class="option-label">${(pending.key==='sin'?fullBasic:fullVs).find(q=>q.dim===k).text}</span></button>`).join('')}<button class="option-btn" data-tie="both"><span class="option-label">都差不多，保留共同主倾向</span></button></div></div><button class="primary-btn" id="tie-submit" disabled>确认并继续</button><button class="ghost-btn" id="tie-back">返回修改答案</button>`;
 let selected=null;confirmationPage.querySelectorAll('[data-tie]').forEach(button=>button.onclick=()=>{selected=button.dataset.tie;confirmationPage.querySelectorAll('[data-tie]').forEach(b=>b.classList.toggle('selected',b===button));$('tie-submit').disabled=false;});$('tie-submit').onclick=()=>{if(selected){tieChoices[pending.key]=selected;showLoading();}};$('tie-back').onclick=()=>{current=questions.length-1;setPage('quiz-page');renderQuestion();};setPage('confirmation-page');};
function explainTies(payload,elementId){const parent=$(elementId);parent.querySelector('.replica-ties')?.remove();const groups=tiedGroups(payload);if(!groups.length)return;const note=document.createElement('p');note.className='replica-note replica-ties';note.textContent=groups.map(g=>{const selected=tieChoices[g.key];if(g.ids.includes(selected))return `${g.ids.map(k=>dimensions[k].name).join('、')}分数相同；你通过情境选择确认了${dimensions[selected].name}为主倾向。雷达保留原始分数。`;return `${g.ids.map(k=>dimensions[k].name).join('、')}为共同主倾向，你选择了“都差不多”。下方分析按固定顺序选一个示例展开，不代表它更强。`;}).join(' ');const head=parent.querySelector('.report-head');if(head)head.after(note);else parent.prepend(note);
 for(const g of groups){const id=g.key==='sin'?(activeMode==='vs'?'sin-chief-name':'dominant-name'):'virtue-chief-name';if(tieChoices[g.key]==='both')$(id).textContent=g.ids.length===2?g.ids.map(k=>dimensions[k].name).join(' · '):'共同主倾向';}
}
renderVsResultFromData=function(payload){const meta=originalVs(payload);explainTies(payload,'result-vs');return meta;};
renderBasicResultFromData=function(scores,total){const meta=originalBasic(scores,total);explainTies({sinScores:scores},'result-basic');return meta;};
const goHomeOriginal=goHome;goHome=function(){clearTimeout(optionTimer);clearTimeout(timer);clearLoadingTimers();goHomeOriginal();};
document.querySelectorAll('.mp-capsule').forEach(el=>el.remove());
const localNote=document.createElement('p');localNote.className='replica-note local-disclaimer';localNote.textContent='原创主题娱乐与自我探索，非专业心理量表，不作诊断或道德判断。记录仅保存在本机浏览器。';document.querySelector('.hero-bottom').appendChild(localNote);
// Match local numeric password entry without exposing the reference site's code.
$('auth-input').type='password';$('auth-input').inputMode='numeric';$('auth-input').maxLength=4;
document.querySelectorAll('.result-layout').forEach(el=>{const button=document.createElement('button');button.className='ghost-btn';button.textContent='下载文字报告';button.onclick=()=>{const text=el.innerText,url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='七宗罪-探索报告.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};el.appendChild(button);});
