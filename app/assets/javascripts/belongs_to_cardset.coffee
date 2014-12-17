# Copyright (C) 2014 Braden Walters
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# Public: Client-side code to be used with server-side
#   BelongsToCardsetController.
namespace 'kksystem.belongs_to_cardset', (ns) ->
  # Public: Initialises an AJAX-posted form of an existing HTML form for
  #   creating entities.
  #
  # options - Options object.
  #   :entity_type - Underscore name of entity.
  #   :entity_type_plural - Pluralised underscore name of entity.
  #   :submit_url - URL to which to post.
  ns.init_create_form = (options) ->
    $("#new_#{options.entity_type}").submit (event) ->
      js_success_box = $('#js-success-box')
      js_error_box = $('#js-error-box')

      #Clear all successes and errors.
      js_success_box.hide()
      js_error_box.hide()
      $('span.error').remove()

      #Submit to server.
      $.ajax(options.submit_url,
          type: 'POST'
          data: $(this).serialize()
          success: (result) =>
            if result.success
              #Show success box on success.
              js_success_box.text(I18n.t(options.entity_type_plural +
                                         '.new.success_notice'))
              js_success_box.show()

              #Reset form.
              this.reset()
              #Focus on first visible input.
              $(this).find(':input:visible').first().focus()
            else
              #Show error box on failure.
              js_error_box.text(I18n.t(options.entity_type_plural +
                                       '.new.error_notice'))
              js_error_box.show()

              #Show field errors.
              for field, errors of result.errors
                div = $("div.#{options.entity_type}_#{field}")
                for error in errors
                  span = $('<span>')
                  span.addClass('error')
                  span.text(error)
                  div.append(span)
          error: (jqhxr, text) =>
            #Show error box on failure.
            js_error_box.text(I18n.t('site.forms.unknown_error_occurred'))
            js_error_box.show()
        )

      event.preventDefault
      return false
