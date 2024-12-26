
export default {
    entry: './main.js',
    node: {
        global: false,
        __filename: true,
        __dirname: true,
    },
    target: 'electron-renderer',
};