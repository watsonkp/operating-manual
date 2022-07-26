STATE = {};
DATA = {};

DATA_BINDINGS = {note: '/api/note',
			page: '/api/page',
			image: '/api/image_metadata'};

DATA_DEPENDENCIES = {index: ['note', 'page', 'image'],
			note: ['note'],
			page: ['page'],
			image: ['image']};

function serialize(parameters, inputs) {
	let data = {};
	for (let parameter of parameters) {
		data[parameter] = inputs[parameter].value;
	}
	return JSON.stringify(data);
}

function checkDataDependencies(view) {
	for (let dependency of DATA_DEPENDENCIES[view]) {
		if (DATA[dependency] === undefined) {
			return false
		}
	}
	return true
}

function storeData(object_name, data) {
	console.log(`Storing new ${object_name}: ${data}`);
	let store = {};
	for (const datum of data) {
		store[datum['id']] = datum;
	}
	DATA[object_name] = store;
}

function loadData(view) {
	console.log(`Loading data for ${view}`);
	let requests = [];
	for (let dependency of DATA_DEPENDENCIES[view]) {
		requests.push(fetch(DATA_BINDINGS[dependency])
			.then(response => response.json())
			.then(data => [dependency, data])
			.catch(error => console.error(error)));
	}
	Promise.all(requests)
		.then((data) => {
			for (let datum of data) {
				storeData(...datum);
			}
			render()
		});
}

function toggleCreate(event) {
	STATE['operation'] = 'create';
	if (STATE['object_id'] !== null) {
		// TODO: should be unnecessary if route is called
		STATE['object_id'] = null;
		let url = new URL(document.location.href);
		url.searchParams.delete('id');
		route(url);
	} else {
		render();
	}
	event.preventDefault();
}

function toggleRead(event) {
	STATE['operation'] = 'read';
	render();
	event.preventDefault();
}

function toggleUpdate(event) {
	STATE['operation'] = 'update';
	render();
	event.preventDefault();
}

function renderIndex(operation) {
	console.log(`renderIndex(${operation})`);
}

function bindImageData() {
	let index = document.getElementById('image-index');
	let fragment = new DocumentFragment();
	for (let [id, image] of Object.entries(DATA['image'])) {
		let row = document.createElement('tr');
		let id_cell = document.createElement('td');
		let anchor = document.createElement('a');
		anchor.setAttribute('href', `/raw/images?id=${image['id']}`);
		anchor.appendChild(document.createTextNode(image['id']));
		id_cell.appendChild(anchor);
		let title_cell = document.createElement('td');
		title_cell.appendChild(document.createTextNode(image['title']));
		row.appendChild(id_cell);
		row.appendChild(title_cell);
		fragment.appendChild(row);
	}
	index.replaceChildren(fragment);

	if (STATE['object_id'] !== null) {
		let id = STATE['object_id'];
		document.getElementById('image-viewer').replaceChildren();
		let title = document.createElement('h2');
		title.appendChild(document.createTextNode(DATA['image'][id]['title']));
		let content = document.createElement('img');
		content.setAttribute('src', `/api/image/${id}`);
		content.setAttribute('alt', DATA['image'][id]['title']);
		content.setAttribute('title', DATA['image'][id]['title']);
		document.getElementById('image-viewer').replaceChildren(title, content);
	}

	// Bind data to editor
	// TODO: Think how I want to implement this. Title vs. data vs. both
//	if (STATE['object_id'] !== null) {
//		let id = STATE['object_id'];
//		let form = document.getElementById('page-editor');
//		form.elements['id'].value = DATA['page'][id]['id'];
//		form.elements['title'].value = DATA['page'][id]['title'];
//		form.elements['content'].value = DATA['page'][id]['content'];
//	}
}

function renderImage(operation) {
	console.log(`renderNote(${operation})`);
	bindImageData();
	document.getElementById('image').removeAttribute('hidden');
	switch(operation) {
		case 'index':
			document.getElementById('image-viewer').setAttribute('hidden', '');
			document.getElementById('image-editor').setAttribute('hidden', '');
			document.getElementById('image-index').removeAttribute('hidden');
			break;
		case 'create':
			document.getElementById('image-index').setAttribute('hidden', '');
			document.getElementById('image-viewer').setAttribute('hidden', '');
			document.getElementById('image-editor').removeAttribute('hidden');
			break;
		case 'read':
			document.getElementById('image-index').setAttribute('hidden', '');
			document.getElementById('image-editor').setAttribute('hidden', '');
			document.getElementById('image-viewer').removeAttribute('hidden');
			break;
		case 'update':
			document.getElementById('image-index').setAttribute('hidden', '');
			document.getElementById('image-viewer').setAttribute('hidden', '');
			document.getElementById('image-editor').removeAttribute('hidden');
			break;
		default:
			console.error('Tried to render a image with the unexpected operation: ' + operation);
			break;
	}
}


