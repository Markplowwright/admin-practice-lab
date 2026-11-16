"use strict";
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.join(__dirname, "..");
const scripts = ["state.js", "ui.js", "rules.js", "ad.js", "entra.js", "m365.js", "exchange.js", "intune.js", "vm.js", "guide.js", "shell.js", "render.js"];

function boot() {
  const html = "<!doctype html><html><head></head><body data-portal=\"m365\"><div id=\"app\"></div><div id=\"intro\"></div>" +
    "<div id=\"pop\" hidden></div><div id=\"modal\" hidden></div><div id=\"toast\" hidden></div>" +
    scripts.map(function (n) { return "<script>" + fs.readFileSync(path.join(root, "js", n), "utf8").replace(/<\/script/gi, "<\\/script") + "</script>"; }).join("") + "</body></html>";
  const vc = new VirtualConsole();
  const dom = new JSDOM(html, {
    runScripts: "dangerously", url: "https://admin-practice.test/", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse: function (w) { w.scrollTo = function () {}; w.matchMedia = function () { return { matches: false, addEventListener: function () {} }; }; }
  });
  return dom.window;
}

function allSteps(w) {
  const out = [];
  w.missions().forEach(function (m) { m.s.forEach(function (x) { out.push({ mission: m.t, step: x[0], done: !!x[1] }); }); });
  return out;
}

test("a fresh lab has no guided step already checked off", function () {
  const w = boot();
  const pre = allSteps(w).filter(function (s) { return s.done; });
  assert.deepEqual(pre.map(function (s) { return s.mission + " > " + s.step; }), []);
});

test("Level 5 sync steps need the user's action first, then the sync", function () {
  const w = boot();
  const find = function (txt) { return allSteps(w).filter(function (s) { return s.step.indexOf(txt) === 0; })[0]; };
  // syncing before touching Finance membership must not tick the verify step
  w.runDeltaSync();
  assert.equal(find("Run delta sync and verify Finance in Entra").done, false);
  w.ADG("adg1").members.push("adu2");
  w.runDeltaSync();
  assert.equal(find("Run delta sync and verify Finance in Entra").done, true);
  // password sync step needs the AD reset first
  assert.equal(find("Run password synchronization").done, false);
  w.resetAdPassword(w.ADU("adu2"), "Reset#Practice31", true);
  w.runPasswordSync();
  assert.equal(find("Run password synchronization").done, true);
});
