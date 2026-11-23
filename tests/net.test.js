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

test("a healthy laptop looks exactly like the lab always showed it", function () {
  const x = laptop(), v = x.w.netView(x.d);
  assert.equal(v.link, true);
  assert.equal(v.ip, x.w.ipFor(x.d));
  assert.equal(v.gw, "192.168.20.1");
  assert.equal(v.dns, "192.168.20.10");
  assert.equal(v.dhcpEnabled, true);
  assert.ok(v.gatewayOk && v.internetOk && v.nameOk);
  assert.equal(x.w.noNetwork(x.d), false);
});

test("no Wi-Fi network means no link, as before", function () {
  const x = laptop(); x.d.vm.ssid = "";
  assert.equal(x.w.noNetwork(x.d), true);
  assert.equal(x.w.netView(x.d).gatewayOk, false);
});

test("each laptop has its own MAC address", function () {
  const w = boot();
  assert.notEqual(w.macFor(w.D("d1")), w.macFor(w.D("d3")));
  assert.match(w.macFor(w.D("d3")), /^([0-9A-F]{2}-){5}[0-9A-F]{2}$/);
});

test("a static address on another network has DHCP off and cannot reach the gateway", function () {
  const x = laptop(); Object.assign(x.n, { mode: "static", sIp: "192.168.1.50", sMask: "255.255.255.0", sGw: "192.168.1.1", dnsMode: "manual", dnsManual: "192.168.1.1" });
  const v = x.w.netView(x.d);
  assert.equal(v.dhcpEnabled, false);
  assert.equal(v.ip, "192.168.1.50");
  assert.equal(v.gatewayOk, false);
  assert.equal(v.nameOk, false);
});

test("a static address on the right network with no gateway cannot leave the subnet", function () {
  const x = laptop(); Object.assign(x.n, { mode: "static", sIp: "192.168.20.77", sMask: "255.255.255.0", sGw: "", dnsMode: "manual", dnsManual: "192.168.20.10" });
  const v = x.w.netView(x.d);
  assert.equal(v.gw, "");
  assert.equal(v.gatewayOk, false);
  assert.equal(v.internetOk, false);
});

test("DHCP with no lease lands on 169.254 with a blank gateway", function () {
  const x = laptop(); x.n.lease = null;
  const v = x.w.netView(x.d);
  assert.match(v.ip, /^169\.254\./);
  assert.equal(v.auto, true);
  assert.equal(v.gw, "");
  assert.equal(v.dhcpEnabled, true);
  assert.equal(v.gatewayOk, false);
});

test("a driver error or a missing driver takes the link down", function () {
  const x = laptop();
  x.n.driver = "error43"; assert.equal(x.w.netView(x.d).link, false);
  x.n.driver = "missing"; assert.equal(x.w.netView(x.d).present, false);
  x.n.driver = "ok"; x.n.adapterOn = false; assert.equal(x.w.netView(x.d).link, false);
  x.n.adapterOn = true; x.n.driver = "outdated"; assert.equal(x.w.netView(x.d).link, true, "an old driver still works");
});

test("the ping ladder: gateway, then the internet, then names", function () {
  const x = laptop(), n = x.n, V = function () { return x.w.netView(x.d); };
  n.env.ssidOk = false; assert.equal(V().gatewayOk, false, "wrong VLAN or SSID: no gateway");
  n.env.ssidOk = true; n.vpn = "broken"; assert.ok(V().gatewayOk); assert.equal(V().internetOk, false, "broken VPN: gateway only");
  n.vpn = "ok"; assert.ok(V().internetOk);
  n.dnsMode = "manual"; n.dnsManual = "10.99.99.9"; assert.ok(V().internetOk); assert.equal(V().nameOk, false, "wrong DNS server: no names");
  n.dnsMode = "auto"; n.env.dnsOk = false; assert.equal(V().nameOk, false, "DNS server down: no names");
  n.env.dnsOk = true; assert.ok(V().nameOk);
});

