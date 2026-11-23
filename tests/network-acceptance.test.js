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
function laptop() { const w = boot(); const d = w.D("d3"); w.ensureVm(d); d.vm.ssid = "Practice-Corp"; return { w: w, d: d, n: d.vm.net }; }
function desk(admin) {
  const x = laptop(), w = x.w;
  w.S.onboarded = true; w.S.portal = "vm"; w.S.page = "d3";
  x.d.vm.stage = "desktop"; x.d.vm.oobe = "done";
  x.d.vm.cur = { kind: "local", name: admin === false ? "Student" : "LocalAdmin" };
  w.render(); return x;
}
function act(x, name, ds) { x.w.A[name](ds || {}); x.w.render(); }
function run(x, line) { return x.w.runCmd(x.d, line).join("\n"); }
function fresh(x) { return x.w.D("d3"); }
function ticket(id) { const x = desk(); x.w.A.startScenario({ id: id }); x.d = x.w.D("d3"); x.d.vm.cur = { kind: "local", name: "LocalAdmin" }; x.w.render(); return x; }

/* Acceptance tests 1 to 8 from admin_lab_network_adapter_feature_spec.md, section 8. */

test("1. a static laptop shows DHCP Enabled: No and release/renew refuse to run", function () {
  const x = ticket("s15");
  assert.match(run(x, "ipconfig /all"), /DHCP Enabled[. ]+: No/);
  assert.match(run(x, "ipconfig /release"), /no adapter is in the state permissible/);
  assert.match(run(x, "ipconfig /renew"), /no adapter is in the state permissible/);
});

test("2. automatic IPv4 plus a renew gives a valid lease and working pings", function () {
  const x = ticket("s15"); const n = x.w.ensureNet(x.d);
  n.mode = "dhcp"; n.dnsMode = "auto"; n.lease = null;
  run(x, "ipconfig /release"); assert.match(run(x, "ipconfig /renew"), /192\.168\.20\./);
  assert.match(run(x, "ping 192.168.20.1"), /Reply from/);
  assert.match(run(x, "ping 8.8.8.8"), /Reply from/);
  assert.match(run(x, "ping google.com"), /Reply from/);
});

test("3. with no DHCP answer nothing local fixes it, and the ticket needs a correct escalation note", function () {
  const x = ticket("s16");
  run(x, "ipconfig /all"); run(x, "ipconfig /release");
  assert.match(run(x, "ipconfig /renew"), /unable to contact your DHCP server/);
  act(x, "vmOpen", { app: "devmgr" }); act(x, "dmSel", { id: "wifi" }); act(x, "dmDisable"); act(x, "dmEnable"); act(x, "dmPower");
  x.d = fresh(x); x.d.vm.cur = { kind: "local", name: "LocalAdmin" };
  run(x, "ipconfig /renew"); act(x, "vmRestart"); x.d = fresh(x);
  assert.match(x.w.netView(x.d).ip, /^169\.254\./, "still self-assigned after settings, driver and restart changes");
  assert.equal(x.w.scenarioDone("s16"), false);
  x.w.S.scenarios.notes = { s16: "the laptop is broken" };
  assert.equal(x.w.scenarioDone("s16"), false, "a vague note is not enough");
  const mac = x.w.macFor(x.d), ssid = x.d.vm.ssid, ip = x.w.autoIpFor(x.d);
  x.w.S.scenarios.notes = { s16: "Address " + ip + ", DHCP Enabled: Yes, MAC " + mac + ", Wi-Fi " + ssid + ". Tried release, renew and a restart. Other devices also fail." };
  assert.equal(x.w.scenarioDone("s16"), true);
});

test("4. an error 43 adapter ignores settings changes, and Update, Roll Back or Uninstall plus Restart fixes it", function () {
  ["update", "rollback", "uninstall"].forEach(function (how) {
    const x = ticket("s17");
    act(x, "vmOpen", { app: "ncpa" }); act(x, "ncSel", { id: "wifi" }); act(x, "ncEnable"); act(x, "ncStatus");
    x.d = fresh(x); assert.equal(x.d.vm.net.driver, "error43", "ncpa cannot fix a driver error");
    assert.equal(x.w.netView(x.d).link, false);
    act(x, "vmOpen", { app: "devmgr" }); act(x, "dmSel", { id: "wifi" }); act(x, "dmProps");
    if (how === "update") { act(x, "dmUpdate"); }
    if (how === "rollback") { act(x, "dmRollback"); }
    if (how === "uninstall") { act(x, "dmUninstall"); act(x, "dmUninstallOk"); act(x, "vmRestart"); }
    x.d = fresh(x);
    assert.equal(x.w.netView(x.d).internetOk, true, how);
    assert.equal(x.w.scenarioDone("s17"), true, how);
  });
});

