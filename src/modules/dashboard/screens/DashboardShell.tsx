import React from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAuthContext } from '../../auth/context-api';

type Props = {
  accessToken: string;
  email: string;
  onSignOut: () => void;
};

export function DashboardShell({ accessToken, email, onSignOut }: Props) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auth-context'],
    queryFn: () => getAuthContext(accessToken),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>Dashboard Shell</Text>
        <Text>Signed in as: {email}</Text>

        {isLoading ? (
          <ActivityIndicator style={styles.block} />
        ) : error ? (
          <View style={styles.block}>
            <Text style={styles.error}>Failed to load /auth/context</Text>
            <Button title="Retry" onPress={() => void refetch()} />
          </View>
        ) : (
          <View style={styles.block}>
            <Text>Role: {data?.role ?? 'n/a'}</Text>
            <Text>Type: {data?.type ?? 'n/a'}</Text>
            <Text>Farm: {data?.farmId ?? 'n/a'}</Text>
          </View>
        )}

        <Button title="Sign Out" onPress={onSignOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  card: { width: '90%', maxWidth: 380, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  block: { marginVertical: 16, gap: 6 },
  error: { color: '#b91c1c' },
});
