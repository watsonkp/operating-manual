let INDEX_BINDINGS = {};
let STATE = {'object_name': '', 'creating': false, 'editing': false, 'creating-image': false};
let DATA = {};

document.addEventListener('click', event => {
	if (event.target.tagName === 'A') {
		// TODO: Filter to only same domain
		history.pushState(null, '', event.target.href);
		route(new URL(event.target.href));
		event.preventDefault();
	} else if (event.target.tagName === 'TD') {
		// TODO: More specific to the table instead of the document?
		addNoteToPage(parseInt(event.target.parentElement.firstElementChild.innerText));
	}
});

function addNoteToPage(id) {
	let content = document.getElementById('creator-content');
	let markdown = `[${DATA['notes'][id]['title']}](${DATA['notes'][id]['reference']})\n${DATA['notes'][id]['content']}\n\n`;
	content.value += markdown;
}

function serialize(parameters, inputs) {
	let data = {};
	for (let parameter of parameters) {
		data[parameter] = inputs[parameter].value;
	}
	return JSON.stringify(data);
}

function createImage(event) {
	let action = event.submitter.parentNode.action;
	let method = event.submitter.parentNode.method;
	let body = {title: event.submitter.parentNode.elements['title'].value};
	let options = {method: method,
		headers: {'Content-Type': 'application/json'},
		redirect: 'follow'};
	const reader = new FileReader();
	reader.onload = (event) => {
		body['data'] = event.target.result;
		options.body = JSON.stringify(body);
		fetch(action, options)
			.then(response => response.json())
			.then(data => console.log(data))
			.catch(error => console.error(error));
	};
	reader.readAsDataURL(event.submitter.parentNode.elements['data'].files[0]);
	event.preventDefault();
}

function createNote(event) {
	let action = '/api/note';
	let options = {headers: {'Content-Type': 'application/json'},
			redirect: 'follow'};
	// TODO: switch based on which submit button was clicked
	switch (STATE['operation']) {
		case 'create':
			options.method = 'post';
			options.body = serialize(['title', 'reference', 'content'], event.submitter.parentNode.elements);
			fetch(action, options)
				.then(response => response.json())
				.then(data => {
					console.log(data)
					STATE['operation'] = 'update';
					STATE['object_id'] = data['id'];
					let url = new URL(document.location);
					url.search = new URLSearchParams([[STATE['object_name'], STATE['object_id']]]).toString();
					route(url);
				})
//				.then(error => console.error(error));
			break;
		case 'update':
			action += STATE['object_id'];
			options.method = 'put';
//			options.body = serialize(['title', 'reference', 'content'], event.submitter.parentNode.elements);
//			fetch(action, options)
//				.then(response => response.json())
//				.then(data => {
//					console.log(data)
//					STATE['operation'] = 'read';
//				})
//				.then(error => console.error(error));
			break;
	}
	event.preventDefault();
}

function tagNote(event) {
	console.log('tagNote()');
	event.preventDefault();
}

function createPage(event) {
	let action = event.submitter.parentNode.action;
	let options = {method: 'post',
			headers: {'Content-Type': 'application/json'},
			body: serialize(['title', 'content'], event.submitter.parentNode.elements),
			redirect: 'follow'};
	fetch(action, options)
		.then(response => response.json())
		.then(data => console.log(data))
		.catch(error => console.error(error));
	event.preventDefault();
}

function updatePage(event) {
	console.log('Updating page...');
	const action = `/api/page/${STATE['page_id']}`;
	const options = {method: 'put',
				headers: {'Content-Type': 'application/json'},
				body: serialize(['title', 'content'], event.submitter.parentNode.elements),
				redirect: 'follow'};
	fetch(action, options)
		.then(response => response.json())
		.then(data => console.log(data))
		.catch(error => console.error(error));
	event.preventDefault();
}

document.getElementById('page-editor').addEventListener('submit', updatePage);
document.getElementById('page-creator').addEventListener('submit', createPage);
document.getElementById('image-creator').addEventListener('submit', createImage);
document.getElementById('note-editor').addEventListener('submit', createNote);

