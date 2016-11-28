(function ($) {
  /**
   * Patch all tables to remove ``docutils`` class and add Bootstrap base
   * ``table`` class.
   */
  $(function () {
    $("table.docutils")
        .removeClass("docutils")
        .addClass("table")
        .addClass("table-bordered")
        .addClass("table-striped")
        .attr("border", 0);

    // Inline code styles to Bootstrap style.
    $('tt.docutils.literal').not(".xref").each(function (i, e) {
      // ignore references
      if (!$(e).parent().hasClass("reference")) {
        $(e).replaceWith(function () {
          return $("<code />").html($(this).html());
        });
      }});

    Search.init();
  });
}(window.$jqTheme || window.jQuery));
