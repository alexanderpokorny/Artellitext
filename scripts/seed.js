#!/usr/bin/env node
/**
 * Artellico - Database Seed Script
 * 
 * Erstellt Testdaten für die Entwicklung.
 * 
 * Usage:
 *   npm run db:seed
 *   node scripts/seed.js
 */

import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';
import { promisify } from 'util';

const { Pool } = pg;
const scryptAsync = promisify(crypto.scrypt);

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/Artellitext';

const colors = {
	green: (text) => `\x1b[32m${text}\x1b[0m`,
	red: (text) => `\x1b[31m${text}\x1b[0m`,
	yellow: (text) => `\x1b[33m${text}\x1b[0m`,
	blue: (text) => `\x1b[34m${text}\x1b[0m`,
	bold: (text) => `\x1b[1m${text}\x1b[0m`
};

console.log(colors.bold('\n🌱 Artellico Database Seeding\n'));
console.log('─'.repeat(50));

const pool = new Pool({
	connectionString: DATABASE_URL,
	max: 5
});

// Password hash matching auth.ts format (salt:hash using scrypt)
async function hashPassword(password) {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = await scryptAsync(password, salt, 64);
	return `${salt}:${hash.toString('hex')}`;
}

async function seed() {
	const client = await pool.connect();
	
	try {
		console.log(colors.blue('\n📡 Verbinde mit Datenbank...'));
		
		await client.query('BEGIN');
		
		// ===========================================
		// 1. Test Users
		// ===========================================
		console.log(colors.yellow('\n👤 Erstelle Test-Benutzer...'));
		
		const users = [
			{
				email: 'admin@artellico.local',
				username: 'admin',
				password: 'admin123',
				display_name: 'Administrator',
				role: 'admin'
			},
			{
				email: 'test@artellico.local',
				username: 'testuser',
				password: 'test123',
				display_name: 'Test User',
				role: 'user'
			},
			{
				email: 'alexander@artellico.local',
				username: 'alexander',
				password: 'dev123',
				display_name: 'Alexander',
				role: 'superadmin'
			}
		];
		
		for (const user of users) {
			const passwordHash = await hashPassword(user.password);
			const result = await client.query(`
				INSERT INTO users (email, username, password_hash, display_name, role, email_verified)
				VALUES ($1, $2, $3, $4, $5, true)
				ON CONFLICT (email) DO UPDATE SET
					display_name = EXCLUDED.display_name,
					role = EXCLUDED.role,
					password_hash = EXCLUDED.password_hash
				RETURNING id, username
			`, [user.email, user.username, passwordHash, user.display_name, user.role]);
			
			console.log(`  ✓ ${user.username} (${user.email})`);
		}
		
		// Get user IDs for subsequent inserts
		const adminUser = await client.query(`SELECT id FROM users WHERE username = 'admin'`);
		const testUser = await client.query(`SELECT id FROM users WHERE username = 'testuser'`);
		const adminId = adminUser.rows[0].id;
		const testId = testUser.rows[0].id;
		
		// ===========================================
		// 2. Sample Notes
		// ===========================================
		console.log(colors.yellow('\n📝 Erstelle Beispiel-Notizen...'));
		
		const notes = [
			{
				user_id: testId,
				title: 'Willkommen bei Artellico',
				content: {
					time: Date.now(),
					blocks: [
						{ type: 'header', data: { text: 'Willkommen bei Artellico', level: 1 } },
						{ type: 'paragraph', data: { text: 'Dies ist deine erste Notiz. Artellico hilft dir beim Schreiben und Organisieren deiner Texte.' } }
					]
				},
				status: 'published',
				tags: ['welcome', 'getting-started'],
				language: 'de'
			},
			{
				user_id: testId,
				title: 'Forschungsnotizen: KI im Schreibprozess',
				content: {
					time: Date.now(),
					blocks: [
						{ type: 'header', data: { text: 'KI-gestützte Textanalyse', level: 2 } },
						{ type: 'paragraph', data: { text: 'Moderne KI-Systeme können Texte analysieren und Verbesserungsvorschläge machen.' } },
						{ type: 'list', data: { style: 'unordered', items: ['Grammatikprüfung', 'Stilanalyse', 'Quellenvorschläge'] } }
					]
				},
				status: 'draft',
				tags: ['research', 'ai', 'writing'],
				language: 'de'
			},
			{
				user_id: adminId,
				title: 'System Documentation',
				content: {
					time: Date.now(),
					blocks: [
						{ type: 'header', data: { text: 'Technical Overview', level: 1 } },
						{ type: 'paragraph', data: { text: 'Artellico uses PostgreSQL with pgvector for semantic search capabilities.' } }
					]
				},
				status: 'published',
				tags: ['documentation', 'technical'],
				language: 'en'
			}
		];
		
		for (const note of notes) {
			await client.query(`
				INSERT INTO notes (user_id, title, content, status, tags, language)
				VALUES ($1, $2, $3, $4, $5, $6)
				ON CONFLICT DO NOTHING
			`, [note.user_id, note.title, JSON.stringify(note.content), note.status, note.tags, note.language]);
			
			console.log(`  ✓ "${note.title.substring(0, 40)}..."`);
		}
		
		// ===========================================
		// 3. Sample Literature
		// ===========================================
		console.log(colors.yellow('\n📚 Erstelle Beispiel-Literatur...'));
		
		const literature = [
			{
				user_id: testId,
				title: 'Attention Is All You Need',
				authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.'],
				year: 2017,
				journal: 'Advances in Neural Information Processing Systems',
				doi: '10.48550/arXiv.1706.03762',
				citation_key: 'vaswani2017attention',
				tags: ['ai', 'transformer', 'deep-learning']
			},
			{
				user_id: testId,
				title: 'The Elements of Style',
				authors: ['Strunk, W.', 'White, E.B.'],
				year: 1999,
				publisher: 'Longman',
				isbn: '978-0205309023',
				citation_key: 'strunk1999elements',
				tags: ['writing', 'style', 'reference']
			}
		];
		
		for (const lit of literature) {
			await client.query(`
				INSERT INTO literature (user_id, title, authors, year, journal, publisher, doi, isbn, citation_key, tags)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
				ON CONFLICT DO NOTHING
			`, [lit.user_id, lit.title, lit.authors, lit.year, lit.journal || null, lit.publisher || null, lit.doi || null, lit.isbn || null, lit.citation_key, lit.tags]);
			
			console.log(`  ✓ "${lit.title.substring(0, 40)}..."`);
		}
		
		await client.query('COMMIT');
		
		// ===========================================
		// Summary
		// ===========================================
		console.log(colors.green('\n✅ Seeding abgeschlossen\n'));
		console.log('─'.repeat(50));
		
		console.log(colors.blue('\n📊 Erstellte Testdaten:'));
		
		const counts = await client.query(`
			SELECT 
				(SELECT COUNT(*) FROM users) as users,
				(SELECT COUNT(*) FROM notes) as notes,
				(SELECT COUNT(*) FROM literature) as literature
		`);
		
		console.log(`   • ${counts.rows[0].users} Benutzer`);
		console.log(`   • ${counts.rows[0].notes} Notizen`);
		console.log(`   • ${counts.rows[0].literature} Literatureinträge`);
		
		console.log(colors.yellow('\n🔑 Test-Logins:'));
		console.log('   • admin@artellico.local / admin123');
		console.log('   • test@artellico.local / test123');
		console.log('   • alexander@artellico.local / dev123\n');
		
	} catch (error) {
		await client.query('ROLLBACK');
		console.error(colors.red('\n❌ Seeding fehlgeschlagen:'), error.message);
		process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

seed();
