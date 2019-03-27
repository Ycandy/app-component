'use strict'
const path = require('path')
const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')
const vueConfig = require('./vue-loader.config')
const { prefix } = require('../config').route

module.exports = {
  entry: {
    app: ['./src/app.js']
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[hash].js',
    publicPath: `${prefix}/`
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue': 'vue/dist/vue.js',
      'public': path.resolve(__dirname, '../public'),
      'src': path.resolve(__dirname, '../src'),
      '~': path.resolve(__dirname, '..')
    }
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(vue|js)$/,
        loader: 'eslint-loader',
        include: path.resolve(__dirname, '../src'),
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.resolve(__dirname, '../'),
        exclude: /node_modules/
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueConfig
      },
      {
        test: /\.pug$/,
        loader: 'pug-plain-loader'
      },
      {
        test: /\.styl(us)?$/,
        loader: 'style-loader!css-loader!stylus-loader'
      },
      {
        test: /\.css?$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.DEPLOY_ENV': JSON.stringify(process.env.DEPLOY_ENV)
    }),
    new VueLoaderPlugin()
  ]
}
