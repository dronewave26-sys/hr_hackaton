-- Apply after 002. Reports are immutable, server-generated and HR-owner scoped.
create table public.skillproof_practical_reports (
  invitation_id uuid primary key references public.skillproof_candidate_sessions(id),
  owner_id uuid not null references auth.users(id),
  snapshot_id uuid not null,
  session_id uuid not null,
  binding text not null check (binding ~ '^[a-f0-9]{64}$'),
  report jsonb not null check (jsonb_typeof(report) = 'object' and report ? 'source' and report->>'source' = 'claude'),
  created_at timestamptz not null default now()
);
alter table public.skillproof_practical_reports enable row level security;
revoke all on public.skillproof_practical_reports from public, anon, authenticated, service_role;
grant select on public.skillproof_practical_reports to authenticated;
grant select, insert on public.skillproof_practical_reports to service_role;
create policy "HR reads own practical report" on public.skillproof_practical_reports
  for select to authenticated using ((select auth.uid()) = owner_id);

create function public.skillproof_practical_report_create(payload jsonb, expected_snapshot jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare session_row public.skillproof_candidate_sessions; current_snapshot jsonb; saved public.skillproof_practical_reports;
begin
  -- Serialize against candidate CAS updates and revocation while binding the report.
  select * into session_row from public.skillproof_candidate_sessions
    where id = (payload->>'invitation_id')::uuid for share;
  if not found or session_row.owner_id <> (payload->>'owner_id')::uuid
    or session_row.data->>'status' not in ('submitted', 'expired')
    or session_row.data->>'completedAt' is null then
    raise exception 'Terminal owned session required' using errcode = '40001';
  end if;
  current_snapshot := jsonb_build_object(
    'snapshotId', session_row.data->'snapshotId', 'sessionId', session_row.data->'sessionId',
    'assessment', session_row.data->'assessment', 'answers', session_row.data->'answers',
    'status', session_row.data->'status', 'completedAt', session_row.data->'completedAt'
  );
  if current_snapshot is distinct from expected_snapshot
    or session_row.data->>'snapshotId' <> payload->>'snapshot_id'
    or session_row.data->>'sessionId' <> payload->>'session_id' then
    raise exception 'Session snapshot changed' using errcode = '40001';
  end if;
  insert into public.skillproof_practical_reports(invitation_id,owner_id,snapshot_id,session_id,binding,report)
    values((payload->>'invitation_id')::uuid,(payload->>'owner_id')::uuid,(payload->>'snapshot_id')::uuid,(payload->>'session_id')::uuid,payload->>'binding',payload->'report')
    on conflict (invitation_id) do nothing;
  select * into saved from public.skillproof_practical_reports where invitation_id = (payload->>'invitation_id')::uuid;
  if saved.owner_id <> (payload->>'owner_id')::uuid or saved.binding <> payload->>'binding' then
    raise exception 'Report already bound to another snapshot' using errcode = '40001';
  end if;
  return to_jsonb(saved);
end; $$;
revoke all on function public.skillproof_practical_report_create(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.skillproof_practical_report_create(jsonb,jsonb) to service_role;
