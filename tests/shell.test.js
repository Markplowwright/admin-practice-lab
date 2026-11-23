"use strict";
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.join(__dirname, "..");
const scripts = ["state.js", "ui.js", "rules.js", "ad.js", "entra.js", "m365.js", "exchange.js", "intune.js", "vm.js", "net.js", "netui.js", "devmgr.js", "remote.js", "procure.js", "kb.js", "guide.js", "shell.js", "mobile.js", "render.js", "analytics.js"];

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
  assert.equal(d.querySelectorAll(".etab").length, 0, "no tab strip: the address bar and bookmarks are enough");
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
  assert.equal(d.querySelectorAll(".mapc").length, 10);
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
  assert.doesNotMatch(w.document.querySelector(".dock").textContent, /Ticket #/);
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
  assert.match(w.document.querySelector(".dock").textContent, /Ticket queue/);
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

test("DC01 is a Remote Desktop session with the tools as separate windows", function () {
  const w = boot(); go(w, "ad", "aduc"); const d = w.document;
  assert.match(d.querySelector(".rname").textContent, /DC01\.practice\.local/);
  assert.equal(d.querySelectorAll(".rwin").length, 1);
  assert.match(d.querySelector(".rtitle").textContent, /Active Directory Users and Computers/);
  assert.equal(d.querySelectorAll(".ricon").length, 3);
  assert.equal(d.querySelectorAll(".edge, .phdr, .lnav").length, 0);
});

test("opening, minimizing and closing DC01 windows", function () {
  const w = boot(); go(w, "ad", "aduc"); const d = w.document;
  d.querySelector('.ricon[data-pg="gpmc"]').click();
  assert.equal(w.S.page, "gpmc");
  assert.equal(d.querySelectorAll(".rtask").length, 2);
  d.querySelector('.rtitle [data-a="rdpMin"]').click();
  assert.equal(w.S.page, "desktop");
  assert.equal(d.querySelectorAll(".rwin").length, 0);
  assert.equal(d.querySelectorAll(".rtask").length, 2);
  d.querySelector('.rtask[data-pg="aduc"]').click();
  assert.equal(w.S.page, "aduc");
  d.querySelector('.rtitle [data-a="rdpClose"]').click();
  assert.equal(d.querySelectorAll(".rtask").length, 1);
  assert.equal(w.S.page, "gpmc");
});

test("a mission link into a closed DC01 tool opens its window", function () {
  const w = boot(); go(w, "ad", "aduc"); w.S.rdpOpen = ["aduc"];
  w.A.go({ p: "ad", pg: "sync" }); w.render();
  assert.ok(w.S.rdpOpen.indexOf("sync") > -1);
  assert.match(w.document.querySelector(".rtitle").textContent, /Entra Connect Sync/);
});

test("Disconnect returns to the environment map", function () {
  const w = boot(); go(w, "ad", "aduc");
  w.document.querySelector('.rdpbar [data-a="rdpDisc"]').click();
  assert.equal(w.S.portal, "env");
});

test("Users and Computers has no portal page header and opens properties as a dialog", function () {
  const w = boot(); go(w, "ad", "aduc"); const d = w.document;
  assert.equal(d.querySelectorAll("#main .ptitle, #main .crumbs").length, 0);
  assert.equal(d.querySelectorAll(".rdlg").length, 0);
  const row = d.querySelector('#main .lnk[data-kind="user"]');
  row.click();
  assert.deepEqual(w.S.checked.length, 1);
  assert.equal(d.querySelectorAll(".rdlg").length, 0);
  d.querySelector("#main tbody tr").dispatchEvent(new w.MouseEvent("dblclick", { bubbles: true }));
  assert.equal(d.querySelectorAll(".rdlg").length, 1);
  assert.match(d.querySelector(".rdtitle").textContent, /Properties/);
  d.querySelector('.rdtitle [data-a="back"]').click();
  assert.equal(d.querySelectorAll(".rdlg").length, 0);
});

test("right-click on a user offers the real Active Directory actions", function () {
  const w = boot(); go(w, "ad", "aduc"); const d = w.document;
  d.querySelector('#main .lnk[data-kind="user"]').dispatchEvent(new w.MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }));
  const menu = d.getElementById("ctx");
  assert.ok(menu);
  const labels = Array.from(menu.querySelectorAll("button")).map(function (b) { return b.textContent; });
  ["Reset Password...", "Move...", "Add to a group...", "Properties"].forEach(function (l) { assert.ok(labels.indexOf(l) > -1, l); });
  menu.querySelector('[data-a="adOpenProps"]').click();
  assert.equal(d.getElementById("ctx"), null);
  assert.equal(d.querySelectorAll(".rdlg").length, 1);
});

test("the Properties toolbar button works for the selected object", function () {
  const w = boot(); go(w, "ad", "aduc"); const d = w.document;
  d.querySelector('#main .lnk[data-kind="user"]').click();
  d.querySelector('#main [data-a="adOpenProps"]').click();
  assert.equal(d.querySelectorAll(".rdlg").length, 1);
});

