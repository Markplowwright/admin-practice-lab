"use strict";
/* =============== NAV + SHELL =============== */
var TITLES={m365:"Microsoft 365 admin center",entra:"Microsoft Entra admin center",intune:"Microsoft Intune admin center",exchange:"Exchange admin center",vm:"Windows laptop (virtual)"};
var DEFAULT={m365:"home",entra:"overview",intune:"home",exchange:"mailboxes",vm:"d2"};
var NAVS={
  m365:[{pg:"home",l:"Home",i:"home"},{l:"Users",i:"user",kids:[["users","Active users"],["deleted","Deleted users"]]},{l:"Teams & groups",i:"users",kids:[["groups","Active teams & groups"]]},{l:"Billing",i:"license",kids:[["licenses","Licenses"]]},
    {sep:"Admin centers"},{go:["entra","overview"],l:"Identity",i:"shield"},{go:["intune","home"],l:"Endpoint Manager",i:"device"},{go:["exchange","mailboxes"],l:"Exchange",i:"mail"}],
  entra:[{l:"Overview",i:"home",kids:[["overview","Overview"],["props","Properties"]]},{l:"Users",i:"user",kids:[["users","All users"],["deleted","Deleted users"]]},{l:"Groups",i:"users",kids:[["groups","All groups"]]},
    {l:"Devices",i:"device",kids:[["devices","All devices"],["devsettings","Device settings"],["mdm","Mobility (MDM and MAM)"]]},{l:"Roles & admins",i:"key",kids:[["roles","Roles & admins"]]},{l:"Protection",i:"shield",kids:[["ca","Conditional Access"]]},
    {l:"Monitoring & health",i:"search",kids:[["signins","Sign-in logs"],["audit","Audit logs"]]}],
  intune:[{pg:"home",l:"Home",i:"home"},{l:"Devices",i:"device",kids:[["devices","All devices"],["ap","Windows Autopilot devices"],["approf","Deployment profiles"],["compliance","Compliance"],["config","Configuration"]]},
    {l:"Apps",i:"apps",kids:[["apps","All apps"]]},{l:"Endpoint security",i:"shield",kids:[["disk","Disk encryption"]]},{l:"Troubleshooting + support",i:"gear",kids:[["trouble","Troubleshoot"]]},
    {sep:"Related"},{go:["entra","users"],l:"Users and groups (Entra)",i:"user"}],
  exchange:[{l:"Recipients",i:"user",kids:[["mailboxes","Mailboxes"]]},{l:"Mail flow",i:"mail",kids:[["rules","Rules"]]}]
};
function leftNav(){
  if(S.portal==="vm"){return '<nav class="lnav" aria-label="Laptops"><div class="grp">'+ico("device")+'Virtual laptops</div>'+vmDevices().map(function(x){return '<button type="button" class="it kid" data-a="go" data-p="vm" data-pg="'+x.id+'"'+(S.page===x.id?' aria-current="true"':'')+'>'+esc(x.spare?"Spare ThinkPad (manual join)":x.maker+" "+x.model+" (Autopilot)")+'</button>';}).join("")+'</nav>';}
  var h='<nav class="lnav" aria-label="'+esc(TITLES[S.portal])+' navigation">';
  NAVS[S.portal].forEach(function(n){
    if(n.sep){h+='<div class="sepl">'+esc(n.sep)+'</div>';return;}
    if(n.kids){h+='<div class="grp">'+ico(n.i)+esc(n.l)+'</div>'+n.kids.map(function(k){return '<button type="button" class="it kid" data-a="go" data-pg="'+k[0]+'"'+(S.page===k[0]?' aria-current="true"':'')+'>'+esc(k[1])+'</button>';}).join("");return;}
    if(n.go){h+='<button type="button" class="it" data-a="go" data-p="'+n.go[0]+'" data-pg="'+n.go[1]+'">'+ico(n.i)+esc(n.l)+'</button>';return;}
    h+='<button type="button" class="it" data-a="go" data-pg="'+n.pg+'"'+(S.page===n.pg?' aria-current="true"':'')+'>'+ico(n.i)+esc(n.l)+'</button>';
  });
  return h+'</nav>';
}
function labBar(){
  var tot=0,done=0;missions().forEach(function(m){m.s.forEach(function(x){tot+=1;if(x[1]){done+=1;}});});
  return '<div class="lab"><b>Practice lab</b><button type="button" class="introbtn" data-a="tour">Introduction walk through</button>'+["m365","entra","intune","exchange","vm"].map(function(p){return '<button type="button" data-a="go" data-p="'+p+'" data-pg="'+DEFAULT[p]+'"'+(S.portal===p?' aria-current="true"':'')+'>'+esc(TITLES[p])+'</button>';}).join("")+'<span class="sp"></span><span>Simulated. Not the real portals.</span></div>';
}
function portalHeader(){
  return '<header class="phdr"><span class="waf">'+ico("apps")+'</span><h1>'+esc(TITLES[S.portal])+'</h1><div class="search">'+ico("search")+'<input id="hq" data-q="1" type="text" autocomplete="off" aria-label="Search this page" placeholder="Search this page" value="'+esc(S.q)+'"></div><span class="av" title="Admin (you)">AD</span></header>';
}
function flyHtml(){
  if(!S.fly){return "";}
  var f=FLY[S.fly.k]();
  return '<div class="scrim" data-a="closeFly"></div><aside class="fly" role="dialog" aria-modal="true" aria-label="'+esc(f.title)+'"><header><h2>'+esc(f.title)+'</h2><button type="button" class="x" data-a="closeFly" aria-label="Close">'+ico("x")+'</button></header>'+
    (f.sub?'<div class="fsub">'+f.sub+'</div>':'')+(f.tabs?'<div class="ftabs">'+tabs(f.tabs,S.fly.tab,"flyTab")+'</div>':'')+'<div class="fbody">'+f.body+'</div></aside>';
}

