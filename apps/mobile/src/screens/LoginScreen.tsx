import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { FullScreen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError, NetworkError } from "@/lib/api/client";
import { API_URL } from "@/lib/config";

export default function LoginScreen(): React.JSX.Element {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (): Promise<void> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailError("Informe seu e-mail.");
      return;
    }
    setEmailError("");

    setLoading(true);
    try {
      await signIn(normalizedEmail, password);
    } catch (error) {
      let message = "Não foi possível entrar.";
      if (error instanceof NetworkError) {
        message = `Sem conexão com o servidor (${API_URL}).`;
      } else if (error instanceof ApiError) {
        message = error.message;
      }
      Alert.alert("Falha no login", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FullScreen style={styles.screen}>
        <Text variant="title" align="center" style={styles.brand}>
          Células
        </Text>
        <Text variant="label" align="center" color="#6B7280" style={styles.subtitle}>
          Gestão de células e pequenos grupos
        </Text>

        <Card style={styles.card}>
          <Text variant="subtitle" style={styles.formTitle}>
            Entrar
          </Text>
          <TextInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            error={emailError}
          />
          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="Sua senha"
          />
          <Button
            fullWidth
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password}
          >
            Entrar
          </Button>
        </Card>
      </FullScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  screen: {
    justifyContent: "center",
    paddingHorizontal: 20
  },
  brand: {
    marginBottom: 2
  },
  subtitle: {
    marginBottom: 24
  },
  card: {
    width: "100%"
  },
  formTitle: {
    marginBottom: 16
  }
});