test("the map shows live status from the lab", function () {
  const w = boot(); go(w, "env", "map"); const d = w.document;
  const text = function () { return d.querySelector(".envmap").textContent; };
  assert.match(text(), /Licenses: \d+ of 10 used/);
  assert.match(text(), /1 device managed/);
  assert.match(text(), /Not set up/);
  assert.match(text(), /Directory sync\s*every 30 min/);
  w.D("d3").domainJoined = true; w.D("d3").join = "domain"; w.render();
  assert.match(text(), /Domain joined/);
  w.D("d2").state = "enrolled"; w.render();
  assert.equal((text().match(/Not set up/g) || []).length, 0);
});

test("DC01 shows changes not synced until a delta sync runs", function () {
  const w = boot(); go(w, "env", "map"); const d = w.document;
  w.createAdUser({ name: "Alex Doe", sam: "alex.doe", department: "Finance", ou: "ou-staff", pw: "Scenario#Hire13x", mustChange: true }); w.render();
  assert.ok(w.adPendingChanges() > 0);
  assert.match(d.querySelector(".mapc .mh").textContent, /not synced/);
  w.runDeltaSync(); w.render();
  assert.equal(w.adPendingChanges(), 0);
  assert.match(d.querySelector(".mapc .mh").textContent, /In sync/);
});

test("the open ticket outlines the systems it needs", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "env"; w.S.page = "map";
  w.A.startScenario({ id: "s3" }); w.render();
  const need = Array.from(w.document.querySelectorAll(".mapc.need")).map(function (n) { return n.querySelector("b").textContent; }).join("|");
  assert.match(need, /DC01/); assert.match(need, /Entra/); assert.match(need, /Microsoft 365/); assert.match(need, /ThinkPad/);
  assert.doesNotMatch(need, /Exchange/);
});

test("clicking map cards opens the matching tool", function () {
  const w = boot(); go(w, "env", "map"); const d = w.document;
  d.querySelector('.mbtn [data-pg="gpmc"]').click();
  assert.equal(w.S.portal, "ad"); assert.equal(w.S.page, "gpmc");
  go(w, "env", "map");
  d.querySelector('button.mapc[data-p="intune"]').click();
  assert.equal(w.S.portal, "intune");
});

test("with no ticket open the map has a ticket queue and Start opens that ticket", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "env"; w.S.page = "map"; w.render(); const d = w.document;
  assert.match(d.querySelector(".dock").textContent, /Ticket queue/);
  assert.equal(d.querySelectorAll(".dock .tk").length, 21);
  assert.ok(d.body.classList.contains("dock-open"));
  d.querySelector('.dock [data-a="startScenario"][data-id="s3"]').click();
  assert.equal(w.S.scenarios.active, "s3");
  assert.match(d.querySelector(".dock").textContent, /Ticket #1042/);
  assert.ok(d.querySelectorAll(".mapc.need").length > 0);
});

test("the queue is not shown away from the map", function () {
  const w = boot(); go(w, "entra", "overview");
  assert.equal(w.document.querySelectorAll(".dock").length, 0);
});

test("Resolve shows how many steps are left and the ticket note is kept", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "env"; w.S.page = "map"; w.A.startScenario({ id: "s3" }); w.render(); const d = w.document;
  assert.match(d.querySelector('.dock [data-a="resolveTicket"]').textContent, /Resolve ticket \(5 left\)/);
  const ta = d.querySelector(".dnote");
  ta.value = "Created Priya in Staff."; ta.dispatchEvent(new w.Event("input", { bubbles: true }));
  assert.equal(w.S.scenarios.notes.s3, "Created Priya in Staff.");
  w.A.resetScenario(); w.render();
  assert.equal(d.querySelector(".dnote").value, "Created Priya in Staff.");
  w.A.exitScenario(); w.A.startScenario({ id: "s3" }); w.render();
  assert.equal(w.document.querySelector(".dnote").value, "Created Priya in Staff.");
});

test("the not-resolved message disappears once nothing is left open", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "env"; w.S.page = "map"; w.A.startScenario({ id: "s1" }); w.render();
  w.document.querySelector('.dock [data-a="resolveTicket"]').click();
  assert.match(w.document.querySelector(".dock").textContent, /Not resolved yet/);
  w.ADU("adu1").locked = false; w.ADU("adu1").passwordChanged = true; w.S.scenarios.phoneUpdated = true; w.render();
  assert.doesNotMatch(w.document.querySelector(".dock").textContent, /Not resolved yet/);
});

test("the start screen Toolkit card is not styled as a map connector", function () {
  const css = fs.readFileSync(path.join(root, "css", "app.css"), "utf8");
  assert.doesNotMatch(css, /^\.link\{/m);
  assert.match(css, /\.maplink\{/);
});

test("Learn replaces the Missions and guide panel", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "env"; w.S.page = "map"; w.render();
  const d = w.document;
  assert.equal(d.querySelector(".guide"), null);
  assert.doesNotMatch(d.querySelector(".wsbar").textContent, /Missions and guide|Walk through/);
  assert.match(d.querySelector(".wsbar").textContent, /Learn 0 of 73/);
  w.A.go({ p: "learn", pg: "path" }); w.render();
  assert.match(d.querySelector("#main").textContent, /Training path/);
  assert.match(d.querySelector("#main").textContent, /0 of 73/);
  assert.match(d.querySelector("#main").textContent, /0 of 21/);
  assert.equal(d.querySelectorAll(".learn .lvl").length, 7);
  assert.equal(d.querySelector(".learn [data-a=\"startMission\"]").disabled, false);
});

test("starting a mission pins its steps in the dock and Leave mission clears it", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "learn"; w.S.page = "path"; w.render();
  const d = w.document, title = w.missions()[0].t;
  w.A.startMission({ t: title }); w.render();
  assert.equal(w.S.mission, title);
  assert.notEqual(w.S.portal, "learn");
  assert.match(d.querySelector(".dock").textContent, new RegExp("Mission"));
  assert.equal(d.querySelectorAll(".dock .dl li").length, w.missions()[0].s.length);
  w.A.closeMission(); w.render();
  assert.equal(d.querySelector(".dock"), null);
});

