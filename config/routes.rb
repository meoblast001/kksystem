Kksystem::Application.routes.draw do
  root 'site#index'

  devise_for :users, :controllers => {
      :sessions => 'users/sessions',
      :passwords => 'users/passwords',
      :registrations => 'users/registrations',
      :confirmations => 'users/confirmations',
    }
end
