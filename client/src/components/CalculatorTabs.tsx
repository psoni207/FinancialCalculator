import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SipCalculator from "@/components/calculators/SipCalculator";
import SwpCalculator from "@/components/calculators/SwpCalculator";
import EmiCalculator from "@/components/calculators/EmiCalculator";
import InflationCalculator from "@/components/calculators/InflationCalculator";
import { DollarSign, PiggyBank, CreditCard, TrendingUp } from "lucide-react";

export default function CalculatorTabs() {
  const [activeTab, setActiveTab] = useState("sip");

  return (
    <Tabs defaultValue="sip" className="w-full" onValueChange={setActiveTab} value={activeTab}>
      <TabsList className="mb-8 grid grid-cols-4 h-auto border-b rounded-none w-full bg-transparent p-0">
        <TabsTrigger 
          value="sip" 
          className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent py-3 px-4"
        >
          <DollarSign className="h-4 w-4" />
          <span>SIP Calculator</span>
        </TabsTrigger>
        <TabsTrigger 
          value="swp" 
          className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent py-3 px-4"
        >
          <PiggyBank className="h-4 w-4" />
          <span>SWP Calculator</span>
        </TabsTrigger>
        <TabsTrigger 
          value="emi" 
          className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent py-3 px-4"
        >
          <CreditCard className="h-4 w-4" />
          <span>Loan EMI Calculator</span>
        </TabsTrigger>
        <TabsTrigger 
          value="inflation" 
          className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent py-3 px-4"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Inflation Calculator</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="sip">
        <SipCalculator />
      </TabsContent>
      <TabsContent value="swp">
        <SwpCalculator />
      </TabsContent>
      <TabsContent value="emi">
        <EmiCalculator />
      </TabsContent>
      <TabsContent value="inflation">
        <InflationCalculator />
      </TabsContent>
    </Tabs>
  );
}
