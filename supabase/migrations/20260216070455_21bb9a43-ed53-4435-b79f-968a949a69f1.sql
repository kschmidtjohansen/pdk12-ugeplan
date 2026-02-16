
-- Synkroniser auth.users email med profiles email for Petrie Rasmussen
-- Bruger-ID: 892bcee4-9639-4809-a52f-2a9c5e20e063
-- Fra: vikar-1761309097683-f4a0216d@temp.local
-- Til: petrie.rasmussen@polygongroup.com

UPDATE auth.users 
SET email = 'petrie.rasmussen@polygongroup.com',
    raw_user_meta_data = raw_user_meta_data || '{"name": "Petrie Rasmussen"}'::jsonb,
    updated_at = now()
WHERE id = '892bcee4-9639-4809-a52f-2a9c5e20e063'
  AND email = 'vikar-1761309097683-f4a0216d@temp.local';
