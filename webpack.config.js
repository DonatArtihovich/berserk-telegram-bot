const path = require('path');

module.exports = {
    target: 'node',
    entry: './src/index.ts',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            { test: /\.ts$/i, use: 'ts-loader' }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    }
};