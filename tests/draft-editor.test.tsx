import {dom} from "./dom-setup";
import assert from "node:assert/strict";
import {test,afterEach} from "node:test";
import {createElement} from "react";
import {render,screen,waitFor,cleanup,fireEvent,act} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {DraftEditor} from "../src/features/drafts/editor";
import {draftContext,taskId} from "./draft-fixture";
import {draftKey,newDraft} from "../src/features/drafts/storage";
import type {DraftReply} from "../src/features/drafts/types";
afterEach(()=>{cleanup();localStorage.clear();});
Object.defineProperty(globalThis,"FormData",{configurable:true,value:dom.window.FormData});
const props={context:draftContext,permalink:"/pesan",action:async():Promise<DraftReply>=>({status:"ready",context:draftContext})};
const message=()=>screen.getByLabelText("Isi draf pesan WhatsApp") as HTMLTextAreaElement;
test("draft reload restores edited message ahead of URL selection, including intentionally empty drafts",async()=>{
  const user=userEvent.setup();const first=render(createElement(DraftEditor,{...props,selectedId:taskId}));
  await waitFor(()=>assert(message()));await user.clear(message());await user.type(message(),"Suntingan pribadi\n& # 😀");
  first.unmount();render(createElement(DraftEditor,{...props,selectedId:taskId}));
  await waitFor(()=>assert.equal(message().value,"Suntingan pribadi\n& # 😀"));
  await user.clear(message());cleanup();render(createElement(DraftEditor,props));
  await waitFor(()=>assert.equal(message().value,""));
});
test("changing selection preserves manual message and requires an explicit decision",async()=>{
  render(createElement(DraftEditor,props));const user=userEvent.setup();await waitFor(()=>assert(message()));
  await user.clear(message());await user.type(message(),"Jangan hilangkan ini");
  await user.click(screen.getByRole("checkbox",{name:/Perbaiki foto/}));
  assert.equal(message().value,"Jangan hilangkan ini");assert(screen.getByRole("button",{name:"Gunakan pesan suntingan"}));
  assert(screen.getByRole("button",{name:"Salin pesan"}).hasAttribute("disabled"));
});
test("storage event warns instead of overwriting an active draft and explicit load adopts other tab",async()=>{
  render(createElement(DraftEditor,props));await waitFor(()=>assert(message()));
  const external={...newDraft(draftContext),message:"Draf tab lain",edited:true},key=draftKey(draftContext);
  localStorage.setItem(key,JSON.stringify(external));fireEvent(window,new dom.window.StorageEvent("storage",{key,newValue:JSON.stringify(external)}));
  assert.notEqual(message().value,"Draf tab lain");
  await userEvent.setup().click(screen.getByRole("button",{name:"Muat draf tab lain"}));
  assert.equal(message().value,"Draf tab lain");
});
test("corrupt storage is preserved until explicit restart and deletion needs confirmation",async()=>{
  const key=draftKey(draftContext);localStorage.setItem(key,"bad json");render(createElement(DraftEditor,props));
  await waitFor(()=>assert(screen.getByRole("button",{name:"Mulai draf baru"})));assert.equal(localStorage.getItem(key),"bad json");
  const user=userEvent.setup();await user.click(screen.getByRole("button",{name:"Mulai draf baru"}));
  await user.click(screen.getByRole("button",{name:"Hapus draf"}));assert.notEqual(localStorage.getItem(key),null);
  await user.click(screen.getByRole("button",{name:"Ya, hapus draf"}));assert.equal(localStorage.getItem(key),null);
});
test("failed clipboard offers manual selection without claiming copy success",async()=>{
  render(createElement(DraftEditor,props));await waitFor(()=>assert(message()));
  const user=userEvent.setup();Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw Error("denied");}}});
  await user.click(screen.getByRole("button",{name:"Salin pesan"}));
  await waitFor(()=>assert.match(screen.getByRole("alert").textContent!,/manual/));
  assert.equal(document.activeElement,message());assert.equal(message().selectionEnd,message().value.length);
  assert(!screen.getByRole("status").textContent?.includes("Pesan tersalin"));
});
test("blocked localStorage access keeps an editable in-memory draft",async()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,"localStorage")!;
  Object.defineProperty(globalThis,"localStorage",{configurable:true,get:()=>{throw Error("blocked");}});
  try{render(createElement(DraftEditor,props));await waitFor(()=>assert(message()));fireEvent.change(message(),{target:{value:"Tetap tersedia"}});assert.equal(message().value,"Tetap tersedia");}
  finally{Object.defineProperty(globalThis,"localStorage",descriptor);}
});
test("native continuation freezes captured text and selection until its response completes",async()=>{
  let calls=0,finish!:(r:DraftReply)=>void;
  render(createElement(DraftEditor,{...props,action:async(_,body)=>{
    if(body.get("continueChat")==="1"){calls++;return new Promise<DraftReply>(done=>{finish=done;});}
    return {status:"ready",context:draftContext,url:"https://wa.me/6281200000101",longUrl:true};
  }}));
  await waitFor(()=>assert(message()));await userEvent.setup().click(screen.getByRole("button",{name:"Buka WhatsApp"}));
  fireEvent.submit(await screen.findByRole("form",{name:"Lanjut ke WhatsApp"}));
  await waitFor(()=>assert.equal(calls,1));
  try{assert.equal(message().readOnly,true);assert(screen.getByRole("checkbox").hasAttribute("disabled"));assert(screen.getByRole("button",{name:"Hapus draf"}).hasAttribute("disabled"));}
  finally{await act(async()=>{finish({status:"invalid",notice:"Coba ulang"});});}
});
test("revocation hides editor and late export response after an edit cannot export old content",async()=>{
  let finish!:(r:DraftReply)=>void;
  render(createElement(DraftEditor,{...props,action:async(_,body)=>JSON.parse(String(body.get("draftRequest"))).intent==="copy"?new Promise<DraftReply>(done=>{finish=done;}):{status:"ready",context:draftContext}}));
  await waitFor(()=>assert(message()));fireEvent.click(screen.getByRole("button",{name:"Salin pesan"}));
  fireEvent.change(message(),{target:{value:message().value+" Perubahan baru"}});
  await act(async()=>{finish({status:"ready",context:draftContext});});
  await waitFor(()=>assert.match(screen.getByRole("alert").textContent!,/berubah/));assert(message().value.endsWith(" Perubahan baru"));
  fireEvent.click(screen.getByRole("button",{name:"Salin pesan"}));await act(async()=>{finish({status:"forbidden",notice:"Akses dicabut"});});
  await waitFor(()=>assert.equal(screen.queryByLabelText("Isi draf pesan WhatsApp"),null));
});
