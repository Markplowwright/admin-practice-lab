"use strict";
/* =============== ENTRA =============== */
var E_CR=function(){return [["Home","overview"]];};

PAGES["entra.overview"]=function(){
  var gas=live().filter(function(u){return u.roles.indexOf("ga")>-1;}).length;
  return head([["Home"]],"Overview","entra")+
  '<div class="tabs"><button type="button" aria-current="true">Overview</button><button type="button" data-a="go" data-pg="props">Properties</button><button type="button" data-a="go" data-pg="signins">Monitoring</button></div>'+
  '<h2 class="sec">Basic information</h2>'+grid([["Name","Practice Tenant"],["Tenant ID"+info("tenant"),'<span class="mono">'+TENANT+'</span>'],["Primary domain",DOMAIN],["License","Microsoft Entra ID P1"]])+
  '<div class="cards"><div class="tile"><h3>Users</h3><div class="big">'+live().length+'</div></div><div class="tile"><h3>Groups</h3><div class="big">'+S.groups.length+'</div></div><div class="tile"><h3>Devices</h3><div class="big">'+S.devices.filter(function(d){return d.state==="enrolled";}).length+'</div></div></div>'+
  '<h2 class="sec">Security posture</h2>'+
  (S.secDefaults||S.caPolicies.some(function(p){return p.state==="on";})?'<div class="msg ok">MFA is being enforced for sign-ins.</div>':'<div class="msg warn">No MFA enforcement is active. Turn on security defaults or create a Conditional Access policy.</div>')+
  (gas>1?'<div class="msg warn">'+gas+' accounts hold Global Administrator. Review whether each one needs it ('+'least privilege'+info("least")+').</div>':'');
};

PAGES["entra.props"]=function(){
  return head([["Home","overview"],["Overview"]],"Properties","tenant")+
  '<h2 class="sec">Tenant properties</h2>'+grid([["Name","Practice Tenant"],["Country or region","United States"],["Tenant ID",'<span class="mono">'+TENANT+'</span>']])+
  '<h2 class="sec">Security defaults'+info("secdef")+'</h2><p>Security defaults are currently <b>'+(S.secDefaults?"enabled":"disabled")+'</b>.</p>'+B("Manage security defaults","openSecdef",{icon:"shield"});
};
FLY.secdef=function(){
  var d=S.fly.d;
  return {title:"Security defaults",sub:"Requires MFA registration and blocks legacy authentication for all users.",body:
    '<div class="fld"><div class="lb">Security defaults'+info("secdef")+'</div><select data-fd="sd" data-rr="1" aria-label="Security defaults">'+opts([["on","Enabled (recommended)"],["off","Disabled (not recommended)"]],d.sd)+'</select></div>'+
    (d.sd==="off"?'<div class="fld"><div class="lb">Why are you disabling security defaults?</div>'+[["ca","My organization is using Conditional Access"],["many","My organization is experiencing multifactor authentication prompts"],["other","Other"]].map(function(r){return '<label class="rad"><input type="radio" name="rsn" data-fd="reason" value="'+r[0]+'"'+(d.reason===r[0]?' checked':'')+'> '+esc(r[1])+'</label>';}).join("")+'</div>':'')+
    '<div class="btnrow">'+B("Save","saveSecdef",{primary:1})+B("Cancel","closeFly")+'</div>'};
};
A.openSecdef=function(){S.fly={k:"secdef",d:{sd:S.secDefaults?"on":"off",reason:""}};};
A.saveSecdef=function(){
  var d=S.fly.d;
  if(d.sd==="on"){
    if(S.caPolicies.some(function(p){return p.state==="on";})){toast("Can't enable security defaults while Conditional Access policies are on. Turn those policies off first.");return;}
    S.secDefaults=true;audit("Update security defaults (enabled)","","Policy");toast("Security defaults enabled. Everyone must register for MFA.");
  }else{
    if(S.secDefaults&&!d.reason){toast("Select a reason for disabling security defaults.");return;}
    S.secDefaults=false;audit("Update security defaults (disabled)","","Policy");toast("Security defaults disabled.");
  }
  S.fly=null;
};

