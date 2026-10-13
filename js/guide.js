"use strict";
/* =============== NAV + SHELL =============== */
var TITLES={m365:"Microsoft 365 admin center",ad:"Active Directory",entra:"Microsoft Entra admin center",intune:"Microsoft Intune admin center",exchange:"Exchange admin center",vm:"Windows laptop (virtual)"};
var DEFAULT={m365:"home",ad:"aduc",entra:"overview",intune:"home",exchange:"mailboxes",vm:"d2"};
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
  ,ad:[{pg:"aduc",l:"Active Directory Users and Computers",i:"users"},{pg:"gpmc",l:"Group Policy Management",i:"gear"},{pg:"sync",l:"Microsoft Entra Connect Sync",i:"refresh"},
    {sep:"Related"},{go:["entra","users"],l:"Synced users (Entra)",i:"shield"},{go:["vm","d3"],l:"Windows laptop",i:"device"}]
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
  return '<div class="lab"><b>Practice lab</b><button type="button" class="introbtn" data-a="tour">Introduction walk through</button>'+["m365","ad","entra","intune","exchange","vm"].map(function(p){return '<button type="button" data-a="go" data-p="'+p+'" data-pg="'+DEFAULT[p]+'"'+(S.portal===p?' aria-current="true"':'')+'>'+esc(TITLES[p])+'</button>';}).join("")+'<span class="sp"></span><span>Simulated. Not the real portals.</span></div>';
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
     ["Reset her password at the authoritative AD source",ADU("adu1").passwordChanged,["ad","aduc","Active Directory Users and Computers > Staff > Dana Rivera > Account > Reset password"]],
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
     ["Optional: Connect without Join on a laptop and compare Registered vs Joined in Entra",!!S.flags.vmRegistered,["entra","devices","Devices > All devices > Join type"]]]},
   {t:"Onboard a user through Active Directory",w:"Create the identity at its source, synchronize it, then license the cloud copy.",s:[
     ["Create a new user in the Staff OU",S.ad.users.some(function(u){return u.created&&u.ou==="ou-staff";}),["ad","aduc","Active Directory Users and Computers > Staff > New user"]],
     ["Run a delta synchronization",S.ad.lastDirSyncMin===S.ad.nowMin,["ad","sync","Microsoft Entra Connect Sync > Run delta sync"]],
     ["Confirm the synced user appears in Entra",S.ad.users.some(function(a){var c=cloudForAd(a);return a.created&&c&&!c.deleted;}),["entra","users","Users > All users > Source: Windows Server AD"]],
     ["Set usage location and assign a license",S.ad.users.some(function(a){var c=cloudForAd(a);return a.created&&c&&hasLicense(c);}),["m365","users","Users > Active users > Licenses and apps"]]]},
   {t:"Unlock and reset an on-premises account",w:"For a synchronized user, account lockout and password authority remain in Active Directory.",s:[
     ["Open Dana Rivera in ADUC and unlock the account",!ADU("adu1").locked,["ad","aduc","Active Directory Users and Computers > Staff > Dana Rivera > Account"]],
     ["Reset Dana's password and require a change at next logon",ADU("adu1").passwordChanged&&ADU("adu1").mustChange,["ad","aduc","Dana Rivera > Account > Reset password"]]]},
   {t:"Offboard a synchronized user",w:"Disable access at the source, move the object out of sync scope, synchronize, and reclaim cloud licensing.",s:[
     ["Disable Marcus in AD",!ADU("adu4").enabled,["ad","aduc","Staff > Marcus Lee > Account > Disable account"]],
     ["Move Marcus to Disabled Users",ADU("adu4").ou==="ou-disabled",["ad","aduc","Marcus Lee > Move > Disabled Users"]],
     ["Run delta sync and confirm Entra blocks or removes the user",(function(){var c=cloudForAd(ADU("adu4"));return c&&(c.blocked||c.deleted);})(),["ad","sync","Microsoft Entra Connect Sync > Run delta sync"]],
     ["Confirm his Microsoft 365 license is reclaimed",(function(){var c=cloudForAd(ADU("adu4"));return c&&!hasLicense(c);})(),["m365","licenses","Billing > Licenses > Microsoft 365 Business Premium"]]]},
   {t:"Synchronize a security group",w:"Access groups originate in AD and their membership reaches Entra on the next directory sync.",s:[
     ["Add Sam to the Finance security group",ADG("adg1").members.indexOf("adu2")>-1,["ad","aduc","Finance > Add member > Sam Ortiz"]],
     ["Run delta sync and verify Finance in Entra",(function(){var g=G("g1");return g&&g.members.indexOf("u2")>-1;})(),["entra","groups","Groups > All groups > Finance > Members"]]]},
   {t:"Apply Group Policy to a domain laptop",w:"The computer and user OUs decide which linked policies apply.",s:[
     ["Join the spare laptop to practice.local",!!D("d3").domainJoined,["vm","d3","Settings > Accounts > Access work or school > Join a domain"]],
     ["Run gpupdate /force",!!D("d3").gpUpdated,["vm","d3","Command Prompt > gpupdate /force"]],
     ["Verify the drive map and wallpaper policies",!!D("d3").driveMapped&&!!D("d3").wallpaperApplied,["vm","d3","Command Prompt > gpresult /r"]]]},
   {t:"Complete a hybrid device join",w:"A domain computer is registered in Entra by the hybrid identity configuration.",s:[
     ["Domain join the spare laptop",!!D("d3").domainJoined,["vm","d3","Settings > Accounts > Access work or school > Join a domain"]],
     ["Move its computer account into the synced Computers OU",(function(){var c=S.ad.computers.filter(function(x){return x.deviceId==="d3";})[0];return c&&c.ou==="ou-computers";})(),["ad","aduc","Active Directory Users and Computers > computer > Move > Computers"]],
     ["Run delta sync and verify Hybrid Azure AD joined",!!D("d3").azureAdJoined,["entra","devices","Devices > All devices > Join type"]]]},
   {t:"Fix a password at its source",w:"Password writeback is not enabled, so resetting a synchronized account in Microsoft 365 cannot update AD.",s:[
     ["Observe the managed on-premises message for Sam",!!S.scenarios.wrong.corePw,["m365","users","Active users > Sam Ortiz > Reset password"]],
     ["Reset Sam's password in ADUC",ADU("adu2").passwordChanged,["ad","aduc","Staff > Sam Ortiz > Account > Reset password"]],
     ["Run password synchronization",(function(){var a=ADU("adu2"),c=cloudForAd(a);return c&&c.pw===a.pw;})(),["ad","sync","Microsoft Entra Connect Sync > Run delta sync"]]]}
  ];
  list.forEach(function(m){var x=MMETA[m.t]||{};m.l=x.l||1;m.why=x.why||"";m.eq=x.eq||"";});
  return list;
}
/* Level and "why it works this way" text for each mission, keyed by mission title. */
var LEVELS=[
  {n:1,name:"Onboarding",d:"Prepare the tenant, bring a new hire online, and learn group licensing."},
  {n:2,name:"Offboarding",d:"Cut access in the right order, keep the files, and shrink admin rights."},
  {n:3,name:"Compromised accounts and MFA",d:"Close every door an attacker opened, then make the next attack harder."},
  {n:4,name:"Intune and laptops",d:"Encrypt, deploy apps, and watch enrollment succeed and fail on a virtual PC."},
  {n:5,name:"Hybrid identity",d:"Manage Active Directory, synchronize identities, apply Group Policy, hybrid join devices, and solve real help-desk tickets."}
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
  eq:"Jamf: this is manual, user-initiated enrollment through the enrollment URL instead of Automated Device Enrollment."},
