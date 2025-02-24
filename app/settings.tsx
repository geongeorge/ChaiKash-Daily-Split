import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  TextInput as RNTextInput,
} from "react-native";
import {
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
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

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
  const [copyStatus, setCopyStatus] = useState("");

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

  const refreshGroups = async () => {
    setIsLoading(true);
    try {
      if (!token) {
        setConnectionStatus("Token is required");
        return;
      }
      const splitwise = new SplitwiseService(token);
      const groups = await splitwise.getGroups();
      setGroups(groups);
    } catch (error) {
      console.error("Splitwise refresh error:", error);
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

  const copyToken = async () => {
    if (!token) return;
    await Clipboard.setString(token);
    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus(""), 2000);
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Splitwise Token</Text>
        <View style={styles.inputContainer}>
          <RNTextInput
            value={token}
            onChangeText={setToken}
            placeholder="Enter your Splitwise token"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
          <TouchableOpacity
            style={[styles.refreshButton, styles.copyButton]}
            onPress={copyToken}
            disabled={!token}
          >
            <Ionicons
              name="copy-outline"
              size={20}
              color={token ? Colors.light.tint : "#94A3B8"}
            />
          </TouchableOpacity>
        </View>
        {copyStatus ? (
          <Text style={styles.copyStatus}>{copyStatus}</Text>
        ) : null}
        <Button
          mode="contained"
          onPress={testConnection}
          loading={isLoading}
          style={styles.button}
          buttonColor={Colors.light.tint}
        >
          Test Connection
        </Button>
        {connectionStatus ? (
          <Text
            style={[
              styles.status,
              {
                color: connectionStatus.includes("failed")
                  ? "#DC2626"
                  : Colors.light.tint,
              },
            ]}
          >
            {connectionStatus}
          </Text>
        ) : null}
      </Surface>

      {groups && groups.length > 0 && (
        <Surface style={styles.section} elevation={0}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.headerTitle]}>
              Select Group
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshGroups}
              disabled={isLoading}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={isLoading ? "#94A3B8" : Colors.light.tint}
              />
            </TouchableOpacity>
          </View>
          <RadioButton.Group
            onValueChange={saveGroup}
            value={selectedGroup || ""}
          >
            {groups.map((group) => (
              <RadioButton.Item
                key={group.id}
                label={group.name}
                value={group.id.toString()}
                labelStyle={styles.radioLabel}
                theme={{
                  colors: { primary: Colors.light.tint },
                }}
              />
            ))}
          </RadioButton.Group>
        </Surface>
      )}

      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <RadioButton.Group
          onValueChange={saveCurrency}
          value={currency?.value || ""}
        >
          {CURRENCIES.map((curr) => (
            <RadioButton.Item
              key={curr.value}
              label={curr.label}
              value={curr.value}
              labelStyle={styles.radioLabel}
              theme={{
                colors: { primary: Colors.light.tint },
              }}
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
    backgroundColor: "#F8FAFC",
  },
  section: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1E293B",
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1E293B",
  },
  button: {
    marginBottom: 8,
    borderRadius: 12,
  },
  status: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "500",
  },
  radioLabel: {
    color: "#64748B",
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    marginBottom: 0,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  copyButton: {
    alignSelf: "center",
  },
  copyStatus: {
    fontSize: 14,
    color: Colors.light.tint,
    marginBottom: 8,
  },
});
