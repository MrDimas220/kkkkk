const $=s=>document.querySelector(s);
const KEY='cryptonest-demo-v2',FEE=.003;
const COINS=[
 {s:'BTC',n:'Bitcoin',id:'bitcoin',p:67420,c:2.4,m:1.33e12},
 {s:'ETH',n:'Ethereum',id:'ethereum',p:3520,c:1.2,m:4.23e11},
 {s:'USDT',n:'Tether',id:'tether',p:1,c:0,m:1.1e11},
 {s:'BNB',n:'BNB',id:'binancecoin',p:590,c:-0.6,m:8.6e10},
 {s:'SOL',n:'Solana',id:'solana',p:172,c:3.1,m:7.8e10},
 {s:'USDC',n:'USD Coin',id:'usd-coin',p:1,c:0,m:3.3e10},
 {s:'XRP',n:'XRP',id:'ripple',p:0.52,c:-1.4,m:2.9e10},
 {s:'DOGE',n:'Dogecoin',id:'dogecoin',p:0.15,c:4.2,m:2.2e10},
 {s:'TON',n:'Toncoin',id:'the-open-network',p:5.6,c:0.9,m:1.4e10},
 {s:'ADA',n:'Cardano',id:'cardano',p:0.45,c:-0.8,m:1.6e10},
 {s:'TRX',n:'TRON',id:'tron',p:0.13,c:0.5,m:1.15e10},
 {s:'AVAX',n:'Avalanche',id:'avalanche-2',p:29,c:2.0,m:1.1e10},
 {s:'SHIB',n:'Shiba Inu',id:'shiba-inu',p:0.0000175,c:3.4,m:1.03e10},
 {s:'LINK',n:'Chainlink',id:'chainlink',p:14.5,c:1.7,m:8.5e9},
 {s:'DOT',n:'Polkadot',id:'polkadot',p:6.2,c:-1.1,m:8.4e9},
 {s:'BCH',n:'Bitcoin Cash',id:'bitcoin-cash',p:420,c:0.7,m:8.3e9},
 {s:'LTC',n:'Litecoin',id:'litecoin',p:84,c:0.4,m:6.3e9},
 {s:'UNI',n:'Uniswap',id:'uniswap',p:9.8,c:2.6,m:5.9e9},
 {s:'NEAR',n:'NEAR Protocol',id:'near',p:6.9,c:-2.3,m:7.5e9},
 {s:'ATOM',n:'Cosmos',id:'cosmos',p:7.4,c:1.3,m:2.9e9},
 {s:'XLM',n:'Stellar',id:'stellar',p:0.11,c:-0.4,m:3.3e9}
];
const STABLE=new Set(['USDT','USDC']),START=1000;
const DEF={wallet:{USDT:START},hist:[],profile:null,photo:null,cost:{},fut:{pos:[],hist:[]}};
let recovered=false,saveWarned=false;
let coins=COINS.map(c=>({...c})),sel='BTC',period='24H',sortK='cap',live=false,db=load();

