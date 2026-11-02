const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class TFile { constructor(path) { this.path = path; this.name = path.split('/').pop(); this.basename = this.name.replace(/\.[^.]+$/, ''); this.extension = this.name.split('.').pop(); this.stat = { mtime: 1 }; } }
class TFolder { constructor(path) { this.path = path; this.children = []; } }
class Base {}
const notices = [];
const api = {
  TFile, TFolder, Modal: Base, Plugin: Base, ItemView: Base, PluginSettingTab: Base, FuzzySuggestModal: Base,
  Notice: class { constructor(message) { notices.push(message); } },
  normalizePath: value => value.replace(/\\/g, '/').replace(/\/{2,}/g, '/'),
  parseLinktext: value => { const split = value.indexOf('#'); return split < 0 ? { path: value, subpath: '' } : { path: value.slice(0, split), subpath: value.slice(split) }; },
  getAllTags: cache => [...(cache.tags || []).map(t => t.tag), ...(cache.frontmatter?.tags || []).map(t => `#${t.replace(/^#/, '')}`)],
};
const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const context = { module: { exports: {} }, require: () => api, console, setTimeout, clearTimeout, URL, Date, HTMLElement: Base };
vm.runInNewContext(source + '\nmodule.exports.testing = { normalizeCozyRoom, normalizeSettings, collectionFiles, DashboardOverlayModal, COZY_ROOM_FURNITURE };', context);
vm.runInNewContext('module.exports.houseTesting = { normalizeCozyHouse: typeof normalizeCozyHouse === "function" ? normalizeCozyHouse : null, changeCozyHouse: typeof changeCozyHouse === "function" ? changeCozyHouse : null, snapCozyPosition: typeof snapCozyPosition === "function" ? snapCozyPosition : null };', context);
const Plugin = context.module.exports;
const { normalizeCozyRoom, normalizeSettings, collectionFiles, DashboardOverlayModal, COZY_ROOM_FURNITURE } = Plugin.testing;
const plain = value => JSON.parse(JSON.stringify(value));
const houseApi = Plugin.houseTesting;

test('legacy migration preserves furniture, links and screen positions on the finer grid', () => {
  assert.equal(typeof houseApi.normalizeCozyHouse, 'function');
  const house = houseApi.normalizeCozyHouse({palette:'forest',objects:[{id:'a',type:'tv',label:'Cine',x:3,y:2,binding:{kind:'tag',path:'#cine'}}]});
  assert.equal(house.version,2);assert.equal(house.rooms.length,1);
  assert.deepEqual(plain(house.rooms[0].objects[0]),{id:'a',type:'tv',label:'Cine',x:6,y:4,binding:{kind:'tag',path:'#cine'},surface:'floor',order:0});
  assert.deepEqual(plain(houseApi.normalizeCozyHouse(house)),plain(house));
  assert.equal(houseApi.normalizeCozyHouse({objects:[]}).rooms[0].objects.length,0);
});

test('room duplication isolates objects, deletion preserves one room, templates are editable', () => {
  assert.equal(typeof houseApi.changeCozyHouse,'function');
  let h=houseApi.normalizeCozyHouse({objects:[]});
  h=houseApi.changeCozyHouse(h,'add',{template:'office',name:'Trabajo'});
  assert.equal(h.rooms.length,2);assert.equal(h.rooms[1].name,'Trabajo');assert.ok(h.rooms[1].objects.some(o=>o.type==='desk'));
  const original=h.rooms[1];h=houseApi.changeCozyHouse(h,'duplicate',{});
  assert.notEqual(h.rooms[2].id,original.id);assert.notEqual(h.rooms[2].objects[0].id,original.objects[0].id);
  h.rooms[2].objects[0].x=19;assert.notEqual(h.rooms[1].objects[0].x,19);
  h=houseApi.changeCozyHouse(h,'remove',{});h=houseApi.changeCozyHouse(h,'remove',{});
  assert.equal(h.rooms.length,1);assert.throws(()=>houseApi.changeCozyHouse(h,'remove',{}));
});

