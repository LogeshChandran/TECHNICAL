/* shared: data loading, pattern info, filters (multi-select, URL state, presets), formatting */
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PATTERN_INFO={
 head_shoulders:['Head and Shoulders','reversal','Three peaks, the middle (head) highest. Uptrend before. Bearish below the neckline.'],
 inv_head_shoulders:['Inverse Head and Shoulders','reversal','Three troughs, the middle deepest. Downtrend before. Bullish above the neckline.'],
 double_top:['Double Top (M)','reversal','Two equal peaks after an uptrend. Bearish close below the neckline (low between the peaks).'],
 double_bottom:['Double Bottom (W)','reversal','Two equal troughs after a downtrend. Bullish close above the neckline (high between the troughs).'],
 triple_top:['Triple Top','reversal','Three peaks at the same resistance after an uptrend. Bearish close below support.'],
 triple_bottom:['Triple Bottom','reversal','Three troughs on the same support after a downtrend. Bullish close above resistance.'],
 rising_wedge:['Rising Wedge','reversal','Both lines rise and converge, lows rise faster. Usually breaks down.'],
 falling_wedge:['Falling Wedge','reversal','Both lines fall and converge, highs fall faster. Usually breaks up.'],
 broadening:['Broadening','reversal','Diverging lines - higher highs and lower lows.'],
 bull_flag:['Bull Flag','continuation','Sharp up pole, then a small flat / down-sloping channel. Uptrend resumes above the channel.'],
 bear_flag:['Bear Flag','continuation','Sharp down pole, then a small flat / up-sloping channel. Downtrend resumes below the channel.'],
 bull_pennant:['Bull Pennant','continuation','Sharp up pole, then a tiny converging triangle. Fast resumption upward.'],
 bear_pennant:['Bear Pennant','continuation','Sharp down pole, then a tiny converging triangle. Fast resumption downward.'],
 ascending_triangle:['Ascending Triangle','continuation','Flat resistance, rising lows. Usually breaks up.'],
 descending_triangle:['Descending Triangle','continuation','Flat support, falling highs. Usually breaks down.'],
 symmetrical_triangle:['Symmetrical Triangle','continuation','Two converging lines. Breaks in either direction.'],
 cup_handle:['Cup and Handle','continuation','Rounded U recovery, then a short shallow pullback (handle). Bullish above the rim.'],
 rectangle:['Rectangle','continuation','Flat support and resistance. Breaks in either direction.'],
 channel_up:['Channel Up','continuation','Parallel rising lines.'],channel_down:['Channel Down','continuation','Parallel falling lines.']};
const pretty=s=>(PATTERN_INFO[s]||[])[0]||String(s??'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const famOf=s=>(PATTERN_INFO[s]||[])[1]||'';
const safeName=s=>String(s).replace(/[^A-Za-z0-9_-]/g,'_');
const num=(v,d=2)=>v===null||v===undefined||v===''?'':(typeof v==='number'?Math.round(v*10**d)/10**d:v);
const _cache={};
async function j(u){if(!_cache[u])_cache[u]=fetch(u,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(u+' '+r.status);return r.json();});return _cache[u];}
const TFS=['1H','4H','1D','1W','1M'],OUTS=['open','target_hit','false_breakout','back_inside','expired'],QUAL=['confirmed','weak','late','pending'];
function nav(active){const L=[['index.html','Home'],['explore.html','Explore'],['dates.html','By date'],['sector.html','Sectors'],
 ['stats.html','Pattern stats'],['patterns.html','Pattern guide'],['compare.html','Compare'],['review.html','Review'],['health.html','Data health'],['digest.html','Digest'],['reports/index.html','Reports']];
 document.body.insertAdjacentHTML('afterbegin','<nav class="top">'+L.map(([h,t])=>`<a href="${h}" class="${t===active?'on':''}">${t}</a>`).join('')+'</nav>');}