function renderPage(operation) {
	console.log(`renderPage(${operation})`);
	bindPageData();
	document.getElementById('page').removeAttribute('hidden');
	switch(operation) {
		case 'index':
			document.getElementById('page-viewer').setAttribute('hidden', '');
			document.getElementById('page-editor').setAttribute('hidden', '');
			document.getElementById('page-index').removeAttribute('hidden');
			break;
		case 'create':
			document.getElementById('page-index').setAttribute('hidden', '');
			document.getElementById('page-viewer').setAttribute('hidden', '');
			document.getElementById('page-editor').removeAttribute('hidden');
			break;
		case 'read':
			document.getElementById('page-index').setAttribute('hidden', '');
			document.getElementById('page-editor').setAttribute('hidden', '');
			document.getElementById('page-viewer').removeAttribute('hidden');
			break;
		case 'update':
			document.getElementById('page-index').setAttribute('hidden', '');
			document.getElementById('page-viewer').setAttribute('hidden', '');
			document.getElementById('page-editor').removeAttribute('hidden');
			break;
		default:
			console.error('Tried to render a page with the unexpected operation: ' + operation);
			break;
	}
}

function bindPageData() {
	let index = document.getElementById('page-index');
	let fragment = new DocumentFragment();
	for (let [id, page] of Object.entries(DATA['page'])) {
		let row = document.createElement('tr');
		let id_cell = document.createElement('td');
		let anchor = document.createElement('a');
		anchor.setAttribute('href', `/raw/pages?id=${page['id']}`);
		anchor.appendChild(document.createTextNode(page['id']));
		id_cell.appendChild(anchor);
		let title_cell = document.createElement('td');
		title_cell.appendChild(document.createTextNode(page['title']));
		row.appendChild(id_cell);
		row.appendChild(title_cell);
		fragment.appendChild(row);
	}
	index.replaceChildren(fragment);

	if (STATE['object_id'] !== null) {
		let id = STATE['object_id'];
		document.getElementById('page-viewer').replaceChildren();
		let title = document.createElement('h1');
		title.appendChild(document.createTextNode(DATA['page'][id]['title']));
		let content = document.createElement('section');
		content.append(renderMarkdownAsHTML(DATA['page'][id]['content']));
		document.getElementById('page-viewer').replaceChildren(title, content);
	}

	// Bind data to editor
	if (STATE['object_id'] !== null) {
		let id = STATE['object_id'];
		let form = document.getElementById('page-editor');
		form.elements['id'].value = DATA['page'][id]['id'];
		form.elements['title'].value = DATA['page'][id]['title'];
		form.elements['content'].value = DATA['page'][id]['content'];
	}
}

function bindNoteData() {
	let index = document.getElementById('note-index');
	let fragment = new DocumentFragment();
	for (let [id, note] of Object.entries(DATA['note'])) {
		let row = document.createElement('tr');
		let id_cell = document.createElement('td');
		let anchor = document.createElement('a');
		anchor.setAttribute('href', `/raw/notes?id=${note['id']}`);
		anchor.appendChild(document.createTextNode(note['id']));
		id_cell.appendChild(anchor);
		let title_cell = document.createElement('td');
		title_cell.appendChild(document.createTextNode(note['title']));
		row.appendChild(id_cell);
		row.appendChild(title_cell);
		fragment.appendChild(row);
	}
	index.replaceChildren(fragment);

	if (STATE['object_id'] !== null) {
		let id = STATE['object_id'];
		let title = document.createElement('h2');
		title.appendChild(document.createTextNode(DATA['note'][id]['title']));
		let reference = document.createElement('h3');
		reference.appendChild(document.createTextNode(DATA['note'][id]['reference']));
		let content = document.createElement('section');
//		content.appendChild(document.createTextNode(DATA['note'][id]['content']));
		content.append(renderMarkdownAsHTML(DATA['note'][id]['content']));
		document.getElementById('note-viewer').replaceChildren(title, reference, content);
	}

	// Bind data to editor
	if (STATE['object_id'] !== null) {
		let id = STATE['object_id'];
		let form = document.getElementById('note-editor');
		form.elements['id'].value = DATA['note'][id]['id'];
		form.elements['title'].value = DATA['note'][id]['title'];
		form.elements['reference'].value = DATA['note'][id]['reference'];
		form.elements['content'].value = DATA['note'][id]['content'];
	}
}

