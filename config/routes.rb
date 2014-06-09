Kksystem::Application.routes.draw do
  root 'site#index'

  devise_for :users, :controllers => {
      :sessions => 'users/sessions',
      :passwords => 'users/passwords',
      :registrations => 'users/registrations',
      :confirmations => 'users/confirmations',
    }

  resources :cardsets

  resources :cardboxes, :except => :new
  get "/cardboxes/new/:cardset_id" => "cardboxes#new", :as => :new_cardbox
end
