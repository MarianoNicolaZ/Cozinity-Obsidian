const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup,root}=require('./helpers/cozy-window-fixture.cjs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:1050,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
await page.evaluate(async()=>{
 window.baseFile=new testApi.TFile('Notas/Proyectos.base');files.push(baseFile);
 plugin.app.viewRegistry.getViewTypeByExtension=e=>e==='base'?'bases':e==='md'?'markdown':e;
 window.reads=0;window.fileWrites=0;const read=plugin.app.vault.cachedRead;
 plugin.app.vault.cachedRead=async f=>{if(f.extension==='base')reads++;return read(f)};
 for(const method of ['modify','delete','rename','create'])plugin.app.vault[method]=async()=>{fileWrites++;throw Error('Unexpected vault mutation')};
 plugin.app.workspace.trigger=()=>{};
 await mountAuditPanel({id:'base',type:'vault_note',title:'Proyectos',showBaseControls:true,filePath:baseFile.path,baseViewName:'Por estado'});
});
await page.waitForFunction(()=>view.embeddedLeaves[0]?.getViewState().type==='bases');
assert.equal(await page.evaluate(()=>view.embeddedLeaves[0].getViewState().state.viewName),'Por estado');
assert.equal(await page.evaluate(()=>reads),0,'safe mode never renders database YAML as Markdown');
await page.getByRole('combobox',{name:'Vista de la Base'}).selectOption('Galería');
assert.equal(await page.evaluate(()=>view.embeddedLeaves[0].getViewState().state.viewName),'Galería','native view selector stays usable');
assert.equal(await page.evaluate(()=>plugin.settings.panelLayout[0].baseViewName),'Galería','the changed view survives a dashboard redraw');
await page.evaluate(async()=>{const stored=plugin.settings.panelLayout[0];await mountAuditPanel(stored)});await page.waitForFunction(()=>view.embeddedLeaves[0]?.getViewState().state.viewName==='Galería');
const opened=await page.evaluate(()=>{const original=plugin.openDashboardLink;let target='';plugin.openDashboardLink=raw=>{target=raw};document.querySelector('.cozy-nest-vault-note-path').click();plugin.openDashboardLink=original;return target});
assert.equal(decodeURIComponent(opened),'Notas/Proyectos.base#Galería','opening the full Base keeps its active view');
await page.evaluate(()=>{
 window.refreshes=0;window.saved=[];plugin.saveData=async s=>saved.push(JSON.parse(JSON.stringify(s)));plugin.refreshPanelViews=()=>refreshes++;
 plugin.app.dragManager={draggable:null,handleDrop:(el,callback)=>{
  el._nativeDrop=callback;
  for(const type of ['dragover','drop'])el.addEventListener(type,event=>{if(plugin.app.dragManager.draggable)callback(event,plugin.app.dragManager.draggable,type!=='drop')});
 }};
 window.prepareBoard=()=>{
  view.detachEmbeddedLeaves();view.contentEl.empty();plugin.settings.panelLayout=[];plugin._draggedNativeBaseView=null;plugin.app.dragManager.draggable=null;view.clearExternalDropPreview();
  const root=view.contentEl.createDiv({cls:'cozy-nest-dashboard-root',attr:{'data-theme-pack':'stardew-valley-cozy'}});root.style.height='600px';
  window.board=root.createDiv({cls:'cozy-nest-board'});board.style.height='600px';board.style.width='700px';board.style.gap='12px';view.boardEl=board;
  view.attachBoardBackgroundInteraction(root);return root;
 };
 window.sendBoardDrop=(transfer)=>{const rect=board.getBoundingClientRect();const props={bubbles:true,cancelable:true,dataTransfer:transfer,clientX:rect.left+450,clientY:rect.top+350};board.dispatchEvent(new DragEvent('dragenter',props));board.dispatchEvent(new DragEvent('dragover',props));board.dispatchEvent(new DragEvent('drop',props));};
 prepareBoard();plugin.app.dragManager.draggable={type:'file',file:baseFile};sendBoardDrop(new DataTransfer());
});
await page.waitForFunction(()=>plugin.settings.panelLayout.length===1&&saved.length>0);
assert.equal(await page.evaluate(()=>refreshes),1,'native manager and generic handler never duplicate the drop');
let created=await page.evaluate(()=>plugin.settings.panelLayout[0]);assert.equal(created.type,'vault_note');assert.equal(created.filePath,'Notas/Proyectos.base');assert.equal(created.title,'Proyectos');assert.equal(created.gridW,6);assert.ok(created.gridY>=0);
await page.evaluate(async()=>{const panel=plugin.settings.panelLayout[0];await mountAuditPanel(panel)});await page.waitForFunction(()=>view.embeddedLeaves[0]?.getViewState().type==='bases');
assert.equal(await page.locator('.bases-header').count(),1,'native toolbar is mounted');
// Tab drags use blank text/plain in Obsidian. Capture only the Base payload;
// leave the native tab handlers intact and intercept only the dashboard drop.
await page.evaluate(()=>{
 prepareBoard();window.tab=document.body.createDiv({cls:'workspace-tab-header'});tab.setAttribute('draggable','true');tab.createSpan({text:'Proyectos'});
 window.originalLeaf={tabHeaderEl:tab,view:{file:baseFile},getViewState:()=>({type:'bases',state:{file:baseFile.path,viewName:'Por estado'}})};
 plugin.app.workspace.getLeavesOfType=type=>type==='bases'?[originalLeaf]:[];
 document.addEventListener('dragstart',e=>plugin.captureNativeBaseTabDrag(e),true);
 window.nativeTabDrops=0;window.nativeTabOvers=0;window.nativeTabEnters=0;window.nativeStart=0;
 window.nativeDrop=()=>nativeTabDrops++;window.nativeOver=()=>nativeTabOvers++;window.nativeEnter=()=>nativeTabEnters++;
 tab.addEventListener('dragstart',e=>{nativeStart++;e.dataTransfer.setData('text/plain','');window.addEventListener('drop',nativeDrop);window.addEventListener('dragover',nativeOver);window.addEventListener('dragenter',nativeEnter)});
 const transfer=new DataTransfer();tab.firstChild.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:transfer}));
 window.tabTransferText=transfer.getData('text/plain');sendBoardDrop(transfer);
});
await page.waitForFunction(()=>plugin.settings.panelLayout.length===1&&plugin.settings.panelLayout[0].baseViewName==='Por estado');
const tabResult=await page.evaluate(()=>({nativeTabDrops,nativeTabOvers,nativeTabEnters,nativeStart,tabTransferText,source:originalLeaf.getViewState(),panel:plugin.settings.panelLayout[0]}));
assert.equal(tabResult.nativeStart,1);assert.equal(tabResult.tabTransferText,'');assert.equal(tabResult.nativeTabDrops,0,'Base tab is copied rather than moved by the core workspace');assert.equal(tabResult.nativeTabOvers,0);assert.equal(tabResult.nativeTabEnters,0);assert.equal(tabResult.source.state.viewName,'Por estado');assert.equal(tabResult.panel.baseViewName,'Por estado');
await page.evaluate(()=>{window.removeEventListener('drop',nativeDrop);window.removeEventListener('dragover',nativeOver);window.removeEventListener('dragenter',nativeEnter);tab.remove();prepareBoard();const transfer=new DataTransfer();transfer.setData('text/plain','[[Notas/Proyectos.base#Galería]]');sendBoardDrop(transfer)});
await page.waitForFunction(()=>plugin.settings.panelLayout[0]?.baseViewName==='Galería');
// Drops inside a window stay under that window's own handlers.
const blocked=await page.evaluate(()=>{prepareBoard();const panel=board.createDiv({cls:'cozy-nest-panel-slot'}).createDiv({cls:'cozy-nest-panel'});const event={target:panel,dataTransfer:new DataTransfer()};return document.querySelector('.cozy-nest-dashboard-root')._nativeDrop(event,{file:baseFile},true)});assert.equal(blocked,null);
await page.evaluate(()=>{prepareBoard();plugin.app.dragManager.draggable={file:files.find(f=>f.extension==='canvas')};sendBoardDrop(new DataTransfer())});await page.waitForFunction(()=>plugin.settings.panelLayout[0]?.type==='canvas_board');assert.equal(await page.evaluate(()=>plugin.settings.panelLayout[0].items[0].path),'Notas/Ejemplo.canvas');
await page.evaluate(()=>{prepareBoard();const transfer=new DataTransfer();transfer.setData('text/plain','Notas/Ejemplo.md');sendBoardDrop(transfer)});await page.waitForFunction(()=>plugin.settings.panelLayout[0]?.filePath==='Notas/Ejemplo.md');
// View listeners are owned by the native component and cannot update another space.
await page.evaluate(async()=>{await mountAuditPanel({id:'base',type:'vault_note',title:'Proyectos',showBaseControls:true,filePath:baseFile.path,baseViewName:'Por estado'});window.trackedBaseLeaf=view.embeddedLeaves[0];window.originalProfile=plugin.settings.activeDashboardProfileId;plugin.settings.activeDashboardProfileId='another-space';trackedBaseLeaf.state.state.viewName='Galería';trackedBaseLeaf.events.trigger('view-changed')});
assert.equal(await page.evaluate(()=>plugin.settings.panelLayout[0].baseViewName),'Por estado','stale Base event cannot change another space');
await page.evaluate(()=>{plugin.settings.activeDashboardProfileId=originalProfile;view.detachEmbeddedLeaves();});assert.equal(await page.evaluate(()=>trackedBaseLeaf.events.count()),0,'unmount releases the native view event');
const themes=fs.readdirSync(path.join(root,'themes')).filter(t=>fs.existsSync(path.join(root,'themes',t,'theme.json')));let cases=0;const failures=[];
for(const theme of themes)for(const mode of ['light','dark']){
 const pack=JSON.parse(fs.readFileSync(path.join(root,'themes',theme,'theme.json'),'utf8'));
 await page.evaluate(async({pack,mode})=>{document.body.className='theme-'+mode;plugin.settings.themePackId=pack.id;plugin.themePacks=[pack];plugin.themePackMap=new Map([[pack.id,pack]]);plugin._themeTokenRevision++;await mountAuditPanel({id:'base',type:'vault_note',title:'Proyectos',showBaseControls:true,filePath:baseFile.path,baseViewName:'Por estado'})},{pack,mode});
 await page.waitForFunction(()=>view.embeddedLeaves[0]?.getViewState().type==='bases');
 const checks=await page.evaluate(()=>measure(document.querySelector('.cozy-nest-base-host')));for(const check of checks)if(check.ratio<check.threshold-.03)failures.push({theme,mode,...check});cases++;
 if(process.env.BASES_SCREENSHOT_DIR&&theme==='claymorphism-3d'&&mode==='light')await page.locator('#dashboard').screenshot({path:path.join(process.env.BASES_SCREENSHOT_DIR,'native-base-clay.png')});
}
assert.equal(failures.length,0,JSON.stringify(failures.slice(0,6),null,2));
await page.setViewportSize({width:420,height:750});await page.locator('#dashboard').evaluate(el=>{el.style.width='380px';el.style.margin='20px auto'});assert.equal(await page.getByRole('combobox',{name:'Vista de la Base'}).isVisible(),true);
// Obsidian can silently substitute an empty view when Bases is disabled.
await page.evaluate(async()=>{const original=testApi.WorkspaceLeaf.prototype.setViewState;testApi.WorkspaceLeaf.prototype.setViewState=function(state){return original.call(this,{type:'empty',state:{}})};await mountAuditPanel({id:'disabled-base',type:'vault_note',title:'Proyectos',showBaseControls:true,filePath:baseFile.path});testApi.WorkspaceLeaf.prototype.setViewState=original;});
await page.getByText('No se pudo abrir esta Base.',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>view.embeddedLeaves.length),0);assert.equal(await page.locator('.markdown-preview-view').count(),0);
assert.equal(await page.evaluate(()=>reads),0);assert.equal(await page.evaluate(()=>fileWrites),0);assert.equal(await page.evaluate(()=>baseFile.path),'Notas/Proyectos.base');assert.deepEqual(errors,[]);
console.log('PASS: native Base file/tab/link drops, selected view persistence, Canvas/Markdown regression, no vault writes, disabled-core fallback, narrow window, '+cases+' theme/mode surfaces.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
