var gulp = require('gulp'),
    extend = require('extend'),
    del = require('del'),
    replace = require('gulp-replace'),
    less = require('gulp-less'),
    uglify = require('gulp-uglify'),
    htmlmin = require('gulp-htmlmin'),
    spritesmith = require('gulp.spritesmith'),
    concat = require('gulp-concat'),
    webpack = require('webpack-stream'),
    named = require('vinyl-named'),
    ejs = require('gulp-ejs'),
    //模板引入模块，第三方个人的，不稳定
    htmlInclude = require("gulp-include-html"),
    usemin = require('gulp-usemin'),
    rev = require('gulp-rev'),
    revReplace = require('gulp-rev-replace'),
    runSequence = require('run-sequence'),
    eslint = require('gulp-eslint'),
    csslint = require('gulp-csslint'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    autoprefixer = require('autoprefixer'),
    postcss = require('gulp-postcss'),
    postcssClean = require('postcss-clean'),
    postcssImport = require('postcss-import'),
    exec = require('child_process').execSync,
    path = require('path'),
    crypto = require('crypto'),
    config = require('./hap.config');

//项目配置
config = extend(true, {
    name: 'hap',

    src: 'src',
    dist: 'dist',
    build: 'build',
    chunk: 'chunk',
    component: 'component',
    pages: 'pages',
    lib: 'lib',
    static: 'static',
    logs: 'logs',

    //标志环境配置变量，默认为线上环境
    environment: 3,

    //是否是开发环境
    dev: false,
    //是否是模拟环境
    mock: false,

    //检测版本
    validateVersion: true,
    versionRegExp: new RegExp('^publish/' + config.version + '$'),

    //需拷贝的静态资源
    assets: '', //'*.{jpg,png,gif}'
    manifest: 'manifest.json',

    //是否使用react
    useReact: false,

    page: {
        options: {
            suffix: 'html',
            compile: true,
            //不包含的文件，返回数组
            exclude: null,
            min: {
                //htmlmin config
                collapseWhitespace: true,
                removeComments: true,
                minifyJS: true,
                minifyCSS: true
            }
        }
    },

    webpack: {
        options: {

        }
    },

    template: {
        options: {
            suffix: 'html',
            name: 'ejs',
            ejs: {
                //ejs config
                compileDebug: false,
                debug: false
            },

            underscore:{
                escape: "<%=(.+?)%>",
                interpolate : "<%-(.+?)%>"
            },

            min: {
                //htmlmin config
                collapseWhitespace: true,
                removeComments: true,
                minifyJS: true,
                minifyCSS: true
            }
        }
    },

    javascript: {
        options: {
            min: {
                //不进行 compressor 处理
                compress: false
            }
        }
    },

    style: {
        options: {
            suffix: 'less',
            process: less,
            extractFilename: '[name].extract.css',
            min: {
                advanced: false,
                aggressiveMerging: false,
                processImport: false,
                mediaMerging: false
            },
            autoprefixer: {
                //browsers: ['last 2 versions']
            }
        }
    },

    concat: {
        options: {
            newline: '\n'
        }
    },

    sprite: {
        options: {
            padding: 0,
            algorithm: 'top-down',
            sort: true
        }
    },

    replace: {
        options: {
            leftDelimiter: '$$_',
            rightDelimiter: '_$$'
        }
    },

    //目录hash长度
    hashLength: 8,

    //是否启用文件hash
    fileHash: false
}, config);

//工具函数
var util = {
    //获取参数
    getArguments: function(config) {
        return {
            //项目名称
            name: config.name,
            //版本号
            version: config.version,
            //hash串，如果为文件hash，则为空串
            hashName: config.hashName,
            //静态资源目录名称
            static: config.static,
            //当前环境变量
            environment: config.environment,
            //静态资源输出路径
            staticPath: config.staticPath,
            //页面输出路径
            pagesPath: config.pagesPath,
            //是否是开发环境
            dev: config.dev,
            //是否在模拟环境
            mock: config.mock
        }
    },

    //决定采用函数运行还是字符串运行
    decideRunFunction: function(arg, config) {
        return typeof arg === 'function' ? arg(this.getArguments(config), config) : arg;
    },

    //获取替换串
    getReplaceString: function(name, leftDelimiter, rightDelimiter) {
        return leftDelimiter && rightDelimiter ? leftDelimiter + name + rightDelimiter : name;
    },

    //获取git提交hash戳
    getGitCommitHash: function(length) {
        var h;
        try {
            h = exec('git log --pretty="%H" -1', {
                encoding: 'utf8'
            });

            h = h.trim().substr(0, length);

        } catch (e) {
            console.log('获取提交哈希值失败，采用随机哈希');
        }

        return h;
    },

    //获取版本号，默认以当前时间与随机数生成的md5戳，取前10位
    getRandomHash: function(length) {
        var md5 = crypto.createHash('md5'),
            date = new Date(),
            str = date.getTime().toString();
        md5.update(str);
        return md5.digest('hex').substr(0, length);
    },

    getHash: function(length) {
        var h = this.getGitCommitHash(length);

        if (h == undefined) {
            h = this.getRandomHash(length);
        }

        return h;
    },

    validateVersion: function(config) {
        try {

            var branchName = exec('git symbolic-ref HEAD --short', {
                encoding: 'utf8'
            });
            branchName = branchName.trim();

        } catch (e) {
            console.log('版本检测失败');
            process.exit(0);
        }

        if (!config.versionRegExp.test(branchName)) {
            console.log('分支版本与项目版本不对应');
            process.exit(0);
        }
    }
};

//公用模块
var modules = {
    //替换变量
    replace: function(stream, replaceSettings) {

        replaceSettings.data && replaceSettings.data.forEach(function(value) {
            //获取替换字符串
            var replaceString = util.getReplaceString(value.name, replaceSettings.options.leftDelimiter, replaceSettings.options.rightDelimiter);
            //替换变量
            stream = stream.pipe(replace(replaceString, util.decideRunFunction(value.value, config)));
        });

        return stream;
    },

    //删除目录
    clean: function() {
        del.sync(config.build);
        del.sync(config.dist);
    },

    //获取webpack配置
    getWebpackConfig: function(flag) {

        var //开发环境不需要压缩代码
            templateDevOptions = !config.dev ? {} : {
                ejs: {
                    compileDebug: true
                },
                min: {
                    minifyJS: false,
                    minifyCSS: false,
                    removeComments: false
                }
            },
            templateOptions = extend(true, config.template.options, templateDevOptions),
            templateLoader,
            plugins = [new ExtractTextPlugin(config.style.options.extractFilename, {
                allChunks: true
            })];

        //决定使用什么模板引擎
        templateLoader = config.template.options.name === 'ejs'
                        ? 'ejs-compiled-loader' + ('?' + JSON.stringify(templateOptions.ejs))
                        : 'underscore-template-loader' + ('?' + JSON.stringify(templateOptions.underscore));

        //如果非开发环境，则压缩
        !config.dev && plugins.push(new webpack.webpack.optimize.UglifyJsPlugin(config.javascript.options.min));

        return extend(true, {
            watch: flag,
            module: {
                loaders: [{
                    test: /\.css$/,
                    loader: ExtractTextPlugin.extract(['css', 'postcss'])
                }, {
                    test: new RegExp('\.' + config.style.options.suffix + '$'),
                    loader: ExtractTextPlugin.extract(['css', 'postcss', config.style.options.suffix])
                }, {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    query: {
                        presets: config.useReact ? ['react', 'es2015'] : ['es2015']
                    }
                }, {
                    test: new RegExp('\.' + config.template.options.suffix + '$'),
                    loader: templateLoader
                }]
            },
            postcss: function() {
                var a = postcssClean(config.style.options.min),
                    b = autoprefixer(config.style.autoprefixer),
                    //处理import css
                    c = postcssImport();

                return !config.dev ? [c, a, b] : [c, b];
            },
            plugins: plugins,
            'ejs-compiled-loader': {
                htmlmin: true,
                htmlminOptions: templateOptions.min
            },
            //增加异步加载js配置
            output: {
                filename: '[name].js',
                path: path.join(__dirname, config.staticPath),

                chunkFilename: path.join(config.chunk, '[chunkhash:10].js'),
                publicPath: util.decideRunFunction(config.staticUrl, config) + "/"
            }
        }, util.decideRunFunction(config.webpack.options || {}, config))
    },

    //webpack 任务
    //flag  true : 开启监听模式 false ： 不监听
    webpack: function(flag) {
        var self = this,
            source = [path.join(config.src, '/**/*.js'), '!' + path.join(config.src, config.component, '/**/*.js'), '!' + path.join(config.src, config.lib, '/**/*.js')],
            stream;

        stream = gulp.src(source)
            .pipe(named(function(file) {
                var args = path.parse(file.path),
                    basenameParent = args.dir.replace(new RegExp('^' + path.resolve(config.src) + '\/?'), '');

                return path.join(basenameParent, args.name);
            }))
            .pipe(webpack(self.getWebpackConfig(flag)))

        //替换变量
        stream = self.replace(stream, config.replace);

        //输出
        return stream.pipe(gulp.dest(path.join(config.staticPath)));
    },

    handlerConfig: function() {
        //默认认为hash传递的是字符串
        config.hashName = '';

        if (config.fileHash === false) {
            //如果是目录hash
            config.hashName = util.getHash(config.hashLength);
        } else if (config.fileHash === true) {
            //如果是文件hash，则不需要目录hash
            config.hashName = '';
        }

        //静态资源相对路径
        config.staticRelativePath = path.join(config.static, config.hashName);

        //静态资源输出路径
        config.staticPath = path.join(config.build, config.staticRelativePath);

        //页面输出路径
        config.pagesPath = path.join(config.build, config.pages);
    }
};

modules.handlerConfig();

//删除build & dist 目录
gulp.task('del', function(cb) {
    modules.clean();
    cb();
});

//复制图片到 static 目录
//不建议使用，图片建议采用先上传，使用绝对路径
gulp.task('copyassets', function() {
    //如果assets为空，则直接返回
    if (!config.assets) {
        return null;
    }

    var source = path.join(config.src, '/**/', String(config.assets)),
        stream = gulp.src(source);

    return stream.pipe(gulp.dest(config.staticPath));
});

gulp.task('copycss', function() {
    var source = path.join(config.src, '/**/*.css'),
        stream = gulp.src(source),
        processors = [];

    //如果非开发环境，则压缩CSS
    !config.dev && (processors.push(postcssClean(config.style.options.min)));

    stream = stream.pipe(postcss(processors));

    return stream.pipe(gulp.dest(config.staticPath));
});

//合并任务
gulp.task('concat', function() {
    var data = config.concat.data,
        options = config.concat.options,
        stream, processors = [];

    data && data.forEach(function(value) {
        //获取路径数组
        var arys = value.source;

        //文件名以key命名
        stream = gulp.src(arys)
            .pipe(concat(value.name, {
                newLine: value.newline === undefined ? value.newline : options.newline
            }))

        //替换变量
        stream = modules.replace(stream, config.replace);

        //处理不同文件
        if (value.type == 'js') {

            !config.dev && (stream = stream.pipe(uglify(config.javascript.options.min)));

        } else if (value.type == 'css') {
            processors = [];

            //如果非开发环境，则压缩CSS
            !config.dev && (processors.push(postcssClean(config.style.options.min)));

            stream = stream.pipe(postcss(processors));

        } else if (value.type == config.style.options.suffix) {

            stream = stream.pipe(config.style.options.process());

            processors = [
                postcssImport(),
                autoprefixer(config.style.autoprefixer)
            ];

            //如果非开发环境，则压缩CSS
            !config.dev && (processors.push(postcssClean(config.style.options.min)))

            stream = stream.pipe(postcss(processors));
        }

        //输出到指定目录
        stream = stream.pipe(gulp.dest(util.decideRunFunction(value.output, config)));
    });

    return stream;
});


gulp.task('css', function() {
    var matchSuffix = '/**/*.' + config.style.options.suffix,
        source = [path.join(config.src, matchSuffix), '!' + path.join(config.src, config.component, matchSuffix), '!' + path.join(config.src, config.lib, matchSuffix)],
        stream = gulp.src(source, {
            base: config.src
        });

    stream = stream.pipe(config.style.options.process());

    var processors = [
        postcssImport(),
        autoprefixer(config.style.autoprefixer)
    ];

    //如果非开发环境，则压缩CSS
    !config.dev && (processors.push(postcssClean(config.style.options.min)));

    stream = stream.pipe(postcss(processors));

    //替换变量
    stream = modules.replace(stream, config.replace);

    return stream.pipe(gulp.dest(path.join(config.staticPath)));
});

//js 任务
gulp.task('js', function() {
    return !config.dev ? modules.webpack(false) : null;
});

//处理html
gulp.task('html', function() {
    var source = [path.join(config.src, config.pages, '/**/*.' + config.page.options.suffix)],
        stream;

    //去掉忽略的文件
    if(config.page.options.exclude){
        var excludeSource = util.decideRunFunction(config.page.options.exclude, config);
        excludeSource.forEach(function(value,i){
            excludeSource[i] = "!" + excludeSource[i];
        });
        source = source.concat(excludeSource);
    }

    stream = gulp.src(source);

    //编译模板
    if(config.page.options.compile){

        if(config.template.options.name === 'ejs'){
            stream = stream.pipe(ejs());
        }else{
            //html include
            stream = stream.pipe(htmlInclude({
                include:"@require"
            }));
        }
    }

    //将css 与 js嵌入到html中
    !config.dev && (stream = stream.pipe(usemin({
        //配置到build目录下
        path: path.resolve(config.staticPath),
        enableHtmlComment: true
    })));

    //替换变量
    stream = modules.replace(stream, config.replace);

    //如果非开发环境，则压缩CSS
    !config.dev && (stream = stream.pipe(htmlmin(config.page.options.min)));

    return stream.pipe(gulp.dest(config.pagesPath));
});

//加版本戳
gulp.task('rev', ['html'], function() {
    var chunkSource = path.join(config.build, config.static, config.chunk, '/**/*'),
        htmlSource = path.join(config.pagesPath, '/**/*.' + config.page.options.suffix),
        source = [path.join(config.build, config.static, '/**/*'), '!' + chunkSource],
        target = path.join(config.dist, config.static),
        stream;

    //先输出过滤文件
    gulp.src(chunkSource).pipe(gulp.dest(path.join(target, config.chunk)));

    //输出html
    gulp.src(htmlSource).pipe(gulp.dest(path.join(config.dist, config.pages)));

    return stream = gulp.src(source)
        .pipe(rev())
        .pipe(gulp.dest(target))
        .pipe(rev.manifest(config.manifest, {
            merge: false
        }))
        .pipe(gulp.dest(config.logs));
});

//文件版本控制
gulp.task('hash', ['rev'], function() {
    var source = path.join(config.dist, '/**/*'),
        stream;

    //删除build
    del.sync(config.build);

    stream = gulp.src(source)
        .pipe(revReplace({
            manifest: gulp.src(path.join(config.logs, config.manifest))
        }))
        .pipe(gulp.dest(config.build))
        .on('end', function() {
            //删除dist目录
            del.sync(config.dist);
        });

    return stream;
});

/**
 * sprite 任务
 * less 无法支持 . 命名
 */
gulp.task('sprite', function() {
    var data = config.sprite.data,
        length = data.length;

    for (var i = 0; i < length; i++) {

        var opts = extend(true, {
                //设置css文件中image路径地址
                imgPath: 'images/' + data[i].imgName,
            }, config.sprite.options, data[i]),
            stream, imgStream, cssStream;

        stream = gulp.src(opts.source);

        stream = stream.pipe(spritesmith(opts));

        imgStream = stream.img
            //输出路径会跟随imgName路径变换
            .pipe(gulp.dest(util.decideRunFunction(opts.imgOutput, config)));

        cssStream = stream.css
            .pipe(gulp.dest(util.decideRunFunction(opts.cssOutput, config)));
    }
    return cssStream;
});

//eslint
gulp.task('eslint', function() {
    var source = [path.join(config.src, '/**/*.js'), '!' + path.join(config.src, config.lib, '/**/*.js')];
    return gulp.src(source)
        .pipe(eslint())
        .pipe(eslint.format());
});

//csslint
gulp.task('csslint', function() {
    var source = [path.join(config.build, '**/*.css')];
    return gulp.src(source)
        .pipe(csslint())
        .pipe(csslint.reporter());
});

//watch
gulp.task('watch', ['default'], function(cb) {
    //模板没有包含pages中的模板，因为不建议这么做，如果pages包含模板也不能是嵌套模板
    var templateSource = path.join(config.src, config.component, '/**/*.' + config.template.options.suffix);

    //watch html
    var source = [path.join(config.src, config.pages, '/**/*.' + config.page.options.suffix), templateSource];
    gulp.watch(source, function() {
        gulp.start('html');
    });

    //watch css & assets
    source = [path.join(config.src, '/**/*.{' + config.style.options.suffix + ',css}')];

    config.assets && source.push(path.join(config.src, '/**/', config.assets));

    gulp.watch(source, function() {
        gulp.start('css');
    });

    //watch lib 文件
    source = [path.join(config.src, config.lib, '**/*')];
    gulp.watch(source, function() {
        gulp.start('concat');
    });

    //watch js & template
    //嵌套模板，无法被webpack监听
    source = [templateSource];
    gulp.watch(source, function() {
        modules.webpack(false);
    });

    //webpack watch
    return modules.webpack(true);
});

//default
gulp.task('default', function(cb) {
    config.hashName && console.log('目录哈希值为 ' + config.hashName)
    var args = [
        'copyassets', ['js', 'css', 'concat']
    ];

    //删除目录
    modules.clean();

    //如果不是开发环境而且是利用hash处理（hash 任务已经包含html任务）
    !config.dev && config.fileHash === true ? args.push('hash') : args.push('html');

    //回调函数
    args.push(cb);

    runSequence.apply(null, args);
});

//dev 开发环境
gulp.task('dev', function(cb) {
    config.environment = 0;
    config.dev = true;
    runSequence('watch', cb);
});

//dev-test 开发环境对应测试环境接口
gulp.task('dev-test', function(cb) {
    config.environment = 1;
    config.dev = true;
    runSequence('watch', cb);
});

//dev-prepare 开发环境对应预发接口
gulp.task('dev-prepare', function(cb) {
    config.environment = 2;
    config.dev = true;
    runSequence('watch', cb);
});

//dev-product 开发环境对应线上接口
gulp.task('dev-product', function(cb) {
    config.environment = 3;
    config.dev = true;
    runSequence('watch', cb);
});

//mock-test 模拟测试环境对应测试环境接口
gulp.task('mock-test', function(cb) {
    config.environment = 1;
    config.dev = false;

    //模拟环境
    config.mock = true;
    runSequence('watch', cb);
});

//mock-prepare 模拟预发环境对应预发接口
gulp.task('mock-prepare', function(cb) {
    config.environment = 2;
    config.dev = false;
    config.mock = true;
    runSequence('watch', cb);
});

//mock-product 模拟线上环境对应线上接口
gulp.task('mock-product', function(cb) {
    config.environment = 3;
    config.dev = false;
    config.mock = true;
    runSequence('watch', cb);
});

//test
gulp.task('test', function(cb) {
    config.validateVersion && util.validateVersion(config);
    config.environment = 1;
    config.dev = false;
    runSequence('default', cb);
});

//prepare
gulp.task('prepare', function(cb) {
    config.validateVersion && util.validateVersion(config);
    config.environment = 2;
    config.dev = false;
    runSequence('default', cb);
});

//product
gulp.task('product', function(cb) {
    config.validateVersion && util.validateVersion(config);
    config.environment = 3;
    config.dev = false;
    runSequence('default', cb);
});
