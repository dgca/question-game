(function ($, io) {
    if (typeof USERNAME !== 'undefined') {
        var socket = io();

        socket.on('connect', function () {
            socket.emit('users', {
                name: USERNAME,
                image: USERIMG
            });
        });
    }

    // $('.vote-button').on('click', function () {
        // if ($(this).hasClass('active')) {

        // } else {

        // }
    // });

})(jQuery, io);