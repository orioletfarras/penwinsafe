do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'admin_update_org' and tablename = 'organizations') then
    execute 'create policy "admin_update_org" on organizations for update using (id = my_org_id()) with check (id = my_org_id())';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_update_groups' and tablename = 'groups') then
    execute 'create policy "admin_update_groups" on groups for update using (org_id = my_org_id()) with check (org_id = my_org_id())';
  end if;
end $$;
