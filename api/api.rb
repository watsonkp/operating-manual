#!/usr/local/bin/ruby
require 'json'
require 'base64'
require 'pg'
require 'sinatra'

CONNECTION_STRING = "postgresql://postgres:@manual-db:5432/operating_manual"

set :bind, '0.0.0.0'

def query(s, params, handler)
	# Reusing the connection leads to null pointer exceptions despite resetting and flushing
	begin
		connection = PG.connect(CONNECTION_STRING)
		result = connection.exec_params(s, params) do |result|
			# Result is cleared by the block
			handler.call(result)
		end
	rescue => ex
		[500, {"Content-Type" => "application/json"}, JSON.generate({"error": "EXCEPTION - query(): #{ex.message}"})]
	ensure
		connection.close
	end
end

def query_binary(s, params, handler)
	# Reusing the connection leads to null pointer exceptions despite resetting and flushing
	begin
		connection = PG.connect(CONNECTION_STRING)
		result = connection.exec_params(s, params, 1) do |result|
			# Result is cleared by the block
			handler.call(result)
		end
	rescue => ex
		[500, {"Content-Type" => "application/json"}, JSON.generate({"error": "EXCEPTION - query(): #{ex.message}"})]
	ensure
		connection.close
	end
end

def handle_read(result)
	if result.error_message != ""
		[500, {"Content-Type" => "application/json"}, JSON.generate({"error": "#{result.error_message}"})]
	else
		[200, {"Content-Type" => "application/json"}, JSON.generate(result.to_a)]
	end
end

def handle_read_by_id(result)
	if result.error_message != ""
		[500, {"Content-Type" => "application/json"}, JSON.generate({"error": "#{result.error_message}"})]
	else
		[200, {"Content-Type" => "application/json"}, JSON.generate(result.to_a()[0])]
	end
end

def handle_read_binary_by_id(result)
	if result.error_message != ""
		[500, {"Content-Type" => "application/json"}, JSON.generate({"error": "#{result.error_message}"})]
	else
		[200, {"Content-Type" => result.getvalue(0,2)}, result.getvalue(0,3)]
	end
end

def handle_create(result, type)
	if result.error_message != ""
		[500, {"Content-Type" => "application/json"}, JSON.generate({"error": "#{result.error_message}"})]
	else
		[201, {"Content-Type" => "application/json", "Location" => "/api/#{type}/#{result.getvalue(0,0)}"}, JSON.generate(result.to_a()[0])]
	end
end

def handle_update(result, type)
	if result.error_message != ""
		[500, {"Content-Type" => "application/json"}, JSON.generate({"error": "#{result.error_message}"})]
	else
		[200, {"Content-Type" => "application/json", "Location" => "/api/#{type}/#{result.getvalue(0,0)}"}, JSON.generate(result.to_a()[0])]
	end
end

def handle_delete_by_id(result)
	if result.error_message != ""
		[500, {"Content-Type" => "application/json"}, JSON.generate({"error": "#{result.error_message}"})]
	else
		[204, {"Content-Type" => "application/json"}, JSON.generate({})]
	end
end

get '/api/tag' do
	query("SELECT * FROM tag;", [], Proc.new { |result| handle_read(result)})
end

get '/api/tag/:id' do |id|
	query("SELECT * FROM tag WHERE id=$1::int", [id], Proc.new { |result| handle_read_by_id(result)})
end

post '/api/tag' do
	request.body.rewind
	data = JSON.parse(request.body.read)
	name = data['name']
	query("INSERT INTO tag (name) VALUES ($1::text) RETURNING *;", [name], Proc.new { |result| handle_create(result, "tag")})
end

# Create note
post '/api/note' do
	request.body.rewind
	data = JSON.parse(request.body.read)
	title = data['title']
	content = data['content']
	reference = data['reference']
	query('INSERT INTO note (title, content, reference) VALUES ($1, $2::text, $3::text) RETURNING *;', [title, content, reference], Proc.new { |result| handle_create(result, "note")})
end

# Read note
get '/api/note' do
	query("SELECT * FROM note;", [], Proc.new { |result| handle_read(result)})
end

get '/api/note/:id' do |id|
	query("SELECT * FROM note WHERE id=$1::int", [id], Proc.new { |result| handle_read_by_id(result)})
end

# Update note
put '/api/note/:id' do |id|
	request.body.rewind
	data = JSON.parse(request.body.read)
	title = data['title']
	content = data['content']
	reference = data['reference']
	query('UPDATE note SET title=$2::text, content=$3::text, reference=$4::text WHERE id=$1::int RETURNING *;', [id, title, content, reference], Proc.new { |result| handle_update(result, "note")})
