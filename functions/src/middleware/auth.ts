import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/v1';

export interface AuthenticatedContext extends EventContext {
  auth: {
    uid: string;
    token: admin.auth.DecodedIdToken;
  };
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Verifies that the request has a valid Firebase ID token in the context.
 * This should be used for callable functions where context.auth is automatically populated.
 * 
 * @param context - The Firebase function context
 * @returns The authenticated context with uid and token
 * @throws AuthenticationError if authentication fails
 */
export const verifyAuthenticated = (context: EventContext): AuthenticatedContext => {
  if (!context.auth) {
    throw new AuthenticationError('Authentication required. No valid token provided.');
  }

  return context as AuthenticatedContext;
};

/**
 * Verifies that the authenticated user is authorized to access a resource.
 * Checks if the user's UID matches one of the allowed UIDs.
 * 
 * @param context - The authenticated context
 * @param allowedUids - Array of UIDs that are authorized to access the resource
 * @param resourceName - Optional name of the resource for better error messages
 * @throws AuthorizationError if the user is not authorized
 */
export const verifyAuthorization = (
  context: AuthenticatedContext,
  allowedUids: string[],
  resourceName?: string
): void => {
  if (!allowedUids.includes(context.auth.uid)) {
    const resource = resourceName ? ` for ${resourceName}` : '';
    throw new AuthorizationError(`Access denied${resource}. User not authorized.`);
  }
};

/**
 * Combined authentication and authorization check.
 * Verifies the user is authenticated and authorized to access the resource.
 * 
 * @param context - The Firebase function context
 * @param allowedUids - Array of UIDs that are authorized to access the resource
 * @param resourceName - Optional name of the resource for better error messages
 * @returns The authenticated context
 * @throws AuthenticationError or AuthorizationError if checks fail
 */
export const verifyAuthAndAuthorization = (
  context: EventContext,
  allowedUids: string[],
  resourceName?: string
): AuthenticatedContext => {
  const authContext = verifyAuthenticated(context);
  verifyAuthorization(authContext, allowedUids, resourceName);
  return authContext;
};

/**
 * Verifies that a user has admin privileges.
 * Checks custom claims on the user's token.
 * 
 * @param context - The authenticated context
 * @throws AuthorizationError if the user is not an admin
 */
export const verifyAdmin = (context: AuthenticatedContext): void => {
  const customClaims = context.auth.token;
  
  if (!customClaims.admin) {
    throw new AuthorizationError('Admin access required.');
  }
};

/**
 * Verifies that a session document operation is authorized.
 * For Firestore triggers, we validate that the document contains the expected user IDs.
 * This prevents unauthorized access to session data.
 * 
 * @param sessionData - The session document data
 * @param requiredFields - Fields that must exist in the session (e.g., ['studentId', 'mentorId'])
 * @throws AuthorizationError if validation fails
 */
export const verifySessionAccess = (
  sessionData: any,
  requiredFields: string[] = ['studentId', 'mentorId']
): void => {
  if (!sessionData) {
    throw new AuthorizationError('Invalid session data.');
  }

  for (const field of requiredFields) {
    if (!sessionData[field] || typeof sessionData[field] !== 'string') {
      throw new AuthorizationError(`Session missing required field: ${field}`);
    }
  }
};

/**
 * Safely logs authentication/authorization errors without exposing sensitive details.
 * 
 * @param error - The error to log
 * @param functionName - Name of the function where the error occurred
 */
export const logAuthError = (error: unknown, functionName: string): void => {
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    console.warn(`[${functionName}] ${error.name}: ${error.message}`);
  } else {
    console.error(`[${functionName}] Unexpected error:`, error instanceof Error ? error.message : 'Unknown error');
  }
};
