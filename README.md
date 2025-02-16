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

## Development

This app is built with:

- React Native
- Expo
- Splitwise API
- MMKV for local data persistence
