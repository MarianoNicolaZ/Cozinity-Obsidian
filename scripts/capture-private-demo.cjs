/**
 * Fictional-data demonstrations of production Cozinity renderers.
 * Native Obsidian APIs/content are supplied by the existing browser fixture.
 * Run with Playwright available through NODE_PATH; Edge must be installed.
 * COZY_MEDIA_WORK selects temporary frames; FFMPEG_PATH selects ffmpeg.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const {setup,serveAssets,root}=require('../tests/helpers/cozy-window-fixture.cjs');
const output=path.join(root,'docs/media');
const work=path.resolve(process.env.COZY_MEDIA_WORK||path.join(os.tmpdir(),'cozinity-private-demo'));
const ffmpeg=process.env.FFMPEG_PATH||'ffmpeg';
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(work,{recursive:true});
const packNames=['lo-fi-cafe','stardew-valley-cozy','minimal-os'];
const packs=packNames.map(name=>({name,pack:JSON.parse(fs.readFileSync(path.join(root,'themes',name,'theme.json'),'utf8'))}));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 try {
  const page=await browser.newPage({viewport:{width:1200,height:920},deviceScaleFactor:1,acceptDownloads:true});
  page.setDefaultTimeout(8000);page.on('pageerror',error=>errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='warning'||msg.type()==='error')console.log('BROWSER:',msg.text())});
  await serveAssets(page);await setup(page);
  await page.addStyleTag({content:`
   html,body{margin:0;min-height:100%;overflow:hidden}body{background:#ece8df;font-family:'Segoe UI',system-ui,sans-serif}
   #dashboard{width:1160px!important;margin:0 auto!important;height:844px;overflow:auto;border-radius:16px;box-shadow:0 10px 32px #31291d18}
   .demo-chrome{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;color:#645b4c;box-sizing:border-box;font-size:12px;letter-spacing:.03em}
   .demo-chrome strong{font-size:17px;letter-spacing:-.04em;color:#332b20}.demo-chrome small{margin-left:12px;letter-spacing:.1em;font-size:10px;text-transform:uppercase}
   .demo-footer{height:24px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#746b5e;letter-spacing:.03em}
   .demo-menu{position:fixed;z-index:4000;display:flex;flex-direction:column;padding:6px;background:#faf8f3;color:#372c20;border:1px solid #cec4b2;border-radius:12px;box-shadow:0 8px 28px #30271825;min-width:220px}
   .demo-menu button{background:transparent;border:0;text-align:left;padding:8px 14px;box-shadow:none;color:inherit;font-size:13px}.demo-menu button:hover{background:#eae4d6}
   .modal-container{background:#211a1244}.demo-close{position:absolute;right:8px;top:8px;padding:0!important;width:26px;height:26px;border:0;background:transparent;box-shadow:none;color:inherit}.audit-native .markdown-preview-view{padding:18px 22px}.audit-native .view-content{min-height:0!important}
   .demo-note-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-muted)}
   .audit-native .markdown-preview-view h2{margin:10px 0 14px}.audit-native .markdown-preview-view p{line-height:1.65}
  `});
  await page.evaluate(packs=>{
   document.body.className='theme-light';
   const bar=document.body.createDiv({cls:'demo-chrome'});bar.innerHTML='<div><strong>Cozinity</strong><small>Private preview · 0.1.9</small></div><span>Browser demo · fictional data</span>';document.body.prepend(bar);
   document.body.createDiv({cls:'demo-footer',text:'Production dashboard renderers · simulated Obsidian APIs · no personal vault data'});
   const originalModalOpen=testApi.Modal.prototype.open;testApi.Modal.prototype.open=function(){const close=this.modalEl.createEl('button',{cls:'demo-close',text:'×',attr:{type:'button','aria-label':'Cerrar diálogo'}});close.addEventListener('click',()=>this.close());return originalModalOpen.call(this)};
   const originalMenu=testApi.Menu.prototype.showAtMouseEvent;
   testApi.Menu.prototype.showAtMouseEvent=function(event){originalMenu.call(this,event);document.querySelector('.demo-menu')?.remove();const menu=document.body.createDiv({cls:'demo-menu',attr:{role:'menu'}});const origin=event?.currentTarget?.getBoundingClientRect?.();menu.style.top=Math.min(460,(origin?.bottom||160)+8)+'px';menu.style.right='42px';for(const item of this.items){const button=menu.createEl('button',{text:item.title,attr:{type:'button',role:'menuitem'}});button.addEventListener('click',()=>{menu.remove();item.action?.()})}};
   plugin.manifest={id:'cozynity',name:'Cozinity',version:'0.1.9'};
   plugin.themePacks=packs.map(({name,pack})=>auditApi.normalizeThemePack(pack,{basePath:'themes/'+name}));plugin.themePackMap=new Map(plugin.themePacks.map(pack=>[pack.id,pack]));
   const {TFile,TFolder}=testApi;
   const projects=new TFolder('Proyectos'),ideas=new TFolder('Ideas'),reading=new TFolder('Lecturas');
   files.splice(0,files.length,...['Proyectos/Pequeños comienzos.md','Proyectos/Plan de la semana.md','Ideas/Un jardín de ideas.md','Lecturas/Notas de lectura.md','Proyectos/Proyectos.base'].map(p=>new TFile(p)));
   window.demoFolders=[projects,ideas,reading];for(const folder of demoFolders){folder.children=files.filter(file=>file.path.startsWith(folder.path+'/'));for(const file of folder.children)file.parent=folder;}
   const rootFolder=new TFolder('');rootFolder.children=demoFolders;
   plugin.app.vault.getRoot=()=>rootFolder;plugin.app.vault.getAllLoadedFiles=()=>[rootFolder,...demoFolders,...files];plugin.app.vault.getAbstractFileByPath=p=>[rootFolder,...demoFolders,...files].find(item=>item.path===p)||null;
   plugin.app.vault.getFiles=()=>files;plugin.app.vault.getMarkdownFiles=()=>files.filter(f=>f.extension==='md');plugin.app.vault.getResourcePath=f=>'https://assets.local/'+f.path;
   plugin.app.metadataCache.getFileCache=()=>({tags:[{tag:'#ideas'}],frontmatter:{}});plugin.app.metadataCache.getFirstLinkpathDest=p=>files.find(f=>f.path===p||f.basename===p)||null;
   plugin.app.workspace.getLeavesOfType=type=>type==='cozynity-view'?[{view}]:view.embeddedLeaves.filter(leaf=>leaf.view.getViewType()===type);
   plugin.app.workspace.trigger=()=>{};plugin.app.workspace.openLinkText=async()=>{};plugin.app.commands.commands={};plugin.register=()=>{};
   plugin.app.viewRegistry=plugin.app.viewRegistry||{getViewTypeByExtension:ext=>ext};
   plugin.app.viewRegistry.getViewTypeByExtension=ext=>({md:'markdown',base:'bases',canvas:'canvas'})[ext]||ext;
   plugin.app.vault.cachedRead=async file=>file.extension==='base'?'views: []':'# Demo note';
   plugin.getNotebookGroups=()=>demoFolders.map((folder,index)=>({folder:folder.path,label:plugin.getLanguage()==='en'?['Projects','Ideas','Reading'][index]:['Proyectos','Ideas','Lecturas'][index],noteCount:folder.children.filter(f=>f.extension==='md').length,latestFile:folder.children[0]}));
   plugin.getRecentFiles=()=>files.filter(f=>f.extension==='md');plugin.recentOpenedPaths=[];
   plugin.getPetSummary=()=>({});plugin.getTaskBoardItems=async()=>[];
   plugin.saveData=async state=>{window.demoSaved=JSON.parse(JSON.stringify(state))};plugin.loadData=async()=>window.demoSaved||{};
   plugin.refreshViews=()=>view.render();
   const writeFail=async()=>{throw Error('Demo vault is read-only')};for(const name of ['create','modify','rename','delete','createBinary'])plugin.app.vault[name]=writeFail;
   const noteHtml=()=>plugin.getLanguage()==='en'?'<div class="demo-note-kicker">A little room for what matters</div><h2>Small beginnings</h2><p>One page, a clear intention, and a little time to make something meaningful.</p><blockquote>Make space for the next small step.</blockquote><p>✦ Gather inspiration<br>✦ Shape the first idea<br>✦ Leave room to explore</p>':'<div class="demo-note-kicker">Un rincón para lo que importa</div><h2>Pequeños comienzos</h2><p>Una página, una intención clara y un poco de tiempo para crear algo con sentido.</p><blockquote>Haz espacio para el próximo paso.</blockquote><p>✦ Reunir inspiración<br>✦ Dar forma a la primera idea<br>✦ Dejar lugar para explorar</p>';
   testApi.MarkdownRenderer.render=async(_app,_text,el)=>{el.innerHTML=noteHtml()};testApi.MarkdownRenderer.renderMarkdown=async(_text,el)=>{el.innerHTML=noteHtml()};
   const originalNative=testApi.WorkspaceLeaf.prototype.setViewState;
   testApi.WorkspaceLeaf.prototype.setViewState=async function(state){await originalNative.call(this,state);const lang=plugin.getLanguage();if(state.type==='markdown'){const preview=this.containerEl.querySelector('.markdown-preview-view');if(preview)preview.innerHTML=noteHtml();}if(state.type==='bases'){const table=this.containerEl.querySelector('.bases-table');if(table){const english=lang==='en';const header=table.querySelectorAll('.bases-table-header');header[0].textContent=english?'Project':'Proyecto';header[1].textContent=english?'Status':'Estado';const body=table.querySelector('.bases-table-container');body.style.height='156px';body.innerHTML='';(english?[['Seed an idea','In progress'],['Create a quiet corner','Planning'],['Read and reflect','Ready'],['Make room to play','Someday']]:[['Sembrar una idea','En curso'],['Crear un rincón','Planificando'],['Leer y reflexionar','Listo'],['Dejar lugar al juego','Algún día']]).forEach(([name,status],index)=>{const row=body.createDiv({cls:'bases-tr'});row.style.cssText='position:absolute;height:36px;top:'+index*36+'px';const title=row.createDiv({cls:'bases-td'});title.style.cssText='width:260px;left:0';title.createDiv({cls:'bases-table-cell'}).createEl('a',{text:name,cls:'internal-link',attr:{'data-href':files[0].path,href:files[0].path}});const tag=row.createDiv({cls:'bases-td'});tag.style.cssText='width:180px;left:260px';tag.createDiv({cls:'bases-table-cell',text:status})});}}};
   window.installDemo=async language=>{
    await plugin.dashboardOverlay?.close?.();document.querySelector('.demo-menu')?.remove();
    const english=language==='en';const t=(es,en)=>english?en:es;
    const shortcuts={version:1,layout:'shelves',fitMode:'manual',iconSize:88,gap:18,labelMode:'below',shelves:[{id:'main',label:'',height:150,look:'wood'}],items:[{id:'inspire',label:t('Inspiración','Inspiration'),icon:{kind:'room',type:'plant'},target:{kind:'tag',path:'#ideas'},shelfId:'main',scale:1},{id:'today',label:t('Mi rincón','My corner'),icon:{kind:'room',type:'lamp'},target:{kind:'file',path:files[0].path},shelfId:'main',scale:1}]};
    const panels=[{id:'library',type:'notebooks',title:t('Cuadernos y accesos','Notebooks and shortcuts'),gridX:0,gridY:0,gridW:8,gridH:8},{id:'timer',type:'timer',title:t('Un momento de enfoque','A moment to focus'),gridX:8,gridY:0,gridW:4,gridH:8,timerMode:'countdown',timerDurationMinutes:25,timerStyle:'ring',timerStatus:'idle'},{id:'base',type:'vault_note',filePath:'Proyectos/Proyectos.base',gridX:0,gridY:8,gridW:6,gridH:12,showBaseControls:false},{id:'note',type:'vault_note',filePath:files[0].path,gridX:6,gridY:8,gridW:6,gridH:12}];
    const shared={language,safeMode:true,subtitle:t('Ideas, proyectos y pequeños pasos. Todo en tu espacio.','Ideas, projects and small steps. All in your own space.'),themePackId:'lo-fi-cafe',themePreset:'sunlit',panelLayout:panels,shortcutLibrary:shortcuts,globalPanelOpacity:100,embeddedNoteBackground:'panel',dashboardTitle:t('Mi estudio','My studio')};
    const room={...shared,dashboardTitle:t('Mi habitación','My room'),subtitle:t('Un lugar para imaginar lo que viene.','A place to imagine what comes next.'),themePackId:'stardew-valley-cozy',panelLayout:[{id:'room',type:'cozy_room',gridX:2,gridY:0,gridW:8,gridH:21,room:{version:2,activeRoomId:'office',rooms:[{id:'office',name:t('Estudio creativo','Creative studio'),palette:'honey',wall:1,floor:2,objects:[{id:'rug',type:'round_rug',x:9,y:8,order:0},{id:'desk',type:'desk',x:8,y:4,order:1},{id:'chair',type:'office_chair',x:8,y:7,order:2},{id:'bookcase',type:'bookshelf',x:2,y:3,order:3,binding:{kind:'folder',path:'Proyectos'}},{id:'plant',type:'plant',x:19,y:3,order:4},{id:'lamp',type:'lamp',x:16,y:5,order:5}]}]}}]};
    const focus={...shared,dashboardTitle:t('Enfoque','Focus'),subtitle:t('Menos ruido. Una idea a la vez.','Less noise. One idea at a time.'),themePackId:'minimal-os',panelLayout:[{...panels[1],gridX:0,gridW:4,gridH:11,timerStyle:'digital'},{id:'draft',type:'quick_note_draft',gridX:4,gridY:0,gridW:8,gridH:11,title:t('Una idea para después','An idea for later'),quickDraftTitle:t('Lo siguiente','Up next'),quickDraftText:t('Crear algo pequeño, útil y lleno de calma.\n\nHoy quiero explorar una idea nueva.','Make something small, useful and full of calm.\n\nToday I want to explore a new idea.')} ]};
    plugin.settings=auditApi.normalizeSettings({...shared,activeDashboardProfileId:'studio',dashboardProfiles:[{id:'studio',label:shared.dashboardTitle,snapshot:shared},{id:'room',label:room.dashboardTitle,snapshot:room},{id:'focus',label:focus.dashboardTitle,snapshot:focus}]});plugin._dashboardHistories=new Map();plugin.initializeDashboardHistory(true);view.render();
    document.querySelector('.demo-chrome span').textContent=english?'Browser demo · fictional data':'Demo en navegador · datos ficticios';
   };
  },packs);
  async function ready(){await page.waitForTimeout(700);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=img.onerror=resolve})));});}
  await page.evaluate(()=>installDemo('es'));await ready();
  await page.screenshot({path:path.join(output,'overview-es.png')});
  console.log('Overview ES captured');
  if(process.env.COZY_MEDIA_PREVIEW_ONLY==='1'){console.log('Preview only');return;}
  await page.evaluate(()=>installDemo('en'));await ready();await page.screenshot({path:path.join(output,'overview-en.png')});
  await page.evaluate(()=>installDemo('es'));await ready();
  async function record(name,actions){
   const dir=path.join(work,name+'-'+Date.now());fs.mkdirSync(dir,{recursive:true});let stopped=false,index=0;
   const capture=(async()=>{while(!stopped){const started=Date.now();await page.screenshot({path:path.join(dir,String(index++).padStart(4,'0')+'.png')});await sleep(Math.max(0,125-(Date.now()-started)));}})();
   try {await actions();}finally{stopped=true;await capture;}
   assert.ok(index>=48&&index<=96,name+' must have 6–12 seconds of real captured frames');
   const target=path.join(output,name+'.gif');
   execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-framerate','8','-i',path.join(dir,'%04d.png'),'-filter_complex','[0:v]scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4','-loop','0',target],{stdio:'pipe'});
   assert.ok(fs.statSync(target).size<5*1024*1024,name+' exceeds the 5 MB media budget');
   console.log(name+': '+index+' frames, '+(index/8).toFixed(2)+'s, '+fs.statSync(target).size+' bytes');
   return {file:name+'.gif',frames:index,durationSeconds:index/8,bytes:fs.statSync(target).size};
  }
  const results=[];
  results.push(await record('dashboards',async()=>{await sleep(1600);await page.getByRole('button',{name:'Mi habitación',exact:true}).click();await page.waitForFunction(()=>plugin.settings.activeDashboardProfileId==='room');await sleep(2400);await page.getByRole('button',{name:'Enfoque',exact:true}).click();await page.waitForFunction(()=>plugin.settings.activeDashboardProfileId==='focus');await sleep(2200);await page.getByRole('button',{name:'Mi estudio',exact:true}).click();await page.waitForFunction(()=>plugin.settings.activeDashboardProfileId==='studio');await sleep(1600);}));
  results.push(await record('windows',async()=>{await sleep(1400);await page.getByRole('button',{name:'Proyectos',exact:true}).click();await page.waitForSelector('.cozy-nest-overlay');await sleep(1800);await page.locator('.cozy-nest-overlay-list button').filter({hasText:'Pequeños comienzos'}).click();await page.waitForFunction(()=>plugin.dashboardOverlay?.entry?.path==='Proyectos/Pequeños comienzos.md');await sleep(2300);await page.getByRole('button',{name:'← Volver',exact:true}).click();await sleep(1600);await page.keyboard.press('Escape');await page.evaluate(()=>plugin.dashboardOverlay?.close());await sleep(1200);}));
  results.push(await record('recovery',async()=>{await sleep(1200);await page.getByRole('button',{name:'Opciones del dashboard',exact:true}).click();await page.getByRole('menuitem',{name:'Configuración y copias',exact:true}).click();const modal=page.locator('.cozy-configuration-modal');await modal.getByRole('button',{name:'Guardar punto de recuperación',exact:true}).click();await sleep(1400);await page.getByRole('button',{name:'Cerrar diálogo',exact:true}).click();await page.getByRole('button',{name:'Personalizar',exact:true}).click();await page.getByRole('tab',{name:'Distribución',exact:true}).click();await page.getByLabel('Texto secundario (opcional)',{exact:true}).fill('Una distribución diferente para explorar');await page.getByRole('button',{name:'Guardar nombre y texto',exact:true}).click();await sleep(700);await page.getByRole('button',{name:'Cerrar personalización',exact:true}).click();await sleep(700);await page.getByRole('button',{name:'Opciones del dashboard',exact:true}).click();await page.getByRole('menuitem',{name:'Configuración y copias',exact:true}).click();await modal.getByRole('button',{name:'Restaurar punto guardado',exact:true}).click();await page.waitForFunction(()=>plugin.settings.subtitle==='Ideas, proyectos y pequeños pasos. Todo en tu espacio.');await sleep(1400);await modal.getByRole('button',{name:'Deshacer',exact:true}).click();await page.waitForFunction(()=>plugin.settings.subtitle==='Una distribución diferente para explorar');await sleep(1200);await modal.getByRole('button',{name:'Rehacer',exact:true}).click();await page.waitForFunction(()=>plugin.settings.subtitle==='Ideas, proyectos y pequeños pasos. Todo en tu espacio.');await sleep(1600);}));
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  fs.writeFileSync(path.join(work,'media-report.json'),JSON.stringify({environment:'Edge browser; production Cozinity renderers; fictional vault and simulated native content',viewport:{width:1200,height:920},sourceSha256:Object.fromEntries(['main.js','styles.css'].map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])),results},null,2));
  console.log('All demonstrations captured; no browser page errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
