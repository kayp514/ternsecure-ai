export interface DatabaseUserInput {
    id: string
    email: string
    avatar: string | null
    emailVerified: boolean
    createdAt: Date | null
    lastSignInAt: Date | null
}

export interface FirebaseAuthUser {
    uid: string
    email: string
    displayName?: string | null
    photoURL?: string | null
    tenantId: string
    emailVerified: boolean
    phoneNumber: string | null
    metadata: {
        creationTime: string | undefined
        lastSignInTime: string | undefined
      }
}

export interface SignUpResult {
    success: boolean
    user?: {
      uid: string
      email: string
      emailVerified: boolean
    }
    error?: {
      code: string
      message: string
    }
}
  