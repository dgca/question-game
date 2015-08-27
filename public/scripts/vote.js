(function ($, io) {
  var socket = io();
  if (typeof USERNAME !== 'undefined') {
    socket.on('connect', function () {
      socket.emit('add_user', {
        name:  USERNAME,
        image: USERIMG
      });
    });
  }

  socket.on('next_player_chosen', function (data) {
    $('#user-img').attr('src', data.image);
    $('#user-name-span').text(data.name);
    $('#curr-player-name').text(data.name);
  });

  // Admin screen
  if (document.location.pathname === '/vote') {
    socket.on('new_questions_done', function (data) {
      var $list = $('.questions-list').empty(),
        $newItem = $('<li class="question-item clickable"><div class="disp-ib"><p class="question"></p><p class="asker"></p></div></li>');
      for (var i = 0; i < data.length; i++) {
        //data[i] = $.parseJSON(data[i]);

        $list.append(
          $newItem.clone()
            .data('question', data[i].question)
            .find('.question')
            .text(data[i].question)
            .next('.asker')
            .text('Asked by ' + data[i].name)
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
