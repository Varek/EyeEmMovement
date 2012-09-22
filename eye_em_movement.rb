require 'sinatra'
require "sinatra/reloader" if development?
#require 'sinatra/config_file'
require 'EyeEmConnector'

EyeEmConnector.configure do |config|
  config.client_id = ENV['EYEEM_CLIENT_ID']
end

get '/' do
  erb :home
end


helpers do
  def partial(page, options={})
    erb page, options.merge!(:layout => false)
  end
end


