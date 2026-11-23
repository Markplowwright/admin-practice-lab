"use strict";
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const stateSrc = fs.readFileSync(path.join(__dirname, "..", "js/state.js"), "utf8");

function memoryStorage(seed) {
  const data = Object.assign({}, seed || {});
  return {
    data: data,
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function (k, v) { data[k] = String(v); },
    removeItem: function (k) { delete data[k]; }
  };
}

function boot(storage) {
  const context = { console: console, localStorage: storage, setTimeout: setTimeout, clearTimeout: clearTimeout };
  context.window = context; context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(stateSrc, context, { filename: "js/state.js" });
  return context.Lab;
}

test("a saved lab from before Level 5 existed loads with every new field back-filled", function () {
  const first = boot(memoryStorage());
  const old = JSON.parse(JSON.stringify(first.S));
  ["ad", "scenarios", "mdm", "lvlDone", "intro", "finishSeen", "audit"].forEach(function (k) { delete old[k]; });
  delete old.flags.vmSync; delete old.flags.financeSynced; old.version = 3;
  const lab = boot(memoryStorage({ [first.KEY]: JSON.stringify(old) }));
  assert.equal(lab.S.version, lab.STATE_VERSION);
  assert.ok(lab.S.ad && lab.S.ad.users.length > 0, "AD data is added");
  assert.equal(lab.S.flags.vmSync, false);
  assert.equal(lab.S.flags.financeSynced, false);
  assert.deepEqual(lab.S.scenarios.completed, {});
});

test("saved progress survives a migration unchanged", function () {
  const first = boot(memoryStorage());
  const saved = JSON.parse(JSON.stringify(first.S));
  saved.version = 4; saved.flags.createdUsers = 3; saved.onboarded = true; saved.users[1].blocked = true;
  const lab = boot(memoryStorage({ [first.KEY]: JSON.stringify(saved) }));
  assert.equal(lab.S.flags.createdUsers, 3);
  assert.equal(lab.S.onboarded, true);
  assert.equal(lab.S.users[1].blocked, true);
});

test("a save written by a newer build is not downgraded or stamped over", function () {
  const first = boot(memoryStorage());
  const future = JSON.parse(JSON.stringify(first.S));
  future.version = first.STATE_VERSION + 1; future.someFutureField = "keep";
  const lab = boot(memoryStorage({ [first.KEY]: JSON.stringify(future) }));
  assert.equal(lab.S.someFutureField, "keep");
  lab.save();
  assert.equal(JSON.parse(JSON.stringify(lab.S)).version, first.STATE_VERSION + 1);
});

test("corrupt saved data falls back to a fresh lab and keeps a backup copy", function () {
  const store = memoryStorage({ adminPracticeLabV4: "{not json" });
  const lab = boot(store);
  assert.ok(lab.S.users.length > 0, "fresh seed is used");
  assert.equal(store.data["adminPracticeLabV4.backup"], "{not json");
});

test("migrating twice changes nothing", function () {
  const lab = boot(memoryStorage());
  const once = JSON.stringify(lab.migrate(JSON.parse(JSON.stringify(lab.S))));
  const twice = JSON.stringify(lab.migrate(JSON.parse(once)));
  assert.equal(once, twice);
});

test("saves from before the DC01 session get the window list", function () {
  const lab = boot(memoryStorage());
  const saved = JSON.parse(JSON.stringify(lab.seed()));
  delete saved.rdpOpen; saved.version = 5;
  const m = lab.migrate(saved);
  assert.deepEqual(m.rdpOpen, ["aduc"]);
  assert.equal(m.version, lab.STATE_VERSION);
  assert.deepEqual(lab.migrate(JSON.parse(JSON.stringify(m))).rdpOpen, ["aduc"]);
});

test("saves from before ticket notes get an empty notes map", function () {
  const lab = boot(memoryStorage());
  const saved = JSON.parse(JSON.stringify(lab.seed()));
  delete saved.scenarios.notes; saved.version = 6;
  const m = lab.migrate(saved);
  assert.deepEqual(m.scenarios.notes, {});
  assert.equal(m.version, lab.STATE_VERSION);
});

test("saves from before laptop network state keep their laptops and get the new field", function () {
  const lab = boot(memoryStorage());
  const saved = JSON.parse(JSON.stringify(lab.seed()));
  saved.version = 11;
  saved.devices[2].vm = { stage: "desktop", ssid: "Practice-Corp" };
  const m = lab.migrate(saved);
  assert.equal(m.version, lab.STATE_VERSION);
  assert.equal(m.devices[2].vm.ssid, "Practice-Corp", "existing laptop data is untouched");
  assert.ok("net" in m.devices[2].vm);
  assert.equal(m.devices[0].vm, undefined, "laptops that were never opened stay as they were");
});
