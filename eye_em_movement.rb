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
  #lat ||= 52.5299
  #lng ||= 13.4115
  lat = 52.52515030
  lng = 13.36928844
  start_date = DateTime.parse(start_date) rescue DateTime.new(2012,8,24,20,0,0,'+2')
  end_date = DateTime.parse(end_date) rescue start_date+5.hours #DateTime.now
  datetime_steps = start_date.step(end_date,10.minutes).to_a
  buckets = datetime_steps.inject([]) {|t,z| t << z.to_i; t << []}
  buckets = Hash[*buckets]
  points = [[lat,lng],[lat+0.0045,lng],[lat,lng-0.0045],[lat-0.0045,lng],[lat,lng+0.0045]]
  nearby_venues = []
  points.each do |point|
    nearby_venues << EyeEmConnector.albums(:geoSearch => 'nearbyVenues', :lat => point[0], :lng => point[1])['albums']['items']
  end
  nearby_venue_ids = nearby_venues.flatten.map{|w|w['id']}.uniq
  logger.info nearby_venue_ids.count
  nearby_venue_ids.each do |venue_id|
    offset = 0
    earliest_photo_date = DateTime.now
    tries = 5
    while tries > 0 && earliest_photo_date > (start_date-30.minutes) do
      ps = EyeEmConnector.album_photos(venue_id,{:limit => 50, :offset => offset, :detailed => true})['photos']['items']
      ps.each do |photo|
        photo_datetime = DateTime.parse(photo['updated'])
        buckets[start_date.to_i] << photo if photo_datetime > start_date-30.minutes && photo_datetime < start_date+30.minutes #&& photo['latitude'].to_f > lat-0.008 && photo['latitude'].to_f < lat+0.008 && photo['longitude'].to_f > lng-0.008 && photo['longitude'].to_f < lng+0.008
      end
      offset += 50
      tries -= 1
      earliest_photo_date = DateTime.parse(ps.last['updated']) if ps.last.present?
    end
  end
  user_ids = buckets[start_date.to_i].map {|photo| photo['user']['id']}.uniq
  logger.info user_ids
  user_ids.each do |user_id|
    offset = 0
    tries = 5
    earliest_photo_date = DateTime.now
    #while tries > 0 && earliest_photo_date > (start_date-5.minutes) do
      ps = EyeEmConnector.user_photos(user_id,{:limit => 50, :offset => offset, :detailed => true})['photos']['items']
      ps.each do |photo|
        photo_datetime = DateTime.parse(photo['updated'])
        datetime_step = round_datetime(photo_datetime,datetime_steps)
        buckets[datetime_step.to_i] << photo if datetime_step.present? #&& photo['latitude'].to_f > lat-0.008 && photo['latitude'].to_f < lat+0.008 && photo['longitude'].to_f > lng-0.008 && photo['longitude'].to_f < lng+0.008
      end
      offset += 50
      tries -= 1
      earliest_photo_date = DateTime.parse(ps.last['updated']) if ps.last.present?
    #end
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


