"use strict";

var DOMAIN="practicetenant.onmicrosoft.com",KEY="adminPracticeLabV3",TENANT="7c1e4a52-9b3d-4f08-a1e6-5d2c8b90f3a7",STATE_VERSION=4;
var uid=100,navReset=false;function nid(p){uid+=1;return p+uid;}
function maxIdNum(id){var m=String(id==null?"":id).match(/(\d+)\s*$/);return m?parseInt(m[1],10):0;}
function syncUid(s){var max=100;function see(id){var n=maxIdNum(id);if(n>max){max=n;}}
  (s.users||[]).forEach(function(u){see(u.id);(u.methods||[]).forEach(function(m){see(m.id);});});
  ["groups","devices","policies","profiles","apProfiles","apps","caPolicies","mailRules","logs"].forEach(function(k){(s[k]||[]).forEach(function(item){if(item){see(item.id);}});});
  uid=max;}

/* ---------- state ---------- */
function seed(){
  var s={
    portal:"m365",page:"home",sel:null,tab:null,q:"",checked:[],fly:null,wiz:null,draft:null,guide:true,guideTab:"missions",tUser:"",
    onboarded:false,intro:0,lvlDone:[],finishSeen:false,
    secDefaults:false,deviceJoin:"all",vmIn:{},total:10,mdm:{scope:"none",group:""},
    version:STATE_VERSION,
    flags:{viewedLogs:false,spottedOdd:false,createdUsers:0,testedMfa:false,caReport:false,troubled:{},vmApSignin:false,vmDsreg:false,vmSync:false,vmAdmin:false,vmWorkSignin:false,vmRegistered:false},
    users:[
      {id:"u0",name:"Admin (you)",upn:"admin",loc:"US",direct:true,blocked:false,revoked:false,pwReset:false,fwd:null,deleted:false,filesLink:false,roles:["ga"],
        methods:[{id:"m0",type:"Microsoft Authenticator",detail:"Your phone",sus:false}]},
      {id:"u1",name:"Dana Rivera",upn:"dana.rivera",loc:"US",direct:true,blocked:false,revoked:false,pwReset:false,fwd:"collect.dana@mailbox-drop.example",deleted:false,filesLink:false,roles:[],
        methods:[{id:"m1",type:"Microsoft Authenticator",detail:"iPhone 14",sus:false},{id:"m2",type:"Phone (SMS)",detail:"+234 803 555 0142",sus:true}]},
      {id:"u2",name:"Sam Ortiz",upn:"sam.ortiz",loc:"US",direct:true,blocked:false,revoked:false,pwReset:false,fwd:null,deleted:false,filesLink:false,roles:[],
        methods:[{id:"m3",type:"Microsoft Authenticator",detail:"Pixel 8",sus:false}]},
      {id:"u3",name:"Priya Nair",upn:"priya.nair",loc:"",direct:false,blocked:false,revoked:false,pwReset:false,fwd:null,deleted:false,filesLink:false,roles:[],methods:[]},
      {id:"u4",name:"Marcus Lee",upn:"marcus.lee",loc:"US",direct:true,blocked:false,revoked:false,pwReset:false,fwd:null,deleted:false,filesLink:false,roles:["ga"],
        methods:[{id:"m4",type:"Microsoft Authenticator",detail:"Galaxy S23",sus:false}]}
    ],
    groups:[{id:"g1",name:"Finance",members:["u1","u2"],created:false},{id:"g2",name:"IT-Support",members:["u4"],created:false}],
    licenseGroups:[],
    devices:[
      {id:"d1",serial:"PF2A8841",name:"LAPTOP-SO-01",model:"Latitude 5430",maker:"Dell",os:"Windows 10 Pro",osVer:"10.0.19045",userId:"u2",state:"enrolled",baseBitlocker:true,autopilot:false,sync:"Today 07:58",join:"joined",joinUser:"u2"},
      {id:"d2",serial:"PF3K9Q21",name:"(not set up)",model:"Latitude 5440",maker:"Dell",os:"Windows 11 Pro",osVer:"10.0.22631",userId:null,state:"registered",baseBitlocker:false,autopilot:true,sync:"-",join:"",joinUser:null},
      {id:"d3",serial:"SP2026042",name:"DESKTOP-SP26042",model:"ThinkPad E14",maker:"Lenovo",os:"Windows 11 Pro",osVer:"10.0.22631",userId:null,state:"unmanaged",baseBitlocker:false,autopilot:false,spare:true,sync:"-",join:"",joinUser:null}
    ],
    policies:[],profiles:[],apProfiles:[],apps:[],caPolicies:[],mailRules:[],
    logs:[
      {id:"c3f1",uid:"u1",when:"Today 03:12",app:"Exchange Online",status:"Success",ip:"102.89.34.7",place:"Lagos, Nigeria",ca:"Not applied",mfa:"Single-factor authentication",odd:true},
      {id:"a812",uid:"u1",when:"Today 03:14",app:"SharePoint Online",status:"Success",ip:"102.89.34.7",place:"Lagos, Nigeria",ca:"Not applied",mfa:"Single-factor authentication",odd:true},
      {id:"9d07",uid:"u1",when:"Yesterday 09:02",app:"Outlook",status:"Success",ip:"68.174.22.9",place:"New York, United States",ca:"Not applied",mfa:"MFA satisfied (app notification)",odd:false},
      {id:"5be2",uid:"u2",when:"Today 08:47",app:"Outlook",status:"Success",ip:"68.174.22.31",place:"New York, United States",ca:"Not applied",mfa:"MFA satisfied (app notification)",odd:false},
      {id:"e440",uid:"u0",when:"Today 08:15",app:"Microsoft Admin Portals",status:"Success",ip:"73.12.90.4",place:"Brooklyn, United States",ca:"Not applied",mfa:"MFA satisfied (app notification)",odd:false}
    ],
    audit:[{when:"Earlier",svc:"Core Directory",cat:"UserManagement",act:"Add user",tgt:"u3",by:"admin@"+DOMAIN}]
  };
  s.users.forEach(function(u){u.pw="Welcome#2026";u.mustChange=false;});
  return s;
}
function blankFlags(){return {viewedLogs:false,spottedOdd:false,createdUsers:0,testedMfa:false,caReport:false,troubled:{},vmApSignin:false,vmDsreg:false,vmSync:false,vmAdmin:false,vmWorkSignin:false,vmRegistered:false};}
function load(){try{var r=localStorage.getItem(KEY);if(!r){return null;}var o=JSON.parse(r);if(!o||!o.users){return null;}
  o.flags=o.flags||{};var b=blankFlags(),k;for(k in b){if(o.flags[k]===undefined){o.flags[k]=b[k];}}if(!o.flags.troubled){o.flags.troubled={};}
  if(!o.groups){o.groups=[];}if(!o.devices){o.devices=[];}if(!o.licenseGroups){o.licenseGroups=[];}
  if(!o.policies){o.policies=[];}if(!o.profiles){o.profiles=[];}if(!o.apProfiles){o.apProfiles=[];}if(!o.apps){o.apps=[];}
  if(!o.caPolicies){o.caPolicies=[];}if(!o.mailRules){o.mailRules=[];}if(!o.logs){o.logs=[];}if(!o.audit){o.audit=[];}
  if(!o.mdm){o.mdm={scope:"none",group:""};}if(!o.deviceJoin){o.deviceJoin="all";}if(!o.total){o.total=10;}
  if(o.lvlDone===undefined){o.lvlDone=[];}if(o.intro===undefined){o.intro=0;}if(o.finishSeen===undefined){o.finishSeen=false;}
  o.version=STATE_VERSION;return o;}catch(e){return null;}}
