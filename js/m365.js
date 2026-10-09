"use strict";
/* =============== MICROSOFT 365 ADMIN CENTER =============== */
PAGES["m365.home"]=function(){
  return '<h1 class="ptitle">Home</h1><p class="psub">Welcome to your practice admin center.</p>'+
  '<div class="cards"><div class="tile"><h3>Active users</h3><div class="big">'+live().length+'</div>'+B("Add a user","wizNewMUser",{icon:"plus",sm:1})+'</div>'+
  '<div class="tile"><h3>Licenses'+info("license")+'</h3><div class="big">'+assigned()+' / '+S.total+'</div><div class="meter"><i style="width:'+Math.round(assigned()/S.total*100)+'%"></i></div><span>'+available()+' available</span></div>'+
  '<div class="tile"><h3>Service health</h3><div class="big" style="font-size:18px">'+badge("All services healthy","ok")+'</div></div></div>'+
  '<h2 class="sec">Admin centers</h2><div class="btnrow">'+B("Identity (Entra)","go",{d:{p:"entra",pg:"overview"},icon:"shield"})+B("Endpoint Manager (Intune)","go",{d:{p:"intune",pg:"home"},icon:"device"})+B("Exchange","go",{d:{p:"exchange",pg:"mailboxes"},icon:"mail"})+'</div>';
};

PAGES["m365.users"]=function(){
  var rows=live().filter(function(u){return matchQ(u.name+u.upn);}).map(function(u){
    return {id:u.id,cells:[lnk(u.name,"openMUser",u.id)+(u.blocked?" "+badge("Sign-in blocked","bad"):""),'<span class="mono">'+esc(upn(u))+'</span>',esc(licText(u))]};});
  var c=checked1();
  return '<h1 class="ptitle">Active users</h1>'+
  bar([CB("user","Add a user","wizNewMUser"),CB("lock","Multi-factor authentication","perUserMfa",{i:"mfa"}),CB("trash","Delete a user","delUser",{d:{id:c},dis:!c}),CB("refresh","Refresh","refresh"),CB("key","Reset password","resetPw",{d:{id:c},dis:!c}),VR,CB("filter","Filter","noop")])+
  search("Search active users list")+tbl(["Display name","Username"+info("upn"),"Licenses"+info("license")],rows,{check:true});
};

/* add user wizard */
WIZ.mUser={title:"Add a user",crumbs:[["Active users","users"],["Add a user"]],init:{name:"",upn:"",loc:"",lic:true,admin:"user",role:"ha"},btn:"Finish adding",
  steps:[
   {n:"Basics",h:function(){return fText("Display name","name")+fText("Username","upn",{i:"upn",hint:"Domain: @"+DOMAIN});},validate:function(d){if(!(d.name||"").trim()){return "Enter a display name.";}if(!(d.upn||"").trim()){return "Enter a username.";}return "";}},
   {n:"Product licenses",h:function(){return fSel("Select location","loc",LOCS,{i:"usage",hint:"Required. Licenses can't be assigned without a usage location."})+
     '<div class="fld"><div class="lb">Licenses ('+available()+' available)'+info("license")+'</div></div>'+fChk("Microsoft 365 Business Premium","lic",{hint:"Prefer adding the user to a licensed group instead, so offboarding is just a group change."+info("grouplic")});}},
   {n:"Optional settings",h:function(){return fRad("Roles"+"","admin",[["user","User (no administrator access)"],["admin","Admin center access"]],{i:"roles"})+(wv("admin")==="admin"?fSel("Role","role",ROLES.map(function(r){return [r.id,r.name];}),{i:"least"}):"");}},
   {n:"Finish",h:function(){var d=S.wiz.d;return grid([["Display name",esc(d.name||"?")],["Username",esc((d.upn||"?")+"@"+DOMAIN)],["Location",locName(d.loc)],["License",d.lic?"Microsoft 365 Business Premium":"None"],["Role",d.admin==="admin"?esc(role(d.role).name):"User (no admin access)"]]);}}
  ],
  create:function(d){var r=createUser(d.name,d.upn,d.loc,!!d.lic);if(r.error){return r;}if(d.admin==="admin"){r.user.roles.push(d.role);}return {msg:"User added: "+r.user.name+". Temporary password: "+r.pw};}
};
A.wizNewMUser=function(){wizOpen("mUser");};

