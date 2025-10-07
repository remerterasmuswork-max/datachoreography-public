import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68e2ba99af8498ed4e8383e2", 
  requiresAuth: true // Ensure authentication is required for all operations
});
