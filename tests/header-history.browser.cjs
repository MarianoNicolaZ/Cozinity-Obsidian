const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {setup,root}=require('./helpers/cozy-window-fixture.cjs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:850},acceptDownloads:true});page.setDefaultTimeout(6000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);await page.addStyleTag({content:'#dashboard{width:calc(100% - 32px)!important;max-width:none;margin:16px auto}'});
 await page.evaluate(()=>{
  plugin.settings=auditApi.normalizeSettings({...plugin.settings,dashboardTitle:'Proyectos',subtitle:'Proyectos en curso',safeMode:false,panelLayout:[{id:'draft',type:'quick_note_draft',quickDraftText:'Mi idea más reciente',gridX:0,gridW:4}],activeDashboardProfileId:'work',dashboardProfiles:[{id:'work',label:'Proyectos',snapshot:{panelLayout:[]}},{id:'personal',label:'Personal',snapshot:{dashboardTitle:'Personal',panelLayout:[]}},{id:'study',label:'Estudio',snapshot:{panelLayout:[]}}]});
  const background='<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="250"><defs><linearGradient id="b"><stop stop-color="#071f30"/><stop offset=".5" stop-color="#075d86"/><stop offset="1" stop-color="#102735"/></linearGradient></defs><rect width="1600" height="250" fill="url(#b)"/><path d="M0 205 Q500 100 1600 220" fill="none" stroke="#ef9e3b" stroke-width="6"/></svg>';
  plugin.resolveHeaderBackground=()=>({mode:'image',url:'data:image/svg+xml,'+encodeURIComponent(background),ink:'#ffffff',posX:'50%',posY:'50%',scale:100});
  window.disk=[];plugin.saveData=async s=>disk.push(JSON.parse(JSON.stringify(s)));plugin.initializeDashboardHistory(true);
  window.paintHeader=()=>{view.contentEl.empty();const root=view.contentEl.createDiv({cls:'cozy-nest-dashboard-root',attr:{'data-theme-pack':'obsidian-native'}});plugin.applyThemePackTokens(root);const frame=root.createDiv({cls:'cozy-nest-frame'});view.renderWorkspaceHeader(frame);};paintHeader();
 });
 assert.equal(await page.locator('.cozy-workspace-identity select').count(),0);
 assert.equal(await page.getByRole('navigation',{name:'Dashboards guardados'}).getByRole('button').count(),3);
 async function layoutCheck(){const m=await page.evaluate(()=>{const h=document.querySelector('.cozy-workspace-header'),r=h.querySelector('.cozy-workspace-profiles'),b=r.getBoundingClientRect(),x=h.getBoundingClientRect(),identity=h.querySelector('.cozy-workspace-identity');return{center:Math.abs(b.x+b.width/2-(x.x+x.width/2)),top:b.y,identityBottom:identity.getBoundingClientRect().bottom,background:getComputedStyle(identity).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth+2}});assert.ok(m.center<2,JSON.stringify(m));assert.ok(m.top>=m.identityBottom,JSON.stringify(m));assert.equal(m.background,'rgba(0, 0, 0, 0)');assert.equal(m.overflow,false);}
 await layoutCheck();await page.screenshot({path:path.join(process.env.COZY_QA_DIR||path.join(root,'tests/artifacts'),'dashboard-header-tabs.png')});
 await page.setViewportSize({width:390,height:900});await layoutCheck();
 // Many long names wrap and remain centered instead of overflowing the banner.
 await page.evaluate(()=>{plugin.settings.dashboardProfiles.push(...Array.from({length:7},(_,i)=>({id:'long'+i,label:'Dashboard con un nombre largo '+i,snapshot:{panelLayout:[]}})));paintHeader()});await layoutCheck();
 await page.setViewportSize({width:1440,height:850});
 // Real click switches dashboards and the active indication follows the saved profile.
 await page.getByRole('button',{name:'Personal',exact:true}).click();await page.waitForFunction(()=>plugin.settings.activeDashboardProfileId==='personal');await page.evaluate(()=>paintHeader());assert.equal(await page.getByRole('button',{name:'Personal',exact:true}).getAttribute('aria-current'),'page');
 await page.evaluate(async()=>{await plugin.activateDashboardProfile('work');plugin.settings.subtitle='Descripción modificada';await plugin.savePluginSettings({silent:true});paintHeader()});
 await page.getByRole('button',{name:'Opciones del dashboard'}).click();await page.evaluate(()=>lastMenu.items.find(x=>x.title==='Configuración y copias').action());
 const dialog=page.locator('.cozy-configuration-modal');await dialog.getByRole('heading',{name:'Configuración y copias'}).waitFor();
 await dialog.getByRole('button',{name:'Guardar punto de recuperación',exact:true}).click();await dialog.getByRole('status').filter({hasText:'Punto de recuperación guardado.'}).waitFor();
 await page.evaluate(async()=>{plugin.settings.subtitle='Otra descripción';await plugin.savePluginSettings({silent:true})});
 await dialog.getByRole('button',{name:'Restaurar punto guardado',exact:true}).click();await page.waitForFunction(()=>plugin.settings.subtitle==='Descripción modificada');
 await dialog.getByRole('button',{name:'Deshacer',exact:true}).click();await page.waitForFunction(()=>plugin.settings.subtitle==='Otra descripción');
 await dialog.getByRole('button',{name:'Rehacer',exact:true}).click();await page.waitForFunction(()=>plugin.settings.subtitle==='Descripción modificada');
 const downloadPromise=page.waitForEvent('download');await dialog.getByRole('button',{name:'Exportar configuración',exact:true}).click();const download=await downloadPromise;const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(backup.format,'cozynity-dashboards');assert.ok(backup.profiles.length>=3);
 const input=dialog.getByLabel('Archivo de configuración');await input.setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});await dialog.getByRole('status').filter({hasText:'no es una copia'}).waitFor();
 await input.setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await dialog.getByRole('button',{name:'Agregar dashboards de la copia'}).waitFor();const count=await page.evaluate(()=>plugin.getDashboardProfiles().length);await dialog.getByRole('button',{name:'Agregar dashboards de la copia'}).click();await page.waitForFunction(n=>plugin.getDashboardProfiles().length===n*2,count);assert.equal(await dialog.count(),0);
 assert.equal(await page.evaluate(()=>plugin.settings.panelLayout[0].quickDraftText),'Mi idea más reciente');
 await page.evaluate(()=>plugin.openDashboardConfiguration());await page.screenshot({path:path.join(process.env.COZY_QA_DIR||path.join(root,'tests/artifacts'),'dashboard-configuration.png')});assert.deepEqual(errors,[]);
 console.log('PASS: centered bottom dashboard buttons at desktop/mobile and many profiles, transparent identity, active navigation, save/restore/undo/redo, JSON download, invalid import and previewed additive import.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
