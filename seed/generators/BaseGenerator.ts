import {
  getEnvironmentConfig,
  type EnvironmentConfig,
} from "../config/environments";

export abstract class BaseGenerator<TOptions = unknown, TResult = unknown> {
  constructor(protected environment: string) {}

  abstract generate(options: TOptions): Promise<TResult>;

  protected getEnvironmentConfig(): EnvironmentConfig {
    return getEnvironmentConfig(this.environment);
  }

  protected log(message: string): void {
    console.log(`[${this.environment.toUpperCase()}] ${message}`);
  }

  protected logError(message: string): void {
    console.error(`[${this.environment.toUpperCase()}] ❌ ${message}`);
  }

  protected logSuccess(message: string): void {
    console.log(`[${this.environment.toUpperCase()}] ✅ ${message}`);
  }
}
