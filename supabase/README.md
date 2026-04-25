# Supabase — Setup Ayumi Nails

## Como rodar as migrations

1. Acesse o Supabase Dashboard → SQL Editor
2. Execute os arquivos na ordem:
   - `001_schema.sql` — cria todas as tabelas
   - `002_rls.sql` — habilita RLS e políticas
   - `003_seed.sql` — dados iniciais (horários + procedimentos)

## Tabelas

| Tabela | Descrição |
|--------|-----------|
| `procedures` | Serviços oferecidos (gel, nail art, etc) |
| `clients` | Clientes identificados por telefone |
| `bookings` | Agendamentos |
| `working_hours` | Horário de funcionamento por dia da semana |
| `blocks` | Bloqueios / eventos importados do Google Calendar |
| `transactions` | Registros financeiros |
| `messages` | Log de mensagens WhatsApp (Luna) |

## Regra crítica
Constraint no banco garante que agendamentos só podem ser criados entre 08:00–18:00 (horário de Brasília).
