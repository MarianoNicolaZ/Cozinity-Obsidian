const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('control clock ticks and releases disconnected panels',()=>{
 class Base{};let tick,cleared=false,updates=0;
 const ctx={module:{exports:{}},require:()=>({Notice:Base,Plugin:Base,ItemView:Base,Modal:Base,PluginSettingTab:Base,FuzzySuggestModal:Base}),setInterval:fn=>(tick=fn,1),clearInterval:()=>cleared=true};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../main.js'),'utf8')+'\nmodule.exports=registerControlClock;',ctx);
 const el={isConnected:true},plugin={register:()=>{}};
 ctx.module.exports(plugin,el,()=>updates++);assert.equal(updates,1);tick();assert.equal(updates,2);el.isConnected=false;tick();assert.equal(cleared,true);
});
