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
  @param study_options Object containing: 'set', which is the primary key of the
    set being studied; 'study_type', which is either 'normal', 'single_box', or
    'no_box'; 'box', if 'study_type' is 'single_box',
    which is the ID of the box to study.
  @param database Database object with which to retrieve and submit data.
  @param success_callback Function to call if successful.
  @param error_callback Function to call if an error occurs. Takes 2 parameters:
    type of error (Possible values: "network", "server", or "local-db") and
    message.
  */
  function StudyLogic(study_options, database, success_callback, error_callback)
  {
    this.database = database;
    this.cardset =  null;
    this.boxes = [];
    this.study_type = study_options.study_type;
    this.cards_reviewed = [];
    this.cards_reviewed_this_box = [];

    var _this = this;
    var already_failed = false;

    /**
    Bubble sort boxes by review frequency ascending.
    @param boxes Array of boxes to sort.
    */
    function BoxSortByReviewFrequency(boxes)
    {
      for (var i = 0; i < boxes.length - 1; ++i)
      {
        for (var j = 0; j < boxes.length - 1 - i; ++j)
        {
          if (boxes[j]['review_frequency'] > boxes[j + 1]['review_frequency'])
          {
            var tmp = boxes[j];
            boxes[j] = boxes[j + 1];
            boxes[j + 1] = tmp;
          }
        }
      }
    }

    //Function to set up normal study
    function normal()
    {
      //Called after getting boxes if successful.
      function getBoxesSuccess(boxes, params)
      {
        _this.boxes = boxes;
        BoxSortByReviewFrequency(_this.boxes);
        var boxes_processed = 0;
        function GenerateGetCardsFunction(i)
        {
          return function()
            {
              database.GetCards({'current_box' : _this.boxes[i]['id']},
                function(cards, params)
                {
                  _this.boxes[i].cards = cards;
                  ++boxes_processed;
                  //Ready
                  if (boxes_processed == _this.boxes.length)
                  {
                    function finalSuccess()
                    {
                      _this.current_box = _this.boxes.length - 1;
                      if (!already_failed)
                        success_callback();
                    }

                    var hours_since_last_reintroduce_cards =
                      Math.round((new Date(/*Now*/) -
                      _this.cardset['last_reintroduced_cards']) /
                      (1000 /*Milliseconds to seconds*/ * 3600 /*Seconds to
                      hours*/));
                    if (_this.cardset['reintroduce_cards'] &&
                        hours_since_last_reintroduce_cards >
                        _this.cardset['reintroduce_cards_frequency'] * 24 - 6)
                    {
                      database.GetCards({
                          'parent_card_set' : _this.cardset['id'],
                          'current_box' : null
                        }, function(cards)
                        {
                          //Create virtual box
                          _this.boxes.push({
                              'id' : null,
                              'name' : gettext('no-box'),
                              'review' : true,
                              'cards' : cards
                            });
                          finalSuccess();
                        }, function(type, message)
                        {
                          error_callback(type, message);
                        }, 0, _this.cardset['reintroduce_cards_amount'], true);
                    }
                    else
                      finalSuccess();
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
          var hours_since_last_review =
            Math.round((new Date(/*Now*/) - _this.boxes[i]['last_reviewed']) /
            (1000 /*Milliseconds to seconds*/ * 3600 /*Seconds to hours*/));
          if (hours_since_last_review > _this.boxes[i]['review_frequency'] *
              24 - 6)
            _this.boxes[i].review = true;
          else
            _this.boxes[i].review = false;

          GenerateGetCardsFunction(i)();
        }
      }

      //Get all boxes
      database.GetBoxes({'parent_card_set' : _this.cardset['id']},
        getBoxesSuccess, function(type, message)
        {
          error_callback(type, message);
        });
    }

    //Function to set up single box study
    function singleBox()
    {
      database.GetBoxes({'id' : study_options.box}, function(boxes, params)
        {
          boxes[0].review = true;
          _this.boxes = boxes;
          database.GetCards({'current_box' : boxes[0]['id']},
            function(cards, params)
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

    //Function to set up no-box study
    function noBox()
    {
      //Create virtual box
      _this.boxes.push({'id' : null, 'name' : gettext('no-box'), 'review' : true});
      database.GetCards({
          'parent_card_set' : _this.cardset['id'],
          'current_box' : null
        }, function(cards, params)
        {
          _this.boxes[0].cards = cards;
          _this.current_box = _this.boxes.length - 1;
          database.GetBoxes({'parent_card_set' : _this.cardset['id']},
            function(boxes, params)
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

    //Get card set information and then set up study mode
    database.GetSets({'id' : parseInt(study_options.set)}, function(results)
      {
        if (results.length > 0)
          _this.cardset = results[0];
        else
          error_callback('server', gettext('cardset-could-not-be-found'));

        if (_this.study_type == 'normal')
          normal();
        else if (_this.study_type == 'single_box')
          singleBox();
        else if (_this.study_type == 'no_box')
          noBox();
      },
      function(type, message)
      {
        error_callback(type, message);
      });
  }

  /**
  Gets information about the study state.
  @return Object containing the current box's name as "box_name", the amount of
    cards reviewed in this box as "reviewed_cards_this_box" and the total amount
    of cards in this box as "total_cards_this_box".
  */
  StudyLogic.prototype.GetStudyInformation = function()
  {
    return {
        'box_name' : this.boxes[this.current_box].name,
        'reviewed_cards_this_box' : this.cards_reviewed_this_box.length,
        'total_cards_this_box' : this.boxes[this.current_box].cards.length
      };
  }

  /**
  Gets the next card in random order.
  @param success_callback Function to call if successful. Takes 1 parameter:
    Card object with attributes from database. Null if study complete.
  @param error_callback Function to call if an error occurs. Takes 2 parameters:
    type of error (Possible values: "network", "server", or "local-db") and
    message.
  */
  StudyLogic.prototype.GetNextCard = function(success_callback, error_callback)
  {
    var _this = this;
    function postUpdateBox()
    {
      //If empty, switch boxes
      while (_this.current_box >= 0 &&
             (_this.boxes[_this.current_box].cards.length ==
              _this.cards_reviewed_this_box.length ||
              _this.boxes[_this.current_box].review == false))
      {
        --_this.current_box;
        _this.cards_reviewed_this_box = [];
      }
      if (_this.current_box < 0)
      {
        success_callback(null);
        return;
      }

      var card = null;
      while (card == null)
      {
        var cur_id = Math.floor(Math.random() *
                                _this.boxes[_this.current_box].cards.length);
        card = _this.boxes[_this.current_box].cards[cur_id];
        //Check that this card was not already reviewed
        for (var i = 0; i < _this.cards_reviewed.length; ++i)
        {
          if (_this.cards_reviewed[i] == card.id)
          {
            card = null;
            break;
          }
        }
      }
      success_callback(card);
    }

    if (this.study_type == 'normal')
    {
      //If empty, mark now as last review date or card reintroduction date
      if (this.boxes[this.current_box].cards.length ==
          this.cards_reviewed_this_box.length)
      {
        //If box
        if (this.boxes[this.current_box]['id'] !== null)
        {
          this.database.ModifyBox(this.boxes[this.current_box].id,
                                  {last_reviewed : new Date()}, postUpdateBox,
                                  error_callback);
          return;
        }
        //If no box
        else
        {
          this.database.ModifySet(this.cardset['id'],
            {last_reintroduced_cards : new Date()}, postUpdateBox,
            error_callback);
          return;
        }
      }
    }
    postUpdateBox();
  }

  /**
  Performed if card information is correct. Given a card ID, it is marked as
  reviewed so it's not reviewed again during this session, and if the study type
  is 'normal', moves card to next box.
  @param card_id ID of card that was correct.
  @param success_callback Function to call if successful.
  @param error_callback Function to call if an error occurs. Takes 2 parameters:
    type of error (Possible values: "network", "server", or "local-db") and
    message.
  */
  StudyLogic.prototype.Correct = function(card_id, success_callback,
                                          error_callback)
  {
    this.cards_reviewed.push(card_id);
    this.cards_reviewed_this_box.push(card_id);
    if (this.study_type == 'normal' &&
        this.boxes[this.current_box]['id'] !== null /*Already in no box*/)
    {
      var box_id = null;
      if (this.current_box < this.boxes.length - 1 &&
          this.boxes[this.current_box + 1]['id'] !== null)
        box_id = this.boxes[this.current_box + 1]['id'];
      this.database.ModifyCard(card_id, {'current_box' : box_id},
                               success_callback, error_callback);
    }
    else
      success_callback(null);
  }

  /**
  Performed if card information is incorrect. Given a card ID, it is marked as
  reviewed so it's not reviewed again during this session, and if the study type
  is 'normal' or 'no_box', moves card to first box.
  @param card_id ID of card that was incorrect.
  @param success_callback Function to call if successful.
  @param error_callback Function to call if an error occurs. Takes 2 parameters:
    type of error (Possible values: "network", "server", or "local-db") and
    message.
  */
  StudyLogic.prototype.Incorrect = function(card_id, success_callback,
                                            error_callback)
  {
    this.cards_reviewed.push(card_id);
    this.cards_reviewed_this_box.push(card_id);
    if (this.study_type == 'normal')
    {
      if (this.current_box > 0)
        this.database.ModifyCard(card_id, {'current_box' : this.boxes[0]['id']},
                                 success_callback, error_callback);
      else
        success_callback(null);
    }
    else if (this.study_type == 'no_box')
      this.database.ModifyCard(card_id, {'current_box' : this.lowest_box['id']},
                               success_callback, error_callback);
    else
      success_callback(null);
  }

  return StudyLogic;
})();
