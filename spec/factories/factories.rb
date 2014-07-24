FactoryGirl.define do
  factory :user do
    username 'example'
    email 'testing@example.org'
    password 'password'
    password_confirmation 'password'
  end

  factory :cardset do
    user
    name 'Cardset'
    reintroduce_cards false
  end

  factory :cardbox, :aliases => [:current_cardbox] do
    cardset
    user { cardset.user }
    name 'Cardbox'
    review_frequency 1
  end

  factory :card do
    current_cardbox
    cardset { current_cardbox.cardset }
    user { cardset.user }
    front 'Front'
    back 'Back'
  end
end
