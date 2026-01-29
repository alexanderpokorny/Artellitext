/**
 * Artellico - Wissen (Knowledge) Page Server Load
 * 
 * All notes with pagination, filtering and sorting.
 */

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { query } from '$lib/server/db';
import type { SessionUser } from '$lib/types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const parentData = await parent();
	const user = parentData.user as SessionUser | null;
	
	// If not logged in, redirect to auth
	if (!user) {
		throw redirect(302, '/auth');
	}
	
	// Pagination params
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '24');
	const offset = (page - 1) * limit;
	
	// Sorting params
	const sortBy = url.searchParams.get('sort') || 'updated_at';
	const sortOrder = url.searchParams.get('order') || 'desc';
	
	// Validate sort column
	const validSortColumns = ['updated_at', 'created_at', 'title', 'word_count'];
	const safeSort = validSortColumns.includes(sortBy) ? sortBy : 'updated_at';
	const safeOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
	
	try {
		// Fetch notes with pagination
		const notesResult = await query(
			`SELECT id, title, content, tags, word_count, updated_at, created_at
			 FROM notes 
			 WHERE user_id = $1 
			 ORDER BY ${safeSort} ${safeOrder}
			 LIMIT $2 OFFSET $3`,
			[user.id, limit, offset]
		);
		
		// Get total count
		const countResult = await query(
			'SELECT COUNT(*) FROM notes WHERE user_id = $1',
			[user.id]
		);
		const totalCount = parseInt(countResult.rows[0]?.count || '0');
		
		return {
			notes: notesResult.rows,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages: Math.ceil(totalCount / limit),
				hasMore: offset + notesResult.rows.length < totalCount,
			},
			sort: {
				by: safeSort,
				order: safeOrder.toLowerCase(),
			},
		};
	} catch (err) {
		console.error('Wissen load error:', err);
		return {
			notes: [],
			pagination: {
				page: 1,
				limit,
				totalCount: 0,
				totalPages: 0,
				hasMore: false,
			},
			sort: {
				by: 'updated_at',
				order: 'desc',
			},
		};
	}
};
