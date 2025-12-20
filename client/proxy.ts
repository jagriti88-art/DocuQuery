import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 1. Add the root route '/' to the public matchers
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)', 
  '/sign-up(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // 2. If it's NOT a public route, protect it
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}