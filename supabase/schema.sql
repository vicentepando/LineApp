create extension if not exists pgcrypto;

create table if not exists spots (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  provincia text not null,
  tipo text check (tipo in ('río','lago','arroyo','embalse')) not null,
  lat decimal(9,6) not null,
  lon decimal(9,6) not null,
  accesibilidad text check (accesibilidad in ('público','pago','permiso','privado')) not null,
  especies text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists fichas_tecnicas (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid references spots(id) on delete cascade,
  temporada_inicio int check (temporada_inicio between 1 and 12),
  temporada_fin int check (temporada_fin between 1 and 12),
  franja_horaria text check (franja_horaria in ('manana','media_manana','mediodia','tarde','atardecer')),
  cana_weight int,
  cana_largo int,
  cana_accion text check (cana_accion in ('fast','medium-fast','medium')),
  linea_weight int,
  linea_tipo text check (linea_tipo in ('flote','hundimiento','sink-tip')),
  leader_largo int,
  tippet_grosor text,
  moscas jsonb default '[]',
  truchas text[] default '{}',
  created_at timestamptz default now()
);

alter table if exists public.fichas_tecnicas
add column if not exists truchas text[] default '{}';

create table if not exists usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  email text,
  nivel text check (nivel in ('principiante','intermedio','avanzado')) default 'principiante',
  pesca_con_mosca boolean,
  experiencia_pesca text check (experiencia_pesca in ('1-9_meses','9-18_meses','mas_2_anos')),
  puntos_totales int default 0,
  aportes_validados int default 0,
  created_at timestamptz default now()
);

alter table if exists public.usuarios
add column if not exists pesca_con_mosca boolean;

alter table if exists public.usuarios
add column if not exists experiencia_pesca text;

alter table if exists public.usuarios
drop constraint if exists usuarios_experiencia_pesca_check;

alter table if exists public.usuarios
add constraint usuarios_experiencia_pesca_check
check (experiencia_pesca is null or experiencia_pesca in ('1-9_meses','9-18_meses','mas_2_anos'));

create table if not exists reportes (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid references spots(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  fecha date not null,
  hora time not null,
  condiciones_texto text,
  hubo_pique boolean default false,
  mosca_funciono text,
  puntaje_estrellas int,
  foto_url text,
  validado boolean default false,
  puntos_asignados int default 0,
  created_at timestamptz default now()
);

alter table if exists public.reportes
add column if not exists puntaje_estrellas int;

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
drop constraint if exists reportes_puntaje_estrellas_check;

alter table if exists public.reportes
add constraint reportes_puntaje_estrellas_check
check (puntaje_estrellas is null or puntaje_estrellas between 1 and 5);

insert into storage.buckets (id, name, public)
values ('reportes-fotos', 'reportes-fotos', true)
on conflict (id) do nothing;

create or replace function public.create_usuario_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, email, nivel, pesca_con_mosca, experiencia_pesca)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nombre',
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'nivel', ''), 'principiante'),
    case
      when new.raw_user_meta_data ? 'pesca_con_mosca' then (new.raw_user_meta_data ->> 'pesca_con_mosca')::boolean
      else null
    end,
    nullif(new.raw_user_meta_data ->> 'experiencia_pesca', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_usuario_profile();

create or replace function public.award_points_on_validation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.validado = true and old.validado = false and new.user_id is not null then
    new.puntos_asignados := 10;

    update public.usuarios
    set
      puntos_totales = puntos_totales + 10,
      aportes_validados = aportes_validados + 1
    where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists reportes_award_points on public.reportes;
create trigger reportes_award_points
before update of validado on public.reportes
for each row execute function public.award_points_on_validation();

create or replace function public.submit_spot_report(
  p_nombre text,
  p_provincia text,
  p_lat double precision,
  p_lon double precision,
  p_descripcion text,
  p_mosca text,
  p_linea_weight int,
  p_linea_tipo text,
  p_foto_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_spot_id uuid;
  v_points int := case when p_foto_url is null then 200 else 400 end;
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  if p_linea_tipo not in ('flote','hundimiento','sink-tip') then
    raise exception 'Tipo de linea invalido';
  end if;

  insert into public.spots (nombre, provincia, tipo, lat, lon, accesibilidad, especies)
  values (
    coalesce(nullif(trim(p_nombre), ''), 'Spot reportado'),
    coalesce(nullif(trim(p_provincia), ''), 'Reportado'),
    'río',
    p_lat,
    p_lon,
    'público',
    '{}'
  )
  returning id into v_spot_id;

  insert into public.fichas_tecnicas (
    spot_id,
    temporada_inicio,
    temporada_fin,
    franja_horaria,
    cana_weight,
    cana_largo,
    cana_accion,
    linea_weight,
    linea_tipo,
    leader_largo,
    tippet_grosor,
    moscas
  )
  values (
    v_spot_id,
    null,
    null,
    null,
    p_linea_weight,
    9,
    'medium-fast',
    p_linea_weight,
    p_linea_tipo,
    9,
    '3X-5X',
    jsonb_build_array(jsonb_build_object('nombre', trim(p_mosca), 'tipo', 'Ninfa'))
  );

  insert into public.reportes (
    spot_id,
    user_id,
    fecha,
    hora,
    condiciones_texto,
    hubo_pique,
    mosca_funciono,
    foto_url,
    validado,
    puntos_asignados
  )
  values (
    v_spot_id,
    v_user_id,
    current_date,
    localtime,
    nullif(trim(p_descripcion), ''),
    true,
    nullif(trim(p_mosca), ''),
    p_foto_url,
    true,
    v_points
  );

  update public.usuarios
  set
    puntos_totales = puntos_totales + v_points,
    aportes_validados = aportes_validados + 1
  where id = v_user_id;

  return v_spot_id;
end;
$$;

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

alter table public.spots enable row level security;
alter table public.fichas_tecnicas enable row level security;
alter table public.reportes enable row level security;
alter table public.usuarios enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.spots to anon, authenticated;
grant select on public.fichas_tecnicas to anon, authenticated;
grant select on public.reportes to anon, authenticated;
grant select on public.usuarios to anon, authenticated;
grant insert on public.usuarios to authenticated;
grant insert on public.reportes to authenticated;
grant update (nombre, email, nivel, pesca_con_mosca, experiencia_pesca) on public.usuarios to authenticated;
grant execute on function public.submit_spot_report(text, text, double precision, double precision, text, text, int, text, text) to authenticated;
grant execute on function public.submit_report_for_existing_spot(uuid, text, date, time, text, boolean, text, text, text, text, text, text, int) to authenticated;

drop policy if exists "spots lectura publica" on public.spots;
create policy "spots lectura publica"
on public.spots for select
to anon, authenticated
using (true);

drop policy if exists "fichas lectura publica" on public.fichas_tecnicas;
create policy "fichas lectura publica"
on public.fichas_tecnicas for select
to anon, authenticated
using (true);

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

drop policy if exists "usuarios lectura propia" on public.usuarios;
create policy "usuarios lectura propia"
on public.usuarios for select
to authenticated
using (auth.uid() = id);

drop policy if exists "usuarios insert propia" on public.usuarios;
create policy "usuarios insert propia"
on public.usuarios for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "usuarios update propia" on public.usuarios;
create policy "usuarios update propia"
on public.usuarios for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

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
