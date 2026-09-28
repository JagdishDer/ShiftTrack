import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateShiftInput, Shift } from '../types/shift';
import type { LoginResponse } from '../types/auth';
import { formatLocalDate, getCurrentWeekStart, localDateTimeToIso } from '../utils/dateUtils';

const STORAGE_KEY = '@shifttrack/mock-shifts-v1';
const TEST_EMAIL = 'staff@shifttrack.test';
const TEST_PASSWORD = 'Password123';

let mockApiErrorEnabled = false;

function pause(milliseconds = 250): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function assertApiAvailable(): void {
	if (mockApiErrorEnabled) throw new Error('The mock service is unavailable. Turn off the demo error and retry.');
}

function makeSeedShifts(): Shift[] {
	const monday = new Date(`${getCurrentWeekStart()}T12:00:00`);
	const shifts = [
		{ day: 0, start: '09:00', end: '17:00', breakMinutes: 30 },
		{ day: 2, start: '11:00', end: '19:00', breakMinutes: 30 },
		{ day: 4, start: '10:00', end: '16:00', breakMinutes: 15 },
	];

	return shifts.map((item, index) => {
		const date = new Date(monday);
		date.setDate(date.getDate() + item.day);
		const dateString = formatLocalDate(date);
		return {
			id: `sample-${index + 1}`,
			date: dateString,
			startTime: localDateTimeToIso(dateString, item.start),
			endTime: localDateTimeToIso(dateString, item.end),
			breakMinutes: item.breakMinutes,
		};
	});
}

async function readShifts(): Promise<Shift[]> {
	const stored = await AsyncStorage.getItem(STORAGE_KEY);
	if (stored) return JSON.parse(stored) as Shift[];

	const initial = makeSeedShifts();
	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
	return initial;
}

async function writeShifts(shifts: Shift[]): Promise<void> {
	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
}

export function setMockApiErrorEnabled(enabled: boolean): void {
	mockApiErrorEnabled = enabled;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
	await pause();
	if (email.trim().toLowerCase() !== TEST_EMAIL || password !== TEST_PASSWORD) {
		throw new Error('Email or password is incorrect. Check your details and try again.');
	}
	return { token: 'shifttrack-demo-session', user: { id: 'u1', name: 'Alex' } };
}

export async function getShifts(weekStart: string): Promise<Shift[]> {
	await pause();
	assertApiAvailable();
	const weekEnd = new Date(`${weekStart}T12:00:00`);
	weekEnd.setDate(weekEnd.getDate() + 7);
	const endDate = formatLocalDate(weekEnd);
	return (await readShifts())
		.filter((shift) => shift.date >= weekStart && shift.date < endDate)
		.sort((first, second) => first.startTime.localeCompare(second.startTime));
}

export async function createShift(input: CreateShiftInput): Promise<Shift> {
	await pause();
	assertApiAvailable();
	const shifts = await readShifts();
	if (input.endTime && new Date(input.endTime) <= new Date(input.startTime)) {
		throw new Error('End time must be after start time.');
	}
	if (!input.endTime && shifts.some((shift) => shift.endTime === null)) {
		throw new Error('End the active shift before starting another one.');
	}
	const shift: Shift = { ...input, id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
	await writeShifts([...shifts, shift]);
	return shift;
}

export async function endShift(id: string, endTime: string): Promise<Shift> {
	await pause();
	assertApiAvailable();
	const shifts = await readShifts();
	const index = shifts.findIndex((shift) => shift.id === id);
	if (index === -1) throw new Error('This shift could not be found. Refresh and try again.');
	if (shifts[index].endTime) throw new Error('This shift has already ended.');
	if (new Date(endTime) <= new Date(shifts[index].startTime)) {
		throw new Error('End time must be after start time.');
	}
	const updated = { ...shifts[index], endTime };
	shifts[index] = updated;
	await writeShifts(shifts);
	return updated;
}
