import resolve from 'rollup-plugin-node-resolve';

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
    ],
}];
