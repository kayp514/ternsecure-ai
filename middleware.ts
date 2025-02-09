import { ternSecureMiddleware, createRouteMatcher } from '@tern-secure/nextjs/server'

const publicPaths = createRouteMatcher(["/sign-in", "/sign-up", "/api/auth/*", "/terms", "/privacy"])


export const config = {
    matcher: [
      "/",
      '/((?!_next|__/auth|__/firebase|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      '/(api|trpc)(.*)',
      "/api/:path*",
    ],
} 


export default ternSecureMiddleware(async (auth, request) => {
})