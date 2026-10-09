"use strict";
/* =============== INTUNE =============== */
PAGES["intune.home"]=function(){
  var en=S.devices.filter(function(d){return d.state==="enrolled";}),ok=en.filter(function(d){return d.compl&&d.compl.state==="Compliant";}).length;
  return '<h1 class="ptitle">Home</h1><p class="psub">Intune'+info("intune")+' manages devices: enroll, configure, check compliance, deploy apps, retire or wipe.</p>'+
  '<div class="cards"><div class="tile"><h3>Managed devices</h3><div class="big">'+en.length+'</div></div><div class="tile"><h3>Compliance'+info("compliance")+'</h3><div class="big">'+ok+' / '+en.length+'</div><span>compliant</span></div>'+
  '<div class="tile"><h3>Policies and apps</h3><div class="big">'+(S.policies.length+S.profiles.length+S.apps.length)+'</div><span>created</span></div></div>'+
  (S.mdm.scope==="none"?'<div class="msg warn">MDM user scope is None in Microsoft Entra, so new laptops will not enroll in Intune. Check Entra > Devices > Mobility (MDM and MAM).'+info("mdmscope")+'</div>':'')+
  (!S.apProfiles.some(function(p){return p.assign.all==="devices";})?'<div class="msg warn">No Autopilot deployment profile is assigned. New laptops will not get zero-touch setup.'+info("approfile")+'</div>':'');
};

/* devices */
function compBadge(d){if(d.state==="wiping"){return badge("Wipe pending","warn");}if(!d.compl){return "-";}return d.compl.state==="Compliant"?badge("Compliant","ok"):badge("Not compliant","bad");}
PAGES["intune.devices"]=function(){
  if(S.sel){return intuneDevice(D(S.sel));}
  var rows=S.devices.filter(function(d){return (d.state==="enrolled"||d.state==="wiping")&&matchQ(d.name+d.serial);}).map(function(d){var u=U(d.userId);
    return {cells:[lnk(d.name,"sel",d.id),"Intune","Corporate",compBadge(d),esc(d.os),esc(d.osVer),u?'<span class="mono">'+esc(upn(u))+'</span>':"-",esc(d.sync)]};});
  return crumbs([["Home","home"],["Devices"]])+'<h1 class="ptitle">Devices | All devices</h1>'+bar([CB("refresh","Refresh","refresh"),CB("filter","Filter","noop"),CB("columns","Columns","noop"),CB("download","Export","noop")])+
    search("Search by name or serial number")+tbl(["Device name","Managed by"+info("mdm"),"Ownership","Compliance"+info("compliance"),"OS","OS version","Primary user UPN"+info("primary"),"Last check-in"],rows,{empty:"No devices enrolled yet. Enroll one through Autopilot."});
};
function intuneDevice(d){
  var u=U(d.userId),t=S.tab||"overview",list=[["overview","Overview"],["compliance","Device compliance"],["config","Device configuration"],["apps","Discovered apps"]],body="";
  var live1=d.state==="enrolled";
  if(t==="overview"){
    body='<h2 class="sec">Essentials</h2>'+grid([["Device name",esc(d.name)],["Primary user"+info("primary"),u?'<span class="mono">'+esc(upn(u))+'</span>':"-"],["Compliance"+info("compliance"),compBadge(d)],["Management name",esc(d.name)],["Ownership","Corporate"],["Serial number",'<span class="mono">'+esc(d.serial)+'</span>'],["Manufacturer / model",esc(d.maker)+" "+esc(d.model)],["Operating system",esc(d.os)+" "+esc(d.osVer)],["Join type"+info("entrajoin"),"Microsoft Entra joined"],["BitLocker"+info("bitlocker"),d.bitlocker?"Encrypted":"Not encrypted"],["Last check-in",esc(d.sync)]]);
  }else if(t==="compliance"){
    body=d.compl?(d.compl.none?'<div class="msg">No compliance policy applies to this device, so it is treated as compliant. Assign a policy to see results.</div>':
      tbl(["Policy","Status","Why"],d.compl.rows.map(function(r){return {cells:[esc(r.policy),r.state==="Compliant"?badge("Compliant","ok"):badge("Not compliant","bad"),esc(r.reason||"-")]};}))):'<div class="empty">Not managed.</div>';
  }else if(t==="config"){
    body=tbl(["Profile","Status"],(d.cfgIn||[]).map(function(n){return {cells:[esc(n),badge("Succeeded","ok")]};}),{empty:"No configuration profiles apply to this device."});
  }else{
    body=tbl(["App","State"],(d.appsIn||[]).map(function(n){return {cells:[esc(n),badge("Installed","ok")]};}).concat([{cells:["Company Portal"+info("required"),badge("Installed","ok")]}]),{});
  }
  return crumbs([["Home","home"],["Devices","devices"],[d.name]])+'<h1 class="ptitle">'+esc(d.name)+'</h1>'+
    bar([CB("restart","Retire","retire",{d:{id:d.id},dis:!live1,i:"retire"}),CB("trash","Wipe","wipe",{d:{id:d.id},dis:!live1,i:"wipe"}),CB("trash","Delete","delDevice",{d:{id:d.id}}),CB("lock","Remote lock","lockDev",{d:{id:d.id},dis:!live1}),CB("refresh","Sync","syncDev",{d:{id:d.id},dis:!live1,i:"sync"}),CB("restart","Restart","restartDev",{d:{id:d.id},dis:!live1})])+blade(list,t,body);
}
A.retire=function(d){var v=D(d.id);confirmBox("Retire "+v.name+"?","Company data, apps and settings are removed and the device is released from management. Personal files stay."+info("retire"),"Retire",function(){v.state="retired";S.sel=null;audit("Retire device",v.name,"Device","Intune");toast("Retire sent. "+v.name+" is released from management.");});};
A.wipe=function(d){var v=D(d.id);confirmBox("Wipe "+v.name+"?","This factory-resets the device and erases everything on it."+info("wipe"),"Wipe",function(){v.state="wiping";audit("Wipe device",v.name,"Device","Intune");toast("Wipe sent. The device resets at its next check-in.");});};
A.delDevice=function(d){var v=D(d.id);confirmBox("Delete "+v.name+"?","Removes this record from Intune. Retire or wipe the device first so company data isn't left behind.","Delete",function(){
  if(v.autopilot){v.state="registered";v.userId=null;v.name="(not set up)";}else{S.devices=S.devices.filter(function(x){return x.id!==v.id;});}S.sel=null;audit("Delete device",v.name,"Device","Intune");toast("Device record deleted.");});};
