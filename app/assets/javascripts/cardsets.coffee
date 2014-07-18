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

namespace 'kksystem.cardsets.study', (ns) ->
  # Public: Initialises the options view.
  ns.initOptions = ->
    showExtraOptions = ->
      checked_study_type = $('#options-form input[name=study_type]').
                           filter(':checked')
      cardbox_section = $('#options-cardbox-section')
      if checked_study_type.val() == 'single-box'
        cardbox_section.show()
      else
        cardbox_section.hide()

    $('#options-form input[name=study_type]').click -> showExtraOptions()
    showExtraOptions()

    switchCardboxDropdown = ->
      cardset_id = $('#options-form-cardset').val()
      #Hide and disable all cardbox dropdowns.
      $('#options-cardbox-section select').each ->
        $(this).prop('disabled', true)
        $(this).hide()
      #Show and enable current cardset's cardbox dropdown.
      current_cardbox_dropdown = $("#cardbox-for-cardset-#{cardset_id}")
      current_cardbox_dropdown.show()
      current_cardbox_dropdown.prop('disabled', false)

    $('#options-form-cardset').change(switchCardboxDropdown)
    switchCardboxDropdown()

    $('#options-form-submit').click (e) ->
      ns.initStudy($('#options-form').serializeArray().reduce (obj, param)->
          obj[param.name] = param.value
          obj
        , {})
      e.preventDefault()
      return false

  # Public: Initialises the study view.
  #
  # params - Object representing serialised data from options form.
  ns.initStudy = (params) ->
    ns.startLoading()

    #Flip the card.
    $('.js-hide-back').click (e) ->
      $('.correctness-buttons').show()
      $('.js-hide-back').hide()
      $('.js-back').show()
      e.preventDefault()
      return false

    $('#options').hide('fast')
    $('#study').show('fast')

    #Finish button.
    $('#finish-btn').click (e) ->
      ns.finishStudy()
      e.preventDefault()
      return false

    $('#statistics-study-mode').text(
      I18n.t("cardsets.study.types.#{params.study_type}".replace('-', '_')))
    switch params.study_type
      when 'normal' then kksystem.cardsets.study.normal.init(params)
      when 'single-box' then kksystem.cardsets.study.single_box.init(params)
      when 'no-box' then kksystem.cardsets.study.no_box.init(params)

  # Public: Sets front and back card text.
  #
  # config - Configuration options.
  #   :front - Text on the front of the card.
  #   :back - Text on the back of the card.
  ns.setCardText = (config) ->
    front_html = $('<span>').text(config.front).html()
    back_html = $('<span>').text(config.back).html()
    $('#study .js-front .js-card-text').html(front_html.
      replace(/\r\n|\r|\n/g, '<br />'))
    $('#study .js-back .js-card-text').html(back_html.
      replace(/\r\n|\r|\n/g, '<br />'))

  # Public: Prepares the correct and incorrect buttons in the study view.
  #
  # correct_callback - Called when correct button is clicked.
  # incorrect_callback - Called when incorrect button is clicked.
  ns.hookupCorrectnessButtons = (correct_callback, incorrect_callback) ->
    $('#correct').unbind('click').click (e) ->
      correct_callback()
      e.preventDefault()
      return false
    $('#incorrect').unbind('click').click (e) ->
      incorrect_callback()
      e.preventDefault()
      return false

  # Public: Starts showing loading status indicators and hides the ready view.
  ns.startLoading = ->
    $('#study .js-hide-on-load').hide()
    $('#study .js-loading').show()

  # Public: Stops showing loading status indicators and shows the ready view.
  ns.stopLoading = ->
    $('#study .js-loading').hide()
    $('#study .js-show-on-ready').show()

  # Public: When studying is completed, exits the study view.
  ns.finishStudy = ->
    $('#study').hide()
    $('#finished').show()

  ns.error = ->
    $('#study').hide()
    $('#error').show()

