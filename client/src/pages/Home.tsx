import FinanceHeader from "@/components/FinanceHeader";
import FinanceFooter from "@/components/FinanceFooter";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <FinanceHeader />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Welcome to Finance Tools
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Make informed financial decisions with our comprehensive suite of tools and calculators.
            Learn about investments, loans, and financial planning.
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation('/calculators')}
            className="bg-primary hover:bg-primary/90"
          >
            Explore Financial Calculators
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Investment Knowledge</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Learn about different investment strategies, risk management, and how to build a diversified portfolio.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Financial Planning</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Understand the importance of financial planning, budgeting, and setting clear financial goals.
            </p>
          </div>
        </div>
      </main>

      <FinanceFooter />
    </div>
  );
}