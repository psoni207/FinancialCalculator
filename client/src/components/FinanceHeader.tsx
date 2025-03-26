import { LineChart, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function FinanceHeader() {
  const { theme, setTheme } = useTheme();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <header className="bg-white dark:bg-gray-950 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <a href="/" className="flex items-center text-primary">
              <LineChart className="h-6 w-6 mr-2" />
              <span className="text-xl font-semibold">Finance Tools</span>
            </a>
          </div>
          
          {/* {isDesktop ? (
            <nav className="hidden md:flex space-x-10">
              <a href="#" className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                How it works
              </a>
              <a href="#" className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                Financial Guides
              </a>
              <a href="#" className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                About
              </a>
            </nav>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <a href="#" className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    How it works
                  </a>
                  <a href="#" className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    Financial Guides
                  </a>
                  <a href="#" className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    About
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          )} */}
          
          <div className="md:flex items-center justify-end md:flex-1 lg:w-0">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
