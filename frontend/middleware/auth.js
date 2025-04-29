import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuth();

  // Check if running on client side and if user is not authenticated
  if (process.client && !auth.isAuthenticated.value) {
    console.log('[Auth Middleware] User not authenticated, redirecting to login.');
    // Store the intended destination to redirect back after login
    const redirect = to.fullPath !== '/login' ? to.fullPath : '/';
    return navigateTo(`/login?redirect=${encodeURIComponent(redirect)}`);
  }
  // Allow navigation if authenticated or on server side (initial load handled by client)
}); 