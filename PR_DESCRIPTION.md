# 🚀 Pull Request: UI Improvements, Guest Login, and Refactoring

## 📝 Description
This PR introduces several UI enhancements and refactors the authentication flow to support a Guest Login mechanism. It also includes layout fixes to ensure consistent screen ratios and improves the user experience for system settings.

## ✨ Key Changes

### 1. 🏠 Room Settings UI (Visual Implementation)
- Added a settings modal within the Meeting Room.
- Included UI options for:
  - **Change Room Name** (Placeholder)
  - **Leave Room** (Placeholder)
- *Note: These features are currently UI-only and do not interact with the backend yet.*

### 2. 🔐 Authentication Refactoring
- **Social Login Updates**:
  - Removed actual social login integrations.
  - Clicking "Google" or "Line" buttons now triggers a **Guest Login**.
  - **Guest Credentials**:
    - Name: `Guest`
    - Email: `guest@guest.com`
    - Password: `guest`
    - Preferred Language: `en` (English)
- **Developer Shortcut**:
  - Added a small, hidden **(Dev)** button below the social login options.
  - Allows developers to bypass authentication and log in immediately for testing purposes.

### 3. 🎨 Layout & UI Fixes
- **Screen Ratio Standardization**:
  - Modified the main layout (`min-h-screen` → `h-screen overflow-hidden`) to prevent unwanted scrolling and maintain a consistent aspect ratio across different screen sizes.
  - Fixed issues where the screen ratio would shift dynamically when the contact list grew.
- **Login Screen**:
  - Centered and resized Google and Line login buttons for better visual balance.

### 4. ⚙️ System Settings Logic
- **Language Selection**:
  - Refactored the language change logic.
  - Language settings now apply **only after clicking the "Save" button** (previously applied immediately).
  - The confirmation push notification (Toast) is now displayed in the **newly selected language** upon saving.

## 📸 Screenshots
*(Optional: specific screenshots can be added here)*

## ✅ Testing Instructions
1. **Room Settings**: Enter a room, click the settings (gear) icon, and verify the UI appears.
2. **Guest Login**: On the login screen, click the Google or Line button key and verify you are logged in as "Guest" with English language settings.
3. **Dev Login**: Click the small "(Dev)" text below the buttons to verify instant login.
4. **Layout**: Check the Home screen with multiple contacts to ensure the outer layout remains fixed.
5. **Language Settings**: Go to System Settings, change the language, and click Save. Verify the toast message appears in the new language.
