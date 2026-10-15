create table if not exists users (
  id serial primary key,
  email text unique not null,
  password_hash text not null,
  match_threshold int not null default 75,
  keywords text[] not null default '{}',
  alert_query text not null default 'from:(linkedin.com OR indeed.com OR naukri.com OR glassdoor.com) newer_than:2d',
  telegram_chat_id text,
  gmail_tokens jsonb,
  created_at timestamptz not null default now()
);

create table if not exists resumes (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  name text not null,
  content text not null,
  is_master boolean not null default false,
  parent_id int references resumes(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  title text not null,
  company text,
  link text,
  description text,
  source text,
  match_score int,
  match_reasons jsonb,
  status text not null default 'new', -- new | review | low | approved | drafted | skipped
  created_at timestamptz not null default now(),
  unique (user_id, link)
);

create table if not exists processed_emails (
  user_id int not null references users(id) on delete cascade,
  message_id text not null,
  primary key (user_id, message_id)
);

create table if not exists applications (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  job_id int references jobs(id) on delete set null,
  resume_id int references resumes(id) on delete set null,
  company text not null,
  title text not null,
  link text,
  stage text not null default 'saved', -- saved | applied | replied | interview | offer | rejected
  notes text,
  gmail_thread_id text,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists drafts (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  job_id int references jobs(id) on delete cascade,
  application_id int references applications(id) on delete cascade,
  to_email text,
  email_subject text,
  email_body text,
  tailored_resume text,
  connection_note text,
  status text not null default 'draft', -- draft | sent
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  application_id int references applications(id) on delete cascade,
  name text,
  email text,
  role text
);

create table if not exists status_history (
  id serial primary key,
  application_id int not null references applications(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  changed_at timestamptz not null default now()
);

create table if not exists reminders (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  application_id int references applications(id) on delete cascade,
  due_at timestamptz not null,
  note text,
  done boolean not null default false
);
