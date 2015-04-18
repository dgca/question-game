(function ($, io) {
    var socket = io();

    socket.on('connect', function () {
        socket.emit('users', {
            name: USERNAME,
            image: USERIMG
        });
    });

    socket.on('new_questions', function (data) {
        console.log('new_questions', data);
    });

    socket.on('new_user_done', function (data) {
        $('#user-img').attr('src', data.image);
        $('#user-name').text(data.name);
    });

    socket.on('end_voting_done', function (data) {
        console.log('end_voting_done', data);
    });

    if (document.location.pathname === '/admin') {
        console.log('on /admin');
        $('#new-user').on('click', function () {
            console.log('new-user click');
            socket.emit('new_user', {});
        });
        $('#end-voting').on('click', function () {
            socket.emit('end_voting', {});
        });
        //// display questions on screen?
        // socket.on('new_questions_done', function (data) {
            // console.log('new_questions_done', data);
        // });
    } else if (document.location.pathname === '/vote') {
        console.log('on /vote');
        socket.on('new_questions_done', function (data) {
            console.log('new_questions_done', data);
        });
    }


})(jQuery, io);