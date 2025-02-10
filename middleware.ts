import { ternSecureMiddleware, createRouteMatcher } from '@tern-secure/nextjs/server'


export const runtime = 'edge'

const publicPaths = createRouteMatcher([
  '/sign-in',
  '/sign-up',
  '/api/auth/*',
  '/api/*'
])


export const config = {
    matcher: [
      '/((?!_next|__/auth|__/firebase|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      '/api/((?!auth).*)'
    ],
} 


export default ternSecureMiddleware(async (auth, request) => {
    if(!publicPaths(request)) {
      await auth.protect()
    }
})