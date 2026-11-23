import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {JSDOM} from "jsdom";
import {StatusForm} from "../src/features/status/forms";
import {taskRow} from "./draft-fixture";
import {seed} from "./caseload-fixture";
test("native batch exposes every instruction and keeps submit available for manual selection",()=>{
 const tasks=Array.from({length:21},(_,i)=>({...taskRow,id:`90000000-0000-4000-8000-${String(i).padStart(12,"0")}`,instruction:`Native task ${i}`}));
 const html=renderToStaticMarkup(createElement(StatusForm,{mode:"send",tasks,businessName:"Usaha",permalink:"/pengiriman",cancelHref:"/kasus",initial:{status:"idle",seed,selected:[],versions:Object.fromEntries(tasks.map(t=>[t.id,1])),values:{status:"awaiting_reply",followUpOn:"",datePolicy:"",sent:"",completion:""}},action:async s=>s}));
 const d=new JSDOM(html).window.document;
 assert.equal(d.querySelectorAll('input[type="checkbox"][name="taskId"]').length,21);
 assert(d.body.textContent?.includes("Native task 20"));
 assert(d.querySelector('input[type="date"][name="followUpOn"]'));
 assert(d.querySelector('input[type="checkbox"][name="sent"]'));
 assert.equal(d.querySelector('button[type="submit"]')?.hasAttribute("disabled"),false);
});
