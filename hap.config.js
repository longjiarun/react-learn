/**

# 与项目相关的配置

## `environment`变量说明

    0 : 开发
    1 : 测试
    2 : 预发
    3 : 线上

## `args`对象包含的数据

    项目名称 : name
    版本号 : version
    静态资源目录 : static
    当前环境变量 : environment
    静态文件路径 : staticPath
    hash串，如果为文件hash，则为空串 : hashName
    页面路径 : pagesPath

 */
var path = require("path"),
    getStaticUrl;

var GROUP_NAME = "m";
var config = {
    //项目名称
    name: "hap",

    //项目版本号
    version: "1.0.0",

    //server端口
    port: 4001,

    //建议开启检测功能
    validateVersion: false,

    //为了构建性能，react默认禁止使用，如需使用则需启用
    useReact : true,

    //静态资源url路径
    staticUrl: getStaticUrl = function(args) {
        var staticUrl = path.join(GROUP_NAME, args.name, args.version, args.hashName),
            devStaticUrl = path.join("/", args.static, args.hashName);

        //开发环境或者是模拟环境，使用本地资源路径，主要用于在本地测试预发或线上接口
        if (args.dev || args.mock) {
            return devStaticUrl;
        }
        switch (args.environment) {
            case 0:
                return devStaticUrl;
                break;
            case 1:
                return "//assets-daily.geilicdn.com/" + staticUrl;
                break;
            case 2:
                return "//assets-pre.geilicdn.com/" + staticUrl;
                break;
            default:
                return "//assets.geilicdn.com/" + staticUrl;
                break;
        }
    },

    /**
        //合并文件
        data: [{
            //文件类型，文件类型不一致，处理方式不一致。目前支持js、css、less
            type: "js",
            name: "lib.js",
            //文件合并分隔符
            newline: ";",
            //待合并的文件
            source: ["src/lib/zepto/zepto.js", "src/lib/underscore/underscore.js"],
            //输出目录
            output: function(args) {
                return path.join(args.staticPath, "/lib");
            }
        }]
     */
    concat: {},

    /*
        //图片合并，小图片建议采用`base64`嵌入
        data: [{
            imgName: "sprite.png",
            cssName: "sprite.less",
            //图片路径 采用绝对路径
            imgPath:"$$_static_url_$$/pages/test/images/sprite.png",
            source: ["src/pages/test/images/*.png"],
            imgOutput: "src/pages/test/images/sprite",
            cssOutput: "src/pages/test/images/sprite"
        }]
     */
    sprite: {},

    //replace功能，可替换指定变量
    replace: {
        data: [{
            //静态资源路径
            name: "static_url",
            value: getStaticUrl
        }, {
            //环境变量
            name: "environment",
            value: function(args) {
                return args.environment;
            }
        }]
    }
};
module.exports = config;
