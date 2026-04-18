const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const ALPACA_BASE = "https://paper-api.alpaca.markets";
const ALPACA_DATA = "https://data.alpaca.markets";

// ── Proxy: Trading API ────────────────────────────────────────────────────────
app.all("/api/alpaca/*", async (req, res) => {
  const key    = req.headers["key_id"];
  const secret = req.headers["secret_key"];
  const path   = req.params[0];
  const qs     = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const url    = `${ALPACA_BASE}/v2/${path}${qs}`;
  try {
    const r = await fetch(url, {
      method: req.method,
      headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret, "Content-Type": "application/json" },
      body: ["POST","PUT","PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Proxy: Data API ───────────────────────────────────────────────────────────
app.all("/api/data/*", async (req, res) => {
  const key    = req.headers["key_id"];
  const secret = req.headers["secret_key"];
  const path   = req.params[0];
  const qs     = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const url    = `${ALPACA_DATA}/v2/${path}${qs}`;
  try {
    const r = await fetch(url, {
      headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret },
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── HTML Dashboard (ingebouwd) ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Alpha Desk</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
    :root{
      --bg:#070b14;--bg2:#0d1424;--border:rgba(167,139,250,.15);
      --purple:#a78bfa;--green:#00e5a0;--red:#ff4d6d;--yellow:#fbbf24;
      --text:#e2e8f0;--muted:#64748b;--mono:'Courier New',monospace
    }
    body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;min-height:100vh;padding-bottom:90px}
    body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(167,139,250,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,.04) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;z-index:0}

    /* Setup */
    #setup{position:fixed;inset:0;background:var(--bg);z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px}
    .s-icon{font-size:52px;margin-bottom:16px}
    .s-title{font-size:24px;font-weight:900;color:var(--purple);font-family:var(--mono);letter-spacing:3px;margin-bottom:8px}
    .s-sub{font-size:13px;color:var(--muted);text-align:center;line-height:1.7;margin-bottom:28px}
    .s-input{width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;color:var(--text);font-size:14px;font-family:var(--mono);margin-bottom:12px;outline:none}
    .s-btn{width:100%;background:var(--purple);border:none;border-radius:12px;padding:16px;color:var(--bg);font-size:16px;font-weight:900;cursor:pointer;letter-spacing:1px;margin-top:4px}

    /* Header */
    header{position:sticky;top:0;z-index:100;background:rgba(7,11,20,.96);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:14px 16px 10px}
    .h-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
    .logo{display:flex;align-items:center;gap:8px}
    .logo-icon{font-size:18px;color:var(--purple)}
    .logo-text{font-size:17px;font-weight:900;letter-spacing:3px;font-family:var(--mono)}
    .live-dot{display:inline-block;width:7px;height:7px;background:var(--green);border-radius:50%;margin-left:6px;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    .ref-btn{background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.3);color:var(--purple);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer}
    .upd-time{font-size:10px;color:var(--muted);font-family:var(--mono)}

    /* KPI */
    .kpi-strip{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:rgba(167,139,250,.06);border-bottom:1px solid var(--border)}
    .kpi{background:var(--bg2);padding:12px 14px}
    .kpi:first-child{background:rgba(167,139,250,.05)}
    .kpi-label{font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
    .kpi-value{font-size:16px;font-weight:800;font-family:var(--mono);line-height:1}
    .kpi-sub{font-size:10px;color:var(--muted);margin-top:2px}

    /* Error */
    .err-bar{background:rgba(255,77,109,.1);border-bottom:1px solid rgba(255,77,109,.3);color:var(--red);padding:10px 16px;font-size:12px}

    /* Content */
    .content{padding:16px;position:relative;z-index:1}
    .sec-title{font-size:13px;font-weight:700;color:var(--purple);letter-spacing:.5px;margin-bottom:12px}
    .hidden{display:none!important}

    /* Cards */
    .card{background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:12px}
    .card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
    .ticker{font-size:22px;font-weight:900;font-family:var(--mono);letter-spacing:1px}
    .sym-name{font-size:11px;color:var(--muted);margin-top:2px}
    .badges{display:flex;flex-direction:column;align-items:flex-end;gap:5px}
    .badge{border-radius:6px;padding:3px 9px;font-size:11px;font-weight:700;letter-spacing:.5px}
    .b-long{color:var(--green);background:rgba(0,229,160,.12)}
    .b-short{color:var(--red);background:rgba(255,77,109,.12)}
    .b-win{color:var(--green);background:rgba(0,229,160,.12)}
    .b-loss{color:var(--red);background:rgba(255,77,109,.12)}
    .b-filled{color:var(--green);background:rgba(0,229,160,.12)}
    .b-new{color:var(--yellow);background:rgba(251,191,36,.12)}
    .b-canceled{color:var(--muted);background:rgba(100,116,139,.12)}

    /* Prices */
    .pgrid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:12px}
    .pbox{background:var(--bg);border-radius:8px;padding:7px 6px;text-align:center}
    .plabel{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
    .pval{font-size:12px;font-weight:700;font-family:var(--mono)}
    .suggestion{display:flex;justify-content:space-between;background:rgba(167,139,250,.05);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:12px}

    /* Buttons */
    .btn-close{width:100%;background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.4);color:var(--red);border-radius:10px;padding:13px;font-size:14px;font-weight:700;cursor:pointer}
    .btn-buy{width:100%;background:rgba(0,229,160,.15);border:1px solid var(--green);color:var(--green);border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer}
    .btn-sell{width:100%;background:rgba(255,77,109,.15);border:1px solid var(--red);color:var(--red);border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer}

    /* Order form */
    .fg{margin-bottom:14px}
    .flabel{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;display:block}
    .finput{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px 14px;color:var(--text);font-size:15px;font-family:var(--mono);outline:none}
    .toggle{display:flex;background:var(--bg);border-radius:10px;overflow:hidden;border:1px solid var(--border)}
    .topt{flex:1;background:none;border:none;color:var(--muted);padding:11px 8px;font-size:13px;font-weight:700;cursor:pointer}
    .on-buy{background:rgba(0,229,160,.2);color:var(--green)}
    .on-sell{background:rgba(255,77,109,.2);color:var(--red)}
    .on-type{background:rgba(167,139,250,.2);color:var(--purple)}
    .place-btn{width:100%;border:2px solid;border-radius:14px;padding:16px;font-size:15px;font-weight:900;font-family:var(--mono);letter-spacing:1px;cursor:pointer;margin-top:6px}
    .pb-buy{background:rgba(0,229,160,.15);border-color:var(--green);color:var(--green)}
    .pb-sell{background:rgba(255,77,109,.15);border-color:var(--red);color:var(--red)}
    .or-ok{margin-top:12px;padding:12px 16px;border-radius:10px;border:1px solid var(--green);color:var(--green);background:rgba(0,229,160,.06);font-size:13px;line-height:1.5}
    .or-err{margin-top:12px;padding:12px 16px;border-radius:10px;border:1px solid var(--red);color:var(--red);background:rgba(255,77,109,.06);font-size:13px}

    /* Risk rows */
    .rrow{display:flex;justify-content:space-between;padding:9px 12px;background:var(--bg);border-radius:8px;margin-bottom:6px}
    .rlabel{font-size:13px;color:var(--muted)}
    .rval{font-size:13px;font-weight:700;font-family:var(--mono)}

    /* Watch */
    .wcard{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px}
    .whead{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
    .wprice{font-size:20px;font-weight:800;font-family:var(--mono)}
    .wgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px}
    .wbtns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .wbtn{border-radius:8px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid}

    /* Orders list */
    .ocard{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px 14px;display:grid;grid-template-columns:1fr auto;gap:4px;margin-bottom:8px}
    .osym{font-size:16px;font-weight:800;font-family:var(--mono)}
    .ometa{font-size:11px;color:var(--muted);margin-top:3px}
    .oprice{font-size:15px;font-weight:700;font-family:var(--mono);text-align:right}
    .otime{font-size:11px;color:var(--muted);text-align:right;margin-top:3px}

    /* Empty */
    .empty{text-align:center;padding:50px 20px;color:var(--muted)}
    .empty-icon{font-size:40px;margin-bottom:10px}

    /* Bottom nav */
    .bnav{position:fixed;bottom:0;left:0;right:0;background:rgba(7,11,20,.97);border-top:1px solid var(--border);display:flex;padding-bottom:env(safe-area-inset-bottom);z-index:100}
    .nbtn{flex:1;background:none;border:none;color:var(--muted);padding:10px 4px 8px;font-size:10px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px}
    .nbtn.active{color:var(--purple)}
    .nicon{font-size:20px}

    .green{color:var(--green)}.red{color:var(--red)}.yellow{color:var(--yellow)}.purple{color:var(--purple)}
    .quick-sym{background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);color:var(--purple);border-radius:8px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer;margin:0 4px 8px 0}
  </style>
</head>
<body>

<!-- Setup -->
<div id="setup">
  <div class="s-icon">◈</div>
  <div class="s-title">ALPHA DESK</div>
  <div class="s-sub">Vul je Alpaca Paper Trading<br>API keys in om te verbinden</div>
  <input class="s-input" id="inp-key" placeholder="API Key ID (begint met PK...)" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">
  <input class="s-input" id="inp-secret" type="password" placeholder="Secret Key" autocomplete="off" spellcheck="false">
  <button class="s-btn" onclick="connect()">◈ &nbsp;Verbinden met Alpaca</button>
</div>

<!-- App -->
<div id="app" class="hidden">
  <header>
    <div class="h-top">
      <div class="logo">
        <div class="logo-icon">◈</div>
        <div class="logo-text">ALPHA DESK<span class="live-dot"></span></div>
      </div>
      <button class="ref-btn" onclick="fetchAll()">↻ Refresh</button>
    </div>
    <div class="upd-time" id="upd-time">Verbinden...</div>
  </header>

  <div id="err-bar" class="err-bar hidden"></div>

  <div class="kpi-strip">
    <div class="kpi"><div class="kpi-label">Portfolio</div><div class="kpi-value" id="k-eq">—</div></div>
    <div class="kpi"><div class="kpi-label">Dag P&L</div><div class="kpi-value" id="k-pnl">—</div><div class="kpi-sub" id="k-pct">—</div></div>
    <div class="kpi"><div class="kpi-label">Posities</div><div class="kpi-value" id="k-pos">—</div><div class="kpi-sub" id="k-cash">—</div></div>
  </div>

  <div id="tab-portfolio" class="content"></div>
  <div id="tab-order"     class="content hidden"></div>
  <div id="tab-watchlist" class="content hidden"></div>
  <div id="tab-orders"    class="content hidden"></div>

  <nav class="bnav">
    <button class="nbtn active" onclick="goTab('portfolio')" id="nav-portfolio"><span class="nicon">💼</span>Portfolio</button>
    <button class="nbtn"        onclick="goTab('order')"     id="nav-order"><span class="nicon">📝</span>Order</button>
    <button class="nbtn"        onclick="goTab('watchlist')" id="nav-watchlist"><span class="nicon">👁</span>Watchlist</button>
    <button class="nbtn"        onclick="goTab('orders')"    id="nav-orders"><span class="nicon">📋</span>Historie</button>
  </nav>
</div>

<script>
var KEY='',SECRET='',account=null,positions=[],orders=[],quotes={},currentTab='portfolio';
var WATCH=['NVDA','META','MSFT','AAPL','TSM','NFLX','AMD','AMZN'];
var orderState={ticker:'NVDA',side:'buy',type:'market',qty:1,limitPrice:''};

function connect(){
  KEY=document.getElementById('inp-key').value.trim();
  SECRET=document.getElementById('inp-secret').value.trim();
  if(!KEY||!SECRET){alert('Vul beide keys in');return;}
  document.getElementById('setup').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  fetchAll();
  setInterval(fetchAll,30000);
}

async function api(path,opts){
  opts=opts||{};
  var h={'key_id':KEY,'secret_key':SECRET,'Content-Type':'application/json'};
  var res=await fetch('/api/alpaca/'+path,Object.assign({},opts,{headers:h,body:opts.body?JSON.stringify(opts.body):undefined}));
  return res.json();
}
async function dataApi(path){
  var res=await fetch('/api/data/'+path,{headers:{'key_id':KEY,'secret_key':SECRET}});
  return res.json();
}

async function fetchAll(){
  try{
    showErr(null);
    var results=await Promise.all([api('account'),api('positions'),api('orders?status=all&limit=30')]);
    account=results[0];positions=results[1];orders=Array.isArray(results[2])?results[2]:[];
    if(account.code)throw new Error(account.message||'API fout - controleer keys');
    var syms=Array.from(new Set(WATCH.concat(positions.map(function(p){return p.symbol})))).join(',');
    try{var q=await dataApi('stocks/quotes/latest?symbols='+syms);quotes=q.quotes||{};}catch(e){}
    updateKPIs();renderTab();
    document.getElementById('upd-time').textContent='Bijgewerkt: '+new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }catch(e){showErr(e.message);}
}

function updateKPIs(){
  if(!account)return;
  var eq=parseFloat(account.equity),le=parseFloat(account.last_equity),pnl=eq-le,pct=(pnl/le)*100,cash=parseFloat(account.cash);
  setEl('k-eq','$'+eq.toFixed(2));
  setEl('k-pnl',fmtUSD(pnl),pnl>=0?'green':'red');
  setEl('k-pct',fmtPct(pct),pnl>=0?'green':'red');
  setEl('k-pos',positions.length+' open');
  setEl('k-cash','cash $'+cash.toFixed(0));
}

function goTab(tab){
  currentTab=tab;
  ['portfolio','order','watchlist','orders'].forEach(function(t){
    document.getElementById('tab-'+t).classList.toggle('hidden',t!==tab);
    document.getElementById('nav-'+t).classList.toggle('active',t===tab);
  });
  renderTab();
}

function renderTab(){
  if(currentTab==='portfolio')renderPortfolio();
  else if(currentTab==='order')renderOrder();
  else if(currentTab==='watchlist')renderWatchlist();
  else if(currentTab==='orders')renderOrders();
}

function renderPortfolio(){
  var el=document.getElementById('tab-portfolio');
  if(!positions.length){el.innerHTML='<div class="sec-title">💼 Open Posities</div><div class="empty"><div class="empty-icon">📭</div>Geen open posities<br><small>Ga naar Order om te starten</small></div>';return;}
  var totalPnL=positions.reduce(function(s,p){return s+parseFloat(p.unrealized_pl||0)},0);
  el.innerHTML='<div class="sec-title">💼 Open Posities · P&L: <span class="'+(totalPnL>=0?'green':'red')+'">'+fmtUSD(totalPnL)+'</span></div>'+positions.map(posCard).join('');
}

function posCard(p){
  var pl=parseFloat(p.unrealized_pl),plp=parseFloat(p.unrealized_plpc)*100,isL=p.side==='long';
  var entry=parseFloat(p.avg_entry_price),cur=parseFloat(p.current_price),mkt=parseFloat(p.market_value);
  var tgt=isL?entry*1.02:entry*0.98,stp=isL?entry*0.99:entry*1.01;
  return '<div class="card" style="border-color:'+(pl>=0?'rgba(0,229,160,.25)':'rgba(255,77,109,.2)')+'">'+
    '<div class="card-head"><div><div class="ticker">'+p.symbol+'</div><div class="sym-name">'+p.qty+' aandelen</div></div>'+
    '<div class="badges"><span class="badge '+(isL?'b-long':'b-short')+'">'+(isL?'▲ LONG':'▼ SHORT')+'</span>'+
    '<span class="'+(pl>=0?'green':'red')+'" style="font-size:18px;font-weight:800;font-family:var(--mono)">'+fmtUSD(pl)+'</span></div></div>'+
    '<div class="pgrid">'+
      '<div class="pbox"><div class="plabel">Entry</div><div class="pval" style="color:#94a3b8">$'+entry.toFixed(2)+'</div></div>'+
      '<div class="pbox"><div class="plabel">Huidig</div><div class="pval" style="color:#e2e8f0">$'+cur.toFixed(2)+'</div></div>'+
      '<div class="pbox"><div class="plabel">Mkt Wrd</div><div class="pval purple">$'+mkt.toFixed(0)+'</div></div>'+
      '<div class="pbox"><div class="plabel">P&L %</div><div class="pval '+(pl>=0?'green':'red')+'">'+plp.toFixed(2)+'%</div></div>'+
    '</div>'+
    '<div class="suggestion"><span class="green">🎯 $'+tgt.toFixed(2)+'</span><span class="red">🛑 $'+stp.toFixed(2)+'</span></div>'+
    '<button class="btn-close" onclick="closePos(\''+p.symbol+'\')">Positie Sluiten</button></div>';
}

async function closePos(sym){
  if(!confirm(sym+' sluiten?'))return;
  await fetch('/api/alpaca/positions/'+sym,{method:'DELETE',headers:{'key_id':KEY,'secret_key':SECRET}});
  setTimeout(fetchAll,1500);
}

function renderOrder(){
  var el=document.getElementById('tab-order');
  var q=quotes[orderState.ticker];
  var mid=q?(parseFloat(q.ap)+parseFloat(q.bp))/2:null;
  var isL=orderState.side==='buy',entry=mid||100;
  var tgt=isL?entry*1.02:entry*0.98,stp=isL?entry*0.99:entry*1.01;
  var reward=Math.abs((tgt-entry)*orderState.qty),risk=Math.abs((stp-entry)*orderState.qty);
  el.innerHTML=
    '<div class="sec-title">📝 Order Plaatsen</div>'+
    '<div class="card">'+
      '<div class="fg"><label class="flabel">Ticker</label><input class="finput" id="of-t" value="'+orderState.ticker+'" oninput="orderState.ticker=this.value.toUpperCase();this.value=orderState.ticker;renderOrder()" autocorrect="off" autocapitalize="characters"></div>'+
      '<div class="fg"><label class="flabel">Richting</label><div class="toggle">'+
        '<button class="topt '+(orderState.side==='buy'?'on-buy':'')+'" onclick="orderState.side=\'buy\';renderOrder()">▲ LONG</button>'+
        '<button class="topt '+(orderState.side==='sell'?'on-sell':'')+'" onclick="orderState.side=\'sell\';renderOrder()">▼ SHORT</button></div></div>'+
      '<div class="fg"><label class="flabel">Aantal Aandelen</label><input class="finput" type="number" min="1" value="'+orderState.qty+'" oninput="orderState.qty=parseInt(this.value)||1;renderOrder()" inputmode="numeric"></div>'+
      '<div class="fg"><label class="flabel">Type</label><div class="toggle">'+
        '<button class="topt '+(orderState.type==='market'?'on-type':'')+'" onclick="orderState.type=\'market\';renderOrder()">Market</button>'+
        '<button class="topt '+(orderState.type==='limit'?'on-type':'')+'" onclick="orderState.type=\'limit\';renderOrder()">Limit</button></div></div>'+
      (orderState.type==='limit'?'<div class="fg"><label class="flabel">Limietprijs ($)</label><input class="finput" type="number" step="0.01" value="'+orderState.limitPrice+'" oninput="orderState.limitPrice=this.value" placeholder="bijv. 196.50" inputmode="decimal"></div>':'')+
      '<button class="place-btn '+(isL?'pb-buy':'pb-sell')+'" onclick="placeOrder()">'+(isL?'▲ LONG':'▼ SHORT')+' '+orderState.ticker+' · '+orderState.qty+' stuk · '+orderState.type.toUpperCase()+'</button>'+
      '<div id="or-result"></div></div>'+
    '<div class="sec-title" style="margin-top:16px">📐 Risico Calculator</div>'+
    '<div class="card">'+
      '<div class="rrow"><span class="rlabel">Live koers</span><span class="rval">'+(mid?'$'+mid.toFixed(2):'geen quote')+'</span></div>'+
      '<div class="rrow"><span class="rlabel">Target (+2%)</span><span class="rval green">$'+tgt.toFixed(2)+'</span></div>'+
      '<div class="rrow"><span class="rlabel">Stop-loss (-1%)</span><span class="rval red">$'+stp.toFixed(2)+'</span></div>'+
      '<div class="rrow"><span class="rlabel">Max winst</span><span class="rval green">$'+reward.toFixed(2)+'</span></div>'+
      '<div class="rrow"><span class="rlabel">Max verlies</span><span class="rval red">$'+risk.toFixed(2)+'</span></div>'+
      '<div class="rrow"><span class="rlabel">Risk/Reward</span><span class="rval purple">2 : 1</span></div>'+
      '<div class="rrow"><span class="rlabel">Investering</span><span class="rval yellow">$'+(entry*orderState.qty).toFixed(2)+'</span></div></div>'+
    '<div class="sec-title" style="margin-top:16px">⚡ Snelle selectie</div>'+
    '<div style="display:flex;flex-wrap:wrap;padding-bottom:8px">'+WATCH.map(function(s){return '<button class="quick-sym" onclick="orderState.ticker=\''+s+'\';renderOrder()">'+s+'</button>'}).join('')+'</div>';
}

async function placeOrder(){
  var r=document.getElementById('or-result');
  if(r)r.innerHTML='<div class="or-ok">⏳ Verwerken...</div>';
  try{
    var body={symbol:orderState.ticker,qty:String(orderState.qty),side:orderState.side,type:orderState.type,time_in_force:'day'};
    if(orderState.type==='limit')body.limit_price=orderState.limitPrice;
    var res=await fetch('/api/alpaca/orders',{method:'POST',headers:{'key_id':KEY,'secret_key':SECRET,'Content-Type':'application/json'},body:JSON.stringify(body)});
    var data=await res.json();
    if(data.id){
      if(r)r.innerHTML='<div class="or-ok">✅ Order geplaatst! '+data.symbol+' '+data.side.toUpperCase()+' '+data.qty+' aandelen</div>';
      setTimeout(fetchAll,2000);
    }else{throw new Error(data.message||JSON.stringify(data));}
  }catch(e){if(r)r.innerHTML='<div class="or-err">❌ '+e.message+'</div>';}
}

function renderWatchlist(){
  var el=document.getElementById('tab-watchlist');
  var hasQ=Object.keys(quotes).length>0;
  el.innerHTML='<div class="sec-title">👁 Watchlist · Live Quotes</div>'+
    (!hasQ?'<div class="empty"><div class="empty-icon">📡</div>Quotes niet beschikbaar<br><small>Markt opent 15:30 NL · Tik Refresh</small></div>':'')+
    WATCH.map(function(sym){
      var q=quotes[sym],ask=q?parseFloat(q.ap):null,bid=q?parseFloat(q.bp):null;
      var mid=ask&&bid?(ask+bid)/2:null,spread=ask&&bid?((ask-bid)/ask*100).toFixed(3):null;
      return '<div class="wcard">'+
        '<div class="whead"><div class="ticker">'+sym+'</div><div class="wprice">'+(mid?'$'+mid.toFixed(2):'—')+'</div></div>'+
        (q?'<div class="wgrid"><div class="pbox"><div class="plabel">Bid</div><div class="pval red">$'+bid.toFixed(2)+'</div></div><div class="pbox"><div class="plabel">Ask</div><div class="pval green">$'+ask.toFixed(2)+'</div></div><div class="pbox"><div class="plabel">Spread</div><div class="pval yellow">'+spread+'%</div></div></div>':'<div style="color:var(--muted);font-size:12px;text-align:center;margin-bottom:10px">Geen quote</div>')+
        '<div class="wbtns">'+
          '<button class="wbtn" style="color:var(--green);border-color:var(--green);background:rgba(0,229,160,.08)" onclick="orderState.ticker=\''+sym+'\';orderState.side=\'buy\';goTab(\'order\')">▲ Long</button>'+
          '<button class="wbtn" style="color:var(--red);border-color:var(--red);background:rgba(255,77,109,.08)" onclick="orderState.ticker=\''+sym+'\';orderState.side=\'sell\';goTab(\'order\')">▼ Short</button>'+
        '</div></div>';
    }).join('');
}

function renderOrders(){
  var el=document.getElementById('tab-orders');
  if(!orders.length){el.innerHTML='<div class="sec-title">📋 Order Historie</div><div class="empty"><div class="empty-icon">📭</div>Nog geen orders</div>';return;}
  el.innerHTML='<div class="sec-title">📋 Order Historie ('+orders.length+')</div>'+
    orders.map(function(o){
      var isL=o.side==='buy',sc='b-'+o.status;
      var price=o.filled_avg_price?'$'+parseFloat(o.filled_avg_price).toFixed(2):o.limit_price?'lmt $'+parseFloat(o.limit_price).toFixed(2):'market';
      var time=new Date(o.created_at).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
      return '<div class="ocard">'+
        '<div><div class="osym">'+o.symbol+' <span class="badge '+(isL?'b-long':'b-short')+'" style="font-size:10px;vertical-align:middle">'+(isL?'▲':'▼')+' '+o.side.toUpperCase()+'</span></div>'+
        '<div class="ometa">'+o.qty+' stuk · '+o.type+' · <span class="badge '+sc+'">'+o.status+'</span></div></div>'+
        '<div><div class="oprice">'+price+'</div><div class="otime">'+time+'</div></div></div>';
    }).join('');
}

function fmtUSD(v){return(v>=0?'+':'-')+'$'+Math.abs(v).toFixed(2);}
function fmtPct(v){return(v>=0?'+':'')+v.toFixed(2)+'%';}
function setEl(id,txt,cls){var e=document.getElementById(id);if(!e)return;e.textContent=txt;if(cls){e.className='kpi-value '+cls;}}
function showErr(msg){var e=document.getElementById('err-bar');if(!e)return;if(msg){e.textContent='⚠️ '+msg;e.classList.remove('hidden');}else{e.classList.add('hidden');}}
</script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Alpha Desk draait op poort " + PORT));
