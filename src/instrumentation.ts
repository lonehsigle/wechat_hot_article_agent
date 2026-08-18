import { validateProductionConfig } from '@/lib/runtime-config';

export function register(): void {
  validateProductionConfig();
}