test("network state is isolated with the ticket and comes back when the ticket is left", function () {
  const w = boot(); w.S.onboarded = true;
  const d = w.D("d3"); w.ensureVm(d);
  w.A.startScenario({ id: "s1" });
  w.D("d3").vm.net.mode = "static";
  w.A.exitScenario();
  assert.equal(w.D("d3").vm.net.mode, "dhcp");
});

test("netView builds state for a laptop that was saved before this existed", function () {
  const w = boot(); const d = w.D("d3"); w.ensureVm(d); d.vm.net = null; d.vm.ssid = "Practice-Corp";
  assert.equal(w.netView(d).nameOk, true);
  assert.ok(d.vm.net, "state was rebuilt");
});

function admin(x) { x.d.vm.cur = { kind: "local", name: "LocalAdmin" }; return x; }
function run(x, line) { return x.w.runCmd(x.d, line).join("\n"); }
function shell(x, line) { return x.w.runPowerShell(x.d, line).join("\n"); }

test("ipconfig /all on a healthy laptop shows DHCP Enabled Yes, the lease, gateway, DNS and this laptop's MAC", function () {
  const x = laptop(), o = run(x, "ipconfig /all");
  assert.match(o, /DHCP Enabled[. ]+: Yes/);
  assert.ok(o.indexOf("192.168.20.1") > -1 && o.indexOf("192.168.20.10") > -1);
  assert.ok(o.indexOf(x.w.macFor(x.d)) > -1);
  assert.match(o, /DHCP Server/);
});

test("static laptop: DHCP Enabled No, and release/renew say no adapter is in the right state", function () {
  const x = admin(laptop()); Object.assign(x.n, { mode: "static", sIp: "192.168.1.50", sMask: "255.255.255.0", sGw: "192.168.1.1" });
  assert.match(run(x, "ipconfig /all"), /DHCP Enabled[. ]+: No/);
  assert.match(run(x, "ipconfig /release"), /no adapter is in the state permissible/);
  assert.match(run(x, "ipconfig /renew"), /no adapter is in the state permissible/);
});

test("renew with a working DHCP server gives a lease and the pings work", function () {
  const x = admin(laptop()); x.n.lease = { ip: "10.0.5.77", mask: "255.255.255.0", gw: "10.0.5.1", dns: "10.0.5.1" };
  assert.match(run(x, "ping 192.168.20.1"), /Request timed out|unreachable/);
  run(x, "ipconfig /release"); assert.equal(x.n.lease, null);
  const o = run(x, "ipconfig /renew");
  assert.ok(o.indexOf("192.168.20.1") > -1 && /IPv4 Address/.test(o));
  assert.match(run(x, "ping 192.168.20.1"), /Reply from 192\.168\.20\.1: bytes=32/);
  assert.match(run(x, "ping 8.8.8.8"), /Reply from 8\.8\.8\.8: bytes=32/);
  assert.match(run(x, "ping google.com"), /Reply from/);
});

test("DHCP not answering: renew fails and the laptop sits on 169.254, whatever the learner tries", function () {
  const x = admin(laptop()); x.n.env.dhcp = false;
  run(x, "ipconfig /release");
  assert.match(run(x, "ipconfig /renew"), /unable to contact your DHCP server/);
  const o = run(x, "ipconfig /all");
  assert.match(o, /Autoconfiguration IPv4 Address[. ]+: 169\.254\./);
  assert.match(o, /DHCP Enabled[. ]+: Yes/);
  x.n.adapterOn = false; x.n.adapterOn = true; x.n.driver = "ok";
  assert.match(run(x, "ipconfig /renew"), /unable to contact your DHCP server/);
  assert.doesNotMatch(run(x, "ping 192.168.20.1"), /Reply from 192\.168\.20\.1: bytes/);
});

test("release and renew need an administrator session", function () {
  const x = laptop(); x.d.vm.cur = { kind: "local", name: "Student" };
  assert.match(run(x, "ipconfig /renew"), /requires elevation/);
});

