import {
  pgTable,
  text,
  serial,
  integer,
  decimal,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

// Base user model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default(USER_ROLES.USER),
  hasPremiumAccess: boolean("has_premium_access").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  hasPremiumAccess: true,
});

export const registerUserSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

// Calculator history model to store user calculation history
export const calculatorHistory = pgTable("calculator_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  calculatorType: text("calculator_type").notNull(), // 'sip', 'swp', 'emi'
  parameters: text("parameters").notNull(), // JSON string of parameters
  result: text("result").notNull(), // JSON string of result
  createdAt: timestamp("created_at").notNull().defaultNow(), // ISO date string
});

export const insertCalculatorHistorySchema = createInsertSchema(
  calculatorHistory,
).pick({
  userId: true,
  calculatorType: true,
  parameters: true,
  result: true,
  createdAt: true,
});

export type InsertCalculatorHistory = z.infer<
  typeof insertCalculatorHistorySchema
>;
export type CalculatorHistory = typeof calculatorHistory.$inferSelect;

// Define premium calculator types
export const PREMIUM_CALCULATORS: string[] = ["sip-topup", "lumpsum"];

// Type for calculator access check
export const calculatorAccessSchema = z.object({
  calculatorType: z.string(),
});

export type CalculatorAccessCheck = z.infer<typeof calculatorAccessSchema>;

// Client status options
export const CLIENT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

// Client model for admin management
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  name: text("name").notNull(),
  broker: text("broker").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  pan: text("pan").notNull().unique(),
  aadhar: text("aadhar").notNull().unique(),
  status: text("status").notNull().default(CLIENT_STATUS.ACTIVE),
  fund: decimal("fund", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  clientId: true,
  name: true,
  broker: true,
  contactNumber: true,
  email: true,
  pan: true,
  aadhar: true,
  status: true,
  fund: true,
});

export const clientSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  name: z.string().min(1, "Name is required"),
  broker: z.string().min(1, "Broker is required"),
  contactNumber: z.string().min(10, "Valid contact number is required"),
  email: z.string().email("Valid email is required"),
  pan: z.string().min(10, "Valid PAN number is required"),
  aadhar: z.string().min(12, "Valid Aadhar number is required"),
  status: z.enum([CLIENT_STATUS.ACTIVE, CLIENT_STATUS.INACTIVE]),
  fund: z.union([
    z.number().transform(val => val.toString()),
    z.string()
  ]),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type ClientInput = z.infer<typeof clientSchema>;