A.syncDev=function(d){var v=D(d.id);v.sync="Just now";toast("Sync sent to "+v.name+". It checks in with Intune now.");};
A.restartDev=function(d){toast("Restart command sent to "+D(d.id).name+".");};
A.lockDev=function(d){toast("Remote lock command sent to "+D(d.id).name+".");};

/* autopilot devices */
PAGES["intune.ap"]=function(){
  var c=checked1(),rows=S.devices.filter(function(d){return d.autopilot&&d.state!=="retired";}).map(function(d){var u=U(d.userId);
    return {id:d.id,cells:['<span class="mono">'+esc(d.serial)+'</span>',esc(d.maker),esc(d.model),apAssigned()?badge("Assigned","ok"):badge("Not assigned","warn"),u?esc(u.name):"-",d.state==="enrolled"?badge("Enrolled","ok"):badge("Not enrolled")]};});
  return crumbs([["Home","home"],["Devices"]])+'<h1 class="ptitle">Windows Autopilot devices'+info("autopilot")+'</h1><p class="psub">Devices registered by serial number. Select one and simulate the first sign-in to see zero-touch setup.</p>'+
    bar([CB("plus","Import","regDevice"),CB("refresh","Sync","noop",{i:"sync"}),CB("trash","Delete","apDelete",{d:{id:c},dis:!c}),VR,CB("play","Simulate unboxing (quick)","unbox",{d:{id:c},dis:!c,lab:1}),CB("device","Open in Windows laptop tab","openVm",{d:{id:c},dis:!c,lab:1})])+
    tbl(["Serial number","Manufacturer","Model","Profile status"+info("approfile"),"Assigned user","Enrollment"],rows,{check:true,empty:"No Autopilot devices registered."});
};
A.regDevice=function(){openModal("Add Autopilot devices",mtext("Serial number","serial")+mtext("Model","model","Latitude 5440"),"Import",function(fd){
  var s=(fd.serial||"").trim().toUpperCase();if(!s){return {error:"Enter a serial number."};}
  if(S.devices.some(function(x){return x.serial===s;})){return {error:"That serial number is already registered."};}
  S.devices.push({id:nid("d"),serial:s,name:"(not set up)",model:(fd.model||"").trim()||"Latitude 5440",maker:"Dell",os:"Windows 11 Pro",osVer:"10.0.22631",userId:null,state:"registered",baseBitlocker:false,autopilot:true,sync:"-"});
  audit("Import Autopilot device",s,"Device","Intune");toast("Device imported.");return null;});};
