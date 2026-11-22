import assert from "node:assert/strict";
import {test} from "node:test";
import {draftContext,taskId} from "./draft-fixture";
import {seed} from "./caseload-fixture";
import {draftKey,newDraft,readDraft,writeDraft} from "../src/features/drafts/storage";
function memory(){const map=new Map<string,string>();return {getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);},removeItem:(k:string)=>map.delete(k)};}
test("browser draft restores exact empty text and selection rather than URL/default seed",()=>{
  const storage=memory(),key=draftKey(draftContext),draft={...newDraft(draftContext,taskId),selected:[],message:"",edited:true};
  const saved=writeDraft(storage,key,draft,null);assert.equal(saved.status,"saved");
  const loaded=readDraft(storage,key,draftContext);assert.equal(loaded.status,"ready");assert.deepEqual(loaded.draft?.selected,[]);assert.equal(loaded.draft?.message,"");
  assert.notEqual(key,draftKey({...draftContext,userId:seed}));assert.notEqual(key,draftKey({...draftContext,organizationId:seed}));assert.notEqual(key,draftKey({...draftContext,caseId:seed}));
});
test("corrupt cross-account and oversized drafts are reported without replacing stored bytes",()=>{
  for(const raw of ['{invalid',JSON.stringify({...newDraft(draftContext),userId:seed}),JSON.stringify({...newDraft(draftContext),message:"x".repeat(64001)})]){
    const storage=memory(),key=draftKey(draftContext);storage.setItem(key,raw);
    assert.equal(readDraft(storage,key,draftContext).status,"corrupt");assert.equal(storage.getItem(key),raw);
  }
});
test("stale tabs cannot overwrite another draft unless caller explicitly adopts current raw revision",()=>{
  const storage=memory(),key=draftKey(draftContext),first=writeDraft(storage,key,newDraft(draftContext),null);
  assert.equal(first.status,"saved");
  const next=writeDraft(storage,key,{...first.draft!,message:"Tab kedua"},first.raw!);assert.equal(next.status,"saved");
  assert.equal(writeDraft(storage,key,{...first.draft!,message:"Tab pertama"},first.raw!).status,"conflict");
  assert.equal(readDraft(storage,key,draftContext).draft?.message,"Tab kedua");
  assert.equal(writeDraft(storage,key,{...first.draft!,message:"Tetap milik saya"},next.raw!).status,"saved");
});
test("denied reads and quota failure keep input available to the caller",()=>{
  const storage={getItem:()=>{throw Error("denied");},setItem:()=>{throw Error("quota");}},draft=newDraft(draftContext);
  assert.equal(readDraft(storage,draftKey(draftContext),draftContext).status,"error");
  assert.equal(writeDraft(storage,draftKey(draftContext),draft,null).status,"error");assert.match(draft.message,/Perbaiki foto/);
});
