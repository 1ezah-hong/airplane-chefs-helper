import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { normalizeNewYorkWorkbook } from './new-york-standard-data';

const data = normalizeNewYorkWorkbook(path.join(process.cwd(), 'AIRPALNE INFORMATION NEW YORK.xlsx'));
const outputPath = path.join(process.cwd(), 'data', 'new-york-standard-data.json');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
