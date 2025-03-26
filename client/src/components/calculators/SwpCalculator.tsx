import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SliderInput from "@/components/ui/slider-input";
import { Button } from "@/components/ui/button";
import { formatCurrency, calculateSwp } from "@/lib/finance-calculations";
import { Info, LineChart, Table as TableIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SwpCalculator() {
  const [initialInvestment, setInitialInvestment] = useState(1000000);
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(5000);
  const [returnRate, setReturnRate] = useState(8);
  const [timePeriod, setTimePeriod] = useState(20);
  const [isCalculated, setIsCalculated] = useState(false);
  const [resultView, setResultView] = useState<"graph" | "table">("graph");

  const { data, refetch, isLoading } = useQuery({
    queryKey: [`/api/calculators/swp?initialInvestment=${initialInvestment}&monthlyWithdrawal=${monthlyWithdrawal}&returnRate=${returnRate}&timePeriod=${timePeriod}`],
    enabled: isCalculated,
  });

  const results = data || calculateSwp(initialInvestment, monthlyWithdrawal, returnRate, timePeriod);

  const chartData = {
    labels: results.yearlyData.map(item => `Year ${item.year}`),
    datasets: [
      {
        label: 'Remaining Balance',
        data: results.yearlyData.map(item => item.balance),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let value = context.raw;
            return 'Balance: ' + formatCurrency(Math.max(0, value));
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '₹' + (value / 100000).toFixed(1) + 'L';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Years'
        }
      }
    }
  };

  function handleCalculate() {
    setIsCalculated(true);
    refetch();
  }

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-8">
      {/* Input Form */}
      <Card className="mb-6 lg:mb-0">
        <CardHeader className="bg-primary text-white">
          <CardTitle>SWP Calculator</CardTitle>
          <CardDescription className="text-primary-100">
            Plan your systematic withdrawals
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <SliderInput 
            label="Initial Investment"
            value={initialInvestment}
            min={100000}
            max={10000000}
            step={50000}
            onChange={setInitialInvestment}
            suffix="₹"
          />
          
          <SliderInput 
            label="Monthly Withdrawal"
            value={monthlyWithdrawal}
            min={1000}
            max={100000}
            step={1000}
            onChange={setMonthlyWithdrawal}
            suffix="₹"
          />
          
          <SliderInput 
            label="Expected Return Rate"
            value={returnRate}
            min={1}
            max={20}
            step={0.1}
            onChange={setReturnRate}
            suffix="%"
          />
          
          <SliderInput 
            label="Time Period"
            value={timePeriod}
            min={1}
            max={40}
            step={1}
            onChange={setTimePeriod}
            suffix="years"
          />

          <Button 
            onClick={handleCalculate} 
            className="w-full mt-4"
            disabled={isLoading}
          >
            Calculate
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      <Card>
        <CardHeader className="bg-green-600 text-white">
          <CardTitle>SWP Results</CardTitle>
          <CardDescription className="text-green-100">
            Visualize your withdrawal plan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Initial Investment</p>
              <p className="text-xl font-mono font-semibold">
                {formatCurrency(initialInvestment)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Withdrawal</p>
              <p className="text-xl font-mono font-semibold text-green-600 dark:text-green-500">
                {formatCurrency(results.totalWithdrawal)}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Final Balance</p>
              <p className="text-xl font-mono font-semibold text-primary">
                {formatCurrency(results.finalBalance)}
              </p>
            </div>
          </div>

          <Tabs defaultValue="graph" className="mb-6" onValueChange={(value) => setResultView(value as "graph" | "table")}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="graph" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span>Graph</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                <span>Table</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="graph" className="mt-0">
              <div className="h-64 mb-4">
                <Line data={chartData} options={chartOptions} />
              </div>
            </TabsContent>
            
            <TabsContent value="table" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>By end of year</TableHead>
                      <TableHead className="text-right">Withdrawal Amount</TableHead>
                      <TableHead className="text-right">Remaining Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.yearlyData && results.yearlyData.map((row) => (
                      <TableRow key={row.year} className={row.year % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/50" : ""}>
                        <TableCell>{row.yearLabel}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.withdrawalAmount)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1 text-primary" /> 
              About SWP Calculator
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              A Systematic Withdrawal Plan (SWP) allows you to withdraw a fixed amount at regular intervals from your investment. 
              This calculator helps you plan your withdrawals while considering investment growth.
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Note:</span> If the final balance reaches zero before your planned period, 
              your withdrawal rate may be unsustainable.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
