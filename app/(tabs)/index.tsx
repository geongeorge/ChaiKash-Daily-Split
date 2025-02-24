import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import SplitwiseService from "@/services/splitwise";
import type { SplitwiseUser, SplitwiseGroup } from "@/services/splitwise";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme, FAB } from "react-native-paper";
import { type Currency, storage, STORAGE_KEYS } from "@/lib/storage";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

interface MenuItem {
  id: string;
  name: string;
  price: string;
}

interface UserExpense {
  userId: number;
  items: MenuItem[];
  total: number;
}

export default function SplitScreen() {
  const colorScheme = useColorScheme();
  const [menuItems] = useMMKVObject<MenuItem[]>(
    STORAGE_KEYS.MENU_ITEMS,
    storage
  );
  const [currency] = useMMKVObject<Currency>(STORAGE_KEYS.CURRENCY, storage);
  const [token] = useMMKVString(STORAGE_KEYS.TOKEN, storage);
  const [groupId] = useMMKVString(STORAGE_KEYS.GROUP_ID, storage);
  const [userExpenses, setUserExpenses] = useState<UserExpense[]>([]);
  const router = useRouter();

  const splitwiseService = useMemo(() => {
    if (!token) return null;
    return new SplitwiseService(token);
  }, [token]);

  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["expenses", { groupId }],
    queryFn: () => {
      if (!splitwiseService) return [];

      return splitwiseService.getExpenses({
        group_id: Number(groupId),
      });
    },
  });

  const { data: group, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["group", { groupId }],
    queryFn: () => {
      if (!splitwiseService) return null;
      return splitwiseService.getGroup(Number(groupId));
    },
  });

  const users = useMemo(() => {
    if (!group) return [];

    return group.members;
  }, [group]);

  const isLoading = isLoadingGroups || isLoadingExpenses;

  const addItemToUser = (userId: number, item: MenuItem) => {
    setUserExpenses((current) =>
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
    setUserExpenses((current) =>
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
      </View>
    );
  }

  if (!users.length || !menuItems?.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Please set up your Splitwise settings and add menu items first.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {expenses && expenses.length > 0 ? (
          <ScrollView style={styles.expensesList}>
            {expenses.map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseHeader}>
                  <Text style={styles.expenseDate}>
                    {format(new Date(expense.created_at), "MMM d, yyyy")}
                  </Text>

                  <Text style={styles.expenseAmount}>
                    {currency?.symbol} {expense.cost}
                  </Text>
                </View>
                <Text style={styles.expenseDescription}>
                  {expense.description}
                </Text>
                {expense.details && (
                  <Text style={styles.expenseDetails} numberOfLines={2}>
                    {expense.details}
                  </Text>
                )}
                <View style={styles.expenseUsers}>
                  {expense.users.map((user) => (
                    <Text key={user.user_id} style={styles.expenseUserDetail}>
                      {user.user?.first_name}: {currency?.symbol}
                      {user.owed_share}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noExpenses}>
            <Text style={styles.noExpensesText}>No expenses found</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          router.push("/add");
        }}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBlockStart: 0,
  },
  expensesList: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  message: {
    fontSize: 16,
    color: "#f3f3f3",
    textAlign: "center",
  },
  userList: {
    flex: 1,
  },
  userSection: {
    marginBottom: 24,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  userTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.tint,
  },
  itemList: {
    flexGrow: 0,
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 12,
    color: "#666",
  },
  selectedItems: {
    maxHeight: 120,
  },
  selectedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedItemName: {
    fontSize: 14,
    color: "#333",
  },
  selectedItemPrice: {
    fontSize: 14,
    color: "#666",
  },
  splitButton: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  splitButtonDisabled: {
    opacity: 0.5,
  },
  splitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  expenseItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  expenseDate: {
    fontSize: 14,
    color: "#666",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.tint,
  },
  expenseDescription: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  expenseUsers: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  expenseUserDetail: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  noExpenses: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noExpensesText: {
    fontSize: 16,
    color: "#666",
  },
  expenseDetails: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
    paddingVertical: 4,
  },
});
