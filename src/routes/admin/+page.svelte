<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  export let data: PageData;

  let selectedTab = 'users';
  let isLoading = false;
  let showUserModal = false;
  let selectedUser: any = null;

  // Calculate user stats
  $: userStatsMap = data.stats.users.reduce((acc, stat) => {
    acc[stat.status] = stat.total;
    return acc;
  }, {} as Record<string, number>);

  $: totalUsers = data.stats.users.reduce((sum, stat) => sum + stat.total, 0);
  $: approvedUsers = userStatsMap.approved || 0;
  $: pendingUsers = userStatsMap.pending || 0;
  $: rejectedUsers = userStatsMap.rejected || 0;

  // Calculate project stats
  $: projectStatsMap = data.stats.projects.reduce((acc, stat) => {
    acc[stat.isPublic ? 'public' : 'private'] = stat.total;
    return acc;
  }, {} as Record<string, number>);

  $: totalProjects = data.stats.projects.reduce((sum, stat) => sum + stat.total, 0);
  $: publicProjects = projectStatsMap.public || 0;
  $: privateProjects = projectStatsMap.private || 0;

  // User actions
  async function updateUserStatus(userId: number, newStatus: 'approved' | 'rejected') {
    isLoading = true;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Reload page to get fresh data
        window.location.reload();
      } else {
        console.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      isLoading = false;
    }
  }

  async function updateUserRole(userId: number, newRole: 'admin' | 'member') {
    isLoading = true;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        // Reload page to get fresh data
        window.location.reload();
      } else {
        console.error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      isLoading = false;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved': return 'var(--nord14)';
      case 'pending': return 'var(--nord13)';
      case 'rejected': return 'var(--nord11)';
      default: return 'var(--nord4)';
    }
  }

  function getRoleColor(role: string) {
    return role === 'admin' ? 'var(--nord12)' : 'var(--nord8)';
  }
</script>

