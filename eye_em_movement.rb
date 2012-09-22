require 'sinatra'
require "sinatra/reloader" if development?
#require 'sinatra/config_file'
require 'EyeEmConnector'
require 'date'
require 'active_support/all'

EyeEmConnector.configure do |config|
  config.client_id = ENV['EYEEM_CLIENT_ID']
end

get '/' do
  erb :home
end

get '/load_movement' do #/:lat/:lng/:start_date/:end_date' do
  lat ||= 52.5299
  lng ||= 13.4115
  start_date = DateTime.parse(start_date) rescue DateTime.new(2012,9,22,11,0,0,'+2')
  end_date = DateTime.parse(end_date) rescue DateTime.now
  datetime_steps = start_date.step(end_date,10.minutes).to_a
  buckets = datetime_steps.inject([]) {|t,z| t << z.to_s; t << []}
  buckets = Hash[*buckets]
  logger.info buckets
  nearby_venue_ids = EyeEmConnector.albums(:geoSearch => 'nearbyVenues', :lat => lat, :lng => lng)['albums']['items'].map{|w|w['id']}
  nearby_venue_ids.each do |venue_id|
    offset = 0
    earliest_photo_date = DateTime.now
    tries = 5
    while tries > 0 && earliest_photo_date > (start_date-5.minutes) do
      ps = EyeEmConnector.album_photos(venue_id,{:limit => 50, :offset => offset, :detailed => true})['photos']['items']
      ps.each do |photo|
        photo_datetime = DateTime.parse(photo['updated'])
        buckets[start_date.to_s] << photo if photo_datetime > start_date-5.minutes && photo_datetime < start_date+5.minutes 
      end
      offset += 50
      tries -= 1
      earliest_photo_date = DateTime.parse(ps.last['updated']) if ps.last.present?
    end
  end
  user_ids = buckets[start_date.to_s].map {|photo| photo['user']['id']}.uniq
  user_ids.each do |user_id|
    offset = 0
    ps = EyeEmConnector.user_photos(user_id,{:limit => 50, :offset => offset, :detailed => true})['photos']['items']
    ps.each do |photo|
      photo_datetime = DateTime.parse(photo['updated'])
      datetime_step = round_datetime(photo_datetime,datetime_steps)
      logger.info datetime_step
      buckets[datetime_step.to_s] << photo if datetime_step.present?
    end
  end
  buckets.to_json
  #nearby_venue_ids.to_json
end

def round_datetime(photo_datetime,steps)
  steps.detect{|step| photo_datetime > step-5.minutes && photo_datetime < step+5.minutes }
end

helpers do
  def partial(page, options={})
    erb page, options.merge!(:layout => false)
  end
end


