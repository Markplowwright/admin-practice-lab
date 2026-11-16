"use strict";
/* =============== PROCUREMENT + STAGING BENCH ===============
   The learner orders new devices, receives them on the bench by typing the serial
   from the box label, and clears requests that the order itself raises.
   Devices made here live in S.procure.devs, NOT in S.devices: they only appear in
   AD, Entra, Intune and the remote console once they are imaged (a later update). */
var PMODELS={
  laptop:[["Dell","Latitude 5440"],["Lenovo","ThinkPad E14"],["HP","EliteBook 840 G10"]],
  desktop:[["Dell","OptiPlex 7010 Tower"],["Lenovo","ThinkCentre M70t"],["HP","EliteDesk 800 G9 Tower"]],
  monitor:[["Dell","P2423 24-inch"],["HP","E24 G5 24-inch"]]
};
function pBlank(){return {n:0,t:1051,tab:"order",form:{type:"",model:0,mon:1,monModel:0,user:""},devs:[],reqs:[]};}
function P(){if(!S.procure){S.procure=pBlank();}return S.procure;}
function pDev(id){return P().devs.filter(function(d){return d.id===id;})[0];}
function pSerial(n,pre){var x=48210+n*97;return pre+String(x).slice(-5)+String.fromCharCode(65+(n*7)%26);}
function pTag(n){return "APL-"+("000"+n).slice(-4);}
function pLabel(d){return d.maker+" "+d.model;}
function pUserName(id){var u=id?U(id):null;return u?u.name:"Unassigned";}
function pMonitor(k,n){var m=PMODELS.monitor[k]||PMODELS.monitor[0];return {maker:m[0],model:m[1],serial:pSerial(n,"MN")};}
function pOpenReqs(){return P().reqs.filter(function(r){return !pReqDone(r);}).length;}
function pBenchCount(){return P().devs.filter(function(d){return d.stage==="received";}).length;}

/* Rules that raise a request. Deterministic: the same order always raises the same requests. */
function pRaise(d){
  var p=P();
  if(d.type==="desktop"&&!d.monitors.length){
    p.reqs.push({id:"r"+(p.reqs.length+1),no:p.t++,kind:"nomon",dev:d.id,title:"Desktop ordered with no monitor",
      body:"Order "+d.tag+" is a desktop tower with no display. Nobody can image or use it without one. Add a monitor to the order."});
  }
  var has=d.user?S.devices.filter(function(x){return x.userId===d.user&&x.state==="enrolled";})[0]:null;
  if(d.type==="laptop"&&has){
    p.reqs.push({id:"r"+(p.reqs.length+1),no:p.t++,kind:"dup",dev:d.id,title:pUserName(d.user)+" already has a managed laptop",
      body:pUserName(d.user)+" already has "+has.name+" enrolled in Intune. Decide: is this a replacement (keep the order) or a mistake (cancel it)?"});
  }
}
function pReqDone(r){
  var d=pDev(r.dev);
  if(r.kind==="nomon"){return !d||d.stage==="cancelled"||d.monitors.length>0;}
  if(r.kind==="dup"){return !!r.choice;}
  return false;
}

