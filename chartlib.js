/* charts: textbook pattern drawing, overview chart, card (why-score + review), lazy drawing */
async function fullRecord(r){if(r.swings)return r;const all=await j('data/symbols/'+r.instrument+'_'+safeName(r.symbol)+'.json');return all.find(x=>x.id===r.id)||r;}
async function ohlcv(tf,inst,sym){return j('data/ohlcv/'+tf+'/'+inst+'_'+safeName(sym)+'.json');}
function ema(a,n){const k=2/(n+1),o=[];let e=null;for(const v of a){e=e===null?v:v*k+e*(1-k);o.push(Math.round(e*100)/100);}return o;}
function sma(a,n){const o=[];let s=0;for(let i=0;i<a.length;i++){s+=a[i];if(i>=n)s-=a[i-n];o.push(i>=n-1?s/n:null);}return o;}
const PCFG={responsive:true,scrollZoom:true,displaylogo:false,modeBarButtonsToRemove:['lasso2d','select2d']};
function baseLayout(h){return{xaxis:{type:'category',nticks:innerWidth<700?4:7,tickangle:-30,rangeslider:{visible:false},automargin:true},
 yaxis:{domain:[0.26,1],title:'Price',automargin:true},yaxis2:{domain:[0,0.2],title:'Vol',automargin:true},hovermode:'x unified',
 dragmode:'pan',margin:{t:10,l:50,r:10,b:50},legend:{orientation:'h',y:-0.18,font:{size:10}},height:h||470,shapes:[],annotations:[]};}
function candleTraces(x,O,H,L,C,V,o){
 const hov=x.map((t,i)=>`<b>${t}</b><br>O ${O[i]}  H ${H[i]}<br>L ${L[i]}  C ${C[i]}<br>Vol ${Number(V[i]).toLocaleString()}`);
 const tr=[{type:'candlestick',x,open:O,high:H,low:L,close:C,text:hov,hoverinfo:'text',name:'Price',increasing:{line:{color:'#26a69a'}},decreasing:{line:{color:'#ef5350'}}},
  {type:'bar',x,y:V,yaxis:'y2',name:'Volume',marker:{color:C.map((c,i)=>c>=O[i]?'#26a69a':'#ef5350')},hoverinfo:'skip',showlegend:false}];
 if(o&&o.ema)tr.push({type:'scatter',mode:'lines',x,y:o.ema20,name:'EMA20',line:{width:1,color:'#ff991f'},hoverinfo:'skip'},
   {type:'scatter',mode:'lines',x,y:o.ema50,name:'EMA50',line:{width:1,color:'#6554c0'},hoverinfo:'skip'},
   {type:'scatter',mode:'lines',x,y:o.vavg,yaxis:'y2',name:'Vol avg20',line:{width:1,color:'#42526e'},hoverinfo:'skip'});
 return tr;}