test("the ping ladder shows what each failure means", function () {
  const x = laptop();
  assert.match(run(x, "ping 192.168.20.1"), /Received = 4, Lost = 0/);
  x.n.vpn = "broken";
  assert.match(run(x, "ping 192.168.20.1"), /bytes=32/);
  assert.match(run(x, "ping 8.8.8.8"), /Request timed out/);
  x.n.vpn = "off"; x.n.dnsMode = "manual"; x.n.dnsManual = "10.99.99.9";
  assert.match(run(x, "ping 8.8.8.8"), /bytes=32/);
  assert.match(run(x, "ping google.com"), /could not find host google\.com/);
  assert.match(run(x, "nslookup google.com"), /timed out/);
  x.n.dnsMode = "auto";
  assert.match(run(x, "ping google.com"), /bytes=32/);
  assert.match(run(x, "nslookup google.com"), /Non-authoritative answer/);
});

test("a driver error shows Media disconnected and a missing adapter shows no adapter at all", function () {
  const x = laptop(); x.n.driver = "error43";
  assert.match(run(x, "ipconfig /all"), /Media disconnected/);
  assert.match(run(x, "ping 8.8.8.8"), /General failure/);
  x.n.driver = "missing";
  assert.doesNotMatch(run(x, "ipconfig /all"), /Wi-Fi/);
});

test("PowerShell reads the same state as the Command Prompt", function () {
  const x = laptop();
  assert.ok(shell(x, "Get-NetIPConfiguration").indexOf(x.w.ipFor(x.d)) > -1);
  assert.ok(shell(x, "Get-NetAdapter").indexOf(x.w.macFor(x.d)) > -1);
  x.n.lease = null;
  assert.match(shell(x, "Get-NetIPConfiguration"), /169\.254\./);
  x.n.driver = "error43";
  assert.match(shell(x, "Get-NetAdapter"), /Not Present/);
  assert.match(shell(x, "Get-NetIPConfiguration"), /Disconnected/);
  x.n.driver = "ok"; x.n.dnsMode = "manual"; x.n.dnsManual = "10.99.99.9";
  assert.match(shell(x, "Resolve-DnsName google.com"), /DNS server failure/);
  assert.match(shell(x, "Test-Connection 8.8.8.8"), /8\.8\.8\.8/);
});

test("flushdns works and is logged", function () {
  const x = laptop();
  assert.match(run(x, "ipconfig /flushdns"), /Successfully flushed the DNS Resolver Cache/);
  assert.equal(x.n.log.flush, 1);
});

/* ---- screens ---- */
function desk(admin) {
  const x = laptop(), w = x.w;
  w.S.onboarded = true; w.S.portal = "vm"; w.S.page = "d3";
  x.d.vm.stage = "desktop"; x.d.vm.oobe = "done";
  x.d.vm.cur = { kind: "local", name: admin === false ? "Student" : "LocalAdmin" };
  w.render(); return x;
}
function act(x, name, ds) { x.w.A[name](ds || {}); x.w.render(); }
function typeIn(x, key, val) { x.w.S.vmIn[key] = val; }

test("Run opens Network Connections for ncpa.cpl, and says so when a name is not found", function () {
  const x = desk();
  act(x, "vmOpen", { app: "run" });
  assert.ok(x.w.document.querySelector(".runbox"), "Run box shows");
  typeIn(x, "runcmd", "nonsense.msc"); act(x, "vmRunGo");
  assert.match(x.w.document.querySelector(".runbox").textContent, /Windows cannot find 'nonsense\.msc'/);
  typeIn(x, "runcmd", "NCPA.CPL"); act(x, "vmRunGo");
  assert.equal(x.d.vm.app, "ncpa");
  assert.match(x.w.document.querySelector(".ncwin").textContent, /Wi-Fi[\s\S]*Practice-Corp/);
  assert.equal(x.w.document.querySelector(".runbox"), null, "Run box closed");
});