/* user flyout */
A.openMUser=function(d){var u=U(d.id);S.fly={k:"muser",id:u.id,tab:"account",d:{loc:u.loc,lic:!!u.direct}};};
FLY.muser=function(){
  var u=U(S.fly.id),t=S.fly.tab,d=S.fly.d,body="";
  if(t==="account"){
    body='<h2 class="sec">Username</h2><p class="mono">'+esc(upn(u))+'</p>'+
    '<h2 class="sec">Groups</h2><p>'+(userGroups(u.id).map(function(g){return badge(g.name);}).join(" ")||"None")+'</p>'+
    '<h2 class="sec">Roles'+info("roles")+'</h2><p>'+(u.roles.map(function(r){return badge(role(r).name,r==="ga"?"warn":"");}).join(" ")||"No administrator access")+'</p>'+
    '<h2 class="sec">Sign-in status</h2><p>'+(u.blocked?badge("Sign-in blocked","bad"):badge("Sign-in allowed","ok"))+'</p>'+
    '<div class="btnrow">'+B("Reset password","resetPw",{icon:"key",d:{id:u.id}})+B(u.blocked?"Unblock sign-in":"Block sign-in","block",{icon:"block",danger:!u.blocked,d:{id:u.id}})+B("Sign out of all sessions","revoke",{icon:"signout",d:{id:u.id}})+'</div>'+
    '<p class="hint">Block sign-in'+info("block")+' and sign out'+info("revoke")+' work together: block stops new sign-ins, sign out ends the ones already open.</p>';
  }else if(t==="devices"){
    var dv=S.devices.filter(function(x){return x.userId===u.id&&x.state==="enrolled";});
    body=tbl(["Device","OS","Compliance"],dv.map(function(x){return {cells:[esc(x.name),esc(x.os),x.compl&&x.compl.state==="Compliant"?badge("Compliant","ok"):badge("Not compliant","bad")]};}),{empty:"No managed devices for this user."});
  }else if(t==="licenses"){
    var grpLic=viaGroup(u)&&!!u.loc&&!u.direct;
    body='<div class="fld"><div class="lb">Select location'+info("usage")+'</div><select data-fd="loc" aria-label="Select location">'+opts(LOCS,d.loc)+'</select></div>'+
    '<h2 class="sec">Licenses ('+(hasLicense(u)?1:0)+')</h2>'+
    '<label class="chk"><input type="checkbox" data-fd="lic"'+((d.lic||grpLic)?' checked':'')+(grpLic?' disabled':'')+'> Microsoft 365 Business Premium</label>'+
    '<div class="hint">'+(grpLic?"Assigned through a group. Remove the user from the group (or the group license) to change it.":available()+" licenses available")+'</div>'+
    (licState(u).k==="bad"?'<div class="msg bad">Group license error: usage location is missing. Set it above and save.</div>':'')+
    '<div class="btnrow">'+B("Save changes","saveMLic",{primary:1})+'</div>';
  }else if(t==="mail"){
    body='<h2 class="sec">Email forwarding'+info("fwd")+'</h2><p>'+(u.fwd?'Forwarding to '+fwdLabel(u):"Not forwarding.")+'</p>'+B("Manage email forwarding","mailFwd",{d:{id:u.id}})+
    (hasLicense(u)?'':'<div class="msg warn">This user has no license, so the mailbox is inactive.'+info("mailbox")+'</div>');
  }else if(t==="onedrive"){
    body='<h2 class="sec">Get access to files'+info("onedrive")+'</h2><p>Create a link so a manager can open this user\'s OneDrive files before the account is deleted.</p>'+
    (u.filesLink?'<div class="msg ok">Link created: <span class="mono">https://practicetenant-my.sharepoint.com/personal/'+esc(u.upn)+'</span></div>':B("Create link to files","fileLink",{icon:"folder",d:{id:u.id}}));
  }
  return {title:u.name,sub:'<span class="mono">'+esc(upn(u))+'</span>',tabs:[["account","Account"],["devices","Devices"],["licenses","Licenses and apps"],["mail","Mail"],["onedrive","OneDrive"]],body:body};
};
A.block=function(d){var u=U(d.id);u.blocked=!u.blocked;audit(u.blocked?"Update user (block sign-in)":"Update user (allow sign-in)",u.id);toast(u.name+(u.blocked?" can no longer sign in.":" can sign in again."));};
A.saveMLic=function(){var u=U(S.fly.id),d=S.fly.d;
  if(d.lic&&!d.loc){toast("Select a location first. A license can't be assigned without one.");return;}
  if(d.lic&&!u.direct&&available()<=0){toast("No licenses available.");return;}
  u.loc=d.loc;u.direct=!!d.lic;audit("Change user license",u.id);toast("License changes saved for "+u.name+".");};