A.apDelete=function(d){var v=D(d.id);if(!v||v.state==="enrolled"){toast("Retire and delete the managed device first.");return;}S.devices=S.devices.filter(function(x){return x.id!==v.id;});S.checked=[];toast("Autopilot record deleted.");};
A.unbox=function(d){var dev=D(d.id);if(!dev){return;}
  openModal("First sign-in on "+dev.serial,'<p>Pretend a new hire opens this laptop, connects to Wi-Fi and signs in. Who is it?</p>'+msel("User","u",userList("Select a user")),"Sign in",function(fd){
    if(!fd.u){return {error:"Select a user."};}
    var u=U(fd.u),r=autopilotUnbox(dev,u);
    if(r.error){return {error:r.error};}
    var vv=ensureVm(dev);vv.stage="lock";vv.oobe="done";vv.cur=null;if(vv.work.indexOf(u.id)<0){vv.work.push(u.id);}
    toast("Success. "+dev.name+" is enrolled and managed for "+u.name+".");return null;});};

/* deployment profiles */
PAGES["intune.approf"]=function(){
  var rows=S.apProfiles.map(function(p){return {cells:[esc(p.name),"User-driven","Microsoft Entra joined",esc(assignText(p.assign)),B("Delete","delItem",{sm:1,danger:1,d:{k:"ap",id:p.id}})]};});
  return crumbs([["Home","home"],["Devices"]])+'<h1 class="ptitle">Windows Autopilot deployment profiles'+info("approfile")+'</h1>'+bar([CB("plus","Create profile","wizNewApProf"),CB("refresh","Refresh","refresh")])+
    tbl(["Name","Deployment mode","Join type","Assigned to"],rows,{empty:"No deployment profiles. Without one, new laptops don't get zero-touch setup."});
};
WIZ.apProf={title:"Create Windows Autopilot deployment profile",crumbs:[["Home","home"],["Deployment profiles","approf"],["Create"]],init:{name:"",all:""},btn:"Create",
  steps:[
   {n:"Basics",h:function(){return fText("Name","name",{ph:"Standard laptops"});},validate:reqName},
   {n:"Out-of-box experience (OOBE)",h:function(){return grid([["Deployment mode","User-driven"],["Join to Microsoft Entra ID as"+info("entrajoin"),"Microsoft Entra joined"],["User account type","Standard"],["Skip privacy settings","Yes"]])+'<p class="hint">Fixed in this lab. In the real wizard these are dropdowns.</p>';}},
   {n:"Assignments",h:function(){return fRad("Assign to","all",[["","Don't assign yet"],["devices","All devices"]],{i:"assign"});}},
   {n:"Review + create",h:function(){var d=S.wiz.d;return grid([["Name",esc(d.name||"?")],["Mode","User-driven"],["Assigned to",d.all==="devices"?"All devices":"Not assigned"]]);}}
  ],
  create:function(d){var n=(d.name||"").trim();if(!n){return {error:"Enter a profile name on the Basics tab."};}S.apProfiles.push({id:nid("ap"),name:n,assign:{all:d.all==="devices"?"devices":"",groups:[]}});audit("Create Autopilot profile",n,"Device","Intune");return {msg:"Deployment profile created."};}
};
A.wizNewApProf=function(){wizOpen("apProf");};

