// SIP Calculator Functions
export interface YearlySipBalance {
  year: number;
  yearLabel: string;
  investedAmount: number;
  balance: number;
}

export type InvestmentFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export function calculateSip(
  investmentAmount: number, 
  rateOfReturn: number, 
  timePeriod: number, 
  frequency: InvestmentFrequency = "monthly"
) {
  // Convert annual rate to periodic rate based on frequency
  let periodicRate: number;
  let periodsPerYear: number;
  let totalPeriods: number;

  switch (frequency) {
    case "daily":
      periodsPerYear = 365;
      periodicRate = rateOfReturn / 365 / 100;
      break;
    case "weekly":
      periodsPerYear = 52;
      periodicRate = rateOfReturn / 52 / 100;
      break;
    case "monthly":
      periodsPerYear = 12;
      periodicRate = rateOfReturn / 12 / 100;
      break;
    case "quarterly":
      periodsPerYear = 4;
      periodicRate = rateOfReturn / 4 / 100;
      break;
    case "yearly":
      periodsPerYear = 1;
      periodicRate = rateOfReturn / 100;
      break;
    default:
      periodsPerYear = 12;
      periodicRate = rateOfReturn / 12 / 100;
  }

  totalPeriods = timePeriod * periodsPerYear;
  const investedAmount = investmentAmount * totalPeriods;
  
  // Formula: P × ({[1 + r]^n - 1} ÷ r) × (1 + r)
  const futureValue = investmentAmount * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate) * (1 + periodicRate);
  const estimatedReturns = futureValue - investedAmount;
  
  // Generate yearly breakdown
  const yearlyData: YearlySipBalance[] = [];
  let runningInvestment = 0;
  let runningBalance = 0;
  
  const currentYear = new Date().getFullYear();
  
  for (let year = 1; year <= timePeriod; year++) {
    // Calculate amount invested in this year
    const yearlyInvestment = investmentAmount * periodsPerYear;
    runningInvestment += yearlyInvestment;
    
    // Calculate balance at end of this year
    const periodsToDate = year * periodsPerYear;
    runningBalance = investmentAmount * ((Math.pow(1 + periodicRate, periodsToDate) - 1) / periodicRate) * (1 + periodicRate);
    
    yearlyData.push({
      year,
      yearLabel: (currentYear + year - 1).toString(),
      investedAmount: runningInvestment,
      balance: Math.round(runningBalance)
    });
  }
  
  return {
    investedAmount: Math.round(investedAmount),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(futureValue),
    yearlyData
  };
}

// SWP Calculator Functions
export interface YearlySwpBalance {
  year: number;
  yearLabel: string;
  withdrawalAmount: number;
  balance: number;
}

export function calculateSwp(
  initialInvestment: number, 
  monthlyWithdrawal: number, 
  rateOfReturn: number, 
  timePeriod: number
) {
  const monthlyRate = rateOfReturn / 12 / 100;
  const months = timePeriod * 12;
  
  let balance = initialInvestment;
  let totalWithdrawal = 0;
  let yearlyWithdrawal = monthlyWithdrawal * 12;
  const yearlyData: YearlySwpBalance[] = [];
  
  const currentYear = new Date().getFullYear();
  
  for (let year = 1; year <= timePeriod; year++) {
    let yearEndBalance = balance;
    let thisYearWithdrawal = 0;
    
    for (let month = 1; month <= 12; month++) {
      // Apply monthly interest first
      yearEndBalance = yearEndBalance * (1 + monthlyRate);
      
      // Then withdraw the fixed amount
      yearEndBalance -= monthlyWithdrawal;
      thisYearWithdrawal += monthlyWithdrawal;
      totalWithdrawal += monthlyWithdrawal;
      
      // If balance goes negative, cap at 0 and break
      if (yearEndBalance < 0) {
        yearEndBalance = 0;
        break;
      }
    }
    
    yearlyData.push({
      year,
      yearLabel: (currentYear + year - 1).toString(),
      withdrawalAmount: Math.round(thisYearWithdrawal),
      balance: Math.max(0, Math.round(yearEndBalance))
    });
    
    balance = yearEndBalance;
    if (balance <= 0) break;
  }
  
  return {
    finalBalance: Math.max(0, Math.round(balance)),
    totalWithdrawal: Math.round(totalWithdrawal),
    yearlyWithdrawal: Math.round(yearlyWithdrawal),
    yearlyData
  };
}

// EMI Calculator Functions
export interface AmortizationEntry {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

export function calculateEmi(principal: number, rate: number, tenure: number) {
  const monthlyRate = rate / 12 / 100;
  const months = tenure * 12;
  
  // Formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  
  return {
    emi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment)
  };
}

