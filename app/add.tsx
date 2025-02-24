import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from "react-native";
import {
  Text,
  Button,
  Surface,
  Chip,
  Card,
  useTheme,
  TextInput,
} from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import { storage, STORAGE_KEYS, type Currency } from "@/lib/storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SplitwiseService, { type SplitwiseUser } from "@/services/splitwise";
import { Colors } from "@/constants/Colors";

export interface MenuItem {
  id: string;
  name: string;
  price: string | number;
  tags?: string[];
}

interface UserExpense {
  userId: number;
  userName: string;
  items: MenuItem[];
  total: number;
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: Colors.light.background,
    },
    content: {
      padding: 16,
      borderRadius: 8,
      backgroundColor: Colors.light.background,
    },
    title: {
      marginBottom: 24,
      color: Colors.light.text,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
      color: Colors.light.text,
    },
    userChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      marginBottom: 8,
      backgroundColor: "#F3F4F6",
    },
    userSection: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: "#F9FAFB",
      borderRadius: 8,
    },
    menuItems: {
      marginVertical: 8,
    },
    menuItem: {
      backgroundColor: Colors.light.background,
      padding: 12,
      borderRadius: 8,
      marginRight: 8,
      minWidth: 120,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      alignItems: "center",
      justifyContent: "center",
    },
    menuItemName: {
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 4,
      color: "#111827",
    },
    menuItemPrice: {
      fontSize: 12,
      color: "#6B7280",
    },
    selectedItems: {
      marginTop: 8,
    },
    selectedItem: {
      marginTop: 4,
      backgroundColor: "#F3F4F6",
    },
    total: {
      marginTop: 8,
      fontWeight: "bold",
      color: Colors.light.text,
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
      backgroundColor: Colors.light.background,
    },
    tagFilters: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    tagChip: {
      marginBottom: 4,
      backgroundColor: "#F3F4F6",
    },
    menuItemTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      marginVertical: 4,
      justifyContent: "center",
    },
    menuItemTag: {
      fontSize: 10,
      color: "#4B5563",
      backgroundColor: "#F3F4F6",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    totalSection: {
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: "600",
      color: "#111827",
      textAlign: "right",
    },
    totalLabel: {
      fontSize: 14,
      color: "#6B7280",
      marginBottom: 4,
      textAlign: "right",
    },
    summaryButton: {
      marginTop: 16,
      backgroundColor: "#FAFAFA",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      width: "100%",
    },
  });

export default function AddScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [token] = useMMKVString(STORAGE_KEYS.TOKEN, storage);
  const [groupId] = useMMKVString(STORAGE_KEYS.GROUP_ID, storage);
  const [menuItems] = useMMKVObject<MenuItem[]>(
    STORAGE_KEYS.MENU_ITEMS,
    storage
  );
  const [currency] = useMMKVObject<Currency>(STORAGE_KEYS.CURRENCY, storage);
  const [selectedUsers, setSelectedUsers] = useState<UserExpense[]>([]);
  const [expenseName, setExpenseName] = useState("Split bill");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  // Get unique tags from menu items
  const uniqueTags = React.useMemo(() => {
    const tags = new Set<string>();
    if (menuItems) {
      for (const item of menuItems) {
        if (item.tags) {
          for (const tag of item.tags) {
            tags.add(tag);
          }
        }
      }
    }
    return Array.from(tags);
  }, [menuItems]);

  // Filter menu items based on selected tag
  const filteredMenuItems = React.useMemo(() => {
    if (!selectedTag) return menuItems;
    return menuItems?.filter((item) => item.tags?.includes(selectedTag)) || [];
  }, [menuItems, selectedTag]);

  const addItemToUser = (userId: number, item: MenuItem) => {
    setSelectedUsers((current) =>
      current.map((userExp) => {
        if (userExp.userId === userId) {
          const updatedItems = [...userExp.items, item];
          return {
            ...userExp,
            items: updatedItems,
            total: updatedItems.reduce(
              (sum, item) => sum + Number.parseFloat(item.price.toString()),
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
              (sum, item) => sum + Number.parseFloat(item.price.toString()),
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

  const generateSummary = () => {
    let summary = "Split Bill Summary\n\n";

    for (const user of selectedUsers) {
      if (user.items.length > 0) {
        summary += `${user.userName}:\n`;
        for (const item of user.items) {
          summary += `- ${item.name}: ${currency?.symbol}${item.price}\n`;
        }
        summary += `Total: ${currency?.symbol}${user.total.toFixed(2)}\n\n`;
      }
    }

    const totalAmount = selectedUsers.reduce(
      (sum, user) => sum + user.total,
      0
    );
    summary += `Total Split Amount: ${currency?.symbol}${totalAmount.toFixed(
      2
    )}`;

    return summary;
  };

  const handleCopySummary = async () => {
    try {
      await Share.share({
        message: generateSummary(),
      });
    } catch (error) {
      console.error("Error sharing summary:", error);
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
              <View style={styles.tagFilters}>
                <Chip
                  selected={selectedTag === null}
                  onPress={() => setSelectedTag(null)}
                  style={styles.tagChip}
                  textStyle={{ color: "#4B5563" }}
                  selectedColor={Colors.light.tint}
                >
                  All
                </Chip>
                {uniqueTags.map((tag) => (
                  <Chip
                    key={tag}
                    selected={selectedTag === tag}
                    onPress={() => setSelectedTag(tag)}
                    style={styles.tagChip}
                    textStyle={{ color: "#4B5563" }}
                    selectedColor={Colors.light.tint}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
              {selectedUsers.map((user) => (
                <View key={user.userId} style={styles.userSection}>
                  <Text variant="titleSmall">{user.userName}</Text>
                  <ScrollView horizontal style={styles.menuItems}>
                    {filteredMenuItems?.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => addItemToUser(user.userId, item)}
                      >
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <View style={styles.menuItemTags}>
                          {item.tags?.map((tag) => (
                            <Text key={tag} style={styles.menuItemTag}>
                              {tag}
                            </Text>
                          ))}
                        </View>
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
                          textStyle={{ color: "#4B5563" }}
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

              {selectedUsers.some((user) => user.items.length > 0) && (
                <>
                  <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>
                      {currency?.symbol}
                      {selectedUsers
                        .reduce((sum, user) => sum + user.total, 0)
                        .toFixed(2)}
                    </Text>
                  </View>
                  <Button
                    mode="outlined"
                    onPress={handleCopySummary}
                    style={styles.summaryButton}
                    textColor="#6B7280"
                    icon="content-copy"
                  >
                    Copy Summary
                  </Button>
                </>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={[styles.button, { borderColor: "#E5E7EB" }]}
              textColor="#4B5563"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={createSplitExpense}
              style={styles.button}
              buttonColor={Colors.light.tint}
              textColor="#FFFFFF"
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