test("a mission cannot start while a ticket is open", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "env"; w.S.page = "map"; w.A.startScenario({ id: "s1" });
  w.A.go({ p: "learn", pg: "path" }); w.render();
  assert.equal(w.document.querySelector(".learn [data-a=\"startMission\"]").disabled, true);
  w.A.startMission({ t: w.missions()[0].t });
  assert.equal(w.S.mission, null);
});

test("Toolkit has Glossary and Jamf / Google tabs", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "tools"; w.S.page = "links"; w.render();
  const d = w.document;
  assert.match(d.querySelector("#main").textContent, /MXToolbox/);
  w.A.ttab({ t: "glossary" }); w.render();
  assert.ok(d.querySelector("#main .gl dt"));
  w.A.ttab({ t: "equiv" }); w.render();
  assert.match(d.querySelector("#main").textContent, /Jamf/);
});

test("spotlight marks the next control for a pinned mission and can be turned off", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "learn"; w.S.page = "path"; w.render();
  const d = w.document, title = "Get Intune ready for new Windows laptops";
  w.A.startMission({ t: title }); w.render();
  assert.equal(w.S.portal, "entra");
  const spot = d.querySelector(".spot");
  assert.ok(spot, "a control is highlighted");
  assert.match(spot.textContent, /Save/);
  assert.match(d.querySelector(".coach").textContent, /Step 1 of 2/);
  w.A.toggleSpot(); w.render();
  assert.equal(d.querySelector(".spot"), null);
  assert.equal(d.querySelector(".coach"), null);
  assert.match(d.querySelector(".dock").textContent, /Spotlight: Off/);
});

test("spotlight stays off for tickets and when no mission is pinned", function () {
  const w = boot(); w.S.onboarded = true; w.S.portal = "entra"; w.S.page = "signins"; w.render();
  assert.equal(w.document.querySelector(".spot"), null);
  w.A.startScenario({ id: "s1" }); w.S.mission = w.missions()[0].t; w.render();
  assert.equal(w.document.querySelector(".coach"), null);
});

