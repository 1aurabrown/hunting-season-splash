/**
 * Product Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Product template.
 *
   * @namespace product
 */

theme.EmailCapture = (function() {

  var selectors = {
    form: '.email-capture__form',
    close: '.email-capture__close'
  };

  /**
   * Product section constructor. Runs on page load as well as Theme Editor
   * `section:load` events.
   * @param {string} container - selector for the section container DOM element
   */
  function Product(container) {
    var qs = window.location.search.replace('?', '');

    if (deparam(qs).email == 'reset' || deparam(qs).email == 'show') {
      Cookies.remove('EMAIL_DISMISSED');
      Cookies.remove('EMAIL_CAPTURED');
    }

    if (Cookies.get('EMAIL_DISMISSED') == '1' || Cookies.get('EMAIL_CAPTURED') == '1' ) {
      return;
    }

    var delay;
    this.duration = 200;

    if (deparam(qs).email == 'show') {
      delay = 0;
    } else {
      delay = 2000;
    }

    this.$container = $(container);

    setTimeout(function() {
      this.$container.fadeIn(this.duration);
    }.bind(this), delay)

    $(this.$container).on('click', selectors.close, function() {
      Cookies.set('EMAIL_DISMISSED', '1');
      this.close();
    }.bind(this));

    this.onSignupSubmit(this.$container, selectors.form, {
      success: function() {
        this.close();
      }.bind(this)
    });
  }

  Product.prototype = $.extend({}, Product.prototype, {

    /**
     * Updates the DOM state of the add to cart button
     *
     * @param {boolean} enabled - Decides whether cart is enabled or disabled
     * @param {string} text - Updates the text notification content of the cart
     */
    close() {
      this.$container.fadeOut(this.duration);
    },

    onSignupSubmit($container, selector, options = {}) {
      $container.on('submit', selector, function(e){
        e.preventDefault();
        var $el = $(e.target);
        var $container = $(e.delegateTarget);
        $container.attr('data-state', '');
        var data = $el.serialize();
        var $email = $("input[type='email']", $el);
        var $submit = $("input[type='submit'], button[type='submit']", $el);

        if (!$email[0].checkValidity()) {
          $('.error-feedback', $container).text('Please check your email address');
          $container.attr('data-state', 'error');
          return;
        }

        $email.prop('disabled', true);
        $submit.prop('disabled', true);
        return $.ajax({
          type: "GET",
          url: $el.attr("action").replace('/post', '/post-json'),
          data: data,
          cache: false,
          dataType: "jsonp",
          jsonp: "c",
          contentType: "application/json; charset=utf-8",
          error: function(error) {
            $email.prop('disabled', false);
            $submit.prop('disabled', false);

            $('.error-feedback', $container).text('An internal error has occured');

            $container.attr('data-state', 'error');
          },
          success: function(data) {
            $email.prop('disabled', false);
            $submit.prop('disabled', false);

            if ((data.result === "success") ||
              (data.msg && data.msg.indexOf("already subscribed") >= 0) ||
              (data.msg && data.msg.indexOf("too many recent signup requests") >= 0)
            ) {
              Cookies.set('EMAIL_CAPTURED', '1');
              setTimeout(function() {
                $container.attr('data-state', 'success');
              }, 1000);
              if (options.success) {
                options.success();
              }
            } else {
              $container.attr('data-state', 'error');
              if (options.error) {
                options.error();
              }
            }
          },
          error: options.error
        });
      });
    },

    /**
     * Event callback for Theme Editor `section:unload` event
     */
    onUnload: function() {
      this.$container.off(this.namespace);
    }
  });

  return Product;
})();
