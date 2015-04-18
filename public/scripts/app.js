(function ($, io) {
    var socket = io();

    socket.on('connect', function () {
        socket.emit('users', {
            name: USERNAME,
            image: USERIMG
        });
    });

})(jQuery, io);