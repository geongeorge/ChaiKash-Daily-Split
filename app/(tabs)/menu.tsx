import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Text,
  Pressable,
  Alert,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { type Currency, storage, STORAGE_KEYS } from "@/lib/storage";
import { useMMKVObject } from "react-native-mmkv";
import { Stack } from "expo-router";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export default function MenuScreen() {
  const [items, setItems] = useMMKVObject<MenuItem[]>(
    STORAGE_KEYS.MENU_ITEMS,
    storage
  );
  const [currency] = useMMKVObject<Currency>(STORAGE_KEYS.CURRENCY, storage);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleAddItem = () => {
    setEditingItem(null);
    setItemName("");
    setItemPrice("");
    setDialogVisible(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setDialogVisible(true);
  };

  const handleSaveItem = () => {
    if (!itemName || !itemPrice) return;

    const price = Number.parseFloat(itemPrice);
    if (Number.isNaN(price)) return;

    if (editingItem) {
      // Edit existing item
      const newItems = items?.map((item) =>
        item.id === editingItem.id ? { ...item, name: itemName, price } : item
      );
      setItems(newItems || []);
    } else {
      // Add new item
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: itemName,
        price,
      };
      setItems([...(items || []), newItem]);
    }

    setDialogVisible(false);
    setEditingItem(null);
    setItemName("");
    setItemPrice("");
  };

  const handleSelectItem = (item: MenuItem) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      "Delete Items",
      `Are you sure you want to delete ${selectedItems.size} items?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newItems = items?.filter(
              (item) => !selectedItems.has(item.id)
            );
            setItems(newItems || []);
            setSelectedItems(new Set());
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const jsonString = JSON.stringify(items || []);
      await Clipboard.setString(jsonString);
      Alert.alert("Success", "Menu items copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy menu items");
    }
  };

  const handleImport = async () => {
    try {
      const content = await Clipboard.getString();
      const parsedItems = JSON.parse(content);

      if (!Array.isArray(parsedItems)) {
        throw new Error("Invalid format");
      }

      // Validate each item has required fields
      const isValid = parsedItems.every(
        (item) =>
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.price === "number"
      );

      if (!isValid) {
        throw new Error("Invalid item format");
      }

      setItems(parsedItems);
      Alert.alert("Success", "Menu items imported successfully");
    } catch (error) {
      Alert.alert("Error", "Invalid menu items data in clipboard");
    }
  };

  const handleDeleteItem = (item: MenuItem) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete "${item.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newItems = items?.filter((i) => i.id !== item.id);
            setItems(newItems || []);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleImport}
              >
                <Ionicons name="download-outline" size={22} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleExport}
              >
                <Ionicons name="share-outline" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {!items || items?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No items yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to add your first item
            </Text>
          </View>
        ) : (
          items?.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Pressable
                style={[
                  styles.itemContent,
                  selectedItems.has(item.id) && styles.selectedItem,
                ]}
                onLongPress={() => handleSelectItem(item)}
                onPress={() => {
                  if (selectedItems.size > 0) {
                    handleSelectItem(item);
                  }
                }}
                android_ripple={{ color: "rgba(0, 0, 0, 0.05)" }}
              >
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    {currency?.symbol}
                    {Number(item.price).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  {selectedItems.size === 0 && (
                    <>
                      <TouchableOpacity
                        style={[styles.iconButton, styles.inlineButton]}
                        onPress={() => handleEditItem(item)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color="#64748B"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconButton, styles.inlineDeleteButton]}
                        onPress={() => handleDeleteItem(item)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#99A1B3"
                        />
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedItems.has(item.id) && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.light.tint}
                      />
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {selectedItems.size > 0 ? (
        <TouchableOpacity
          style={[styles.fab, styles.fabDelete]}
          onPress={handleDeleteSelected}
        >
          <Ionicons name="trash" size={24} color="white" />
          <Text style={styles.fabText}>{selectedItems.size}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.fab} onPress={handleAddItem}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}

      <Modal
        visible={dialogVisible}
        onRequestClose={() => setDialogVisible(false)}
        transparent
        animationType="fade"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlayWrapper}
        >
          <TouchableWithoutFeedback onPress={() => setDialogVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {editingItem ? "Edit Item" : "Add New Item"}
                  </Text>

                  <TextInput
                    placeholder="Item Name"
                    value={itemName}
                    onChangeText={setItemName}
                    style={styles.textInput}
                  />
                  <TextInput
                    placeholder={`Price (${currency?.symbol})`}
                    value={itemPrice}
                    onChangeText={setItemPrice}
                    keyboardType="decimal-pad"
                    style={styles.textInput}
                  />

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setDialogVisible(false)}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={handleSaveItem}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 8,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1E293B",
  },
  itemPrice: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  inlineButton: {
    backgroundColor: "transparent",
  },
  inlineDeleteButton: {
    backgroundColor: "transparent",
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginTop: 32,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1E293B",
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOverlayWrapper: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1E293B",
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
  },
  buttonText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "600",
  },
  modalText: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 24,
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: "#F1F5F9",
  },
  selectedIndicator: {
    padding: 8,
  },
  fabDelete: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 8,
    width: "auto",
  },
  fabText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
