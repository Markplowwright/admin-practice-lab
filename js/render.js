"use strict";
/* =============== ACTIONS (shared) =============== */
function resetNav(){S.sel=null;S.tab=null;S.q="";S.checked=[];S.fly=null;S.wiz=null;S.draft=null;}
A.go=function(d){if(d.g&&window.innerWidth<900){S.guide=false;}if(d.p&&d.p!==S.portal){S.portal=d.p;if(!d.pg){d.pg=DEFAULT[d.p];}}S.page=d.pg||DEFAULT[S.portal];resetNav();navReset=true;};
A.sel=function(d){S.sel=d.id;S.tab=null;S.checked=[];};
A.back=function(){S.sel=null;S.tab=null;};
A.tab=function(d){S.tab=d.t;};
A.flyTab=function(d){if(S.fly){S.fly.tab=d.t;}};
A.closeFly=function(){S.fly=null;};
A.closeModal=function(){closeModal();};
A.chk=function(d){S.checked=S.checked[0]===d.id?[]:[d.id];};
A.refresh=function(){toast("Refreshed.");};
A.noop=function(){toast("Not needed for this lab.");};
A.perUserMfa=function(){openModal("Per-user MFA","<p>Per-user MFA is the older way to enforce MFA one person at a time. Use security defaults or Conditional Access instead (Entra > Protection or Properties).</p>",null,null);};
A.guide=function(){S.guide=!S.guide;};
A.gtab=function(d){S.guideTab=d.t;};
A.info=function(d,el){hidePop();showPop(el);};
A.wizGo=function(d){var n=parseInt(d.n,10);if(n>S.wiz.step){var err=wizStepError();if(err){S.wiz.err=err;return;}}S.wiz.step=n;S.wiz.err="";};
A.wizBack=function(){S.wiz.step=Math.max(0,S.wiz.step-1);S.wiz.err="";};
A.wizNext=function(){var err=wizStepError();if(err){S.wiz.err=err;return;}var def=WIZ[S.wiz.kind];S.wiz.step=Math.min(def.steps.length-1,S.wiz.step+1);S.wiz.err="";};
A.wizCancel=function(){S.wiz=null;};
A.wizCreate=function(){var def=WIZ[S.wiz.kind],r=def.create(S.wiz.d);if(r&&r.error){S.wiz.err=r.error;return;}S.wiz=null;S.checked=[];toast(r&&r.msg?r.msg:"Created.");};
A.resetLab=function(){openModal("Reset the lab?","<p>This restores every user, group, license, device and policy to the starting state and clears mission progress.</p>","Reset lab",function(){S=seed();S.onboarded=true;toast("Lab reset.");return null;});};
A.tour=function(){S.onboarded=false;S.intro=0;};
A.introNext=function(){S.intro=Math.min(INTRO_STEPS-1,(S.intro||0)+1);};
A.introBack=function(){S.intro=Math.max(0,(S.intro||0)-1);};
A.introSkip=function(){S.onboarded=true;if(progress()[0]===0){S.guide=true;S.guideTab="missions";}};
A.introStart=function(){
  var m=nextMission(levelsView());
  S.onboarded=true;S.guide=true;S.guideTab="missions";
  if(m){var st=firstOpenStep(m),w=st[2];S.portal=w[0];S.page=w[1];resetNav();navReset=true;}
};
A.finish=function(){S.finishSeen=false;};
A.finishClose=function(){S.finishSeen=true;};
A.finishReset=function(){S.finishSeen=true;A.resetLab();};

