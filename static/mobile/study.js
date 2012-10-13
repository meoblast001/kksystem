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

var Study =
{
  Begin : function(study_options, database)
    {
      $('#content').html('');
      $('#header_text').html('Loading...');
      $('#back_button').hide();
      $('#study_finish_button').show();

      Study.study_logic = new StudyLogic(study_options, database, function()
        {
          $.ajax({
              url : SITE_ROOT + '/static/mobile/study.html',
              success : function(result)
                {
                  $('#content').html(result);
                  $('#header_text').html('Study');
                  Study.DisplayNextCard();
                }
            });
        },
        function(type, message)
        {
          if (type == 'network')
            Pages.NetworkError(message);
        });
    },

  Finish : function()
    {
      $('#content').html('Finished studying. Returning to Centre...');
      $('#header_text').html('Finished');
      $('#study_finish_button').hide();
      setTimeout(Pages.Centre, 3000);
    },

  DisplayNextCard : function()
    {
      //Hide
      $('#back_content').hide();
      $('#buttons').hide();

      Study.study_logic.GetNextCard(function(card)
        {
          Study.current_card = card;
          if (Study.current_card !== null)
          {
            $('#front_text').html(Study.current_card['front']);
            $('#back_text').html(Study.current_card['back']);
          }
          else
            Study.Finish();
        },
        function(type, message)
        {
          if (type == 'network')
            Pages.NetworkError(message);
          else
            Pages.FatalError(message);
        });
    },

  Show : function()
    {
      $('#back_content').show();
      $('#buttons').show();
    },

  Correct : function()
    {
      Study.study_logic.Correct(Study.current_card['id'], function()
        {
          Study.DisplayNextCard();
        },
        function(type, message)
        {
          if (type == 'network')
            Pages.NetworkError(message);
          else
            Pages.FatalError(message);
        });
    },

  Incorrect : function()
    {
      Study.study_logic.Incorrect(Study.current_card['id'], function()
        {
          Study.DisplayNextCard();
        },
        function(type, message)
        {
          if (type == 'network')
            Pages.NetworkError(message);
          else
            Pages.FatalError(message);
        });
    },
};
