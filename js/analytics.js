/* Usage counting. GoatCounter (script in index.html) counts page visits. This file adds a few named events
   so the lab can see which parts get used. Only the event name is sent: no ticket text, answers, notes or
   anything typed. It does nothing when GoatCounter is not loaded (localhost, offline, blocked). */
function track(name){
  try{
    if(window.goatcounter&&typeof window.goatcounter.count==="function"){
      window.goatcounter.count({path:"event/"+name,title:name,event:true});
    }
  }catch(e){}
}
(function(){
  var sm=A.startMission,rt=A.resolveTicket,pd=A.phDesktop;
  A.startMission=function(d){var had=S.mission;sm(d);if(S.mission&&S.mission!==had){track("mission-started");}};
  A.resolveTicket=function(){
    var id=S.scenarios.active,before=!!(id&&S.scenarios.completed[id]);
    rt();
    if(id&&!before&&S.scenarios.completed[id]){track("ticket-resolved");}
  };
  A.phDesktop=function(){pd();track("phone-to-desktop");};
  if(typeof phoneMode==="function"&&phoneMode()){track("phone-view");}
})();
