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

(function (root) {
  var api = root.Lab || (root.Lab = {});
  api.autopilotUnbox = autopilotUnbox; api.applyJoin = applyJoin; api.tryEnroll = tryEnroll;
  api.deviceJoinMsg = deviceJoinMsg; api.recompute = recompute; api.bitlockerStepDone = bitlockerStepDone;
  api.spotOddSignin = spotOddSignin; api.lagosStepDone = lagosStepDone; api.apAssigned = apAssigned;
})(typeof window !== "undefined" ? window : globalThis);