function save(){try{S.version=STATE_VERSION;localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
var S=load()||seed();
syncUid(S);

/* ---------- data helpers ---------- */
function U(id){return S.users.filter(function(u){return u.id===id;})[0];}
function G(id){return S.groups.filter(function(g){return g.id===id;})[0];}
function D(id){return S.devices.filter(function(d){return d.id===id;})[0];}
function live(){return S.users.filter(function(u){return !u.deleted;});}
function upn(u){return u.upn+"@"+DOMAIN;}
function userGroups(id){return S.groups.filter(function(g){return g.members.indexOf(id)>-1;});}
function liveMembers(g){var out=[];(g.members||[]).forEach(function(id){var u=U(id);if(u&&!u.deleted){out.push(u);}});return out;}
function newSeatsForGroup(g){var n=0;liveMembers(g).forEach(function(u){if(u.loc&&!hasLicense(u)){n+=1;}});return n;}
function groupLicenseError(g){var n=newSeatsForGroup(g);if(n>available()){return "No licenses available. This group needs "+n+" more license"+(n===1?"":"s")+" and only "+Math.max(0,available())+" remain.";}return "";}
function memberLicenseError(u,g){if(!g||S.licenseGroups.indexOf(g.id)<0){return "";}if(!u||u.deleted||!u.loc||hasLicense(u)){return "";}if(available()<=0){return "No licenses available. "+g.name+" assigns Business Premium, so adding "+u.name+" would exceed the pool.";}return "";}
function viaGroup(u){return S.licenseGroups.some(function(gid){var g=G(gid);return g&&g.members.indexOf(u.id)>-1;});}
function hasLicense(u){return !u.deleted&&(!!u.direct||(viaGroup(u)&&!!u.loc));}
function licState(u){
  if(u.deleted){return {t:"Deleted",k:""};}
  if(u.direct){return {t:"Direct",k:"ok"};}
  if(viaGroup(u)&&u.loc){return {t:"Inherited from group",k:"ok"};}
  if(viaGroup(u)){return {t:"Error: usage location missing",k:"bad"};}
  return {t:"Unlicensed",k:""};
}
function licText(u){var s=licState(u);return (s.k==="ok")?"Microsoft 365 Business Premium":"Unlicensed";}
function assigned(){return S.users.filter(hasLicense).length;}
function available(){return S.total-assigned();}
function role(id){return ROLES.filter(function(r){return r.id===id;})[0];}
var ROLES=[
  {id:"ga",name:"Global Administrator",desc:"Can manage all aspects of Microsoft Entra ID and Microsoft services that use Entra identities."},
  {id:"ua",name:"User Administrator",desc:"Can manage all aspects of users and groups, including resetting passwords for limited admins."},
  {id:"la",name:"License Administrator",desc:"Can manage product licenses on users and groups."},
  {id:"ha",name:"Helpdesk Administrator",desc:"Can reset passwords for non-administrators and sign users out."},
  {id:"ea",name:"Exchange Administrator",desc:"Can manage all aspects of Exchange Online."},
  {id:"ia",name:"Intune Administrator",desc:"Can manage all aspects of Microsoft Intune."}
];
function audit(act,tgt,cat,svc){S.audit.unshift({when:"Just now",svc:svc||"Core Directory",cat:cat||"UserManagement",act:act,tgt:tgt||"",by:"admin@"+DOMAIN});if(S.audit.length>60){S.audit.pop();}}
function badge(t,k){return '<span class="badge '+(k||"")+'">'+esc(t)+'</span>';}
function randPw(){var a="abcdefghjkmnpqrstuvwxyz",b="ABCDEFGHJKLMNPQRSTUVWXYZ",d="23456789",o="",i;
  for(i=0;i<4;i++){o+=a[Math.floor(Math.random()*a.length)];}o+="-";
  for(i=0;i<4;i++){o+=b[Math.floor(Math.random()*b.length)];}
  return o+d[Math.floor(Math.random()*d.length)]+d[Math.floor(Math.random()*d.length)];}
var LOCS=[["","Select a location"],["US","United States"],["CA","Canada"],["GB","United Kingdom"]];
function locName(c){var f=LOCS.filter(function(l){return l[0]===c;})[0];return c?(f?f[1]:c):"Not set";}
function opts(list,sel){return list.map(function(l){return '<option value="'+esc(l[0])+'"'+(l[0]===sel?' selected':'')+'>'+esc(l[1])+'</option>';}).join("");}
function groupList(blank){return (blank?[["",blank]]:[]).concat(S.groups.map(function(g){return [g.id,g.name];}));}
function userList(blank,filterFn){return (blank?[["",blank]]:[]).concat(live().filter(filterFn||function(){return true;}).map(function(u){return [u.id,u.name];}));}
function ensureTroubled(){if(!S.flags.troubled){S.flags.troubled={};}}

function createUser(name,p,loc,lic){
  name=(name||"").trim();p=(p||"").trim().toLowerCase();
  if(!name){return {error:"Enter a display name."};}
  if(!/^[a-z0-9._-]+$/.test(p)){return {error:"The user principal name can only contain letters, numbers, dots, dashes and underscores."};}
  if(S.users.some(function(u){return u.upn===p;})){return {error:"Another object with the same value for property userPrincipalName already exists."};}
  if(lic&&!loc){return {error:"Select a usage location before assigning a license."};}
  if(lic&&available()<=0){return {error:"No licenses available. Free one up first."};}
  var u={id:nid("u"),name:name,upn:p,loc:loc||"",direct:!!lic,blocked:false,revoked:false,pwReset:false,fwd:null,deleted:false,filesLink:false,roles:[],methods:[],created:true};
  S.users.push(u);S.flags.createdUsers+=1;audit("Add user",u.id);
  u.pw=randPw();u.mustChange=true;return {user:u,pw:u.pw};
}

(function (root) {
  var api = root.Lab || (root.Lab = {});
  api.seed = seed; api.load = load; api.save = save; api.syncUid = syncUid; api.nid = nid;
  api.createUser = createUser; api.groupLicenseError = groupLicenseError; api.hasLicense = hasLicense;
  api.available = available; api.U = U; api.D = D; api.G = G; api.KEY = KEY; api.DOMAIN = DOMAIN;
  Object.defineProperty(api, "S", { configurable: true, get: function () { return S; }, set: function (v) { S = v; } });
})(typeof window !== "undefined" ? window : globalThis);
