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
  const dom = new JSDOM(html, {
    runScripts: "dangerously", url: "https://admin-practice.test/", pretendToBeVisual: true, virtualConsole: new VirtualConsole(),
    beforeParse: function (w) { w.scrollTo = function () {}; w.matchMedia = function () { return { matches: false, addEventListener: function () {} }; }; }
  });
  return dom.window;
}
function go(w, p, pg) { w.S.onboarded = true; w.S.portal = p; w.S.page = pg; w.render(); }

test("web portals show one browser window with a bookmarks bar", function () {
  const w = boot(); go(w, "entra", "overview");
  const d = w.document;
  assert.equal(d.querySelectorAll(".etab").length, 1);
  assert.match(d.querySelector(".eurl").textContent, /entra\.microsoft\.com/);
  assert.equal(d.querySelectorAll(".ebm button").length, 4);
});

test("DC01, the virtual laptop and the environment map have no browser window", function () {
  const w = boot();
  ["ad|aduc", "vm|d2", "env|map"].forEach(function (x) {
    const a = x.split("|"); go(w, a[0], a[1]);
    assert.equal(w.document.querySelectorAll(".edge").length, 0, a[0]);
  });
});

test("the taskbar is on every screen and switches systems", function () {
  const w = boot(); go(w, "env", "map");
  const d = w.document;
  assert.ok(d.querySelector(".wsbar"));
  assert.equal(d.querySelectorAll(".envc").length, 7);
  d.querySelector('.wsbar [data-p="ad"]').click();
  assert.equal(w.S.portal, "ad");
  assert.ok(d.querySelector(".wsbar"));
});

test("the Edge taskbar button returns to the last portal used", function () {
  const w = boot(); go(w, "intune", "home"); go(w, "ad", "aduc");
  w.document.querySelector('.wsbar [data-a="go"][data-p="intune"]').click();
  assert.equal(w.S.portal, "intune");
});

test("the Toolkit page links to real sites in new tabs", function () {
  const w = boot(); go(w, "tools", "links");
  const links = Array.from(w.document.querySelectorAll("a.tkc"));
  assert.equal(links.length, 8);
  links.forEach(function (a) {
    assert.match(a.getAttribute("href"), /^https:\/\//);
    assert.equal(a.getAttribute("target"), "_blank");
    assert.match(a.getAttribute("rel"), /noopener/);
  });
  const hrefs = links.map(function (a) { return a.getAttribute("href"); });
  ["https://mxtoolbox.com", "https://ipchicken.com", "https://haveibeenpwned.com"].forEach(function (h) { assert.ok(hrefs.indexOf(h) > -1, h); });
  assert.equal(w.document.querySelectorAll(".edge").length, 0);
});

test("an active scenario opens as a ticket dock and Resolve only works when the state is fixed", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "env"; w.S.page = "map"; w.render();
  assert.equal(w.document.querySelectorAll(".dock").length, 0);
  w.A.startScenario({ id: "s1" }); w.render();
  const d = w.document;
  assert.equal(d.querySelectorAll(".dock").length, 1);
  assert.match(d.querySelector(".dock").textContent, /Ticket #1040/);
  assert.equal(d.querySelectorAll(".dock .dl li").length, 3);
  assert.ok(d.body.classList.contains("dock-open"));
  d.querySelector('.dock [data-a="resolveTicket"]').click();
  assert.match(d.querySelector(".dock").textContent, /Not resolved yet/);
  assert.notEqual(w.S.scenarios.completed.s1, true);
  w.resetAdPassword(w.ADU("adu1"), "Scenario#Reset11", true); w.ADU("adu1").locked = false; w.S.scenarios.phoneUpdated = true;
  d.querySelector('.dock [data-a="resolveTicket"]').click();
  assert.equal(w.S.scenarios.completed.s1, true);
  assert.match(d.querySelector(".dock").textContent, /Resolved/);
  assert.match(d.querySelector(".dock").textContent, /Why this happens/);
});

test("Next ticket leaves the scenario and returns to the environment map", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "env"; w.S.page = "map";
  w.A.startScenario({ id: "s1" }); w.S.scenarios.completed.s1 = true; w.render();
  w.document.querySelector('.dock [data-a="nextTicket"]').click();
  assert.equal(w.S.scenarios.active, null);
  assert.equal(w.S.portal, "env");
  assert.equal(w.document.querySelectorAll(".dock").length, 0);
});

test("the site opens on the start screen, with Start Level 1 for a new lab", function () {
  const w = boot(); const d = w.document;
  assert.equal(w.S.portal, "start");
  assert.match(d.querySelector(".start h1").textContent, /Learn hybrid IT administration/);
  assert.match(d.querySelector(".sbtn.primary").textContent, /Start Level 1/);
  assert.equal(d.querySelectorAll(".wsbar").length, 0);
  assert.equal(d.querySelector("#intro").innerHTML, "");
});

test("Open the environment and the taskbar Start button move between start and map", function () {
  const w = boot(); const d = w.document;
  d.querySelector('.sact [data-p="env"]').click();
  assert.equal(w.S.portal, "env");
  d.querySelector('.wsbar [data-p="start"]').click();
  assert.equal(w.S.portal, "start");
});

test("with progress the start screen offers Continue, and an active ticket offers Resume", function () {
  const w = boot(); w.S.onboarded = true;
  w.A.startScenario({ id: "s3" }); w.S.portal = "start"; w.render();
  assert.match(w.document.querySelector(".sact").textContent, /Resume ticket #1042/);
  assert.equal(w.document.querySelectorAll(".dock").length, 0);
});
