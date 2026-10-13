"use strict";
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.join(__dirname, "..");
const scripts = ["state.js", "ui.js", "rules.js", "ad.js", "entra.js", "m365.js", "exchange.js", "intune.js", "vm.js", "guide.js", "render.js"];

function appHtml() {
  return "<!doctype html><html><head></head><body data-portal=\"m365\">" +
    "<div id=\"app\"></div><div id=\"intro\"></div><div id=\"pop\" role=\"tooltip\" hidden></div>" +
    "<div id=\"modal\" hidden></div><div id=\"toast\" hidden></div>" +
    scripts.map(function (name) {
      return "<script>" + fs.readFileSync(path.join(root, "js", name), "utf8").replace(/<\/script/gi, "<\\/script") + "</script>";
    }).join("") + "</body></html>";
}

function boot() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", function (e) { errors.push(e); });
  const dom = new JSDOM(appHtml(), {
    runScripts: "dangerously",
    url: "https://admin-practice.test/",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse: function (window) {
      window.scrollTo = function () {};
      window.matchMedia = function () { return { matches: false, addEventListener: function () {} }; };
    }
  });
  dom.window.addEventListener("error", function (e) { errors.push(e.error || e.message); });
  assert.deepEqual(errors, [], "application should load without window or jsdom errors");
  return dom;
}

function dispatchAction(w, name, data) {
  const b = w.document.createElement("button");
  b.dataset.a = name;
  Object.keys(data || {}).forEach(function (k) { b.dataset[k] = String(data[k]); });
  w.document.body.appendChild(b);
  b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  b.remove();
}

function completeHybridMissions(w) {
  let made = w.createAdUser({ name: "Avery Stone", sam: "avery.stone", department: "Operations", ou: "ou-staff", pw: "Practice#2026", mustChange: true });
  assert.ok(made.user);
  dispatchAction(w, "adSync");
  let cloud = w.cloudForAd(made.user);
  cloud.loc = "US"; cloud.direct = true;

  dispatchAction(w, "adUnlock", { id: "adu1" });
  w.resetAdPassword(w.ADU("adu1"), "DanaPractice#2", true);

  let marcus = w.ADU("adu4");
  marcus.enabled = false; marcus.ou = "ou-disabled";
  dispatchAction(w, "adSync");

  if (!w.ADG("adg1").members.includes("adu2")) { w.ADG("adg1").members.push("adu2"); }
  dispatchAction(w, "adSync");

  let d = w.D("d3");
  assert.equal(w.domainJoin(d, w.AD_DOMAIN, w.S.ad.adminUser, w.S.ad.adminPw).ok, true);
  let computer = w.S.ad.computers.find(function (c) { return c.deviceId === "d3"; });
  computer.ou = "ou-computers"; d.joinUser = "u2"; d.userId = "u2";
  dispatchAction(w, "adSync");
  w.applyGroupPolicy(d, w.U("u2"));

  dispatchAction(w, "resetPw", { id: "u2" });
  w.resetAdPassword(w.ADU("adu2"), "SamPractice#2", true);
  dispatchAction(w, "adSync");

  const hybrid = w.missions().filter(function (m) { return m.l === 5; });
  assert.equal(hybrid.length, 7);
  hybrid.forEach(function (m) {
    assert.ok(m.s.every(function (step) { return step[1]; }), "guided mission incomplete: " + m.t);
  });
}

