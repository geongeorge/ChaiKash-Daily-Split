import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import {
  Text,
  Button,
  Surface,
  Chip,
  Card,
  useTheme,
  TextInput,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import { storage, STORAGE_KEYS, type Currency } from "@/lib/storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SplitwiseService, { type SplitwiseUser } from "@/services/splitwise";

export interface MenuItem {
  id: string;
  name: string;
  price: string;
}

interface UserExpense {
  userId: number;
  userName: string;
  items: MenuItem[];
  total: number;
}

export default function AddScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [token] = useMMKVString(STORAGE_KEYS.TOKEN, storage);
  const [groupId] = useMMKVString(STORAGE_KEYS.GROUP_ID, storage);
  const [menuItems] = useMMKVObject<MenuItem[]>(
    STORAGE_KEYS.MENU_ITEMS,
    storage
  );
  const [currency] = useMMKVObject<Currency>(STORAGE_KEYS.CURRENCY, storage);
  const [selectedUsers, setSelectedUsers] = useState<UserExpense[]>([]);
  const [expenseName, setExpenseName] = useState("Split bill");

  const queryClient = useQueryClient();
  // Fetch group members
  const { data: group } = useQuery({
    queryKey: ["group", { groupId }],
    queryFn: () => {
      if (!token) return null;
      const splitwiseService = new SplitwiseService(token);
      return splitwiseService.getGroup(Number(groupId));
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => {
      if (!token) return null;
      const splitwiseService = new SplitwiseService(token);
      return splitwiseService.getCurrentUser();
    },
  });

  const currentUserId = currentUser?.id;

  const addItemToUser = (userId: number, item: MenuItem) => {
    setSelectedUsers((current) =>
      current.map((userExp) => {
        if (userExp.userId === userId) {
          const updatedItems = [...userExp.items, item];
          return {
            ...userExp,
            items: updatedItems,
            total: updatedItems.reduce(
              (sum, item) => sum + Number.parseFloat(item.price),
              0
            ),
          };
        }
        return userExp;
      })
    );
  };

  const removeItemFromUser = (userId: number, itemIndex: number) => {
    setSelectedUsers((current) =>
      current.map((userExp) => {
        if (userExp.userId === userId) {
          const updatedItems = userExp.items.filter(
            (_, index) => index !== itemIndex
          );
          return {
            ...userExp,
            items: updatedItems,
            total: updatedItems.reduce(
              (sum, item) => sum + Number.parseFloat(item.price),
              0
            ),
          };
        }
        return userExp;
      })
    );
  };

  const toggleUser = (user: SplitwiseUser) => {
    setSelectedUsers((current) => {
      const isSelected = current.some((u) => u.userId === user.id);
      if (isSelected) {
        return current.filter((u) => u.userId !== user.id);
      }
      return [
        ...current,
        {
          userId: user.id,
          userName: `${user.first_name} ${user.last_name}`,
          items: [],
          total: 0,
        },
      ];
    });
  };

  const createSplitExpense = async () => {
    if (!token || !selectedUsers.length || !currentUserId) return;

    const splitwiseService = new SplitwiseService(token);
    const usersWithExpenses = selectedUsers.filter((user) => user.total > 0);
    const totalCost = usersWithExpenses.reduce(
      (sum, user) => sum + user.total,
      0
    );

    try {
      await splitwiseService.createExpense({
        cost: totalCost,
        description: expenseName,
        currencyCode: currency?.value || "USD",
        groupId: Number(groupId),
        payerId: currentUserId,
        splits: usersWithExpenses.map((user) => ({
          userName: user.userName,
          userId: user.userId,
          amount: user.total,
          items: user.items,
        })),
      });
      queryClient.refetchQueries({ queryKey: ["expenses"] });

      router.back();
    } catch (error) {
      console.error("Error creating expense:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Surface style={styles.content} elevation={0}>
          <Text variant="headlineMedium" style={styles.title}>
            Create Split Expense
          </Text>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Expense Details
            </Text>
            <TextInput
              label="Expense Name"
              value={expenseName}
              onChangeText={setExpenseName}
              style={styles.input}
              mode="outlined"
            />
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select People
            </Text>
            <View style={styles.userChips}>
              {group?.members.map((user) => (
                <Chip
                  key={user.id}
                  selected={selectedUsers.some((u) => u.userId === user.id)}
                  onPress={() => toggleUser(user)}
                  style={styles.chip}
                >
                  {user.first_name}
                </Chip>
              ))}
            </View>
          </View>

          {selectedUsers.length > 0 && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Assign Items
              </Text>
              {selectedUsers.map((user) => (
                <View key={user.userId} style={styles.userSection}>
                  <Text variant="titleSmall">{user.userName}</Text>
                  <ScrollView horizontal style={styles.menuItems}>
                    {menuItems?.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => addItemToUser(user.userId, item)}
                      >
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>
                          {currency?.symbol}
                          {item.price}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {user.items.length > 0 && (
                    <View style={styles.selectedItems}>
                      <Text variant="bodySmall">Selected items:</Text>
                      {user.items.map((item, index) => (
                        <Chip
                          key={`${item.id}-${index}`}
                          onClose={() => removeItemFromUser(user.userId, index)}
                          style={styles.selectedItem}
                        >
                          {item.name} ({currency?.symbol}
                          {item.price})
                        </Chip>
                      ))}
                      <Text variant="bodyMedium" style={styles.total}>
                        Total: {currency?.symbol}
                        {user.total.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={createSplitExpense}
              style={styles.button}
              disabled={!selectedUsers.some((user) => user.total > 0)}
            >
              Create Split
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    padding: 16,
    borderRadius: 8,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  userChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  userSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  menuItems: {
    marginVertical: 8,
  },
  menuItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 12,
    color: "#666",
  },
  selectedItems: {
    marginTop: 8,
  },
  selectedItem: {
    marginTop: 4,
  },
  total: {
    marginTop: 8,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  button: {
    minWidth: 100,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
});
