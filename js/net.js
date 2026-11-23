"use strict";
/* =============== LAPTOP NETWORK STATE ===============
   One object per virtual laptop (device.vm.net) holds everything the network screens and commands need:
   the adapter and its driver, the IPv4 and DNS settings, the lease the laptop holds, and what the
   office network does (does DHCP answer, does DNS work). netView(d) turns that into what Windows would show.
   Every command and window reads netView, so they cannot disagree. The healthy default matches how the
   lab always behaved, so tickets that never touch the network are unchanged. */
var NET_GW="192.168.20.1",NET_DNS="192.168.20.10",NET_MASK="255.255.255.0";
function macFor(d){var n=0,i,h="";for(i=0;i<d.serial.length;i++){n+=d.serial.charCodeAt(i)*(i+3);}
  for(i=0;i<3;i++){h+="-"+("0"+((n*(i+5)+i*37)%256).toString(16)).slice(-2).toUpperCase();}return "00-15-5D"+h;}
function autoIpFor(d){var n=0,i;for(i=0;i<d.serial.length;i++){n+=d.serial.charCodeAt(i)*(i+1);}return "169.254."+(1+n%250)+"."+(1+(n*7)%250);}
function leaseFor(d){return {ip:ipFor(d),mask:NET_MASK,gw:NET_GW,dns:NET_DNS};}
/* a new lease if the office DHCP server answers, otherwise none (the laptop falls back to 169.254) */
function netFreshLease(d){var e=ensureNet(d).env;return e.dhcp&&!e.full?{ip:ipFor(d),mask:NET_MASK,gw:e.gw,dns:e.dns}:null;}
function freshNet(d){
  return {adapterOn:true,driver:"ok",driverVer:"22.150.0.3",prevDriver:null,powerSaveOff:false,wakesBroken:false,
    mode:"dhcp",sIp:"",sMask:"",sGw:"",dnsMode:"auto",dnsManual:"",lease:leaseFor(d),
    env:{dhcp:true,full:false,gw:NET_GW,dns:NET_DNS,dnsOk:true,ssidOk:true},vpn:"off",restartPending:false,log:{}};
}
function ensureNet(d){var v=ensureVm(d);if(!v.net){v.net=freshNet(d);}if(!v.net.log){v.net.log={};}return v.net;}
function ip2n(s){var p=String(s||"").split(".");if(p.length!==4){return null;}var n=0,i,x;
  for(i=0;i<4;i++){if(!/^\d{1,3}$/.test(p[i])){return null;}x=+p[i];if(x>255){return null;}n=n*256+x;}return n;}
function validIpText(s){return ip2n(s)!==null;}
function sameNet(a,b,mask){var x=ip2n(a),y=ip2n(b),m=ip2n(mask||NET_MASK);return x!==null&&y!==null&&m!==null&&Math.floor(x/(4294967296-m))===Math.floor(y/(4294967296-m));}
/* What Windows would show right now for this laptop. */
function netView(d){
  var v=ensureVm(d),n=ensureNet(d),r={n:n,mac:macFor(d),present:n.driver!=="missing"};
  r.link=r.present&&n.adapterOn&&n.driver!=="error43"&&!!v.ssid;
  r.dhcpEnabled=n.mode==="dhcp";r.auto=false;r.ip="";r.mask="";r.gw="";r.dns="";r.dhcpServer="";
  if(!r.link){return finishNet(r,n);}
  if(n.mode==="static"){r.ip=n.sIp;r.mask=n.sMask;r.gw=n.sGw;}
  else if(n.lease){r.ip=n.lease.ip;r.mask=n.lease.mask;r.gw=n.lease.gw;r.dhcpServer=n.env.gw;}
  else{r.ip=autoIpFor(d);r.mask="255.255.0.0";r.auto=true;}
  r.dns=n.dnsMode==="manual"?n.dnsManual:(n.mode==="dhcp"&&n.lease?n.lease.dns:"");
  return finishNet(r,n);
}
function finishNet(r,n){
  r.validIp=r.link&&!!r.ip&&!r.auto;
  r.gatewayOk=r.validIp&&!!r.gw&&sameNet(r.ip,r.gw,r.mask)&&r.gw===n.env.gw&&n.env.ssidOk!==false;
  r.internetOk=r.gatewayOk&&n.vpn!=="broken";
  /* the DNS server answers if it is the real one, it is up, and the laptop can reach it (same subnet, or through the gateway) */
  r.resolveOk=r.validIp&&!!r.dns&&r.dns===n.env.dns&&n.env.dnsOk!==false&&n.env.ssidOk!==false&&(sameNet(r.ip,r.dns,r.mask)||r.gatewayOk);
  r.nameOk=r.internetOk&&r.resolveOk;
  return r;
}

