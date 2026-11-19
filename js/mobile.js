"use strict";
/* =============== PHONE VERSION ===============
   On a phone the lab shows a small phone shell instead of the laptop desktop. It can read the
   Learn path, the ticket queue, the knowledge base and the toolkit. The screens that need a
   big display are shown as "Desktop only" tiles with a preview picture.
   The choice is remembered in localStorage ("adminPracticeLabView": phone or desktop).
   Open the page with ?view=phone or ?view=desktop to switch by hand. */
var VIEW_KEY="adminPracticeLabView";
var PH={s:"home",id:"",cat:"All",lvl:0,mis:"",hint:{}};
var DESKTOP_ONLY=[
  {id:"env",t:"Environment map",d:"The whole company on one screen: servers, laptops and the Microsoft cloud, with the ticket queue beside it.",why:"It needs a wide screen to show every system and the ticket panel side by side.",img:"docs/screenshots/02-environment-map.png"},
  {id:"cloud",t:"Microsoft cloud admin centers",d:"Microsoft 365, Entra, Intune and Exchange, in a simulated browser window.",why:"The admin centers use wide tables, side menus and several panels open at once.",img:"docs/screenshots/03-entra-users.png"},
  {id:"dc01",t:"DC01 domain controller",d:"Active Directory Users and Computers, Group Policy and Entra Connect on a Windows Server remote desktop.",why:"Windows Server tools are made for a mouse, a keyboard and overlapping windows.",img:"docs/screenshots/04-active-directory.png"},
  {id:"proc",t:"Procurement and imaging",d:"Order a laptop, set the BIOS and Secure Boot, image it, then set it up with Autopilot.",why:"The BIOS and imaging screens need keyboard keys such as F2 and F12.",img:"docs/screenshots/06-bios-secure-boot.png"},
  {id:"vm",t:"Virtual PC",d:"Click through Windows setup on a practice laptop and join it to Entra ID and Intune.",why:"The practice laptop is drawn at full laptop size so the setup screens stay readable.",img:"docs/screenshots/07-virtual-pc-setup.png"},
  {id:"rem",t:"Remote support console",d:"Join a machine, check its processes and event log, and run commands.",why:"The console is a dense, multi-panel tool that needs a large display.",img:"docs/screenshots/05-remote-support.png"}
];
function viewPref(){try{return localStorage.getItem(VIEW_KEY)||"";}catch(e){return "";}}
function setViewPref(v){try{if(v){localStorage.setItem(VIEW_KEY,v);}else{localStorage.removeItem(VIEW_KEY);}}catch(e){}}
(function(){
  var m=/[?&]view=(phone|desktop)\b/.exec(location.search);
  if(m){setViewPref(m[1]);}
})();
function phoneMode(){
  var p=viewPref();
  if(p==="desktop"){return false;}
  if(p==="phone"){return true;}
  var w=window.innerWidth||1024,coarse=false,small=false;
  try{coarse=window.matchMedia("(pointer: coarse)").matches;}catch(e){}
  try{small=Math.min(screen.width,screen.height)<=500;}catch(e){}
  /* A touch phone stays a phone when turned sideways; a narrow desktop window counts too. */
  return (coarse&&small)||w<=520;
}
function phTitleBar(back,title){
  return '<header class="ph-bar">'+(back?'<button type="button" class="ph-back" data-a="phGo" data-s="'+back+'" aria-label="Back">&lsaquo;</button>':'<span class="ph-logo" aria-hidden="true">A</span>')+'<h1>'+esc(title)+'</h1><button type="button" class="ph-theme" data-a="theme" aria-label="Change theme">Theme</button></header>';
}
function phProgress(){
  var tot=0,done=0;levelsView().forEach(function(L){tot+=L.tot;done+=L.done;});
  return [done,tot];
}
function phHome(){
  var p=phProgress(),res=SCENARIOS.filter(function(x){return S.scenarios.completed[x.id];}).length;
  var tiles=[["learn","Learn path","6 levels, 21 missions"],["tickets","Tickets",SCENARIOS.length+" help-desk tickets"],["kb","Knowledge base","How-to articles"],["tools","Toolkit","Real tools admins use"]];
  return phTitleBar("","Admin Practice Lab")+
   '<main class="ph-main"><section class="ph-hero"><h2>Practice IT admin work with nothing to break</h2><p>A free simulator of Active Directory, Microsoft 365, Entra, Intune and Exchange. Hands-on practice runs on a laptop. On your phone you can read the lessons, the tickets and the articles.</p>'+
   '<div class="ph-prog"><b>'+p[0]+' of '+p[1]+'</b> steps done &middot; <b>'+res+' of '+SCENARIOS.length+'</b> tickets resolved</div></section>'+
   '<div class="ph-tiles">'+tiles.map(function(t){return '<button type="button" class="ph-tile" data-a="phGo" data-s="'+t[0]+'"><b>'+t[1]+'</b><span>'+t[2]+'</span></button>';}).join("")+'</div>'+
   '<h3 class="ph-sec">Desktop only</h3><p class="ph-note">These are the hands-on screens. Open the lab on a laptop to use them.</p>'+
   '<div class="ph-tiles">'+DESKTOP_ONLY.map(function(t){return '<button type="button" class="ph-tile ph-lock" data-a="phGo" data-s="desk" data-id="'+t.id+'"><b>'+t.t+'</b><span>Desktop only</span></button>';}).join("")+'</div>'+
   '<footer class="ph-foot"><button type="button" class="ph-link" data-a="phDesktop">View desktop version</button><a class="ph-link" href="https://github.com/Markplowwright/admin-practice-lab" target="_blank" rel="noopener noreferrer">Code on GitHub</a></footer></main>';
}
function phLearn(){
  var lv=levelsView();
  if(PH.mis){
    var m=null;lv.forEach(function(L){L.ms.forEach(function(x){if(x.t===PH.mis){m=x;}});});
    if(m){
      return phTitleBar("learn","Mission")+'<main class="ph-main"><h2 class="ph-h">'+esc(m.t)+'</h2><p>'+esc(m.w)+'</p><ol class="ph-steps">'+m.s.map(function(x){return '<li class="'+(x[1]?'done':'')+'"><span>'+esc(x[0])+'</span><em>'+esc((x[2]&&x[2][2])||"")+'</em></li>';}).join("")+'</ol>'+(m.why?'<h3 class="ph-sec">Why it works this way</h3><p>'+esc(m.why)+'</p>':'')+'<p class="ph-note">To do the steps, open the lab on a laptop. Progress carries over.</p></main>';
    }
  }
  return phTitleBar("home","Learn path")+'<main class="ph-main">'+lv.map(function(L){
    return '<section class="ph-card"><h2>Level '+L.n+': '+esc(L.name)+'</h2><p>'+esc(L.d)+'</p><div class="ph-prog">'+L.done+' of '+L.tot+' steps</div>'+
      L.ms.map(function(x){var d=x.s.filter(function(y){return y[1];}).length;return '<button type="button" class="ph-row" data-a="phGo" data-s="learn" data-m="'+esc(x.t)+'"><b>'+esc(x.t)+'</b><span>'+d+' of '+x.s.length+' steps</span></button>';}).join("")+'</section>';}).join("")+'</main>';
}
function phTickets(){
  if(PH.id){
    var sc=SCENARIOS.filter(function(x){return x.id===PH.id;})[0];
    if(sc){var done=!!S.scenarios.completed[sc.id],shown=!!PH.hint[sc.id];
      return phTitleBar("tickets","Ticket #"+ticketNo(sc.id))+'<main class="ph-main"><h2 class="ph-h">'+esc(sc.title)+'</h2><p class="ph-meta">'+esc(sc.difficulty)+' &middot; '+(done?'Resolved':'Open')+'</p><blockquote class="ph-quote">'+esc(sc.ticket)+'</blockquote>'+
        (shown?'<h3 class="ph-sec">Hint</h3><p>'+esc(sc.hint)+'</p>':'<button type="button" class="ph-btn" data-a="phHint" data-id="'+sc.id+'">Show the hint</button>')+
        (done?'<h3 class="ph-sec">Why it happened</h3><p>'+esc(sc.cause)+'</p>':'')+
        '<p class="ph-note">Solving a ticket means working in the lab tools, so it needs a laptop.</p></main>';}
  }
  return phTitleBar("home","Tickets")+'<main class="ph-main">'+SCENARIOS.map(function(x){var done=!!S.scenarios.completed[x.id];
    return '<button type="button" class="ph-row" data-a="phGo" data-s="tickets" data-id="'+x.id+'"><b>#'+ticketNo(x.id)+' '+esc(x.title)+'</b><span>'+esc(x.difficulty)+' &middot; '+(done?'Resolved':'Open')+'</span></button>';}).join("")+'</main>';
}
function phKb(){
  var all=kbAll(),open=PH.id&&all.filter(function(a){return a.id===PH.id;})[0];
  if(open){
    var h='<h2 class="ph-h">'+esc(open.title)+'</h2><p class="ph-meta">'+esc(open.cat)+(open.ticket?' &middot; Ticket #'+ticketNo(open.ticket):'')+'</p>';
    if(open.locked){h+='<p>This article explains ticket #'+ticketNo(open.ticket)+'. It unlocks once you resolve that ticket in the lab.</p>';}
    else{
      if(open.sum&&!open.ticket){h+='<p>'+esc(open.sum)+'</p>';}
      if(open.why){h+='<h3 class="ph-sec">Why it happens</h3><p>'+esc(open.why)+'</p>';}
      h+='<h3 class="ph-sec">'+(open.ticket?"The fix":"Steps")+'</h3>'+(open.steps.length>1?'<ol class="ph-steps">'+open.steps.map(function(s){return '<li><span>'+esc(s)+'</span></li>';}).join("")+'</ol>':'<p>'+esc(open.steps[0]||"")+'</p>');
    }
    return phTitleBar("kb","Article")+'<main class="ph-main">'+h+'</main>';
  }
  var list=all.filter(function(a){return PH.cat==="All"||a.cat===PH.cat;});
  return phTitleBar("home","Knowledge base")+'<main class="ph-main"><div class="ph-chips">'+KB_CATS.map(function(c){return '<button type="button" class="'+(PH.cat===c?'on':'')+'" data-a="phCat" data-k="'+c+'">'+c+'</button>';}).join("")+'</div>'+
    list.map(function(a){return '<button type="button" class="ph-row" data-a="phGo" data-s="kb" data-id="'+a.id+'"><b>'+esc(a.title)+(a.locked?' <em>Locked</em>':'')+'</b><span>'+esc(a.cat)+' &middot; '+esc(a.locked?"Resolve ticket #"+ticketNo(a.ticket)+" to unlock":a.sum)+'</span></button>';}).join("")+'</main>';
}
function phTools(){
  return phTitleBar("home","Toolkit")+'<main class="ph-main"><p>Real tools help desk techs use. Each opens the real site in a new tab.</p>'+TOOLKIT.map(function(g){
    return '<h3 class="ph-sec">'+esc(g.g)+'</h3>'+g.t.map(function(x){return '<a class="ph-card ph-tool" href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer"><b>'+esc(x[0])+'</b><span><b>Use it when:</b> '+esc(x[2])+'</span><span><b>Look for:</b> '+esc(x[3])+'</span></a>';}).join("");}).join("")+'</main>';
}
function phDesk(){
  var t=DESKTOP_ONLY.filter(function(x){return x.id===PH.id;})[0];
  if(!t){return phHome();}
  return phTitleBar("home",t.t)+'<main class="ph-main"><p class="ph-badge">Desktop only</p><img class="ph-shot" src="'+t.img+'" alt="Preview of '+esc(t.t)+'" loading="lazy"><p>'+esc(t.d)+'</p><p class="ph-note">'+esc(t.why)+'</p>'+
    '<button type="button" class="ph-btn" data-a="phCopy">Copy the link to open on a laptop</button><p class="ph-copied" id="phcopied" hidden>Link copied.</p></main>';
}
function phoneRender(){
  var body=PH.s==="learn"?phLearn():PH.s==="tickets"?phTickets():PH.s==="kb"?phKb():PH.s==="tools"?phTools():PH.s==="desk"?phDesk():phHome();
  document.body.classList.add("is-phone");document.body.classList.remove("guide-open","dock-open");
  document.body.dataset.portal="phone";
  $("#app").innerHTML='<div class="ph">'+body+'</div>';
  $("#app").removeAttribute("inert");$("#intro").innerHTML="";
  window.scrollTo(0,0);
  save();
}
A.phGo=function(d){var s=d.s||"home";if(s==="learn"){PH.mis=d.m||"";PH.id="";}else if(s==="tickets"||s==="kb"||s==="desk"){PH.id=d.id||"";PH.mis="";}else{PH.id="";PH.mis="";}PH.s=s;};
A.phHint=function(d){PH.hint[d.id]=true;};
A.phCat=function(d){PH.cat=d.k;PH.id="";};
A.phDesktop=function(){setViewPref("desktop");document.body.classList.remove("is-phone");};
A.phCopy=function(){
  var url=location.origin+location.pathname,ok=function(){var e=document.getElementById("phcopied");if(e){e.hidden=false;}};
  try{navigator.clipboard.writeText(url).then(ok,function(){window.prompt("Copy this link",url);});}catch(e){window.prompt("Copy this link",url);}
};
NR.phCopy=true;
