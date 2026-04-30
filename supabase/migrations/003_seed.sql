-- ============================================================
-- Seed - Dados iniciais Ayumi Nails
-- ============================================================

-- Horarios de funcionamento (Seg-Sex 08-19, Sab 08-16, Dom fechado)
insert into public.working_hours (day_of_week, start_time, end_time, active) values
  (0, '08:00', '19:00', false),  -- Domingo: fechado
  (1, '08:00', '19:00', true),   -- Segunda
  (2, '08:00', '19:00', true),   -- Terca
  (3, '08:00', '19:00', true),   -- Quarta
  (4, '08:00', '19:00', true),   -- Quinta
  (5, '08:00', '19:00', true),   -- Sexta
  (6, '08:00', '16:00', true);   -- Sabado

-- Procedimentos iniciais
insert into public.procedures (name, duration, price, description, active) values
  ('Manutencao de Unhas em Gel',      60,  80.00, 'Manutencao completa com preenchimento e acabamento', true),
  ('Alongamento de Unhas em Gel',     90, 150.00, 'Aplicacao e modelagem com gel UV', true),
  ('Nail Art Simples',                30,  40.00, 'Arte simples em 1-2 unhas', true),
  ('Nail Art Completa',               60,  80.00, 'Arte detalhada em todas as unhas', true),
  ('Esmaltacao em Gel (Cola Facil)',  45,  60.00, 'Esmaltacao em gel com secagem UV', true),
  ('Remocao de Gel',                  30,  40.00, 'Remocao segura com acetona e lima', true),
  ('Spa das Maos',                    45,  70.00, 'Hidratacao profunda, esfoliacao e massagem', true);
