const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path');
const root=process.env.COZYNITY_ROOT||path.resolve(__dirname,'..');const {setup}=require(path.join(root,'tests/helpers/cozy-window-fixture.cjs'));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1100,height:850}});page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
 await page.evaluate(()=>{
  plugin.app.workspace.trigger=()=>{};window.tabOpens=0;window.nativeOpens=[];plugin.app.workspace.openLinkText=function(...args){nativeOpens.push(args);return Promise.resolve()};plugin.app.workspace.getLeaf=()=>{tabOpens++;return new testApi.WorkspaceLeaf(plugin.app)};
  window.cleanups=[];plugin.register=fn=>cleanups.push(fn);plugin.installDashboardNavigationRouting?.();
  window.baseFile=new testApi.TFile('Notas/Proyectos.base');files.push(baseFile);plugin.app.viewRegistry.getViewTypeByExtension=e=>e==='base'?'bases':e;
  const root=view.contentEl.createDiv({cls:'cozy-nest-dashboard-root'});
  // Native Bases cards are divs, not anchors. Their own listener calls openLinkText.
  const card=root.createDiv({cls:'bases-cards-item',text:'Abrir tarjeta nativa',attr:{role:'button',tabindex:'0'}});
  card.addEventListener('click',e=>{e.preventDefault();void plugin.app.workspace.openLinkText(baseFile.path,'Notas/Ejemplo.md',false)});
  card.addEventListener('keydown',e=>{if(e.key==='Enter')void plugin.app.workspace.openLinkText(baseFile.path,'Notas/Ejemplo.md',false)});
  const outside=document.body.createEl('button',{text:'Abrir fuera del dashboard'});outside.style.cssText='position:fixed;top:8px;left:8px;z-index:1000';outside.addEventListener('click',()=>plugin.app.workspace.openLinkText('Notas/Ejemplo.md','',false));
 });
 await page.getByRole('button',{name:'Abrir tarjeta nativa'}).click();assert.equal(await page.evaluate(()=>!!plugin.dashboardOverlay),true,'native Base card opens in the floating window');await page.evaluate(()=>plugin.dashboardOverlay.queue);
 assert.equal(await page.evaluate(()=>plugin.dashboardOverlay.entry.path),'Notas/Proyectos.base');
 assert.equal(await page.evaluate(()=>nativeOpens.length),0,'a native card must not navigate the workspace');assert.equal(await page.evaluate(()=>tabOpens),0);
 assert.equal(await page.locator('.cozy-nest-overlay').isVisible(),true);
 await page.evaluate(()=>plugin.dashboardOverlay.close());await page.getByRole('button',{name:'Abrir tarjeta nativa'}).focus();await page.keyboard.press('Enter');await page.evaluate(()=>plugin.dashboardOverlay.queue);
 assert.equal(await page.evaluate(()=>plugin.dashboardOverlay.entry.path),'Notas/Proyectos.base');
 await page.evaluate(()=>plugin.dashboardOverlay.close());await page.getByRole('button',{name:'Abrir fuera del dashboard'}).click();assert.equal(await page.evaluate(()=>nativeOpens.length),1,'ordinary Obsidian navigation stays native');
 await page.evaluate(()=>plugin.app.workspace.openLinkText('Notas/Destino.md','',false));assert.equal(await page.evaluate(()=>nativeOpens.length),2,'unrelated programmatic calls stay native');
 // Integrations use the same floating window without opening workspace leaves.
 await page.evaluate(async()=>{await view.openPluginIntegrationFile('tasknotes',baseFile);await plugin.dashboardOverlay.queue});assert.equal(await page.evaluate(()=>plugin.dashboardOverlay.entry.path),'Notas/Proyectos.base');assert.equal(await page.evaluate(()=>tabOpens),0);
 await page.evaluate(async()=>{plugin.app.plugins.plugins['notion-bases']={openDatabaseInLeaf:()=>{throw Error('Must use overlay')}};await view.openPluginIntegrationFile('notion_bases',files[0]);await plugin.dashboardOverlay.queue});
 assert.equal(await page.evaluate(()=>plugin.dashboardOverlay.nativeLeaf.getViewState().type),'notion-bases-view');assert.equal(await page.evaluate(()=>tabOpens),0);
 await page.evaluate(async()=>{await plugin.openNativeGraphView();await plugin.dashboardOverlay.queue});assert.equal(await page.evaluate(()=>plugin.dashboardOverlay.nativeLeaf.getViewState().type),'graph');
 // Native Graph dispatches link opens from pointerup, before click.
 await page.evaluate(()=>{const node=plugin.dashboardOverlay.nativeLeaf.containerEl.querySelector('.view-content').createEl('button',{text:'Nodo del graph',cls:'graph-overlay-node'});node.addEventListener('pointerup',()=>plugin.app.workspace.openLinkText('Notas/Destino.md','',false))});
 await page.getByRole('button',{name:'Nodo del graph'}).click();await page.evaluate(()=>plugin.dashboardOverlay.queue);
 assert.equal(await page.evaluate(()=>plugin.dashboardOverlay.entry.path),'Notas/Destino.md','graph nodes stay in the floating window');assert.equal(await page.evaluate(()=>nativeOpens.length),2);
 await page.evaluate(async()=>{await plugin.openNativeGraphView();await plugin.dashboardOverlay.queue});
 await page.evaluate(()=>plugin.dashboardOverlay.openInTab());assert.equal(await page.evaluate(()=>tabOpens),1,'explicit Open in tab remains available');
 await page.evaluate(()=>{for(const fn of cleanups.splice(0))fn()});await page.getByRole('button',{name:'Abrir tarjeta nativa'}).click();assert.equal(await page.evaluate(()=>nativeOpens.length),3,'unload restores native routing');
 assert.deepEqual(errors,[]);console.log('PASS: native card and keyboard opens stay floating; outside navigation remains native; TaskNotes, Notion Bases and Graph reuse overlay; explicit tab and unload cleanup work.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
