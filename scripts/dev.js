#! /usr/bin/env node

// 处理环境变量
const enviroment = require('../build/environment')
enviroment()

// 获取自定义配置信息
const config = require('../config')
const { port, prefix } = config.route

// 准备dev环境的webpack配置参数
const webpack = require('webpack')
const merge = require('webpack-merge')
const path = require('path')
const baseConfig = require('../build/webpack.config.base')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpackConfig = merge(baseConfig, {
  mode: 'development',
  devtool: '#cheap-module-source-map',
  plugins: [
    // 清理无用的webpack打包信息
    new FriendlyErrorsWebpackPlugin(),
    // webpack热加载所需插件
    new webpack.HotModuleReplacementPlugin(),
    // 生成html模板
    new HtmlWebpackPlugin({
      // 生成的文件名
      filename: 'index.html',
      // 文件模板，也可以使用templateContent进行配置式生成模板，template和templateContent不能共存
      template: './src/index.template.html',
      // 静态资源注入位置
      // 1、true或者body：所有JavaScript资源插入到body元素的底部
      // 2、head: 所有JavaScript资源插入到head元素中
      // 3、false： 所有静态资源css和JavaScript都不会注入到模板文件中
      inject: true,
      // html文档的标题
      title: config.title,
      // html base
      base: `${prefix}/`,
      // favicon文件
      favicon: path.resolve(__dirname, '../public/favicon.png'),
      // 按照依赖顺序引入chunks
      chunksSortMode: 'dependency'
    })
  ]
})
// 支持webpack热加载的配置
const hotMiddlewareEntry = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000'
Object.keys(webpackConfig.entry).forEach(name => {
  webpackConfig.entry[name] = [hotMiddlewareEntry, ...webpackConfig.entry[name]]
})

// express
const express = require('express')
const app = express()
const serverCompiler = webpack(webpackConfig)

// 使得express可以解析请求
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// webpack的热加载
const devMiddleware = require('webpack-dev-middleware')(serverCompiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true,
  logLevel: 'error'
})
devMiddleware.waitUntilValid(function () {
  console.log(`> Listening at localhost:${port}${prefix} \n`)
})
const hotMiddleware = require('webpack-hot-middleware')(serverCompiler, {
  log: () => {}
})
serverCompiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// vue-router的history模式，会去掉url中的#，使得url会回到普通网页的状态
// 但是当直接访问某个非首页路由时，会按照普通访问url的方式去访问对应的文件夹
// 因此需要使用connect-history-api-fallback去完成对单页应用的支持
// 需要注意的是h5的支持需要在webpack-dev-middleware之前，否则不会起作用
app.use(`${prefix}`, require('connect-history-api-fallback')())
app.use(devMiddleware)
app.use(hotMiddleware)

// 访问静态资源
app.use(`${prefix}/static`, express.static(path.join(__dirname, '../static')))
app.use(`${prefix}/public`, express.static(path.join(__dirname, '../public')))

// 当设置prefix时，需要对localhost:${port}${prefix}重定向至localhost:${port}${prefix}/，否则无法访问
app.get('*', (req, res, next) => {
  if (req.originalUrl === prefix) {
    res.redirect(301, `${prefix}/`)
  } else {
    next()
  }
})

app.listen(port, err => {
  if (err) {
    console.log(err)
    return
  }
  console.log(`Server listening on http://localhost:${port}${prefix}`)
})
