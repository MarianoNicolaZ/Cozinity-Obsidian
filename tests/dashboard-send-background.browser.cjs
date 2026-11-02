const {chromium}=require('playwright'),assert=require('node:assert/strict'),{PNG}=require('pngjs'),fs=require('node:fs'),path=require('node:path');
const {setup,root}=require('./helpers/cozy-window-fixture.cjs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(4000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
 if(!process.argv.includes('--background')){
  await page.evaluate(async()=>{
   window.writes=0;for(const method of ['create','modify','process','rename','createBinary'])plugin.app.vault[method]=()=>{writes++;throw Error('This action must not write to the vault')};
   plugin.refreshPanelViews=()=>{};window.disk=[];plugin.saveData=async s=>disk.push(JSON.parse(JSON.stringify(s)));
   await plugin.openDashboardOverlay({kind:'file',path:'Notas/Ejemplo.md'});await plugin.dashboardOverlay.queue;
  });
  await page.setViewportSize({width:480,height:800});const bounds=await page.getByRole('button',{name:'Enviar al dashboard',exact:true}).boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=480,'send action remains reachable in a narrow window');await page.setViewportSize({width:1100,height:900});
  fs.mkdirSync(path.join(root,'tests/artifacts'),{recursive:true});await page.locator('.cozy-nest-overlay').screenshot({path:path.join(root,'tests/artifacts','send-note-to-dashboard.png')});
  await page.getByRole('button',{name:'Enviar al dashboard',exact:true}).click();
  await page.waitForFunction(()=>!plugin.dashboardOverlay);
  assert.deepEqual(await page.evaluate(()=>plugin.settings.panelLayout.map(p=>({type:p.type,path:p.filePath}))),[{type:'vault_note',path:'Notas/Ejemplo.md'}]);
  assert.equal(await page.evaluate(()=>writes),0);assert.equal(await page.evaluate(()=>disk.at(-1).dashboardProfiles[0].snapshot.panelLayout[0].filePath),'Notas/Ejemplo.md');
  // Double activation while a native save is pending creates one panel only.
  await page.evaluate(async()=>{plugin.settings.language='en';await plugin.openDashboardOverlay({kind:'file',path:'Notas/Destino.md'});await plugin.dashboardOverlay.queue;window.resolveSave=null;const leaf=plugin.dashboardOverlay.nativeLeaf;leaf.view.save=()=>new Promise(r=>{resolveSave=()=>{leaf.view.save=async()=>{};r()}});});
  await page.getByRole('button',{name:'Send to dashboard',exact:true}).click();
  await page.evaluate(()=>{void plugin.dashboardOverlay.sendToDashboard();resolveSave()});
  await page.waitForFunction(()=>!plugin.dashboardOverlay);assert.equal(await page.evaluate(()=>plugin.settings.panelLayout.length),2);
  // Navigation during that pending save must not add the old note.
  await page.evaluate(async()=>{await plugin.openDashboardOverlay({kind:'file',path:'Notas/Ejemplo.md'});await plugin.dashboardOverlay.queue;const leaf=plugin.dashboardOverlay.nativeLeaf;leaf.view.save=()=>new Promise(r=>{window.resolveSave=()=>{leaf.view.save=async()=>{};r()}});void plugin.dashboardOverlay.sendToDashboard();});
  await page.waitForFunction(()=>!!window.resolveSave);
  await page.evaluate(async()=>{const modal=plugin.dashboardOverlay;const next=modal.navigate({kind:'folder',path:'Notas'});resolveSave();await next});
  assert.equal(await page.evaluate(()=>plugin.settings.panelLayout.length),2);assert.equal(await page.getByRole('button',{name:'Send to dashboard',exact:true}).count(),0);
  await page.evaluate(()=>plugin.dashboardOverlay.close());
  // A Base retains its chosen view; a deleted file offers no action.
  await page.evaluate(async()=>{const file=new testApi.TFile('Notas/Proyectos.base');files.push(file);await plugin.openDashboardOverlay({kind:'file',path:file.path});await plugin.dashboardOverlay.queue;plugin.dashboardOverlay.nativeLeaf.getViewState=()=>({type:'bases',state:{file:file.path,viewName:'Cards'}})});
  await page.getByRole('button',{name:'Send to dashboard',exact:true}).click();await page.waitForFunction(()=>!plugin.dashboardOverlay);
  assert.equal(await page.evaluate(()=>plugin.settings.panelLayout.at(-1).baseViewName),'Cards');
  await page.evaluate(async()=>{await plugin.openDashboardOverlay({kind:'file',path:'Notas/missing.md'});await plugin.dashboardOverlay.queue});
  assert.equal(await page.getByRole('button',{name:'Send to dashboard',exact:true}).count(),0);await page.evaluate(()=>plugin.dashboardOverlay.close());assert.equal(await page.evaluate(()=>writes),0);
  // Failed configuration writes leave the original native editor accessible and no extra panel to duplicate on retry.
  await page.evaluate(async()=>{await plugin.openDashboardOverlay({kind:'file',path:'Notas/Ejemplo.md'});await plugin.dashboardOverlay.queue;window.editor=plugin.dashboardOverlay.nativeLeaf.containerEl;window.previousCount=plugin.settings.panelLayout.length;plugin.saveData=async()=>{throw Object.assign(Error('disk full'),{code:'ENOSPC'})}});
  await page.getByRole('button',{name:'Send to dashboard',exact:true}).click();
  await page.waitForFunction(()=>!plugin.dashboardOverlay.sendingToDashboard);
  assert.equal(await page.evaluate(()=>plugin.settings.panelLayout.length),await page.evaluate(()=>previousCount),'a failed configuration write rolls back its own added panel');
  assert.equal(await page.evaluate(()=>editor.isConnected),true,'a failed send must retain the native editor');
  await page.evaluate(()=>{plugin.saveData=async()=>{}});await page.getByRole('button',{name:'Send to dashboard',exact:true}).click();await page.waitForFunction(()=>!plugin.dashboardOverlay);
  assert.equal(await page.evaluate(()=>plugin.settings.panelLayout.length),await page.evaluate(()=>previousCount+1));
  // A failed native save must not discard the editor or add a panel.
  await page.evaluate(async()=>{await plugin.openDashboardOverlay({kind:'file',path:'Notas/Ejemplo.md'});await plugin.dashboardOverlay.queue;window.editor=plugin.dashboardOverlay.nativeLeaf.containerEl;plugin.dashboardOverlay.nativeLeaf.view.save=async()=>{throw Error('native save failed')}});
  await page.getByRole('button',{name:'Send to dashboard',exact:true}).click();await page.waitForFunction(()=>!plugin.dashboardOverlay.sendingToDashboard);
  assert.equal(await page.evaluate(()=>editor.isConnected),true,'native save failure keeps unsaved text accessible');assert.equal(await page.locator('.cozy-nest-overlay-send-status').isVisible(),true);assert.equal(await page.evaluate(()=>plugin.settings.panelLayout.length),await page.evaluate(()=>previousCount+1));
  await page.evaluate(()=>{plugin.dashboardOverlay.nativeLeaf.view.save=async()=>{};plugin.dashboardOverlay.close()});
 }
 await page.evaluate(()=>{
  view.contentEl.empty();const root=view.contentEl.createDiv({cls:'cozy-nest-dashboard-root'});root.style.cssText='padding:0;width:800px;min-height:0;overflow:visible';
  window.frame=root.createDiv({cls:'cozy-nest-frame'});frame.style.cssText='width:800px;height:700px;min-height:0;padding:0;border:0;border-radius:0;box-shadow:none;box-sizing:border-box';
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#146c94"/><stop offset=".5" stop-color="#d8c078"/><stop offset="1" stop-color="#783050"/></linearGradient></defs><rect width="800" height="400" fill="url(#g)"/><circle cx="160" cy="80" r="32" fill="#fff"/></svg>';
  plugin.settings.language='en';plugin.getBoardBackgroundUrl=()=> 'data:image/svg+xml,'+encodeURIComponent(svg);plugin.settings.boardBackgroundMode='image';plugin.settings.boardBackgroundPositionY=79;plugin.settings.boardBackgroundSizing='fixed';plugin.applyThemeBackdrop(frame);
 });
 const sample=async()=>{const png=PNG.sync.read(await page.locator('.cozy-nest-frame').screenshot({animations:'disabled'}));const pixels=[];for(const y of [30,80,180,280])for(const x of [80,160,400,700]){const i=(y*png.width+x)*4;pixels.push(...png.data.subarray(i,i+4));}return pixels;};
 const before=await sample();await page.evaluate(()=>{frame.style.height='1800px'});const after=await sample();assert.deepEqual(after,before,'growing the board must preserve the fixed image scale and top crop');
 const style=await page.evaluate(()=>{const s=getComputedStyle(frame,'::before');return{size:s.backgroundSize,repeat:s.backgroundRepeat,y:s.backgroundPositionY}});assert.deepEqual(style,{size:'100% auto',repeat:'repeat-y',y:'0%'});
 const png=PNG.sync.read(await page.locator('.cozy-nest-frame').screenshot({animations:'disabled'}));const pixel=(x,y)=>Array.from(png.data.subarray((y*png.width+x)*4,(y*png.width+x)*4+4));assert.deepEqual(pixel(400,80),pixel(400,480),'image repeats vertically at its scaled height');
 await page.evaluate(()=>{plugin.settings.boardBackgroundSizing='cover';plugin.applyThemeBackdrop(frame);frame.style.height='700px'});const coverBefore=await sample();await page.evaluate(()=>{frame.style.height='1800px'});assert.notDeepEqual(await sample(),coverBefore,'cover remains the expanding alternative');assert.equal(await page.evaluate(()=>getComputedStyle(frame,'::before').backgroundPositionY),'79%');
 await page.evaluate(()=>{window.controls=document.body.createDiv();view.backgroundControlTarget='board';view.renderControlBackground(controls,{onChanged:()=>{}});plugin.initializeDashboardHistory(true)});
 const choice=page.getByLabel('Image sizing',{exact:true});await choice.selectOption('fixed');await page.waitForFunction(()=>plugin.settings.boardBackgroundSizing==='fixed');
 assert.equal(await page.evaluate(()=>plugin.settings.dashboardProfiles[0].snapshot.boardBackgroundSizing),'fixed');
 await page.evaluate(()=>plugin.undoDashboardChange());assert.equal(await page.evaluate(()=>plugin.settings.boardBackgroundSizing),'cover');await page.evaluate(()=>plugin.redoDashboardChange());assert.equal(await page.evaluate(()=>plugin.settings.boardBackgroundSizing),'fixed');
 await choice.scrollIntoViewIfNeeded();const artifacts=path.join(root,'tests/artifacts');fs.mkdirSync(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,'stable-background.png')});
 assert.deepEqual(errors,[]);console.log('PASS: send notes/Bases without vault mutations, duplicate/stale protection, fixed-width repeating image stable under growth, cover alternative, bilingual control and undo persistence.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
