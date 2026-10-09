"use strict";

function $(s){return document.querySelector(s);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
var PAGES={},A={},WIZ={},FLY={},NR={info:1,closeModal:1};

/* ---------- icons ---------- */
var IC={plus:"M8 3v10M3 8h10",refresh:"M13 8a5 5 0 1 1-1.5-3.5M13 2.5V5h-2.5",trash:"M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5",
key:"M5.5 10.5a2.5 2.5 0 1 1 .01 0M7.2 8.8L13 3M11 5l1.5 1.5",search:"M7 11.5a4.5 4.5 0 1 1 .01 0M10.5 10.5L14 14",
home:"M2.5 8L8 3l5.5 5M4 7.5V13h8V7.5",user:"M8 8a2.5 2.5 0 1 1 .01 0M3 13.5c.5-2.5 2.5-3.5 5-3.5s4.5 1 5 3.5",
users:"M6 7.5a2 2 0 1 1 .01 0M2 13c.4-2 2-3 4-3s3.6 1 4 3M11 7a1.7 1.7 0 1 1 .01 0M11.5 10c1.6.1 2.5 1 2.8 3",
device:"M3.5 4h9v6.5h-9zM1.5 12.5h13",shield:"M8 2l5 1.8v4c0 3-2 5-5 6-3-1-5-3-5-6v-4z",
gear:"M8 10a2 2 0 1 1 .01 0M8 2v2M8 12v2M2 8h2M12 8h2M3.8 3.8l1.4 1.4M10.8 10.8l1.4 1.4M3.8 12.2l1.4-1.4M10.8 5.2l1.4-1.4",
apps:"M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z",mail:"M2.5 4h11v8h-11zM2.5 4.5L8 9l5.5-4.5",license:"M2.5 4h11v8h-11zM2.5 7h11M4.5 10h3",
block:"M8 2.5a5.5 5.5 0 1 1-.01 0M4 4l8 8",signout:"M6 3H3v10h3M9 5.5L12 8l-3 2.5M12 8H6",download:"M8 2.5v8M5 7.5L8 10.5l3-3M3 13h10",
lock:"M4.5 7.5h7v5.5h-7zM6 7.5V5.5a2 2 0 1 1 4 0v2",x:"M4 4l8 8M12 4l-8 8",play:"M5 3.5l7 4.5-7 4.5z",
edit:"M3 13l.5-3L11 2.5l2.5 2.5L6 12.5zM9.5 4l2.5 2.5",restart:"M3 8a5 5 0 1 0 1.5-3.5M3 2.5V5h2.5",folder:"M2.5 4.5h4l1.5 1.5h5.5v6.5h-11z",
filter:"M2.5 3.5h11l-4.2 5v4l-2.6-1.2v-2.8z",columns:"M2.5 3.5h11v9h-11zM6.5 3.5v9M10 3.5v9",help:"M6 6a2 2 0 1 1 3 1.7c-.7.5-1 .9-1 1.8M8 12h.01",
book:"M3 3h5v10H3zM8 3h5v10H8z"};
function ico(n){return '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="'+(IC[n]||IC.help)+'"/></svg>';}

/* ---------- glossary (info popovers) ---------- */
var GL={
tenant:["Tenant","Your organization's dedicated space in Microsoft's cloud. Users, groups, devices and licenses all live inside one tenant, and every admin center manages that same tenant.","Google Admin: your Google Workspace account and domain."],
entra:["Microsoft Entra ID","The cloud identity service. It stores users, groups and devices and decides who can sign in and what they can reach. It used to be called Azure Active Directory.","Google Admin: Directory plus Google sign-in."],
upn:["User principal name (UPN)","The sign-in name, written like an email address (name@domain). It is what people type to sign in.","Google: the primary email address."],
usage:["Usage location","The country where the person uses Microsoft services. It must be set before any license can be assigned, because some services are restricted by country.",""],
license:["License","Permission to use a paid product, bought per user per month. Business Premium bundles the Microsoft 365 apps, Entra ID P1 and Intune. A license left on a former employee is money wasted.","Google Admin: Billing > Subscriptions."],
grouplic:["Group-based licensing","Assign a license to a group once and every member gets it automatically. Remove someone from the group and the license frees up. Fewer manual steps, fewer mistakes.",""],
secgroup:["Security group","A list of users used to control access and licensing. Membership is usually assigned by an admin.","Google Admin: Groups."],
mfa:["Multifactor authentication (MFA)","A second proof of identity after the password, such as approving a prompt in an authenticator app. It stops most account takeovers even when a password has leaked.","Google Admin: 2-Step Verification."],
secdef:["Security defaults","A free on/off setting that requires MFA registration for everyone and blocks old sign-in methods. It can't be used together with Conditional Access policies.",""],
ca:["Conditional Access","Rules evaluated at sign-in, such as 'require MFA for all users' or 'only from compliant devices'. More flexible than security defaults. Needs Entra ID P1, which Business Premium includes.","Google Admin: Context-Aware Access."],
reportonly:["Report-only","A safe test mode. The policy is evaluated and logged ('would have required MFA') but not enforced. Use it before turning a policy On so you don't lock people out.",""],
signinlogs:["Sign-in logs","A record of each sign-in: who, which app, from where, and whether MFA or Conditional Access applied. The first place to look when you suspect a compromised account.","Google Admin: Reporting > Audit and investigation > Login."],
auditlogs:["Audit logs","A record of admin changes: who created, edited or deleted what, and when.","Google Admin: Reporting > Audit and investigation > Admin."],
revoke:["Revoke sessions","Signs the user out everywhere by invalidating their sign-in tokens. A password reset alone doesn't always end sessions that are already signed in, so do both after a compromise.","Google Admin: Sign out and reset sign-in cookies."],
block:["Block sign-in / Account enabled","Stops new sign-ins without deleting anything. Use it right away when someone leaves, then clean up. Existing sessions may stay valid until revoked.","Google Admin: Suspend user."],
authm:["Authentication methods","The ways a user can prove who they are: authenticator app, phone, email. Attackers sometimes add their own phone number to keep getting in. Remove any method you don't recognize.",""],
rereg:["Require re-register MFA","Clears the user's MFA registration so they must set it up again at next sign-in. Useful when you can't be sure which methods are legitimate.",""],
roles:["Administrator roles","Permissions for managing the tenant. Each person should hold the smallest role that fits their job.","Google Admin: Admin roles."],
least:["Least privilege","Give people only the access they need to do their job, nothing more. In practice: day-to-day admins get a narrow role and very few people hold Global Administrator.",""],
ga:["Global Administrator","Can do everything in the tenant. Microsoft recommends keeping these to a small number of accounts, because one compromised Global Administrator is a total compromise.","Google Admin: Super admin."],
helpdesk:["Helpdesk Administrator","Can reset passwords and sign out non-admin users. A good fit for a support technician who doesn't need to change anything else.",""],
soft:["Deleted users (soft delete)","A deleted user is kept for 30 days and can be restored. After that it is permanently removed. Deleting is the last step of offboarding, after files are handed off and access is cut.","Google Admin: Deleted users."],
mailbox:["Mailbox","The user's Exchange Online mailbox. It stays active only while the user holds a license that includes Exchange. An unlicensed mailbox goes inactive and is deleted after a grace period.",""],
fwd:["Email forwarding","Automatically sends a copy of incoming mail to another address. Attackers set this up after a compromise to quietly collect mail, and it survives password resets. External forwarding you didn't set up is a red flag. (Attackers also create hidden inbox rules, which admins check with PowerShell or the security portal.)","Google Admin: Gmail > user forwarding settings."],
onedrive:["OneDrive file access","A user's work files live in their OneDrive. On offboarding, give the manager a link to the files before deleting the account, or the files are only kept for a limited retention period.",""],
mdm:["MDM (mobile device management)","The management channel that lets Intune configure, secure and wipe a device. A device must be enrolled in MDM before Intune can manage it.","Jamf: MDM enrollment."],
mdmscope:["MDM user scope","Controls whose devices may enroll in Intune automatically when they sign in. If it is None or doesn't include the user, the laptop joins Entra ID but never shows up in Intune. A very common setup mistake.",""],
intune:["Microsoft Intune","The device management service: enroll devices, push settings and apps, check compliance, retire or wipe.","Jamf Pro."],
autopilot:["Windows Autopilot","Zero-touch setup for new Windows PCs. The device is registered by serial number, the user signs in, and the PC configures itself and enrolls in Intune. No manual imaging.","Jamf: Automated Device Enrollment."],
approfile:["Deployment profile","The Autopilot recipe: how setup behaves (for example user-driven, joined to Entra ID). A device with no profile assigned falls back to normal manual Windows setup.","Jamf: PreStage enrollment."],
entrajoin:["Microsoft Entra joined","The PC belongs to the cloud directory instead of an on-premises domain. People sign in with their work account. Typical for cloud-first companies.",""],
compliance:["Compliance policy","Defines what a healthy device looks like, such as BitLocker on and Windows 11. It reports Compliant or Noncompliant and can feed Conditional Access. It doesn't change any settings by itself.","Jamf: smart groups and extension attributes."],
config:["Configuration profile","Settings pushed to devices, like Wi-Fi or password rules. This is what actually makes a setting true on the device.","Jamf: Configuration Profiles."],
bitlocker:["BitLocker","Windows full-disk encryption. If a laptop is lost the data is unreadable without the key. A compliance policy checks it, and a disk encryption policy turns it on.","Mac: FileVault."],
assign:["Assignments","Who or what a policy applies to: all users, all devices, or specific groups. A policy with no assignment does nothing.","Jamf: Scope."],
retire:["Retire","Removes company data, apps and settings from the device and releases it from management. Personal files stay. Good for returned equipment you'll re-image.","Jamf: Remove MDM profile."],
wipe:["Wipe","Factory-resets the device and erases everything. Use for lost or stolen devices and before reassigning a laptop.","Jamf: Erase device."],
sync:["Sync","Asks the device to check in with Intune now instead of waiting for its next scheduled check-in.",""],
primary:["Primary user","The person the device is assigned to. Used in reports and for user-targeted policies.",""],
required:["Required app","Installed automatically on devices in the assignment. 'Available' apps are only offered in the Company Portal for users to install themselves.","Jamf: Self Service."],
mailflow:["Mail flow rule","A rule applied to messages as they move through Exchange, such as blocking automatic forwarding to external addresses.",""],
trouble:["Troubleshooting + support","Intune's helpdesk view for one user: account status, license, MDM eligibility, devices and assignment problems in one place.",""],
ccount:["Conditional Access state","On enforces the policy. Report-only logs what would happen. Off ignores it.",""],
devjoin:["Users may join devices to Microsoft Entra","A tenant-wide switch for who is allowed to join a PC to Entra ID. If it is set to None, the join fails with error 801c0003 even when everything else is correct.",""],
regvsjoin:["Joined vs registered","Joined: the PC belongs to the organization and users sign in to Windows with their work account (company laptops). Registered: a work account is added to a personal device, giving app access but little control (BYOD).",""],
dsreg:["dsregcmd /status","A built-in command that shows whether a PC is Entra joined or registered, the tenant, and the MDM URL. An empty MdmUrl means the user isn't in the MDM user scope.",""],
localadmin:["Local administrator","An administrator account that exists only on this PC, not in the cloud. Joining a PC to Entra ID needs an administrator signed in on the PC, which is why IT keeps a local admin account for setup.","Mac: the local admin account on a Mac."],
oobe:["OOBE (out-of-box experience)","The first-run setup screens on a new or reset PC: region, keyboard, network, and who will use it. Autopilot takes over this experience to set the PC up for a work account automatically.","Mac: Setup Assistant."],
esp:["Enrollment status page","The progress screen during Autopilot that shows the device being joined and set up. If enrollment fails (license, MDM scope), the error appears here.",""],
permfa:["Per-user MFA","The older way to enforce MFA user by user. Security defaults or Conditional Access are the current methods.",""]
};
function info(k){var g=GL[k];if(!g){return "";}return '<button type="button" class="i" data-a="info" data-t="'+k+'" aria-label="About '+esc(g[0])+'" aria-expanded="false">i</button>';}

/* ---------- ui builders ---------- */
function B(label,a,o){o=o||{};var dd="";if(o.d){for(var k in o.d){dd+=' data-'+k+'="'+esc(o.d[k])+'"';}}
  return '<button type="button" class="btn'+(o.primary?' primary':'')+(o.danger?' danger':'')+(o.sm?' sm':'')+'" data-a="'+a+'"'+dd+(o.dis?' disabled':'')+'>'+(o.icon?ico(o.icon):'')+esc(label)+'</button>';}
function CB(icon,label,a,o){o=o||{};var dd="";if(o.d){for(var k in o.d){dd+=' data-'+k+'="'+esc(o.d[k])+'"';}}
  return '<button type="button" class="cb'+(o.lab?' lab-only':'')+'" data-a="'+a+'"'+dd+(o.dis?' disabled':'')+'>'+ico(icon)+esc(label)+'</button>'+(o.i?info(o.i):'');}
function bar(items){return '<div class="cmdbar" role="toolbar">'+items.join("")+'</div>';}
var VR='<span class="vr"></span>';
function lnk(text,a,id,extra){return '<button type="button" class="lnk" data-a="'+a+'" data-id="'+esc(id)+'"'+(extra||"")+'>'+esc(text)+'</button>';}
function crumbs(list){return '<div class="crumbs">'+list.map(function(c,i){return (i?' &gt; ':'')+(c[1]?'<button type="button" data-a="go" data-pg="'+c[1]+'">'+esc(c[0])+'</button>':esc(c[0]));}).join("")+'</div>';}
function head(cr,title,infoKey,sub){return crumbs(cr)+'<h1 class="ptitle">'+esc(title)+(infoKey?info(infoKey):'')+'</h1>'+(sub?'<p class="psub">'+sub+'</p>':'');}
function search(ph){return '<div class="srch">'+ico("search")+'<input id="q" data-q="1" type="text" autocomplete="off" aria-label="'+esc(ph)+'" placeholder="'+esc(ph)+'" value="'+esc(S.q)+'"></div>';}
function matchQ(s){return !S.q||String(s).toLowerCase().indexOf(S.q.toLowerCase())>-1;}
function tbl(cols,rows,o){o=o||{};
  if(!rows.length){return '<div class="empty">'+esc(o.empty||"No results.")+'</div>';}
  var h='<div class="tbl"><table><thead><tr>'+(o.check?'<th class="ck"><span class="sr"></span></th>':'')+cols.map(function(c){return '<th scope="col">'+c+'</th>';}).join("")+'</tr></thead><tbody>';
  rows.forEach(function(r){var on=S.checked.indexOf(r.id)>-1;
    h+='<tr'+(on?' class="on"':'')+'>'+(o.check?'<td class="ck"><input type="checkbox" data-a="chk" data-id="'+esc(r.id)+'" aria-label="Select row"'+(on?' checked':'')+'></td>':'')+r.cells.map(function(c){return '<td>'+c+'</td>';}).join("")+'</tr>';});
  return h+'</tbody></table></div>';}
function grid(pairs){return '<dl class="grid2">'+pairs.map(function(p){return '<dt>'+p[0]+'</dt><dd>'+p[1]+'</dd>';}).join("")+'</dl>';}
function checked1(){return S.checked.length?S.checked[0]:"";}
function tabs(list,cur,a){return '<div class="tabs" role="tablist">'+list.map(function(t){return '<button type="button" role="tab" data-a="'+a+'" data-t="'+t[0]+'"'+(cur===t[0]?' aria-current="true"':'')+'>'+esc(t[1])+'</button>';}).join("")+'</div>';}
function blade(list,cur,body){
  return '<div class="blade"><nav class="bnav" aria-label="Menu">'+list.map(function(t){return '<button type="button" data-a="tab" data-t="'+t[0]+'"'+(cur===t[0]?' aria-current="true"':'')+'>'+esc(t[1])+'</button>';}).join("")+'</nav><div class="bbody">'+body+'</div></div>';}

/* ---------- popover ---------- */
var popFor=null;
function showPop(btn){
  var k=btn.getAttribute("data-t"),g=GL[k];if(!g){return;}
  var p=$("#pop");
  p.innerHTML='<b>'+esc(g[0])+'</b><p>'+esc(g[1])+'</p>'+(g[2]?'<div class="eq">'+esc(g[2])+'</div>':'');
  p.hidden=false;
  var r=btn.getBoundingClientRect(),w=Math.min(320,window.innerWidth-16);
  p.style.maxWidth=w+"px";
  var left=Math.max(8,Math.min(r.left+window.scrollX-8,window.scrollX+window.innerWidth-w-8));
  p.style.left=left+"px";
  p.style.top=(r.bottom+window.scrollY+6)+"px";
  btn.setAttribute("aria-expanded","true");popFor=btn;
}
function hidePop(){var p=$("#pop");if(p){p.hidden=true;}if(popFor){try{popFor.setAttribute("aria-expanded","false");}catch(e){}}popFor=null;}

/* ---------- modal + toast ---------- */
var modalSubmit=null;
function openModal(title,body,label,fn){
  modalSubmit=fn;var m=$("#modal");
  m.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><h3>'+esc(title)+'</h3><form id="mf">'+body+'<p class="merr" id="merr" role="alert"></p><div class="btnrow"><button type="button" class="btn" data-a="closeModal">'+(label?'Cancel':'Close')+'</button>'+(label?'<button class="btn primary" type="submit">'+esc(label)+'</button>':'')+'</div></form></div>';
  m.hidden=false;var f=m.querySelector("input[type=text],select");if(f){f.focus();}
}
function closeModal(){$("#modal").hidden=true;$("#modal").innerHTML="";modalSubmit=null;}
var toastTimer=null;
function toast(msg){var t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.hidden=true;},4800);}
function mfield(label,html){return '<div class="fld"><div class="lb">'+label+'</div>'+html+'</div>';}
function mtext(label,name,ph){return mfield(label,'<input type="text" name="'+name+'" aria-label="'+esc(label)+'" autocomplete="off"'+(ph?' placeholder="'+esc(ph)+'"':'')+'>');}
function msel(label,name,list,sel){return mfield(label,'<select name="'+name+'" aria-label="'+esc(label)+'">'+opts(list,sel||"")+'</select>');}
function confirmBox(title,text,label,fn){openModal(title,'<p>'+text+'</p>',label,function(){fn();return null;});}