function renderNote(operation) {
	console.log(`renderNote(${operation})`);
	bindNoteData();
	document.getElementById('note').removeAttribute('hidden');
	switch(operation) {
		case 'index':
			document.getElementById('note-viewer').setAttribute('hidden', '');
			document.getElementById('note-editor').setAttribute('hidden', '');
			document.getElementById('note-index').removeAttribute('hidden');
			break;
		case 'create':
			document.getElementById('note-index').setAttribute('hidden', '');
			document.getElementById('note-viewer').setAttribute('hidden', '');
			document.getElementById('note-editor').removeAttribute('hidden');
			document.getElementById('note-editor').elements['note-tag'].setAttribute('disabled', '');
			break;
		case 'read':
			document.getElementById('note-index').setAttribute('hidden', '');
			document.getElementById('note-editor').setAttribute('hidden', '');
			document.getElementById('note-viewer').removeAttribute('hidden');
			break;
		case 'update':
			document.getElementById('note-index').setAttribute('hidden', '');
			document.getElementById('note-viewer').setAttribute('hidden', '');
			document.getElementById('note-editor').removeAttribute('hidden');
			document.getElementById('note-editor').elements['note-tag'].removeAttribute('disabled');
			break;
		default:
			console.error('Tried to render a note with the unexpected operation: ' + operation);
			break;
	}
}

function render() {
	const view = STATE['view'];
	const operation = STATE['operation'];
	console.log(`Render ${STATE['view']}:${STATE['operation']}`);
	if (!checkDataDependencies(view)) {
		console.log(`loadData(${view})`);
		return loadData(view);
	}
	
	switch(view) {
		case 'index':
			document.getElementById('note').setAttribute('hidden', '');
			document.getElementById('page').setAttribute('hidden', '');
			document.getElementById('image').setAttribute('hidden', '');
			renderIndex(operation);
			break;
		case 'note':
			document.getElementById('index').setAttribute('hidden', '');
			document.getElementById('page').setAttribute('hidden', '');
			document.getElementById('image').setAttribute('hidden', '');
			renderNote(operation);
			break;
		case 'page':
			document.getElementById('index').setAttribute('hidden', '');
			document.getElementById('note').setAttribute('hidden', '');
			document.getElementById('image').setAttribute('hidden', '');
			renderPage(operation);
			break;
		case 'image':
			document.getElementById('index').setAttribute('hidden', '');
			document.getElementById('note').setAttribute('hidden', '');
			document.getElementById('page').setAttribute('hidden', '');
			renderImage(operation);
			break;
		default:
			console.error('Tried to render unexpected view ' + view);
			break;
	}
}

function route(url) {
	console.log(`Routing to ${url.href}`);
	// TODO: add routes to history
	history.pushState(null, '', url.toString());
	const id = url.searchParams.get('id');
	STATE['object_id'] = id;
	if (STATE['operation'] === undefined) {
		if (id === null) {
			STATE['operation'] = 'index';
		} else {
			STATE['operation'] = 'read';
		}
	}
	switch (url.pathname) {
		case '/raw/':
		case '/raw/platform.html':
			STATE['view'] = 'index';
			break;
		case '/raw/notes':
			STATE['view'] = 'note';
			break;
		case '/raw/pages':
			STATE['view'] = 'page';
			break;
		case '/raw/images':
			STATE['view'] = 'image';
			break;
		default:
			console.error(`Unexpected path: ${url.pathname}`);
			break;
	}
	render();
}

function submitPage(event) {
	switch (event.submitter.value) {
		case 'Create': {
			let options = {method: 'post',
					body: serialize(['title', 'content'], event.submitter.parentNode.elements),
					redirect: 'follow'};
			fetch('/api/page', options)
				.then(response => response.json())
				.then(data => {
					DATA['page'][data['id']] = data;
					let url = new URL(document.location.href);
					let params = new URLSearchParams(url.search);
					params.set('id', data['id']);
					url.search = params.toString();
					STATE['operation'] = 'read';
					route(url);
				})
				.catch(error => console.error(error));
			break;
		} case 'Update': {
			let id = STATE['object_id'];
			let options = {method: 'put',
					body: serialize(['title', 'content'], event.submitter.parentNode.elements),
					redirect: 'follow'};
			fetch(`/api/page/${id}`, options)
				.then(response => response.json())
				.then(data => {
					DATA['page'][data['id']] = data;
					STATE['operation'] = 'read';
					render();
				})
				.catch(error => console.error(error));
			break;
		} case 'Delete': {
			let id = STATE['object_id'];
			let options = {method: 'delete',
					redirect: 'follow'};
			fetch(`/api/page/${id}`, options)
				.then(response => {
					if (!response.ok) {
						console.error(`Error deleting page ${id}: HTTP response ${response.status}`);
					} else {
						STATE['object_id'] = null;
						STATE['operation'] = undefined;
						delete DATA['page'][id];
						let url = new URL(document.location.href);
						let params = new URLSearchParams(url.search);
						params.delete('id');
						url.search = params.toString();
						route(url);
					}
				})
				.catch(error => console.error(error));
			break;
		} default: {
			console.error('Unexpected value submitted of page-editor form');
			break;
		}
	}
	event.preventDefault();
}