test('grid snapping rounds off-grid positions and clamps furniture within the room', () => {
  assert.equal(typeof houseApi.snapCozyPosition,'function');
  assert.deepEqual(plain(houseApi.snapCozyPosition(5.6,3.3)),{x:5.5,y:3.25});
  assert.deepEqual(plain(houseApi.snapCozyPosition(-8,80)),{x:0,y:12});
  assert.deepEqual(plain(houseApi.snapCozyPosition(5.27,0.26)),{x:5.25,y:0.25});
  assert.deepEqual(plain(houseApi.snapCozyPosition(NaN,Infinity)),{x:0,y:0});
});

test('quarter-cell placement survives settings normalization and reload without moving existing furniture', () => {
  const room={version:2,activeRoomId:'office',rooms:[{id:'office',name:'Office',objects:[
    {id:'desk',type:'desk',x:5,y:2},
    {id:'pc',type:'laptop',x:5.25,y:.25,binding:{kind:'folder',path:'Work'}},
    {id:'printer',type:'printer',x:9.75,y:.5},
  ]}]};
  const saved=normalizeSettings({panelLayout:[{id:'room',type:'cozy_room',room}]});
  const restored=normalizeSettings(JSON.parse(JSON.stringify(saved))).panelLayout[0].room;
  assert.equal(restored.version,2);
  assert.deepEqual(plain(restored.rooms[0].objects.map(o=>[o.id,o.x,o.y])),[['desk',5,2],['pc',5.25,.25],['printer',9.75,.5]]);
  assert.deepEqual(plain(restored.rooms[0].objects[1].binding),{kind:'folder',path:'Work'});
});

test('unknown furniture remains recoverable and invalid room selection falls back safely', () => {
  assert.equal(typeof houseApi.normalizeCozyHouse,'function');
  const h=houseApi.normalizeCozyHouse({version:2,activeRoomId:'missing',rooms:[{id:'r',name:'A',objects:[{id:'u',type:'future-type',x:2,y:3,label:'Keep',binding:{kind:'folder',path:'Ideas'}}]}]});
  assert.equal(h.activeRoomId,'r');assert.equal(h.rooms[0].objects[0].type,'future-type');assert.equal(h.rooms[0].objects[0].binding.path,'Ideas');
});

test('room survives normalization and JSON reload, preserving empty rooms and bindings', () => {
  const room = { palette: 'forest', objects: [{ id: 'tv', type: 'tv', x: 3, y: 2, label: 'Películas', binding: { kind: 'tag', path: 'películas' } }] };
  const settings = normalizeSettings({ panelLayout: [{ id: 'room', type: 'cozy_room', room }] });
  const restored = normalizeSettings(JSON.parse(JSON.stringify(settings)));
  const current=restored.panelLayout[0].room.rooms[0];
  assert.equal(current.palette,'forest');assert.equal(current.objects[0].binding.path,'#películas');
  assert.deepEqual([current.objects[0].x,current.objects[0].y],[6,4]);
  assert.equal(normalizeCozyRoom({ objects: [] }).objects.length, 0);
  assert.equal(normalizeCozyRoom().objects.length, 6);
});

test('invalid furniture, duplicate IDs and out-of-bounds coordinates are normalized', () => {
  const room = normalizeCozyRoom({ palette: 'wrong', objects: [
    { id: 'x', type: 'fridge', x: -4, y: Infinity },
    { id: 'x', type: 'tv', x: 400, y: 99 }, { type: 'unknown' },
  ] });
  assert.equal(room.palette, 'honey'); assert.equal(room.objects.length, 2);
  assert.notEqual(room.objects[0].id, room.objects[1].id);
  assert.deepEqual(plain(room.objects.map(({ x, y }) => [x, y])), [[0, 0], [10, 6]]);
});

test('all 122 catalogue furniture types survive room normalization', () => {
  assert.equal(COZY_ROOM_FURNITURE.length, 122);
  const types = [];
  for (let offset = 0; offset < COZY_ROOM_FURNITURE.length; offset += 40) {
    const batch = COZY_ROOM_FURNITURE.slice(offset, offset + 40);
    const room = normalizeCozyRoom({ objects: batch.map((item, index) => ({
      id: `catalog-${offset + index}`, type: item.type, x: index, y: index,
    })) });
    types.push(...room.objects.map((item) => item.type));
  }
  assert.deepEqual(types, plain(COZY_ROOM_FURNITURE.map((item) => item.type)));
});

