export const INTERESTS=[{id:'no',label:'不愿意',score:0},{id:'unsure',label:'不确定',score:null},{id:'curious',label:'有点好奇',score:50},{id:'yes',label:'喜欢',score:75},{id:'favorite',label:'很喜欢',score:100}];
export const ROLES=[{id:'na',label:'不限 / 不适用'},{id:'give',label:'主动 / 引导'},{id:'receive',label:'接受 / 跟随'},{id:'either',label:'双方都可以'}];
export const READINESS=[{id:'discuss',label:'需要先沟通'},{id:'fantasy',label:'仅限想象'},{id:'ready',label:'愿意讨论尝试'}];
export function analyze(answers,items){
 const dimensions=[...new Set(items.map(x=>x.category))].map(category=>{
  const group=items.filter(x=>x.category===category),responses=group.map(x=>answers[x.id]).filter(Boolean);
  const scores=responses.map(x=>INTERESTS.find(i=>i.id===x.interest)?.score).filter(x=>typeof x==='number');
  return {category,total:group.length,answered:responses.length,scored:scores.length,uncertain:responses.filter(x=>x.interest==='unsure').length,score:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null,sufficient:scores.length>=3};
 });
 const answered=dimensions.reduce((s,x)=>s+x.answered,0);
 return {answered,total:items.length,dimensions,coverage:Math.round(answered/items.length*100),boundaries:items.filter(x=>answers[x.id]?.interest==='no'),favorites:items.filter(x=>['yes','favorite'].includes(answers[x.id]?.interest)),curious:items.filter(x=>answers[x.id]?.interest==='curious'),uncertain:items.filter(x=>answers[x.id]?.interest==='unsure'),fantasy:items.filter(x=>answers[x.id]?.interest!=='no'&&answers[x.id]?.readiness==='fantasy')};
}
export function compare(a,b,items){
 const result={boundary:[],missing:[],uncertain:[],fantasy:[],coordinate:[],shared:[],discuss:[],bothAnswered:0};
 for(const item of items){
  const x=a[item.id],y=b[item.id];if(x&&y)result.bothAnswered++;
  let bucket;
  if(x?.interest==='no'||y?.interest==='no')bucket='boundary';
  else if(!x||!y)bucket='missing';
  else if(x.interest==='unsure'||y.interest==='unsure')bucket='uncertain';
  else if(x.readiness==='fantasy'||y.readiness==='fantasy')bucket='fantasy';
  else if(['give','receive'].includes(x.role)&&x.role===y.role)bucket='coordinate';
  else if(['yes','favorite'].includes(x.interest)&&['yes','favorite'].includes(y.interest)&&x.readiness==='ready'&&y.readiness==='ready')bucket='shared';
  else bucket='discuss';
  result[bucket].push(item);
 }
 return result;
}
function cleanAnswers(answers,items){
 if(!answers||typeof answers!=='object'||Array.isArray(answers))throw new Error('答案格式不正确。');
 const allowed=new Set(items.map(x=>x.id)),result={};
 if(Object.keys(answers).length>items.length)throw new Error('答案数量超出范围。');
 for(const [id,a]of Object.entries(answers)){
  if(!allowed.has(id)||!a||typeof a!=='object'||Array.isArray(a)||!INTERESTS.some(x=>x.id===a.interest))throw new Error('文件包含未知题目或无效答案，请使用本站导出的文件。');
  const role=a.role??'na',readiness=a.readiness??'discuss';
  if(!ROLES.some(x=>x.id===role)||!READINESS.some(x=>x.id===readiness))throw new Error('文件中的角色或意愿格式不正确。');
  result[id]={interest:a.interest,role,readiness};
 }
 return result;
}
export function exportProfile(answers,items){return JSON.stringify({app:'kink-atlas-zh',version:1,answers:cleanAnswers(answers,items)},null,2);}
export function parseProfile(text,items){
 if(typeof text!=='string'||text.length>200000)throw new Error('文件过大，请选择小于 200 KB 的本站答案文件。');
 let data;try{data=JSON.parse(text);}catch{throw new Error('无法读取 JSON 文件，请选择本站导出的答案文件。');}
 if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==1)throw new Error('文件版本不兼容，请使用本站导出的 v1 答案文件。');
 return cleanAnswers(data.answers,items);
}
