var app = require("./app/server/configs/app.config");

var server = {
    init: app.init,
    start: app.start
};

server.init();
server.start();