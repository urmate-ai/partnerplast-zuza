-- Skrypt SQL do weryfikacji załadowanych integracji
-- Uruchom w psql lub przez Prisma Studio

SELECT 
  id,
  name,
  description,
  icon,
  category,
  "isActive",
  config,
  "createdAt",
  "updatedAt"
FROM integrations
ORDER BY name;

-- Powinno zwrócić 2 rekordy:
-- 1. Gmail (isActive: true)
-- 2. Google Calendar (isActive: true)
