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
  r.nameOk=r.internetOk&&!!r.dns&&r.dns===n.env.dns&&n.env.dnsOk!==false;
  return r;
}
