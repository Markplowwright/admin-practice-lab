"use strict";
/* =============== DEVICE MANAGER (virtual laptop) ===============
   Device Manager is for the adapter hardware and its driver: status codes, update, roll back, uninstall and
   power management. Network settings live in Network Connections (netui.js). Both read the same state. */
var DRIVER_NEW="22.220.0.4",DRIVER_BASE="22.150.0.3";
function dmEnsure(v){if(!v.dm){v.dm={sel:"wifi",dlg:null,tab:"general",res:"",msg:""};}return v.dm;}
function dmStatusText(n){
  if(!n.adapterOn){return "This device is disabled. (Code 22)";}
  if(n.driver==="error43"){return "Windows has stopped this device because it has reported problems. (Code 43)";}
  return "This device is working properly.";
}
function vmLaunchMore(d,t){
  if(t==="devmgmt.msc"||t==="device manager"){d.vm.app="devmgr";d.vm.dm=null;dmEnsure(d.vm);return "";}
  return null;
}
function dmRows(d){
  var n=ensureNet(d),rows=[];
  if(n.driver!=="missing"){rows.push({id:"wifi",name:"Intel(R) Wi-Fi 6 AX201 160MHz",bad:n.driver==="error43",off:!n.adapterOn&&n.driver!=="error43"});}
  rows.push({id:"eth",name:"Realtek PCIe GbE Family Controller"},{id:"vpn",name:"WAN Miniport (IKEv2)"},{id:"ip",name:"WAN Miniport (IP)"});
  return rows;
}
function devmgrHtml(d){
  var v=d.vm,dm=dmEnsure(v),rows=dmRows(d),sel=dm.sel,cats=["Audio inputs and outputs","Batteries","Bluetooth","Display adapters","Keyboards"];
  var tree=cats.map(function(c){return '<div class="dmcat">&#9656; '+esc(c)+'</div>';}).join("")+
    '<div class="dmcat open">&#9662; Network adapters</div>'+rows.map(function(r){return '<button type="button" class="dmrow'+(sel===r.id?' on':'')+'" data-a="dmSel" data-id="'+r.id+'"><span class="dmic">'+(r.bad?'<i class="warn" title="Device problem">&#9888;</i>':r.off?'&#9660;':'&#9672;')+'</span>'+esc(r.name)+'</button>';}).join("")+
    '<div class="dmcat">&#9656; System devices</div>';
  var isWifi=sel==="wifi"&&rows.some(function(r){return r.id==="wifi";});
  var bar=wb("Properties","dmProps",{dis:!isWifi})+wb("Update driver","dmUpdate",{dis:!isWifi})+wb("Uninstall device","dmUninstall",{dis:!isWifi});
  return '<div class="win dmwin">'+winChrome("Device Manager")+'<div class="dmmenu">File &nbsp; Action &nbsp; View &nbsp; Help</div><div class="ncbar">'+bar+'</div>'+
    (dm.msg?'<div class="wmsg bad" role="alert">'+esc(dm.msg)+'</div>':"")+'<div class="dmtree">'+'<div class="dmhost">'+esc(d.name==="(not set up)"?compNameFor(d):d.name)+'</div>'+tree+'</div></div>'+dmDialog(d);
}
function dmDialog(d){
  var v=d.vm,dm=v.dm,n=ensureNet(d),h="";
  if(!dm||!dm.dlg){return "";}
  if(dm.dlg==="props"){
    var tabs='<div class="wtabs2">'+[["general","General"],["driver","Driver"],["power","Power Management"]].map(function(t){return '<button type="button" class="'+(dm.tab===t[0]?'on':'')+'" data-a="dmTab" data-k="'+t[0]+'">'+t[1]+'</button>';}).join("")+'</div>',b="";
    if(dm.tab==="general"){b='<dl class="wdl"><dt>Device type</dt><dd>Network adapters</dd><dt>Manufacturer</dt><dd>Intel Corporation</dd><dt>Location</dt><dd>PCI Express Bus</dd></dl><div class="dh">Device status</div><div class="wmsg'+(n.driver==="error43"||!n.adapterOn?' bad':'')+'">'+esc(dmStatusText(n))+'</div>';}
    else if(dm.tab==="driver"){b='<dl class="wdl"><dt>Driver Provider</dt><dd>Intel Corporation</dd><dt>Driver Date</dt><dd>8/14/2026</dd><dt>Driver Version</dt><dd class="mono">'+esc(n.driverVer)+'</dd><dt>Digital Signer</dt><dd>Microsoft Windows Hardware Compatibility Publisher</dd></dl><div class="wbtns">'+wb("Update Driver","dmUpdate")+wb("Roll Back Driver","dmRollback",{dis:!n.prevDriver})+wb(n.adapterOn?"Disable Device":"Enable Device",n.adapterOn?"dmDisable":"dmEnable")+wb("Uninstall Device","dmUninstall")+'</div>'+(dm.msg?'<div class="wmsg bad" role="alert">'+esc(dm.msg)+'</div>':"");}
    else{b='<p>Power management settings for this adapter.</p><button type="button" class="wradio'+(n.powerSaveOff?'':' on')+'" data-a="dmPower">'+(n.powerSaveOff?'&#9744;':'&#9745;')+' Allow the computer to turn off this device to save power</button><p class="small">When this is ticked, Windows can switch the Wi-Fi adapter off while the laptop sleeps, and it may not come back cleanly.</p>';}
    h='<h3>Intel(R) Wi-Fi 6 AX201 160MHz Properties</h3>'+tabs+b+'<div class="wbtns">'+wb("Close","dmClose",{pri:1})+'</div>';
  }else if(dm.dlg==="update"){
    h='<h3>Update Drivers</h3><div class="wmsg'+(dm.bad?' bad':' ok')+'">'+esc(dm.res)+'</div><div class="wbtns">'+wb("Close","dmCloseUpd",{pri:1})+'</div>';
  }else if(dm.dlg==="uninst"){
    h='<h3>Uninstall Device</h3><p>Warning: You are about to uninstall this device from your system.</p><div class="wbtns">'+wb("OK","dmUninstallOk",{pri:1})+wb("Cancel","dmCloseUpd")+'</div>';
  }
  return '<div class="vmdlg"><div class="mssign ncdlg">'+h+'</div></div>';
}
function dmAdmin(d){var dm=dmEnsure(d.vm);if(!isAdminSess(d)){dm.msg="You need to be signed in as an administrator to change devices. Sign out and sign in as LocalAdmin.";return false;}dm.msg="";return true;}
A.dmSel=function(ds){var dm=dmEnsure(curDev().vm);dm.sel=ds.id;dm.msg=ds.id==="wifi"?"":"Only the Wi-Fi adapter can be opened in this lab.";};
A.dmProps=function(){var dm=dmEnsure(curDev().vm);netLog(curDev(),"dmOpen");dm.dlg="props";dm.tab="general";dm.msg="";};
A.dmTab=function(ds){var dm=dmEnsure(curDev().vm);dm.tab=ds.k;dm.msg="";};
A.dmClose=function(){var dm=dmEnsure(curDev().vm);dm.dlg=null;dm.msg="";};
A.dmCloseUpd=function(){var dm=dmEnsure(curDev().vm);dm.dlg=(dm.back||null);dm.back=null;};
A.dmUpdate=function(){
  var d=curDev(),dm=dmEnsure(d.vm),n=ensureNet(d);dm.back=dm.dlg==="props"?"props":null;
  if(!dmAdmin(d)){return;}
  netLog(d,"driverUpdate");
  if(n.driver==="outdated"||n.driver==="error43"){n.prevDriver=n.driverVer;n.driverVer=DRIVER_NEW;n.driver="ok";if(n.adapterOn&&n.mode==="dhcp"){n.lease=netFreshLease(d);}dm.res="Windows has successfully updated your drivers. The adapter is working again.";dm.bad=false;}
  else{dm.res="The best drivers for your device are already installed.";dm.bad=false;}
  dm.dlg="update";
};
A.dmRollback=function(){
  var d=curDev(),dm=dmEnsure(d.vm),n=ensureNet(d);if(!dmAdmin(d)){return;}
  if(!n.prevDriver){return;}
  n.driverVer=n.prevDriver;n.prevDriver=null;if(n.driver==="error43"){n.driver="ok";}if(n.adapterOn&&n.mode==="dhcp"){n.lease=netFreshLease(d);}
  netLog(d,"driverRollback");dm.msg="";
};
A.dmDisable=function(){var d=curDev(),dm=dmEnsure(d.vm);if(!dmAdmin(d)){return;}ensureNet(d).adapterOn=false;netLog(d,"disable");};
A.dmEnable=function(){var d=curDev(),dm=dmEnsure(d.vm),n=ensureNet(d);if(!dmAdmin(d)){return;}
  if(n.driver==="error43"){dm.msg="Windows cannot start this device because its driver reported a problem. (Code 43)";return;}
  n.adapterOn=true;if(n.mode==="dhcp"){n.lease=netFreshLease(d);}netLog(d,"enable");};
