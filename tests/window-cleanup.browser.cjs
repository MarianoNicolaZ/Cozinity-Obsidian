const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..');
const {setup}=require(path.join(root,'tests/helpers/cozy-window-fixture.cjs'));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
 if(process.env.COZY_DISABLE_LIFECYCLE)await page.evaluate(()=>{auditApi.NestBoardView.prototype.bindNativeBaseLifecycle=()=>{}});
 await page.evaluate(()=>{
  window.baseFile=new testApi.TFile('Notas/Proyectos.base');files.push(baseFile);plugin.app.viewRegistry.getViewTypeByExtension=e=>e==='base'?'bases':e;plugin.app.workspace.trigger=()=>{};
  window.workspaceCallbacks=new Map();plugin.app.workspace.on=(name,fn)=>{const ref={name,fn};workspaceCallbacks.set(ref,fn);return ref};plugin.app.workspace.offref=ref=>workspaceCallbacks.delete(ref);
  window.emitWorkspace=name=>{for(const [ref,fn]of workspaceCallbacks)if(ref.name===name)fn()};
  window.mountWindow=panel=>{view.detachEmbeddedLeaves();view.contentEl.empty();plugin.settings.panelLayout=auditApi.normalizeSettings({panelLayout:[panel]}).panelLayout;const root=view.contentEl.createDiv({cls:'cozy-nest-dashboard-root'});root.style.height='620px';window.board=root.createDiv({cls:'cozy-nest-board'});view.boardEl=board;view.renderPanelInstance(board,plugin.settings.panelLayout[0],view.getDashboardRenderContext(),0);const slot=board.firstElementChild;slot.style.cssText='width:650px;height:500px;position:relative;display:flex;grid-area:auto;';return slot};
  window.savedSettings=[];plugin.savePluginSettings=async()=>savedSettings.push(JSON.parse(JSON.stringify(plugin.settings)));
  mountWindow({id:'base',type:'vault_note',filePath:baseFile.path,title:'Proyectos',baseViewName:'Por estado'});
 });
 await page.waitForFunction(()=>view.embeddedLeaves[0]?.getViewState().type==='bases');
 await page.evaluate(()=>{window.originalBaseLeaf=view.embeddedLeaves[0]});
 assert.equal(await page.locator('.bases-header').isVisible(),false,'Base controls start hidden');
 assert.equal(await page.locator('.cozy-nest-vault-note-toolbar').isVisible(),false,'file path stays out of the window');
 assert.equal(await page.locator('.cozy-nest-panel-heading').isVisible(),false,'external title is hidden');
 await page.locator('.cozy-nest-panel-menu-btn').evaluate(el=>el.click());
 await page.evaluate(async()=>{const action=lastMenu.items.find(i=>i.title==='Mostrar controles de Bases');if(!action)throw Error('Missing Base controls menu action');await action.action()});
 assert.equal(await page.locator('.bases-header').isVisible(),true);
 assert.equal(await page.evaluate(()=>view.embeddedLeaves[0]===originalBaseLeaf),true,'toggle must not recreate the Base');
 await page.getByRole('combobox',{name:'Vista de la Base'}).selectOption('Galería');
 assert.equal(await page.evaluate(()=>plugin.settings.panelLayout[0].baseViewName),'Galería');
 assert.equal(await page.evaluate(()=>auditApi.normalizeSettings(JSON.parse(JSON.stringify(plugin.settings))).panelLayout[0].showBaseControls),true,'preference survives reload');
 await page.locator('.cozy-nest-panel-menu-btn').evaluate(el=>el.click());
 await page.evaluate(async()=>{await lastMenu.items.find(i=>i.title==='Ocultar controles de Bases').action()});
 assert.equal(await page.locator('.bases-header').isVisible(),false);
 // Model the native hidden-query contract and the separate controller resize.
 await page.evaluate(()=>{
  window.leaf=originalBaseLeaf;window.host=leaf.containerEl.parentElement;window.resizes=0;window.restarts=0;
  const controller=leaf.view.controller;controller.ctx={filter:'same-query'};controller.initialScan=false;
  controller.onResize=()=>resizes++;
  controller.runQuery=ctx=>{if(ctx!==controller.ctx)throw Error('Changed query context');restarts++;controller.initialScan=false;leaf.containerEl.querySelector('.bases-table-cell a').textContent='Proyecto actualizado'};
  host.closest('.cozy-nest-dashboard-root').style.display='none';emitWorkspace('active-leaf-change');
 });
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.evaluate(()=>{leaf.view.controller.initialScan=true;leaf.containerEl.querySelector('.bases-table-cell a').textContent='';host.closest('.cozy-nest-dashboard-root').style.display='';emitWorkspace('active-leaf-change')});
 try { await page.waitForFunction(()=>document.querySelector('.bases-table-cell a')?.textContent==='Proyecto actualizado',null,{timeout:2500}); } catch(error) { console.log(await page.evaluate(()=>({restarts,resizes,callbacks:workspaceCallbacks.size,visibility:document.visibilityState,rect:host.getBoundingClientRect().toJSON(),lifecycle:!!leaf._cozyBaseLifecycle,connected:host.isConnected,tracked:view.embeddedLeaves.includes(leaf),scan:leaf.view.controller.initialScan})));throw error; }
 assert.equal(await page.evaluate(()=>restarts),1,'restart a paused query once on return');
 assert.ok(await page.evaluate(()=>resizes>0),'resize the native Base controller');
 await page.evaluate(()=>{emitWorkspace('active-leaf-change');emitWorkspace('layout-change')});await page.waitForTimeout(80);
 assert.equal(await page.evaluate(()=>restarts),1,'healthy queries do not restart on every workspace event');
 await page.evaluate(()=>view.detachEmbeddedLeaves());assert.equal(await page.evaluate(()=>workspaceCallbacks.size),0,'release visibility event handlers');
 // A Base first constructed while its dashboard is hidden must also recover.
 await page.evaluate(()=>{
  mountWindow({id:'hidden-base',type:'vault_note',filePath:baseFile.path,title:'Oculta'});
  const root=board.closest('.cozy-nest-dashboard-root');root.style.display='none';
 });
 await page.waitForFunction(()=>view.embeddedLeaves[0]?.view.getViewType()==='bases');
 await page.evaluate(()=>{
  window.hiddenLeaf=view.embeddedLeaves[0];const c=hiddenLeaf.view.controller;c.ctx={};c.initialScan=true;
  window.hiddenRestarts=0;c.runQuery=ctx=>{hiddenRestarts++;c.initialScan=false;hiddenLeaf.containerEl.querySelector('.bases-table-cell a').textContent='Carga inicial recuperada'};
  emitWorkspace('active-leaf-change');
 });
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.equal(await page.evaluate(()=>hiddenRestarts),0,'never restart while the dashboard is hidden');
 await page.evaluate(()=>{board.closest('.cozy-nest-dashboard-root').style.display='';emitWorkspace('active-leaf-change')});
 await page.waitForFunction(()=>document.querySelector('.bases-table-cell a')?.textContent==='Carga inicial recuperada');
 assert.equal(await page.evaluate(()=>hiddenRestarts),1);
 await page.evaluate(()=>{plugin.app.plugins.plugins.tasknotes={settings:{}};mountWindow({id:'tn',type:'tasknotes',filePath:baseFile.path,title:'TaskNotes'})});
 await page.waitForFunction(()=>view.embeddedLeaves[0]?.view.getViewType()==='bases');
 assert.equal(await page.locator('.bases-header').isVisible(),false,'TaskNotes Base controls start hidden too');
 assert.equal(await page.locator('.cozy-nest-plugin-integration-toolbar').isVisible(),false,'TaskNotes path is hidden');
 await page.locator('.cozy-nest-panel-menu-btn').evaluate(el=>el.click());
 await page.evaluate(async()=>{await lastMenu.items.find(i=>i.title==='Mostrar controles de Bases').action()});
 assert.equal(await page.locator('.bases-header').isVisible(),true);
 for(const safeMode of [true,false]){
  await page.evaluate(safeMode=>{plugin.settings.safeMode=safeMode;mountWindow({id:'note',type:'vault_note',filePath:'Notas/Ejemplo.md',title:'Titulo externo'});},safeMode);
  const scroll=page.locator(safeMode?'.cozy-nest-vault-note-preview':'.cm-scroller');await scroll.waitFor();
  await scroll.evaluate(el=>{el.style.height='100%';if(el.matches('.cm-scroller')){const sizer=el.createDiv({cls:'cm-sizer'});sizer.style.minHeight='100%';sizer.style.paddingBottom='450px';const container=sizer.createDiv({cls:'cm-contentContainer'});while(el.firstChild!==sizer)container.append(el.firstChild);}else{const sizer=el.querySelector('.markdown-preview-sizer');sizer.style.minHeight='650px';sizer.style.paddingBottom='450px';} });
  await scroll.evaluate(el=>{const content=el.querySelector('.markdown-preview-sizer,.cm-content');content.innerHTML='<h2>Título de la nota</h2><p>Contenido breve.</p>'});
  const fits=await scroll.evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));assert.ok(fits.client>0);assert.ok(fits.scroll<=fits.client+1,JSON.stringify({safeMode,...fits}));assert.equal(fits.overflow,'auto');assert.ok(await scroll.evaluate(el=>el.querySelector('.markdown-preview-sizer,.cm-content').getBoundingClientRect().width>200),'note text retains readable width');
  await scroll.evaluate(el=>{const content=el.querySelector('.markdown-preview-sizer,.cm-content');for(let i=0;i<60;i++)content.createEl('p',{text:'Línea larga '+i})});
  assert.equal(await scroll.evaluate(el=>el.scrollHeight>el.clientHeight+20),true,'long note still scrolls');
  await scroll.evaluate(el=>{el.scrollTop=80});assert.ok(await scroll.evaluate(el=>el.scrollTop>0));
 }
 await page.locator('.cm-scroller').evaluate(el=>el.scrollTop=0);
 await page.screenshot({path:path.join(process.env.COZY_QA_DIR||path.join(root,'tests/artifacts'),'window-cleanup.png')});
 assert.deepEqual(errors,[]);console.log('PASS: toolbar menu and persistence without remount, clean headings, hidden-to-visible Base recovery, scoped resize, cleanup, short and long notes.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