const LAST=(()=>{const k='lastVisit',v=localStorage.getItem(k)||'';window.addEventListener('beforeunload',()=>localStorage.setItem(k,new Date().toISOString().slice(0,10)));return v;})();
const isNew=r=>LAST&&r.detected_on&&r.detected_on>LAST;
const F_DEF={sym:[],inst:'both',tf:[],fam:[],pat:[],grp:[],sec:[],dir:[],out:[],q:[],from:'',to:'',smin:60,smax:100,
 vol:0,mtf:0,star:0,exp:0,rmin:0,view:'table',sort:'breakout_time',desc:1,page:1};
const ARR=['sym','tf','fam','pat','grp','sec','dir','out','q'];
function fromURL(def){const f=JSON.parse(JSON.stringify(Object.assign({},F_DEF,def||{})));const U=new URLSearchParams(location.search);
 for(const k of Object.keys(F_DEF)){if(!U.has(k))continue;const v=U.get(k);
  if(ARR.includes(k))f[k]=v?v.split(','):[];else if(typeof F_DEF[k]==='number')f[k]=+v;else f[k]=v;}
 if(U.has('date')){f.from=f.to=U.get('date');}if(U.has('tab'))f.inst=U.get('tab');return f;}
function toURL(f){const U=new URLSearchParams(location.search);for(const k of Object.keys(F_DEF)){
 const v=ARR.includes(k)?f[k].join(','):String(f[k]);if(v===String(ARR.includes(k)?'':F_DEF[k]))U.delete(k);else U.set(k,v);}
 U.delete('date');U.delete('tab');history.replaceState(null,'','?'+U.toString());}
function applyF(rows,f){const S=new Set(f.sym);
 return rows.filter(r=>(!S.size||S.has(r.symbol))&&(f.inst==='both'||r.instrument===f.inst)
  &&(!f.tf.length||f.tf.includes(r.timeframe))&&(!f.fam.length||f.fam.includes(r.family||famOf(r.pattern)))
  &&(!f.pat.length||f.pat.includes(r.pattern))
  &&(!f.grp.length||String(r.groups||'').split(';').some(g=>f.grp.includes(g)))&&(!f.sec.length||f.sec.includes(r.sector))
  &&(!f.dir.length||f.dir.includes(r.direction))&&(!f.out.length||f.out.includes(r.outcome))
  &&(!f.q.length||f.q.includes(r.breakout_quality))
  &&(!f.from||String(r.breakout_date)>=f.from)&&(!f.to||String(r.breakout_date)<=f.to)
  &&(r.score>=f.smin&&r.score<=f.smax)&&(!f.vol||r.volume_flag==='confirmed')&&(!f.mtf||(r.mtf_count||1)>=2)
  &&(!f.star||r.watch)&&(!f.exp||r.as_expected==='yes')&&(!f.rmin||(r.rank_prob??0)>=f.rmin));}
function today(){return new Date().toISOString().slice(0,10);}
function daysAgo(n,base){const d=base?new Date(base):new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);}
const PRESETS=meta=>({'Today':{from:meta.scan_date,to:meta.scan_date,smin:0},'This week':{from:daysAgo(6,meta.scan_date),to:meta.scan_date},
 'High quality':{smin:75,vol:1,q:['confirmed'],tf:['1D','1W','1M']},'Multi-timeframe':{mtf:1},'Watchlist':{star:1},
 'Reversals':{fam:['reversal']},'Continuations':{fam:['continuation']},'Swing (1D/1W/1M)':{tf:['1D','1W','1M'],smin:70},'Intraday (1H/4H)':{tf:['1H','4H']}});
function chipGroup(id,label,values,sel,fmt){return `<div class="frow"><label>${label}</label><div class="chips" data-g="${id}">`+
 values.map(v=>`<span class="chip ${sel.includes(v)?'on':''}" data-v="${esc(v)}">${esc(fmt?fmt(v):v)}</span>`).join('')+'</div></div>';}
