import { MMKV } from "react-native-mmkv";

export const storage = new MMKV();

export const STORAGE_KEYS = {
  MENU_ITEMS: "@menu_items",
  CURRENCY: "@selected_currency",
  TOKEN: "@splitwise_token",
  GROUP_ID: "@splitwise_group_id",
  GROUP_NAME: "@splitwise_group_name",
  GROUP_MEMBERS: "@splitwise_group_members",
  GROUP_CURRENCY: "@splitwise_group_currency",
} as const;

export const CURRENCIES = [
  { label: "Indian Rupee (INR)", value: "INR", symbol: "₹" },
  { label: "US Dollar (USD)", value: "USD", symbol: "$" },
  { label: "Euro (EUR)", value: "EUR", symbol: "€" },
  { label: "British Pound (GBP)", value: "GBP", symbol: "£" },
];

export type Currency = (typeof CURRENCIES)[number];
