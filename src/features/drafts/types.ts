import type {RevisionStatus} from "../../lib/domain/revisions";
export type DraftContext={userId:string;organizationId:string;caseId:string;caseVersion:number;contactVersion:number;contactId:string;contactOwnerId:string;businessName:string;greetingName:string;phone:string;
  tasks:{id:string;instruction:string;status:RevisionStatus;version:number}[]};
export type DraftReply={status:"idle"|"ready"|"changed"|"invalid"|"forbidden"|"error";context?:DraftContext;message?:string;url?:string;longUrl?:boolean;notice?:string};
export type DraftRequest={intent:"refresh"|"compose"|"copy"|"open";userId:string;selected:string[];versions:Record<string,number>;caseVersion:number;contactVersion:number;message:string};
