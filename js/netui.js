"use strict";
/* =============== LAPTOP NETWORK SCREENS ===============
   The Run box, the Start search, Network Connections (ncpa.cpl) and its Status and IPv4 dialogs.
   Everything reads and writes the laptop's network state (net.js), so the Command Prompt, these windows
   and Settings always agree. Changing settings needs an administrator session, like real Windows. */
function ncEnsure(v){if(!v.nc){v.nc={sel:"wifi",dlg:null,det:false,item:"ipv4",f:{mode:"dhcp",dns:"auto"},msg:"",err:""};}return v.nc;}
function netValidMsg(){return "The IP address or subnet mask you entered is not valid. Use four numbers from 0 to 255 separated by dots.";}
function netNeedAdmin(){return "You need to be signed in as an administrator to change network settings. Sign out and sign in as LocalAdmin.";}

/* ----- Run box and Start search: what a typed name opens ----- */
function vmLaunch(d,text){
  var v=d.vm,t=String(text||"").trim().toLowerCase().replace(/\.exe$/,"");
  if(!t){return "";}
  if(t==="ncpa.cpl"||t==="network connections"||t==="view network connections"){v.app="ncpa";v.nc=null;ncEnsure(v);return "";}
  if(t==="cmd"||t==="command prompt"){v.app="terminal";v.termShell="cmd";return "";}
  if(t==="powershell"||t==="windows powershell"){v.app="terminal";v.termShell="ps";return "";}
  if(t==="terminal"||t==="wt"){v.app="terminal";return "";}
  if(t==="settings"||t==="ms-settings:"){v.app="settings";v.setPage="about";return "";}
  if(t==="explorer"||t==="this pc"||t==="file explorer"){v.app="explorer";return "";}
  if(typeof vmLaunchMore==="function"){var m=vmLaunchMore(d,t);if(m!==null){return m;}}
  return "Windows cannot find '"+String(text).trim()+"'. Make sure you typed the name correctly, and then try again.";
}
function runHtml(d){
  var g=d.vm.run;if(!g){return "";}
  return '<div class="vmdlg"><div class="mssign runbox"><h3>Run</h3><p>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p>'+
    vi("runcmd","Open:","text","","vmRunGo")+(g.err?'<div class="wmsg bad" role="alert">'+esc(g.err)+'</div>':"")+'<div class="wbtns">'+wb("OK","vmRunGo",{pri:1})+wb("Cancel","vmRunClose")+'</div></div></div>';
}
A.vmRunGo=function(){var d=curDev(),v=d.vm,e=vmLaunch(d,S.vmIn.runcmd);if(e){v.run.err=e;return;}v.run=null;v.start=false;S.vmIn.runcmd="";};
A.vmRunClose=function(){var v=curDev().vm;v.run=null;S.vmIn.runcmd="";};
A.vmStartGo=function(){var d=curDev(),v=d.vm,e=vmLaunch(d,S.vmIn.startq);if(e){toast(e);return;}v.start=false;S.vmIn.startq="";};
A.vmNcLink=function(){var d=curDev();vmLaunch(d,"ncpa.cpl");d.vm.start=false;};

