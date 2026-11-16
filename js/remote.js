"use strict";
/* =============== REMOTE SUPPORT CONSOLE =============== */
/* A generic remote support tool, modeled on how common products work. The machines and users are fake.
   Access: a searchable machine list with detail tabs. Support: a short code a user types to let you in.
   A session has a toolbar (View, Actions, Commands, Toolbox, Participants, Chat, Info) and a Backstage view. */
var RMACH=[
  {id:"dc01",name:"DC01",grp:"servers",os:"Windows Server 2022",role:"Domain controller",ip:"10.10.0.5",user:"",online:true,seen:"Now"},
  {id:"dc01b",name:"DC01-BACKUP",grp:"servers",os:"Windows Server 2022",role:"Backup domain controller",ip:"10.10.0.6",user:"",online:true,seen:"Now"},
  {id:"files01",name:"FILES01",grp:"servers",os:"Windows Server 2022",role:"File server",ip:"10.10.0.20",user:"",online:true,seen:"Now"},
  {id:"d1",name:"LAPTOP-SO-01",grp:"laptops",os:"Windows 10 Pro",role:"Laptop",ip:"10.10.1.41",user:"Sam Ortiz",sam:"sam.ortiz",online:true,seen:"Now"},
  {id:"d3",name:"DESKTOP-SP26042",grp:"laptops",os:"Windows 11 Pro",role:"Spare laptop",ip:"-",user:"",online:false,seen:"3 days ago"}
];
var RGROUPS=[["all","All Machines"],["servers","Servers"],["laptops","Laptops"],["desktops","Desktops"],["support","Support sessions"]];
var RSVC=["Windows Update","DNS Client","Print Spooler"];
var RTPL={
  server:{procs:[["System",0.3,60],["lsass.exe",1.2,95],["svchost.exe",0.8,110],["dns.exe",0.6,70],["services.exe",0.1,12],["ConnectAgent.exe",0.4,38]],sw:[["Support Agent","23.4.0","Practice IT"],["Windows Defender","4.18","Microsoft"]]},
  laptop:{procs:[["chrome.exe",5.5,640],["Teams.exe",3.8,410],["OneDrive.exe",1.1,120],["explorer.exe",0.9,95],["MsMpEng.exe",2.6,220],["ConnectAgent.exe",0.4,38]],sw:[["Support Agent","23.4.0","Practice IT"],["Microsoft 365 Apps","16.0","Microsoft"],["Google Chrome","131.0","Google"],["Microsoft Teams","24.1","Microsoft"],["Dell Command Update","5.4","Dell"]]}
};
var RBADP={n:"DriverBoost.exe",cpu:92,mem:812,bad:true},RBADS=["DriverBoost Updater","3.1","Unknown publisher",true];
function remoteBlank(){return {sel:"dc01",grp:"all",tab:"start",sess:null,support:null,audit:[],procs:{},sw:{},notes:{},hist:{},chat:{},flags:{}};}
function R(){if(!S.remote){S.remote=remoteBlank();}return S.remote;}
/* Machines the learner imaged and put the support agent on show up here too. */
function rAll(){
  var extra=(S.devices||[]).filter(function(d){return d.fromBench&&d.agent;}).map(function(d){
    return {id:d.id,name:d.name==="(not set up)"?compNameFor(d):d.name,grp:d.kind==="desktop"?"desktops":"laptops",os:d.os,role:d.kind==="desktop"?"Desktop":"Laptop",ip:"10.10.1."+(60+(+String(d.id).replace(/\D/g,"")||0)),user:"",online:true,seen:"Now"};});
  return RMACH.concat(extra);
}
function rMach(id){return rAll().filter(function(m){return m.id===id;})[0];}
function rLap(m){return m&&(m.grp==="laptops"||m.grp==="desktops");}
function rProcs(id){var r=R(),m=rMach(id);if(!r.procs[id]){r.procs[id]=RTPL[rLap(m)?"laptop":"server"].procs.map(function(p){return {n:p[0],cpu:p[1],mem:p[2]};});}return r.procs[id];}
function rSw(id){var r=R(),m=rMach(id);if(!r.sw[id]){r.sw[id]=RTPL[rLap(m)?"laptop":"server"].sw.map(function(p){return {n:p[0],v:p[1],p:p[2]};});}return r.sw[id];}
function rAudit(mid,what){var r=R();r.audit.unshift({m:mid,w:what,n:r.audit.length+1});if(r.audit.length>80){r.audit.pop();}}
function rBreakLaptop(){var r=R();r.procs.d1=RTPL.laptop.procs.map(function(p){return {n:p[0],cpu:p[1],mem:p[2]};});r.procs.d1.push({n:RBADP.n,cpu:RBADP.cpu,mem:RBADP.mem,bad:true});r.sw.d1=RTPL.laptop.sw.map(function(p){return {n:p[0],v:p[1],p:p[2]};});r.sw.d1.push({n:RBADS[0],v:RBADS[1],p:RBADS[2],bad:true});}
/* ---------- commands (shared by the Commands tab, Backstage and the session) ---------- */
function rExec(mid,line,asUser){
  var m=rMach(mid),c=String(line||"").trim(),lc=c.toLowerCase(),p=rProcs(mid),mm;
  if(!c){return [];}
  if(lc==="help"){return ["Supported: hostname, whoami, ipconfig, tasklist, taskkill /im <name> /f, systeminfo, gpupdate /force"];}
  if(lc==="hostname"){return [m.name];}
  if(lc==="whoami"){return [asUser&&m.sam?"practice\\"+m.sam:"nt authority\\system"];}
  if(lc==="ipconfig"){return ["Ethernet adapter Ethernet:","   IPv4 Address. . . . . . . . . . : "+m.ip,"   Default Gateway . . . . . . . . : 10.10.0.1"];}
  if(lc==="tasklist"){if(mid==="d1"){R().flags.cpu=true;}return ["Image Name                PID   Mem Usage"].concat(p.map(function(x,i){return (x.n+"                         ").slice(0,24)+"  "+(1000+i*212)+"  "+x.mem+" K";}));}
  if(lc==="systeminfo"){return ["Host Name:     "+m.name,"OS Name:       Microsoft "+m.os,"System Boot:   Today, 06:41","Domain:        practice.local"];}
  if(lc==="gpupdate /force"){return ["Updating policy...","Computer Policy update has completed successfully.","User Policy update has completed successfully."];}
  mm=c.match(/^taskkill\s+\/im\s+(\S+)\s+\/f$/i);
  if(mm){var i,ok=false;for(i=0;i<p.length;i++){if(p[i].n.toLowerCase()===mm[1].toLowerCase()){if(p[i].bad){R().flags.killed=true;}p.splice(i,1);ok=true;break;}}
    rAudit(mid,"taskkill "+mm[1]);return [ok?'SUCCESS: The process "'+mm[1]+'" has been terminated.':'ERROR: The process "'+mm[1]+'" not found.'];}
  return ["'"+c.split(" ")[0]+"' is not recognized as an internal or external command."];
}
function rRun(mid,line,asUser){var r=R(),out=rExec(mid,line,asUser),h=r.hist[mid]||(r.hist[mid]=[]);if(!String(line).trim()){return;}h.push("> "+line);out.forEach(function(o){h.push(o);});if(h.length>60){h.splice(0,h.length-60);}}
/* ---------- helpers ---------- */
function rDot(on){return '<span class="rdot'+(on?' on':'')+'" title="'+(on?'Online':'Offline')+'"></span>';}
function rRows(){
  var r=R(),q=(S.q||"").toLowerCase(),g=r.grp,list;
  list=rAll().filter(function(m){return g==="all"||m.grp===g;}).map(function(m){return {m:m,guest:false};});
  if((g==="all"||g==="support")&&r.support&&r.support.state==="joined"){list.push({m:rMach("d1"),guest:true});}
  if(g==="support"){list=list.filter(function(x){return x.guest;});}
  return list.filter(function(x){var m=x.m;return !q||(m.name+" "+m.user+" "+m.os+" "+m.role+" "+m.ip).toLowerCase().indexOf(q)>-1;});
}
function rCount(g){return g==="all"?rAll().length:g==="support"?((R().support&&R().support.state==="joined")?1:0):rAll().filter(function(m){return m.grp===g;}).length;}
function rRail(act){return '<nav class="rrail" aria-label="Remote support"><b>Remote</b>'+[["support","Support"],["console","Access"]].map(function(x){return '<button type="button" data-a="go" data-p="remote" data-pg="'+x[0]+'"'+(act===x[0]?' aria-current="true"':'')+'>'+esc(x[1])+'</button>';}).join("")+'<span class="rsp"></span><small>Generic remote support console. Fake machines and users.</small></nav>';}
function rGroups(){var r=R();return '<div class="rgrp"><div class="rh">Session groups</div>'+RGROUPS.map(function(g){return '<button type="button" data-a="rGrp" data-id="'+g[0]+'"'+(r.grp===g[0]?' aria-current="true"':'')+'><span>'+esc(g[1])+'</span><em>'+rCount(g[0])+'</em></button>';}).join("")+'</div>';}
function rList(){
  var rows=rRows(),r=R(),sel=r.sel;
  return '<div class="rlist"><div class="rtool"><button type="button" class="rb pri" data-a="rJoin" data-id="'+esc(sel)+'">Join</button><button type="button" class="rb" data-a="rTab" data-t="commands">Commands</button><button type="button" class="rb" data-a="rTab" data-t="procs">Processes</button><span class="rsp"></span><input id="rq" data-q="1" type="text" autocomplete="off" placeholder="Search machines" aria-label="Search machines" value="'+esc(S.q)+'"></div>'+
    '<table class="rtbl"><thead><tr><th></th><th>Name</th><th>Last user</th><th>Operating system</th><th>IP address</th><th>Last seen</th></tr></thead><tbody>'+
    (rows.length?rows.map(function(x){var m=x.m;return '<tr class="'+(sel===m.id?'sel':'')+'" data-a="rSel" data-id="'+m.id+'" tabindex="0"><td>'+rDot(m.online)+'</td><td><b>'+esc(x.guest?"Support: "+(m.user||m.name):m.name)+'</b></td><td>'+esc(m.user||"(no user)")+'</td><td>'+esc(m.os)+'</td><td>'+esc(m.ip)+'</td><td>'+esc(m.seen)+'</td></tr>';}).join(""):'<tr><td colspan="6" class="rnone">No machines match "'+esc(S.q)+'".</td></tr>')+'</tbody></table></div>';
}
var RTABS=[["start","Start"],["general","General"],["procs","Processes"],["sw","Software"],["events","Event log"],["commands","Commands"],["notes","Notes"],["audit","Audit"]];
function rDetail(){
  var r=R(),m=rMach(r.sel),t=r.tab,h='<div class="rdet"><div class="rdh"><b>'+esc(m.name)+'</b> '+rDot(m.online)+'<span>'+esc(m.role)+'</span></div><div class="rtabs" role="tablist">'+RTABS.map(function(x){return '<button type="button" role="tab" data-a="rTab" data-t="'+x[0]+'"'+(t===x[0]?' aria-current="true"':'')+'>'+esc(x[1])+'</button>';}).join("")+'</div><div class="rdb">';
  if(t==="start"){
    h+=m.online?'<p>This machine has the support agent installed. Join to see and control it'+(m.user?', or join Backstage to work without disturbing '+esc(m.user)+'.':'.')+'</p><div class="rbtns"><button type="button" class="rb pri" data-a="rJoin" data-id="'+m.id+'">Join</button>'+(m.user?'<button type="button" class="rb" data-a="rJoin" data-id="'+m.id+'" data-bs="1">Join Backstage</button>':'')+'</div>':
      '<p>This machine is offline, so there is no session to join. Last seen '+esc(m.seen)+'.</p><div class="rbtns"><button type="button" class="rb" data-a="rWake" data-id="'+m.id+'">Wake</button></div>';
  }else if(t==="general"){
    h+='<dl class="rkv">'+[["Name",m.name],["Role",m.role],["Operating system",m.os],["IP address",m.ip],["Logged-on user",m.user||"(none)"],["Agent version","23.4.0"],["Status",m.online?"Online":"Offline, last seen "+m.seen]].map(function(x){return '<dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd>';}).join("")+'</dl>';
  }else if(t==="procs"){
    h+=m.online?'<table class="rtbl small"><thead><tr><th>Name</th><th>CPU %</th><th>Memory (MB)</th><th></th></tr></thead><tbody>'+rProcs(m.id).slice().sort(function(a,b){return b.cpu-a.cpu;}).map(function(p){return '<tr><td>'+esc(p.n)+'</td><td'+(p.cpu>50?' class="hot"':'')+'>'+p.cpu+'</td><td>'+p.mem+'</td><td><button type="button" class="rb sm" data-a="rKill" data-id="'+m.id+'" data-n="'+esc(p.n)+'">Kill</button></td></tr>';}).join("")+'</tbody></table>':'<p class="rnone">Offline: no process list.</p>';
  }else if(t==="sw"){
    h+=m.online?'<table class="rtbl small"><thead><tr><th>Name</th><th>Version</th><th>Publisher</th><th></th></tr></thead><tbody>'+rSw(m.id).map(function(s){return '<tr><td>'+esc(s.n)+'</td><td>'+esc(s.v)+'</td><td>'+esc(s.p)+'</td><td>'+(s.n==="Support Agent"?'':'<button type="button" class="rb sm" data-a="rUninst" data-id="'+m.id+'" data-n="'+esc(s.n)+'">Uninstall</button>')+'</td></tr>';}).join("")+'</tbody></table>':'<p class="rnone">Offline: no software list.</p>';
  }else if(t==="events"){
    h+='<table class="rtbl small"><thead><tr><th>Time</th><th>Level</th><th>Source</th><th>Message</th></tr></thead><tbody>'+[["06:41","Information","Kernel-General","The operating system started."],["06:44","Information","Service Control Manager","The Windows Update service entered the running state."],[m.id==="d1"?"09:02":"08:15",m.id==="d1"?"Warning":"Information",m.id==="d1"?"Application Hang":"NTDS",m.id==="d1"?"A program stopped responding for 30 seconds.":"Directory service is running normally."]].map(function(e){return '<tr><td>'+e[0]+'</td><td>'+e[1]+'</td><td>'+esc(e[2])+'</td><td>'+esc(e[3])+'</td></tr>';}).join("")+'</tbody></table>';
  }else if(t==="commands"){
    h+=m.online?rTerm(m.id,false,"rRunCmd"):'<p class="rnone">Offline: commands cannot run.</p>';
  }else if(t==="notes"){
    h+='<textarea id="rnote" rows="5" aria-label="Machine notes">'+esc(r.notes[m.id]||"")+'</textarea><div class="rbtns"><button type="button" class="rb pri" data-a="rNote" data-id="'+m.id+'">Save note</button></div>';
  }else if(t==="audit"){
    var a=r.audit.filter(function(x){return x.m===m.id;});
    h+=a.length?'<ul class="raud">'+a.map(function(x){return '<li>'+esc(x.w)+'</li>';}).join("")+'</ul>':'<p class="rnone">Nothing recorded for this machine yet.</p>';
  }
  return h+'</div></div>';
}
function rTerm(mid,user,act){return '<div class="rterm" aria-label="Command output">'+((R().hist[mid]||[]).map(function(l){return '<div>'+esc(l)+'</div>';}).join("")||'<div class="dim">Type a command and press Enter. Try: help</div>')+'</div><div class="rcmdrow"><span>'+(user?'C:\\Users\\'+esc((rMach(mid).sam||"user"))+'>':'SYSTEM&gt;')+'</span><input id="rcmd" data-enter="'+act+'" type="text" autocomplete="off" spellcheck="false" aria-label="Command"></div>';}
PAGES["remote.console"]=function(){return '<div class="rc">'+rRail("console")+'<div class="rbody">'+rGroups()+'<div class="rmain">'+rList()+rDetail()+'</div></div></div>';};
PAGES["remote.support"]=function(){
  var r=R(),s=r.support,h='<div class="rc">'+rRail("support")+'<div class="rbody"><div class="rsup"><h2>Support session</h2><p>Use this when a machine has no agent, or a user is working from home. You create a session, the user types its short code, and you can then join.</p>';
  if(!s){h+='<div class="rbtns"><button type="button" class="rb pri" data-a="rSupNew">Create support session</button></div>';}
  else{h+='<div class="rcode"><span>Session code</span><b>'+esc(s.code)+'</b><small>Name: '+esc(s.name)+'</small></div>'+
    (s.state==="waiting"?'<p>Tell the user: open the support page and enter <b>'+esc(s.code)+'</b>. Nothing happens until they do.</p><div class="rbtns"><button type="button" class="rb" data-a="rSupJoin">Simulate: the user enters the code</button></div>':'<p>'+esc(s.name)+' joined. The session is listed under Support sessions.</p><div class="rbtns"><button type="button" class="rb pri" data-a="rJoin" data-id="d1" data-guest="1">Join '+esc(s.name)+'</button></div>');}
  return h+'</div></div></div>';
};
/* ---------- the session ---------- */
function rPanel(se,m){
  var p=se.panel;if(!p){return "";}
  function btn(t,a,extra,on){return '<button type="button" class="rb'+(on?' on':'')+'" data-a="'+a+'" '+(extra||"")+'>'+esc(t)+'</button>';}
  var b='';
  if(p==="view"){b='<h4>Quality</h4>'+["Auto","High","Low"].map(function(q){return btn(q,"rView",'data-k="quality" data-v="'+q+'"',se.quality===q);}).join("")+'<h4>Zoom</h4>'+["Fit","100%"].map(function(z){return btn(z,"rView",'data-k="zoom" data-v="'+z+'"',se.zoom===z);}).join("")+'<h4>Logon session</h4>'+btn("User session","rLogon",'data-v="user"',se.logon==="user")+btn("[Backstage]","rLogon",'data-v="backstage"',se.logon==="backstage")+'<p class="dim">Backstage runs in the background. The user sees nothing.</p>';}
  else if(p==="actions"){b='<h4>Essentials</h4>'+btn("Send Ctrl-Alt-Del","rAct",'data-v="cad"')+btn("Reboot normal","rAct",'data-v="reboot"')+btn("Reboot safe mode","rAct",'data-v="safe"')+'<h4>Control</h4>'+btn("Block guest input","rAct",'data-v="block"',se.blocked)+btn("Blank guest monitor","rAct",'data-v="blank"',se.blank)+btn("Suspend my input","rAct",'data-v="susp"',se.susp);}
  else if(p==="commands"){b=(se.logon==="backstage")?'<p class="dim">You are in Backstage. Type commands in the terminal on the main screen.</p>':(se.app==="cmd"?'<p class="dim">The Command Prompt is already open on the user screen.</p>':rTerm(m.id,true,"rSessCmd"));}
  else if(p==="toolbox"){b='<h4>Tools</h4>'+btn("Task Manager","rApp",'data-v="taskmgr"')+btn("Command Prompt","rApp",'data-v="cmd"')+btn("Services","rApp",'data-v="svc"')+'<h4>Transfer</h4>'+btn("Send file","rApp",'data-v="file"')+btn("Screenshot","rApp",'data-v="shot"');}
  else if(p==="people"){b='<h4>Participants</h4><ul class="raud"><li><b>You</b> (host), admin</li>'+(m.user?'<li>'+esc(m.user)+' (guest)</li>':'<li>No user is signed in on this machine.</li>')+'</ul>';}
  else if(p==="chat"){var ch=R().chat[m.id]||[];b='<h4>Chat</h4><div class="rterm">'+(ch.map(function(c){return '<div><b>'+esc(c[0])+':</b> '+esc(c[1])+'</div>';}).join("")||'<div class="dim">No messages yet.</div>')+'</div><div class="rcmdrow"><span>Say</span><input id="rchat" data-enter="rChat" type="text" autocomplete="off" aria-label="Chat message"></div>';}
  else if(p==="info"){b='<h4>Machine</h4><dl class="rkv">'+[["Name",m.name],["OS",m.os],["IP",m.ip],["User",m.user||"(none)"],["Quality",se.quality],["Session",se.logon==="backstage"?"Backstage":"User session"]].map(function(x){return '<dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd>';}).join("")+'</dl>';}
  return '<div class="rpanel" role="dialog" aria-label="'+esc(p)+'">'+b+'</div>';
}
function rScreen(se,m){
  if(se.logon==="backstage"){return '<div class="rscr bs"><div class="bst">Backstage: a background session on '+esc(m.name)+'. The user cannot see this.</div>'+rTerm(m.id,false,"rSessCmd")+'</div>';}
  var apps='',pr=rProcs(m.id).slice().sort(function(a,b){return b.cpu-a.cpu;});
  if(se.app==="taskmgr"){apps='<div class="rwinx"><div class="rwt">Task Manager <button type="button" data-a="rApp" data-v="">&times;</button></div><table class="rtbl small light"><thead><tr><th>Name</th><th>CPU</th><th>Memory</th><th></th></tr></thead><tbody>'+pr.map(function(p){return '<tr><td>'+esc(p.n)+'</td><td'+(p.cpu>50?' class="hot"':'')+'>'+p.cpu+'%</td><td>'+p.mem+' MB</td><td><button type="button" class="rb sm" data-a="rKill" data-id="'+m.id+'" data-n="'+esc(p.n)+'">End task</button></td></tr>';}).join("")+'</tbody></table></div>';}
  else if(se.app==="cmd"){apps='<div class="rwinx"><div class="rwt">Command Prompt <button type="button" data-a="rApp" data-v="">&times;</button></div>'+rTerm(m.id,true,"rSessCmd")+'</div>';}
  else if(se.app==="svc"){apps='<div class="rwinx"><div class="rwt">Services <button type="button" data-a="rApp" data-v="">&times;</button></div><ul class="raud">'+RSVC.map(function(s){return '<li>'+esc(s)+': Running</li>';}).join("")+'</ul></div>';}
  var note=se.blank?'<div class="rflag">Guest monitor is blanked</div>':(se.blocked?'<div class="rflag">Guest input is blocked</div>':'');
  return '<div class="rscr"><div class="rdesk">'+note+(m.user?'':'<div class="rlock">Sign-in screen. No user is signed in.</div>')+apps+'<div class="rtk"><span>Start</span><span class="rsp"></span><span>'+esc(m.user?m.user:"")+'  09:'+(10+((R().audit.length||0)%40))+'</span></div></div></div>';
}
PAGES["remote.session"]=function(){
  var r=R(),se=r.sess;
  if(!se){return '<div class="rc">'+rRail("console")+'<div class="rbody"><div class="rsup"><h2>No active session</h2><p>Pick a machine in Access and press Join.</p></div></div></div>';}
  var m=rMach(se.mid);
  return '<div class="rc rs"><div class="rsbar"><b>'+esc(m.name)+'</b>'+rDot(true)+'<span class="rst">'+(se.logon==="backstage"?"Backstage":"User session")+'</span><span class="rsp"></span>'+
    [["view","View"],["actions","Actions"],["commands","Commands"],["toolbox","Toolbox"],["people","Participants"],["chat","Chat"],["info","Info"]].map(function(x){return '<button type="button" class="rb'+(se.panel===x[0]?' on':'')+'" data-a="rPanel" data-v="'+x[0]+'">'+x[1]+'</button>';}).join("")+
    '<button type="button" class="rb end" data-a="rEnd">End session</button></div><div class="rsw">'+rPanel(se,m)+rScreen(se,m)+'</div></div>';
};
/* ---------- actions ---------- */
function rRefocus(id){setTimeout(function(){var e=document.getElementById(id);if(e){e.focus();}},0);}
A.rGrp=function(d){R().grp=d.id;S.q="";};
A.rSel=function(d){var r=R();r.sel=d.id;r.tab="start";if(d.id==="d1"){r.flags.found=true;}};
A.rTab=function(d){var r=R();r.tab=d.t;if(d.t==="procs"&&r.sel==="d1"){r.flags.cpu=true;}};
A.rNote=function(d){var e=document.getElementById("rnote");R().notes[d.id]=e?e.value:"";rAudit(d.id,"Saved a note");toast("Note saved.");};
A.rWake=function(d){rAudit(d.id,"Sent wake-up");toast("Wake sent. "+rMach(d.id).name+" did not answer: it is powered off at the wall.");};
A.rRunCmd=function(d,el){var r=R();rRun(r.sel,el.value,false);rRefocus("rcmd");};
A.rSessCmd=function(d,el){var se=R().sess;if(se){rRun(se.mid,el.value,se.logon==="user");}rRefocus("rcmd");};
A.rChat=function(d,el){var r=R(),se=r.sess,v=String(el.value||"").trim();if(!se||!v){return;}var ch=r.chat[se.mid]||(r.chat[se.mid]=[]);ch.push(["You",v]);if(!ch.some(function(c){return c[0]!=="You";})&&rMach(se.mid).user){ch.push([rMach(se.mid).user,"Ok, I can see your messages."]);}
  if(se.mid==="d1"&&r.flags.killed&&r.flags.removed){r.flags.told=true;}rAudit(se.mid,"Sent a chat message");rRefocus("rchat");};
