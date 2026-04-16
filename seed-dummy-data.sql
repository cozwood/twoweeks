-- ============================================================
-- SEED DUMMY DATA — paste this into Supabase SQL Editor
-- Creates 12 seekers, 4 employers, seeker cards, and intros
-- All passwords: demo1234
-- ============================================================

-- ── 1. Create auth users (triggers handle_new_user → auto-creates profiles) ──

-- SEEKERS
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES
  ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'mike.jensen@demo.test',     crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Mike Jensen"}',     'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'sarah.kowalski@demo.test',  crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Sarah Kowalski"}',  'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'derek.hall@demo.test',      crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Derek Hall"}',      'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'ashley.nguyen@demo.test',   crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Ashley Nguyen"}',   'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'brandon.carter@demo.test',  crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Brandon Carter"}',  'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'tina.martinez@demo.test',   crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Tina Martinez"}',   'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'jason.burke@demo.test',     crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Jason Burke"}',     'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'rachel.simmons@demo.test',  crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Rachel Simmons"}',  'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'kevin.price@demo.test',     crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Kevin Price"}',     'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'lisa.thomas@demo.test',     crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Lisa Thomas"}',     'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'matt.olson@demo.test',      crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Matt Olson"}',      'authenticated', 'authenticated', now(), now()),
  ('a0000001-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'amanda.reeves@demo.test',   crypt('demo1234', gen_salt('bf')), now(), '{"role":"seeker","name":"Amanda Reeves"}',   'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- EMPLOYERS
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES
  ('b0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'hiring@acmemfg.demo.test',        crypt('demo1234', gen_salt('bf')), now(), '{"role":"employer","name":"Dave Krueger","company":"Acme Manufacturing","city":"Des Moines"}',  'authenticated', 'authenticated', now(), now()),
  ('b0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'hr@hawkeyehealth.demo.test',      crypt('demo1234', gen_salt('bf')), now(), '{"role":"employer","name":"Karen Whitfield","company":"Hawkeye Health Systems","city":"Cedar Rapids"}', 'authenticated', 'authenticated', now(), now()),
  ('b0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'jobs@prairielogistics.demo.test',  crypt('demo1234', gen_salt('bf')), now(), '{"role":"employer","name":"Tom Richards","company":"Prairie Logistics","city":"Davenport"}',    'authenticated', 'authenticated', now(), now()),
  ('b0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'recruit@iowafresh.demo.test',     crypt('demo1234', gen_salt('bf')), now(), '{"role":"employer","name":"Jenny Park","company":"Iowa Fresh Foods","city":"Ankeny"}',          'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Also need auth.identities rows for Supabase auth to work
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT id, id, id, json_build_object('sub', id, 'email', email), 'email', now(), now(), now()
FROM auth.users
WHERE id IN (
  'a0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000002','a0000001-0000-0000-0000-000000000003',
  'a0000001-0000-0000-0000-000000000004','a0000001-0000-0000-0000-000000000005','a0000001-0000-0000-0000-000000000006',
  'a0000001-0000-0000-0000-000000000007','a0000001-0000-0000-0000-000000000008','a0000001-0000-0000-0000-000000000009',
  'a0000001-0000-0000-0000-000000000010','a0000001-0000-0000-0000-000000000011','a0000001-0000-0000-0000-000000000012',
  'b0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000003',
  'b0000001-0000-0000-0000-000000000004'
)
ON CONFLICT DO NOTHING;


-- ── 2. Update profiles with phone, city, company, title ──

UPDATE profiles SET name = 'Mike Jensen',     phone = '515-482-3019', city = 'Des Moines',   state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000001';
UPDATE profiles SET name = 'Sarah Kowalski',  phone = '319-551-7284', city = 'Cedar Rapids',  state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000002';
UPDATE profiles SET name = 'Derek Hall',      phone = '515-309-4451', city = 'Ankeny',        state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000003';
UPDATE profiles SET name = 'Ashley Nguyen',   phone = '319-442-8830', city = 'Iowa City',     state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000004';
UPDATE profiles SET name = 'Brandon Carter',  phone = '563-200-6617', city = 'Davenport',     state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000005';
UPDATE profiles SET name = 'Tina Martinez',   phone = '515-773-1142', city = 'Des Moines',    state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000006';
UPDATE profiles SET name = 'Jason Burke',     phone = '319-880-5593', city = 'Waterloo',      state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000007';
UPDATE profiles SET name = 'Rachel Simmons',  phone = '515-615-9948', city = 'Ames',          state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000008';
UPDATE profiles SET name = 'Kevin Price',     phone = '712-334-2206', city = 'Sioux City',    state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000009';
UPDATE profiles SET name = 'Lisa Thomas',     phone = '515-901-4478', city = 'Des Moines',    state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000010';
UPDATE profiles SET name = 'Matt Olson',      phone = '515-227-3365', city = 'Ankeny',        state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000011';
UPDATE profiles SET name = 'Amanda Reeves',   phone = '319-664-8812', city = 'Cedar Rapids',  state = 'IA' WHERE id = 'a0000001-0000-0000-0000-000000000012';

UPDATE profiles SET name = 'Dave Krueger',    company = 'Acme Manufacturing',     title = 'Plant Manager',    city = 'Des Moines',   state = 'IA' WHERE id = 'b0000001-0000-0000-0000-000000000001';
UPDATE profiles SET name = 'Karen Whitfield', company = 'Hawkeye Health Systems',  title = 'HR Director',      city = 'Cedar Rapids', state = 'IA' WHERE id = 'b0000001-0000-0000-0000-000000000002';
UPDATE profiles SET name = 'Tom Richards',    company = 'Prairie Logistics',       title = 'Operations Lead',  city = 'Davenport',    state = 'IA' WHERE id = 'b0000001-0000-0000-0000-000000000003';
UPDATE profiles SET name = 'Jenny Park',      company = 'Iowa Fresh Foods',        title = 'Hiring Manager',   city = 'Ankeny',       state = 'IA' WHERE id = 'b0000001-0000-0000-0000-000000000004';


-- ── 3. Insert seeker cards ──

INSERT INTO seeker_cards (profile_id, headline, job_title, category, years_experience, arrangement, availability, salary_min, salary_max, city, state, certifications, skills, reasons, is_active) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Forklift Operator',  'Forklift Operator',  'Skilled Trades',    '5–10 yrs',  'on-site',  '2 weeks',      40000, 50000, 'Des Moines',   'IA', '{"Forklift","OSHA 10"}',          '{"Heavy Lifting","Inventory","Forklift"}',          '{"Underpaid","Bad mgmt"}',        true),
  ('a0000001-0000-0000-0000-000000000002', 'CNA',               'CNA',               'Healthcare',        '2–5 yrs',   'on-site',  'immediately',  30000, 40000, 'Cedar Rapids',  'IA', '{"CNA","CPR/First Aid"}',         '{"Patient Care","Data Entry"}',                     '{"No growth","Hours"}',           true),
  ('a0000001-0000-0000-0000-000000000003', 'Welder',            'Welder',            'Skilled Trades',    '10–15 yrs',  'on-site',  '1 month',      50000, 60000, 'Ankeny',        'IA', '{"OSHA 10"}',                     '{"Welding","Heavy Lifting"}',                       '{"Commute"}',                     true),
  ('a0000001-0000-0000-0000-000000000004', 'Admin Assistant',   'Admin Assistant',   'Operations',        '2–5 yrs',   'hybrid',   '2 weeks',      30000, 40000, 'Iowa City',     'IA', '{}',                              '{"Excel","Data Entry","Customer Service"}',         '{"Bad culture","Underpaid"}',     true),
  ('a0000001-0000-0000-0000-000000000005', 'CDL Driver',        'CDL Driver',        'Skilled Trades',    '5–10 yrs',  'on-site',  'immediately',  50000, 60000, 'Davenport',     'IA', '{"CDL"}',                         '{"Driving","Heavy Lifting"}',                       '{"Underpaid"}',                   true),
  ('a0000001-0000-0000-0000-000000000006', 'Cashier',           'Cashier',           'Sales & Marketing', '0–2 yrs',   'flexible', 'immediately',  20000, 30000, 'Des Moines',    'IA', '{"ServSafe"}',                    '{"Customer Service","Cash Handling"}',              '{"Hours","Bad mgmt"}',            true),
  ('a0000001-0000-0000-0000-000000000007', 'Electrician',       'Electrician',       'Skilled Trades',    '10–15 yrs',  'on-site',  'flexible',     60000, 70000, 'Waterloo',      'IA', '{"OSHA 10"}',                     '{"Welding","Heavy Lifting","Forklift"}',            '{"No growth"}',                   true),
  ('a0000001-0000-0000-0000-000000000008', 'Bookkeeper',        'Bookkeeper',        'Finance',           '5–10 yrs',  'remote',   '2 weeks',      40000, 50000, 'Ames',          'IA', '{}',                              '{"Excel","Data Entry","Inventory"}',                '{"Bad culture"}',                 true),
  ('a0000001-0000-0000-0000-000000000009', 'Machine Operator',  'Machine Operator',  'Skilled Trades',    '2–5 yrs',   'on-site',  'immediately',  30000, 40000, 'Sioux City',    'IA', '{"Forklift","OSHA 10"}',          '{"Heavy Lifting","Forklift","Inventory"}',          '{"Underpaid","Commute"}',         true),
  ('a0000001-0000-0000-0000-000000000010', 'Server',            'Server',            'Sales & Marketing', '0–2 yrs',   'flexible', 'immediately',  20000, 30000, 'Des Moines',    'IA', '{"ServSafe","CPR/First Aid"}',     '{"Customer Service","Cash Handling"}',              '{"Hours","Underpaid"}',           true),
  ('a0000001-0000-0000-0000-000000000011', 'HVAC Tech',         'HVAC Tech',         'Skilled Trades',    '15+ yrs',   'on-site',  '1 month',      70000, 80000, 'Ankeny',        'IA', '{"OSHA 10"}',                     '{"Welding","Heavy Lifting"}',                       '{"Bad mgmt"}',                   true),
  ('a0000001-0000-0000-0000-000000000012', 'Retail Associate',  'Retail Associate',  'Sales & Marketing', '2–5 yrs',   'on-site',  '2 weeks',      20000, 30000, 'Cedar Rapids',  'IA', '{}',                              '{"Customer Service","Cash Handling","Inventory"}',  '{"No growth","Bad culture"}',     true)
ON CONFLICT DO NOTHING;


-- ── 4. Insert intros (employers showing interest — no messages) ──

-- Acme Manufacturing → 3 seekers
INSERT INTO intros (employer_id, seeker_id, status) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'pending'),
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'pending'),
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000009', 'pending');

-- Hawkeye Health → 2 seekers
INSERT INTO intros (employer_id, seeker_id, status) VALUES
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'pending'),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'pending');

-- Prairie Logistics → 2 seekers
INSERT INTO intros (employer_id, seeker_id, status) VALUES
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000005', 'pending'),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'pending');

-- Iowa Fresh Foods → 2 seekers
INSERT INTO intros (employer_id, seeker_id, status) VALUES
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'pending'),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000010', 'pending');
