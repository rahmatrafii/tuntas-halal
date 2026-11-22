import assert from "node:assert/strict";
import {test} from "node:test";
import {spawn, execFileSync} from "node:child_process";
import {once} from "node:events";
import {setTimeout as delay} from "node:timers/promises";
import {assertLocalEndpoints} from "../../scripts/database.mjs";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
import {JSDOM} from "jsdom";
import {assertPrivateDifferent, assertPortAvailable, waitForOwnedServer} from "./auth-harness.mjs";

const origin = "http://127.0.0.1:3150";
let ownedServer;
assertLocalEndpoints({API_URL: process.env.SUPABASE_TEST_URL, DB_URL: "postgresql://127.0.0.1/local-test"});

function ok(response, operation) {
  assert.equal(response.error?.code ?? null, null, `${operation} succeeded`);
  return response.data;
}
function remember(jar, response) {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0], index = pair.indexOf("=");
    const key = pair.slice(0,index), value = pair.slice(index+1);
    if (!value) jar.delete(key); else jar.set(key,value);
  }
}
async function request(path, jar = new Map(), init = {}) {
  assert(ownedServer && ownedServer.exitCode === null, "the owned Next test server must still be running");
  const response = await fetch(new URL(path,origin), {...init, redirect: "manual", headers: {...init.headers,
    cookie: [...jar].map(([key,value]) => `${key}=${value}`).join(";"), origin,
  }});
  remember(jar,response);
  return {response, html: await response.text()};
}
function redirected(result, path) {
  const header = result.response.headers.get("location");
  const document = new JSDOM(result.html).window.document;
  const meta = document.querySelector('meta[http-equiv="refresh"]')?.getAttribute("content")?.split("url=")[1];
  assert.equal(new URL(header ?? meta ?? "/missing-redirect", origin).pathname,path,"redirect destination is safe and expected");
}
async function submit(path, label, values, jar = new Map()) {
  const page = await request(path,jar);
  const form = new JSDOM(page.html).window.document.querySelector(`form[aria-label="${label}"]`);
  assert(form, "server rendered a working native form");
  const body = new FormData();
  for (const input of form.querySelectorAll('input[name]')) body.append(input.name,input.value);
  for (const [key,value] of Object.entries(values)) body.set(key,value);
  return request(path,jar,{method:"POST",body});
}
async function emailLink(email) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const list = await (await fetch("http://127.0.0.1:55324/api/v1/messages")).json();
    const item = list.messages.find(message => message.To.some(to => to.Address === email));
    if (item) {
      const message = await (await fetch(`http://127.0.0.1:55324/api/v1/message/${item.ID}`)).json();
      const url = new JSDOM(message.HTML).window.document.querySelector("a")?.href;
      assert(url,"local email contains confirmation link");
      assert.equal(new URL(url).origin,origin,"local email redirects to the isolated app only");
      return url;
    }
    await delay(100);
  }
  throw new Error("Expected local email did not arrive in Mailpit.");
}
function session(jar) {
  const base = [...jar.keys()].find(key => /^sb-.*-auth-token(?:\.0)?$/.test(key))?.replace(/\.0$/,"");
  assert(base,"Auth session cookie exists");
  const value = jar.get(base) ?? [...jar].filter(([key])=>key.startsWith(`${base}.`)).sort(([a],[b])=>a.localeCompare(b)).map(([,value])=>value).join("");
  return {base,data:JSON.parse(Buffer.from(decodeURIComponent(value).replace(/^base64-/,""),"base64url").toString())};
}
function replaceSession(jar,base,data) {
  for (const key of [...jar.keys()]) if(key===base||key.startsWith(`${base}.`)) jar.delete(key);
  const value=`base64-${Buffer.from(JSON.stringify(data)).toString("base64url")}`;
  for(let offset=0;offset<value.length;offset+=3180)jar.set(`${base}.${offset/3180}`,value.slice(offset,offset+3180));
}