/* ----- users ----- */
PAGES["entra.users"]=function(){
  if(S.sel){return entraUser(U(S.sel));}
  var rows=live().filter(function(u){return matchQ(u.name+u.upn);}).map(function(u){
    return {id:u.id,cells:[lnk(u.name,"sel",u.id),'<span class="mono">'+esc(upn(u))+'</span>',"Member",u.blocked?badge("No","bad"):"Yes"]};});
  var c=checked1();
  return head([["Home","overview"],["Users"]],"All users","entra")+
  bar([CB("plus","New user","wizNewEUser"),CB("trash","Delete","delUser",{d:{id:c},dis:!c}),CB("refresh","Refresh","refresh"),VR,CB("lock","Per-user MFA","perUserMfa",{i:"permfa"}),CB("columns","Manage view","noop")])+
  search("Search by name or user principal name")+tbl(["Display name","User principal name"+info("upn"),"User type","Account enabled"],rows,{check:true});
};
function entraUser(u){
  var tabsL=[["overview","Overview"],["audit","Audit logs"],["signins","Sign-in logs"],["groups","Groups"],["licenses","Licenses"],["devices","Devices"],["auth","Authentication methods"],["roles","Assigned roles"]];
  var t=S.tab||"overview",body="";
  if(t==="overview"){
    body=grid([["Display name",esc(u.name)],["User principal name"+info("upn"),'<span class="mono">'+esc(upn(u))+'</span>'],["Object ID",'<span class="mono">'+esc(u.id)+'-4e1b-9c20-7a31</span>'],["User type","Member"],["Account enabled"+info("block"),u.blocked?"No":"Yes"],["Usage location"+info("usage"),locName(u.loc)],["Sessions valid from"+info("revoke"),u.revoked?"Just now (sessions revoked)":"Today 08:00"],["Last password change",u.pwReset?"Just now":"60 days ago"],["Licenses",esc(licText(u))]]);
  }else if(t==="signins"){
    var ls=S.logs.filter(function(l){return l.uid===u.id;});
    body='<p>Sign-ins for this user, newest first.</p>'+bar([CB("play","Simulate a sign-in as this user","simSignin",{d:{id:u.id},lab:1})])+
      tbl(["Date","Application","Status","IP address","Location","Conditional Access"],ls.map(function(l){return {cells:[esc(l.when),esc(l.app),statusBadge(l.status),'<span class="mono">'+esc(l.ip)+'</span>',esc(l.place)+(l.odd?" "+badge("Unfamiliar","warn"):""),esc(l.ca)]};}),{empty:"No sign-ins yet."});
  }else if(t==="audit"){
    var au=S.audit.filter(function(a){return a.tgt===u.id;});
    body=tbl(["Date","Service","Category","Activity"],au.map(function(a){return {cells:[esc(a.when),esc(a.svc),esc(a.cat),esc(a.act)]};}),{empty:"No audit events for this user."});
  }else if(t==="groups"){
    body=bar([CB("plus","Add memberships","addMembership",{d:{id:u.id}})])+tbl(["Group name","Type",""],userGroups(u.id).map(function(g){return {cells:[esc(g.name),"Security",B("Remove","rmMembership",{sm:1,d:{id:u.id,g:g.id}})]};}),{empty:"Not a member of any group."});
  }else if(t==="licenses"){
    var s=licState(u);
    body='<p>Assignments'+info("license")+'</p>'+tbl(["License","Assignment paths","State"],[{cells:["Microsoft 365 Business Premium",s.k==="ok"?(u.direct?"Direct":"Inherited (group)"):"-",s.k==="ok"?badge("Active","ok"):s.k==="bad"?badge("Error","bad"):badge("Not assigned")]}])+
      '<div class="btnrow">'+B(u.direct?"Remove direct assignment":"Add direct assignment","licUser",{d:{id:u.id},primary:!u.direct})+'</div>'+(s.k==="bad"?'<div class="msg bad">The group license failed because usage location is missing. Set it with Edit properties.</div>':'');
  }else if(t==="devices"){
    var dv=S.devices.filter(function(d){return d.userId===u.id&&d.state==="enrolled";});
    body=tbl(["Name","Join type","MDM","Compliant"],dv.map(function(d){return {cells:[esc(d.name),"Microsoft Entra joined","Microsoft Intune",d.compl&&d.compl.state==="Compliant"?"Yes":"No"]};}),{empty:"No devices."});
  }else if(t==="auth"){
    body=bar([CB("plus","Add authentication method","addMethod",{d:{id:u.id}}),CB("restart","Require re-register multifactor authentication","rereg",{d:{id:u.id},i:"rereg"}),CB("signout","Revoke multifactor authentication sessions","revoke",{d:{id:u.id}})])+
      '<p>Authentication methods'+info("authm")+' registered by this user:</p>'+tbl(["Method","Detail",""],u.methods.map(function(m){return {cells:[esc(m.type)+(m.sus?" "+badge("Added recently","warn"):""),esc(m.detail),B("Delete","delMethod",{sm:1,danger:1,d:{id:u.id,m:m.id}})]};}),{empty:"No methods registered. With MFA enforced this user would be asked to register."});
  }else if(t==="roles"){
    body=bar([CB("plus","Add assignments","addRoleToUser",{d:{id:u.id}})])+p_least()+tbl(["Role","Description",""],u.roles.map(function(r){var ro=role(r);return {cells:[esc(ro.name),esc(ro.desc),B("Remove","rmRole",{sm:1,d:{id:u.id,r:r}})]};}),{empty:"No administrator roles. This is the right default for most people."});
  }
  return crumbs([["Home","overview"],["Users","users"],[u.name]])+'<h1 class="ptitle">'+esc(u.name)+' | '+esc(tabsL.filter(function(x){return x[0]===t;})[0][1])+'</h1>'+
    bar([CB("edit","Edit properties","editProps",{d:{id:u.id}}),CB("trash","Delete","delUser",{d:{id:u.id}}),CB("refresh","Refresh","refresh"),VR,CB("key","Reset password","resetPw",{d:{id:u.id}}),CB("signout","Revoke sessions","revoke",{d:{id:u.id},i:"revoke"})])+
    blade(tabsL,t,body);
}
function p_least(){return '<p class="psub">Assign the smallest role that fits'+info("least")+'. Most people need none.</p>';}
function statusBadge(s){return s==="Success"?badge("Success","ok"):s==="Failure"?badge("Failure","bad"):badge(s,"warn");}