/* ---------- pages ---------- */
function pTabs(){
  var p=P(),o=pOpenReqs();p.tab=S.page;
  function t(k,l,extra){return '<button type="button" class="'+(S.page===k?'on':'')+'" data-a="pTab" data-k="'+k+'">'+esc(l)+(extra||"")+'</button>';}
  return '<div class="ptop"><b>Procurement</b><span class="psub">Vendor portal (simulated)</span><nav>'+t("order","New order")+t("bench","Orders and bench",pBenchCount()?' <i>'+pBenchCount()+'</i>':"")+t("reqs","Requests",o?' <i class="hot">'+o+'</i>':"")+'</nav></div>';
}
function pTypeCard(k,label,sub,on,off){
  return '<button type="button" class="ptype'+(on?' on':'')+(off?' off':'')+'" data-a="'+(off?'pSoon':'pType')+'" data-k="'+k+'"'+(on?' aria-pressed="true"':'')+'><span class="pic pic-'+k+'" aria-hidden="true"></span><b>'+esc(label)+'</b><small>'+esc(sub)+'</small>'+(off?'<em>Coming soon</em>':'')+'</button>';
}
function pChips(list,sel,act,fmt){
  return '<div class="pchips">'+list.map(function(m,i){return '<button type="button" class="'+(sel===i?'on':'')+'" data-a="'+act+'" data-k="'+i+'">'+esc(fmt?fmt(m):m[0]+" "+m[1])+'</button>';}).join("")+'</div>';
}
function pOrderForm(){
  var f=P().form,h="";
  if(!f.type){return '<p class="pnote">Choose what kind of device you are ordering.</p>';}
  h+='<div class="pcfg"><h3>'+(f.type==="laptop"?"Laptop":"Desktop")+' model</h3>'+pChips(PMODELS[f.type],f.model,"pModel");
  if(f.type==="desktop"){
    h+='<h3>Monitors</h3>'+pChips([0,1,2],f.mon,"pMon",function(n){return n+(n===1?" monitor":" monitors");});
    if(f.mon>0){h+='<h3>Monitor model</h3>'+pChips(PMODELS.monitor,f.monModel,"pMonModel");}
  }
  h+='<h3>Assign to</h3><select data-ch="pUser" aria-label="Assign to"><option value="">Nobody yet (spare)</option>'+S.users.filter(function(u){return !u.deleted;}).map(function(u){return '<option value="'+u.id+'"'+(f.user===u.id?' selected':'')+'>'+esc(u.name)+'</option>';}).join("")+'</select></div>';
  var m=PMODELS[f.type][f.model];
  h+='<aside class="psum"><h3>Order summary</h3><dl><dt>Device</dt><dd>'+esc(m[0]+" "+m[1])+'</dd>'+(f.type==="desktop"?'<dt>Monitors</dt><dd>'+(f.mon?f.mon+" x "+esc(PMODELS.monitor[f.monModel].join(" ")):"None")+'</dd>':'')+'<dt>Assigned to</dt><dd>'+esc(pUserName(f.user))+'</dd></dl><button type="button" class="pbtn pri" data-a="pOrder">Place order</button></aside>';
  return h;
}
PAGES["procure.order"]=function(){
  var f=P().form;
  return '<div class="pc">'+pTabs()+'<div class="pbody"><h2>New device order</h2><div class="ptypes">'+pTypeCard("laptop","Laptop","Windows laptop for a person",f.type==="laptop")+pTypeCard("desktop","Desktop","Tower plus monitors",f.type==="desktop")+pTypeCard("phone","Phone","Mobile device",false,true)+'</div><div class="porder">'+pOrderForm()+'</div></div></div>';
};
function pRow(d){
  var st=d.stage==="ordered"?'<span class="pst warn">Shipped. Receive it</span>':d.stage==="received"?'<span class="pst ok">On the staging bench</span>':'<span class="pst">Cancelled</span>';
  var act="";
  if(d.stage==="ordered"){act='<span class="pbox">Box label: <code>'+esc(d.serial)+'</code></span><input type="text" id="ps-'+d.id+'" data-enter="pReceive" data-id="'+d.id+'" placeholder="Type the serial" aria-label="Serial for '+esc(d.tag)+'" autocomplete="off"><button type="button" class="pbtn" data-a="pReceive" data-id="'+d.id+'">Receive</button>';}
  else if(d.stage==="received"){act='<span class="pnote">Waiting for imaging. Imaging is the next update.</span>';}
  var mons=d.monitors.length?'<div class="pmons">'+d.monitors.map(function(m){return '<span>Monitor: '+esc(m.maker+" "+m.model)+' <code>'+esc(m.serial)+'</code></span>';}).join("")+'</div>':(d.type==="desktop"&&d.stage!=="cancelled"?'<div class="pmons bad">No monitor on this order</div>':'');
  return '<div class="prow"><div class="pmain"><b>'+esc(d.tag)+'</b> '+esc(pLabel(d))+' <span class="ptag">'+(d.type==="laptop"?"Laptop":"Desktop")+'</span><div class="psmall">For '+esc(pUserName(d.user))+(d.stage!=="ordered"?' &middot; serial <code>'+esc(d.serial)+'</code>':'')+'</div>'+mons+'</div><div class="pstat">'+st+'</div><div class="pact">'+act+'</div></div>';
}
PAGES["procure.bench"]=function(){
  var p=P(),h=p.devs.length?p.devs.map(pRow).join(""):'<p class="pnote">Nothing ordered yet. Place an order on the New order tab.</p>';
  return '<div class="pc">'+pTabs()+'<div class="pbody"><h2>Orders and staging bench</h2><p class="pnote">Ordered devices arrive in a box. Check the serial on the box label against the order before it goes on the bench.</p>'+h+'</div></div>';
};
PAGES["procure.reqs"]=function(){
  var p=P(),h=p.reqs.length?p.reqs.slice().reverse().map(function(r){
    var done=pReqDone(r),d=pDev(r.dev),act="";
    if(!done&&r.kind==="nomon"&&d){act='<button type="button" class="pbtn pri" data-a="pAddMon" data-id="'+d.id+'">Add a monitor to the order</button>';}
    if(!done&&r.kind==="dup"){act='<button type="button" class="pbtn pri" data-a="pDup" data-id="'+r.id+'" data-k="keep">Replacement: keep the order</button><button type="button" class="pbtn" data-a="pDup" data-id="'+r.id+'" data-k="cancel">Mistake: cancel the order</button>';}
    return '<div class="prow req'+(done?' done':'')+'"><div class="pmain"><b>#'+r.no+' '+esc(r.title)+'</b><div class="psmall">'+esc(r.body)+'</div>'+(done&&r.choice?'<div class="psmall">Resolved: '+(r.choice==="keep"?"kept as a replacement":"order cancelled")+'</div>':'')+'</div><div class="pstat">'+(done?'<span class="pst ok">Resolved</span>':'<span class="pst warn">Open</span>')+'</div><div class="pact">'+act+'</div></div>';
  }).join(""):'<p class="pnote">No requests. Orders that look wrong raise one here, for example a desktop with no monitor.</p>';
  return '<div class="pc">'+pTabs()+'<div class="pbody"><h2>Requests</h2>'+h+'</div></div>';
};

