-- Administrative provisioning still evaluates the organization's timezone CHECK.
-- This grants one pure validator, not access to private receipts or write helpers.
grant execute on function private.valid_timezone(text) to service_role;
