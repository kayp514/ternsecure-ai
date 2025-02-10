'use client'

import { SignIn } from '@tern-secure/nextjs'
import { ternSecureAuth } from '@tern-secure/nextjs'
import { verifyDatabaseUser } from '../../../(chat)/actions'


export default function Page() {
    const handleOnSuccess = async () => {
        try {
        const currentUser = await ternSecureAuth.currentUser

        if(!currentUser) {
            throw new Error("No user found after signin")
        }

        if (!currentUser.email) {
            await ternSecureAuth.signOut()
            throw new Error("No email found for user")
        }
        
        const result  = await verifyDatabaseUser(currentUser.email)

        if (!result.success) {
            console.error("Verification failed:", result.error?.message)
            await ternSecureAuth.signOut()
            throw new Error(result.error?.message || "Verification failed")
        }


    } catch (error) {
        console.error("Error in handleOnSuccess:", error)
    }
}

    return <SignIn onSuccess={handleOnSuccess} />
}