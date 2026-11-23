const test=require("node:test"),assert=require("node:assert/strict");
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const files=["state.js","ui.js","rules.js","ad.js","entra.js","m365.js","exchange.js","intune.js","vm.js","net.js","netui.js","devmgr.js","remote.js","procure.js","kb.js","guide.js","shell.js","mobile.js","render.js","analytics.js"];
function lab(){
  const html="<!doctype html><html><head></head><body data-portal=\"m365\"><div id=\"app\"></div><div id=\"intro\"></div><div id=\"pop\" hidden></div><div id=\"modal\" hidden></div><div id=\"toast\" hidden></div>"+
    files.map(n=>"<script>"+fs.readFileSync(path.join(root,"js",n),"utf8").replace(/<\/script/gi,"<\\/script")+"</script>").join("")+"</body></html>";
  const {VirtualConsole}=require("jsdom");
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://admin-practice.test/",pretendToBeVisual:true,virtualConsole:new VirtualConsole(),
    beforeParse:function(w){w.scrollTo=function(){};w.matchMedia=function(){return {matches:false,addEventListener:function(){}};};}});
  return dom.window;
}
function ev(w,code){return w.eval(code);}
function start(w,id){ev(w,'A.startScenario({id:"'+id+'"})');ev(w,'ensureVm(D("d3")).cur={kind:"local",name:"LocalAdmin"}');}
function runC(w,line){return ev(w,'netCmd(D("d3"),'+JSON.stringify(line)+')');}
function doneOf(w,id){return ev(w,'scenarioDone("'+id+'")');}
test("seven interview tickets exist and count toward Level 7",()=>{
  const w=lab();
  assert.equal(ev(w,'SCENARIOS.length'),21);
  const lv=ev(w,'JSON.stringify(levelsView().map(function(L){return [L.n,L.tot]}))');
  const l7=JSON.parse(lv).find(x=>x[0]===7);assert.equal(l7[1],7);
  const l5=JSON.parse(lv).find(x=>x[0]===5);assert.ok(l5[1]>=14);
  assert.equal(ev(w,'levelsView().length'),7);
});
test("none of the seven starts solved",()=>{
  const w=lab();
  ["s15","s16","s17","s18","s19","s20","s21"].forEach(id=>{start(w,id);assert.equal(doneOf(w,id),false,id);ev(w,'A.exitScenario()');});
});
test("s15 static IP: switching to automatic solves it",()=>{
  const w=lab();start(w,"s15");
  assert.match(runC(w,"ipconfig /all").join("\n"),/192\.168\.1\.50/);
  ev(w,'var n=ensureNet(D("d3"));n.mode="dhcp";n.lease=netFreshLease(D("d3"));');
  assert.equal(doneOf(w,"s15"),false);
  ev(w,'ensureNet(D("d3")).dnsMode="auto"');
  assert.equal(doneOf(w,"s15"),true);
});
test("s16 needs evidence in the escalation note",()=>{
  const w=lab();start(w,"s16");
  runC(w,"ipconfig /all");runC(w,"ipconfig /release");runC(w,"ipconfig /renew");
  assert.match(runC(w,"ipconfig").join("\n"),/169\.254/);
  assert.equal(doneOf(w,"s16"),false);
  ev(w,'S.scenarios.notes={s16:"Priya laptop is down"}');
  assert.equal(doneOf(w,"s16"),false);
  const mac=ev(w,'macFor(D("d3"))'),ssid=ev(w,'ensureVm(D("d3")).ssid'),ip=ev(w,'autoIpFor(D("d3"))');
  ev(w,'S.scenarios.notes={s16:'+JSON.stringify("Laptop has "+ip+", DHCP Enabled: Yes, MAC "+mac+", Wi-Fi "+ssid+". I tried release and renew, it failed. Other devices also fail, so passing to the network team.")+'}');
  assert.equal(doneOf(w,"s16"),true);
});
test("s17 driver error 43 needs Device Manager, ncpa gives the hint",()=>{
  const w=lab();start(w,"s17");
  ev(w,'netLog(D("d3"),"wrongToolNcpa")');
  assert.match(ev(w,'netWrongTool("s17")'),/Device Manager/);
  ev(w,'var n=ensureNet(D("d3"));n.prevDriver=n.driverVer;n.driverVer="22.250.0.1";n.driver="ok";n.lease=netFreshLease(D("d3"));');
  assert.equal(doneOf(w,"s17"),true);
});
test("s18 stale lease: renew fixes it",()=>{
  const w=lab();start(w,"s18");
  assert.match(runC(w,"ipconfig /all").join("\n"),/10\.0\.5\.77/);
  runC(w,"ipconfig /release");runC(w,"ipconfig /renew");
  assert.equal(doneOf(w,"s18"),true);
});
test("s19 sleep: turning off power saving is the fix",()=>{
  const w=lab();start(w,"s19");
  runC(w,"ipconfig /renew");
  assert.equal(doneOf(w,"s19"),false,"renew alone is not enough");
  ev(w,'ensureNet(D("d3")).powerSaveOff=true');
  assert.equal(doneOf(w,"s19"),true);
});
test("s20 wrong DNS",()=>{
  const w=lab();start(w,"s20");
  assert.match(runC(w,"ping 8.8.8.8").join("\n"),/Reply from/);
  assert.doesNotMatch(runC(w,"ping google.com").join("\n"),/Reply from/);
  ev(w,'ensureNet(D("d3")).dnsMode="auto"');
  assert.equal(doneOf(w,"s20"),true);
});
test("s21 blank gateway",()=>{
  const w=lab();start(w,"s21");
  assert.equal(doneOf(w,"s21"),false);
  ev(w,'ensureNet(D("d3")).sGw="192.168.20.1"');
  assert.equal(doneOf(w,"s21"),true);
});
test("wrong-tool hint: Device Manager for a settings problem",()=>{
  const w=lab();start(w,"s15");
  ev(w,'netLog(D("d3"),"dmOpen")');
  assert.match(ev(w,'netWrongTool("s15")'),/ncpa\.cpl/);
});
test("leaving a ticket restores the laptop network",()=>{
  const w=lab();
  ev(w,'var b=JSON.stringify(ensureNet(D("d3")).mode)');
  start(w,"s15");ev(w,'A.exitScenario()');
  assert.equal(ev(w,'JSON.stringify(ensureNet(D("d3")).mode)'),ev(w,'b'));
});