/* ---------- actions ---------- */
A.pTab=function(d){P().tab=d.k;S.page=d.k;};
A.pType=function(d){var f=P().form;f.type=d.k;f.model=0;S.page="order";P().tab="order";};
A.pSoon=function(){toast("Phones are coming soon. Order a laptop or a desktop for now.");};
A.pModel=function(d){P().form.model=+d.k;};
A.pMon=function(d){P().form.mon=+d.k;};
A.pMonModel=function(d){P().form.monModel=+d.k;};
A.pUser=function(d,el){P().form.user=el.value;};
A.pOrder=function(){
  var p=P(),f=p.form;if(!f.type){return;}
  var m=PMODELS[f.type][f.model];p.n+=1;
  var dev={id:"p"+p.n,type:f.type,maker:m[0],model:m[1],tag:pTag(p.n),serial:pSerial(p.n,f.type==="laptop"?"LP":"DT"),user:f.user||null,monitors:[],stage:"ordered"};
  if(f.type==="desktop"){for(var i=0;i<f.mon;i++){dev.monitors.push(pMonitor(f.monModel,p.n*10+i));}}
  p.devs.push(dev);pRaise(dev);
  p.form={type:"",model:0,mon:1,monModel:0,user:""};p.tab="bench";S.page="bench";
  var o=p.reqs.filter(function(r){return r.dev===dev.id;}).length;
  toast("Ordered "+dev.tag+". It has shipped."+(o?" The order raised a request. Check the Requests tab.":""));
};
A.pReceive=function(d,el){
  var dev=pDev(d.id||(el&&el.getAttribute("data-id")));if(!dev||dev.stage!=="ordered"){return;}
  var inp=document.getElementById("ps-"+dev.id),v=((inp&&inp.value)||"").trim().toUpperCase();
  if(!v){toast("Type the serial number from the box label first.");return;}
  if(v!==dev.serial){toast("That serial does not match the order. Check the box label again.");return;}
  dev.stage="received";toast(dev.tag+" is on the staging bench.");
};
A.pAddMon=function(d){var dev=pDev(d.id);if(!dev){return;}dev.monitors.push(pMonitor(0,P().n*10+dev.monitors.length+5));toast("Monitor added to "+dev.tag+".");};
A.pDup=function(d){
  var r=P().reqs.filter(function(x){return x.id===d.id;})[0];if(!r){return;}
  r.choice=d.k;if(d.k==="cancel"){var dev=pDev(r.dev);if(dev){dev.stage="cancelled";}}
};
