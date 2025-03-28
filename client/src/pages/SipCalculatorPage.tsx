import FinanceNavbar from "@/components/FinanceNavbar";
import FinanceFooter from "@/components/FinanceFooter";
import SipCalculator from "@/components/calculators/SipCalculator";

export default function SipCalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <FinanceNavbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">        
        <SipCalculator />
      </main>
      
      <FinanceFooter />
    </div>
  );
}