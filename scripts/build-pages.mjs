import { mkdir, copyFile, writeFile } from 'node:fs/promises';

// GitHub Pages publishes the committed /docs directory on main.
await mkdir(new URL('../docs/', import.meta.url), { recursive: true });
await copyFile(new URL('../dist/index.html', import.meta.url), new URL('../docs/index.html', import.meta.url));
await writeFile(new URL('../docs/.nojekyll', import.meta.url), '');
console.log('GitHub Pages build ready: docs/index.html');
