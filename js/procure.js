"use strict";
/* =============== PROCUREMENT + STAGING BENCH ===============
   The learner orders new devices, receives them on the bench by typing the serial
   from the box label, and clears requests that the order itself raises.
   Devices made here live in S.procure.devs, NOT in S.devices: they only appear in
   AD, Entra, Intune and the remote console once they are imaged (a later update). */
var PMODELS={
  laptop:[["Dell","Latitude 5440"],["Lenovo","ThinkPad E14"],["HP","EliteBook 840 G10"]],
  desktop:[["Dell","OptiPlex 7010 Tower"],["Lenovo","ThinkCentre M70t"],["HP","EliteDesk 800 G9 Tower"]],
  monitor:[["Dell","P2423 24-inch"],["HP","E24 G5 24-inch"]]
};
function pBlank(){return {n:0,t:1100,tab:"order",form:{type:"",model:0,mon:1,monModel:0,user:""},devs:[],reqs:[]};}
function P(){if(!S.procure){S.procure=pBlank();}return S.procure;}
function pDev(id){return P().devs.filter(function(d){return d.id===id;})[0];}
function pSerial(n,pre){var x=48210+n*97;return pre+String(x).slice(-5)+String.fromCharCode(65+(n*7)%26);}
function pTag(n){return "APL-"+("000"+n).slice(-4);}
function pLabel(d){return d.maker+" "+d.model;}
function pUserName(id){var u=id?U(id):null;return u?u.name:"Unassigned";}
function pMonitor(k,n){var m=PMODELS.monitor[k]||PMODELS.monitor[0];return {maker:m[0],model:m[1],serial:pSerial(n,"MN")};}
function pOpenReqs(){return P().reqs.filter(function(r){return !pReqDone(r);}).length;}
function pBenchCount(){return P().devs.filter(function(d){return d.stage==="received";}).length;}

/* Rules that raise a request. Deterministic: the same order always raises the same requests. */
function pRaise(d){
  var p=P();
  if(d.type==="desktop"&&!d.monitors.length){
    p.reqs.push({id:"r"+(p.reqs.length+1),no:p.t++,kind:"nomon",dev:d.id,title:"Desktop ordered with no monitor",
      body:"Order "+d.tag+" is a desktop tower with no display. Nobody can image or use it without one. Add a monitor to the order."});
  }
  var has=d.user?S.devices.filter(function(x){return x.userId===d.user&&x.state==="enrolled";})[0]:null;
  if(d.type==="laptop"&&has){
    p.reqs.push({id:"r"+(p.reqs.length+1),no:p.t++,kind:"dup",dev:d.id,title:pUserName(d.user)+" already has a managed laptop",
      body:pUserName(d.user)+" already has "+has.name+" enrolled in Intune. Decide: is this a replacement (keep the order) or a mistake (cancel it)?"});
  }
}
function pReqDone(r){
  var d=pDev(r.dev);
  if(r.kind==="nomon"){return !d||d.stage==="cancelled"||d.monitors.length>0;}
  if(r.kind==="dup"){return !!r.choice;}
  return false;
}