/* ---- commands ---- */
function netLog(d,ev){var l=ensureNet(d).log;l.seq=l.seq||[];l.seq.push(ev);if(l.seq.length>40){l.seq.shift();}l[ev]=(l[ev]||0)+1;}
function nrow(label,val){var fill="",i=0,w=33-label.length;if(w<2){w=2;}for(;i<w;i++){fill+=((label.length+i)%2===0)?".":" ";}
  if(fill.charAt(fill.length-1)!==" "){fill=fill.slice(0,-1)+" ";}return "   "+label+fill+": "+val;}
function netIpconfig(d,all){
  var r=netView(d),L=["Windows IP Configuration",""],sfx=d.domainJoined?"practice.local":"",desc="Intel(R) Wi-Fi 6 AX201 160MHz";
  if(!r.present){return L;}
  L.push("Wireless LAN adapter Wi-Fi:","");
  if(!r.link){
    L.push(nrow("Media State","Media disconnected"),nrow("Connection-specific DNS Suffix",sfx));
    if(all){L.push(nrow("Description",desc),nrow("Physical Address",r.mac),nrow("DHCP Enabled",r.dhcpEnabled?"Yes":"No"),nrow("Autoconfiguration Enabled","Yes"));}
    return L;
  }
  L.push(nrow("Connection-specific DNS Suffix",sfx));
  if(all){L.push(nrow("Description",desc),nrow("Physical Address",r.mac),nrow("DHCP Enabled",r.dhcpEnabled?"Yes":"No"),nrow("Autoconfiguration Enabled","Yes"));}
  L.push(nrow(r.auto?"Autoconfiguration IPv4 Address":"IPv4 Address",r.ip+(all?"(Preferred)":"")),nrow("Subnet Mask",r.mask||""));
  if(all&&r.dhcpEnabled&&r.n.lease){L.push(nrow("Lease Obtained","Thursday, October 8, 2026 9:12:04 AM"),nrow("Lease Expires","Thursday, October 8, 2026 5:12:04 PM"));}
  L.push(nrow("Default Gateway",r.gw||""));
  if(all){if(r.dhcpServer){L.push(nrow("DHCP Server",r.dhcpServer));}L.push(nrow("DNS Servers",r.dns||""));}
  return L;
}
function netPingLines(d,t){
  var r=netView(d),n=r.n,isIp=/^\d{1,3}(\.\d{1,3}){3}$/.test(t),pr=pingProbe(d,t),head,body=[],i,a=pr.addr||t,stat;
  if(pr.res==="nohost"){return ["Ping request could not find host "+t+". Please check the name and try again."];}
  head="Pinging "+t+(isIp?"":" ["+a+"]")+" with 32 bytes of data:";
  if(pr.res==="ok"){for(i=0;i<4;i++){body.push("Reply from "+a+": bytes=32 time="+(16+i%3)+"ms TTL=117");}stat=["    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),","Approximate round trip times in milli-seconds:","    Minimum = 16ms, Maximum = 18ms, Average = 17ms"];}
  else if(pr.res==="unreach"){for(i=0;i<4;i++){body.push("Reply from "+pr.from+": Destination host unreachable.");}stat=["    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),"];}
  else if(pr.res==="timeout"){for(i=0;i<4;i++){body.push("Request timed out.");}stat=["    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),"];}
  else{for(i=0;i<4;i++){body.push("PING: transmit failed. General failure.");}stat=["    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),"];}
  return [head].concat(body,["","Ping statistics for "+a+":"],stat);
}
/* One answer to "can this laptop reach t": ok, timeout, unreach (with who answered), fail, or nohost (name did not resolve). */
function pingProbe(d,t){
  var r=netView(d),n=r.n,e=n.env,isIp=/^\d{1,3}(\.\d{1,3}){3}$/.test(t),a=t;
  if(!r.link){return {res:"fail"};}
  if(!isIp){if(!r.resolveOk){return {res:"nohost"};}a=resolvedIp(t);}
  if(!r.validIp){return {res:"fail",addr:a};}
  if(a===r.ip){return {res:"ok",addr:a};}
  if(sameNet(r.ip,a,r.mask)){
    if(e.ssidOk===false){return {res:"timeout",addr:a};}
    return (a===e.gw||a===e.dns)?{res:"ok",addr:a}:{res:"unreach",from:r.ip,addr:a};
  }
  if(!r.gw){return {res:"unreach",from:r.ip,addr:a};}
  if(!r.gatewayOk||!r.internetOk){return {res:"timeout",addr:a};}
  return {res:"ok",addr:a};
}
function netNslookup(d,t){
  var r=netView(d);netLog(d,"nslookup");
  if(!r.link||!r.dns){return ["DNS request timed out.","    timeout was 2 seconds.","*** Can't find server address: No response from server"];}
  if(!r.resolveOk){return ["Server:  UnKnown","Address:  "+r.dns,"","DNS request timed out.","    timeout was 2 seconds.","DNS request timed out.","    timeout was 2 seconds.","*** UnKnown can't find "+t+": No response from server"];}
  return ["Server:  dc01.practice.local","Address:  "+r.dns,"","Non-authoritative answer:","Name:    "+t,"Address:  "+resolvedIp(t)];
}
var NO_ADAPTER_MSG="The operation failed as no adapter is in the state permissible for this operation.";
/* cmd commands for the laptop's network. Returns the output lines, or null when the line is not one of these. */
function netCmd(d,raw){
  var c=raw.toLowerCase().replace(/\s+/g," ").trim(),parts=raw.trim().split(/\s+/),r,n,L,t;
  if(c==="ipconfig"||c==="ipconfig /all"){netLog(d,c==="ipconfig"?"ip":"ipall");return netIpconfig(d,c==="ipconfig /all");}
  if(c==="ipconfig /flushdns"){netLog(d,"flush");return ["Windows IP Configuration","","Successfully flushed the DNS Resolver Cache."];}
  if(c==="ipconfig /release"||c==="ipconfig /renew"){
    if(!elevated(d)){return ["The requested operation requires elevation."];}
    r=netView(d);n=r.n;
    if(!r.link||n.mode==="static"){netLog(d,"badstate");return [NO_ADAPTER_MSG];}
    if(c.slice(-8)==="/release"){n.lease=null;netLog(d,"release");return ["Windows IP Configuration","","Wireless LAN adapter Wi-Fi:","",nrow("Connection-specific DNS Suffix",d.domainJoined?"practice.local":"")];}
    if(netFreshLease(d)){n.lease=netFreshLease(d);netLog(d,"renew");return netIpconfig(d,false);}
    n.lease=null;netLog(d,"renewfail");
    return ["An error occurred while renewing interface Wi-Fi : unable to contact your DHCP server. Request has timed out."];
  }
  if(parts[0].toLowerCase()==="ping"){t=networkTarget(parts);if(!t){return ["Usage: ping <host name or IP address>"];}
    var pr=pingProbe(d,t),rr=netView(d);
    if(pr.res==="ok"){netLog(d,t===rr.gw?"pingGw":/^\d/.test(t)?"pingNet":"pingName");}else if(!/^\d/.test(t)){netLog(d,"pingNameFail");}
    return netPingLines(d,t);}
  if(parts[0].toLowerCase()==="nslookup"){t=networkTarget(parts);if(!t){return ["Usage: nslookup <host name or IP address>"];}return netNslookup(d,t);}
  if(c.indexOf("getmac")===0){r=netView(d);return ["Connection Name  Network Adapter     Physical Address    Transport Name","=============== =================== =================== =========================="].concat(r.present?["Wi-Fi           Intel Wi-Fi 6 AX201 "+r.mac+"   "+(r.link?"\\Device\\Tcpip_{"+guidFor(d)+"}":"Media disconnected")]:["N/A"]);}
  return null;
}
/* the PowerShell versions of the same checks */
function netPs(d,c,target){
  var r=netView(d),st;
  if(c.indexOf("get-netipconfiguration")===0){
    if(!r.link){return ["InterfaceAlias       : Wi-Fi","NetAdapter.Status   : Disconnected"];}
    return ["InterfaceAlias       : Wi-Fi","InterfaceDescription : Intel(R) Wi-Fi 6 AX201","IPv4Address          : "+r.ip].concat(r.gw?["IPv4DefaultGateway   : "+r.gw]:[],r.dns?["DNSServer            : "+r.dns]:[]);
  }
  if(c.indexOf("get-netadapter")===0){
    if(!r.present){return [];}
    st=r.n.adapterOn?(r.n.driver==="error43"?"Not Present":(r.link?"Up":"Disconnected")):"Disabled";
    return ["Name InterfaceDescription                     ifIndex Status       MacAddress","---- --------------------                     ------- ------       ----------","Wi-Fi Intel(R) Wi-Fi 6 AX201 160MHz           8       "+st.padEnd(12)+" "+r.mac];
  }
  if(c.indexOf("test-connection")===0){
    if(!target){return ["Test-Connection: Cannot validate argument on parameter 'TargetName'."];}
    var pr=pingProbe(d,target),comp=d.name==="(not set up)"?compNameFor(d):d.name;
    if(pr.res==="ok"){return ["Source        Destination     IPV4Address       Bytes Time(ms)","------        -----------     -----------       ----- --------",comp+"  "+target.padEnd(15)+" "+pr.addr.padEnd(17)+" 32    17"];}
    if(pr.res==="nohost"){return ["Test-Connection: Testing connection to computer '"+target+"' failed: No such host is known."];}
    return ["Test-Connection: Testing connection to computer '"+target+"' failed: "+(pr.res==="fail"?"A general failure occurred.":pr.res==="unreach"?"Destination host unreachable.":"Request timed out.")];
  }
  if(c.indexOf("resolve-dnsname")===0){
    if(!target){return ["Resolve-DnsName: Cannot bind argument to parameter 'Name' because it is null."];}
    if(!r.resolveOk){return ["Resolve-DnsName: "+target+" : DNS server failure"];}
    return ["Name                           Type   TTL   Section    IPAddress","----                           ----   ---   -------    --------- ",target.padEnd(30)+" A      300   Answer     "+resolvedIp(target)];
  }
  return null;
}

