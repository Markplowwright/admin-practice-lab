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
