'use client'

import { SignIn } from '@tern-secure/nextjs'


export default function Page() {


const handleError = (error: Error) => {
    console.error("Sign in error:", error)
    // Handle error (show toast, notification, etc.)
}
    return <SignIn />
}