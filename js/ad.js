"use strict";
/* =============== ACTIVE DIRECTORY (SIMULATED ON-PREMISES) =============== */
function adOuName(id){var o=OU(id);return o?o.name:id==="domain"?"practice.local":"Unknown";}
function adClock(min){var h=Math.floor(min/60)%24,m=min%60;return (h%12||12)+":"+(m<10?"0":"")+m+(h>=12?" PM":" AM");}
function adObject(id){
  return ADU(id)||ADC(id)||ADG(id);
}
function adTree(){
  return '<nav class="adtree" aria-label="Active Directory tree"><div class="adtree-title">Active Directory Users and Computers</div>'+
    '<button type="button" class="adnode root" data-a="adPickOu" data-id="domain">&#9662; practice.local</button>'+
    S.ad.ous.map(function(o){return '<button type="button" class="adnode child'+(S.ad.selectedOu===o.id?' on':'')+'" data-a="adPickOu" data-id="'+o.id+'">&#128193; '+esc(o.name)+(S.ad.syncScope.indexOf(o.id)>-1?' <span title="Included in sync">&#8635;</span>':'')+'</button>';}).join("")+
    '</nav>';
}
function adStatus(u){
  if(!u.enabled||adExpired(u)){return badge("Disabled","bad");}
  if(u.locked){return badge("Locked","warn");}
  return badge("Enabled","ok");
}
function adUserRows(ou){
  return S.ad.users.filter(function(u){return (ou==="domain"||u.ou===ou)&&matchQ(u.name+u.sam+u.department);}).map(function(u){
    return {id:u.id,cells:[lnk(u.name,"adSelect",u.id,' data-kind="user"'),"User",'<span class="mono">'+esc(u.sam)+'</span>',esc(u.department||"-"),adStatus(u),u.cloudId&&!U(u.cloudId).deleted?badge("Synced","ok"):badge("Not in Entra","warn")]};
  });
}
function adComputerRows(ou){
  return S.ad.computers.filter(function(c){return (ou==="domain"||c.ou===ou)&&matchQ(c.name);}).map(function(c){
    return {id:c.id,cells:[lnk(c.name,"adSelect",c.id,' data-kind="computer"'),"Computer","-",esc(adOuName(c.ou)),c.enabled?badge(c.trustOk===false?"Trust failed":"Enabled",c.trustOk===false?"bad":"ok"):badge("Disabled","bad"),c.deviceId&&D(c.deviceId)&&D(c.deviceId).azureAdJoined?badge("Hybrid joined","ok"):"-"]};
  });
}
function adGroupRows(ou){
  if(ou!=="domain"&&ou!=="ou-staff"){return [];}
  return S.ad.groups.filter(function(g){return matchQ(g.name);}).map(function(g){
    return {id:g.id,cells:[lnk(g.name,"adSelect",g.id,' data-kind="group"'),g.type+" group","-",g.members.length+" members",badge("Enabled","ok"),"-"]};
  });
}