FLY.editprops=function(){var d=S.fly.d;
  return {title:"Edit properties",sub:esc(U(S.fly.id).name),body:
    '<div class="fld"><div class="lb">Account enabled'+info("block")+'</div><select data-fd="enabled" aria-label="Account enabled">'+opts([["yes","Yes"],["no","No (blocks sign-in)"]],d.enabled)+'</select></div>'+
    '<div class="fld"><div class="lb">Usage location'+info("usage")+'</div><select data-fd="loc" aria-label="Usage location">'+opts(LOCS,d.loc)+'</select></div>'+
    '<div class="btnrow">'+B("Save","saveProps",{primary:1})+B("Cancel","closeFly")+'</div>'};
};
A.editProps=function(d){var u=U(d.id);S.fly={k:"editprops",id:u.id,d:{enabled:u.blocked?"no":"yes",loc:u.loc}};};
A.saveProps=function(){var u=U(S.fly.id),d=S.fly.d;u.blocked=d.enabled==="no";u.loc=d.loc;audit("Update user",u.id);toast("Properties saved for "+u.name+".");S.fly=null;};

/* new user wizard */
WIZ.eUser={title:"Create new user",crumbs:[["Home","overview"],["Users","users"],["New user"]],init:{name:"",upn:"",loc:"",grp:"",role:""},btn:"Create",
  steps:[
   {n:"Basics",h:function(){return fText("User principal name"+"","upn",{i:"upn",ph:"first.last",hint:"The domain will be @"+DOMAIN})+fText("Display name","name")+'<div class="fld"><div class="lb">Password</div><p>Auto-generated. It is shown once after you create the user.</p></div>';},validate:function(d){if(!(d.name||"").trim()){return "Enter a display name.";}if(!(d.upn||"").trim()){return "Enter a user principal name.";}return "";}},
   {n:"Properties",h:function(){return fSel("Usage location","loc",LOCS,{i:"usage",hint:"Optional here, but a license can't be assigned without it."});}},
   {n:"Assignments",h:function(){return fSel("Add to group","grp",groupList("None"))+fSel("Assign role","role",[["","None (recommended)"]].concat(ROLES.map(function(r){return [r.id,r.name];})),{i:"least"});}},
   {n:"Review + create",h:function(){var d=S.wiz.d;return grid([["User principal name",esc((d.upn||"?")+"@"+DOMAIN)],["Display name",esc(d.name||"?")],["Usage location",locName(d.loc)],["Group",d.grp?esc(G(d.grp).name):"None"],["Role",d.role?esc(role(d.role).name):"None"]]);}}
  ],
  create:function(d){var r=createUser(d.name,d.upn,d.loc,false);if(r.error){return r;}
    var u=r.user;if(d.grp){G(d.grp).members.push(u.id);}if(d.role){u.roles.push(d.role);}return {msg:"User created: "+u.name+". Temporary password: "+r.pw};}
};
A.wizNewEUser=function(){wizOpen("eUser");};

