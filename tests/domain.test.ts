import test from 'node:test';
import assert from 'node:assert/strict';
import {activeLimit,aggregateHour,availableBatteryPower,peakPlan,qualityPercent,rolePermissions,validateLimit,initialObjects,initialSchedule} from '../src/domain.ts';
test('валидация лимита принимает только диапазон 100–100000',()=>{assert.equal(validateLimit(100),true);assert.equal(validateLimit(100000),true);assert.equal(validateLimit(99),false);assert.equal(validateLimit(Infinity),false)});
test('peak shaving ограничен мощностью накопителя',()=>{assert.deepEqual(peakPlan(500,390,80,10),{required:110,dispatch:80,grid:420,uncovered:30,saving:800});});
test('календарь выбирает лимит дня и часа',()=>{assert.equal(activeLimit(9,1,initialSchedule,500,'2026-11-09'),390);assert.equal(activeLimit(22,0,initialSchedule,500,'2026-11-08'),500)});
test('праздничная дата имеет приоритет над недельным расписанием',()=>{assert.equal(activeLimit(12,3,initialSchedule,500,'2026-11-04'),180)});
test('пропуски не преобразуются в нулевое измерение',()=>{assert.equal(aggregateHour([null,null]),null);assert.equal(aggregateHour([10,null,12]),22)});
test('качество считается по объектам без замечаний',()=>{assert.equal(qualityPercent(initialObjects),67)});
test('матрица ролей разделяет права на изменение',()=>{assert.equal(rolePermissions('admin').canConfigureServices,true);assert.equal(rolePermissions('admin').canAddObject,true);assert.equal(rolePermissions('owner').canAddObject,false);assert.equal(rolePermissions('owner').readOnly,true);assert.equal(rolePermissions('operator').canEditLimit,true);assert.equal(rolePermissions('operator').canManageMaintenance,true);assert.equal(rolePermissions('building').readOnly,true);assert.equal(rolePermissions('building').canManageAssets,false)});

test('доступная мощность батареи учитывает SoC и номинальную мощность',()=>{assert.equal(availableBatteryPower([{id:'b',siteId:'s',name:'BESS',kind:'battery',power:100,capacity:200,soc:50,status:'Ready',x:0,y:0}]),100);assert.equal(availableBatteryPower([{id:'b',siteId:'s',name:'BESS',kind:'battery',power:100,capacity:80,soc:50,status:'Ready',x:0,y:0}]),40)});
