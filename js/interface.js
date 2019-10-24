var widgetId = Fliplet.Widget.getDefaultId();
var data = Fliplet.Widget.getData(widgetId) || {};
var TIMEOUT_BUFFER = 1000; // Timeout buffer in ms
var timer = null;

var $refresh = $('[data-refresh]');

// 1. Fired from Fliplet Studio when the external save button is clicked
Fliplet.Widget.onSaveRequest(function () {
  save(true);
});

function save(notifyComplete) {
  Fliplet.Widget.save(data).then(function () {
    if (notifyComplete) {
      Fliplet.Widget.complete();
    } else {
      Fliplet.Studio.emit('reload-widget-instance', widgetId);
    }
  });
}

function oembed(url) {
  var params = {
    url: url,
    key: "81633801114e4d9f88027be15efb8169",
    autoplay: true
  };
  return $.getJSON('https://api.embedly.com/1/oembed?' + $.param(params));
}

if (data.url) {
  $refresh.removeClass('hidden');
}

$refresh.on('click', function (e) {
  e.preventDefault();
  $('#video_url').trigger('change');
});

$('#video_url, #video_urls').on('keyup change paste', function() {
  var url = this.value;

  removeFinalStates();
  $('.video-states .initial').addClass('hidden');
  $('.video-states .loading').addClass('show');
  $refresh.addClass('hidden');

  if ($(this).val().length === 0) {
    $('.video-states .initial').removeClass('hidden');
    $('.video-states .loading').removeClass('show');
    save();
  } else {
    Fliplet.Widget.toggleSaveButton(false);
    clearTimeout(timer);
    timer = setTimeout(function() {
      $('.helper-holder .warning').removeClass('show');
      oembed(url)
        .then(function(response) {
          if (!response.width || !response.height || !response.thumbnail_url) {
            // A size and thumbnail are required to render the output
            return Promise.reject('This URL is not supported for online embedding. <a href="http://embed.ly/providers" target="_blank">See embedly documentation</a> to learn more.');
          }

          if(response.type !== 'video' && response.type !=='link'){
            changeStates(false);
            return;
          }
          $refresh.removeClass('hidden');

          var bootstrapHtml = '<div class="embed-responsive embed-responsive-{{orientation}}">{{html}}</div>';
          data.orientation = (response.width / response.height > 1.555 )? "16by9" : "4by3";
          data.embedly = response;
          data.type = response.type;
          data.url = url;
          data.video_html = bootstrapHtml
            .replace("{{html}}", response.html)
            .replace("{{orientation}}", data.orientation)
            .replace("//cdn", "https://cdn");

          if (response.type === 'link') {
            $('.helper-holder .warning').addClass('show');
          }

          changeStates(true);
          toDataUrl(response.thumbnail_url, function(base64Img) {
            data.thumbnail_base64 = base64Img;
            save(false);
            Fliplet.Widget.toggleSaveButton(true);
          });
        })
        .catch(function () {
          data.html = '';
          changeStates(false);
          save(false);
          Fliplet.Widget.toggleSaveButton(true);
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

// http://stackoverflow.com/a/20285053/1978835
function toDataUrl(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function() {
    var reader = new FileReader();
    reader.onloadend = function() {
      callback(reader.result);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', Fliplet.Env.get('apiUrl') + 'v1/communicate/proxy/' + url);
  xhr.setRequestHeader('auth-token', Fliplet.User.getAuthToken());
  xhr.send();
}