/* ---------- pages ---------- */
function pTabs(){
  var p=P(),o=pOpenReqs();p.tab=S.page;
  function t(k,l,extra){return '<button type="button" data-spot="'+esc(l)+'" class="'+((S.page===k||(k==="bench"&&S.page==="image"))?'on':'')+'" data-a="pTab" data-k="'+k+'">'+esc(l)+(extra||"")+'</button>';}
  return '<div class="ptop"><b>Procurement</b><span class="pcsub">Vendor portal (simulated)</span><nav>'+t("order","New order")+t("bench","Orders and bench",pBenchCount()?' <i>'+pBenchCount()+'</i>':"")+t("reqs","Requests",o?' <i class="hot">'+o+'</i>':"")+'</nav></div>';
}
function pTypeCard(k,label,sub,on,off){
  return '<button type="button" data-spot="'+esc(label)+'" class="ptype'+(on?' on':'')+(off?' off':'')+'" data-a="'+(off?'pSoon':'pType')+'" data-k="'+k+'"'+(on?' aria-pressed="true"':'')+'><span class="pic pic-'+k+'" aria-hidden="true"></span><b>'+esc(label)+'</b><small>'+esc(sub)+'</small>'+(off?'<em>Coming soon</em>':'')+'</button>';
}
function pChips(list,sel,act,fmt){
  return '<div class="pchips">'+list.map(function(m,i){return '<button type="button" class="'+(sel===i?'on':'')+'" data-a="'+act+'" data-k="'+i+'">'+esc(fmt?fmt(m):m[0]+" "+m[1])+'</button>';}).join("")+'</div>';
}
function pOrderForm(){
  var f=P().form,h="";
  if(!f.type){return '<p class="pnote">Choose what kind of device you are ordering.</p>';}
  h+='<div class="pcfg"><h3>'+(f.type==="laptop"?"Laptop":"Desktop")+' model</h3>'+pChips(PMODELS[f.type],f.model,"pModel");
  if(f.type==="desktop"){
    h+='<h3>Monitors</h3>'+pChips([0,1,2],f.mon,"pMon",function(n){return n+(n===1?" monitor":" monitors");});
    if(f.mon>0){h+='<h3>Monitor model</h3>'+pChips(PMODELS.monitor,f.monModel,"pMonModel");}
  }
  h+='<h3>Assign to</h3><select data-ch="pUser" aria-label="Assign to"><option value="">Nobody yet (spare)</option>'+S.users.filter(function(u){return !u.deleted;}).map(function(u){return '<option value="'+u.id+'"'+(f.user===u.id?' selected':'')+'>'+esc(u.name)+'</option>';}).join("")+'</select></div>';
  var m=PMODELS[f.type][f.model];
  h+='<aside class="psum"><h3>Order summary</h3><dl><dt>Device</dt><dd>'+esc(m[0]+" "+m[1])+'</dd>'+(f.type==="desktop"?'<dt>Monitors</dt><dd>'+(f.mon?f.mon+" x "+esc(PMODELS.monitor[f.monModel].join(" ")):"None")+'</dd>':'')+'<dt>Assigned to</dt><dd>'+esc(pUserName(f.user))+'</dd></dl><button type="button" class="pbtn pri" data-a="pOrder">Place order</button></aside>';
  return h;
}
PAGES["procure.order"]=function(){
  var f=P().form;
  return '<div class="pc">'+pTabs()+'<div class="pbody"><h2>New device order</h2><div class="ptypes">'+pTypeCard("laptop","Laptop","Windows laptop for a person",f.type==="laptop")+pTypeCard("desktop","Desktop","Tower plus monitors",f.type==="desktop")+pTypeCard("phone","Phone","Mobile device",false,true)+'</div><div class="porder">'+pOrderForm()+'</div></div></div>';
};
function pRow(d){
  var st=d.stage==="ordered"?'<span class="pst warn">Shipped. Receive it</span>':d.stage==="received"?'<span class="pst ok">On the staging bench</span>':d.stage==="imaged"?'<span class="pst ok">'+(d.agent?"Imaged, agent installed":"Imaged")+'</span>':'<span class="pst">Cancelled</span>';
  var act="";
  if(d.stage==="ordered"){act='<span class="pbox">Box label: <code>'+esc(d.serial)+'</code></span><input type="text" id="ps-'+d.id+'" data-enter="pReceive" data-id="'+d.id+'" placeholder="Type the serial" aria-label="Serial for '+esc(d.tag)+'" autocomplete="off"><button type="button" class="pbtn" data-a="pReceive" data-id="'+d.id+'">Receive</button>';}
  else if(d.stage==="received"){act='<button type="button" class="pbtn pri" data-a="pImgStart" data-id="'+d.id+'">'+(d.img&&d.img.step!=="cables"?"Continue imaging":"Start imaging")+'</button>';}
  else if(d.stage==="imaged"&&!d.agent){act='<button type="button" class="pbtn pri" data-a="pAgent" data-id="'+d.id+'">Install the support agent</button><span class="pnote">Windows is installed. Nothing sees this device yet.</span>';}
  else if(d.stage==="imaged"){act='<button type="button" class="pbtn" data-a="go" data-p="remote" data-pg="console">Open Remote support</button><button type="button" class="pbtn" data-a="go" data-p="vm" data-pg="'+d.id+'">Open the device</button>';}
  var mons=d.monitors.length?'<div class="pmons">'+d.monitors.map(function(m){return '<span>Monitor: '+esc(m.maker+" "+m.model)+' <code>'+esc(m.serial)+'</code></span>';}).join("")+'</div>':(d.type==="desktop"&&d.stage!=="cancelled"?'<div class="pmons bad">No monitor on this order</div>':'');
  return '<div class="prow"><div class="pmain"><b>'+esc(d.tag)+'</b> '+esc(pLabel(d))+' <span class="ptag">'+(d.type==="laptop"?"Laptop":"Desktop")+'</span><div class="psmall">For '+esc(pUserName(d.user))+(d.stage!=="ordered"?' &middot; serial <code>'+esc(d.serial)+'</code>':'')+'</div>'+mons+'</div><div class="pstat">'+st+'</div><div class="pact">'+act+'</div></div>';
}
PAGES["procure.bench"]=function(){
  var p=P(),h=p.devs.length?p.devs.map(pRow).join(""):'<p class="pnote">Nothing ordered yet. Place an order on the New order tab.</p>';
  return '<div class="pc">'+pTabs()+'<div class="pbody"><h2>Orders and staging bench</h2><p class="pnote">Ordered devices arrive in a box. Check the serial on the box label against the order before it goes on the bench.</p>'+h+'</div></div>';
};
PAGES["procure.reqs"]=function(){
  var p=P(),h=p.reqs.length?p.reqs.slice().reverse().map(function(r){
    var done=pReqDone(r),d=pDev(r.dev),act="";
    if(!done&&r.kind==="nomon"&&d){act='<button type="button" class="pbtn pri" data-a="pAddMon" data-id="'+d.id+'">Add a monitor to the order</button>';}
    if(!done&&r.kind==="dup"){act='<button type="button" class="pbtn pri" data-a="pDup" data-id="'+r.id+'" data-k="keep">Replacement: keep the order</button><button type="button" class="pbtn" data-a="pDup" data-id="'+r.id+'" data-k="cancel">Mistake: cancel the order</button>';}
    return '<div class="prow req'+(done?' done':'')+'"><div class="pmain"><b>#'+r.no+' '+esc(r.title)+'</b><div class="psmall">'+esc(r.body)+'</div>'+(done&&r.choice?'<div class="psmall">Resolved: '+(r.choice==="keep"?"kept as a replacement":"order cancelled")+'</div>':'')+'</div><div class="pstat">'+(done?'<span class="pst ok">Resolved</span>':'<span class="pst warn">Open</span>')+'</div><div class="pact">'+act+'</div></div>';
  }).join(""):'<p class="pnote">No requests. Orders that look wrong raise one here, for example a desktop with no monitor.</p>';
  return '<div class="pc">'+pTabs()+'<div class="pbody"><h2>Requests</h2>'+h+'</div></div>';
};