function completeScenario(w, id) {
  let a, c, d, u;
  if (id === "s1") { w.resetAdPassword(w.ADU("adu1"), "DanaScenario#1", true); w.S.scenarios.phoneUpdated = true; }
  if (id === "s2") { w.resetAdPassword(w.ADU("adu2"), "SamScenario#2", true); w.runPasswordSync(); }
  if (id === "s3") {
    a = w.createAdUser({ name: "Priya Nair", sam: "priya.nair", department: "Finance", ou: "ou-staff", pw: "PriyaScenario#3", mustChange: true }).user;
    w.ADG("adg1").members.push(a.id); w.runDeltaSync(); u = w.cloudForAd(a); u.loc = "US"; u.direct = true;
    w.domainJoin(w.D("d3"), w.AD_DOMAIN, w.S.ad.adminUser, w.S.ad.adminPw);
  }
  if (id === "s4") {
    a = w.ADU("adu4"); a.enabled = false; a.passwordChanged = true; a.ou = "ou-disabled";
    w.S.ad.groups.forEach(function (g) { g.members = g.members.filter(function (x) { return x !== a.id; }); });
    w.runDeltaSync(); u = w.cloudForAd(a); u.revoked = true; u.direct = false; w.D("d1").state = "retired";
  }
  if (id === "s5") { w.ADG("adg1").members.push("adu2"); w.runDeltaSync(); w.applyGroupPolicy(w.D("d3"), w.U("u2")); }
  if (id === "s6") { c = w.S.ad.computers.find(function (x) { return x.deviceId === "d3"; }); c.ou = "ou-computers"; w.applyGroupPolicy(w.D("d3"), w.U("u2")); }
  if (id === "s7") { c = w.S.ad.computers.find(function (x) { return x.deviceId === "d3"; }); w.resetComputerAccount(c); w.D("d3").restartedAfterTrust = true; }
  if (id === "s8") { a = w.ADU("adu5"); a.ou = "ou-staff"; w.runDeltaSync(); }
  if (id === "s9") {
    a = w.createAdUser({ name: "Casey Contractor", sam: "casey.contractor", department: "Contractor", ou: "ou-staff", pw: "CaseyScenario#9", mustChange: true, expires: 720 }).user;
    w.ADG("adg1").members.push(a.id); w.runDeltaSync();
  }
  if (id === "s10") {
    w.S.flags.spottedOdd = true; w.resetAdPassword(w.ADU("adu1"), "DanaScenario#10", true); w.runPasswordSync();
    u = w.U("u1"); u.revoked = true; u.fwd = null; u.methods = [];
  }
  assert.equal(w.scenarioDone(id), true, "scenario should complete: " + id);
}