test('saved dashboard profiles migrate embedded legacy house snapshots', () => {
  const settings = normalizeSettings({
    activeDashboardProfileId: 'casa',
    dashboardProfiles: [{
      id: 'casa', label: 'Casa', snapshot: {
        panelLayout: [{ id: 'room', type: 'cozy_room', room: {
          palette: 'forest', objects: [{ id: 'tv', type: 'tv', x: 3, y: 2 }],
        } }],
      },
    }],
  });
  const room = settings.dashboardProfiles[0].snapshot.panelLayout[0].room;
  assert.equal(settings.activeDashboardProfileId, 'casa');
  assert.equal(room.version, 2);
  assert.deepEqual([room.rooms[0].objects[0].x, room.rooms[0].objects[0].y], [6, 4]);
});

test('house normalization and room actions enforce 12 rooms and 150 objects', () => {
  const rooms = Array.from({ length: 20 }, (_, index) => ({ id: `room-${index}`, objects: [] }));
  const house = houseApi.normalizeCozyHouse({ version: 2, rooms });
  assert.equal(house.rooms.length, 12);
  assert.throws(() => houseApi.changeCozyHouse(house, 'add', { template: 'empty' }), /12 rooms/);

  const supported = normalizeCozyRoom({ objects: Array.from({ length: 155 }, (_, index) => ({ id: `obj-${index}`, type: 'tv' })) });
  assert.equal(supported.objects.length, 150);
});

test('folder collection includes descendants but excludes similarly named sibling folders', () => {
  const files = ['Recetas/a.md', 'Recetas/Postres/b.md', 'Recetas viejas/c.md'].map(p => new TFile(p));
  const app = { vault: { getFiles: () => files, getAbstractFileByPath: p => p === 'Recetas' ? new TFolder(p) : null } };
  assert.deepEqual(plain(collectionFiles(app, { kind: 'folder', path: 'Recetas' }).map(f => f.path)), ['Recetas/a.md', 'Recetas/Postres/b.md']);
  assert.equal(collectionFiles(app, { kind: 'folder', path: 'Missing' }).length, 0);
});

test('folder renames traverse room bindings, saved profiles and folder-index paths', async () => {
  const room = { version: 2, rooms: [{ id: 'r', objects: [
    { id: 'a', type: 'tv', binding: { kind: 'folder', path: 'Recetas' } },
    { id: 'b', type: 'plant', binding: { kind: 'folder', path: 'Recetas/Postres' } },
  ] }] };
  const plugin = Object.create(Plugin.prototype);
  plugin.settings = {
    panelLayout: [{ id: 'room', type: 'cozy_room', room: plain(room) }],
    dashboardProfiles: [{ id: 'saved', snapshot: { panelLayout: [{ id: 'saved-room', type: 'cozy_room', room: plain(room) }] } }],
    notebookOrder: ['Recetas', 'Recetas/Postres'],
    notebookShelves: [['Recetas', 'Recetas/Postres']],
    notebookStyles: { Recetas: { color: '#fff' }, 'Recetas/Postres': { color: '#000' } },
  };
  let saves = 0; plugin.savePluginSettings = async () => { saves += 1; };
  plugin.handleVaultChange = () => { throw new Error('rename should save after changing paths'); };
  plugin.invalidateVaultIndex = () => {};
  await plugin.handleVaultRename(new TFolder('Archivo/Recetas'), 'Recetas');
  const current = plugin.settings.panelLayout[0].room.rooms[0].objects;
  const saved = plugin.settings.dashboardProfiles[0].snapshot.panelLayout[0].room.rooms[0].objects;
  assert.deepEqual(current.map((item) => item.binding.path), ['Archivo/Recetas', 'Archivo/Recetas/Postres']);
  assert.deepEqual(saved.map((item) => item.binding.path), ['Archivo/Recetas', 'Archivo/Recetas/Postres']);
  assert.deepEqual(plugin.settings.notebookOrder, ['Archivo/Recetas', 'Archivo/Recetas/Postres']);
  assert.deepEqual(plugin.settings.notebookShelves, [['Archivo/Recetas', 'Archivo/Recetas/Postres']]);
  assert.deepEqual(Object.keys(plugin.settings.notebookStyles).sort(), ['Archivo/Recetas', 'Archivo/Recetas/Postres']);
  assert.equal(saves, 1);
});

