import type { Expense, ExpenseCategory } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { expenseCategories, expenses } from "@/mocks/data";

export function getExpenses(branch?: string): Promise<Expense[]> {
  return request<Expense[]>(`/expenses?branch=${branch ?? ""}`, {}, () => {
    let list = [...expenses];
    if (branch && branch !== "all") list = list.filter((e) => e.branchId === branch || e.branchId === null);
    list.sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
    return delay(list);
  });
}

export function getUpcomingExpenses(branch?: string): Promise<Expense[]> {
  return request<Expense[]>(`/expenses/upcoming?branch=${branch ?? ""}`, {}, () => {
    let list = expenses.filter((e) => e.status !== "paid");
    if (branch && branch !== "all") list = list.filter((e) => e.branchId === branch || e.branchId === null);
    list.sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
    return delay(list);
  });
}

export function getExpenseCategories(): Promise<ExpenseCategory[]> {
  return request<ExpenseCategory[]>("/expense-categories", {}, () => delay([...expenseCategories]));
}

export function saveExpense(e: Expense): Promise<Expense> {
  return request<Expense>(
    e.id ? `/expenses/${e.id}` : "/expenses",
    { method: e.id ? "PUT" : "POST", body: e },
    () => {
      if (e.id) {
        const i = expenses.findIndex((x) => x.id === e.id);
        if (i >= 0) expenses[i] = e;
      } else {
        e.id = `e${expenses.length + 1}`;
        expenses.push(e);
      }
      return delay(e);
    },
  );
}

export function markExpensePaid(id: string): Promise<Expense> {
  return request<Expense>(`/expenses/${id}`, { method: "PUT", body: { status: "paid" } }, () => {
    const e = expenses.find((x) => x.id === id)!;
    e.status = "paid";
    e.paidDate = new Date().toISOString();
    return delay(e);
  });
}

export function saveCategory(name: string): Promise<ExpenseCategory> {
  return request<ExpenseCategory>("/expense-categories", { method: "POST", body: { name } }, () => {
    const cat = { id: `ec${expenseCategories.length + 1}`, name };
    expenseCategories.push(cat);
    return delay(cat);
  });
}
