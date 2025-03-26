import { users, calculatorHistory, PREMIUM_CALCULATORS, type User, type InsertUser, type CalculatorHistory, type InsertCalculatorHistory } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { db } from "./db";

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPremiumAccess(userId: number, hasPremiumAccess: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Calculator history methods
  getCalculatorHistory(userId: number): Promise<CalculatorHistory[]>;
  saveCalculatorHistory(history: InsertCalculatorHistory): Promise<CalculatorHistory>;
  
  // Access check
  hasAccessToCalculator(userId: number | undefined, calculatorType: string): Promise<boolean>;
}

export class PostgresStorage implements IStorage {
  constructor() {
    this.initDb();
  }

  // Initialize the database
  private async initDb() {
    // No need to create tables as they are managed by Drizzle migrations
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const result = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    
    return result[0];
  }

  async updateUserPremiumAccess(userId: number, hasPremiumAccess: boolean): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ hasPremiumAccess })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Calculator history methods
  async getCalculatorHistory(userId: number): Promise<CalculatorHistory[]> {
    return await db
      .select()
      .from(calculatorHistory)
      .where(eq(calculatorHistory.userId, userId));
  }

  async saveCalculatorHistory(history: InsertCalculatorHistory): Promise<CalculatorHistory> {
    const result = await db
      .insert(calculatorHistory)
      .values(history)
      .returning();
    
    return result[0];
  }

  // Access check
  async hasAccessToCalculator(userId: number | undefined, calculatorType: string): Promise<boolean> {
    // Free calculators are accessible to everyone
    if (!PREMIUM_CALCULATORS.includes(calculatorType)) {
      return true;
    }
    
    // Premium calculators require authentication
    if (!userId) {
      return false;
    }
    
    // Check if user has premium access
    const user = await this.getUser(userId);
    return !!user?.hasPremiumAccess;
  }
  
  // Utility method to verify password
  async verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }
}

export const storage = new PostgresStorage();
