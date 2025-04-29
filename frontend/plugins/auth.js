import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(async (nuxtApp) => {
  const auth = useAuth();
  
  // Add navigation guards
  nuxtApp.hook('app:created', () => {
    const router = nuxtApp.$router;
    
    // Define protected routes that require authentication
    const protectedRoutes = ['/watchlist'];
    
    router.beforeEach((to, from, next) => {
      // Check if the route requires authentication
      const requiresAuth = protectedRoutes.some(route => 
        to.path === route || to.path.startsWith(`${route}/`)
      );
      
      if (requiresAuth && !auth.isAuthenticated.value) {
        // Redirect to login if authentication is required but user is not authenticated
        next({ path: '/login', query: { redirect: to.fullPath } });
      } else {
        // Proceed to the route
        next();
      }
    });
  });
  
  // Set up global auth object
  return {
    provide: {
      auth
    }
  };
}); 