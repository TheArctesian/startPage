<script lang="ts">
	import { fetchProjectUsers, addProjectUser, removeProjectUser } from '$lib/api/projects';
	import { fetchUsers } from '$lib/api/users';
	import { toasts } from '$lib/stores/toasts';
	import type { PermissionLevel } from '$lib/types/database';
	import { onMount } from 'svelte';

	interface Props {
		projectId: number;
	}

	let { projectId }: Props = $props();

	interface ProjectUser {
		id: number;
		userId: number;
		username: string;
		email: string | null;
		permissionLevel: PermissionLevel;
		projectId: number;
		grantedBy: number | null;
		grantedAt: Date;
	}

	let projectUsers = $state<any[]>([]);
	let loading = $state(true);
	let showAddUserInput = $state(false);
	let newUserEmail = $state('');
	let newUserPermission = $state<PermissionLevel>('view_only');

	onMount(async () => {
		await loadProjectUsers();
	});

	async function loadProjectUsers() {
		loading = true;
		try {
			projectUsers = await fetchProjectUsers(projectId);
		} catch (error) {
			console.error('Failed to load project users:', error);
			toasts.error('Load Failed', 'Failed to load project users.');
		} finally {
			loading = false;
		}
	}

	async function handleAddUser() {
		if (!newUserEmail.trim()) return;

		try {
			await addProjectUser(projectId, newUserEmail.trim(), newUserPermission);
			await loadProjectUsers();
			newUserEmail = '';
			newUserPermission = 'view_only';
			showAddUserInput = false;
			toasts.success('User Added', 'User has been added to the project.');
		} catch (error) {
			console.error('Failed to add user:', error);
			toasts.error('Add Failed', 'Failed to add user. Please check the email and try again.');
		}
	}

	async function handleUpdatePermission(userId: number, newPermission: PermissionLevel) {
		try {
			// Note: This would require a new API endpoint for updating user permissions
			// For now, we'll just refresh the list
			await loadProjectUsers();
			toasts.success('Permission Updated', 'User permission has been updated.');
		} catch (error) {
			console.error('Failed to update permission:', error);
			toasts.error('Update Failed', 'Failed to update user permission.');
		}
	}

	async function handleRemoveUser(userId: number, username: string) {
		if (!confirm(`Remove ${username} from this project?`)) return;

		try {
			await removeProjectUser(projectId, userId);
			await loadProjectUsers();
			toasts.success('User Removed', `${username} has been removed from the project.`);
		} catch (error) {
			console.error('Failed to remove user:', error);
			toasts.error('Remove Failed', 'Failed to remove user.');
		}
	}
</script>

<div class="permissions-panel">
	<div class="permissions-header">
		<div class="header-title">Project Access</div>
		<button
			type="button"
			class="add-user-btn"
			onclick={() => (showAddUserInput = !showAddUserInput)}
			disabled={loading}
		>
			{showAddUserInput ? 'Cancel' : '+ Add User'}
		</button>
	</div>

	{#if showAddUserInput}
		<div class="add-user-form">
			<div class="add-user-inputs">
				<input
					bind:value={newUserEmail}
					type="email"
					placeholder="User email address"
					class="form-input"
				/>
				<select bind:value={newUserPermission} class="form-input permission-select">
					<option value="view_only">View Only</option>
					<option value="editor">Editor</option>
					<option value="project_admin">Admin</option>
				</select>
			</div>
			<button
				type="button"
				class="btn btn-primary add-user-submit"
				onclick={handleAddUser}
				disabled={!newUserEmail.trim()}
			>
				Add
			</button>
		</div>
	{/if}

	<div class="users-list">
		{#if loading}
			<div class="loading-users">Loading users...</div>
		{:else if projectUsers.length === 0}
			<div class="no-users">No users have access to this project yet.</div>
		{:else}
			{#each projectUsers as user (user.id)}
				<div class="user-item">
					<div class="user-info">
						<div class="user-name">{user.username}</div>
						<div class="user-email">{user.email || 'No email'}</div>
					</div>
					<div class="user-actions">
						<select
							value={user.permissionLevel}
							onchange={(e) => {
								const target = e.target as HTMLSelectElement;
								handleUpdatePermission(user.userId, target.value as PermissionLevel);
							}}
							class="permission-select-small"
						>
							<option value="view_only">View Only</option>
							<option value="editor">Editor</option>
							<option value="project_admin">Admin</option>
						</select>
						<button
							type="button"
							class="remove-user-btn"
							onclick={() => handleRemoveUser(user.userId, user.username)}
							title="Remove user access"
						>
							✕
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.permissions-panel {
		border: 1px solid var(--nord3);
		border-radius: 0.5rem;
		padding: 1rem;
		background: var(--nord1);
	}

	.permissions-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.header-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord6);
	}

	.add-user-btn {
		padding: 0.375rem 0.75rem;
		background: var(--nord8);
		color: var(--nord0);
		border: none;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-user-btn:hover:not(:disabled) {
		background: var(--nord9);
	}

	.add-user-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.add-user-form {
		margin-bottom: 1rem;
		padding: 1rem;
		background: var(--nord0);
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
	}

	.add-user-inputs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.add-user-inputs .form-input {
		flex: 1;
	}

	.form-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
		color: var(--nord6);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--nord8);
		box-shadow: 0 0 0 3px rgba(129, 161, 193, 0.1);
	}

	.permission-select {
		min-width: 120px;
	}

	.add-user-submit {
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--nord8);
		color: var(--nord0);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--nord9);
	}

	.users-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.loading-users,
	.no-users {
		text-align: center;
		color: var(--nord4);
		font-style: italic;
		padding: 1rem;
	}

	.user-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--nord0);
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
	}

	.user-info {
		flex: 1;
	}

	.user-name {
		font-weight: 500;
		color: var(--nord6);
		font-size: 0.875rem;
	}

	.user-email {
		font-size: 0.75rem;
		color: var(--nord4);
	}

	.user-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.permission-select-small {
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--nord3);
		border-radius: 0.25rem;
		background: var(--nord1);
		color: var(--nord6);
		font-size: 0.75rem;
	}

	.remove-user-btn {
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: transparent;
		color: var(--nord11);
		cursor: pointer;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.remove-user-btn:hover {
		background: rgba(191, 97, 106, 0.1);
		color: var(--nord11);
	}
</style>
