import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { 
  registerUserSchema, 
  loginUserSchema, 
  insertUserSchema, 
  calculatorAccessSchema,
  USER_ROLES,
  PREMIUM_CALCULATORS
} from "@shared/schema";
import { z } from "zod";

// Financial calculation functions
import { 
  calculateSip, 
  calculateSwp, 
  calculateEmi, 
  generateAmortizationSchedule,
  calculateLumpsum,
  calculateSipTopUp
} from "../client/src/lib/finance-calculations";

// Define types for the Express session
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  
  next();
};

// Calculator access middleware
const checkCalculatorAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calculatorType } = calculatorAccessSchema.parse(req.params);
    
    // Check if the calculator requires premium access
    if (!PREMIUM_CALCULATORS.includes(calculatorType)) {
      return next(); // Free calculator, allow access
    }
    
    // Check if user has premium access
    const hasAccess = await storage.hasAccessToCalculator(req.session.userId, calculatorType);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Premium Access Required", 
        message: "This calculator requires premium access. Please log in or contact your administrator." 
      });
    }
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "finance-tools-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
  
  // Passport setup
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        const isValid = await (storage as any).verifyPassword(password, user.password);
        
        if (!isValid) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }
      
      // Create user without the confirmPassword field
      const { confirmPassword, ...userToCreate } = userData;
      
      const user = await storage.createUser({
        ...userToCreate,
        role: USER_ROLES.USER,
        hasPremiumAccess: false,
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Set session
      req.session.userId = user.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  
  app.post("/api/login", async (req, res) => {
    try {
      const credentials = loginUserSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByUsername(credentials.username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Verify password
      const isPasswordValid = await (storage as any).verifyPassword(credentials.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, newPassword } = resetPasswordSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user's password in storage
      const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      res.json({ message: "Password reset successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Password reset failed" });
    }
  });
  
  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to retrieve user information" });
    }
  });
  
  // Admin routes for managing premium access
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = allUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  });
  
  app.patch("/api/admin/users/:id/premium", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const { hasPremiumAccess } = req.body;
      if (typeof hasPremiumAccess !== 'boolean') {
        return res.status(400).json({ error: "hasPremiumAccess must be a boolean" });
      }
      
      const updatedUser = await storage.updateUserPremiumAccess(userId, hasPremiumAccess);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating premium access:", error);
      res.status(500).json({ error: "Failed to update premium access" });
    }
  });
  
  // Calculator access check API
  app.get("/api/calculators/:calculatorType/access", async (req, res) => {
    try {
      const { calculatorType } = calculatorAccessSchema.parse(req.params);
      const hasAccess = await storage.hasAccessToCalculator(req.session.userId, calculatorType);
      
      res.json({ hasAccess });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to check calculator access" });
    }
  });
  // SIP Calculator API
  app.get('/api/calculators/sip', (req, res) => {
    const monthlyInvestment = parseFloat(req.query.monthlyInvestment as string);
    const returnRate = parseFloat(req.query.returnRate as string);
    const timePeriod = parseFloat(req.query.timePeriod as string);
    
    if (isNaN(monthlyInvestment) || isNaN(returnRate) || isNaN(timePeriod)) {
      return res.status(400).json({ error: 'Invalid parameters. All parameters must be numbers.' });
    }
    
    const result = calculateSip(monthlyInvestment, returnRate, timePeriod);
    res.json(result);
  });

  // SWP Calculator API
  app.get('/api/calculators/swp', (req, res) => {
    const initialInvestment = parseFloat(req.query.initialInvestment as string);
    const monthlyWithdrawal = parseFloat(req.query.monthlyWithdrawal as string);
    const returnRate = parseFloat(req.query.returnRate as string);
    const timePeriod = parseFloat(req.query.timePeriod as string);
    
    if (isNaN(initialInvestment) || isNaN(monthlyWithdrawal) || isNaN(returnRate) || isNaN(timePeriod)) {
      return res.status(400).json({ error: 'Invalid parameters. All parameters must be numbers.' });
    }
    
    const result = calculateSwp(initialInvestment, monthlyWithdrawal, returnRate, timePeriod);
    res.json(result);
  });

  // EMI Calculator API
  app.get('/api/calculators/emi', (req, res) => {
    const principal = parseFloat(req.query.principal as string);
    const rate = parseFloat(req.query.rate as string);
    const tenure = parseFloat(req.query.tenure as string);
    
    if (isNaN(principal) || isNaN(rate) || isNaN(tenure)) {
      return res.status(400).json({ error: 'Invalid parameters. All parameters must be numbers.' });
    }
    
    const result = calculateEmi(principal, rate, tenure);
    res.json(result);
  });

  // EMI Amortization Schedule API
  app.get('/api/calculators/emi/schedule', (req, res) => {
    const principal = parseFloat(req.query.principal as string);
    const rate = parseFloat(req.query.rate as string);
    const tenure = parseFloat(req.query.tenure as string);
    
    if (isNaN(principal) || isNaN(rate) || isNaN(tenure)) {
      return res.status(400).json({ error: 'Invalid parameters. All parameters must be numbers.' });
    }
    
    const result = generateAmortizationSchedule(principal, rate, tenure);
    res.json(result);
  });
  
  // Lumpsum Calculator API (Premium)
  app.get('/api/calculators/lumpsum', async (req, res) => {
    // Check premium access
    const hasAccess = await storage.hasAccessToCalculator(req.session.userId, 'lumpsum');
    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Premium Access Required", 
        message: "This calculator requires premium access. Please log in or contact your administrator." 
      });
    }
    
    const investmentAmount = parseFloat(req.query.investmentAmount as string);
    const returnRate = parseFloat(req.query.returnRate as string);
    const timePeriod = parseFloat(req.query.timePeriod as string);
    
    if (isNaN(investmentAmount) || isNaN(returnRate) || isNaN(timePeriod)) {
      return res.status(400).json({ error: 'Invalid parameters. All parameters must be numbers.' });
    }
    
    const result = calculateLumpsum(investmentAmount, returnRate, timePeriod);
    res.json(result);
  });
  
  // SIP Top-Up Calculator API (Premium)
  app.get('/api/calculators/sip-topup', async (req, res) => {
    // Check premium access
    const hasAccess = await storage.hasAccessToCalculator(req.session.userId, 'sip-topup');
    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Premium Access Required", 
        message: "This calculator requires premium access. Please log in or contact your administrator." 
      });
    }
    
    const initialInvestment = parseFloat(req.query.initialInvestment as string);
    const annualIncrease = parseFloat(req.query.annualIncrease as string);
    const returnRate = parseFloat(req.query.returnRate as string);
    const timePeriod = parseFloat(req.query.timePeriod as string);
    const frequency = (req.query.frequency as string) || 'monthly';
    
    if (isNaN(initialInvestment) || isNaN(annualIncrease) || isNaN(returnRate) || isNaN(timePeriod)) {
      return res.status(400).json({ error: 'Invalid parameters. All parameters must be numbers.' });
    }
    
    const result = calculateSipTopUp(initialInvestment, annualIncrease, returnRate, timePeriod, frequency as any);
    res.json(result);
  });

  const httpServer = createServer(app);
  return httpServer;
}
