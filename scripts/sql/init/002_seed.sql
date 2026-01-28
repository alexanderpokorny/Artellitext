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
    -- bcrypt hash for 'demo123'
    '$2a$10$rQEY8t9xqO5VXOvCYxYtZuYHYHdQlZGz5P4pL1zV5OqW5UQnF3K.m',
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
    -- bcrypt hash for 'admin123'
    '$2a$10$HQvGBQJh1xJz5MwZl3pYseD5X8gVHb1bLwQd1OE5sKiZ8OqW5UQnF3',
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
