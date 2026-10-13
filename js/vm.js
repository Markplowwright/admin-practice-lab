"use strict";
/* =============== WINDOWS LAPTOP (virtual machine) =============== */
var LOCAL_ADMIN_PW="Practice#2026",STUDENT_PW="Student#2026";
function freshVm(d){
  var cmd=["Microsoft Windows [Version "+d.osVer+"]","(c) Practice Lab. Type help for commands.",""];
  var ps=["Windows PowerShell","Copyright (C) Microsoft Corporation. All rights reserved.","","Try the new cross-platform PowerShell https://aka.ms/pscore6",""];
  var v={stage:"oobe",oobe:"region",locals:[],cur:null,app:null,start:false,setPage:"about",set2:"work",dlg:null,cmd:cmd,ps:ps,termShell:"cmd",cmdGuide:false,work:[],userApps:[],ssid:"",msg:"",pick:"",explorerPath:"Home",showHidden:false,showExt:false,files:[
    {id:"f1",loc:"Desktop",name:"IT Support Notes",ext:".txt",type:"Text Document",size:"2 KB",hidden:false},
    {id:"f2",loc:"Documents",name:"Onboarding Checklist",ext:".docx",type:"Microsoft Word Document",size:"24 KB",hidden:false},
    {id:"f3",loc:"Downloads",name:"CompanyPortalInstaller",ext:".msi",type:"Windows Installer Package",size:"38.4 MB",hidden:false},
    {id:"f4",loc:"C:\\",name:"Windows",ext:"",type:"File folder",size:"",hidden:false,readonly:true},
    {id:"f5",loc:"C:\\",name:"Users",ext:"",type:"File folder",size:"",hidden:false,readonly:true},
    {id:"f6",loc:"C:\\",name:"Program Files",ext:"",type:"File folder",size:"",hidden:false,readonly:true},
    {id:"f7",loc:"C:\\",name:"ProgramData",ext:"",type:"File folder",size:"",hidden:true,readonly:true}
  ]};
  if(d.spare){v.stage="lock";v.oobe="done";v.locals=[{name:"LocalAdmin",pw:LOCAL_ADMIN_PW,admin:true},{name:"Student",pw:STUDENT_PW,admin:false}];v.ssid="Practice-Corp";}
  return v;
}
function ensureVm(d){
  if(!d.vm){d.vm=freshVm(d);}
  var v=d.vm;
  if(!v.cmd){v.cmd=["Microsoft Windows [Version "+d.osVer+"]","(c) Practice Lab. Type help for commands.",""];}
  if(!v.ps){v.ps=["Windows PowerShell","Copyright (C) Microsoft Corporation. All rights reserved.",""];}
  if(!v.termShell){v.termShell="cmd";}
  if(!v.files){v.files=freshVm(d).files;}
  ["Windows","Users","Program Files"].forEach(function(name){
    if(!v.files.some(function(f){return f.loc==="C:\\"&&f.name===name;})){
      v.files.push({id:nid("vf"),loc:"C:\\",name:name,ext:"",type:"File folder",size:"",hidden:false,readonly:true});
    }
  });
  if(!v.explorerPath){v.explorerPath="Home";}
  if(v.showHidden===undefined){v.showHidden=false;}
  if(v.showExt===undefined){v.showExt=false;}
  if(v.cmdGuide===undefined){v.cmdGuide=false;}
  return v;
}
function curDev(){return D(S.page);}
function vmDevices(){return S.devices.filter(function(d){return d.autopilot||d.vm||d.spare;});}
function ipFor(d){var n=0,i;for(i=0;i<d.serial.length;i++){n+=d.serial.charCodeAt(i);}return "192.168.20."+(20+n%200);}
function guidFor(d){var h="",i,s=d.serial+"4f1e";for(i=0;i<32;i++){h+="0123456789abcdef"[(s.charCodeAt(i%s.length)*(i+7))%16];}return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20,32);}
function mfaNeeded(){return S.secDefaults||S.caPolicies.some(function(p){return p.state==="on";});}
function caOnAny(){return S.caPolicies.some(function(p){return p.state==="on";});}
function findUser(s){s=(s||"").trim().toLowerCase();if(!s){return null;}var parts=s.split("@"),p=parts[0];return live().filter(function(u){return u.upn===p&&(parts.length<2||parts[1]===DOMAIN);})[0]||null;}
function vmLog(u,app,status,mfa,ca){S.logs.unshift({id:nid("l"),uid:u.id,when:"Just now",app:app,status:status,ip:"73.12.90.4",place:"Brooklyn, United States",ca:ca||"Not applied",mfa:mfa,odd:false});}
function sessName(d){var v=d.vm;if(!v.cur){return "";}if(v.cur.kind==="local"){return v.cur.name;}var u=U(v.cur.uid);return u?u.name:"";}
function isAdminSess(d){var v=d.vm;if(!v.cur){return false;}if(v.cur.kind==="work"){return v.cur.uid===d.joinUser;}var l=v.locals.filter(function(x){return x.name===v.cur.name;})[0];return !!l&&l.admin;}
function enrolledOk(d){return d.state==="enrolled";}

function resetDevice(d){
  d.vm=null;d.join="";d.joinUser=null;d.userId=null;d.mdmWhy="";d.sync="-";
  d.domainJoined=false;d.azureAdJoined=false;d.secureChannel=true;d.appliedGpos=[];d.gpUpdated=false;d.driveMapped=false;d.wallpaperApplied=false;
  d.state=d.autopilot?"registered":"unmanaged";
  d.name=d.spare?"DESKTOP-SP26042":"(not set up)";
  S.vmIn={};ensureVm(d);
}

/* ----- small UI helpers ----- */
function wb(label,a,o){o=o||{};var dd="",k;if(o.d){for(k in o.d){dd+=' data-'+k+'="'+esc(o.d[k])+'"';}}return '<button type="button" class="wbtn'+(o.pri?' pri':'')+'" data-a="'+a+'"'+dd+(o.dis?' disabled':'')+'>'+esc(label)+'</button>';}
function winChrome(title){return '<div class="tb"><span>'+esc(title)+'</span><span class="wcap"><button type="button" class="wmin" tabindex="-1" aria-hidden="true">&#8211;</button><button type="button" class="wmax" tabindex="-1" aria-hidden="true">&#9634;</button><button type="button" class="wx" data-a="vmClose" aria-label="Close">&#10005;</button></span></div>';}
function vi(key,label,type,ph,enter){return '<label class="wl">'+esc(label)+'<input class="wi" type="'+(type||"text")+'" data-vi="'+key+'"'+(enter?' data-enter="'+enter+'"':'')+' autocomplete="off" value="'+esc(S.vmIn[key]||"")+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+'></label>';}
function oobeCard(title,body,btns){return '<div class="oobe"><div class="ocard"><h2>'+esc(title)+'</h2>'+body+'<div class="wbtns">'+(btns||[]).join("")+'</div></div></div>';}