const LCOL={upper:'#de350b',lower:'#00875a',neckline:'#6554c0',pole:'#0052cc',rim:'#6554c0',handle:'#8993a4'};
async function drawPattern(r,div,opts){opts=Object.assign({after:40,ema:false,others:[]},opts||{});
 const d=await ohlcv(r.timeframe,r.instrument,r.symbol);const tb=r.breakout_time||r.time;
 const i0=d.t.indexOf(r.pattern_start),ib=d.t.indexOf(tb),el=document.getElementById(div);
 if(i0<0||ib<0){el.innerHTML='<p class="muted">Candles for this pattern are not stored. See the CSV reports.</p>';return false;}
 const a=Math.max(0,i0-20),b=r.breakout_time?Math.min(d.t.length,ib+opts.after):d.t.length,x=d.t.slice(a,b);
 const sl=k=>d[k].slice(a,b),O=sl('o'),H=sl('h'),L=sl('l'),C=sl('c'),V=sl('v');
 const tr=candleTraces(x,O,H,L,C,V,{ema:opts.ema,ema20:ema(d.c,20).slice(a,b),ema50:ema(d.c,50).slice(a,b),vavg:sma(d.v,20).slice(a,b)});
 const sw=r.swings||[],isFlag=/flag|pennant/.test(r.pattern),isCup=r.pattern==='cup_handle';
 tr.push({type:'scatter',mode:(isFlag||isCup)?'markers+text':'lines+markers+text',x:sw.map(s=>s[0]),y:sw.map(s=>s[1]),
  text:sw.map(s=>`<b>${s[3]&&s[3]!=='H'&&s[3]!=='L'&&s[3]!=='N'?s[3]:''}</b> ${Math.round(s[1]*100)/100}`),
  textposition:sw.map(s=>s[2]==='H'?'top center':'bottom center'),textfont:{size:11,color:'#bf2600'},
  hovertext:sw.map(s=>`${s[3]||s[2]} ${s[1]}<br>${s[0]}`),hoverinfo:'text',line:{color:'#e67e22',width:2},marker:{size:8,color:'#e67e22'},name:'Pattern points'});
 (r.lines||[]).forEach(l=>tr.push({type:'scatter',mode:'lines',x:[l[0],l[2]],y:[l[1],l[3]],hoverinfo:'skip',name:l[4][0].toUpperCase()+l[4].slice(1),
   line:{dash:l[4]==='pole'?'solid':'dash',width:l[4]==='pole'?5:2,color:LCOL[l[4]]||'gray'},opacity:l[4]==='pole'?0.55:1}));
 if((r.curve||[]).length)tr.push({type:'scatter',mode:'lines',x:r.curve.map(c=>c[0]),y:r.curve.map(c=>c[1]),name:'Cup',line:{width:3,color:'#6554c0',shape:'spline'},hoverinfo:'skip',opacity:0.7});
 const lay=baseLayout(opts.height);
 lay.shapes.push({type:'rect',xref:'x',yref:'paper',x0:r.pattern_start,x1:r.pattern_end||tb,y0:0.26,y1:1,fillcolor:'#deebff',opacity:0.35,line:{width:0},layer:'below'});
 if(r.breakout_time){tr.push({type:'scatter',mode:'markers',x:[r.breakout_time],y:[r.close],name:'Breakout',hovertext:[`Breakout ${r.direction} ${r.close}<br>${r.breakout_time}`],hoverinfo:'text',
   marker:{size:15,symbol:r.direction==='UP'?'triangle-up':'triangle-down',color:r.direction==='UP'?'#00875a':'#de350b',line:{width:1,color:'#fff'}}});
  lay.shapes.push({type:'line',xref:'paper',x0:0,x1:1,y0:r.target,y1:r.target,line:{dash:'dot',color:'#6554c0',width:1}});
  lay.annotations.push({x:r.breakout_time,y:r.target,ax:0,ay:r.direction==='UP'?40:-40,text:'target '+r.target,arrowhead:2,arrowcolor:'#6554c0',font:{size:10,color:'#6554c0'}});
  if(r.outcome_time&&x.includes(r.outcome_time))lay.annotations.push({x:r.outcome_time,y:C[x.indexOf(r.outcome_time)],text:String(r.outcome).replace(/_/g,' '),arrowhead:2,ax:0,ay:-30,font:{size:10}});}
 (opts.others||[]).filter(o=>o.id!==r.id&&x.includes(o.breakout_time)).forEach(o=>tr.push({type:'scatter',mode:'markers',x:[o.breakout_time],y:[o.close],showlegend:false,
   hovertext:[`${pretty(o.pattern)} ${o.direction} (score ${o.score})`],hoverinfo:'text',marker:{size:9,symbol:o.direction==='UP'?'triangle-up-open':'triangle-down-open',color:'#42526e'}}));
 if(!V.some(v=>v>0)){lay.yaxis2.range=[0,1];lay.yaxis2.title='Vol n/a';lay.yaxis2.showticklabels=false;}
 Plotly.newPlot(div,tr,lay,PCFG);return true;}
