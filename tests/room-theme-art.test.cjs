const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Base {}
const context = {
  module: { exports: {} },
  require: () => ({
    Plugin: Base, ItemView: Base, Modal: Base, PluginSettingTab: Base,
    FuzzySuggestModal: Base, TFile: Base, TFolder: Base, Notice: Base,
    normalizePath: value => value, getAllTags: () => [], parseLinktext: value => ({ path: value, subpath: '' }),
  }),
  console, setTimeout, clearTimeout, URL, Date, HTMLElement: Base,
};

const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
vm.runInNewContext(source + '\nmodule.exports.roomArtApi = { getCozyRoomArtStyle, normalizeCozyHouse, COZY_ROOM_GEOMETRY };', context);
const api = context.module.exports.roomArtApi;
const plain = value => JSON.parse(JSON.stringify(value));

test('all theme packs use Stardew room art unless an explicit custom room backdrop is selected', () => {
  const themes = [
    'minimal-essence', 'minimal-os', 'notion-minimal', 'obsidian-native',
    'soft-control-center', 'studio-minimal', 'tech-blueprint', 'neo-skeuomorphic-dark',
    'lo-fi-cafe', 'claymorphism-3d', 'pastel-kawaii', 'tactile-toybox',
    'botanical-earth', 'stardew-harvest', 'stardew-valley-cozy',
  ];
  for (const themeId of themes) {
    assert.equal(api.getCozyRoomArtStyle(themeId), 'stardew', themeId);
  }
  assert.equal(api.getCozyRoomArtStyle('future-theme'), 'stardew');
  assert.equal(api.getCozyRoomArtStyle(''), 'stardew');
  assert.equal(api.getCozyRoomArtStyle('toString'), 'stardew');
  assert.equal(api.getCozyRoomArtStyle(null), 'stardew');
});

test('room wall and floor meet cleanly at the updated 44 percent seam', () => {
  assert.deepEqual(plain(api.COZY_ROOM_GEOMETRY), {
    floor: { left: 4, top: 44, width: 92, height: 51 },
    wall: { left: 4, top: 4, width: 92, height: 40 },
  });
  assert.equal(api.COZY_ROOM_GEOMETRY.wall.top + api.COZY_ROOM_GEOMETRY.wall.height, api.COZY_ROOM_GEOMETRY.floor.top);
});

test('choosing room art never changes saved surface choices, furniture, rotation, or bindings', () => {
  const input = {
    version: 2,
    rooms: [{
      id: 'office', name: 'Office', size: 'small', wall: 2, floor: 3,
      objects: [{
        id: 'desk', type: 'desk', x: 0.375, y: 0.625, rotation: 90,
        binding: { kind: 'folder', path: 'Work/Notes' },
      }],
    }],
  };
  const before = plain(api.normalizeCozyHouse(input));
  for (const themeId of ['minimal-os', 'tech-blueprint', 'neo-skeuomorphic-dark', 'lo-fi-cafe', 'claymorphism-3d', 'botanical-earth', 'stardew-harvest']) {
    api.getCozyRoomArtStyle(themeId);
    assert.deepEqual(plain(api.normalizeCozyHouse(input)), before, themeId);
  }
  assert.equal(before.rooms[0].size, 'small');
  assert.equal(before.rooms[0].wall, 2);
  assert.equal(before.rooms[0].floor, 3);
  assert.equal(before.rooms[0].objects[0].rotation, 90);
  assert.deepEqual(before.rooms[0].objects[0].binding, { kind: 'folder', path: 'Work/Notes' });
});
