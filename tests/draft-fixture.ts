import {actor,org,resource,contact} from "./caseload-fixture";
export const caseId="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
export const taskId="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
export const caseRow={id:caseId,organization_id:org,contact_id:resource,assignee_id:actor,official_reference:null,version:1,created_at:contact.created_at,business_contacts:contact};
export const taskRow={id:taskId,case_id:caseId,instruction:"Perbaiki foto label",status:"needs_sending" as const,version:1,follow_up_on:null,created_at:contact.created_at,updated_at:contact.created_at};
export const draftContext={userId:actor,organizationId:org,caseId,caseVersion:1,contactVersion:2,contactId:resource,contactOwnerId:actor,businessName:"Usaha Fiktif",greetingName:"Ibu",phone:"6281200000101",tasks:[{id:taskId,instruction:"Perbaiki foto label",status:"needs_sending" as const,version:1}]};
export const draftRequest={intent:"open",userId:actor,selected:[taskId],versions:{[taskId]:1},caseVersion:1,contactVersion:2,message:"Foto jelas & lengkap #1\nTerima kasih 😀"};
