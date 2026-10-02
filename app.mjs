import {CATEGORIES,CATEGORY_MAP,ITEMS} from './data.mjs';
import {ORIGINAL_ITEMS} from './catalog.mjs';
import {analyze,compare,parseProfile,exportProfile,INTERESTS,ROLES,READINESS} from './engine.mjs';
const ALL_ITEMS=[...ITEMS,...ORIGINAL_ITEMS];
const KEY='kink-atlas-zh:v1';
const state={view:'explore',category:'senses',mode:'curated',filter:'all',search:'',page:1,answers:{},partner:null,persist:false,storageWarning:'',importTarget:'partner'};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source=()=>state.mode==='original'?ORIGINAL_ITEMS:ITEMS;
const assessed=()=>source().filter(x=>!x.excluded);
const label=(arr,id)=>arr.find(x=>x.id===id)?.label??'未填写';
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);}
function notice(message){$('#notice').textContent=message;$('#notice').hidden=!message;}
try{const saved=localStorage.getItem(KEY);if(saved){state.answers=parseProfile(saved,ALL_ITEMS);state.persist=true;}}catch{state.storageWarning='无法读取或确认本机旧记录。当前仍可填写并导出；共用设备上请在浏览器设置中检查本站数据。';notice(state.storageWarning);}
function save(){if(!state.persist)return false;try{localStorage.setItem(KEY,exportProfile(state.answers,ALL_ITEMS));state.storageWarning='';notice('');return true;}catch{state.storageWarning='本机保存未更新，浏览器内可能仍保留旧答案。当前修改仅在页面中，请先导出。';notice(state.storageWarning);return false;}}
function openDialog(title,body,actions='<button class="primary" data-action="close">知道了</button>'){$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=body;$('#dialog-actions').innerHTML=actions;$('#dialog').showModal();}
function modeButtons(){return ORIGINAL_ITEMS.length?`<div class="catalog-mode"><button data-mode="curated" class="${state.mode==='curated'?'active':''}">精选改编 · ${ITEMS.length} 项</button><button data-mode="original" class="${state.mode==='original'?'active':''}">原站中文目录 · ${ORIGINAL_ITEMS.length} 项</button><span class="muted" style="font-size:11px">两套目录分别记录与分析</span></div>`:'';}
function renderNav(){
 const report=analyze(state.answers,assessed());
 $('#categories').innerHTML=CATEGORIES.map((c,i)=>{const d=report.dimensions.find(x=>x.category===c.id);return `<button class="category ${state.category===c.id&&state.view==='explore'?'active':''}" data-category="${c.id}" ${state.category===c.id&&state.view==='explore'?'aria-current="true"':''}><span class="number">${String(i+1).padStart(2,'0')}</span>${c.name}<span class="count">${d?.answered??0}/${d?.total??0}</span></button>`;}).join('');
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
}
function setView(view){state.view=view;render();window.scrollTo({top:0,behavior:'instant'});}
function render(){
 const titles={explore:['认识偏好，<span>也看见边界。</span>','不急着定义自己。从一个真实的回答开始。'],analysis:['你的偏好，<span>有迹可循。</span>','把零散的回答，整理成可以理解、可以讨论的图谱。'],compare:['找到交集，<span>尊重不同。</span>','共同兴趣是对话的起点。任何一方的边界，都优先于匹配。']};
 $('#page-title').innerHTML=titles[state.view][0];$('#page-description').textContent=titles[state.view][1];
 renderNav();$('#view').innerHTML=state.view==='explore'?exploreView():state.view==='analysis'?analysisView():comparisonView();
}
function storagePanel(){return `<div class="storage-panel"><label><input type="checkbox" id="remember" ${state.persist?'checked':''}> 在这个浏览器记住我的答案</label><p>${state.storageWarning?esc(state.storageWarning):state.persist?'已选择本机保存；共用设备上建议关闭。':'当前仅保留在此页面，刷新或关闭前请导出。'}</p><div class="storage-actions"><button class="text-button" data-action="export">导出答案</button><button class="text-button" data-action="restore">恢复答案</button><button class="text-button" data-action="clear">清除</button></div></div>`;}
function summaryPanel(){const r=analyze(state.answers,assessed());return `<section class="panel summary-panel"><span class="eyelabel">YOUR PERSONAL ATLAS</span><h2>图谱正在形成</h2><div class="ring"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="67" fill="none" stroke="#e8ede5" stroke-width="7"/><circle cx="80" cy="80" r="67" fill="none" stroke="#32694f" stroke-width="7" stroke-linecap="round" stroke-dasharray="${r.coverage*4.21} 421"/></svg><div class="ring-center"><strong>${r.coverage}<span style="font-size:16px">%</span></strong><small>已记录的偏好</small></div></div><div class="mini-stats"><div><strong>${r.favorites.length}</strong><span>喜欢</span></div><div><strong>${r.curious.length}</strong><span>好奇</span></div><div><strong>${r.boundaries.length}</strong><span>边界</span></div></div><p class="summary-note">${r.answered===0?'每一个“不愿意”，和每一个“喜欢”，都是同样重要的信息。':`已填写 ${r.answered} 项，覆盖 ${r.dimensions.filter(x=>x.answered).length} 个维度。图谱依据你的回答实时变化。`}</p><button class="primary full" data-view="analysis">查看我的图谱</button></section><section class="panel tip-panel"><h3>◇ 给自己一点空间</h3><p>好奇不等于愿意尝试。选择后，可以进一步说明角色偏好，以及“仅限想象”或“需要先沟通”。</p></section>${storagePanel()}`;}
function itemCard(item,index){const a=state.answers[item.id];return `<article class="card ${item.excluded?'excluded':''}" data-card="${item.id}"><div class="card-head"><h3>${esc(item.name)}</h3><span class="item-number">${String(index+1).padStart(2,'0')}</span></div>${item.originalName?`<p class="original-name">${esc(item.originalName)}</p>`:''}<p>${esc(item.description)}</p>${item.excluded?`<span class="tag">目录说明 · 不纳入评估</span><p>${esc(item.exclusionReason)}</p>`:`<div class="choices" role="group" aria-label="${esc(item.name)}的偏好">${INTERESTS.map((x,i)=>`<button class="choice" data-id="${item.id}" data-interest="${x.id}" aria-pressed="${a?.interest===x.id}"><span class="symbol" aria-hidden="true">${['×','?','◇','♡','♥'][i]}</span>${x.label}</button>`).join('')}</div>${a?`<div class="answer-detail">${a.interest!=='no'?`<label>角色偏好<select data-answer-field="role" data-id="${item.id}" aria-label="${esc(item.name)}：角色偏好">${ROLES.map(x=>`<option value="${x.id}" ${a.role===x.id?'selected':''}>${x.label}</option>`).join('')}</select></label><label>当前意愿<select data-answer-field="readiness" data-id="${item.id}" aria-label="${esc(item.name)}：当前意愿">${READINESS.map(x=>`<option value="${x.id}" ${a.readiness===x.id?'selected':''}>${x.label}</option>`).join('')}</select></label>`:'<span class="tag">已记录为边界，不进入共同兴趣建议</span>'}<button class="text-button" data-reset="${item.id}" aria-label="重置${esc(item.name)}的回答">重置此项</button></div>`:''}`}</article>`;}
function exploreView(){
 const r=analyze(state.answers,assessed()),c=CATEGORY_MAP[state.category];
 let matching=source().filter(x=>state.search?`${x.name} ${x.originalName??''} ${x.description}`.toLowerCase().includes(state.search.toLowerCase()):x.category===c.id);
 if(state.filter==='unanswered')matching=matching.filter(x=>!x.excluded&&!state.answers[x.id]);
 if(state.filter==='answered')matching=matching.filter(x=>!!state.answers[x.id]);
 if(state.filter==='boundary')matching=matching.filter(x=>state.answers[x.id]?.interest==='no');
 const pages=Math.max(1,Math.ceil(matching.length/12));state.page=Math.min(state.page,pages);
 const visible=matching.slice((state.page-1)*12,state.page*12);
 return `${modeButtons()}<div class="workspace"><div><section class="panel progress-panel"><div class="progress-top"><strong>按自己的节奏，慢慢探索</strong><span>${r.answered} / ${r.total} 已填写</span></div><div class="progress-track" role="progressbar" aria-label="填写进度" aria-valuemin="0" aria-valuemax="${r.total}" aria-valuenow="${r.answered}"><div class="progress-fill" style="width:${r.coverage}%"></div></div></section><div class="toolbar"><input id="search" class="search" type="search" placeholder="搜索感兴趣的关键词…" aria-label="搜索所有分类" value="${esc(state.search)}"><select id="filter" aria-label="按回答状态筛选"><option value="all">全部项目</option><option value="unanswered" ${state.filter==='unanswered'?'selected':''}>尚未填写</option><option value="answered" ${state.filter==='answered'?'selected':''}>已经填写</option><option value="boundary" ${state.filter==='boundary'?'selected':''}>我的边界</option></select></div><div class="section-heading"><h2>${state.search?'搜索结果':c.name}</h2><span>${matching.length} 个项目</span></div><p class="section-description">${state.search?'在当前目录的全部分类中搜索。':c.description}</p><div id="cards">${visible.length?visible.map((x,i)=>itemCard(x,(state.page-1)*12+i)).join(''):'<div class="panel empty"><h2>这里还没有项目</h2><p>换个关键词或筛选条件，继续探索。</p><button class="outline" data-action="reset-filter">查看当前分类全部项目</button></div>'}</div>${pages>1?`<div class="next-category"><button class="outline" data-page="${state.page-1}" ${state.page===1?'disabled':''}>上一页</button><span class="muted" style="font-size:13px;align-self:center">${state.page} / ${pages}</span><button class="outline" data-page="${state.page+1}" ${state.page===pages?'disabled':''}>下一页</button></div>`:''}<div class="next-category"><button class="text-button" data-action="method">这些选择怎样形成分析？</button><button class="outline" data-action="next-category">下一个维度</button></div></div><aside class="right-rail" aria-label="当前图谱概览">${summaryPanel()}</aside></div>`;
}
function chips(items,boundary=false){return items.length?`<div class="chips">${items.slice(0,12).map(x=>`<span class="chip ${boundary?'boundary':''}">${esc(x.name)}</span>`).join('')}${items.length>12?`<span class="chip">另有 ${items.length-12} 项，见完整列表</span>`:''}</div>`:'<p class="muted">暂时没有相关回答。</p>';}
function analysisView(){
 const r=analyze(state.answers,assessed());
 if(!r.answered)return `${modeButtons()}<section class="panel empty"><div class="empty-icon">✳</div><h2>图谱从你的回答开始</h2><p>先选几个熟悉的项目，记录喜欢、好奇或边界。<br>每个维度至少 3 项明确回答后，才会给出初步倾向解释。</p><button class="primary" data-view="explore">开始探索</button></section>`;
 const ranked=r.dimensions.filter(x=>x.sufficient).sort((a,b)=>b.score-a.score),top=ranked[0];
 const roleItems=assessed().filter(x=>state.answers[x.id]&&state.answers[x.id].interest!=='no');
 const roleCounts=ROLES.filter(x=>x.id!=='na').map(x=>({...x,n:roleItems.filter(i=>state.answers[i.id].role===x.id).length})).sort((a,b)=>b.n-a.n);
 const curiosityCategories=[...new Set(r.curious.map(x=>x.category))].slice(0,3);
 return `${modeButtons()}<div class="stat-strip"><div class="stat-box"><strong>${r.answered}<small style="font-size:14px;color:var(--muted)"> / ${r.total}</small></strong><span>已记录的回答</span></div><div class="stat-box"><strong>${r.favorites.length}</strong><span>明确喜欢</span></div><div class="stat-box"><strong>${r.boundaries.length}</strong><span>需要尊重的边界</span></div><div class="stat-box"><strong>${r.uncertain.length}</strong><span>仍在了解自己</span></div></div><div class="report-grid"><section class="panel report-card"><h2>你的偏好分布</h2><p>分数只是已答项目的兴趣平均值。数值高低不代表能力、经验或关系质量。</p>${r.dimensions.map(d=>`<div class="bar-row" data-sufficient="${d.sufficient}"><div class="bar-title">${CATEGORY_MAP[d.category].name}<span>${d.score===null?'暂无分数':`${d.score} / 100`}</span></div><div class="bar-track"><i style="width:${d.score??0}%"></i></div><p class="bar-meta">${d.scored} 项计分 · ${d.answered}/${d.total} 已答${d.uncertain?` · ${d.uncertain} 项不确定`:''} · ${d.sufficient?'可作初步参考':'信息不足，暂不解读'}</p></div>`).join('')}</section><div><section class="panel report-card"><h2>从回答中读到的线索</h2><div class="insight"><h3>${top?`${CATEGORY_MAP[top.category].name}：${top.score>=70?'相对积极':top.score>=40?'态度混合':'偏向谨慎'}`:'先多认识几个维度'}</h3><p>${top?`这个维度有 ${top.scored} 项明确回答，平均 ${top.score} 分。${top.score>=70?'可以从已明确喜欢的具体项目开始沟通。':'逐项看待喜欢和边界，比单看平均值更有帮助。'} ${ranked.length<2?'目前只有一个维度达到解释门槛，暂不做跨维度排序。':'这是目前有足够回答的维度中得分最高的一项。'}`:'目前尚无维度达到 3 项明确回答。不确定的答案和未填写项目不会被当成拒绝。'}</p></div><div class="insight"><h3>角色倾向，取决于情境</h3><p>${roleCounts[0].n?`你在 ${roleCounts[0].n} 个非拒绝项目中选择了“${roleCounts[0].label}”。这只概括你主动填写的角色选择，不用于给你贴身份标签。`:'你还没有明确填写角色偏好。系统不会从喜欢的项目推断你是主导者或接受者。'}</p></div><div class="insight"><h3>兴趣与实际意愿分开看</h3><p>${r.fantasy.length?`${r.fantasy.length} 项选择了“仅限想象”，不会被列为两人的共同尝试讨论项。`:'你尚未标记“仅限想象”。未特别选择的项目默认为“需要先沟通”，不代表已同意尝试。'}</p></div></section><section class="panel report-card" style="margin-top:20px"><h2>下一次，可以这样聊</h2>${(curiosityCategories.length?curiosityCategories:r.dimensions.filter(x=>x.answered).slice(0,3).map(x=>x.category)).map(id=>`<div class="insight"><h3>${CATEGORY_MAP[id].name}</h3><p>${CATEGORY_MAP[id].prompt}</p></div>`).join('')}</section></div></div><div class="report-grid" style="margin-top:24px"><section class="panel report-card"><h2>明确喜欢的部分</h2>${chips(r.favorites)}<p>喜欢可以成为对话的开场，实际参与仍需逐次确认。</p></section><section class="panel report-card"><h2>边界清单</h2>${chips(r.boundaries,true)}<p>不需要为拒绝找理由。两人对照中，一方拒绝就不会推荐。</p><button class="text-button" data-action="show-boundaries">查看全部边界项目</button></section></div><div class="actions"><button class="primary" data-view="compare">进入两人对照</button><button class="outline" data-action="print">打印 / 保存 PDF</button><button class="outline" data-action="export">导出完整答案</button><button class="text-button" data-action="method">查看计算规则</button></div>`;
}
const GROUPS=[['boundary','优先尊重的边界','只要一方明确不愿意，就不会作为共同兴趣推荐。'],['shared','可以开始谈的共同兴趣','双方都明确喜欢，并都选择愿意讨论尝试；角色未发现冲突。这仍然不是本次行为的同意。'],['discuss','有兴趣，先把条件谈清楚','至少一方仍有好奇或需要沟通。先讨论条件，不做默认许可。'],['coordinate','兴趣相近，角色需要协调','双方选择了相同的主动或接受角色。先谈期待，不自动假定互补。'],['fantasy','保留在想象里的部分','至少一方标记仅限想象，不列为实际尝试讨论项。'],['uncertain','给不确定留一些空间','至少一方尚不确定，可以了解概念，也可以暂时不讨论。'],['missing','尚缺一方或双方的回答','信息不足不等于不匹配。两人应使用同一套目录填写。']];
function answerText(a){return a?`${label(INTERESTS,a.interest)}<small>${a.interest==='no'?'无需解释或协商改变':`${label(ROLES,a.role)} · ${label(READINESS,a.readiness)}`}</small>`:'<span class="muted">尚未填写</span>';}
function comparisonView(){
 const mine=analyze(state.answers,assessed()),theirs=state.partner?analyze(state.partner,assessed()):null;
 let html=`${modeButtons()}<div class="compare-layout"><section class="panel profile-box"><div class="step">01 / 我的答案</div><h2>先了解自己，再分享</h2><p>当前目录已填写 ${mine.answered} 项。导出文件包含全部已填写的具体偏好、角色和意愿，请只交给你信任的人。</p><div class="actions"><button class="outline" data-action="export" ${Object.keys(state.answers).length?'':'disabled'}>导出我的答案</button><button class="text-button" data-view="explore">继续填写</button></div></section><section class="panel profile-box"><div class="step">02 / 对方的答案</div><h2>${theirs?'答案已载入，可以对照':'在本地打开对方的文件'}</h2><p>${theirs?`当前目录中，对方已填写 ${theirs.answered} 项。对方文件仅保留在当前页面，关闭后清除。`:'请对方在自己的设备填写并主动导出，再将文件交给你。无需注册或上传服务器。'}</p><div class="actions"><button class="primary" data-action="partner">${theirs?'更换对方文件':'选择对方的答案文件'}</button>${theirs?'<button class="text-button" data-action="remove-partner">移除</button>':''}</div></section></div>`;
 if(!theirs)return html+'<div class="panel empty"><div class="empty-icon">◈</div><h2>差异不需要被抹平</h2><p>对照会整理共同兴趣、需要沟通的条件、角色差异和明确边界。<br>这里没有“合不合适”的总分。</p></div>';
 const c=compare(state.answers,state.partner,assessed());
 html+=`<div class="callout">当前有 <strong>${c.bothAnswered}</strong> 个项目双方都已回答。${!mine.answered||!theirs.answered?'至少一方在当前目录没有答案，请确认双方使用同一套目录。':'共同兴趣只表示可以开启对话，任何时候都可以改变主意。'}<br>以下顺序：边界优先，其次信息完整性、想象限制、角色条件与共同兴趣。</div>`;
 html+=GROUPS.map(([id,title,description])=>`<details class="panel comparison-group ${id}" ${['boundary','shared'].includes(id)?'open':''}><summary>${title}<span class="count">${c[id].length} 项</span></summary><div class="group-description">${description}</div>${c[id].length?c[id].map(x=>`<div class="comparison-row"><strong>${esc(x.name)}<small>${CATEGORY_MAP[x.category].name}</small></strong><div><small>我</small>${answerText(state.answers[x.id])}</div><div><small>对方</small>${answerText(state.partner[x.id])}</div></div>`).join(''):'<div class="group-description">当前没有此类项目。</div>'}</details>`).join('');
 return html+'<div class="actions"><button class="outline" data-action="print">打印 / 保存对照报告</button><button class="text-button" data-action="method">查看对照规则</button></div>';
}
function method(){openDialog('分析有依据，也有边界',`<h3>个人维度怎么计算？</h3><p>不愿意＝0，有点好奇＝50，喜欢＝75，很喜欢＝100。同类有效回答取算术平均、四舍五入；不确定与未填写不计入分母。每类至少 3 项有效回答才给出初步解释，并始终显示实际分母。</p><h3>两人对照怎么判断？</h3><p>按顺序检查：任一拒绝 → 缺少回答 → 不确定 → 仅限想象 → 角色相同需协调 → 双方明确喜欢且愿意讨论尝试 → 其他需要沟通的兴趣。主动与接受互补，“双方都可以”或“不适用”不视作角色冲突。</p><h3>这些数字不是什么？</h3><p>这是透明的整理规则，未经心理测量学验证，不是人格、性取向、心理健康或关系质量诊断。没有总分或伴侣匹配率；偏好不等于实际能力、经验和当下同意。</p><p>精选目录与原站目录分别统计，不在同一个分数里混合重复条目。原站同义重复项可能影响平均，解读时以具体项目为准。</p>`);}
function about(){openDialog('关于图谱与隐私',`<p>这是参考 <a href="https://app.kinkchecklist.com/try" target="_blank" rel="noopener noreferrer">Kink Checklist</a> 的独立中文改编，面向自愿的成年人，与原站无隶属关系。精选目录合并部分相近主题并加入沟通和照护；完整中文目录保留原始条目和英文索引，用中性说明替换原文措辞。</p><p>目录中的重复条目会保留。涉及无法同意的对象或高风险内容，仅作为术语索引并明确排除于评分与对照，不提供操作指南。</p><h3>你决定答案去哪里</h3><ul><li>默认只保留在当前页面；选择“记住”后才写入此浏览器。</li><li>答案不会发给网站作者；没有跟踪脚本或第三方请求。</li><li>分享网站链接不包含答案。导出文件包含具体答案、角色及意愿，交给他人后无法远程撤回。</li><li>对方文件只在当前页面处理，不写入本机长期存储。</li><li>同一浏览器的其他使用者可看到已保存的答案。清除会移除本站记录，但不会删除已导出的文件。</li></ul><p>网站由 GitHub Pages 提供静态页面；托管服务仍可能记录常规访问日志。本站不向这些日志发送问卷答案。</p>`);}
function download(){const blob=new Blob([exportProfile(state.answers,ALL_ITEMS)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='偏好图谱-我的答案.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#dialog').close();toast('答案文件已生成，请妥善保存。');}
function chooseImport(target){state.importTarget=target;$('#import-file').value='';$('#import-file').click();}
const actions={
 close:()=>$('#dialog').close(),about,method,
 export:()=>{if(!Object.keys(state.answers).length)return toast('先填写一些项目，再导出答案。');openDialog('导出前，确认你愿意分享的范围',`<p>文件包含两套目录内全部 <strong>${Object.keys(state.answers).length}</strong> 项已填答案，包括具体偏好、角色和当前意愿。</p><p>它不是匿名统计，也没有加密。获得文件的人能读取内容。若只是邀请朋友使用网站，请使用“分享网站”。</p>`,'<button class="outline" data-action="close">取消</button><button class="primary" data-action="download">生成答案文件</button>');},
 download,partner:()=>chooseImport('partner'),restore:()=>chooseImport('mine'),
 'remove-partner':()=>{state.partner=null;render();toast('已从当前页面移除对方答案。');},
 clear:()=>openDialog('清除我的答案？','<p>这会清除本页面与此浏览器保存的全部回答。已导出的文件不会被删除。</p>','<button class="outline" data-action="close">保留答案</button><button class="primary" data-action="confirm-clear">清除答案</button>'),
 'confirm-clear':()=>{state.answers={};state.persist=false;state.storageWarning='';try{localStorage.removeItem(KEY);notice('');}catch{state.storageWarning='页面答案已清除，但无法确认删除浏览器中的旧记录。请在浏览器设置中清除此网站数据。';notice(state.storageWarning);}$('#dialog').close();render();toast(state.storageWarning?'已清除当前页面答案，请留意上方存储提示。':'我的答案已清除。');},
 share:async()=>{const url=location.origin+location.pathname;try{await navigator.clipboard.writeText(url);toast('网站链接已复制，不包含你的答案。');}catch{openDialog('分享网站','<p>复制下方链接，不包含任何答案：</p><input id="share-url" type="text" readonly value="'+esc(url)+'" aria-label="网站链接">');$('#share-url').select();}},
 print:()=>{const details=[...document.querySelectorAll('.comparison-group')],previous=details.map(d=>d.open);details.forEach(d=>d.open=true);window.print();details.forEach((d,i)=>d.open=previous[i]);},
 'reset-filter':()=>{state.search='';state.filter='all';state.page=1;render();},
 'next-category':()=>{state.category=CATEGORIES[(CATEGORIES.findIndex(x=>x.id===state.category)+1)%CATEGORIES.length].id;state.search='';state.page=1;render();window.scrollTo({top:0,behavior:'instant'});},
 'show-boundaries':()=>{const b=analyze(state.answers,assessed()).boundaries;openDialog('我的完整边界清单',b.length?'<ul>'+b.map(x=>'<li>'+esc(x.name)+'</li>').join('')+'</ul>':'<p>尚未记录“不愿意”的项目。</p>');}
};
document.addEventListener('click',e=>{
 if(e.target.closest('.brand')){e.preventDefault();setView('explore');return;}
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.action){actions[b.dataset.action]?.();return;}
 if(b.dataset.view){setView(b.dataset.view);return;}
 if(b.dataset.mode){state.mode=b.dataset.mode;state.search='';state.page=1;render();return;}
 if(b.dataset.category){state.category=b.dataset.category;state.search='';state.page=1;state.view='explore';render();return;}
 if(b.dataset.page){state.page=Number(b.dataset.page);render();$('#search')?.scrollIntoView({block:'start'});return;}
 if(b.dataset.interest){
  const id=b.dataset.id,old=state.answers[id];state.answers[id]={interest:b.dataset.interest,role:old?.role??'na',readiness:old?.readiness??'discuss'};
  save();render();document.querySelector(`[data-id="${id}"][data-interest="${b.dataset.interest}"]`)?.focus({preventScroll:true});return;
 }
 if(b.dataset.reset){delete state.answers[b.dataset.reset];save();render();}
});
let searchTimer;
document.addEventListener('input',e=>{if(e.target.id==='search'){state.search=e.target.value;state.page=1;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const position=e.target.selectionStart;render();const input=$('#search');if(!input)return;input.focus({preventScroll:true});try{input.setSelectionRange(position,position);}catch{}},180);}});
document.addEventListener('change',e=>{
 const el=e.target;
 if(el.id==='filter'){state.filter=el.value;state.page=1;render();}
 if(el.dataset.answerField){state.answers[el.dataset.id][el.dataset.answerField]=el.value;save();renderNav();}
 if(el.id==='remember'){
  state.persist=el.checked;
  if(state.persist){const saved=save();toast(saved?'已开启此浏览器保存。':'保存未更新，请留意上方提示并导出答案。');}
  else{try{localStorage.removeItem(KEY);state.storageWarning='';notice('');toast('已移除本机保存记录，页面中的答案仍然保留。');}catch{state.persist=true;notice('无法移除保存记录，请在浏览器设置中清除此网站数据。');}}
  render();
 }
});
let pendingRestore=null;
actions['confirm-restore']=()=>{state.answers=pendingRestore;pendingRestore=null;save();$('#dialog').close();render();toast('答案已恢复。');};
$('#import-file').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  if(file.size>200000)throw new Error('文件超过 200 KB，请选择本站导出的答案文件。');
  const parsed=parseProfile(await file.text(),ALL_ITEMS);
  if(Object.keys(parsed).some(id=>ALL_ITEMS.find(x=>x.id===id)?.excluded))throw new Error('文件包含已排除的目录项目，无法参与评估。');
  if(state.importTarget==='partner'){state.partner=parsed;setView('compare');toast('对方答案已在本地载入。');}
  else if(Object.keys(state.answers).length){pendingRestore=parsed;openDialog('用文件恢复我的答案？',`<p>文件中有 ${Object.keys(parsed).length} 项回答，会替换当前全部答案。需要保留当前内容时，请先取消并导出。</p>`,'<button class="outline" data-action="close">取消</button><button class="primary" data-action="confirm-restore">替换并恢复</button>');}
  else{state.answers=parsed;save();render();toast('答案已恢复。');}
 }catch(error){openDialog('文件没有载入','<p>'+esc(error.message)+'</p><p>当前答案保持不变。</p>');}
});
$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
render();