let editor_toggle = document.getElementById('editor-toggle');
editor_toggle.addEventListener('click', toggleEditor);
document.getElementById('creator-toggle').addEventListener('click', toggleCreator);
document.getElementById('image-creator-toggle').addEventListener('click', toggleImageCreator);
document.getElementById('note-creator-toggle').addEventListener('click', toggleNote);

function renderMarkdownLeafNodes(markdown) {
	const leaf_pattern = /\[(.*)\]\((.+)\)/g;
	let nodes = [];
	let matches = markdown.matchAll(leaf_pattern);
	let position = 0;
	for (const match of matches) {
	//	console.log(match);
		nodes.push(document.createTextNode(markdown.substring(position, match.index)));
		position += match.index;

		let anchor = document.createElement('a');
		anchor.href = match[2];
		if (match[1] === '') {
			anchor.appendChild(document.createTextNode(match[2]));
		} else {
			anchor.appendChild(document.createTextNode(match[1]));
		}
		nodes.push(anchor);
		position += match[0].length;
	}
	if (position < markdown.length) {
		nodes.push(document.createTextNode(markdown.substring(position)));
	}
	return nodes;
}

function renderMarkdownAsHTML(markdown) {
	let lines = markdown.split(/\n(?!\n)/);
	let nodes = [];
	for (let line of lines) {
		// Parse branch nodes
		let heading_match = line.match(/^(#+)(.+)/);
		if (heading_match) {
			let heading = document.createElement(`h${heading_match[1].length}`);
			heading.append(...renderMarkdownLeafNodes(heading_match[2]));
			nodes.push(heading);
			continue
		}
		if (line.match(/^.+\n$/)) {
			let paragraph = document.createElement('p');
			paragraph.append(...renderMarkdownLeafNodes(line.trim()));
			nodes.push(paragraph);
			continue;
		}
		let image_match = line.match(/!\[(.*)\]\((.+)\)/);
		if (image_match) {
			let image = document.createElement('img');
			image.src = image_match[2];
			if (image_match[1].length === 0) {
				image.alt = image_match[2];
				image.title = image_match[2];
			} else {
				image.alt = image_match[1];
				image.title = image_match[1];
			}
			nodes.push(image);
			continue;
		}
		nodes.push(document.createTextNode(line));
	}
	return nodes;
}

function renderPage() {
	let page = DATA['pages'][STATE['page_id']];
	let page_title = document.getElementById('page-title');
	page_title.textContent = page['title'];
	let page_content = document.getElementById('page-section');
	page_content.replaceChildren(...renderMarkdownAsHTML(page['content']));
}

function renderEditor() {
	let page = DATA['pages'][STATE['page_id']];
	document.getElementById('page_id').value = page['id'];;
	document.getElementById('title').value = page['title'];;
	document.getElementById('content').value = page['content'];;
}

function toggleEditor(event) {
	STATE['editing'] = !STATE['editing'];
	if (STATE['editing']) {
		changeView('editor');
	} else {
		changeView('single');
		renderPage();
	}
}

function toggleCreator(event) {
	console.log('Starting creator...');
	STATE['creating'] = !STATE['creating'];
	if (STATE['creating']) {
		changeView('creator');
	} else {
		changeView('single');
		renderPage();
	}
}

function toggleImageCreator(event) {
	STATE['creating-image'] = !STATE['creating-image'];
	if (STATE['creating-image']) {
		changeView('image-creator');
	} else {
		changeView('summary');
	}
}

function toggleNote(event) {
	STATE['creating-note'] = !STATE['creating-note'];
	if (STATE['creating-note']) {
		STATE['operation'] = 'create';
		changeView('note');
	} else {
		changeView('summary');
	}
}

function renderIndex() {
	let index = document.getElementById('index');
	for (const [id, page] of Object.entries(DATA['pages'])) {
		if (INDEX_BINDINGS.hasOwnProperty(id)) {
		} else {
			let index_entry = document.createElement('li');
			let anchor = document.createElement('a');
			anchor.href = `/pages.html?id=${id}`;
			anchor.appendChild(document.createTextNode(page['title']));
			index_entry.appendChild(anchor);
			index.appendChild(index_entry);
			INDEX_BINDINGS[id] = index_entry;
		}
	}
}

function renderCreator() {
	let table = document.getElementById('note-rows');
	for (let [id, note] of Object.entries(DATA['notes'])) {
		let row = document.createElement('tr');
		let id_column = document.createElement('td')
		id_column.appendChild(document.createTextNode(note['id']));
		let title_column = document.createElement('td')
		title_column.appendChild(document.createTextNode(note['title']));
		row.append(id_column, title_column);
		table.appendChild(row);
	}
}

// TODO: Move between create, read, update and delete by hiding or disabling elements based on class
function changeOperation() {
}

function renderNote() {
	let editor = document.getElementById('note-editor');
	console.log(`Render editor for: ${STATE['operation']}`);
	switch (STATE['operation']) {
		case 'create':
			break;
		case 'update':
			editor.elements['note-id'].value = STATE['object_id'];
			editor.elements['note-editor-tag'].removeAttribute('disabled');
			editor.elements['note-tag-creator'].removeAttribute('hidden');
			//document.getElementById('note-id').value = STATE['object_id'];
			break;
	}
}

function getNotes() {
	return fetch('/api/note')
		.then(response => response.json())
		.then(data => {
			storeNotes(data);
		})
		.catch(error => console.error(error));
}

function load() {
	return fetch('/api/page')
		.then(response => response.json())
		.catch(error => console.error(error));
}

function storeNotes(notes) {
	let store = {};
	for (let note of notes) {
		store[note.id] = note;
	}
	DATA['notes'] = store;
}

function storePages(pages) {
	let store = {};
	for (let page of pages) {
		store[page.id] = page;
	}
	DATA['pages'] = store;
}

function changeView(view) {
	switch(STATE['view']) {
		case 'summary':
			document.getElementById('index').setAttribute('hidden', '');
			break;
		case 'single':
			document.getElementById('page').setAttribute('hidden', '');
			break;
		case 'editor':
			document.getElementById('page-editor').setAttribute('hidden', '');
			break;
		case 'creator':
			for (let element of document.getElementsByClassName('creator')) {
				element.setAttribute('hidden', '');
			}
			break;
		case 'image-creator':
			document.getElementById('image-creator').setAttribute('hidden', '');
			break;
		case 'note':
			document.getElementById('note-editor').setAttribute('hidden', '');
			break;
	}

	switch(view) {
		case 'summary':
			renderIndex();
			document.getElementById('index').removeAttribute('hidden');
			break;
		case 'single':
			renderPage();
			document.getElementById('page').removeAttribute('hidden');
			break;
		case 'editor':
			renderEditor();
			document.getElementById('page-editor').removeAttribute('hidden');
			break;
		case 'creator':
			getNotes()
				.then(_ => renderCreator());
			for (let element of document.getElementsByClassName('creator')) {
				element.removeAttribute('hidden');
			}
			break;
		case 'image-creator':
			document.getElementById('image-creator').removeAttribute('hidden');
			break;
		case 'note':
			STATE['object_name'] = 'note';
			renderNote();
			document.getElementById('note-editor').removeAttribute('hidden');
			break;
	}

	STATE['view'] = view;
}

function route(url) {
	const path = url.pathname;
	switch (path) {
	case '/platform.html':
		const object_names = ['image', 'note', 'page'];
		for (const name of object_names) {
			if (url.searchParams.has(name)) {
				STATE['object_name'] = name;
				STATE['object_id'] = parseInt(url.searchParams.get(name));
				break;
			}
		}
//		let page_id = url.searchParams.get('id');
//		STATE['page_id'] = page_id;
//		if (page_id === null) {
//			changeView('summary');
//		} else {
//			// TODO: Display specific items using a searchstring ?note=3
//			console.log(`Routed to page ${page_id}`);
//			changeView('single');
//		}
		switch(STATE['object_name']) {
			case '':
				changeView('summary');
				break;
			case 'note':
				changeView(STATE['object_name']);
				break;
			case 'page':
				changeView('single');
				break;
		}
		console.log(`Routed to ${STATE['object_name']} ${STATE['object_id']}`);
		break
	default:
		console.error(`ERROR: Unexpected route ${path}`);
		break;
	}
}

load().then(data => {
		storePages(data)
		route(new URL(document.location));
	});
