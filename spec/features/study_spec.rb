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

    it 'should reintroduce no more cards than the reintroduction amount',
       :js => true do
      #Cardset only has a reintroduction of 5, and is ready to reintroduce
      #cards.
      cardset.reintroduce_cards = true
      cardset.reintroduce_cards_amount = 5
      cardset.reintroduce_cards_frequency = 1
      cardset.last_reintroduced_cards = 10.days.ago
      cardset.save!
      #Create 10 cards in no box.
      10.times { FactoryGirl.create(:card, :cardset => cardset,
                                    :current_cardbox => nil) }

      login_as cardset.user, :scope => :user

      visit cardsets_study_path
      find("#options-form-cardset option[value='#{cardset.id}']").select_option
      find('#options-form-study-type-normal').click
      find('#options-form-submit').click
      expect(page).to have_css('#study')

      expect(find('#statistics-cards')).to have_content('0 / 5')
    end

    it 'should reintroduce all cards if the reintroduction amount is higher ' +
       'than the amount of cards in no box', :js => true do
      #Cardset has a reintroduction of 5, and is ready to reintroduce cards.
      cardset.reintroduce_cards = true
      cardset.reintroduce_cards_amount = 5
      cardset.reintroduce_cards_frequency = 1
      cardset.last_reintroduced_cards = 10.days.ago
      cardset.save!
      #Create 2 cards in no box.
      2.times { FactoryGirl.create(:card, :cardset => cardset,
                                   :current_cardbox => nil) }

      login_as cardset.user, :scope => :user

      visit cardsets_study_path
      find("#options-form-cardset option[value='#{cardset.id}']").select_option
      find('#options-form-study-type-normal').click
      find('#options-form-submit').click
      expect(page).to have_css('#study')

      expect(find('#statistics-cards')).to have_content('0 / 2')
    end
  end
end