async function drawOverview(inst,sym,tf,div,recs,opts){opts=opts||{};
 const d=await ohlcv(tf,inst,sym).catch(()=>null),el=document.getElementById(div);
 if(!d){el.innerHTML='<p class="muted">No '+tf+' candles stored.</p>';return;}
 let a=Math.max(0,d.t.length-(opts.bars||250)),b=d.t.length;
 if(opts.center){const c=d.t.findIndex(t=>t>=opts.center);if(c>=0){a=Math.max(0,c-80);b=Math.min(d.t.length,c+60);}}
 const x=d.t.slice(a,b),sl=k=>d[k].slice(a,b);
 const tr=candleTraces(x,sl('o'),sl('h'),sl('l'),sl('c'),sl('v'),{ema:true,ema20:ema(d.c,20).slice(a,b),ema50:ema(d.c,50).slice(a,b),vavg:sma(d.v,20).slice(a,b)});
 const R=(recs||[]).filter(r=>r.timeframe===tf&&x.includes(r.breakout_time));
 ['UP','DOWN'].forEach(dir=>{const g=R.filter(r=>r.direction===dir);if(!g.length)return;
  tr.push({type:'scatter',mode:'markers',x:g.map(r=>r.breakout_time),y:g.map(r=>r.close),customdata:g.map(r=>r.id),name:dir+' breakouts',
   hovertext:g.map(r=>`${pretty(r.pattern)} ${dir} score ${r.score}<br>${r.breakout_time} - ${String(r.outcome).replace(/_/g,' ')}`),hoverinfo:'text',
   marker:{size:12,symbol:dir==='UP'?'triangle-up':'triangle-down',color:dir==='UP'?'#00875a':'#de350b',line:{width:1,color:'#fff'}}});});
 const lay=baseLayout(opts.height||430);if(!sl('v').some(v=>v>0)){lay.yaxis2.range=[0,1];lay.yaxis2.title='Vol n/a';lay.yaxis2.showticklabels=false;}
 Plotly.newPlot(div,tr,lay,PCFG);
 el.on('plotly_click',ev=>{const p=ev.points.find(p=>p.customdata);if(p){const c=document.getElementById('card-'+p.customdata);if(c)c.scrollIntoView({behavior:'smooth'});else if(opts.onPick)opts.onPick(p.customdata);}});}
const PART_INFO={fit:'points sit on the lines / levels',clean:'no closes outside the pattern',shape:'textbook shape (depth, convergence, U-shape)',
 trend:'prior trend / pole strength',volume:'volume falls inside the pattern',symmetry:'balance of the sides',duration:'pattern length'};
function whyHtml(r){const p=r.parts||{};const bars=Object.keys(PART_INFO).filter(k=>k in p).map(k=>`<span title="${PART_INFO[k]}">${k} ${Math.round(p[k]*100)}<i class="bar" style="width:${Math.round(p[k]*40)}px"></i></span>`).join('');
 const extra=[r.touches_upper!=null?`touches ${r.touches_upper}/${r.touches_lower}`:'',r.violations!=null?`violations ${r.violations}`:'',
  r.breakout_quality?`<b class="${r.breakout_quality}">${r.breakout_quality}</b>`:'',r.breakout_strength!=null?`strength ${r.breakout_strength} ATR`:'',
  r.pattern_height!=null?`height ${r.pattern_height}`:'',r.rank_prob!=null?`rank ${r.rank_prob}`:''].filter(Boolean).map(s=>`<span>${s}</span>`).join('');
 return `<div class="why">${bars}${extra}</div>`;}
