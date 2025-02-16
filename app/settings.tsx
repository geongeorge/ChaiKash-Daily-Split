import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  TextInput,
  Button,
  Text,
  List,
  RadioButton,
  useTheme,
  Surface,
  Divider,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SplitwiseService from "@/services/splitwise";
import type { SplitwiseGroup } from "@/services/splitwise";
import {
  CURRENCIES,
  type Currency,
  storage,
  STORAGE_KEYS,
} from "@/lib/storage";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsScreen() {
  const theme = useTheme();
  const [token, setToken] = useMMKVString(STORAGE_KEYS.TOKEN, storage);
  const [groups, setGroups] = useMMKVObject<SplitwiseGroup[]>(
    STORAGE_KEYS.GROUP_MEMBERS,
    storage
  );
  const [selectedGroup, setSelectedGroup] = useMMKVString(
    STORAGE_KEYS.GROUP_ID,
    storage
  );
  const [currency, setCurrency] = useMMKVObject<Currency>(
    STORAGE_KEYS.CURRENCY,
    storage
  );
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const queryClient = useQueryClient();

  const testConnection = async () => {
    setIsLoading(true);
    try {
      if (!token) {
        setConnectionStatus("Token is required");
        throw new Error("Token is required");
      }
      const splitwise = new SplitwiseService(token);
      const groups = await splitwise.getGroups();
      setGroups(groups);
      setConnectionStatus("Connection successful!");

      // Save token if connection is successful
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      setConnectionStatus("Connection failed. Please check your token.");
      console.error("Splitwise connection error:", error);
    }
    setIsLoading(false);
  };

  const saveGroup = async (groupId: string) => {
    queryClient.invalidateQueries({ queryKey: ["group"] });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    setSelectedGroup(groupId);
  };

  const saveCurrency = async (selectedCurrency: string) => {
    const currency = CURRENCIES.find((c) => c.value === selectedCurrency);
    setCurrency(currency);
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.section} elevation={0}>
        <Text variant="headlineSmall">Splitwise Token</Text>
        <TextInput
          mode="outlined"
          value={token}
          onChangeText={setToken}
          placeholder="Enter your Splitwise token"
          secureTextEntry
          style={styles.input}
        />
        <Button
          mode="text"
          onPress={testConnection}
          loading={isLoading}
          style={styles.button}
        >
          Test Connection
        </Button>
        {connectionStatus ? (
          <Text
            variant="bodyMedium"
            style={[
              {
                color: connectionStatus.includes("failed")
                  ? theme.colors.error
                  : theme.colors.primary,
              },
            ]}
          >
            {connectionStatus}
          </Text>
        ) : null}
      </Surface>

      {groups && groups.length > 0 && (
        <Surface style={styles.section} elevation={0}>
          <Text variant="headlineSmall">Select Group</Text>
          <RadioButton.Group
            onValueChange={saveGroup}
            value={selectedGroup || ""}
          >
            {groups.map((group) => (
              <RadioButton.Item
                key={group.id}
                label={group.name}
                value={group.id.toString()}
              />
            ))}
          </RadioButton.Group>
        </Surface>
      )}

      <Surface style={styles.section} elevation={0}>
        <Text variant="headlineSmall">Currency</Text>
        <RadioButton.Group
          onValueChange={saveCurrency}
          value={currency?.value || ""}
        >
          {CURRENCIES.map((curr) => (
            <RadioButton.Item
              key={curr.value}
              label={curr.label}
              value={curr.value}
            />
          ))}
        </RadioButton.Group>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  status: {
    marginTop: 8,
  },
});
