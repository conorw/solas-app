import { DateTime } from 'luxon';

export function capitalizeFirstLetter(str: string | null | undefined): string {
	if (!str) return '';
	return str.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

type PersonNameFields = {
	FirstName?: string | null;
	LastName?: string | null;
	DateOfBirth?: string | null;
	'Acupuncture Data'?: unknown;
};

export function getPersonDisplayName(person: PersonNameFields | null | undefined): string {
	if (!person) return '';
	return `${capitalizeFirstLetter(person.FirstName)} ${
		capitalizeFirstLetter(person.LastName) || ''
	}`.trim();
}

export function getPersonMeta(person: PersonNameFields | null | undefined): string {
	if (!person) return '';
	const birthYear = person.DateOfBirth
		? DateTime.fromISO(person.DateOfBirth).toFormat('yyyy')
		: 'N/A';
	const parts = [`b.${birthYear}`];
	if (person['Acupuncture Data']) {
		parts.push('Acupuncture');
	}
	return parts.join(' · ');
}

/** Full label used where a single string is required (e.g. admin merge confirmations). */
export function getPersonName(person: PersonNameFields | null | undefined): string {
	if (!person) return '';
	const meta = getPersonMeta(person);
	return meta ? `${getPersonDisplayName(person)} (${meta})` : getPersonDisplayName(person);
}
