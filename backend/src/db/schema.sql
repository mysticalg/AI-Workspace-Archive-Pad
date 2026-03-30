create table if not exists users (
  id text primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id text primary key,
  owner_id text not null references users(id),
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists archive_records (
  id text primary key,
  project_id text references projects(id),
  payload jsonb not null,
  encrypted_payload bytea,
  created_at timestamptz not null default now()
);

