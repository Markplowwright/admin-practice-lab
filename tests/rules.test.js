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

test("an AD-only user appears in Entra only after entering sync scope and a delta sync", function () {
  const lab = boot();
  const alex = lab.ADU("adu5");
  assert.equal(alex.cloudId, null);
  lab.runDeltaSync();
  assert.equal(alex.cloudId, null);
  alex.ou = "ou-staff";
  lab.runDeltaSync();
  assert.ok(alex.cloudId);
  assert.equal(lab.U(alex.cloudId).source, "ad");
  assert.equal(lab.U(alex.cloudId).deleted, false);
});

test("moving a synced AD user out of scope soft deletes and blocks the cloud copy", function () {
  const lab = boot();
  const dana = lab.ADU("adu1");
  dana.ou = "ou-disabled";
  lab.runDeltaSync();
  assert.equal(lab.U("u1").deleted, true);
  assert.equal(lab.U("u1").blocked, true);
  assert.equal(lab.U("u1").direct, false);
  dana.ou = "ou-staff";
  lab.runDeltaSync();
  assert.equal(lab.U("u1").deleted, false);
  assert.equal(lab.U("u1").direct, false);
});

test("AD disable and security group membership flow to Entra after sync", function () {
  const lab = boot();
  const sam = lab.ADU("adu2");
  sam.enabled = false;
  lab.ADG("adg1").members.push(sam.id);
  lab.runDeltaSync();
  assert.equal(lab.U("u2").blocked, true);
  assert.ok(lab.G("g1").members.includes("u2"));
});

test("password hash sync copies the authoritative AD password", function () {
  const lab = boot();
  const sam = lab.ADU("adu2");
  lab.resetAdPassword(sam, "PracticeOnly#42", true);
  assert.notEqual(lab.U("u2").pw, "PracticeOnly#42");
  lab.runPasswordSync();
  assert.equal(lab.U("u2").pw, "PracticeOnly#42");
  assert.equal(lab.U("u2").mustChange, true);
});

test("domain join validates fake credentials and delta sync creates hybrid join", function () {
  const lab = boot();
  const device = lab.D("d3");
  const bad = lab.domainJoin(device, "wrong.local", "PRACTICE\\LabAdmin", "PracticeLab#2026");
  assert.equal(bad.ok, false);
  const joined = lab.domainJoin(device, "practice.local", "PRACTICE\\LabAdmin", "PracticeLab#2026");
  assert.equal(joined.ok, true);
  assert.equal(device.domainJoined, true);
  assert.equal(device.azureAdJoined, false);
  lab.runDeltaSync();
  assert.equal(device.azureAdJoined, true);
  assert.equal(device.join, "hybrid");
});

test("resetting a computer account repairs the simulated secure channel", function () {
  const lab = boot();
  const device = lab.D("d3");
  lab.domainJoin(device, "practice.local", "PRACTICE\\LabAdmin", "PracticeLab#2026");
  const computer = lab.S.ad.computers.find(function (c) { return c.deviceId === "d3"; });
  computer.trustOk = false;
  device.secureChannel = false;
  lab.resetComputerAccount(computer);
  assert.equal(computer.trustOk, true);
  assert.equal(device.secureChannel, true);
});

test("account expiration blocks the synced user after the simulated clock advances", function () {
  const lab = boot();
  const dana = lab.ADU("adu1");
  dana.expires = lab.S.ad.nowMin + 30;
  lab.advanceAdTime(30);
  assert.equal(lab.U("u1").blocked, true);
});
