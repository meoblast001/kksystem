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
Handles the core logic of a study session.
*/
var StudyLogic = (function()
{
	/**
	Initializes study session and gets necessary data from the database.
	@param study_options Object containing: 'set', which is the primary key of the set being studied; 'study_type', which is either 'normal', 'single_box', or 'no_box'; 'box', if 'study_type' is 'single_box', which is the ID of the box to study.
	@param database Database object with which to retrieve and submit data.
	@param success_callback Function to call if successful.
	@param error_callback Function to call if an error occurs. Takes 2 parameters: type of error (Possible values: "network", "server", or "local-db") and message.
	*/
	function StudyLogic(study_options, database, success_callback, error_callback)
	{
		this.database = database;
		this.set_id = parseInt(study_options.set);
		this.boxes = [];
		this.study_type = study_options.study_type;
		this.cards_reviewed = [];
		this.cards_reviewed_this_box = [];

		var _this = this;
		var already_failed = false;

		if (this.study_type == 'normal')
		{
			database.GetBoxes({'parent_card_set' : this.set_id}, function(boxes, params)
			{
				_this.boxes = boxes;
				var boxes_processed = 0;
				function GenerateGetCardsFunction(i)
				{
					return function()
					{
						database.GetCards({'current_box' : _this.boxes[i]['id']}, function(cards, params)
						{
							_this.boxes[i].cards = cards;
							++boxes_processed;
							//Ready
							if (boxes_processed == _this.boxes.length)
							{
								_this.current_box = _this.boxes.length - 1;
								if (!already_failed)
									success_callback();
							}
						},
						function(type, message)
						{
							if (!already_failed)
								error_callback(type, message);
							already_failed = true;
						});
					};
				}
				for (i = 0; i < _this.boxes.length; ++i)
				{
					var hours_since_last_review = Math.round((new Date(/*Now*/) - new Date(_this.boxes[i]['last_reviewed'])) / (1000 /*Miliseconds to seconds*/ * 60 /*Seconds to minutes*/ * 60 /*Minutes to hours*/));
					if (hours_since_last_review > _this.boxes[i]['review_frequency'] * 24 - 6)
						_this.boxes[i].review = true;
					else
						_this.boxes[i].review = false;

					GenerateGetCardsFunction(i)();
				}
			},
			function(type, message)
			{
				error_callback(type, message);
			});
		}
		else if (this.study_type == 'single_box')
		{
			database.GetBoxes({'id' : study_options.box}, function(boxes, params)
			{
				_this.boxes = boxes;
				database.GetCards({'current_box' : boxes[0]['id']}, function(cards, params)
				{
					_this.boxes[0].cards = cards;
					//Ready
					_this.current_box = _this.boxes.length - 1;
					if (!already_failed)
						success_callback();
				},
				function(type, message)
				{
					if (!already_failed)
						error_callback(type, message);
					already_failed = true;
				});
			},
			function(type, message)
			{
				error_callback(type, message);
			});
		}
		else if (this.study_type == 'no_box')
		{
			//Create virtual box
			_this.boxes.push({'name' : 'No Box', 'review' : true});
			database.GetCards({'parent_card_set' : this.set_id, 'current_box' : null}, function(cards, params)
			{
				_this.boxes[0].cards = cards;
				_this.current_box = _this.boxes.length - 1;
				database.GetBoxes({'parent_card_set' : _this.set_id}, function(boxes, params)
				{
					_this.lowest_box = boxes[0];
					if (!already_failed)
						success_callback();
				},
				function(type, message)
				{
					if (!already_failed)
						error_callback(type, message);
					already_failed = true;
				});
			},
			function(type, message)
			{
				error_callback(type, message);
			});
		}
	}

	/**
	Gets the next card in random order.
	@param success_callback Function to call if successful.
	@param error_callback Function to call if an error occurs. Takes 2 parameters: type of error (Possible values: "network", "server", or "local-db") and message.
	@return Card object with attributes from database. Null if study complete.
	*/
	StudyLogic.prototype.GetNextCard = function(success_callback, error_callback)
	{
		if (this.study_type == 'normal')
		{
			//If empty, mark now as last review date
			if (this.boxes[this.current_box].cards.length == this.cards_reviewed_this_box.length)
				this.database.ModifyBox(this.boxes[this.current_box].id, {last_reviewed : Math.round(new Date().getTime() / 1000)}, success_callback, error_callback);
		}
		//If empty, switch boxes
		while (this.current_box >= 0 && (this.boxes[this.current_box].cards.length == this.cards_reviewed_this_box.length || this.boxes[this.current_box].review == false))
		{
			--this.current_box;
			this.cards_reviewed_this_box = [];
		}
		if (this.current_box < 0)
			return null;

		var card = null;
		while (card == null)
		{
			var cur_id = Math.floor(Math.random() * this.boxes[this.current_box].cards.length);
			card = this.boxes[this.current_box].cards[cur_id];
			//Check that this card was not already reviewed
			for (var i = 0; i < this.cards_reviewed.length; ++i)
			{
				if (this.cards_reviewed[i] == card.id)
				{
					card = null;
					break;
				}
			}
		}
		return card;
	}

	/**
	Performed if card information is correct. Given a card ID, it is marked as reviewed so it's not reviewed again during this session, and if the study type is 'normal', moves card to next box.
	@param card_id ID of card that was correct.
	@param success_callback Function to call if successful.
	@param error_callback Function to call if an error occurs. Takes 2 parameters: type of error (Possible values: "network", "server", or "local-db") and message.
	*/
	StudyLogic.prototype.Correct = function(card_id, success_callback, error_callback)
	{
		this.cards_reviewed.push(card_id);
		this.cards_reviewed_this_box.push(card_id);
		if (this.study_type == 'normal')
		{
			var box_id = null;
			if (this.current_box < this.boxes.length - 1)
				box_id = this.boxes[this.current_box + 1]['id'];
			this.database.ModifyCard(card_id, {'current_box' : box_id}, success_callback, error_callback);
		}
		else
			success_callback(null);
	}

	/**
	Performed if card information is incorrect. Given a card ID, it is marked as reviewed so it's not reviewed again during this session, and if the study type is 'normal' or 'no_box', moves card to first box.
	@param card_id ID of card that was incorrect.
	@param success_callback Function to call if successful.
	@param error_callback Function to call if an error occurs. Takes 2 parameters: type of error (Possible values: "network", "server", or "local-db") and message.
	*/
	StudyLogic.prototype.Incorrect = function(card_id, callback)
	{
		this.cards_reviewed.push(card_id);
		this.cards_reviewed_this_box.push(card_id);
		if (this.study_type == 'normal')
		{
			if (this.current_box > 0)
				this.database.ModifyCard(card_id, {'current_box' : this.boxes[this.current_box - 1]['id']}, success_callback, error_callback);
			else
				success_callback(null);
		}
		else if (this.study_type == 'no_box')
			this.database.ModifyCard(card_id, {'current_box' : this.lowest_box['id']}, success_callback, error_callback);
		else
			success_callback(null);
	}

	return StudyLogic;
})();
