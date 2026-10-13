"use strict";

/* ---------- assignment model ---------- */
function applies(item,userId){
  var a=item.assign||{all:"",groups:[]};
  if(a.all==="users"||a.all==="devices"){return true;}
  var gids=userGroups(userId).map(function(g){return g.id;});
  return a.groups.some(function(g){return gids.indexOf(g)>-1;});
}
function assignText(a){
  if(!a){return "Not assigned";}
  if(a.all==="users"){return "All users";}
  if(a.all==="devices"){return "All devices";}
  if(a.groups&&a.groups.length){return a.groups.map(function(g){return G(g)?G(g).name:"?";}).join(", ");}
  return "Not assigned";
}
function sameScope(a,b){
  var an=a.assign,bn=b.assign;
  if(!an||!bn){return false;}
  var aAll=an.all==="users"||an.all==="devices",bAll=bn.all==="users"||bn.all==="devices";
  if(aAll&&(bAll||bn.groups.length)){return true;}
  if(bAll&&an.groups.length){return true;}
  return an.groups.some(function(g){return bn.groups.indexOf(g)>-1;});
}
function verNum(v){return String(v).split(".").map(function(x){return parseInt(x,10)||0;});}
function verLt(a,b){var x=verNum(a),y=verNum(b);for(var i=0;i<Math.max(x.length,y.length);i++){var p=x[i]||0,q=y[i]||0;if(p<q){return true;}if(p>q){return false;}}return false;}
function inMdmScope(u){
  if(S.mdm.scope==="all"){return true;}
  if(S.mdm.scope==="some"&&S.mdm.group){var g=G(S.mdm.group);return !!g&&g.members.indexOf(u.id)>-1;}
  return false;
}
function recompute(){
  S.devices.forEach(function(d){
    if(d.state!=="enrolled"||!d.userId){d.compl=null;d.appsIn=[];d.cfgIn=[];return;}
    var u=U(d.userId);
    var bit=!!d.baseBitlocker||S.profiles.some(function(p){return p.type==="BitLocker"&&applies(p,d.userId);});
    d.bitlocker=bit;
    var rows=[];
    S.policies.filter(function(p){return applies(p,d.userId);}).forEach(function(p){
      var bad=[];
      if(p.bitlocker&&!bit){bad.push("BitLocker is not enabled");}
      if(p.minOS&&verLt(d.osVer,p.minOS)){bad.push("OS version "+d.osVer+" is below "+p.minOS);}
      rows.push({policy:p.name,state:bad.length?"Not compliant":"Compliant",reason:bad.join("; "),reqBit:!!p.bitlocker});
    });
    var noncomp=rows.some(function(r){return r.state!=="Compliant";});
    d.compl={state:noncomp?"Not compliant":"Compliant",rows:rows,none:!rows.length};
    d.appsIn=S.apps.filter(function(a){return a.intent==="required"&&applies(a,d.userId);}).map(function(a){return a.name;});
    d.cfgIn=S.profiles.filter(function(p){return applies(p,d.userId);}).map(function(p){return p.name;});
    void u;
  });
}

function apAssigned(){return S.apProfiles.some(function(p){return p.assign.all==="devices";});}

function compNameFor(d){return "DESKTOP-"+String(d.serial).replace(/[^A-Z0-9]/g,"").slice(-7);}
function nameDevice(d){if(d.name==="(not set up)"){d.name=compNameFor(d);}}

function deviceJoinMsg(){return "Something went wrong. Your organization doesn't allow users to join devices to Microsoft Entra ID (error 801c0003). Ask an administrator to allow it in Entra > Devices > Device settings, then try again.";}
function autopilotUnbox(dev,u){
  if(!dev||!u){return {error:"Select a user."};}
  if(dev.state==="enrolled"){return {error:"This device is already enrolled."};}
  if(S.deviceJoin==="none"){return {error:deviceJoinMsg()};}
  if(!apAssigned()){return {error:"No Autopilot deployment profile is assigned to this device, so setup falls back to standard Windows setup instead of zero-touch. Create a profile and assign it to All devices."};}
  if(u.blocked){return {error:"Sign-in failed: "+u.name+"'s account is disabled."};}
  var r=tryEnroll(dev,u);
  if(!r.ok){dev.state=dev.autopilot?"registered":"unmanaged";dev.mdmWhy=r.why;return {error:r.why};}
  dev.join="joined";dev.joinUser=u.id;
  return {ok:true};
}
function tryEnroll(d,u){
  if(u.blocked){return {ok:false,why:"The account is disabled."};}
  if(!inMdmScope(u)){return {ok:false,why:"MDM user scope doesn't include "+u.name+", so the laptop joined Entra ID but did not enroll in Intune. Fix: Entra admin center > Devices > Mobility (MDM and MAM)."};}
  if(!hasLicense(u)){return {ok:false,why:"Enrollment failed (error 80180018): "+u.name+" has no license that includes Intune. Fix: assign Business Premium in the Microsoft 365 admin center."};}
  nameDevice(d);
  d.state="enrolled";d.userId=u.id;d.sync="Just now";d.mdmWhy="";
  if(d.autopilot&&apAssigned()){d.name="LAPTOP-"+u.name.split(" ").map(function(x){return x[0];}).join("")+"-"+d.serial.slice(-2);}
  audit("Enroll device in Intune",d.name,"Device","Intune");
  return {ok:true};
}
function applyJoin(d,u,mode){
  if(mode!=="register"&&S.deviceJoin==="none"){return {ok:false,why:deviceJoinMsg()};}
  nameDevice(d);
  d.join=mode==="register"?"registered":"joined";d.joinUser=u.id;
  audit(mode==="register"?"Register device":"Add device",d.name,"Device","Core Directory");
  if(mode==="register"){S.flags.vmRegistered=true;d.mdmWhy="";return {ok:true};}
  var r=tryEnroll(d,u);
  if(!r.ok){d.state="unmanaged";d.mdmWhy=r.why;}
  if(d.vm&&d.vm.work.indexOf(u.id)<0){d.vm.work.push(u.id);}
  return r;
}

