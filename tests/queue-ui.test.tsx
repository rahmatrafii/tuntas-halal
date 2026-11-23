import {dom} from "./dom-setup";
import assert from "node:assert/strict";
import {test,afterEach} from "node:test";
import {createElement} from "react";
import {render,screen,cleanup,fireEvent} from "@testing-library/react";
import {QueueView} from "../src/features/queue/ui";
import {CaseList} from "../src/features/caseload/ui";
import type {QueuePage,QueueItem} from "../src/features/queue/queries";
import {context} from "./queue-fixture";
import {caseRow} from "./draft-fixture";
afterEach(cleanup);
void dom;
const item:QueueItem={id:"revision-a",caseId:"case-a",businessName:"Usaha Fiktif",reference:"REF-01",instruction:"Perbaiki label",status:"needs_sending",followUpOn:null,group:"needs_sending"};
const result:QueuePage={input:{q:"Label & foto",status:"needs_sending",page:2},today:"2026-11-23",items:[item],groups:[{id:"needs_sending",count:22}],total:22,page:2,hasNext:false};

test("queue GET controls are labelled, preserve filters in pagination and link the next action",()=>{
 render(createElement(QueueView,{context,result}));
 const form=screen.getByRole("form",{name:"Cari dan filter revisi"});assert.equal(form.getAttribute("method"),"get");
 assert.equal((screen.getByLabelText("Cari usaha atau nomor pengajuan") as HTMLInputElement).value,"Label & foto");
 assert.equal((screen.getByLabelText("Tampilkan revisi") as HTMLSelectElement).value,"needs_sending");
 const prior=new URL(screen.getByRole("link",{name:"Sebelumnya"}).getAttribute("href")!,"http://localhost");assert.equal(prior.searchParams.get("q"),"Label & foto");assert.equal(prior.searchParams.get("status"),"needs_sending");assert.equal(prior.searchParams.get("page"),null);
 assert(screen.getByRole("link",{name:"Siapkan pesan"}).getAttribute("href")?.endsWith("/kasus/case-a/pesan?pilih=revision-a"));
 assert(screen.getByRole("link",{name:"Tambah revisi"}).getAttribute("href")?.endsWith("/kasus?pilih=revisi"));
});
test("queue labels every stored status and uses one primary action per revision",()=>{
 const items:QueueItem[]=[{...item,id:"due",status:"awaiting_reply",followUpOn:"2026-11-23",group:"contact_today"},{...item,id:"review",status:"needs_review",group:"needs_review"},item,{...item,id:"wait",status:"awaiting_reply",group:"awaiting_reply"},{...item,id:"done",status:"completed",group:"completed"}];
 render(createElement(QueueView,{context,result:{...result,items,groups:items.map(t=>({id:t.group,count:1}))}}));
 for(const name of ["Siapkan pengingat","Periksa revisi","Siapkan pesan","Catat balasan","Lihat kasus"])assert(screen.getByRole("link",{name}));
 assert.equal(document.querySelectorAll('.queue-task .button.primary').length,5);assert(screen.getByRole("heading",{name:/Hubungi hari ini/}));
 assert.equal(document.querySelector('time[datetime="2026-11-23"]')!==null,true);
});
test("coordinator queue exposes case details without editing or drafting actions",()=>{
 render(createElement(QueueView,{context:{...context,role:"coordinator"},result}));
 assert(screen.getByRole("link",{name:"Lihat kasus"}));
 assert.equal(screen.queryByRole("link",{name:"Siapkan pesan"})===null,true);assert.equal(screen.queryByRole("link",{name:"Tambah revisi"})===null,true);
});
test("empty queue and filtered no-results explain the next step",()=>{
 const empty={...result,total:0,items:[],input:{q:"",status:"all" as const,page:1}};
 const view=render(createElement(QueueView,{context,result:empty}));assert(screen.getByRole("heading",{name:"Belum ada revisi aktif"}));
 view.rerender(createElement(QueueView,{context,result:{...empty,input:{...empty.input,q:"Tidak ada"}}}));assert(screen.getByRole("heading",{name:"Tidak ada revisi yang cocok"}));assert(screen.getByRole("link",{name:"Reset pencarian dan filter"}));
});
test("revision picker takes an owned case directly to its new revision form",()=>{
 render(createElement(CaseList,{items:[caseRow],basePath:"/staf/lembaga/uji",userId:context.userId,newRevision:true}));
 assert.equal(screen.getByRole("link").getAttribute("href"),`/staf/lembaga/uji/kasus/${caseRow.id}/revisi/baru`);
});
test("queue reset navigation replaces stale controls with the normalized URL state",()=>{
 const view=render(createElement(QueueView,{context,result}));
 fireEvent.change(screen.getByLabelText("Cari usaha atau nomor pengajuan"),{target:{value:"Belum diterapkan"}});
 fireEvent.change(screen.getByLabelText("Tampilkan revisi"),{target:{value:"completed"}});
 view.rerender(createElement(QueueView,{context,result:{...result,input:{q:"",status:"all",page:1},page:1}}));
 assert.equal((screen.getByLabelText("Cari usaha atau nomor pengajuan") as HTMLInputElement).value,"");
 assert.equal((screen.getByLabelText("Tampilkan revisi") as HTMLSelectElement).value,"all");
});
