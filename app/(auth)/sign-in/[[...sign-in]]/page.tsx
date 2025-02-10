'use client'

import { SignIn } from '@tern-secure/nextjs'
import { ternSecureAuth } from '@tern-secure/nextjs'
import { verifyDatabaseUser, createDatabaseUser } from '../../../(chat)/actions'
import type { FirebaseAuthUser } from '@/lib/db/types'



export default function Page() {
    const handleOnSuccess = async () => {
        try {
            const currentUser = await ternSecureAuth.currentUser
            console.log("1. Auth user:", currentUser)

            if(!currentUser) {
                console.error("2. No auth user found")
                throw new Error("No user found after signin")
            }
            
            const vRes  = await verifyDatabaseUser(currentUser.uid)
            console.log("3. Database verification result:", vRes)
            
            if (!vRes.success) {
                const firebaseUser: FirebaseAuthUser = {
                    uid: currentUser.uid,
                    email: currentUser.email!,
                    displayName: currentUser.displayName || null,
                    photoURL: currentUser.photoURL || null,
                    tenantId: currentUser.tenantId || 'default',
                    emailVerified: currentUser.emailVerified || false,
                    phoneNumber: currentUser.phoneNumber || null,
                    metadata: {
                      creationTime: currentUser.metadata.creationTime,
                      lastSignInTime: currentUser.metadata.lastSignInTime,
                    },
                  }

                console.log("3. User not found in database, creating new user")
                const createRes = await createDatabaseUser(firebaseUser)
                console.log("4. Create user result:", createRes)

                if (!createRes.success) {
                    console.error("5. Failed to create user:", createRes.error)
                    throw new Error(createRes.error?.message || "Failed to create user record")
                }

                const reverifyRes =  await verifyDatabaseUser(currentUser.uid)
                if (!reverifyRes.success) {
                    console.error("6. Failed to verify user after creation:", reverifyRes.error)
                    throw new Error(reverifyRes.error?.message || "Failed to verify user after creation")
                }
            }

        console.log("7. User verified successfully")
        
        } catch (error) {
            console.error("Error in handleOnSuccess:", error)
            await ternSecureAuth.signOut()
        }
    }
    return <SignIn onSuccess={handleOnSuccess} />
}