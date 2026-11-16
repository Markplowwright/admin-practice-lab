"use strict";
/* =============== WORKSTATION SHELL =============== */
/* The lab is framed as an admin workstation: one browser window for the web portals,
   a Remote Desktop session for DC01, a virtual laptop, and a taskbar to switch between them. */
var WEB=["m365","entra","intune","exchange"];
var WEBINFO={
  m365:{url:"admin.microsoft.com",tab:"Microsoft 365 admin center"},
  entra:{url:"entra.microsoft.com",tab:"Microsoft Entra admin center"},
  intune:{url:"intune.microsoft.com",tab:"Microsoft Intune admin center"},
  exchange:{url:"admin.exchange.microsoft.com",tab:"Exchange admin center"}
};
function isWeb(p){return WEB.indexOf(p)>-1;}
function topBar(){
  if(!isWeb(S.portal)){return "";}
  var w=WEBINFO[S.portal];
  return '<div class="edge" role="group" aria-label="Browser (simulated)">'+
    '<div class="etabs"><span class="etab">'+ico("shield")+'<span class="et">'+esc(w.tab)+'</span></span></div>'+
    '<div class="ebar"><span class="eurl">'+ico("lock")+'<span>https://'+esc(w.url)+'</span></span></div>'+
    '<div class="ebm" aria-label="Bookmarks">'+WEB.map(function(p){return '<button type="button" data-a="go" data-p="'+p+'" data-pg="'+DEFAULT[p]+'"'+(S.portal===p?' aria-current="true"':'')+'>'+esc(TITLES[p])+'</button>';}).join("")+'</div></div>';
}
function taskbar(){
  var web=isWeb(S.portal)?S.portal:(S.web||"m365");
  function tb(label,icon,attrs,on){return '<button type="button" class="tbi'+(on?' on':'')+'" '+attrs+(on?' aria-current="true"':'')+'>'+ico(icon)+'<span>'+esc(label)+'</span></button>';}
  return '<div class="wsbar" role="toolbar" aria-label="Taskbar">'+
    tb("Environment","home",'data-a="go" data-p="env" data-pg="map"',S.portal==="env")+
    tb("Edge","globe",'data-a="go" data-p="'+web+'" data-pg="'+DEFAULT[web]+'"',isWeb(S.portal))+
    tb("DC01 (Remote Desktop)","users",'data-a="go" data-p="ad" data-pg="aduc"',S.portal==="ad")+
    tb("Virtual laptop","device",'data-a="go" data-p="vm" data-pg="d2"',S.portal==="vm")+
    '<span class="sp"></span><button type="button" class="tbi guideb'+(S.guide?' on':'')+'" data-a="guide">'+ico("help")+'<span>Missions and guide '+progress()[0]+'/'+progress()[1]+'</span></button>'+
    '<button type="button" class="tbi" data-a="tour"><span>Walk through</span></button>'+
    '<span class="tbnote">Simulated. Not the real portals.</span></div>';
}
PAGES["env.map"]=function(){
  function card(title,where,text,p,pg){return '<button type="button" class="envc" data-a="go" data-p="'+p+'" data-pg="'+pg+'"><span class="envw">'+esc(where)+'</span><b>'+esc(title)+'</b><span>'+esc(text)+'</span></button>';}
  return '<h2 class="ptitle">Environment</h2><p class="psub">A small hybrid company. Staff accounts live in on-premises Active Directory (practice.local) and sync to Microsoft Entra. Open a system to work in it. Everything here is simulated with fake data.</p>'+
   '<div class="envgrid">'+
   '<div class="envh">On premises</div>'+
   card("DC01","Remote Desktop","Active Directory Users and Computers, Group Policy Management and Entra Connect Sync.","ad","aduc")+
   card("Virtual laptop","Windows 11 device","Join the domain, run gpupdate and gpresult, check Autopilot enrollment.","vm","d2")+
   '<div class="envh">Cloud, in the browser</div>'+
   WEB.map(function(p){return card(TITLES[p],WEBINFO[p].url,{m365:"Users, licenses, groups and billing.",entra:"Identity, sign-in logs, Conditional Access and devices.",intune:"Enrollment, compliance, configuration and apps.",exchange:"Mailboxes and mail flow rules."}[p],p,DEFAULT[p]);}).join("")+
   '</div>';
};
