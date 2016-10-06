$('[data-video-online-id]').each(function () {
  var $el = $(this);

  var data = Fliplet.Widget.getData($el.data('video-online-id'));
  $el.find('img')
    .on('click', function() {
      if (Fliplet.Navigator.isOnline()) {
        $el.html(data.video_html);
      } else {
        Fliplet.Navigate.popup({
          popupTitle: 'Internet Unavailable',
          popupMessage: 'This video requires Internet to play. Please try again when Internet is available.'
        });
      }
    });
});