A.delUser=function(d){var u=U(d.id);if(!u){return;}
  confirmBox("Delete "+u.name+"?","The user moves to <b>Deleted users</b> for 30 days and can be restored. Their license is released, but group memberships and any files should be handled first."+info("soft"),"Delete",function(){u.deleted=true;S.sel=null;S.checked=[];S.fly=null;audit("Delete user",u.id);toast(u.name+" was deleted. You can restore them for 30 days.");});};
A.resetPw=function(d){var u=U(d.id),pw=randPw();u.pwReset=true;u.pw=pw;u.mustChange=true;audit("Reset password (by admin)",u.id);
  openModal("Password reset",'<p>New temporary password for <b>'+esc(u.name)+'</b>:</p><span class="pwbox">'+pw+'</span><p>They must change it at next sign-in. Resetting the password does not end sessions that are already signed in. Use <b>Revoke sessions</b> too.</p>',null,null);};
A.revoke=function(d){var u=U(d.id);u.revoked=true;audit("Revoke user sign-in sessions",u.id);toast("Sessions revoked for "+u.name+". They must sign in again everywhere.");};
A.licUser=function(d){var u=U(d.id);
  if(u.direct){u.direct=false;audit("Remove license from user",u.id,"UserManagement","Core Directory");toast("Direct license removed from "+u.name+(viaGroup(u)?" (still licensed through a group).":"."));return;}
  if(!u.loc){toast("License assignment failed: usage location isn't set. Set it first.");return;}
  if(available()<=0){toast("No licenses available.");return;}
  u.direct=true;audit("Change user license",u.id);toast("Business Premium assigned to "+u.name+".");};
A.addMembership=function(d){var u=U(d.id);
  openModal("Add memberships",msel("Group","g",groupList("Select a group")),"Select",function(fd){if(!fd.g){return {error:"Select a group."};}var g=G(fd.g);if(g.members.indexOf(u.id)>-1){return {error:"Already a member."};}var seat=memberLicenseError(u,g);if(seat){return {error:seat};}g.members.push(u.id);audit("Add member to group",u.id);toast(u.name+" added to "+g.name+".");return null;});};
A.rmMembership=function(d){var g=G(d.g);g.members=g.members.filter(function(m){return m!==d.id;});audit("Remove member from group",d.id);toast("Removed from "+g.name+".");};
A.addMethod=function(d){var u=U(d.id);
  openModal("Add authentication method",msel("Method","t",[["Phone (SMS)","Phone (SMS)"],["Email","Email"]])+mtext("Phone number or email","v"),"Add",function(fd){if(!(fd.v||"").trim()){return {error:"Enter a value."};}u.methods.push({id:nid("m"),type:fd.t,detail:fd.v.trim(),sus:false});audit("Admin registered security info",u.id);toast("Method added.");return null;});};
A.delMethod=function(d){var u=U(d.id);u.methods=u.methods.filter(function(m){return m.id!==d.m;});audit("Admin deleted security info",u.id);toast("Authentication method deleted. The user may need to register again.");};
A.rereg=function(d){var u=U(d.id);confirmBox("Require re-register MFA?","All of "+esc(u.name)+"'s registered methods are cleared and they must register again at next sign-in.","Require",function(){u.methods=[];u.revoked=true;audit("Require re-register MFA",u.id);toast("Methods cleared for "+u.name+".");});};
A.addRoleToUser=function(d){var u=U(d.id);
  openModal("Add assignments",msel("Role","r",ROLES.map(function(r){return [r.id,r.name];}))+'<p class="hint">Pick the narrowest role that works.</p>',"Add",function(fd){if(u.roles.indexOf(fd.r)>-1){return {error:"Already assigned."};}u.roles.push(fd.r);audit("Add member to role",u.id,"RoleManagement");toast(role(fd.r).name+" assigned to "+u.name+".");return null;});};
