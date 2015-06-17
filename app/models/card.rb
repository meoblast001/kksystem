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

class Card < ActiveRecord::Base
  CLIENT_MODEL_ATTRIBUTES = [:front, :back, :current_cardbox_id,
                             :front_attachment_url, :back_attachment_url]

  belongs_to :user
  belongs_to :cardset
  belongs_to :current_cardbox, :class_name => 'Cardbox'
  has_many :attachments, :class_name => 'CardAttachment', :dependent => :destroy

  validates_presence_of :user_id, :cardset_id, :front, :back

  def self.search(str)
    where { front.matches("%#{str}%") | back.matches("%#{str}%") }
  end

  #Attachments.
  def front_attachment
    attachments.where(:side => CardAttachment::FRONT).first
  end

  def back_attachment
    attachments.where(:side => CardAttachment::BACK).first
  end

  #Attachment URLs.
  def front_attachment_url
    attachment = front_attachment
    if attachment.nil? then nil else attachment.file.url end
  end

  def back_attachment_url
    attachment = back_attachment
    if attachment.nil? then nil else attachment.file.url end
  end
end
