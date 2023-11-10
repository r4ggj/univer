import fs from 'node:fs';
import path from 'node:path';

import diff from 'deep-diff';
import { load } from 'ts-import';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const pkgs = fs.readdirSync(path.resolve(__dirname, '../packages'));

const defaultLocaleTyle = 'en-US';
const localeTypes = ['zh-CN'];

for (const pkg of pkgs) {
    const values = [];

    const defaultLocalePath = path.resolve(__dirname, `../packages/${pkg}/src/locale/${defaultLocaleTyle}.ts`);

    if (fs.existsSync(defaultLocalePath)) {
        const result = await load(defaultLocalePath);

        values.push({
            localeType: defaultLocaleTyle,
            data: result.default,
        });
    }

    for (const localeType of localeTypes) {
        const localePath = path.resolve(__dirname, `../packages/${pkg}/src/locale/${localeType}.ts`);

        if (fs.existsSync(localePath)) {
            const result = await load(localePath);

            values.push({
                localeType,
                data: result.default,
            });
        }
    }

    if (values.length > 1) {
        for (let i = 1; i < values.length; i++) {
            const patch = diff(values[0].data, values[i].data);

            if (patch) {
                fs.writeFileSync(
                    path.resolve(__dirname, `../packages/${pkg}/src/locale/${values[i].localeType}.diff.json`),
                    JSON.stringify(
                        patch.filter((p) => p.kind !== 'E'),
                        null,
                        4
                    ),
                    'utf-8'
                );
            }
        }
    }
}
