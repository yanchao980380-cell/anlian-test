// Full reference question banks; local password, accessibility and navigation fixes.
const frameSetPage=setPage;
setPage=function(id){frameSetPage(id);document.body.dataset.view=id.replace('-page','');$('quiz-home').hidden=id==='home-page';};
document.body.dataset.view='home';
let fullOptionTimer=null;
selectOption=function(value){clearTimeout(fullOptionTimer);answers[current]=value;document.querySelectorAll('#options-container .option-btn').forEach((el,i)=>{el.classList.toggle('selected',options[i].value===value);el.setAttribute('aria-pressed',String(options[i].value===value));});$('next-btn').disabled=false;if(current<questions.length-1)fullOptionTimer=setTimeout(nextQuestion,180);};
const fullNext=nextQuestion,fullPrev=prevQuestion,fullStart=startTest,fullHome=goHome,fullRestart=restart;
nextQuestion=function(){clearTimeout(fullOptionTimer);fullNext();};prevQuestion=function(){clearTimeout(fullOptionTimer);fullPrev();};
startTest=function(){clearTimeout(fullOptionTimer);viewingHistory=false;fullStart();};
goHome=function(){clearTimeout(fullOptionTimer);clearTimeout(timer);clearLoadingTimers();fullHome();};restart=function(){clearTimeout(fullOptionTimer);fullRestart();};
const authOpen=openAuthModal,authClose=closeAuthModal;
openAuthModal=function(){authOpen();$('auth-input').focus();};closeAuthModal=function(){authClose();};
$('auth-input').type='password';$('auth-input').inputMode='numeric';$('auth-input').maxLength=6;$('auth-input').setAttribute('aria-label','访问密码');$('auth-input').setAttribute('aria-describedby','auth-error');$('auth-error').setAttribute('role','alert');
$('auth-input').addEventListener('input',()=>{$('auth-error').textContent='';});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAuthModal();if(e.key==='Tab'&&$('auth-modal-backdrop').classList.contains('show')){const fields=[$('auth-close'),$('auth-input'),$('auth-submit')];const first=fields[0],last=fields[2];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
function fullTieNote(root,scores,label){const entries=Object.entries(scores),max=Math.max(...entries.map(x=>x[1])),tied=entries.filter(x=>x[1]===max);if(tied.length<2)return;const el=document.createElement('p');el.className='full-tie-note';el.textContent=`${label}同分：${tied.map(x=>dimensions[x[0]].name).join('、')}（${max}/100）。主卡依参考版顺序展示${dimensions[tied[0][0]].name}作为解读代表，不表示它比其他同分项更强。`;root.querySelector('.dual-chief-grid')?.after(el);if(!el.parentNode)root.prepend(el);}
const fullVs=renderVsResultFromData,fullBasic=renderBasicResultFromData;
renderVsResultFromData=function(payload){const root=$('result-vs');root.querySelectorAll('.full-tie-note').forEach(el=>el.remove());const result=fullVs(payload);fullTieNote(root,payload.virtueScores,'美德侧');fullTieNote(root,payload.sinScores,'宗罪侧');return result;};
renderBasicResultFromData=function(scores,total){const root=$('result-basic');root.querySelectorAll('.full-tie-note').forEach(el=>el.remove());const result=fullBasic(scores,total);fullTieNote(root,scores,'宗罪侧');return result;};
document.querySelectorAll('.result-layout').forEach(root=>{const button=document.createElement('button');button.className='ghost-btn full-export';button.textContent='下载文字报告';button.onclick=()=>{const url=URL.createObjectURL(new Blob(['\uFEFF'+root.innerText],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='七宗罪-完整报告.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};root.appendChild(button);});
