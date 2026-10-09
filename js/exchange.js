"use strict";
/* =============== EXCHANGE ADMIN CENTER =============== */
PAGES["exchange.mailboxes"]=function(){
  var rows=live().filter(function(u){return matchQ(u.name+u.upn);}).map(function(u){return {cells:[lnk(u.name,"openMailbox",u.id),'<span class="mono">'+esc(upn(u))+'</span>',"UserMailbox",hasLicense(u)?badge("Active","ok"):badge("Inactive (no license)","warn"),u.fwd?(forwardBlocked(u.fwd)?badge("Forwarding blocked","warn"):badge("Forwarding: external","bad")):"-"]};});
  return crumbs([["Home","mailboxes"],["Recipients"]])+'<h1 class="ptitle">Mailboxes'+info("mailbox")+'</h1><p class="psub">Open a mailbox to review email forwarding'+info("fwd")+'.</p>'+bar([CB("refresh","Refresh","refresh")])+search("Search mailboxes")+tbl(["Display name","Email address","Recipient type","Status","Forwarding"],rows);
};
A.openMailbox=function(d){S.fly={k:"mailbox",id:d.id};};
FLY.mailbox=function(){var u=U(S.fly.id);
  return {title:u.name,sub:"User mailbox",body:grid([["Email address",'<span class="mono">'+esc(upn(u))+'</span>'],["Mailbox",hasLicense(u)?"Active":"Inactive"],["Email forwarding"+info("fwd"),fwdLabel(u)]])+
    '<div class="btnrow">'+B("Manage email forwarding","mailFwd",{d:{id:u.id}})+'</div>'};
};
PAGES["exchange.rules"]=function(){
  var rows=S.mailRules.map(function(r){return {cells:[esc(r.name),badge("Enabled","ok"),esc(r.what),B("Delete","delRule",{sm:1,danger:1,d:{id:r.id}})]};});
  return crumbs([["Home","mailboxes"],["Mail flow"]])+'<h1 class="ptitle">Rules'+info("mailflow")+'</h1><p class="psub">Rules act on mail as it flows through Exchange.</p>'+bar([CB("plus","Add a rule","addRule"),CB("refresh","Refresh","refresh")])+tbl(["Rule","Status","Does",""],rows,{empty:"No rules yet. Try one that blocks automatic forwarding to external addresses."});
};
A.addRule=function(){openModal("Add a rule",mtext("Name","name","Block external auto-forward")+msel("Template","t",[["Block automatic forwarding to external recipients","Block automatic forwarding to external recipients"],["Add a disclaimer to outbound mail","Add a disclaimer to outbound mail"]]),"Save",function(fd){
  var n=(fd.name||"").trim();if(!n){return {error:"Enter a rule name."};}S.mailRules.push({id:nid("r"),name:n,what:fd.t});audit("New-TransportRule",n,"Exchange","Exchange");toast("Rule saved.");return null;});};
A.delRule=function(d){S.mailRules=S.mailRules.filter(function(r){return r.id!==d.id;});toast("Rule deleted.");};
