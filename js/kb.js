"use strict";
/* =============== KNOWLEDGE BASE ===============
   Searchable how-to articles. General articles are always open. The article that
   explains a specific ticket stays locked until that ticket is resolved, so the
   knowledge base never hands out the answer first. "My notes" collects the ticket
   notes the learner wrote. */
var KB_CATS=["All","Accounts","Devices","Imaging","Remote support","Tickets"];
var KB_ARTICLES=[
 {id:"a-lock",cat:"Accounts",title:"Unlock an account and check why it locked",sum:"Locked means too many bad passwords, usually from a saved old password.",
  steps:["Active Directory Users and Computers: find the user in their OU. Status shows Locked.","Select the user and choose Unlock account.","Ask what else is signed in with the old password (phone mail app, mapped drive). Update it there or the account locks again."],
  tools:[["Active Directory Users and Computers","ad","aduc"]]},
 {id:"a-reset",cat:"Accounts",title:"Reset a password for a synced user",sum:"For a user synced from Active Directory, the password is owned on-premises.",
  steps:["Reset the password in Active Directory Users and Computers, not in the Microsoft 365 admin center.","Run a password synchronization or wait about two minutes for the next password hash sync.","Test the new password at the cloud sign-in page."],
  tools:[["Active Directory Users and Computers","ad","aduc"],["Entra Connect Sync","ad","sync"]]},
 {id:"a-sync",cat:"Accounts",title:"A new AD user is missing from Microsoft 365",sum:"Entra Connect only syncs organizational units that are included in its scope.",
  steps:["Open Entra Connect Sync and look at Organizational unit filtering.","Make sure the user's OU is Included. Users in an excluded OU never appear in the cloud.","Run a delta sync, then refresh the Active users list in the admin center."],
  tools:[["Entra Connect Sync","ad","sync"],["Active users","m365","users"]]},
 {id:"a-groups",cat:"Accounts",title:"Security groups, distribution groups and licenses",sum:"Only security groups grant access. Distribution groups only deliver mail.",
  steps:["Shared drive access comes from a security group such as Finance.","A distribution group such as Finance Announcements only delivers email, so adding someone to it grants no file access.","Licenses are best assigned to a group so onboarding and offboarding happen by membership."],
  tools:[["Active Directory Users and Computers","ad","aduc"]]},
 {id:"d-order",cat:"Devices",title:"Order a device and receive it on the bench",sum:"Check the order, then check the serial on the box before anything goes on the bench.",
  steps:["Procurement > New order. Pick Laptop or Desktop, the model and who it is for.","A desktop needs a monitor. An order with none raises a request until you add one.","A person who already has a managed laptop raises a duplicate request. Decide: replacement (keep) or mistake (cancel).","Orders and bench: type the serial from the box label exactly, then Receive."],
  tools:[["Procurement","procure","order"]]},
 {id:"d-apreg",cat:"Devices",title:"Register a serial number for Autopilot",sum:"Autopilot only recognises a device whose serial is already in Intune.",
  steps:["Intune admin center > Windows Autopilot devices > Import.","Enter the serial exactly as printed on the box and the device.","Do this before the device first boots. Registered devices ask for a work account at setup. Unregistered ones run the standard setup and nothing configures them."],
  tools:[["Windows Autopilot devices","intune","ap"]]},
 {id:"d-trust",cat:"Devices",title:"Trust relationship between a PC and the domain failed",sum:"The PC and its computer account in AD no longer agree on a shared secret.",
  steps:["Sign in to the PC as a local administrator (LocalAdmin).","In ADUC, reset the computer's account, then restart the PC.","Test a domain sign-in."],
  tools:[["Virtual PC","vm","d2"],["Active Directory Users and Computers","ad","aduc"]]},
 {id:"d-gp",cat:"Devices",title:"Group Policy did not apply to a computer",sum:"A GPO only applies if it is linked and the computer sits under the linked OU.",
  steps:["Group Policy Management: check the GPO is linked and enabled, and where.","ADUC: make sure the computer is in an OU the GPO is linked to (for example Computers).","On the PC run gpupdate /force, then gpresult /r to confirm."],
  tools:[["Group Policy Management","ad","gpmc"],["Virtual PC","vm","d2"]]},
 {id:"i-usb",cat:"Imaging",title:"Image a PC from a USB stick",sum:"Boot from the installer, clear the vendor partitions, install.",
  steps:["Connect power and the USB stick. A desktop also needs a monitor and keyboard.","Power on and press F12 at the Dell logo for the one-time boot menu.","Choose UEFI: USB device. In Windows Setup, delete every old partition until only Unallocated Space remains.","Select the unallocated space and click Next, then let the install run.","Install the support agent so IT can reach the PC."],
  tools:[["Procurement","procure","bench"]]},
 {id:"i-pxe",cat:"Imaging",title:"Image a PC over the network (PXE)",sum:"The PC boots a network image instead of a stick.",
  steps:["Connect power and the network cable. PXE-E61 on the screen means the cable is missing.","F12, then Onboard NIC (IPV4). The IPv6 entry is not served on this network.","Pick the Windows 11 corporate task sequence and Deploy. The Windows 10 image and WinPE do not give the right result."],
  tools:[["Procurement","procure","bench"]]},
 {id:"i-bios",cat:"Imaging",title:"F12 boot menu versus BIOS boot order",sum:"F12 boots a device once. The BIOS boot sequence changes every restart.",
  steps:["F12 is a one-time choice. Nothing is saved.","F2 opens BIOS setup > Boot Sequence. Tick the devices to boot from and move them up or down.","Use Apply Changes before Exit or the changes are lost.","If the PC will not boot from a stick, check it is ticked and above the internal disk."],
  tools:[["Procurement","procure","bench"]]},
 {id:"i-w11",cat:"Imaging",title:"Windows 11 will not boot or install: UEFI and Secure Boot",sum:"Windows 11 needs UEFI mode and Secure Boot on. Legacy mode or Secure Boot off blocks it.",
  steps:["If the USB stick will not boot and the F12 menu says Legacy, the PC is in Legacy BIOS mode.","Restart and press F2. General > Boot Sequence: set Boot List Option to UEFI.","Boot Configuration > Secure Boot: tick Secure Boot Enable.","Choose Apply Changes first, then Exit. Exiting without Apply throws the changes away.","Boot from USB again. Setup that says This PC can't run Windows 11 means one of these two settings is still wrong."],
  tools:[["Procurement","procure","bench"]]},
 {id:"i-ap",cat:"Imaging",title:"Zero-touch setup with Autopilot",sum:"Boot the vendor Windows already on the disk and let Autopilot take over.",
  steps:["Register the serial in Intune first.","Make sure an Autopilot deployment profile is assigned to All devices. Without a profile the PC runs the standard setup even though the serial is registered.","F12 > Windows Boot Manager boots the vendor Windows. A registered serial with a profile goes to Autopilot setup and asks for a work account.","If it is not registered you get the standard setup. Import the serial, then reset and try again."],
  tools:[["Windows Autopilot devices","intune","ap"],["Procurement","procure","bench"]]},
 {id:"r-basic",cat:"Remote support",title:"Run a remote support session",sum:"Join, look, fix, tell the user, then leave the machine as you found it.",
  steps:["Remote support > Access. Pick the machine, then Join.","Use Processes and Software to find the problem. End a task with taskkill or the Processes tab.","Talk to the user in Chat before and after.","Turn off any input block or blank-screen option before you end the session."],
  tools:[["Remote support","remote","console"]]},
 {id:"r-agent",cat:"Remote support",title:"Why a new PC does not show in Remote support",sum:"A PC appears only after the support agent is installed.",
  steps:["Windows alone is not enough. Nothing can see the PC until the agent is on it.","After imaging, Procurement > Install the support agent.","The PC then shows in Remote support under Laptops or Desktops."],
  tools:[["Procurement","procure","bench"],["Remote support","remote","console"]]}
];
function K(){if(!S.kb){S.kb={cat:"All",open:"",tab:"articles"};}return S.kb;}
function kbDone(id){return !!((S.scenarios&&S.scenarios.completed)||{})[id];}
function kbTicketArticles(){
  return SCENARIOS.map(function(sc){
    var done=kbDone(sc.id);
    return {id:"t-"+sc.id,cat:"Tickets",title:sc.title,sum:"Ticket #"+ticketNo(sc.id)+" ("+sc.difficulty+")",ticket:sc.id,locked:!done,
      steps:done?[sc.hint]:[],why:done?sc.cause:"",model:done?sc.note:"",tools:[]};
  });
}
function kbAll(){return KB_ARTICLES.concat(kbTicketArticles());}
function kbMatch(a,q){
  if(!q){return true;}
  var hay=(a.title+" "+a.sum+" "+(a.steps||[]).join(" ")).toLowerCase();
  return q.toLowerCase().split(/\s+/).every(function(w){return hay.indexOf(w)>-1;});
}
function kbList(){
  var k=K(),q=(S.q||"").trim(),list=kbAll().filter(function(a){return (k.cat==="All"||a.cat===k.cat)&&kbMatch(a,q);});
  if(!list.length){return '<p class="kbnone">No article matches. Try fewer words, or pick All.</p>';}
  return '<ul class="kblist">'+list.map(function(a){
    return '<li><button type="button" class="kbit" data-a="kbOpen" data-id="'+a.id+'" data-spot="'+esc(a.title)+'"><b>'+esc(a.title)+'</b>'+(a.locked?' <em>Locked</em>':'')+'<span>'+esc(a.cat)+' &middot; '+esc(a.locked?"Resolve ticket #"+ticketNo(a.ticket)+" to unlock":a.sum)+'</span></button></li>';}).join("")+'</ul>';
}
function kbArticle(a){
  var h='<button type="button" class="kbback" data-a="kbOpen" data-id="">Back to articles</button><article class="kbart"><h2>'+esc(a.title)+'</h2><p class="kbsum">'+esc(a.cat)+(a.ticket?" &middot; Ticket #"+ticketNo(a.ticket):"")+'</p>';
  if(a.locked){return h+'<p>This article explains the cause and the fix for ticket #'+ticketNo(a.ticket)+'. Resolve the ticket first, then it opens here.</p><button type="button" class="kbbtn" data-a="startScenario" data-id="'+a.ticket+'">Start the ticket</button></article>';}
  if(a.sum&&!a.ticket){h+='<p>'+esc(a.sum)+'</p>';}
  if(a.why){h+='<h3>Why it happens</h3><p>'+esc(a.why)+'</p>';}
  h+='<h3>'+(a.ticket?"The fix":"Steps")+'</h3>'+(a.steps.length&&a.steps.length>1?'<ol>'+a.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join("")+'</ol>':'<p>'+esc(a.steps[0]||"")+'</p>');
  if(a.model){h+='<h3>A good ticket note</h3><p class="kbnote">'+esc(a.model)+'</p>';}
  if(a.tools&&a.tools.length){h+='<h3>Open the tool</h3><div class="kbtools">'+a.tools.map(function(t){return '<button type="button" class="kbbtn" data-a="go" data-p="'+t[1]+'" data-pg="'+t[2]+'">'+esc(t[0])+'</button>';}).join("")+'</div>';}
  return h+'</article>';
}
function kbNotes(){
  var n=(S.scenarios&&S.scenarios.notes)||{},rows=SCENARIOS.filter(function(sc){return kbDone(sc.id)&&(n[sc.id]||"").trim();});
  if(!rows.length){return '<p class="kbnone">Nothing here yet. Resolve a ticket after writing a note and it is kept here.</p>';}
  return '<ul class="kblist">'+rows.map(function(sc){return '<li class="kbmine"><b>#'+ticketNo(sc.id)+' '+esc(sc.title)+'</b><p>'+esc(n[sc.id])+'</p></li>';}).join("")+'</ul>';
}
PAGES["kb.home"]=function(){
  var k=K(),open=k.open&&kbAll().filter(function(a){return a.id===k.open;})[0],body;
  if(open){body=kbArticle(open);}
  else if(k.tab==="notes"){body=kbNotes();}
  else{body='<div class="kbbar"><input type="search" id="kq" data-q placeholder="Search the knowledge base" aria-label="Search the knowledge base" value="'+esc(S.q||"")+'" autocomplete="off"></div><div class="kbcats">'+KB_CATS.map(function(c){return '<button type="button" class="'+(k.cat===c?'on':'')+'" data-a="kbCat" data-k="'+c+'">'+c+'</button>';}).join("")+'</div>'+kbList();}
  return '<div class="kb"><div class="kbtop"><b>Knowledge base</b><span>Internal help articles</span><nav><button type="button" class="'+(k.tab!=="notes"?'on':'')+'" data-a="kbTab" data-k="articles" data-spot="Articles">Articles</button><button type="button" class="'+(k.tab==="notes"?'on':'')+'" data-a="kbTab" data-k="notes" data-spot="My notes">My notes</button></nav></div><div class="kbbody">'+body+'</div></div>';
};
A.kbOpen=function(d){K().open=d.id||"";K().tab="articles";};
A.kbCat=function(d){K().cat=d.k;K().open="";};
A.kbTab=function(d){K().tab=d.k;K().open="";};
function kbDockLink(){return '<div class="why"><button type="button" class="btn sm" data-a="go" data-p="kb" data-pg="home">Search the knowledge base</button></div>';}
