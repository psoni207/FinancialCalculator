import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SliderInput from "@/components/ui/slider-input";
import { Button } from "@/components/ui/button";
import { 
  formatCurrency, 
  calculateEmi, 
  generateAmortizationSchedule, 
  type AmortizationEntry 
} from "@/lib/finance-calculations";
import { Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function EmiCalculator() {
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [isCalculated, setIsCalculated] = useState(false);

  const { data: emiData, refetch: refetchEmi, isLoading: isLoadingEmi } = useQuery({
    queryKey: [`/api/calculators/emi?principal=${loanAmount}&rate=${interestRate}&tenure=${loanTenure}`],
    enabled: isCalculated,
  });

  const { data: scheduleData, refetch: refetchSchedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: [`/api/calculators/emi/schedule?principal=${loanAmount}&rate=${interestRate}&tenure=${loanTenure}`],
    enabled: isCalculated,
  });

  const results = emiData || calculateEmi(loanAmount, interestRate, loanTenure);
  const schedule: AmortizationEntry[] = scheduleData || generateAmortizationSchedule(loanAmount, interestRate, loanTenure);

  const chartData = {
    labels: ['Principal', 'Interest'],
    datasets: [
      {
        data: [loanAmount, results.totalInterest],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(249, 115, 22, 0.7)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)'
        ],
        borderWidth: 1,
        hoverOffset: 4
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
            const label = context.label || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return label + ': ' + formatCurrency(value) + ' (' + percentage + '%)';
          }
        }
      }
    }
  };

  function handleCalculate() {
    setIsCalculated(true);
    refetchEmi();
    refetchSchedule();
  }

  const isLoading = isLoadingEmi || isLoadingSchedule;

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-8">
      {/* Input Form */}
      <Card className="mb-6 lg:mb-0">
        <CardHeader className="bg-primary text-white">
          <CardTitle>Loan EMI Calculator</CardTitle>
          <CardDescription className="text-primary-100">
            Calculate your monthly loan installments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <SliderInput 
            label="Loan Amount"
            value={loanAmount}
            min={10000}
            max={10000000}
            step={10000}
            onChange={setLoanAmount}
            suffix="₹"
          />
          
          <SliderInput 
            label="Interest Rate"
            value={interestRate}
            min={1}
            max={20}
            step={0.1}
            onChange={setInterestRate}
            suffix="%"
          />
          
          <SliderInput 
            label="Loan Tenure"
            value={loanTenure}
            min={1}
            max={30}
            step={1}
            onChange={setLoanTenure}
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
          <CardTitle>EMI Results</CardTitle>
          <CardDescription className="text-green-100">
            Breakdown of your loan repayment
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly EMI</p>
              <p className="text-xl font-mono font-semibold text-primary">
                {formatCurrency(results.emi)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Interest</p>
              <p className="text-xl font-mono font-semibold text-orange-600 dark:text-orange-500">
                {formatCurrency(results.totalInterest)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Payment</p>
              <p className="text-xl font-mono font-semibold">
                {formatCurrency(results.totalPayment)}
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="h-36 mb-4">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Yearly Amortization Preview
              </h3>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Year</TableHead>
                      <TableHead className="text-xs text-right">Principal</TableHead>
                      <TableHead className="text-xs text-right">Interest</TableHead>
                      <TableHead className="text-xs text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.slice(0, 10).map((item) => (
                      <TableRow key={item.year}>
                        <TableCell className="py-2 whitespace-nowrap">{item.year}</TableCell>
                        <TableCell className="py-2 text-right font-mono whitespace-nowrap">
                          {formatCurrency(item.principal)}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono whitespace-nowrap">
                          {formatCurrency(item.interest)}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono whitespace-nowrap">
                          {formatCurrency(item.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                  <Info className="h-3 w-3 mr-1 text-primary" />
                  <span className="font-medium">Formula: </span>
                  <span className="ml-1">P × r × (1 + r)^n / ((1 + r)^n - 1)</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
