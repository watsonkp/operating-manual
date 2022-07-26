CREATE TABLE tag (
	id SERIAL PRIMARY KEY,
	name varchar(64) UNIQUE NOT NULL
);

CREATE TABLE note (
	id SERIAL PRIMARY KEY,
	title varchar(128),
	content TEXT UNIQUE NOT NULL,
	reference varchar(128)
);

CREATE TABLE note_tag (
	note_id SERIAL REFERENCES note(id) ON DELETE CASCADE,
	tag_id SERIAL REFERENCES tag(id) ON DELETE RESTRICT,
	PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE page (
	id SERIAL PRIMARY KEY,
	title varchar(128),
	content TEXT
);

CREATE TABLE citation (
	page_id SERIAL REFERENCES page(id) ON DELETE CASCADE,
	note_id SERIAL REFERENCES note(id) ON DELETE RESTRICT,
	PRIMARY KEY (page_id, note_id)
);

CREATE TABLE image (
	id SERIAL PRIMARY KEY,
	title VARCHAR(128),
	mime_type text NOT NULL,
	data bytea NOT NULL,
	text_content text
);

CREATE TABLE image_tag (
	image_id SERIAL REFERENCES image(id) ON DELETE CASCADE,
	tag_id SERIAL REFERENCES tag(id) ON DELETE RESTRICT,
	PRIMARY KEY (image_id, tag_id)
);
