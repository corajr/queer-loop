import inliner from './rollup-plugin-inliner';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';

const production = !process.env.ROLLUP_WATCH;

export default [{
    input: 'src/Index.bs.js',
    output: {
        name: 'index',
        file: 'index.js',
        sourcemap: 'inline',
        moduleName: 'index',
        format: 'iife'
    },
    plugins: [
        resolve({
            mainFields: ['jsnext:main', 'main']
        }),
        commonjs(),
        inliner({
            template: 'index.html.in',
            target: 'index.html',
        }),
        production && terser(),
        !production && serve(),
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
