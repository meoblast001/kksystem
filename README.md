# KKSystem

The free and open source cloud flash card system accessed through your web
browser. KKSystem uses a modified version of the Leitner system. All card data
is stored on a central server which can be operated by someone else or by you.
The choice is yours.

KKSystem is written using the
[Ruby on Rails web framework](http://rubyonrails.org/) on the server-side and
[CoffeeScript](http://coffeescript.org/) on the client-side. Stylesheets are
written in [Sass](http://sass-lang.com/).

If you are curious about KKSystem and want to use the official deployal, go to
[kksystem.org](http://kksystem.org/).

## Developer Setup
- Read STYLE_GUIDE.md
- Install dependencies
  - Run `bundle`
- Configure config/user_settings.rb
  - Copy config/user_settings.example.rb to config/user_settings.rb
  - Configure database in config/database.yml from config/database.example.yml
    - Migrate with `rake db:migrate`
- Run `rails server` to run the test server or `rails console` to drop into the
  interactive shell