A.rKill=function(d){openModal("End process?","<p>End <b>"+esc(d.n)+"</b> on "+esc(rMach(d.id).name)+"? Unsaved work in that program can be lost.</p>","End process",function(){rRun(d.id,"taskkill /im "+d.n+" /f",false);toast("Ended "+d.n+".");return null;});};
A.rUninst=function(d){openModal("Uninstall software?","<p>Uninstall <b>"+esc(d.n)+"</b> from "+esc(rMach(d.id).name)+"?</p>","Uninstall",function(){var l=rSw(d.id),i;for(i=0;i<l.length;i++){if(l[i].n===d.n){if(l[i].bad){R().flags.removed=true;}l.splice(i,1);break;}}rAudit(d.id,"Uninstalled "+d.n);toast("Uninstalled "+d.n+".");return null;});};
A.rJoin=function(d){
  var r=R(),m=rMach(d.id);
  if(!m||!m.online){toast((m?m.name:"That machine")+" is offline, so there is nothing to join.");return;}
  var bs=!!d.bs||!m.user;
  r.sess={mid:m.id,logon:bs?"backstage":"user",panel:null,quality:"Auto",zoom:"Fit",app:"",blocked:false,blank:false,susp:false};
  if(m.id==="d1"){r.flags.joined=true;}
  rAudit(m.id,"Joined a session ("+(bs?"Backstage":"user session")+")");S.portal="remote";S.page="session";resetNav();navReset=true;
};
A.rPanel=function(d){var se=R().sess;if(se){se.panel=se.panel===d.v?null:d.v;}};
A.rView=function(d){var se=R().sess;if(se){se[d.k]=d.v;}};
A.rLogon=function(d){var se=R().sess,m=se&&rMach(se.mid);if(!se){return;}if(d.v==="user"&&!m.user){toast("No user is signed in on "+m.name+", so there is no user session.");return;}se.logon=d.v;rAudit(se.mid,"Switched to "+(d.v==="backstage"?"Backstage":"the user session"));};
A.rApp=function(d){
  var se=R().sess,r=R();if(!se){return;}
  if(d.v==="shot"){rAudit(se.mid,"Took a screenshot");toast("Screenshot saved to the session folder.");return;}
  if(d.v==="file"){toast("File transfer is not needed in this lab.");return;}
  if(se.logon==="backstage"&&d.v){se.logon=rHasUser(se)?"user":"backstage";}
  se.app=d.v||"";if(d.v==="taskmgr"&&se.mid==="d1"){r.flags.cpu=true;}se.panel=null;
};
function rHasUser(se){return !!rMach(se.mid).user;}
A.rAct=function(d){
  var se=R().sess,m=se&&rMach(se.mid);if(!se){return;}
  if(d.v==="cad"){rAudit(m.id,"Sent Ctrl-Alt-Del");toast("Ctrl-Alt-Del sent.");}
  else if(d.v==="block"){se.blocked=!se.blocked;rAudit(m.id,(se.blocked?"Blocked":"Allowed")+" guest input");}
  else if(d.v==="blank"){se.blank=!se.blank;rAudit(m.id,(se.blank?"Blanked":"Restored")+" the guest monitor");}
  else if(d.v==="susp"){se.susp=!se.susp;}
  else{var safe=d.v==="safe",warn=m.role.indexOf("controller")>-1||m.role==="File server";
    openModal("Restart "+m.name+(safe?" in safe mode?":"?"),"<p>"+(warn?"<b>"+esc(m.name)+" is a "+esc(m.role.toLowerCase())+".</b> Users will lose sign-in or file access until it is back. ":"")+"The session will end while it restarts.</p>","Restart",function(){var r=R();rAudit(m.id,"Restarted"+(safe?" in safe mode":""));r.sess=null;S.page="console";toast(m.name+" is restarting. Session ended.");return null;});}
};
A.rEnd=function(){
  var r=R(),se=r.sess;if(!se){return;}
  if(se.blocked||se.blank||se.susp){toast("Turn off Block guest input, Blank guest monitor and Suspend my input before you disconnect, or the user is left locked out.");se.panel="actions";return;}
  if(se.mid==="d1"){r.flags.disc=true;}
  rAudit(se.mid,"Ended the session");r.sess=null;S.portal="remote";S.page="console";resetNav();navReset=true;
};
A.rSupNew=function(){R().support={name:"Sam Ortiz",code:"48213",state:"waiting"};rAudit("d1","Created a support session");};
A.rSupJoin=function(){var s=R().support;if(s){s.state="joined";rAudit("d1","The user entered the code");}};