function clean(d){
  if(!d||typeof d!=='object'||!d.wallet||typeof d.wallet!=='object')return null;
  const ok=new Set(COINS.map(c=>c.s)),num=n=>typeof n==='number'&&isFinite(n),w={};
  for(const [k,v] of Object.entries(d.wallet))if(ok.has(k)&&num(v)&&v>=0)w[k]=v;
  const hist=(Array.isArray(d.hist)?d.hist:[]).filter(o=>o&&ok.has(o.f)&&ok.has(o.t)&&[o.a,o.out,o.at].every(num)).slice(0,50);
  const p=d.profile,profile=p&&typeof p.nick==='string'&&typeof p.mail==='string'&&p.nick.trim()?{nick:p.nick.slice(0,24),mail:p.mail.slice(0,120)}:null;
  const photo=typeof d.photo==='string'&&d.photo.length<300000&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(d.photo)?d.photo:null;
  const cost={};if(d.cost&&typeof d.cost==='object')for(const [k,v] of Object.entries(d.cost))if(ok.has(k)&&num(v)&&v>=0)cost[k]=v;
  const fp=d.fut&&Array.isArray(d.fut.pos)?d.fut.pos.filter(p=>p&&ok.has(p.sym)&&(p.side==='long'||p.side==='short')&&[p.id,p.lev,p.margin,p.entry,p.size,p.at].every(num)&&p.lev>=1&&p.entry>0&&p.size>0).slice(0,20):[];
  const fh=d.fut&&Array.isArray(d.fut.hist)?d.fut.hist.filter(o=>o&&ok.has(o.sym)&&(o.side==='long'||o.side==='short')&&[o.lev,o.res,o.at].every(num)&&typeof o.reason==='string').slice(0,30):[];
  return{wallet:w,hist,profile,photo,cost,fut:{pos:fp,hist:fh}};
}
function load(){
  let raw=null;
  try{raw=localStorage.getItem(KEY)}catch(e){}
  if(raw!==null){
    let d=null;try{d=clean(JSON.parse(raw))}catch(e){}
    if(d)return d;
    recovered=true;
  }
  return JSON.parse(JSON.stringify(DEF));
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(db))}
  catch(e){if(!saveWarned){saveWarned=true;toast('Не вдалося зберегти дані в браузері. Зміни зникнуть після перезавантаження.',true)}}
}
const by=s=>coins.find(c=>c.s===s);
const usd=n=>n>=1?n.toLocaleString('en-US',{style:'currency',currency:'USD'}):n>=0.01?'$'+n.toFixed(4):'$'+n.toLocaleString('en-US',{maximumSignificantDigits:3,maximumFractionDigits:10});
const qty=n=>Math.abs(n)>=1||n===0?n.toLocaleString('en-US',{maximumFractionDigits:6}):n.toLocaleString('en-US',{maximumSignificantDigits:4,maximumFractionDigits:12});
const pct=n=>(n>=0?'+':'')+n.toFixed(2)+'%';
function cap(n){return n>=1e12?'$'+(n/1e12).toFixed(2)+' трлн':n>=1e9?'$'+(n/1e9).toFixed(1)+' млрд':'$'+(n/1e6).toFixed(0)+' млн'}
function toast(t,err){const e=document.createElement('div');e.className='toast'+(err?' err':'');e.textContent=t;$('#toasts').append(e);setTimeout(()=>e.remove(),3500)}

/* Форми працюють без нативної відправки (у пісочницях вона заблокована) */
function bindForm(form,fn){
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('click',e=>{if(e.target.closest('button[type=submit]')){e.preventDefault();fn()}});
  form.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();fn()}});
}

const sgn=n=>(n>=0?'+':'−')+usd(Math.abs(n));

function labels(r,a){[...r.cells].forEach((c,i)=>{c.dataset.label=a[i]||''})}

/* Ринок: ціни (Binance, запасно CoinGecko), таблиця, історія та графік */
const BIN='https://data-api.binance.vision/api/v3',GECKO='https://api.coingecko.com/api/v3';
const SYMS=COINS.filter(c=>c.s!=='USDT').map(c=>c.s+'USDT');
const IV={'1H':['1m',60],'24H':['15m',96],'7D':['1h',168],'30D':['4h',180]};
const DAYS={'1H':1,'24H':1,'7D':7,'30D':30};
const HCACHE={};
let busy=false,lastOk=null,src='',timer=null,htoken=0,hstate={status:'loading'};
const vol=c=>c.v??c.m*.05;
const hhmm=d=>d.toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});

async function getJSON(url){
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),8000);
  try{const r=await fetch(url,{signal:ctl.signal});if(!r.ok)throw new Error(r.status);return await r.json()}
  finally{clearTimeout(t)}
}
function setStatus(){
  const base='Демо-режим: баланс умовний. ';
  $('#status').textContent=live?base+'Ціни живі ('+src+'), оновлено о '+hhmm(lastOk)+'.'
    :lastOk?base+'Не вдалося оновити ціни. Показано застарілі дані за '+hhmm(lastOk)+'.'
    :base+'Немає зв’язку з біржею: ціни симулюються, це не реальні котирування.';
}
async function fromBinance(){
  const d=await getJSON(BIN+'/ticker/24hr?symbols='+encodeURIComponent(JSON.stringify(SYMS)));
  let n=0;
  d.forEach(x=>{const c=by(String(x.symbol).replace(/USDT$/,'')),p=parseFloat(x.lastPrice);
    if(c&&p>0){c.p=p;c.c=parseFloat(x.priceChangePercent)||0;c.v=parseFloat(x.quoteVolume)||c.v;n++}});
  if(n<5)throw new Error('empty');
  const u=by('USDT');u.p=1;u.c=0;u.v=0;
}
async function fromGecko(){
  const d=await getJSON(GECKO+'/coins/markets?vs_currency=usd&ids='+COINS.map(c=>c.id).join(','));
  let n=0;
  d.forEach(x=>{const c=coins.find(k=>k.id===x.id);
    if(c&&isFinite(x.current_price)){c.p=x.current_price;c.c=x.price_change_percentage_24h??0;c.v=x.total_volume||c.v;c.m=x.market_cap||c.m;n++}});
  if(!n)throw new Error('empty');
}
function schedule(){
  clearTimeout(timer);
  const ms=live?(src==='CoinGecko'?60000:5000):15000;
  timer=setTimeout(()=>{document.hidden?schedule():fetchPrices()},ms);
}
async function fetchPrices(){
  if(busy)return;busy=true;
  try{
    try{await fromBinance();src='Binance'}catch(e){await fromGecko();src='CoinGecko'}
    lastOk=new Date();live=true;
  }catch(e){live=false}
  finally{busy=false;setStatus();renderTable();renderChart();renderSwap();renderWallet();tickFutures();schedule()}
}

