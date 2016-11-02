$('[data-video-online-id]').each(function () {
  var $el = $(this);

  var data = Fliplet.Widget.getData($el.data('video-online-id'));
  $el.find('img')
    .on('click', function() {
      if (Fliplet.Navigator.isOnline()) {
        Fliplet.Analytics.trackEvent('video', 'play_streaming_online', data.url);
        $el.html(data.video_html);
      } else {
        Fliplet.Analytics.trackEvent('video', 'play_streaming_offline', data.url);
        Fliplet.Navigate.popup({
          popupTitle: 'Internet Unavailable',
          popupMessage: 'This video requires Internet to play. Please try again when Internet is available.'
        });
      }
    });
});
