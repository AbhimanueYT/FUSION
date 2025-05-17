-- Drop existing table if it exists
drop table if exists public.tasks cascade;

create table public.tasks (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text,
    completed boolean default false,
    priority text check (priority in ('low', 'medium', 'high')) default 'medium',
    created_at timestamp with time zone default now(),
    due_date timestamp with time zone
);

-- Create indexes for better performance
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_created_at_idx on public.tasks(created_at);

-- Enable RLS (Row Level Security)
alter table public.tasks enable row level security;

-- Create policy to allow users to see only their own tasks
drop policy if exists "Users can CRUD their own tasks" on public.tasks;
create policy "Users can CRUD their own tasks"
    on public.tasks
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id); 