test("the Start menu search opens the same things", function () {
  const x = desk(); act(x, "vmStart");
  typeIn(x, "startq", "network connections"); act(x, "vmStartGo");
  assert.equal(x.d.vm.app, "ncpa");
  assert.equal(x.d.vm.start, false);
});

test("Network Connections lists the adapters and hides the Wi-Fi adapter when its driver is missing", function () {
  const x = desk(); act(x, "vmOpen", { app: "ncpa" });
  let t = x.w.document.querySelector(".nclist").textContent;
  assert.ok(/Wi-Fi/.test(t) && /Network cable unplugged/.test(t) && /Practice VPN/.test(t));
  x.d.vm.net.driver = "missing"; x.w.render();
  t = x.w.document.querySelector(".nclist").textContent;
  assert.ok(!/Intel\(R\) Wi-Fi 6/.test(t));
});

test("fixing a static IP in the IPv4 properties: automatic for both, then the laptop gets a lease", function () {
  const x = desk(); Object.assign(x.d.vm.net, { mode: "static", sIp: "192.168.1.50", sMask: "255.255.255.0", sGw: "192.168.1.1", dnsMode: "manual", dnsManual: "192.168.1.1" });
  act(x, "vmOpen", { app: "ncpa" }); act(x, "ncProps"); act(x, "ncIpv4");
  assert.equal(x.w.document.querySelector('[data-vi="ip"]').value, "192.168.1.50", "the old values are shown");
  act(x, "ncMode", { k: "dhcp" }); act(x, "ncDns", { k: "auto" }); act(x, "ncOk");
  assert.equal(x.d.vm.net.mode, "dhcp");
  assert.equal(x.d.vm.net.dnsMode, "auto");
  assert.match(run(x, "ipconfig /all"), /DHCP Enabled[. ]+: Yes/);
  assert.match(run(x, "ping google.com"), /bytes=32/);
});

test("IPv4 properties reject bad addresses and need an administrator", function () {
  const x = desk(); act(x, "vmOpen", { app: "ncpa" }); act(x, "ncProps"); act(x, "ncIpv4"); act(x, "ncMode", { k: "static" });
  typeIn(x, "ip", "300.1.1.1"); typeIn(x, "mask", "255.255.255.0"); act(x, "ncOk");
  assert.match(x.w.document.querySelector(".ncdlg").textContent, /not valid/);
  assert.equal(x.d.vm.net.mode, "dhcp", "nothing changed");
  const y = desk(false); act(y, "vmOpen", { app: "ncpa" }); act(y, "ncProps"); act(y, "ncIpv4"); act(y, "ncMode", { k: "static" });
  typeIn(y, "ip", "192.168.20.50"); typeIn(y, "mask", "255.255.255.0"); act(y, "ncOk");
  assert.match(y.w.document.querySelector(".ncdlg").textContent, /administrator/);
  assert.equal(y.d.vm.net.mode, "dhcp");
});

test("a blank gateway is allowed in a static setup", function () {
  const x = desk(); act(x, "vmOpen", { app: "ncpa" }); act(x, "ncProps"); act(x, "ncIpv4"); act(x, "ncMode", { k: "static" });
  typeIn(x, "ip", "192.168.20.77"); typeIn(x, "mask", "255.255.255.0"); typeIn(x, "gw", ""); act(x, "ncOk");
  assert.equal(x.d.vm.net.mode, "static");
  assert.match(run(x, "ipconfig /all"), /Default Gateway[. ]+: *\n/);
});