/* ---------- actions ---------- */
A.pTab=function(d){P().tab=d.k;S.page=d.k;};
A.pType=function(d){var f=P().form;f.type=d.k;f.model=0;S.page="order";P().tab="order";};
A.pSoon=function(){toast("Phones are coming soon. Order a laptop or a desktop for now.");};
A.pModel=function(d){P().form.model=+d.k;};
A.pMon=function(d){P().form.mon=+d.k;};
A.pMonModel=function(d){P().form.monModel=+d.k;};
A.pUser=function(d,el){P().form.user=el.value;};
A.pOrder=function(){
  var p=P(),f=p.form;if(!f.type){return;}
  var m=PMODELS[f.type][f.model];p.n+=1;
  var dev={id:"p"+p.n,type:f.type,maker:m[0],model:m[1],tag:pTag(p.n),serial:pSerial(p.n,f.type==="laptop"?"LP":"DT"),user:f.user||null,monitors:[],stage:"ordered"};
  if(f.type==="desktop"){for(var i=0;i<f.mon;i++){dev.monitors.push(pMonitor(f.monModel,p.n*10+i));}}
  p.devs.push(dev);pRaise(dev);
  p.form={type:"",model:0,mon:1,monModel:0,user:""};p.tab="bench";S.page="bench";
  var o=p.reqs.filter(function(r){return r.dev===dev.id;}).length;
  toast("Ordered "+dev.tag+". It has shipped."+(o?" The order raised a request. Check the Requests tab.":""));
};
A.pReceive=function(d,el){
  var dev=pDev(d.id||(el&&el.getAttribute("data-id")));if(!dev||dev.stage!=="ordered"){return;}
  var inp=document.getElementById("ps-"+dev.id),v=((inp&&inp.value)||"").trim().toUpperCase();
  if(!v){toast("Type the serial number from the box label first.");return;}
  if(v!==dev.serial){toast("That serial does not match the order. Check the box label again.");return;}
  dev.stage="received";toast(dev.tag+" is on the staging bench.");
};
A.pAddMon=function(d){var dev=pDev(d.id);if(!dev){return;}dev.monitors.push(pMonitor(0,P().n*10+dev.monitors.length+5));toast("Monitor added to "+dev.tag+".");};
A.pDup=function(d){
  var r=P().reqs.filter(function(x){return x.id===d.id;})[0];if(!r){return;}
  r.choice=d.k;if(d.k==="cancel"){var dev=pDev(r.dev);if(dev){dev.stage="cancelled";}}
};