PAGES["ad.aduc"]=function(){
  if(S.sel){var obj=adObject(S.sel);if(obj){return adDetails(obj);}}
  var ou=S.ad.selectedOu||"domain",rows=adUserRows(ou).concat(adGroupRows(ou)).concat(adComputerRows(ou)),c=checked1();
  return head([["practice.local"]],"Active Directory Users and Computers","activedirectory","Manage on-premises directory objects. Changes reach Entra only after synchronization.")+
    bar([CB("plus","New user","wizNewAdUser"),CB("key","Reset password","adResetPw",{d:{id:c},dis:!ADU(c)}),CB("lock","Unlock account","adUnlock",{d:{id:c},dis:!ADU(c)}),CB("edit","Properties","adOpenProps",{d:{id:c},dis:!ADU(c)}),CB("trash","Delete","adDelete",{d:{id:c},dis:!ADU(c)}),CB("refresh","Refresh","refresh")])+
    '<div class="admmc">'+adTree()+'<section class="addetails"><div class="adpath">practice.local / '+esc(adOuName(ou))+'</div>'+search("Find objects in this container")+
    tbl(["Name","Type","Logon name","Department / location","Status","Microsoft Entra"],rows,{check:true,empty:"This container is empty."})+'</section></div>';
};
A.adPickOu=function(d){S.ad.selectedOu=d.id;S.sel=null;S.checked=[];};
A.adSelect=function(d){S.sel=d.id;S.tab=d.kind==="user"?"general":"overview";S.checked=[];};
function adDetails(obj){
  if(ADU(obj.id)){return adUserDetails(obj);}
  if(ADG(obj.id)){return adGroupDetails(obj);}
  return adComputerDetails(obj);
}
function adUserDetails(u){
  var t=S.tab||"general",body="",cu=cloudForAd(u);
  if(t==="general"){body=grid([["Display name",esc(u.name)],["User logon name",'<span class="mono">'+esc(u.upn)+'</span>'],["Department",esc(u.department||"-")],["Organizational unit",esc(adOuName(u.ou))],["Microsoft Entra",cu&&!cu.deleted?"Synced as "+esc(upn(cu)):"Not present"]]);}
  else if(t==="account"){body=grid([["Account status",adStatus(u)],["User must change password at next logon",u.mustChange?"Yes":"No"],["Account expires"+info("expiration"),u.expires==null?"Never":"At simulated time "+adClock(u.expires)],["Source of authority"+info("authority"),"Windows Server AD"]])+
    '<div class="btnrow">'+B(u.enabled?"Disable account":"Enable account","adToggle",{d:{id:u.id}})+B("Unlock account","adUnlock",{d:{id:u.id},dis:!u.locked})+B("Reset password","adResetPw",{primary:1,d:{id:u.id}})+B("Set expiration","adExpire",{d:{id:u.id}})+'</div>';}
  else{var gs=S.ad.groups.filter(function(g){return g.members.indexOf(u.id)>-1;});body=bar([CB("plus","Add","adAddGroup",{d:{id:u.id}})])+tbl(["Group","Type",""],gs.map(function(g){return {cells:[esc(g.name),esc(g.type),B("Remove","adRemoveGroup",{sm:1,d:{id:u.id,g:g.id}})]};}),{empty:"Not a member of any AD group."});}
  return crumbs([["Active Directory","aduc"],[adOuName(u.ou)],[u.name]])+'<h1 class="ptitle">'+esc(u.name)+' Properties</h1>'+
    bar([CB("edit","Move","adMove",{d:{id:u.id}}),CB("trash","Delete","adDelete",{d:{id:u.id}}),CB("refresh","Refresh","refresh")])+
    tabs([["general","General"],["account","Account"],["member","Member Of"]],t,"tab")+body;
}
function adGroupDetails(g){
  var members=g.members.map(ADU).filter(Boolean);
  return crumbs([["Active Directory","aduc"],[g.name]])+'<h1 class="ptitle">'+esc(g.name)+'</h1>'+grid([["Group type",esc(g.type)+info("groupkind")],["Scope","Global"],["Members",members.length]])+
    bar([CB("plus","Add member","adAddGroupMember",{d:{g:g.id}})])+tbl(["Name","User logon name",""],members.map(function(u){return {cells:[esc(u.name),'<span class="mono">'+esc(u.sam)+'</span>',B("Remove","adRemoveGroup",{sm:1,d:{id:u.id,g:g.id}})]};}),{empty:"No members."});
}
function adComputerDetails(c){
  var d=c.deviceId?D(c.deviceId):null;
  return crumbs([["Active Directory","aduc"],[adOuName(c.ou)],[c.name]])+'<h1 class="ptitle">'+esc(c.name)+' Properties</h1>'+
    grid([["Organizational unit",esc(adOuName(c.ou))],["Account enabled",c.enabled?"Yes":"No"],["Secure channel"+info("securechannel"),c.trustOk===false?badge("Trust relationship failed","bad"):badge("Healthy","ok")],["Device state",d&&d.azureAdJoined?"Hybrid Azure AD joined":d&&d.domainJoined?"Domain joined":"Not joined"]])+
    '<div class="btnrow">'+B("Reset account","adResetComputer",{primary:1,d:{id:c.id}})+B("Move","adMove",{d:{id:c.id}})+'</div>';
}

