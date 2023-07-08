const path = require('path');
const EslingPlugin = require('eslint-webpack-plugin');

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
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new EslingPlugin({ extensions: 'ts' })
    ],
};