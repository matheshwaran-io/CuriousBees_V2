import { ClerkAuthGuard } from './clerk.guard';

/**
 * Facade class that aliases ClerkAuthGuard to FirebaseAuthGuard.
 * 
 * This allows NestJS controllers to import and use the guard under its original
 * name without refactoring multiple files, ensuring API safety during the migration.
 */
export { ClerkAuthGuard as FirebaseAuthGuard };
