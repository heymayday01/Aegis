import type { PatternModule } from '../types';

export { emailPattern } from './email';
export { apiKeyPattern } from './apiKey';
export { phonePattern } from './phone';
export { creditCardPattern } from './creditCard';
export { aadhaarPattern } from './aadhaar';
export { panPattern } from './pan';
export { ipAddressPattern } from './ip';

import { emailPattern } from './email';
import { apiKeyPattern } from './apiKey';
import { phonePattern } from './phone';
import { creditCardPattern } from './creditCard';
import { aadhaarPattern } from './aadhaar';
import { panPattern } from './pan';
import { ipAddressPattern } from './ip';
import type { PatternModule } from '../types';

// Ordered by descending baseConfidence so de-duplication keeps the most-specific match.
export const ALL_PATTERNS: PatternModule[] = [
  aadhaarPattern,
  apiKeyPattern,
  creditCardPattern,
  emailPattern,
  panPattern,
  phonePattern,
  ipAddressPattern,
];
