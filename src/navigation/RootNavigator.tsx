import { Redirect, Stack, useSegments } from "expo-router";
import { useAuth } from "../context/AuthContext";
import LoadingView from "../components/LoadingView";

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  if (loading) return <LoadingView />;
  if (!user && segments[0] !== "login") return <Redirect href="/login" />;
  if (user && segments[0] === "login") return <Redirect href="/shifts" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F4F6F2" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="shifts/index" />
      <Stack.Screen
        name="shifts/create"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}
