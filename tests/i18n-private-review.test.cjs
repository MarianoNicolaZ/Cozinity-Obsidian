const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const repoMain=path.resolve(__dirname,'../main.js');
const filename=process.env.COZINITY_TEST_MAIN||repoMain;
const source=fs.readFileSync(filename,'utf8');
function load(language='en'){
 class Base{}
 class Notice{constructor(message){this.message=message;}}
 const context={module:{exports:{}},require:()=>({Plugin:Base,ItemView:Base,Modal:Base,PluginSettingTab:Base,FuzzySuggestModal:Base,Notice,normalizePath:p=>p}),console,URL,Date,setTimeout,clearTimeout,HTMLElement:Base,window:{setTimeout,clearTimeout}};
 vm.runInNewContext(source+'\nmodule.exports.api={normalizeSettings,Notice,setActive:p=>activeNestBoardPlugin=p};',context);
 const P=context.module.exports,p=Object.create(P.prototype);p.settings=P.api.normalizeSettings({language});p.manifest={id:'cozynity'};p.app={commands:{commands:{}},vault:{getAllLoadedFiles:()=>[]},workspace:{getLeavesOfType:()=>[]}};p.savePluginSettings=async()=>{};
 return{p,api:P.api};
}
test('English translates recovery concurrency errors and leaves inserted user labels intact',()=>{
 const{p}=load();
 for(const[es,en]of[
  ['El dashboard cambió.','The dashboard changed.'],
  ['Hay otra acción en curso. Volvé a intentar.','Another action is in progress. Try again.'],
  ['Primero guardá un punto de recuperación.','Save a recovery point first.'],
  ['Ejercicio, meditar, lectura...','Exercise, meditation, reading...'],
  ['Diagnóstico de Cozinity','Cozinity diagnostics'],
  ['El archivo no es una copia de configuración válida de Cozinity.','This is not a valid Cozinity configuration backup.'],
 ])assert.equal(p.t(es),en);
 assert.equal(p.t('Nota creada: Trabajo'),'Note created: Trabajo');
});
test('switching language updates all five commands and can switch back',async()=>{
 const{p}=load('es');
 for(const id of ['open-cozy-diagnostics','open-cozy-dashboard','create-cozy-note','open-todays-journal','add-cozy-room'])p.app.commands.commands['cozynity:'+id]={name:'old'};
 await p.setLanguage('en');
 assert.equal(p.app.commands.commands['cozynity:open-cozy-diagnostics'].name,'Cozinity diagnostics');
 assert.equal(p.app.commands.commands['cozynity:add-cozy-room'].name,'My room');
 await p.setLanguage('es');
 assert.equal(p.app.commands.commands['cozynity:open-cozy-diagnostics'].name,'Diagnóstico de Cozinity');
 assert.equal(p.app.commands.commands['cozynity:add-cozy-room'].name,'Mi habitación');
});
test('plugin Notices preserve non-text Obsidian messages',()=>{const{p,api}=load();api.setActive(p);const fragment={nodeType:11};assert.equal(new api.Notice(fragment).message,fragment);});
test('language write failure restores the current language',async()=>{const{p}=load('es');p.savePluginSettings=async()=>{throw Object.assign(Error('disk full'),{code:'ENOSPC'});};await assert.rejects(()=>p.setLanguage('en'),/disk full/);assert.equal(p.getLanguage(),'es');});
test('disk failures use actionable messages in both languages',()=>{const{p}=load();assert.equal(typeof p.getUIErrorMessage,'function');assert.equal(p.getUIErrorMessage({code:'ENOSPC',message:'disk full'}),'The disk is full. Free some space and try again.');p.settings.language='es';assert.equal(p.getUIErrorMessage({code:'EACCES',message:'permission denied'}),'No hay permiso para guardar. Revisá el acceso al vault e intentá de nuevo.');});
test('remaining clock, font and loading UI literals have English translations',()=>{const{p}=load();for(const es of ['Estilo del reloj','Progreso del temporizador','Fuente general del dashboard','Se aplica a todo el tablero; una fuente elegida en una ventana tiene prioridad.','Cargando canvas...','No se pudo abrir esta Base. Verificá que Bases esté activo en los plugins principales de Obsidian.','Cargando tasks...','Se aplica a todo el tablero. Una fuente configurada en una ventana tiene prioridad.','No se pudo crear esta ventana. Probá arrastrarla nuevamente.','TaskNotes no esta disponible. El reloj seguira funcionando de forma local.','No pude iniciar el registro en TaskNotes. El reloj seguira funcionando de forma local.'])assert.notEqual(p.t(es),es);});
test('timer UI is translated before awaiting TaskNotes and marks task labels as user content',()=>{
 const modal=source.slice(source.indexOf('class TimerPanelModal'),source.indexOf('class CreateWorkspaceModal'));
 assert.ok(modal.indexOf('this.plugin.translateElement(contentEl);')<modal.indexOf('await this.plugin.getTaskNotesTasks()'));
 assert.match(modal,/data-cozy-user-content/);
 assert.match(modal,/this\.plugin\.t\(" - completada"\)/);
});
test('translation excludes custom names and native content with explicit opt-out',()=>{
 const{p}=load();p.settings.dashboardTitle='Trabajo';p.settings.subtitle='Borrador limpio.';
 p.app.vault.getAllLoadedFiles=()=>[{basename:'Colegio',name:'Colegio.md',path:'Personal/Colegio.md'}];
 assert.equal(typeof p.getTranslationProtectedTexts,'function');
 const protectedTexts=p.getTranslationProtectedTexts();
 for(const v of ['Trabajo','Borrador limpio.','Colegio','Colegio.md','Personal/Colegio.md'])assert.ok(protectedTexts.has(v));
 assert.match(source,/\[data-cozy-user-content\]/);
 assert.match(source,/\.cozy-shortcut-caption/);
 assert.match(source,/\.workspace-leaf-content/);
});

test('protecting user filenames reuses its vault index across translation passes and invalidates on changes',()=>{const{p}=load();let scans=0;let names=[{path:'Trabajo.md',name:'Trabajo.md',basename:'Trabajo'}];p.app.vault.getAllLoadedFiles=()=>{scans++;return names};assert.ok(p.getTranslationProtectedTexts().has('Trabajo'));p.settings.dashboardTitle='Nuevo nombre';assert.ok(p.getTranslationProtectedTexts().has('Nuevo nombre'));assert.equal(scans,1);names=[{path:'Nuevo.md',name:'Nuevo.md',basename:'Nuevo'}];p.invalidateVaultIndex();assert.ok(p.getTranslationProtectedTexts().has('Nuevo'));assert.equal(scans,2);});
