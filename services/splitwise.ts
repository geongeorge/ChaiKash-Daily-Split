import { MenuItem } from "@/app/add";

const API_BASE_URL = "https://secure.splitwise.com/api/v3.0";

export interface SplitwiseGroup {
  id: number;
  name: string;
  group_type: string;
  updated_at: string;
  members: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

export interface SplitwiseExpense {
  id: number;
  group_id: number;
  description: string;
  cost: string;
  currency_code: string;
  created_at: string;
  details: string;
  users: Array<{
    user_id: number;
    paid_share: string;
    owed_share: string;
    user: {
      first_name: string;
      last_name: string;
    };
  }>;
}

export interface SplitwiseUser {
  id: number;
  first_name: string;
  last_name: string;
}

interface CreateExpenseParams {
  cost: number;
  description: string;
  currencyCode: string;
  groupId: number;
  payerId: number;
  splits: Array<{
    userName: string;
    userId: number;
    amount: number;
    items: Array<MenuItem>;
  }>;
}

class SplitwiseService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Splitwise API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentUser(): Promise<SplitwiseUser> {
    const response = await this.request<{ user: SplitwiseUser }>(
      "/get_current_user"
    );
    return response.user;
  }

  async getGroups(): Promise<SplitwiseGroup[]> {
    const response = await this.request<{ groups: SplitwiseGroup[] }>(
      "/get_groups"
    );
    return response.groups;
  }

  async getGroup(id: number): Promise<SplitwiseGroup> {
    const response = await this.request<{ group: SplitwiseGroup }>(
      `/get_group/${id}`
    );
    return response.group;
  }

  async createExpense({
    cost,
    description,
    currencyCode,
    groupId,
    payerId,
    splits,
  }: CreateExpenseParams): Promise<SplitwiseExpense> {
    const expenseData: Record<string, string | number | boolean> = {
      cost: cost.toFixed(2),
      description,
      currency_code: currencyCode,
      group_id: groupId,
      split_equally: false,
    };

    // Add splits for each user
    splits.forEach((split, index) => {
      const isPayer = split.userId === payerId;
      expenseData[`users__${index}__user_id`] = split.userId;
      expenseData[`users__${index}__paid_share`] = isPayer
        ? cost.toFixed(2)
        : "0.00";
      expenseData[`users__${index}__owed_share`] = split.amount.toFixed(2);
    });

    // In details add User name: items, Price: cost, Quantity: 1
    expenseData.details = splits
      .map((split) => {
        return `${split.userName}: ${split.items
          .map((item) => `${item.name}: ${item.price}`)
          .join(", ")}`;
      })
      .join(", ");

    console.log("expenseData", expenseData);

    const response = await this.request<{
      expense: SplitwiseExpense;
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      errors: any;
    }>("/create_expense", {
      method: "POST",
      body: JSON.stringify(expenseData),
    });

    if (Object.keys(response?.errors).length !== 0) {
      throw new Error(
        `Failed to create expense: ${JSON.stringify(response.errors)}`
      );
    }

    return response.expense;
  }

  async getExpenses(
    params: {
      group_id?: number;
      dated_after?: string;
      dated_before?: string;
      limit?: number;
    } = {}
  ): Promise<SplitwiseExpense[]> {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    }

    const response = await this.request<{ expenses: SplitwiseExpense[] }>(
      `/get_expenses?${queryParams.toString()}`
    );

    console.log(response);
    return response.expenses;
  }

  async getCurrencies(): Promise<
    Array<{ currency_code: string; unit: string }>
  > {
    const response = await this.request<{
      currencies: Array<{ currency_code: string; unit: string }>;
    }>("/get_currencies");
    return response.currencies;
  }

  async deleteExpense(expenseId: number): Promise<void> {
    const response = await this.request<{
      success: boolean;
      errors: unknown;
    }>(`/delete_expense/${expenseId}`, {
      method: "POST",
    });

    if (!response.success) {
      throw new Error(
        `Failed to delete expense: ${JSON.stringify(response.errors)}`
      );
    }
  }
}

export default SplitwiseService;
