/**
 * Seed solas_dev with TEST_ADMIN / TEST_USER auth accounts, profiles,
 * the anonymous bulk-attendance person, plus sample people / services /
 * attendance so /admin/stats screens have data for the current year.
 *
 * Usage: npm run seed:dev
 * Requires PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * TEST_ADMIN_EMAIL/PASSWORD, TEST_USER_EMAIL/PASSWORD (from .env locally or env in CI).
 *
 * Re-running is safe: previous rows tagged with FirstName/Name prefix
 * "Seed Stats" are replaced.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SEED_PREFIX = 'Seed Stats';

function loadEnv() {
	const path = resolve(process.cwd(), '.env');
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
		const t = line.trim();
		if (!t || t.startsWith('#') || !t.includes('=')) continue;
		const i = t.indexOf('=');
		const key = t.slice(0, i).trim();
		let value = t.slice(i + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (process.env[key] === undefined) process.env[key] = value;
	}
}

loadEnv();

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url?.includes('dioxdgkkxprgvaxarxcj')) {
	console.error('Refusing to seed: PUBLIC_SUPABASE_URL is not solas_dev');
	process.exit(1);
}
if (!key) {
	console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPass = process.env.TEST_ADMIN_PASSWORD;
const userEmail = process.env.TEST_USER_EMAIL;
const userPass = process.env.TEST_USER_PASSWORD;
const anonId = Number(process.env.TEST_ANONYMOUS_PERSON_ID || 2830);

const sb = createClient(url, key, {
	auth: { autoRefreshToken: false, persistSession: false }
});

async function ensureUser(email, password, isAdmin) {
	const list = await sb.auth.admin.listUsers({ perPage: 1000 });
	if (list.error) throw list.error;
	let user = list.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
	if (!user) {
		const created = await sb.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});
		if (created.error) throw created.error;
		user = created.data.user;
		console.log('created user', email);
	} else {
		const upd = await sb.auth.admin.updateUserById(user.id, {
			password,
			email_confirm: true
		});
		if (upd.error) throw upd.error;
		console.log('updated user', email);
	}
	const { error } = await sb.from('profiles').upsert({
		id: user.id,
		full_name: email,
		isAdmin: isAdmin ? 'true' : null
	});
	if (error) throw error;
	console.log('profile ok', email, 'isAdmin=', isAdmin);
}

async function ensureAnonymousPerson() {
	const { data: existing, error: lookupErr } = await sb
		.from('people')
		.select('"Auto ID"')
		.eq('Auto ID', anonId)
		.maybeSingle();
	if (lookupErr) throw lookupErr;

	if (!existing) {
		const { error } = await sb.from('people').insert({
			'Auto ID': anonId,
			FirstName: 'Anonymous',
			LastName: 'Attendee',
			DateOfBirth: '1970-01-01'
		});
		if (error) throw error;
		console.log('created anonymous person', anonId);
	} else {
		console.log('anonymous person exists', anonId);
	}
}

/** Remove prior stats seed so re-runs stay idempotent. */
async function clearStatsSeed() {
	const { data: seedPeople, error: pe } = await sb
		.from('people')
		.select('"Auto ID"')
		.ilike('FirstName', `${SEED_PREFIX}%`);
	if (pe) throw pe;
	const personIds = (seedPeople || []).map((p) => p['Auto ID']);

	if (personIds.length) {
		await sb.from('attendance').delete().in('Person Id', personIds);
		await sb.from('people').delete().in('Auto ID', personIds);
	}

	await sb.from('attendance').delete().ilike('ServiceName', `${SEED_PREFIX}%`);
	await sb.from('service').delete().ilike('Name', `${SEED_PREFIX}%`);

	// Drop anonymous multi rows from a previous seed (keep the person).
	await sb
		.from('attendance')
		.delete()
		.eq('Person Id', anonId)
		.ilike('ServiceName', `${SEED_PREFIX}%`);

	console.log('cleared previous', SEED_PREFIX, 'rows');
}

