"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Smartphone } from "lucide-react";
import Image from "next/image";

export default function MobileOnlyWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/admin-login")) {
    return <div className="flex flex-col min-h-screen">{children}</div>;
  }

  return (
    <>
      {/* Mobile Content */}
      <div className="md:hidden flex flex-col min-h-screen w-full">
        {children}
      </div>

      {/* Desktop Blocker */}
      <div className="hidden md:flex fixed inset-0 z-[9999] flex-col items-center justify-center bg-[#f2f4f2] text-center px-4">
        
        <div className="flex flex-col items-center justify-center max-w-lg w-full">
          {/* Logo Area */}
          <div className="flex flex-col items-center mb-16">
             <Image
                src="/monument-logo.png"
                alt="Monument Logo"
                width={72}
                height={72}
                className="opacity-80 grayscale"
             />
             <div className="text-2xl font-black text-gray-800 tracking-[0.2em] uppercase mt-4 !bg-none !text-gray-800" style={{ WebkitTextFillColor: 'initial', backgroundImage: 'none' }}>
               Monument
             </div>
          </div>

          {/* Center Content */}
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] mb-8 flex items-center justify-center border border-gray-100/50">
            <Smartphone size={56} className="text-gray-800" strokeWidth={2} />
          </div>
          
          <div className="text-4xl md:text-5xl font-semibold !text-gray-900 mb-4 tracking-tight !bg-none" style={{ WebkitTextFillColor: 'initial', backgroundImage: 'none' }}>
            USE ON MOBILE
          </div>
          
          <p className="text-gray-500 font-medium text-lg">
            For the best experience, use a mobile device.
          </p>
        </div>

      </div>
    </>
  );
}
