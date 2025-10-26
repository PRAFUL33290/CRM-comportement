import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68fcc77a5d0474c938c295af", 
  requiresAuth: true // Ensure authentication is required for all operations
});
