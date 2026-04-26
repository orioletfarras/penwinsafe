-- Función para generar código de centro aleatorio: PW-XXXX-XXXX
create or replace function generate_center_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text := 'PW-';
  i     int;
begin
  for i in 1..4 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  code := code || '-';
  for i in 1..4 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$;

-- Añadir columna center_code a organizations
alter table organizations
  add column if not exists center_code text unique;

-- Generar código para organizaciones existentes que no lo tengan
do $$
declare
  org record;
  new_code text;
begin
  for org in select id from organizations where center_code is null loop
    loop
      new_code := generate_center_code();
      exit when not exists (select 1 from organizations where center_code = new_code);
    end loop;
    update organizations set center_code = new_code where id = org.id;
  end loop;
end;
$$;

-- Trigger: asignar código automáticamente al crear una organización
create or replace function set_center_code()
returns trigger language plpgsql as $$
declare
  new_code text;
begin
  if new.center_code is null then
    loop
      new_code := generate_center_code();
      exit when not exists (select 1 from organizations where center_code = new_code);
    end loop;
    new.center_code := new_code;
  end if;
  return new;
end;
$$;

drop trigger if exists orgs_set_center_code on organizations;
create trigger orgs_set_center_code
  before insert on organizations
  for each row execute function set_center_code();
