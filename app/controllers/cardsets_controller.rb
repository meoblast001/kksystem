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

class CardsetsController < ApplicationController
  def index
    cardset = current_user.cardsets.first
    if cardset.nil?
      redirect_to new_cardset_path
    else
      redirect_to cardset
    end
  end

  def new
    @cardset = Cardset.new
  end

  def create
    @cardset = Cardset.new(allowed_params)
    @cardset.user_id = current_user.id

    if @cardset.save
      redirect_to @cardset
    else
      render :new
    end
  end

  #When HTML, shows cardset and also allows the user to edit the cardset.
  def show
    @cardsets = current_user.cardsets.order(:created_at)
    @cardset = @cardsets.where(:id => params[:id]).first
  end

  def update
    @cardset = current_user.cardsets.where(:id => params[:id]).first
    raise ActiveRecord::RecordNotFound if @cardset.nil?
    @cardset.update_attributes(allowed_params)

    if @cardset.save
      redirect_to @cardset
    else
      @cardsets = current_user.cardsets.order(:created_at)
      render :show
    end
  end

  def destroy
    @cardset = current_user.cardsets.where(:id  => params[:id]).first
    @cardset.destroy unless @cardset.nil?
    redirect_to :action => :index
  end

  def study
    @cardsets = current_user.cardsets.order(:created_at)
    @study_types = [
        { :id => 'normal', :name => I18n.t('cardsets.study.types.normal') },
        { :id => 'single-box',
          :name => I18n.t('cardsets.study.types.single_box') },
        { :id => 'no-box', :name => I18n.t('cardsets.study.types.no_box') },
      ]
  end

  def import
  end

  def importSubmit
    cardset = current_user.cardsets.where(:id => params[:cardset_id]).first
    content = File.read(params[:import_file].path)
    begin
      ImportExport.import(params[:import_type], cardset, content)
    rescue ImportExport::ImportFailureError => e
      @error = e.message
    end
  end

  def export
  end

  def exportSubmit
    cardset = current_user.cardsets.where(:id => params[:cardset_id]).first
    filename = "cardset-#{cardset.id}." +
               ImportExport.extension(params[:export_type])
    send_data ImportExport.export(params[:export_type], cardset),
              :filename => filename
  end

  def model
    respond_to do |format|
      format.json do
        render :json => ClientModel::process(Cardset, request.params,
                                             current_user)
      end
    end
  end

  protected

  # Protected: Get params with required and permitted already specified.
  #
  # Returns parameters.
  def allowed_params
    params.require(:cardset).permit(:name, :reintroduce_cards,
      :reintroduce_cards_amount, :reintroduce_cards_frequency)
  end
end
