var widgetId = Fliplet.Widget.getDefaultId();
var data = Fliplet.Widget.getData(widgetId) || {};
var TIMEOUT_BUFFER = 1000; // Timeout buffer in ms
var timer = null;

// 1. Fired from Fliplet Studio when the external save button is clicked
Fliplet.Widget.onSaveRequest(function () {
  save(true);
});

function save(notifyComplete) {
  Fliplet.Widget.save(data).then(function () {
    if (notifyComplete) {
      Fliplet.Studio.emit('reload-page-preview');
      Fliplet.Widget.complete();
    } else {
      Fliplet.Studio.emit('reload-widget-instance', widgetId);
    }
  });
}

function oembed(url) {
  var params = {
    url: url,
    key: "81633801114e4d9f88027be15efb8169"
  };
  return $.getJSON('https://api.embedly.com/1/oembed?' + $.param(params));
}

$('#video_url, #video_urls').on('keyup change paste', function() {
  var url = this.value;

  removeFinalStates();
  $('.video-states .initial').addClass('hidden');
  $('.video-states .loading').addClass('show');

  if ($(this).val().length === 0) {
    $('.video-states .initial').removeClass('hidden');
    $('.video-states .loading').removeClass('show');
    save();
  } else {
    clearTimeout(timer);
    timer = setTimeout(function() {
      oembed(url)
        .then(function(response) {

          var orientation = (response.width / response.height > 1.555 )? "16by9" : "4by3";
          var bootstrapHtml = '<div class="embed-responsive embed-responsive-orientation">iframehtml</div>';
          data.html = bootstrapHtml
            .replace("iframehtml", response.html)
            .replace("orientation", orientation)
            .replace("//cdn", "https://cdn");
          changeStates(true);
          save(false);
        })
        .catch(function () {
          data.html = '';
          changeStates(false);
          save(false);
        });
    }, TIMEOUT_BUFFER);
  }
});

$('#try-stream-single, #try-stream-multiple').on('click', function() {
  $('#video_url').val('https://vimeo.com/channels/staffpicks/137643804').trigger('change');
});

function changeStates(success) {
  if (success) {
    $('.video-states .loading').removeClass('show');
    $('.video-states .success').addClass('show');
  } else {
    $('.video-states .loading').removeClass('show');
    $('.video-states .fail').addClass('show');
    $('.helper-holder .error').addClass('show');
  }
}

function removeFinalStates() {
  if ($('.video-states .fail').hasClass('show')) {
    $('.video-states .fail').removeClass('show');
    $('.helper-holder .error').removeClass('show');
  } else if ($('.video-states .success').hasClass('show')) {
    $('.video-states .success').removeClass('show');
  }
}