function renderTable(){
  const q=$('#q').value.trim().toLowerCase(),val=c=>sortK==='cap'?vol(c):sortK==='p'?c.p:c.c;
  const rows=coins.filter(c=>!q||c.s.toLowerCase().includes(q)||c.n.toLowerCase().includes(q)).sort((a,b)=>val(b)-val(a));
  const tb=$('#tbody');tb.textContent='';
  if(!rows.length){const td=tb.insertRow().insertCell();td.colSpan=4;td.style.textAlign='center';td.textContent='Нічого не знайдено. Спробуй інший запит.';return}
  rows.forEach(c=>{
    const tr=tb.insertRow();tr.tabIndex=0;tr.className=c.s===sel?'sel':'';
    tr.innerHTML='<td></td><td class="num"></td><td class="num"></td><td class="num"></td>';
    tr.cells[0].textContent=c.n;const s=document.createElement('span');s.className='sym';s.textContent=c.s;tr.cells[0].append(s);
    tr.cells[1].textContent=usd(c.p);
    tr.cells[2].textContent=pct(c.c);tr.cells[2].className='num '+(c.c>=0?'up':'down');
    tr.cells[3].textContent=vol(c)>0?cap(vol(c)):'—';tr.cells[3].className='num hm';
    const pick=()=>{sel=c.s;renderTable();loadHistory()};
    tr.onclick=pick;tr.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}};
  });
}

