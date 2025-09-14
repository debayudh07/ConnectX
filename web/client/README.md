# ConnectX - Decentralized Bounty Marketplace

ConnectX is a comprehensive decentralized bounty marketplace built on Avalanche that connects open-source maintainers with skilled developers. The platform enables maintainers to post bounties for GitHub issues and allows developers to claim, complete, and get paid for their contributions.

## 🚀 Features

### For Maintainers
- **Create Bounties**: Post bounties for GitHub issues with customizable rewards
- **Verify Work**: Review and verify submitted work with comprehensive validation
- **Manage Projects**: Track bounty progress and developer engagement
- **Secure Payments**: Automated payment processing with platform fee handling

### For Developers
- **Discover Bounties**: Browse available bounties by difficulty and reward
- **Claim & Submit**: Claim bounties and submit work with PR links
- **Earn Rewards**: Get paid automatically upon work verification
- **Build Reputation**: Earn badges and reputation points for completed work
- **Track Progress**: Monitor claimed bounties and completion history

### Core Features
- **🏆 NFT Badges**: Earn unique NFT badges for completed bounties
- **📊 Reputation System**: Build reputation through successful contributions
- **🔐 Access Control**: Role-based permissions for verifiers and admins
- **⛽ Gas Optimization**: Efficient smart contracts with optimized gas usage
- **🛡️ Security**: Reentrancy protection and comprehensive access controls
- **📱 Responsive UI**: Modern, mobile-friendly interface

## 🛠️ Technology Stack

### Blockchain
- **Avalanche C-Chain**: Fast, low-cost transactions
- **Solidity**: Smart contracts with OpenZeppelin security standards
- **Hardhat**: Development framework and testing

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript interface for Ethereum

### Smart Contracts
- **BountyMarketplace**: Core bounty management
- **DeveloperBadge**: NFT badges for achievements
- **DeveloperReputation**: Reputation tracking system
- **SimpleBountyVerifier**: Work verification logic

## 🏗️ Project Structure

```
ConnectX/
├── contracts/              # Smart contracts
│   ├── contracts/         # Solidity contracts
│   ├── test/             # Contract tests
│   ├── scripts/          # Deployment scripts
│   └── hardhat.config.ts # Hardhat configuration
└── web/
    └── client/           # Next.js frontend
        ├── app/          # Next.js app router
        ├── components/   # React components
        ├── contractsABI/ # Contract hooks and ABIs
        └── lib/          # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Avalanche Fuji testnet setup

### 1. Clone the Repository
```bash
git clone https://github.com/debayudh07/ConnectX.git
cd ConnectX
```

### 2. Install Dependencies

**Smart Contracts:**
```bash
cd contracts
npm install
```

**Frontend:**
```bash
cd web/client
npm install
```

### 3. Environment Setup

**Contracts (.env in contracts/):**
```env
PRIVATE_KEY=your_private_key_here
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Frontend (.env.local in web/client/):**
```env
NEXT_PUBLIC_BOUNTY_MARKETPLACE_ADDRESS=deployed_contract_address
NEXT_PUBLIC_DEVELOPER_BADGE_ADDRESS=badge_contract_address
NEXT_PUBLIC_DEVELOPER_REPUTATION_ADDRESS=reputation_contract_address
NEXT_PUBLIC_NETWORK_ID=43113
```

### 4. Deploy Smart Contracts
```bash
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network fuji
```

### 5. Start the Frontend
```bash
cd web/client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🧪 Testing

### Smart Contract Tests
```bash
cd contracts
npx hardhat test
npx hardhat test --grep "verifyAndPay" # Run specific tests
```

### Frontend Testing
```bash
cd web/client
npm run test
npm run test:e2e
```

## 📋 Usage Guide

### For Maintainers

1. **Connect Wallet**: Connect your MetaMask to Avalanche Fuji
2. **Create Bounty**: 
   - Navigate to "Create Bounty"
   - Enter GitHub issue URL
   - Set reward amount and difficulty
   - Submit with transaction fee
3. **Verify Work**:
   - Review submitted work
   - Use the enhanced verification modal
   - Approve or dispute submissions

### For Developers

1. **Browse Bounties**: Explore available bounties by filters
2. **Claim Bounty**: Connect wallet and claim interesting bounties
3. **Submit Work**: 
   - Complete the work
   - Submit PR URL and description
   - Wait for verification
4. **Get Paid**: Automatic payment upon approval

## 🔧 Configuration

### Network Configuration
The app is configured for Avalanche Fuji testnet. To change networks, update:
- Contract deployment scripts
- Frontend network configuration
- Environment variables

### Smart Contract Addresses
Update contract addresses in `contractsABI/contractConfig.ts` after deployment.

## 🛡️ Security Features

- **Access Control**: Role-based permissions (Admin, Verifier, Maintainer)
- **Reentrancy Protection**: Guards against reentrancy attacks
- **Input Validation**: Comprehensive validation of all inputs
- **Pause Functionality**: Emergency pause for maintenance
- **Gas Optimization**: Efficient contract design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript/Solidity best practices
- Add tests for new features
- Update documentation
- Ensure gas optimization for contracts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [ConnectX App](https://connectx-demo.vercel.app)
- **Documentation**: [Docs](https://docs.connectx.dev)
- **Discord**: [Community](https://discord.gg/connectx)
- **Twitter**: [@ConnectXDev](https://twitter.com/ConnectXDev)

## 🎯 Roadmap

- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Advanced filtering and search
- [ ] Dispute resolution system
- [ ] Mobile app development
- [ ] Integration with more Git platforms
- [ ] DAO governance for platform decisions

## 📞 Support

For support and questions:
- Create an issue in this repository
- Join our Discord community
- Contact: support@connectx.dev

---

Built with ❤️ for the open-source community during AvaxHack 2025
