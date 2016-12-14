var app = require("./app/server/configs/app");
var server = {
    init: app.init,
    start: app.start
};

server.init("dev");
server.start();