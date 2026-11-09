export type Role='admin'|'owner'|'operator'|'building';
export type Quality='ok'|'gap'|'suspect';
export type AssetKind='building'|'battery'|'charger'|'meter'|'grid'|'pv';
export type Asset={id:string;siteId:string;name:string;kind:AssetKind;power:number;capacity?:number;status:string; x:number;y:number;soc?:number};
export type Site={id:string;name:string;address:string;lat:number;lon:number;limit:number;objects:string[]};
export type EnergyObject={id:string;siteId:string;name:string;meter:string;base:number;limit:number;quality:Quality;hourly:(number|null)[];hourlyGrid?:(number|null)[];hourlyPV?:(number|null)[];source:string};
export type TariffBand={id:string,name:string,start:number,end:number,buy:number,sell:number};
export type Schedule={id:string,name:string,days:number[],start:number,end:number,limit:number,date?:string};
export const initialSites:Site[]=[
 {id:'river',name:'Площадка «Речная»',address:'Москва, Береговой проезд, 5',lat:55.7488,lon:37.5352,limit:390,objects:['r1','r2','r3']},
 {id:'north',name:'Площадка «Север»',address:'Москва, Ленинградский проспект, 37',lat:55.7982,lon:37.5598,limit:170,objects:['n1','n2','n3']}
];
const series=(base:number,seed:number)=>Array.from({length:24},(_,h)=>Math.max(0,Math.round(base*(.72+.24*Math.sin((h-7)*Math.PI/12)**2+.22*((h>=9&&h<=19)?1:0)+.035*Math.sin(h*2.1+seed)))));
const objectRows:[string,string,string,string,number,number,Quality][]=[['r1','river','Главный корпус','M-201',72,170,'ok'],['r2','river','Склад № 2','M-202',38,130,'ok'],['r3','river','Зарядная зона','M-203',44,110,'suspect'],['n1','north','Главный корпус','M-101',67,170,'ok'],['n2','north','БЦ «Север»','M-102',54,151,'gap'],['n3','north','Паркинг','M-103',21,65,'ok']];
export const initialObjects:EnergyObject[]=objectRows.map(([id,siteId,name,meter,base,limit,quality],i)=>({id,siteId,name,meter,base,limit,quality,hourly:series(base,i+1),source:'case6 CSV / локальный профиль'}));
export const initialAssets:Asset[]=[
 {id:'grid-r',siteId:'river',name:'Ввод от сети',kind:'grid',power:500,status:'Подключен',x:40,y:150},
 {id:'bld-r',siteId:'river',name:'Главный корпус',kind:'building',power:170,status:'Работает',x:300,y:65},
 {id:'bat-r1',siteId:'river',name:'BESS-01',kind:'battery',power:100,capacity:200,soc:86,status:'Готова',x:300,y:220},
 {id:'bat-r2',siteId:'river',name:'BESS-02',kind:'battery',power:100,capacity:200,soc:72,status:'Готова',x:550,y:220},
 {id:'pv-r',siteId:'river',name:'Солнечная генерация',kind:'pv',power:80,status:'Подключена',x:550,y:65},
 {id:'grid-n',siteId:'north',name:'Ввод от сети',kind:'grid',power:400,status:'Подключен',x:40,y:150},
 {id:'bld-n',siteId:'north',name:'Главный корпус',kind:'building',power:170,status:'Работает',x:300,y:65},
 {id:'bat-n',siteId:'north',name:'BESS-03',kind:'battery',power:80,capacity:160,soc:90,status:'Готова',x:300,y:220},
 {id:'ev-n',siteId:'north',name:'Зарядная станция EV-01',kind:'charger',power:60,status:'Подключена',x:550,y:65}
];
export const initialTariffs:TariffBand[]=[{id:'night',name:'Ночь',start:0,end:7,buy:4.2,sell:2.1},{id:'day',name:'День',start:7,end:17,buy:7.8,sell:3.4},{id:'peak',name:'Пик',start:17,end:22,buy:11.6,sell:4.1},{id:'late',name:'Поздний вечер',start:22,end:24,buy:5.1,sell:2.5}];
export const initialSchedule:Schedule[]=[{id:'work',name:'Рабочий день',days:[1,2,3,4,5],start:8,end:20,limit:390},{id:'weekend',name:'Выходной',days:[0,6],start:9,end:22,limit:250},{id:'holiday',name:'Праздничный режим',days:[],start:0,end:24,limit:180,date:'2026-11-04'}];
export function activeLimit(hour:number,day:number,schedules:Schedule[],fallback:number,date?:string){const now=new Date();const localDate=date??`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;const match=schedules.find(s=>s.date===localDate&&hour>=s.start&&hour<s.end)??schedules.find(s=>!s.date&&s.days.includes(day)&&hour>=s.start&&hour<s.end);return match?.limit??fallback;}
export function peakPlan(load:number,limit:number,batteryPower:number,tariff:number){const required=Math.max(0,load-limit);const dispatch=Math.min(required,batteryPower);return {required,dispatch,grid:Math.max(0,load-dispatch),uncovered:Math.max(0,required-batteryPower),saving:dispatch*tariff};}
export function validateLimit(value:number){return Number.isFinite(value)&&value>=100&&value<=100000;}
export function availableBatteryPower(batteries:Asset[]){return batteries.filter(b=>b.kind==='battery').reduce((sum,b)=>sum+Math.min(b.power,b.capacity==null?b.power:b.capacity*(b.soc??100)/100),0);}
export function qualityPercent(objects:EnergyObject[]){return objects.length?Math.round(objects.filter(o=>o.quality==='ok').length/objects.length*100):100;}

export function rolePermissions(role:Role){return {canAddObject:role==='admin',canEditLimit:role==='operator',canManageAssets:role==='admin'||role==='operator',canConfigureServices:role==='admin',canManageMaintenance:role==='operator',readOnly:role==='building'||role==='owner'};}
export function aggregateHour(values:(number|null)[]){const known=values.filter((v):v is number=>v!==null&&Number.isFinite(v));return known.length?known.reduce((a,b)=>a+b,0):null;}
