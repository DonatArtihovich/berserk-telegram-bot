const path = require('path');
const EslingPlugin = require('eslint-webpack-plugin');

module.exports = {
    target: 'node',
    entry: './src/index.ts',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        assetModuleFilename: pathData => {
            const filepath = path.dirname(pathData.filename).split('/').slice(1).join('/');
            return `${filepath}/[name][ext]`;
        },
    },
    module: {
        rules: [
            { test: /\.ts$/i, use: 'ts-loader' },
            {
                test: /\.(png|svg|jpg|jpeg|gif|ogg|mp3|wav)$/i,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
    plugins: [
        new EslingPlugin({ extensions: 'ts' })
    ],
};