import FinanceNavbar from "@/components/FinanceNavbar";
import FinanceFooter from "@/components/FinanceFooter";
import EmiCalculator from "@/components/calculators/EmiCalculator";

export default function EmiCalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <FinanceNavbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">        
        <EmiCalculator />
      </main>
      
      <FinanceFooter />
    </div>
  );
}