namespace 'kksystem.cardsets.study.normal', (ns) ->
  ns.init = (params) ->
    kksystem.models.Cardset.load [['id', 'eq', params.cardset]], (cardsets) =>
      if cardsets and cardsets.length > 0
        @cardset = cardsets[0]
      else
        kksystem.cardsets.study.error()
        return
      $('#statistics-current-set').text(@cardset.name)
      kksystem.models.Cardbox.load [['cardset_id', 'eq', params.cardset], \
          ['review_frequency', 'order', 'asc']], (cardboxes) =>
        unless cardboxes
          kksystem.cardsets.study.error()
          return
        now = new Date()
        @cardboxes = cardboxes.filter (item)->
          item.last_reviewed = 0 unless item.last_reviewed
          next_review = new Date(item.last_reviewed)
          next_review.setDate(next_review.getDate() + item.review_frequency)
          next_review.setHours(next_review.getHours() - 6)
          next_review < now
        if @cardset.reintroduce_cards
          next_reintroduce = new Date(@cardset.last_reintroduced_cards)
          next_reintroduce.setDate(next_reintroduce.getDate() +
                                   @cardset.reintroduce_cards_frequency)
          next_reintroduce.setHours(next_reintroduce.getHours() - 6)
          if next_reintroduce < now
            kksystem.models.Card.load [['cardset_id', 'eq', params.cardset], \
                ['current_cardbox_id', 'eq', null], \
                [null, 'order', 'rand']], (cards) =>
              @cardboxes.push({cards})
              ns.displayNextCard()
          else
            ns.displayNextCard()

  ns.displayNextCard = ->
    kksystem.cardsets.study.startLoading()
    incomplete_boxes = @cardboxes.filter (cardbox) => not cardbox.done
    #If incomplete boxes, continue studying, else end study.
    if incomplete_boxes.length > 0
      #Always work from the last incomplete box (that which has the highest
      #review frequency).
      current_box = incomplete_boxes[incomplete_boxes.length - 1]
      $('#statistics-current-box').text(if current_box.name then \
        current_box.name else I18n.t('cardsets.study.statistics.no_cardbox'))
      #If this cardbox's cards have not been loaded, load them now and call this
      #function again.
      unless current_box.cards
        kksystem.models.Card.load([['current_cardbox_id', 'eq', current_box.id],
          [null, 'order', 'rand']], (cards) ->
            unless cards
              kksystem.cardsets.study.error()
              return
            current_box.cards = cards
            ns.displayNextCard()
          )
        #Abort. Function will be re-run asynchronously and will not take this
        #branch again.
        return
      incomplete_cards = current_box.cards.filter (card) => not card.done
      $('#statistics-cards').text(
        current_box.cards.length - incomplete_cards.length + ' / ' +
        current_box.cards.length)
      #If incomplete cards, study them, else move to the next box.
      if incomplete_cards.length > 0
        @use_card = incomplete_cards[0]
        kksystem.cardsets.study.setCardText
          front: @use_card.front
          back: @use_card.back
        kksystem.cardsets.study.hookupCorrectnessButtons(ns.correct,
                                                         ns.incorrect)
        kksystem.cardsets.study.stopLoading()
      else
        current_box.done = true
        #Actual box.
        if current_box.id
          current_box.set('last_reviewed', new Date())
          current_box.save ->
            ns.displayNextCard()
        #Pseudo-box for no-box cards.
        else
          ns.cardset.set('last_reintroduced_cards', new Date())
          ns.cardset.save ->
            ns.displayNextCard()
    else
      kksystem.cardsets.study.finishStudy()

  ns.correct = ->
    index = ((if ns.use_card.current_cardbox_id == cardbox.id then \
              true else false) for cardbox in ns.cardboxes).indexOf(true)
    new_cardbox = if index == -1
                    null
                  else
                    ns.cardboxes[index + 1] || null
    ns.use_card.set('current_cardbox_id',
                    if new_cardbox then new_cardbox.id else null)
    ns.use_card.save (success) ->
      unless success
        kksystem.cardsets.study.error()
        return
      ns.use_card.done = true
      ns.displayNextCard()

  ns.incorrect = ->
    ns.use_card.set('current_cardbox_id', if ns.cardboxes[0] \
                                          then ns.cardboxes[0].id else null)
    ns.use_card.save (success) ->
      unless success
        kksystem.cardsets.study.error()
        return
      ns.use_card.done = true
      ns.displayNextCard()