WIZ.adUser={title:"New Object - User",crumbs:[["Active Directory","aduc"],["New user"]],init:{name:"",sam:"",department:"",ou:"ou-staff",pw:"Welcome#2026",mustChange:true},btn:"Finish",
  steps:[
    {n:"Name",h:function(){return fText("Full name","name")+fText("User logon name","sam",{hint:"UPN suffix: @"+DOMAIN})+fText("Department","department");},validate:function(d){return !(d.name||"").trim()||!(d.sam||"").trim()?"Enter a full name and user logon name.":"";}},
    {n:"Container",h:function(){return fSel("Organizational unit","ou",S.ad.ous.map(function(o){return [o.id,o.name];}),{i:"ou"});}},
    {n:"Password",h:function(){return fText("Initial password","pw",{hint:"Fake practice credential only."})+fChk("User must change password at next logon","mustChange");}},
    {n:"Review",h:function(){var d=S.wiz.d;return grid([["Name",esc(d.name)],["Logon",'<span class="mono">'+esc(d.sam+"@"+DOMAIN)+'</span>'],["OU",esc(adOuName(d.ou))],["Password change",d.mustChange?"Required":"Not required"]]);}}
  ],
  create:function(d){var r=createAdUser(d);if(r.error){return r;}return {msg:r.user.name+" created in Active Directory. Run a delta sync before looking in Entra."};}
};
A.wizNewAdUser=function(){wizOpen("adUser");};
A.adUnlock=function(d){var u=ADU(d.id);if(!u){return;}u.locked=false;audit("Unlock account",u.name,"UserManagement","Windows Server AD");toast(u.name+"'s account is unlocked.");};
A.adToggle=function(d){var u=ADU(d.id);u.enabled=!u.enabled;audit(u.enabled?"Enable account":"Disable account",u.name,"UserManagement","Windows Server AD");toast(u.name+(u.enabled?" is enabled.":" is disabled. Run a delta sync to block Entra sign-in."));};
A.adResetPw=function(d){var u=ADU(d.id);if(!u){return;}openModal("Reset password: "+u.name,mtext("New password","pw","Practice-only password")+'<div class="fld"><label class="chk"><input type="checkbox" name="must" value="1" checked> User must change password at next logon</label></div>',"Reset password",function(fd){if((fd.pw||"").length<8){return {error:"The password must contain at least 8 characters."};}resetAdPassword(u,fd.pw,!!fd.must);toast("Password reset in AD. Password hash sync normally runs about every 2 minutes.");return null;});};
A.adExpire=function(d){var u=ADU(d.id);openModal("Account expiration: "+u.name,msel("Account expires","exp",[["","Never"],["600","Today at 5:00 PM"],["720","Friday at 12:00 PM"]],u.expires==null?"":String(u.expires)),"Save",function(fd){u.expires=fd.exp?parseInt(fd.exp,10):null;audit("Set account expiration",u.name,"UserManagement","Windows Server AD");toast("Account expiration saved.");return null;});};
A.adMove=function(d){var obj=adObject(d.id);openModal("Move "+obj.name,msel("Destination OU","ou",S.ad.ous.map(function(o){return [o.id,o.name];}),obj.ou),"Move",function(fd){obj.ou=fd.ou;audit("Move directory object",obj.name,"UserManagement","Windows Server AD");toast(obj.name+" moved to "+adOuName(fd.ou)+".");return null;});};
A.adDelete=function(d){var u=ADU(d.id);if(!u){toast("Only user deletion is included in this lab.");return;}confirmBox("Delete "+u.name+"?","This removes the on-premises object. A later sync soft-deletes its Entra identity.","Delete",function(){S.ad.users=S.ad.users.filter(function(x){return x.id!==u.id;});S.ad.groups.forEach(function(g){g.members=g.members.filter(function(id){return id!==u.id;});});if(u.cloudId){var cu=U(u.cloudId);if(cu){cu.deleted=true;cu.blocked=true;cu.direct=false;}}S.sel=null;audit("Delete Active Directory user",u.name,"UserManagement","Windows Server AD");toast("AD user deleted.");});};
A.adAddGroup=function(d){var u=ADU(d.id);openModal("Add group membership",msel("Group","g",S.ad.groups.filter(function(g){return g.members.indexOf(u.id)<0;}).map(function(g){return [g.id,g.name+" ("+g.type+")"];})),"Add",function(fd){if(!fd.g){return {error:"Select a group."};}var group=ADG(fd.g);group.members.push(u.id);if(S.scenarios.active==="s5"&&group.type==="Distribution"){S.scenarios.wrong.s5=true;}audit("Add member to AD group",u.name,"GroupManagement","Windows Server AD");toast(group.type==="Distribution"?"Distribution groups deliver mail but do not grant file access.":"Membership changed in AD. Run a delta sync to update Entra.");return null;});};
A.adAddGroupMember=function(d){var g=ADG(d.g);openModal("Add member to "+g.name,msel("User","u",S.ad.users.filter(function(u){return g.members.indexOf(u.id)<0;}).map(function(u){return [u.id,u.name];})),"Add",function(fd){if(!fd.u){return {error:"Select a user."};}g.members.push(fd.u);toast("Member added. Run a delta sync to update Entra.");return null;});};
A.adRemoveGroup=function(d){var g=ADG(d.g);g.members=g.members.filter(function(id){return id!==d.id;});audit("Remove member from AD group",d.id,"GroupManagement","Windows Server AD");toast("Membership removed. Run a delta sync to update Entra.");};
A.adResetComputer=function(d){var c=ADC(d.id);resetComputerAccount(c);toast("Computer account reset. Rejoin or restart the PC to rebuild its secure channel.");};

