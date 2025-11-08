import test from 'node:test';
import assert from 'node:assert/strict';
import type { ProjectNode } from '../src/lib/types/database';
import { flattenTree } from '../src/lib/utils/projectTree';

function baseNode(
	id: number,
	name: string,
	options: Partial<ProjectNode> = {}
): ProjectNode {
	return {
		id,
		name,
		color: '--nord8',
		isActive: true,
		isPublic: true,
		depth: 0,
		path: name,
		pathArray: [name],
		breadcrumb: name,
		children: [],
		hasChildren: false,
		isExpanded: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...options
	};
}

test('flattenTree keeps public descendants of private parents', () => {
	const privateParent = baseNode(1, 'Private Parent', {
		isPublic: false,
		hasChildren: true
	});

	const publicChild = baseNode(2, 'Public Child', {
		depth: 1,
		path: 'Private Parent/Public Child',
		pathArray: ['Private Parent', 'Public Child'],
		breadcrumb: 'Private Parent > Public Child'
	});

	privateParent.children = [publicChild];
	publicChild.parent = privateParent;

	const result = flattenTree([privateParent], true, (node) => node.isPublic ?? true);

	assert.strictEqual(result.length, 1);
	assert.strictEqual(result[0].id, publicChild.id);
});

test('flattenTree respects collapsed state for visible parents', () => {
	const parent = baseNode(10, 'Visible Parent', {
		isPublic: true,
		isExpanded: false,
		hasChildren: true
	});

	const child = baseNode(11, 'Child Node', {
		depth: 1,
		path: 'Visible Parent/Child Node',
		pathArray: ['Visible Parent', 'Child Node'],
		breadcrumb: 'Visible Parent > Child Node'
	});

	parent.children = [child];
	child.parent = parent;

	const result = flattenTree([parent], true, (node) => node.isPublic ?? true);

	assert.strictEqual(result.length, 1);
	assert.strictEqual(result[0].id, parent.id);
});
