import { LineChart, Moon, Sun, LogOut, User, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import React from "react";

type MenuItemType = {
  title: string;
  href: string;
  description: string;
};

const calculators: MenuItemType[] = [
  {
    title: "SIP Calculator",
    href: "/calculators/sip",
    description: "Calculate returns on your Systematic Investment Plans",
  },
  {
    title: "SWP Calculator",
    href: "/calculators/swp",
    description: "Plan your systematic withdrawals with this calculator",
  },
  {
    title: "Loan EMI Calculator",
    href: "/calculators/emi",
    description: "Calculate your loan EMI, total interest and payment schedules",
  },
  {
    title: "SIP Top-Up Calculator",
    href: "/calculators/sip-topup",
    description: "See how increasing your SIP periodically accelerates wealth creation",
  },
  {
    title: "Lumpsum Calculator",
    href: "/calculators/lumpsum",
    description: "Calculate returns on one-time investment amount",
  },
  {
    title: "All Calculators",
    href: "/calculators",
    description: "Explore all financial calculators in one place",
  },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default function FinanceNavbar() {
  const { theme, setTheme } = useTheme();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { user, logout } = useAuth();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "G";
    return user.username.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-gray-950 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link href="/" className="flex items-center text-primary">
              <LineChart className="h-6 w-6 mr-2" />
              <span className="text-xl font-semibold">Finance Tools</span>
            </Link>
          </div>

          {isDesktop ? (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/calculators">
                    <NavigationMenuTrigger>FINANCIAL CALCULATORS</NavigationMenuTrigger>
                  </Link>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {calculators.map((calculator) => (
                        <ListItem
                          key={calculator.title}
                          title={calculator.title}
                          href={calculator.href}
                        >
                          {calculator.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <div className="pb-2">
                    <h3 className="font-medium mb-2">CALCULATORS</h3>
                    {calculators.map((item) => (
                      <Link key={item.title} href={item.href}>
                        <a className="block py-2 text-sm text-gray-600">{item.title}</a>
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}

          <div className="md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
            {/* Theme toggle */}
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

            {/* User account dropdown or login/register buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {user.hasPremiumAccess && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                        Premium Access
                      </span>
                    )}
                  </div>
                  <DropdownMenuSeparator />

                  {/* Admin-only link */}
                  {user.role === "ADMIN" && (
                    <>
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer">
                          <UserCog className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem 
                    onClick={async () => await logout()}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="outline" size="sm" className="ml-2">
                  <User className="mr-2 h-4 w-4" />
                  Login / Register
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}