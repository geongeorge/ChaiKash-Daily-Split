import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import { getColorFromString } from "@/lib/utils";

interface TagsListProps {
  tags?: string[];
  style?: ViewStyle;
}

export function TagsList({ tags = [], style }: TagsListProps) {
  if (!tags?.length) return null;

  return (
    <View style={[styles.container, style]}>
      {tags.map((tag) => (
        <View
          key={tag}
          style={[
            styles.tag,
            { backgroundColor: `${getColorFromString(tag)}18` },
          ]}
        >
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
});
