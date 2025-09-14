"use client";

import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Navbar } from "@/components/navbar";
import { Link } from "lucide-react";

// Custom styled connect button
const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!mounted || !account || !chain) {
                return (
                  <button 
                    onClick={openConnectModal} 
                    type="button" 
                    className="relative bg-transparent text-black font-semibold py-2 px-4 transition-all duration-200"
                  >
                    <span className="relative">Connect Wallet</span>
                  </button>
                );
              }
              return (
                <div className="flex items-center gap-3">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-transparent hover:bg-white/5 text-black font-semibold py-2 px-4 rounded-full transition-all duration-200"
                  >
                    {chain.name}
                  </button>
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="bg-transparent hover:bg-white/5 text-black font-semibold py-2 px-4 rounded-full transition-all duration-200"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

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
  const onClickExplore = () => {
    // Logic to navigate to the developers' page
    window.location.href = "/dashboard"; // Adjust the URL as needed
  }

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
          <h1 className="text-6xl md:text-8xl font-bold mb-4 flex items-center justify-center">
            <span className="text-white relative animate-textShadow">
              Connect
              <style jsx>{`
                @keyframes textShadow {
                  0% { text-shadow: 0.025em 0 0 rgba(239, 68, 68, 0.75),
                                   -0.025em -0.025em 0 rgba(255, 0, 0, 0.5),
                                   -0.025em 0.025em 0 rgba(185, 28, 28, 0.5); }
                  14% { text-shadow: 0.025em 0 0 rgba(239, 68, 68, 0.75),
                                    -0.025em -0.025em 0 rgba(255, 0, 0, 0.5),
                                    -0.025em 0.025em 0 rgba(185, 28, 28, 0.5); }
                  15% { text-shadow: -0.05em -0.025em 0 rgba(239, 68, 68, 0.75),
                                    0.025em 0.025em 0 rgba(255, 0, 0, 0.5),
                                    -0.05em -0.05em 0 rgba(185, 28, 28, 0.5); }
                  49% { text-shadow: -0.05em -0.025em 0 rgba(239, 68, 68, 0.75),
                                    0.025em 0.025em 0 rgba(255, 0, 0, 0.5),
                                    -0.05em -0.05em 0 rgba(185, 28, 28, 0.5); }
                  50% { text-shadow: 0.025em 0.05em 0 rgba(239, 68, 68, 0.75),
                                    0.05em 0 0 rgba(255, 0, 0, 0.5),
                                    0 -0.05em 0 rgba(185, 28, 28, 0.5); }
                  99% { text-shadow: 0.025em 0.05em 0 rgba(239, 68, 68, 0.75),
                                    0.05em 0 0 rgba(255, 0, 0, 0.5),
                                    0 -0.05em 0 rgba(185, 28, 28, 0.5); }
                  100% { text-shadow: -0.025em 0 0 rgba(239, 68, 68, 0.75),
                                     -0.025em -0.025em 0 rgba(255, 0, 0, 0.5),
                                     -0.025em -0.05em 0 rgba(185, 28, 28, 0.5); }
                }
                .animate-textShadow {
                  animation: textShadow 8s infinite;
                }
              `}</style>
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white/50 to-transparent mix-blend-overlay font-extrabold relative">
              <span className="absolute inset-0 animate-pulse blur-[2px] text-red-500 opacity-75">X</span>
              <span className="relative">X</span>
              <span className="absolute inset-0 drop-shadow-[0_0_10px_rgba(255,0,0,0.7)]">X</span>
              <span className="absolute inset-0 text-transparent [-webkit-text-stroke:0.5px_rgba(255,255,255,0.7)] drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">X</span>
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 font-mono relative overflow-hidden">
            <span className="relative z-10 bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text animate-pulse">
              Connect with fellow developers
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-400/20 blur-sm animate-pulse"></span>
            <span className="absolute -inset-1 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-[matrix_3s_linear_infinite]"></span>
            <style jsx>{`
              @keyframes matrix {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
              }
            `}</style>
          </p>
          
          {/* Get Connected Button */}
          <div className="flex flex-col items-center space-y-4">
            {!isConnected ? (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative bg-black/30 backdrop-blur-xl rounded-full p-2 transition-all duration-200 hover:shadow-[0_0_2rem_-0.5rem_#ef4444] group-hover:bg-black/40">
                  <div className="px-2 py-1">
                    <CustomConnectButton />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 animate-shimmer"></div>
                </div>
                <style jsx>{`
                  @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                  .animate-shimmer {
                    animation: shimmer 2s linear infinite;
                  }
                `}</style>
              </div>
            ) : (
              <div className="text-center">

                <button onClick={onClickExplore} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
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