A.fileLink=function(d){var u=U(d.id);u.filesLink=true;audit("Grant access to OneDrive",u.id,"SharePoint","OneDrive");toast("Link created. Send it to the manager.");};
function forwardBlocked(addr){var a=(addr||"").trim().toLowerCase();if(!externalForwardRule()){return "";}var at=a.lastIndexOf("@");if(at<1){return "";}if(a.slice(at+1)===DOMAIN){return "";}return "A mail flow rule is blocking automatic forwarding to external addresses. Remove that rule in Exchange, or forward inside @"+DOMAIN+".";}
function externalForwardRule(){return S.mailRules.some(function(r){return r.what.indexOf("Block automatic forwarding")===0;});}
function fwdLabel(u){if(!u.fwd){return "Not set";}var blocked=forwardBlocked(u.fwd);return '<span class="mono">'+esc(u.fwd)+'</span> '+(blocked?badge("Blocked by mail flow rule","warn"):badge("External","bad"));}
A.mailFwd=function(d){var u=U(d.id);
  openModal("Manage email forwarding",'<div class="fld"><label class="chk"><input type="checkbox" name="on" value="1"'+(u.fwd?' checked':'')+'> Forward all emails sent to this mailbox</label></div>'+mtext("Forward to","addr","name@company.com").replace('aria-label="Forward to"','aria-label="Forward to" value="'+esc(u.fwd||"")+'"')+(externalForwardRule()?'<div class="hint">External forwarding is blocked by a mail flow rule. The mailbox setting can stay, but mail will not leave the tenant until you remove the rule or the forward.</div>':''),"Save",function(fd){
    if(fd.on){var a=(fd.addr||"").trim();if(a.indexOf("@")<1){return {error:"Enter a valid email address."};}var block=forwardBlocked(a);if(block){return {error:block};}u.fwd=a;audit("Set-Mailbox (forwarding enabled)",u.id,"Exchange","Exchange");toast("Forwarding set to "+a+".");}
    else{u.fwd=null;audit("Set-Mailbox (forwarding removed)",u.id,"Exchange","Exchange");toast("Forwarding removed for "+u.name+".");}return null;});};

/* deleted users */
PAGES["m365.deleted"]=function(){
  var rows=S.users.filter(function(u){return u.deleted;}).map(function(u){return {cells:[esc(u.name),'<span class="mono">'+esc(upn(u))+'</span>',B("Restore user","restoreUser",{sm:1,d:{id:u.id}})]};});
  return '<h1 class="ptitle">Deleted users'+info("soft")+'</h1><p class="psub">Deleted users can be restored for 30 days.</p>'+tbl(["Display name","Username",""],rows,{empty:"No deleted users."});
};