A.rmRole=function(d){var u=U(d.id);u.roles=u.roles.filter(function(r){return r!==d.r;});audit("Remove member from role",u.id,"RoleManagement");toast("Role removed from "+u.name+".");};
A.simSignin=function(d){
  var u=U(d.id),good=u.methods.some(function(m){return !m.sus;});
  var caOn=S.caPolicies.some(function(p){return p.state==="on";}),caRep=S.caPolicies.some(function(p){return p.state==="report";});
  var need=S.secDefaults||caOn,status,mfa,ca,note;
  if(u.blocked){status="Failure";mfa="-";ca="Not applied";note="Sign-in failed (50057): the account is disabled.";}
  else if(need&&!good){status="Interrupted";mfa="MFA registration required (50072)";ca=caOn?"Success":"Security defaults";S.flags.testedMfa=true;note=u.name+" has no MFA method, so they are forced to register one before continuing.";}
  else if(need){status="Success";mfa="MFA satisfied (app notification)";ca=caOn?"Success":"Security defaults";note="MFA was required and satisfied.";}
  else{status="Success";mfa="Single-factor authentication";ca=caRep?"Report-only: would require MFA":"Not applied";note="Signed in with a password only. Nothing enforces MFA yet."+(caRep?" The report-only policy logged that it would have required MFA.":"");}
  S.logs.unshift({id:nid("l"),uid:u.id,when:"Just now",app:"Test sign-in",status:status,ip:"73.12.90.4",place:"Brooklyn, United States",ca:ca,mfa:mfa,odd:false});
  toast(note);
};

/* deleted users */
PAGES["entra.deleted"]=function(){
  var rows=S.users.filter(function(u){return u.deleted;}).map(function(u){return {cells:[esc(u.name),'<span class="mono">'+esc(upn(u))+'</span>',"30 days",B("Restore","restoreUser",{sm:1,d:{id:u.id}})]};});
  return head([["Home","overview"],["Users"]],"Deleted users","soft")+tbl(["Display name","User principal name","Days until permanent deletion",""],rows,{empty:"No deleted users."});
};
A.restoreUser=function(d){var u=U(d.id);u.deleted=false;u.direct=false;audit("Restore user",u.id);toast(u.name+" restored. They need a license assigned again.");};

/* ----- groups ----- */
PAGES["entra.groups"]=function(){
  if(S.sel){return entraGroup(G(S.sel));}
  var rows=S.groups.filter(function(g){return matchQ(g.name);}).map(function(g){return {cells:[lnk(g.name,"sel",g.id),'<span class="mono">'+g.id+'-77c2-41ef</span>',"Security"+info("secgroup"),"Assigned",g.members.length]};});
  return head([["Home","overview"],["Groups"]],"All groups","secgroup")+bar([CB("plus","New group","newGroup"),CB("refresh","Refresh","refresh")])+search("Search by name")+tbl(["Name","Object Id","Group type","Membership type","Members"],rows);
};
function entraGroup(g){
  var t=S.tab||"overview",list=[["overview","Overview"],["members","Members"],["licenses","Licenses"]],body="";
  if(t==="overview"){body=grid([["Name",esc(g.name)],["Group type","Security"],["Membership type","Assigned"],["Members",liveMembers(g).length],["Group license"+info("grouplic"),S.licenseGroups.indexOf(g.id)>-1?"Microsoft 365 Business Premium":"None"]]);}
  else if(t==="members"){body=bar([CB("plus","Add members","addMemberTo",{d:{g:g.id}})])+tbl(["Name","User principal name",""],liveMembers(g).map(function(u){return {cells:[esc(u.name),'<span class="mono">'+esc(upn(u))+'</span>',B("Remove","rmMember",{sm:1,d:{g:g.id,id:u.id}})]};}),{empty:"No members."});}
  else if(t==="licenses"){
    var on=S.licenseGroups.indexOf(g.id)>-1,errs=liveMembers(g).filter(function(u){return !u.loc&&!u.direct;});
    body='<p>License assignments'+info("grouplic")+' apply to every member of this group.</p>'+bar([CB("plus","Assignments","licGroupToggle",{d:{g:g.id},dis:on}),CB("trash","Remove","licGroupToggle",{d:{g:g.id},dis:!on})])+
      tbl(["License","State"],on?[{cells:["Microsoft 365 Business Premium",badge("Assigned","ok")]}]:[],{empty:"No licenses assigned to this group."})+
      (on&&errs.length?'<div class="msg bad">'+errs.length+' member(s) have a license error because usage location is missing: '+esc(errs.map(function(u){return u.name;}).join(", "))+'.</div>':'');
  }
  return crumbs([["Home","overview"],["Groups","groups"],[g.name]])+'<h1 class="ptitle">'+esc(g.name)+' | '+esc(list.filter(function(x){return x[0]===t;})[0][1])+'</h1>'+blade(list,t,body);
}
A.newGroup=function(){openModal("New group",msel("Group type","t",[["Security","Security"]])+mtext("Group name","name","NYC-Staff"),"Create",function(fd){
  var n=(fd.name||"").trim();if(!n){return {error:"Enter a group name."};}
  if(S.groups.some(function(g){return g.name.toLowerCase()===n.toLowerCase();})){return {error:"A group with that name already exists."};}
  S.groups.push({id:nid("g"),name:n,members:[],created:true});audit("Add group",n,"GroupManagement");toast("Group created: "+n+".");return null;});};
