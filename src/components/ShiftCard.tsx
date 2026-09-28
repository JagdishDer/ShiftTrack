import { StyleSheet, Text, View } from "react-native";
import type { Shift } from "../types/shift";
import { formatShiftDate, formatTime } from "../utils/dateUtils";
import {
  formatDuration,
  getShiftDurationMinutes,
} from "../utils/durationUtils";

export default function ShiftCard({
  shift,
  now,
}: {
  shift: Shift;
  now: number;
}) {
  const active = shift.endTime === null;
  const duration = formatDuration(
    getShiftDurationMinutes(
      shift.startTime,
      shift.endTime,
      shift.breakMinutes,
      now
    )
  );

  return (
    <View style={[styles.card, active && styles.activeCard]}>
      <View style={styles.dateColumn}>
        <Text style={[styles.weekday, active && styles.activeText]}>
          {formatShiftDate(shift.date).split(",")[0]}
        </Text>
        <Text style={[styles.date, active && styles.activeText]}>
          {formatShiftDate(shift.date).split(", ")[1]}
        </Text>
      </View>
      <View style={styles.details}>
        <Text style={[styles.time, active && styles.activeText]}>
          {formatTime(shift.startTime)}
          {shift.endTime ? ` – ${formatTime(shift.endTime)}` : " – In progress"}
        </Text>
        <Text style={[styles.meta, active && styles.activeMeta]}>
          {shift.breakMinutes} min break <Text style={styles.dot}>·</Text>{" "}
          {duration} total
        </Text>
      </View>
      {active && <View style={styles.liveDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E9E4",
    marginBottom: 9,
  },
  activeCard: { backgroundColor: "#183D31", borderColor: "#183D31" },
  dateColumn: {
    width: 62,
    borderRightWidth: 1,
    borderRightColor: "#E6EAE5",
    marginRight: 14,
  },
  weekday: {
    color: "#718078",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  date: { color: "#1D2C25", fontSize: 16, fontWeight: "700", marginTop: 3 },
  activeText: { color: "#FFFFFF" },
  details: { flex: 1, minWidth: 0 },
  time: { color: "#20342B", fontSize: 15, fontWeight: "700" },
  meta: { color: "#78847D", fontSize: 12, marginTop: 7 },
  activeMeta: { color: "#C6D5CE" },
  dot: { color: "#BFDA62", fontWeight: "700" },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C8F36A",
    marginLeft: 8,
  },
});
