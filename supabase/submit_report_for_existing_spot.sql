alter table if exists public.reportes
add column if not exists fecha date;

alter table if exists public.reportes
add column if not exists hora time;

alter table if exists public.reportes
add column if not exists condiciones_texto text;

alter table if exists public.reportes
add column if not exists hubo_pique boolean default false;

alter table if exists public.reportes
add column if not exists mosca_funciono text;

alter table if exists public.reportes
add column if not exists linea text;

alter table if exists public.reportes
add column if not exists tippet text;

alter table if exists public.reportes
add column if not exists cania text;

alter table if exists public.reportes
add column if not exists trucha text;

alter table if exists public.reportes
add column if not exists ubicacion text;

alter table if exists public.reportes
add column if not exists foto_url text;

alter table if exists public.reportes
add column if not exists puntaje_estrellas int;

alter table if exists public.reportes
add column if not exists validado boolean default false;

alter table if exists public.reportes
add column if not exists puntos_asignados int default 0;

alter table if exists public.reportes
drop constraint if exists reportes_puntaje_estrellas_check;

alter table if exists public.reportes
add constraint reportes_puntaje_estrellas_check
check (puntaje_estrellas is null or puntaje_estrellas between 1 and 5);

drop function if exists public.submit_report_for_existing_spot(
  uuid,
  date,
  time,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  int,
  text
);

drop function if exists public.submit_report_for_existing_spot(
  uuid,
  text,
  date,
  time,
  text,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  int
);

create function public.submit_report_for_existing_spot(
  p_spot_id uuid,
  p_descripcion text,
  p_fecha date,
  p_hora time,
  p_ubicacion text,
  p_hubo_pique boolean,
  p_mosca text,
  p_linea text,
  p_tippet text,
  p_cania text,
  p_trucha text,
  p_foto_url text,
  p_puntaje_estrellas int
)
returns public.reportes
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_reporte public.reportes;
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  if not exists (select 1 from public.spots where id = p_spot_id) then
    raise exception 'Spot inexistente';
  end if;

  if p_puntaje_estrellas is null or p_puntaje_estrellas < 1 or p_puntaje_estrellas > 5 then
    raise exception 'El puntaje debe estar entre 1 y 5';
  end if;

  if nullif(trim(p_descripcion), '') is null
    or nullif(trim(p_ubicacion), '') is null
    or nullif(trim(p_mosca), '') is null
    or nullif(trim(p_linea), '') is null
    or nullif(trim(p_tippet), '') is null
    or nullif(trim(p_cania), '') is null
    or nullif(trim(p_trucha), '') is null then
    raise exception 'Faltan campos obligatorios del reporte';
  end if;

  insert into public.reportes (
    spot_id,
    user_id,
    fecha,
    hora,
    condiciones_texto,
    hubo_pique,
    mosca_funciono,
    linea,
    tippet,
    cania,
    trucha,
    ubicacion,
    puntaje_estrellas,
    foto_url,
    validado,
    puntos_asignados
  )
  values (
    p_spot_id,
    v_user_id,
    p_fecha,
    p_hora,
    nullif(trim(p_descripcion), ''),
    coalesce(p_hubo_pique, false),
    nullif(trim(p_mosca), ''),
    nullif(trim(p_linea), ''),
    nullif(trim(p_tippet), ''),
    nullif(trim(p_cania), ''),
    nullif(trim(p_trucha), ''),
    nullif(trim(p_ubicacion), ''),
    p_puntaje_estrellas,
    nullif(trim(p_foto_url), ''),
    false,
    0
  )
  returning * into v_reporte;

  return v_reporte;
end;
$$;

grant usage on schema public to authenticated;
grant select on public.spots to authenticated;
grant select on public.reportes to anon, authenticated;
grant insert on public.reportes to authenticated;
grant execute on function public.submit_report_for_existing_spot(
  uuid,
  text,
  date,
  time,
  text,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  int
) to authenticated;

alter table public.reportes enable row level security;

drop policy if exists "reportes lectura publica" on public.reportes;
create policy "reportes lectura publica"
on public.reportes for select
to anon, authenticated
using (true);

drop policy if exists "reportes insert usuario" on public.reportes;
create policy "reportes insert usuario"
on public.reportes for insert
to authenticated
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('reportes-fotos', 'reportes-fotos', true)
on conflict (id) do nothing;

drop policy if exists "reportes fotos lectura publica" on storage.objects;
create policy "reportes fotos lectura publica"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'reportes-fotos');

drop policy if exists "reportes fotos insert propia" on storage.objects;
create policy "reportes fotos insert propia"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'reportes-fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';