/* compliance */
function polSummary(p){var s=[];if(p.bitlocker){s.push("BitLocker");}if(p.minOS){s.push("Windows 11 or later");}if(p.password){s.push("Password");}return s.join(", ")||"Nothing";}
PAGES["intune.compliance"]=function(){
  var rows=S.policies.map(function(p){return {cells:[esc(p.name),"Windows 10 and later",esc(polSummary(p)),esc(assignText(p.assign)),B("Assign","assignTo",{sm:1,d:{k:"pol",id:p.id}})+" "+B("Delete","delItem",{sm:1,danger:1,d:{k:"pol",id:p.id}})]};});
  return crumbs([["Home","home"],["Devices"]])+'<h1 class="ptitle">Devices | Compliance'+info("compliance")+'</h1><p class="psub">A policy defines what a healthy device is. It reports; it does not fix.</p>'+bar([CB("plus","Create policy","wizNewComp"),CB("refresh","Refresh","refresh")])+
    tbl(["Policy name","Platform","Requires","Assigned"+info("assign"),""],rows,{empty:"No compliance policies. With none assigned, devices are treated as compliant."});
};
WIZ.comp={title:"Create a policy: Windows 10 and later",crumbs:[["Home","home"],["Compliance","compliance"],["Create"]],init:{name:"",bit:"",os:"",pw:"",all:"",groups:[]},btn:"Create",
  steps:[
   {n:"Basics",h:function(){return fText("Name","name",{ph:"Windows baseline"});},validate:reqName},
   {n:"Compliance settings",h:function(){return '<h2 class="sec">Device health</h2>'+fSel("Require BitLocker"+"","bit",[["","Not configured"],["1","Require"]],{i:"bitlocker"})+'<h2 class="sec">Device properties</h2>'+fSel("Minimum OS version","os",[["","Not configured"],["10.0.22000","10.0.22000 (Windows 11)"]],{hint:"Sam's enrolled laptop is Windows 10. If you also require Windows 11, that laptop stays Not compliant until a Windows 11 device, such as Priya's, is enrolled."})+'<h2 class="sec">System security</h2>'+fSel("Require a password to unlock devices","pw",[["","Not configured"],["1","Require"]]);}},
   {n:"Assignments",h:function(){return assignStep(true);}},
   {n:"Review + create",h:function(){var d=S.wiz.d;return grid([["Name",esc(d.name||"?")],["BitLocker",d.bit?"Require":"Not configured"],["Minimum OS",d.os||"Not configured"],["Assigned",esc(assignText(assignFromWiz(d)))]]);}}
  ],
  create:function(d){var n=(d.name||"").trim();if(!n){return {error:"Enter a policy name on the Basics tab."};}S.policies.push({id:nid("p"),name:n,bitlocker:!!d.bit,minOS:d.os||"",password:!!d.pw,assign:assignFromWiz(d)});audit("Create compliance policy",n,"Policy","Intune");return {msg:"Compliance policy created."};}
};
A.wizNewComp=function(){wizOpen("comp");};

/* configuration */
PAGES["intune.config"]=function(){
  var rows=S.profiles.filter(function(p){return p.type!=="BitLocker";}).map(function(p){return {cells:[esc(p.name),"Windows 10 and later",esc(p.type),esc(assignText(p.assign)),B("Assign","assignTo",{sm:1,d:{k:"prof",id:p.id}})+" "+B("Delete","delItem",{sm:1,danger:1,d:{k:"prof",id:p.id}})]};});
  return crumbs([["Home","home"],["Devices"]])+'<h1 class="ptitle">Devices | Configuration'+info("config")+'</h1><p class="psub">Profiles push settings to devices. BitLocker lives under Endpoint security > Disk encryption.</p>'+bar([CB("plus","Create","wizNewCfg"),CB("refresh","Refresh","refresh")])+
    tbl(["Policy name","Platform","Profile type","Assigned"+info("assign"),""],rows,{empty:"No configuration profiles yet."});
};
WIZ.cfg={title:"Create profile: Windows 10 and later",crumbs:[["Home","home"],["Configuration","config"],["Create"]],init:{name:"",type:"Wi-Fi",all:"",groups:[]},btn:"Create",
  steps:[
   {n:"Basics",h:function(){return fText("Name","name",{ph:"Corporate Wi-Fi"})+fSel("Profile type","type",[["Wi-Fi","Wi-Fi"],["Device restrictions","Device restrictions (templates)"],["Password rules","Password rules (settings catalog)"]],{i:"config"});},validate:reqName},
   {n:"Assignments",h:function(){return assignStep(true);}},
   {n:"Review + create",h:function(){var d=S.wiz.d;return grid([["Name",esc(d.name||"?")],["Type",esc(d.type)],["Assigned",esc(assignText(assignFromWiz(d)))]]);}}
  ],
  create:function(d){var n=(d.name||"").trim();if(!n){return {error:"Enter a profile name on the Basics tab."};}S.profiles.push({id:nid("c"),name:n,type:d.type,assign:assignFromWiz(d)});audit("Create configuration profile",n,"Policy","Intune");return {msg:"Configuration profile created."};}
};
A.wizNewCfg=function(){wizOpen("cfg");};

