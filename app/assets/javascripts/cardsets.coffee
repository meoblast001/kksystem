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
  ns.initOptions = ->
    $('#options-form input[name=study-type]').click ->
      cardbox_section = $('#options-cardbox-section')
      if $(this).val() == 'single-box'
        cardbox_section.show()
      else
        cardbox_section.hide()

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

  ns.initStudy = (params) ->
    $('#study .js-hide-on-load').hide()
    $('#study .js-loading').show()

    $('#options').hide('fast')
    $('#study').show('fast')

    switch params.study_type
      when 'normal' then kksystem.cardsets.study.normal.init(params)
      when 'single-box' then kksystem.cardsets.study.single_box.init(params)
      when 'no-box' then kksystem.cardsets.study.no_box.init(params)

namespace 'kksystem.cardsets.study.normal', (ns) ->
  ns.init = (params) ->
    kksystem.models.Cardset.load [['id', 'eq', params.cardset]], (cardsets) =>
      if cardsets.length > 0
        @cardset = cardsets[0]
      else
        return
      kksystem.models.Cardbox.load [['cardset_id', 'eq', params.cardset]], \
          (cardboxes) =>
        now = new Date()
        @cardboxes = cardboxes.filter (item)->
          item.last_reviewed = 0 unless item.last_reviewed
          next_review = new Date(item.last_reviewed)
          next_review.setDate(next_review.getDate() + item.review_frequency)
          next_review.setHours(next_review.getHours() - 6)
          next_review < now

namespace 'kksystem.cardsets.study.single_box', (ns) ->
  ns.init = (params) ->
    console.log('single_box')

namespace 'kksystem.cardsets.study.no_box', (ns) ->
  ns.init = (params) ->
    console.log('no_box')
