import { useState, type ReactNode } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MenuItem {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface MenuProps {
  trigger: ReactNode;
  items: MenuItem[];
}

export function Menu({ trigger, items }: MenuProps) {
  const [visible, setVisible] = useState(false);

  const handleClose = () => setVisible(false);

  const handlePress = (onPress: () => void) => {
    handleClose();
    onPress();
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)}>
        {trigger}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menu}>
                {items.map((item, index) => (
                  <TouchableOpacity
                    key={item.title}
                    style={[
                      styles.menuItem,
                      index < items.length - 1 && styles.menuItemBorder,
                    ]}
                    onPress={() => handlePress(item.onPress)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color="#64748B"
                      style={styles.menuItemIcon}
                    />
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.3)",
  },
  menu: {
    position: "absolute",
    top: 56,
    right: 16,
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#1E293B",
  },
});