/* Group Policy Management */
PAGES["ad.gpmc"]=function(){
  var rows=[];
  S.ad.gpos.forEach(function(g){(g.links||[]).forEach(function(l){rows.push({cells:[esc(g.name),esc(adOuName(l.target)),l.enabled?badge("Enabled","ok"):badge("Disabled","warn"),l.enforced?badge("Enforced","warn"):"No",esc(g.summary),B(l.enabled?"Disable link":"Enable link","adGpoToggle",{sm:1,d:{id:g.id,target:l.target}})+" "+B("Unlink","adGpoUnlink",{sm:1,danger:1,d:{id:g.id,target:l.target}})]});});});
  return head([["practice.local"]],"Group Policy Management","gpo","GPO links apply settings according to domain and OU placement.")+
    bar([CB("plus","Link an existing GPO","adGpoLink"),CB("refresh","Refresh","refresh")])+
    '<div class="admmc"><nav class="adtree" aria-label="Group Policy tree"><div class="adtree-title">Forest: practice.local</div><div class="adnode root">&#9662; Domains</div><div class="adnode child">&#9662; practice.local</div>'+S.ad.ous.map(function(o){return '<div class="adnode grand">&#128193; '+esc(o.name)+'</div>';}).join("")+'</nav><section class="addetails">'+
    '<div class="msg">The Default Domain Password Policy applies at the domain. Fine-grained password policies can target users or groups, but are outside this beginner lab.</div>'+
    tbl(["GPO","Linked location","Link status","Enforced","Settings summary",""],rows)+'</section></div>';
};
A.adGpoToggle=function(d){var g=S.ad.gpos.filter(function(x){return x.id===d.id;})[0],l=g.links.filter(function(x){return x.target===d.target;})[0];l.enabled=!l.enabled;audit("Change GPO link",g.name,"Policy","Windows Server AD");toast("GPO link "+(l.enabled?"enabled.":"disabled."));};
A.adGpoUnlink=function(d){var g=S.ad.gpos.filter(function(x){return x.id===d.id;})[0];g.links=g.links.filter(function(x){return x.target!==d.target;});audit("Unlink GPO",g.name,"Policy","Windows Server AD");toast("GPO unlinked. The GPO itself was not deleted.");};
A.adGpoLink=function(){openModal("Link an existing GPO",msel("GPO","g",S.ad.gpos.map(function(g){return [g.id,g.name];}))+msel("Location","ou",[["domain","practice.local"]].concat(S.ad.ous.map(function(o){return [o.id,o.name];}))),"Link",function(fd){var g=S.ad.gpos.filter(function(x){return x.id===fd.g;})[0];if(g.links.some(function(l){return l.target===fd.ou;})){return {error:"That GPO is already linked there."};}g.links.push({target:fd.ou,enabled:true,enforced:false});audit("Link GPO",g.name,"Policy","Windows Server AD");toast("GPO linked to "+adOuName(fd.ou)+".");return null;});};

