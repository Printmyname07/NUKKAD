# NUKKAD — Your Neighborhood, One Marketplace

“Have you ever visited a local street vendor only to discover that the shop is closed, your product is unavailable, or the queue is too long? What if you could know all this before leaving home?”

NUKKAD is a local-commerce marketplace concept designed to connect customers with vendor stalls and help neighborhood vendors manage their stores digitally. Customers can discover products, while vendors can manage product listings, prices, stock, shop availability, and customer orders from a dedicated Vendor Portal.

> **Project status:** Prototype / development project. Features described below should be considered implemented only where they are present and verified in the current codebase.

## Highlights

- **Separate customer and vendor experiences** with dedicated portal navigation.
- **Local shop discovery** and product browsing.
- **Vendor product management** for listings, prices, and stock.
- **Order management** for viewing and updating orders where supported.
- **Shared marketplace data** intended to keep vendor changes reflected in the customer experience.
- **Voice Assistant concept** for vendors, using browser speech recognition and speech synthesis where supported.
- **Responsive interface** with a green-and-white visual identity.
- **Local prototype storage** without a required hosted database service.

## Technology

The project uses a web application stack already configured in the repository. Check `package.json` for the exact framework, scripts, and dependency versions.

The vendor Voice Assistant uses browser-native Web Speech APIs where supported by the browser and operating system. Availability, recognition quality, language support, and network requirements vary by environment.

## Getting Started

### Prerequisites

- Node.js version compatible with the project dependencies.
- npm (or the package manager indicated by the lockfile).
- A modern browser. Chrome or Edge may provide better Web Speech API support, but support is not guaranteed on every device.

### Install dependencies

```bash
npm install
```

### Start the development server

Check the `scripts` section of `package.json`. If the project defines a `dev` script, run:

```bash
npm run dev
```

Follow the local URL printed in the terminal.

### Build the project

If the repository defines the corresponding scripts, run:

```bash
npm run build
npm run lint
npm test
```

Script names vary by project. Use the scripts actually present in `package.json`.

## Using NUKKAD

### Customers

1. Open the application.
2. Register or log in as a **Customer**.
3. Browse available shops and products.
4. Review product details and availability.
5. Use the available ordering features in the Customer Portal.

### Vendors

1. Register or log in as a **Vendor**.
2. Open the Vendor Portal.
3. Manage shop details and product listings using the available controls.
4. Review orders and update their status where supported.
5. Open the Voice Assistant, grant microphone permission if prompted, choose a supported language, and speak a command.

### Voice Assistant examples (Future Scope)

Examples of intended commands include:

- “Show my products.”
- “Check low stock.”
- “Change the stock of rice to 15 packets.”
- “Change the price of apples to 120 rupees per kilo.”
- “Show my pending orders.”
- “Pause my shop.”

**Voice commands may be partially implemented.** Recognition, command parsing, confirmation, saving, and UI refresh are separate steps. Verify each command in the current build before relying on it. Review proposed changes and confirm them only when the displayed details are correct.

## Data and Persistence

This project has been developed with a local-storage-based prototype approach.

- Data may be stored in the current browser profile and device.
- Local browser storage is not a shared, multi-device database by itself.
- Clearing browser data, using another browser/device, or changing the application's storage implementation may affect access to saved prototype data.
- Do not assume that data is backed up or synchronized across devices unless a suitable backend has been implemented and verified.

## Security and Production Readiness

**This prototype is not production-ready for sensitive or real customer transactions without additional security work.**

Client-side role checks and browser-local storage are not secure authorization boundaries. A production deployment should use a trusted backend for authentication, authorization, vendor ownership checks, durable shared storage, input validation, audit logging, and order/payment integrity.

Do not store real passwords, payment details, secrets, API keys, or other sensitive information in source code or public repositories. Do not use real customer information while testing a prototype.

## Accessibility and Browser Notes

- Microphone access requires browser permission and a supported secure context.
- Speech recognition and text-to-speech capabilities differ by browser, operating system, and language.
- Provide manual controls when voice input is unavailable.
- For the best experience, test keyboard navigation, form validation, responsive layouts, and error states in the browsers you intend to support.

## Repository Structure

The following paths have been used in the project during development; the exact structure may evolve:

```text
src/
├── components/
│   └── voice/
│       └── VoiceAssistantPanel.tsx
├── features/
│   ├── auth/
│   ├── customer/
│   └── vendor/
│       └── VendorPortal.tsx
└── services/
    ├── storage/
    │   └── prototypeStorage.ts
    └── voice/
        └── voiceAssistantService.ts

tests/
└── unit/
    └── voiceAssistant.test.ts
```

## Testing Checklist

Before publishing a release, verify:

- [ ] Customer registration and login lead to the Customer Portal.
- [ ] Vendor registration and login lead to the Vendor Portal.
- [ ] Customer and vendor navigation remain separate.
- [ ] Product creation, price updates, and stock updates save correctly.
- [ ] Customer-facing product data reflects successful vendor changes.
- [ ] Order queries and status changes use the correct order and vendor.
- [ ] Voice commands require confirmation for state-changing actions.
- [ ] Canceling a proposed command does not modify data.
- [ ] Ambiguous commands and failed saves show clear errors.
- [ ] Microphone-denied and unsupported-browser cases have a manual fallback.
- [ ] Tests, type checks, linting, and production build pass.

## Contributing

Contributions and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run the checks available in the project.
5. Open a pull request describing the change and verification performed.

---

Made for neighborhood commerce with **NUKKAD**.
