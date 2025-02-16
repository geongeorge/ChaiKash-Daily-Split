import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import {
  List,
  FAB,
  TextInput,
  Button,
  Text,
  Divider,
  Portal,
  Dialog,
  IconButton,
} from "react-native-paper";
import { type Currency, storage, STORAGE_KEYS } from "@/lib/storage";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";

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
  const [currency, setCurrency] = useMMKVObject<Currency>(
    STORAGE_KEYS.CURRENCY,
    storage
  );

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

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

  const handleDeleteItem = (id: string) => {
    const newItems = items?.filter((item) => item.id !== id);
    setItems(newItems || []);
  };

  const handleDeleteConfirmed = () => {
    if (!deleteItemId) return;
    handleDeleteItem(deleteItemId);
    setDeleteItemId(null);
  };

  return (
    <Portal.Host>
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <List.Section>
            {!items || items?.length === 0 ? (
              <List.Item
                title="No items yet"
                description="Tap the + button to add your first item"
                onPress={() => handleAddItem()}
              />
            ) : (
              items?.map((item) => (
                <React.Fragment key={item.id}>
                  <List.Item
                    title={item.name}
                    onLongPress={() => setDeleteItemId(item.id)}
                    description={`${currency?.symbol}${item.price.toFixed(2)}`}
                    right={(props) => (
                      <View style={styles.itemActions}>
                        <Button {...props} onPress={() => handleEditItem(item)}>
                          Edit
                        </Button>
                      </View>
                    )}
                  />
                  <Divider />
                </React.Fragment>
              ))
            )}
          </List.Section>
        </ScrollView>

        <Portal>
          <FAB icon="plus" style={styles.fab} onPress={handleAddItem} />
        </Portal>

        <Portal>
          <Dialog
            visible={deleteItemId !== null}
            onDismiss={() => setDeleteItemId(null)}
          >
            <Dialog.Title>Delete Menu Item</Dialog.Title>
            <Dialog.Content>
              <Text>
                Are you sure you want to delete this menu item? This action
                cannot be undone.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteItemId(null)}>Cancel</Button>
              <Button onPress={handleDeleteConfirmed} textColor="red">
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Modal
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
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
                    <Text variant="headlineSmall" style={styles.modalTitle}>
                      {editingItem ? "Edit Item" : "Add New Item"}
                    </Text>

                    <TextInput
                      label="Item Name"
                      value={itemName}
                      onChangeText={setItemName}
                      style={styles.input}
                    />
                    <TextInput
                      label={`Price (${currency?.symbol})`}
                      value={itemPrice}
                      onChangeText={setItemPrice}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      inputMode="numeric"
                    />

                    <View style={styles.buttonContainer}>
                      <Button onPress={() => setDialogVisible(false)}>
                        Cancel
                      </Button>
                      <Button mode="contained" onPress={handleSaveItem}>
                        Save
                      </Button>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </Portal.Host>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    position: "relative",
  },
  content: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 90,
    margin: 0,
    zIndex: 1, // Add this line
  },
  input: {
    marginBottom: 12,
  },
  modalOverlayWrapper: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    width: "100%",
    maxWidth: 500,
  },
  modalTitle: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
    paddingBottom: 8,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
});