/* Історія: Binance (свічки), запасно CoinGecko, в крайньому разі — підписана симуляція */
async function loadHistory(){
  const c=by(sel),key=c.s+period,tok=++htoken,hit=HCACHE[key];
  if(hit&&Date.now()-hit.at<60000){hstate={status:'ok',pts:hit.pts,src:hit.src};renderChart();return}
  hstate={status:'loading'};renderChart();
  let pts=null,from='';
  try{
    if(c.s==='USDT')throw new Error('no pair');
    const [iv,lim]=IV[period];
    const d=await getJSON(`${BIN}/klines?symbol=${c.s}USDT&interval=${iv}&limit=${lim}`);
    pts=d.map(k=>[Number(k[0]),parseFloat(k[4])]).filter(p=>isFinite(p[0])&&isFinite(p[1]));from='Binance';
    if(pts.length<2)throw new Error('empty');
  }catch(e){
    try{
      const d=await getJSON(`${GECKO}/coins/${c.id}/market_chart?vs_currency=usd&days=${DAYS[period]}`);
      pts=(d.prices||[]).filter(p=>isFinite(p[0])&&isFinite(p[1]));from='CoinGecko';
      if(pts.length<2)throw new Error('empty');
    }catch(e2){pts=null}
  }
  if(tok!==htoken)return;
  if(pts){HCACHE[key]={pts,at:Date.now(),src:from};hstate={status:'ok',pts,src:from}}
  else hstate={status:'sim',pts:simPts(c)};
  renderChart();
}
function simPts(c){
  let h=0;for(const ch of c.s+period)h=Math.imul(h^ch.charCodeAt(0),16777619);
  const r=()=>{h|=0;h=h+0x6D2B79F5|0;let t=Math.imul(h^h>>>15,1|h);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const span={'1H':36e5,'24H':864e5,'7D':6048e5,'30D':2592e6}[period],vl={'1H':.004,'24H':.012,'7D':.03,'30D':.07}[period]*(c.s==='USDT'?.02:1),now=Date.now(),v=[c.p];
  for(let i=1;i<60;i++)v.unshift(v[0]*(1+(r()-.5)*vl));
  return v.map((y,i)=>[now-span+span*i/59,y]);
}
/* Остання точка графіка завжди дорівнює поточній ціні, тож лінія рухається наживо */
function visiblePts(){
  const c=by(sel);let p=hstate.pts;
  if(period==='1H'){const from=p[p.length-1][0]-3600e3;p=p.filter(x=>x[0]>=from)}
  return p.slice(0,-1).concat([[Math.max(Date.now(),p[p.length-1][0]),c.p]]);
}
const tfmt=ts=>{const d=new Date(ts);return period==='7D'||period==='30D'?d.toLocaleString('uk-UA',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):hhmm(d)};
let geom=null;
function renderChart(hover){
  const c=by(sel),note=$('#cnote'),cv=$('#cv');
  $('#cname').textContent=c.n+' · '+c.s;$('#cpx').textContent=usd(c.p);
  const dpr=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;
  cv.width=w*dpr;cv.height=h*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);x.clearRect(0,0,w,h);geom=null;
  if(hstate.status==='loading'){note.textContent='Завантажую історію цін…';return}
  const p=visiblePts();
  if(hstate.status==='sim'){
    note.textContent='Історію цін завантажити не вдалося, тому показано змодельований демонстраційний графік, не реальні дані. ';
    const b=document.createElement('button');b.className='btn';b.textContent='Спробувати ще раз';b.style.padding='6px 12px';b.onclick=loadHistory;note.append(b);
  }else note.textContent='Реальні дані '+hstate.src+', період '+period+'. Остання точка оновлюється разом із ціною.';
  const vals=p.map(v=>v[1]),mn=Math.min(...vals),mx=Math.max(...vals),pad=12,bot=26,rg=(mx-mn)||1;
  const X=i=>pad+i*(w-pad*2)/(p.length-1),Y=v=>h-bot-(v-mn)/rg*(h-bot-pad-16);
  geom={p,X};
  const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(34,211,238,.28)');g.addColorStop(1,'rgba(34,211,238,0)');
  x.beginPath();p.forEach((v,i)=>i?x.lineTo(X(i),Y(v[1])):x.moveTo(X(i),Y(v[1])));
  x.strokeStyle='#22D3EE';x.lineWidth=2;x.lineJoin='round';x.stroke();
  x.lineTo(X(p.length-1),h-bot);x.lineTo(X(0),h-bot);x.fillStyle=g;x.fill();
  x.fillStyle='#9099ab';x.font='12px Manrope,sans-serif';
  x.textAlign='left';x.fillText(tfmt(p[0][0]),pad,h-8);x.textAlign='right';x.fillText(tfmt(p[p.length-1][0]),w-pad,h-8);
  const i=hover!==undefined?hover:p.length-1;
  x.beginPath();x.moveTo(X(i),pad);x.lineTo(X(i),h-bot);x.strokeStyle='rgba(144,153,171,.35)';x.lineWidth=1;x.stroke();
  x.beginPath();x.arc(X(i),Y(p[i][1]),4,0,7);x.fillStyle='#8B5CF6';x.fill();
  x.fillStyle='#e7eaf0';x.font='500 13px Manrope,sans-serif';x.textAlign=X(i)>w/2?'right':'left';
  x.fillText(usd(p[i][1])+' · '+tfmt(p[i][0]),X(i)>w/2?X(i)-8:X(i)+8,pad+4);
}
function hoverAt(e){
  if(!geom)return;
  const r=$('#cv').getBoundingClientRect(),px=e.clientX-r.left,n=geom.p.length;
  let i=Math.round((px-12)/((r.width-24)/(n-1)));i=Math.max(0,Math.min(n-1,i));renderChart(i);
}

/* Без зв'язку з біржею ціни симулюються, щоб було на чому заробляти й втрачати */
setInterval(()=>{
  if(live||lastOk||document.hidden)return;
  coins.forEach(c=>{if(STABLE.has(c.s))return;const d=(Math.random()-.5)*.006;c.p*=1+d;c.c+=d*100});
  $('#cpx').textContent=usd(by(sel).p);renderTable();renderSwap();renderWallet();tickFutures();
},3000);

