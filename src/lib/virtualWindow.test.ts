import { describe, it, expect } from 'vitest';
import { virtualWindow } from './virtualWindow';

describe('virtualWindow', () => {
	it('returns an empty window for an empty list', () => {
		expect(virtualWindow(0, 0, 600, 56, 10)).toEqual({
			start: 0,
			end: 0,
			topPad: 0,
			bottomPad: 0
		});
	});

	it('windows the first rows at scroll 0', () => {
		const w = virtualWindow(500, 0, 560, 56, 10);
		expect(w.start).toBe(0);
		// visible = 560/56 + 20 overscan = 30
		expect(w.end).toBe(30);
		expect(w.topPad).toBe(0);
		expect(w.bottomPad).toBe((500 - 30) * 56);
	});

	it('offsets start/end and pads when scrolled', () => {
		const w = virtualWindow(500, 560, 560, 56, 10);
		// floor(560/56) = 10, minus overscan 10 => start 0
		expect(w.start).toBe(0);
		expect(w.end).toBe(30);
	});

	it('moves the window further down the list', () => {
		const w = virtualWindow(500, 2800, 560, 56, 10);
		// floor(2800/56) = 50, minus 10 => 40
		expect(w.start).toBe(40);
		expect(w.end).toBe(70);
		expect(w.topPad).toBe(40 * 56);
		expect(w.bottomPad).toBe((500 - 70) * 56);
	});

	it('clamps to the last window when scrolled past the end', () => {
		const w = virtualWindow(25, 5000, 560, 56, 10);
		expect(w.end).toBe(25);
		expect(w.start).toBe(0);
		expect(w.topPad).toBe(0);
		expect(w.bottomPad).toBe(0);
	});

	it('never uses a zero row height', () => {
		const w = virtualWindow(10, 0, 100, 0, 2);
		expect(w.end).toBeGreaterThan(0);
		expect(w.end).toBeLessThanOrEqual(10);
	});

	it('shows the last rows when a long list is scrolled past the end', () => {
		const w = virtualWindow(500, 50_000, 560, 56, 10);
		expect(w.end).toBe(500);
		expect(w.start).toBe(470);
		expect(w.bottomPad).toBe(0);
	});
});
