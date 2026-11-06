-- Review and apply after 001. No anonymous table or RPC access.
create table public.skillproof_candidate_sessions (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  request_id uuid not null,
  version bigint not null default 0,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  unique(owner_id, request_id)
);
alter table public.skillproof_candidate_sessions enable row level security;
revoke all on public.skillproof_candidate_sessions from anon, authenticated;
grant select on public.skillproof_candidate_sessions to authenticated;
create policy "HR reads own candidate sessions" on public.skillproof_candidate_sessions
  for select to authenticated using ((select auth.uid()) = owner_id);
grant all on public.skillproof_candidate_sessions to service_role;

create table public.skillproof_candidate_limits (key text primary key, count integer not null, until_at timestamptz not null);
alter table public.skillproof_candidate_limits enable row level security;
revoke all on public.skillproof_candidate_limits from anon, authenticated;
grant all on public.skillproof_candidate_limits to service_role;

create function public.skillproof_candidate_create(payload jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare existing jsonb; ws public.skillproof_workspaces; vacancy jsonb;
begin
  -- Serialize retries for this owner/request even before an invitation row exists.
  perform pg_advisory_xact_lock(hashtextextended(payload->>'owner' || ':' || (payload->'createRequest'->>'requestId'), 0));
  select data into existing from public.skillproof_candidate_sessions
    where owner_id = (payload->>'owner')::uuid and request_id = (payload->'createRequest'->>'requestId')::uuid;
  if found then
    if existing->>'createHash' <> payload->>'createHash' then raise exception 'Request reused' using errcode = '40001'; end if;
    return jsonb_build_object('record', existing, 'created', false);
  end if;
  select * into ws from public.skillproof_workspaces where owner_id = (payload->>'owner')::uuid for share;
  if not found or ws.revision <> (payload->'createRequest'->>'workspaceRevision')::integer then
    raise exception 'Workspace changed' using errcode = '40001';
  end if;
  select v into vacancy from jsonb_array_elements(ws.data->'vacancies') v where v->>'id' = payload->'createRequest'->>'vacancyId';
  if vacancy is null or vacancy->'assessment'->>'approvedAt' is null
    or vacancy->'assessment' <> payload->'assessment'
    or not exists(select 1 from jsonb_array_elements(vacancy->'candidates') c where c->>'id' = payload->'createRequest'->>'candidateId') then
    raise exception 'Not approved or not owned' using errcode = '40001';
  end if;
  insert into public.skillproof_candidate_sessions(id,owner_id,request_id,data)
    values((payload->>'id')::uuid,(payload->>'owner')::uuid,(payload->'createRequest'->>'requestId')::uuid,payload);
  return jsonb_build_object('record', payload, 'created', true);
end; $$;

create function public.skillproof_candidate_read(target uuid) returns jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object('data',data,'version',version,'serverNow',clock_timestamp())
  from public.skillproof_candidate_sessions where id = target;
$$;

create function public.skillproof_candidate_cas(target uuid, expected bigint, payload jsonb) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare old public.skillproof_candidate_sessions;
begin
  select * into old from public.skillproof_candidate_sessions where id = target for update;
  if not found or old.version <> expected then return false; end if;
  if old.data->>'owner' <> payload->>'owner' or old.data->>'id' <> payload->>'id'
    or old.data->'assessment' <> payload->'assessment' or old.data->>'snapshotId' <> payload->>'snapshotId'
    then raise exception 'Immutable snapshot'; end if;
  -- If deadline passed while waiting for the lock, retry using database time.
  if old.data->>'status' = 'active' and (old.data->>'expiresAt')::timestamptz <= clock_timestamp()
    and payload->>'status' <> 'expired'
    and not (payload->>'status' = 'revoked' and payload->'answers' = old.data->'answers') then return false; end if;
  update public.skillproof_candidate_sessions set data = payload, version = version + 1 where id = target;
  return true;
end; $$;

create function public.skillproof_candidate_limit(bucket_key text) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare hits integer;
begin
  delete from public.skillproof_candidate_limits where until_at <= clock_timestamp();
  insert into public.skillproof_candidate_limits(key,count,until_at) values(bucket_key,1,clock_timestamp()+interval '1 minute')
    on conflict(key) do update set count = public.skillproof_candidate_limits.count + 1 returning count into hits;
  return hits <= 20;
end; $$;

revoke all on function public.skillproof_candidate_create(jsonb), public.skillproof_candidate_read(uuid), public.skillproof_candidate_cas(uuid,bigint,jsonb), public.skillproof_candidate_limit(text) from public, anon, authenticated;
grant execute on function public.skillproof_candidate_create(jsonb), public.skillproof_candidate_read(uuid), public.skillproof_candidate_cas(uuid,bigint,jsonb), public.skillproof_candidate_limit(text) to service_role;
