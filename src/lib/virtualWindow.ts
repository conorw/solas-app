export type VirtualWindow = {
	start: number;
	end: number;
	topPad: number;
	bottomPad: number;
};

/** Compute a padded slice of a fixed-height list for table/list virtualization. */
export function virtualWindow(
	count: number,
	scrollTop: number,
	viewportHeight: number,
	rowHeight: number,
	overscan = 10
): VirtualWindow {
	if (count <= 0) {
		return { start: 0, end: 0, topPad: 0, bottomPad: 0 };
	}

	const row = Math.max(1, rowHeight);
	const visible = Math.ceil(Math.max(0, viewportHeight) / row) + overscan * 2;
	const windowSize = Math.max(1, visible);
	let start = Math.max(0, Math.floor(Math.max(0, scrollTop) / row) - overscan);
	let end = start + windowSize;
	if (end > count) {
		end = count;
		start = Math.max(0, end - windowSize);
	}

	return {
		start,
		end,
		topPad: start * row,
		bottomPad: (count - end) * row
	};
}