/* disk encryption */
PAGES["intune.disk"]=function(){
  var rows=S.profiles.filter(function(p){return p.type==="BitLocker";}).map(function(p){return {cells:[esc(p.name),"Windows 10 and later","BitLocker"+info("bitlocker"),esc(assignText(p.assign)),B("Assign","assignTo",{sm:1,d:{k:"prof",id:p.id}})+" "+B("Delete","delItem",{sm:1,danger:1,d:{k:"prof",id:p.id}})]};});
  return crumbs([["Home","home"],["Endpoint security"]])+'<h1 class="ptitle">Endpoint security | Disk encryption</h1><p class="psub">This is what turns BitLocker on. A compliance policy then checks that it worked.</p>'+bar([CB("plus","Create policy","wizNewDisk"),CB("refresh","Refresh","refresh")])+
    tbl(["Policy name","Platform","Profile","Assigned"+info("assign"),""],rows,{empty:"No disk encryption policies yet."});
};
WIZ.disk={title:"Create profile: BitLocker",crumbs:[["Home","home"],["Disk encryption","disk"],["Create"]],init:{name:"",all:"",groups:[]},btn:"Create",
  steps:[
   {n:"Basics",h:function(){return fText("Name","name",{ph:"Turn on BitLocker"});},validate:reqName},
   {n:"Configuration settings",h:function(){return grid([["Require device encryption"+info("bitlocker"),"Enabled"],["Encryption method","XTS-AES 128-bit"],["Store recovery key in Microsoft Entra ID","Yes"]])+'<p class="hint">Fixed in this lab.</p>';}},
   {n:"Assignments",h:function(){return assignStep(true);}},
   {n:"Review + create",h:function(){var d=S.wiz.d;return grid([["Name",esc(d.name||"?")],["Profile","BitLocker"],["Assigned",esc(assignText(assignFromWiz(d)))]]);}}
  ],
  create:function(d){var n=(d.name||"").trim();if(!n){return {error:"Enter a policy name on the Basics tab."};}S.profiles.push({id:nid("c"),name:n,type:"BitLocker",assign:assignFromWiz(d)});audit("Create disk encryption policy",n,"Policy","Intune");return {msg:"Disk encryption policy created."};}
};
A.wizNewDisk=function(){wizOpen("disk");};

/* apps */
PAGES["intune.apps"]=function(){
  var rows=S.apps.map(function(a){return {cells:[esc(a.name),esc(a.type),(a.intent==="required"?"Required":"Available")+info("required"),esc(assignText(a.assign)),B("Assign","assignTo",{sm:1,d:{k:"app",id:a.id}})+" "+B("Delete","delItem",{sm:1,danger:1,d:{k:"app",id:a.id}})]};});
  return crumbs([["Home","home"],["Apps"]])+'<h1 class="ptitle">Apps | All apps</h1><p class="psub">Required apps install automatically. Available apps appear in the Company Portal.</p>'+bar([CB("plus","Add","wizNewApp"),CB("refresh","Refresh","refresh")])+
    tbl(["Name","Type","Assignment type","Assigned",""],rows,{empty:"No apps added yet."});
};
WIZ.app={title:"Add app",crumbs:[["Home","home"],["Apps","apps"],["Add"]],init:{type:"Microsoft Edge",name:"Microsoft Edge",intent:"required",all:"",groups:[]},btn:"Create",
  steps:[
   {n:"App type",h:function(){return fSel("Select app type","type",[["Microsoft Edge","Microsoft Edge, version 77 and later"],["Microsoft 365 Apps","Microsoft 365 Apps (Windows 10 and later)"],["Company Portal","Company Portal (Microsoft Store)"],["Line-of-business","Line-of-business app"]],{rr:1})+fText("Name","name");},validate:reqName},
   {n:"Assignments",h:function(){return fRad("Assignment type","intent",[["required","Required (installs automatically)"],["available","Available for enrolled devices (user installs)"]],{i:"required"})+assignStep(true);}},
   {n:"Review + create",h:function(){var d=S.wiz.d;return grid([["App",esc(d.name||d.type)],["Type",esc(d.type)],["Assignment",d.intent==="required"?"Required":"Available"],["Assigned",esc(assignText(assignFromWiz(d)))]]);}}
  ],
  create:function(d){var n=(d.name||"").trim()||d.type;S.apps.push({id:nid("a"),name:n,type:d.type,intent:d.intent,assign:assignFromWiz(d)});audit("Add app",n,"Application","Intune");return {msg:"App added."};}
};
A.wizNewApp=function(){wizOpen("app");};