function spotOddSignin(log){if(log&&log.odd){S.flags.spottedOdd=true;}}
function lagosStepDone(){return !!S.flags.spottedOdd;}

function bitlockerStepDone(){recompute();return S.devices.some(function(d){return d.state==="enrolled"&&d.compl&&d.compl.rows.some(function(r){return r.reqBit&&r.state==="Compliant";});});}

/* ---------- Windows Server AD and hybrid identity ---------- */
function adInScope(obj){return !!(obj&&S.ad.syncScope.indexOf(obj.ou)>-1);}
function adExpired(u){return !!(u&&u.expires!=null&&S.ad.nowMin>=u.expires);}
function cloudForAd(au){return au&&au.cloudId?U(au.cloudId):null;}
function ensureCloudGroup(ag){
  var g=S.groups.filter(function(x){return x.adId===ag.id;})[0];
  if(!g){g=S.groups.filter(function(x){return x.name===ag.name;})[0];}
  if(!g){g={id:nid("g"),name:ag.name,members:[],created:false};S.groups.push(g);}
  g.adId=ag.id;g.source="ad";g.type=ag.type;return g;
}
function syncAdUser(au){
  var cu=cloudForAd(au);
  if(!cu){cu=S.users.filter(function(u){return upn(u).toLowerCase()===au.upn.toLowerCase();})[0]||null;if(cu){au.cloudId=cu.id;}}
  if(!adInScope(au)){
    if(cu){cu.deleted=true;cu.blocked=true;cu.direct=false;cu.syncRemoved=true;}
    return null;
  }
  if(!cu){
    cu={id:nid("u"),name:au.name,upn:au.upn,loc:"",direct:false,blocked:false,revoked:false,pwReset:false,fwd:null,deleted:false,filesLink:false,roles:[],methods:[],source:"ad",adId:au.id,department:au.department||"",created:true,pw:au.pw,mustChange:au.mustChange};
    S.users.push(cu);au.cloudId=cu.id;
  }
  cu.name=au.name;cu.upn=au.upn;cu.department=au.department||"";cu.source="ad";cu.adId=au.id;
  cu.deleted=false;cu.syncRemoved=false;cu.blocked=!au.enabled||adExpired(au);cu.mustChange=!!au.mustChange;
  return cu;
}
function runPasswordSync(){
  S.ad.users.forEach(function(au){var cu=cloudForAd(au);if(cu&&adInScope(au)){cu.pw=au.pw;cu.mustChange=!!au.mustChange;}});
  S.ad.lastPasswordSyncMin=S.ad.nowMin;
}
function runDeltaSync(){
  S.ad.users.forEach(syncAdUser);
  S.ad.groups.forEach(function(ag){
    var cg=ensureCloudGroup(ag),keep=(cg.members||[]).filter(function(id){var u=U(id);return u&&!syncedUser(u);});
    ag.members.forEach(function(aid){var au=ADU(aid),cu=cloudForAd(au);if(cu&&!cu.deleted&&keep.indexOf(cu.id)<0){keep.push(cu.id);}});
    cg.members=keep;
  });
  S.ad.computers.forEach(function(ac){
    var d=D(ac.deviceId);
    if(d&&d.domainJoined&&adInScope(ac)&&ac.enabled){
      d.azureAdJoined=true;d.join="hybrid";d.secureChannel=ac.trustOk!==false;
      audit("Register hybrid joined device",d.name,"Device","Microsoft Entra Connect");
    }
  });
  runPasswordSync();
  S.ad.lastDirSyncMin=S.ad.nowMin;
  audit("Run delta synchronization",AD_DOMAIN,"Provisioning","Microsoft Entra Connect");
  return {ok:true};
}
function advanceAdTime(minutes){
  S.ad.nowMin+=minutes;
  if(S.ad.nowMin-S.ad.lastPasswordSyncMin>=S.ad.passwordInterval){runPasswordSync();}
  if(S.ad.nowMin-S.ad.lastDirSyncMin>=S.ad.dirInterval){runDeltaSync();}
  if(S.scenarios&&S.scenarios.active==="s1"&&!S.scenarios.phoneUpdated&&ADU("adu1").passwordChanged){ADU("adu1").locked=true;S.scenarios.wrong.s1=true;}
}
function createAdUser(data){
  var sam=(data.sam||"").trim().toLowerCase(),name=(data.name||"").trim();
  if(!name||!sam){return {error:"Enter a display name and user logon name."};}
  if(!/^[a-z0-9._-]+$/.test(sam)){return {error:"The user logon name contains unsupported characters."};}
  if(S.ad.users.some(function(u){return u.sam===sam;})){return {error:"That user logon name already exists in practice.local."};}
  var u={id:nid("adu"),cloudId:null,name:name,sam:sam,upn:sam+"@"+DOMAIN,department:(data.department||"").trim(),ou:data.ou||"ou-staff",enabled:true,locked:false,mustChange:data.mustChange!==false,pw:data.pw||"Welcome#2026",expires:data.expires===""||data.expires==null?null:parseInt(data.expires,10),passwordChanged:false,created:true};
  S.ad.users.push(u);audit("Create Active Directory user",u.name,"UserManagement","Windows Server AD");return {user:u};
}
function resetAdPassword(au,pw,mustChange){
  if(!au){return {error:"AD user not found."};}
  au.pw=pw||randPw();au.mustChange=mustChange!==false;au.passwordChanged=true;au.locked=false;
  audit("Reset AD password",au.name,"UserManagement","Windows Server AD");return {pw:au.pw};
}
function domainJoin(d,domain,user,pw){
  if(!d){return {ok:false,why:"The computer could not be found."};}
  if(String(domain||"").toLowerCase()!==AD_DOMAIN){return {ok:false,why:"The specified domain either does not exist or could not be contacted."};}
  if(String(user||"").toLowerCase()!==S.ad.adminUser.toLowerCase()||pw!==S.ad.adminPw){return {ok:false,why:"The user name or password is incorrect, or the account does not have permission to join this domain."};}
  nameDevice(d);d.domainJoined=true;d.azureAdJoined=false;d.join="domain";d.secureChannel=true;
  var ac=S.ad.computers.filter(function(c){return c.deviceId===d.id;})[0];
  if(!ac){ac={id:nid("adc"),deviceId:d.id,name:d.name,ou:"ou-computers",enabled:true,trustOk:true};S.ad.computers.push(ac);}
  else{ac.name=d.name;ac.enabled=true;ac.trustOk=true;}
  audit("Join computer to domain",d.name,"Device","Windows Server AD");return {ok:true};
}
function resetComputerAccount(ac){
  if(!ac){return false;}ac.trustOk=true;var d=D(ac.deviceId);if(d){d.secureChannel=true;}
  audit("Reset computer account",ac.name,"Device","Windows Server AD");return true;
}
function appliedGpos(d,u){
  var ac=S.ad.computers.filter(function(c){return c.deviceId===d.id;})[0],au=u&&u.adId?ADU(u.adId):null,out=[];
  S.ad.gpos.forEach(function(g){if((g.links||[]).some(function(l){return l.enabled&&(l.target==="domain"||(ac&&l.target===ac.ou)||(au&&l.target===au.ou));})){out.push(g.name);}});
  return out;
}
function applyGroupPolicy(d,u){
  if(!d.domainJoined){return {ok:false,why:"The computer is not joined to a domain."};}
  if(d.secureChannel===false){return {ok:false,why:"The trust relationship between this workstation and the primary domain failed."};}
  d.appliedGpos=appliedGpos(d,u);d.gpUpdated=true;
  d.driveMapped=d.appliedGpos.indexOf("Map Finance Network Drive")>-1&&!!u&&userGroups(u.id).some(function(g){return g.name==="Finance"&&g.type!=="Distribution";});
  d.wallpaperApplied=d.appliedGpos.indexOf("Desktop Wallpaper")>-1;return {ok:true,gpos:d.appliedGpos};
}

(function (root) {
  var api = root.Lab || (root.Lab = {});
  api.autopilotUnbox = autopilotUnbox; api.applyJoin = applyJoin; api.tryEnroll = tryEnroll;
  api.deviceJoinMsg = deviceJoinMsg; api.recompute = recompute; api.bitlockerStepDone = bitlockerStepDone;
  api.spotOddSignin = spotOddSignin; api.lagosStepDone = lagosStepDone; api.apAssigned = apAssigned;
  api.adInScope = adInScope; api.runDeltaSync = runDeltaSync; api.runPasswordSync = runPasswordSync;
  api.advanceAdTime = advanceAdTime; api.createAdUser = createAdUser; api.resetAdPassword = resetAdPassword;
  api.domainJoin = domainJoin; api.resetComputerAccount = resetComputerAccount; api.applyGroupPolicy = applyGroupPolicy;
})(typeof window !== "undefined" ? window : globalThis);