test("remote console lists machines, searches, and shows detail tabs", function () {
  const w = boot(); go(w, "remote", "console"); const d = w.document;
  assert.equal(d.querySelectorAll(".rtbl tbody tr").length, 5);
  assert.ok(d.querySelectorAll(".rtabs button").length >= 8);
  const q = d.getElementById("rq"); q.value = "dc01"; q.dispatchEvent(new w.Event("input", { bubbles: true }));
  assert.equal(w.document.querySelectorAll(".rtbl tbody tr").length, 2, "DC01 and DC01-BACKUP");
  w.S.q = "zzz"; w.render();
  assert.match(w.document.querySelector(".rnone").textContent, /No machines match/);
});
test("remote console: offline machine cannot be joined; online server joins Backstage", function () {
  const w = boot(); go(w, "remote", "console");
  w.A.rJoin({ id: "d3" }); assert.equal(w.S.remote && w.S.remote.sess, null);
  w.A.rJoin({ id: "dc01" }); w.render();
  assert.equal(w.S.remote.sess.logon, "backstage");
  assert.equal(w.document.querySelectorAll(".rsbar").length, 1);
  w.A.rPanel({ v: "commands" }); w.render();
  const i = w.document.getElementById("rcmd"); i.value = "hostname";
  w.A.rSessCmd({}, i); w.render();
  assert.match(w.document.querySelector(".rterm").textContent, /DC01/);
});
test("remote console: cannot disconnect while guest input is blocked", function () {
  const w = boot(); go(w, "remote", "console");
  w.A.rJoin({ id: "d1" }); w.A.rAct({ v: "block" }); w.A.rEnd();
  assert.ok(w.S.remote.sess, "still in the session");
  w.A.rAct({ v: "block" }); w.A.rEnd(); assert.equal(w.S.remote.sess, null);
});
test("remote console: support code flow adds a joinable support session", function () {
  const w = boot(); go(w, "remote", "support");
  w.A.rSupNew(); w.A.rSupJoin(); go(w, "remote", "console"); w.A.rGrp({ id: "support" }); w.render();
  assert.equal(w.document.querySelectorAll(".rtbl tbody tr").length, 1);
});
test("remote support ticket completes only after the full fix", function () {
  const w = boot(); w.S.onboarded = true;
  w.A.startScenario({ id: "s11" });
  assert.equal(w.scenarioDone("s11"), false);
  w.A.rSel({ id: "d1" }); w.A.rJoin({ id: "d1" }); w.A.rTab({ t: "procs" });
  w.rRun("d1", "taskkill /im DriverBoost.exe /f", true);
  assert.equal(w.scenarioDone("s11"), false, "ending the process alone is not enough");
  w.rSw("d1").splice(w.rSw("d1").findIndex(function (x) { return x.bad; }), 1); w.S.remote.flags.removed = true;
  const i = w.document.createElement("input"); i.value = "Fixed it"; w.A.rChat({}, i);
  w.A.rEnd(); assert.equal(w.scenarioDone("s11"), true);
});
test("saved lab from before the console existed loads", function () {
  const w = boot(); const o = JSON.parse(JSON.stringify(w.S)); delete o.remote; o.version = 7;
  const m = w.Lab.migrate(o); assert.equal(m.version, w.STATE_VERSION); assert.equal(m.remote, null);
});
test("virtual laptop fills the workspace with no portal chrome and spotlights its steps", function () {
  const w = boot(); w.S.onboarded = true; w.A.startMission({ t: "Set up Priya's laptop on the virtual Windows PC" });
  w.render(); const d = w.document;
  assert.equal(d.querySelectorAll(".edge, .phdr, .lnav").length, 0);
  assert.ok(d.querySelector(".vmtop"), "top strip");
  assert.ok(d.querySelector(".vm"), "laptop screen");
  assert.ok(d.querySelector(".spot"), "first laptop step is highlighted");
  assert.equal(d.querySelector(".vmside"), null, "practice notes closed by default");
});
test("procurement: type picker offers laptop, desktop and a disabled phone", function () {
  const w = boot(); w.S.onboarded = true; go(w, "procure", "order"); const d = w.document;
  assert.equal(d.querySelectorAll(".ptype").length, 3);
  assert.match(d.querySelector(".ptype.off").textContent, /Coming soon/);
  assert.equal(d.querySelectorAll(".edge, .phdr, .lnav").length, 0);
  w.A.pSoon(); assert.equal(w.S.procure.devs.length, 0);
});
test("procurement: ordering a desktop with no monitor raises a request that adding a monitor clears", function () {
  const w = boot(); w.S.onboarded = true; go(w, "procure", "order");
  w.A.pType({ k: "desktop" }); w.A.pMon({ k: "0" }); w.A.pOrder();
  const p = w.S.procure; assert.equal(p.devs.length, 1); assert.equal(p.devs[0].stage, "ordered");
  assert.equal(p.reqs.length, 1); assert.equal(w.pOpenReqs(), 1);
  w.A.pAddMon({ id: p.devs[0].id }); assert.equal(w.pOpenReqs(), 0);
  assert.equal(w.S.devices.length, 3, "ordered devices stay out of the Intune/Entra device list");
});
test("procurement: receive needs the exact serial from the box label", function () {
  const w = boot(); w.S.onboarded = true; go(w, "procure", "order");
  w.A.pType({ k: "laptop" }); w.A.pOrder(); go(w, "procure", "bench");
  const dev = w.S.procure.devs[0], inp = w.document.getElementById("ps-" + dev.id);
  inp.value = "WRONG"; w.A.pReceive({ id: dev.id }); assert.equal(dev.stage, "ordered");
  inp.value = dev.serial.toLowerCase(); w.A.pReceive({ id: dev.id }); assert.equal(dev.stage, "received");
  assert.equal(w.pBenchCount(), 1);
});
test("procurement: a second laptop for a user who already has one raises a duplicate request", function () {
  const w = boot(); w.S.onboarded = true;
  w.A.pType({ k: "laptop" }); w.S.procure.form.user = "u2"; w.A.pOrder();
  const r = w.S.procure.reqs[0]; assert.equal(r.kind, "dup"); assert.equal(w.pOpenReqs(), 1);
  w.A.pDup({ id: r.id, k: "cancel" }); assert.equal(w.pOpenReqs(), 0); assert.equal(w.S.procure.devs[0].stage, "cancelled");
});
test("saved lab from before procurement loads", function () {
  const w = boot(); const o = JSON.parse(JSON.stringify(w.S)); delete o.procure; o.version = 8;
  const m = w.Lab.migrate(o); assert.equal(m.version, w.STATE_VERSION); assert.equal(m.procure, null);
});
function benchDev(w, type) {
  w.S.onboarded = true; w.A.pType({ k: type }); if (type === "desktop") { w.A.pMon({ k: "1" }); } w.A.pOrder();
  const dev = w.S.procure.devs[0]; dev.stage = "received"; w.A.pImgStart({ id: dev.id }); return dev;
}
test("imaging by USB: stick, delete old partitions, then install", function () {
  const w = boot(), dev = benchDev(w, "desktop");
  w.A.pPower(); assert.equal(w.pImg(dev).step, "cables", "no power, monitor or keyboard yet");
  ["power", "mon", "kbd"].forEach(function (k) { w.A.pCable({ k: k }); });
  w.A.pPower(); assert.equal(w.pImg(dev).step, "post");
  w.A.pKey({ k: "f12" }); assert.equal(w.pImg(dev).step, "menu");
  w.A.pBoot({ k: "usb" }); assert.equal(w.pImg(dev).step, "menu", "no stick plugged in");
  w.pImg(dev).cab.usb = true; w.A.pBoot({ k: "usb" }); assert.equal(w.pImg(dev).step, "setup");
  w.A.pSetupNext(); assert.equal(w.pImg(dev).step, "setup", "old partitions block install");
  for (let i = 0; i < 3; i++) { w.A.pPart({ k: "0" }); w.A.pDelPart(); }
  w.A.pSetupNext(); assert.equal(w.pImg(dev).step, "install");
  for (let i = 0; i < 4; i++) { w.A.pInstall(); }
  assert.equal(dev.stage, "imaged"); assert.equal(dev.imgMethod, "USB");
});
test("imaging by PXE needs the network cable and the Windows 11 task sequence", function () {
  const w = boot(), dev = benchDev(w, "laptop"); w.A.pCable({ k: "power" }); w.A.pPower(); w.A.pKey({ k: "f12" });
  w.A.pBoot({ k: "nic4" }); assert.equal(w.pImg(dev).step, "menu"); assert.match(w.pImg(dev).msg, /PXE-E61/);
  w.A.pCable({ k: "net" }); w.A.pBoot({ k: "nic4" }); assert.equal(w.pImg(dev).step, "pxe");
  w.A.pTs({ k: "win10" }); w.A.pPxeGo(); assert.equal(w.pImg(dev).step, "pxe");
  w.A.pTs({ k: "win11" }); w.A.pPxeGo(); assert.equal(w.pImg(dev).step, "install");
});
test("only after the agent is installed does the device reach Remote support and the device list", function () {
  const w = boot(), dev = benchDev(w, "laptop"); dev.stage = "imaged";
  assert.equal(w.S.devices.length, 3); assert.equal(w.rAll().length, 5);
  w.A.pAgent({ id: dev.id });
  assert.equal(w.S.devices.length, 4); assert.equal(w.rAll().length, 6);
  const m = w.rAll()[5]; assert.equal(m.online, true); assert.equal(m.grp, "laptops");
  assert.ok(w.vmDevices().some(function (x) { return x.id === dev.id; }));
});
function readyDev(w, type) {
  const dev = benchDev(w, type); w.A.pCable({ k: "power" }); if (type === "desktop") { w.A.pCable({ k: "mon" }); w.A.pCable({ k: "kbd" }); } return dev;
}
test("BIOS boot order: moving USB first makes the normal boot start Windows Setup", function () {
  const w = boot(), dev = readyDev(w, "laptop"); w.A.pCable({ k: "usb" }); w.A.pPower();
  w.A.pKey({ k: "none" }); assert.equal(w.pImg(dev).step, "done", "default order boots the vendor Windows first");
  const w2 = boot(), d2 = readyDev(w2, "laptop"); w2.A.pCable({ k: "usb" }); w2.A.pPower(); w2.A.pKey({ k: "f2" });
  assert.equal(w2.pImg(d2).step, "bios");
  w2.A.pBiosMove({ k: "usb", dir: "-1" }); w2.A.pBiosMove({ k: "usb", dir: "-1" });
  w2.A.pBiosExit(); assert.equal(w2.pImg(d2).step, "bios", "unapplied changes are not silently kept");
  w2.A.pBiosApply(); w2.A.pBiosExit(); assert.equal(w2.pImg(d2).step, "setup");
});
test("BIOS: a disabled device is skipped; with nothing bootable the machine says so", function () {
  const w = boot(), dev = readyDev(w, "laptop"); w.A.pPower(); w.A.pKey({ k: "f2" });
  ["win", "usb", "nic4", "nic6"].forEach(function (k) { w.A.pBiosTog({ k: k }); });
  w.A.pBiosApply(); w.A.pBiosExit(); assert.match(w.pImg(dev).msg, /No bootable device/);
});
test("Autopilot boot: only a serial registered in Intune gets zero-touch setup", function () {
  const w = boot(), dev = readyDev(w, "laptop"); w.A.pPower(); w.A.pKey({ k: "f12" }); w.A.pBoot({ k: "win" });
  assert.equal(dev.imgMethod, "OEM Windows"); assert.equal(w.S.devices.length, 3);
  const w2 = boot(), d2 = readyDev(w2, "laptop");
  w2.S.devices.push({ id: "dap", serial: d2.serial, name: "(not set up)", model: "x", maker: "Dell", os: "Windows 11 Pro", osVer: "10.0.22631", userId: null, state: "registered", baseBitlocker: false, autopilot: true, sync: "-" });
  w2.S.apProfiles.push({ id: "apx", name: "Corp", assign: { all: "devices" } });
  w2.A.pPower(); w2.A.pKey({ k: "f12" }); w2.A.pBoot({ k: "win" });
  assert.equal(d2.imgMethod, "Autopilot"); assert.equal(d2.devId, "dap"); assert.equal(w2.S.devices.length, 4);
  w2.A.pAgent({ id: d2.id }); assert.equal(w2.rAll().length, 6); assert.match(w2.rAll()[5].name, /^DESKTOP-/);
});
test("tickets s12 and s13 exist, are isolated, and only finish when the work is done", function () {
  const w = boot(); w.S.onboarded = true; w.A.startScenario({ id: "s12" });
  assert.equal(w.S.procure.devs.length, 0); assert.equal(w.scenarioDone("s12"), false);
  w.A.pType({ k: "desktop" }); w.A.pMon({ k: "0" }); w.S.procure.form.user = "u4"; w.A.pOrder();
  assert.equal(w.scenarioDone("s12"), false, "a desktop with no monitor does not count");
  assert.match(w.ticketDock(), /Requests from your orders/);
});
test("mission steps on procurement and imaging screens get a spotlight", function () {
  const w = boot(); w.S.onboarded = true; w.A.startMission({ t: "Order and image a desktop" }); w.render();
  assert.equal(w.S.portal, "procure"); assert.ok(w.document.querySelector(".spot"), "Desktop card is highlighted");
  w.A.pType({ k: "desktop" }); w.render(); assert.match(w.document.querySelector(".spot").textContent, /monitor|Place order/);
});
test("layout class names are not defined twice by different windows (the .rdesk collision)", function () {
  const css = require("fs").readFileSync(__dirname + "/../css/app.css", "utf8");
  ["rdesk", "rbody", "rwin", "ricons", "psub"].forEach(function (c) {
    const n = (css.match(new RegExp("(^|\\n)\\." + c + "\\{", "g")) || []).length;
    assert.ok(n <= 1, "." + c + " is defined " + n + " times at the start of a rule");
  });
});
test("DC01 desktop keeps icons in a left column and the window beside them", function () {
  const w = boot(); w.S.onboarded = true; w.A.go({ p: "ad", pg: "sync" }); w.render();
  const d = w.document;
  assert.ok(d.querySelector(".rdesk > .ricons"), "icon column is inside the DC01 desktop");
  assert.equal(d.querySelectorAll(".rsdesk").length, 0, "remote session desktop class is not used here");
});
function imagedDesktop(w) {
  const dev = benchDev(w, "desktop"); dev.stage = "imaged"; w.A.pAgent({ id: dev.id }); return dev;
}
test("an imaged desktop opens as a monitor, tower and keyboard; a laptop keeps the laptop frame", function () {
  const w = boot(), dev = imagedDesktop(w); w.A.go({ p: "vm", pg: dev.id }); w.render(); const d = w.document;
  assert.ok(d.querySelector(".mbezel .vm"), "screen sits in a monitor bezel");
  assert.ok(d.querySelector(".tower"), "tower is shown"); assert.ok(d.querySelector(".kbd")); assert.equal(d.querySelector(".lbase"), null);
  assert.match(d.querySelector(".tower").textContent, new RegExp(dev.serial));
  assert.match(d.querySelector(".mlabel").textContent, /P2423|E24/, "monitor model from the order");
  w.A.go({ p: "vm", pg: "d2" }); w.render(); assert.ok(w.document.querySelector(".lbase")); assert.equal(w.document.querySelector(".tower"), null);
});
test("knowledge base: search finds articles, ticket articles stay locked until the ticket is resolved", function () {
  const w = boot(); w.S.onboarded = true; w.A.go({ p: "kb", pg: "home" }); w.render(); const d = w.document;
  assert.equal(d.querySelectorAll(".edge, .phdr, .lnav").length, 0);
  assert.ok(d.querySelectorAll(".kbit").length >= 20, "general plus ticket articles");
  w.S.q = "autopilot"; w.render(); const t = Array.from(d.querySelectorAll(".kbit b")).map(function (e) { return e.textContent; });
  assert.ok(t.some(function (x) { return /Autopilot/.test(x); })); assert.ok(t.length < 8);
  w.S.q = "zzzzqq"; w.render(); assert.match(d.querySelector(".kbnone").textContent, /No article matches/);
  w.S.q = ""; w.A.kbOpen({ id: "t-s1" }); w.render();
  assert.match(d.querySelector(".kbart").textContent, /Resolve the ticket first/); assert.equal(d.querySelector(".kbart ol"), null);
  w.S.scenarios.completed.s1 = true; w.render(); assert.match(d.querySelector(".kbart").textContent, /Why it happens/);
});
test("knowledge base: My notes lists notes only for resolved tickets, and the dock links to the knowledge base", function () {
  const w = boot(); w.S.onboarded = true; w.S.scenarios.notes = { s1: "Unlocked Dana and told her to update her phone.", s2: "unfinished" };
  w.S.scenarios.completed.s1 = true; w.A.kbTab({ k: "notes" }); w.A.go({ p: "kb", pg: "home" }); w.render();
  const t = w.document.querySelector(".kbbody").textContent; assert.match(t, /Unlocked Dana/); assert.doesNotMatch(t, /unfinished/);
  w.A.startScenario({ id: "s5" }); w.render(); assert.match(w.ticketDock(), /Search the knowledge base/);
});
test("saved lab from before the knowledge base loads", function () {
  const w = boot(); const o = JSON.parse(JSON.stringify(w.S)); delete o.kb; o.version = 9;
  const m = w.Lab.migrate(o); assert.equal(m.version, w.STATE_VERSION); assert.equal(m.kb, null);
});
test("saved lab with Sam only in Entra Finance is lined up so the first sync does not remove him", function () {
  const w = boot(); const o = JSON.parse(JSON.stringify(w.S)); o.version = 10;
  o.ad.groups.filter(function (g) { return g.id === "adg1"; })[0].members = ["adu1"];
  const m = w.Lab.migrate(o);
  assert.ok(m.ad.groups.filter(function (g) { return g.id === "adg1"; })[0].members.indexOf("adu2") > -1);
});
function s14Boot() {
  const w = boot(); w.S.onboarded = true; w.A.startScenario({ id: "s14" });
  const dev = w.S.procure.devs[0]; w.A.pImgStart({ id: dev.id }); ["power", "usb"].forEach(function (k) { w.A.pCable({ k: k }); }); w.A.pPower();
  return { w: w, dev: dev };
}
test("s14: Legacy mode blocks the USB stick, Secure Boot off blocks Setup, fixing both lets it install", function () {
  const x = s14Boot(), w = x.w, dev = x.dev, g = w.pImg(dev);
  assert.equal(w.pBios(g).mode, "Legacy"); assert.equal(w.pBios(g).sb, false);
  w.A.pKey({ k: "f12" }); w.A.go({ p: "procure", pg: "image" }); w.render(); assert.match(w.document.querySelector("#app").textContent, /Boot mode is set to: Legacy; Secure Boot: OFF/);
  w.A.pBoot({ k: "usb" }); assert.equal(g.step, "menu"); assert.match(g.msg, /UEFI mode only/);
  w.A.pBoot({ k: "bios" }); w.A.pBiosMode({ k: "UEFI" }); w.A.pBiosApply(); w.A.pBiosExit();
  assert.equal(g.step, "setup", "UEFI lets the stick boot first");
  while (g.parts.some(function (p) { return p.t !== "Unallocated"; })) { g.sel = g.parts.findIndex(function (p) { return p.t !== "Unallocated"; }); w.A.pDelPart(); }
  g.sel = 0; w.A.pSetupNext(); assert.equal(g.step, "blocked", "Secure Boot still off"); assert.match(g.blockWhy, /Secure Boot is turned off/);
  w.A.go({ p: "procure", pg: "image" }); w.render(); assert.match(w.document.querySelector("#app").textContent, /can.t run Windows 11/);
  w.A.pRestart(); assert.equal(g.step, "post"); w.A.pKey({ k: "f2" }); w.A.pBiosTab({ k: "sec" }); w.A.pBiosSb(); w.A.pBiosApply(); w.A.pBiosExit();
  assert.equal(g.step, "setup"); while (g.parts.some(function (p) { return p.t !== "Unallocated"; })) { g.sel = g.parts.findIndex(function (p) { return p.t !== "Unallocated"; }); w.A.pDelPart(); }
  g.sel = 0; w.A.pSetupNext(); assert.equal(g.step, "install");
  assert.equal(w.scenarioDone("s14"), false, "not done until installed and the agent is on");
});
test("BIOS: leaving without Apply Changes keeps the old Boot List Option and Secure Boot", function () {
  const x = s14Boot(), w = x.w, g = w.pImg(x.dev);
  w.A.pKey({ k: "f2" }); w.A.pBiosMode({ k: "UEFI" }); w.A.pBiosTab({ k: "sec" }); w.A.pBiosSb();
  w.A.pBiosExit(); assert.match(g.msg, /did not choose Apply/); assert.equal(g.step, "bios");
  w.A.pBiosExit(); assert.equal(w.pBios(g).mode, "Legacy"); assert.equal(w.pBios(g).sb, false);
});
test("s14 is isolated: leaving the ticket restores the main lab's procurement", function () {
  const w = boot(); w.S.onboarded = true; const before = JSON.stringify(w.S.procure); w.A.startScenario({ id: "s14" });
  assert.equal(w.S.procure.devs.length, 1); w.A.exitScenario(); assert.equal(JSON.stringify(w.S.procure), before);
});

