const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');const {setup,root}=require('./helpers/cozy-window-fixture.cjs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1100,height:850}});page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
 await page.evaluate(pack=>{plugin.settings.themePackId=pack.id;plugin.themePacks=[pack];plugin.themePackMap=new Map([[pack.id,pack]])},JSON.parse(fs.readFileSync(path.join(root,"themes/obsidian-native/theme.json"),"utf8")));
 await page.evaluate(()=>{
  plugin.app.workspace.trigger=()=>{};window.diagCleanup=[];plugin.register=fn=>diagCleanup.push(fn);
  window.baseFile=new testApi.TFile('Notas/Proyectos.base');files.push(baseFile);plugin.app.viewRegistry.getViewTypeByExtension=e=>e==='base'?'bases':e;
  window.mountPair=()=>{view.detachEmbeddedLeaves();view.contentEl.empty();plugin.settings.panelLayout=auditApi.normalizeSettings({panelLayout:[{id:'base',type:'vault_note',filePath:baseFile.path},{id:'other',type:'image_gallery',folderPath:'Notas',gridY:30}]}).panelLayout;window.rootEl=view.contentEl.createDiv({cls:'cozy-nest-dashboard-root'});window.board=rootEl.createDiv({cls:'cozy-nest-board'});view.boardEl=board;for(const p of plugin.settings.panelLayout)view.renderPanelInstance(board,p,view.getDashboardRenderContext(),0);for(const slot of board.querySelectorAll('.cozy-nest-panel-slot'))slot.style.cssText='width:600px;height:400px;position:relative;display:flex;grid-area:auto;'};
  plugin.startDiagnostics();mountPair();
 });
 await page.waitForFunction(()=>view.embeddedLeaves[0]?.view.getViewType()==='bases');
 await page.evaluate(()=>{window.savedBase=view.embeddedLeaves[0];window.sibling=document.querySelector('[data-panel-id=other]');});
 await page.evaluate(async()=>{await plugin.updatePanel('base',{title:'New title',panelColor:'#234567',panelOpacity:70})});
 assert.equal(await page.evaluate(()=>view.embeddedLeaves[0]===savedBase),true,'presentation updates retain the actual native leaf');assert.equal(await page.evaluate(()=>document.querySelector('[data-panel-id=other]')===sibling),true);
 // A synchronous panel renderer failure is isolated and can recover in place.
 await page.evaluate(()=>{window.originalRender=view.renderPanelContent;view.renderPanelContent=function(parent,panel,...rest){if(panel.id==='other')throw Error('controlled render failure');return originalRender.call(this,parent,panel,...rest)};view.refreshPanelInstance('other',{contentChanged:true});});
 assert.equal(await page.locator('[data-panel-id=other] button').filter({hasText:'Reintentar'}).count(),1);assert.equal(await page.evaluate(()=>view.embeddedLeaves[0]===savedBase),true);
 await page.evaluate(()=>{view.renderPanelContent=originalRender;});await page.locator('[data-panel-id=other] button').filter({hasText:'Reintentar'}).click();assert.equal(await page.locator('[data-panel-id=other] .cozy-window-error').count(),0);assert.equal(await page.evaluate(()=>view.embeddedLeaves[0]===savedBase),true);
 // Disabled Bases reports a scoped error; retry after re-enabling affects only it.
 await page.evaluate(()=>{window.nativeSet=testApi.WorkspaceLeaf.prototype.setViewState;testApi.WorkspaceLeaf.prototype.setViewState=function(s){return nativeSet.call(this,{type:'empty',state:{}})};view.refreshPanelInstance('base',{contentChanged:true});});
 await page.locator('[data-panel-id=base] .cozy-window-error button').waitFor();await page.evaluate(()=>{testApi.WorkspaceLeaf.prototype.setViewState=nativeSet});await page.locator('[data-panel-id=base] .cozy-window-error button').click();await page.waitForFunction(()=>view.embeddedLeaves[0]?.view.getViewType()==='bases');assert.equal(await page.evaluate(()=>document.querySelector('[data-panel-id=other]')===sibling),true);
 await page.addScriptTag({content:'window.loadApi={CozyWindowLoadState};'});
 // A slow request remains retryable; a late healthy result removes the warning.
 await page.evaluate(()=>{window.retryCount=0;const host=document.body.createDiv();host.style.cssText='position:fixed;top:20px;left:20px;width:320px;height:200px';window.slowHost=host;window.slow=new loadApi.CozyWindowLoadState(plugin,host,{timeoutMs:60,retry:()=>retryCount++});});
 await page.locator('.cozy-window-slow button').waitFor();await page.locator('.cozy-window-slow button').click();assert.equal(await page.evaluate(()=>retryCount),1);await page.evaluate(()=>slow.complete());assert.equal(await page.locator('.cozy-window-slow').count(),0);
 // A late empty Base query may signal completion by changing only a CSS class.
 await page.evaluate(()=>{const host=document.body.createDiv({attr:{id:'late-load-host'}});host.style.cssText='position:fixed;top:20px;left:20px;width:320px;height:200px';host.createDiv({cls:'is-loading'});window.lateLeaf={view:{controller:{initialScan:true}}};window.lateLoad=new loadApi.CozyWindowLoadState(plugin,host,{timeoutMs:60,retry:()=>{}});lateLoad.ready(lateLeaf)});
 await page.locator('#late-load-host .cozy-window-slow').waitFor();await page.evaluate(()=>{lateLeaf.view.controller.initialScan=false;document.querySelector('#late-load-host .is-loading').classList.remove('is-loading')});
 await page.waitForFunction(()=>document.querySelector('#late-load-host').getAttribute('aria-busy')==='false',null,{timeout:1200});await page.locator('#late-load-host').evaluate(el=>{el._cozyLoadState.dispose();el.remove()});
 // Hidden windows must not report a timeout until they become visible.
 await page.evaluate(()=>{window.hiddenHost=document.body.createDiv();hiddenHost.style.cssText='display:none;width:320px;height:200px';window.hiddenLoad=new loadApi.CozyWindowLoadState(plugin,hiddenHost,{timeoutMs:60,retry:()=>{}})});
 await page.waitForTimeout(110);assert.equal(await page.locator('.cozy-window-slow').count(),0);
 await page.evaluate(()=>hiddenLoad.dispose());assert.equal(await page.evaluate(()=>hiddenHost._cozyLoadState===undefined),true);
 // An optional workspace resize error must not leave a healthy note under a loader.
 await page.evaluate(()=>{plugin.settings.safeMode=false;plugin.app.workspace.trigger=()=>{throw Error('optional resize failed')};const note={id:'editable',type:'vault_note',filePath:'Notas/Ejemplo.md'};plugin.settings.panelLayout.push(note);view.renderPanelInstance(board,note,view.getDashboardRenderContext(),2)});
 await page.waitForFunction(()=>document.querySelector('[data-panel-id=editable] .cm-editor')&&document.querySelector('[data-panel-id=editable] .cozy-nest-vault-note-editor').getAttribute('aria-busy')==='false');
 await page.evaluate(()=>plugin.openDiagnostics());await page.getByRole('heading',{name:'Diagnóstico de Cozinity'}).waitFor();
 const report=await page.getByRole('textbox',{name:'Informe de diagnóstico'}).inputValue();const parsed=JSON.parse(report);assert.ok(parsed.events.some(e=>e.status==='error'));assert.ok(parsed.events.some(e=>e.action==='native-load'));
 await page.screenshot({path:path.join(process.env.COZY_QA_DIR||path.join(root,'tests/artifacts'),'diagnostics.png')});
 await page.evaluate(()=>{plugin.diagnosticsModal.close();view.detachEmbeddedLeaves();slowHost.remove();hiddenHost.remove();for(const fn of diagCleanup)fn()});assert.deepEqual(errors,[]);
 console.log('PASS: native instance preserved by presentation edits, isolated renderer/native failure and retry, slow and late-success states, diagnostics report and modal.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
