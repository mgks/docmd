import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/client/index.ts')],
    bundle: true,
    platform: 'browser',
    target: 'es2022',
    format: 'esm',
    outdir: path.resolve(__dirname, 'dist/client'),
    external: ['aiplug'],
    minify: false,
    sourcemap: 'inline',
    loader: { '.css': 'css' },
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    }),
  });
  console.log('AI plugin client built to dist/client/');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
