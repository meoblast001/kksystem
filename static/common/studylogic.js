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
	*/
	function StudyLogic(study_options, database, callback)
	{
		this.database = database;
		this.set_id = study_options.set;
		this.boxes = [];
		this.study_type = study_options.study_type;
		this.cards_reviewed = [];

		var _this = this;

		if (this.study_type == 'normal')
		{
			database.GetBoxes({'parent_card_set' : this.set_id}, function(boxes, params)
			{
				_this.boxes = boxes;
				var boxes_processed = 0;
				for (i = 0; i < _this.boxes.length; ++i)
				{
					var hours_since_last_review = Math.round((new Date(/*Now*/) - new Date(_this.boxes[i]['last_reviewed'])) / (1000 /*Miliseconds to seconds*/ * 60 /*Seconds to minutes*/ * 60 /*Minutes to hours*/));
					if (hours_since_last_review > _this.boxes[i]['review_frequency'] * 24 - 6)
						_this.boxes[i].review = true;
					else
						_this.boxes[i].review = false;

					database.GetCards({'current_box' : _this.boxes[i]['id']}, function(cards, params)
					{
						_this.boxes[params.i].cards = cards;
						++boxes_processed;
						//Ready
						if (boxes_processed == _this.boxes.length)
						{
							_this.current_box = _this.boxes.length - 1;
							callback();
						}
					}, {i : i});
				}
			}, {});
		}
		else if (this.study_type == 'single_box')
		{
			database.GetBoxes({'id' : study_options.box}, function(boxes, params)
			{
				_this.boxes = boxes;
				database.GetCards({'current_box' : boxes[0]['id'] }, function(cards, params)
				{
					_boxes[0].cards = cards;
					//Ready
					_this.current_box = _this.boxes.length - 1;
					callback();
				}, {});
			}, {});
		}
	}

	/**
	Gets the next card in random order.
	@return Card object with attributes from database.
	*/
	StudyLogic.prototype.GetNextCard = function()
	{
		//Switch box if empty
		while (this.current_box >= 0 && (this.boxes[this.current_box].cards.length == 0 || this.boxes[this.current_box].review == false))
			--this.current_box;
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
					this.boxes[this.current_box].cards.splice(cur_id, cur_id); //Remove
					break;
				}
			}
		}
		return card;
	}

	/**
	Performed if card information is correct. Given a card ID, it is marked as reviewed so it's not reviewed again during this session, and if the study type is 'normal', moves card to next box.
	@param card_id ID of card that was correct.
	*/
	StudyLogic.prototype.Correct = function(card_id)
	{
		this.cards_reviewed.push(card_id);
		if (this.study_type == 'normal')
		{
			var box_id = null;
			if (this.current_box < this.boxes.length - 1)
				box_id = this.boxes[this.current_box + 1]['id'];
			this.database.ModifyCard(card_id, {'current_box' : box_id}, function() {}, null);
		}
	}

	/**
	Performed if card information is incorrect. Given a card ID, it is marked as reviewed so it's not reviewed again during this session, and if the study type is 'normal' or 'no_box', moves card to first box.
	@param card_id ID of card that was incorrect.
	*/
	StudyLogic.prototype.Incorrect = function(card_id)
	{
		this.cards_reviewed.push(card_id);
		if (this.study_type == 'normal')
		{
			if (this.current_box > 0)
				this.database.ModifyCard(card_id, {'current_box' : this.boxes[this.current_box - 1]['id']}, function() {}, null);
		}
	}

	return StudyLogic;
})();
