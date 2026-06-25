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