/* ----- Network Connections ----- */
function ncAdapters(d){
  var r=netView(d),n=r.n,v=d.vm,wifi=null;
  if(r.present){wifi={id:"wifi",name:"Wi-Fi",desc:"Intel(R) Wi-Fi 6 AX201 160MHz",status:(!n.adapterOn||n.driver==="error43")?"Disabled":(v.ssid?v.ssid:"Not connected"),on:n.adapterOn&&n.driver!=="error43"};}
  var list=[];if(wifi){list.push(wifi);}
  list.push({id:"eth",name:"Ethernet",desc:"Realtek PCIe GbE Family Controller",status:"Network cable unplugged",on:false});
  list.push({id:"vpn",name:"Practice VPN",desc:"WAN Miniport (IKEv2)",status:n.vpn==="off"?"Disconnected":"Connected",on:n.vpn!=="off"});
  return list;
}
function ncpaHtml(d){
  var v=d.vm,nc=ncEnsure(v),list=ncAdapters(d),sel=list.filter(function(a){return a.id===nc.sel;})[0]||list[0],isWifi=sel.id==="wifi";
  var tiles=list.map(function(a){return '<button type="button" class="nctile'+(a.id===sel.id?' on':'')+(a.on?'':' off')+'" data-a="ncSel" data-id="'+a.id+'"><span class="ncic">'+(a.on?'&#9673;':'&#8856;')+'</span><b>'+esc(a.name)+'</b><span>'+esc(a.status)+'</span><small>'+esc(a.desc)+'</small></button>';}).join("");
  var bar=(isWifi?(sel.on?wb("Disable this network device","ncDisable"):wb("Enable this network device","ncEnable")):wb("Disable this network device","ncOther",{dis:1}))+wb("View status of this connection","ncStatus",{dis:!isWifi||!sel.on})+wb("Change settings of this connection","ncProps",{dis:!isWifi||!sel.on});
  return '<div class="win ncwin">'+winChrome("Network Connections")+'<div class="ncaddr">Control Panel &gt; Network and Internet &gt; Network Connections</div><div class="ncbar">'+bar+'</div>'+
    (nc.msg?'<div class="wmsg bad" role="alert">'+esc(nc.msg)+'</div>':"")+'<div class="nclist">'+tiles+'</div></div>'+ncDialog(d);
}
function ncDialog(d){
  var v=d.vm,nc=v.nc,r=netView(d),n=r.n,h="";
  if(!nc||!nc.dlg){return "";}
  if(nc.dlg==="status"){
    var conn=r.internetOk?"Internet":(r.gatewayOk?"No Internet access":"No network access");
    h='<h3>Wi-Fi Status</h3><dl class="wdl"><dt>IPv4 Connectivity</dt><dd>'+conn+'</dd><dt>IPv6 Connectivity</dt><dd>No network access</dd><dt>Media State</dt><dd>Enabled</dd><dt>SSID</dt><dd>'+esc(v.ssid||"")+'</dd><dt>Speed</dt><dd>866.7 Mbps</dd></dl>';
    if(nc.det){h+='<h4>Network Connection Details</h4><dl class="wdl"><dt>Description</dt><dd>Intel(R) Wi-Fi 6 AX201 160MHz</dd><dt>Physical Address</dt><dd class="mono">'+esc(r.mac)+'</dd><dt>DHCP Enabled</dt><dd>'+(r.dhcpEnabled?"Yes":"No")+'</dd><dt>IPv4 Address</dt><dd class="mono">'+esc(r.ip)+'</dd><dt>IPv4 Subnet Mask</dt><dd class="mono">'+esc(r.mask)+'</dd><dt>IPv4 Default Gateway</dt><dd class="mono">'+esc(r.gw)+'</dd><dt>IPv4 DHCP Server</dt><dd class="mono">'+esc(r.dhcpServer)+'</dd><dt>IPv4 DNS Server</dt><dd class="mono">'+esc(r.dns)+'</dd></dl>';}
    h+='<div class="wbtns">'+wb(nc.det?"Hide details":"Details...","ncDetails")+wb("Disable","ncDisable")+wb("Close","ncClose",{pri:1})+'</div>';
  }else if(nc.dlg==="props"){
    var items=[["cm","Client for Microsoft Networks"],["fp","File and Printer Sharing for Microsoft Networks"],["v6","Internet Protocol Version 6 (TCP/IPv6)"],["ipv4","Internet Protocol Version 4 (TCP/IPv4)"],["lltd","Link-Layer Topology Discovery Responder"]];
    h='<h3>Wi-Fi Properties</h3><p>Connect using:</p><div class="wmsg">Intel(R) Wi-Fi 6 AX201 160MHz</div><p>This connection uses the following items:</p><div class="nclistbox">'+items.map(function(i){return '<button type="button" class="ncitem'+(nc.item===i[0]?' on':'')+'" data-a="ncItem" data-k="'+i[0]+'">&#9745; '+esc(i[1])+'</button>';}).join("")+'</div>'+
      '<div class="wbtns">'+wb("Properties","ncIpv4")+wb("Close","ncClose",{pri:1})+'</div>';
  }else if(nc.dlg==="ipv4"){
    var f=nc.f,st=f.mode==="static",mn=f.dns==="manual";
    function inp(key,label,dis){return '<label class="wl">'+esc(label)+'<input class="wi" type="text" data-vi="'+key+'" autocomplete="off"'+(dis?' disabled':'')+' value="'+esc(S.vmIn[key]||"")+'"></label>';}
    function rad(act,k,on,label){return '<button type="button" class="wradio'+(on?' on':'')+'" data-a="'+act+'" data-k="'+k+'">'+(on?'&#9673;':'&#9675;')+' '+esc(label)+'</button>';}
    h='<h3>Internet Protocol Version 4 (TCP/IPv4) Properties</h3><p>You can get IP settings assigned automatically if your network supports this capability. Otherwise, you need to ask your network administrator for the appropriate IP settings.</p>'+
      rad("ncMode","dhcp",!st,"Obtain an IP address automatically")+rad("ncMode","static",st,"Use the following IP address:")+
      inp("ip","IP address:",!st)+inp("mask","Subnet mask:",!st)+inp("gw","Default gateway:",!st)+
      rad("ncDns","auto",!mn,"Obtain DNS server address automatically")+rad("ncDns","manual",mn,"Use the following DNS server addresses:")+inp("dns1","Preferred DNS server:",!mn)+
      (nc.err?'<div class="wmsg bad" role="alert">'+esc(nc.err)+'</div>':"")+'<div class="wbtns">'+wb("OK","ncOk",{pri:1})+wb("Cancel","ncIpv4Cancel")+'</div>';
  }
  return '<div class="vmdlg"><div class="mssign ncdlg">'+h+'</div></div>';
}
A.ncSel=function(ds){var nc=ncEnsure(curDev().vm);nc.sel=ds.id;nc.msg="";};
A.ncOther=function(){ncEnsure(curDev().vm).msg="Only the Wi-Fi connection can be changed in this lab.";};
A.ncDisable=function(){var d=curDev(),nc=ncEnsure(d.vm),n=ensureNet(d);nc.msg="";
  if(!isAdminSess(d)){nc.msg=netNeedAdmin();nc.dlg=null;return;}
  n.adapterOn=false;netLog(d,"disable");nc.dlg=null;};