async function seedStatsData() {
	const year = new Date().getFullYear();

	const serviceDefs = [
		{ Name: `${SEED_PREFIX} Drop-in`, 'Is Current': true, Multi: false },
		{ Name: `${SEED_PREFIX} Yoga`, 'Is Current': true, Multi: false },
		{ Name: `${SEED_PREFIX} Art Group`, 'Is Current': true, Multi: false },
		{ Name: `${SEED_PREFIX} Bulk Session`, 'Is Current': true, Multi: true },
		{ Name: `${SEED_PREFIX} Legacy Club`, 'Is Current': false, Multi: false }
	];

	const { data: services, error: svcErr } = await sb
		.from('service')
		.insert(serviceDefs)
		.select('"Auto ID", Name, Multi');
	if (svcErr) throw svcErr;
	console.log('services', services.map((s) => s.Name).join(', '));

	const personDefs = [
		{
			FirstName: `${SEED_PREFIX} Alice`,
			LastName: 'Murphy',
			DateOfBirth: '1988-04-12',
			Email: 'seed-alice@example.com',
			Phone: '0861000001',
			Gender: 'Female',
			Town: 'Galway'
		},
		{
			FirstName: `${SEED_PREFIX} Brian`,
			LastName: 'Kelly',
			DateOfBirth: '1975-09-03',
			Email: 'seed-brian@example.com',
			Phone: '0861000002',
			Gender: 'Male',
			Town: 'Galway'
		},
		{
			FirstName: `${SEED_PREFIX} Ciara`,
			LastName: 'OBrien',
			DateOfBirth: '1992-01-22',
			Email: 'seed-ciara@example.com',
			Phone: '0861000003',
			Gender: 'Female',
			Town: 'Athenry'
		},
		{
			FirstName: `${SEED_PREFIX} David`,
			LastName: 'Walsh',
			DateOfBirth: '1968-11-30',
			Email: 'seed-david@example.com',
			Phone: '0861000004',
			Gender: 'Male',
			Town: 'Oranmore'
		},
		{
			FirstName: `${SEED_PREFIX} Eimear`,
			LastName: 'Byrne',
			DateOfBirth: '2001-06-18',
			Email: 'seed-eimear@example.com',
			Phone: '0861000005',
			Gender: 'Female',
			Town: 'Galway'
		},
		{
			FirstName: `${SEED_PREFIX} Fionn`,
			LastName: 'Ryan',
			DateOfBirth: '1983-02-08',
			Email: null,
			Phone: '0861000006',
			Gender: 'Male',
			Town: 'Salthill'
		}
	];

	const { data: people, error: peopleErr } = await sb
		.from('people')
		.insert(personDefs)
		.select('"Auto ID", FirstName, LastName, Email');
	if (peopleErr) throw peopleErr;
	console.log('people', people.length);

	const byFirst = Object.fromEntries(people.map((p) => [p.FirstName, p]));
	const svc = Object.fromEntries(services.map((s) => [s.Name, s]));

	const dropIn = svc[`${SEED_PREFIX} Drop-in`].Name;
	const yoga = svc[`${SEED_PREFIX} Yoga`].Name;
	const art = svc[`${SEED_PREFIX} Art Group`].Name;
	const bulk = svc[`${SEED_PREFIX} Bulk Session`].Name;
	const legacy = svc[`${SEED_PREFIX} Legacy Club`].Name;

	const named = (first) => {
		const p = byFirst[first];
		return {
			id: p['Auto ID'],
			name: `${p.FirstName} ${p.LastName}`
		};
	};

	const alice = named(`${SEED_PREFIX} Alice`);
	const brian = named(`${SEED_PREFIX} Brian`);
	const ciara = named(`${SEED_PREFIX} Ciara`);
	const david = named(`${SEED_PREFIX} David`);
	const eimear = named(`${SEED_PREFIX} Eimear`);
	const fionn = named(`${SEED_PREFIX} Fionn`);

	/** @type {Array<Record<string, unknown>>} */
	const attendance = [];

	const add = (person, serviceName, date, extra = {}) => {
		attendance.push({
			'Person Id': person.id,
			'Person Name': person.name,
			ServiceName: serviceName,
			Date: date,
			...extra
		});
	};

	// Spread across months for the bar chart / month grouping.
	const months = [1, 2, 3, 4, 5, 6, 7, 8];
	for (const m of months) {
		const d = `${year}-${String(m).padStart(2, '0')}-10`;
		add(alice, dropIn, d);
		add(brian, dropIn, d);
		if (m % 2 === 0) add(ciara, yoga, d);
		if (m % 3 === 0) add(david, art, `${year}-${String(m).padStart(2, '0')}-18`);
		add(eimear, yoga, `${year}-${String(m).padStart(2, '0')}-22`);
	}

	// Extra visits so Drop-in is the popular service and Alice tops unique activity.
	for (const day of [5, 12, 19, 26]) {
		add(alice, dropIn, `${year}-03-${String(day).padStart(2, '0')}`);
		add(fionn, dropIn, `${year}-03-${String(day).padStart(2, '0')}`);
	}
	add(alice, art, `${year}-04-02`);
	add(alice, yoga, `${year}-04-09`);
	add(brian, art, `${year}-05-14`);
	add(ciara, dropIn, `${year}-06-01`);
	add(david, dropIn, `${year}-07-07`);
	add(eimear, dropIn, `${year}-08-11`);
	add(fionn, yoga, `${year}-08-15`);

	// Inactive service still shows in historical range.
	add(brian, legacy, `${year}-01-20`);

	// Multi / bulk attendance against anonymous person.
	add(
		{ id: anonId, name: 'Anonymous Attendee' },
		bulk,
		`${year}-02-14`,
		{ Multi: true, TotalAttendees: 8 }
	);
	add(
		{ id: anonId, name: 'Anonymous Attendee' },
		bulk,
		`${year}-05-21`,
		{ Multi: true, TotalAttendees: 12 }
	);
	add(
		{ id: anonId, name: 'Anonymous Attendee' },
		bulk,
		`${year}-08-04`,
		{ Multi: true, TotalAttendees: 5 }
	);

	const { data: attRows, error: attErr } = await sb
		.from('attendance')
		.insert(attendance)
		.select('"Auto ID"');
	if (attErr) throw attErr;
	console.log('attendance rows', attRows.length);

	return { people, services, attendanceCount: attRows.length, year };
}

await ensureUser(adminEmail, adminPass, true);
await ensureUser(userEmail, userPass, false);
await ensureAnonymousPerson();
await clearStatsSeed();
const result = await seedStatsData();

console.log('seed ok');
console.log(
	`stats data for ${result.year}: ${result.people.length} people, ${result.services.length} services, ${result.attendanceCount} attendance`
);
console.log('Open /admin/stats (default range is start–end of current year).');
console.log(
	`Person drill-down example: /admin/stats/people/${result.people[0]['Auto ID']}`
);
console.log(
	`Service drill-down example: /admin/stats/services/${encodeURIComponent(result.services[0].Name)}`
);
