import {createClient} from "@supabase/supabase-js";
import type {Database} from "../src/lib/supabase/database.types";

export const org = "11111111-1111-4111-8111-111111111111";
export const otherOrg = "22222222-2222-4222-8222-222222222222";
export const actor = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const resource = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const seed = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
export const contact = {id: resource, organization_id: org, owner_id: actor, business_name: "Usaha Fiktif",
  whatsapp_number: "6281200000101", greeting_name: "Ibu", version: 2, created_at: "2026-11-21T00:00:00Z"};

export function fixture(options: {role?: "companion"|"coordinator"; active?: boolean; authError?: boolean;
  rows?: Record<string, unknown[]>; rpcData?:unknown; rpcError?: {code:string;message:string}; rpcThrows?: boolean; onRpc?:()=>void; queryError?:string; paginate?:boolean} = {}) {
  const calls: {url:URL;body:Record<string,unknown>|null}[] = [];
  const client = createClient<Database>("https://database.example.test", "public-test-key", {
    auth: {persistSession:false, autoRefreshToken:false},
    global: {fetch: async (input, init) => {
      const url = new URL(String(input)), body = init?.body ? JSON.parse(String(init.body)) : null;
      calls.push({url, body});
      const table = url.pathname.split("/").pop()!;
      if (url.pathname.includes("/rpc/")) {
        options.onRpc?.();
        if (options.rpcThrows) throw new Error("private provider diagnostic must not reach user");
        return new Response(JSON.stringify(options.rpcError ?? options.rpcData ?? {id:body?.p_id ?? resource,version:3}), {
          status: options.rpcError ? (options.rpcError.code === "PT409" ? 409 : 400) : 200,
          headers:{"content-type":"application/json"},
        });
      }
      if(options.queryError===table)return new Response(JSON.stringify({code:"08006",message:"private diagnostic"}),{status:400,headers:{"content-type":"application/json"}});
      let rows: unknown[] = table === "memberships" ? (options.active === false ? [] : [
        {organization_id:org, role:options.role ?? "companion", organizations:{name:"LP3H Fiktif",timezone:"Asia/Jakarta"}},
      ]) : options.rows?.[table] ?? [];
      if (url.searchParams.get("id")?.startsWith("eq.")) rows = rows.filter(row => (row as {id:string}).id === url.searchParams.get("id")!.slice(3));
      if (url.searchParams.get("id")?.startsWith("neq.")) rows = rows.filter(row => (row as {id:string}).id !== url.searchParams.get("id")!.slice(4));
      if(options.paginate&&url.searchParams.has("limit")){const start=Number(url.searchParams.get("offset")??0);rows=rows.slice(start,start+Number(url.searchParams.get("limit")));}
      const singular = String(new Headers(init?.headers).get("accept")).includes("vnd.pgrst.object");
      return new Response(JSON.stringify(singular ? rows[0] ?? null : rows), {headers:{"content-type":"application/json"}});
    }},
  });
  client.auth.getClaims = async () => options.authError
    ? {data:null,error:{status:503} as never}
    : {data:{claims:{sub:actor,email:"fixture@example.test"}} as never,error:null};
  return {client,calls};
}
