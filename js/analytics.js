/* Usage counting. GoatCounter (script in index.html) counts page visits. This file adds named events so the
   lab can see which screens, missions, tickets and articles get used. Only fixed names from the lab itself
   are sent (screen, mission and ticket ids). Nothing a person types is ever sent. It does nothing when
   GoatCounter is not loaded (localhost, offline, blocked). Loads after render.js. */
function track(name){
  try{
    if(window.goatcounter&&typeof window.goatcounter.count==="function"){
      window.goatcounter.count({path:"event/"+name,title:name,event:true});
    }
  }catch(e){}
  try{
    /* the owner's own tracker (visit-tracker repo); same fixed names, nothing typed */
    if(typeof window.vtrack==="function"){window.vtrack(name);}
    else{vq.push(name);vwait();}
  }catch(e){}
}
/* tracker.js loads async and can arrive after the first screen event: hold those names and send them once it is there */
var vq=[],vtimer=0;
function vwait(){
  if(vtimer){return;}
  var tries=0;
  vtimer=setInterval(function(){
    tries++;
    if(typeof window.vtrack==="function"){clearInterval(vtimer);vtimer=0;var q=vq;vq=[];q.forEach(function(n){try{window.vtrack(n);}catch(e){}});}
    else if(tries>40){clearInterval(vtimer);vtimer=0;vq=[];}
  },250);
}
(function(){
  var seen={};
  function slug(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60);}
  function once(name){if(seen[name]){return;}seen[name]=1;track(name);}
  function wrap(n,fn){var o=A[n];if(typeof o!=="function"){return;}A[n]=function(d){var r=o.apply(this,arguments);try{fn(d||{});}catch(e){}return r;};}
  /* first time each lab screen is opened in a visit */
  function screenSeen(){if(!(typeof phoneMode==="function"&&phoneMode())&&S.portal){once("screen/"+S.portal+(S.page?"."+S.page:""));}}
  var r0=window.render;
  if(typeof r0==="function"){window.render=function(){var r=r0.apply(this,arguments);try{screenSeen();}catch(e){}return r;};}
  var sm=A.startMission;
  A.startMission=function(d){var had=S.mission;sm.apply(this,arguments);if(S.mission&&S.mission!==had){track("mission/"+slug(S.mission)+"-started");}};
  var ss=A.startScenario;
  A.startScenario=function(d){var had=S.scenarios.active;ss.apply(this,arguments);if(S.scenarios.active&&S.scenarios.active!==had){track("ticket/"+S.scenarios.active+"-started");}};
  var rt=A.resolveTicket;
  A.resolveTicket=function(){
    var id=S.scenarios.active,before=!!(id&&S.scenarios.completed[id]);
    rt.apply(this,arguments);
    if(id&&!before&&S.scenarios.completed[id]){track("ticket/"+id+"-resolved");}
  };
  wrap("kbOpen",function(d){if(d.id){once("kb/"+d.id);}});
  wrap("phGo",function(d){once("phone/"+(d.s||"home"));});
  /* hints: counted when a hint is shown, per ticket */
  wrap("scenarioHint",function(d){if(d.id&&S.scenarios.hint[d.id]){once("hint/"+d.id);}});
  wrap("phHint",function(d){if(d.id){once("hint/"+d.id);}});
  wrap("phCopy",function(){track("phone/copy-link");});
  /* missions finished during this visit (missions already finished before the visit are not counted again) */
  var doneM=null;
  function missionsDone(){var o={};try{missions().forEach(function(m){if(m.s.every(function(x){return x[1];})){o[m.t]=1;}});}catch(e){}return o;}
  function missionCheck(){
    var now=missionsDone();
    if(doneM){Object.keys(now).forEach(function(t){if(!doneM[t]){once("mission/"+slug(t)+"-finished");}});}
    doneM=now;
  }
  var r1=window.render;
  if(typeof r1==="function"){window.render=function(){var r=r1.apply(this,arguments);try{missionCheck();}catch(e){}return r;};}
  missionCheck();
  /* outbound links: only the site name (for example github.com), never the full address */
  document.addEventListener("click",function(e){
    var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;
    if(!a){return;}
    try{var u=new URL(a.href,location.href);if(/^https?:$/.test(u.protocol)&&u.host!==location.host){track("link/"+u.hostname.replace(/^www\./,""));}}catch(x){}
  },true);
  var pd=A.phDesktop;
  A.phDesktop=function(){pd.apply(this,arguments);track("phone-to-desktop");};
  if(typeof phoneMode==="function"&&phoneMode()){track("phone-view");}else{screenSeen();}
})();