end

# Destroy note
delete '/api/note/:id' do |id|
	query("DELETE FROM note where id=$1::int RETURNING *", [id], Proc.new { |result| handle_delete_by_id(result)});
end

# Create note tag
post '/api/note_tag' do
	request.body.rewind
	data = JSON.parse(request.body.read)
	note_id = data['note_id']
	tag_id = data['tag_id']
	query("INSERT INTO note_tag (note_id, tag_id) VALUES ($1::int, $2::int) RETURNING *;", [note_id, tag_id], Proc.new { |result| handle_create(result, "note_tag")})
end

# Read note tag
get '/api/note_tag' do
	query("SELECT * FROM note_tag;", [], Proc.new { |result| handle_read(result)})
end

get '/api/note_tag/:id' do |id|
	/([0-9]+)-([0-9]+)/.match(id) do |match|
		query("SELECT * FROM note_tag WHERE note_id=$1::int AND tag_id=$2::int;", [m[0], m[1]], Proc.new { |result| handle_read_by_id(result)})
	end
end

# Create image
post '/api/image_metadata' do
	request.body.rewind
	data = JSON.parse(request.body.read)
	title = data['title']
#	mime_type = data['mime_type']
	data_uri = data['data']
	# Performance of this is awful (90+ seconds) as .+ instead of \w+
	prefix_match = /data:(\w+\/\w+);base64,/.match(data_uri)
	mime_type = prefix_match[1]
	#image_data = '\x' + Base64.strict_decode64(data_uri[prefix_match[0].length..-1]).unpack('H*')[0]
	#image_data = PG::Connection.escape_bytea(Base64.strict_decode64(data_uri[prefix_match[0].length..-1]))
	image_data = Base64.strict_decode64(data_uri[prefix_match[0].length..-1])
	query("INSERT INTO image (title, mime_type, data) VALUES ($1::text, $2::text, $3::bytea) RETURNING id, title, mime_type;", [title, mime_type, {:value => image_data, :type => 0, :format => 1}], Proc.new { |result| handle_create(result, "image_metadata")})
end

# Read image
get '/api/image_metadata' do
	query("SELECT id, title, mime_type FROM image;", [], Proc.new { |result| handle_read(result)})
end

get '/api/image/:id' do |id|
	query_binary("SELECT * FROM image WHERE id=$1::int;", [id], Proc.new { |result| handle_read_binary_by_id(result)})
end

# TODO: Delete image
# delete '/api/image_metadata' do
# end

# TODO: Update image
# put '/api/image_metadata/:id do
# end

# Create page
post '/api/page' do
	request.body.rewind
	data = JSON.parse(request.body.read)
	title = data['title']
	content = data['content']
	query('INSERT INTO page (title, content) VALUES ($1, $2::text) RETURNING *;', [title, content], Proc.new { |result| handle_create(result, "page")})
end

# Read page
get '/api/page' do
	query("SELECT * FROM page;", [], Proc.new { |result| handle_read(result)})
end

# Read page
get '/api/page/:id' do |id|
	query("SELECT * FROM page WHERE id=$1::int", [id], Proc.new { |result| handle_read_by_id(result)})
end

# Update page
put '/api/page/:id' do |id|
	request.body.rewind
	data = JSON.parse(request.body.read)
	title = data['title']
	content = data['content']
	query('UPDATE page SET title=$2::text, content=$3::text WHERE id=$1::int RETURNING *;', [id, title, content], Proc.new { |result| handle_update(result, "page")})
end

# Delete page
delete '/api/page/:id' do |id|
	query("DELETE FROM page where id=$1::int RETURNING *", [id], Proc.new { |result| handle_delete_by_id(result)});
end

get '/api/citation' do
	query("SELECT * FROM citation;", [], Proc.new { |result| handle_read(result)})
end

get '/api/citation/:id' do |id|
	/([0-9]+)-([0-9]+)/.match(id) do |match|
		query("SELECT * FROM citation WHERE page_id=$1::int AND note_id=$2::int;", [m[0], m[1]], Proc.new { |result| handle_read_by_id(result)})
	end
end

post '/api/citation' do
	request.body.rewind
	data = JSON.parse(request.body.read)
	page_id = data['page_id']
	note_id = data['note_id']
	query("INSERT INTO citation (page_id, note_id) VALUES ($1::int, $2::int) RETURNING *;", [page_id, note_id], Proc.new { |result| handle_create(result, "citation")})
end

get '/*' do
	send_file 'public/platform.html'
end