function fillSelects(){
  ['#from','#to'].forEach((id,i)=>{const s=$(id);s.innerHTML=coins.map(c=>`<option value="${c.s}">${c.s}</option>`).join('');s.value=i?'BTC':'USDT'});
}
function quote(){
  let a=parseFloat($('#amt').value.replace(',','.'));const f=$('#from').value,t=$('#to').value,bal0=db.wallet[f]||0;
  if(a>bal0&&a-bal0<=bal0*1e-9)a=bal0;
  if(f===t)return{ok:false,msg:'Обери різні монети для обміну.'};
  if(!isFinite(a)||a<=0)return{ok:false,msg:'Введи суму більше нуля.'};
  const rate=by(f).p/by(t).p,gross=a*rate,fee=gross*FEE,out=gross-fee;
  if(a>(db.wallet[f]||0))return{ok:false,msg:'Недостатньо '+f+': доступно '+qty(db.wallet[f]||0)+'.'+((db.wallet[f]||0)>0?' Натисни «Макс», щоб обміняти весь баланс.':' Обери монету з балансом або спочатку купи її за USDT.'),a,f,t,rate,fee,out};
  return{ok:true,a,f,t,rate,fee,out};
}
function renderSwap(){
  ['#from','#to'].forEach(id=>[...$(id).options].forEach(o=>{const b=db.wallet[o.value]||0;o.textContent=o.value+(b>0?' · '+qty(b):'')}));
  const q=quote(),f=$('#from').value,t=$('#to').value;
  $('#avail').textContent=qty(db.wallet[f]||0)+' '+f;
  $('#msg').textContent=q.msg||'';
  if(q.rate!==undefined){$('#rate').textContent='1 '+f+' = '+qty(q.rate)+' '+t;$('#fee').textContent=qty(q.fee)+' '+t;$('#out').textContent=qty(q.out)}
  else{$('#rate').textContent=f!==t?'1 '+f+' = '+qty(by(f).p/by(t).p)+' '+t:'—';$('#fee').textContent='—';$('#out').textContent='—'}
}
function futEq(){return db.fut.pos.reduce((a,p)=>a+p.margin+upnl(p),0)}
function renderWallet(){
  const ents=Object.entries(db.wallet).filter(([,v])=>v>0).map(([s,v])=>({s,v,val:v*by(s).p,cost:STABLE.has(s)?0:(db.cost[s]||0)})).sort((a,b)=>b.val-a.val);
  const spot=ents.reduce((a,e)=>a+e.val,0),tot=spot+futEq();let pl=tot-START;if(Math.abs(pl)<.005)pl=0;
  $('#total').textContent=usd(tot);
  const pe=$('#pl');pe.textContent=sgn(pl)+' ('+pct(pl/START*100)+')';pe.className='num '+(pl>=0?'up':'down');
  $('#ops').textContent=db.hist.length+db.fut.hist.length;
  const cols=['#22D3EE','#8B5CF6','#34d399','#fbbf24','#f87171','#60a5fa','#f472b6'];
  $('#alloc').innerHTML=ents.map((e,i)=>`<span style="width:${spot?e.val/spot*100:0}%;background:${cols[i%7]}"></span>`).join('');
  const wb=$('#wbody');wb.textContent='';
  ents.forEach(e=>{
    const r=wb.insertRow();r.innerHTML='<td></td><td class="num"></td><td class="num"></td><td class="num"></td><td></td>';
    labels(r,['Актив','Кількість','Вартість','Прибуток','']);r.cells[0].textContent=e.s;r.cells[1].textContent=qty(e.v);r.cells[2].textContent=usd(e.val);
    if(e.cost>0){const d=e.val-e.cost;r.cells[3].textContent=sgn(d)+' ('+pct(d/e.cost*100)+')';r.cells[3].className='num '+(d>=0?'up':'down')}else r.cells[3].textContent='—';
    if(!STABLE.has(e.s)){const b=document.createElement('button');b.className='btn sm';b.type='button';b.textContent='Продати';
      b.onclick=()=>{$('#from').value=e.s;$('#to').value='USDT';$('#amt').value=String(Number(e.v.toPrecision(12)));renderSwap();$('#exchange').scrollIntoView({behavior:'smooth'})};r.cells[4].append(b)}
  });
  const h=$('#hist');h.textContent='';
  if(!db.hist.length){const li=document.createElement('li');li.textContent='Операцій поки немає. Купи першу монету за USDT угорі сторінки.';h.append(li)}
  db.hist.slice(0,8).forEach(o=>{const li=document.createElement('li');li.innerHTML='<b></b><br><span></span>';li.firstChild.textContent=qty(o.a)+' '+o.f+' → '+qty(o.out)+' '+o.t;li.lastChild.textContent=new Date(o.at).toLocaleString('uk-UA');h.append(li)});
}
bindForm($('#swap'),()=>{const q=quote();renderSwap();
  if(!q.ok){toast(q.msg,true);return}
  $('#dlgrows').innerHTML='<div><span>Віддаю</span><b></b></div><div><span>Отримаю</span><b></b></div><div><span>Курс</span><b></b></div><div><span>Комісія</span><b></b></div>';
  const b=$('#dlgrows').querySelectorAll('b');
  b[0].textContent=qty(q.a)+' '+q.f;b[1].textContent=qty(q.out)+' '+q.t;b[2].textContent='1 '+q.f+' = '+qty(q.rate)+' '+q.t;b[3].textContent=qty(q.fee)+' '+q.t;
  $('#dlg').showModal();
});
$('#no').onclick=()=>$('#dlg').close();
$('#yes').onclick=()=>{
  const q=quote();$('#dlg').close();
  if(!q.ok){toast(q.msg,true);return}
  const bal=db.wallet[q.f]||0,usdIn=q.a*by(q.f).p;
  if(!STABLE.has(q.f)&&db.cost[q.f])db.cost[q.f]=q.a>=bal-1e-12?0:db.cost[q.f]*(1-q.a/bal);
  if(!STABLE.has(q.t))db.cost[q.t]=(db.cost[q.t]||0)+usdIn;
  db.wallet[q.f]=bal-q.a;if(db.wallet[q.f]<1e-12)db.wallet[q.f]=0;
  db.wallet[q.t]=(db.wallet[q.t]||0)+q.out;
  db.hist.unshift({a:q.a,f:q.f,t:q.t,out:q.out,at:Date.now()});db.hist=db.hist.slice(0,50);
  save();renderSwap();renderWallet();toast('Обмін виконано: '+qty(q.out)+' '+q.t+' зараховано на демобаланс.');
};
$('#flip').onclick=()=>{const f=$('#from'),t=$('#to'),v=f.value;f.value=t.value;t.value=v;renderSwap()};
['#amt','#from','#to'].forEach(s=>$(s).addEventListener('input',renderSwap));
$('#reset').onclick=()=>{db=JSON.parse(JSON.stringify(DEF));save();renderAll();toast('Демодані скинуто до початкового стану.')};