A.addMemberTo=function(d){var g=G(d.g);openModal("Add members",msel("User","u",userList("Select a user",function(u){return g.members.indexOf(u.id)<0;})),"Select",function(fd){if(!fd.u){return {error:"Select a user."};}var u=U(fd.u);var seat=memberLicenseError(u,g);if(seat){return {error:seat};}g.members.push(fd.u);audit("Add member to group",fd.u,"GroupManagement");toast(u.name+" added to "+g.name+".");return null;});};
A.rmMember=function(d){var g=G(d.g);g.members=g.members.filter(function(m){return m!==d.id;});audit("Remove member from group",d.id,"GroupManagement");toast(U(d.id).name+" removed from "+g.name+".");};
A.licGroupToggle=function(d){var g=G(d.g),i=S.licenseGroups.indexOf(g.id);
  if(i>-1){S.licenseGroups.splice(i,1);audit("Remove license from group",g.name,"GroupManagement");toast("Group license removed. Members lose it unless licensed directly.");}
  else{var seat=groupLicenseError(g);if(seat){toast(seat);return;}S.licenseGroups.push(g.id);audit("Assign license to group",g.name,"GroupManagement");var e=liveMembers(g).filter(function(u){return !u.loc;}).length;toast("License assigned to "+g.name+(e?". "+e+" member(s) have errors: usage location missing.":"."));}};

/* ----- devices & MDM ----- */
PAGES["entra.devices"]=function(){
  var rows=S.devices.filter(function(d){return d.join;}).map(function(d){var u=U(d.joinUser);return {cells:[esc(d.name),"Yes",esc(d.os),esc(d.osVer),d.join==="joined"?"Microsoft Entra joined"+info("entrajoin"):"Microsoft Entra registered"+info("regvsjoin"),esc(u?u.name:"-"),d.state==="enrolled"?"Microsoft Intune":"None",d.state==="enrolled"?(d.compl&&d.compl.state==="Compliant"?"Yes":"No"):"N/A",esc(d.join==="joined"?"Today":"Today")]};});
  return head([["Home","overview"],["Devices"]],"All devices","entrajoin")+bar([CB("refresh","Refresh","refresh")])+tbl(["Name","Enabled","OS","Version","Join type","Owner","MDM","Compliant","Registered"],rows,{empty:"No devices yet. Join or register a laptop in the Windows laptop tab."});
};
PAGES["entra.devsettings"]=function(){
  if(!S.draft){S.draft={dj:S.deviceJoin};}
  return head([["Home","overview"],["Devices"]],"Device settings","devjoin")+'<h2 class="sec">Microsoft Entra join and registration settings</h2>'+
   '<div class="fld"><div class="lb">Users may join devices to Microsoft Entra'+info("devjoin")+'</div>'+[["all","All"],["none","None"]].map(function(r){return '<label class="rad"><input type="radio" name="dj" data-dr="dj" data-rr="1" value="'+r[0]+'"'+((S.draft&&S.draft.dj?S.draft.dj:S.deviceJoin)===r[0]?' checked':'')+'> '+r[1]+'</label>';}).join("")+'</div>'+
   '<div class="btnrow">'+B("Save","saveDevSettings",{primary:1})+'</div>'+(S.deviceJoin==="none"?'<div class="msg warn">Nobody can join a device right now. Joins fail with error 801c0003.</div>':'');
};
A.saveDevSettings=function(){var v=(S.draft&&S.draft.dj)||S.deviceJoin;S.deviceJoin=v;audit("Set device registration policy","","Policy");toast("Saved. Users may join devices: "+(v==="all"?"All":"None")+".");};
PAGES["entra.mdm"]=function(){
  if(!S.draft){S.draft={scope:S.mdm.scope,group:S.mdm.group};}
  var d=S.draft;
  return head([["Home","overview"],["Devices"]],"Mobility (MDM and MAM)","mdmscope")+'<h2 class="sec">Microsoft Intune</h2><p class="psub">Configure which users can enroll devices into Intune automatically.</p>'+
   '<div class="fld"><div class="lb">MDM user scope'+info("mdmscope")+'</div>'+[["none","None"],["some","Some"],["all","All"]].map(function(r){return '<label class="rad"><input type="radio" name="mdm" data-dr="scope" data-rr="1" value="'+r[0]+'"'+(d.scope===r[0]?' checked':'')+'> '+r[1]+'</label>';}).join("")+'</div>'+
   (d.scope==="some"?'<div class="fld"><div class="lb">Select groups</div><select data-dr="group" aria-label="Group">'+opts(groupList("Select a group"),d.group)+'</select></div>':'')+
   '<div class="btnrow">'+B("Save","saveMdm",{primary:1})+'</div>'+(S.mdm.scope==="none"?'<div class="msg warn">MDM user scope is None. New laptops will join Entra ID but will not enroll in Intune.</div>':'');
};
A.saveMdm=function(){var d=S.draft;if(d.scope==="some"&&!d.group){toast("Select a group for the 'Some' scope.");return;}S.mdm={scope:d.scope,group:d.scope==="some"?d.group:""};audit("Update MDM user scope","","Policy");toast("MDM user scope saved: "+S.mdm.scope+".");};

