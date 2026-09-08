import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import type { UserResponse } from "@mission-atos/contracts";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/auth-context";
import { getMe } from "@/lib/api/users";
import { formatDateTimeBR } from "@/lib/utils/format";

export default function ProfileScreen(): React.JSX.Element {
  const { state, signOut } = useAuth();
  const [user, setUser] = useState<UserResponse | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const me = await getMe();
      setUser(me.data);
    } catch {
      // Falls back to session data
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const name = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : state.status === "signedIn"
      ? "Usuário"
      : "";

  const email = user?.email ?? "";

  const handleSignOut = (): void => {
    Alert.alert("Sair", "Deseja sair da aplicação?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await signOut();
        }
      }
    ]);
  };

  return (
    <Screen>
      <Text variant="title" style={styles.title}>
        Perfil
      </Text>

      <Card style={styles.profileCard}>
        <Avatar name={name} size={64} />
        <View style={styles.profileInfo}>
          <Text variant="subtitle">{name}</Text>
          <Text variant="caption" color="#6B7280">
            {email || "E-mail não carregado"}
          </Text>
        </View>
        <View style={styles.roles}>
          {(user?.roles ?? []).map((role) => (
            <Badge key={role.id} label={role.name} variant="info" />
          ))}
        </View>
        {user ? (
          <Text variant="caption" color="#9CA3AF" style={styles.memberSince}>
            Usuário desde {formatDateTimeBR(user.createdAt)}
          </Text>
        ) : null}
      </Card>

      <Button
        fullWidth
        variant="danger"
        onPress={handleSignOut}
        style={styles.signOut}
      >
        Sair da conta
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16
  },
  profileCard: {
    alignItems: "center",
    marginBottom: 24
  },
  profileInfo: {
    marginTop: 12,
    alignItems: "center"
  },
  roles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginTop: 12
  },
  memberSince: {
    marginTop: 12
  },
  signOut: {
    marginTop: 8
  }
});