$('#max').onclick=()=>{const f=$('#from').value;$('#amt').value=String(Number((db.wallet[f]||0).toPrecision(12)));renderSwap()};

/* Ф'ючерси: Long/Short з плечем, комісією та ліквідацією (на умовні кошти) */
const FEE_F=.0005,MM=.005,MINM=10;
let fside='long';
const upnl=p=>{const m=by(p.sym).p;return p.side==='long'?p.size*(m-p.entry):p.size*(p.entry-m)};
const liqP=(e,side,lev)=>side==='long'?e*(1-1/lev+MM):e*(1+1/lev-MM);
function fillFut(){const s=$('#fcoin');s.innerHTML=coins.filter(c=>!STABLE.has(c.s)).map(c=>`<option value="${c.s}">${c.s}</option>`).join('');s.value='BTC'}
function fquote(){
  const sym=$('#fcoin').value,lev=+$('#flev').value,m=parseFloat($('#fmargin').value.replace(',','.')),pr=by(sym).p,r={sym,lev,pr,side:fside};
  if(!isFinite(m)||m<=0){r.msg='Введи маржу більше нуля.';return r}
  r.m=m;r.notional=m*lev;r.fee=r.notional*FEE_F;r.size=r.notional/pr;r.liq=liqP(pr,fside,lev);
  if(m<MINM){r.msg='Мінімальна маржа — $'+MINM+'.';return r}
  if(m+r.fee>(db.wallet.USDT||0)){r.msg='Недостатньо USDT: доступно '+qty(db.wallet.USDT||0)+', потрібно '+qty(m+r.fee)+' (маржа й комісія).';return r}
  r.ok=true;return r;
}
function renderFutures(){
  const q=fquote();
  $('#favail').textContent=usd(db.wallet.USDT||0);$('#fprice').textContent=usd(q.pr);
  $('#fnot').textContent=q.m?usd(q.notional):'—';$('#ffee').textContent=q.m?usd(q.fee):'—';$('#fliq').textContent=q.m?usd(q.liq):'—';
  $('#fmsg').textContent=q.msg||'';
  const ob=$('#fopen');ob.textContent='Відкрити '+(fside==='long'?'Long':'Short');ob.className='btn '+(fside==='long'?'long-b':'short-b');
  const tb=$('#fbody');tb.textContent='';
  if(!db.fut.pos.length){const td=tb.insertRow().insertCell();td.colSpan=7;td.style.textAlign='center';td.textContent='Відкритих позицій немає. Відкрий першу ліворуч.'}
  db.fut.pos.forEach(p=>{
    const r=tb.insertRow(),pn=upnl(p);r.innerHTML='<td></td><td class="num"></td><td class="num"></td><td class="num"></td><td class="num"></td><td class="num"></td><td></td>';
    labels(r,['Позиція','Маржа','Вхід','Зараз','Ліквідація','Прибуток','']);r.cells[0].textContent=p.sym+' '+(p.side==='long'?'Long':'Short')+' '+p.lev+'×';r.cells[0].className=p.side==='long'?'up':'down';
    r.cells[1].textContent=usd(p.margin);r.cells[2].textContent=usd(p.entry);r.cells[3].textContent=usd(by(p.sym).p);r.cells[4].textContent=usd(liqP(p.entry,p.side,p.lev));
    r.cells[5].textContent=sgn(pn)+' ('+pct(pn/p.margin*100)+')';r.cells[5].className='num '+(pn>=0?'up':'down');
    const b=document.createElement('button');b.type='button';b.className='btn sm';b.textContent='Закрити';b.onclick=()=>closePos(p.id,'close');r.cells[6].append(b);
  });
  const h=$('#fhist');h.textContent='';
  if(!db.fut.hist.length){const li=document.createElement('li');li.textContent='Закритих позицій поки немає.';h.append(li)}
  db.fut.hist.slice(0,8).forEach(o=>{const li=document.createElement('li');li.innerHTML='<b></b><br><span></span>';
    li.firstChild.textContent=o.sym+' '+(o.side==='long'?'Long':'Short')+' '+o.lev+'× · '+(o.reason==='liq'?'ліквідація':'закрито')+' · '+sgn(o.res);
    li.lastChild.textContent=new Date(o.at).toLocaleString('uk-UA');h.append(li)});
}
function closePos(id,reason){
  const i=db.fut.pos.findIndex(p=>p.id===id);if(i<0)return;const p=db.fut.pos[i];
  const fee=p.size*by(p.sym).p*FEE_F,payout=reason==='liq'?0:Math.max(0,p.margin+upnl(p)-fee),res=payout-p.margin;
  db.wallet.USDT=(db.wallet.USDT||0)+payout;db.fut.pos.splice(i,1);
  db.fut.hist.unshift({sym:p.sym,side:p.side,lev:p.lev,res,reason,at:Date.now()});db.fut.hist=db.fut.hist.slice(0,30);
  save();renderAll();
  if(reason==='liq')toast('Ліквідація '+p.sym+' '+(p.side==='long'?'Long':'Short')+' '+p.lev+'×: маржу втрачено.',true);
  else toast('Позицію закрито: '+sgn(res)+' (з урахуванням комісій).',res<0);
}
function tickFutures(){
  db.fut.pos.filter(p=>{const m=by(p.sym).p,l=liqP(p.entry,p.side,p.lev);return p.side==='long'?m<=l:m>=l}).forEach(p=>closePos(p.id,'liq'));
  renderFutures();
}
$('#fopen').onclick=()=>{
  const q=fquote();renderFutures();
  if(!q.ok){toast(q.msg||'Перевір дані позиції.',true);return}
  db.wallet.USDT=(db.wallet.USDT||0)-q.m-q.fee;if(db.wallet.USDT<1e-9)db.wallet.USDT=0;
  db.fut.pos.push({id:Date.now()+Math.random(),sym:q.sym,side:q.side,lev:q.lev,margin:q.m,entry:q.pr,size:q.size,at:Date.now()});
  save();renderAll();toast('Відкрито '+q.sym+' '+(q.side==='long'?'Long':'Short')+' '+q.lev+'× за '+usd(q.pr)+'. Ліквідація біля '+usd(q.liq)+'.');
};
$('#fside').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;fside=b.dataset.s;[...$('#fside').children].forEach(x=>x.setAttribute('aria-pressed',x===b));renderFutures()});
['#fcoin','#flev','#fmargin'].forEach(s=>$(s).addEventListener('input',renderFutures));
$('#fmax').onclick=()=>{const lev=+$('#flev').value;$('#fmargin').value=String(Math.floor((db.wallet.USDT||0)/(1+lev*FEE_F)*100)/100);renderFutures()};

