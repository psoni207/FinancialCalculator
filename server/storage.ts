import { 
  PREMIUM_CALCULATORS, 
  USER_ROLES, 
  CLIENT_STATUS,
  type User, 
  type InsertUser, 
  type CalculatorHistory, 
  type InsertCalculatorHistory,
  type Client,
  type InsertClient
} from "@shared/schema";
import * as bcrypt from "bcrypt";
import session from "express-session";
import createMemoryStore from "memorystore";

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
  
  // Client management methods (admin only)
  getClient(id: number): Promise<Client | undefined>;
  getClientByClientId(clientId: string): Promise<Client | undefined>;
  getClientByPan(pan: string): Promise<Client | undefined>;
  getClientByAadhar(aadhar: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  getClientsByBroker(broker: string): Promise<Client[]>;
  getClientsByStatus(status: string): Promise<Client[]>;
  searchClients(query: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Access check
  hasAccessToCalculator(userId: number | undefined, calculatorType: string): Promise<boolean>;
  
  // Session store for Express
  sessionStore: session.Store;
}

// MemoryStorage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private calculatorHistories: CalculatorHistory[] = [];
  private clients: Client[] = [];
  sessionStore: session.Store;
  
  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create an admin user by default
    this.createUser({
      username: "admin",
      email: "admin@example.com",
      password: "admin123",
      role: USER_ROLES.ADMIN,
      hasPremiumAccess: true
    });
    
    // Create a normal user with premium access by default
    this.createUser({
      username: "premium",
      email: "premium@example.com",
      password: "premium123",
      role: USER_ROLES.USER,
      hasPremiumAccess: true
    });
    
    // Create a normal user without premium access by default
    this.createUser({
      username: "user",
      email: "user@example.com",
      password: "user123",
      role: USER_ROLES.USER,
      hasPremiumAccess: false
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const nextId = this.users.length > 0 
      ? Math.max(...this.users.map(user => user.id)) + 1 
      : 1;
    
    const newUser: User = {
      id: nextId,
      username: insertUser.username,
      email: insertUser.email,
      password: hashedPassword,
      role: insertUser.role || USER_ROLES.USER,
      hasPremiumAccess: insertUser.hasPremiumAccess || false,
      createdAt: new Date()
    };
    
    this.users.push(newUser);
    return newUser;
  }

  async updateUserPremiumAccess(userId: number, hasPremiumAccess: boolean): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      hasPremiumAccess
    };
    
    return this.users[userIndex];
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      password: newPassword
    };
    
    return this.users[userIndex];
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  // Calculator history methods
  async getCalculatorHistory(userId: number): Promise<CalculatorHistory[]> {
    return this.calculatorHistories.filter(history => history.userId === userId);
  }

  async saveCalculatorHistory(history: InsertCalculatorHistory): Promise<CalculatorHistory> {
    const nextId = this.calculatorHistories.length > 0 
      ? Math.max(...this.calculatorHistories.map(h => h.id)) + 1 
      : 1;
    
    // Ensure userId and createdAt are defined
    const userId = history.userId as number; // Since we defined it as notNull in schema
    const createdAt = new Date(); // Use current date
    
    const newHistory: CalculatorHistory = {
      id: nextId,
      userId: userId,
      calculatorType: history.calculatorType,
      parameters: history.parameters,
      result: history.result,
      createdAt: createdAt
    };
    
    this.calculatorHistories.push(newHistory);
    return newHistory;
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
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  // Client management methods
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.find(client => client.id === id);
  }

  async getClientByClientId(clientId: string): Promise<Client | undefined> {
    return this.clients.find(client => client.clientId === clientId);
  }

  async getClientByPan(pan: string): Promise<Client | undefined> {
    return this.clients.find(client => client.pan === pan);
  }

  async getClientByAadhar(aadhar: string): Promise<Client | undefined> {
    return this.clients.find(client => client.aadhar === aadhar);
  }

  async getAllClients(): Promise<Client[]> {
    return this.clients;
  }

  async getClientsByBroker(broker: string): Promise<Client[]> {
    return this.clients.filter(client => client.broker === broker);
  }

  async getClientsByStatus(status: string): Promise<Client[]> {
    return this.clients.filter(client => client.status === status);
  }

  async searchClients(query: string): Promise<Client[]> {
    const lowerQuery = query.toLowerCase();
    return this.clients.filter(client => 
      client.name.toLowerCase().includes(lowerQuery) ||
      client.clientId.toLowerCase().includes(lowerQuery) ||
      client.email.toLowerCase().includes(lowerQuery) ||
      client.pan.toLowerCase().includes(lowerQuery) ||
      client.aadhar.toLowerCase().includes(lowerQuery)
    );
  }

  async createClient(client: InsertClient): Promise<Client> {
    const nextId = this.clients.length > 0 
      ? Math.max(...this.clients.map(c => c.id)) + 1 
      : 1;
    
    const now = new Date();
    
    const newClient: Client = {
      id: nextId,
      clientId: client.clientId,
      name: client.name,
      broker: client.broker,
      contactNumber: client.contactNumber,
      email: client.email,
      pan: client.pan,
      aadhar: client.aadhar,
      status: client.status || CLIENT_STATUS.ACTIVE,
      fund: client.fund || "0",
      createdAt: now,
      updatedAt: now
    };
    
    this.clients.push(newClient);
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const clientIndex = this.clients.findIndex(c => c.id === id);
    if (clientIndex === -1) return undefined;
    
    this.clients[clientIndex] = {
      ...this.clients[clientIndex],
      ...client,
      updatedAt: new Date()
    };
    
    return this.clients[clientIndex];
  }

  async deleteClient(id: number): Promise<boolean> {
    const clientIndex = this.clients.findIndex(c => c.id === id);
    if (clientIndex === -1) return false;
    
    this.clients.splice(clientIndex, 1);
    return true;
  }
}

export const storage = new MemStorage();
