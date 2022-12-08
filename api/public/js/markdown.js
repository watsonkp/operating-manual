class Token {
	constructor(name, value, children, tag, attributes) {
		this.name = name;
		this.value = value;
		this.children = children;
		this.tag = tag;
		this.attributes = attributes;
	}

	static parseHeader(value) {
		let header = document.createElement(value.tag);
		header.appendChild(value.children[0].toNode());
		return header;
	}

	static parseParagraph(value) {
		let element = document.createElement('p');
		for (const child of value.children) {
			element.appendChild(child.toNode());
		}
		return element;
	}

	static parseList(value) {
		let element = document.createElement('li');
		for (const child of value.children) {
			element.appendChild(child.toNode());
		}
		return element;
	}

	static parseCodeBlock(value) {
		return value.children[0].toNode();
	}

	static parseBlockQuote(value) {
		let element = document.createElement('blockquote');
		for (const child of value.children) {
			element.appendChild(child.toNode());
		}
		return element;
	}

	static parseLink(value) {
		let link = document.createElement('a');
		link.setAttribute('href', value.attributes['href']);
		link.appendChild(value.children[0].toNode());
		return link;
	}

	static parseCode(value) {
		let element = document.createElement('code');
		element.appendChild(value.children[0].toNode());
		return element;
	}

	static parseImage(value) {
		let element = document.createElement('img');
		element.setAttribute('src', value.attributes['src']);
		element.setAttribute('alt', value.attributes['alt']);
		element.setAttribute('title', value.attributes['title']);
		return element;
	}

	toNode() {
		switch (this.name) {
			case 'paragraph':
				return Token.parseParagraph(this);
			case 'heading':
				return Token.parseHeader(this);
			case 'link':
				return Token.parseLink(this);
			case 'image':
				return Token.parseImage(this);
			case 'code':
				return Token.parseCode(this);
			case 'list':
				return Token.parseList(this);
			case 'codeblock':
				return Token.parseCodeBlock(this);
			case 'blockquote':
				return Token.parseBlockQuote(this);
			default:
				return document.createTextNode(this.value);
		}
	}
}

function lex_inline(text) {
	const anchor_pattern = /\[(?<text>[^\]]*)\]\((?<href>[^\)]+)\)/;
	const code_pattern = /`(?<text>.+)`/;
	let tokens = [];
	let i = 0;
	while (i < text.length) {
		let anchor_match = text.substring(i).match(anchor_pattern);
		let code_match = text.substring(i).match(code_pattern);
		// TODO: There must be a better way of doing this. One option is a more complicated regex, but I don't love that idea.
		//let matches = [anchor_match, code_match].filter(m => m !== null);
		//let match = matches.sort((a, b) => a.index - b.index).shift();

		if (anchor_match != null && (code_match == null || anchor_match.index < code_match)) {
			let match = anchor_match;
			// Add prefix text to match as text node
			let s = text.substring(i, i + match.index);
			i += match.index;
			if (s != "") {
				tokens.push(new Token('text', s, null, null, null));
			}

			// Parse and add anchor token
			let children = [new Token('text', match.groups.text !== '' ? match.groups.text : match.groups.href, null, null, null)];
			let attributes = {'href': match.groups.href};
			tokens.push(new Token('link', match[0], children, 'a', attributes));
			i += match[0].length;
			continue;
		}

		if (code_match != null && (anchor_match == null || code_match.index < anchor_match)) {
			let match = code_match;
			// Add prefix text to match as text node
			let s = text.substring(i, i + match.index);
			i += match.index;
			if (s != "") {
				tokens.push(new Token('text', s, null, null, null));
			}

			let children = [new Token('text', match.groups.text, null, null)];
			tokens.push(new Token('code', match[0], children, 'code', null));
			i += match[0].length;
			continue;
		}

		tokens.push(new Token('text', text.substring(i), null, null, null));
		i += text.substring(i).length;
	}
	return tokens;
}

function lex(text) {
	let tokens = [];
	const heading_pattern = /^(?<level>#+) (?<text>.+)/;
	const list_pattern = /^(?<style>\*) (?<text>.+)/;
	const image_pattern = /^!\[(?<alt>.*)\]\((?<src>.+)\)/;
	const blockquote_pattern = /^\> (?<text>.+)/;
	const code_block_pattern = /^( {4}|\t)(?<text>.+)/;

	for (const line of text.split("\n")) {
		// Headings
		match = line.match(heading_pattern);
		if (match != null) {
			let children = [new Token('text', match.groups.text, null, null, null)];
			tokens.push(new Token('heading', line, children, `H${match.groups.level.length}`, null));
			continue;
		}

		// Images
		match = line.match(image_pattern);
		if (match != null) {
			let title = match.groups.alt !== '' ? match.groups.alt : match.groups.src;
			let attributes = {'src': match.groups.src, 'alt': title, 'title': title};
			tokens.push(new Token('image', match[0], null, 'IMG', attributes));
			continue;
		}

		// Block quote
		match = line.match(blockquote_pattern);
		if (match != null) {
			let children = [new Token('paragraph', match.groups.text, lex_inline(match.groups.text), 'P', null)];
			tokens.push(new Token('blockquote', null, children, 'BLOCKQUOTE', null));
			continue;
		}

		// List
		match = line.match(list_pattern);
		if (match != null) {
			let children = lex_inline(match.groups.text);
			tokens.push(new Token('list', line, children, 'UL', null));
			continue;
		}

		// Code block
		match = line.match(code_block_pattern);
		if (match != null) {
			let children = [new Token('text', match.groups.text + '\n', null, null, null)];
			tokens.push(new Token('codeblock', match.groups.text, children, 'PRE', null));
			continue;
		}

		// Paragraph
		if (line !== '') {
			tokens.push(new Token('paragraph', line, lex_inline(line), 'P', null));
			continue;
		}
	}
	return tokens;
}

function parse(tokens) {
	let root = new DocumentFragment();
	let buffer = null;
	for (let token of tokens) {
		if (buffer !== null && buffer.tagName !== token.tag) {
			root.append(buffer);
			buffer = null;
		}
		switch (token.name) {
			case 'heading':
			case 'image':
			case 'blockquote':
			case 'paragraph':
				root.append(token.toNode());
				break;
			case 'list':
			case 'codeblock':
				if (buffer === null) {
					buffer = document.createElement(token.tag);
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
