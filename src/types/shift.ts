export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  breakMinutes: number;
}

export interface CreateShiftInput {
  date: string;
  startTime: string;
  endTime: string | null;
  breakMinutes: number;
}