/* ----- work account sign-in dialog (used by Settings, OOBE, Autopilot, lock screen) ----- */
function dlgInner(d){
  var g=d.vm.dlg,u=g.uid?U(g.uid):null,err=g.err?'<div class="wmsg bad" role="alert">'+esc(g.err)+'</div>':"",h="";
  var cancel=wb("Cancel","vmDlgClose");
  if(g.step==="email"){
    var ttl=g.mode==="register"?"Set up a work or school account":g.mode==="ap"?"Welcome to Practice Tenant":"Sign in";
    var sub=g.mode==="register"?"You'll get access to resources like email, apps, and the network. Connecting means your work or school might control some things on this device, such as which settings you can change.":g.mode==="ap"?"This device was set up by your organization. Sign in with your work account to continue.":"Use your work or school account.";
    h='<h3>'+ttl+'</h3><p>'+sub+'</p>'+vi("email","Email address","text","someone@"+DOMAIN,"vmDlgNext")+err+
      '<div class="wbtns">'+wb("Next","vmDlgNext",{pri:1})+(g.mode==="ap"||g.mode==="oobejoin"?"":cancel)+'</div>'+
      (g.mode==="register"?'<div class="walt">Alternate actions:<br><button type="button" class="wlnk" data-a="vmJoinLink">Join this device to Microsoft Entra ID</button></div>':'');
  }else if(g.step==="pw"){
    h='<h3>Enter password</h3><p class="mono">'+esc(upn(u))+'</p>'+vi("pw","Password","password","Password","vmDlgNext")+err+'<div class="wbtns">'+wb("Sign in","vmDlgNext",{pri:1})+cancel+'</div>';
  }else if(g.step==="change"){
    h='<h3>Update your password</h3><p>You need to update your password because this is the first time you are signing in, or because your password was reset.</p>'+vi("np","New password","password","At least 8 characters")+vi("np2","Confirm password","password","","vmDlgNext")+err+'<div class="wbtns">'+wb("Sign in","vmDlgNext",{pri:1})+cancel+'</div>';
  }else if(g.step==="mfa"){
    h='<h3>Approve sign in request</h3><p>We sent a notification to your Microsoft Authenticator app. Open it and approve the request.</p><p class="wnum">47</p>'+err+'<div class="wbtns">'+wb("Approve on my phone (simulated)","vmDlgNext",{pri:1})+cancel+'</div>';
  }else if(g.step==="reg"){
    h='<h3>More information required</h3><p>Your organization needs more information to keep your account secure. Multifactor authentication is required, and you have no method registered yet.</p>'+err+'<div class="wbtns">'+wb("Next: set up Authenticator (simulated)","vmDlgNext",{pri:1})+cancel+'</div>';
  }else if(g.step==="confirm"){
    h='<h3>Make sure this is your organization</h3><p>If you continue, system policies might be turned on or other changes might be made to this device. Make sure this is your organization before you continue.</p>'+
      '<dl class="wdl"><dt>Organization</dt><dd>Practice Tenant</dd><dt>User name</dt><dd>'+esc(upn(u))+'</dd><dt>User type</dt><dd>'+(g.mode==="join"?"Administrator":"Standard")+'</dd></dl>'+err+
      '<div class="wbtns">'+wb(g.mode==="join"?"Join":"Connect","vmDlgNext",{pri:1})+cancel+'</div>';
  }else if(g.step==="done"){
    h='<h3>You\'re all set!</h3><p>This device is now '+(g.mode==="join"?"joined to":"registered with")+' Practice Tenant.</p>'+
      (g.mode==="join"?(d.state==="enrolled"?'<div class="wmsg ok">Device management started. This laptop now appears in Intune.</div>':'<div class="wmsg bad">The laptop joined Entra ID but is not managed by Intune. '+esc(d.mdmWhy)+'</div>'):'<div class="wmsg">A registered device gets access to work apps but is not fully managed.</div>')+
      (g.mode==="join"?'<p>Sign out and sign back in with your work account to finish.</p>':'')+'<div class="wbtns">'+wb("Done","vmDlgClose",{pri:1})+'</div>';
  }else if(g.step==="err"){
    h='<h3>Something went wrong</h3>'+err+'<div class="wbtns">'+wb("Try again","vmDlgRetry",{pri:1})+cancel+'</div>';
  }
  return '<div class="mssign">'+h+'</div>';
}
A.vmDlgOpen=function(ds){var d=curDev(),v=ensureVm(d);S.vmIn={};v.dlg={mode:ds.mode,step:"email",uid:null,err:""};};
A.vmJoinLink=function(){var d=curDev(),v=d.vm;if(d.join==="joined"){v.dlg=null;v.msg="This device is already joined to Microsoft Entra ID.";return;}v.dlg.mode="join";S.vmIn={};};
A.vmDlgClose=function(){var d=curDev(),v=d.vm;v.dlg=null;S.vmIn={};if(v.stage==="oobe"&&v.oobe==="apsignin"){v.dlg={mode:"ap",step:"email",uid:null,err:""};}};
A.vmDlgRetry=function(){var d=curDev(),g=d.vm.dlg;g.err="";g.step=g.uid?"confirm":"email";if(g.mode==="lock"||g.mode==="ap"||g.mode==="oobejoin"){g.step="email";g.uid=null;}S.vmIn={};};
function dlgProceed(d,g,u){
  if(g.mode==="register"||g.mode==="join"){g.step="confirm";return;}
  dlgFinish(d,g,u);
}
function dlgAfterPw(d,g,u){
  if(mfaNeeded()){g.step=u.methods.some(function(m){return !m.sus;})?"mfa":"reg";return;}
  dlgProceed(d,g,u);
}
function dlgFinish(d,g,u){
  var v=d.vm,mfa=mfaNeeded()?"MFA satisfied (app notification)":"Single-factor authentication",ca=mfaNeeded()?(caOnAny()?"Success":"Security defaults"):"Not applied";
  if(g.mode==="lock"){
    if(d.join!=="joined"&&!d.domainJoined){g.step="err";g.err="We can't sign you in with this account because this device isn't joined to Microsoft Entra ID or practice.local.";return;}
    if(d.domainJoined&&d.secureChannel===false){g.step="err";g.err="The trust relationship between this workstation and the primary domain failed.";return;}
    vmLog(u,"Windows Sign In","Success",mfa,ca);
    if(d.domainJoined){d.joinUser=u.id;if(!d.userId){d.userId=u.id;}}
    v.cur={kind:"work",uid:u.id};if(v.work.indexOf(u.id)<0){v.work.push(u.id);}v.stage="desktop";v.dlg=null;v.app=null;v.start=false;S.flags.vmWorkSignin=true;S.vmIn={};return;
  }
  if(g.mode!=="register"&&S.deviceJoin==="none"){
    g.step="err";g.err=deviceJoinMsg();
    vmLog(u,"Windows Sign In","Failure",mfa,ca);return;
  }
  vmLog(u,g.mode==="register"?"Microsoft Authentication Broker":"Windows Sign In","Success",mfa,ca);
  if(g.mode==="register"){applyJoin(d,u,"register");g.step="done";return;}
  var r=applyJoin(d,u,"join");
  if(g.mode==="join"){g.step="done";return;}
  v.cur={kind:"work",uid:u.id};S.flags.vmWorkSignin=true;S.vmIn={};
  if(g.mode==="oobejoin"){v.stage="desktop";v.dlg=null;toast(r.ok?"Welcome. This laptop is joined and managed.":"Welcome. The laptop joined Entra but is not managed by Intune yet.");return;}
  if(g.mode==="ap"){v.dlg=null;v.oobe=r.ok?"espok":"espfail";}
}
A.vmDlgNext=function(){
  var d=curDev(),v=d.vm,g=v.dlg,u;
  if(!g){return;}
  g.err="";
  if(g.step==="email"){
    u=findUser(S.vmIn.email);
    if(!u){g.err="We couldn't find an account with that username. Use the full work email, for example priya.nair@"+DOMAIN+".";return;}
    g.uid=u.id;g.step="pw";S.vmIn.pw="";return;
  }
  u=U(g.uid);
  if(g.step==="pw"){
    if(S.vmIn.pw!==u.pw){g.err="Your account or password is incorrect. Check the practice credentials on the right.";vmLog(u,"Windows Sign In","Failure","Single-factor authentication");return;}
    if(u.blocked){g.err="Your account has been disabled (error 50057). Contact your administrator.";vmLog(u,"Windows Sign In","Failure","Single-factor authentication");return;}
    if(u.mustChange){g.step="change";S.vmIn.np="";S.vmIn.np2="";return;}
    dlgAfterPw(d,g,u);return;
  }
  if(g.step==="change"){
    if((S.vmIn.np||"").length<8){g.err="Your new password must be at least 8 characters.";return;}
    if(S.vmIn.np!==S.vmIn.np2){g.err="The passwords don't match.";return;}
    u.pw=S.vmIn.np;u.mustChange=false;audit("Change password (self-service)",u.id);dlgAfterPw(d,g,u);return;
  }
  if(g.step==="reg"){u.methods.push({id:nid("m"),type:"Microsoft Authenticator",detail:"Lab phone",sus:false});audit("User registered security info",u.id);dlgProceed(d,g,u);return;}
  if(g.step==="mfa"){dlgProceed(d,g,u);return;}
  if(g.step==="confirm"){dlgFinish(d,g,u);return;}
};

/* ----- OOBE ----- */
function ssidList(){return [["Practice-Corp","Practice-Corp","Secured, staff network"],["Practice-Guest","Practice-Guest","Secured, guest network"]];}
function oobeHtml(d){
  var v=d.vm,s=v.oobe,h="";
  if(s==="region"){h=oobeCard("Is this the right country or region?",'<div class="olist"><div class="oi sel">United States</div><div class="oi">Canada</div><div class="oi">United Kingdom</div></div>',[wb("Yes","vmOobeNext",{pri:1})]);}
  else if(s==="keyboard"){h=oobeCard("Is this the right keyboard layout?",'<div class="olist"><div class="oi sel">US</div><div class="oi">Canadian French</div></div>',[wb("Yes","vmOobeNext",{pri:1})]);}
  else if(s==="network"){h=oobeCard("Let's connect you to a network",'<div class="olist">'+ssidList().map(function(n){return '<button type="button" class="oi'+(v.ssid===n[0]?' sel':'')+'" data-a="vmSsid" data-s="'+n[0]+'">'+esc(n[1])+'<small>'+esc(n[2])+(v.ssid===n[0]?" - connected, "+ipFor(d):"")+'</small></button>';}).join("")+'</div>',[wb("Next","vmOobeNext",{pri:1,dis:!v.ssid})]);}
  else if(s==="apsignin"){h='<div class="oobe"><div class="ocard wide"><div class="obadge">Autopilot: this laptop was recognized by its serial number ('+esc(d.serial)+')</div>'+(v.dlg?dlgInner(d):"")+'</div></div>';}
  else if(s==="espok"){h=oobeCard("Your device is ready",'<ul class="esp"><li class="ok">Device preparation</li><li class="ok">Device setup</li><li class="ok">Account setup</li></ul><p>'+esc(d.name)+' is joined to Microsoft Entra ID and enrolled in Intune.</p>',[wb("Continue to desktop","vmEspDone",{pri:1})]);}
  else if(s==="espfail"){h=oobeCard("We ran into a problem during device setup",'<ul class="esp"><li class="ok">Device preparation</li><li class="bad">Device setup</li><li>Account setup</li></ul><div class="wmsg bad">'+esc(d.mdmWhy||"Enrollment failed.")+'</div><p>You can fix the cause in the admin centers (use the tabs at the top), then try again.</p>',[wb("Try again","vmEspRetry",{pri:1}),wb("Reset device","vmReset")]);}
  else if(s==="setup"){h=oobeCard("How would you like to set up this device?",'<div class="opick"><button type="button" class="oc" data-a="vmSetup" data-k="personal"><b>Set up for personal use</b><small>Creates a local account on this PC. You can join it to your organization later in Settings.</small></button><button type="button" class="oc" data-a="vmSetup" data-k="work"><b>Set up for work or school</b><small>Sign in with a work account and join this PC to Microsoft Entra ID right now.</small></button></div>'+(apAssigned()?"":'<div class="wmsg">No Autopilot profile is assigned, so you get standard setup instead of zero-touch.</div>'),[]);}
  else if(s==="worksign"){h='<div class="oobe"><div class="ocard wide">'+(v.dlg?dlgInner(d):"")+'</div></div>';}
  else if(s==="local"){h=oobeCard("Create a local account",vi("lname","Who's going to use this PC?","text","LocalAdmin")+vi("lpw","Create a password","password","","vmLocalDone")+(v.msg?'<div class="wmsg bad">'+esc(v.msg)+'</div>':""),[wb("Next","vmLocalDone",{pri:1}),wb("Back","vmOobeBack")]);}
  return h;
}
A.vmOobeNext=function(){var d=curDev(),v=d.vm;
  if(v.oobe==="region"){v.oobe="keyboard";return;}
  if(v.oobe==="keyboard"){v.oobe="network";return;}
  if(v.oobe==="network"){
    if(!v.ssid){return;}
    if(d.autopilot&&apAssigned()){v.oobe="apsignin";v.dlg={mode:"ap",step:"email",uid:null,err:""};S.vmIn={};S.flags.vmApSignin=true;}
    else{v.oobe="setup";}
  }
};
A.vmOobeBack=function(){var v=curDev().vm;v.oobe="setup";v.msg="";};
A.vmSsid=function(ds){curDev().vm.ssid=ds.s;};
A.vmSetup=function(ds){var d=curDev(),v=d.vm;S.vmIn={};v.msg="";
  if(ds.k==="personal"){v.oobe="local";}
  else{v.oobe="worksign";v.dlg={mode:"oobejoin",step:"email",uid:null,err:""};}
};
A.vmLocalDone=function(){var d=curDev(),v=d.vm,n=(S.vmIn.lname||"").trim(),p=S.vmIn.lpw||"";
  if(!n){v.msg="Enter a user name.";return;}if(p.length<4){v.msg="Enter a password of at least 4 characters.";return;}
  nameDevice(d);v.locals=[{name:n,pw:p,admin:true}];v.cur={kind:"local",name:n};v.stage="desktop";v.oobe="done";v.msg="";S.vmIn={};
  if(n==="LocalAdmin"){S.flags.vmAdmin=true;}
  toast("Local account created. This PC is not managed yet. Join it in Settings > Accounts > Access work or school.");};
