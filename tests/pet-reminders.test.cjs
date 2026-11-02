const {test}=require('node:test'),assert=require('node:assert/strict');
const {readTaskNotesCandidates,pickCandidate}=require('../pet-reminders');
const now=new Date(2026,8,24,12);
const task=(path,date,status='open')=>({path,title:path,due:date,status});
const api=items=>({apiVersion:1,hasCapability:n=>['tasks.read','catalog.read'].includes(n),catalog:{statuses:()=>[{value:'finished',isCompleted:true}]},tasks:{list:async()=>items}});
test('local today through Sunday, explicit times only and deduplicated paths',async()=>{
 const a=await readTaskNotesCandidates(api([task('today','2026-09-24'),task('sunday','2026-09-27T09:00:00'),task('next','2026-09-28'),task('old','2026-09-23'),task('bad','2026-02-30'),task('today','2026-09-24')]),now);
 assert.equal(a.available,true);assert.deepEqual(a.items.map(x=>[x.id,x.kind,x.hasTime]),[['today','today',false],['sunday','week',true]]);
});
test('completed custom statuses, archived, cancelled and malformed tasks excluded',async()=>{
 const a=await readTaskNotesCandidates(api([task('done','2026-09-24','finished'),task('cancel','2026-09-24','cancelled'),{...task('arch','2026-09-24'),archived:true},null,{title:'no path'},task('valid','2026-09-24')]),now);
 assert.deepEqual(a.items.map(x=>x.id),['valid']);
});
test('scheduled date can qualify while due date outside week cannot',async()=>{
 const a=await readTaskNotesCandidates(api([{...task('a','2026-09-28'),scheduled:'2026-09-25',reminders:[{type:'relative'}]}]),now);
 assert.equal(a.items[0].date,'2026-09-25');assert.equal(a.items[0].hasTime,false);
});
test('missing/incompatible/rejected APIs fail closed without writes',async()=>{
 for(const a of [null,{},api(null),{...api([]),apiVersion:99},{...api([]),tasks:{list:async()=>{throw Error('offline')}}}])assert.deepEqual(await readTaskNotesCandidates(a,now),{available:false,items:[]});
});
test('candidate selection rotates between today/week and avoids recent items',()=>{
 const a=[{id:'a',kind:'today'},{id:'b',kind:'today'},{id:'c',kind:'week'}];
 assert.equal(pickCandidate(a,[],()=>0).id,'a');assert.equal(pickCandidate(a,['a'],()=>0).id,'c');assert.equal(pickCandidate(a,['a','c'],()=>0).id,'b');assert.equal(pickCandidate([a[0]],['a'],()=>0).id,'a');assert.equal(pickCandidate([],[],()=>0),null);
});

test('default reminder timers keep the browser host receiver during redraw and disposal',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),context={module:{exports:{}},hostMarker:'window',Date,Math};let cleared=0;
 context.setTimeout=function(){assert.equal(this.hostMarker,'window');return 1;};context.clearTimeout=function(){assert.equal(this.hostMarker,'window');cleared++;};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../pet-reminders.js'),'utf8'),context);
 const controller=context.module.exports.createPetReminderController({loadCandidates:async()=>null,present:async()=>false,dismiss:()=>{}});controller.setActive(true);controller.dispose();assert.ok(cleared>=2);
});
