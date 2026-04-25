-- ============================================================
-- Seed — Dados iniciais Ayumi Nails
-- ============================================================

-- Horários de funcionamento (Seg-Sex 08-18, Sab 08-16, Dom fechado)
insert into public.working_hours (day_of_week, start_time, end_time, active) values
  (0, '08:00', '18:00', false),  -- Domingo: fechado
  (1, '08:00', '18:00', true),   -- Segunda
  (2, '08:00', '18:00', true),   -- Terça
  (3, '08:00', '18:00', true),   -- Quarta
  (4, '08:00', '18:00', true),   -- Quinta
  (5, '08:00', '18:00', true),   -- Sexta
  (6, '08:00', '16:00', true);   -- Sábado (fecha mais cedo)

-- Procedimentos iniciais
insert into public.procedures (name, duration, price, description, active) values
  ('Manutenção de Unhas em Gel',     60,  80.00, 'Manutenção completa com preenchimento e acabamento', true),
  ('Alongamento de Unhas em Gel',    90, 150.00, 'Aplicação e modelagem com gel UV', true),
  ('Nail Art Simples',               30,  40.00, 'Arte simples em 1-2 unhas', true),
  ('Nail Art Completa',              60,  80.00, 'Arte detalhada em todas as unhas', true),
  ('Esmaltação em Gel (Cola Fácil)', 45,  60.00, 'Esmaltação em gel com secagem UV', true),
  ('Remoção de Gel',                 30,  40.00, 'Remoção segura com acetona e lima', true),
  ('Spa das Mãos',                   45,  70.00, 'Hidratação profunda, esfoliação e massagem', true);
