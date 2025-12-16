# GeoLingua Mobile App - Design Guidelines

## Overview
GeoLingua is a P2P translator marketplace connecting users with professional translators for instant or scheduled video translation calls. The app serves Georgians abroad and foreigners in Georgia, emphasizing speed, trust, and professional service delivery similar to Uber/Bolt.

---

## Authentication

**Auth Required**: Yes - users and translators need distinct accounts with different capabilities.

**Implementation**:
- Include **Apple Sign-In** (iOS requirement) and **Google Sign-In**
- Email/password as fallback option
- **Role selection** during onboarding: "I need a translator" vs. "I'm a translator"
- Translator onboarding includes additional profile setup (languages, categories, verification status)
- Login screen: Simple, trust-building design with platform benefits listed
- Account screen must include:
  - Profile editing (name, phone, avatar)
  - Language preferences
  - Payment methods
  - Logout with confirmation
  - Delete account (Settings > Account > Delete, double confirmation)

---

## Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs)

**Tab Structure** (for Users):
1. **Home** - Request translator, view active requests
2. **History** - Past translation calls and bookings
3. **Search** - Browse available translators, filter by language/category
4. **Profile** - Account settings, payment history, support

**Tab Structure** (for Translators):
1. **Dashboard** - Incoming requests, online/offline toggle
2. **Calls** - Active and upcoming calls
3. **Earnings** - Stats, payout requests
4. **Profile** - Languages, categories, ratings, settings

**Floating Action Button**: "Request Translator" (prominent on Home tab for users) or "Go Online" toggle (for translators)

---

## Screen Specifications

### 1. **Home Screen** (User)
- **Purpose**: Quickly request instant or scheduled translation
- **Layout**:
  - **Header**: Transparent, greeting text, notification bell (right)
  - **Main content**: Scrollable
    - Quick request card with language pair selector (large, prominent)
    - Category selector (horizontal scrollable chips)
    - "Instant" vs "Scheduled" toggle
    - Price preview (₾/min based on category)
    - "Request Translator" button (primary CTA)
    - Active request status card (if pending/in-progress)
  - **Safe area insets**: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
- **Components**: Language dropdowns, category chips, price display, status cards

### 2. **Translator Matching Screen** (Modal)
- **Purpose**: Show real-time matching progress after request broadcast
- **Layout**:
  - **Header**: Custom, "Finding Translator..." title, close button (right)
  - **Main content**: Centered
    - Animated matching indicator (pulsing circle or Lottie animation)
    - "Broadcasted to X translators" counter
    - Time remaining countdown (60s for instant)
    - Cancel request button (secondary, bottom)
  - **Safe area insets**: top: headerHeight + Spacing.xl, bottom: insets.bottom + Spacing.xl
- **Visual feedback**: Live updates via Socket.io show when translators view the request

### 3. **Video Call Screen** (Full Screen, Modal)
- **Purpose**: Twilio video call interface with timer and controls
- **Layout**:
  - **Header**: None (full screen video)
  - **Main content**: 
    - Remote video (full screen)
    - Local video (PiP, draggable, top-right)
    - Floating controls (bottom center):
      - Mute/unmute
      - Camera on/off
      - End call (red, prominent)
    - Call timer (top-left, translucent background)
    - Translator info card (top-center, collapsible)
  - **Safe area insets**: Respect notch/status bar only
- **Components**: Video views, floating buttons with drop shadows (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)

### 4. **Translator Dashboard** (Translator)
- **Purpose**: Show incoming requests and online status
- **Layout**:
  - **Header**: Custom, "Dashboard" title, online/offline toggle (right)
  - **Main content**: List
    - Online status banner (green if online, gray if offline)
    - Incoming requests cards (real-time via Socket.io)
      - Language pair, category, price/min
      - Accept/Decline buttons
      - Time remaining (countdown)
    - Empty state: "Go online to receive requests"
  - **Safe area insets**: top: Spacing.xl (non-transparent header), bottom: tabBarHeight + Spacing.xl
- **Components**: Toggle switch, request cards with CTAs, countdown timers

### 5. **Translator Profile Setup** (Modal/Stack)
- **Purpose**: Onboarding flow for translators to set up languages and categories
- **Layout**:
  - **Header**: Default navigation, "Set Up Profile" title, skip button (right, optional)
  - **Main content**: Scrollable form
    - Language pairs selector (multi-select, checkboxes)
    - Categories selector (chips, multi-select)
    - Bio text area
    - Location input
  - Form buttons: "Save" in header (right), "Cancel" in header (left)
  - **Safe area insets**: top: Spacing.xl, bottom: insets.bottom + Spacing.xl
