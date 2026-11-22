import {dom} from "./dom-setup";
import assert from "node:assert/strict";
import {test,afterEach} from "node:test";
import {createElement} from "react";
import {render,screen,waitFor,cleanup} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {RecordForm} from "../src/features/caseload/forms";
import type {RecordFormState} from "../src/features/caseload/mutations";
import {resource,seed,org} from "./caseload-fixture";
afterEach(cleanup);
Object.defineProperty(globalThis,"FormData",{configurable:true,value:dom.window.FormData});
const initial:RecordFormState={status:"idle",values:{businessName:"",phone:"",greeting:"",expectedVersion:"1"},resourceId:resource,intentSeed:seed};
const props={kind:"contact" as const,mode:"create" as const,initial,basePath:`/staf/lembaga/${org}`,permalink:"/form",cancelHref:"/staf"};

test("contact pending and failed submissions retain values and intent and never show premature success",async()=>{
  let resolve!:(state:RecordFormState)=>void;
  render(createElement(RecordForm,{...props,action:async(_,form)=>{
    assert.equal(form.get("resourceId"),resource);assert.equal(form.get("intentSeed"),seed);
    return new Promise(done=>{resolve=done;});
  }}));
  const user=userEvent.setup();
  await user.type(screen.getByLabelText(/Nama usaha/),"Usaha Isian");
  await user.type(screen.getByLabelText(/Nomor WhatsApp/),"081200000101");
  await user.click(screen.getByRole("button",{name:"Simpan kontak"}));
  await waitFor(()=>assert(screen.getByRole("button",{name:"Menyimpan…"}).hasAttribute("disabled")));
  assert.equal(screen.getByRole("status").textContent,"");
  resolve({...initial,status:"error",message:"Koneksi gagal. Coba lagi."});
  await waitFor(()=>assert.match(screen.getByRole("alert").textContent!,/Koneksi gagal/));
  assert.equal((screen.getByLabelText(/Nama usaha/) as HTMLInputElement).value,"Usaha Isian");
  assert.equal(screen.getByRole("button",{name:"Simpan kontak"}).hasAttribute("disabled"),false);
});

test("failed validation focuses linked summary and retains inline field errors",async()=>{
  render(createElement(RecordForm,{...props,action:async():Promise<RecordFormState>=>({...initial,status:"invalid",errors:{businessName:"Isi nama usaha.",phone:"Isi nomor."}})}));
  await userEvent.setup().click(screen.getByRole("button",{name:"Simpan kontak"}));
  await waitFor(()=>assert.equal(document.activeElement,screen.getByRole("alert")));
  const name=screen.getByLabelText(/Nama usaha/);
  assert.equal(name.getAttribute("aria-invalid"),"true");
  assert(screen.getByRole("alert").querySelector('a[href="#businessName"]'));
  await userEvent.setup().type(name,"U");
  assert.equal(name.getAttribute("aria-invalid"),"false");
});

test("duplicate confirmation resets when the phone is edited",async()=>{
  const duplicate:RecordFormState={...initial,status:"duplicate",values:{businessName:"Usaha",phone:"081200000101",greeting:"",confirmedPhone:"6281200000101"},duplicates:[{id:resource,name:"Kontak tersimpan"}]};
  render(createElement(RecordForm,{...props,initial:duplicate,action:async()=>duplicate}));
  const user=userEvent.setup(), box=screen.getByRole("checkbox");
  await user.click(box);assert.equal((box as HTMLInputElement).checked,true);
  await user.type(screen.getByLabelText(/Nomor WhatsApp/),"2");
  assert.equal(screen.queryByRole("checkbox"),null);
});

