# hap脚手架

## 技术说明

### 目录

0. `build` 构建后的目录，遵循自动化发布目录规范。
    
    - `pages` 页面存放目录，只存放页面文件；
    - `static` 静态资源文件，包含css、js，图片等资源；

0. `mock` 数据模拟目录。
    
    > 存放`*.json`文件，为了方便切换环境，子目录保持与后端接口目录一致；
    
    > 访问目录为`/mock/**/*` ，不需要`json`后缀；

0. `src` 源码存放目录。

    - `component` 组件目录。在hap中只有组件的概念，没有模块的概念。组件包含了该功能完整的js、image，css等。；
    
    - `lib` 库目录。存放第三方库或者项目中可抽离出来的公共组件，利用bower进行管理；
    
    - `pages` 页面目录。存放所有页面，包含该页面需要使用的js、image、css，模板等；

### 页面

0. 页面模板引擎使用[ejs](https://github.com/mde/ejs)，支持`include`功能；

0. 静态资源可配置成直接嵌入到页面中，语法可参照[usemin](https://www.npmjs.com/package/grunt-usemin)，开发模式下不做处理；

0. 发布之前会采用[htmlmin](https://www.npmjs.com/package/gulp-htmlmin)压缩处理，同时会压缩页面中嵌入的js与css；

### js

0. js 模块支持 `commonjs` 规范与 `es6` 规范；

0. 利用`webpack`处理js；

0. 可使用`react`框架，默认`useReact`为`false`，设置为`true`可开启使用；

0. 模板引擎使用[ejs](https://github.com/mde/ejs)，支持预编译处理；

0. 基础类库未做限制，可根据项目不同选型不同；

0. 组件中的js文件存放在组件目录下，确保一个组件目录有完整的资源文件；

0. 页面中的js文件存放在页面目录下，如该页面依赖其他组件，在页面js文件中需引入组件js；

0. 发布之前文件会压缩处理，压缩工具采用[uglify](https://www.npmjs.com/package/gulp-uglify)；

### css

0. css 预处理采用`less`；

0. 支持 import css 合并到文件中，可参照[postcss-import](https://www.npmjs.com/package/postcss-import)；

0. 采用 `autoprefixer` 后处理；

0. 组件中的样式文件存放在组件目录下，确保一个组件目录有完整的资源文件；

0. 页面中的样式文件存放在页面目录下，如该页面依赖其他组件，在页面样式文件中需引入组件样式；

0. 发布之前文件会压缩处理，压缩工具采用[postcss-clean](https://www.npmjs.com/package/postcss-clean)；

### 图片

0. 组件的图片存放在相应组件目录下，页面图片存放在页面目录下，保持组件与组件、页面与页面相对独立；

0. 小图片建议采用`base64`处理，使用`less`的`data-uri`函数；

0. 在js中引用图片，hap对图片大小做了限制（默认`8kb`），小于8kb采用`base64`嵌入。可修改`maxImageSize`属性配置大小；

0. 大图片建议先上传到cdn，图片引用路径使用绝对路径；

0. png与jpg图片可采用[tinypng](https://tinypng.com/)优化处理；

0. hap采用[spritesmith](https://www.npmjs.com/package/gulp.spritesmith)提供合并图片功能，可参考`hap.config.js`配置中的`sprite`参数；

### 静态资源版本管理

0. 版本管理默认采用路径版本管理，每次发布会生成一个唯一的hash字符串，所以每次发布所有资源路径会被替换；

0. 修改`hash`为`true`可配置成文件`hash`，但图片建议采用绝对路径（由于存在图片路径写法不一致，会存在图片路径替换不正确问题）；

### 适配方案，建议flex + rem + media query，可根据项目情况选型。

0. 采用`flex`解决弹性布局问题；

0. 采用`rem`结合`media query`解决间距与字体尺寸问题（字体根据项目需要决定采用rem或者px）；

0. 此方案会存在1px问题；

0. `media query`由`media.less`配置；

### replace功能

0. 可动态替换html、js，css中的变量，用于修改资源路径，接口等，可参考`hap.config.js`配置中的`replace`参数；

### concat功能

0. 支持合并js、css，less文件，`newline`属性可配置文件拼接符；

0. 对于js文件进行压缩处理；

0. 对于css文件进行`autoprefixer`及压缩处理；

0. 对于less文件进行预编译、`autoprefixer`及压缩处理；

### 代码校验

0. 代码文件编辑规范可参照`.editorconfig`；

0. 增加 `eslint` 与 `csslint` 代码校验，暂未强制使用。可使用 `npm run eslint` 与 `npm run csslint` 查看结果。

### 项目管理与发布

0. 采用`git`作为版本管理工具；

0. 项目版本开发规范遵循团队相关规范；

0. 发布采用自动化发布；

## 版本

0. 遵循[语义化版本规范](http://semver.org/lang/zh-CN/)；

0. `master`分支为最新的稳定的发布版本；

0. `tags`中的分支对应每一个发布版本；

0. 其余分支为开发分支，为不稳定版本；

## 利用`generator-hap` 搭建与更新脚手架

0. 全局安装`yo` 与 `generator-hap`;
    
    ```
    sudo npm install -g yo

    sudo npm install -g generator-hap
    ```

0. 新建项目目录（`project_name`）；
    
    ```
    mkdir project_name

    cd project_name
    
    ```

0. 利用`yo`安装脚手架；

    ```
    //安装脚手架
    yo hap;

    //更新脚手架，忽略 npm install & bower install
    yo hap --update;

    //查看参数配置
    yo hap -h;
    ```

0. 添加本项目版本管理配置；

0. 修改 `hap.config.js` 配置文件中项目名称（`name`）、版本（`version`），服务器端口（`port`）等参数；

0. `[可跳过]`如果自动化安装依赖失败，可手动安装`npm`依赖包；
    
    ```
    npm install
    ```

0. `[可跳过]`如果自动化安装依赖失败，可手动安装`bower`依赖包

    ```
    bower install
    ```

0. 启动server；
    
    ```
    npm start
    ```

0. 新开终端选项卡，运行开发模式；
    
    ```
    npm run dev
    ```

## 访问

0. 绑定host `127.0.0.1` -->  `h5-dev.weidian.com`；

0. 运行 `npm start` 启动服务；

0. 运行 `npm run dev` 开启开发模式；

0. 访问首页 http://h5-dev.weidian.com:3001/index.html ；

## 相关命令

> 由于环境不一样，生成的静态资源路径以及对静态资源的处理方式不一致，所以存在开发（0）、测试（1）、预发（2），线上环境（3）等开发命令。可运行命名查看各环境的处理方式。

> 遵循的原则是：1、开发环境性能优先。2、测试环境的处理方式与预发环境保持与线上环境一致。

0. 安装依赖包

    ```
    npm install
    ```

0. 启动server。为了避免端口冲突，可修改`hap.config.js`中`port`属性配置

    ```
    npm start
    ```

0. 开发模式

    ```
    npm run dev
    ```

0. 开发模式，模拟测试环境接口

    ```
    npm run dev-daily
    ```

0. 开发模式，模拟预发环境接口

    ```
    npm run dev-pre
    ```

0. 开发模式，模拟线上环境接口

    ```
    npm run dev-prod
    ```

0. 开发模式，模拟测试环境，压缩代码与模拟接口

    ```
    npm run mock-daily
    ```

0. 开发模式，模拟预发环境，压缩代码与模拟接口

    ```
    npm run mock-pre
    ```

0. 开发模式，模拟线上环境，压缩代码与模拟接口

    ```
    npm run mock-prod
    ```

0. 测试环境

    ```
    npm run daily
    ```

0. 预发环境
    
    ```
    npm run pre
    ```

0. 线上环境

    ```
    npm run prod
    ```

## 自动化生成文档

> API文档采用 [Docker](https://github.com/jbt/docker) 生成。语法可参照[文档](http://jbt.github.io/docker/src/docker.js.html)。

0. 安装 Docker；

    ```
    sudo npm install -g docker
    ```

0. 运行命令；

    ```
    //生成文档
    docker -i src -o documents -x lib,*.css,*.html,*.less

    //监听并生成文档
    docker -i src -o documents -x lib,*.css,*.html,*.less -w
    ```

## 待解决的问题

0. 嵌套模板无法进行压缩；

0. `gulefile.js` 与 `hap.server.js` 隐藏；
    
    > 后续 `hap` 脚手架将只提供 npm 包，使用 `npm run scripts` 执行构建命令；

## 最后

0. `hap`脚手架将持续更新与维护，任何bug或者建议可[反馈给我](mailto:longjia@weidian.com)；

0. `test`代码只是为了演示与说明，可删除；
