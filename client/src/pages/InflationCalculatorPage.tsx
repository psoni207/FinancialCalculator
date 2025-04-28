import InflationCalculator from "@/components/calculators/InflationCalculator";
import FinanceNavbar from "@/components/FinanceNavbar";
import FinanceFooter from "@/components/FinanceFooter";

export default function InflationCalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <FinanceNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Inflation Calculator</h1>
          <p className="text-muted-foreground mt-2">
            Calculate how inflation impacts your money's purchasing power over time
          </p>
        </div>
        <InflationCalculator />
      </main>
      
      <FinanceFooter />
    </div>
  );
}