A.vmEspDone=function(){var d=curDev(),v=d.vm;v.stage="desktop";v.oobe="done";v.app=null;v.start=false;};
A.vmEspRetry=function(){var d=curDev(),v=d.vm,u=U(d.joinUser);
  if(!u){return;}var r=tryEnroll(d,u);
  if(r.ok){v.oobe="espok";}else{d.mdmWhy=r.why;toast("Still failing. Read the message and check the admin centers.");}
};
A.vmReset=function(){var d=curDev();resetDevice(d);toast("The laptop was reset to the start of setup.");};

/* ----- lock screen ----- */
function lockHtml(d){
  var v=d.vm,tiles="";
  v.locals.forEach(function(l){tiles+='<button type="button" class="tile'+(v.pick==="l:"+l.name?' on':'')+'" data-a="vmPick" data-k="l:'+esc(l.name)+'"><span class="av">'+esc(l.name[0])+'</span><span>'+esc(l.name)+'<small>'+(l.admin?"Local administrator":"Local account")+'</small></span></button>';});
  v.work.forEach(function(id){var u=U(id);if(u&&!u.deleted){tiles+='<button type="button" class="tile'+(v.pick==="w:"+id?' on':'')+'" data-a="vmPick" data-k="w:'+id+'"><span class="av w">'+esc(u.name[0])+'</span><span>'+esc(u.name)+'<small>'+esc(upn(u))+'</small></span></button>';}});
  tiles+='<button type="button" class="tile" data-a="vmDlgOpen" data-mode="lock"><span class="av">+</span><span>Other user<small>Sign in with a work account</small></span></button>';
  return '<div class="wall lockwall"></div><div class="lockclock"><b>9:41</b><span>Thursday, October 8</span></div>'+
   (v.dlg?'<div class="vmdlg">'+dlgInner(d)+'</div>':'<div class="locktiles">'+tiles+(v.pick?'<div class="lockpw">'+vi("lockpw","Password","password","","vmLockIn")+wb("Sign in","vmLockIn",{pri:1})+(v.msg?'<div class="wmsg bad">'+esc(v.msg)+'</div>':'')+'</div>':'')+'</div>');
}
A.vmPick=function(ds){var v=curDev().vm;v.pick=ds.k;v.msg="";S.vmIn.lockpw="";};
A.vmLockIn=function(){
  var d=curDev(),v=d.vm,k=v.pick,pw=S.vmIn.lockpw||"";
  if(!k){return;}
  if(k.indexOf("l:")===0){
    var l=v.locals.filter(function(x){return x.name===k.slice(2);})[0];
    if(!l||l.pw!==pw){v.msg="The password is incorrect. Try again.";return;}
    v.cur={kind:"local",name:l.name};v.stage="desktop";v.pick="";v.msg="";v.app=null;v.start=false;S.vmIn={};
    if(l.admin&&d.spare){S.flags.vmAdmin=true;}
    return;
  }
  var u=U(k.slice(2));
  if(!u||u.pw!==pw){v.msg="The password is incorrect. Try again.";return;}
  if(d.domainJoined&&d.secureChannel===false){v.msg="The trust relationship between this workstation and the primary domain failed.";return;}
  if(u.blocked){v.msg="Your account has been disabled (error 50057).";return;}
  if(u.mustChange){v.msg="Your password must be updated. Use Other user to sign in and change it.";return;}
  if(mfaNeeded()){
    v.dlg={mode:"lock",step:u.methods.some(function(m){return !m.sus;})?"mfa":"reg",uid:u.id,err:""};
    v.msg="";S.vmIn={};return;
  }
  v.cur={kind:"work",uid:u.id};v.stage="desktop";v.pick="";v.msg="";v.app=null;v.start=false;S.vmIn={};S.flags.vmWorkSignin=true;
  if(d.domainJoined){d.joinUser=u.id;if(!d.userId){d.userId=u.id;}}
  vmLog(u,"Windows Sign In","Success","Single-factor authentication");
};

/* ----- desktop ----- */
function installedApps(d){
  var base=["Microsoft Edge","Notepad","Windows Security"];
  if(enrolledOk(d)){base.push("Company Portal");}
  return base.concat(d.appsIn||[]).concat(d.vm.userApps||[]);
}
function desktopHtml(d){
  var v=d.vm,name=sessName(d),win="",start="";
  if(v.app==="settings"){win=settingsHtml(d);}
  else if(v.app==="terminal"||v.app==="cmd"){win=terminalHtml(d);}
  else if(v.app==="explorer"){win=explorerHtml(d);}
  else if(v.app==="portal"){win=portalHtml(d);}
  var apps=[["explorer","File Explorer","&#128193;"],["settings","Settings","&#9881;"],["terminal","Terminal","&gt;_"]];
  if(enrolledOk(d)){apps.push(["portal","Company Portal"]);}
  var ia=installedApps(d),extra=ia.filter(function(n){return ["Microsoft Edge","Notepad","Windows Security","Company Portal"].indexOf(n)<0;});
  if(v.start){
    start='<div class="startmenu"><div class="startsearch">Search for apps, settings, and documents</div><div class="startlabel"><b>Pinned</b><span>All apps &gt;</span></div><div class="sgrid">'+apps.map(function(a){return '<button type="button" class="sapp" data-a="vmOpen" data-app="'+a[0]+'"><span class="sic">'+(a[2]||esc(a[1][0]))+'</span>'+esc(a[1])+'</button>';}).join("")+
      extra.map(function(n){return '<button type="button" class="sapp" data-a="vmFake" data-n="'+esc(n)+'"><span class="sic">'+esc(n[0])+'</span>'+esc(n)+'</button>';}).join("")+'</div>'+
      '<div class="sfoot"><span><span class="av">'+esc((name||"?")[0])+'</span> '+esc(name)+'</span><span>'+wb("Sign out","vmSignout")+wb("Restart","vmRestart")+'</span></div></div>';
  }
  return '<div class="wall"></div><div class="dicons"><button type="button" class="dicon" data-a="vmOpen" data-app="explorer"><span class="sic">&#128187;</span>This PC</button><div class="dicon"><span class="sic">&#9851;</span>Recycle Bin</div>'+(enrolledOk(d)?'<button type="button" class="dicon" data-a="vmOpen" data-app="portal"><span class="sic">C</span>Company Portal</button>':'')+'</div>'+win+start+
   '<div class="taskbar"><div class="tcenter"><button type="button" class="tbtn starticon" data-a="vmStart" aria-label="Start">&#8862;</button><button type="button" class="tsearch" data-a="vmStart">&#128269; Search</button><button type="button" class="tbtn'+(v.app==="explorer"?' on':'')+'" data-a="vmOpen" data-app="explorer" aria-label="File Explorer">&#128193;</button><button type="button" class="tbtn'+(v.app==="settings"?' on':'')+'" data-a="vmOpen" data-app="settings" aria-label="Settings">&#9881;</button><button type="button" class="tbtn'+((v.app==="terminal"||v.app==="cmd")?' on':'')+'" data-a="vmOpen" data-app="terminal" aria-label="Windows Terminal">&gt;_</button></div><div class="ttray"><span class="trayicons">&#8963; '+(v.ssid?"&#9673;":"&#8856;")+' &#128266;</span><span>'+esc(v.ssid||"No network")+'<br>9:41 AM</span></div></div>'+
   (v.dlg?'<div class="vmdlg">'+dlgInner(d)+'</div>':'');
}
A.vmStart=function(){var v=curDev().vm;v.start=!v.start;};
A.vmOpen=function(ds){var v=curDev().vm;v.app=ds.app==="cmd"?"terminal":ds.app;v.start=false;v.msg="";if(ds.app==="settings"){v.setPage="about";}};
A.vmClose=function(){var v=curDev().vm;v.app=null;v.dlg=null;v.msg="";};
A.vmFake=function(ds){toast("Opened "+ds.n+" (simulated).");curDev().vm.start=false;};
A.vmSignout=function(){var v=curDev().vm;v.stage="lock";v.cur=null;v.app=null;v.start=false;v.pick="";v.dlg=null;S.vmIn={};};
A.vmRestart=function(){var d=curDev(),v=d.vm;v.stage="lock";v.cur=null;v.app=null;v.start=false;v.pick="";v.dlg=null;S.vmIn={};
  if(S.scenarios.active==="s7"&&d.secureChannel!==false){d.restartedAfterTrust=true;}
  if(d.join==="joined"&&d.state!=="enrolled"&&d.joinUser){var r=tryEnroll(d,U(d.joinUser));if(r.ok){toast("After restart, the laptop enrolled in Intune.");}}
};

