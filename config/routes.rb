Kksystem::Application.routes.draw do
  root 'site#index'

  devise_for :users, :controllers => {
      :sessions => 'users/sessions',
      :passwords => 'users/passwords',
      :registrations => 'users/registrations',
      :confirmations => 'users/confirmations',
    }

  get '/cardsets/study' => 'cardsets#study', :as => :cardsets_study
  post '/cardsets/model' => 'cardsets#model', :as => :cardsets_model
  resources :cardsets

  resources :cardboxes, :except => [:index, :new, :edit]
  get '/cardboxes/list/:cardset_id' => 'cardboxes#index', :as => :list_cardboxes
  get '/cardboxes/new/:cardset_id' => 'cardboxes#new', :as => :new_cardbox

  resources :cards, :except => [:index, :new, :edit]
  get '/cards/list/:cardset_id' => 'cards#index', :as => :list_cards
  get '/cards/new/:cardset_id' => 'cards#new', :as => :new_card
end
