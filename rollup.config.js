import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';


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
