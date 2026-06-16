# Coturne Matching App
**Technical Specification Document**

**Date:** June 16, 2026  
**Author:** Scrum Master (Antigravity AI)  
**Project:** Coturne ("Roomies")

---

## Table of Contents
1. [Project Requirements](#1-project-requirements)
2. [Scope and Objectives](#2-scope-and-objectives)
3. [Functional Specifications](#3-functional-specifications)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Technical Requirements](#5-technical-requirements)
6. [User Stories and Acceptance Criteria](#6-user-stories-and-acceptance-criteria)
7. [Timeline and Milestones](#7-timeline-and-milestones)
8. [Risk and Mitigation Strategy](#8-risk-and-mitigation-strategy)

---

## 1. Project Requirements
The **Coturne Matching App** aims to revolutionize the roommate-finding experience by eliminating intermediaries ("Zéro samsar · Zéro commission"). The platform empowers users to find compatible roommates through a modern, mobile-first interface featuring profile creation, preference tags, a swipe-based matching system, and real-time communication.

### Key Deliverables:
- A fully responsive web application optimized for mobile devices.
- User authentication and profile setup.
- A proprietary matching algorithm providing a "Match %" based on lifestyle preferences.
- A swipeable UI for discovering potential roommates.
- An integrated chat system for matched users.

## 2. Scope and Objectives
### In Scope:
- User registration, login, and secure authentication.
- Detailed profile creation including age, location (e.g., Casablanca), budget, and lifestyle tags (e.g., "Non-fumeur", "Lève-tôt", "Étudiante").
- Discovery feed with a Tinder-like swipe mechanism (Right to Like, Left to Pass).
- Mutual matching logic enabling a private chat room.
- Marketing/Video content generation infrastructure using Remotion.

### Out of Scope (for V1):
- In-app payment processing for rent or deposits.
- Legal lease agreement generation or signing.
- Background checks or identity verification beyond standard email/phone validation.

## 3. Functional Specifications
- **Authentication System:** Secure sign-up/sign-in via email and password, or OAuth providers.
- **Profile Management:**
  - Users can upload avatars.
  - Set structured data: Age, City/Neighborhood, Monthly Budget.
  - Select predefined lifestyle tags for better matching accuracy.
- **Discovery & Matching System:**
  - Algorithm calculates a match score (e.g., 92%) based on overlapping tags and budget compatibility.
  - UI displays one profile at a time.
  - Swipe right to indicate interest; swipe left to dismiss.
  - If two users swipe right on each other, a "Match" is created.
- **Real-Time Messaging:**
  - A dedicated inbox for matches.
  - Instant messaging capabilities with text and read receipts.
- **Reporting & Blocking:**
  - Ability to report suspicious users or block matches for safety.

## 4. Non-Functional Requirements
- **Performance:** Sub-second page load times utilizing Server-Side Rendering (SSR) and edge deployment.
- **Scalability:** The architecture must seamlessly handle sudden spikes in user traffic, specifically database reads for the discovery feed.
- **Usability:** The UI must adhere to modern design principles, utilizing smooth micro-animations, intuitive gestures (swiping), and accessible components.
- **Security:** Data at rest and in transit must be encrypted. User passwords and personal chats must adhere to strict privacy standards.

## 5. Technical Requirements
### Frontend Stack:
- **Framework:** React 19 with TanStack Start (for SSR and routing).
- **Styling:** Tailwind CSS v4, utilizing custom design tokens and dynamic palettes.
- **UI Components:** shadcn/ui (Radix UI primitives).
- **Animations:** Framer Motion / `motion` library for swipe gestures and page transitions.

### Backend & Infrastructure Stack:
- **Backend as a Service (BaaS):** Supabase (PostgreSQL for database, Supabase Auth for identity, Supabase Realtime for chat).
- **Deployment & Edge Compute:** Cloudflare Workers / Pages.
- **Media Generation:** Remotion for programmatic video generation (e.g., dynamic social media ads).

## 6. User Stories and Acceptance Criteria

### Epic 1: User Onboarding & Profiles
**User Story:** As a new user, I want to create an account and build a profile so that others can see if we are compatible.
- **Acceptance Criteria:**
  - User can sign up using an email address.
  - User is prompted to enter their Name, Age, Target City/Neighborhood, and Budget.
  - User must select at least 3 lifestyle tags (e.g., Non-fumeur).
  - Profile data is successfully saved to the database.

### Epic 2: Discovery & Matching
**User Story:** As a user looking for a roommate, I want to see potential matches and their compatibility score, so I can decide if I want to live with them.
- **Acceptance Criteria:**
  - A stack of profile cards is presented to the user.
  - Each card displays the user's details and a calculated "Match %".
  - Swiping right logs a 'like' in the database; swiping left logs a 'pass'.
  - If a mutual 'like' occurs, a success notification appears.

### Epic 3: Communication
**User Story:** As a matched user, I want to chat with my potential roommate to discuss living arrangements.
- **Acceptance Criteria:**
  - User can access a list of their current matches.
  - Tapping a match opens a real-time chat interface.
  - Messages are delivered instantly without page reloads.
  - Chat history is preserved.

## 7. Timeline and Milestones (Proposed)
We will follow an Agile methodology with 2-week Sprints.

- **Sprint 1 (Weeks 1-2): Foundation & Auth**
  - Project setup, CI/CD configuration.
  - Database schema design (Supabase).
  - Implementation of Authentication and User Profile creation.
- **Sprint 2 (Weeks 3-4): Discovery Feed & Matching Engine**
  - Development of the matching algorithm.
  - Implementation of the swipe UI using Framer Motion.
  - Logic for mutual matching.
- **Sprint 3 (Weeks 5-6): Real-time Chat & Polish**
  - Integration of Supabase Realtime for messaging.
  - Chat UI development.
  - UI/UX polish, micro-animations, and error handling.
- **Sprint 4 (Weeks 7-8): QA, Video Generation & Launch**
  - Finalizing Remotion templates for marketing.
  - Comprehensive end-to-end testing and bug fixing.
  - Beta deployment to Cloudflare and soft launch.

## 8. Risk and Mitigation Strategy

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Low user density at launch** (The "Empty Room" problem) | High | High | Pre-launch marketing using dynamic Remotion videos. Focus launch on specific high-density neighborhoods (e.g., Maarif, Casablanca) before expanding. |
| **Inappropriate behavior or spam** | High | Medium | Implement an easy-to-use report and block feature. Use automated moderation on chat and profile text if necessary. |
| **Performance bottlenecks with complex queries** | Medium | Low | Utilize Supabase Edge Functions and optimize PostgreSQL indexes specifically for the geographic and tag-matching queries. |
| **Complex swipe animations causing jank on older devices** | Medium | Medium | Extensively test Framer Motion performance on mid-tier Android devices. Provide a fallback button-based (X and Heart) interaction mode. |