/* ----- Settings ----- */
function settingsHtml(d){
  var v=d.vm,pg=v.setPage,body="",u=d.joinUser?U(d.joinUser):null,name=sessName(d);
  var nav=[["about","System"],["network","Network & internet"],["apps","Apps"],["accounts","Accounts"],["privacy","Privacy & security"]];
  if(pg==="about"){
    body='<h2>System &gt; About</h2><dl class="wdl"><dt>Device name</dt><dd>'+esc(d.name==="(not set up)"?compNameFor(d):d.name)+'</dd><dt>Processor</dt><dd>Intel Core i5 (virtual)</dd><dt>Installed RAM</dt><dd>16.0 GB</dd><dt>Device ID</dt><dd class="mono">'+guidFor(d)+'</dd><dt>Edition</dt><dd>'+esc(d.os)+'</dd><dt>OS build</dt><dd>'+esc(d.osVer)+'</dd><dt>Serial number</dt><dd class="mono">'+esc(d.serial)+'</dd></dl>';
  }else if(pg==="network"){
    body='<h2>Network &amp; internet &gt; Wi-Fi</h2><dl class="wdl"><dt>Network</dt><dd>'+esc(v.ssid||"Not connected")+'</dd><dt>IPv4 address</dt><dd class="mono">'+ipFor(d)+'</dd><dt>IP assignment</dt><dd>Automatic (DHCP)</dd><dt>DHCP server</dt><dd class="mono">192.168.20.1</dd></dl><p class="wnote">Each device holds one address from the DHCP pool for the lease time. When the pool runs out, new devices connect to Wi-Fi but get no IP.</p>';
  }else if(pg==="apps"){
    body='<h2>Apps &gt; Installed apps</h2><ul class="wlist">'+installedApps(d).map(function(n){return '<li>'+esc(n)+'</li>';}).join("")+'</ul>';
  }else if(pg==="privacy"){
    var bl=d.bitlocker||d.baseBitlocker;
    body='<h2>Privacy &amp; security &gt; Device encryption</h2><dl class="wdl"><dt>Device encryption (BitLocker)</dt><dd>'+(bl?"On":"Off")+'</dd><dt>Managed by</dt><dd>'+(enrolledOk(d)&&bl&&!d.baseBitlocker?"Your organization (policy from Intune)":"-")+'</dd><dt>Recovery key</dt><dd>'+(bl&&d.join==="joined"?"Backed up to Microsoft Entra ID":"-")+'</dd></dl>'+(bl?"":'<p class="wnote">Not encrypted. A disk encryption policy assigned in Intune would turn this on after the device syncs.</p>');
  }else{
    var sub=v.set2,tabs='<div class="wtabs2"><button type="button" class="'+(sub!=="work"&&sub!=="workinfo"?'on':'')+'" data-a="vmSet2" data-k="info">Your info</button><button type="button" class="'+(sub==="work"||sub==="workinfo"?'on':'')+'" data-a="vmSet2" data-k="work">Access work or school</button></div>';
    if(sub==="work"||sub==="workinfo"||!sub){
      var acct="";
      if(d.join){var conn=d.domainJoined?(d.azureAdJoined?"Connected to practice.local and Practice Tenant":"Connected to practice.local"):"Connected to Practice Tenant's Microsoft Entra ID";acct='<div class="wacct"><b>'+esc(conn)+'</b><span class="mono">'+esc(u?upn(u):AD_DOMAIN)+'</span><span>'+(d.azureAdJoined&&d.domainJoined?"Hybrid Azure AD joined":d.domainJoined?"Domain joined":d.join==="joined"?"Joined":"Registered")+'</span><div class="wbtns">'+wb("Info","vmSet2",{d:{k:"workinfo"}})+(d.join==="registered"?wb("Disconnect","vmDisconnect"):"")+'</div></div>';}
      if(sub==="workinfo"&&d.join){
        body='<h2>Accounts &gt; Access work or school</h2>'+tabs+'<div class="wacct"><b>Connection info</b><dl class="wdl"><dt>Join type</dt><dd>'+(d.azureAdJoined&&d.domainJoined?"Hybrid Azure AD joined":d.domainJoined?"Active Directory domain joined":d.join==="joined"?"Microsoft Entra joined":"Microsoft Entra registered")+'</dd><dt>Areas managed by Practice Tenant</dt><dd>'+(enrolledOk(d)?"Device management (Intune)":"None. This device is not managed.")+'</dd><dt>Last attempted sync</dt><dd>'+esc(d.sync||"-")+'</dd></dl>'+
          (d.join==="joined"&&!enrolledOk(d)&&d.mdmWhy?'<div class="wmsg bad">'+esc(d.mdmWhy)+'</div>':"")+'<div class="wbtns">'+wb("Sync","vmSync",{pri:1})+wb("Back","vmSet2",{d:{k:"work"}})+'</div></div>';
      }else{
        body='<h2>Accounts &gt; Access work or school</h2>'+tabs+'<p>Get access to resources like email, apps, and the network. Connecting means your work or school might control some things on this device.</p><div class="srow"><span>Add a work or school account</span>'+wb("Connect","vmConnect",{pri:1})+'</div>'+(!d.join?'<div class="srow"><span>Join an on-premises Active Directory domain</span>'+wb("Join a domain","vmDomainJoin")+'</div>':"")+(v.msg?'<div class="wmsg bad" role="alert">'+esc(v.msg)+'</div>':"")+acct;
      }
    }else{
      body='<h2>Accounts &gt; Your info</h2>'+tabs+'<dl class="wdl"><dt>Signed in as</dt><dd>'+esc(name)+'</dd><dt>Account type</dt><dd>'+(v.cur&&v.cur.kind==="work"?"Work account (Microsoft Entra ID)":isAdminSess(d)?"Local administrator":"Local standard user")+'</dd></dl>';
    }
  }
  return '<div class="win">'+winChrome("Settings")+'<div class="set"><nav class="setnav"><div class="setuser"><span class="av">'+esc((name||"?")[0])+'</span>'+esc(name)+'</div>'+
    nav.map(function(n){return '<button type="button" class="'+(pg===n[0]?'on':'')+'" data-a="vmSetPage" data-p="'+n[0]+'">'+esc(n[1])+'</button>';}).join("")+'</nav><div class="setbody">'+body+'</div></div></div>';
}
A.vmSetPage=function(ds){var v=curDev().vm;v.setPage=ds.p;v.msg="";if(ds.p==="accounts"){v.set2="work";}};
A.vmSet2=function(ds){var v=curDev().vm;v.set2=ds.k;v.msg="";};
A.vmConnect=function(){var d=curDev(),v=d.vm;v.msg="";
  if(!isAdminSess(d)){v.msg="You need to be signed in as an administrator to connect this device. Sign out and sign in as LocalAdmin.";return;}
  if(d.join){v.msg="This device is already "+(d.join==="joined"?"joined to Microsoft Entra ID":"registered")+". Disconnect the work account first.";return;}
  S.vmIn={};v.dlg={mode:"register",step:"email",uid:null,err:""};
};
A.vmDomainJoin=function(){var d=curDev(),v=d.vm;v.msg="";
  if(!isAdminSess(d)){v.msg="You need to be signed in as a local administrator to join a domain.";return;}
  openModal("Join a domain",mtext("Domain name","domain","practice.local")+mtext("Domain administrator","user","PRACTICE\\LabAdmin")+'<div class="fld"><div class="lb">Password</div><input type="password" name="pw" aria-label="Password" autocomplete="off"></div><p class="hint">Practice-only credentials are shown beside the virtual laptop.</p>',"Join",function(fd){
    var r=domainJoin(d,fd.domain,fd.user,fd.pw);if(!r.ok){return {error:r.why};}
    v.work=[];v.msg="Welcome to the practice.local domain. Restart, then sign in with a domain user.";toast("Domain join succeeded. Restart the laptop.");return null;
  });
};
A.vmDisconnect=function(){var d=curDev();d.join="";d.joinUser=null;audit("Delete device registration",d.name,"Device","Core Directory");toast("Work account removed from this device.");};
A.vmSync=function(){var d=curDev(),v=d.vm,u=d.joinUser?U(d.joinUser):null;
  if(d.state==="wiping"){resetDevice(d);toast("The wipe command arrived. The laptop restarted into setup.");return;}
  if((d.join==="joined"||d.join==="hybrid")&&u&&d.state!=="enrolled"){var r=tryEnroll(d,u);if(r.ok){toast("Sync succeeded. The laptop is now enrolled in Intune.");S.flags.vmSync=true;}else{d.mdmWhy=r.why;toast("Sync failed. See the message under Connection info.");}return;}
  if((d.join==="joined"||d.join==="hybrid")&&enrolledOk(d)){d.sync="Just now";S.flags.vmSync=true;toast("Sync completed. New policies and apps are applied.");return;}
  toast("Nothing to sync. This device isn't managed.");
};

