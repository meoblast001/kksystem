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

class CardboxesController < ApplicationController
  def new
    @cardbox = Cardbox.new(:cardset_id => params[:cardset_id])
  end

  def create
    @cardbox = Cardbox.new(allowed_params)
    @cardbox.user_id = current_user.id
    #TODO: Handle case where cardset_id is not provided.
    @cardbox.cardset_id = params[:cardbox][:cardset_id]
    saved = @cardbox.save

    respond_to do |format|
      format.html do
        if saved
          flash[:notice] = I18n.t('cardboxes.new.success_notice')
          flash[:type] = :success
          redirect_to :action => :new, :cardset_id => @cardbox.cardset_id
        else
          render :new
        end
      end

      format.json do
        if saved
          { :success => true }
        else
          { :success => false }
        end
      end
    end
  end

  protected

  # Protected: Get params with required and permitted already specified.
  #
  # Returns parameters.
  def allowed_params
    params.require(:cardbox).permit(:name, :review_frequency)
  end
end
