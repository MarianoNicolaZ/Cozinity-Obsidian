const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
class Base{};class TFile{constructor(p){this.path=p;this.name=p.split('/').pop();this.basename=this.name.replace(/\.[^.]+$/,'');this.extension=this.name.split('.').pop();}}class TFolder{constructor(p){this.path=p}}
const api={Plugin:Base,ItemView:Base,Modal:Base,Notice:Base,PluginSettingTab:Base,FuzzySuggestModal:Base,TFile,TFolder,normalizePath:p=>p.replace(/\\/g,'/')};const c={module:{exports:{}},require:()=>api,console,URL,ArrayBuffer,Date,setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../main.js'),'utf8')+'\nmodule.exports.tests={NestBoardView,normalizeSettings};',c);const Plugin=c.module.exports,{NestBoardView,normalizeSettings}=Plugin.tests;
function fixture(){const p=Object.create(Plugin.prototype);p.settings=normalizeSettings({safeMode:true,panelLayout:[]});const files=new Map();let writes=0;p.app={plugins:{plugins:{'obsidian-kanban':{},'obsidian-excalidraw-plugin':{}}},metadataCache:{getFileCache:f=>({frontmatter:f.path.includes('Kanban')?{'kanban-plugin':'board'}:{}})},vault:{getAbstractFileByPath:path=>files.get(path)||null,createFolder:async path=>files.set(path,new TFolder(path)),createBinary:async(path,bytes)=>{assert.ok(!files.has(path),'never overwrite');writes++;const f=new TFile(path);f.bytes=bytes;files.set(path,f);return f}},workspace:{getLeavesOfType:()=>[]}};p.saveData=async()=>{};p.refreshPanelViews=()=>{};p.refreshViews=()=>{};const view=Object.create(NestBoardView.prototype);view.plugin=p;return{p,view,files,writes:()=>writes}}
test('dragged native plugin state survives settings, profiles and reload',async()=>{const {p}=fixture();const state={type:'notion-bases-view',state:{dbFilePath:'Notas/Proyectos.md',filters:[{field:'estado',value:'Activo'}]}};assert.equal(await p.addNativeViewPanel({kind:'native-view',title:'Proyectos',viewState:state},'center',{gridX:0,gridY:0,gridW:6,gridH:24}),true);const panel=p.settings.panelLayout[0];assert.equal(panel.type,'plugin_view');assert.equal(panel.nativeViewState.type,state.type);assert.equal(panel.nativeViewState.state.filters[0].value,'Activo');state.state.filters[0].value='Changed outside';assert.equal(panel.nativeViewState.state.filters[0].value,'Activo');const reloaded=normalizeSettings(JSON.parse(JSON.stringify(p.settings)));assert.equal(reloaded.panelLayout[0].nativeViewState.state.dbFilePath,'Notas/Proyectos.md');});
test('known file views are native and arbitrary registered tab views share the same bridge',()=>{const {view}=fixture();const kanban=new TFile('Notas/Kanban.md'),draw=new TFile('Notas/Dibujo.excalidraw.md');assert.equal(view.getExternalBoardDropDescriptor([kanban]).kind,'native-view');assert.equal(view.getExternalBoardDropDescriptor([draw]).entry.viewState.type,'excalidraw');const entry={kind:'native-view',title:'Calendario',viewState:{type:'google-calendar-view-week',state:{date:'2026-10-07'}}};assert.equal(view.getExternalBoardDropDescriptor([entry]).entry,entry);});
test('unsupported or recursive views cannot become nested dashboards',async()=>{const {p}=fixture();assert.equal(await p.addNativeViewPanel({kind:'native-view',viewState:{type:'cozy-nest-dashboard',state:{}}}),false);assert.equal(p.settings.panelLayout.length,0);});
test('an explicitly selected background can be copied in safe mode without changing notes',async()=>{const {p,files,writes}=fixture();p.canWriteVault=()=>{throw Error('background must not enable note editing')};const bytes=new Uint8Array([137,80,78,71,13,10,26,10]).buffer;const file={name:'fondo.png',type:'image/png',size:bytes.byteLength,arrayBuffer:async()=>bytes};const first=await p.importBackgroundImage(file);assert.equal(first.path,'Cozynity imports/backgrounds/fondo.png');const second=await p.importBackgroundImage(file);assert.equal(second.path,'Cozynity imports/backgrounds/fondo-2.png');assert.equal(files.get(first.path),first);assert.equal(writes(),2);assert.equal(p.settings.safeMode,true);});
test('cancelled, invalid and oversized background imports preserve the previous background',async()=>{const {p,writes}=fixture();let reads=0;const f={name:'fondo.png',type:'image/png',size:26*1024*1024,arrayBuffer:async()=>{reads++;return new ArrayBuffer(1)}};assert.equal(await p.importBackgroundImage(f),null);assert.equal(await p.importBackgroundImage({...f,size:1},{isCurrent:()=>false}),null);assert.equal(await p.importBackgroundImage({...f,name:'programa.exe',type:'application/octet-stream',size:1}),null);assert.equal(reads,0);assert.equal(writes(),0);});

test('core editors cannot bypass the protected note and Canvas windows',async()=>{const {p}=fixture();for(const type of ['markdown','canvas','bases'])assert.equal(await p.addNativeViewPanel({viewState:{type,state:{file:'Notas/Ejemplo.md',mode:'source'}}}),false);assert.equal(p.settings.panelLayout.length,0)});
test('renaming a plugin file or its folder preserves native state in every saved space',async()=>{const {p}=fixture();p.settings.panelLayout=[{id:'kanban',type:'plugin_view',nativeViewState:{type:'kanban',state:{file:'Notas/Kanban.md'}}}];p.settings.dashboardProfiles=[{id:'other',snapshot:{panelLayout:[{id:'notion',type:'plugin_view',nativeViewState:{type:'notion-bases-view',state:{dbFilePath:'Notas/Proyectos.md',query:'Notas'}}}]}}];p.savePluginSettings=async()=>{};p.handleVaultChange=()=>{};p.handleVaultRename(new TFolder('Proyectos'),'Notas');assert.equal(p.settings.panelLayout[0].nativeViewState.state.file,'Proyectos/Kanban.md');assert.equal(p.settings.dashboardProfiles[0].snapshot.panelLayout[0].nativeViewState.state.dbFilePath,'Proyectos/Proyectos.md');assert.equal(p.settings.dashboardProfiles[0].snapshot.panelLayout[0].nativeViewState.state.query,'Notas');});

test('Task Genius is offered only when its installed plugin is active',()=>{
  const {p}=fixture();
  assert.equal(p.getAddablePanelDefinitions().some(d=>d.type==='task_genius'),false);
  p.app.plugins.plugins['obsidian-task-progress-bar']={settings:{}};
  assert.equal(p.getAddablePanelDefinitions().find(d=>d.type==='task_genius')?.label,'Task Genius');
});
test('adding Task Genius uses a cloned native view and preserves placement and saved spaces',async()=>{
  const {p}=fixture();
  p.settings=normalizeSettings({panelLayout:[],activeDashboardProfileId:'genius',dashboardProfiles:[{id:'genius',label:'Genius',snapshot:{panelLayout:[]}}]});
  p.app.plugins.plugins['obsidian-task-progress-bar']={settings:{fluentView:{enableFluent:false}}};
  const state={type:'task-genius-view',state:{currentViewId:'projects',filter:{tags:['#work']}}};
  p.app.workspace.getLeavesOfType=type=>type===state.type?[{getViewState:()=>state}]:[];
  assert.equal(await p.addPanel('task_genius','center',{gridX:2,gridY:3,gridW:9,gridH:28}),true);
  const panel=p.settings.panelLayout[0];
  assert.equal(panel.type,'plugin_view');assert.equal(panel.title,'Task Genius');
  assert.equal(panel.nativeViewState.state.currentViewId,'projects');
  assert.equal(panel.gridX,2);assert.equal(panel.gridY,3);assert.equal(panel.gridW,9);
  state.state.filter.tags.push('#changed');
  assert.deepEqual(Array.from(panel.nativeViewState.state.filter.tags),['#work']);
  const reloaded=normalizeSettings(JSON.parse(JSON.stringify(p.settings)));
  assert.equal(reloaded.panelLayout[0].nativeViewState.type,'task-genius-view');
  assert.equal(reloaded.dashboardProfiles.find(d=>d.id===reloaded.activeDashboardProfileId).snapshot.panelLayout[0].nativeViewState.state.currentViewId,'projects');
});
test('Task Genius follows its Fluent setting and allows multiple independent windows',async()=>{
  const {p}=fixture();
  p.app.plugins.plugins['obsidian-task-progress-bar']={settings:{fluentView:{enableFluent:true}}};
  for(let i=0;i<2;i++)assert.equal(await p.addPanel('task_genius'),true);
  assert.equal(p.settings.panelLayout.length,2);
  assert.equal(p.settings.panelLayout[0].nativeViewState.type,'fluent-task-genius-view');
  assert.notEqual(p.settings.panelLayout[0].id,p.settings.panelLayout[1].id);
  p.settings.panelLayout[0].nativeViewState.state.currentViewId='kanban';
  assert.equal(p.settings.panelLayout[1].nativeViewState.state.currentViewId,undefined);
});
test('Task Genius disabled between menu opening and adding cannot create a broken window',async()=>{
  const {p}=fixture();
  assert.equal(await p.addPanel('task_genius'),false);
  assert.equal(p.settings.panelLayout.length,0);
});