/* ----- File Explorer ----- */
function explorerItems(d,path){
  var v=d.vm,items=[];
  if(path==="Home"){return [
    {id:"nav-desktop",name:"Desktop",type:"File folder",nav:"Desktop"},
    {id:"nav-documents",name:"Documents",type:"File folder",nav:"Documents"},
    {id:"nav-downloads",name:"Downloads",type:"File folder",nav:"Downloads"}
  ];}
  if(path==="This PC"){items=[
    {id:"nav-c",name:"Windows (C:)",type:"Local Disk",nav:"C:\\"}
  ];if(d.driveMapped){items.push({id:"nav-finance",name:"Finance (F:)",type:"Network Drive",nav:"Finance (F:)"});}return items;}
  if(path==="Finance (F:)"){return [{id:"share1",name:"Finance Shared Files",ext:"",type:"File folder",size:"",readonly:true}];}
  return v.files.filter(function(f){return f.loc===path&&(v.showHidden||!f.hidden);});
}
function explorerHtml(d){
  var v=d.vm,path=v.explorerPath||"Home",items=explorerItems(d,path);
  var rows=items.map(function(f){
    var display=f.name+((v.showExt||f.type==="File folder"||f.type==="Local Disk"||f.type==="Network Drive")?(f.ext||""):"");
    return '<div class="erow'+(f.hidden?' hiddenfile':'')+'" data-file="'+esc(f.id)+'"><button type="button" class="ename" data-a="'+(f.nav?"vmExplorerGo":"vmFileProps")+'" '+(f.nav?'data-path="'+esc(f.nav)+'"':'data-id="'+esc(f.id)+'"')+'><span class="fileicon">'+(f.type==="File folder"||f.nav?"&#128193;":"&#128196;")+'</span>'+esc(display)+'</button><span>'+esc(f.type)+'</span><span>'+esc(f.size||"")+'</span>'+(f.nav||f.readonly?'<span></span>':'<span class="eactions">'+wb("Rename","vmFileRename",{d:{id:f.id}})+wb("Delete","vmFileDelete",{d:{id:f.id}})+'</span>')+'</div>';
  }).join("");
  return '<div class="win explorerwin">'+winChrome("File Explorer")+
    '<div class="ecmd"><button type="button" data-a="vmExplorerNew">&#43; New folder</button><button type="button" data-a="vmExplorerToggle" data-k="hidden">'+(v.showHidden?"&#10003; ":"")+'Hidden items</button><button type="button" data-a="vmExplorerToggle" data-k="ext">'+(v.showExt?"&#10003; ":"")+'File name extensions</button></div>'+
    '<div class="eaddress"><button type="button" data-a="vmExplorerGo" data-path="Home">&#8962;</button><span>This PC &gt; '+esc(path)+"</span></div>"+
    '<div class="explorerbody"><nav class="enav">'+["Home","Desktop","Documents","Downloads","This PC"].map(function(p){return '<button type="button" class="'+(path===p?'on':'')+'" data-a="vmExplorerGo" data-path="'+p+'">'+(p==="Home"?"&#8962;":"&#128193;")+' '+p+'</button>';}).join("")+(d.driveMapped?'<button type="button" class="'+(path==="Finance (F:)"?'on':'')+'" data-a="vmExplorerGo" data-path="Finance (F:)">&#128451; Finance (F:)</button>':"")+'</nav>'+
    '<section class="efiles"><h2>'+esc(path)+'</h2><div class="ehead"><span>Name</span><span>Type</span><span>Size</span><span>Actions</span></div>'+(rows||'<div class="eempty">This folder is empty.</div>')+'</section></div></div>';
}
A.vmExplorerGo=function(ds){curDev().vm.explorerPath=ds.path;};
A.vmExplorerToggle=function(ds){var v=curDev().vm;if(ds.k==="hidden"){v.showHidden=!v.showHidden;}else{v.showExt=!v.showExt;}};
A.vmExplorerNew=function(){var d=curDev(),v=d.vm,path=v.explorerPath;if(["Home","This PC","Finance (F:)"].indexOf(path)>-1){toast("Open a local folder before creating a new folder.");return;}
  openModal("New folder",mtext("Name","name","New folder"),"Create",function(fd){var name=(fd.name||"").trim();if(!name){return {error:"Enter a folder name."};}v.files.push({id:nid("vf"),loc:path,name:name,ext:"",type:"File folder",size:"",hidden:false});return null;});
};
A.vmFileRename=function(ds){var v=curDev().vm,f=v.files.filter(function(x){return x.id===ds.id;})[0];if(!f){return;}
  openModal("Rename",mtext("New name","name",f.name),"Rename",function(fd){var name=(fd.name||"").trim();if(!name){return {error:"Enter a name."};}f.name=name;return null;});
};
A.vmFileDelete=function(ds){var v=curDev().vm,i=v.files.map(function(x){return x.id;}).indexOf(ds.id);if(i>-1){v.files.splice(i,1);toast("Item moved to Recycle Bin.");}};
A.vmFileProps=function(ds){var f=curDev().vm.files.filter(function(x){return x.id===ds.id;})[0];if(!f){return;}openModal(f.name+" Properties",'<dl class="wdl"><dt>Type</dt><dd>'+esc(f.type)+'</dd><dt>Location</dt><dd>'+esc(f.loc)+'</dd><dt>Size</dt><dd>'+esc(f.size||"0 bytes")+'</dd><dt>Attributes</dt><dd>'+(f.hidden?"Hidden":"Archive")+'</dd></dl>',null,null);};