test("Autopilot boot: a registered serial with no deployment profile still gets the standard setup", function () {
  const w = boot(), d = readyDev(w, "laptop");
  w.S.devices.push({ id: "dap", serial: d.serial, name: "(not set up)", model: "x", maker: "Dell", os: "Windows 11 Pro", osVer: "10.0.22631", userId: null, state: "registered", baseBitlocker: false, autopilot: true, sync: "-" });
  assert.equal(w.apAssigned(), false);
  w.A.pPower(); w.A.pKey({ k: "f12" }); w.A.pBoot({ k: "win" });
  assert.equal(d.imgMethod, "OEM Windows"); assert.equal(w.pImg(d).method, "NoProfile");
  w.A.go({ p: "procure", pg: "image" }); w.render(); assert.match(w.document.querySelector("#app").textContent, /no Autopilot deployment profile/);
});
test("theme button cycles Auto, Light, Dark and the start screen and taskbar both offer it", function () {
  const w = boot(); w.S.onboarded = true; w.A.go({ p: "start", pg: "home" }); w.render(); const d = w.document, root = d.documentElement;
  assert.ok(d.querySelector('.sbar [data-a="theme"]')); assert.match(d.querySelector('.sbar [data-a="theme"]').textContent, /Theme: Auto/);
  w.A.theme(); assert.equal(root.getAttribute("data-theme-choice"), "light");
  w.A.theme(); assert.equal(root.getAttribute("data-theme-choice"), "dark");
  w.A.theme(); assert.equal(root.getAttribute("data-theme-choice"), null);
  w.A.go({ p: "env", pg: "map" }); w.render(); assert.ok(d.querySelector('.wsbar [data-a="theme"]'));
});
test("layout: the page never scrolls, and Remote support, Procurement and Knowledge base fill the workspace", function () {
  const fs = require("fs"), css = fs.readFileSync(require("path").join(__dirname, "..", "css", "app.css"), "utf8");
  assert.match(css, /body:not\(\[data-portal="start"\]\)\{height:100vh;overflow:hidden;padding-bottom:0\}/, "the document is fixed to the window");
  assert.match(css, /body\[data-portal="remote"\] \.shell>\.content,body\[data-portal="procure"\] \.shell>\.content,body\[data-portal="kb"\] \.shell>\.content\{padding:0/, "full-screen apps have no padding");
  assert.match(css, /@media \(max-width:1500px\)\{\.wsbar \.tbnote\{display:none\}\}/, "taskbar note hides before it can overflow");
});
test("phone version: a phone gets its own shell with four open areas and six desktop-only tiles", function () {
  const w = boot(), d = w.document;
  w.S.onboarded = true; w.localStorage.setItem("adminPracticeLabView", "phone"); w.render();
  assert.ok(d.body.classList.contains("is-phone"));
  assert.equal(d.querySelectorAll(".ph-tile:not(.ph-lock)").length, 4);
  assert.equal(d.querySelectorAll(".ph-lock").length, 6);
  assert.equal(d.querySelectorAll(".wsbar, .dock, .shell").length, 0, "no laptop taskbar, dock or portal shell on a phone");
  w.A.phGo({ s: "desk", id: "proc" }); w.render();
  assert.match(d.querySelector(".ph-shot").getAttribute("src"), /docs\/screenshots\//);
  assert.match(d.querySelector(".ph-badge").textContent, /Desktop only/);
  w.A.phGo({ s: "tickets" }); w.render();
  assert.equal(d.querySelectorAll(".ph-row").length, w.SCENARIOS.length);
  w.A.phGo({ s: "tickets", id: "s14" }); w.render();
  assert.match(d.querySelector(".ph-h").textContent, /Windows 11/);
  assert.ok(!/Why it happened/.test(d.querySelector(".ph").textContent), "the cause stays hidden until the ticket is resolved");
  w.A.phGo({ s: "kb" }); w.render();
  assert.match(d.querySelector(".ph").textContent, /Locked/, "ticket articles stay locked on a phone");
  w.A.phGo({ s: "tools" }); w.render();
  assert.ok(d.querySelectorAll("a.ph-tool").length >= 8);
});
test("phone version: View desktop version switches to the laptop layout and the choice is remembered", function () {
  const w = boot(), d = w.document;
  w.S.onboarded = true; w.localStorage.setItem("adminPracticeLabView", "phone"); w.render();
  d.querySelector('[data-a="phDesktop"]').click();
  assert.equal(w.localStorage.getItem("adminPracticeLabView"), "desktop");
  assert.ok(!d.body.classList.contains("is-phone"));
  assert.ok(d.querySelector(".sbar, .shell"), "the laptop start screen is back");
  assert.equal(w.phoneMode(), false);
});
test("phone version: a laptop-size window is never switched to the phone shell", function () {
  const w = boot();
  w.localStorage.removeItem("adminPracticeLabView");
  assert.equal(w.phoneMode(), false);
});

test("analytics sends only fixed event names and never breaks without GoatCounter", function () {
  const w = boot(); w.S.onboarded = true;
  const t = w.levelsView()[0].ms[0].t;
  w.A.startMission({ t: t }); /* no GoatCounter loaded: must not throw */
  w.S.mission = null;
  const sent = [];
  w.goatcounter = { count: function (o) { sent.push(o); } };
  w.A.startMission({ t: t });
  w.A.startScenario({ id: "s1" });
  w.A.go({ p: "intune" }); w.render(); w.render();
  w.A.kbOpen({ id: "dummy-article" });
  w.A.scenarioHint({ id: "s1" });
  const a = w.document.createElement("a"); a.href = "https://github.com/Markplowwright/x?secret=1"; w.document.body.appendChild(a); a.click();
  w.A.phDesktop({});
  const names = sent.map(function (o) { return o.path; });
  assert.ok(names.some(function (n) { return /^event\/mission\/[a-z0-9-]+-started$/.test(n); }));
  assert.ok(names.includes("event/ticket/s1-started"));
  assert.strictEqual(names.filter(function (n) { return n.indexOf("event/screen/intune") === 0; }).length, 1);
  assert.ok(names.includes("event/kb/dummy-article"));
  assert.ok(names.includes("event/hint/s1"));
  assert.ok(names.includes("event/link/github.com"));
  assert.ok(names.every(function (n) { return n.indexOf("secret") < 0; }));
  assert.ok(names.includes("event/phone-to-desktop"));
  sent.forEach(function (o) { assert.strictEqual(o.event, true); assert.deepStrictEqual(Object.keys(o).sort(), ["event", "path", "title"]); });
});

test("flyouts stop at the ticket panel instead of sitting under it", function () {
  const css = fs.readFileSync(path.join(root, "css", "app.css"), "utf8");
  const dock = /\.dock\{[^}]*width:(\d+)px/.exec(css);
  const fly = /body\.dock-open \.fly\{right:(\d+)px;width:min\(\d+px,calc\(100vw - (\d+)px\)\)\}/.exec(css);
  assert.ok(dock && fly, "dock width and the dock-open flyout rule exist");
  assert.strictEqual(fly[1], dock[1]);
  assert.strictEqual(fly[2], dock[1]);
  assert.ok(/@media \(max-width:900px\)\{body\.dock-open \.fly\{right:0;width:100%;z-index:3[6-9]\}\}/.test(css), "narrow windows show the flyout above the panel");
});