const REV={get:()=>JSON.parse(localStorage.getItem('reviews')||'{}'),set:v=>localStorage.setItem('reviews',JSON.stringify(v))};
function reviewHtml(r){const v=REV.get()[r.id]||{};return `<span class="review" data-id="${r.id}">
 <button class="btn good ${v.label==='good'?'on':''}" data-l="good">Good</button><button class="btn bad ${v.label==='bad'?'on':''}" data-l="bad">Bad</button>
 <button class="btn ${v.label==='wrong_type'?'on':''}" data-l="wrong_type">Wrong type</button></span>`;}
function bindReview(el,r){el.querySelectorAll('.review button').forEach(b=>b.onclick=()=>{const all=REV.get();let ct='';
 if(b.dataset.l==='wrong_type'){ct=prompt('Correct pattern type? ('+Object.keys(PATTERN_INFO).join(', ')+', none)',all[r.id]?.correct_type||'');if(ct===null)return;}
 if(all[r.id]&&all[r.id].label===b.dataset.l&&b.dataset.l!=='wrong_type')delete all[r.id];
 else all[r.id]={id:r.id,label:b.dataset.l,correct_type:ct,note:'',ts:new Date().toISOString(),symbol:r.symbol,instrument:r.instrument,timeframe:r.timeframe,pattern:r.pattern,breakout_time:r.breakout_time};
 REV.set(all);el.querySelectorAll('.review button').forEach(x=>x.classList.toggle('on',(all[r.id]||{}).label===x.dataset.l));});}
let _io=null;const _lazy=new Map();
function lazy(el,fn){if(!_io)_io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){_io.unobserve(e.target);const f=_lazy.get(e.target);_lazy.delete(e.target);f&&f();}}),{rootMargin:'600px'});
 _lazy.set(el,fn);_io.observe(el);}
async function card(row,container,opts){opts=opts||{};
 const el=document.createElement('div');el.className='card';el.id='card-'+row.id;
 const link=`chart.html?i=${row.instrument}&s=${encodeURIComponent(row.symbol)}&id=${row.id}`,fam=row.family||famOf(row.pattern);
 el.innerHTML=`<h3><a href="stock.html?i=${row.instrument}&s=${encodeURIComponent(row.symbol)}">${esc(row.symbol)}</a> ${row.watch||''} | ${row.timeframe} | ${esc(pretty(row.pattern))}
  <span class="fam ${fam}">${fam}</span> | <span class="${row.direction}">${row.direction}</span> | score ${row.score} | ${esc(row.breakout_time)}
  | <span class="${esc(row.breakout_quality)}">${esc(row.breakout_quality||'')}</span> | <span class="${esc(row.outcome)}">${esc(String(row.outcome).replace(/_/g,' '))}</span>
  ${isNew(row)?'<span class="new">new</span>':''}</h3><div class="desc">${esc((PATTERN_INFO[row.pattern]||[])[2]||'')}</div>
  <div class="small">close ${row.close} | level ${row.breakout_level} | target ${row.target} (${row.target_pct}%) | vol ${row.volume_ratio??'-'}x
  ${row.mtf_count>=2?' | timeframes '+esc(row.mtf_list):''}${row.event?' | ⚠ '+esc(row.event):''} &nbsp; <a href="${link}">details</a>
  <button class="btn" data-copy>Copy link</button> ${reviewHtml(row)}</div><div class="whyc"></div><div class="chart" id="c-${row.id}"></div>`;
 container.appendChild(el);
 el.querySelector('[data-copy]').onclick=()=>navigator.clipboard&&navigator.clipboard.writeText(new URL(link,location.href).href);
 bindReview(el,row);
 lazy(el,async()=>{const r=await fullRecord(row);el.querySelector('.whyc').innerHTML=whyHtml(r);
  const others=opts.others||(await j('data/symbols/'+r.instrument+'_'+safeName(r.symbol)+'.json')).filter(o=>o.timeframe===r.timeframe);
  await drawPattern(r,'c-'+row.id,{ema:opts.ema,others,after:opts.after||40});});
 return el;}
