/**
 * Maps technical Firebase error codes to user-friendly, professional messages.
 * Designed for non-technical users to understand and take action.
 */
export const getFriendlyErrorMessage = (error) => {
  const code = error?.code || '';
  
  switch (code) {
    // Login & Shared Errors
    case 'auth/invalid-email':
      return "That email address doesn't look right. Please check for any typos.";
    
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return "The email or password you entered is incorrect. Please try again.";
    
    case 'auth/too-many-requests':
      return "Too many failed attempts. For your security, please wait a moment before trying again.";
    
    case 'auth/network-request-failed':
      return "We're having trouble connecting. Please check your internet connection and try again.";

    // Registration Errors
    case 'auth/email-already-in-use':
      return "This email is already exist. Try logging in instead or use a different email.";
    
    case 'auth/weak-password':
      return "Your password is too short. Please use at least 6 characters for a more secure account.";
    
    case 'auth/operation-not-allowed':
      return "Email/password sign-in is currently disabled. Please contact support.";

    // Fallback for unknown errors
    default:
      return "Oops! Something went wrong on our end. Please try again in a few seconds.";
  }
};
