# Pull Request: Refactor Frontend for Real API Integration and Layout Optimization

## Description
This PR focuses on transitioning the application from a prototype state with simulated data to a production-ready state integrated with the actual backend. It involves removing all mock data generation, refining the dashboard layout, and stabilizing API communication patterns.

## Key Changes

### 1. Removal of Mock Data & Simulations
Removed hardcoded simulation logic across multiple pages to ensure the UI reflects real state from the backend/database:
- **Login Page**: Removed the "Guest Login" simulation via the Line provider.
- **Home Page**: Eliminated hardcoded friend/email validation logic in the "Add Friend" flow.
- **Chat & Direct Chat**: Removed initial AI greetings and simulated "auto-responses" that occurred after sending messages.
- **Active Meeting**: Scrapped mock participants (User A, User B) and sample translation logs that were automatically populated upon joining.
- **Bug Fixes**: Resolved an issue where the backend API was called with an `undefined` session ID by ensuring the LiveKit room session is fully established before syncing.
- **Meeting Minutes**: Removed hardcoded AI summary fallbacks; the UI now correctly shows empty states or actual generated data.

### 2. UI/UX Optimization
Refined the main dashboard to improve focus and navigation:
- **Single-Column Layout**: Removed the 2-column dashboard on the Home page. The Contact list is now the primary full-width view.
- **Room List Centralization**: Shifted the "Joined Rooms" display exclusively to the Sidebar, ensuring a consistent and less cluttered navigation experience.
- **Visual Consistency**: Maintained the premium aesthetic and glassmorphism elements while restructuring the layout.

### 3. API & State Management
- **Stability**: Cleaned up `client.ts` interceptors for better logging and error handling.
- **Service Alignment**: Updated `userApi.getMainData` and `authApi` to match the latest backend endpoint structures, facilitating seamless data fetching for user profiles, friend lists, and active rooms.

## Impact
- **Performance**: Reduced unnecessary `setTimeout` calls and memory-heavy mock arrays.
- **Reliability**: The application now reliably handles real-world data and empty states.
- **Usability**: Simplified navigation by delegating room management to the global sidebar.

## Verification
- Verified login flow works with the backend `general_login` and `signup` endpoints.
- Confirmed Home page renders correctly with real user-friend data.
- Tested Sidebar room navigation and creation triggers.