A.ncEnable=function(){var d=curDev(),nc=ncEnsure(d.vm),n=ensureNet(d);nc.msg="";
  if(!isAdminSess(d)){nc.msg=netNeedAdmin();return;}
  if(n.driver==="error43"){nc.msg="Windows could not enable this network device. The adapter reports a hardware or driver problem (Code 43). Check the adapter in Device Manager.";netLog(d,"wrongToolNcpa");return;}
  n.adapterOn=true;if(n.mode==="dhcp"){n.lease=netFreshLease(d);}netLog(d,"enable");};
A.ncStatus=function(){var nc=ncEnsure(curDev().vm);nc.dlg="status";nc.det=false;nc.msg="";};
A.ncDetails=function(){var nc=ncEnsure(curDev().vm);nc.det=!nc.det;};
A.ncProps=function(){var nc=ncEnsure(curDev().vm);nc.dlg="props";nc.item="ipv4";nc.msg="";};
A.ncItem=function(ds){ncEnsure(curDev().vm).item=ds.k;};
A.ncClose=function(){var nc=ncEnsure(curDev().vm);nc.dlg=null;nc.det=false;};
A.ncIpv4=function(){var d=curDev(),nc=ncEnsure(d.vm),n=ensureNet(d);
  if(nc.item!=="ipv4"){toast("Only the IPv4 settings are used in this lab.");return;}
  nc.dlg="ipv4";nc.err="";nc.f={mode:n.mode,dns:n.dnsMode};
  S.vmIn.ip=n.sIp||"";S.vmIn.mask=n.sMask||"";S.vmIn.gw=n.sGw||"";S.vmIn.dns1=n.dnsManual||"";};
A.ncIpv4Cancel=function(){var nc=ncEnsure(curDev().vm);nc.dlg="props";nc.err="";};
A.ncMode=function(ds){var nc=ncEnsure(curDev().vm);nc.f.mode=ds.k;nc.err="";if(ds.k==="static"&&!S.vmIn.mask){S.vmIn.mask="255.255.255.0";}};
A.ncDns=function(ds){var nc=ncEnsure(curDev().vm);nc.f.dns=ds.k;nc.err="";};
A.ncOk=function(){
  var d=curDev(),nc=ncEnsure(d.vm),n=ensureNet(d),f=nc.f,ip=(S.vmIn.ip||"").trim(),mask=(S.vmIn.mask||"").trim(),gw=(S.vmIn.gw||"").trim(),dns=(S.vmIn.dns1||"").trim();
  nc.err="";
  if(!isAdminSess(d)){nc.err=netNeedAdmin();return;}
  if(f.mode==="static"&&(!validIpText(ip)||!validIpText(mask)||(gw&&!validIpText(gw)))){nc.err=netValidMsg();return;}
  if(f.dns==="manual"&&!validIpText(dns)){nc.err="The DNS server address you entered is not valid.";return;}
  n.mode=f.mode;n.dnsMode=f.dns;
  if(f.mode==="static"){n.sIp=ip;n.sMask=mask;n.sGw=gw;}
  if(f.dns==="manual"){n.dnsManual=dns;}
  if(f.mode==="dhcp"){n.lease=netFreshLease(d);}
  netLog(d,"ipv4edit");nc.dlg="props";
};
/* Settings > Network: join or forget a Wi-Fi network */
A.vmJoinNet=function(ds){var d=curDev(),n=ensureNet(d);d.vm.ssid=ds.s;if(n.mode==="dhcp"){n.lease=netFreshLease(d);}netLog(d,"rejoin");};
A.vmForgetNet=function(){var d=curDev();d.vm.ssid="";netLog(d,"forget");};