/* generic assign + delete */
A.assignTo=function(d){
  var list=d.k==="pol"?S.policies:d.k==="app"?S.apps:S.profiles,item=list.filter(function(x){return x.id===d.id;})[0];
  var o=[["","Select a target"],["users","All users"],["devices","All devices"]].concat(S.groups.map(function(g){return ["g:"+g.id,"Group: "+g.name];}));
  openModal("Assign: "+item.name,'<p>'+info("assign")+' Choose who this applies to.</p>'+msel("Include","t",o),"Assign",function(fd){
    if(!fd.t){return {error:"Select a target."};}
    if(fd.t==="users"||fd.t==="devices"){item.assign.all=fd.t;}
    else{var g=fd.t.slice(2);if(item.assign.groups.indexOf(g)<0){item.assign.groups.push(g);}}
    audit("Assign "+item.name,"","Policy","Intune");toast("Assigned: "+assignText(item.assign)+".");return null;});};
A.delItem=function(d){
  if(d.k==="pol"){S.policies=S.policies.filter(function(x){return x.id!==d.id;});}
  else if(d.k==="app"){S.apps=S.apps.filter(function(x){return x.id!==d.id;});}
  else if(d.k==="ap"){S.apProfiles=S.apProfiles.filter(function(x){return x.id!==d.id;});}
  else{S.profiles=S.profiles.filter(function(x){return x.id!==d.id;});}
  toast("Deleted.");};

/* troubleshooting */
PAGES["intune.trouble"]=function(){
  var u=S.tUser?U(S.tUser):null,out="";
  if(u){
    var finds=[];
    if(u.blocked){finds.push("Account is disabled, so sign-in and enrollment fail.");}
    if(!hasLicense(u)){finds.push("No license that includes Intune. Enrollment fails with error 80180018.");}
    if(!u.loc){finds.push("Usage location is missing, so group licenses can't apply.");}
    if(!inMdmScope(u)){finds.push("MDM user scope doesn't include this user, so devices join Entra ID but never enroll in Intune.");}
    if(!userGroups(u.id).length){finds.push("Not in any group, so group-targeted policies and apps won't reach them.");}
    var dv=S.devices.filter(function(x){return x.userId===u.id&&x.state==="enrolled";});
    out='<h2 class="sec">Account status</h2>'+grid([["Account",u.blocked?badge("Disabled","bad"):badge("Enabled","ok")],["Intune license"+info("license"),hasLicense(u)?badge("Yes","ok"):badge("No","bad")],["Eligible for MDM enrollment"+info("mdmscope"),inMdmScope(u)?badge("Yes","ok"):badge("No","bad")],["Groups",esc(userGroups(u.id).map(function(g){return g.name;}).join(", ")||"None")],["Devices",dv.length]])+
      '<h2 class="sec">Findings</h2>'+(finds.length?finds.map(function(f){return '<div class="msg warn">'+esc(f)+'</div>';}).join(""):'<div class="msg ok">No problems found for this user.</div>')+
      (dv.length?'<h2 class="sec">Devices</h2>'+tbl(["Device","Compliance"],dv.map(function(x){return {cells:[esc(x.name),compBadge(x)]};})):'');
  }
  return crumbs([["Home","home"],["Troubleshooting + support"]])+'<h1 class="ptitle">Troubleshoot'+info("trouble")+'</h1><p class="psub">Pick a user to see why their device or policy might not be working.</p>'+
    '<div class="fld"><div class="lb">Select a user</div><select data-sv="tUser" aria-label="Select a user">'+opts(userList("Select a user"),S.tUser)+'</select></div>'+B("Look up","lookup",{primary:1})+out;
};
A.lookup=function(){ensureTroubled();if(S.tUser){S.flags.troubled[S.tUser]=true;}else{toast("Select a user first.");}};
