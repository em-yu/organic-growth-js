const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: './src/index.js',
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './dist'
	},
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			title: 'threejs project'
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
			}
		]
	}
};