test("a conflict keeps entered fields and requires explicit review before replacing the latest version",async()=>{
  const conflict:RecordFormState={...initial,status:"conflict",values:{businessName:"Isian saya",phone:"081200000101",greeting:"",expectedVersion:"1"},latest:{version:2,values:{businessName:"Nama terbaru",phone:"6281200000101",greeting:""}}};
  render(createElement(RecordForm,{...props,mode:"update",initial:conflict,action:async()=>conflict}));
  assert.equal((screen.getByLabelText(/Nama usaha/) as HTMLInputElement).value,"Isian saya");
  assert.match(screen.getByText("Nama terbaru").textContent!,/Nama terbaru/);
  const review=screen.getByRole("button",{name:/Terapkan isian saya/});
  assert.equal(review.getAttribute("name"),"reviewVersion");
  assert.equal(review.getAttribute("value"),"2");
  assert.equal(screen.queryByRole("button",{name:"Simpan perubahan"}),null);
});

test("a failed transport to the Server Action leaves the editable form and its values available",async()=>{
  render(createElement(RecordForm,{...props,action:async()=>{throw new Error("Simulated transport failure");}}));
  const user=userEvent.setup();
  await user.type(screen.getByLabelText(/Nama usaha/),"Isian saat offline");
  await user.click(screen.getByRole("button",{name:"Simpan kontak"}));
  await waitFor(()=>assert(screen.getByRole("alert").textContent?.includes("Coba lagi")));
  assert.equal((screen.getByLabelText(/Nama usaha/) as HTMLInputElement).value,"Isian saat offline");
  assert.equal(screen.getByRole("button",{name:"Simpan kontak"}).hasAttribute("disabled"),false);
});

test("retry after a reviewed conflict keeps the effective expected version when transport fails",async()=>{
  const conflict:RecordFormState={...initial,status:"conflict",values:{businessName:"Isian saya",phone:"081200000101",greeting:"",expectedVersion:"1"},latest:{version:2,values:{businessName:"Terbaru"}}};
  const sent:(string|null)[]=[];
  render(createElement(RecordForm,{...props,mode:"update",initial:conflict,action:async(_,form)=>{
    sent.push((form.get("reviewVersion")??form.get("expectedVersion")) as string|null);
    throw new Error("Simulated lost response");
  }}));
  const user=userEvent.setup();
  await user.click(screen.getByRole("button",{name:/Terapkan isian saya/}));
  await waitFor(()=>assert(screen.getByRole("button",{name:"Simpan perubahan"})));
  await user.click(screen.getByRole("button",{name:"Simpan perubahan"}));
  await waitFor(()=>assert.equal(sent.length,2));
  assert.deepEqual(sent,["2","2"]);
});

test("retry after duplicate confirmation keeps that confirmation when transport fails",async()=>{
  const duplicate:RecordFormState={...initial,status:"duplicate",values:{businessName:"Usaha",phone:"081200000101",greeting:"",confirmedPhone:"6281200000101"},duplicates:[{id:resource,name:"Kontak tersimpan"}]};
  const sent:(string|null)[]=[];
  render(createElement(RecordForm,{...props,initial:duplicate,action:async(_,form)=>{sent.push(form.get("confirmDuplicate") as string|null);throw new Error("Simulated lost response");}}));
  const user=userEvent.setup();await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button",{name:"Simpan kontak"}));
  await waitFor(()=>assert(screen.getByRole("alert")));
  await user.click(screen.getByRole("button",{name:"Simpan kontak"}));
  await waitFor(()=>assert.equal(sent.length,2));assert.deepEqual(sent,["on","on"]);
});

test("duplicate and conflict decisions announce a concise outcome after an asynchronous submit",async()=>{
  for(const status of ["duplicate","conflict"] as const){
    const result:RecordFormState={...initial,status,values:{businessName:"Usaha",phone:"081200000101",confirmedPhone:"6281200000101"},duplicates:[{id:resource,name:"Tersimpan"}],latest:{version:2,values:{businessName:"Terbaru"}}};
    render(createElement(RecordForm,{...props,action:async()=>result}));
    await userEvent.setup().click(screen.getByRole("button",{name:"Simpan kontak"}));
    await waitFor(()=>assert(screen.getByRole("status").textContent?.includes(status==="duplicate"?"Nomor":"Data")));
    cleanup();
  }
});
