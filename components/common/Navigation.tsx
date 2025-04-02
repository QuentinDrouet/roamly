"use client";

import Link from "next/link";
import AuthActions from "@/components/common/AuthActions";
import { usePathname } from "next/navigation";

interface NavigationProps {
  user: any;
}

const Navigation = ({ user }: NavigationProps) => {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 bg-clip-text text-transparent tracking-tight hover:from-blue-600 hover:via-indigo-700 hover:to-purple-800 transition-all duration-300">
            Roamly
          </span>
        </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <AuthActions user={user} />
        </div>
      </div>
    </header>
  );
};

export default Navigation;