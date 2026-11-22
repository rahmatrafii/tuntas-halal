import {dom} from "./dom-setup";
import assert from "node:assert/strict";
import {test,afterEach} from "node:test";
import {createElement} from "react";
import {render,screen,cleanup,fireEvent,waitFor,act} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {StatusForm} from "../src/features/status/forms";
import {taskRow,taskId} from "./draft-fixture";
import {seed} from "./caseload-fixture";
import type {StatusState} from "../src/features/status/types";
Object.defineProperty(globalThis,"FormData",{configurable:true,value:dom.window.FormData});afterEach(cleanup);
const initial:StatusState={status:"idle",seed,selected:[taskId],versions:{[taskId]:1},values:{status:"needs_sending",followUpOn:"",datePolicy:"",sent:"",completion:""}};
const props={mode:"single" as const,initial,tasks:[taskRow],businessName:"Usaha uji",permalink:"/status",cancelHref:"/kasus",action:async():Promise<StatusState>=>initial};
test("status pending locks snapshot, failure retains fields and no premature success",async()=>{
 let resolve!:(s:StatusState)=>void;let submitted:FormData|undefined;
 render(createElement(StatusForm,{...props,action:async(_,f)=>{submitted=f;return new Promise(r=>resolve=r);}}));
 fireEvent.change(screen.getByLabelText("Status revisi"),{target:{value:"needs_review"}});
 await userEvent.setup().click(screen.getByRole("button",{name:"Simpan status"}));
 await waitFor(()=>assert(screen.getByRole("button",{name:"Menyimpan…"}).hasAttribute("disabled")));
 assert.equal(submitted?.get("status"),"needs_review");assert.equal(screen.queryByText("Status revisi tersimpan."),null);
 await act(async()=>resolve({...initial,status:"error",message:"Coba lagi"}));
 await waitFor(()=>assert(screen.getByRole("alert")));assert.equal((screen.getByLabelText("Status revisi") as HTMLSelectElement).value,"needs_review");
});
test("status conflict requires explicit review and sends fresh versions without losing date",async()=>{
 const conflict={...initial,status:"conflict" as const,latest:[{...taskRow,version:2}],message:"Data berubah"};let version="";
 render(createElement(StatusForm,{...props,initial:conflict,action:async(_,f)=>{version=String(f.get("versions"));return {...initial,status:"error",message:"Coba ulang"};}}));
 assert.equal(screen.queryByRole("button",{name:"Simpan status"}),null);
 await userEvent.setup().click(screen.getByRole("button",{name:"Terapkan isian saya"}));await waitFor(()=>assert.equal(JSON.parse(version)[taskId],2));
});
test("batch selection persists across pages and date policy has no implicit default",async()=>{
 const tasks=Array.from({length:21},(_,i)=>({...taskRow,id:`90000000-0000-4000-8000-${String(i).padStart(12,"0")}`}));
 render(createElement(StatusForm,{...props,mode:"send",tasks,initial:{...initial,selected:[],versions:Object.fromEntries(tasks.map(t=>[t.id,1])),values:{...initial.values,status:"awaiting_reply"}}}));
 assert.equal((screen.getByLabelText("Tanggal untuk revisi pilihan") as HTMLSelectElement).value,"");
 await userEvent.setup().click(screen.getAllByRole("checkbox")[0]);await userEvent.setup().click(screen.getByRole("button",{name:"Berikutnya"}));
 assert(screen.getByText("1 revisi dipilih"));await userEvent.setup().click(screen.getByRole("button",{name:"Sebelumnya"}));assert.equal((screen.getAllByRole("checkbox")[0] as HTMLInputElement).checked,true);
});
test("invalid status fields link inline errors and clear stale validation on edit",async()=>{
 const invalid={...initial,status:"invalid" as const,message:"Periksa isian",errors:{followUpOn:"Tanggal tidak valid"}};
 render(createElement(StatusForm,{...props,initial:invalid}));
 const input=screen.getByLabelText(/Tanggal tindak lanjut/);assert.equal(input.getAttribute("aria-invalid"),"true");assert(input.getAttribute("aria-describedby")?.includes("followUpOn-error"));assert(screen.getByText("Tanggal tidak valid",{selector:"p"}));
 fireEvent.change(input,{target:{value:"2026-12-01"}});assert.equal(input.getAttribute("aria-invalid"),"false");
});
