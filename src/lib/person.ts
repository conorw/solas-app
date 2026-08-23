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

export function getPersonName(person: PersonNameFields | null | undefined): string {
	if (!person) return '';
	const birthYear = person.DateOfBirth
		? DateTime.fromISO(person.DateOfBirth).toFormat('yyyy')
		: 'N/A';
	return `${capitalizeFirstLetter(person.FirstName)} ${
		capitalizeFirstLetter(person.LastName) || ''
	} (b.${birthYear}) (Acupuncture:${person['Acupuncture Data'] || false})`;
}
