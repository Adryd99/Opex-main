export type RuntimeEnv = Record<string, string | undefined>;

export const runtimeEnv = ((import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {}) as RuntimeEnv;