test("Disable then Enable resets a stale lease; a driver error cannot be fixed here", function () {
  const x = desk(); x.d.vm.net.lease = { ip: "10.0.5.77", mask: "255.255.255.0", gw: "10.0.5.1", dns: "10.0.5.1" };
  act(x, "vmOpen", { app: "ncpa" }); act(x, "ncDisable");
  assert.match(run(x, "ipconfig"), /Media disconnected/);
  act(x, "ncEnable");
  assert.equal(x.d.vm.net.lease.ip, x.w.ipFor(x.d));
  x.d.vm.net.driver = "error43"; x.w.render();
  assert.match(x.w.document.querySelector(".nclist").textContent, /Disabled/);
  act(x, "ncEnable");
  assert.match(x.w.document.querySelector(".ncwin").textContent, /Code 43[\s\S]*Device Manager/);
  assert.equal(x.d.vm.net.log.wrongToolNcpa, 1);
});

test("Status shows connectivity and the same details as ipconfig", function () {
  const x = desk(); act(x, "vmOpen", { app: "ncpa" }); act(x, "ncStatus"); act(x, "ncDetails");
  const t = x.w.document.querySelector(".ncdlg").textContent;
  assert.match(t, /IPv4 Connectivity\s*Internet/);
  assert.ok(t.indexOf(x.w.macFor(x.d)) > -1 && t.indexOf("192.168.20.1") > -1);
  x.d.vm.net.vpn = "broken"; x.w.render();
  assert.match(x.w.document.querySelector(".ncdlg").textContent, /No Internet access/);
});

test("Settings shows the real network state and can forget and rejoin Wi-Fi", function () {
  const x = desk(); x.d.vm.app = "settings"; x.d.vm.setPage = "network"; x.w.render();
  assert.match(x.w.document.querySelector(".setbody").textContent, /Automatic \(DHCP\)/);
  act(x, "vmForgetNet");
  assert.equal(x.d.vm.ssid, "");
  assert.match(run(x, "ipconfig"), /Media disconnected/);
  act(x, "vmJoinNet", { s: "Practice-Corp" });
  assert.equal(x.d.vm.ssid, "Practice-Corp");
  assert.match(run(x, "ping 8.8.8.8"), /bytes=32/);
  x.d.vm.net.env.dhcp = false; act(x, "vmForgetNet"); act(x, "vmJoinNet", { s: "Practice-Corp" });
  assert.match(run(x, "ipconfig"), /169\.254\./, "rejoining does not fix a DHCP server that is down");
});

/* ---- Device Manager ---- */
test("devmgmt.msc and Device Manager open from Run and Start, and the adapter shows its status", function () {
  const x = desk(); act(x, "vmOpen", { app: "run" }); typeIn(x, "runcmd", "devmgmt.msc"); act(x, "vmRunGo");
  assert.equal(x.d.vm.app, "devmgr");
  assert.match(x.w.document.querySelector(".dmtree").textContent, /Intel\(R\) Wi-Fi 6 AX201/);
  act(x, "dmSel", { id: "wifi" }); act(x, "dmProps");
  assert.match(x.w.document.querySelector(".ncdlg").textContent, /working properly/);
  x.d.vm.net.driver = "error43"; x.w.render();
  assert.match(x.w.document.querySelector(".ncdlg").textContent, /Code 43/);
  assert.ok(x.w.document.querySelector(".dmrow .warn"), "yellow warning on the broken adapter");
  const y = desk(); act(y, "vmStart"); typeIn(y, "startq", "device manager"); act(y, "vmStartGo");
  assert.equal(y.d.vm.app, "devmgr");
});

test("error 43: settings changes do not help, but Update Driver does", function () {
  const x = desk(); Object.assign(x.d.vm.net, { driver: "error43", driverVer: "22.200.0.1", lease: null });
  act(x, "vmOpen", { app: "ncpa" }); act(x, "ncEnable"); act(x, "ncProps"); act(x, "ncIpv4"); act(x, "ncMode", { k: "dhcp" }); act(x, "ncOk");
  assert.equal(x.w.netView(x.d).link, false, "ncpa cannot fix a driver error");
  assert.match(run(x, "ipconfig"), /Media disconnected/);
  act(x, "vmOpen", { app: "devmgr" }); act(x, "dmUpdate");
  assert.match(x.w.document.querySelector(".ncdlg").textContent, /successfully updated/);
  assert.equal(x.d.vm.net.driver, "ok");
  assert.match(run(x, "ping 8.8.8.8"), /bytes=32/);
});

