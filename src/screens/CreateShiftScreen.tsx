import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { createShift } from "../api/mockApi";
import LoadingView from "../components/LoadingView";
import { useAuth } from "../context/AuthContext";
import type { CreateShiftInput } from "../types/shift";
import {
  formatLocalDate,
  isValidDate,
  isValidTime,
  localDateTimeToIso,
} from "../utils/dateUtils";

export default function CreateShiftScreen() {
  const { loading: authLoading } = useAuth();
  const [date, setDate] = useState(formatLocalDate(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState("30");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitLock = useRef(false);

  if (authLoading) return <LoadingView label="Checking your session" />;

  async function submit(): Promise<void> {
    if (submitLock.current) return;
    setError("");

    if (!isValidDate(date)) {
      setError("Enter a real date in YYYY-MM-DD format.");
      return;
    }
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      setError("Enter both times in 24-hour HH:MM format.");
      return;
    }
    const breakValue = Number(breakMinutes);
    if (!Number.isInteger(breakValue) || breakValue < 0 || breakValue > 240) {
      setError("Break must be a whole number from 0 to 240 minutes.");
      return;
    }

    const startIso = localDateTimeToIso(date, startTime);
    const endIso = localDateTimeToIso(date, endTime);
    if (new Date(endIso) <= new Date(startIso)) {
      setError("End time must be later than start time.");
      return;
    }

    submitLock.current = true;
    setSaving(true);
    const input: CreateShiftInput = {
      date,
      startTime: startIso,
      endTime: endIso,
      breakMinutes: breakValue,
    };
    try {
      await createShift(input);
      router.back();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save this shift. Please try again."
      );
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.navRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close create shift"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <Text style={styles.navTitle}>NEW SHIFT</Text>
            <View style={styles.navSpacer} />
          </View>

          <Text style={styles.eyebrow}>PLAN AHEAD</Text>
          <Text style={styles.title}>Add a shift</Text>
          <Text style={styles.subtitle}>
            Set the date and hours for your roster.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>DATE</Text>
            <TextInput
              accessibilityLabel="Shift date"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#87928B"
              returnKeyType="next"
              style={styles.input}
              value={date}
            />

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>START</Text>
                <TextInput
                  accessibilityLabel="Start time"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor="#87928B"
                  returnKeyType="next"
                  style={styles.input}
                  value={startTime}
                />
              </View>
              <View style={styles.timeArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
              <View style={styles.timeField}>
                <Text style={styles.label}>END</Text>
                <TextInput
                  accessibilityLabel="End time"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  onChangeText={setEndTime}
                  placeholder="17:00"
                  placeholderTextColor="#87928B"
                  returnKeyType="next"
                  style={styles.input}
                  value={endTime}
                />
              </View>
            </View>

            <Text style={styles.label}>UNPAID BREAK (MINUTES)</Text>
            <TextInput
              accessibilityLabel="Unpaid break in minutes"
              keyboardType="number-pad"
              maxLength={3}
              onChangeText={setBreakMinutes}
              placeholder="30"
              placeholderTextColor="#87928B"
              returnKeyType="done"
              style={styles.input}
              value={breakMinutes}
            />

            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: saving }}
              disabled={saving}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.submit,
                pressed && !saving && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              <Text style={styles.submitText}>
                {saving ? "Saving…" : "Save shift"}{" "}
                <Text style={styles.submitArrow}>→</Text>
              </Text>
            </Pressable>
          </View>
          <View style={styles.noteRow}>
            <View style={styles.noteMark} />
            <Text style={styles.note}>
              Times are entered in your local time zone.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F6F2" },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  navRow: {
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 27,
  },
  backButton: { width: 42, height: 42, justifyContent: "center" },
  backText: { color: "#20342B", fontSize: 34, lineHeight: 38 },
  navTitle: {
    color: "#65716B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  navSpacer: { width: 42 },
  eyebrow: {
    color: "#4E7A54",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: {
    color: "#1D2C25",
    fontFamily: "Georgia",
    fontSize: 34,
    marginTop: 5,
  },
  subtitle: { color: "#758078", fontSize: 13, marginTop: 7, marginBottom: 22 },
  form: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E9E3",
    borderWidth: 1,
    borderRadius: 8,
    padding: 17,
  },
  label: {
    color: "#69756E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  input: {
    height: 49,
    paddingHorizontal: 13,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#DDE4DE",
    color: "#1B2C24",
    backgroundColor: "#FBFCFA",
    fontSize: 15,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
    marginVertical: 21,
  },
  timeField: { flex: 1 },
  timeArrow: { height: 49, justifyContent: "center", paddingBottom: 2 },
  arrowText: { color: "#7E8A81", fontSize: 17 },
  error: {
    color: "#A63F36",
    backgroundColor: "#FFF0ED",
    borderRadius: 5,
    padding: 11,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
  },
  submit: {
    height: 51,
    backgroundColor: "#183D31",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  pressed: { backgroundColor: "#28604B" },
  disabled: { opacity: 0.6 },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  submitArrow: { color: "#C8F36A", fontSize: 17 },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  noteMark: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#83A256",
  },
  note: { color: "#77837C", fontSize: 11 },
});
