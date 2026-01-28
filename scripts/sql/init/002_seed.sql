-- ===========================================
-- Artellitext - Seed Data
-- ===========================================
-- 
-- Optionale Testdaten für lokale Entwicklung
-- 
-- Ausführung:
--   psql -U postgres -d Artellitext -f 002_seed.sql

-- Demo User (Passwort: demo123)
-- Hinweis: In Produktion NIEMALS solche Seeds verwenden
INSERT INTO users (
    id,
    email,
    username,
    password_hash,
    display_name,
    role,
    subscription_tier,
    language,
    email_verified,
    settings
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@artellitext.app',
    'demo',
    -- scrypt hash for 'demo123' (salt:hash format)
    'bf6f4463f0a10233d541fb3e9eb011ab:f946034cede66c436fe1b29f5f0f1cda1f7d8fe90c9223fbfb26846de57a5a7c908a35afad2b5619eae943513c8db12fd2235172905be7738171f2bee3203c50',
    'Demo User',
    'user',
    'pro',
    'de',
    TRUE,
    '{"onboarding_completed": true, "editor_mode": "rich"}'::JSONB
) ON CONFLICT (email) DO NOTHING;

-- Admin User (Passwort: admin123)
INSERT INTO users (
    id,
    email,
    username,
    password_hash,
    display_name,
    role,
    subscription_tier,
    language,
    email_verified,
    settings
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'admin@artellitext.app',
    'admin',
    -- scrypt hash for 'admin123' (salt:hash format)
    'dee1e6053f56e32fc1cc1fb31aa4b69f:54f504856a3abcae95134fe186eb47ef6b055bfe48d10bf63f1040f90152909d50599f5d2174deb07ed3f59b360ced807b6b51254073fd77541a21ae51aabf79',
    'Administrator',
    'admin',
    'lifetime',
    'de',
    TRUE,
    '{"onboarding_completed": true}'::JSONB
) ON CONFLICT (email) DO NOTHING;

-- Demo Notes
INSERT INTO notes (id, user_id, title, content, status, tags, language, word_count) VALUES
(
    '00000000-1000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Willkommen bei Artellitext',
    '{
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Willkommen bei Artellitext"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Artellitext ist dein intelligenter Schreibassistent mit "},
                    {"type": "text", "marks": [{"type": "bold"}], "text": "Offline-First"},
                    {"type": "text", "text": " Architektur und "},
                    {"type": "text", "marks": [{"type": "bold"}], "text": "KI-Unterstützung"},
                    {"type": "text", "text": "."}
                ]
            },
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Features"}]
            },
            {
                "type": "bulletList",
                "content": [
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Block-basierter Editor"}]}]},
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "PDF & EPUB Reader"}]}]},
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Literaturverwaltung"}]}]},
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "KI-gestützte Textanalyse"}]}]}
                ]
            }
        ]
    }'::JSONB,
    'published',
    ARRAY['welcome', 'tutorial', 'getting-started'],
    'de',
    42
),
(
    '00000000-1000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Meine erste wissenschaftliche Notiz',
    '{
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Forschungsnotizen"}]
            },
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "Diese Notiz enthält meine ersten Gedanken zum Thema..."}]
            }
        ]
    }'::JSONB,
    'draft',
    ARRAY['research', 'draft'],
    'de',
    12
)
ON CONFLICT (id) DO NOTHING;

-- Record seed migration
INSERT INTO _migrations (name) VALUES ('002_seed')
ON CONFLICT (name) DO NOTHING;

SELECT 'Seed data inserted' AS status;