function renderProfile(){
  const p=db.profile;
  $('#pname').textContent=p?p.nick:'Гість';$('#pmail').textContent=p?p.mail:'Профіль ще не збережено';
  $('#avtxt').textContent=p?p.nick[0].toUpperCase():'?';const im=$('#avimg');im.hidden=!db.photo;if(db.photo)im.src=db.photo;$('#avtxt').hidden=!!db.photo;$('#rmphoto').hidden=!db.photo;
  if(p){$('#nick').value=p.nick;$('#mail').value=p.mail}
}
bindForm($('#prof'),()=>{const nick=$('#nick').value.trim(),mail=$('#mail').value.trim();
  const err=nick.length<2?'Нікнейм має містити щонайменше 2 символи.':!/^\S+@\S+\.\S+$/.test(mail)?'Введи email у форматі name@example.com.':'';
  $('#pmsg').textContent=err;if(err)return;
  db.profile={nick,mail};save();renderProfile();toast('Профіль збережено.');
});
$('#logout').onclick=()=>{db=JSON.parse(JSON.stringify(DEF));save();$('#nick').value='';$('#mail').value='';renderAll();toast('Профіль скинуто, баланс і історію повернено до початкових.')};

/* Вхід: без акаунта сайт недоступний */
function gate(){const g=$('#gate');if(!db.profile&&!g.open)g.showModal()}
$('#gate').addEventListener('cancel',e=>e.preventDefault());
bindForm($('#gform'),()=>{const nick=$('#gnick').value.trim(),mail=$('#gmail').value.trim();
  const err=nick.length<2?'Нікнейм має містити щонайменше 2 символи.':!/^\S+@\S+\.\S+$/.test(mail)?'Введи email у форматі name@example.com.':'';
  $('#gmsg').textContent=err;if(err)return;
  db.profile={nick,mail};save();renderProfile();$('#gate').close();$('#gform').reset();toast('Акаунт створено. Ласкаво просимо, '+nick+'!');
});

