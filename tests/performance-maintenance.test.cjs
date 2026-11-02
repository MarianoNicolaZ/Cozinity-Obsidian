const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
class Base {}
class Element { constructor() { this.values = new Map([['--host-token','keep']]); this.style = { setProperty:(k,v)=>this.values.set(k,v), removeProperty:k=>this.values.delete(k) }; } }
function load() {
 const timers=new Map(); let id=0;
 const window={setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:key=>timers.delete(key),clearInterval:key=>timers.delete(key)};
 const ctx={module:{exports:{}},require:()=>({Plugin:Base,ItemView:Base,Modal:Base,PluginSettingTab:Base,FuzzySuggestModal:Base,Notice:Base,normalizePath:p=>p}),console,URL,Date,HTMLElement:Element,window,document:{body:{classList:{contains:()=>false}}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../main.js'),'utf8')+'\nmodule.exports.api={NestBoardPlugin,NestBoardView};',ctx);
 return {...ctx.module.exports.api,timers,window};
}
test('window picker hides unavailable integrations and duplicate graph windows without discarding saved windows',()=>{
 const {NestBoardPlugin}=load(); const plugin=Object.create(NestBoardPlugin.prototype);
 plugin.app={plugins:{getPlugin:()=>null,plugins:{}}};plugin.settings={panelLayout:[{id:'g',type:'graph'}]};
 let types=plugin.getAddablePanelDefinitions().map(p=>p.type);
 assert.ok(!types.includes('tasknotes'));assert.ok(!types.includes('notion_bases'));assert.ok(!types.includes('graph'));
 assert.ok(!types.includes('quick_actions'));assert.ok(!types.includes('customization'));assert.ok(!types.includes('notes_blocks'));
 plugin.app.plugins.getPlugin=id=>['tasknotes','notion-bases'].includes(id)?{}:null;
 types=plugin.getAddablePanelDefinitions().map(p=>p.type);
 assert.ok(types.includes('tasknotes'));assert.ok(types.includes('notion_bases'));assert.equal(plugin.settings.panelLayout.length,1);
});
test('changing theme removes only prior theme-owned properties on a reused element',()=>{
 const {NestBoardPlugin}=load(); const plugin=Object.create(NestBoardPlugin.prototype);plugin.settings={themePackId:'a'};
 let theme={id:'a',tokens:{light:{'--cozy-text':'#fff','--cozy-extra':'old'}}};plugin.getActiveThemePack=()=>theme;
 const target=new Element();plugin.applyThemePackTokens(target);
 theme={id:'b',tokens:{light:{'--cozy-text':'#222'}}};plugin.settings.themePackId='b';plugin.applyThemePackTokens(target);
 assert.equal(target.values.get('--cozy-text'),'#222');assert.ok(!target.values.has('--cozy-extra'));assert.equal(target.values.get('--host-token'),'keep');
});
test('unloading clears pending refreshes and cannot render after plugin disposal',async()=>{
 const {NestBoardPlugin,timers,window}=load();const plugin=Object.create(NestBoardPlugin.prototype);let refreshes=0;
 plugin._refreshViewsTimer=window.setTimeout(()=>refreshes++,200);plugin._vaultChangeTimer=window.setTimeout(()=>refreshes++,400);
 plugin.flushQuickDraftSaves=async()=>{};plugin.app={workspace:{detachLeavesOfType:()=>{},getLeavesOfType:()=>{refreshes++;return [];}}};
 await plugin.onunload();assert.equal(timers.size,0);plugin.refreshViews();assert.equal(refreshes,0);
});
test('an image change refreshes only matching galleries plus vault statistics, leaving native editors alone',()=>{
 const {NestBoardView}=load();const view=Object.create(NestBoardView.prototype);const ids=[];
 view.plugin={settings:{panelLayout:[{id:'hit',type:'image_gallery',folderPath:'Art'},{id:'sibling',type:'image_gallery',folderPath:'Artwork'},{id:'root',type:'image_gallery',folderPath:'/'},{id:'stats',type:'vault_map'},{id:'editor',type:'vault_note',filePath:'Notes/a.md'}]}};
 view.refreshPanelInstance=id=>ids.push(id);view.refreshVaultDataPanels({path:'Art/Sub/a.png',extension:'png'});
 assert.deepEqual(ids,['hit','root','stats']);
});
test('a burst of images retains targeted refresh options, including folders of every changed image',()=>{
 const {NestBoardPlugin,NestBoardView,timers}=load();const plugin=Object.create(NestBoardPlugin.prototype);let request;
 plugin.invalidateVaultIndex=()=>{};plugin.invalidateTaskBoard=()=>{};plugin.isSupportedImageFile=()=>true;plugin.isFileEmbeddedInDashboard=()=>false;plugin.isDashboardEditingActive=()=>false;
 plugin.refreshVaultDataViews=(file,options)=>request={file,options};
 plugin.handleVaultChange({path:'Art/one.png',extension:'png'});plugin.handleVaultChange({path:'Other/two.png',extension:'png'});
 [...timers.values()][0]();assert.equal(request.options?.imageOnly,true);assert.deepEqual(Array.from(request.options.paths),['Art/one.png','Other/two.png']);
 const view=Object.create(NestBoardView.prototype);const ids=[];view.plugin={settings:{panelLayout:[{id:'first',type:'image_gallery',folderPath:'Art'},{id:'second',type:'image_gallery',folderPath:'Other'},{id:'unrelated',type:'image_gallery',folderPath:'Elsewhere'},{id:'notes',type:'recent'},{id:'tasks',type:'tasks'}]}};view.refreshPanelInstance=id=>ids.push(id);
 view.refreshVaultDataPanels(request.file,request.options);assert.deepEqual(ids,['first','second']);
});
