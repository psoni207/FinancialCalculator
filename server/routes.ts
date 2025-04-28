import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as bcrypt from "bcrypt";
import { storage } from "./storage";
import { 
  registerUserSchema, 
  loginUserSchema, 
  insertUserSchema, 
  calculatorAccessSchema,
  resetPasswordSchema,
  clientSchema,
  USER_ROLES,
  PREMIUM_CALCULATORS,
  CLIENT_STATUS,
  InsertClient,
  User
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

// Passport.js user type declaration
declare global {
  namespace Express {
    interface User extends Omit<import('@shared/schema').User, "password"> {}
  }
}

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (req.user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  
  return next();
};

// Calculator access middleware
const checkCalculatorAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calculatorType } = calculatorAccessSchema.parse(req.params);
    
    // Check if the calculator requires premium access
    if (!PREMIUM_CALCULATORS.includes(calculatorType)) {
      return next(); // Free calculator, allow access
    }
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Login required to access this calculator" });
    }
    
    // Check if user has premium access
    const hasAccess = await storage.hasAccessToCalculator(req.user.id, calculatorType);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Premium Access Required", 
        message: "This calculator requires premium access. Please contact your administrator." 
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
      store: storage.sessionStore,
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
      
      // Log the user in
      req.login(user, (err: any) => {
        if (err) {
          console.error("Error logging in after registration:", err);
          return res.status(500).json({ error: "Registration successful but login failed" });
        }
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  
  app.post("/api/login", (req, res, next) => {
    try {
      // Validate login data
      loginUserSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ error: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (err: any) => {
          if (err) {
            return next(err);
          }
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
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
  
  app.get("/api/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    res.json(req.user);
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
      
      if (!req.isAuthenticated()) {
        return res.json({ hasAccess: false });
      }
      
      const hasAccess = await storage.hasAccessToCalculator(req.user.id, calculatorType);
      
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
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        error: "Authentication Required", 
        message: "Please log in to access this calculator" 
      });
    }
    
    // Check premium access
    const hasAccess = await storage.hasAccessToCalculator(req.user.id, 'lumpsum');
    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Premium Access Required", 
        message: "This calculator requires premium access. Please contact your administrator." 
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
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        error: "Authentication Required", 
        message: "Please log in to access this calculator" 
      });
    }
    
    // Check premium access
    const hasAccess = await storage.hasAccessToCalculator(req.user.id, 'sip-topup');
    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Premium Access Required", 
        message: "This calculator requires premium access. Please contact your administrator." 
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

  // Client Management APIs (Admin Only)
  
  // Get all clients
  app.get('/api/admin/clients', isAdmin, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Failed to retrieve clients' });
    }
  });
  
  // Get client by ID
  app.get('/api/admin/clients/:id', isAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      if (isNaN(clientId)) {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      res.json(client);
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({ error: 'Failed to retrieve client' });
    }
  });
  
  // Create a new client
  app.post('/api/admin/clients', isAdmin, async (req, res) => {
    try {
      const clientData = clientSchema.parse(req.body);
      
      // Check for existing client with same client ID
      const existingClientId = await storage.getClientByClientId(clientData.clientId);
      if (existingClientId) {
        return res.status(400).json({ error: 'Client ID already exists' });
      }
      
      // Check for existing client with same PAN
      const existingPan = await storage.getClientByPan(clientData.pan);
      if (existingPan) {
        return res.status(400).json({ error: 'PAN number already exists' });
      }
      
      // Check for existing client with same Aadhar
      const existingAadhar = await storage.getClientByAadhar(clientData.aadhar);
      if (existingAadhar) {
        return res.status(400).json({ error: 'Aadhar number already exists' });
      }
      
      const newClient = await storage.createClient({
        ...clientData,
        // fund value is already converted to string by zod schema
      });
      
      res.status(201).json(newClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating client:', error);
      res.status(500).json({ error: 'Failed to create client' });
    }
  });
  
  // Update a client
  app.patch('/api/admin/clients/:id', isAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      if (isNaN(clientId)) {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      
      // Validate the update data
      const updateData = clientSchema.partial().parse(req.body);
      
      // Check if client exists
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      // Check for uniqueness if updating clientId
      if (updateData.clientId && updateData.clientId !== existingClient.clientId) {
        const existingClientId = await storage.getClientByClientId(updateData.clientId);
        if (existingClientId) {
          return res.status(400).json({ error: 'Client ID already exists' });
        }
      }
      
      // Check for uniqueness if updating PAN
      if (updateData.pan && updateData.pan !== existingClient.pan) {
        const existingPan = await storage.getClientByPan(updateData.pan);
        if (existingPan) {
          return res.status(400).json({ error: 'PAN number already exists' });
        }
      }
      
      // Check for uniqueness if updating Aadhar
      if (updateData.aadhar && updateData.aadhar !== existingClient.aadhar) {
        const existingAadhar = await storage.getClientByAadhar(updateData.aadhar);
        if (existingAadhar) {
          return res.status(400).json({ error: 'Aadhar number already exists' });
        }
      }
      
      // Fund value is already converted to string by zod schema
      
      const updatedClient = await storage.updateClient(clientId, updateData);
      if (!updatedClient) {
        return res.status(500).json({ error: 'Failed to update client' });
      }
      
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error updating client:', error);
      res.status(500).json({ error: 'Failed to update client' });
    }
  });
  
  // Delete a client
  app.delete('/api/admin/clients/:id', isAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      if (isNaN(clientId)) {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      
      const success = await storage.deleteClient(clientId);
      if (!success) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      res.json({ message: 'Client deleted successfully' });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ error: 'Failed to delete client' });
    }
  });
  
  // Search clients
  app.get('/api/admin/clients/search', isAdmin, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const results = await storage.searchClients(query);
      res.json(results);
    } catch (error) {
      console.error('Error searching clients:', error);
      res.status(500).json({ error: 'Failed to search clients' });
    }
  });
  
  // Get clients by broker
  app.get('/api/admin/clients/broker/:broker', isAdmin, async (req, res) => {
    try {
      const broker = req.params.broker;
      const clients = await storage.getClientsByBroker(broker);
      res.json(clients);
    } catch (error) {
      console.error('Error fetching clients by broker:', error);
      res.status(500).json({ error: 'Failed to retrieve clients' });
    }
  });
  
  // Get clients by status
  app.get('/api/admin/clients/status/:status', isAdmin, async (req, res) => {
    try {
      const status = req.params.status;
      if (status !== CLIENT_STATUS.ACTIVE && status !== CLIENT_STATUS.INACTIVE) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const clients = await storage.getClientsByStatus(status);
      res.json(clients);
    } catch (error) {
      console.error('Error fetching clients by status:', error);
      res.status(500).json({ error: 'Failed to retrieve clients' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
