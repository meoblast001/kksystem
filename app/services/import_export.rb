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

require 'csv'

# Public: Defines functions which import and export cardsets to and from various
#   formats.
class ImportExport
  class InvalidTypeError < RuntimeError; end
  class ImportFailureError < RuntimeError; end

  # Public: Import some type of data file into a cardset.
  #
  # type - Name of the file type from which to import.
  # cardset - Cardset model to which to import.
  # content - Contents of file to import.
  def self.import(type, cardset, content)
    case type
      when 'anki_text' then importAnkiText(cardset, content)
      else raise InvalidTypeError.new
    end
  end

  # Public: Export a cardset to some type of data file.
  #
  # type - Name of the file type to which to export.
  # cardset - Cardset model to export.
  #
  # Returns file contents as a string.
  def self.export(type, cardset)
    case type
      when 'anki_text' then exportAnkiText(cardset)
      else raise InvalidTypeError.new
    end
  end

  # Public: Get the file extension of a file type.
  #
  # type - Name of the file type of which the extension is being requested.
  #
  # Returns the file extension as a string, NOT including the leading period.
  def self.extension(type)
    case type
      when 'anki_text' then 'txt'
      else raise InvalidTypeError.new
    end
  end

  protected

  #Protected: Imports an ANKI TXT file.
  def self.importAnkiText(cardset, content)
    ActiveRecord::Base.transaction do
      CSV.parse(content, :col_sep => "\t").each_with_index do |row, i|
        if row.length < 2
          raise ImportFailureError.new(I18n.t('cardsets.import.errors.' +
            'anki_text.not_enough_columns', :row_num => i + 1))
        end

        card = Card.new(:cardset => cardset, :user => cardset.user,
                        :current_cardbox => cardset.cardboxes.
                          order { review_frequency.asc }.first,
                        :front => row[0], :back => row[1])
        unless card.save
          raise ImportFailureError.new(I18n.t('cardsets.import.errors.' +
            'anki_text.row_invalid', :row_num => i + 1,
            :reason => card.errors.full_messages.join(';')))
        end
      end
    end
  end

  # Protected: Exports to the ANKI TXT file format.
  def self.exportAnkiText(cardset)
    file_data = CSV.generate(:col_sep => "\t") do |csv|
      cardset.cards.each { |card| csv << [card.front, card.back] }
    end
  end
end
