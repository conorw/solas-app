/** Staff-app analytics. Never send attendee or staff PII. */

export const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

const DATE_QUERY_KEYS = new Set(['date', 'fromDate', 'toDate']);

export type AnalyticsExportType = 'people_csv' | 'attendance_csv' | 'pdf';
export type AnalyticsFlag = 'Is Current' | 'Multi';

export type AnalyticsProps = {
	serviceName?: string;
	isMulti?: boolean;
	count?: number;
	exportType?: AnalyticsExportType;
	queryLength?: number;
	isAdmin?: boolean;
	flag?: AnalyticsFlag;
};

const EXPORT_TYPES = new Set<AnalyticsExportType>(['people_csv', 'attendance_csv', 'pdf']);
const FLAGS = new Set<AnalyticsFlag>(['Is Current', 'Multi']);

type PostHogClient = {
	capture: (event: string, properties?: Record<string, unknown>) => void;
	identify: (id: string, properties?: Record<string, unknown>) => void;
	reset: () => void;
};

let client: PostHogClient | null = null;
let started = false;
let pendingPageview: string | URL | null = null;
let lastPageviewPath = '';

/** Redact person ids and drop name-search `q`. Keep operational date params. */
export function sanitizeUrl(input: string | URL): string {
	const raw = typeof input === 'string' ? input : input.href;
	let url: URL;
	try {
		url = new URL(raw, 'http://local.invalid');
	} catch {
		return '/';
	}

	let pathname = url.pathname;
	pathname = pathname.replace(/^\/people\/\d+$/, '/people/:id');
	pathname = pathname.replace(/^\/admin\/stats\/people\/\d+$/, '/admin/stats/people/:id');

	const kept = new URLSearchParams();
	for (const [key, value] of url.searchParams) {
		if (DATE_QUERY_KEYS.has(key)) kept.set(key, value);
	}
	const search = kept.toString();
	return search ? `${pathname}?${search}` : pathname;
}

export function pickAnalyticsProps(
	props?: AnalyticsProps | Record<string, unknown> | null
): AnalyticsProps {
	if (!props) return {};
	const out: AnalyticsProps = {};
	if (typeof props.serviceName === 'string') out.serviceName = props.serviceName;
	if (typeof props.isMulti === 'boolean') out.isMulti = props.isMulti;
	if (typeof props.count === 'number' && Number.isFinite(props.count)) out.count = props.count;
	if (
		typeof props.exportType === 'string' &&
		EXPORT_TYPES.has(props.exportType as AnalyticsExportType)
	) {
		out.exportType = props.exportType as AnalyticsExportType;
	}
	if (typeof props.queryLength === 'number' && Number.isFinite(props.queryLength)) {
		out.queryLength = props.queryLength;
	}
	if (typeof props.isAdmin === 'boolean') out.isAdmin = props.isAdmin;
	if (typeof props.flag === 'string' && FLAGS.has(props.flag as AnalyticsFlag)) {
		out.flag = props.flag as AnalyticsFlag;
	}
	return out;
}

function sanitizeCapturedProperties<T extends Record<string, unknown>>(properties: T): T {
	for (const key of [
		'$current_url',
		'$pathname',
		'$referrer',
		'$initial_referrer',
		'$session_entry_referrer',
		'$session_entry_url',
		'$initial_current_url'
	]) {
		if (typeof properties[key] === 'string') {
			(properties as Record<string, unknown>)[key] = sanitizeUrl(properties[key] as string);
		}
	}
	return properties;
}

export async function initAnalytics(): Promise<void> {
	if (typeof window === 'undefined' || started) return;

	let key = '';
	let host = DEFAULT_POSTHOG_HOST;
	try {
		const env = await import('$app/env/public');
		key = String(env.PUBLIC_POSTHOG_KEY ?? '').trim();
		const configured = String(env.PUBLIC_POSTHOG_HOST ?? '').trim();
		if (configured) host = configured;
	} catch {
		started = true;
		pendingPageview = null;
		return;
	}

	if (!key) {
		started = true;
		pendingPageview = null;
		return;
	}

	const { default: posthog } = await import('posthog-js');
	posthog.init(key, {
		api_host: host,
		capture_pageview: false,
		capture_pageleave: false,
		autocapture: false,
		disable_session_recording: true,
		capture_exceptions: false,
		person_profiles: 'identified_only',
		sanitize_properties: (properties) => sanitizeCapturedProperties(properties)
	});
	client = posthog;
	started = true;

	if (pendingPageview) {
		const next = pendingPageview;
		pendingPageview = null;
		capturePageview(next);
	}
}

export function identifyStaff(userId: string, isAdmin: boolean): void {
	if (!client || !userId) return;
	client.identify(userId, { is_admin: isAdmin });
}

export function resetAnalytics(): void {
	client?.reset();
	lastPageviewPath = '';
}

export function capture(event: string, props?: AnalyticsProps | Record<string, unknown>): void {
	client?.capture(event, pickAnalyticsProps(props));
}

export function capturePageview(input: string | URL): void {
	if (!started) {
		pendingPageview = input;
		return;
	}
	if (!client) return;
	const path = sanitizeUrl(input);
	if (path === lastPageviewPath) return;
	lastPageviewPath = path;
	client.capture('$pageview', { $current_url: path, $pathname: path });
}

/** Test helper: swap the PostHog client. */
export function __setAnalyticsClientForTests(next: PostHogClient | null, isStarted = true): void {
	client = next;
	started = isStarted;
	pendingPageview = null;
	lastPageviewPath = '';
}
