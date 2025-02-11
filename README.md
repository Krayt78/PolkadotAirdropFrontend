# Web3 Airdrop Eligibility Checker

A decentralized application (dApp) that allows users to check their eligibility for an airdrop by connecting their Ethereum wallet and verifying their Polkadot address.

## Features

- 🔐 Secure Ethereum wallet connection (MetaMask support)
- ⛓️ Cross-chain verification with Polkadot network
- 📝 EIP-712 signature verification for address ownership
- 🎨 Modern, responsive UI with step-by-step flow
- 🔍 Real-time eligibility checking

## Prerequisites

- Node.js (v18 or higher)
- Modern web browser with MetaMask extension installed
- Polkadot account (for receiving tokens)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Krayt78/PolkadotAirdropFrontend.git
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Web3 Integration**: 
  - ethers.js (Ethereum interactions)
  - @polkadot/api (Polkadot blockchain interactions)
- **UI Components**: Lucide React icons
- **Build Tool**: Vite

## Project Structure

```
src/
├── lib/
│   ├── config.ts        # Configuration constants
│   └── hooks/
│       ├── useWallet.ts    # Ethereum wallet integration
│       └── usePolkadot.ts  # Polkadot network integration
├── App.tsx              # Main application component
└── main.tsx            # Application entry point
```

## Usage Flow

1. **Connect Wallet**: Click "Connect Ethereum Wallet" to connect your MetaMask wallet
2. **Enter Polkadot Address**: Provide the Polkadot address where you want to receive tokens
3. **Check Eligibility**: The system will verify your eligibility on the Polkadot network
4. **Submit Claim**: If eligible, sign the message with your Ethereum wallet to verify ownership

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Setup

Make sure you have MetaMask installed and configured for development:

1. Install MetaMask browser extension
2. Create or import a wallet
3. Connect to the appropriate network (Ethereum Mainnet or testnet)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security

- The application uses EIP-712 for secure message signing
- All blockchain interactions are read-only
- No sensitive data is stored on the frontend

## Support

For support, please open an issue in the repository or contact the maintainers.