namespace 'kksystem.cardsets.study.single_box', (ns) ->
  ns.init = (params) ->
    kksystem.models.Cardset.load [['id', 'eq', params.cardset]], (cardsets) =>
      if cardsets or cardsets.length > 0
        @cardset = cardsets[0]
      else
        kksystem.cardsets.study.error()
        return
      $('#statistics-current-set').text(@cardset.name)
      kksystem.models.Cardbox.load [['id', 'eq', params.cardbox]], \
          (cardboxes) =>
        unless cardboxes or cardboxes.length > 0
          kksystem.cardsets.study.error()
          return
        @cardbox = cardboxes[0]
        $('#statistics-current-box').text(@cardbox.name)
        kksystem.models.Card.load [['current_cardbox_id', 'eq', @cardbox.id], \
            [null, 'order', 'rand']], (cards) =>
          unless cards
            kksystem.cardsets.study.error()
            return
          @cardbox.cards = cards
          ns.displayNextCard()

  ns.displayNextCard = ->
    kksystem.cardsets.study.startLoading()
    incomplete_cards = @cardbox.cards.filter (card) => not card.done
    $('#statistics-cards').text(
      @cardbox.cards.length - incomplete_cards.length + ' / ' +
      @cardbox.cards.length)
    #If incomplete cards, continue studying, else end study.
    if incomplete_cards.length > 0
      @use_card = incomplete_cards[0]
      kksystem.cardsets.study.setCardText
        front: @use_card.front
        back: @use_card.back
      kksystem.cardsets.study.hookupCorrectnessButtons(ns.correct, ns.incorrect)
      kksystem.cardsets.study.stopLoading()
    else
      kksystem.cardsets.study.finishStudy()

  ns.correct = ->
    ns.use_card.done = true
    ns.displayNextCard()

  ns.incorrect = ->
    ns.use_card.done = true
    ns.displayNextCard()

namespace 'kksystem.cardsets.study.no_box', (ns) ->
  ns.init = (params) ->
    $('#statistics-current-box').text(I18n.t('cardsets.study.statistics.' +
                                             'no_cardbox'))
    kksystem.models.Cardset.load [['id', 'eq', params.cardset]], (cardsets) =>
      if cardsets or cardsets.length > 0
        @cardset = cardsets[0]
      else
        kksystem.cardsets.study.error()
        return
      $('#statistics-current-set').text(@cardset.name)
      kksystem.models.Card.load [['cardset_id', 'eq', @cardset.id], \
          ['current_cardbox_id', 'eq', null], [null, 'order', 'rand']], \
          (cards) =>
        unless cards
          kksystem.cardsets.study.error()
          return
        @cards = cards
        #Get the cardbox with the lowest review frequency. Incorrect cards will
        #be moved there.
        kksystem.models.Cardbox.load [['cardset_id', 'eq', @cardset.id],
            ['review_frequency', 'order', 'asc']], (cardboxes) =>
          unless cardboxes
            kksystem.cardsets.study.error()
            return
          @lowest_cardbox = if cardboxes.length > 0 then cardboxes[0] \
                                                    else null
          ns.displayNextCard()

  ns.displayNextCard = ->
    kksystem.cardsets.study.startLoading()
    incomplete_cards = @cards.filter (card) => not card.done
    $('#statistics-cards').text(@cards.length - incomplete_cards.length +
                                ' / ' + @cards.length)
    #If incomplete cards, continue studying, else end study.
    if incomplete_cards.length > 0
      @use_card = incomplete_cards[0]
      kksystem.cardsets.study.setCardText
        front: @use_card.front
        back: @use_card.back
      kksystem.cardsets.study.hookupCorrectnessButtons(ns.correct, ns.incorrect)
      kksystem.cardsets.study.stopLoading()
    else
      kksystem.cardsets.study.finishStudy()

  ns.correct = ->
    ns.use_card.done = true
    ns.displayNextCard()

  ns.incorrect = ->
    ns.use_card.done = true
    if ns.lowest_cardbox
      ns.use_card.set('current_cardbox_id', ns.lowest_cardbox.id)
      ns.use_card.save (success)   ->
        unless success
          kksystem.cardsets.study.error()
          return
        ns.displayNextCard()
    else
      ns.displayNextCard()