/* ----- Windows Terminal ----- */
function dsreg(d){
  var j=d.join==="joined"||d.join==="hybrid"||!!d.azureAdJoined,r=d.join==="registered",dom=!!d.domainJoined,u=d.joinUser?U(d.joinUser):null,L=[];
  var mdm=(j&&u&&inMdmScope(u))?"https://enrollment.manage.microsoft.com/enrollmentserver/discovery.svc":"";
  var comp=d.name==="(not set up)"?compNameFor(d):d.name;
  L.push("+----------------------------------------------------------------------+","| Device State                                                         |","+----------------------------------------------------------------------+","");
  L.push("             AzureAdJoined : "+(j?"YES":"NO"),"          EnterpriseJoined : NO","              DomainJoined : "+(dom?"YES":"NO"),"               DomainName : "+(dom?"PRACTICE":""),"               Device Name : "+comp,"");
  if(j){L.push("+----------------------------------------------------------------------+","| Device Details                                                       |","+----------------------------------------------------------------------+","","                  DeviceId : "+guidFor(d),"                TpmProtected : YES","");
    L.push("+----------------------------------------------------------------------+","| Tenant Details                                                       |","+----------------------------------------------------------------------+","","                TenantName : Practice Tenant","                  TenantId : "+TENANT,"                    MdmUrl : "+mdm,"               MdmTouUrl : "+(mdm?"https://portal.manage.microsoft.com/TermsofUse.aspx":""),"");}
  L.push("+----------------------------------------------------------------------+","| User State                                                           |","+----------------------------------------------------------------------+","","                    NgcSet : NO","           WorkplaceJoined : "+(r?"YES":"NO"),"");
  L.push("+----------------------------------------------------------------------+","| SSO State                                                            |","+----------------------------------------------------------------------+","","                AzureAdPrt : "+(j&&d.vm.cur&&d.vm.cur.kind==="work"?"YES":"NO"),"");
  return L;
}
var TERMINAL_GUIDE=[
  {group:"Network",cmd:"ipconfig /all",ps:"Get-NetIPConfiguration",desc:"Inspect IP, gateway, DNS, and DHCP configuration."},
  {group:"Network",cmd:"ping 8.8.8.8",ps:"Test-Connection 8.8.8.8",desc:"Test reachability and latency."},
  {group:"Network",cmd:"nslookup microsoft.com",ps:"Resolve-DnsName microsoft.com",desc:"Query DNS name resolution."},
  {group:"Network",cmd:"tracert 8.8.8.8",ps:"Test-NetConnection 8.8.8.8 -TraceRoute",desc:"Inspect the route to a destination."},
  {group:"Network",cmd:"pathping 8.8.8.8",ps:"Test-Connection 8.8.8.8",desc:"Combine route and packet-loss checks."},
  {group:"Network",cmd:"netstat -ano",ps:"Get-NetTCPConnection",desc:"View listening ports and active connections."},
  {group:"Network",cmd:"arp -a",ps:"Get-NetNeighbor",desc:"View local IP-to-MAC mappings."},
  {group:"Network",cmd:"route print",ps:"Get-NetRoute",desc:"View the routing table."},
  {group:"Network",cmd:"getmac /v",ps:"Get-NetAdapter",desc:"View network adapters and MAC addresses."},
  {group:"Device and OS",cmd:"systeminfo",ps:"Get-ComputerInfo",desc:"Review Windows, hardware, boot, and domain details."},
  {group:"Device and OS",cmd:"tasklist",ps:"Get-Process",desc:"List running processes."},
  {group:"Device and OS",cmd:"driverquery",ps:"Get-CimInstance Win32_SystemDriver",desc:"List installed drivers."},
  {group:"Accounts and services",cmd:"net user",ps:"Get-LocalUser",desc:"List local accounts."},
  {group:"Accounts and services",cmd:"net localgroup Administrators",ps:"Get-LocalGroupMember Administrators",desc:"Inspect local group membership."},
  {group:"Accounts and services",cmd:"sc query",ps:"Get-Service",desc:"Inspect Windows services."},
  {group:"Identity and policy",cmd:"whoami",ps:"whoami",desc:"Show the signed-in user."},
  {group:"Identity and policy",cmd:"hostname",ps:"hostname",desc:"Show the computer name."},
  {group:"Identity and policy",cmd:"dsregcmd /status",ps:"dsregcmd /status",desc:"Inspect Entra and domain join state."},
  {group:"Identity and policy",cmd:"gpupdate /force",ps:"gpupdate /force",desc:"Apply Group Policy now."},
  {group:"Identity and policy",cmd:"gpresult /r",ps:"gpresult /r",desc:"View applied Group Policy Objects."},
  {group:"Health and repair",cmd:"powercfg /batteryreport",ps:"powercfg /batteryreport",desc:"Generate a battery health report."},
  {group:"Health and repair",cmd:"chkdsk C:",ps:"Repair-Volume C -Scan",desc:"Scan a volume for filesystem errors."},
  {group:"Health and repair",cmd:"sfc /scannow",ps:"sfc /scannow",desc:"Verify protected Windows system files."},
  {group:"Health and repair",cmd:"DISM /Online /Cleanup-Image /ScanHealth",ps:"Repair-WindowsImage -Online -ScanHealth",desc:"Check the Windows component store."}
];
function terminalUser(d){var v=d.vm,nm=sessName(d)||"admin";return v.cur&&v.cur.kind==="work"?U(v.cur.uid).name.replace(/\s/g,"").toLowerCase():nm;}
function cmdPrompt(d){return "C:\\Users\\"+terminalUser(d)+">";}
function psPrompt(d){return "PS C:\\Users\\"+terminalUser(d)+"> ";}
function networkTarget(parts){for(var i=1;i<parts.length;i++){if(parts[i].charAt(0)!=="-"&&parts[i].charAt(0)!=="/"&&!/^\d+$/.test(parts[i])){return parts[i];}}return "";}
function resolvedIp(target){if(/^\d{1,3}(\.\d{1,3}){3}$/.test(target)){return target;}var n=0;for(var i=0;i<target.length;i++){n+=target.charCodeAt(i)*(i+1);}return "20."+(20+n%180)+"."+(10+n%220)+"."+(5+n%240);}
function noNetwork(d){return !d.vm.ssid;}
function requireTarget(name,target){return target?null:["Usage: "+name+" <host name or IP address>"];}
function elevated(d){return isAdminSess(d);}
function localUsers(d){return d.vm.locals.map(function(x){return x.name;}).concat(["Administrator","DefaultAccount","Guest","WDAGUtilityAccount"]);}
function runCmd(d,line){
  var raw=line.trim(),c=raw.toLowerCase(),parts=raw.split(/\s+/),v=d.vm,out=[],nm=sessName(d),comp=d.name==="(not set up)"?compNameFor(d):d.name,target;
  if(!c){return out;}
  if(c==="help"){out=["Commands available in this practice terminal:",""].concat(TERMINAL_GUIDE.map(function(x){return "  "+x.cmd.padEnd(38)+" "+x.desc;}),["","Use the command guide below the laptop for PowerShell equivalents."]);}
  else if(c==="dsregcmd /status"||c==="dsregcmd"){out=dsreg(d);if(d.join){S.flags.vmDsreg=true;}}
  else if(c==="gpupdate /force"||c==="gpupdate"){var gu=v.cur&&v.cur.kind==="work"?U(v.cur.uid):null,gr=applyGroupPolicy(d,gu);if(S.scenarios.active==="s6"&&!D("d3").wallpaperApplied){S.scenarios.wrong.s6=true;}out=gr.ok?["Updating policy...","","Computer Policy update has completed successfully.","User Policy update has completed successfully."]:["Updating policy...","ERROR: "+gr.why];}
  else if(c==="gpresult /r"||c==="gpresult"){var aps=d.appliedGpos||[];out=["Microsoft (R) Windows (R) Operating System Group Policy Result tool","","COMPUTER SETTINGS","    Applied Group Policy Objects",aps.length?"        "+aps.join("\n        "):"        N/A"];}
  else if(c==="whoami"){out=[v.cur&&v.cur.kind==="work"?(d.domainJoined?"practice\\":"azuread\\")+(U(v.cur.uid).name.replace(/\s/g,"").toLowerCase()):comp.toLowerCase()+"\\"+(nm||"admin").toLowerCase()];}
  else if(c==="hostname"){out=[comp];}
  else if(c==="ipconfig"||c==="ipconfig /all"){
    if(noNetwork(d)){out=["Windows IP Configuration","","Wireless LAN adapter Wi-Fi:","","   Media State . . . . . . . . . . . : Media disconnected"];}
    else{out=["Windows IP Configuration","","Wireless LAN adapter Wi-Fi:","","   Connection-specific DNS Suffix  . : "+(d.domainJoined?"practice.local":""),"   IPv4 Address. . . . . . . . . . . : "+ipFor(d),"   Subnet Mask . . . . . . . . . . . : 255.255.255.0","   Default Gateway . . . . . . . . . : 192.168.20.1"];if(c==="ipconfig /all"){out.push("   Physical Address. . . . . . . . . : 00-15-5D-2A-10-01","   DHCP Enabled. . . . . . . . . . . : Yes","   DNS Servers . . . . . . . . . . . : 192.168.20.10","   DHCP Server . . . . . . . . . . . : 192.168.20.1","   Lease Obtained. . . . . . . . . . : Thursday, October 8, 2026 9:12:04 AM","   Lease Expires . . . . . . . . . . : Thursday, October 8, 2026 5:12:04 PM");}}
  }else if(parts[0].toLowerCase()==="ping"){
    target=networkTarget(parts);out=requireTarget("ping",target);if(!out){if(noNetwork(d)){out=["PING: transmit failed. General failure."];}else{var pip=resolvedIp(target);out=["Pinging "+target+" ["+pip+"] with 32 bytes of data:","Reply from "+pip+": bytes=32 time=18ms TTL=117","Reply from "+pip+": bytes=32 time=16ms TTL=117","Reply from "+pip+": bytes=32 time=17ms TTL=117","Reply from "+pip+": bytes=32 time=18ms TTL=117","","Ping statistics for "+pip+":","    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),","Approximate round trip times in milli-seconds:","    Minimum = 16ms, Maximum = 18ms, Average = 17ms"];}}
  }else if(parts[0].toLowerCase()==="nslookup"){
    target=networkTarget(parts);out=requireTarget("nslookup",target);if(!out){out=noNetwork(d)?["DNS request timed out.","    timeout was 2 seconds.","*** Can't find server address: No response from server"]:["Server:  dc01.practice.local","Address:  192.168.20.10","","Non-authoritative answer:","Name:    "+target,"Address:  "+resolvedIp(target)];}
  }else if(parts[0].toLowerCase()==="tracert"||parts[0].toLowerCase()==="pathping"){
    var tn=parts[0].toLowerCase();target=networkTarget(parts);out=requireTarget(tn,target);if(!out){out=noNetwork(d)?["Unable to resolve target system name "+target+"."]:["Tracing route to "+target+" ["+resolvedIp(target)+"]","over a maximum of 30 hops:","","  1    <1 ms    <1 ms    <1 ms  192.168.20.1","  2     8 ms     7 ms     8 ms  10.20.0.1","  3    17 ms    18 ms    17 ms  "+resolvedIp(target),"","Trace complete."].concat(tn==="pathping"?["","Computing statistics for 75 seconds...","Source to Here   This Node/Link","Lost/Sent = Pct  Lost/Sent = Pct  Address","0/100 = 0%       0/100 = 0%       "+resolvedIp(target)]:[]);}
  }else if(c.indexOf("netstat")===0){out=["Active Connections","","  Proto  Local Address          Foreign Address        State           PID","  TCP    "+ipFor(d)+":49721      20.190.155.132:443     ESTABLISHED     4120","  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1088","  UDP    0.0.0.0:5353           *:*                                    2240"];}
  else if(c==="arp"||c==="arp -a"){out=noNetwork(d)?["No ARP Entries Found."]:["Interface: "+ipFor(d)+" --- 0x8","  Internet Address      Physical Address      Type","  192.168.20.1          00-50-56-c0-00-08     dynamic","  192.168.20.10         00-15-5d-10-20-30     dynamic"];}
  else if(c==="route"||c==="route print"){out=["========================================================================","IPv4 Route Table","========================================================================","Active Routes:","Network Destination        Netmask          Gateway       Interface  Metric","          0.0.0.0          0.0.0.0     192.168.20.1    "+ipFor(d)+"     35","     192.168.20.0    255.255.255.0         On-link      "+ipFor(d)+"    291"];}
  else if(c.indexOf("getmac")===0){out=["Connection Name  Network Adapter     Physical Address    Transport Name","=============== =================== =================== ==========================","Wi-Fi           Intel Wi-Fi 6 AX201 00-15-5D-2A-10-01   \\Device\\Tcpip_{"+guidFor(d)+"}"];}
  else if(c==="systeminfo"){out=["Host Name:                 "+comp,"OS Name:                   Microsoft "+d.os,"OS Version:                "+d.osVer+" Build 22631","System Manufacturer:       "+d.maker,"System Model:              "+d.model,"System Type:               x64-based PC","Total Physical Memory:     16,384 MB","Domain:                    "+(d.domainJoined?"practice.local":"WORKGROUP"),"Logon Server:              "+(d.domainJoined?"\\\\DC01":"\\\\LOCALHOST")];}
  else if(c==="tasklist"){out=["Image Name                     PID Session Name        Mem Usage","========================= ======== ================ ============","System Idle Process              0 Services                   8 K","System                           4 Services                 156 K","explorer.exe                  4820 Console               112,440 K","WindowsTerminal.exe           6104 Console                86,212 K"];}
  else if(c==="driverquery"){out=["Module Name  Display Name                    Driver Type   Link Date","============ =============================== ============= ======================","ACPI         Microsoft ACPI Driver           Kernel        5/6/2022","Netwtw12     Intel Wireless Adapter           Kernel        8/14/2026","WdFilter     Microsoft antimalware filter     File System   9/18/2026"];}
  else if(c==="net user"){out=["User accounts for \\\\"+comp,"","-------------------------------------------------------------------------------",localUsers(d).join("        "),"The command completed successfully."];}
  else if(c.indexOf("net user ")===0){target=raw.slice(9).trim();out=localUsers(d).map(function(x){return x.toLowerCase();}).indexOf(target.toLowerCase())>-1?["User name                    "+target,"Account active               Yes","Local Group Memberships      *Users","The command completed successfully."]:["The user name could not be found.","","More help is available by typing NET HELPMSG 2221."];}
  else if(c.indexOf("net localgroup")===0){out=["Alias name     administrators","Comment        Administrators have complete and unrestricted access","","Members","-------------------------------------------------------------------------------","Administrator"].concat(d.vm.locals.filter(function(x){return x.admin;}).map(function(x){return x.name;}),["The command completed successfully."]);}
  else if(c==="sc query"||c.indexOf("sc query ")===0){out=["SERVICE_NAME: "+(parts[2]||"wuauserv"),"        TYPE               : 20  WIN32_SHARE_PROCESS","        STATE              : 4  RUNNING","                                (STOPPABLE, NOT_PAUSABLE, ACCEPTS_SHUTDOWN)","        WIN32_EXIT_CODE    : 0  (0x0)"];}
  else if(c.indexOf("powercfg")===0){out=c.indexOf("/batteryreport")>-1?["Battery life report saved to file path C:\\Users\\"+terminalUser(d)+"\\battery-report.html."]:["Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced)"];}
  else if(c.indexOf("chkdsk")===0){out=c.indexOf("/f")>-1&&!elevated(d)?["Access Denied as you do not have sufficient privileges or the disk may be locked by another process.","You have to invoke this utility running in elevated mode and make sure the disk is unlocked."]:["The type of the file system is NTFS.","Volume label is Windows.","","Windows has scanned the file system and found no problems.","No further action is required."];}
  else if(c.indexOf("sfc ")===0){out=!elevated(d)?["You must be an administrator running a console session in order to use the sfc utility."]:["Beginning system scan. This process will take some time.","","Verification 100% complete.","Windows Resource Protection did not find any integrity violations."];}
  else if(c.indexOf("dism ")===0){out=!elevated(d)?["Error: 740","","Elevated permissions are required to run DISM."]:["Deployment Image Servicing and Management tool","Version: 10.0.22621.1","","[==========================100.0%==========================]","No component store corruption detected.","The operation completed successfully."];}
  else if(c==="cls"){v.cmd=[];return null;}
  else{out=["'"+parts[0]+"' is not recognized as an internal or external command,","operable program or batch file."];}
  return out;
}
function psError(name){return [name+" : The term '"+name+"' is not recognized as the name of a cmdlet, function, script file, or operable program.","Check the spelling of the name, or if a path was included, verify that the path is correct and try again.","At line:1 char:1","+ "+name,"+ ~"+Array(name.length+1).join("~"),"    + CategoryInfo          : ObjectNotFound: ("+name+":String) [], CommandNotFoundException","    + FullyQualifiedErrorId : CommandNotFoundException"];}
function runPowerShell(d,line){
  var raw=line.trim(),c=raw.toLowerCase(),parts=raw.split(/\s+/),target=networkTarget(parts),out,comp=d.name==="(not set up)"?compNameFor(d):d.name;
  if(!c){return [];}if(c==="clear-host"||c==="cls"||c==="clear"){d.vm.ps=[];return null;}
  if(c==="get-help"||c==="help"){return ["Practice PowerShell commands:"].concat(TERMINAL_GUIDE.map(function(x){return "  "+x.ps.padEnd(40)+" "+x.desc;}));}
  if(c.indexOf("get-netipconfiguration")===0){return noNetwork(d)?["InterfaceAlias       : Wi-Fi","NetAdapter.Status   : Disconnected"]:["InterfaceAlias       : Wi-Fi","InterfaceDescription : Intel(R) Wi-Fi 6 AX201","IPv4Address          : "+ipFor(d),"IPv4DefaultGateway   : 192.168.20.1","DNSServer            : 192.168.20.10"];}
  if(c.indexOf("test-connection")===0){if(!target){return ["Test-Connection: Cannot validate argument on parameter 'TargetName'."];}return noNetwork(d)?["Test-Connection: Testing connection to computer '"+target+"' failed: A general failure occurred."]:["Source        Destination     IPV4Address       Bytes Time(ms)","------        -----------     -----------       ----- --------",comp+"  "+target.padEnd(15)+" "+resolvedIp(target).padEnd(17)+" 32    17"];}
  if(c.indexOf("resolve-dnsname")===0){if(!target){return ["Resolve-DnsName: Cannot bind argument to parameter 'Name' because it is null."];}return noNetwork(d)?["Resolve-DnsName: "+target+" : DNS server failure"]:["Name                           Type   TTL   Section    IPAddress","----                           ----   ---   -------    --------- ",target.padEnd(30)+" A      300   Answer     "+resolvedIp(target)];}
  if(c.indexOf("get-netroute")===0){return ["ifIndex DestinationPrefix NextHop       RouteMetric ifMetric PolicyStore","------- ----------------- -------       ----------- -------- -----------","8       0.0.0.0/0         192.168.20.1 0           35       ActiveStore","8       192.168.20.0/24   0.0.0.0      256         35       ActiveStore"];}
  if(c.indexOf("get-nettcpconnection")===0){return ["LocalAddress LocalPort RemoteAddress   RemotePort State       OwningProcess","------------ --------- -------------   ---------- -----       -------------",ipFor(d)+" 49721     20.190.155.132 443        Established 4120","0.0.0.0      135       0.0.0.0         0          Listen      1088"];}
  if(c.indexOf("get-netneighbor")===0){return runCmd(d,"arp -a");}
  if(c.indexOf("get-netadapter")===0){return ["Name InterfaceDescription                     ifIndex Status MacAddress","---- --------------------                     ------- ------ ----------","Wi-Fi Intel(R) Wi-Fi 6 AX201 160MHz           8       "+(noNetwork(d)?"Disconnected":"Up")+"     00-15-5D-2A-10-01"];}
  if(c.indexOf("get-computerinfo")===0){return ["WindowsProductName : Microsoft "+d.os,"WindowsVersion     : 23H2","OsBuildNumber      : 22631","CsName             : "+comp,"CsDomain           : "+(d.domainJoined?"practice.local":"WORKGROUP"),"CsTotalPhysicalMemory : 17179869184"];}
  if(c==="get-process"){return [" NPM(K)    PM(M)      WS(M)     CPU(s)      Id  ProcessName"," ------    -----      -----     ------      --  -----------","     42    86.21     112.44       4.82    4820  explorer","     31    61.08      86.21       2.14    6104  WindowsTerminal"];}
  if(c==="get-service"){return ["Status   Name               DisplayName","------   ----               -----------","Running  EventLog           Windows Event Log","Running  IntuneManagement…  Microsoft Intune Management Extension","Running  wuauserv           Windows Update"];}
  if(c==="get-localuser"){return ["Name               Enabled Description","----               ------- -----------"].concat(localUsers(d).map(function(x){return x.padEnd(18)+" True";}));}
  if(c.indexOf("get-localgroupmember")===0){return ["ObjectClass Name                         PrincipalSource","----------- ----                         ---------------","User        "+comp+"\\Administrator       Local"].concat(d.vm.locals.filter(function(x){return x.admin;}).map(function(x){return "User        "+comp+"\\"+x.name+" ".repeat(Math.max(1,20-x.name.length))+"Local";}));}
  if(c.indexOf("get-ciminstance")===0){return ["State   Name       StartMode PathName","-----   ----       --------- --------","Running ACPI       Boot      C:\\Windows\\System32\\drivers\\ACPI.sys","Running Netwtw12   Auto      C:\\Windows\\System32\\drivers\\Netwtw12.sys"];}
  if(c.indexOf("repair-volume")===0||c.indexOf("repair-windowsimage")===0){return !elevated(d)?["Repair operation requires an elevated Windows PowerShell session."]:["RunspaceId     : "+guidFor(d),"Path           : C:\\","Online         : True","HealthStatus   : Healthy","RestartNeeded  : False"];}
  if(c.indexOf("test-netconnection")===0){return runCmd(d,"tracert "+target);}
  if(/^(whoami|hostname|ipconfig|ping|nslookup|tracert|pathping|netstat|arp|route|getmac|systeminfo|tasklist|driverquery|net|sc|chkdsk)\b/.test(c)||c.indexOf("dsregcmd")===0||c.indexOf("gpupdate")===0||c.indexOf("gpresult")===0||c.indexOf("powercfg")===0||c.indexOf("sfc")===0||c.indexOf("dism")===0){return runCmd(d,raw.replace(/\.exe\b/i,""));}
  out=psError(parts[0]);return out;
}
function terminalHtml(d){
  var v=d.vm,shell=v.termShell||"cmd",hist=shell==="ps"?v.ps:v.cmd,prompt=shell==="ps"?psPrompt(d):cmdPrompt(d);
  return '<div class="win cmdwin terminalwin">'+winChrome("Windows Terminal")+'<div class="termtabs"><button type="button" class="'+(shell==="cmd"?'on':'')+'" data-a="vmTermShell" data-shell="cmd">Command Prompt</button><button type="button" class="'+(shell==="ps"?'on':'')+'" data-a="vmTermShell" data-shell="ps">Windows PowerShell</button><span class="termplus">+</span></div><pre class="cmdout">'+esc(hist.join("\n"))+'</pre><div class="cmdin"><span>'+esc(prompt)+'</span><input type="text" data-vi="cmdin" data-enter="vmCmd" autocomplete="off" aria-label="'+(shell==="ps"?"PowerShell":"Command Prompt")+' command" value="'+esc(S.vmIn.cmdin||"")+'" placeholder="'+(shell==="ps"?"Try: Get-NetIPConfiguration":"Try: ping 8.8.8.8")+'"><button type="button" class="wbtn pri" data-a="vmCmd">Run</button></div></div>';
}
function cmdHtml(d){return terminalHtml(d);}
A.vmTermShell=function(ds){var v=curDev().vm;v.termShell=ds.shell;S.vmIn.cmdin="";};
A.vmCmd=function(){var d=curDev(),v=d.vm,line=S.vmIn.cmdin||"",shell=v.termShell||"cmd";S.vmIn.cmdin="";if(!line.trim()){return;}
  var hist=shell==="ps"?v.ps:v.cmd,prompt=shell==="ps"?psPrompt(d):cmdPrompt(d),out=shell==="ps"?runPowerShell(d,line):runCmd(d,line);if(out===null){return;}
  hist.push(prompt+line.trim());Array.prototype.push.apply(hist,out);hist.push("");if(hist.length>400){hist.splice(0,hist.length-300);}
};

