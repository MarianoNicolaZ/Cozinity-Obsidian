const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
class Base {}
function load(){
 const ctx={module:{exports:{}},require:()=>({Plugin:Base,ItemView:Base,Modal:Base,PluginSettingTab:Base,FuzzySuggestModal:Base,Notice:Base,normalizePath:p=>p}),console,URL,Date,HTMLElement:Base};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../main.js','utf8')+'\nmodule.exports.api={normalizeSettings,normalizeDashboardProfiles,NestBoardPlugin,starter:typeof getWorkspaceStarterLayout==="function"?getWorkspaceStarterLayout:null,search:typeof searchWorkspaceNotes==="function"?searchWorkspaceNotes:null};',ctx);
 return ctx.module.exports.api;
}
const plain=x=>JSON.parse(JSON.stringify(x));
test('retired windows disappear from active and every saved space while notes, drafts and room bindings survive',()=>{
 const {normalizeSettings}=load();
 const kept=[{id:'draft',type:'quick_note_draft',quickDraftText:'Una idea sin guardar',gridX:4,gridY:3,gridW:4,gridH:6},{id:'note',type:'vault_note',filePath:'Notas/a.md',gridX:0,gridY:0,gridW:4,gridH:6}];
 const retired=['pinned','pet','shortcuts'].map(type=>({id:type,type}));
 const data={safeMode:true,panelLayout:[...kept,...retired],pinnedNotes:['Notas/a.md'],customLinks:[{id:'l',label:'Manual',url:'https://example.com'}],dashboardProfiles:[{id:'work',label:'Trabajo',snapshot:{panelLayout:[...kept,...retired],dashboardTitle:'Trabajo'}}],activeDashboardProfileId:'work'};
 const normalized=plain(normalizeSettings(data));
 assert.deepEqual(normalized.panelLayout.map(p=>p.type),['quick_note_draft','vault_note']);
 assert.deepEqual(normalized.dashboardProfiles[0].snapshot.panelLayout.map(p=>p.type),['quick_note_draft','vault_note']);
 assert.equal(normalized.panelLayout[0].quickDraftText,'Una idea sin guardar');assert.equal(normalized.panelLayout[1].filePath,'Notas/a.md');
 assert.deepEqual(normalized.pinnedNotes,['Notas/a.md']);assert.equal(normalized.safeMode,true);
 assert.deepEqual(plain(normalizeSettings(normalized)),normalized,'migration is idempotent');
});
test('retired windows cannot be added and new defaults are compact',()=>{
 const {NestBoardPlugin,normalizeSettings}=load();const plugin=Object.create(NestBoardPlugin.prototype);plugin.settings={panelLayout:[]};plugin.app={plugins:{getPlugin:()=>null}};
 const types=plugin.getAddablePanelDefinitions().map(p=>p.type);for(const retired of ['pinned','pet','shortcuts'])assert.ok(!types.includes(retired),retired);
 const defaults=normalizeSettings(null);assert.ok(defaults.panelLayout.length<=4);assert.equal(defaults.dashboardTitle,'Mi espacio');
});
test('spaces containing only retired windows remain empty in saved snapshots',()=>{
 const {normalizeDashboardProfiles}=load();const profiles=normalizeDashboardProfiles([{id:'old',label:'Viejo',snapshot:{panelLayout:[{id:'p',type:'pet'}],dashboardTitle:'Viejo'}}]);
 assert.equal(profiles.length,1);assert.equal(profiles[0].snapshot.panelLayout.length,0);assert.equal(profiles[0].snapshot.dashboardTitle,'Viejo');
});
test('starter layouts are independent and do not mutate existing spaces',()=>{
 const {starter}=load();assert.equal(typeof starter,'function');
 const a=starter('desk'),b=starter('desk');assert.ok(a.some(p=>p.type==='notebooks'));assert.ok(a.some(p=>p.type==='quick_note_draft'));assert.ok(a.length<=4);
 a[0].title='changed';assert.notEqual(b[0].title,'changed');assert.deepEqual(Array.from(starter('room'),p=>p.type),['cozy_room']);
});
test('search finds titles and paths without accent/case sensitivity, skips config files and bounds results',()=>{
 const {search}=load();assert.equal(typeof search,'function');
 const files=[{path:'Proyectos/Revisión.md',basename:'Revisión',extension:'md'},{path:'.obsidian/privado.md',basename:'privado',extension:'md'},{path:'imagenes/Revisión.png',basename:'Revisión',extension:'png'}];
 assert.equal(search(files,'revision')[0],files[0]);assert.equal(search(files,'PROYECTOS')[0],files[0]);assert.equal(search(files,'privado').length,0);assert.equal(search(files,'').length,0);
 assert.equal(search(Array.from({length:20},(_,i)=>({path:`Notas/${i}.md`,basename:String(i),extension:'md'})),'notas').length,8);
});
test('creating a starter space saves the current draft and retains the previous profile snapshot',async()=>{
 const {NestBoardPlugin,normalizeSettings}=load();const plugin=Object.create(NestBoardPlugin.prototype);
 plugin.settings=normalizeSettings({language:'es',safeMode:true,panelLayout:[{id:'draft',type:'quick_note_draft',quickDraftText:'Idea pendiente'}],dashboardProfiles:[{id:'old',label:'Anterior',snapshot:{panelLayout:[]}}],activeDashboardProfileId:'old'});
 let flushed=false,saved=false;plugin.flushQuickDraftSaves=async()=>{flushed=true};plugin.savePluginSettings=async()=>{saved=true};
 assert.equal(typeof plugin.createWorkspaceProfile,'function');await plugin.createWorkspaceProfile('room','Biblioteca');
 assert.ok(flushed);assert.ok(saved);assert.equal(plugin.settings.dashboardProfiles.length,2);assert.equal(plugin.settings.dashboardProfiles[0].snapshot.panelLayout[0].quickDraftText,'Idea pendiente');
 assert.equal(plugin.settings.panelLayout[0].type,'cozy_room');assert.equal(plugin.settings.safeMode,true);
});

