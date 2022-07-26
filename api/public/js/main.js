API_TAG='/api/tag'
API_NOTE='/api/note'
API_NOTE_TAG='/api/note_tag'
API_IMAGE='/api/image'
API_IMAGE_METADATA='/api/image_metadata'
API_PAGE='/api/page'
API_CITATION='/api/citation'

// Get list of properties
// Compare list of properties to ordered list provided
// Write ordered list of properties
// Write remaining properties from diff

function populateTable(table, data, header, columns) {
	if (data.length === 0) {
		return
	}
	if (columns === undefined) {
		columns = [];
	}
	for (let property of Object.getOwnPropertyNames(data[0])) {
		if (!(columns.includes(property))) {
			columns.push(property);
		}
	}
	let header_row = document.createElement('tr');
	for (let column of columns) {
		let cell = document.createElement('th');
		cell.appendChild(document.createTextNode(column));
		header_row.appendChild(cell);
	}
	header.appendChild(header_row);
//	console.log(Object.getOwnPropertyNames(datum));
//	console.log(columns);
	for (let datum of data) {
		let row = document.createElement('tr');
//		for (let property in datum) {
		for (let property of columns) {
			let cell = document.createElement('td');
			cell.appendChild(document.createTextNode(datum[property]));
			row.appendChild(cell);
		}
		table.appendChild(row);
	}
}

function populateTagTable(tags) {
	let table = document.getElementById('tag-table');
	let header = document.getElementById('tag-header');
	populateTable(table, tags, header);
}

function populateNoteTable(notes) {
	let table = document.getElementById('note-table');
	let header = document.getElementById('note-header');
	populateTable(table, notes, header, ['id', 'title', 'reference']);
}

function populateImageTable(images) {
	let table = document.getElementById('image-table');
	let header = document.getElementById('image-header');
	populateTable(table, images, header);
}

function populatePageTable(pages) {
	let table = document.getElementById('page-table');
	let header = document.getElementById('page-header');
	populateTable(table, pages, header);
}

function populateCitationTable(citations) {
	let table = document.getElementById('citation-table');
	let header = document.getElementById('citation-header');
	populateTable(table, citations, header);
}

function getData(path, handler) {
	fetch(path)
		.then(function(response) {
			console.log(response.headers.get('Content-Type'));
			response.json()
				.then(data => handler(data))
		})
}

getData(API_TAG, populateTagTable);
getData(API_NOTE, populateNoteTable);
getData(API_IMAGE_METADATA, populateImageTable);
getData(API_PAGE, populatePageTable);
getData(API_CITATION, populateCitationTable);
