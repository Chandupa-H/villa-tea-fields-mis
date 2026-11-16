'use client'

import React, { useState, useEffect } from 'react'
import {
  Users, Shield, Plus, Search, Filter, Edit2, Trash2, Eye,
  Check, X, AlertTriangle, Key, ShieldCheck, CheckCircle2,
  Lock, UserCheck, ShieldAlert
} from 'lucide-react'
import {
  StaffUser, RolePermissions, PermissionAction,
  INITIAL_STAFF_USERS, INITIAL_PERMISSIONS,
  SYSTEM_MODULES, SYSTEM_ROLES
} from './mock-data'

const ROLE_BADGES: Record<string, string> = {
  Owner: 'bg-amber-100 text-amber-800 border-amber-300',
  'Villa Manager': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Assistant Manager': 'bg-blue-100 text-blue-800 border-blue-300',
  'Housekeeping Staff': 'bg-purple-100 text-purple-800 border-purple-300',
  'External Accountant': 'bg-slate-100 text-slate-700 border-slate-300'
}

const USER_STATUS_BADGES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  Suspended: 'bg-rose-50 text-rose-700 border-rose-200'
}

interface UsersRolesProps {
  notify: (msg: string) => void
}

export function UsersRoles({ notify }: UsersRolesProps) {
  // Persistence for users
  const [users, setUsers] = useState<StaffUser[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-users')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_STAFF_USERS
  })

  // Persistence for permissions matrix
  const [permissions, setPermissions] = useState<RolePermissions>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-permissions')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_PERMISSIONS
  })

  useEffect(() => {
    localStorage.setItem('vtf-settings-users', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem('vtf-settings-permissions', JSON.stringify(permissions))
  }, [permissions])

  // Sub-navigation: Users vs Permissions
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users')

  // Search & Filter Users
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)
  const [viewingUser, setViewingUser] = useState<StaffUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<StaffUser | null>(null)

  // User form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formRole, setFormRole] = useState<StaffUser['role']>('Assistant Manager')
  const [formStatus, setFormStatus] = useState<StaffUser['status']>('Active')

  // Open Add User
  const handleOpenAddUser = () => {
    setEditingUser(null)
    setFormName('')
    setFormEmail('')
    setFormPhone('+94 77 ')
    setFormRole('Assistant Manager')
    setFormStatus('Active')
    setIsUserModalOpen(true)
  }

  // Open Edit User
  const handleOpenEditUser = (user: StaffUser) => {
    setEditingUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormPhone(user.phone)
    setFormRole(user.role)
    setFormStatus(user.status)
    setIsUserModalOpen(true)
  }

  // Save User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim()) {
      notify('Please provide name and work email.')
      return
    }

    const initials = formName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        status: formStatus,
        avatar: initials || u.avatar
      } : u))
      notify(`Staff profile "${formName}" updated.`)
    } else {
      const newUser: StaffUser = {
        id: `USER-0${users.length + 1}`,
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        status: formStatus,
        lastLogin: 'Never',
        avatar: initials || 'ST'
      }
      setUsers(prev => [...prev, newUser])
      notify(`Staff account created for ${formName}.`)
    }
    setIsUserModalOpen(false)
  }

  // Toggle user status active/inactive
  const handleToggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active'
        notify(`${u.name} account is now ${nextStatus}.`)
        return { ...u, status: nextStatus }
      }
      return u
    }))
  }

  // Confirm delete user
  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return
    if (deletingUser.role === 'Owner') {
      notify('Cannot delete primary Owner account.')
      setDeletingUser(null)
      return
    }
    setUsers(prev => prev.filter(u => u.id !== deletingUser.id))
    notify(`User "${deletingUser.name}" deleted.`)
    setDeletingUser(null)
  }

  // Toggle permission cell
  const handleTogglePermission = (moduleName: string, roleName: string, action: PermissionAction) => {
    // Prevent modifying owner dashboard/settings delete if desired, but allow full customization
    setPermissions(prev => {
      const currentVal = prev[moduleName]?.[roleName]?.[action] ?? false
      return {
        ...prev,
        [moduleName]: {
          ...prev[moduleName],
          [roleName]: {
            ...prev[moduleName]?.[roleName],
            [action]: !currentVal
          }
        }
      }
    })
  }

  // Save Permissions
  const handleSavePermissions = () => {
    localStorage.setItem('vtf-settings-permissions', JSON.stringify(permissions))
    notify('Role permissions matrix saved successfully.')
  }

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesQuery = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'All' || u.role === roleFilter
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter
    return matchesQuery && matchesRole && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E9EF]">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Users & Roles</h2>
          <p className="text-xs text-[#778196] mt-0.5">
            Manage staff accounts, assign villa responsibilities, and configure granular module permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F2F4F8] rounded-lg">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-[#172B4D] shadow-xs'
                  : 'text-[#778196] hover:text-[#172B4D]'
              }`}
            >
              Employees ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-white text-[#172B4D] shadow-xs'
                  : 'text-[#778196] hover:text-[#172B4D]'
              }`}
            >
              Role Permission Matrix
            </button>
          </div>
        </div>
      </div>

      {/* ==============================================================
          TAB 1: USERS DIRECTORY
          ============================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#778196]" />
                <input
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
              >
                <option value="All">All Roles</option>
                {SYSTEM_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddUser}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#27877D] hover:bg-[#1E6E66] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Staff User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-[#E5E9EF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E9EF] text-[#778196] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Assigned Role</th>
                    <th className="py-3 px-3">Account Status</th>
                    <th className="py-3 px-3">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9EF]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#778196]">
                        No staff members found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#172B4D] text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {user.avatar}
                            </div>
                            <div>
                              <strong className="block text-[#172B4D] font-semibold text-xs">
                                {user.name}
                              </strong>
                              <span className="text-[11px] text-[#778196]">
                                ID: {user.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[#202939] block">{user.email}</span>
                          <span className="text-[11px] text-[#778196]">{user.phone}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ROLE_BADGES[user.role]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${USER_STATUS_BADGES[user.status]}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-[#778196]">
                          {user.lastLogin}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingUser(user)}
                              className="p-1.5 text-slate-500 hover:text-[#172B4D] hover:bg-[#F0F4F8] rounded transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 text-slate-500 hover:text-[#27877D] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Edit User"
                            >
                              <Edit2 size={15} />
                            </button>
                            {user.role !== 'Owner' && (
                              <button
                                onClick={() => setDeletingUser(user)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 2: ROLES & PERMISSIONS MATRIX
          ============================================================== */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E9EF]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#172B4D]/10 text-[#172B4D]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#172B4D]">
                  Role-Based Access Control (RBAC) Permission Matrix
                </h3>
                <p className="text-[11px] text-[#778196]">
                  Configure Create, Read, Update, Delete (CRUD) capabilities per villa job function.
                </p>
              </div>
            </div>

            <button
              onClick={handleSavePermissions}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#27877D] hover:bg-[#1E6E66] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Check size={14} />
              <span>Save Permissions Matrix</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E9EF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E9EF] text-[#778196] font-semibold text-[11px]">
                    <th className="py-3 px-4 w-44">System Module</th>
                    {SYSTEM_ROLES.map(role => (
                      <th key={role} className="py-3 px-3 text-center border-l border-[#E5E9EF] min-w-32">
                        <span className="block font-bold text-[#172B4D]">{role}</span>
                        <div className="grid grid-cols-4 gap-1 text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
                          <span>V</span>
                          <span>C</span>
                          <span>E</span>
                          <span>D</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9EF]">
                  {SYSTEM_MODULES.map(mod => (
                    <tr key={mod} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#172B4D]">
                        {mod}
                      </td>
                      {SYSTEM_ROLES.map(role => {
                        const perm = permissions[mod]?.[role] || { view: false, create: false, edit: false, delete: false }
                        return (
                          <td key={role} className="py-3 px-3 text-center border-l border-[#E5E9EF]">
                            <div className="grid grid-cols-4 gap-1">
                              {/* View */}
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(mod, role, 'view')}
                                className={`h-6 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer transition-colors ${
                                  perm.view ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="View"
                              >
                                V
                              </button>
                              {/* Create */}
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(mod, role, 'create')}
                                className={`h-6 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer transition-colors ${
                                  perm.create ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="Create"
                              >
                                C
                              </button>
                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(mod, role, 'edit')}
                                className={`h-6 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer transition-colors ${
                                  perm.edit ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="Edit"
                              >
                                E
                              </button>
                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(mod, role, 'delete')}
                                className={`h-6 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer transition-colors ${
                                  perm.delete ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="Delete"
                              >
                                D
                              </button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] text-[#778196] text-right">
            Legend: <b>V</b> = View / Read • <b>C</b> = Create / Add • <b>E</b> = Edit / Modify • <b>D</b> = Delete / Cancel
          </p>
        </div>
      )}

      {/* ==============================================================
          MODAL: ADD / EDIT USER
          ============================================================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <h3 className="text-base font-bold text-[#172B4D]">
                {editingUser ? `Edit ${editingUser.name}` : 'Add New Staff Employee'}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Kasun Jayawardena"
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="e.g. kasun.j@villateafields.lk"
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Mobile / WhatsApp</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Assigned Role</label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  >
                    {SYSTEM_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#27877D] hover:bg-[#1E6E66] text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Save Profile' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: VIEW USER DETAILS
          ============================================================== */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#172B4D] text-white font-bold text-sm flex items-center justify-center">
                  {viewingUser.avatar}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B4D]">
                    {viewingUser.name}
                  </h3>
                  <span className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-semibold border ${ROLE_BADGES[viewingUser.role]}`}>
                    {viewingUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E9EF] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#778196]">User ID:</span>
                  <strong className="text-[#172B4D] font-mono">{viewingUser.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#778196]">Work Email:</span>
                  <span className="text-[#172B4D] font-semibold">{viewingUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#778196]">Phone / WhatsApp:</span>
                  <span className="text-[#172B4D]">{viewingUser.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#778196]">Account Status:</span>
                  <span className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-semibold border ${USER_STATUS_BADGES[viewingUser.status]}`}>
                    {viewingUser.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#778196]">Last Terminal Access:</span>
                  <span className="text-slate-600">{viewingUser.lastLogin}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5E9EF] flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-1.5 bg-[#172B4D] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: DELETE USER CONFIRMATION
          ============================================================== */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-[#172B4D]">Remove Staff Member</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Are you sure you want to deactivate and remove <strong>{deletingUser.name}</strong> ({deletingUser.role}) from Villa Tea Fields HMS?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
