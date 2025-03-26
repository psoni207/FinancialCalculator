import { useCalculatorAccess } from "@/hooks/use-calculator-access";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface PremiumCalculatorAccessProps {
  calculatorType: string;
  children: React.ReactNode;
}

export default function PremiumCalculatorAccess({ calculatorType, children }: PremiumCalculatorAccessProps) {
  const { hasAccess, isLoading } = useCalculatorAccess(calculatorType);
  const { user } = useAuth();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // User has access - render the calculator
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // User is not logged in - redirect to auth page
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // User is logged in but doesn't have premium access
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Premium Calculator</CardTitle>
          <CardDescription>
            This calculator requires premium access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            The {calculatorType === 'lumpsum' ? 'Lumpsum' : 'SIP Top-Up'} calculator is a premium feature.
            Please contact your administrator to request access to this calculator.
          </p>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm">
            <p>Premium features include:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Lumpsum investment calculator</li>
              <li>SIP with annual top-up calculator</li>
              <li>Detailed investment reports</li>
              <li>Historical performance data</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.history.back()} className="w-full">
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}