import fs from 'node:fs';
import openapiTS, { astToString } from 'openapi-typescript';

const version = process.argv[process.argv.length - 1];

if (process.argv.length < 3 || version === '-h' || version === '--help') {
	console.log(`Usage:\n\nnode gen-openapi.mjs <version>\n`);
	process.exit();
}

const warningMessage =
	'// DO NOT MAKE ANY CHANGES HERE!\n// This file is automatically generated using openapi-typescript\n';

const semverRegex =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

if (!semverRegex.test(version)) {
	throw new Error('Received invalid release version (semver)');
}

const ast = await openapiTS(
	`https://converter.swagger.io/api/convert?url=https://raw.githubusercontent.com/juanfont/headscale/refs/tags/v${version}/gen/openapiv2/headscale/v1/headscale.swagger.json`
);

fs.writeFileSync(
	`./src/lib/api/gen/headscale.ts`,
	`${warningMessage}\nexport const version = "${version}"\n\n` + astToString(ast)
);
