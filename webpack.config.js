module.exports = {
    entry: './src/Index.bs.js',
    mode: 'development',
    output: {
        path: __dirname,
        filename: 'bundle.js',
    },
    node: {
        fs: 'empty'
    }
};
