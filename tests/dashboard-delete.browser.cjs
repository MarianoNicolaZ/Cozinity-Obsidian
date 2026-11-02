const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path');
const {setup,root}=require('./helpers/cozy-window-fixture.cjs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:1200,height:850}});page.setDefaultTimeout(6000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
await page.evaluate(()=>{
 plugin.settings=auditApi.normalizeSettings({...plugin.settings,dashboardTitle:'Trabajo',subtitle:'Mis proyectos',activeDashboardProfileId:'work',panelLayout:[{id:'draft',type:'quick_note_draft',quickDraftText:'La idea más reciente'}],dashboardProfiles:[{id:'work',label:'Trabajo',snapshot:{panelLayout:[]}},{id:'personal',label:'Personal',snapshot:{dashboardTitle:'Personal',panelLayout:[]}}]});
 window.disk=[];plugin.saveData=async data=>disk.push(JSON.parse(JSON.stringify(data)));window.vaultWrites=0;
 for(const name of ['create','modify','delete','trash','rename'])plugin.app.vault[name]=()=>{vaultWrites++;throw Error('Unexpected vault mutation '+name)};
 window.paint=()=>{view.contentEl.empty();const el=view.contentEl.createDiv({cls:'cozy-nest-dashboard-root',attr:{'data-theme-pack':plugin.settings.themePackId}});plugin.applyThemePackTokens(el);view.renderWorkspaceHeader(el);};plugin.refreshViews=paint;plugin.initializeDashboardHistory(true);paint();
});
const option=async title=>{await page.getByRole('button',{name:'Opciones del dashboard'}).click();await page.evaluate(title=>{const item=lastMenu.items.find(i=>i.title===title);if(!item)throw Error('Missing menu '+title);return item.action()},title);};
await option('Eliminar dashboard');const modal=page.locator('.cozy-dashboard-delete-modal');await modal.getByRole('heading',{name:'Eliminar dashboard',exact:true}).waitFor();assert.match(await modal.innerText(),/Trabajo/);assert.match(await modal.innerText(),/Las notas y archivos del vault se conservan/);assert.equal(await modal.getByRole('button',{name:'Cancelar'}).evaluate(el=>el===document.activeElement),true);
await page.screenshot({path:path.join(process.env.COZY_QA_DIR||path.join(root,'tests/artifacts'),'dashboard-delete-confirm.png')});
await modal.getByRole('button',{name:'Cancelar'}).click();assert.equal(await modal.count(),0);assert.equal(await page.evaluate(()=>plugin.getDashboardProfiles().length),2);assert.equal(await page.evaluate(()=>disk.length),0);
await option('Eliminar dashboard');await modal.getByRole('button',{name:'Eliminar dashboard',exact:true}).click();await page.waitForFunction(()=>plugin.settings.activeDashboardProfileId==='personal');assert.equal(await page.getByRole('navigation',{name:'Dashboards guardados'}).getByRole('button').count(),1);
// Model reloading the persisted plugin data before using the recovery UI.
await page.evaluate(()=>{plugin.settings=auditApi.normalizeSettings(disk[disk.length-1]);plugin.initializeDashboardHistory(true);paint()});
await option('Dashboards eliminados');await modal.getByRole('heading',{name:'Dashboards eliminados',exact:true}).waitFor();await page.screenshot({path:path.join(process.env.COZY_QA_DIR||path.join(root,'tests/artifacts'),'dashboard-deleted-list.png')});await modal.getByRole('button',{name:'Recuperar Trabajo',exact:true}).click();await page.waitForFunction(()=>plugin.settings.activeDashboardProfileId==='work');assert.equal(await page.evaluate(()=>plugin.settings.panelLayout[0].quickDraftText),'La idea más reciente');
// A confirmation bound to a different active dashboard must never delete it.
await option('Eliminar dashboard');await page.evaluate(()=>plugin.activateDashboardProfile('personal'));await modal.getByRole('button',{name:'Eliminar dashboard',exact:true}).click();await modal.getByRole('status').filter({hasText:'El dashboard cambió'}).waitFor();assert.equal(await page.evaluate(()=>plugin.getDashboardProfiles().length),2);await modal.getByRole('button',{name:'Cancelar'}).click();
// Delete every remaining dashboard, then recover from the empty header.
await page.evaluate(async()=>{await plugin.deleteDashboardProfile('personal');await plugin.deleteDashboardProfile('work')});assert.equal(await page.evaluate(()=>plugin.settings.panelLayout.length),0);await option('Dashboards eliminados');await modal.getByRole('button',{name:'Recuperar Trabajo',exact:true}).click();await page.waitForFunction(()=>plugin.settings.activeDashboardProfileId==='work');
assert.equal(await page.evaluate(()=>vaultWrites),0);assert.deepEqual(errors,[]);
console.log('PASS: named confirmation, cancel focus/no changes, persistent recovery and draft, stale confirmation safety, last-dashboard empty state, restore from menu, zero vault mutations.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