/* Microsoft Entra Connect */
PAGES["ad.sync"]=function(){
  var rows=S.ad.ous.map(function(o){var on=S.ad.syncScope.indexOf(o.id)>-1;return {cells:[esc(o.name),on?badge("Included","ok"):badge("Excluded","warn"),B(on?"Exclude":"Include","adScope",{sm:1,d:{id:o.id}})]};});
  return head([["practice.local"]],"Microsoft Entra Connect Sync","connectsync","Directory changes are staged on-premises and then synchronized to Microsoft Entra ID.")+
    '<div class="cards"><div class="tile"><h3>Last directory sync</h3><div class="big smallbig">'+adClock(S.ad.lastDirSyncMin)+'</div><span>Default interval: '+S.ad.dirInterval+' minutes</span></div>'+
    '<div class="tile"><h3>Last password hash sync</h3><div class="big smallbig">'+adClock(S.ad.lastPasswordSyncMin)+'</div><span>Typical default: about '+S.ad.passwordInterval+' minutes</span></div>'+
    '<div class="tile"><h3>Simulated time</h3><div class="big smallbig">'+adClock(S.ad.nowMin)+'</div><span>Deterministic lab clock</span></div></div>'+
    '<div class="btnrow">'+B("Run delta sync","adSync",{primary:1,icon:"refresh"})+B("Advance 2 minutes","adAdvance",{d:{n:"2"}})+B("Advance 30 minutes","adAdvance",{d:{n:"30"}})+'</div>'+
    '<div class="msg">Directory synchronization defaults to every 30 minutes and password hash synchronization commonly runs about every 2 minutes. Administrators can change scheduling; these are teaching defaults.</div>'+
    '<h2 class="sec">Organizational unit filtering'+info("ou")+'</h2>'+tbl(["Organizational unit","Sync scope",""],rows);
};
A.adSync=function(){if(S.scenarios.active==="s8"&&!adInScope(ADU("adu5"))){S.scenarios.wrong.s8=true;}if(S.scenarios.active==="s2"&&!ADU("adu2").passwordChanged){S.scenarios.wrong.s2=true;}runDeltaSync();toast("Delta synchronization completed. Included users, groups, and computers are updated in Entra.");};
A.adAdvance=function(d){advanceAdTime(parseInt(d.n,10));toast("Simulated time advanced "+d.n+" minutes. Due synchronization cycles ran automatically.");};
A.adScope=function(d){var i=S.ad.syncScope.indexOf(d.id);if(i>-1){S.ad.syncScope.splice(i,1);}else{S.ad.syncScope.push(d.id);}audit("Change directory sync scope",adOuName(d.id),"Provisioning","Microsoft Entra Connect");};
