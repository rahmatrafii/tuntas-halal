import type {RevisionTask} from "../revisions/queries";
export type StatusMode="single"|"send";
export type StatusState={status:"idle"|"invalid"|"error"|"forbidden"|"conflict"|"saved"|"unchanged";seed:string;selected:string[];versions:Record<string,number>;values:Record<string,string>;message?:string;errors?:Record<string,string>;latest?:RevisionTask[]};