/* =============== RENDER =============== */
function fitLaptop(){
  var el=document.getElementById("laptop");
  if(!el){return;}
  var w=el.clientWidth,h=window.innerHeight||800;
  if(!w){return;}
  var sc=Math.min(w/960,1.15,Math.max(0.5,(h-210)/580));
  sc=Math.max(0.5,sc);
  el.style.setProperty("--s",String(Math.round(sc*1000)/1000));
}
function focusKey(el){
  if(!el||!el.getAttribute){return "";}
  if(el.hasAttribute("data-q")){return "q:"+(el.id||"q");}
  if(el.hasAttribute("data-vi")){return "vi:"+el.getAttribute("data-vi");}
  if(el.classList&&el.classList.contains("i")){return "i:"+(el.getAttribute("data-t")||"");}
  var a=el.getAttribute("data-a");
  if(!a){return "";}
  return [a,el.getAttribute("data-id")||"",el.getAttribute("data-t")||"",el.getAttribute("data-p")||"",el.getAttribute("data-pg")||"",el.getAttribute("data-n")||""].join("|");
}
function findFocus(key){
  if(!key){return null;}
  if(key.indexOf("q:")===0){return document.getElementById(key.slice(2));}
  if(key.indexOf("vi:")===0){return document.querySelector('[data-vi="'+key.slice(3)+'"]');}
  if(key.indexOf("i:")===0){return document.querySelector('.i[data-t="'+key.slice(2)+'"]');}
  var parts=key.split("|"),nodes=document.querySelectorAll('[data-a="'+parts[0]+'"]'),i,n;
  for(i=0;i<nodes.length;i++){n=nodes[i];
    if((n.getAttribute("data-id")||"")===parts[1]&&(n.getAttribute("data-t")||"")===parts[2]&&(n.getAttribute("data-p")||"")===parts[3]&&(n.getAttribute("data-pg")||"")===parts[4]&&(n.getAttribute("data-n")||"")===parts[5]){return n;}}
  return null;
}
function render(){
  var gy=0,gb=document.querySelector(".guide .gb");
  if(gb){gy=gb.scrollTop;}
  var wx=window.scrollX,wy=window.scrollY,ae=document.activeElement,fkey=focusKey(ae),pos=ae&&typeof ae.selectionStart==="number"?ae.selectionStart:null,infoOpen=fkey.indexOf("i:")===0;
  hidePop();recompute();
  document.body.dataset.portal=S.portal;
  var key=S.portal+"."+S.page,content;
  if(S.portal==="vm"){content=vmPage();}
  else if(S.wiz){content=wizHtml();}
  else if(PAGES[key]){content=PAGES[key]();}
  else{content='<p>Page not found.</p>';}
  $("#app").innerHTML=labBar()+portalHeader()+'<div class="shell">'+leftNav()+'<main class="content" id="main">'+content+'</main></div>'+flyHtml()+guideHtml();
  if(navReset){window.scrollTo(0,0);navReset=false;}else{window.scrollTo(wx,wy);}
  gb=document.querySelector(".guide .gb");if(gb){gb.scrollTop=gy;}
  document.body.classList.toggle("guide-open",!!S.guide);
  fitLaptop();
  /* level completion toast, then the tour or the finish screen */
  var lv=levelsView(),fresh=null;
  lv.forEach(function(L){var i=S.lvlDone.indexOf(L.n);if(L.complete&&i<0){S.lvlDone.push(L.n);fresh=L;}if(!L.complete&&i>-1){S.lvlDone.splice(i,1);}});
  if(fresh&&S.onboarded){toast("Level "+fresh.n+" complete: "+fresh.name+".");}
  var allDone=lv.every(function(L){return L.complete;}),ov=$("#intro"),app=$("#app");
  if(!S.onboarded){ov.innerHTML=introHtml();}
  else if(allDone&&!S.finishSeen){ov.innerHTML=finishHtml();}
  else{ov.innerHTML="";}
  if(ov.innerHTML){app.setAttribute("inert","");var pb=ov.querySelector(".btn.primary");if(pb&&!ov.contains(document.activeElement)){try{pb.focus({preventScroll:true});}catch(e){pb.focus();}}}
  else{app.removeAttribute("inert");
    var nf=findFocus(fkey);
    if(nf){try{nf.focus({preventScroll:true});}catch(e){try{nf.focus();}catch(e2){}}
      if(pos!=null&&nf.setSelectionRange){try{nf.setSelectionRange(pos,pos);}catch(e3){}}
      if(infoOpen){showPop(nf);}}}
  save();
}

