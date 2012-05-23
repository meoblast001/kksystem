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

		Study.study_logic = new StudyLogic(study_options, database, function()
		{
			var content =
				'<div id="front" class="card">' +
					'<table class="card_content"><tr><td id="front_text" /></tr></table>' +
				'</div>' +
				'<div id="back" class="card_not_visible">' +
					'<a href="javascript:Study.Show();" style="display: block;">' +
						'<table class="card_content" style="color: #000000;"><tr><td>Click here to flip card.</td></tr></table>' +
					'</a>' +
					'<table id="back_content" class="card_content" style="float: left; background-color: #ffffff; display: none;">' +
						'<tr><td id="back_text" /></tr>' +
					'</table>' +
				'</div>' +
				'<div id="buttons" class="study_button_container" style="height: auto; display: none;">' +
					'<a href="javascript:Study.Correct();" class="study_button_correct">Correct</a>' +
					'<a href="javascript:Study.Incorrect();" class="study_button_incorrect">Incorrect</a>' +
				'</div>';
			$('#content').html(content);
			$('#header_text').html('Study');

			Study.DisplayNextCard();
		});
	},

	DisplayNextCard : function()
	{
		//Hide
		$('#back_content').hide();
		$('#buttons').hide();

		Study.current_card = Study.study_logic.GetNextCard();
		if (Study.current_card !== null)
		{
			$('#front_text').html(Study.current_card['front']);
			$('#back_text').html(Study.current_card['back']);
		}
		else
			Pages.Centre();
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
		});
	},

	Incorrect : function()
	{
		Study.study_logic.Incorrect(Study.current_card['id'], function()
		{
			Study.DisplayNextCard();
		});
	},
};
