import { env } from "~/env";

export interface EnvironmentConfig {
  name: string;
  description: string;

  // User generation settings
  allowCustomEmails: boolean;
  defaultBaseEmail: string;

  // Future features
  autoCreateSubscriptions: boolean;
  autoCreateRelatedData: boolean;
  defaultSubjectId?: number;
}

export const environmentConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    name: "dev",
    description: "Local development environment",

    // User generation settings
    allowCustomEmails: true,
    defaultBaseEmail: env.ADMIN_EMAIL ?? "dev@example.com",

    // TODO: Add configs to seed subscriptions and other data
    autoCreateSubscriptions: false,
    autoCreateRelatedData: false,
  },
  // beta: {
  //   name: "beta",
  //   description: "Integration testing environment",

  //   // User generation settings
  //   allowCustomEmails: false,
  //   defaultBaseEmail: "qa@beta.example.com",

  //   // Future features
  //   autoCreateSubscriptions: true,
  //   autoCreateRelatedData: false,
  //   defaultSubjectId: 1,
  // },
  // gamma: {
  //   name: "gamma",
  //   description: "Staging environment for final testing",

  //   // User generation settings
  //   allowCustomEmails: false,
  //   defaultBaseEmail: "testing@gamma.example.com",

  //   // Future features
  //   autoCreateSubscriptions: true,
  //   autoCreateRelatedData: false,
  //   defaultSubjectId: 1,
  // },
};

export function getEnvironmentConfig(env: string): EnvironmentConfig {
  const config = environmentConfigs[env];
  if (!config) {
    const validEnvs = Object.keys(environmentConfigs);
    throw new Error(
      `Invalid environment: ${env}. Valid options: ${validEnvs.join(", ")}`,
    );
  }
  return config;
}

export function validateEnvironment(env: string): void {
  getEnvironmentConfig(env);
}

export function listEnvironments(): EnvironmentConfig[] {
  return Object.values(environmentConfigs);
}
