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
  get '/cardsets/import/:cardset_id' => 'cardsets#import',
      :as => :cardsets_import
  post '/cardsets/import/:cardset_id' => 'cardsets#importSubmit',
       :as => :cardsets_import_submit
  get '/cardsets/export/:cardset_id' => 'cardsets#export',
      :as => :cardsets_export
  post '/cardsets/export/:cardset_id' => 'cardsets#exportSubmit',
       :as => :cardsets_export_submit

  post '/cardboxes/model' => 'cardboxes#model', :as => :cardboxes_model
  resources :cardboxes, :except => [:index, :new, :edit]
  get '/cardboxes/list/:cardset_id' => 'cardboxes#index', :as => :list_cardboxes
  get '/cardboxes/new/:cardset_id' => 'cardboxes#new', :as => :new_cardbox

  post '/cards/model' => 'cards#model', :as => :cards_model
  resources :cards, :except => [:index, :new, :edit]
  get '/cards/list/:cardset_id' => 'cards#index', :as => :list_cards
  get '/cards/new/:cardset_id' => 'cards#new', :as => :new_card

  get '/admin/statistics' => 'admin#statistics', :as => :admin_statistics
  get '/admin/users' => 'admin#users', :as => :admin_users
end