/* ----- Company Portal ----- */
function portalHtml(d){
  var u=d.userId?U(d.userId):null,avail=S.apps.filter(function(a){return a.intent==="available"&&d.userId&&applies(a,d.userId);});
  var cmp=d.compl?(d.compl.state==="Compliant"?'<div class="wmsg ok">This device meets your organization\'s requirements.</div>':'<div class="wmsg bad">This device doesn\'t meet requirements: '+esc(d.compl.rows.filter(function(r){return r.state!=="Compliant";}).map(function(r){return r.reason;}).join("; "))+'</div>'):"";
  return '<div class="win">'+winChrome("Company Portal")+'<div class="setbody"><h2>'+esc(d.name)+'</h2><p>Signed in as '+esc(u?upn(u):"")+'</p>'+cmp+
    '<div class="wbtns">'+wb("Check status (sync)","vmSync",{pri:1})+'</div><h3>Available apps</h3>'+(avail.length?avail.map(function(a){var on=(d.vm.userApps||[]).indexOf(a.name)>-1;return '<div class="srow"><span>'+esc(a.name)+'</span>'+(on?"Installed":wb("Install","vmInstall",{d:{n:a.name},pri:1}))+'</div>';}).join(""):'<p class="wnote">No apps are available. In Intune > Apps, assign an app as "Available".</p>')+'</div></div>';
}
A.vmInstall=function(ds){var v=curDev().vm;if(v.userApps.indexOf(ds.n)<0){v.userApps.push(ds.n);}toast(ds.n+" installed.");};

