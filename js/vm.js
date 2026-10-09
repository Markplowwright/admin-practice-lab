"use strict";
/* =============== WINDOWS LAPTOP (virtual machine) =============== */
var LOCAL_ADMIN_PW="Practice#2026",STUDENT_PW="Student#2026";
function freshVm(d){
  var v={stage:"oobe",oobe:"region",locals:[],cur:null,app:null,start:false,setPage:"about",set2:"work",dlg:null,cmd:["Microsoft Windows [Version "+d.osVer+"]","(c) Practice Lab. Type help for commands.",""],work:[],userApps:[],ssid:"",msg:"",pick:""};
  if(d.spare){v.stage="lock";v.oobe="done";v.locals=[{name:"LocalAdmin",pw:LOCAL_ADMIN_PW,admin:true},{name:"Student",pw:STUDENT_PW,admin:false}];v.ssid="Practice-Corp";}
  return v;
}
function ensureVm(d){if(!d.vm){d.vm=freshVm(d);}return d.vm;}
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
  d.state=d.autopilot?"registered":"unmanaged";
  d.name=d.spare?"DESKTOP-SP26042":"(not set up)";
  S.vmIn={};ensureVm(d);
}

/* ----- small UI helpers ----- */
function wb(label,a,o){o=o||{};var dd="",k;if(o.d){for(k in o.d){dd+=' data-'+k+'="'+esc(o.d[k])+'"';}}return '<button type="button" class="wbtn'+(o.pri?' pri':'')+'" data-a="'+a+'"'+dd+(o.dis?' disabled':'')+'>'+esc(label)+'</button>';}
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
    if(d.join!=="joined"){g.step="err";g.err="We can't sign you in with this account because this device isn't joined to Microsoft Entra ID.";return;}
    vmLog(u,"Windows Sign In","Success",mfa,ca);
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
  if(u.blocked){v.msg="Your account has been disabled (error 50057).";return;}
  if(u.mustChange){v.msg="Your password must be updated. Use Other user to sign in and change it.";return;}
  if(mfaNeeded()){
    v.dlg={mode:"lock",step:u.methods.some(function(m){return !m.sus;})?"mfa":"reg",uid:u.id,err:""};
    v.msg="";S.vmIn={};return;
  }
  v.cur={kind:"work",uid:u.id};v.stage="desktop";v.pick="";v.msg="";v.app=null;v.start=false;S.vmIn={};S.flags.vmWorkSignin=true;
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
  else if(v.app==="cmd"){win=cmdHtml(d);}
  else if(v.app==="portal"){win=portalHtml(d);}
  var apps=[["settings","Settings"],["cmd","Command Prompt"]];
  if(enrolledOk(d)){apps.push(["portal","Company Portal"]);}
  var ia=installedApps(d),extra=ia.filter(function(n){return ["Microsoft Edge","Notepad","Windows Security","Company Portal"].indexOf(n)<0;});
  if(v.start){
    start='<div class="startmenu"><div class="sgrid">'+apps.map(function(a){return '<button type="button" class="sapp" data-a="vmOpen" data-app="'+a[0]+'"><span class="sic">'+esc(a[1][0])+'</span>'+esc(a[1])+'</button>';}).join("")+
      extra.map(function(n){return '<button type="button" class="sapp" data-a="vmFake" data-n="'+esc(n)+'"><span class="sic">'+esc(n[0])+'</span>'+esc(n)+'</button>';}).join("")+'</div>'+
      '<div class="sfoot"><span><span class="av">'+esc((name||"?")[0])+'</span> '+esc(name)+'</span><span>'+wb("Sign out","vmSignout")+wb("Restart","vmRestart")+'</span></div></div>';
  }
  return '<div class="wall"></div><div class="dicons"><div class="dicon"><span class="sic">&#9851;</span>Recycle Bin</div>'+(enrolledOk(d)?'<button type="button" class="dicon" data-a="vmOpen" data-app="portal"><span class="sic">C</span>Company Portal</button>':'')+'</div>'+win+start+
   '<div class="taskbar"><div class="tcenter"><button type="button" class="tbtn" data-a="vmStart" aria-label="Start">&#9638;</button><button type="button" class="tsearch" data-a="vmStart">Search</button><button type="button" class="tbtn'+(v.app==="settings"?' on':'')+'" data-a="vmOpen" data-app="settings" aria-label="Settings">&#9881;</button><button type="button" class="tbtn'+(v.app==="cmd"?' on':'')+'" data-a="vmOpen" data-app="cmd" aria-label="Command Prompt">&gt;_</button></div><div class="ttray">'+esc(d.vm.ssid||"No network")+' &nbsp; 9:41 AM</div></div>'+
   (v.dlg?'<div class="vmdlg">'+dlgInner(d)+'</div>':'');
}
A.vmStart=function(){var v=curDev().vm;v.start=!v.start;};
A.vmOpen=function(ds){var v=curDev().vm;v.app=ds.app;v.start=false;v.msg="";if(ds.app==="settings"){v.setPage="about";}};
A.vmClose=function(){var v=curDev().vm;v.app=null;v.dlg=null;v.msg="";};
A.vmFake=function(ds){toast("Opened "+ds.n+" (simulated).");curDev().vm.start=false;};
A.vmSignout=function(){var v=curDev().vm;v.stage="lock";v.cur=null;v.app=null;v.start=false;v.pick="";v.dlg=null;S.vmIn={};};
A.vmRestart=function(){var d=curDev(),v=d.vm;v.stage="lock";v.cur=null;v.app=null;v.start=false;v.pick="";v.dlg=null;S.vmIn={};
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
      if(d.join){acct='<div class="wacct"><b>Connected to Practice Tenant\'s Microsoft Entra ID</b><span class="mono">'+esc(u?upn(u):"")+'</span><span>'+(d.join==="joined"?"Joined":"Registered")+'</span><div class="wbtns">'+wb("Info","vmSet2",{d:{k:"workinfo"}})+(d.join==="registered"?wb("Disconnect","vmDisconnect"):"")+'</div></div>';}
      if(sub==="workinfo"&&d.join){
        body='<h2>Accounts &gt; Access work or school</h2>'+tabs+'<div class="wacct"><b>Connection info</b><dl class="wdl"><dt>Join type</dt><dd>'+(d.join==="joined"?"Microsoft Entra joined":"Microsoft Entra registered")+'</dd><dt>Areas managed by Practice Tenant</dt><dd>'+(enrolledOk(d)?"Device management (Intune)":"None. This device is not managed.")+'</dd><dt>Last attempted sync</dt><dd>'+esc(d.sync||"-")+'</dd></dl>'+
          (d.join==="joined"&&!enrolledOk(d)&&d.mdmWhy?'<div class="wmsg bad">'+esc(d.mdmWhy)+'</div>':"")+'<div class="wbtns">'+wb("Sync","vmSync",{pri:1})+wb("Back","vmSet2",{d:{k:"work"}})+'</div></div>';
      }else{
        body='<h2>Accounts &gt; Access work or school</h2>'+tabs+'<p>Get access to resources like email, apps, and the network. Connecting means your work or school might control some things on this device.</p><div class="srow"><span>Add a work or school account</span>'+wb("Connect","vmConnect",{pri:1})+'</div>'+(v.msg?'<div class="wmsg bad" role="alert">'+esc(v.msg)+'</div>':"")+acct;
      }
    }else{
      body='<h2>Accounts &gt; Your info</h2>'+tabs+'<dl class="wdl"><dt>Signed in as</dt><dd>'+esc(name)+'</dd><dt>Account type</dt><dd>'+(v.cur&&v.cur.kind==="work"?"Work account (Microsoft Entra ID)":isAdminSess(d)?"Local administrator":"Local standard user")+'</dd></dl>';
    }
  }
  return '<div class="win"><div class="tb"><span>Settings</span><button type="button" class="wx" data-a="vmClose" aria-label="Close">&#10005;</button></div><div class="set"><nav class="setnav"><div class="setuser"><span class="av">'+esc((name||"?")[0])+'</span>'+esc(name)+'</div>'+
    nav.map(function(n){return '<button type="button" class="'+(pg===n[0]?'on':'')+'" data-a="vmSetPage" data-p="'+n[0]+'">'+esc(n[1])+'</button>';}).join("")+'</nav><div class="setbody">'+body+'</div></div></div>';
}
A.vmSetPage=function(ds){var v=curDev().vm;v.setPage=ds.p;v.msg="";if(ds.p==="accounts"){v.set2="work";}};
A.vmSet2=function(ds){var v=curDev().vm;v.set2=ds.k;v.msg="";};
A.vmConnect=function(){var d=curDev(),v=d.vm;v.msg="";
  if(!isAdminSess(d)){v.msg="You need to be signed in as an administrator to connect this device. Sign out and sign in as LocalAdmin.";return;}
  if(d.join){v.msg="This device is already "+(d.join==="joined"?"joined to Microsoft Entra ID":"registered")+". Disconnect the work account first.";return;}
  S.vmIn={};v.dlg={mode:"register",step:"email",uid:null,err:""};
};
A.vmDisconnect=function(){var d=curDev();d.join="";d.joinUser=null;audit("Delete device registration",d.name,"Device","Core Directory");toast("Work account removed from this device.");};
A.vmSync=function(){var d=curDev(),v=d.vm,u=d.joinUser?U(d.joinUser):null;
  if(d.state==="wiping"){resetDevice(d);toast("The wipe command arrived. The laptop restarted into setup.");return;}
  if(d.join==="joined"&&u&&d.state!=="enrolled"){var r=tryEnroll(d,u);if(r.ok){toast("Sync succeeded. The laptop is now enrolled in Intune.");S.flags.vmSync=true;}else{d.mdmWhy=r.why;toast("Sync failed. See the message under Connection info.");}return;}
  if(d.join==="joined"&&enrolledOk(d)){d.sync="Just now";S.flags.vmSync=true;toast("Sync completed. New policies and apps are applied.");return;}
  toast("Nothing to sync. This device isn't managed.");
};