/* Фото профілю: стискаємо до квадрата 256 px і зберігаємо в браузері */
$('#addphoto').onclick=()=>$('#photo').click();
$('#photo').addEventListener('change',()=>{
  const f=$('#photo').files[0];$('#photo').value='';
  if(!f)return;
  if(!f.type.startsWith('image/')){toast('Обери файл-зображення (JPG, PNG або WebP).',true);return}
  if(f.size>10*1024*1024){toast('Файл завеликий. Обери фото до 10 МБ.',true);return}
  const rd=new FileReader();
  rd.onerror=()=>toast('Не вдалося прочитати файл. Спробуй інший.',true);
  rd.onload=()=>{
    const img=new Image();
    img.onerror=()=>toast('Не вдалося відкрити це зображення. Спробуй JPG або PNG.',true);
    img.onload=()=>{
      const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;
      const x=cv.getContext('2d'),m=Math.min(img.width,img.height);
      x.fillStyle='#151922';x.fillRect(0,0,S,S);
      x.drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,S,S);
      db.photo=cv.toDataURL('image/jpeg',.85);save();renderProfile();toast('Фото додано.');
    };
    img.src=rd.result;
  };
  rd.readAsDataURL(f);
});
$('#rmphoto').onclick=()=>{db.photo=null;save();renderProfile();toast('Фото видалено.')};

$('#q').addEventListener('input',renderTable);
$('#sorts').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sortK=b.dataset.k;[...$('#sorts').children].forEach(x=>x.setAttribute('aria-pressed',x===b));renderTable()});
$('#periods').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;period=b.textContent;[...$('#periods').children].forEach(x=>x.setAttribute('aria-pressed',x===b));loadHistory()});
new ResizeObserver(()=>renderChart()).observe($('#cv'));
$('#cv').addEventListener('pointermove',hoverAt);
$('#cv').addEventListener('pointerdown',hoverAt);
$('#cv').addEventListener('pointerleave',()=>renderChart());
const links=[...document.querySelectorAll('nav a')];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('on',a.hash==='#'+e.target.id))}),{rootMargin:'-40% 0px -55% 0px'});
['exchange','market','futures','wallet','account'].forEach(id=>io.observe(document.getElementById(id)));

function renderAll(){renderTable();renderChart();renderSwap();renderWallet();renderFutures();renderProfile()}
fillSelects();fillFut();renderAll();loadHistory();fetchPrices();
if(recovered)toast('Збережені дані були пошкоджені, тому відновлено початковий стан демо.',true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&(!lastOk||Date.now()-lastOk>10000))fetchPrices()});
