export function getShiftDurationMinutes(
	startTime: string,
	endTime: string | null,
	breakMinutes: number,
	now = Date.now(),
): number {
	const elapsed = Math.max(0, (endTime ? new Date(endTime).getTime() : now) - new Date(startTime).getTime());
	return Math.max(0, Math.floor(elapsed / 60_000) - breakMinutes);
}

export function formatDuration(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function formatTimer(startTime: string, now = Date.now()): string {
	const totalSeconds = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}