/* ----- Command Prompt ----- */
function dsreg(d){
  var j=d.join==="joined",r=d.join==="registered",u=d.joinUser?U(d.joinUser):null,L=[];
  var mdm=(j&&u&&inMdmScope(u))?"https://enrollment.manage.microsoft.com/enrollmentserver/discovery.svc":"";
  var comp=d.name==="(not set up)"?compNameFor(d):d.name;
  L.push("+----------------------------------------------------------------------+","| Device State                                                         |","+----------------------------------------------------------------------+","");
  L.push("             AzureAdJoined : "+(j?"YES":"NO"),"          EnterpriseJoined : NO","              DomainJoined : NO","               Device Name : "+comp,"");
  if(j){L.push("+----------------------------------------------------------------------+","| Device Details                                                       |","+----------------------------------------------------------------------+","","                  DeviceId : "+guidFor(d),"                TpmProtected : YES","");
    L.push("+----------------------------------------------------------------------+","| Tenant Details                                                       |","+----------------------------------------------------------------------+","","                TenantName : Practice Tenant","                  TenantId : "+TENANT,"                    MdmUrl : "+mdm,"               MdmTouUrl : "+(mdm?"https://portal.manage.microsoft.com/TermsofUse.aspx":""),"");}
  L.push("+----------------------------------------------------------------------+","| User State                                                           |","+----------------------------------------------------------------------+","","                    NgcSet : NO","           WorkplaceJoined : "+(r?"YES":"NO"),"");
  L.push("+----------------------------------------------------------------------+","| SSO State                                                            |","+----------------------------------------------------------------------+","","                AzureAdPrt : "+(j&&d.vm.cur&&d.vm.cur.kind==="work"?"YES":"NO"),"");
  return L;
}
function runCmd(d,line){
  var c=line.trim().toLowerCase(),v=d.vm,out=[],nm=sessName(d),comp=d.name==="(not set up)"?compNameFor(d):d.name;
  if(!c){return out;}
  if(c==="help"){out=["Commands in this lab:","  dsregcmd /status   Show Entra join state","  whoami             Show the signed-in user","  hostname           Show the computer name","  ipconfig [/all]    Show network and DHCP details","  cls                Clear the screen"];}
  else if(c==="dsregcmd /status"||c==="dsregcmd"){out=dsreg(d);if(d.join){S.flags.vmDsreg=true;}}
  else if(c==="whoami"){out=[v.cur&&v.cur.kind==="work"?"azuread\\"+(U(v.cur.uid).name.replace(/\s/g,"").toLowerCase()):comp.toLowerCase()+"\\"+nm.toLowerCase()];}
  else if(c==="hostname"){out=[comp];}
  else if(c==="ipconfig"||c==="ipconfig /all"){
    out=["Windows IP Configuration","","Wireless LAN adapter Wi-Fi:","","   Connection-specific DNS Suffix  . : "+(d.join==="joined"?"practice.local":""),"   IPv4 Address. . . . . . . . . . . : "+ipFor(d),"   Subnet Mask . . . . . . . . . . . : 255.255.255.0","   Default Gateway . . . . . . . . . : 192.168.20.1"];
    if(c==="ipconfig /all"){out.push("   DHCP Enabled. . . . . . . . . . . : Yes","   DHCP Server . . . . . . . . . . . : 192.168.20.1","   Lease Obtained. . . . . . . . . . : Thursday, October 8, 2026 9:12:04 AM","   Lease Expires . . . . . . . . . . : Thursday, October 8, 2026 5:12:04 PM");}
  }else if(c==="cls"){v.cmd=[];return null;}
  else{out=["'"+line.trim().split(" ")[0]+"' is not recognized as an internal or external command,","operable program or batch file."];}
  return out;
}
function cmdHtml(d){
  var v=d.vm,nm=sessName(d),path="C:\\Users\\"+(v.cur&&v.cur.kind==="work"?U(v.cur.uid).name.replace(/\s/g,"").toLowerCase():nm)+">";
  return '<div class="win cmdwin"><div class="tb"><span>Command Prompt</span><button type="button" class="wx" data-a="vmClose" aria-label="Close">&#10005;</button></div><pre class="cmdout">'+esc(v.cmd.join("\n"))+'</pre><div class="cmdin"><span>'+esc(path)+'</span><input type="text" data-vi="cmdin" data-enter="vmCmd" autocomplete="off" aria-label="Command" value="'+esc(S.vmIn.cmdin||"")+'" placeholder="try: dsregcmd /status"><button type="button" class="wbtn pri" data-a="vmCmd">Run</button></div></div>';
}
A.vmCmd=function(){var d=curDev(),v=d.vm,line=S.vmIn.cmdin||"";S.vmIn.cmdin="";if(!line.trim()){return;}
  var nm=sessName(d),path="C:\\Users\\"+(v.cur&&v.cur.kind==="work"?U(v.cur.uid).name.replace(/\s/g,"").toLowerCase():nm)+">";
  var out=runCmd(d,line);if(out===null){return;}
  v.cmd.push(path+line.trim());v.cmd=v.cmd.concat(out);v.cmd.push("");if(v.cmd.length>400){v.cmd=v.cmd.slice(-300);}
};