/* ----- roles ----- */
PAGES["entra.roles"]=function(){
  if(S.sel){var r=role(S.sel),us=live().filter(function(u){return u.roles.indexOf(r.id)>-1;}),c=checked1();
    return crumbs([["Home","overview"],["Roles & admins","roles"],[r.name]])+'<h1 class="ptitle">'+esc(r.name)+(r.id==="ga"?info("ga"):r.id==="ha"?info("helpdesk"):"")+'</h1><p class="psub">'+esc(r.desc)+'</p>'+
      (r.id==="ga"&&us.length>1?'<div class="msg warn">'+us.length+' Global Administrators. Microsoft recommends keeping this small. Does everyone here need full control?'+info("least")+'</div>':'')+
      bar([CB("plus","Add assignments","roleAdd",{d:{r:r.id}}),CB("trash","Remove assignments","roleRemove",{d:{r:r.id,id:c},dis:!c})])+
      tbl(["Name","User principal name","State"],us.map(function(u){return {id:u.id,cells:[esc(u.name),'<span class="mono">'+esc(upn(u))+'</span>',"Permanent"]};}),{check:true,empty:"No assignments."});}
  return head([["Home","overview"],["Roles & admins"]],"Roles and administrators","roles",p_least_text())+
    tbl(["Role","Description","Assigned"],ROLES.map(function(r){return {cells:[lnk(r.name,"sel",r.id),esc(r.desc),live().filter(function(u){return u.roles.indexOf(r.id)>-1;}).length]};}));
};
function p_least_text(){return "Assign the smallest role that gets the job done.";}
A.roleAdd=function(d){var r=role(d.r);openModal("Add assignments: "+r.name,msel("User","u",userList("Select a user",function(u){return u.roles.indexOf(r.id)<0;})),"Add",function(fd){if(!fd.u){return {error:"Select a user."};}U(fd.u).roles.push(r.id);audit("Add member to role",fd.u,"RoleManagement");toast(r.name+" assigned to "+U(fd.u).name+".");return null;});};
A.roleRemove=function(d){var u=U(d.id);if(!u){return;}u.roles=u.roles.filter(function(x){return x!==d.r;});S.checked=[];audit("Remove member from role",u.id,"RoleManagement");toast(role(d.r).name+" removed from "+u.name+".");};

