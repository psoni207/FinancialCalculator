import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SliderInput from "@/components/ui/slider-input";
import { Button } from "@/components/ui/button";
import { formatCurrency, calculateSip, InvestmentFrequency } from "@/lib/finance-calculations";
import { Info, LineChart, Table as TableIcon } from "lucide-react";
// import { useQuery } from "@tanstack/react-query"; // Removed useQuery
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

// Array of frequency options
const frequencyOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" }
];

export default function SipCalculator() {
  const [investment, setInvestment] = useState(5000);
  const [returnRate, setReturnRate] = useState(12);
  const [timePeriod, setTimePeriod] = useState(20);
  const [isCalculated, setIsCalculated] = useState(false); // Not strictly needed anymore
  const [resultView, setResultView] = useState<"graph" | "table">("graph");
  const [frequency, setFrequency] = useState<InvestmentFrequency>("monthly");
  const [results, setResults] = useState(calculateSip(investment, returnRate, timePeriod, frequency)); // Calculate on state change

  // useEffect(() => { // Removed useEffect
  //   // Calculation happens immediately now
  // }, [investment, returnRate, timePeriod, frequency]);

  // For line chart
  const chartData = {
    labels: results.yearlyData ? results.yearlyData.map((data: any) => data.yearLabel) : [],
    datasets: [
      {
        label: 'Invested Amount',
        data: results.yearlyData ? results.yearlyData.map((data: any) => data.investedAmount) : [],
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Estimated Returns',
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
    setResults(calculateSip(investment, returnRate, timePeriod, frequency));
    setIsCalculated(true); //This line is not necessary anymore
  }

  // Get appropriate label based on frequency
  const getInvestmentLabel = () => {
    switch (frequency) {
      case "daily": return "Daily Investment";
      case "weekly": return "Weekly Investment";
      case "monthly": return "Monthly Investment";
      case "quarterly": return "Quarterly Investment";
      case "yearly": return "Yearly Investment";
      default: return "Investment Amount";
    }
  };

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-8">
      {/* Input Form */}
      <Card className="mb-6 lg:mb-0">
        <CardHeader className="bg-primary text-white">
          <CardTitle>SIP Calculator</CardTitle>
          <CardDescription className="text-primary-100">
            Calculate your SIP returns
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">

          {/* Investment Amount Input */}
          <div className="mb-6">
            <div className="mb-2">
              <h3 className="text-sm font-medium">{getInvestmentLabel()}</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {frequencyOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={frequency === option.value ? "default" : "outline"}
                  className={`rounded-full ${frequency === option.value ? "bg-primary text-white" : ""}`}
                  size="sm"
                  onClick={() => setFrequency(option.value as InvestmentFrequency)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <SliderInput 
              label="I want to invest"
              value={investment}
              min={100}
              max={50000}
              step={100}
              onChange={setInvestment}
              suffix="₹"
            />
          </div>

          <SliderInput 
            label="Over a period of"
            value={timePeriod}
            min={1}
            max={30}
            step={1}
            onChange={setTimePeriod}
            suffix="Years"
          />

          <SliderInput 
            label="Expected rate of return"
            value={returnRate}
            min={2}
            max={15}
            step={0.1}
            onChange={setReturnRate}
            suffix="%"
          />

          <Button 
            onClick={handleCalculate} 
            className="w-full mt-4"
          >
            Calculate
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      <Card>
        <CardHeader className="bg-green-600 text-white">
          <CardTitle>SIP Results</CardTitle>
          <CardDescription className="text-green-100">
            Visualize your investment growth
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Invested Amount</p>
              <p className="text-xl font-mono font-semibold">
                {formatCurrency(results.investedAmount || 0)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Returns</p>
              <p className="text-xl font-mono font-semibold text-green-600 dark:text-green-500">
                {formatCurrency(results.estimatedReturns || 0)}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Value</p>
              <p className="text-xl font-mono font-semibold text-primary">
                {formatCurrency(results.totalValue || 0)}
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
                      <TableHead className="text-right">Invested Amount</TableHead>
                      <TableHead className="text-right">Estimated Returns</TableHead>
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
              About SIP Calculator
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              A Systematic Investment Plan (SIP) allows you to invest a fixed amount at regular intervals. 
              This calculator helps you estimate the returns on your SIP investments.
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Note:</span> The calculator assumes a constant rate of return, 
              which may vary in real market conditions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}