import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { SyncProvider } from "@/lib/sync/use-sync";
import { LoadingScreen } from "@/components/LoadingScreen";

// TEMP diagnostic: show errors on screen even if LogBox is silent.
console.log("[app] module evaluated");
const g = (globalThis as { ErrorUtils?: Record<string, unknown> }).ErrorUtils;
if (g && typeof g.setGlobalHandler === "function") {
  g.setGlobalHandler((error: unknown) => {
    console.error("[app] GLOBAL HANDLER:", error);
  });
}

class ScreenErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: unknown }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  override render() {
    if (this.state.error) {
      const message = this.state.error instanceof Error
        ? `${this.state.error.name}: ${this.state.error.message}`
        : String(this.state.error);
      console.error("[app] BOUNDARY ERROR:", this.state.error);
      return (
        <View style={styles.boundary}>
          <Text style={styles.boundaryTitle}>Ocorreu um erro</Text>
          <Text style={styles.boundaryText}>{message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootNavigator(): React.JSX.Element {
  const { state } = useAuth();
  console.log("[app] RootNavigator render, state:", state.status);

  if (state.status === "loading") {
    return <LoadingScreen label="Carregando..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    >
      {state.status === "signedIn" ? (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="atividades/[cellId]" />
          <Stack.Screen name="atividades/[cellId]/nova" />
          <Stack.Screen name="atividades/[cellId]/[meetingId]" />
          <Stack.Screen name="atividades/[cellId]/[meetingId]/chamada" />
          <Stack.Screen name="documentos/[docId]" />
        </>
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SyncProvider>
          <StatusBar style="dark" />
          <ScreenErrorBoundary>
            <RootNavigator />
          </ScreenErrorBoundary>
        </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boundary: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 24
  },
  boundaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12
  },
  boundaryText: {
    fontSize: 14,
    textAlign: "center"
  }
});