A.dmUninstall=function(){var d=curDev(),dm=dmEnsure(d.vm);dm.back=dm.dlg==="props"?"props":null;if(!dmAdmin(d)){return;}dm.dlg="uninst";};
A.dmUninstallOk=function(){
  var d=curDev(),dm=dmEnsure(d.vm),n=ensureNet(d);
  n.driver="missing";n.restartPending=true;n.lease=null;netLog(d,"uninstall");dm.dlg=null;dm.back=null;dm.sel="eth";
  toast("The device was uninstalled. It will not come back until the laptop restarts.");
};
A.dmPower=function(){var d=curDev(),dm=dmEnsure(d.vm),n=ensureNet(d);if(!dmAdmin(d)){return;}n.powerSaveOff=!n.powerSaveOff;netLog(d,"power");};
/* Restart brings back an uninstalled adapter: Windows installs its driver again and asks DHCP for an address. */
function netAfterRestart(d){
  var n=ensureNet(d);
  if(n.restartPending||n.driver==="missing"){n.driver="ok";n.driverVer=DRIVER_BASE;n.prevDriver=null;n.restartPending=false;n.adapterOn=true;}
  if(n.mode==="dhcp"){n.lease=netFreshLease(d);}
  netLog(d,"restart");
}
/* Sleep: an adapter that is allowed to power down comes back without a lease when the ticket says its wake-up is broken. */
function netAfterSleep(d){var n=ensureNet(d);if(n.wakesBroken&&!n.powerSaveOff){n.lease=null;n.stuck=true;}netLog(d,"sleep");}
A.vmSleep=function(){var d=curDev(),v=d.vm;v.start=false;netAfterSleep(d);toast("The laptop went to sleep and woke up again.");};
