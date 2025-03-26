import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  suffix?: string;
}

export function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  suffix = "",
}: SliderInputProps) {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (newValue: number[]) => {
    onChange(newValue[0]);
    setInputValue(newValue[0].toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let newValue = parseFloat(inputValue);
    
    if (isNaN(newValue)) {
      newValue = value;
    }

    // Constrain to min/max
    newValue = Math.max(min, Math.min(max, newValue));
    
    setInputValue(newValue.toString());
    onChange(newValue);
  };

  return (
    <div className="space-y-2 mb-6">
      <div className="flex flex-col mb-2">
        <div className="flex justify-between mb-1">
          <Label htmlFor={label.replace(/\s+/g, '')} className="text-sm font-medium">
            {label}
          </Label>
          <div className="text-sm font-medium">
            {inputValue} {suffix}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <Slider
              value={[value]}
              min={min}
              max={max}
              step={step}
              onValueChange={handleSliderChange}
              className="cursor-pointer"
            />
          </div>
          <div className="ml-4 w-28 relative hidden">
            <Input
              id={label.replace(/\s+/g, '')}
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="text-right pr-8 py-1 text-sm w-full"
              min={min}
              max={max}
              step={step}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatValue ? formatValue(min) : min}{suffix}</span>
        <span>{formatValue ? formatValue(max) : max}{suffix}</span>
      </div>
    </div>
  );
}

export default SliderInput;
