-- Server-only extraction reservations: one paid attempt for concurrent duplicates.
create table public.flyer_extraction_jobs (
  cache_key text primary key check (cache_key ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('processing','complete','failed')),
  claim_id uuid not null,
  lease_until timestamptz not null,
  expires_at timestamptz not null,
  result jsonb,
  check (result is null or octet_length(result::text) <= 2000000)
);
create index flyer_extraction_expiry_idx on public.flyer_extraction_jobs(expires_at);
create table public.flyer_extraction_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  attempts integer not null check (attempts > 0),
  primary key(user_id,day)
);
create table public.flyer_extraction_daily (
  day date primary key,
  attempts integer not null check (attempts > 0)
);
alter table public.flyer_extraction_jobs enable row level security;
alter table public.flyer_extraction_usage enable row level security;
alter table public.flyer_extraction_daily enable row level security;
revoke all on public.flyer_extraction_jobs,public.flyer_extraction_usage,public.flyer_extraction_daily from public,anon,authenticated;
grant all on public.flyer_extraction_jobs,public.flyer_extraction_usage,public.flyer_extraction_daily to service_role;

create function public.claim_flyer_extraction(p_user_id uuid,p_cache_key text,
  p_user_limit integer default 120,p_global_limit integer default 300) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare job public.flyer_extraction_jobs; claim uuid := gen_random_uuid();
  today date := (now() at time zone 'UTC')::date;
begin
  if p_cache_key is null or p_cache_key !~ '^[a-f0-9]{64}$'
    or p_user_limit not between 1 and 5000 or p_global_limit not between 1 and 5000
    or p_user_limit is null or p_global_limit is null then raise exception 'Invalid extraction reservation'; end if;
  if not exists(select 1 from public.admin_users where user_id=p_user_id)
    then raise exception 'Admin access required'; end if;
  -- Serializes cache lookup and both counters, including distinct files/users.
  perform pg_advisory_xact_lock(hashtextextended('pocketcart-flyer-extraction',0));
  delete from public.flyer_extraction_jobs where expires_at < now();
  delete from public.flyer_extraction_usage where day < today-30;
  delete from public.flyer_extraction_daily where day < today-30;
  select * into job from public.flyer_extraction_jobs where cache_key=p_cache_key;
  if found and job.status='complete' and job.result is not null then
    return jsonb_build_object('state','cached','result',job.result);
  end if;
  if found and job.status='processing' and job.lease_until > now() then
    return jsonb_build_object('state','busy');
  end if;
  if coalesce((select attempts from public.flyer_extraction_usage where user_id=p_user_id and day=today),0)>=p_user_limit
    or coalesce((select attempts from public.flyer_extraction_daily where day=today),0)>=p_global_limit then
    return jsonb_build_object('state','limited');
  end if;
  insert into public.flyer_extraction_usage values(p_user_id,today,1)
    on conflict(user_id,day) do update set attempts=flyer_extraction_usage.attempts+1;
  insert into public.flyer_extraction_daily values(today,1)
    on conflict(day) do update set attempts=flyer_extraction_daily.attempts+1;
  insert into public.flyer_extraction_jobs values(p_cache_key,'processing',claim,now()+interval '10 minutes',now()+interval '7 days',null)
    on conflict(cache_key) do update set status='processing',claim_id=claim,lease_until=excluded.lease_until,
      expires_at=excluded.expires_at,result=null;
  return jsonb_build_object('state','claimed','claimId',claim);
end $$;

create function public.finish_flyer_extraction(p_cache_key text,p_claim_id uuid,p_result jsonb) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_result is not null and (jsonb_typeof(p_result) is distinct from 'object'
    or jsonb_typeof(p_result->'rows') is distinct from 'array') then raise exception 'Invalid extraction result'; end if;
  update public.flyer_extraction_jobs set status=case when p_result is null then 'failed' else 'complete' end,
    result=p_result,expires_at=now()+interval '7 days'
    where cache_key=p_cache_key and claim_id=p_claim_id and status='processing';
  return found;
end $$;
revoke all on function public.claim_flyer_extraction(uuid,text,integer,integer),public.finish_flyer_extraction(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.claim_flyer_extraction(uuid,text,integer,integer),public.finish_flyer_extraction(text,uuid,jsonb) to service_role;
notify pgrst,'reload schema';
