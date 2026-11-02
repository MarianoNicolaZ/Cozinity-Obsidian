/* Read-only reminder logic. No Obsidian imports or task writes. */
'use strict';
const MINUTE=60000;
function parseTaskDate(value){
 if(typeof value!=='string')return null;
 const m=/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/.exec(value);
 if(!m)return null;
 const [y,mo,d]=m.slice(1,4).map(Number),calendar=new Date(y,mo-1,d);
 if(calendar.getFullYear()!==y||calendar.getMonth()!==mo-1||calendar.getDate()!==d)return null;
 const hasTime=m[4]!==undefined;
 if(hasTime&&(Number(m[4])>23||Number(m[5])>59||Number(m[6]||0)>59))return null;
 const date=hasTime?new Date(value):calendar;
 return Number.isFinite(date.getTime())?{date,hasTime,value}:null;
}
async function readTaskNotesCandidates(api,now=new Date()){
 const unavailable={available:false,items:[]};
 try{
  if(api?.apiVersion!==1||typeof api.hasCapability!=='function'||!api.hasCapability('tasks.read')||!api.hasCapability('catalog.read')||typeof api.tasks?.list!=='function'||typeof api.catalog?.statuses!=='function')return unavailable;
  const statuses=await api.catalog.statuses(),tasks=await api.tasks.list();
  if(!Array.isArray(tasks)||!Array.isArray(statuses))return unavailable;
  const completed=new Set(statuses.filter(s=>s?.isCompleted).map(s=>String(s.value).toLowerCase()));
  const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()),end=new Date(start);end.setDate(start.getDate()+((7-start.getDay())%7)+1);
  const items=[],seen=new Set();
  for(const task of tasks){
   if(!task||typeof task.path!=='string'||!task.path||seen.has(task.path)||task.archived||task.completed)continue;
   const status=String(task.status||'').toLowerCase();
   if(completed.has(status)||['done','completed','complete','cancelled','canceled'].includes(status))continue;
   const dates=[task.scheduled,task.due].map(parseTaskDate).filter(d=>d&&d.date>=start&&d.date<end).sort((a,b)=>a.date-b.date);
   if(!dates.length)continue;
   const first=dates[0],day=first.date;
   // Do not materialize or advance recurring notes: only actual stored occurrences are read.
   items.push({id:task.path,path:task.path,title:String(task.title||task.path.replace(/\.md$/i,'').split('/').pop()),date:first.value,hasTime:first.hasTime,kind:day.getFullYear()===start.getFullYear()&&day.getMonth()===start.getMonth()&&day.getDate()===start.getDate()?'today':'week'});seen.add(task.path);
  }
  return {available:true,items};
 }catch(_){return unavailable;}
}
function pickCandidate(items,recentIds=[],random=Math.random){
 if(!Array.isArray(items)||!items.length)return null;
 const recent=Array.isArray(recentIds)?recentIds:[],last=items.find(x=>x.id===recent[recent.length-1]);
 let pool=items.filter(x=>!recent.includes(x.id));
 if(!pool.length)pool=items.filter(x=>x.id!==last?.id);
 if(!pool.length)pool=items;
 const preferred=pool.filter(x=>x.kind===(last?.kind==='today'?'week':'today'));
 if(preferred.length)pool=preferred;
 const r=Number(random());return pool[Math.min(pool.length-1,Math.max(0,Math.floor((Number.isFinite(r)?r:0)*pool.length)))];
}
function createPetReminderController({clock={now:()=>Date.now(),setTimeout:(fn,ms)=>globalThis.setTimeout(fn,ms),clearTimeout:id=>globalThis.clearTimeout(id)},random=Math.random,loadCandidates,present,dismiss,getRecent=()=>[],saveRecent=()=>{},minMs=20*MINUTE,maxMs=40*MINUTE}){
 if(!Number.isFinite(minMs)||!Number.isFinite(maxMs)||minMs<MINUTE||maxMs<minMs||maxMs>1440*MINUTE){minMs=20*MINUTE;maxMs=40*MINUTE;}
 let active=false,disposed=false,token=0,wait=null,bubble=null,showing=false;
 const clear=()=>{clock.clearTimeout(wait);clock.clearTimeout(bubble);wait=bubble=null;};
 const hide=()=>{if(showing){showing=false;dismiss();}};
 function schedule(){
  if(!active||disposed)return;
  const value=Number(random()),r=Number.isFinite(value)?Math.max(0,Math.min(.999999999,value)):0;
  const delay=minMs+r*(maxMs-minMs),expected=clock.now()+delay,generation=token;
  wait=clock.setTimeout(async()=>{
   wait=null;if(!active||disposed||generation!==token)return;
   if(clock.now()-expected>60000){schedule();return;}
   let result;try{result=await loadCandidates();}catch(_){result=null;}
   if(!active||disposed||generation!==token)return;
   const recent=getRecent(),item=result?.available?pickCandidate(result.items,recent,random):null;
   if(!item){schedule();return;}
   try{
    // Present may play a short wake sequence. Duration begins when the bubble exists.
    showing=true;const visible=await present(item);
    if(!active||disposed||generation!==token){hide();return;}
    if(visible===false){hide();schedule();return;}
    try{Promise.resolve(saveRecent([...(Array.isArray(recent)?recent:[]).filter(id=>id!==item.id),item.id].slice(-12))).catch(()=>{});}catch(_){}
    bubble=clock.setTimeout(()=>{bubble=null;hide();schedule();},30000);
   }catch(_){hide();schedule();}
  },delay);
 }
 return {
  setActive(value){value=Boolean(value);if(disposed||active===value)return;active=value;token++;clear();hide();if(active)schedule();},
  close(){if(disposed)return;token++;clear();hide();if(active)schedule();},
  dispose(){if(disposed)return;disposed=true;active=false;token++;clear();hide();}
 };
}
module.exports={parseTaskDate,readTaskNotesCandidates,pickCandidate,createPetReminderController};
