
// SIMPLIFIED: Circuit breaker to prevent infinite loops and retries
class CircuitBreakerService {
  private failures = new Map<string, number>();
  private lastFailure = new Map<string, number>();
  private readonly maxFailures = 3;
  private readonly resetTimeoutMs = 30000;

  canProceed(operationId: string): boolean {
    const failures = this.failures.get(operationId) || 0;
    const lastFailure = this.lastFailure.get(operationId) || 0;
    const now = Date.now();

    if (now - lastFailure > this.resetTimeoutMs) {
      this.failures.set(operationId, 0);
      return true;
    }

    if (failures >= this.maxFailures) {
      if (import.meta.env.DEV) console.warn(`[CircuitBreaker] Operation ${operationId} is circuit broken (${failures} failures)`);
      return false;
    }

    return true;
  }

  recordFailure(operationId: string): void {
    const failures = (this.failures.get(operationId) || 0) + 1;
    this.failures.set(operationId, failures);
    this.lastFailure.set(operationId, Date.now());
    
    if (import.meta.env.DEV) console.warn(`[CircuitBreaker] Recorded failure for ${operationId} (${failures}/${this.maxFailures})`);
  }

  recordSuccess(operationId: string): void {
    this.failures.set(operationId, 0);
    if (import.meta.env.DEV) console.log(`[CircuitBreaker] Recorded success for ${operationId}, resetting failure count`);
  }

  getStatus(operationId: string): { failures: number; isOpen: boolean; canRetry: boolean } {
    const failures = this.failures.get(operationId) || 0;
    const lastFailure = this.lastFailure.get(operationId) || 0;
    const now = Date.now();
    const isOpen = failures >= this.maxFailures;
    const canRetry = now - lastFailure > this.resetTimeoutMs;

    return { failures, isOpen, canRetry };
  }
}

export const circuitBreaker = new CircuitBreakerService();
