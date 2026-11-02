const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class TFile { constructor(path) { this.path = path; } }
class TFolder { constructor(path) { this.path = path; } }
class Base {}
const api = {
  TFile, TFolder, Modal: Base, Plugin: Base, ItemView: Base, PluginSettingTab: Base,
  FuzzySuggestModal: Base, Notice: Base,
  normalizePath: value => value.replace(/\\/g, '/'),
  parseLinktext: value => ({ path: value, subpath: '' }),
  getAllTags: () => [],
};
const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const context = { module: { exports: {} }, require: () => api, console, setTimeout, clearTimeout, URL, Date, HTMLElement: Base };
vm.runInNewContext(source + '\nmodule.exports.roomPlacementTesting = { getCozyObjectPlacement: typeof getCozyObjectPlacement === "function" ? getCozyObjectPlacement : null };', context);
const { getCozyObjectPlacement } = context.module.exports.roomPlacementTesting;
const plain = value => JSON.parse(JSON.stringify(value));

test('floor furniture uses the straight rectangular atlas footprint without moving its drag box outside the scene', () => {
  assert.equal(typeof getCozyObjectPlacement, 'function');
  assert.deepEqual(plain(getCozyObjectPlacement('fridge', 0, 0)), {
    surface: 'floor', left: 4, top: 44, width: 92 / 6, height: 51 / 4, spriteAlign: 'flex-start', spriteOffsetY: -100,
  });
  assert.equal(getCozyObjectPlacement('fridge', 0, 12).left, 4);
  assert.deepEqual(plain(getCozyObjectPlacement('fridge', 20, 12)), {
    surface: 'floor', left: 4 + (20 / 24) * 92, top: 44 + (12 / 16) * 51,
    width: 92 / 6, height: 51 / 4, spriteAlign: 'flex-end', spriteOffsetY: 0,
  });
});

test('wall paintings use the wall footprint and rugs stay planted on the floor', () => {
  assert.deepEqual(plain(getCozyObjectPlacement('painting', 0, 0)), {
    surface: 'wall', left: 4, top: 4, width: 92 / 6, height: 40 / 4, spriteAlign: 'flex-start', spriteOffsetY: 0,
  });
  assert.equal(getCozyObjectPlacement('round_rug', 20, 12).spriteOffsetY, 0);
  assert.equal(getCozyObjectPlacement('painting', -20, 99).left, 4);
});
