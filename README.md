# ChaiKash - Splitwise Expense Splitter

A React Native app that helps you split expenses among friends using Splitwise API. Perfect for splitting food and beverage bills where different people consume different items.

## Features

- Split expenses among Splitwise group members
- Maintain a menu of items with prices
- Easy to use interface for adding items to each person's bill
- Automatic expense creation in Splitwise
- Supports multiple currencies

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get your Splitwise API token:

   - Go to https://secure.splitwise.com/apps
   - Create a new application
   - Copy the API Key

3. Launch the app and go to Settings:
   - Paste your Splitwise API token
   - Select the group you want to split expenses with
   - Choose your preferred currency (default: INR)

## Usage

### Menu Items

1. Go to the "Menu Items" tab
2. Add items with their prices (e.g., Tea: ₹12, Coffee: ₹15)
3. These items will be saved for future use
4. You can update prices or delete items as needed

### Splitting Expenses

1. Go to the "Split" tab
2. For each person in the group:
   - Tap on menu items they consumed
   - Items will appear in their list with the total
3. To remove an item, tap on it in the person's list
4. When done, tap "Split Expense"
5. The expense will be created in Splitwise with:
   - The first person in the group as the payer
   - Each person's share based on their consumed items
   - A detailed description of what each person had

## Development

This app is built with:

- React Native
- Expo
- Splitwise API
- AsyncStorage for local data persistence

## Notes

- The app requires an active internet connection to sync with Splitwise
- Make sure your Splitwise token has the necessary permissions
- The app currently supports one group at a time
- Menu items are stored locally on your device