function submitImage(event) {
	switch (event.submitter.value) {
		case 'Create': {
			let options = {method: 'post',
					headers: {'Content-Type': 'application/json'},
					redirect: 'follow'};
			let body = {'title': event.submitter.parentNode.elements['title'].value}
			const reader = new FileReader();
			reader.onload = (event) => {
				body['data'] = event.target.result;
				options.body = JSON.stringify(body);
				fetch('/api/image_metadata', options)
					.then(response => response.json())
					.then(data => {
						DATA['image'][data['id']] = data;
						let url = new URL(document.location.href);
						let params = new URLSearchParams(url.search);
						params.set('id', data['id']);
						url.search = params.toString();
						STATE['operation'] = 'read';
						route(url);
					})
					.catch(error => console.error(error));
			};
			reader.readAsDataURL(event.submitter.parentNode.elements['data'].files[0]);
			break;
		} default: {
			console.error('Unexpected value submitted of image-editor form');
			break;
		}
	}
	event.preventDefault();
}

function submitNote(event) {
	console.log(event.submitter.value);
	switch(event.submitter.value) {
		case 'Create': {
			let options = {method: 'post',
						body: serialize(['title', 'reference', 'content'], event.submitter.parentNode.elements),
						redirect: 'follow'};
			fetch('/api/note', options)
				.then(response => response.json())
				.then(data => {
					DATA['note'][data['id']] = data;
					console.log(data);
					//STATE['operation'] = 'update';
					//render();
					let url = new URL(document.location.href);
					let params = new URLSearchParams(url.search);
					params.set('id', data['id']);
					url.search = params.toString();
					STATE['operation'] = 'read';
					route(url);
				})
				.catch(error => console.error(error));
			break;
		} case 'Tag': {
			// TODO
			break;
		} case 'Update': {
			let id = STATE['object_id'];
			let options = {method: 'put',
					body: serialize(['title', 'reference', 'content'], event.submitter.parentNode.elements),
					redirect: 'follow'};
			fetch(`/api/note/${id}`, options)
				.then(response => response.json())
				.then(data => {
					DATA['note'][data['id']] = data;
					STATE['operation'] = 'read';
					render();
				})
				.catch(error => console.error(error));
			break;
		} case 'Delete': {
			let id = STATE['object_id'];
			let options = {method: 'delete',
					redirect: 'follow'};
			fetch(`/api/note/${id}`, options)
				.then(response => {
					if (!response.ok) {
						console.error(`Error deleting note ${id}: HTTP response ${response.status}`);
					} else {
						STATE['object_id'] = null;
						STATE['operation'] = undefined;
						delete DATA['note'][id];
						let url = new URL(document.location.href);
						let params = new URLSearchParams(url.search);
						params.delete('id');
						url.search = params.toString();
						route(url);
					}
				})
				.catch(error => console.error(error));
			break;
		} default:
			console.error('Unexpected value submitted of note-editor form');
			break;
	}
	event.preventDefault();
}

document.addEventListener('click', event => {
	if (event.target.tagName === 'A') {
		// TODO: Filter to only same domain
		history.pushState(null, '', event.target.href);
		STATE['operation'] = undefined
		try {
			route(new URL(event.target.href));
		} catch (error) {
			console.error(error);
		} finally {
			event.preventDefault();
		}
	}
});

// TODO: listen to popstate event and route
window.addEventListener('popstate', (event) => {
	console.log('popstate: ' + document.location);
});

document.getElementById('create').addEventListener('click', toggleCreate);
document.getElementById('read').addEventListener('click', toggleRead);
document.getElementById('update').addEventListener('click', toggleUpdate);

document.getElementById('note-editor').addEventListener('submit', submitNote);
document.getElementById('page-editor').addEventListener('submit', submitPage);
document.getElementById('image-editor').addEventListener('submit', submitImage);

route(new URL(document.location));
