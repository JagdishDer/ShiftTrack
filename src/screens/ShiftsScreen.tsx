import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createShift,
  endShift,
  getShifts,
  setMockApiErrorEnabled,
} from "../api/mockApi";
import LoadingView from "../components/LoadingView";
import ShiftCard from "../components/ShiftCard";
import { useAuth } from "../context/AuthContext";
import type { Shift } from "../types/shift";
import {
  formatLocalDate,
  formatShiftDate,
  getCurrentWeekStart,
  localDateTimeToIso,
} from "../utils/dateUtils";
import { formatTimer } from "../utils/durationUtils";

export default function ShiftsScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [apiErrorEnabled, setApiErrorEnabled] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [now, setNow] = useState(Date.now());
  const weekStart = getCurrentWeekStart();
  const activeShift = shifts.find((shift) => shift.endTime === null);

  const loadShifts = useCallback(
    async (pullToRefresh = false) => {
      if (pullToRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        setShifts(await getShifts(weekStart));
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load shifts. Try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [weekStart]
  );

  useFocusEffect(
    useCallback(() => {
      void loadShifts();
    }, [loadShifts])
  );

  useEffect(() => {
    if (!activeShift) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeShift?.id]);

  if (authLoading) return <LoadingView label="Checking your session" />;

  async function toggleApiError(enabled: boolean): Promise<void> {
    setApiErrorEnabled(enabled);
    setMockApiErrorEnabled(enabled);
    await loadShifts();
  }

  async function startShift(): Promise<void> {
    if (actionBusy || activeShift) return;
    setActionBusy(true);
    setActionError("");
    const nowDate = new Date();
    const date = formatLocalDate(nowDate);
    const time = `${String(nowDate.getHours()).padStart(2, "0")}:${String(
      nowDate.getMinutes()
    ).padStart(2, "0")}`;
    try {
      await createShift({
        date,
        startTime: localDateTimeToIso(date, time),
        endTime: null,
        breakMinutes: 0,
      });
      await loadShifts();
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "Could not start your shift. Try again."
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function finishShift(): Promise<void> {
    if (actionBusy || !activeShift) return;
    setActionBusy(true);
    setActionError("");
    try {
      await endShift(activeShift.id, new Date().toISOString());
      await loadShifts();
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "Could not end your shift. Try again."
      );
    } finally {
      setActionBusy(false);
    }
  }

  const weekEnd = new Date(`${weekStart}T12:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${formatShiftDate(weekStart)} – ${formatShiftDate(
    formatLocalDate(weekEnd)
  )}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadShifts(true)}
            tintColor="#28604B"
          />
        }
      >
        <View style={styles.topbar}>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>S</Text>
            </View>
            <Text style={styles.brandName}>SHIFTTRACK</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={styles.profileButton}
          >
            <Text style={styles.profileInitial}>{user?.name?.[0] ?? "A"}</Text>
            <Text style={styles.signOut}>Log out</Text>
          </Pressable>
        </View>

        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>WEEKLY ROSTER</Text>
            <Text style={styles.heading}>Your shifts</Text>
            <Text style={styles.weekLabel}>{weekLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a shift"
            onPress={() => router.push("/shifts/create")}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.actionPanel}>
          <View style={styles.actionHead}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  activeShift && styles.statusDotActive,
                ]}
              />
              <Text style={styles.statusText}>
                {activeShift ? "SHIFT IN PROGRESS" : "NOT ON THE CLOCK"}
              </Text>
            </View>
            <Text style={styles.today}>
              {formatShiftDate(formatLocalDate(new Date()))}
            </Text>
          </View>
          {activeShift ? (
            <>
              <Text style={styles.timer}>
                {formatTimer(activeShift.startTime, now)}
              </Text>
              <Text style={styles.timerCaption}>Elapsed time</Text>
            </>
          ) : (
            <>
              <Text style={styles.actionTitle}>Ready when you are.</Text>
              <Text style={styles.actionDescription}>
                Start the clock when your shift begins.
              </Text>
            </>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: actionBusy }}
            disabled={actionBusy}
            onPress={activeShift ? finishShift : startShift}
            style={({ pressed }) => [
              styles.clockButton,
              activeShift && styles.clockOutButton,
              pressed && styles.buttonPressed,
              actionBusy && styles.buttonDisabled,
            ]}
          >
            {actionBusy ? (
              <ActivityIndicator color={activeShift ? "#183D31" : "#FFFFFF"} />
            ) : (
              <Text
                style={[
                  styles.clockButtonText,
                  activeShift && styles.clockOutText,
                ]}
              >
                {activeShift ? "End shift" : "Start shift"}{" "}
                <Text style={styles.clockArrow}>→</Text>
              </Text>
            )}
          </Pressable>
        </View>

        {actionError ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            {actionError}
          </Text>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>This week</Text>
            <Text style={styles.sectionSubtitle}>
              {loading
                ? "Loading roster"
                : `${shifts.length} ${
                    shifts.length === 1 ? "shift" : "shifts"
                  } scheduled`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/shifts/create")}
            style={styles.createLink}
          >
            <Text style={styles.createLinkText}>+ Add shift</Text>
          </Pressable>
        </View>

        <View style={styles.listArea}>
          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#28604B" />
              <Text style={styles.stateText}>Loading your shifts…</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.stateTitle}>Couldn’t load the roster</Text>
              <Text style={styles.errorDescription}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadShifts()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : shifts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyMark}>—</Text>
              <Text style={styles.stateTitle}>A clear week ahead</Text>
              <Text style={styles.emptyDescription}>
                No shifts are scheduled yet. Add one to get started.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/shifts/create")}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Create a shift</Text>
              </Pressable>
            </View>
          ) : (
            shifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} now={now} />
            ))
          )}
        </View>

        <View style={styles.demoRow}>
          <View style={styles.demoCopy}>
            <Text style={styles.demoTitle}>Demo API error</Text>
            <Text style={styles.demoDescription}>
              Toggle to preview the retry state
            </Text>
          </View>
          <Switch
            accessibilityLabel="Simulate API error"
            onValueChange={(enabled) => void toggleApiError(enabled)}
            thumbColor={apiErrorEnabled ? "#FFFFFF" : "#F8FAF7"}
            trackColor={{ false: "#CBD4CD", true: "#387857" }}
            value={apiErrorEnabled}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F6F2" },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  topbar: {
    height: 53,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLockup: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#C8F36A",
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    color: "#183D31",
    fontFamily: "Georgia",
    fontSize: 20,
    fontWeight: "700",
  },
  brandName: {
    color: "#20342B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 42,
  },
  profileInitial: {
    width: 29,
    height: 29,
    overflow: "hidden",
    borderRadius: 15,
    textAlign: "center",
    textAlignVertical: "center",
    color: "#FFFFFF",
    backgroundColor: "#34705D",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 6,
  },
  signOut: { color: "#65716B", fontSize: 12, fontWeight: "600" },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 18,
  },
  eyebrow: {
    color: "#4E7A54",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  heading: {
    color: "#1D2C25",
    fontFamily: "Georgia",
    fontSize: 34,
    marginTop: 5,
  },
  weekLabel: { color: "#758078", fontSize: 13, marginTop: 6 },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#C8F36A",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#183D31",
    fontSize: 29,
    fontWeight: "400",
    lineHeight: 32,
  },
  actionPanel: {
    borderRadius: 8,
    backgroundColor: "#183D31",
    padding: 19,
    marginBottom: 9,
  },
  actionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A6B5AC",
  },
  statusDotActive: { backgroundColor: "#C8F36A" },
  statusText: {
    color: "#D5E1D9",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  today: { color: "#C2D0C7", fontSize: 11 },
  actionTitle: {
    color: "#FFFFFF",
    fontFamily: "Georgia",
    fontSize: 22,
    marginTop: 22,
  },
  actionDescription: { color: "#C6D5CE", fontSize: 12, marginTop: 5 },
  timer: {
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    fontSize: 38,
    fontWeight: "600",
    marginTop: 15,
  },
  timerCaption: { color: "#C6D5CE", fontSize: 11, marginTop: 1 },
  clockButton: {
    minHeight: 46,
    borderRadius: 5,
    backgroundColor: "#C8F36A",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  clockOutButton: { backgroundColor: "#FFFFFF" },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.65 },
  clockButtonText: { color: "#183D31", fontSize: 14, fontWeight: "800" },
  clockOutText: { color: "#183D31" },
  clockArrow: { color: "#4D7445", fontSize: 17 },
  inlineError: {
    color: "#A63F36",
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 3,
    marginVertical: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 11,
  },
  sectionTitle: { color: "#20342B", fontSize: 17, fontWeight: "800" },
  sectionSubtitle: { color: "#7A857E", fontSize: 11, marginTop: 4 },
  createLink: { minHeight: 36, justifyContent: "center", paddingHorizontal: 4 },
  createLinkText: { color: "#357052", fontSize: 12, fontWeight: "800" },
  listArea: { minHeight: 100 },
  stateBox: {
    minHeight: 106,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateText: { color: "#77837C", fontSize: 12 },
  errorBox: {
    alignItems: "flex-start",
    backgroundColor: "#FFF0ED",
    borderColor: "#F4D6D0",
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
  },
  stateTitle: { color: "#20342B", fontSize: 15, fontWeight: "800" },
  errorDescription: {
    color: "#8D5B54",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  retryButton: {
    minHeight: 36,
    justifyContent: "center",
    marginTop: 7,
    paddingHorizontal: 2,
  },
  retryText: { color: "#28604B", fontSize: 13, fontWeight: "800" },
  emptyBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E9E4",
    borderWidth: 1,
    borderRadius: 6,
    padding: 22,
  },
  emptyMark: { color: "#83A256", fontSize: 25, marginBottom: 7 },
  emptyDescription: {
    color: "#77837C",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 260,
  },
  demoRow: {
    minHeight: 59,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E1E6E0",
    marginTop: 18,
    paddingTop: 11,
  },
  demoCopy: { flex: 1 },
  demoTitle: { color: "#65716B", fontSize: 11, fontWeight: "700" },
  demoDescription: { color: "#8A948E", fontSize: 10, marginTop: 3 },
});
