//function renderMarkdownLeafNodes(markdown) {
//	const leaf_pattern = /\[(.*)\]\((.+)\)/g;
//	let nodes = [];
//	let matches = markdown.matchAll(leaf_pattern);
//	let position = 0;
//	for (const match of matches) {
//		nodes.push(document.createTextNode(markdown.substring(position, match.index)));
//		position += match.index;
//
//		let anchor = document.createElement('a');
//		anchor.href = match[2];
//		if (match[1] === '') {
//			anchor.appendChild(document.createTextNode(match[2]));
//		} else {
//			anchor.appendChild(document.createTextNode(match[1]));
//		}
//		nodes.push(anchor);
//		position += match[0].length;
//	}
//	if (position < markdown.length) {
//		nodes.push(document.createTextNode(markdown.substring(position)));
//	}
//	return nodes;
//}

//function renderMarkdownAsHTML(markdown) {
//	let lines = markdown.split(/\n(?!\n)/);
//	let nodes = [];
//	for (let line of lines) {
//		// Parse branch nodes
//		let heading_match = line.match(/^(#+)(.+)/);
//		if (heading_match) {
//			let heading = document.createElement(`h${heading_match[1].length}`);
//			heading.append(...renderMarkdownLeafNodes(heading_match[2]));
//			nodes.push(heading);
//			continue
//		}
//		if (line.match(/^.+\n$/)) {
//			let paragraph = document.createElement('p');
//			paragraph.append(...renderMarkdownLeafNodes(line.trim()));
//			nodes.push(paragraph);
//			continue;
//		}
//		let image_match = line.match(/!\[(.*)\]\((.+)\)/);
//		if (image_match) {
//			let image = document.createElement('img');
//			image.src = image_match[2];
//			if (image_match[1].length === 0) {
//				image.alt = image_match[2];
//				image.title = image_match[2];
//			} else {
//				image.alt = image_match[1];
//				image.title = image_match[1];
//			}
//			nodes.push(image);
//			continue;
//		}
//		nodes.push(document.createTextNode(line));
//	}
//	return nodes;
//}

class Token {
	constructor(name, value) {
		this.name = name;
		this.value = value;
	}

	static parseHeader(value) {
		const pattern = /(?<level>#+)\s*(?<text>\S.*)/;
		let match = value.match(pattern);
		if (!match) {
			console.error(`ERROR: tried to parse ${value} as a header`);
		}
		let header = document.createElement(`h${match.groups.level.length}`);
		header.appendChild(document.createTextNode(match.groups.text));
		return header;
	}

	static parseList(value) {
		const pattern = /(?<style>\*)\s*(?<text>\S+)/;
		let match = value.match(pattern);
		if (!match) {
			console.error(`ERROR: tried to parse ${value} as a list`);
		}
		let element = document.createElement('li');
		element.appendChild(document.createTextNode(match.groups.text));
		return element;
	}

	static parseQuote(value) {
		const pattern = /(?<style>\>)(?<text>.+)/;
		let match = value.match(pattern);
		if (!match) {
			console.error(`ERROR: tried to parse ${value} as a list`);
		}
		return document.createTextNode(match.groups.text)
	}

	static parseLink(value) {
		const pattern = /\[(?<text>[^\]]*)\]\((?<href>[^\)]+)\)/;
		let match = value.match(pattern);
		if (!match) {
			console.error(`ERROR: tried to parse ${value} as an anchor`);
		}
		let link = document.createElement('a');
		link.setAttribute('href', match.groups.href);
		if (match.groups.text.length === 0) {
			link.appendChild(document.createTextNode(match.groups.href));
		} else {
			link.appendChild(document.createTextNode(match.groups.text));
		}
		return link;
	}

	static parseImage(value) {
		const pattern = /!\[(?<alt>.*)\]\((?<src>.+)\)/;
		let match = value.match(pattern);
		if (!match) {
			console.error(`ERROR: tried to parse ${value} as an anchor`);
		}
		let element = document.createElement('img');
		element.setAttribute('src', match.groups.src);
		if (match.groups.alt.length === 0) {
			element.setAttribute('alt', match.groups.src);
			element.setAttribute('title', match.groups.src);
		} else {
			element.setAttribute('alt', match.groups.alt);
			element.setAttribute('title', match.groups.alt);
		}
		return element;
	}

	toNode() {
		switch (this.name) {
			case 'heading':
				return Token.parseHeader(this.value);
			case 'link':
				return Token.parseLink(this.value);
			case 'image':
				return Token.parseImage(this.value);
			case 'list':
				return Token.parseList(this.value);
			case 'quote':
				return Token.parseQuote(this.value);
			default:
				return document.createTextNode(this.value);
		}
	}
}

function lex(text) {
	let tokens = [];
	let start = 0;
	const pattern = /(?<heading>#+.+\n)|(?<image>!\[.*\]\(.+\))|(?<link>\[[^\]]*\]\([^\)]+\))|(?<list>\*.+\n)|(?<quote>\>.+)|(?<end_block>\n+)/g;
	for (let match of text.matchAll(pattern)) {
		if (start !== match.index) {
			tokens.push(new Token('text', text.substring(start, match.index)));
		}
		if (match.groups.heading) {
			tokens.push(new Token('heading', text.substring(match.index, match.index + match[0].length)));
		} else if (match.groups.image) {
			tokens.push(new Token('image', text.substring(match.index, match.index + match[0].length)));
		} else if (match.groups.link) {
			tokens.push(new Token('link', text.substring(match.index, match.index + match[0].length)));
		} else if (match.groups.list) {
			tokens.push(new Token('list', text.substring(match.index, match.index + match[0].length)));
		} else if (match.groups.quote) {
			tokens.push(new Token('quote', text.substring(match.index, match.index + match[0].length)));
		} else if (match.groups.end_block) {
			tokens.push(new Token('end_block', text.substring(match.index, match.index + match[0].length)));
		} else {
			console.log('ERROR: Unexpected match label');
			console.error(match);
		}
		start = match.index + match[0].length;
	}
	tokens.push(new Token('text', text.substring(start)));
	return tokens;
}

function parse(tokens) {
	let root = new DocumentFragment();
	let buffer = null;
	for (let token of tokens) {
		switch (token.name) {
			case 'heading':
				root.append(token.toNode());
				break;
			case 'image':
				root.append(token.toNode());
				break;
			case 'link':
				if (buffer === null) {
					buffer = document.createElement('p');
				}
				buffer.append(token.toNode());
				break;
			case 'end_block':
				if (buffer === null) {
					break;
				}
				root.append(buffer);
				buffer = null;
				break;
			case 'text':
				if (buffer === null) {
					buffer = document.createElement('p');
				}
				buffer.append(token.toNode());
				break;
			case 'list':
				if (buffer === null) {
					buffer = document.createElement('ul');
				}
				buffer.append(token.toNode());
				break;
			case 'quote':
				if (buffer === null) {
					buffer = document.createElement('blockquote');
				}
				buffer.append(token.toNode());
				break;
			default:
				console.log(`ERROR: Unexpected token name ${token.name}`);
				console.error(token);
				break;
		}
	}
	if (buffer !== null) {
		root.append(buffer);
	}
	return root;
}

function renderMarkdownAsHTML(markdown) {
	return parse(lex(markdown));
}