/* =============== IMAGING ===============
   Connect cables, power on, press F12 for the one-time boot menu, pick a method,
   then finish the install. Wrong choices fail the way a real bench does. */
var IMG_PORTS={power:"Power",net:"Network cable (Ethernet)",mon:"Monitor (DisplayPort)",kbd:"Keyboard and mouse (USB)",usb:"USB installer stick"};
var IMG_TS=[["win11","Win11 Pro Practice (corporate image)",true],["win10","Win10 Legacy Image",false],["pe","WinPE Diagnostics",false]];
function pImg(d){if(!d.img){d.img={step:"cables",cab:{},msg:"",parts:null,sel:0,ts:""};}return d.img;}
function pImgPorts(d){return d.type==="desktop"?["power","net","mon","kbd","usb"]:["power","net","usb"];}
function pImgDev(){var id=P().imgId;return id?pDev(id):null;}
function pStepper(d){
  var st={cables:1,post:2,menu:3,pxe:3,bios:3,setup:4,install:4,done:5}[pImg(d).step]||1;
  return '<ol class="pstep">'+["Connect","Power on","Boot menu","Install","Done"].map(function(l,i){return '<li class="'+(i+1===st?'on':i+1<st?'ok':'')+'">'+l+'</li>';}).join("")+'</ol>';
}
function pScr(inner){return '<div class="pscr">'+inner+'</div>';}
function pKey(label,a,extra){return '<button type="button" class="pkey" data-a="'+a+'"'+(extra||"")+'>'+esc(label)+'</button>';}
function pImgBody(d){
  var g=pImg(d),h="",m=g.msg?'<div class="pmsg" role="alert">'+esc(g.msg)+'</div>':"";
  if(g.step==="cables"){
    h='<p>Place the '+(d.type==="desktop"?"tower":"laptop")+' on the bench and connect what you need. You do not need everything for every method: think about what each way of imaging uses.</p><div class="pports">'+pImgPorts(d).map(function(k){
      var on=g.cab[k],dis=(k==="mon"&&!d.monitors.length);
      return '<button type="button" class="pport'+(on?' on':'')+'" data-a="pCable" data-k="'+k+'" data-spot="'+esc(k==="usb"?"USB installer":IMG_PORTS[k].split(" ")[0])+'"'+(dis?' disabled':'')+'><b>'+esc(IMG_PORTS[k])+'</b><span>'+(dis?"No monitor on this order":on?"Connected. Click to unplug":"Not connected")+'</span></button>';}).join("")+'</div>'+m+
      '<div class="pbtns"><button type="button" class="pbtn pri" data-a="pPower">Power on</button></div>';
  }else if(g.step==="post"){
    h=pScr('<div class="pbig">DELL</div><p>Preparing one-time boot menu...</p><p class="dim">Press the key you need now. Do nothing and it boots from the internal disk.</p>')+'<div class="pkeys">'+pKey("F2 (BIOS setup)","pKey",' data-k="f2" data-spot="F2"')+pKey("F12 (one-time boot menu)","pKey",' data-k="f12" data-spot="F12"')+pKey("Press nothing","pKey",' data-k="none"')+'</div>'+m;
  }else if(g.step==="menu"){
    var mm=[["win","Windows Boot Manager"],["usb","UEFI: USB device"],["nic4","Onboard NIC (IPV4)"],["nic6","Onboard NIC (IPV6)"]];
    h=pScr('<div class="dim">Boot mode is set to: UEFI; Secure Boot: ON; PTT is ON</div><div class="pmh">UEFI BOOT:</div>'+mm.map(function(x){return '<button type="button" class="pitem" data-a="pBoot" data-k="'+x[0]+'">'+esc(x[1])+'</button>';}).join("")+'<div class="pmh">OTHER OPTIONS:</div>'+[["bios","BIOS Setup"],["diag","Diagnostics"],["exit","Exit Boot Menu and Continue"]].map(function(x){return '<button type="button" class="pitem" data-a="pBoot" data-k="'+x[0]+'">'+esc(x[1])+'</button>';}).join(""))+m;
  }else if(g.step==="bios"){
    var dr=g.draft;
    h=pScr('<div class="pmh">BIOS Setup &gt; General &gt; Boot Sequence</div><div class="dim">Boot mode: UEFI. Secure Boot: On. Check the devices to boot from, and put them in order.</div><table class="ptab"><tr><th>Order</th><th>On</th><th>Boot option</th><th></th></tr>'+dr.order.map(function(k,i){return '<tr><td>'+(i+1)+'</td><td><label><input type="checkbox" data-a="pBiosTog" data-k="'+k+'"'+(dr.on[k]?' checked':'')+' aria-label="'+esc(BIOS_ITEMS[k])+'"></label></td><td>'+esc(BIOS_ITEMS[k])+'</td><td><button type="button" class="pkey" data-a="pBiosMove" data-k="'+k+'" data-dir="-1" aria-label="Move '+esc(BIOS_ITEMS[k])+' up">Up</button> <button type="button" class="pkey" data-a="pBiosMove" data-k="'+k+'" data-dir="1" aria-label="Move '+esc(BIOS_ITEMS[k])+' down">Down</button></td></tr>';}).join("")+'</table>'+(g.applied?'<p class="dim">Changes applied.</p>':""))+m+
      '<div class="pbtns"><button type="button" class="pbtn pri" data-a="pBiosApply">Apply Changes</button><button type="button" class="pbtn" data-a="pBiosExit">Exit</button></div>';
  }else if(g.step==="pxe"){
    h=pScr('<div class="pmh">Network boot: Task sequence selection</div><div class="dim">Pick the image for this device.</div>'+IMG_TS.map(function(x){return '<button type="button" class="pitem'+(g.ts===x[0]?' on':'')+'" data-a="pTs" data-k="'+x[0]+'">'+esc(x[1])+'</button>';}).join(""))+m+'<div class="pbtns"><button type="button" class="pbtn pri" data-a="pPxeGo">Deploy</button></div>';
  }else if(g.step==="setup"){
    var ps=g.parts;
    h=pScr('<div class="pmh">Windows Setup: Where do you want to install Windows?</div><table class="ptab"><tr><th>Name</th><th>Total size</th><th>Type</th></tr>'+ps.map(function(x,i){return '<tr class="'+(g.sel===i?'sel':'')+'" data-a="pPart" data-k="'+i+'"><td>'+esc(x.n)+'</td><td>'+esc(x.s)+'</td><td>'+esc(x.t)+'</td></tr>';}).join("")+'</table>')+
      '<div class="pbtns"><button type="button" class="pbtn" data-a="pDelPart">Delete</button><button type="button" class="pbtn pri" data-a="pSetupNext">Next</button></div>'+m;
  }else if(g.step==="install"){
    h=pScr('<div class="pmh">Installing Windows 11 Pro</div><div class="pbar"><i style="width:'+g.prog+'%"></i></div><p class="dim">'+esc(["Copying files","Installing features","Installing updates","Finishing up"][Math.min(3,Math.floor(g.prog/26))])+' ('+g.prog+'%)</p>')+'<div class="pbtns"><button type="button" class="pbtn pri" data-a="pInstall">'+(g.prog<100?"Let it run":"Restart")+'</button></div>';
  }else if(g.step==="done"){
    var oem=g.method==="Autopilot"?"The disk still held the vendor's Windows, so it booted to setup. This serial is registered in Autopilot, so setup will ask for a work account. Open the device to go through it.":g.method==="OEM"?"The disk still held the vendor's Windows, so it booted to the standard setup. This serial is not registered in Autopilot, so nothing will configure it automatically. Register it in Intune first for zero-touch, or image it by USB or PXE.":"Windows is installed on "+esc(d.tag)+". It is not joined, not managed, and nothing can see it yet.";
    h='<div class="pmsg ok">'+esc(oem)+'</div><p>Next: install the support agent so the device can be reached remotely.</p><div class="pbtns"><button type="button" class="pbtn pri" data-a="pBackBench">Back to the bench</button></div>';
  }
  return h;
}
PAGES["procure.image"]=function(){
  var d=pImgDev();
  if(!d){S.page="bench";return PAGES["procure.bench"]();}
  var g=pImg(d);
  return '<div class="pc">'+pTabs()+'<div class="pbody"><h2>Imaging '+esc(d.tag)+' <small>'+esc(pLabel(d))+' ('+(d.type==="desktop"?"desktop":"laptop")+')</small></h2>'+pStepper(d)+'<div class="pimg">'+pImgBody(d)+'</div>'+(g.step!=="done"?'<div class="pbtns"><button type="button" class="pbtn" data-a="pBackBench">Back to the bench</button></div>':'')+'</div></div>';
};
function pFail(g,msg,step){g.msg=msg;if(step){g.step=step;}}
A.pImgStart=function(d){var dev=pDev(d.id);if(!dev){return;}P().imgId=dev.id;pImg(dev);S.page="image";};
A.pBackBench=function(){S.page="bench";};
A.pCable=function(d){var dev=pImgDev();if(!dev){return;}var g=pImg(dev);g.cab[d.k]=!g.cab[d.k];g.msg="";};
A.pPower=function(){
  var dev=pImgDev(),g=pImg(dev),need=dev.type==="desktop"?["power","mon","kbd"]:["power"];
  var miss=need.filter(function(k){return !g.cab[k];});
  if(miss.length){g.msg="Nothing happens or you cannot see it. Still to connect: "+miss.map(function(k){return IMG_PORTS[k];}).join(", ")+".";return;}
  g.msg="";g.step="post";
};
var BIOS_ITEMS={win:"Windows Boot Manager",usb:"UEFI: USB device",nic4:"Onboard NIC (IPV4)",nic6:"Onboard NIC (IPV6)"};
function pBios(g){if(!g.bios){g.bios={order:["win","usb","nic4","nic6"],on:{win:true,usb:true,nic4:true,nic6:true}};}return g.bios;}
/* Try to boot one device. Returns true when it started something; otherwise sets g.msg. */
function pTryBoot(dev,g,k){
  if(k==="win"){return pOem(dev,g);}
  if(k==="usb"){
    if(!g.cab.usb){g.msg="No USB boot device found. Is the installer stick plugged in?";return false;}
    g.parts=[{n:"Drive 0 Partition 1: Recovery",s:"1.0 GB",t:"Recovery"},{n:"Drive 0 Partition 2: System",s:"100.0 MB",t:"System"},{n:"Drive 0 Partition 3: Primary",s:"475.8 GB",t:"Primary"}];g.sel=0;g.step="setup";g.msg="";return true;
  }
  if(k==="nic4"){
    if(!g.cab.net){g.msg="PXE-E61: Media test failure, check cable. Connect the network cable and try again.";return false;}
    g.ts="";g.step="pxe";g.msg="";return true;
  }
  g.msg="PXE over IPv6 is not served on this network. Use the IPv4 entry.";return false;
}
/* The disk still holds the vendor's Windows. Booting it starts out-of-box setup (OOBE). */
function pOem(dev,g){
  var reg=S.devices.filter(function(x){return x.serial===dev.serial&&x.autopilot;})[0];
  g.msg="";g.step="done";dev.stage="imaged";
  if(reg){g.method="Autopilot";dev.imgMethod="Autopilot";dev.devId=reg.id;reg.fromBench=true;reg.kind=dev.type;reg.maker=dev.maker;reg.model=dev.model;}
  else{g.method="OEM";dev.imgMethod="OEM Windows";}
  dev.os="Windows 11 Pro";return true;
}
function pNormalBoot(dev,g){
  var b=pBios(g),i,k;g.msg="";
  for(i=0;i<b.order.length;i++){k=b.order[i];if(b.on[k]&&pTryBoot(dev,g,k)){if(k==="usb"||k==="nic4"){g.viaBios=true;}return;}}
  g.msg="No bootable device found. Check the boot order in BIOS, or press F12 for the boot menu."+(g.msg?" ("+g.msg+")":"");g.step="cables";
}
A.pKey=function(d){
  var dev=pImgDev(),g=pImg(dev);g.msg="";
  if(d.k==="f12"){g.step="menu";}
  else if(d.k==="f2"){pBios(g);g.draft={order:g.bios.order.slice(),on:JSON.parse(JSON.stringify(g.bios.on))};g.step="bios";}
  else{pNormalBoot(dev,g);}
};
A.pBoot=function(d){
  var dev=pImgDev(),g=pImg(dev);g.msg="";
  if(d.k==="win"||d.k==="usb"||d.k==="nic4"||d.k==="nic6"){pTryBoot(dev,g,d.k);}
  else if(d.k==="bios"){pBios(g);g.draft={order:g.bios.order.slice(),on:JSON.parse(JSON.stringify(g.bios.on))};g.step="bios";}
  else if(d.k==="diag"){g.msg="Hardware diagnostics passed. Nothing is installed yet.";}
  else{pNormalBoot(dev,g);}
};
A.pBiosTog=function(d){var g=pImg(pImgDev());g.draft.on[d.k]=!g.draft.on[d.k];g.msg="";};
A.pBiosMove=function(d){
  var g=pImg(pImgDev()),o=g.draft.order,i=o.indexOf(d.k),j=i+(+d.dir);g.msg="";
  if(i<0||j<0||j>=o.length){return;}
  var t=o[i];o[i]=o[j];o[j]=t;
};
A.pBiosApply=function(){var g=pImg(pImgDev());g.bios={order:g.draft.order.slice(),on:JSON.parse(JSON.stringify(g.draft.on))};g.msg="";g.applied=true;};
A.pBiosExit=function(){
  var dev=pImgDev(),g=pImg(dev),b=pBios(g),dirty=JSON.stringify(b.order)!==JSON.stringify(g.draft.order)||JSON.stringify(b.on)!==JSON.stringify(g.draft.on);
  if(dirty){g.msg="You changed settings but did not choose Apply Changes. Apply them first, or exit and lose them.";g.confirmExit=true;if(g.exitTwice){g.exitTwice=false;g.confirmExit=false;g.msg="";g.draft=null;pNormalBoot(dev,g);}else{g.exitTwice=true;}return;}
  g.exitTwice=false;g.draft=null;pNormalBoot(dev,g);
};
A.pTs=function(d){pImg(pImgDev()).ts=d.k;};
A.pPxeGo=function(){
  var g=pImg(pImgDev());if(!g.ts){g.msg="Pick a task sequence first.";return;}
  if(g.ts==="win11"){g.msg="";g.step="install";g.prog=0;g.method="PXE";}
  else if(g.ts==="win10"){g.msg="That is the old Windows 10 image. This device needs the Windows 11 corporate image.";}
  else{g.msg="WinPE booted and ran diagnostics. It did not install Windows. Pick the Windows 11 task sequence.";}
};
A.pPart=function(d){pImg(pImgDev()).sel=+d.k;};
A.pDelPart=function(){
  var g=pImg(pImgDev()),x=g.parts[g.sel];g.msg="";
  if(!x){return;}
  if(x.t==="Unallocated"){g.msg="Unallocated space cannot be deleted.";return;}
  g.parts.splice(g.sel,1);
  if(!g.parts.some(function(q){return q.t!=="Unallocated";})){g.parts=[{n:"Drive 0 Unallocated Space",s:"476.9 GB",t:"Unallocated"}];}
  g.sel=0;
};
A.pSetupNext=function(){
  var g=pImg(pImgDev()),x=g.parts[g.sel];
  if(!x){return;}
  if(x.t!=="Unallocated"){g.msg="Windows cannot be installed here: the disk still has old partitions from the vendor. Delete them all, then select the unallocated space.";return;}
  g.msg="";g.step="install";g.prog=0;g.method="USB";
};
A.pInstall=function(){
  var dev=pImgDev(),g=pImg(dev);
  if(g.prog<100){g.prog=Math.min(100,g.prog+34);return;}
  g.step="done";dev.stage="imaged";dev.os="Windows 11 Pro";dev.imgMethod=g.method;
};
A.pAgent=function(d){
  var dev=pDev(d.id);if(!dev||dev.stage!=="imaged"||dev.agent){return;}
  dev.agent=true;
  var link=dev.devId?D(dev.devId):null;
  if(link){link.agent=true;toast((link.name==="(not set up)"?compNameFor(link):link.name)+" now reports to Remote support.");return;}
  var rec={id:dev.id,serial:dev.serial,name:"",model:dev.model,maker:dev.maker,os:"Windows 11 Pro",osVer:"10.0.22631",userId:null,state:"unmanaged",baseBitlocker:false,autopilot:false,spare:true,sync:"-",join:"",joinUser:null,fromBench:true,agent:true,kind:dev.type};
  rec.name=compNameFor(rec);S.devices.push(rec);
  toast(rec.name+" now reports to Remote support and can be opened as a device.");
};

