import {dom} from "./dom-setup";
import assert from "node:assert/strict";
import {test,afterEach} from "node:test";
import {createElement} from "react";
import {render,screen,waitFor,cleanup,fireEvent} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {TaskForm} from "../src/features/revisions/forms";
import type {RecordFormState} from "../src/features/caseload/mutations";
import {resource,seed} from "./caseload-fixture";
afterEach(cleanup);
Object.defineProperty(globalThis,"FormData",{configurable:true,value:dom.window.FormData});
const initial:RecordFormState={status:"idle",resourceId:resource,intentSeed:seed,values:{instruction:"",expectedVersion:"1"}};
const props={mode:"create" as const,initial,permalink:"/form",cancelHref:"/kasus",businessName:"Usaha Fiktif"};

test("revision pending guards double submit and failure preserves multiline text",async()=>{
  let resolve!:(s:RecordFormState)=>void,calls=0;
  render(createElement(TaskForm,{...props,action:async()=>{calls++;return new Promise<RecordFormState>(done=>{resolve=done;});}}));
  const user=userEvent.setup();await user.type(screen.getByLabelText(/Instruksi revisi/),"Foto label\nTerbaca & jelas");
  const form=screen.getByRole("form");fireEvent.submit(form);fireEvent.submit(form);
  await waitFor(()=>assert.equal(calls,1));assert(screen.getByRole("button",{name:"Menyimpan…"}).hasAttribute("disabled"));
  resolve({...initial,status:"error",message:"Coba lagi"});
  await waitFor(()=>assert(screen.getByRole("alert")));
  assert.equal((screen.getByLabelText(/Instruksi revisi/) as HTMLTextAreaElement).value,"Foto label\nTerbaca & jelas");
});
test("revision invalid submission focuses field and clears its associated error on edit",async()=>{
  render(createElement(TaskForm,{...props,action:async():Promise<RecordFormState>=>({...initial,status:"invalid",errors:{instruction:"Isi instruksi."}})}));
  const user=userEvent.setup();await user.click(screen.getByRole("button",{name:"Simpan revisi"}));
  const input=screen.getByLabelText(/Instruksi revisi/);
  await waitFor(()=>assert.equal(document.activeElement,input));
  assert.equal(input.getAttribute("aria-invalid"),"true");assert(input.getAttribute("aria-describedby")?.includes("instruction-error"));
  await user.type(input,"Perbaiki foto");assert.equal(input.getAttribute("aria-invalid"),"false");
});
test("revision transport failure after conflict review retains effective version and seed for retry",async()=>{
  const conflict:RecordFormState={...initial,status:"conflict",values:{instruction:"Isian saya",expectedVersion:"1"},latest:{version:3,values:{instruction:"Terbaru",status:"completed",followUpOn:"2026-11-25"}}};
  const sent:Record<string,unknown>[]=[];
  render(createElement(TaskForm,{...props,mode:"update",initial:conflict,action:async(_,body)=>{sent.push(Object.fromEntries(body));throw new Error("private error");}}));
  assert.match(screen.getByRole("status").textContent!,/berubah/);
  assert(screen.getByText("Selesai"));
  const user=userEvent.setup();await user.click(screen.getByRole("button",{name:/Terapkan isian saya/}));
  await waitFor(()=>assert(screen.getByRole("button",{name:"Simpan perubahan"})));
  await user.click(screen.getByRole("button",{name:"Simpan perubahan"}));
  await waitFor(()=>assert.equal(sent.length,2));
  assert.equal(sent[0].reviewVersion,"3");assert.equal(sent[1].expectedVersion,"3");
  assert.equal(sent[0].intentSeed,sent[1].intentSeed);assert.equal(sent[1].instruction,"Isian saya");
  assert(!screen.getByRole("alert").textContent?.includes("private"));
});
