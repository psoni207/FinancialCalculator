
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SliderInput from "@/components/ui/slider-input";
import { Button } from "@/components/ui/button";
import { formatCurrency, calculateInflation } from "@/lib/finance-calculations";
import { Info, LineChart, Table as TableIcon } from "lucide-react";
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

export default function InflationCalculator() {
  const [amount, setAmount] = useState(1000000);
  const [inflationRate, setInflationRate] = useState(7);
  const [timePeriod, setTimePeriod] = useState(10);
  const [resultView, setResultView] = useState<"graph" | "table">("graph");
  
  const results = calculateInflation(amount, inflationRate, timePeriod);

  const chartData = {
    labels: results?.yearlyData.map(item => `Year ${item.year}`) || [],
    datasets: [
      {
        label: 'Original Value',
        data: results?.yearlyData.map(item => item.originalValue) || [],
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Value After Inflation',
        data: results?.yearlyData.map(item => item.inflatedValue) || [],
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

  

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-8">
      {/* Input Form */}
      <Card className="mb-6 lg:mb-0">
        <CardHeader className="bg-primary text-white">
          <CardTitle>Inflation Calculator</CardTitle>
          <CardDescription className="text-primary-100">
            Calculate the impact of inflation on your money
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <SliderInput 
            label="Amount"
            value={amount}
            min={100000}
            max={10000000}
            step={50000}
            onChange={setAmount}
            suffix="₹"
          />
          
          <SliderInput 
            label="Inflation Rate"
            value={inflationRate}
            min={1}
            max={20}
            step={0.1}
            onChange={setInflationRate}
            suffix="%"
          />
          
          <SliderInput 
            label="Time Period"
            value={timePeriod}
            min={1}
            max={30}
            step={1}
            onChange={setTimePeriod}
            suffix="years"
          />

          
        </CardContent>
      </Card>

      {/* Results Display */}
        <Card>
          <CardHeader className="bg-green-600 text-white">
            <CardTitle>Inflation Impact</CardTitle>
            <CardDescription className="text-green-100">
              See how inflation affects your money over time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Present Value</p>
                <p className="text-xl font-mono font-semibold">
                  {formatCurrency(amount)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Future Value</p>
                <p className="text-xl font-mono font-semibold text-green-600 dark:text-green-500">
                  {formatCurrency(results.futureValue)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Value Lost</p>
                <p className="text-xl font-mono font-semibold text-primary">
                  {formatCurrency(results.inflationImpact)}
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
                        <TableHead className="text-right">Original Value</TableHead>
                        <TableHead className="text-right">Value After Inflation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.yearlyData.map((row) => (
                        <TableRow key={row.year}>
                          <TableCell>Year {row.year}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.originalValue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.inflatedValue)}</TableCell>
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
                About Inflation Calculator
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                This calculator helps you understand how inflation erodes the purchasing power of your money over time. 
                The results show you how much your money will be worth in the future based on the expected inflation rate.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