(function run() {
  const dom = boot();
  const w = dom.window;

  completeHybridMissions(w);

  const fresh = w.seed();
  w.Lab.S = fresh; w.S = fresh;
  const alex = w.ADU("adu5");
  assert.equal(alex.cloudId, null);
  dispatchAction(w, "adSync");
  assert.equal(alex.cloudId, null);
  alex.ou = "ou-staff";
  dispatchAction(w, "adSync");
  assert.ok(alex.cloudId);

  w.ADU("adu1").enabled = false;
  dispatchAction(w, "adSync");
  assert.equal(w.U("u1").blocked, true);

  const d3 = w.D("d3");
  w.domainJoin(d3, w.AD_DOMAIN, w.S.ad.adminUser, w.S.ad.adminPw);
  dispatchAction(w, "adSync");
  assert.equal(d3.azureAdJoined, true);

  w.SCENARIOS.forEach(function (s) {
    w.Lab.S = w.seed(); w.S = w.Lab.S;
    dispatchAction(w, "startScenario", { id: s.id });
    dispatchAction(w, "adSync");
    assert.equal(w.scenarioDone(s.id), false, "wrong path must not complete " + s.id);
    assert.match(w.scenarioFeedback(s), /still open|did not fix/);
    completeScenario(w, s.id);
  });

  w.Lab.S = w.seed(); w.S = w.Lab.S;
  w.S.apProfiles.push({ id: "ap-test", name: "All", assign: { all: "devices", groups: [] } });
  let priya = w.U("u3"), laptop = w.D("d2");
  w.S.mdm.scope = "none";
  assert.match(w.autopilotUnbox(laptop, priya).error, /MDM user scope/);
  w.S.mdm.scope = "all";
  assert.match(w.tryEnroll(laptop, priya).why, /80180018/);
  priya.loc = "US"; priya.direct = true;
  assert.equal(w.tryEnroll(laptop, priya).ok, true);

  w.Lab.S = w.seed(); w.S = w.Lab.S;
  const supportPc = w.D("d3"), vm = w.ensureVm(supportPc);
  vm.ssid = "Practice-Corp";
  vm.stage = "desktop";
  vm.cur = { kind: "local", name: "LocalAdmin" };
  const cmdOut = function (line) { return w.runCmd(supportPc, line).join("\n"); };
  const psOut = function (line) { return w.runPowerShell(supportPc, line).join("\n"); };
  assert.match(cmdOut("ping 8.8.8.8"), /Received = 4/);
  assert.match(cmdOut("nslookup microsoft.com"), /Non-authoritative answer/);
  assert.match(cmdOut("tracert 8.8.8.8"), /Trace complete/);
  assert.match(cmdOut("pathping 8.8.8.8"), /Computing statistics/);
  assert.match(cmdOut("netstat -ano"), /LISTENING/);
  assert.match(cmdOut("arp -a"), /192\.168\.20\.1/);
  assert.match(cmdOut("route print"), /IPv4 Route Table/);
  assert.match(cmdOut("getmac /v"), /Physical Address/);
  assert.match(cmdOut("ipconfig /all"), /DHCP Server/);
  assert.match(cmdOut("systeminfo"), /Windows 11 Pro/);
  assert.match(cmdOut("tasklist"), /WindowsTerminal/);
  assert.match(cmdOut("driverquery"), /Intel Wireless/);
  assert.match(cmdOut("net user"), /LocalAdmin/);
  assert.match(cmdOut("net localgroup Administrators"), /Administrators/);
  assert.match(cmdOut("sc query wuauserv"), /RUNNING/);
  assert.match(cmdOut("powercfg /batteryreport"), /battery-report\.html/);
  assert.match(cmdOut("chkdsk C:"), /found no problems/);
  assert.match(cmdOut("sfc /scannow"), /did not find any integrity violations/);
  assert.match(cmdOut("DISM /Online /Cleanup-Image /ScanHealth"), /The operation completed successfully/);
  assert.match(cmdOut("whoami"), /localadmin/i);
  assert.match(cmdOut("hostname"), /DESKTOP-SP26042/);
  assert.match(cmdOut("nosuchcmd"), /is not recognized as an internal or external command/);
  assert.match(psOut("Get-NetIPConfiguration"), /IPv4Address/);
  assert.match(psOut("Test-Connection 8.8.8.8"), /8\.8\.8\.8/);
  assert.match(psOut("Resolve-DnsName microsoft.com"), /IPAddress/);
  assert.match(psOut("Get-NetRoute"), /0\.0\.0\.0\/0/);
  assert.match(psOut("Get-NetTCPConnection"), /Established/);
  assert.match(psOut("Get-ComputerInfo"), /Windows 11 Pro/);
  assert.match(psOut("Get-Process"), /WindowsTerminal/);
  assert.match(psOut("Get-Service"), /Windows Update/);
  assert.match(psOut("Get-LocalUser"), /LocalAdmin/);
  assert.match(psOut("Get-LocalGroupMember Administrators"), /Administrator/);
  assert.match(psOut("ping 8.8.8.8"), /Received = 4/);
  assert.match(psOut("No-Such-Cmdlet"), /CommandNotFoundException/);
  vm.ssid = "";
  assert.match(cmdOut("ping 8.8.8.8"), /General failure/);
  assert.match(cmdOut("nslookup microsoft.com"), /Can't find server address/);
  vm.ssid = "Practice-Corp";

  w.S.portal = "vm"; w.S.page = "d3";
  const css = fs.readFileSync(path.join(root, "css", "app.css"), "utf8");
  assert.match(css, /\.tag\.ad/);
  assert.match(css, /\.vmside/);
  const page = w.vmPage();
  assert.match(page, /Windows Terminal command guide/);
  assert.match(page, /vmcredentials/);
  assert.match(page, /vmstatus/);
  assert.doesNotMatch(page, /Command Prompt<\/span><code>whoami/);
  w.A.vmToggleGuide();
  assert.match(w.vmPage(), /<code>whoami<\/code>/);
  assert.match(w.desktopHtml(supportPc), /File Explorer/);
  assert.match(w.desktopHtml(supportPc), /Windows Terminal/);
  assert.match(w.terminalHtml(supportPc), /Windows PowerShell/);
  assert.match(w.explorerHtml(supportPc), /This PC/);
  w.A.vmExplorerGo({ path: "C:\\" });
  assert.match(w.explorerHtml(supportPc), /Windows/);
  assert.doesNotMatch(w.explorerHtml(supportPc), /ProgramData/);
  w.A.vmExplorerToggle({ k: "hidden" });
  assert.match(w.explorerHtml(supportPc), /ProgramData/);
  w.A.vmExplorerGo({ path: "Documents" });
  assert.equal(vm.explorerPath, "Documents");
  const beforeDelete = vm.files.length;
  w.A.vmFileDelete({ id: "f2" });
  assert.equal(vm.files.length, beforeDelete - 1);
  supportPc.driveMapped = true;
  w.A.vmExplorerGo({ path: "This PC" });
  assert.match(w.explorerHtml(supportPc), /Finance \(F:\)/);

  console.log("browser smoke: hybrid missions, scenarios, Windows Terminal, troubleshooting commands, and File Explorer passed");
  dom.window.close();
})();