/* groups */
PAGES["m365.groups"]=function(){
  var rows=S.groups.filter(function(g){return matchQ(g.name);}).map(function(g){return {cells:[lnk(g.name,"openMGroup",g.id),"Security"+info("secgroup"),liveMembers(g).length,S.licenseGroups.indexOf(g.id)>-1?badge("Licensed","ok"):"-"]};});
  return '<h1 class="ptitle">Active teams & groups</h1>'+bar([CB("plus","Add a security group","newGroup"),CB("refresh","Refresh","refresh")])+search("Search groups")+tbl(["Name","Type","Members","Group license"+info("grouplic")],rows);
};
A.openMGroup=function(d){S.fly={k:"mgroup",id:d.id,tab:"members"};};
FLY.mgroup=function(){var g=G(S.fly.id);
  return {title:g.name,sub:"Security group",body:bar([CB("plus","Add members","addMemberTo",{d:{g:g.id}})])+tbl(["Name",""],liveMembers(g).map(function(u){return {cells:[esc(u.name),B("Remove","rmMember",{sm:1,d:{g:g.id,id:u.id}})]};}),{empty:"No members yet."})};
};

/* licenses */
PAGES["m365.licenses"]=function(){
  if(S.sel){return m365Product();}
  return '<h1 class="ptitle">Licenses'+info("license")+'</h1><p class="psub">Assign licenses to people or, better, to groups.</p>'+
   tbl(["License","Available licenses","Assigned licenses"],[{cells:[lnk("Microsoft 365 Business Premium","sel","bp"),available(),assigned()+" of "+S.total]}]);
};
function m365Product(){
  var t=S.tab||"users",body="";
  if(t==="users"){
    var c=checked1(),rows=live().filter(function(u){return u.direct;}).map(function(u){return {id:u.id,cells:[esc(u.name),'<span class="mono">'+esc(upn(u))+'</span>']};});
    body=bar([CB("plus","Assign licenses","assignLicUser"),CB("trash","Revoke licenses","licUser",{d:{id:c},dis:!c})])+tbl(["Name","Username"],rows,{check:true,empty:"No directly licensed users."});
  }else{
    var errs=live().filter(function(u){return viaGroup(u)&&!u.loc&&!u.direct;});
    body=bar([CB("plus","Assign licenses","assignLicGroup")])+tbl(["Group","Members",""],S.licenseGroups.map(function(id){var g=G(id);return {cells:[esc(g.name),g.members.length,B("Remove","licGroupToggle",{sm:1,danger:1,d:{g:id}})]};}),{empty:"No groups hold this license yet."})+
      (errs.length?'<h2 class="sec">Licensing errors</h2>'+tbl(["User","Problem"],errs.map(function(u){return {cells:[esc(u.name),"Usage location is missing. Set it on the user and the license applies."]};})):'');
  }
  return crumbs([["Licenses","licenses"],["Microsoft 365 Business Premium"]])+'<h1 class="ptitle">Microsoft 365 Business Premium</h1><p class="psub">'+available()+' of '+S.total+' licenses available.</p>'+tabs([["users","Users"],["groups","Groups"+""]],t,"tab")+body;
}
A.assignLicUser=function(){openModal("Assign licenses",msel("User","u",userList("Select a user",function(u){return !u.direct;}))+'<p class="hint">The user needs a usage location first.</p>',"Assign",function(fd){if(!fd.u){return {error:"Select a user."};}var u=U(fd.u);if(!u.loc){return {error:u.name+" has no usage location. Set it first."};}if(available()<=0){return {error:"No licenses available."};}u.direct=true;audit("Change user license",u.id);toast("License assigned to "+u.name+".");return null;});};
A.assignLicGroup=function(){openModal("Assign licenses to a group",'<p>Everyone in the group gets Business Premium, including people added later.'+info("grouplic")+'</p>'+msel("Group","g",groupList("Select a group")),"Assign",function(fd){
  if(!fd.g){return {error:"Select a group."};}if(S.licenseGroups.indexOf(fd.g)>-1){return {error:"That group already has this license."};}
  var g=G(fd.g);var seat=groupLicenseError(g);if(seat){return {error:seat};}S.licenseGroups.push(fd.g);audit("Assign license to group",g.name,"GroupManagement");var e=liveMembers(g).filter(function(u){return !u.loc;}).length;
  toast("License assigned to "+g.name+(e?". "+e+" member(s) have errors: usage location missing.":"."));return null;});};
