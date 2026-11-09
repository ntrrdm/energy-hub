import fs from 'node:fs';
import path from 'node:path';
const rawDir=path.resolve('data/raw');
const outFile=path.resolve('data/case6-aggregated.json');
const files=fs.readdirSync(rawDir).filter(f=>f.toLowerCase().endsWith('.csv')).sort();
const number=(value)=>{if(value==null||String(value).trim()==='')return null;const n=Number(String(value).trim().replace(',','.'));return Number.isFinite(n)?n:null};
const results=[];
for(const file of files){
 const lines=fs.readFileSync(path.join(rawDir,file),'utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
 if(lines.length<2)continue;
 const header=lines[0].split(';').map(s=>s.trim());
 const find=(patterns)=>header.findIndex(h=>patterns.some(p=>h.toLowerCase().includes(p.toLowerCase())));
 const ix={time:find(['timestamp','time']),node:find(['node_name']),asset:find(['asset_name']),demandE:find(['Demand Demand.energy_kWh']),demandP:find(['Demand Demand.power_kW']),gridP:find(['Grid Grid.power_kW']),pvP:find(['PV PV.power_kW']),pvE:find(['PV PV.energy_kWh'])};
 const parsed=lines.slice(1).map(line=>{const c=line.split(';');return {timestamp:c[ix.time]||'',node:c[ix.node]||'',asset:c[ix.asset]||'',demandEnergy:number(c[ix.demandE]),demandPower:number(c[ix.demandP]),gridPower:number(c[ix.gridP]),pvPower:number(c[ix.pvP]),pvEnergy:number(c[ix.pvE])}}).filter(r=>r.timestamp&&r.timestamp.includes('2026'));
 const take=parsed.slice(-96);
 const hourly=Array.from({length:24},(_,h)=>{const chunk=take.slice(h*4,h*4+4);const valid=chunk.map(r=>r.demandEnergy??(r.demandPower==null?null:r.demandPower/4)).filter(v=>v!==null);return valid.length?Number(valid.reduce((a,b)=>a+b,0).toFixed(2)):null});
 const hourlyMean=(key)=>Array.from({length:24},(_,h)=>{const vals=take.slice(h*4,h*4+4).map(r=>r[key]).filter(v=>v!==null);return vals.length?Number((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)):null});
 const validRows=take.filter(r=>Object.values(r).some(v=>typeof v==='number'&&v!==null));
 const avg=(key)=>{const a=take.map(r=>r[key]).filter(v=>v!==null);return a.length?Number((a.reduce((x,y)=>x+y,0)/a.length).toFixed(2)):null};
 results.push({file,node:take.at(-1)?.node||`Node ${results.length+1}`,asset:take.at(-1)?.asset||'',period:take.length?`${take[0].timestamp} — ${take.at(-1).timestamp}`:'Нет данных',rows:take.length,valid:validRows.length,hourly,hourlyGrid:hourlyMean('gridPower'),hourlyPV:hourlyMean('pvPower'),avgGrid:avg('gridPower'),avgPV:avg('pvPower'),avgDemand:avg('demandPower'),coverage:take.length?Number((validRows.length/take.length*100).toFixed(1)):0});
}
const output=JSON.stringify({source:'case6.zip',generatedAt:new Date().toISOString(),files:results},null,2);
fs.writeFileSync(outFile,output);
const publicData=path.resolve('public/data');fs.mkdirSync(publicData,{recursive:true});fs.writeFileSync(path.join(publicData,'case6-aggregated.json'),output);
console.log(`Готово: ${results.length} CSV → ${outFile}`);