/* ----- page ----- */
function vmTip(d){
  var v=d.vm;
  if(v.stage==="oobe"){
    if(v.oobe==="apsignin"){return "Autopilot recognized this laptop by its serial number. Sign in as the new hire. If an error appears, fix it in the admin centers and try again.";}
    if(v.oobe==="setup"){return "No Autopilot profile is assigned, so this is standard setup. Pick personal use to create a local admin and join later, or work or school to join now.";}
    if(v.oobe==="espfail"){return "Read the message. Fix it in Entra (MDM scope) or Microsoft 365 (license), then press Try again.";}
    return "Click through the setup screens. On the network screen choose Practice-Corp.";
  }
  if(v.stage==="lock"){return d.spare&&!d.join?"Sign in as LocalAdmin. Joining a PC to Entra needs an administrator on the PC.":"Pick an account, or choose Other user to sign in with a work account.";}
  return "Open Start, then Settings > Accounts > Access work or school. Windows Terminal includes Command Prompt and PowerShell troubleshooting tools.";
}
function terminalGuideHtml(d){
  var groups=[],by={},open=!!(d.vm&&d.vm.cmdGuide);
  TERMINAL_GUIDE.forEach(function(x){if(!by[x.group]){by[x.group]=[];groups.push(x.group);}by[x.group].push(x);});
  return '<div class="tile vmcommands'+(open?' open':'')+'"><button type="button" class="cmdguidesum" data-a="vmToggleGuide" aria-expanded="'+(open?"true":"false")+'"><span><b>Windows Terminal command guide</b><small>Command Prompt and PowerShell troubleshooting examples</small></span><span class="chev">&#9662;</span></button>'+(open?'<div class="cmdguide">'+groups.map(function(g){return '<section><h4>'+esc(g)+'</h4>'+by[g].map(function(x){return '<div class="cgrow"><div><span>Command Prompt</span><code>'+esc(x.cmd)+'</code></div><div><span>PowerShell</span><code>'+esc(x.ps)+'</code></div><p>'+esc(x.desc)+'</p></div>';}).join("")+'</section>';}).join("")+'</div>':'')+'</div>';
}
A.vmToggleGuide=function(){var v=curDev().vm;v.cmdGuide=!v.cmdGuide;};
function vmSide(d){
  var v=d.vm,rows="";
  v.locals.forEach(function(l){rows+='<tr><td>'+esc(l.name)+'</td><td class="mono">'+esc(l.pw)+'</td></tr>';});
  live().forEach(function(u){rows+='<tr><td class="mono">'+esc(upn(u))+'</td><td class="mono">'+esc(u.pw||"-")+(u.mustChange?' <small>(must change)</small>':'')+'</td></tr>';});
  rows+='<tr><td class="mono">'+esc(S.ad.adminUser)+'</td><td class="mono">'+esc(S.ad.adminPw)+'</td></tr>';
  return '<div class="tile vmwhat"><h3>What to do</h3><p>'+esc(vmTip(d))+'</p></div>'+terminalGuideHtml(d)+
    '<div class="tile vmcredentials"><h3>Practice credentials</h3><p class="psub">Normally these come from a ticket or the user. Every credential here is fake.</p><div class="tbl"><table><thead><tr><th>Account</th><th>Password</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
    '<div class="tile vmstatus"><h3>Laptop status</h3>'+grid([["Name",esc(d.name)],["Domain",d.domainJoined?"practice.local":"Not joined"],["Entra",d.azureAdJoined&&d.domainJoined?"Hybrid joined":d.join==="joined"?"Joined":d.join==="registered"?"Registered":"Not connected"],["Intune",d.state==="enrolled"?"Managed":"Not managed"]])+'</div>';
}
function vmPage(){
  var d=curDev();
  if(!d||!(d.autopilot||d.vm||d.spare)){S.page="d2";d=D("d2");}
  var v=ensureVm(d);
  if(d.state==="wiping"){resetDevice(d);v=d.vm;toast("The Intune wipe command arrived. The laptop restarted into setup.");}
  var scr=v.stage==="oobe"?oobeHtml(d):v.stage==="lock"?lockHtml(d):desktopHtml(d);
  return '<h1 class="ptitle">Windows laptop (virtual machine)'+info("oobe")+'</h1><p class="psub">'+esc(d.maker+" "+d.model)+', serial <span class="mono">'+esc(d.serial)+'</span>. Whatever you do here is reflected in Entra and Intune.</p>'+
    '<div class="vmbar">'+B("Reset this PC","vmReset",{sm:1})+'</div><div class="vmgrid"><div class="laptop" id="laptop"><div class="lwrap"><div class="lscale"><div class="vm" id="vmscreen">'+scr+'</div><div class="lbase" aria-hidden="true"></div></div></div></div><section class="vmside" aria-label="Virtual laptop setup and reference">'+vmSide(d)+'</section></div>';
}
A.openVm=function(ds){var d=D(ds.id);if(!d){return;}ensureVm(d);S.portal="vm";S.page=d.id;resetNav();};
