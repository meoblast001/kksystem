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

  # Protected: Exports to the ANKI TXT file format.
  def self.exportAnkiText(cardset)
    file_data = CSV.generate(:col_sep => "\t") do |csv|
      cardset.cards.each { |card| csv << [card.front, card.back] }
    end
  end
end
