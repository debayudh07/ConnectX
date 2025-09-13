"use client";

import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Navbar } from "@/components/navbar";

export default function Home() {
  const { isConnected } = useAccount();

  useEffect(() => {
    // Initialize Vanta.js background effect
    if (typeof window !== "undefined" && window.VANTA) {
      window.VANTA.NET({
        el: "#vanta-bg",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xff0000,
        backgroundColor: 0x0,
        points: 17.00,
        maxDistance: 27.00,
        spacing: 14.00
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Navbar */}
      <Navbar />
      
      {/* Main content container */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Vanta.js Background */}
        <div id="vanta-bg" className="absolute inset-0 z-0"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center pt-16">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
            ConnectX
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Connect with fellow developers
          </p>
          
          {/* Get Connected Button */}
          <div className="flex flex-col items-center space-y-4">
            {!isConnected ? (
              <div className="bg-black/40 backdrop-blur-sm rounded-full p-2">
                <ConnectButton />
              </div>
            ) : (
              <div className="text-center">
                <button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Explore Developers
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
