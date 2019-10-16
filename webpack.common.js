const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
	node: {
    fs: 'empty'
	},
	// mode: 'development',
	entry: './src/main.js',
	// devtool: 'inline-source-map',
	// devServer: {
	// 	contentBase: './dist'
	// },
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			title: 'Organic Growth'
		})
	],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			// {
			// 	test: /\.(glsl|vs|fs|vert|frag)$/,
			// 	exclude: /node_modules/,
			// 	use: [
			// 		'raw-loader',
			// 		'glslify-loader'
			// 	]
			// },
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: [
					'file-loader'
				]
			},
			{
				test: /\.obj$/,
				use: [
					'raw-loader'
				]
			}
		]
	}
};
