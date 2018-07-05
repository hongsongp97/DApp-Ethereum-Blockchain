candidates = { "Chung": "candidate-1", "Son": "candidate-2", "Nguyen": "candidate-3" }

$(document).ready(function () {
  Object.keys(candidates).forEach((name) => {
    
    $.ajax({
      url: '/api/' + name,
    })
      .done(result => {
        const div_id = candidates[result.candidateName];
        $("#" + div_id).html(result.voteCount);
      })
      .fail(err => {
        console.error(err);
        alert('An error has occured. Please try again later');
      })
  });
});

$("#form-vote").on('submit', (event) => {
  event.preventDefault();

  const candidateName = $("#candidate").val();
  
  $.ajax({
    url: '/api/',
    method:'post',
    data: $('#form-vote').serialize()
  })
    .done(result => {
      const div_id = candidates[result.candidateName];
      $("#" + div_id).html(result.voteCount);
    })
    .fail(err => {
      console.error(err);
      alert('An error has occured. Please try again later');
    })
});

