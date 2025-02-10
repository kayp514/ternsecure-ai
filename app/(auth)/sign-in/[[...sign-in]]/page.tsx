'use client'

import { SignIn } from '@tern-secure/nextjs'
import { ternSecureAuth } from '@tern-secure/nextjs'
import { verifyDatabaseUser } from '../../../(chat)/actions'
import { getUser } from '@/lib/db/queries'



export default function Page() {
    const handleOnSuccess = async () => {
        try {
        const currentUser = await ternSecureAuth.currentUser

        if(!currentUser) {
            throw new Error("No user found after signin")
        }
        
        const result  = await getUser(currentUser.uid)

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