/*
Copyright (C) 2012 Braden Walters

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
Allows a form to be submitted over AJAX.
*/
function AjaxFormSubmit(form, loading, success, error, error_message,
                        error_reasons)
{
  form.submit(function()
  {
    //Only display loading screen
    form.hide();
    success.hide();
    error.hide();
    loading.show();

    //Collect data for POST from fields
    var post_data = {};
    form.find('input:checked, input:text, input:hidden, div input:hidden, ' +
      'input:password, input:submit, option:selected, textarea').filter(
      ':enabled').each(function ()
      {
        post_data[this.name || this.id || this.parentNode.name ||
                  this.parentNode.id] = this.value;
      });

    //POST over AJAX
    $.ajax({
        type : 'POST',
        url : form.attr('action'),
        data : post_data,
        success : function(json)
          {
            var data = jQuery.parseJSON(json);
            form.show();
            loading.hide();
            if (data['status'] == 0)
            {
              success.show();
              //Clear all text input fields
              form.find('input:text, input:hidden, div input:hidden, ' +
                'input:password, textarea').filter(':enabled').each(function()
                {
                  this.value = '';
                });
            }
            else
            {
              error_message.html(data['message']);
              error_reasons.html(''); //Clear error reasons
              //Append each reason
              for (field in data['reasons'])
              {
                for (var i = 0; i < data['reasons'][field].length; ++i)
                {
                  var field_name_prefix = '';
                  if (field != '__all__')
                    field_name_prefix = $('label[for=id_' + field + ']').
                                        text() + ': ';
                  error_reasons.append('<li>' + field_name_prefix +
                                       data['reasons'][field][i] + '</li>');
                }
              }
              error_reasons.parent().show();
              error.show();
            }
          },
        error : function(jq_xhr, text_status, error_thrown)
          {
            error_message.html(text_status);
            error_reasons.parent().hide();
            error.show();
            loading.hide();
            form.show();
          }
      });

    return false;
  });
}