/* ---------- ticket checks (used by tickets s12 and s13) ---------- */
function pS12(){
  var ds=P().devs.filter(function(d){return d.type==="desktop"&&d.user==="u4"&&d.stage!=="cancelled"&&d.monitors.length>0;});
  return [["Ordered a desktop with a monitor for Marcus",ds.length>0],["Received it and imaged it",ds.some(function(d){return d.stage==="imaged";})],["Installed the support agent so IT can reach it",ds.some(function(d){return !!d.agent;})]];
}
function pS13(){
  var ds=P().devs.filter(function(d){return d.type==="laptop"&&d.user==="u2"&&d.stage!=="cancelled";});
  var req=P().reqs.filter(function(r){return r.kind==="dup";}),kept=ds.length>0&&req.every(function(r){return r.choice==="keep";});
  return [["Ordered the laptop and kept it as a replacement when the request came up",ds.length>0&&req.length>0&&kept],["Serial registered in Autopilot and booted into Autopilot setup",ds.some(function(d){return d.imgMethod==="Autopilot";})],["Installed the support agent",ds.some(function(d){return !!d.agent;})]];
}
/* Open requests raised by orders, shown in the ticket dock too. */
function pReqDock(){
  var p=S.procure;if(!p||!pOpenReqs()){return "";}
  return '<div class="why"><b>Requests from your orders ('+pOpenReqs()+' open)</b>'+p.reqs.filter(function(r){return !pReqDone(r);}).map(function(r){return '<p>#'+r.no+' '+esc(r.title)+'</p>';}).join("")+'<button type="button" class="btn sm" data-a="go" data-p="procure" data-pg="reqs">Open Requests</button></div>';
}
