
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {setup}=require('./helpers/cozy-window-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await setup(page);
 const result=await page.evaluate(async()=>{
  plugin.settings.language='en';plugin.settings.dashboardTitle='Trabajo';plugin.settings.subtitle='Borrador limpio.';
  const oldFiles=plugin.app.vault.getAllLoadedFiles;plugin.app.vault.getAllLoadedFiles=()=>[...oldFiles(),new testApi.TFile('Colegio.md'),new testApi.TFile('Guardar.md')];
  const wrapper=document.body.createDiv({cls:'workspace-leaf-content'}),root=wrapper.createDiv();
  root.innerHTML='<button id="ui" title="Guardar">Guardar</button><strong id="user">Trabajo</strong><span id="file">Colegio</span><span id="subtitle">Borrador limpio.</span><div class="markdown-rendered">Guardar</div><div class="cozy-nest-native-view-leaf"><div class="workspace-leaf-content">Guardar</div></div><span data-cozy-user-content>Guardar</span><span class="cozy-shortcut-caption">Trabajo</span>';
  plugin.translateElement(root);const initial={ui:root.querySelector('#ui').textContent,title:root.querySelector('#ui').title,user:root.querySelector('#user').textContent,file:root.querySelector('#file').textContent,subtitle:root.querySelector('#subtitle').textContent,markdown:root.querySelector('.markdown-rendered').textContent,native:root.querySelector('.cozy-nest-native-view-leaf').textContent,optout:root.querySelector('[data-cozy-user-content]').textContent};
  const dynamic=root.createEl('button',{text:'Cancelar',attr:{title:'Cancelar'}});await new Promise(r=>setTimeout(r,20));const observed={text:dynamic.textContent,title:dynamic.title};
  const panel={id:'timer-language',type:'timer',title:'Trabajo'};plugin.settings.panelLayout=[panel];plugin.settings.activeDashboardProfileId='audit';
  let tasksResolve;plugin.getTaskNotesTasks=()=>new Promise(r=>tasksResolve=r);
  const modal=new auditApi.TimerPanelModal(plugin.app,plugin,panel);document.body.append(modal.containerEl);const opening=modal.onOpen();
  const pending={heading:modal.contentEl.querySelector('h2').textContent,loading:modal.contentEl.querySelector('option[value="__loading__"]').textContent,placeholder:modal.contentEl.querySelector('input[type=text]').placeholder};
  tasksResolve([{title:'Trabajo',path:'Trabajo.md',completed:true}]);await opening;await new Promise(r=>setTimeout(r,20));
  const taskLabel=modal.contentEl.querySelector('option[value="Trabajo.md"]').textContent;
  plugin.updatePanel=async()=>{throw Object.assign(Error('disk full'),{code:'ENOSPC'});};
  const save=[...modal.contentEl.querySelectorAll('button')].find(b=>b.textContent==='Save');save.click();await new Promise(r=>setTimeout(r,20));
  const failedSave={message:modal.contentEl.querySelector('.cozy-nest-modal-actions [role=status]').textContent,disabled:save.disabled,connected:modal.contentEl.isConnected};
  modal.close();return{initial,observed,pending,taskLabel,failedSave};
 });
 assert.deepEqual(result.initial,{ui:'Save',title:'Save',user:'Trabajo',file:'Colegio',subtitle:'Borrador limpio.',markdown:'Guardar',native:'Guardar',optout:'Guardar'});
 assert.deepEqual(result.observed,{text:'Cancel',title:'Cancel'});
 assert.deepEqual(result.pending,{heading:'Configure timer',loading:'Loading tasks...',placeholder:'Exercise, meditation, reading...'});
 assert.equal(result.taskLabel,'Trabajo - completed');
 assert.deepEqual(result.failedSave,{message:'The disk is full. Free some space and try again.',disabled:false,connected:true});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,result,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
