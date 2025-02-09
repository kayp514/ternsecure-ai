import { ternSecureMiddleware, createRouteMatcher } from '@tern-secure/nextjs/server'

const publicPaths = createRouteMatcher([
    '/sign-in',
    '/sign-up',
    '/api/*',
  ])


// Configure protected routes
export const config = {
    matcher: [
      // Skip Next.js internals and all static files, unless found in search params
      '/((?!_next|__/auth|__/firebase|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      // Always run for API routes
      '/(api|trpc)(.*)',
    ],
  }  //user can add more config here

// Initialize ternSecureMiddleware with custom config and must be edge runtime
export default ternSecureMiddleware(async (auth, request) => {
    if(!publicPaths(request)) {
        auth.protect()
    }
})