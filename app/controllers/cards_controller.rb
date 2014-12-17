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

class CardsController < BelongsToCardsetController
  before_action :populate_cardboxes, :only => [:new, :create, :show, :update]

  def model
    respond_to do |format|
      format.json do
        render :json => ClientModel::process(Card, request.params,
                                             current_user)
      end
    end
  end

  protected

  def entity_type
    Card
  end

  # Protected: Called before action. Populates @cardboxes with the current
  #   cardset's cardboxes for use in views.
  def populate_cardboxes
    if params[:cardset_id]
      @cardboxes = current_user.cardsets.where(:id => params[:cardset_id]).
                   first.cardboxes.order(:review_frequency)
    else
      @cardboxes = current_user.cards.where(:id => params[:id]).first.cardset.
                   cardboxes.order(:review_frequency)
    end
  end

  # Protected: Get params with required and permitted already specified.
  #
  # Returns parameters.
  def allowed_params
    params.require(:card).permit(:front, :back, :current_cardbox_id)
  end
end
