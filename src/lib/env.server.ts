import 'server-only';
import { parseServerEnv } from './env.schema';

export { parseServerEnv, type ServerEnv } from './env.schema';

export const serverEnv = parseServerEnv(process.env);