- **Components**: Multi-select lists, text inputs, chips

### 6. **History Screen** (User/Translator)
- **Purpose**: View past translation calls and bookings
- **Layout**:
  - **Header**: Default navigation, "History" title, filter icon (right)
  - **Main content**: List
    - Call history cards showing:
      - Date/time
      - Language pair
      - Duration
      - Total cost (user) or earnings (translator)
      - Rating stars
  - Pull to refresh
  - **Safe area insets**: top: Spacing.xl, bottom: tabBarHeight + Spacing.xl
- **Components**: List items with ratings, filter modal

### 7. **Rating Screen** (Modal, after call)
- **Purpose**: Rate translator/user after call completion
- **Layout**:
  - **Header**: Custom, "Rate Your Experience" title
  - **Main content**: Centered form
    - Star rating selector (1-5)
    - Comment text area (optional)
    - "Submit" button (primary, below form)
    - "Skip" button (text only, below)
  - **Safe area insets**: top: headerHeight + Spacing.xl, bottom: insets.bottom + Spacing.xl

---

## Design System

### Color Palette
- **Primary**: #2563EB (Professional blue, trust-building)
- **Secondary**: #10B981 (Success green, for online/active states)
- **Accent**: #F59E0B (Amber, for AI translator option)
- **Error**: #EF4444 (Red, for critical actions)
- **Background**: #F9FAFB (Light gray)
- **Surface**: #FFFFFF
- **Text Primary**: #111827
- **Text Secondary**: #6B7280
- **Border**: #E5E7EB

### Typography
- **Headings**: SF Pro Display (iOS) / Roboto (Android), Bold
- **Body**: SF Pro Text (iOS) / Roboto (Android), Regular
- **Pricing**: Tabular figures, Medium weight

### Key Components

**Language Selector**:
- Dropdown with flag icons
- Format: "🇬🇪 Georgian → 🇬🇧 English"
- Large, tappable area (minimum 56dp height)

**Category Chips**:
- Horizontal scrollable
- Icons: 💬 General, 📄 Administrative, 💼 Business, 🏥 Medical, ⚖️ Legal
- Selected state: Filled with primary color
- Unselected: Outlined

**Request Cards**:
- Elevated cards with subtle shadow
- Visual hierarchy: Language pair (largest), category, price
- Time-sensitive: Countdown in red when <15 seconds

**Status Indicators**:
- Online: Green dot + "Online"
- Offline: Gray dot + "Offline"
- In Call: Blue dot + "In Call"

**Floating Action Button** (Request Translator / Go Online):
- Position: Bottom-right, 16dp from edges
- Large (64dp diameter)
- Drop shadow: shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- Icon: Plus (user) or Power (translator)

### Visual Feedback
- All touchable elements have press states (opacity: 0.7 on press)
- Real-time updates show smooth transitions (fade in/out, slide)
- Loading states use skeleton screens, not spinners
- Success animations for matched requests (checkmark animation)

---

## Assets

**Critical Assets**:
1. **Language flag icons** (16 flags for supported languages)
2. **Category icons** (5 icons: conversation, document, briefcase, medical cross, scales)
3. **Translator avatars** (placeholder set for unverified profiles, professional headshot style)
4. **AI translator visual** (robot/AI icon to differentiate AI option)
5. **Matching animation** (Lottie file: pulsing circles or search animation)
6. **Empty state illustrations**:
   - No active requests
   - No history
   - Offline mode
   - No matching translators

**Do NOT use emojis in the final UI**. Use Feather icons or SF Symbols.

---

## Accessibility & Localization
- Support **Georgian and English** UI languages
- Right-to-left support for Arabic/Hebrew (future)
- Minimum tap target: 44x44pt (iOS) / 48x48dp (Android)
- VoiceOver/TalkBack labels for all interactive elements
- Color contrast ratios meet WCAG AA (4.5:1 for text)

---

## Real-time Features
- Socket.io connection status indicator (subtle, top of screen)
- Live translator availability counter on home screen
- Push notifications for:
  - Incoming request accepted (user)
  - New request broadcast (translator)
  - Call starting soon (scheduled)
  - Payment completed