/* ---------- wizard engine ---------- */
function wizOpen(kind){S.wiz={kind:kind,step:0,err:"",d:JSON.parse(JSON.stringify(WIZ[kind].init||{}))};S.fly=null;S.checked=[];}
function wv(f){return S.wiz.d[f];}
function fText(label,f,o){o=o||{};return '<div class="fld"><div class="lb">'+label+(o.i?info(o.i):'')+'</div><input type="text" data-w="'+f+'" aria-label="'+esc(label)+'" autocomplete="off" value="'+esc(wv(f)||"")+'"'+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+'>'+(o.hint?'<div class="hint">'+o.hint+'</div>':'')+'</div>';}
function fSel(label,f,list,o){o=o||{};return '<div class="fld"><div class="lb">'+label+(o.i?info(o.i):'')+'</div><select data-w="'+f+'"'+(o.rr?' data-rr="1"':'')+' aria-label="'+esc(label)+'">'+opts(list,wv(f)||"")+'</select>'+(o.hint?'<div class="hint">'+o.hint+'</div>':'')+'</div>';}
function fChk(label,f,o){o=o||{};return '<div class="fld"><label class="chk"><input type="checkbox" data-w="'+f+'"'+(o.rr?' data-rr="1"':'')+(wv(f)?' checked':'')+'> '+label+'</label>'+(o.i?info(o.i):'')+(o.hint?'<div class="hint">'+o.hint+'</div>':'')+'</div>';}
function fRad(label,f,list,o){o=o||{};return '<div class="fld"><div class="lb">'+label+(o.i?info(o.i):'')+'</div>'+list.map(function(l){return '<label class="rad"><input type="radio" name="'+f+'" data-w="'+f+'" data-rr="1" value="'+esc(l[0])+'"'+(wv(f)===l[0]?' checked':'')+'> '+esc(l[1])+'</label>';}).join("")+(o.hint?'<div class="hint">'+o.hint+'</div>':'')+'</div>';}
function assignStep(allowAll){
  var l=[["","Don't assign yet"]];
  if(allowAll){l.push(["users","All users"]);l.push(["devices","All devices"]);}
  l.push(["groups","Select groups to include"]);
  var h=fRad("Included","all",l,{i:"assign"});
  if(wv("all")==="groups"){h+='<div class="fld"><div class="lb">Groups</div>'+S.groups.map(function(g){return '<label class="rad"><input type="checkbox" data-wg="'+g.id+'"'+((wv("groups")||[]).indexOf(g.id)>-1?' checked':'')+'> '+esc(g.name)+' ('+g.members.length+' members)</label>';}).join("")+'</div>';}
  return h;
}
function assignFromWiz(d){return {all:(d.all==="users"||d.all==="devices")?d.all:"",groups:d.all==="groups"?(d.groups||[]).slice():[]};}
function wizHtml(){
  var w=S.wiz,def=WIZ[w.kind],last=w.step===def.steps.length-1;
  return crumbs(def.crumbs)+'<h1 class="ptitle">'+esc(def.title)+'</h1><div class="wtabs" role="tablist">'+def.steps.map(function(s,i){return '<button type="button" role="tab" class="'+(i===w.step?'on':'')+'" data-a="wizGo" data-n="'+i+'">'+esc(s.n)+'</button>';}).join("")+'</div><div class="wbody">'+def.steps[w.step].h()+'</div>'+
    (w.err?'<div class="msg bad" role="alert">'+esc(w.err)+'</div>':'')+
    '<div class="wfoot">'+(last?B(def.btn||"Create","wizCreate",{primary:1}):B("Next","wizNext",{primary:1}))+(w.step>0?B("Previous","wizBack"):"")+B("Cancel","wizCancel")+'</div>';
}
function reqName(d){return (d.name||"").trim()?"":"Enter a name on the Basics tab.";}
function wizStepError(){var w=S.wiz,def=WIZ[w.kind],step=def.steps[w.step];if(step&&step.validate){return step.validate(w.d)||"";}return "";}
function wizBody(){return wizHtml();}