export function generateAmortizationSchedule(principal: number, rate: number, tenure: number): AmortizationEntry[] {
  const monthlyRate = rate / 12 / 100;
  const months = tenure * 12;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  
  let balance = principal;
  const yearlyData: AmortizationEntry[] = [];
  
  for (let year = 1; year <= tenure; year++) {
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    
    for (let month = 1; month <= 12; month++) {
      if ((year - 1) * 12 + month <= months) {
        const interestForMonth = balance * monthlyRate;
        const principalForMonth = emi - interestForMonth;
        
        yearlyPrincipal += principalForMonth;
        yearlyInterest += interestForMonth;
        balance -= principalForMonth;
      }
    }
    
    yearlyData.push({
      year,
      principal: Math.round(yearlyPrincipal),
      interest: Math.round(yearlyInterest),
      balance: Math.max(0, Math.round(balance))
    });
  }
  
  return yearlyData;
}

// Lumpsum Calculator Functions
export interface YearlyLumpsumBalance {
  year: number;
  yearLabel: string;
  investedAmount: number;
  balance: number;
}

export function calculateLumpsum(investmentAmount: number, rateOfReturn: number, timePeriod: number) {
  const annualRate = rateOfReturn / 100;
  
  // Calculate future value
  const futureValue = investmentAmount * Math.pow(1 + annualRate, timePeriod);
  const estimatedReturns = futureValue - investmentAmount;
  
  // Generate yearly breakdown
  const yearlyData: YearlyLumpsumBalance[] = [];
  const currentYear = new Date().getFullYear();
  
  for (let year = 1; year <= timePeriod; year++) {
    // Calculate balance at end of this year
    const balance = investmentAmount * Math.pow(1 + annualRate, year);
    
    yearlyData.push({
      year,
      yearLabel: (currentYear + year - 1).toString(),
      investedAmount: investmentAmount,
      balance: Math.round(balance)
    });
  }
  
  return {
    investedAmount: investmentAmount,
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(futureValue),
    yearlyData
  };
}

// SIP Top-Up Calculator
export interface YearlySipTopUpBalance {
  year: number;
  yearLabel: string;
  investedAmount: number;
  balance: number;
}

export function calculateSipTopUp(
  investmentAmount: number, 
  annualIncreasePercentage: number,
  rateOfReturn: number, 
  timePeriod: number, 
  frequency: InvestmentFrequency = "monthly"
) {
  // Calculate periodic rates based on frequency
  let periodicRate: number;
  let periodsPerYear: number;

  switch (frequency) {
    case "daily":
      periodsPerYear = 365;
      periodicRate = rateOfReturn / 365 / 100;
      break;
    case "weekly":
      periodsPerYear = 52;
      periodicRate = rateOfReturn / 52 / 100;
      break;
    case "monthly":
      periodsPerYear = 12;
      periodicRate = rateOfReturn / 12 / 100;
      break;
    case "quarterly":
      periodsPerYear = 4;
      periodicRate = rateOfReturn / 4 / 100;
      break;
    case "yearly":
      periodsPerYear = 1;
      periodicRate = rateOfReturn / 100;
      break;
    default:
      periodsPerYear = 12;
      periodicRate = rateOfReturn / 12 / 100;
  }

  // Generate yearly breakdown
  const yearlyData: YearlySipTopUpBalance[] = [];
  let currentInvestmentAmount = investmentAmount;
  let totalInvestedAmount = 0;
  let futureValue = 0;
  
  const currentYear = new Date().getFullYear();
  
  for (let year = 1; year <= timePeriod; year++) {
    let yearlyInvestment = 0;
    
    // Update future value with returns from previous year
    futureValue = futureValue * (1 + periodicRate) ** periodsPerYear;
    
    // Add this year's investments
    for (let period = 0; period < periodsPerYear; period++) {
      yearlyInvestment += currentInvestmentAmount;
      futureValue += currentInvestmentAmount;
      
      // Apply periodic growth for the remaining periods in the year
      futureValue = futureValue * (1 + periodicRate) ** 1;
    }
    
    totalInvestedAmount += yearlyInvestment;
    
    yearlyData.push({
      year,
      yearLabel: (currentYear + year - 1).toString(),
      investedAmount: totalInvestedAmount,
      balance: Math.round(futureValue)
    });
    
    // Increase investment amount for next year
    if (year < timePeriod) {
      currentInvestmentAmount += currentInvestmentAmount * (annualIncreasePercentage / 100);
    }
  }
  
  return {
    investedAmount: Math.round(totalInvestedAmount),
    estimatedReturns: Math.round(futureValue - totalInvestedAmount),
    totalValue: Math.round(futureValue),
    yearlyData
  };
}

// Format currency to Indian Rupees format
export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}