/* =============== INTERVIEW PRACTICE TICKETS (s15 to s21) =============== */
var NET_TICKETS=["s15","s16","s17","s18","s19","s20","s21"];
function netTicketDev(){return D("d3");}
function netScenarioSetup(id){
  var d=netTicketDev(),v=ensureVm(d),n,nv;
  v.net=freshNet(d);n=v.net;n.log={};
  if(!v.ssid){v.ssid="PlowLab-Staff";}
  if(id==="s15"){n.mode="static";n.sIp="192.168.1.50";n.sMask="255.255.255.0";n.sGw="192.168.1.1";n.dnsMode="manual";n.dnsManual="192.168.1.1";n.lease=null;}
  if(id==="s16"){n.env.dhcp=false;n.lease=null;}
  if(id==="s17"){n.driver="error43";n.driverVer="22.200.0.1";n.prevDriver="22.150.0.3";n.lease=null;}
  if(id==="s18"){n.lease={ip:"10.0.5.77",mask:"255.255.255.0",gw:"10.0.5.1",dns:"10.0.5.1"};}
  if(id==="s19"){n.wakesBroken=true;n.lease=null;n.stuck=true;}
  if(id==="s20"){n.dnsMode="manual";n.dnsManual="10.99.99.9";}
  if(id==="s21"){n.mode="static";n.sIp="192.168.20.77";n.sMask="255.255.255.0";n.sGw="";n.dnsMode="manual";n.dnsManual=NET_DNS;n.lease=null;}
}
/* The escalation note for s16 has to carry the evidence a network team needs. */
function netNoteChecks(id){
  var d=netTicketDev(),t=String((S.scenarios.notes||{})[id]||""),v=ensureVm(d),mac=macFor(d).toLowerCase().replace(/[:]/g,"-");
  var low=t.toLowerCase();
  return {
    ip:/169\.254\.\d{1,3}\.\d{1,3}/.test(t)||/169\.254/.test(t)&&/self-assigned|apipa|auto/i.test(t),
    dhcp:/dhcp/i.test(t)&&/(yes|enabled|no\b|disabled)/i.test(t),
    mac:low.replace(/:/g,"-").indexOf(mac)>-1||/(^|[^0-9a-f])([0-9a-f]{2}-){5}[0-9a-f]{2}/i.test(t),
    ssid:!!v.ssid&&low.indexOf(String(v.ssid).toLowerCase())>-1||/wi-?fi/i.test(t)&&/name|ssid|network/i.test(t),
    tried:/renew|release|flush|restart|reset|reboot/i.test(t),
    others:/other (devices|laptops|phones|users|computers)|everyone|all devices|several|multiple|also (fail|affected)|same (problem|issue)/i.test(t)
  };
}
function netScenarioSteps(id){
  var d=netTicketDev(),nv=netView(d),n=nv.n,l=n.log||{},c;
  if(id==="s15"){return [["Laptop set to obtain an IP address automatically",n.mode==="dhcp"],["DNS set to automatic",n.dnsMode==="auto"],["Internet and websites work",nv.nameOk]];}
  if(id==="s16"){c=netNoteChecks(id);
    return [["Read ipconfig /all and saw the 169.254 address",!!l.ipall],["Tried release and renew once",!!(l.renewfail||l.renew)],
      ["Escalation note has the 169.254 address, DHCP Enabled value, MAC address and Wi-Fi name",c.ip&&c.dhcp&&c.mac&&c.ssid],["Note says what was tried and that other devices also fail",c.tried&&c.others]];}
  if(id==="s17"){return [["Driver fixed in Device Manager (update or roll back)",n.driver==="ok"],["Adapter has a valid address",nv.validIp],["Internet works",nv.internetOk]];}
  if(id==="s18"){return [["Checked the address with ipconfig",!!(l.ip||l.ipall)],["Old lease replaced (release and renew, or disable and enable)",!!nv.validIp&&!!n.lease&&n.lease.ip===ipFor(d)],["Internet works",nv.internetOk]];}
  if(id==="s19"){return [["Power saving turned off for the Wi-Fi adapter",!!n.powerSaveOff],["Laptop has an address again",nv.validIp],["Internet works",nv.internetOk]];}
  if(id==="s20"){return [["Tested a name against an address (ping or nslookup)",!!(l.nslookup||l.pingNameFail||l.pingName)],["DNS server corrected",nv.resolveOk],["Websites open",nv.nameOk]];}
  if(id==="s21"){return [["Default gateway set",!!nv.gw&&nv.gatewayOk],["Internet and names work",nv.nameOk]];}
  return [];
}
function netScenarioDone(id){
  var s=netScenarioSteps(id);return s.length>0&&s.every(function(x){return x[1];});
}
/* Gentle wrong-tool feedback shown in the ticket dock. */
function netWrongTool(id){
  var l=ensureNet(netTicketDev()).log||{};
  if(id==="s17"&&l.wrongToolNcpa){return "This is a driver error, so check Device Manager.";}
  if((id==="s15"||id==="s20"||id==="s21")&&l.dmOpen&&!l.ipv4edit){return "The driver is fine. Settings live in Network Connections (ncpa.cpl).";}
  return "";
}