/* ----- conditional access ----- */
PAGES["entra.ca"]=function(){
  var rows=S.caPolicies.map(function(p){return {cells:[esc(p.name),p.state==="on"?badge("On","ok"):p.state==="report"?badge("Report-only","warn"):badge("Off"),"All users","All resources","Require multifactor authentication",
    (p.state!=="on"?B("Turn on","caState",{sm:1,d:{id:p.id,s:"on"}})+" ":"")+(p.state!=="report"?B("Report-only","caState",{sm:1,d:{id:p.id,s:"report"}})+" ":"")+(p.state!=="off"?B("Turn off","caState",{sm:1,d:{id:p.id,s:"off"}})+" ":"")+B("Delete","caDelete",{sm:1,danger:1,d:{id:p.id}})]};});
  return head([["Home","overview"],["Protection"]],"Conditional Access | Policies","ca")+bar([CB("plus","New policy","wizNewCA"),CB("refresh","Refresh","refresh")])+
    (S.secDefaults?'<div class="msg warn">Security defaults are enabled. You must disable them (Overview > Properties) before turning a Conditional Access policy on.</div>':'')+
    tbl(["Policy name","State"+info("ccount"),"Users","Target resources","Grant","Actions"],rows,{empty:"No policies yet. Create one that requires MFA."});
};
WIZ.ca={title:"New Conditional Access policy",crumbs:[["Home","overview"],["Protection","ca"],["New"]],init:{name:"",state:"report"},btn:"Create",
  steps:[{n:"Policy",h:function(){return fText("Name","name",{ph:"Require MFA for all users"})+
    grid([["Users","All users"],["Target resources","All resources"],["Grant","Grant access: Require multifactor authentication"+info("mfa")]])+
    '<div style="height:12px"></div>'+fRad("Enable policy","state",[["report","Report-only"],["on","On"],["off","Off"]],{i:"reportonly"});},validate:reqName}],
  create:function(d){var n=(d.name||"").trim();if(!n){return {error:"Enter a policy name."};}
    if(d.state==="on"&&S.secDefaults){return {error:"You can't turn this policy on while security defaults are enabled. Disable security defaults first."};}
    S.caPolicies.push({id:nid("ca"),name:n,state:d.state});if(d.state==="report"){S.flags.caReport=true;}audit("Add Conditional Access policy",n,"Policy");return {msg:"Policy created ("+(d.state==="report"?"report-only":d.state)+")."};}
};
A.wizNewCA=function(){wizOpen("ca");};
A.caState=function(d){var p=S.caPolicies.filter(function(x){return x.id===d.id;})[0];
  if(d.s==="on"&&S.secDefaults){toast("Turn off security defaults first. They can't run together with Conditional Access.");return;}
  p.state=d.s;if(d.s==="report"){S.flags.caReport=true;}audit("Update Conditional Access policy",p.name,"Policy");toast("Policy is now "+(d.s==="report"?"report-only":d.s)+".");};
A.caDelete=function(d){S.caPolicies=S.caPolicies.filter(function(x){return x.id!==d.id;});audit("Delete Conditional Access policy","","Policy");toast("Policy deleted.");};

/* ----- logs ----- */
PAGES["entra.signins"]=function(){
  var rows=S.logs.filter(function(l){var u=U(l.uid);return matchQ((u?u.name:"")+l.app);}).map(function(l){var u=U(l.uid);return {cells:[lnk(l.when,"openSignin",l.id),'<span class="mono">'+esc(l.id)+'</span>',esc(u?u.name:"?"),esc(l.app),statusBadge(l.status),'<span class="mono">'+esc(l.ip)+'</span>',esc(l.place)+(l.odd?" "+badge("Unfamiliar","warn"):""),esc(l.ca)]};});
  return head([["Home","overview"],["Monitoring & health"]],"Sign-in logs","signinlogs","Look for unfamiliar locations and sign-ins where MFA was not required.")+bar([CB("download","Download","noop"),CB("refresh","Refresh","refresh"),CB("filter","Add filters","noop")])+search("Search by user or application")+
    tbl(["Date","Request ID","User","Application","Status","IP address","Location","Conditional Access"],rows);
};
A.openSignin=function(d){var l=S.logs.filter(function(x){return x.id===d.id;})[0];spotOddSignin(l);S.fly={k:"signin",id:d.id};};
FLY.signin=function(){var l=S.logs.filter(function(x){return x.id===S.fly.id;})[0],u=U(l.uid);
  return {title:"Activity details: Sign-ins",sub:esc(l.when),body:grid([["Request ID",'<span class="mono">'+esc(l.id)+'</span>'],["User",esc(u.name)],["Username",'<span class="mono">'+esc(upn(u))+'</span>'],["Application",esc(l.app)],["Status",esc(l.status)],["IP address",'<span class="mono">'+esc(l.ip)+'</span>'],["Location",esc(l.place)],["Authentication requirement"+info("mfa"),esc(l.mfa)],["Conditional Access"+info("ca"),esc(l.ca)]])+
    (l.odd?'<div class="msg warn">This sign-in came from a location this user doesn\'t normally use, with no MFA. Treat the account as compromised: reset the password, revoke sessions, and check methods and mail forwarding.</div>':'')};
};
PAGES["entra.audit"]=function(){
  var rows=S.audit.filter(function(a){return matchQ(a.act+a.tgt+a.cat);}).map(function(a){var u=U(a.tgt);return {cells:[esc(a.when),esc(a.svc),esc(a.cat),esc(a.act),esc(u?u.name:a.tgt||"-"),'<span class="mono">'+esc(a.by)+'</span>']};});
  return head([["Home","overview"],["Monitoring & health"]],"Audit logs","auditlogs","Every change made in this lab is recorded here.")+bar([CB("refresh","Refresh","refresh")])+search("Search by activity or target")+tbl(["Date","Service","Category","Activity","Target","Initiated by"],rows);
};
