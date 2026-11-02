const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
class Base{}
function load(){const context={module:{exports:{}},require:()=>({Plugin:Base,ItemView:Base,Modal:Base,PluginSettingTab:Base,FuzzySuggestModal:Base,Notice:Base,normalizePath:p=>p}),console,URL,Date,performance:{now:()=>123},window:{setTimeout,clearTimeout},setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../main.js'),'utf8')+'\nmodule.exports.stability={CozyDiagnostics:typeof CozyDiagnostics!=="undefined"?CozyDiagnostics:null,NestBoardView,normalizeSettings};',context);return {Plugin:context.module.exports,...context.module.exports.stability}}
test('diagnostics remain opt-in, bound history, and report timings without serializing arbitrary data',()=>{
 const {CozyDiagnostics}=load();assert.equal(typeof CozyDiagnostics,"function");const diag=new CozyDiagnostics();diag.record({action:'native-load',durationMs:200});assert.equal(diag.report().events.length,0);
 diag.start();for(let i=0;i<230;i++)diag.record({action:'native-load',panelType:'vault_note',status:i%2?'ready':'error',durationMs:12,content:'PRIVATE NOTE',filePath:'PRIVATE PATH'});
 const report=diag.report();assert.equal(report.events.length,200);assert.equal(report.totals['native-load'].count,230);assert.equal(report.totals['native-load'].errors,115);assert.equal(report.totals['native-load'].totalMs,2760);assert.ok(!JSON.stringify(report).includes('PRIVATE'));
 diag.stop();diag.record({action:'render'});assert.equal(diag.report().events.length,200);diag.start();assert.equal(diag.report().events.length,0);
});
test('presentation edits request an incremental update and preserve the native panel identity',async()=>{
 const {Plugin,normalizeSettings}=load(),plugin=Object.create(Plugin.prototype);plugin.settings=normalizeSettings({panelLayout:[{id:'base',type:'vault_note',filePath:'Projects.base',baseViewName:'Cards'}]});let request;plugin.savePluginSettings=async()=>{};plugin.refreshPanelViews=(id,options)=>request={id,options};
 await plugin.updatePanel('base',{title:'Projects',titleColor:'#123456',panelColor:'#456789',panelOpacity:70});assert.equal(request.options.contentChanged,false);assert.equal(plugin.settings.panelLayout[0].baseViewName,'Cards');
 await plugin.updatePanel('base',{filePath:'Other.base'});assert.equal(request.options.contentChanged,true);
});
test('vault metadata updates do not replace a live native panel inside the floating window',()=>{
 const {Plugin,normalizeSettings}=load(),plugin=Object.create(Plugin.prototype);let options;plugin.app={workspace:{getLeavesOfType:()=>[]}};plugin.dashboardOverlay={refreshPanelEntry:o=>options=o};plugin.refreshVaultDataViews({path:'Other.md'});assert.equal(options?.dataOnly,true);
});

test('changes in an embedded note still update dependent lists without rebuilding that editor',async()=>{
 const {Plugin}=load(),plugin=Object.create(Plugin.prototype);let updated=null;plugin.invalidateVaultIndex=()=>{};plugin.invalidateTaskBoard=()=>{};plugin.isFileEmbeddedInDashboard=()=>true;plugin.isDashboardEditingActive=()=>false;plugin.refreshVaultDataViews=(file,options)=>updated={file,options};plugin.handleVaultChange({path:'Embedded.md',extension:'md'});await new Promise(resolve=>setTimeout(resolve,460));assert.equal(updated?.file.path,'Embedded.md');assert.equal(updated.options.imageOnly,false);
});