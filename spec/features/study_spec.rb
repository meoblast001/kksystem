require 'rails_helper'

describe 'study' do
  describe 'normal' do
    let(:cardset) { FactoryGirl.create(:cardset) }
    let(:box1) { FactoryGirl.create(:cardbox, :cardset => cardset,
      :review_frequency => 1, :last_reviewed => DateTime.now - 1.months) }
    let(:box2) { FactoryGirl.create(:cardbox, :cardset => cardset,
      :review_frequency => 2, :last_reviewed => DateTime.now - 1.months) }
    let(:box3) { FactoryGirl.create(:cardbox, :cardset => cardset,
      :review_frequency => 3, :last_reviewed => DateTime.now - 1.months) }
    let(:subject_card) { FactoryGirl.create(:card, :current_cardbox => box2) }

    before do
      #FIXME: These records don't seem to exist in the database unless saved
      #  here, despite being created with FactoryGirl.create.
      cardset.save!
      box1.save!
      box2.save!
      box3.save!
      subject_card.save!
    end

    it 'should move cards to a higher box if correct and still in the system',
       :js => true do
      login_as cardset.user, :scope => :user

      visit cardsets_study_path
      find("#options-form-cardset option[value='#{cardset.id}']").select_option
      find('#options-form-study-type-normal').click
      find('#options-form-submit').click
      expect(page).to have_css('#study')

      find('.card-not-visible').click
      find('#correct').click
      expect(page).to have_css('#finished')

      expect(subject_card.reload.current_cardbox_id).to eql(box3.id)
    end

    it 'should move cards to the lowest box if incorrect and currently in a ' +
       'box', :js => true do
      #Put in the top box to make sure the card isn't just being moved down one
      #box, but to the lowest box, when incorrect.
      subject_card.current_cardbox = box3
      subject_card.save!

      login_as cardset.user, :scope => :user

      visit cardsets_study_path
      find("#options-form-cardset option[value='#{cardset.id}']").select_option
      find('#options-form-study-type-normal').click
      find('#options-form-submit').click
      expect(page).to have_css('#study')

      find('.card-not-visible').click
      find('#incorrect').click
      expect(page).to have_css('#finished')

      expect(subject_card.reload.current_cardbox_id).to eql(box1.id)
    end
  end
end