test('a new starter archives an unsaved workspace with its drafts instead of replacing it',async()=>{
 const {NestBoardPlugin,normalizeSettings}=load();const plugin=Object.create(NestBoardPlugin.prototype);
 plugin.settings=normalizeSettings({dashboardTitle:'Sin guardar',panelLayout:[{id:'draft',type:'quick_note_draft',quickDraftText:'No perder'}],dashboardProfiles:[],activeDashboardProfileId:''});
 plugin.flushQuickDraftSaves=async()=>{};plugin.savePluginSettings=async()=>{};
 await plugin.createWorkspaceProfile('room','Nueva habitación');
 assert.equal(plugin.settings.dashboardProfiles.length,2);assert.ok(plugin.settings.dashboardProfiles.some(p=>p.snapshot.panelLayout.some(w=>w.quickDraftText==='No perder')));
});
test('failed starter persistence restores the previous workspace and permits retry',async()=>{
 const {NestBoardPlugin,normalizeSettings}=load();const plugin=Object.create(NestBoardPlugin.prototype);
 plugin.settings=normalizeSettings({dashboardTitle:'Original',panelLayout:[{id:'draft',type:'quick_note_draft',quickDraftText:'Mi idea'}],dashboardProfiles:[],activeDashboardProfileId:''});
 plugin.flushQuickDraftSaves=async()=>{};plugin.savePluginSettings=async()=>{throw Error('Disk unavailable')};
 await assert.rejects(plugin.createWorkspaceProfile('room','Otra'),/Disk unavailable/);
 assert.equal(plugin.settings.dashboardTitle,'Original');assert.equal(plugin.settings.panelLayout[0].quickDraftText,'Mi idea');
 plugin.savePluginSettings=async()=>{};await plugin.createWorkspaceProfile('room','Otra');assert.equal(plugin.settings.dashboardTitle,'Otra');
});
test('switching spaces closes a customization panel that belongs to the previous space',async()=>{
 const {NestBoardPlugin,normalizeSettings}=load();const plugin=Object.create(NestBoardPlugin.prototype);
 const snapshot={panelLayout:[{id:'q',type:'quick_note_draft'}]};
 plugin.settings=normalizeSettings({...snapshot,dashboardProfiles:[{id:'a',label:'A',snapshot},{id:'b',label:'B',snapshot}],activeDashboardProfileId:'a'});
 let closed=0;plugin.workspaceCustomization={close:()=>closed++};plugin.flushQuickDraftSaves=async()=>{};plugin.savePluginSettings=async()=>{};
 await plugin.activateDashboardProfile('b');assert.equal(closed,1);
});

test('retiring the last windows preserves empty spaces instead of applying starters',()=>{
 const {normalizeSettings}=load();const data=normalizeSettings({panelLayout:[{id:'p',type:'pet'}],dashboardProfiles:[{id:'empty',label:'Vacío',snapshot:{panelLayout:[{id:'p',type:'pet'}]}}],activeDashboardProfileId:'empty'});
 assert.equal(data.panelLayout.length,0);assert.equal(data.dashboardProfiles[0].snapshot.panelLayout.length,0);assert.equal(normalizeSettings({panelLayout:[]}).panelLayout.length,0);
 assert.equal(normalizeSettings(null).panelLayout.length,4);
});