async function filterPanel(el,f,opts,onChange){
 const meta=await j('data/meta.json'),syms=await j('data/symbols.json');opts=opts||{};
 const saved=JSON.parse(localStorage.getItem('presets')||'{}');const P=PRESETS(meta);
 const active=Object.keys(F_DEF).filter(k=>!['view','sort','desc','page'].includes(k)&&JSON.stringify(f[k])!==JSON.stringify(F_DEF[k])).length;
 const pats=(meta.patterns||[]).slice().sort((a,b)=>famOf(b).localeCompare(famOf(a))||pretty(a).localeCompare(pretty(b)));
 el.innerHTML=`<details class="fpanel" ${opts.open?'open':''}><summary>Filters (${active} active)</summary>
 <div class="frow"><label>Quick presets</label><div class="chips">${Object.keys(P).map(k=>`<span class="chip" data-p="${k}">${k}</span>`).join('')}
  ${Object.keys(saved).map(k=>`<span class="chip" data-sp="${esc(k)}">★ ${esc(k)}<span class="x" data-del="${esc(k)}">×</span></span>`).join('')}
  <span class="chip" id="savep">+ save current</span></div></div>
 ${opts.noSym?'':`<div class="frow"><label>Symbols (stocks and indices, pick several)</label><input id="fsym" list="fsyml" placeholder="type a symbol and press Enter" style="width:230px">
  <datalist id="fsyml">${syms.map(s=>`<option value="${esc(s.s)}">${esc(s.i)} ${esc(s.sec||'')}</option>`).join('')}</datalist>
  <div class="chips" id="fsymc">${f.sym.map(s=>`<span class="chip on" data-rm="${esc(s)}">${esc(s)}<span class="x">×</span></span>`).join('')}</div></div>`}
 ${opts.noInst?'':`<div class="frow"><label>Instrument</label><div class="chips" data-r="inst">${['both','stock','index'].map(v=>`<span class="chip ${f.inst===v?'on':''}" data-v="${v}">${{both:'Stocks + Indices',stock:'Stocks',index:'Indices'}[v]}</span>`).join('')}</div></div>`}
 ${chipGroup('tf','Timeframe',TFS,f.tf)}${chipGroup('fam','Pattern group',['reversal','continuation'],f.fam,s=>s[0].toUpperCase()+s.slice(1))}
 ${chipGroup('pat','Pattern',pats,f.pat,pretty)}${chipGroup('dir','Direction',['UP','DOWN'],f.dir)}
 ${chipGroup('q','Breakout quality',QUAL,f.q,s=>s[0].toUpperCase()+s.slice(1))}${chipGroup('out','Outcome',OUTS,f.out,s=>s.replace(/_/g,' '))}
 ${opts.noGroup?'':chipGroup('grp','Group',meta.groups||[],f.grp)}
 ${opts.noSec?'':`<div class="frow"><label>Sector</label><input id="fsec" list="fsecl" placeholder="type a sector + Enter" style="width:230px"><datalist id="fsecl">${(meta.sectors||[]).map(s=>`<option value="${esc(s)}">`).join('')}</datalist>
  <div class="chips" id="fsecc">${f.sec.map(s=>`<span class="chip on" data-rms="${esc(s)}">${esc(s)}<span class="x">×</span></span>`).join('')}</div></div>`}
 <div class="frow"><label>Dates and score</label>From <input type="date" id="ffrom" value="${f.from}"> to <input type="date" id="fto" value="${f.to}">
  &nbsp;Score <input type="number" id="fsmin" value="${f.smin}" style="width:55px"> - <input type="number" id="fsmax" value="${f.smax}" style="width:55px">
  ${meta.ranker?`&nbsp;Min rank <input type="number" step="0.05" id="frmin" value="${f.rmin}" style="width:60px">`:''}</div>
 <div class="frow">${[['vol','Volume confirmed'],['mtf','Multi-timeframe'],['star','My watchlist'],['exp','Matches pattern bias']].map(([k,t])=>`<label style="display:inline;color:#172b4d"><input type="checkbox" data-c="${k}" ${f[k]?'checked':''}> ${t}</label>`).join(' &nbsp; ')}</div>
 <button class="btn" id="freset">Reset</button></details>`;
 const fire=()=>{f.page=1;toURL(f);onChange();filterPanel(el,f,Object.assign({},opts,{open:true}),onChange);};
 el.querySelectorAll('[data-g]').forEach(g=>g.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{const k=g.dataset.g,v=c.dataset.v;
  f[k]=f[k].includes(v)?f[k].filter(x=>x!==v):f[k].concat(v);fire();}));
 el.querySelectorAll('[data-r]').forEach(g=>g.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{f[g.dataset.r]=c.dataset.v;fire();}));
 const add=(inp,key)=>{inp.onchange=inp.onkeydown=e=>{if(e.type==='keydown'&&e.key!=='Enter')return;
  const v=inp.value.trim();if(!v)return;(key==='sym'?v.toUpperCase().split(/[ ,]+/):[v]).forEach(x=>{if(x&&!f[key].includes(x))f[key].push(x);});inp.value='';fire();};};
 if($('fsym'))add($('fsym'),'sym');if($('fsec'))add($('fsec'),'sec');
 el.querySelectorAll('[data-rm]').forEach(c=>c.onclick=()=>{f.sym=f.sym.filter(x=>x!==c.dataset.rm);fire();});
 el.querySelectorAll('[data-rms]').forEach(c=>c.onclick=()=>{f.sec=f.sec.filter(x=>x!==c.dataset.rms);fire();});
 el.querySelectorAll('[data-c]').forEach(c=>c.onchange=()=>{f[c.dataset.c]=c.checked?1:0;fire();});
 [['ffrom','from'],['fto','to']].forEach(([id,k])=>$(id).onchange=()=>{f[k]=$(id).value;fire();});
 [['fsmin','smin'],['fsmax','smax'],['frmin','rmin']].forEach(([id,k])=>{if($(id))$(id).onchange=()=>{f[k]=+$(id).value||0;fire();};});
 el.querySelectorAll('[data-p]').forEach(c=>c.onclick=()=>{const keep={sym:f.sym,inst:f.inst,view:f.view};Object.assign(f,JSON.parse(JSON.stringify(F_DEF)),keep,opts.lock||{},P[c.dataset.p]);fire();});
 el.querySelectorAll('[data-sp]').forEach(c=>c.onclick=e=>{if(e.target.dataset.del)return;Object.assign(f,JSON.parse(JSON.stringify(F_DEF)),saved[c.dataset.sp],opts.lock||{});fire();});
 el.querySelectorAll('[data-del]').forEach(x=>x.onclick=()=>{delete saved[x.dataset.del];localStorage.setItem('presets',JSON.stringify(saved));fire();});
 $('savep').onclick=()=>{const n=prompt('Name for this filter set');if(!n)return;const c=JSON.parse(JSON.stringify(f));delete c.page;saved[n]=c;localStorage.setItem('presets',JSON.stringify(saved));fire();};
 $('freset').onclick=()=>{Object.assign(f,JSON.parse(JSON.stringify(F_DEF)),opts.lock||{});fire();};}
async function loadRows(f){const months=await j('data/months.json');
 const want=months.filter(m=>(!f.from||m>=f.from.slice(0,7))&&(!f.to||m<=f.to.slice(0,7)));
 return (await Promise.all(want.map(m=>j('data/records/'+m+'.json')))).flat();}
function csvDownload(rows,name){if(!rows.length)return;const k=Object.keys(rows[0]);
 const s=[k.join(',')].concat(rows.map(r=>k.map(x=>{const v=r[x]??'';return /[",\n]/.test(v)?'"'+String(v).replace(/"/g,'""')+'"':v;}).join(','))).join('\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/csv'}));a.download=name;a.click();}