"Onboard a user through Active Directory":{l:5,why:"In a hybrid environment, AD is the source of authority. The cloud account does not exist until synchronization, and its Microsoft 365 license is still assigned in the cloud.",eq:"Google Cloud Directory Sync follows the same source-and-copy idea. Jamf handles the device after identity provisioning."},
"Unlock and reset an on-premises account":{l:5,why:"A synchronized account's lockout and password are controlled by Active Directory. A cloud portal cannot repair the authoritative on-premises credential when password writeback is not enabled.",eq:"Reset the credential in the authoritative identity provider, then let connected services receive the change."},
"Offboard a synchronized user":{l:5,why:"Disabling at the source cuts new authentication. Moving the object out of sync scope causes a cloud soft deletion on the next cycle; cloud sessions and licensing still need explicit attention.",eq:"Google directory sync also requires coordinating source suspension, cloud sessions, and licensing."},
"Synchronize a security group":{l:5,why:"A security group can grant access; a distribution group only distributes mail. Synced membership is changed in AD and copied to Entra.",eq:"Google Groups can grant access or distribute mail depending on configuration."},
"Apply Group Policy to a domain laptop":{l:5,why:"GPO links are evaluated against domain and OU placement. gpupdate requests policy now and gpresult shows what actually applied.",eq:"Jamf configuration profiles and policies are the closest management equivalent."},
"Complete a hybrid device join":{l:5,why:"Hybrid join means the same PC is joined to practice.local and registered in Entra. The computer account must be in synchronization scope; the user's sync status alone does not create hybrid join.",eq:"Jamf enrollment plus identity-provider device registration is an approximate comparison."},
"Fix a password at its source":{l:5,why:"The source of authority decides where a change is valid. Password hash sync copies an AD password hash to Entra; password writeback, which this lab leaves disabled, is the reverse direction.",eq:"The same principle applies to any directory synchronized from an HR or identity source."}
};
var PNAME={m365:"Microsoft 365 admin center",ad:"Active Directory",entra:"Entra admin center",intune:"Intune admin center",exchange:"Exchange admin center",vm:"Windows laptop (virtual)"};
function toolsOf(m){var seen=[];m.s.forEach(function(x){if(seen.indexOf(x[2][0])<0){seen.push(x[2][0]);}});return seen;}
function stepHtml(x){
  var w=x[2];
  return '<li class="'+(x[1]?'on':'')+'"><i aria-hidden="true">'+(x[1]?"&#10003;":"")+'</i><div><span class="st">'+esc(x[0])+'</span><span class="wh"><b class="tag '+w[0]+'">'+esc(PNAME[w[0]])+'</b> '+esc(w[2])+' <button type="button" class="lnk" data-a="go" data-p="'+w[0]+'" data-pg="'+w[1]+'" data-g="1">Go there</button></span></div></li>';
}