test("Roll Back Driver is only available when a previous version exists, and fixes a bad new driver", function () {
  const x = desk(); Object.assign(x.d.vm.net, { driver: "error43", driverVer: "22.200.0.1", prevDriver: null });
  act(x, "vmOpen", { app: "devmgr" }); act(x, "dmProps"); act(x, "dmTab", { k: "driver" });
  assert.ok(x.w.document.querySelector('[data-a="dmRollback"]').disabled);
  x.d.vm.net.prevDriver = "22.150.0.3"; x.w.render();
  assert.ok(!x.w.document.querySelector('[data-a="dmRollback"]').disabled);
  act(x, "dmRollback");
  assert.equal(x.d.vm.net.driver, "ok");
  assert.equal(x.d.vm.net.driverVer, "22.150.0.3");
  assert.equal(x.w.netView(x.d).link, true);
});

test("Uninstall Device removes the adapter until Restart, then Windows reinstalls it and DHCP runs", function () {
  const x = desk(); act(x, "vmOpen", { app: "devmgr" }); act(x, "dmSel", { id: "wifi" }); act(x, "dmUninstall"); act(x, "dmUninstallOk");
  assert.equal(x.d.vm.net.driver, "missing");
  assert.equal(x.d.vm.net.restartPending, true);
  act(x, "vmOpen", { app: "ncpa" });
  assert.ok(!/Intel\(R\) Wi-Fi 6/.test(x.w.document.querySelector(".nclist").textContent));
  assert.match(run(x, "ping 8.8.8.8"), /General failure/);
  act(x, "vmRestart");
  assert.equal(x.d.vm.net.restartPending, false);
  assert.equal(x.d.vm.net.driver, "ok");
  assert.equal(x.w.netView(x.d).internetOk, true);
});

test("a laptop whose DHCP server is down still lands on 169.254 after Uninstall and Restart", function () {
  const x = desk(); x.d.vm.net.env.dhcp = false;
  act(x, "vmOpen", { app: "devmgr" }); act(x, "dmUninstall"); act(x, "dmUninstallOk"); act(x, "vmRestart");
  assert.match(x.w.netView(x.d).ip, /^169\.254\./);
});

test("Update Driver on a healthy adapter says the best driver is installed and changes nothing", function () {
  const x = desk(); const before = x.d.vm.net.driverVer; act(x, "vmOpen", { app: "devmgr" }); act(x, "dmUpdate");
  assert.match(x.w.document.querySelector(".ncdlg").textContent, /best drivers for your device are already installed/);
  assert.equal(x.d.vm.net.driverVer, before);
});

test("power management: sleep breaks a laptop that is allowed to power the adapter down, until it is unticked", function () {
  const x = desk(); x.d.vm.net.wakesBroken = true;
  act(x, "vmSleep");
  assert.equal(x.w.netView(x.d).gatewayOk, false, "no lease after waking");
  run(x, "ipconfig /release"); 
  act(x, "vmOpen", { app: "devmgr" }); act(x, "dmProps"); act(x, "dmTab", { k: "power" }); act(x, "dmPower");
  assert.equal(x.d.vm.net.powerSaveOff, true);
  act(x, "vmOpen", { app: "ncpa" }); act(x, "ncDisable"); act(x, "ncEnable");
  act(x, "vmSleep");
  assert.equal(x.w.netView(x.d).internetOk, true, "no longer breaks after sleep");
});

test("changing a device needs an administrator", function () {
  const x = desk(false); x.d.vm.net.driver = "error43";
  act(x, "vmOpen", { app: "devmgr" }); act(x, "dmUpdate");
  assert.match(x.w.document.querySelector(".dmwin").textContent, /administrator/);
  assert.equal(x.d.vm.net.driver, "error43");
});
