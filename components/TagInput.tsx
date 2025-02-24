import React, { useState, useMemo } from "react";
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getColorFromString } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: Set<string>;
  placeholder?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions = new Set(),
  placeholder = "Add tags...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!inputValue) return Array.from(suggestions);
    return Array.from(suggestions).filter(
      (tag) =>
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(tag)
    );
  }, [suggestions, inputValue, value]);

  const handleAddTag = (tag: string) => {
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <View style={styles.container}>
      <View style={styles.tagList}>
        {value.map((tag) => (
          <View
            key={tag}
            style={[styles.tag, { backgroundColor: getColorFromString(tag) }]}
          >
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity
              onPress={() => handleRemoveTag(tag)}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={16} color="#1E293B" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          style={styles.input}
          onFocus={() => setShowSuggestions(true)}
          onSubmitEditing={() => handleAddTag(inputValue.trim())}
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <View style={styles.suggestions}>
            <ScrollView style={styles.suggestionsScroll}>
              {filteredSuggestions.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.suggestion}
                  onPress={() => handleAddTag(tag)}
                >
                  <View
                    style={[
                      styles.suggestionTag,
                      { backgroundColor: getColorFromString(tag) },
                    ]}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  removeButton: {
    padding: 2,
  },
  inputContainer: {
    position: "relative",
    zIndex: 1,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  suggestions: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 12,
    maxHeight: 200,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsScroll: {
    maxHeight: 200,
  },
  suggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  suggestionTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
