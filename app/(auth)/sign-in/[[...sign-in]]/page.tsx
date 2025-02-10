'use client'

import { SignIn } from '@tern-secure/nextjs'
import { ternSecureAuth } from '@tern-secure/nextjs'
import { verifyDatabaseUser } from '../../../(chat)/actions'



export default function Page() {
    const handleOnSuccess = async () => {
        try {
            const currentUser = await ternSecureAuth.currentUser
            console.log("1. Auth user:", currentUser)

            if(!currentUser) {
                console.error("2. No auth user found")
                throw new Error("No user found after signin")
            }
            
            const result  = await verifyDatabaseUser(currentUser.uid)
            console.log("3. Database verification result:", result)
            
            if (!result.success) {
                console.error("Verification failed:", result.error?.message)
                await ternSecureAuth.signOut()
                throw new Error(result.error?.message || "Verification failed")
            }
        
        } catch (error) {
            console.error("Error in handleOnSuccess:", error)
            await ternSecureAuth.signOut()
        }
    }
    return <SignIn onSuccess={handleOnSuccess} />
}