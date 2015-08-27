(function ($, io) {

  var socket = io(),
    $userImg = $('#user-img'),
    $userName = $('#user-name-span'),
    $currPlayerName = $('#curr-player-name'),

    // vote item template elm
    $voteItemTemplate = $('<li><span class="question"></span><span class="votes flt-r"></span></li>');

  // create connection and emit new user information
  socket.on('connect', function () {
    socket.emit('add_user', {
      name: USERNAME,
      image: USERIMG
    });
  });

  // next player button click event
  $('#next-player').on('click', function () {
    socket.emit('next_player', {});
  });

  // next player chosen
  socket.on('next_player_chosen', function (data) {
    $userImg.attr('src', data.image);
    $userName.text(data.name);
    $currPlayerName.text(data.name);
  });

  // questions and votes updated
  socket.on('voting_results_updated', function (questions) {
    // empty voting results list
    var $votingResults = $('.voting-results').empty(), i, questionData;

    // sort by number of votes
    questions.sort(function (a, b) {
      return a.votes - b.votes
    });

    // enter template data and add to voting results list
    for (i = questions.length - 1; i >= 0; i--) {
      questionData = questions[i];

      // first time question data comes in as string,
      // here we parse it and 0 out the vote count
      if (typeof questionData == 'string') {
        questionData = JSON.parse(questionData);
        questionData.votes = 0;
      }

      $votingResults.append(
        $voteItemTemplate.clone()
          .find('.question')
          .text(questionData.question)
          .next('.votes')
          .text(questionData.votes)
          .closest('li')
      );
    };
  });

})(jQuery, io);