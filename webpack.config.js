module.exports = {
    entry: {
        index: './src/Index.bs.js',
        worker: './src/DecodeWorker.bs.js'
    },
    mode: 'development',
    output: {
        path: __dirname,
        filename: '[name].js',
        publicPath: "/"
    },
    node: {
        fs: 'empty'
    }
};
