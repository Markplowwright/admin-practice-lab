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
    tb("Start","apps",'data-a="go" data-p="start" data-pg="home"',false)+
    tb("Environment","home",'data-a="go" data-p="env" data-pg="map"',S.portal==="env")+
    tb("Edge","globe",'data-a="go" data-p="'+web+'" data-pg="'+DEFAULT[web]+'"',isWeb(S.portal))+
    tb("DC01 (Remote Desktop)","users",'data-a="go" data-p="ad" data-pg="'+(S.portal==="ad"?S.page:(S.rdpLast||"aduc"))+'"',S.portal==="ad")+
    tb("Virtual laptop","device",'data-a="go" data-p="vm" data-pg="d2"',S.portal==="vm")+
    tb("Toolkit","search",'data-a="go" data-p="tools" data-pg="links"',S.portal==="tools")+
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
   '<div class="envh">Reference</div>'+
   card("Toolkit","Real sites","Links to the real tools help desk techs use: IP lookup, MXToolbox, header analyzer and more.","tools","links")+
   '</div>';
};
var TOOLKIT=[
 {g:"Suspicious sign-in",t:[
  ["IP lookup (IP Chicken)","https://ipchicken.com","a sign-in comes from an unfamiliar place","the country and provider, then compare with where the user really is. VPNs and mobile carriers distort location."],
  ["Have I Been Pwned","https://haveibeenpwned.com","you suspect leaked credentials","whether the user's email appears in a known breach."]]},
 {g:"Spam and phishing",t:[
  ["MXToolbox","https://mxtoolbox.com","you are checking SPF, DKIM, DMARC and MX records for a sender domain","failing or missing records, and a sending domain that differs from the visible From address."],
  ["Message header analyzer","https://mxtoolbox.com/EmailHeaders.aspx","you need the route a message took","the Received lines, the Return-Path domain and the authentication results."]]},
 {g:"Mail flow and outages",t:[
  ["Remote Connectivity Analyzer","https://testconnectivity.microsoft.com","a user cannot connect to mail","which step fails: DNS, certificate or sign-in."],
  ["Microsoft 365 service health","https://status.cloud.microsoft","several users report the same problem","an active incident before you troubleshoot one account."]]},
 {g:"Reputation checks",t:[
  ["AbuseIPDB","https://www.abuseipdb.com","an IP keeps showing up in sign-in logs","abuse reports and a confidence score for that address."],
  ["VirusTotal","https://www.virustotal.com","a link, file hash or domain looks suspicious","how many engines flag it. Never upload anything confidential."]]}
];
PAGES["tools.links"]=function(){
  return '<h2 class="ptitle">Toolkit</h2><p class="psub">Real tools help desk techs use. Each card opens the real site in a new tab. They are not part of the simulation, so inside the lab scenarios you get simulated results to keep the exercises consistent. Use the real ones with your own domains, IPs and test data.</p>'+
   TOOLKIT.map(function(g){return '<div class="envh tkh">'+esc(g.g)+'</div><div class="tkgrid">'+g.t.map(function(x){var host=x[1].replace(/^https:\/\//,"").replace(/\/$/,"");
     return '<a class="envc tkc" href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer"><b>'+esc(x[0])+'</b><span><b>Use it when:</b> '+esc(x[2])+'</span><span><b>Look for:</b> '+esc(x[3])+'</span><span class="envw">Open '+esc(host)+' &#8599;</span></a>';}).join("")+'</div>';}).join("");
};

/* =============== TICKET DOCK =============== */
/* The active scenario is shown as a help desk ticket on the right. Completion is still decided by
   scenarioDone() (resulting state), now confirmed with the Resolve button, like closing a real ticket. */
var dockMsg="";
function ticketNo(id){return 1039+parseInt(id.slice(1),10);}
function ticketDock(){
  var id=S.scenarios.active;
  if(!id){return "";}
  var s=SCENARIOS.filter(function(x){return x.id===id;})[0],steps=scenarioSteps(id),done=!!S.scenarios.completed[id];
  var open=steps.filter(function(x){return !x[1];}),h='<aside class="dock" aria-label="Ticket"><div class="dtop"><b>Ticket #'+ticketNo(id)+'</b>'+badge(s.difficulty,s.difficulty==="Hard"?"bad":s.difficulty==="Medium"?"warn":"ok")+badge(done?"Resolved":"Open",done?"ok":"info")+'</div>'+
    '<h3>'+esc(s.title)+'</h3><p class="dq">'+esc(s.ticket)+'</p><div class="dh">Done when</div><ul class="dl">'+steps.map(function(x){return '<li class="'+(x[1]?'on':'')+'"><i aria-hidden="true">'+(x[1]?"&#10003;":"")+'</i><span>'+esc(x[0])+'</span></li>';}).join("")+'</ul>';
  if(!done&&open.length){h+='<div class="dn"><b>Next up</b>'+esc(open[0][0])+'</div>';}
  if(!done&&S.scenarios.hint[id]){h+='<div class="msg">'+esc(s.hint)+'</div>';}
  if(!done&&dockMsg){h+='<div class="msg warn">'+esc(dockMsg)+'</div>';}
  if(!done&&S.scenarios.wrong[id]){h+='<div class="msg warn">That action did not fix the authoritative cause. Read the object source and follow the ticket evidence before trying again.</div>';}
  if(done){h+='<div class="why"><b>Why this happens</b><p>'+esc(s.cause)+'</p><p><b>What to say:</b> '+esc(s.say)+'</p><p><b>Good ticket note:</b> '+esc(s.note)+'</p></div>'+
    '<div class="btnrow">'+B("Next ticket","nextTicket",{primary:1})+B("Practice again","startScenario",{sm:1,d:{id:id}})+'</div>';}
  else{h+='<div class="btnrow">'+B("Resolve ticket","resolveTicket",{primary:1})+B(S.scenarios.hint[id]?"Hide hint":"Hint","scenarioHint",{sm:1,d:{id:id}})+'</div><div class="btnrow">'+B("Reset this ticket","resetScenario",{sm:1})+B("Leave ticket","exitScenario",{sm:1})+'</div>'+
    (id==="s1"?B("Tell Dana to update her phone password","scenarioPhone",{sm:1}):"")+'<p class="small">Completion checks the resulting state in the lab, not which buttons you clicked.</p>';}
  return h+'</aside>';
}
A.resolveTicket=function(){
  var id=S.scenarios.active;
  if(!id){return;}
  if(scenarioDone(id)){S.scenarios.completed[id]=true;dockMsg="";toast("Ticket resolved.");return;}
  var open=scenarioSteps(id).filter(function(x){return !x[1];}).map(function(x){return x[0];});
  dockMsg="Not resolved yet. Still open: "+open.join("; ")+".";
};
A.nextTicket=function(){A.exitScenario();S.portal="env";S.page="map";resetNav();navReset=true;};
(function(){var h=A.startScenario,r=A.resetScenario,x=A.exitScenario;
  A.startScenario=function(d){dockMsg="";h(d);S.guide=false;};
  A.resetScenario=function(){dockMsg="";r();};
  A.exitScenario=function(){dockMsg="";x();};})();

/* =============== START SCREEN =============== */
/* Shown on every page load. Not saved: reopening the site always starts here, then the environment map. */
TITLES.start="Admin Practice Lab";DEFAULT.start="home";
function startHtml(){
  var pr=progress(),active=S.scenarios.active,sc=active?SCENARIOS.filter(function(x){return x.id===active;})[0]:null,m=nextMission(levelsView());
  var primary=pr[0]>0&&m?'<button type="button" class="sbtn primary" data-a="introStart">Continue: '+esc(m.t)+'</button>':'<button type="button" class="sbtn primary" data-a="introStart">Start Level 1</button>';
  var resume=sc?'<button type="button" class="sbtn" data-a="go" data-p="env" data-pg="map">Resume ticket #'+ticketNo(sc.id)+': '+esc(sc.title)+'</button>':'<button type="button" class="sbtn" data-a="go" data-p="env" data-pg="map">Open the environment</button>';
  function card(k,t,x){return '<div class="scard"><div class="sk">'+esc(k)+'</div><b>'+esc(t)+'</b><span>'+esc(x)+'</span></div>';}
  return '<div class="start"><div class="sbar"><b>Admin Practice Lab</b><nav><button type="button" data-a="go" data-p="env" data-pg="map">Environment</button><button type="button" data-a="guide-open">Missions</button><button type="button" data-a="go" data-p="env" data-pg="map">Scenarios</button><button type="button" data-a="go" data-p="tools" data-pg="links">Toolkit</button></nav></div>'+
   '<div class="sbody"><h1>Learn hybrid IT administration by doing it.</h1><p class="slead">A free practice workstation with Active Directory, Microsoft 365, Entra, Intune and Exchange wired together. Work real tickets. Nothing real to break.</p>'+
   '<div class="sact">'+primary+resume+'<button type="button" class="sbtn link" data-a="startTour">Take the walk through</button></div>'+
   '<div class="scards">'+card("Levels 1 to 3","Microsoft 365 admin","Onboarding, offboarding, compromised accounts and MFA.")+card("Level 4","Intune and laptops","Autopilot, BitLocker, apps, and joining a laptop by hand.")+card("Level 5","Hybrid identity","Remote into DC01: AD, sync, Group Policy and hybrid join.")+card(SCENARIOS.length+" tickets","Help desk scenarios","Lockouts, trust failures, suspicious sign-ins. Isolated from your lab.")+'</div>'+
   '<div class="srow2"><button type="button" class="scard link" data-a="go" data-p="tools" data-pg="links"><b>Toolkit</b><span>Links to the real tools: MXToolbox, IP lookup, message header analyzer and more.</span></button><div class="scard dashed"><b>Planned <span class="sk">(not built yet)</span></b><span>Knowledge base, remote support session, imaging walkthrough, Azure basics.</span></div></div></div>'+
   '<div class="sdisc">A learning simulator. Not affiliated with Microsoft, Jamf or Google. All users, passwords and domains are fake. Progress is saved in this browser only.</div></div>';
}
PAGES["start.home"]=function(){return "";};
A["guide-open"]=function(){S.portal="env";S.page="map";S.guide=true;S.guideTab="missions";resetNav();navReset=true;};
A.startTour=function(){S.portal="env";S.page="map";resetNav();navReset=true;A.tour();};

/* =============== DC01 REMOTE DESKTOP SESSION =============== */
/* DC01 is a Windows Server reached over Remote Desktop. Each admin tool is its own window on the server desktop. */
var RDPWIN={
  aduc:{title:"Active Directory Users and Computers",icon:"users",menu:["File","Action","View","Help"]},
  gpmc:{title:"Group Policy Management",icon:"gear",menu:["File","Action","View","Window","Help"]},
  sync:{title:"Microsoft Entra Connect Sync",icon:"refresh",menu:["File","Action","Help"]}
};
var RDPORDER=["aduc","gpmc","sync"];
PAGES["ad.desktop"]=function(){return "";};
function rdpEnsure(pg){if(!Array.isArray(S.rdpOpen)){S.rdpOpen=[];}if(RDPWIN[pg]&&S.rdpOpen.indexOf(pg)<0){S.rdpOpen.push(pg);}}
A.rdpMin=function(){S.page="desktop";resetNav();};
A.rdpClose=function(d){S.rdpOpen=(S.rdpOpen||[]).filter(function(x){return x!==d.pg;});if(S.page===d.pg){S.page=S.rdpOpen.length?S.rdpOpen[S.rdpOpen.length-1]:"desktop";}resetNav();navReset=true;};
A.rdpTask=function(d){if(S.page===d.pg){A.rdpMin();}else{A.go({p:"ad",pg:d.pg});}};
A.rdpDisc=function(){S.portal="env";S.page="map";resetNav();navReset=true;};
function rdpHtml(content){
  var open=S.rdpOpen||[],cur=RDPWIN[S.page]?S.page:null,w=cur?RDPWIN[cur]:null,win="";
  if(w){
    win='<section class="rwin" role="dialog" aria-label="'+esc(w.title)+'"><div class="rtitle">'+ico(w.icon)+'<span>'+esc(w.title)+'</span><span class="sp"></span>'+
      '<button type="button" data-a="rdpMin" aria-label="Minimize">&#8211;</button><button type="button" data-a="rdpClose" data-pg="'+cur+'" aria-label="Close">'+ico("x")+'</button></div>'+
      '<div class="rmenu">'+w.menu.map(function(m){return '<span>'+esc(m)+'</span>';}).join("")+'</div><main class="content rbody" id="main">'+content+'</main></section>';
  }
  var icons=RDPORDER.map(function(k){return '<button type="button" class="ricon" data-a="go" data-p="ad" data-pg="'+k+'">'+ico(RDPWIN[k].icon)+'<span>'+esc(RDPWIN[k].title)+'</span></button>';}).join("");
  var tasks=RDPORDER.filter(function(k){return open.indexOf(k)>-1;}).map(function(k){return '<button type="button" class="rtask'+(cur===k?' on':'')+'" data-a="rdpTask" data-pg="'+k+'">'+ico(RDPWIN[k].icon)+'<span>'+esc(RDPWIN[k].title)+'</span></button>';}).join("");
  return '<div class="rdp"><div class="rdpbar"><button type="button" data-a="rdpDisc">Disconnect</button><span class="rname">DC01.practice.local - Remote Desktop Connection</span><span class="rhint">Simulated session</span></div>'+
    '<div class="rdesk"><div class="ricons">'+icons+'</div>'+win+'</div>'+
    '<div class="rtb"><span class="rstart" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'+tasks+'<span class="sp"></span><span class="rclock">Server time '+esc(adClock(S.ad.nowMin))+'</span></div></div>';
}
