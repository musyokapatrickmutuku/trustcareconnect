import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/backend/index.js',
  output: {
    file: '.dfx/local/canisters/backend/backend.js',
    format: 'cjs'
  },
  plugins: [
    resolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs()
  ]
};