
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

class CircuitBreakerService {
  private circuits = new Map<string, CircuitBreakerState>();
  private readonly failureThreshold = 5;
  private readonly recoveryTimeMs = 30000; // 30 seconds
  private readonly halfOpenMaxCalls = 3;

  private getCircuit(key: string): CircuitBreakerState {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed'
      });
    }
    return this.circuits.get(key)!;
  }

  canExecute(key: string): boolean {
    const circuit = this.getCircuit(key);
    const now = Date.now();

    switch (circuit.state) {
      case 'closed':
        return true;
      
      case 'open':
        if (now - circuit.lastFailureTime > this.recoveryTimeMs) {
          circuit.state = 'half-open';
          return true;
        }
        return false;
      
      case 'half-open':
        return true;
      
      default:
        return true;
    }
  }

  onSuccess(key: string): void {
    const circuit = this.getCircuit(key);
    circuit.failures = 0;
    circuit.state = 'closed';
  }

  onFailure(key: string): void {
    const circuit = this.getCircuit(key);
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.failures >= this.failureThreshold) {
      circuit.state = 'open';
      console.warn(`[CircuitBreaker] Circuit opened for ${key} after ${circuit.failures} failures`);
    }
  }

  async execute<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (!this.canExecute(key)) {
      throw new Error(`Circuit breaker is open for ${key}`);
    }

    try {
      const result = await operation();
      this.onSuccess(key);
      return result;
    } catch (error) {
      this.onFailure(key);
      throw error;
    }
  }
}

export const circuitBreakerService = new CircuitBreakerService();
