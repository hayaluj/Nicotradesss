-- Run in Supabase SQL editor
-- Reconciles guest purchases when a user signs up with the same email

create or replace function handle_new_user()
returns trigger as $$
begin
  -- Create profile
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- Link any past payments made with this email to this user
  update payments
    set user_id = new.id
    where email = new.email
      and user_id is null;

  -- If they already purchased a course or VIP, upgrade their tier
  update profiles
    set tier = coalesce(
      (select case
        when exists (select 1 from payments where email = new.email and product = 'vip' and status = 'completed') then 'vip'
        when exists (select 1 from payments where email = new.email and product = 'course' and status = 'completed') then 'course'
        else 'free'
      end),
      'free'
    )
    where id = new.id;

  return new;
end;
$$ language plpgsql security definer;