/* ----- Company Portal ----- */
function portalHtml(d){
  var u=d.userId?U(d.userId):null,avail=S.apps.filter(function(a){return a.intent==="available"&&d.userId&&applies(a,d.userId);});
  var cmp=d.compl?(d.compl.state==="Compliant"?'<div class="wmsg ok">This device meets your organization\'s requirements.</div>':'<div class="wmsg bad">This device doesn\'t meet requirements: '+esc(d.compl.rows.filter(function(r){return r.state!=="Compliant";}).map(function(r){return r.reason;}).join("; "))+'</div>'):"";
  return '<div class="win"><div class="tb"><span>Company Portal</span><button type="button" class="wx" data-a="vmClose" aria-label="Close">&#10005;</button></div><div class="setbody"><h2>'+esc(d.name)+'</h2><p>Signed in as '+esc(u?upn(u):"")+'</p>'+cmp+
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
  return "Open Start, then Settings > Accounts > Access work or school. Command Prompt has dsregcmd /status.";
}
function vmSide(d){
  var v=d.vm,rows="";
  v.locals.forEach(function(l){rows+='<tr><td>'+esc(l.name)+'</td><td class="mono">'+esc(l.pw)+'</td></tr>';});
  live().forEach(function(u){rows+='<tr><td class="mono">'+esc(upn(u))+'</td><td class="mono">'+esc(u.pw||"-")+(u.mustChange?' <small>(must change)</small>':'')+'</td></tr>';});
  return '<div class="tile"><h3>What to do</h3><p>'+esc(vmTip(d))+'</p></div><div class="tile" style="margin-top:12px"><h3>Practice credentials</h3><p class="psub">Normally these come from a ticket or the user. Local accounts first, then work accounts.</p><div class="tbl"><table style="min-width:0"><thead><tr><th>Account</th><th>Password</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
    '<div class="tile" style="margin-top:12px"><h3>Laptop status</h3>'+grid([["Name",esc(d.name)],["Entra",d.join==="joined"?"Joined":d.join==="registered"?"Registered":"Not connected"],["Intune",d.state==="enrolled"?"Managed":"Not managed"]])+'</div>';
}
function vmPage(){
  var d=curDev();
  if(!d||!(d.autopilot||d.vm||d.spare)){S.page="d2";d=D("d2");}
  var v=ensureVm(d);
  if(d.state==="wiping"){resetDevice(d);v=d.vm;toast("The Intune wipe command arrived. The laptop restarted into setup.");}
  var scr=v.stage==="oobe"?oobeHtml(d):v.stage==="lock"?lockHtml(d):desktopHtml(d);
  return '<h1 class="ptitle">Windows laptop (virtual machine)'+info("oobe")+'</h1><p class="psub">'+esc(d.maker+" "+d.model)+', serial <span class="mono">'+esc(d.serial)+'</span>. Whatever you do here is reflected in Entra and Intune.</p>'+
    '<div class="vmbar">'+B("Reset this PC","vmReset",{sm:1})+'</div><div class="vmgrid"><div class="laptop" id="laptop"><div class="lwrap"><div class="lscale"><div class="vm" id="vmscreen">'+scr+'</div><div class="lbase" aria-hidden="true"></div></div></div></div><aside class="vmside">'+vmSide(d)+'</aside></div>';
}
A.openVm=function(ds){var d=D(ds.id);if(!d){return;}ensureVm(d);S.portal="vm";S.page=d.id;resetNav();};
