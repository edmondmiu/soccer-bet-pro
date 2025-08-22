# **Product Requirements Document (PRD)**

**Project**: Real-Time Multiplayer Soccer Betting Game
**Version**: 2.0
**Date**: 2025-08-16
**Author**: John, Product Manager

## **1. Goals and Background Context**

### **Goals**

- To create an engaging, real-time, multiplayer betting game that combines the thrill of sports betting with strategic, game-like mechanics.
- To validate that the Power-Up system is a compelling driver of player engagement and retention.
- To build a prototype on a secure, scalable, "real-money ready" architecture that can prove a sustainable house edge of 4-6%.
- To successfully launch a limited beta for the Mobile Web First product to test product-market fit with the "Gamer Bettor" and "Curious Bettor" personas.

### **Background Context**

Traditional sports betting is a largely passive experience. This project aims to capture a modern gaming audience by creating a new, more interactive betting genre. By allowing players to win and strategically use "Power-Ups," we give them a sense of agency and skill that is absent from current offerings. This PRD outlines the minimum viable product required to test the hypothesis that this more engaging model is both desirable to players and economically viable as a real-money game.

### **Change Log**

| Date       | Version | Description                                                 | Author   |
| ---------- | ------- | ----------------------------------------------------------- | -------- |
| 2025-08-08 | 1.0     | Initial PRD creation.                                       | John, PM |
| 2025-08-16 | 2.0     | Updated with implemented game loop and betting improvements | John, PM |

---

## **2. Requirements**

### **Functional Requirements**

**FR1:** The system shall allow a user to register for an account and manage a basic user profile.
**FR2:** Each user shall have a wallet with a virtual currency balance for use in the MVP.
**FR3:** The system shall display a lobby where users can see and join upcoming simulated soccer matches.
**FR4:** Users shall be able to place a `Full-Match Bet` (1X2) on the final outcome of a match at any point during the match without interrupting gameplay.
**FR5:** During a match, the system shall periodically offer `Action Bets` on short-term events (e.g., fouls, corners, cards) by pausing the game and displaying betting opportunities.
**FR6:** Action betting opportunities shall pause the game for 10 seconds, display an integrated modal with betting choices, and resume gameplay after player decision or timeout.
**FR7:** The system shall remember the last bet amounts separately for full-match bets and action bets, pre-populating betting forms with these amounts.
**FR8:** A user who wins an `Action Bet` shall have an 80% chance to be rewarded with a `2x Winnings Multiplier` Power-Up.
**FR9:** A user's inventory shall hold a maximum of one Power-Up at a time; a new Power-Up cannot be earned while one is held.
**FR10:** A user shall be able to apply a held Power-Up to an active `Full-Match Bet` to modify its potential payout.
**FR11:** The in-game UI shall include a persistent `Live Player Dashboard` showing the user's `Rolling Tally`, `Potential Win`, and `Total Staked`.
**FR12:** The system shall provide a "Classic Mode" toggle in the settings that disables all Power-Up mechanics for the duration of a match.

### **Non-Functional Requirements**

**NFR1:** All real-time gameplay events must be delivered to the client with a latency of less than 200ms.
**NFR2:** The backend economic model must be able to maintain a sustainable house edge of 4-6%.
**NFR3:** The system architecture, especially the user wallet, must be designed to be "real-money ready" for future integration with secure payment gateways.
**NFR4:** The application must adhere to high security standards suitable for a real-money gaming application, including readiness for future KYC/AML compliance.
**NFR5:** The user interface must be fully responsive and optimized for a "mobile web first" experience.
**NFR6:** The match simulation engine must be designed to generate an "action-packed" and consistently engaging sequence of events.

---

## **3. User Interface Design Goals**

- **Overall Vision**: The UX must feel like a fast-paced, engaging arcade game, not a static financial application. The primary goals are clarity and thrill.
- **Key Paradigms**: Real-Time Updates, One-Tap Betting, and Non-Intrusive Notifications are core interaction principles.
- **Core Screens**: MVP will include a Lobby, Match Screen, Wallet, and Settings screen.
- **Accessibility**: Target WCAG 2.1 AA compliance.
- **Branding**: A "dark mode" aesthetic is suggested, but a full brand guide is needed.
- **Platform**: Web Responsive with a "Mobile Web First" priority.

---

## **4. Technical Assumptions**

- **Repository**: A Monorepo structure will be used.
- **Architecture**: A Serverless Architecture is assumed for the backend for scalability and cost-efficiency.
- **Testing**: A comprehensive strategy including Unit, Integration, and E2E tests is required.
- **Stack**: The technology stack is confirmed as React (Next.js) for the frontend and NestJS (Node.js) for the backend.

---

## **4. Game Loop Architecture**

### **Core Game Flow**

The implemented game follows this enhanced loop structure:

1. **Lobby Phase**

   - Player starts with $1000 virtual currency
   - Selects from available simulated soccer matches
   - Joins match to enter gameplay

2. **Match Initialization**

   - 90-minute simulated soccer match begins
   - Real-time timer starts counting
   - Live dashboard displays current wallet, potential winnings, and total staked

3. **Continuous Full-Match Betting**

   - Players can place 1X2 bets (Home/Draw/Away) at any time during the match
   - Game continues running without interruption during full-match betting
   - Betting forms pre-populate with last used full-match bet amount
   - Default bet amount is $25 if no previous history exists