test("5. Uninstall Device without Restart leaves restartPending and no adapter, Restart restores it", function () {
  const x = desk(); act(x, "vmOpen", { app: "devmgr" }); act(x, "dmSel", { id: "wifi" }); act(x, "dmUninstall"); act(x, "dmUninstallOk");
  x.d = fresh(x);
  assert.equal(x.d.vm.net.restartPending, true);
  act(x, "vmOpen", { app: "ncpa" });
  assert.ok(!/Intel\(R\) Wi-Fi 6/.test(x.w.document.querySelector(".nclist").textContent), "adapter gone from ncpa.cpl");
  act(x, "vmRestart"); x.d = fresh(x);
  assert.equal(x.d.vm.net.restartPending, false);
  assert.equal(x.w.netView(x.d).internetOk, true);
});

test("6. the ping ladder gives the right answer for each failure", function () {
  const x = desk(); let n = x.w.ensureNet(x.d);
  assert.match(run(x, "ping 192.168.20.1"), /Reply from/);
  assert.match(run(x, "ping 8.8.8.8"), /Reply from/);
  assert.match(run(x, "ping google.com"), /Reply from/);
  n.dnsMode = "manual"; n.dnsManual = "10.99.99.9";
  assert.match(run(x, "ping 8.8.8.8"), /Reply from/);
  assert.doesNotMatch(run(x, "ping google.com"), /Reply from/, "name fails, address works");
  n.dnsMode = "auto"; n.vpn = "broken";
  assert.match(run(x, "ping 192.168.20.1"), /Reply from/, "gateway fine");
  assert.doesNotMatch(run(x, "ping 8.8.8.8"), /Reply from/, "broken VPN stops the internet");
  n.vpn = "ok"; assert.match(run(x, "ping 8.8.8.8"), /Reply from/, "VPN connected");
  n.vpn = "off"; n.mode = "static"; n.sIp = "192.168.1.50"; n.sMask = "255.255.255.0"; n.sGw = "192.168.1.1";
  assert.doesNotMatch(run(x, "ping 192.168.20.1"), /Reply from/, "gateway on another subnet fails");
});

test("7. wrong-tool hints show only in the right situations", function () {
  const a = ticket("s17");
  assert.equal(a.w.netWrongTool("s17"), "");
  act(a, "vmOpen", { app: "ncpa" }); act(a, "ncSel", { id: "wifi" }); act(a, "ncEnable");
  assert.match(a.w.netWrongTool("s17"), /driver error.*Device Manager/);
  const b = ticket("s21");
  assert.equal(b.w.netWrongTool("s21"), "");
  act(b, "vmOpen", { app: "devmgr" }); act(b, "dmSel", { id: "wifi" }); act(b, "dmProps");
  assert.match(b.w.netWrongTool("s21"), /Network Connections \(ncpa\.cpl\)/);
  assert.match(b.w.document.querySelector(".dock").textContent, /ncpa\.cpl/);
  const c = ticket("s18"); act(c, "vmOpen", { app: "devmgr" }); act(c, "dmSel", { id: "wifi" }); act(c, "dmProps");
  assert.equal(c.w.netWrongTool("s18"), "", "Device Manager is not a wrong tool for a stale lease hint");
});

test("8. a ticket resets cleanly and completion is saved like the others", function () {
  const x = ticket("s21"); const w = x.w;
  w.ensureNet(w.D("d3")).sGw = "192.168.20.1";
  assert.equal(w.scenarioDone("s21"), true);
  w.A.resetScenario(); assert.equal(w.scenarioDone("s21"), false, "reset restores the starting state");
  assert.equal(w.ensureNet(w.D("d3")).sGw, "");
  w.ensureNet(w.D("d3")).sGw = "192.168.20.1";
  w.A.resolveTicket(); w.render();
  assert.equal(w.S.scenarios.completed.s21, true);
  w.A.exitScenario();
  assert.equal(w.S.scenarios.completed.s21, true, "completion survives leaving the ticket");
  assert.equal(w.ensureNet(w.D("d3")).mode, "dhcp", "the laptop is back to its normal network after leaving");
  const l7 = w.levelsView().find(function (L) { return L.n === 7; });
  assert.equal(l7.done, 1); assert.equal(l7.tot, 7);
});
