alter table public.usuarios
add column if not exists nombre text;

alter table public.usuarios
add column if not exists email text;

alter table public.usuarios
add column if not exists pesca_con_mosca boolean;

alter table public.usuarios
add column if not exists nivel text default 'principiante';

alter table public.usuarios
add column if not exists nivel_pesca text default 'principiante';

alter table public.usuarios
add column if not exists experiencia_pesca text;

alter table public.usuarios
drop constraint if exists usuarios_nivel_check;

alter table public.usuarios
add constraint usuarios_nivel_check
check (nivel is null or nivel in ('principiante', 'intermedio', 'avanzado'));

alter table public.usuarios
drop constraint if exists usuarios_nivel_pesca_check;

alter table public.usuarios
add constraint usuarios_nivel_pesca_check
check (nivel_pesca is null or nivel_pesca in ('principiante', 'intermedio', 'avanzado'));

alter table public.usuarios
drop constraint if exists usuarios_experiencia_pesca_check;

alter table public.usuarios
add constraint usuarios_experiencia_pesca_check
check (experiencia_pesca is null or experiencia_pesca in ('1-9_meses', '9-18_meses', 'mas_2_anos'));

grant update (nombre, email, nivel, nivel_pesca, pesca_con_mosca, experiencia_pesca)
on public.usuarios
to authenticated;

notify pgrst, 'reload schema';
