#Be sure to restart your server when you modify this file.

#Enable parameter wrapping for JSON.
ActiveSupport.on_load(:action_controller) do
  wrap_parameters :format => [:json] if respond_to?(:wrap_parameters)
end
