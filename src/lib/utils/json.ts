export function stripJsonTrailingCommas(content: string): string {
	return content.replace(/(?<=(true|false|null|["\d}\]])\s*),(?=\s*[}\]])/g, '');
}
