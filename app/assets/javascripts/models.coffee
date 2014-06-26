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

# Public: Generic model class for loading and saving data to and from the
#   server. Must be extended by child class.
class Model
  #Define in child class.
  @classType: -> null
  @url: -> null

  # Public: Constructs object.
  #
  # json_obj - Attributes from which to build the object.
  constructor: (json_obj) ->
    @changed = {}
    @field_errors = {}
    for key, value of json_obj
      this[key] = value
      @changed[key] = false

  # Public: Gets the value of a field in the record.
  #
  # attr - The name of the attribute to get.
  #
  # Returns the value of the attribute.
  get: (attr) -> this[attr]

  # Public: Sets the value of a field in the record.
  #
  # attr - The name of the attribute to set.
  # value - Value to which the attribute should be set.
  set: (attr, value) ->
    return if attr == 'id'
    this[attr] = value
    @changed[attr] = true

  # Public: Loads an array of models of one type from the server.
  #
  # conditions - Array of condition arrays describing what to return.
  #   [0] - Attribute on left-hand side of binary operation. For limit: null.
  #   [1] - Binary operation: 'eq', 'gt', 'lt', 'order', 'limit'.
  #   [2] - Value on right-hand side of binary operation. For order: 'asc',
  #     'desc', or 'rand'.
  # callback - Function called when completed. Given one parameter if
  #   successful: array of models loaded. Else false.
  @load: (conditions, callback) ->
    $.ajax(@url(),
        method: 'POST',
        data:
          operation: 'load'
          conditions: for condition in conditions
            result = {
                attribute: condition[0]
                operator: condition[1]
                value: condition[2]
              }
        success: (result) =>
          if result.success
            callback(for record_attrs in result.records
                new (@classType())(record_attrs)
              )
          else
            callback(false)
        error: -> callback(false)
      )

  # Public: Saves all changed attributes to the server.
  #
  # callback - Function called whe ncompleted. Given one parameter: a success
  #   boolean.
  save: (callback) ->
    $.ajax(@constructor.url(),
        method: 'POST'
        data:
          operation: 'save'
          attributes: do =>
            #Needs all changed attributes and ID as an object.
            ({ key, value } for key, value of this when @changed[key] == true or
                                                        key == 'id').
              reduce (prev, next) ->
                prev[next.key] = next.value
                prev
              , {}
        success: (result) =>
          if result.success
            #Update attributes with the values the server gives, and mark as
            #unchanged.
            for key, value of result.attributes
              this[key] = value
              @changed[key] = false
            @general_error = undefined
            @field_errors = {}
            callback(true)
          else
            @general_error = result.general_error if result.general_error
            if result.field_errors
              for attr, err in field_errors
                @field_errors[attr] = err
            callback(false)
        error: ->
          callback(false)
      )

class Cardset extends Model
  @classType: -> Cardset
  @url: -> kksystem.cardsets.MODEL_URL

class Cardbox extends Model
  @classType: -> Cardbox
  @url: -> kksystem.cardboxes.MODEL_URL

class Card extends Model
  @classType: -> Card
  @url: -> kksystem.cards.MODEL_URL

namespace 'kksystem.models', (ns) ->
  ns.Cardset = Cardset
  ns.Cardbox = Cardbox
  ns.Card = Card
