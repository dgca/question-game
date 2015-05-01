(function ($, io) {
    var socket = io();

    socket.on('connect', function () {
        socket.emit('users', {
            name: USERNAME,
            image: USERIMG
        });
    });

    socket.on('new_user_done', function (data) {
        $('#user-img').attr('src', data.image);
        $('#user-name').text(data.name);
        $('.curr-player-name').text(data.name);
    });

    socket.on('end_voting_done', function (data) {
        console.log('end_voting_done', data);
    });

    if (document.location.pathname === '/admin') {
        $('#new-user').on('click', function () {
            socket.emit('new_user', {});
        });
        $('#end-voting').on('click', function () {
            socket.emit('end_voting', {});
        });
        socket.on('vote_added', function (questions) {
            var $results = $('.voting-results').empty(),
                $newItem = $('<li><span class="question"></span><span class="votes flt-r"></span></li>');
            for (var i = questions.length - 1; i >= 0; i--) {
                $results.append(
                    $newItem.clone()
                        .find('.question')
                        .text(questions[i].question)
                        .next()
                        .text(questions[i].votes)
                        .closest('li')
                );
            };
        });
    } else if (document.location.pathname === '/vote') {
        socket.on('new_questions_done', function (data) {
            var $list = $('.questions-list').empty(),
                $newItem = $('<li class="question-item clickable"><div class="disp-ib"><p class="question"></p></div></li>');
            for (var i = 0; i < data.length; i++) {
                data[i] = $.parseJSON(data[i]);

                $list.append(
                    $newItem.clone()
                        .data('question', data[i].question)
                        .find('.question')
                        .text(data[i].question)
                        .closest('li')
                );
            }
        });
        $('.questions-list').on('click', '.question-item.clickable:not(.active)', function () {
            var activeOnes = $('.question-item.active');
            if (activeOnes) {
                activeOnes.each(function (i, elm) {
                    $(elm).removeClass('active');
                    socket.emit('del_vote', {
                        question: $(elm).data('question')
                    });
                });
            }
            $(this).addClass('active');
            socket.emit('add_vote', {
                question: $(this).data('question')
            });
        });
    }

})(jQuery, io);