<div class="admin-panel">
  <div class="admin-header">
    <h1>Admin Panel</h1>
    <p>Manage users, projects, and system settings</p>
  </div>

  <!-- Statistics Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-number">{totalUsers}</div>
      <div class="stat-label">Total Users</div>
      <div class="stat-breakdown">
        <span class="stat-item approved">{approvedUsers} approved</span>
        <span class="stat-item pending">{pendingUsers} pending</span>
        <span class="stat-item rejected">{rejectedUsers} rejected</span>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-number">{totalProjects}</div>
      <div class="stat-label">Total Projects</div>
      <div class="stat-breakdown">
        <span class="stat-item public">{publicProjects} public</span>
        <span class="stat-item private">{privateProjects} private</span>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-number">{data.stats.permissions}</div>
      <div class="stat-label">Active Permissions</div>
      <div class="stat-breakdown">
        <span class="stat-item">User-project assignments</span>
      </div>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="tab-nav">
    <button 
      class="tab-button" 
      class:active={selectedTab === 'users'}
      onclick={() => selectedTab = 'users'}
    >
      Users ({totalUsers})
    </button>
    <button 
      class="tab-button" 
      class:active={selectedTab === 'projects'}
      onclick={() => selectedTab = 'projects'}
    >
      Projects ({totalProjects})
    </button>
    <button 
      class="tab-button" 
      class:active={selectedTab === 'settings'}
      onclick={() => selectedTab = 'settings'}
    >
      Settings
    </button>
  </div>

  <!-- Tab Content -->
  <div class="tab-content">
    {#if selectedTab === 'users'}
      <div class="users-section">
        <div class="section-header">
          <h2>User Management</h2>
          <p>Manage user accounts, roles, and access permissions</p>
        </div>

        <div class="users-table">
          <div class="table-header">
            <div class="header-cell">User</div>
            <div class="header-cell">Status</div>
            <div class="header-cell">Role</div>
            <div class="header-cell">Created</div>
            <div class="header-cell">Last Login</div>
            <div class="header-cell">Actions</div>
          </div>

          {#each data.users as user (user.id)}
            <div class="table-row">
              <div class="cell user-cell">
                <div class="user-info">
                  <div class="user-name">{user.username}</div>
                  <div class="user-email">{user.email}</div>
                </div>
              </div>
              
              <div class="cell">
                <span class="status-badge" style="color: {getStatusColor(user.status)}">
                  {user.status}
                </span>
              </div>
              
              <div class="cell">
                <span class="role-badge" style="color: {getRoleColor(user.role)}">
                  {user.role}
                </span>
              </div>
              
              <div class="cell">
                {formatDate(user.createdAt)}
              </div>
              
              <div class="cell">
                {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
              </div>
              
              <div class="cell actions-cell">
                {#if user.status === 'pending'}
                  <button 
                    class="action-btn approve"
                    onclick={() => updateUserStatus(user.id, 'approved')}
                    disabled={isLoading}
                  >
                    Approve
                  </button>
                  <button 
                    class="action-btn reject"
                    onclick={() => updateUserStatus(user.id, 'rejected')}
                    disabled={isLoading}
                  >
                    Reject
                  </button>
                {:else if user.status === 'approved'}
                  {#if user.role === 'member'}
                    <button 
                      class="action-btn promote"
                      onclick={() => updateUserRole(user.id, 'admin')}
                      disabled={isLoading}
                    >
                      Make Admin
                    </button>
                  {:else if user.role === 'admin'}
                    <button 
                      class="action-btn demote"
                      onclick={() => updateUserRole(user.id, 'member')}
                      disabled={isLoading}
                    >
                      Remove Admin
                    </button>
                  {/if}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

    {:else if selectedTab === 'projects'}
      <div class="projects-section">
        <div class="section-header">
          <h2>Project Overview</h2>
          <p>Monitor project activity and permissions</p>
        </div>
        
        <div class="info-card">
          <h3>Project Statistics</h3>
          <div class="project-stats">
            <div class="project-stat">
              <span class="stat-label">Public Projects:</span>
              <span class="stat-value">{publicProjects}</span>
            </div>
            <div class="project-stat">
              <span class="stat-label">Private Projects:</span>
              <span class="stat-value">{privateProjects}</span>
            </div>
            <div class="project-stat">
              <span class="stat-label">Active Permissions:</span>
              <span class="stat-value">{data.stats.permissions}</span>
            </div>
          </div>
        </div>
      </div>

    {:else if selectedTab === 'settings'}
      <div class="settings-section">
        <div class="section-header">
          <h2>System Settings</h2>
          <p>Configure system-wide settings and preferences</p>
        </div>
        
        <div class="info-card">
          <h3>System Information</h3>
          <div class="system-info">
            <div class="info-item">
              <span class="info-label">Total Users:</span>
              <span class="info-value">{totalUsers}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Projects:</span>
              <span class="info-value">{totalProjects}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Active Permissions:</span>
              <span class="info-value">{data.stats.permissions}</span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .admin-panel {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .admin-header {
    margin-bottom: 2rem;
  }

  .admin-header h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0 0 0.5rem 0;
  }

  .admin-header p {
    font-size: 1.1rem;
    color: var(--nord4);
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--nord1);
    border: 1px solid var(--nord2);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .stat-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--nord8);
    margin-bottom: 0.5rem;
  }

  .stat-label {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--nord5);
    margin-bottom: 1rem;
  }

  .stat-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-item {
    font-size: 0.875rem;
    color: var(--nord4);
  }

  .stat-item.approved { color: var(--nord14); }
  .stat-item.pending { color: var(--nord13); }
  .stat-item.rejected { color: var(--nord11); }
  .stat-item.public { color: var(--nord8); }
  .stat-item.private { color: var(--nord10); }

  .tab-nav {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--nord2);
  }

  .tab-button {
    background: none;
    border: none;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    color: var(--nord4);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .tab-button:hover {
    color: var(--nord6);
    background: var(--nord1);
  }

  .tab-button.active {
    color: var(--nord8);
    border-bottom-color: var(--nord8);
  }

  .tab-content {
    min-height: 400px;
  }

  .section-header {
    margin-bottom: 1.5rem;
  }

  .section-header h2 {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0 0 0.5rem 0;
  }

  .section-header p {
    color: var(--nord4);
    margin: 0;
  }

  .users-table {
    background: var(--nord1);
    border: 1px solid var(--nord2);
    border-radius: 8px;
    overflow: hidden;
  }

  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.5fr 1.5fr 1.5fr;
    gap: 1rem;
    padding: 1rem;
    align-items: center;
  }

  .table-header {
    background: var(--nord2);
    font-weight: 600;
    color: var(--nord5);
    border-bottom: 1px solid var(--nord3);
  }

  .table-row {
    border-bottom: 1px solid var(--nord2);
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row:hover {
    background: var(--nord0);
  }

  .user-cell {
    display: flex;
    align-items: center;
  }

  .user-info {
    display: flex;
    flex-direction: column;
  }

  .user-name {
    font-weight: 500;
    color: var(--nord6);
  }

  .user-email {
    font-size: 0.875rem;
    color: var(--nord4);
  }

  .status-badge,
  .role-badge {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    background: var(--nord1);
  }

  .actions-cell {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.approve {
    background: var(--nord14);
    color: var(--nord0);
  }

  .action-btn.reject {
    background: var(--nord11);
    color: var(--nord6);
  }

  .action-btn.promote {
    background: var(--nord12);
    color: var(--nord0);
  }

  .action-btn.demote {
    background: var(--nord13);
    color: var(--nord0);
  }

  .info-card {
    background: var(--nord1);
    border: 1px solid var(--nord2);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .info-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0 0 1rem 0;
  }

  .project-stats,
  .system-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .project-stat,
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--nord2);
  }

  .project-stat:last-child,
  .info-item:last-child {
    border-bottom: none;
  }

  .stat-label,
  .info-label {
    color: var(--nord4);
    font-weight: 500;
  }

  .stat-value,
  .info-value {
    color: var(--nord6);
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .admin-panel {
      padding: 1rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .table-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .actions-cell {
      flex-direction: column;
    }

    .tab-nav {
      flex-direction: column;
    }
  }
</style>