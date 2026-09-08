import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { SyncProvider } from "@/lib/sync/use-sync";
import { LoadingScreen } from "@/components/LoadingScreen";

function RootNavigator(): React.JSX.Element {
  const { state } = useAuth();

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
          <RootNavigator />
        </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}