import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import livereload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';

const production = !process.env.ROLLUP_WATCH;

export default [{
    input: 'src/Index.bs.js',
    output: {
        name: 'index',
        file: 'index.js',
        sourcemap: true,
        format: 'iife'
    },
    plugins: [
        resolve(),
        !production && serve(),
        !production && livereload(),
        production && terser()
    ],
},
{
    input: 'src/DecodeWorker.bs.js',
    output: {
        name: 'worker',
        file: 'worker.js',
        sourcemap: true,
        format: 'iife'
    },
    plugins: [
        resolve(),
        production && terser()
    ],
}];
