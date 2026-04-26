-- Código corto y fácil de recordar: 6 caracteres, solo letras/números claros
-- Formato: XXX-XXX (ej. BK7-M3P)
create or replace function generate_center_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ3456789';
  code  text := '';
  i     int;
begin
  for i in 1..3 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  code := code || '-';
  for i in 1..3 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$;

-- Regenerar los códigos existentes con el nuevo formato más corto
do $$
declare
  org record;
  new_code text;
begin
  for org in select id from organizations loop
    loop
      new_code := generate_center_code();
      exit when not exists (select 1 from organizations where center_code = new_code and id != org.id);
    end loop;
    update organizations set center_code = new_code where id = org.id;
  end loop;
end;
$$;
