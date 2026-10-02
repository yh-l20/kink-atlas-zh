import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, compare, parseProfile, exportProfile } from '../engine.mjs';

const items=[{id:'a',category:'sense',name:'A'},{id:'b',category:'sense',name:'B'},{id:'c',category:'sense',name:'C'},{id:'d',category:'role',name:'D'}];
const answer=(interest,role='na',readiness='discuss')=>({interest,role,readiness});

test('missing and uncertain answers never become rejections or zero scores',()=>{
 const r=analyze({a:answer('yes'),b:answer('unsure')},items);
 assert.equal(r.answered,2); assert.equal(r.boundaries.length,0);
 assert.equal(r.dimensions[0].score,75); assert.equal(r.dimensions[0].scored,1);
 assert.equal(r.dimensions[0].total,3); assert.equal(r.dimensions[0].uncertain,1);
 assert.equal(r.dimensions[1].score,null); assert.equal(r.dimensions[0].sufficient,false);
});
test('all explicit rejections are a valid zero, and interests average only scored answers',()=>{
 const r=analyze({a:answer('no'),b:answer('curious'),c:answer('favorite')},items);
 assert.equal(r.dimensions[0].score,50); assert.equal(r.dimensions[0].sufficient,true);
 assert.equal(analyze({a:answer('no')},items).dimensions[0].score,0);
 assert.equal(r.boundaries.length,1);
});
test('a boundary overrides high interest, readiness and missing partner data',()=>{
 const r=compare({a:answer('no'),b:answer('favorite')},{a:answer('favorite','na','ready'),b:answer('no')},items);
 assert.equal(r.boundary.length,2); assert.equal(r.shared.length,0);
 assert.equal(compare({a:answer('no')},{},items).boundary.length,1);
});
test('matching requires complementary roles and discussion readiness from both',()=>{
 const a={a:answer('yes','give','ready'),b:answer('yes','give','ready'),c:answer('favorite','either','ready')};
 const b={a:answer('yes','receive','ready'),b:answer('yes','give','ready'),c:answer('favorite','receive','ready')};
 const r=compare(a,b,items); assert.deepEqual(r.shared.map(x=>x.id),['a','c']); assert.equal(r.coordinate.length,1);
});
test('fantasy and uncertainty are never promoted to shared recommendations',()=>{
 const r=compare({a:answer('favorite','na','fantasy'),b:answer('unsure'),c:answer('curious','na','ready')},{a:answer('favorite','na','ready'),b:answer('yes'),c:answer('yes','na','ready')},items);
 assert.equal(r.fantasy.length,1);assert.equal(r.uncertain.length,1);assert.equal(r.discuss.length,1);assert.equal(r.shared.length,0);assert.equal(r.missing.length,1);
});
test('export/import roundtrip validates data and strips unrelated properties',()=>{
 const text=exportProfile({a:{...answer('yes'),secret:'never export'}},items);
 assert.equal(text.includes('secret'),false);
 assert.deepEqual(parseProfile(text,items),{a:answer('yes')});
});
test('malformed, oversized, foreign-version, unknown-item and injected profiles fail closed',()=>{
 for(const text of ['null','[]','{','{"version":2,"answers":{}}','{"version":1,"answers":{"unknown":{"interest":"yes"}}}','{"version":1,"answers":{"a":{"interest":"wrong"}}}','{"version":1,"answers":{"__proto__":{"interest":"yes"}}}', ' '.repeat(200001)]) assert.throws(()=>parseProfile(text,items));
});