test('tag collections merge inline and frontmatter tags, include nested tags, exclude prefix collisions', () => {
  const files = ['one', 'two', 'three', 'four'].map(p => new TFile(`${p}.md`));
  const caches = [{ tags: [{ tag: '#Películas' }] }, { frontmatter: { tags: ['películas/comedia'] } }, { tags: [{ tag: '#películas-pendientes' }] }, null];
  const app = { vault: { getMarkdownFiles: () => files }, metadataCache: { getFileCache: f => caches[files.indexOf(f)] } };
  assert.deepEqual(plain(collectionFiles(app, { kind: 'tag', path: '#películas' }).map(f => f.path)), ['one.md', 'two.md']);
});

test('openFile defaults to overlay and creates a tab only on explicit request', async () => {
  const plugin = Object.create(Plugin.prototype); const entries = []; let tabs = 0;
  plugin.openDashboardOverlay = e => entries.push(e);
  plugin.app = { workspace: { getLeaf: () => ({ openFile: async () => tabs++ }) } };
  const file = new TFile('A.md'); await plugin.openFile(file); assert.equal(tabs, 0);
  assert.equal(entries[0].path, 'A.md'); await plugin.openFile(file, { newTab: true }); assert.equal(tabs, 1);
});

test('relative wikilinks retain source and heading; web and missing links never replace dashboard', async () => {
  const plugin = Object.create(Plugin.prototype); const entries = [];
  plugin.t = s => s; plugin.openDashboardOverlay = e => entries.push(e);
  let sourcePath;
  plugin.app = { vault: { getAbstractFileByPath: () => null }, metadataCache: { getFirstLinkpathDest: (p, s) => { sourcePath = s; return p === 'Nota' ? new TFile('Folder/Nota.md') : null; } } };
  await plugin.openDashboardLink('[[Nota#Sección|alias]]', 'Folder/Source.md');
  assert.equal(sourcePath, 'Folder/Source.md'); assert.equal(entries[0].subpath, '#Sección');
  await plugin.openDashboardLink('https://example.com'); assert.equal(entries[1].kind, 'web');
  await plugin.openDashboardLink('Missing'); assert.equal(entries.length, 2); assert.ok(notices.length);
});

test('rapid overlay navigation renders only the latest request', async () => {
  const modal = Object.create(DashboardOverlayModal.prototype);
  Object.assign(modal, { queue: Promise.resolve(), history: [], generation: 0, closed: false });
  const rendered = []; modal.releaseLeaf = async () => {}; modal.renderEntry = async e => rendered.push(e.path); modal.showError = e => { throw e; };
  await Promise.all([modal.navigate({ path: 'A' }), modal.navigate({ path: 'B' }), modal.navigate({ path: 'C' })]);
  assert.deepEqual(rendered, ['C']); assert.equal(modal.history.length, 3);
});

test('closing an overlay while a request is queued cannot recreate its native view', async () => {
  const modal = Object.create(DashboardOverlayModal.prototype);
  Object.assign(modal, { queue: Promise.resolve(), history: [], generation: 0, closed: false, plugin: {}, app: { vault: { offref() {} } } });
  let rendered = false; modal.releaseLeaf = async () => {}; modal.renderEntry = async () => { rendered = true; };
  const pending = modal.navigate({ path: 'A' }); modal.onClose(); await pending; assert.equal(rendered, false);
});

test('native editor is saved before its leaf is detached', async () => {
  const order = []; const modal = Object.create(DashboardOverlayModal.prototype);
  modal.nativeLeaf = { view: { save: async () => order.push('save') }, detach: () => order.push('detach') };
  await modal.releaseLeaf(); assert.deepEqual(order, ['save', 'detach']); assert.equal(modal.nativeLeaf, null);
});