/* =============== EVENTS =============== */
document.addEventListener("click",function(e){
  var collapse=!!(S.guide&&e.target.closest&&e.target.closest("#app")&&!e.target.closest(".guide"));
  var t=e.target.closest("[data-a]");
  if(!t){if(!e.target.closest("#pop")){hidePop();}if(collapse){S.guide=false;render();}return;}
  if(collapse&&t.dataset.a!=="guide"){S.guide=false;}
  if(t.disabled){if(collapse){render();}return;}
  var name=t.dataset.a,f=A[name];
  if(!f){if(collapse){render();}return;}
  if(name==="chk"){f(t.dataset,t);render();return;}
  f(t.dataset,t);
  if(!NR[name]||collapse){render();}
});
document.addEventListener("mouseover",function(e){var t=e.target.closest&&e.target.closest(".i");if(t&&t!==popFor){hidePop();showPop(t);}});
document.addEventListener("submit",function(e){
  if(e.target.id!=="mf"){return;}
  e.preventDefault();
  var fd={};new FormData(e.target).forEach(function(v,k){fd[k]=v;});
  var r=modalSubmit?modalSubmit(fd):null;
  if(r&&r.error){$("#merr").textContent=r.error;return;}
  closeModal();render();
});
document.addEventListener("input",function(e){
  var t=e.target;
  if(t.hasAttribute&&t.hasAttribute("data-vi")){S.vmIn[t.getAttribute("data-vi")]=t.value;return;}
  if(t.hasAttribute&&t.hasAttribute("data-q")){S.q=t.value;S.checked=[];render();return;}
  if(t.hasAttribute&&t.hasAttribute("data-w")&&t.type==="text"&&S.wiz){S.wiz.d[t.getAttribute("data-w")]=t.value;}
});
document.addEventListener("change",function(e){
  var t=e.target,rr=false;
  if(!t.hasAttribute){return;}
  if(t.hasAttribute("data-w")&&S.wiz){
    var f=t.getAttribute("data-w");
    S.wiz.d[f]=t.type==="checkbox"?t.checked:t.value;
    if(S.wiz.kind==="app"&&f==="type"){S.wiz.d.name=t.value;}
    rr=t.hasAttribute("data-rr")||t.type==="radio"||t.type==="checkbox"||t.tagName==="SELECT";
  }else if(t.hasAttribute("data-wg")&&S.wiz){
    var g=t.getAttribute("data-wg"),arr=S.wiz.d.groups||[],i=arr.indexOf(g);
    if(t.checked&&i<0){arr.push(g);}if(!t.checked&&i>-1){arr.splice(i,1);}S.wiz.d.groups=arr;
  }else if(t.hasAttribute("data-fd")&&S.fly){
    S.fly.d[t.getAttribute("data-fd")]=t.type==="checkbox"?t.checked:t.value;rr=t.hasAttribute("data-rr");
  }else if(t.hasAttribute("data-dr")&&S.draft){
    S.draft[t.getAttribute("data-dr")]=t.value;rr=t.hasAttribute("data-rr");
  }else if(t.hasAttribute("data-sv")){
    S[t.getAttribute("data-sv")]=t.value;
  }
  if(rr){render();}
});
document.addEventListener("keydown",function(e){
  if(e.key==="Enter"&&e.target.hasAttribute&&e.target.hasAttribute("data-enter")){var fn=A[e.target.getAttribute("data-enter")];if(fn){e.preventDefault();fn({},e.target);render();}return;}
  if(e.key!=="Escape"){return;}
  if(!$("#modal").hidden){closeModal();}else if(popFor){hidePop();}else if(!S.onboarded){A.introSkip();render();}else if(!$("#intro").hidden&&$("#intro").firstChild){A.finishClose();render();}else if(S.fly){S.fly=null;render();}
});
window.addEventListener("scroll",function(){if(popFor){hidePop();}},true);
window.addEventListener("resize",fitLaptop);
/* Saved labs from before the tour existed: add the new fields, and don't show the tour to someone who already has progress. */
if(S.lvlDone===undefined){S.lvlDone=levelsView().filter(function(L){return L.complete;}).map(function(L){return L.n;});}
if(S.intro===undefined){S.intro=0;}
if(S.finishSeen===undefined){S.finishSeen=false;}
if(S.onboarded===undefined){S.onboarded=progress()[0]>0;S.finishSeen=levelsView().every(function(L){return L.complete;});}
render();
