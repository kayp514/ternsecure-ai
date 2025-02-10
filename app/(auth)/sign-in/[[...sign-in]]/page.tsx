'use client'

import { SignIn } from '@tern-secure/nextjs'
import { ternSecureAuth } from '@tern-secure/nextjs'
import { verifyDatabaseUser } from '../../../(chat)/actions'
import type { FirebaseAuthUser } from '@/lib/db/types';


export default function Page() {
    const handleOnSuccess = async () => {
        try {
            const currentUser = await ternSecureAuth.currentUser

            if(!currentUser) {
                throw new Error("No user found after signin")
            }

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
            
            const vRes  = await verifyDatabaseUser(currentUser.uid, firebaseUser)
            
            if (!vRes.success) {
                console.error("3. Process failed:", vRes.error)
                throw new Error(vRes.error?.message || "Verification failed")
            }
        
        } catch (error) {
            console.error("Error in handleOnSuccess:", error)
            throw error
        }
    }
    return <SignIn onSuccess={handleOnSuccess} />
}