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
    tb("Remote support","key",'data-a="go" data-p="remote" data-pg="'+((S.remote&&S.remote.sess)?"session":(S.portal==="remote"?S.page:"console"))+'"',S.portal==="remote")+
    tb("Procurement","download",'data-a="go" data-p="procure" data-pg="'+(S.portal==="procure"?S.page:"order")+'"',S.portal==="procure")+
    tb("Virtual PC","device",'data-a="go" data-p="vm" data-pg="d2"',S.portal==="vm")+
    tb("Knowledge base","book",'data-a="go" data-p="kb" data-pg="home"',S.portal==="kb")+
    tb("Toolkit","search",'data-a="go" data-p="tools" data-pg="links"',S.portal==="tools")+
    tb("Learning Hub "+trainProgress()[0]+" of "+trainProgress()[1],"hub",'data-a="go" data-p="learn" data-pg="path"',S.portal==="learn")+
    '<span class="sp"></span>'+
    '<button type="button" class="tbi tbtheme" data-a="theme" aria-label="Change theme" title="'+themeLabel()+'"><span>\u25D0</span></button><span class="tbnote">Simulated. Not the real portals.</span></div>';
}
/* Which systems each ticket needs. Used to outline them on the map. */
var NEEDS={
  s1:["dc01"],s2:["dc01","entra"],s3:["dc01","entra","m365","d3"],s4:["dc01","entra","m365","intune","d1"],s5:["dc01","files01","d3"],
  s6:["dc01","d3"],s7:["dc01","d3"],s8:["dc01","entra"],s9:["dc01","entra"],s10:["dc01","entra","exchange"],s11:["d1"],s12:["bench"],s13:["bench","intune"],s14:["bench"],
  s15:["d3"],s16:["d3"],s17:["d3"],s18:["d3"],s19:["d3"],s20:["d3","dc01"],s21:["d3"]
};
function deviceBadge(d){
  if(!d){return "";}
  if(d.join==="hybrid"){return badge("Hybrid joined","ok");}
  if(d.domainJoined){return badge("Domain joined","ok");}
  if(d.state==="enrolled"){return badge("Enrolled in Intune","ok");}
  if(d.state==="registered"){return badge("Not set up","warn");}
  return badge("Not joined","warn");
}
function mapNeed(key){var a=S.scenarios.active;return !!(a&&NEEDS[a]&&NEEDS[a].indexOf(key)>-1);}
PAGES["env.map"]=function(){
  function go(p,pg){return 'data-a="go" data-p="'+p+'" data-pg="'+pg+'"';}
  function cls(key,extra){return 'mapc'+(mapNeed(key)?' need':'')+(extra?' '+extra:'');}
  var pend=adPendingChanges(),live=S.users.filter(function(u){return !u.deleted;}),fromAd=live.filter(syncedUser).length,managed=S.devices.filter(function(d){return d.state==="enrolled";}).length;
  var tkt=S.scenarios.active;
  function laptop(d,sub){return '<button type="button" class="'+cls(d.id,'lap')+'" '+go("vm",d.id)+'><b>'+esc(d.maker+" "+d.model)+'</b><span>'+esc(sub)+'</span>'+deviceBadge(d)+'</button>';}
  var dc='<div class="'+cls("dc01")+'" style="grid-area:dc"><div class="mh"><b>DC01 &middot; domain controller</b>'+(pend?badge(pend+(pend===1?" change":" changes")+" not synced","warn"):badge("In sync","ok"))+'</div><span>Active Directory, Group Policy, Entra Connect</span>'+
    '<div class="mbtn"><button type="button" class="pri" '+go("ad","aduc")+'>Users and Computers</button><button type="button" '+go("ad","gpmc")+'>Group Policy</button><button type="button" '+go("ad","sync")+'>Entra Connect</button></div></div>';
  var files='<div class="'+cls("files01","still")+'" style="grid-area:files"><div class="mh"><b>FILES01 &middot; file server</b></div><span>Finance share, mapped by Group Policy. Not opened in this lab: it explains why Finance group membership matters.</span></div>';
  var laps='<div class="laps" style="grid-area:laps">'+laptop(D("d1"),"Sam's laptop, Intune")+laptop(D("d2"),"Autopilot")+laptop(D("d3"),"Spare, manual join")+'<button type="button" class="'+cls("bench","lap")+'" '+go("procure","bench")+'><b>Staging bench</b><span>New devices to image</span>'+(pBenchCount()?badge(pBenchCount()+" waiting","warn"):badge("Empty","ok"))+'</button></div>';
  function cloud(area,key,p,pg,title,sub,badgeHtml){return '<button type="button" class="'+cls(key)+'" style="grid-area:'+area+'" '+go(p,pg)+'><b>'+esc(title)+'</b><span>'+esc(sub)+'</span>'+(badgeHtml||"")+'</button>';}
  return '<div class="envwin"><div class="envt">Practice Corp environment</div><div class="envcap">'+(tkt?'Heavy outline: needed for the open ticket. Click a system to open its tool.':'Click a system to open its tool.')+'</div>'+
    '<div class="envmap"><div class="zone zl"><span>On-premises &middot; practice.local</span></div><div class="zone zr"><span>Microsoft cloud</span></div>'+
    dc+files+laps+
    cloud("entra","entra","entra","overview","Microsoft Entra ID","Users, groups, sign-in",'<span class="mfact">'+live.length+' users, '+fromAd+' from Windows Server AD</span>')+
    cloud("m365","m365","m365","home","Microsoft 365 admin center","Licenses and mailboxes",'<span class="mfact">Licenses: '+assigned()+' of '+S.total+' used</span>')+
    cloud("intune","intune","intune","home","Microsoft Intune","Enrollment, policies, apps",'<span class="mfact">'+managed+(managed===1?" device":" devices")+' managed</span>')+
    cloud("exch","exchange","exchange","mailboxes","Exchange admin center","Mailboxes and mail flow","")+
    '<div class="maplink l1"><span>Directory sync<br>every '+S.ad.dirInterval+' min</span></div><div class="maplink l2"><span>Enrollment<br>and device join</span></div></div></div>';
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
  var tab=S.toolTab||"tools";
  if(tab==="glossary"){return '<h2 class="ptitle">Toolkit and reference</h2>'+tabs([["tools","Real tools"],["glossary","Glossary"],["equiv","Jamf and Google equivalents"]],tab,"ttab")+glossaryHtml();}
  if(tab==="equiv"){return '<h2 class="ptitle">Toolkit and reference</h2>'+tabs([["tools","Real tools"],["glossary","Glossary"],["equiv","Jamf and Google equivalents"]],tab,"ttab")+equivHtml();}
  return '<h2 class="ptitle">Toolkit and reference</h2>'+tabs([["tools","Real tools"],["glossary","Glossary"],["equiv","Jamf and Google equivalents"]],tab,"ttab")+'<p class="psub">Real tools help desk techs use. Each card opens the real site in a new tab. They are not part of the simulation, so inside the lab scenarios you get simulated results to keep the exercises consistent. Use the real ones with your own domains, IPs and test data.</p>'+
   TOOLKIT.map(function(g){return '<div class="envh tkh">'+esc(g.g)+'</div><div class="tkgrid">'+g.t.map(function(x){var host=x[1].replace(/^https:\/\//,"").replace(/\/$/,"");
     return '<a class="envc tkc" href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer"><b>'+esc(x[0])+'</b><span><b>Use it when:</b> '+esc(x[2])+'</span><span><b>Look for:</b> '+esc(x[3])+'</span><span class="envw">Open '+esc(host)+' &#8599;</span></a>';}).join("")+'</div>';}).join("");
};

/* =============== TICKET DOCK =============== */
/* The active scenario is shown as a help desk ticket on the right. Completion is still decided by
   scenarioDone() (resulting state), now confirmed with the Resolve button, like closing a real ticket. */
var dockMsg="";
function ticketNo(id){return 1039+parseInt(id.slice(1),10);}
function pickerDock(){
  var h='<aside class="dock" aria-label="Ticket queue"><div class="dtop"><b>Ticket queue</b><span>'+SCENARIOS.filter(function(x){return S.scenarios.completed[x.id];}).length+' of '+SCENARIOS.length+' resolved</span></div>'+
    '<p class="dq">Pick a ticket to work. Each one is isolated, so your main lab progress is never changed.</p>';
  var lastLv=0;
  SCENARIOS.forEach(function(x){var done=!!S.scenarios.completed[x.id],lv=x.lvl||5;
    if(lv!==lastLv){lastLv=lv;h+='<h4 class="tkl" id="tkl'+lv+'">Level '+lv+': '+esc(LEVELS.filter(function(L){return L.n===lv;})[0].name)+'</h4>';}
    h+='<div class="tk"><div class="tkh"><b>#'+ticketNo(x.id)+' '+esc(x.title)+'</b></div><div class="tkb">'+badge(x.difficulty,x.difficulty==="Hard"?"bad":x.difficulty==="Medium"?"warn":"ok")+(done?badge("Resolved","ok"):"")+'</div><p>'+esc(x.ticket)+'</p>'+B(done?"Practice again":"Start ticket","startScenario",{sm:1,primary:!done,d:{id:x.id}})+'</div>';});
  return h+'</aside>';
}
function ticketDock(){
  var id=S.scenarios.active;
  if(!id&&S.mission&&S.portal!=="start"){return missionDock();}
  if(!id){var rq=pReqDock();return S.portal==="env"?pickerDock().replace(/<\/aside>$/,rq+"</aside>"):(S.portal==="procure"&&rq?'<aside class="dock" aria-label="Requests">'+rq+'</aside>':"");}
  var s=SCENARIOS.filter(function(x){return x.id===id;})[0],steps=scenarioSteps(id),done=!!S.scenarios.completed[id];
  var open=steps.filter(function(x){return !x[1];}),h='<aside class="dock" aria-label="Ticket"><div class="dtop"><b>Ticket #'+ticketNo(id)+'</b>'+badge(s.difficulty,s.difficulty==="Hard"?"bad":s.difficulty==="Medium"?"warn":"ok")+badge(done?"Resolved":"Open",done?"ok":"info")+'</div>'+
    '<h3>'+esc(s.title)+'</h3><p class="dq">'+esc(s.ticket)+'</p><div class="dh">Done when</div><ul class="dl">'+steps.map(function(x){return '<li class="'+(x[1]?'on':'')+'"><i aria-hidden="true">'+(x[1]?"&#10003;":"")+'</i><span>'+esc(x[0])+'</span></li>';}).join("")+'</ul>';
  if(!done&&open.length){h+='<div class="dn"><b>Next up</b>'+esc(open[0][0])+'</div>';}
  if(!done&&S.scenarios.hint[id]){h+='<div class="msg">'+esc(s.hint)+'</div>';}
  if(!done&&dockMsg&&open.length){h+='<div class="msg warn">'+esc(dockMsg)+'</div>';}
  if(!done&&typeof netWrongTool==="function"&&netWrongTool(id)){h+='<div class="msg warn">'+esc(netWrongTool(id))+'</div>';}
  if(!done&&S.scenarios.wrong[id]){h+='<div class="msg warn">That action did not fix the authoritative cause. Read the object source and follow the ticket evidence before trying again.</div>';}
  h+='<div class="dh">Ticket note</div><textarea class="dnote" data-note="'+id+'" rows="4" placeholder="What did you find, and what did you change?">'+esc((S.scenarios.notes||{})[id]||"")+'</textarea>';
  if(done){h+='<div class="why"><b>Why this happens</b><p>'+esc(s.cause)+'</p><p><b>What to say:</b> '+esc(s.say)+'</p><p><b>Good ticket note:</b> '+esc(s.note)+'</p></div>'+
    '<div class="btnrow">'+B("Next ticket","nextTicket",{primary:1})+B("Practice again","startScenario",{sm:1,d:{id:id}})+'</div>';}
  else{h+='<div class="btnrow">'+B(open.length?"Resolve ticket ("+open.length+" left)":"Resolve ticket","resolveTicket",{primary:!open.length})+B(S.scenarios.hint[id]?"Hide hint":"Hint","scenarioHint",{sm:1,d:{id:id}})+'</div><div class="btnrow">'+B("Reset this ticket","resetScenario",{sm:1})+B("Leave ticket","exitScenario",{sm:1})+'</div>'+
    (id==="s1"?B("Tell Dana to update her phone password","scenarioPhone",{sm:1}):"")+'<p class="small">Completion checks the resulting state in the lab, not which buttons you clicked. A good ticket note is shown after you resolve it.</p>';}
  return h+pReqDock()+kbDockLink()+'</aside>';
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
  function card(k,t,x,act){return '<button type="button" class="scard link" '+act+'><div class="sk">'+esc(k)+'</div><b>'+esc(t)+'</b><span>'+esc(x)+'</span></button>';}
  function lvl(n){return 'data-a="levelGo" data-n="'+n+'"';}
  return '<div class="start"><div class="sbar"><b>Admin Practice Lab</b><nav><button type="button" data-a="go" data-p="env" data-pg="map">Environment</button><button type="button" data-a="guide-open">Learning Hub</button><button type="button" data-a="go" data-p="env" data-pg="map">Scenarios</button><button type="button" data-a="go" data-p="tools" data-pg="links">Toolkit</button><button type="button" data-a="theme" aria-label="Change theme" data-spot="Theme">'+themeLabel()+'</button></nav></div>'+
   '<div class="sbody"><h1>Learn hybrid IT administration by doing it.</h1><p class="slead">A free practice workstation with Active Directory, Microsoft 365, Entra, Intune and Exchange wired together. Work real tickets. Nothing real to break.</p>'+
   '<div class="sact">'+primary+resume+'<button type="button" class="sbtn link" data-a="startTour">Take the walk through</button></div>'+
   '<div class="scards">'+card("Levels 1 to 3","Microsoft 365 admin","Onboarding, offboarding, compromised accounts and MFA.",lvl(1))+card("Level 4","Intune and laptops","Autopilot, BitLocker, apps, and joining a laptop by hand.",lvl(4))+card("Level 5","Hybrid identity","Remote into DC01: AD, sync, Group Policy and hybrid join.",lvl(5))+card("Level 6","Procurement and imaging","Order a laptop or desktop, image it by USB or PXE, use the BIOS, Autopilot.",lvl(6))+card("Level 7","Interview practice","Windows networking: IP, DHCP, DNS, drivers and escalation notes.",lvl(7))+card(SCENARIOS.length+" tickets","Help desk scenarios","Lockouts, trust failures, network faults. Isolated from your lab.",'data-a="ticketQueue"')+'</div>'+
   '<div class="srow2"><button type="button" class="scard link" data-a="go" data-p="tools" data-pg="links"><b>Toolkit</b><span>Links to the real tools: MXToolbox, IP lookup, message header analyzer and more.</span></button><button type="button" class="scard link" data-a="go" data-p="kb" data-pg="home"><b>Knowledge base</b><span>Searchable how-to articles. The write-up for each ticket opens once you resolve it.</span></button></div></div>'+
   '<div class="sdisc">A learning simulator. Not affiliated with Microsoft, Jamf or Google. All users, passwords and domains are fake. Progress is saved in this browser only.</div></div>';
}
PAGES["start.home"]=function(){return "";};
A.ttab=function(d){S.toolTab=d.t;};
function scrollToId(id){setTimeout(function(){var e=document.getElementById(id);if(e&&e.scrollIntoView){e.scrollIntoView({block:"start"});}},0);}
A.levelGo=function(d){S.portal="learn";S.page="path";S.learnTab="path";resetNav();navReset=true;scrollToId("lvl-"+d.n);};
/* Opens the ticket queue. A pinned mission would otherwise keep its own panel on the right, so it is unpinned first. */
A.ticketQueue=function(d){S.mission=null;S.portal="env";S.page="map";resetNav();navReset=true;if(d&&d.n){scrollToId("tkl"+d.n);}};
A.startNetTicket=function(d){A.startScenario({id:d.id});S.portal="vm";S.page="d3";resetNav();navReset=true;};
A["guide-open"]=function(){S.portal="learn";S.page="path";S.learnTab="path";resetNav();navReset=true;};
function themeChoice(){var c=document.documentElement.getAttribute("data-theme-choice");return c==="light"||c==="dark"?c:"auto";}
function themeLabel(){var c=themeChoice();return c==="auto"?"Theme: Auto":c==="light"?"Theme: Light":"Theme: Dark";}
A.theme=function(){
  var n={auto:"light",light:"dark",dark:"auto"}[themeChoice()],root=document.documentElement;
  if(n==="auto"){root.removeAttribute("data-theme-choice");}else{root.setAttribute("data-theme-choice",n);}
  try{if(n==="auto"){localStorage.removeItem("adminPracticeLabTheme");}else{localStorage.setItem("adminPracticeLabTheme",n);}}catch(e){}
  if(window.applyTheme){window.applyTheme();}
};
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

/* Right-click menus and double-click to open properties, as in Active Directory Users and Computers. */
function adKind(id){return ADU(id)?"user":ADG(id)?"group":"computer";}
document.addEventListener("contextmenu",function(e){
  var old=document.getElementById("ctx");if(old){old.remove();}
  var t=e.target.closest&&e.target.closest("#main .lnk[data-kind]");
  if(!t||S.portal!=="ad"||S.page!=="aduc"){return;}
  e.preventDefault();
  var id=t.getAttribute("data-id"),k=adKind(id),u=ADU(id),items=[];
  S.checked=[id];render();
  if(k==="user"){items=[["Reset Password...","adResetPw",{}],u&&u.locked?["Unlock Account","adUnlock",{}]:null,[u&&u.enabled?"Disable Account":"Enable Account","adToggle",{}],["Move...","adMove",{}],["Add to a group...","adAddGroup",{}],["Delete","adDelete",{}],["Properties","adOpenProps",{}]];}
  else if(k==="computer"){items=[["Reset Account","adResetComputer",{}],["Move...","adMove",{}],["Properties","adOpenProps",{}]];}
  else{items=[["Add member...","adAddGroupMember",{g:id}],["Properties","adOpenProps",{}]];}
  var m=document.createElement("div");m.id="ctx";m.className="ctxm";m.setAttribute("role","menu");
  m.style.left=Math.min(e.clientX,window.innerWidth-220)+"px";m.style.top=Math.min(e.clientY,window.innerHeight-300)+"px";
  m.innerHTML=items.filter(Boolean).map(function(i){var g=i[2].g?' data-g="'+esc(i[2].g)+'"':"";return '<button type="button" role="menuitem" data-a="'+i[1]+'" data-id="'+esc(id)+'"'+g+'>'+esc(i[0])+'</button>';}).join("");
  document.body.appendChild(m);
});
document.addEventListener("dblclick",function(e){
  if(S.portal!=="ad"||S.page!=="aduc"||S.sel){return;}
  var tr=e.target.closest&&e.target.closest("#main tbody tr"),l=tr&&tr.querySelector(".lnk[data-kind]");
  if(!l){return;}
  A.adOpenProps({id:l.getAttribute("data-id")});render();
});

document.addEventListener("input",function(e){
  var t=e.target;
  if(t.hasAttribute&&t.hasAttribute("data-note")){S.scenarios.notes=S.scenarios.notes||{};S.scenarios.notes[t.getAttribute("data-note")]=t.value;save();}
});

/* =============== SPOTLIGHT =============== */
/* While a mission is pinned, the next step is marked on the page: an amber outline on the control to
   use next, and a small coach note beside it. The control is found by matching the step's location
   path ("Users > All users > Dana Rivera > Revoke sessions") against what is on screen, last part
   first, so it shows the action when it is visible and the next place to click when it is not.
   Tickets do not get this on purpose. They keep the Hint button. */
function spotTarget(step){
  var segs=step[2][2].split(">").map(function(x){return x.trim().toLowerCase();}).filter(Boolean);
  var nodes=[].slice.call(document.querySelectorAll("#app button,#app a,#app [data-a],#app [data-spot],#app th,#app td,#app label")).filter(function(n){
    return !n.closest(".dock,.wsbar,.coach,.edge")&&!n.disabled;});
  for(var i=segs.length-1;i>=0;i--){
    for(var j=0;j<nodes.length;j++){
      var t=nodes[j].textContent.trim().toLowerCase().replace(/\s+/g," ");
      var sp=(nodes[j].getAttribute("data-spot")||"").toLowerCase().split("|");
      if(t===segs[i]||sp.indexOf(segs[i])>-1||(nodes[j].getAttribute("aria-label")||"").toLowerCase()===segs[i]){return nodes[j].getAttribute("aria-current")?null:nodes[j];}
    }
  }
  return null;
}
function placeCoach(){
  var c=document.querySelector(".coach"),t=document.querySelector(".spot");
  if(!c||!t){return;}
  var r=t.getBoundingClientRect(),w=c.offsetWidth||260,h=c.offsetHeight||60;
  var left=Math.max(8,Math.min(r.left,window.innerWidth-w-340)),top=r.bottom+10;
  if(top+h>window.innerHeight-56){top=Math.max(8,r.top-h-10);}
  c.style.left=left+"px";c.style.top=top+"px";
}
function spotlight(){
  [].forEach.call(document.querySelectorAll(".spot"),function(n){n.classList.remove("spot");});
  [].forEach.call(document.querySelectorAll(".coach"),function(n){n.remove();});
  if(!S.mission||S.spot===false||S.portal==="start"||S.portal==="learn"||S.portal==="env"||S.portal==="tools"||S.scenarios.active){return;}
  var m=findMission(S.mission);if(!m||m.s.every(function(x){return x[1];})){return;}
  var step=firstOpenStep(m),t=spotTarget(step);if(!t){return;}
  t.classList.add("spot");
  var idx=m.s.indexOf(step)+1,c=document.createElement("div");
  c.className="coach";c.setAttribute("role","note");
  c.innerHTML='<b>Step '+idx+' of '+m.s.length+'</b>'+esc(step[0])+'<small>'+esc(step[2][2])+'</small>';
  document.getElementById("app").appendChild(c);
  var r=t.getBoundingClientRect();if(r.bottom>window.innerHeight-60||r.top<0){try{t.scrollIntoView({block:"center"});}catch(e){}}
  placeCoach();
}
A.toggleSpot=function(){S.spot=S.spot===false;};
window.addEventListener("resize",placeCoach);
document.addEventListener("scroll",placeCoach,true);
