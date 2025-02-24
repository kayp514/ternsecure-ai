"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { CoffeeTechICon } from "./icons"

export function AuthHeader() {
  const pathname = usePathname()
  const isSignIn = pathname.includes('sign-in')
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex relative">
        <CoffeeTechICon />
        <span className="font-bold">TernSecure AI</span>
        </div>
        <nav>
          {isSignIn ? (
            <Button asChild variant="ghost">
              <Link href="/sign-up">Sign up</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}