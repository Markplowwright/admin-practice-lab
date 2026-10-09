"use strict";
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const stateSrc = fs.readFileSync(path.join(root, "js/state.js"), "utf8");
const rulesSrc = fs.readFileSync(path.join(root, "js/rules.js"), "utf8");

function memoryStorage(seed) {
  const data = Object.assign({}, seed || {});
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function (k, v) { data[k] = String(v); },
    removeItem: function (k) { delete data[k]; }
  };
}

function boot(storage) {
  const context = {
    console: console,
    localStorage: storage || memoryStorage(),
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(stateSrc, context, { filename: "js/state.js" });
  vm.runInContext(rulesSrc, context, { filename: "js/rules.js" });
  return context.Lab;
}

test("a fresh lab does not count the Lagos sign-in until that entry is opened", function () {
  const lab = boot();
  assert.equal(lab.lagosStepDone(), false);
  const quiet = lab.S.logs.filter(function (l) { return !l.odd; })[0];
  lab.spotOddSignin(quiet);
  assert.equal(lab.lagosStepDone(), false);
  const odd = lab.S.logs.filter(function (l) { return l.odd; })[0];
  lab.spotOddSignin(odd);
  assert.equal(lab.lagosStepDone(), true);
});

test("creating users across a reload does not reuse an id", function () {
  const storage = memoryStorage();
  const first = boot(storage);
  const a = first.createUser("Ada Lovelace", "ada.lovelace", "US", false);
  assert.equal(a.error, undefined);
  first.save();
  const second = boot(storage);
  const b = second.createUser("Bea Smith", "bea.smith", "US", false);
  assert.equal(b.error, undefined);
  assert.notEqual(a.user.id, b.user.id);
});

test("a group license is rejected when it needs more seats than remain", function () {
  const lab = boot();
  const g = { id: "g9", name: "Everyone", members: [], created: true };
  lab.S.groups.push(g);
  const seats = lab.available();
  let n;
  for (n = 1; n <= seats + 1; n++) {
    const made = lab.createUser("Extra " + n, "extra" + n, "US", false);
    assert.equal(made.error, undefined);
    g.members.push(made.user.id);
  }
  const err = lab.groupLicenseError(g);
  assert.match(err, /No licenses available/);
});

test("device join set to none blocks quick unbox and a laptop join with 801c0003", function () {
  const lab = boot();
  lab.S.deviceJoin = "none";
  lab.S.apProfiles.push({ id: "ap1", name: "All", assign: { all: "devices", groups: [] } });
  const unbox = lab.autopilotUnbox(lab.D("d2"), lab.U("u0"));
  assert.match(unbox.error, /801c0003/);
  const joined = lab.applyJoin(lab.D("d3"), lab.U("u0"), "join");
  assert.equal(joined.ok, false);
  assert.match(joined.why, /801c0003/);
});

test("a Windows 10 device is not the BitLocker success case when the policy also requires Windows 11", function () {
  const lab = boot();
  lab.S.policies.push({
    id: "pwin", name: "Windows baseline", bitlocker: true, minOS: "10.0.22000", password: false,
    assign: { all: "users", groups: [] }
  });
  assert.equal(lab.bitlockerStepDone(), false);
  lab.S.policies[0].minOS = "";
  assert.equal(lab.bitlockerStepDone(), true);
});
