import { ternSecureMiddleware, createRouteMatcher } from '@tern-secure/nextjs/server'

const publicPaths = createRouteMatcher(["/sign-in", "/sign-up", "/api/auth/*", "/terms", "/privacy"])


export const config = {
    runtime: 'experimental-edge',
    matcher: [
      "/",
      '/((?!_next|__/auth|__/firebase|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      '/(api|trpc)(.*)',
      "/api/:path*",
    ],
} 


export default ternSecureMiddleware(async (auth, request) => {
  // Skip auth check for public paths
  if (publicPaths(request)) {
    return
  }

  // Protect all other routes
  return auth.protect()
})
