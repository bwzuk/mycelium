// Transparent scouting heuristics, not a calibrated probability model.
export const finite=n=>typeof n==='number'&&Number.isFinite(n);
const total=a=>a.reduce((s,n)=>s+n,0), mean=a=>a.length?total(a)/a.length:null;
const clamp=n=>Math.max(0,Math.min(1,n));
const dateFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
const hourFormat=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',hourCycle:'h23'});
export const localDate=seconds=>dateFormat.format(new Date(seconds*1000));
const localHour=seconds=>Number(hourFormat.format(new Date(seconds*1000)));
export const dateAgo=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')-days*86400000).toISOString().slice(0,10);
export function summariseWeather(data,now=Date.now()/1000){
 const h=data.hourly,c=data.current;
 if(!h?.time?.length||!finite(c?.time))throw new Error('Weather time missing');
 const cutoff=Math.min(c.time,now),day=data.daily?.time?.find(t=>localDate(t)===localDate(cutoff));
 if(!finite(day))throw new Error('Local day missing');
 const rows=h.time.map((t,i)=>({t,rain:h.precipitation?.[i],air:h.temperature_2m?.[i],rh:h.relative_humidity_2m?.[i],wind:h.wind_speed_10m?.[i],soil:h.soil_moisture_3_to_9cm?.[i],et:h.et0_fao_evapotranspiration?.[i]})).filter(r=>r.t<=cutoff);
 const last=rows.at(-1);if(!last||cutoff-last.t>7200)throw new Error('Weather is not current');
 // Each hourly precipitation amount describes the preceding hour.
 const window=(hours,end=last.t)=>rows.filter(r=>r.t>end-hours*3600&&r.t<=end);
 const sumField=(rs,key,expected)=>rs.length===expected&&rs.every(r=>finite(r[key]))?total(rs.map(r=>r[key])):null;
 const week=window(168),month=window(672),today=rows.filter(r=>r.t>day),night=rows.filter(r=>r.t>=day-7*3600).filter(r=>localDate(r.t)===dateAgo(localDate(cutoff),1)&&localHour(r.t)>=18||localDate(r.t)===localDate(cutoff)&&localHour(r.t)<=8);
 const rain7=sumField(week,'rain',168),rain28=sumField(month,'rain',672),rainToday=sumField(today,'rain',Math.floor((last.t-day)/3600));
 const air24=window(24),previousSoil=rows.find(r=>r.t===last.t-72*3600)?.soil;
 const soil=finite(c.soil_moisture_3_to_9cm)?c.soil_moisture_3_to_9cm:null;
 const delta=soil!==null&&finite(previousSoil)?soil-previousSoil:null;
 const rh24=air24.length===24&&air24.every(r=>finite(r.rh))?mean(air24.map(r=>r.rh)):null;
 const temp24=air24.length===24&&air24.every(r=>finite(r.air))?mean(air24.map(r=>r.air)):null;
 const wetDays=rain7!==null?Array.from({length:7},(_,i)=>sumField(window(24,last.t-i*86400),'rain',24)).filter(n=>n>=0.5).length:null;
 const et7=sumField(week,'et',168),balance=rain7!==null&&et7!==null?rain7-et7:null;
 const overnight=night.length&&night.every(r=>finite(r.air))?Math.min(...night.map(r=>r.air)):null;
 const frost=overnight!==null&&overnight<0;
 const wind24=air24.length===24&&air24.every(r=>finite(r.wind))?mean(air24.map(r=>r.wind)):null;
 const parts=rain7!==null&&wetDays!==null&&rh24!==null&&temp24!==null&&delta!==null?[
  {label:'Rain in 7 days',points:30*clamp(rain7/20),max:30},
  {label:'Wet days in 7 days',points:20*clamp(wetDays/4),max:20},
  {label:'Humidity in 24 hours',points:20*clamp((rh24-60)/35),max:20},
  {label:'Mild air temperature',points:10*clamp((temp24-2)/8)*clamp((28-temp24)/10),max:10},
  {label:'Soil moisture trend',points:20*clamp((delta+0.02)/0.04),max:20}
 ]:null;
 const penalty=(frost?15:0)+(balance!==null&&balance< -10?10:0)+(wind24!==null&&wind24>20&&rh24!==null&&rh24<70?5:0);
 const score=parts?Math.max(0,Math.round(total(parts.map(p=>p.points))-penalty)):null;
 const drying=delta!==null&&delta< -0.005||balance!==null&&balance< -8;
 const title=frost?'Start with wood and persistent brackets':drying?'Sheltered, damp patches are the best starting point':rain7!==null&&rain7>=10?'Worth checking suitable woodland habitat':'Check retained moisture before choosing your route';
 return {cutoff,hourThrough:last.t,day,rainToday,rain7,rain28,soil,deepSoil:finite(c.soil_moisture_9_to_27cm)?c.soil_moisture_9_to_27cm:null,soilTemp:finite(c.soil_temperature_6cm)?c.soil_temperature_6cm:null,delta,overnight,nightComplete:localHour(cutoff)>=8,rh24,temp24,wetDays,et7,balance,wind24,frost,drying,parts,penalty,score,title};
}
export function habitatAdvice(w){
 if(!w)return [{title:'Find the host trees',text:'Oak, beech, birch and pine support different fungi. Check the species habitat notes; current weather is unavailable.'},{title:'Inspect fallen wood',text:'Check damp stumps and logs for wood-decay fungi. A lack of rain does not rule out persistent brackets.'}];
 const month=Number(localDate(w.cutoff).slice(5,7)),autumn=month>=8&&month<=11;
 const rewetting=w.rain28!==null&&w.rain7!==null&&w.rain28-w.rain7<10&&w.rain7>=10;
 const soil=w.frost?'After frost, focus on sheltered wood and persistent brackets; delicate fresh mushrooms may be damaged.':w.drying?'Prioritise shaded hollows, moss and deep leaf litter. The model suggests drying; exposed paths may be less rewarding.':rewetting?'Recent rain follows relatively dry weeks. Check shaded moss and leaf litter, then revisit: restored moisture does not mean soil fungi will fruit immediately.':'Check damp, well-drained leaf litter and moss beneath living trees. Test moisture under the leaves; waterlogged ground is not automatically better.';
 return [{title:w.frost?'Sheltered wood':'Woodland floor',text:soil},{title:'Stumps and fallen trunks',text:autumn?'Check damp hardwood and conifer stumps for sulphur tuft. Inspect beech wood for porcelain fungus, and birch for birch polypore; old brackets may persist without a new flush.':'Inspect damp stumps and birch trunks for persistent brackets. Try dead elder for jelly ear; in cooler months check hardwood for velvet shank. Old brackets are not evidence of a new flush.'},{title:'Tree bases and roots',text:autumn?'Around pine: dyer’s polypore and wood cauliflower. Around beech: beech milkcap on soil, giant polypore at roots. Around oak: beefsteak fungus on the trunk or stump.':month>=6&&month<=7?'Inspect conifer roots for dyer’s polypore and beech roots for giant polypore. Check the nearby-record dates and species seasons before choosing a patch.':'Use living host trees to choose your route, but check the season before expecting soil fungi. Persistent brackets around roots and stumps may offer more than fresh milkcaps at this time of year.'}];
}
// Verified iNaturalist class IDs. Exclude the main lichen classes and obvious
// microscopic plant-disease groups from mushroom scouting; this is not a full
// taxonomic classification. Other fungi are retained, including unknown ecology.
export function scoutingTaxon(t){return t?.rank==='species'&&!t.ancestor_ids?.some(id=>[54743,152028,152030,117868].includes(id))&&!/^(Rhytisma|Puccinia|Erysiphe|Podosphaera|Blumeria|Melampsora|Uromyces|Septoria|Cladosporium|Alternaria)\s/.test(t.name||'');}
export function candidateList(guide,recent,seasonal,month){
 const list=guide.map(s=>({...s})),known=new Set(list.map(s=>s.latin));
 for(const [latin,r] of Object.entries({...seasonal,...recent}))if(!known.has(latin)){known.add(latin);list.push({id:`local-${r.id}`,latin,name:r.name||latin,habitat:'unknown',months:[],recordOnly:true,where:'Habitat not documented here. Inspect the linked observation records for host and substrate.',description:'Reference photo of a locally recorded species; detailed ecology has not yet been added.',caution:'Species identification may require microscopy or an expert.',timing:'Local evidence supports occurrence, not a weather forecast.'});}
 return list.map(s=>({...s,recent:recent?.[s.latin],seasonal:seasonal?.[s.latin],inSeason:s.months.includes(month)})).sort((a,b)=>!!b.recent-!!a.recent||(b.recent?.count||0)-(a.recent?.count||0)||!!b.seasonal-!!a.seasonal||(b.seasonal?.count||0)-(a.seasonal?.count||0)||+b.inSeason-+a.inSeason||a.name.localeCompare(b.name));
}
