// Send JSON object with title, reference and content properties
// Success redirects to the new ID
function serialize(parameters, inputs) {
	let data = {};
	for (let parameter of parameters) {
		data[parameter] = inputs[parameter].value
	}
	return JSON.stringify(data);
}

//function createTags(names) {
//	let options = {method: event.submitter.parentNode.method,
//			headers: {'Content-Type': 'application/json'},
//			body: {'name': name},
//			redirect: 'follow'};
//	fetch('/api/tag', options)
//		.then(response => response.json())
//		.then(data => {
//			console.log(data);
//		})
//		.catch(error => console.error(error));
//}

//function getTags() {
//	return fetch('/api/tag')
//		.then(response => response.json())
//		.catch(error => console.error(error));
//}


function tagNote(note_id, tag_names) {
	console.log('Tagging ' + note_id + ' with: ' + tag_names);
	// Get all tags
	fetch('/api/tag')
		.then(response => response.json())
		.then(tags => {
			// Build list of tag IDs from existing tags
			let tag_ids = [];
			let new_names = [];
			nameEnumeration:
			for (let tag_name of tag_names) {
				for (let tag of tags) {
					if (tag['name'] === tag_name) {
						tag_ids.push(tag['id']);
						continue nameEnumeration;
					}
				}
				new_names.push(tag_name);
			}
			console.log('Existing tag IDs: ' + tag_ids);
			console.log('New tags to create: ' + new_names);
			// Create new tags from remaining names
			let new_tags = [];
			for (let new_name of new_names) {
				let options = {method: 'post',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({'name': new_name}),
						redirect: 'follow'};
				new_tags.push(fetch('/api/tag', options)
					.then(response => response.json())
					.catch(error => console.error(error)));
			}
			Promise.all(new_tags)
				.then(tags => {
				// Complete list of tag IDs from newly created tags
				for (let tag of tags) {
					tag_ids.push(tag['id']);
				}
				console.log('Tag IDs to use: ' + tag_ids);
				// Create note tags from note id and list of tag IDs
				let note_tags = [];
				for (let tag_id of tag_ids) {
					let options = {method: 'post',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({'note_id': note_id, 'tag_id': tag_id}),
							redirect: 'follow'};
					note_tags.push(fetch('/api/note_tag', options)
						.then(response => response.json())
						.catch(error => console.log(error)));
				}
				Promise.all(note_tags)
					.then(results => console.log(results));
			}).catch(error => console.log(error));
		})
		.catch(error => console.error(error));
}

function submitNote(event) {
	let action = event.submitter.parentNode.action;
	let options = {method: event.submitter.parentNode.method,
			headers: {'Content-Type': 'application/json'},
			body: serialize(['title', 'reference', 'content'], event.submitter.parentNode.elements),
			redirect: 'follow'};
	if (event.submitter.value === 'Create') {
		console.log('Creating note with body: ' + options.body);
		fetch(action, options)
			.then(response => response.json())
			.then(data => {
				console.log(data);
				document.getElementById('note-id').value = parseInt(data['id']);
				document.getElementById('title').setAttribute('disabled', '');
				document.getElementById('content').setAttribute('disabled', '');
				document.getElementById('reference').setAttribute('disabled', '');
				document.getElementById('note-tag').removeAttribute('disabled');
				document.getElementById('note-create').setAttribute('hidden', '');
				document.getElementById('note-tag-create').removeAttribute('hidden');
			})
			.catch(error => console.error(error));
	} else if (event.submitter.value === 'Tag') {
		console.log('Tag form submission');
		let note_id = document.getElementById('note-id').value;
		let tag_names = event.submitter.parentNode.elements['note-tag'].value.split(' ');
		document.getElementById('note-tag-create').setAttribute('hidden', '');
		tagNote(note_id, tag_names);
		//tagNote(note_id, createTags(tag_names));
	} else {
		console.error(event.submitter.value);
	}
	event.preventDefault();
}

let form = document.getElementById('note-form')
form.addEventListener('submit', submitNote);