4. **Action Betting Opportunities**

   - System generates betting events (fouls, corners, cards) approximately every 8-18 minutes
   - Game automatically pauses when action betting opportunity occurs
   - Integrated modal displays with:
     - "Game Paused - Betting Opportunity" header
     - Event description and betting choices with odds
     - 10-second countdown timer within modal
     - Skip betting option
   - Betting forms pre-populate with last used action bet amount
   - Game resumes after player decision or 10-second timeout

5. **Power-Up System Integration**

   - Winning action bets award 2x multiplier power-ups (80% probability)
   - Players can hold maximum one power-up at a time
   - Power-ups can be applied to active full-match bets to double potential winnings
   - Classic mode disables all power-up mechanics

6. **Match Conclusion**
   - All bets resolve based on final match outcome and action bet results
   - Winnings calculated and added to player wallet
   - Match summary displayed with bet results
   - Player returns to lobby for next match

### **Enhanced UX Features**

- **Seamless Betting**: Full-match betting never interrupts gameplay flow
- **Smart Defaults**: System remembers and pre-populates last bet amounts by bet type
- **Integrated Pause System**: Action betting pauses are clearly communicated within betting modals
- **Visual Hierarchy**: Betting interfaces follow clear priority: pause info → betting options → amount selection
- **Error Recovery**: Comprehensive fallback systems ensure betting opportunities are never lost due to technical issues

---

## **5. Epics & Stories**

### **Epic 1: Project Foundation & Core Betting Engine**

- **Goal**: Establish the project's technical foundation, including the serverless backend, database, and a core API for placing bets and managing wallets, resulting in a functional, albeit headless, betting engine.
- **Stories**:
  - **1.1: Project & Infrastructure Setup**: Initialize Monorepo and basic CI/CD.
  - **1.2: Database & Wallet Schema**: Deploy `Players` table.
  - **1.3: User Registration & Authentication**: Implement JWT-based auth.
  - **1.4: Core Betting API**: Implement `POST /bets/place` endpoint and `Bets` table.
  - **1.5: Match Simulation Engine (Headless)**: Create service to generate match event timelines.
  - **1.6: Bet Settlement Service**: Create service to resolve bets and update player balances.

### **Epic 2: Web Frontend & Player Experience**

- **Goal**: Develop the responsive, "mobile web first" user interface, connecting to the backend API to allow players to register, join matches, place bets, and view their dashboard in real-time.
- **Stories**:
  - **2.1: Frontend Application & API Connection**: Configure Next.js app with API and WebSocket clients.
  - **2.2: User Registration & Login Screens**: Build the UI for auth.
  - **2.3: Game Lobby UI**: Build the UI to display and join matches.
  - **2.4: Match Screen & Live Dashboard UI**: Build the primary game screen and real-time dashboard.
  - **2.5: UI for Placing Bets**: Implement the betting controls.

### **Epic 3: Power-Up System & Game Loop Integration**

- **Goal**: Implement the `2x Multiplier` Power-Up system, including the reward logic, player inventory, the UI for applying it, and the "Classic Mode" toggle.
- **Stories**:
  - **3.1: Backend Logic for Power-Up Rewards**: Implement drop algorithm and `PowerUps` table.
  - **3.2: Power-Up Inventory & Activation UI**: Build the frontend components to display and activate Power-Ups.
  - **3.3: Power-Up Application API**: Implement `POST /powerups/use` endpoint.
  - **3.4: Update Payout Logic & UI for Power-Ups**: Ensure payouts are multiplied and the UI reflects this.
  - **3.5: Implement "Classic Mode" Toggle**: Build the UI and backend logic to disable the Power-Up system.

### **Epic 4: Enhanced Betting Experience & Game Flow**

- **Goal**: Implement seamless betting flows, intelligent pause systems, and enhanced user experience features that differentiate full-match betting from action betting opportunities.
- **Stories**:
  - **4.1: Seamless Full-Match Betting**: Remove game pauses from full-match betting to allow continuous gameplay.
  - **4.2: Integrated Action Betting Modals**: Implement pause system with betting information integrated directly into action betting modals.
  - **4.3: Smart Bet Amount Memory**: Implement system to remember and pre-populate last bet amounts by bet type.
  - **4.4: Enhanced Modal Structure**: Create clear visual hierarchy in betting interfaces with proper pause information display.
  - **4.5: Comprehensive Error Handling**: Implement fallback systems and error recovery for all betting scenarios.
  - **4.6: Betting Flow Consistency**: Ensure consistent behavior and styling across all betting interfaces.

---

## **Final Validation**

Now, as the final step in my process, I will run the **PM Requirements Checklist** against this document to provide a final quality check.

### **Checklist Results Report**

| Category                         | Status  | Critical Issues |
| -------------------------------- | ------- | --------------- |
| 1. Problem Definition & Context  | ✅ PASS | None            |
| 2. MVP Scope Definition          | ✅ PASS | None            |
| 3. User Experience Requirements  | ✅ PASS | None            |
| 4. Functional Requirements       | ✅ PASS | None            |
| 5. Non-Functional Requirements   | ✅ PASS | None            |
| 6. Epic & Story Structure        | ✅ PASS | None            |
| 7. Technical Guidance            | ✅ PASS | None            |
| 8. Cross-Functional Requirements | ✅ PASS | None            |
| 9. Clarity & Communication       | ✅ PASS | None            |
