var template = require("./index.html");

var Test = {
    init: function() {
        this.render();
    },
    render: function() {

        var html = template({
            list: [{
                name: "李四1",
                age: 12
            }, {
                name: "李四2",
                age: 13
            }, {
                name: "李四3",
                age: 14
            }]
        });
        document.getElementById("J_html").innerHTML = html;
    }
};

module.exports = Test;