/* =============== REAL-WORLD HYBRID SCENARIOS =============== */
var SCENARIOS=[
 {id:"s1",difficulty:"Easy",title:"I'm locked out",ticket:"Dana can't log in, says her account is locked. She changed her password over the weekend on her phone.",hint:"Active Directory > AD Users and Computers > Staff > Dana Rivera > Account.",cause:"An old password cached on a phone can repeatedly lock an AD account.",say:"I unlocked your account and reset the password. Please update the saved password on your phone before trying again.",note:"Verified Dana's AD account was locked. Unlocked the account, reset the password with change required at next logon, and advised the user to update cached mobile credentials."},
 {id:"s2",difficulty:"Medium",title:"Password reset says managed on-premises",ticket:"Sam's password reset in the Microsoft 365 admin center keeps failing or doesn't work.",hint:"Check the user's source in Entra, then use ADUC > Sam Ortiz > Account > Reset password and synchronize.",cause:"Sam's source of authority is AD and password writeback is not enabled.",say:"Your password is managed by our on-premises directory. I reset it there and synchronized the change.",note:"Confirmed Sam is synchronized from Windows Server AD. Reset the authoritative AD password and verified password hash synchronization completed."},
 {id:"s3",difficulty:"Medium",title:"New hire starts tomorrow",ticket:"Priya Nair starts tomorrow in Finance. She needs email, the Finance shared drive, and a laptop.",hint:"Create Priya in ADUC > Staff, add Finance, sync, license the Entra user, then domain join the spare laptop.",cause:"Hybrid onboarding spans the authoritative directory, cloud licensing, access groups, and the device.",say:"Your account, email license, Finance access, and laptop are prepared for your start date.",note:"Created Priya in the Staff OU, added the Finance security group, synchronized to Entra, assigned Business Premium, and joined the laptop to practice.local."},
 {id:"s4",difficulty:"Hard",title:"Employee left today",ticket:"Marcus Lee was let go at 3 PM. Make sure he can't access anything.",hint:"Disable and reset in AD first, remove access, move to Disabled Users, sync, revoke cloud sessions, reclaim the license, and retire or wipe the device.",cause:"Directory sync has delay and existing cloud sessions survive until explicitly revoked.",say:"Access is blocked, active sessions are revoked, memberships and licensing are removed, and the assigned laptop is retired.",note:"Disabled and reset Marcus in AD, removed group access, moved the object outside sync scope, synchronized, revoked sessions, reclaimed the license, and retired the device."},
 {id:"s5",difficulty:"Easy",title:"Can't reach the shared drive",ticket:"Sam can't open the Finance share. It worked for everyone else.",hint:"ADUC > Sam Ortiz > Member Of. Add the Finance security group, not Finance Announcements, then refresh policy or sign in again.",cause:"Distribution groups deliver mail but do not grant file permissions; a new token or sign-in is needed after security membership changes.",say:"You were in the Finance mailing list, not the access group. I corrected membership and refreshed policy.",note:"Found Sam in the Finance distribution group only. Added the Finance security group, synchronized membership, and refreshed Group Policy."},
 {id:"s6",difficulty:"Medium",title:"My laptop doesn't have the drive map or wallpaper",ticket:"Everyone else got the new wallpaper. Mine didn't.",hint:"Check GPMC links and ADUC computer OU placement, move the computer to Computers, then run gpupdate /force and gpresult /r.",cause:"GPOs apply only when their link and the user or computer OU are in scope.",say:"The laptop was in the wrong OU. I moved it into policy scope and forced a Group Policy refresh.",note:"Verified GPO links, moved the computer account to the Computers OU, ran gpupdate /force, and confirmed applied GPOs with gpresult /r."},
 {id:"s7",difficulty:"Medium",title:"Laptop says the trust relationship failed",ticket:"Dana's laptop says 'The trust relationship between this workstation and the primary domain failed.'",hint:"Sign in as LocalAdmin, reset the computer account in ADUC, restart, and test a domain sign-in.",cause:"The PC and its AD computer account disagree about the rotating machine password used for their secure channel.",say:"I repaired the computer's domain trust and confirmed domain authentication works again.",note:"Reproduced the secure-channel failure, reset the AD computer account, restarted the laptop, and verified a domain sign-in."},
 {id:"s8",difficulty:"Medium",title:"New user doesn't appear in Microsoft 365",ticket:"I created Alex in AD an hour ago and he's not in the admin center.",hint:"Check Entra Connect OU filtering. Alex is in an excluded OU; move the user into Staff and run delta sync.",cause:"Entra Connect ignores objects in OUs outside its configured synchronization scope.",say:"Alex was in an OU excluded from cloud sync. I moved the account into scope and synchronized it.",note:"Confirmed Alex existed only in AD, found the OU filtering exclusion, moved the object to Staff, ran delta sync, and verified the Entra account."},
 {id:"s9",difficulty:"Easy",title:"Contractor access expires Friday",ticket:"The contractor needs access until Friday only.",hint:"ADUC > New user > Account expires, add the required security group, then synchronize.",cause:"AD account expiration blocks authentication at the set time, but data, sessions, groups, and devices still need offboarding.",say:"The contractor account is active through Friday and has only the required group access.",note:"Created the contractor in AD with a Friday expiration, assigned the required security group, and synchronized the account to Entra."},
 {id:"s10",difficulty:"Hard",title:"Suspicious sign-ins",ticket:"Dana got a phishing email yesterday and today there are sign-in alerts from another country.",hint:"Reset at the AD source, sync, revoke sessions, inspect Entra sign-ins, remove Exchange forwarding, and require MFA re-registration.",cause:"A hybrid compromise can persist through cloud sessions, MFA methods, and mail forwarding even after an on-premises password reset.",say:"I reset the authoritative password, ended sessions, removed persistence, and will help you register MFA again.",note:"Reviewed the suspicious sign-in, reset Dana in AD, synchronized, revoked sessions, removed the rogue method and forwarding, and required MFA re-registration."}
];
var SCENARIO_KEYS=["users","groups","licenseGroups","devices","ad","logs","mailRules","policies","profiles","apps","caPolicies","mdm","total","flags"];
function scenarioSnapshot(){var x={};SCENARIO_KEYS.forEach(function(k){x[k]=S[k];});return JSON.stringify(x);}
function scenarioRestore(raw){if(!raw){return;}var x=JSON.parse(raw);SCENARIO_KEYS.forEach(function(k){S[k]=x[k];});}
function scenarioSetup(id){
  var a,c,d,g;
  if(id==="s1"){a=ADU("adu1");a.locked=true;a.passwordChanged=false;S.scenarios.phoneUpdated=false;}
  if(id==="s2"){a=ADU("adu2");a.passwordChanged=false;S.scenarios.wrong.s2=false;}
  if(id==="s3"){a=ADU("adu3");S.ad.users=S.ad.users.filter(function(u){return u.id!=="adu3";});c=U("u3");c.deleted=true;c.direct=false;S.ad.groups.forEach(function(x){x.members=x.members.filter(function(mid){return mid!=="adu3";});});d=D("d3");resetDevice(d);}
  if(id==="s4"){a=ADU("adu4");a.enabled=true;a.ou="ou-staff";a.passwordChanged=false;c=U("u4");c.deleted=false;c.blocked=false;c.revoked=false;c.direct=true;ADG("adg1").members.push("adu4");d=D("d1");d.userId="u4";d.state="enrolled";}
  if(id==="s5"){a=ADU("adu2");ADG("adg1").members=ADG("adg1").members.filter(function(x){return x!==a.id;});if(ADG("adg2").members.indexOf(a.id)<0){ADG("adg2").members.push(a.id);}d=D("d3");domainJoin(d,AD_DOMAIN,S.ad.adminUser,S.ad.adminPw);d.joinUser="u2";d.userId="u2";ensureVm(d);}
  if(id==="s6"){d=D("d3");domainJoin(d,AD_DOMAIN,S.ad.adminUser,S.ad.adminPw);c=S.ad.computers.filter(function(x){return x.deviceId==="d3";})[0];c.ou="ou-servers";d.joinUser="u2";d.userId="u2";ensureVm(d);}
  if(id==="s7"){d=D("d3");domainJoin(d,AD_DOMAIN,S.ad.adminUser,S.ad.adminPw);c=S.ad.computers.filter(function(x){return x.deviceId==="d3";})[0];c.trustOk=false;d.secureChannel=false;d.restartedAfterTrust=false;ensureVm(d);}
  if(id==="s8"){a=ADU("adu5");a.ou="ou-servers";a.cloudId=null;}
  if(id==="s9"){S.ad.users=S.ad.users.filter(function(u){return !u.created||u.department!=="Contractor";});}
  if(id==="s10"){a=ADU("adu1");a.passwordChanged=false;c=U("u1");c.revoked=false;c.fwd="collect.dana@mailbox-drop.example";if(!c.methods.some(function(m){return m.sus;})){c.methods.push({id:nid("m"),type:"Phone (SMS)",detail:"+234 803 555 0142",sus:true});}S.flags.spottedOdd=false;}
}
function scenarioDone(id){
  var a,c,d,g;
  if(id==="s1"){a=ADU("adu1");return !a.locked&&a.passwordChanged&&!!S.scenarios.phoneUpdated;}
  if(id==="s2"){a=ADU("adu2");c=cloudForAd(a);return a.passwordChanged&&c&&c.pw===a.pw;}
  if(id==="s3"){a=S.ad.users.filter(function(u){return u.name==="Priya Nair"&&u.created;})[0];c=cloudForAd(a);return !!(a&&a.ou==="ou-staff"&&ADG("adg1").members.indexOf(a.id)>-1&&c&&!c.deleted&&hasLicense(c)&&D("d3").domainJoined);}
  if(id==="s4"){a=ADU("adu4");c=cloudForAd(a);d=D("d1");return !a.enabled&&a.passwordChanged&&a.ou==="ou-disabled"&&!S.ad.groups.some(function(x){return x.members.indexOf(a.id)>-1;})&&c&&c.revoked&&!hasLicense(c)&&d.state!=="enrolled";}
  if(id==="s5"){return ADG("adg1").members.indexOf("adu2")>-1&&D("d3").gpUpdated&&D("d3").driveMapped;}
  if(id==="s6"){c=S.ad.computers.filter(function(x){return x.deviceId==="d3";})[0];d=D("d3");return c&&c.ou==="ou-computers"&&d.gpUpdated&&d.wallpaperApplied;}
  if(id==="s7"){c=S.ad.computers.filter(function(x){return x.deviceId==="d3";})[0];return c&&c.trustOk&&D("d3").secureChannel!==false&&D("d3").restartedAfterTrust;}
  if(id==="s8"){a=ADU("adu5");c=cloudForAd(a);return a.ou!=="ou-servers"&&adInScope(a)&&c&&!c.deleted;}
  if(id==="s9"){a=S.ad.users.filter(function(u){return u.created&&u.department==="Contractor"&&u.expires!=null;})[0];c=cloudForAd(a);return !!(a&&S.ad.groups.some(function(x){return x.type==="Security"&&x.members.indexOf(a.id)>-1;})&&c&&!c.deleted);}
  if(id==="s10"){a=ADU("adu1");c=cloudForAd(a);return a.passwordChanged&&c&&c.pw===a.pw&&c.revoked&&!c.fwd&&!c.methods.length&&S.flags.spottedOdd;}
  return false;
}
function scenarioSteps(id){
  var a,c,d;
  if(id==="s1"){a=ADU("adu1");return [["Account unlocked",!a.locked],["Password reset in AD",a.passwordChanged],["Cached phone password addressed",!!S.scenarios.phoneUpdated]];}
  if(id==="s2"){a=ADU("adu2");c=cloudForAd(a);return [["Password reset at the AD source",a.passwordChanged],["Password hash synchronized",!!(c&&c.pw===a.pw)]];}
  if(id==="s3"){a=S.ad.users.filter(function(u){return u.name==="Priya Nair"&&u.created;})[0];c=cloudForAd(a);return [["AD user created in Staff",!!(a&&a.ou==="ou-staff")],["Finance security membership",!!(a&&ADG("adg1").members.indexOf(a.id)>-1)],["Visible in Entra after sync",!!(c&&!c.deleted)],["Usage location and license",!!(c&&hasLicense(c))],["Laptop domain joined",!!D("d3").domainJoined]];}
  if(id==="s4"){a=ADU("adu4");c=cloudForAd(a);return [["Disabled and password reset in AD",!a.enabled&&a.passwordChanged],["Moved to Disabled Users and groups removed",a.ou==="ou-disabled"&&!S.ad.groups.some(function(g){return g.members.indexOf(a.id)>-1;})],["Synced and cloud sessions revoked",!!(c&&(c.blocked||c.deleted)&&c.revoked)],["License reclaimed",!!(c&&!hasLicense(c))],["Device retired or wiped",D("d1").state!=="enrolled"]];}
  if(id==="s5"){return [["Finance security group added",ADG("adg1").members.indexOf("adu2")>-1],["Policy/token refreshed and drive available",!!D("d3").driveMapped]];}
  if(id==="s6"){c=S.ad.computers.filter(function(x){return x.deviceId==="d3";})[0];d=D("d3");return [["Computer moved to Computers OU",!!(c&&c.ou==="ou-computers")],["gpupdate completed",!!d.gpUpdated],["Wallpaper GPO verified",!!d.wallpaperApplied]];}
  if(id==="s7"){c=S.ad.computers.filter(function(x){return x.deviceId==="d3";})[0];d=D("d3");return [["Computer account reset",!!(c&&c.trustOk&&d.secureChannel!==false)],["Laptop restarted",!!d.restartedAfterTrust]];}
  if(id==="s8"){a=ADU("adu5");c=cloudForAd(a);return [["User moved into sync scope",adInScope(a)],["Delta sync completed and user appears",!!(c&&!c.deleted)]];}
  if(id==="s9"){a=S.ad.users.filter(function(u){return u.created&&u.department==="Contractor";})[0];c=cloudForAd(a);return [["Contractor created with expiration",!!(a&&a.expires!=null)],["Security group assigned",!!(a&&S.ad.groups.some(function(g){return g.type==="Security"&&g.members.indexOf(a.id)>-1;}))],["Synchronized to Entra",!!(c&&!c.deleted)]];}
  if(id==="s10"){a=ADU("adu1");c=cloudForAd(a);return [["Suspicious sign-in reviewed",!!S.flags.spottedOdd],["AD password reset and synchronized",!!(a.passwordChanged&&c&&c.pw===a.pw)],["Sessions revoked",!!(c&&c.revoked)],["Forwarding and rogue MFA removed",!!(c&&!c.fwd&&!c.methods.length)]];}
  return [];
}
function scenarioFeedback(s){
  if(S.scenarios.wrong[s.id]){return '<div class="msg warn">That action did not fix the authoritative cause. Read the object source and follow the ticket evidence before trying again.</div>';}
  return '<div class="msg">The ticket is still open. Completion checks the resulting user, group, device, sync, and security state—not which buttons were clicked.</div>';
}
A.startScenario=function(d){
  if(S.scenarios.active&&S.scenarios.base){scenarioRestore(S.scenarios.base);}
  S.scenarios.active=d.id;S.scenarios.base=scenarioSnapshot();scenarioSetup(d.id);S.scenarios.setup=scenarioSnapshot();S.guide=true;S.guideTab="scenarios";resetNav();toast("Scenario started. Its setup is isolated from your main lab progress.");
};
A.resetScenario=function(){var active=S.scenarios.active,completed=S.scenarios.completed,hint=S.scenarios.hint,wrong=S.scenarios.wrong,base=S.scenarios.base;scenarioRestore(S.scenarios.setup);S.scenarios={active:active,completed:completed,hint:hint,wrong:wrong,base:base,setup:S.scenarios.setup};toast("This scenario was restored to its starting state.");};
A.exitScenario=function(){var completed=S.scenarios.completed,hint=S.scenarios.hint,wrong=S.scenarios.wrong;if(S.scenarios.base){scenarioRestore(S.scenarios.base);}S.scenarios={active:null,completed:completed,hint:hint,wrong:wrong,base:null,setup:null};toast("Returned to your main lab. Scenario completion was saved.");};
A.scenarioHint=function(d){S.scenarios.hint[d.id]=!S.scenarios.hint[d.id];};
A.scenarioPhone=function(){S.scenarios.phoneUpdated=true;toast("Ticket note updated: Dana will replace the saved phone password.");};
function scenariosHtml(){
  var active=S.scenarios.active;
  return '<div class="scenarios"><h3>Real-world scenarios</h3><p>Start these in any order. One isolated ticket is active at a time, so resetting or leaving it does not erase the main lab.</p>'+
    SCENARIOS.map(function(s){var done=!!S.scenarios.completed[s.id];if(active===s.id&&scenarioDone(s.id)){done=true;S.scenarios.completed[s.id]=true;}
      var h='<article class="mis scenario'+(done?' done':'')+'"><h3>'+esc(s.title)+' '+badge(s.difficulty,s.difficulty==="Hard"?"bad":s.difficulty==="Medium"?"warn":"ok")+(done?' '+badge("Complete","ok"):"")+'</h3><blockquote>'+esc(s.ticket)+'</blockquote>';
      if(active===s.id){h+='<div class="btnrow">'+B("Hint","scenarioHint",{sm:1,d:{id:s.id}})+B("Reset this scenario","resetScenario",{sm:1})+B("Leave scenario","exitScenario",{sm:1})+'</div>'+(S.scenarios.hint[s.id]?'<div class="msg">'+esc(s.hint)+'</div>':'')+(s.id==="s1"?B("Tell Dana to update her phone password","scenarioPhone",{sm:1}):"")+
        '<ul>'+scenarioSteps(s.id).map(function(x){return '<li class="'+(x[1]?'on':'')+'"><i aria-hidden="true">'+(x[1]?"&#10003;":"")+'</i><div><span class="st">'+esc(x[0])+'</span></div></li>';}).join("")+'</ul>';
        h+=done?'<div class="why"><b>Why this happens</b><p>'+esc(s.cause)+'</p><p><b>What to say:</b> '+esc(s.say)+'</p><p><b>Good ticket note:</b> '+esc(s.note)+'</p></div>':scenarioFeedback(s);
      }else{h+=B(done?"Practice again":"Start scenario","startScenario",{primary:!done,d:{id:s.id}});}
      return h+'</article>';
    }).join("")+'</div>';
}
function progress(){var tot=SCENARIOS.length,done=SCENARIOS.filter(function(s){return S.scenarios.completed[s.id];}).length;missions().forEach(function(m){m.s.forEach(function(x){tot+=1;if(x[1]){done+=1;}});});return [done,tot];}
function levelsView(){
  var ms=missions();
  return LEVELS.map(function(L){
    var list=ms.filter(function(m){return m.l===L.n;}),tot=0,done=0;
    list.forEach(function(m){m.s.forEach(function(x){tot+=1;if(x[1]){done+=1;}});});
    if(L.n===5){tot+=SCENARIOS.length;done+=SCENARIOS.filter(function(s){return S.scenarios.completed[s.id];}).length;}
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
 ["Active Directory","Usually supplied by the identity provider connected to Jamf.","Directory users plus an external sync source when used."],
 ["Organizational unit (AD)","Static groups and scope are the closest operational comparison.","Organizational units."],
 ["Group Policy","Configuration profiles and policies.","Device settings applied by organizational unit."],
 ["Entra Connect Sync","Directory synchronization from the identity provider.","Google Cloud Directory Sync is the closest equivalent."],
 ["Hybrid join","MDM enrollment plus identity-provider device registration is an approximation.","Managed Windows device plus cloud identity registration."],
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
    (alldone?'<div class="fin"><b>All '+lv.length+' levels complete.</b>You finished every mission and scenario. <button type="button" class="lnk" data-a="finish">View your summary</button></div>':'')+
    '<div class="meter" role="progressbar" aria-label="Overall progress" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+pct+'%"></i></div><div class="eqn">'+pr[0]+' of '+pr[1]+' steps done</div>'+
    '<div class="map"><b>Which tool for what</b><br>Active Directory: on-premises users, groups, computers, OUs, Group Policy, and directory sync.<br>Microsoft 365 admin center: people, licenses, mail forwarding and files.<br>Entra admin center: synced identity, sign-in security, MFA, roles, groups, and the MDM setting.<br>Intune admin center: laptops, policies, apps, Autopilot.<br>Exchange admin center: mailboxes and mail flow.<br>Windows laptop (virtual): setup, domain or Entra join, Command Prompt, Group Policy, and troubleshooting.</div>'+
    lv.map(function(L){var lp=L.tot?Math.round(L.done/L.tot*100):0;return '<section class="lvl'+(L.complete?' done':'')+'" aria-label="Level '+L.n+'"><h3>Level '+L.n+': '+esc(L.name)+'<span class="ct">'+(L.complete?'Complete':L.done+'/'+L.tot)+'</span></h3><p>'+esc(L.d)+'</p><div class="meter" role="progressbar" aria-label="Level '+L.n+' progress" aria-valuenow="'+lp+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+lp+'%"></i></div>'+L.ms.map(function(m){return missionHtml(m,next);}).join("")+(L.n===5?'<div class="btnrow">'+B("Open real-world scenarios","gtab",{primary:1,d:{t:"scenarios"}})+'</div>':"")+'</section>';}).join("")+
    '<div class="btnrow">'+B("Introduction walk through","tour",{sm:1})+B("Reset lab","resetLab",{sm:1})+'</div>';
  }else if(S.guideTab==="scenarios"){
    body=scenariosHtml();
  }else if(S.guideTab==="equiv"){
    body='<h3 style="margin:8px 0 0">Coming from Jamf or Google Admin?</h3>'+equivHtml();
  }else{
    body='<dl class="gl">'+Object.keys(GL).sort(function(a,b){return GL[a][0].localeCompare(GL[b][0]);}).map(function(k){return '<dt>'+esc(GL[k][0])+'</dt><dd>'+esc(GL[k][1])+(GL[k][2]?' <i>'+esc(GL[k][2])+'</i>':'')+'</dd>';}).join("")+'</dl>';
  }
  return '<aside class="guide" aria-label="Lab guide"><header><h2>Lab guide ('+pr[0]+'/'+pr[1]+')</h2><button type="button" class="x" data-a="guide" aria-label="Close guide">'+ico("x")+'</button></header>'+tabs([["missions","Missions"],["scenarios","Scenarios"],["glossary","Glossary"],["equiv","Jamf / Google"]],S.guideTab,"gtab")+'<div class="gb">'+body+'</div></aside>';
}

/* =============== FIRST-OPEN TOUR AND FINISH SCREEN =============== */
var INTRO_STEPS=4;/* step 0 is the full-page welcome, steps 1 to 3 are the short tour */
function dots(n){var h='<div class="dots" aria-hidden="true">';for(var i=1;i<INTRO_STEPS;i++){h+='<i'+(i===n?' class="on"':'')+'></i>';}return h+'</div>';}
function welcomeHtml(){
  var pr=progress(),lv=levelsView(),fresh=pr[0]===0,nm=0;
  lv.forEach(function(L){nm+=L.ms.length;});nm+=SCENARIOS.length;
  var cards=[
    ["device","Nothing to set up","No Microsoft tenant, no sign-up, no install. Open the page and start clicking. Every user, password and device is fake, so you can't break anything."],
    ["play","Guided missions","Follow step-by-step missions that name the portal and the exact menu path. Each step is checked off when you really do it in the lab."],
    ["book","Learn why, not just where","After each mission you get a short explanation of why it works that way, with a comparison for people coming from Jamf or Google Admin."]
  ];
  var pd={1:"Prepare the tenant, onboard a new hire, license by group.",2:"Cut access in the right order and shrink admin rights.",3:"Close every door on a hacked account, then require MFA.",4:"Encryption, apps, and joining laptops to Entra and Intune.",5:"Active Directory, synchronization, Group Policy, hybrid join, and real help-desk tickets."};
  return '<div class="welcome" role="dialog" aria-modal="true" aria-labelledby="wT">'+
    '<div class="whero">'+(fresh?'':'<button type="button" class="wx2" data-a="introSkip" aria-label="Close the introduction">'+ico("x")+'</button>')+
      '<div class="wi"><span class="wbadge">Free practice lab</span><h1 id="wT">Learn hybrid IT administration by doing it</h1>'+
      '<p>Practice Active Directory, Microsoft 365, Entra ID, Intune and Exchange in a connected hybrid-identity simulator. No sign-up, nothing to install, and nothing real to break.</p>'+
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
    h='<h2 id="introT">Six places you will work</h2><ul class="pl pf">'+
      ['ad','m365','entra','intune','exchange'].map(function(p){var t={ad:"On-premises users, groups, computers, Group Policy and synchronization.",m365:"People, licenses, mail forwarding and files.",entra:"Cloud identity, sign-in security, MFA, roles, groups, and devices.",intune:"Laptops: Autopilot, policies, apps, retire and wipe.",exchange:"Mailboxes, forwarding and mail flow rules."}[p];return '<li><b class="tag '+p+'">'+esc(PNAME[p])+'</b><span>'+esc(t)+'</span></li>';}).join("")+'</ul>'+
      '<div class="pflap">'+ico("device")+'<div><b class="tag vm">'+esc(PNAME.vm)+'</b><span>A pretend laptop for the on-device steps. What you do here shows up in Entra and Intune.</span></div></div>'+
      '<p class="small">All six share connected users, groups, licenses and devices, including an on-premises directory synchronized to the cloud.</p>';
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
  return '<div class="introwrap"><div class="intro" role="dialog" aria-modal="true" aria-labelledby="finT"><h2 id="finT">You finished Admin Practice Lab</h2><p>All '+lv.length+' levels are complete. Here is what you practiced:</p><ul class="pl">'+lv.map(function(L){return '<li><b>Level '+L.n+': '+esc(L.name)+'</b><br><span class="small">'+L.ms.map(function(m){return esc(m.t);}).join("; ")+'</span></li>';}).join("")+'</ul><p>Next, check each procedure against Microsoft\'s current documentation, and try the real thing in a test tenant before you touch a production one. This lab is a simulation, so portal layouts will differ.</p><div class="btnrow"><button type="button" class="btn link" data-a="finishReset">Reset lab to practice again</button><span class="sp"></span><button type="button" class="btn primary" data-a="finishClose">Close</button></div></div></div>';
}
