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
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingView from "../components/LoadingView";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const passwordInput = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <LoadingView label="Checking your session" />;

  async function submit(): Promise<void> {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>S</Text>
            </View>
            <Text style={styles.brand}>
              SHIFTTRACK <Text style={styles.brandSub}>/ STAFF</Text>
            </Text>
          </View>

          <View style={styles.intro}>
            <Text style={styles.kicker}>GOOD TO HAVE YOU BACK</Text>
            <Text style={styles.title}>Your shift,{"\n"}your time.</Text>
            <Text style={styles.description}>
              Sign in to see this week and keep your hours in order.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              onSubmitEditing={() => passwordInput.current?.focus()}
              placeholder="you@workplace.com"
              placeholderTextColor="#87928B"
              returnKeyType="next"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />

            <Text style={[styles.label, styles.passwordLabel]}>PASSWORD</Text>
            <TextInput
              ref={passwordInput}
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={setPassword}
              onSubmitEditing={() => void submit()}
              placeholder="Enter your password"
              placeholderTextColor="#87928B"
              returnKeyType="go"
              secureTextEntry
              style={styles.input}
              textContentType="password"
              value={password}
            />

            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: submitting }}
              disabled={submitting}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.submit,
                pressed && !submitting && styles.submitPressed,
                submitting && styles.disabled,
              ]}
            >
              <Text style={styles.submitText}>
                {submitting ? "Signing in…" : "Sign in"}{" "}
                <Text style={styles.arrow}>→</Text>
              </Text>
            </Pressable>
            <Text style={styles.demo}>
              Demo login: staff@shifttrack.test / Password123
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              SHIFTTRACK <Text style={styles.footerDot}>●</Text> TEAM OPERATIONS
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 18,
    paddingBottom: 22,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#C8F36A",
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    color: "#183D31",
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "700",
  },
  brand: {
    color: "#1B2C24",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.6,
  },
  brandSub: { color: "#87928B", fontSize: 10, fontWeight: "600" },
  intro: { marginTop: 64, marginBottom: 34 },
  kicker: {
    color: "#4E7A54",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: "#1B2C24",
    fontFamily: "Georgia",
    fontSize: 43,
    lineHeight: 48,
    marginTop: 14,
  },
  description: {
    color: "#69756E",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 13,
    maxWidth: 290,
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E9E3",
    borderWidth: 1,
    borderRadius: 8,
    padding: 19,
  },
  label: {
    color: "#69756E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  input: {
    height: 50,
    paddingHorizontal: 13,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#DDE4DE",
    color: "#1B2C24",
    backgroundColor: "#FBFCFA",
    fontSize: 15,
  },
  passwordLabel: { marginTop: 20 },
  error: {
    color: "#A63F36",
    backgroundColor: "#FFF0ED",
    borderRadius: 5,
    padding: 11,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 15,
  },
  submit: {
    height: 52,
    backgroundColor: "#183D31",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  submitPressed: { backgroundColor: "#28604B" },
  disabled: { opacity: 0.6 },
  submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  arrow: { color: "#C8F36A", fontSize: 18 },
  demo: { color: "#77837C", textAlign: "center", fontSize: 11, marginTop: 15 },
  footer: { marginTop: "auto", paddingTop: 30 },
  footerText: {
    color: "#89938D",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  footerDot: { color: "#91B74A", fontSize: 8 },
});
