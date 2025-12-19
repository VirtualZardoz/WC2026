'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  predictionsCount: number;
}

interface AdminUsersClientProps {
  users: User[];
}

export default function AdminUsersClient({ users }: AdminUsersClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    // Role filter
    if (filter !== 'all' && user.role !== filter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = user.name?.toLowerCase().includes(query);
      const emailMatch = user.email?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch) return false;
    }

    return true;
  });

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setUpdatingUser(userId);

    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to update user role');
        return;
      }

      router.refresh();
    } catch (err) {
      alert('An unexpected error occurred');
    } finally {
      setUpdatingUser(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Manage Users
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {users.length} total users ({adminCount} admins, {userCount} users)
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="input w-full"
            />
          </div>

          {/* Role filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Role
            </label>
            <div className="flex space-x-2">
              {(['all', 'admin', 'user'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === f
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No users found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Predictions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`badge ${
                        user.role === 'admin'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {user.predictionsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      disabled={updatingUser === user.id}
                      className={`btn-secondary text-xs ${
                        updatingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {updatingUser === user.id ? (
                        <>
                          <span className="spinner mr-1"></span>
                          Updating...
                        </>
                      ) : user.role === 'admin' ? (
                        'Make User'
                      ) : (
                        'Make Admin'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