/* =============== MISSIONS =============== */
function missions(){
  var dana=U("u1"),sam=U("u2"),priya=U("u3"),marcus=U("u4"),d2=D("d2"),d1=D("d1");
  ensureTroubled();
  var biscope=S.policies.some(function(p){return p.bitlocker&&p.assign&&(p.assign.all||p.assign.groups.length);});
  var diskOK=S.profiles.some(function(p){return p.type==="BitLocker"&&(p.assign.all||p.assign.groups.length);});
  var same=S.policies.some(function(p){return p.bitlocker&&S.profiles.some(function(c){return c.type==="BitLocker"&&sameScope(p,c);});});
  var compliantReq=bitlockerStepDone();
  var mfaOn=S.secDefaults||S.caPolicies.some(function(p){return p.state==="on";});
  var newG=S.groups.filter(function(g){return g.created;});
  var list=[
   {t:"Contain a compromised account: Dana Rivera",w:"A password reset alone leaves sessions, a backup phone number and a mail rule in place. Close every door.",s:[
     ["Spot the 3 a.m. login from Lagos",!!S.flags.spottedOdd,["entra","signins","Monitoring & health > Sign-in logs > the Lagos sign-in"]],
     ["Reset her password",dana.pwReset,["entra","users","Users > All users > Dana Rivera > Reset password"]],
     ["Revoke her sessions",dana.revoked,["entra","users","Users > All users > Dana Rivera > Revoke sessions"]],
     ["Delete the unfamiliar phone number",!dana.methods.some(function(m){return m.sus;}),["entra","users","Users > All users > Dana Rivera > Authentication methods > Delete"]],
     ["Remove the mail forwarding rule",!dana.fwd,["exchange","mailboxes","Recipients > Mailboxes > Dana Rivera > Manage email forwarding"]]]},
   {t:"Get Intune ready for new Windows laptops",w:"Two tenant-level settings decide whether a new laptop can enroll at all.",s:[
     ["Set the MDM user scope to All (or Some)",S.mdm.scope!=="none",["entra","mdm","Devices > Mobility (MDM and MAM) > MDM user scope > Save"]],
     ["Create an Autopilot profile assigned to All devices",apAssigned(),["intune","approf","Devices > Deployment profiles > Create profile > Assignments"]]]},
   {t:"Onboard Priya Nair",w:"The full new-hire flow, including the part that breaks when a step is missed.",s:[
     ["Look up Priya and read what's wrong",!!S.flags.troubled.u3,["intune","trouble","Troubleshooting + support > Troubleshoot > pick Priya > Look up"]],
     ["Set her usage location",!!priya.loc,["m365","users","Users > Active users > Priya Nair > Licenses and apps > Select location"]],
     ["Give her a license (directly or through a group)",hasLicense(priya),["m365","users","Users > Active users > Priya Nair > Licenses and apps > Save changes"]],
     ["Add her to at least one group",userGroups("u3").length>0,["entra","groups","Groups > All groups > a group > Members > Add members"]],
     ["Enroll her Autopilot laptop",!!d2&&d2.state==="enrolled"&&d2.userId==="u3",["intune","ap","Devices > Windows Autopilot devices > tick the device > Simulate unboxing"]]]},
   {t:"Offboard Sam Ortiz",w:"Cut access first, save his work, reclaim the license and the laptop, then delete the account.",s:[
     ["Block his sign-in",sam.blocked,["m365","users","Users > Active users > Sam Ortiz > Account > Block sign-in"]],
     ["Sign him out of all sessions",sam.revoked,["m365","users","Users > Active users > Sam Ortiz > Account > Sign out of all sessions"]],
     ["Create a link to his OneDrive files",sam.filesLink,["m365","users","Users > Active users > Sam Ortiz > OneDrive > Create link to files"]],
     ["Remove him from every group",userGroups("u2").length===0,["entra","groups","Groups > All groups > Finance > Members > Remove"]],
     ["Remove his license",!sam.direct&&!viaGroup(sam),["m365","licenses","Billing > Licenses > Business Premium > Users > tick Sam > Revoke licenses"]],
     ["Retire or wipe his laptop",!!d1&&d1.state!=="enrolled",["intune","devices","Devices > All devices > his laptop > Retire"]],
     ["Delete the user (last step)",sam.deleted,["m365","users","Users > Active users > tick Sam > Delete a user"]]]},
   {t:"Apply least privilege: Marcus Lee",w:"Marcus is a Global Administrator but only does password resets and support.",s:[
     ["Remove his Global Administrator role",marcus.roles.indexOf("ga")<0,["entra","roles","Roles & admins > Global Administrator > tick Marcus > Remove assignments"]],
     ["Give him Helpdesk Administrator instead",marcus.roles.indexOf("ha")>-1,["entra","roles","Roles & admins > Helpdesk Administrator > Add assignments"]]]},
   {t:"Require MFA for everyone",w:"Start safe with report-only, then enforce.",s:[
     ["Create a Conditional Access policy in Report-only mode",!!S.flags.caReport,["entra","ca","Protection > Conditional Access > New policy > Report-only"]],
     ["Enforce MFA: turn the policy On or enable security defaults",mfaOn,["entra","ca","Protection > Conditional Access > Turn on (or Overview > Properties > Manage security defaults)"]],
     ["Run a test sign-in for a user with no MFA method",!!S.flags.testedMfa,["entra","users","Users > All users > Priya Nair > Sign-in logs > Simulate a sign-in"]]]},
   {t:"License by group, the scalable way",w:"Membership drives licensing, so onboarding and offboarding are group changes.",s:[
     ["Create a new group, for example NYC-Staff",newG.length>0,["entra","groups","Groups > All groups > New group"]],
     ["Add at least two people to it",newG.some(function(g){return g.members.length>=2;}),["entra","groups","Groups > All groups > your group > Members > Add members"]],
     ["Assign Business Premium to that group",S.licenseGroups.some(function(id){var g=G(id);return g&&g.created;}),["m365","licenses","Billing > Licenses > Business Premium > Groups > Assign licenses"]],
     ["Create a new user in the group and watch the license appear",S.users.some(function(u){return u.created&&!u.deleted&&viaGroup(u)&&!!u.loc;}),["entra","users","Users > All users > New user > Properties (location) > Assignments (group)"]]]},
   {t:"Enforce BitLocker with Intune",w:"A disk encryption policy makes it true. A compliance policy checks that it's true.",s:[
     ["Create and assign a BitLocker policy",diskOK,["intune","disk","Endpoint security > Disk encryption > Create policy"]],
     ["Create and assign a compliance policy that requires BitLocker",biscope,["intune","compliance","Devices > Compliance > Create policy"]],
     ["Assign both to the same group (or All users)",same,["intune","compliance","Devices > Compliance > Create policy > Assignments"]],
     ["See a laptop show Compliant under the policy",compliantReq,["intune","devices","Devices > All devices > a laptop > Device compliance"]]]},
   {t:"Deploy an app",w:"Required apps install without the user doing anything.",s:[
     ["Add an app and assign it as Required",S.apps.some(function(a){return a.intent==="required"&&(a.assign.all||a.assign.groups.length);}),["intune","apps","Apps > All apps > Add > Assignments > Required"]],
     ["See it installed on an enrolled device",S.devices.some(function(d){return d.state==="enrolled"&&d.appsIn&&d.appsIn.length>0;}),["intune","devices","Devices > All devices > a laptop > Discovered apps"]]]},
   {t:"Set up Priya's laptop on the virtual Windows PC",w:"The hands-on side of Autopilot: the setup screens, the sign-in, and what happens when something is missing.",s:[
     ["Click through setup until Autopilot asks for a work account (needs a deployment profile on All devices)",!!S.flags.vmApSignin,["vm","d2","Dell Latitude > Region > Keyboard > Network (Practice-Corp) > Next"]],
     ["Sign in as priya.nair and finish device setup (if it errors, fix the cause in the admin centers, then Try again)",!!d2&&d2.state==="enrolled"&&d2.userId==="u3"&&d2.join==="joined",["vm","d2","Dell Latitude > Sign in > Enrollment status page"]],
     ["Open Command Prompt and run dsregcmd /status. Find AzureAdJoined and MdmUrl",!!S.flags.vmDsreg,["vm","d2","Start > Command Prompt > dsregcmd /status"]],
     ["Settings > Accounts > Access work or school > Info > Sync",!!S.flags.vmSync,["vm","d2","Settings > Accounts > Access work or school > Info > Sync"]]]},
   {t:"Join a spare laptop to Entra by hand",w:"The manual route: local admin on the PC, then Join this device to Microsoft Entra ID.",s:[
     ["Sign in to the spare ThinkPad as LocalAdmin",!!S.flags.vmAdmin,["vm","d3","Spare ThinkPad > Lock screen > LocalAdmin"]],
     ["Settings > Accounts > Access work or school > Connect > Join this device to Microsoft Entra ID",(function(){var d3=D("d3");return !!d3&&d3.join==="joined";})(),["vm","d3","Start > Settings > Accounts > Access work or school > Connect"]],
     ["Sign out, then sign in with a work account (Other user)",!!S.flags.vmWorkSignin,["vm","d3","Start > Sign out > Other user"]],
     ["Confirm it's managed in Intune (if not, fix the MDM scope or license and press Sync)",(function(){var d3=D("d3");return !!d3&&d3.state==="enrolled";})(),["intune","devices","Devices > All devices > the ThinkPad"]],
     ["Optional: Connect without Join on a laptop and compare Registered vs Joined in Entra",!!S.flags.vmRegistered,["entra","devices","Devices > All devices > Join type"]]]}
  ];
  list.forEach(function(m){var x=MMETA[m.t]||{};m.l=x.l||1;m.why=x.why||"";m.eq=x.eq||"";});
  return list;
}
/* Level and "why it works this way" text for each mission, keyed by mission title. */
var LEVELS=[
  {n:1,name:"Onboarding",d:"Prepare the tenant, bring a new hire online, and learn group licensing."},
  {n:2,name:"Offboarding",d:"Cut access in the right order, keep the files, and shrink admin rights."},
  {n:3,name:"Compromised accounts and MFA",d:"Close every door an attacker opened, then make the next attack harder."},
  {n:4,name:"Intune and laptops",d:"Encrypt, deploy apps, and watch enrollment succeed and fail on a virtual PC."}
];
var MMETA={
"Contain a compromised account: Dana Rivera":{l:3,
  why:"Attackers want to stay in. A password reset blocks sign-ins with the old password, but sessions that are already signed in keep working until you revoke them. A phone number the attacker added can reset the password again, and a forwarding rule keeps copying her mail without any sign-in at all. Each one is a different mechanism, so each needs its own step.",
  eq:"Google Admin: reset the password, reset sign-in cookies, remove the recovery phone, check Gmail forwarding. Jamf manages devices, so these identity steps happen in your identity provider."},
"Get Intune ready for new Windows laptops":{l:1,
  why:"Intune only enrolls a laptop automatically when the person who signs in falls inside the MDM user scope. Outside it, the laptop joins Entra ID and never shows up in Intune. The Autopilot deployment profile is the recipe a new PC follows during setup, and a device with no profile falls back to ordinary manual setup. Both are tenant-wide, set once, which is why they come before any laptop.",
  eq:"Jamf: link Apple Business Manager and create a PreStage enrollment. That plays the role of the MDM scope plus the deployment profile."},
"Onboard Priya Nair":{l:1,
  why:"A license can't be assigned until a usage location is set, because some services are restricted by country. Groups give access, and the license (direct or through a group) is what lets her mailbox and Intune enrollment work. If the license or MDM scope is missing, the laptop's setup fails at the work-account sign-in even though her account exists.",
  eq:"Google Admin: create the user, assign a license under Billing, add them to Groups. Jamf: the device side is Automated Device Enrollment."},
"License by group, the scalable way":{l:1,
  why:"Group-based licensing turns onboarding and offboarding into membership changes: add someone to the group and the license follows, remove them and it frees up. The usage location still has to be set on each user, which is why the last step checks for it.",
  eq:"Google Admin: licenses can be applied automatically by organizational unit. Jamf is licensed per managed device, so there is no per-user license to assign."},
"Offboard Sam Ortiz":{l:2,
  why:"The order matters. Block sign-in and sign out sessions first so access ends now. Create the OneDrive link before the account is deleted, because the files are only kept for a limited retention period. Reclaim the license and retire the laptop, and delete the user last, since a deleted user can be restored for 30 days and is permanently removed after that.",
  eq:"Google Admin: suspend the user, transfer Drive and Gmail data, remove the license, wipe or remove the device, then delete. Jamf: Erase Device on a Mac."},
"Apply least privilege: Marcus Lee":{l:2,
  why:"Global Administrator can change anything, so one stolen password on that account is a full compromise of the tenant. Helpdesk Administrator can reset passwords and sign out non-admin users, which is what support work needs. Giving each person the smallest role that fits their job limits the damage of any single compromised account.",
  eq:"Google Admin: custom admin roles, with Super admin kept to a few people. Jamf: privilege sets on console accounts."},
"Require MFA for everyone":{l:3,
  why:"Report-only mode logs what the policy would have done without blocking anyone, so you can find the people it would lock out, such as users with no MFA method registered, before you enforce. Security defaults is the free all-or-nothing option and Conditional Access is the flexible one. They can't be used together.",
  eq:"Google Admin: enforce 2-Step Verification, with Context-Aware Access for finer rules. Jamf: enforce MFA at your identity provider."},
"Enforce BitLocker with Intune":{l:4,
  why:"Two different jobs. A disk encryption policy configures BitLocker on the device, which makes it true. A compliance policy only checks whether it is on and reports Compliant or Noncompliant. If the two are assigned to different groups, the check evaluates laptops that never received the setting. Sam's laptop is Windows 10, so a policy that also requires Windows 11 will not show that laptop as Compliant.",
  eq:"Jamf: the Mac version is a FileVault configuration profile plus a smart group that checks it is on."},
"Deploy an app":{l:4,
  why:"Required apps install without the user doing anything, while Available apps are only offered in the Company Portal for users to choose. The assignment decides who gets the app, and an app with no assignment does nothing at all.",
  eq:"Jamf: a policy that installs the package, with Self Service for optional apps. Google Admin: force-install apps by organizational unit."},
"Set up Priya's laptop on the virtual Windows PC":{l:4,
  why:"This is the Autopilot flow seen from the PC's side. The errors you can hit on the sign-in screen come from settings you changed in the admin centers: the license, the MDM user scope and the deployment profile. dsregcmd /status is the quickest way to see whether the PC is joined and which MDM URL it received. An empty MdmUrl means the user isn't in the MDM scope.",
  eq:"Jamf: the same moment is Setup Assistant with Automated Device Enrollment. The check command on a Mac is profiles status -type enrollment."},
"Join a spare laptop to Entra by hand":{l:4,
  why:"Joined means the organization owns the PC and people sign in to Windows with their work account. Registered only adds a work account to a personal device, with little control. Joining needs a local administrator on the PC. A joined PC still isn't managed until the user is in the MDM scope and licensed, so joined does not mean managed.",
  eq:"Jamf: this is manual, user-initiated enrollment through the enrollment URL instead of Automated Device Enrollment."}
};
var PNAME={m365:"Microsoft 365 admin center",entra:"Entra admin center",intune:"Intune admin center",exchange:"Exchange admin center",vm:"Windows laptop (virtual)"};
function toolsOf(m){var seen=[];m.s.forEach(function(x){if(seen.indexOf(x[2][0])<0){seen.push(x[2][0]);}});return seen;}
function stepHtml(x){
  var w=x[2];
  return '<li class="'+(x[1]?'on':'')+'"><i aria-hidden="true">'+(x[1]?"&#10003;":"")+'</i><div><span class="st">'+esc(x[0])+'</span><span class="wh"><b class="tag '+w[0]+'">'+esc(PNAME[w[0]])+'</b> '+esc(w[2])+' <button type="button" class="lnk" data-a="go" data-p="'+w[0]+'" data-pg="'+w[1]+'" data-g="1">Go there</button></span></div></li>';
}
function progress(){var tot=0,done=0;missions().forEach(function(m){m.s.forEach(function(x){tot+=1;if(x[1]){done+=1;}});});return [done,tot];}
function levelsView(){
  var ms=missions();
  return LEVELS.map(function(L){
    var list=ms.filter(function(m){return m.l===L.n;}),tot=0,done=0;
    list.forEach(function(m){m.s.forEach(function(x){tot+=1;if(x[1]){done+=1;}});});
    return {n:L.n,name:L.name,d:L.d,ms:list,tot:tot,done:done,complete:tot>0&&done===tot};
  });
}
function nextMission(lv){
  for(var i=0;i<lv.length;i++){for(var j=0;j<lv[i].ms.length;j++){if(!lv[i].ms[j].s.every(function(x){return x[1];})){return lv[i].ms[j];}}}
  return null;
}
function firstOpenStep(m){for(var i=0;i<m.s.length;i++){if(!m.s[i][1]){return m.s[i];}}return m.s[0];}
function whyHtml(m){
  if(!m.why){return "";}
  return '<div class="why"><b>Why it works this way</b><p>'+esc(m.why)+'</p>'+(m.eq?'<p class="eq"><b>Coming from Jamf or Google Admin?</b> '+esc(m.eq)+'</p>':'')+'</div>';
}
function missionHtml(m,next){
  var all=m.s.every(function(x){return x[1];});
  return '<div class="mis'+(all?' done':'')+'"><h3>'+esc(m.t)+(next&&next.t===m.t?'<span class="next">Next up</span>':'')+'</h3><p>'+esc(m.w)+'</p><div class="tools">Tools: '+toolsOf(m).map(function(p){return '<b class="tag '+p+'">'+esc(PNAME[p])+'</b>';}).join(" ")+'</div><ul>'+m.s.map(stepHtml).join("")+'</ul>'+(all?whyHtml(m):'')+'</div>';
}
var EQ=[
 ["Tenant","Your Jamf Pro instance (the server).","Your Google Workspace account and domain."],
 ["Users and groups (Entra ID)","Users usually come from your identity provider. Jamf has static and smart groups.","Directory > Users and Groups."],
 ["License assignment","Jamf Pro is licensed per managed device, so there is no per-user license to assign.","Billing > Subscriptions, then assign a license to the user."],
 ["Administrator roles","Jamf Pro accounts with privilege sets.","Admin roles. Super admin is the closest to Global Administrator."],
 ["MFA","Enforced at your identity provider through single sign-on.","2-Step Verification."],
 ["Conditional Access","Lives in your identity provider. Jamf can supply device compliance signals.","Context-Aware Access."],
 ["Sign-in and audit logs","Change management log, plus your identity provider's sign-in logs.","Reporting > Audit and investigation (Login and Admin)."],
 ["Block sign-in","Disable the user at your identity provider.","Suspend user."],
 ["Revoke sessions","Revoke at your identity provider.","Sign out the user and reset sign-in cookies."],
 ["Windows Autopilot","Automated Device Enrollment through Apple Business Manager or Apple School Manager.","Chrome device enrollment."],
 ["Deployment profile","PreStage enrollment.",""],
 ["Compliance policy","Smart groups and extension attributes that check a setting.",""],
 ["Configuration profile","Configuration Profiles.","Device settings applied per organizational unit."],
 ["Assignments","Scope.","Organizational units and groups."],
 ["Required and Available apps","A policy that installs the app. Self Service for optional apps.","Force-install or allow apps by organizational unit."],
 ["Retire","Remove the MDM profile.","Account wipe."],
 ["Wipe","Erase Device.","Device wipe."],
 ["dsregcmd /status","profiles status -type enrollment (Mac Terminal).",""]
];
function equivHtml(){
  return '<p>Rough translations of the ideas in this lab. They are not one-to-one, because each product splits the work differently, and menus change, so confirm in each vendor\'s current docs.</p><dl class="eql">'+EQ.map(function(r){return '<dt>'+esc(r[0])+'</dt><dd><b>Jamf:</b> '+esc(r[1])+(r[2]?'<br><b>Google Admin:</b> '+esc(r[2]):'')+'</dd>';}).join("")+'</dl>';
}
function guideHtml(){
  var pr=progress(),pct=Math.round(pr[0]/pr[1]*100);
  if(!S.guide){return '<button type="button" class="gbtn" data-a="guide">Lab guide '+pr[0]+'/'+pr[1]+'</button>';}
  var body="";
  if(S.guideTab==="missions"){
    var lv=levelsView(),next=nextMission(lv),alldone=lv.every(function(L){return L.complete;});
    body='<p>Work through the levels in order, or jump around. The portals share the same users, groups, licenses and devices, like a real tenant. Click the <b>i</b> icons for definitions.</p>'+
    (alldone?'<div class="fin"><b>All four levels complete.</b>You finished every mission. <button type="button" class="lnk" data-a="finish">View your summary</button></div>':'')+
    '<div class="meter" role="progressbar" aria-label="Overall progress" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+pct+'%"></i></div><div class="eqn">'+pr[0]+' of '+pr[1]+' steps done</div>'+
    '<div class="map"><b>Which tool for what</b><br>Microsoft 365 admin center: people, licenses, mail forwarding and files.<br>Entra admin center: sign-in security, MFA, roles, groups, and the MDM setting.<br>Intune admin center: laptops, policies, apps, Autopilot.<br>Exchange admin center: mailboxes and mail flow.<br>Windows laptop (virtual): the real work on the PC itself: setup, Settings, joining, Command Prompt.</div>'+
    lv.map(function(L){var lp=L.tot?Math.round(L.done/L.tot*100):0;return '<section class="lvl'+(L.complete?' done':'')+'" aria-label="Level '+L.n+'"><h3>Level '+L.n+': '+esc(L.name)+'<span class="ct">'+(L.complete?'Complete':L.done+'/'+L.tot)+'</span></h3><p>'+esc(L.d)+'</p><div class="meter" role="progressbar" aria-label="Level '+L.n+' progress" aria-valuenow="'+lp+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+lp+'%"></i></div>'+L.ms.map(function(m){return missionHtml(m,next);}).join("")+'</section>';}).join("")+
    '<div class="btnrow">'+B("Introduction walk through","tour",{sm:1})+B("Reset lab","resetLab",{sm:1})+'</div>';
  }else if(S.guideTab==="equiv"){
    body='<h3 style="margin:8px 0 0">Coming from Jamf or Google Admin?</h3>'+equivHtml();
  }else{
    body='<dl class="gl">'+Object.keys(GL).sort(function(a,b){return GL[a][0].localeCompare(GL[b][0]);}).map(function(k){return '<dt>'+esc(GL[k][0])+'</dt><dd>'+esc(GL[k][1])+(GL[k][2]?' <i>'+esc(GL[k][2])+'</i>':'')+'</dd>';}).join("")+'</dl>';
  }
  return '<aside class="guide" aria-label="Lab guide"><header><h2>Lab guide ('+pr[0]+'/'+pr[1]+')</h2><button type="button" class="x" data-a="guide" aria-label="Close guide">'+ico("x")+'</button></header>'+tabs([["missions","Missions"],["glossary","Glossary"],["equiv","Jamf / Google"]],S.guideTab,"gtab")+'<div class="gb">'+body+'</div></aside>';
}

