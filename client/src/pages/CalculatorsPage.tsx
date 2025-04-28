import FinanceNavbar from "@/components/FinanceNavbar";
import FinanceFooter from "@/components/FinanceFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { DollarSign, PiggyBank, CreditCard, TrendingUp, BarChart3 } from "lucide-react";

const calculators = [
  {
    title: "SIP Calculator",
    description: "Calculate returns on your Systematic Investment Plans",
    href: "/calculators/sip",
    icon: <DollarSign className="h-10 w-10 text-blue-600" />
  },
  {
    title: "SWP Calculator",
    description: "Plan your systematic withdrawals with this calculator",
    href: "/calculators/swp",
    icon: <PiggyBank className="h-10 w-10 text-green-600" />
  },
  {
    title: "Loan EMI Calculator",
    description: "Calculate your loan EMI, total interest and payment schedules",
    href: "/calculators/emi",
    icon: <CreditCard className="h-10 w-10 text-purple-600" />
  },
  {
    title: "Inflation Calculator",
    description: "See how inflation impacts your money's purchasing power over time",
    href: "/calculators/inflation",
    icon: <TrendingUp className="h-10 w-10 text-red-600" />
  },
  {
    title: "SIP Top-Up Calculator",
    description: "See how increasing your SIP periodically accelerates wealth creation",
    href: "/calculators/sip-topup",
    icon: <TrendingUp className="h-10 w-10 text-blue-600" />
  },
  {
    title: "Lumpsum Calculator",
    description: "Calculate returns on one-time investment amount",
    href: "/calculators/lumpsum",
    icon: <BarChart3 className="h-10 w-10 text-indigo-600" />
  }
];

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <FinanceNavbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Financial Calculators
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Powerful tools to help you make informed financial decisions. Calculate investment returns, 
            withdrawal plans, and loan payments with ease.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculators.map((calculator) => (
            <div key={calculator.title} className="block h-full">
              <Link href={calculator.href}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center h-full">
                    <div className="mb-4 mt-2">{calculator.icon}</div>
                    <h2 className="text-xl font-semibold mb-2">{calculator.title}</h2>
                    <p className="text-gray-600">{calculator.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </main>
      
      <FinanceFooter />
    </div>
  );
}