test("staff HTTP routes enforce real sessions independently of demo localStorage", {timeout: 180000}, async () => {
  await assertPortAvailable(3150);
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3150"], {env: {
    ...process.env, SIHALAL_AUTH_TEST: "1", APP_URL: origin,
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_TEST_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_TEST_PUBLISHABLE_KEY,
  }, stdio: ["ignore", "pipe", "pipe"]});
  const ended = once(server, "exit");
  ownedServer=server;
  // Next request logs can contain callback token hashes. Never forward child output.
  server.stderr.resume();
  try {
    await waitForOwnedServer(server);
    const anonymous = await request("/staf");
    assert([303,307].includes(anonymous.response.status), "unauthenticated staff page redirects before streaming");
    redirected(anonymous,"/staf/login");
    assert(anonymous.response.headers.get("cache-control").includes("no-store"));
    const forged = new Map([["sb-invalid-auth-token","invalid-cookie"]]);
    redirected(await request("/staf",forged),"/staf/login");
    const invalidEmailResult=await submit("/staf/login","Masuk staf undangan",{email:"invalid@"});
    assert.equal(new JSDOM(invalidEmailResult.html).window.document.querySelector('input[name="email"]').value,"invalid@","native POST validation preserves entered email without JavaScript");

    const admin = createClient(process.env.SUPABASE_TEST_URL,process.env.SUPABASE_TEST_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const tag=randomUUID(), orgA=randomUUID(), orgB=randomUUID();
    ok(await admin.from("organizations").insert([{id:orgA,name:"LP3H A Fiktif Auth"},{id:orgB,name:"LP3H B Fiktif Auth"}]),"local organizations");
    const users={};
    for(const label of ["a","b","inactive","none"]){
      const email=`auth-${label}-${tag}@example.test`;
      const data=ok(await admin.auth.admin.createUser({email,email_confirm:true}),"local Auth fixture");
      users[label]={id:data.user.id,email};
      if(label!=="none")ok(await admin.from("memberships").insert({organization_id:label==="b"?orgB:orgA,user_id:data.user.id,role:"companion",is_active:label!=="inactive"}),"local membership");
    }
    const jars={};
    async function login(label) {
      const jar=new Map();
      const result=await submit("/staf/login","Masuk staf undangan",{email:users[label].email},jar);
      assert(result.html.includes("Jika email ini terdaftar"),"native form confirms only a conditional outcome");
      const link=await emailLink(users[label].email);
      redirected(await request(link,jar),"/staf");
      jars[label]=jar;
      return {jar,link};
    }
    const a=await login("a");
    let page=await request("/staf",a.jar);
    assert(page.html.includes("LP3H A Fiktif Auth")&&!page.html.includes("LP3H B Fiktif Auth")&&!page.html.includes("Nadia Putri"),"real staff page is isolated from other tenants and demo identity");
    assert(page.response.headers.get("cache-control").includes("no-store"));
    redirected(await request(a.link),"/staf/login");
    const b=await login("b");
    page=await request("/staf",b.jar);
    assert(page.html.includes("LP3H B Fiktif Auth")&&!page.html.includes("LP3H A Fiktif Auth"),"second user receives only their own membership");
    assertPrivateDifferent([...a.jar],[...b.jar],"independent users have independent cookies");

    const stale=session(a.jar), oldRefresh=stale.data.refresh_token;
    replaceSession(a.jar,stale.base,{...stale.data,expires_at:1});
    page=await request("/staf",a.jar);
    assert(page.html.includes("LP3H A Fiktif Auth"),"expired session metadata with valid refresh recovers actual Auth session");
    assertPrivateDifferent(session(a.jar).data.refresh_token,oldRefresh,"provider rotated refresh token and SSR returned cookies");
    assert(page.response.headers.getSetCookie().length>0,"refresh cookies reach HTTP response");
    const invalidRefresh=new Map(a.jar), bad=session(invalidRefresh);
    replaceSession(invalidRefresh,bad.base,{...bad.data,expires_at:1,refresh_token:"invalid-refresh-token"});
    redirected(await request("/staf",invalidRefresh),"/staf/login");
    assert(![...invalidRefresh.keys()].some(key=>key.startsWith(bad.base)),"failed refresh deletes auth cookies on redirect");

    ok(await admin.from("memberships").update({is_active:false}).eq("organization_id",orgA).eq("user_id",users.a.id),"revoke membership");
    redirected(await request("/staf",a.jar),"/staf/akses-terbatas");
    page=await request("/staf/akses-terbatas",a.jar);
    assert(page.html.includes("belum memiliki keanggotaan LP3H yang aktif"),"inactive membership receives honest restricted screen");
    ok(await admin.from("memberships").update({is_active:true}).eq("organization_id",orgA).eq("user_id",users.a.id),"restore local fixture");
    ok(await admin.from("memberships").insert({organization_id:orgB,user_id:users.a.id,role:"coordinator"}),"second own membership");
    page=await request("/staf",a.jar);
    assert(page.html.includes("LP3H A Fiktif Auth")&&page.html.includes("LP3H B Fiktif Auth"),"multiple own memberships are shown without choosing a tenant");

    for(const label of ["inactive","none"]){
      const linkData=ok(await admin.auth.admin.generateLink({type:"magiclink",email:users[label].email}),"local restricted link");
      const jar=new Map();
      await request(`/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=email`,jar);
      redirected(await request("/staf",jar),"/staf/akses-terbatas");
      redirected(await submit("/staf/akses-terbatas","Keluar dari sesi staf",{},jar),"/staf/login");
      redirected(await request("/staf",jar),"/staf/login");
    }

    const inviteEmail=`auth-invite-${tag}@example.test`;
    const invited=ok(await admin.auth.admin.inviteUserByEmail(inviteEmail,{redirectTo:`${origin}/auth/confirm`}),"local invitation");
    ok(await admin.from("memberships").insert({organization_id:orgA,user_id:invited.user.id,role:"companion"}),"invited local membership");
    const inviteJar=new Map();
    redirected(await request(await emailLink(inviteEmail),inviteJar),"/staf");
    assert((await request("/staf",inviteJar)).html.includes("LP3H A Fiktif Auth"),"real invitation establishes usable cookie session");

    const expired=ok(await admin.auth.admin.generateLink({type:"magiclink",email:users.a.email}),"expired fixture link");
    execFileSync("docker",["exec","supabase_db_sihalal-f01","psql","-XqAt","-U","postgres","-d","postgres","-c",`update auth.one_time_tokens set expires_at=now()-interval '1 hour' where user_id='${users.a.id}'; update auth.users set recovery_sent_at=now()-interval '2 hours',confirmation_sent_at=now()-interval '2 hours' where id='${users.a.id}';`],{stdio:["ignore","pipe","pipe"]});
    redirected(await request(`/auth/confirm?token_hash=${expired.properties.hashed_token}&type=email`),"/staf/login");
    for(const query of ["type=recovery&token_hash="+"a".repeat(64),"type=email&token_hash=invalid", "type=email&type=invite"]){
      redirected(await request(`/auth/confirm?${query}&next=https://attacker.example.test`),"/staf/login");
    }
    const unknown=`unknown-${tag}@example.test`;
    const unknownResult=await submit("/staf/login","Masuk staf undangan",{email:unknown});
    assert(unknownResult.html.includes("Jika email ini terdaftar"),"unknown email does not disclose an account lookup");
    const listed=ok(await admin.auth.admin.listUsers({page:1,perPage:1000}),"local fixture inspection");
    assert(!listed.users.some(user=>user.email===unknown),"login never creates a new account");
    redirected(await submit("/staf","Keluar dari sesi staf",{},b.jar),"/staf/login");
    redirected(await request("/staf",b.jar),"/staf/login");
  } finally {if(server.exitCode===null)server.kill(); await ended; ownedServer=null;}
});
