'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navbar() {
  return (
    <nav className="fixed top-4 left-4 right-4 z-50 bg-transparent border border-white/[0.02] rounded-2xl">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-2xl font-bold flex items-center">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white/80 to-gray-300/80">Connect</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-red-500 via-white/80 to-red-600 mix-blend-overlay font-extrabold relative group">
                <span className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-br from-red-400 to-red-600 blur-[1px] animate-pulse">X</span>
                <span className="relative">X</span>
                <span className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-r from-white/30 via-transparent to-white/30 group-hover:translate-x-full transition-transform duration-1000">X</span>
              </span>
            </h1>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center">
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-lg p-[1px] shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300">
                <div className="relative bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-sm rounded-lg group-hover:bg-black/30 transition-colors duration-300">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}