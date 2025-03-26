import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SliderInput from "@/components/ui/slider-input";
import { Button } from "@/components/ui/button";
import { formatCurrency, calculateLumpsum } from "@/lib/finance-calculations";
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

export default function LumpsumCalculator() {
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [returnRate, setReturnRate] = useState(12);
  const [timePeriod, setTimePeriod] = useState(10);
  const [isCalculated, setIsCalculated] = useState(false);
  const [resultView, setResultView] = useState<"graph" | "table">("graph");

  const { data, refetch, isLoading } = useQuery({
    queryKey: [`/api/calculators/lumpsum?investmentAmount=${investmentAmount}&returnRate=${returnRate}&timePeriod=${timePeriod}`],
    enabled: isCalculated,
  });

  const results = data || calculateLumpsum(investmentAmount, returnRate, timePeriod);

  // For line chart
  const chartData = {
    labels: results.yearlyData ? results.yearlyData.map((data: any) => data.yearLabel) : [],
    datasets: [
      {
        label: 'Initial Investment',
        data: results.yearlyData ? results.yearlyData.map((data: any) => data.investedAmount) : [],
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.1,
        fill: false,
        borderDash: [5, 5]
      },
      {
        label: 'Expected Growth',
        data: results.yearlyData ? results.yearlyData.map((data: any) => data.balance) : [],
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
            return context.dataset.label + ': ' + formatCurrency(value);
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
          <CardTitle>Lumpsum Calculator</CardTitle>
          <CardDescription className="text-primary-100">
            Calculate returns on one-time investments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <SliderInput 
            label="Investment Amount"
            value={investmentAmount}
            min={10000}
            max={10000000}
            step={10000}
            onChange={setInvestmentAmount}
            suffix="₹"
          />
          
          <SliderInput 
            label="Expected Rate of Return"
            value={returnRate}
            min={1}
            max={30}
            step={0.5}
            onChange={setReturnRate}
            suffix="%"
          />
          
          <SliderInput 
            label="Time Period"
            value={timePeriod}
            min={1}
            max={30}
            step={1}
            onChange={setTimePeriod}
            suffix="Years"
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
          <CardTitle>Lumpsum Results</CardTitle>
          <CardDescription className="text-green-100">
            Visualize your long-term investment growth
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Initial Investment</p>
              <p className="text-xl font-mono font-semibold">
                {formatCurrency(investmentAmount)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expected Returns</p>
              <p className="text-xl font-mono font-semibold text-green-600 dark:text-green-500">
                {formatCurrency((results.finalValue || 0) - investmentAmount)}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Final Value</p>
              <p className="text-xl font-mono font-semibold text-primary">
                {formatCurrency(results.finalValue || 0)}
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
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Investment Amount</TableHead>
                      <TableHead className="text-right">Expected Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.yearlyData && results.yearlyData.map((row: any) => (
                      <TableRow key={row.year} className={row.year % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/50" : ""}>
                        <TableCell>{row.yearLabel}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.investedAmount)}</TableCell>
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
              About Lumpsum Calculator
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              A lumpsum investment is a one-time investment that allows you to invest a significant amount at once 
              and let it grow over time. This calculator helps you to estimate the returns on your one-time investments.
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Note:</span> The calculator assumes a constant rate of return. 
              Actual returns may vary due to market conditions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}