/* =============== FIRST-OPEN TOUR AND FINISH SCREEN =============== */
var INTRO_STEPS=4;/* step 0 is the full-page welcome, steps 1 to 3 are the short tour */
function dots(n){var h='<div class="dots" aria-hidden="true">';for(var i=1;i<INTRO_STEPS;i++){h+='<i'+(i===n?' class="on"':'')+'></i>';}return h+'</div>';}
function welcomeHtml(){
  var pr=progress(),lv=levelsView(),fresh=pr[0]===0,nm=0;
  lv.forEach(function(L){nm+=L.ms.length;});
  var cards=[
    ["device","Nothing to set up","No Microsoft tenant, no sign-up, no install. Open the page and start clicking. Every user, password and device is fake, so you can't break anything."],
    ["play","Guided missions","Follow step-by-step missions that name the portal and the exact menu path. Each step is checked off when you really do it in the lab."],
    ["book","Learn why, not just where","After each mission you get a short explanation of why it works that way, with a comparison for people coming from Jamf or Google Admin."]
  ];
  var pd={1:"Prepare the tenant, onboard a new hire, license by group.",2:"Cut access in the right order and shrink admin rights.",3:"Close every door on a hacked account, then require MFA.",4:"Encryption, apps, and joining laptops to Entra and Intune."};
  return '<div class="welcome" role="dialog" aria-modal="true" aria-labelledby="wT">'+
    '<div class="whero">'+(fresh?'':'<button type="button" class="wx2" data-a="introSkip" aria-label="Close the introduction">'+ico("x")+'</button>')+
      '<div class="wi"><span class="wbadge">Free practice lab</span><h1 id="wT">Learn Microsoft 365 admin work by doing it</h1>'+
      '<p>Practice Microsoft 365, Entra ID, Intune and Exchange in a simulated tenant. No sign-up, nothing to install, and nothing real to break.</p>'+
      '<div class="wcta"><button type="button" class="btn primary big" data-a="introNext">Take the 3-minute tour</button>'+
      (fresh?'<button type="button" class="btn ghost big" data-a="introStart">Skip, start Level 1</button>':'<button type="button" class="btn ghost big" data-a="introSkip">Back to the lab</button>')+'</div>'+
      '<ul class="wstats"><li><b>'+lv.length+'</b>levels</li><li><b>'+nm+'</b>missions</li><li><b>'+pr[1]+'</b>guided steps</li></ul></div></div>'+
    '<div class="wbody">'+
      '<div class="wcards">'+cards.map(function(c){return '<div class="wcard">'+ico(c[0])+'<h2>'+esc(c[1])+'</h2><p>'+esc(c[2])+'</p></div>';}).join("")+'</div>'+
      '<h2 class="wsec">Your learning path</h2><ol class="wpath">'+lv.map(function(L){return '<li><span class="n">'+L.n+'</span><div><b>'+esc(L.name)+'</b><small>'+esc(pd[L.n]||L.d)+'</small></div></li>';}).join("")+'</ol>'+
      '<section class="wwhy" aria-labelledby="whyT"><h2 id="whyT">Why I built this</h2><blockquote>'+
        '<p>Hi, I\'m Mark. When I was learning Microsoft 365 admin work, I kept having to use YouTube to figure out how to do things. I wanted somewhere I could just practice, so I built this to help myself.</p>'+
        '<p>Then I realized that if I had this trouble, a lot of other people must have it too. So I made it free for anyone who is learning the same things.</p></blockquote>'+
        '<p class="wby">Built by Mark. <a href="https://github.com/Markplowwright/admin-practice-lab" target="_blank" rel="noopener">See the project on GitHub</a></p></section>'+
      '<p class="wfoot">This is a learning simulator, not affiliated with or endorsed by Microsoft. Everything in it is fake data. You can come back to this page any time with the Introduction walk through button at the top.</p>'+
    '</div></div>';
}
function introHtml(){
  var n=Math.max(0,Math.min(INTRO_STEPS-1,S.intro||0)),lv=levelsView(),next=nextMission(lv),h="",btns="";
  if(n===0){return welcomeHtml();}
  if(n===1){
    h='<h2 id="introT">Five places you will work</h2><ul class="pl pf">'+
      ['m365','entra','intune','exchange'].map(function(p){var t={m365:"People, licenses, mail forwarding and files.",entra:"Sign-in security, MFA, roles, groups, and who can enroll devices.",intune:"Laptops: Autopilot, policies, apps, retire and wipe.",exchange:"Mailboxes, forwarding and mail flow rules."}[p];return '<li><b class="tag '+p+'">'+esc(PNAME[p])+'</b><span>'+esc(t)+'</span></li>';}).join("")+'</ul>'+
      '<div class="pflap">'+ico("device")+'<div><b class="tag vm">'+esc(PNAME.vm)+'</b><span>A pretend laptop for the on-device steps. What you do here shows up in Entra and Intune.</span></div></div>'+
      '<p class="small">All five share one set of users, groups, licenses and devices, like a real tenant.</p>';
    btns='<button type="button" class="btn link" data-a="introSkip">Skip</button><span class="sp"></span><button type="button" class="btn" data-a="introBack">Back</button><button type="button" class="btn primary" data-a="introNext">Next</button>';
  }else if(n===2){
    h='<h2 id="introT">How missions work</h2><ul class="pl"><li>Open the <b>Lab guide</b> with the yellow button at the bottom right. Each mission is a short list of steps.</li><li>Every step names the portal and the menu path, with a <b>Go there</b> button that jumps straight to it.</li><li>A step is checked off when you actually do it in the lab, not when you click it.</li><li>When you finish a mission, the guide explains <b>why it works that way</b>.</li><li>Click the <b>i</b> icons anywhere for plain-English definitions.</li><li>Mistakes are safe. <b>Reset lab</b> in the guide restores the starting state.</li></ul><p class="small">Progress is saved in this browser only.</p>';
    btns='<button type="button" class="btn link" data-a="introSkip">Skip</button><span class="sp"></span><button type="button" class="btn" data-a="introBack">Back</button><button type="button" class="btn primary" data-a="introNext">Next</button>';
  }else{
    var fresh=progress()[0]===0;
    h='<h2 id="introT">Your learning path</h2><ul class="pl">'+lv.map(function(L){return '<li><b>Level '+L.n+': '+esc(L.name)+'</b> ('+L.ms.length+(L.ms.length===1?' mission':' missions')+')<br><span class="small">'+esc(L.d)+'</span></li>';}).join("")+'</ul>'+(next?'<p>'+(fresh?'First up':'Next up')+': <b>'+esc(next.t)+'</b>. '+esc(next.w)+'</p>':'')+'<p class="small">Coming from Jamf or Google Admin? The guide has a Jamf / Google tab that translates the ideas.</p>';
    btns='<span class="sp"></span><button type="button" class="btn" data-a="introBack">Back</button>'+(fresh?'<button type="button" class="btn primary" data-a="introStart">Start Level 1</button>':'<button type="button" class="btn primary" data-a="introStart">Continue where I left off</button>');
  }
  return '<div class="introwrap"><div class="intro'+(n===1?' compact':'')+'" role="dialog" aria-modal="true" aria-labelledby="introT"><div class="stp">Step '+n+' of '+(INTRO_STEPS-1)+'</div>'+dots(n)+h+'<div class="btnrow">'+btns+'</div></div></div>';
}
function finishHtml(){
  var lv=levelsView();
  return '<div class="introwrap"><div class="intro" role="dialog" aria-modal="true" aria-labelledby="finT"><h2 id="finT">You finished Admin Practice Lab</h2><p>All four levels are complete. Here is what you practiced:</p><ul class="pl">'+lv.map(function(L){return '<li><b>Level '+L.n+': '+esc(L.name)+'</b><br><span class="small">'+L.ms.map(function(m){return esc(m.t);}).join("; ")+'</span></li>';}).join("")+'</ul><p>Next, check each procedure against Microsoft\'s current documentation, and try the real thing in a test tenant before you touch a production one. This lab is a simulation, so portal layouts will differ.</p><div class="btnrow"><button type="button" class="btn link" data-a="finishReset">Reset lab to practice again</button><span class="sp"></span><button type="button" class="btn primary" data-a="finishClose">Close</button></div></div></div>';
}
