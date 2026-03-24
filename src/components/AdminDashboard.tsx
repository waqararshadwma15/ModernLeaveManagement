'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { Edit2, Trash2, Plus, X } from 'lucide-react';

const columnHelper = createColumnHelper<any>();

export default function AdminDashboard({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({ username: '', email: '', department: '', role: 'employee', password: '' });

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
      else alert((await res.json()).error);
    } catch (e) {
      alert('Error deleting user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/admin/users/${editingUser._id}` : '/api/admin/users';
    const method = editingUser ? 'PUT' : 'POST';

    // If editing, we include all fields but only password if it's not empty
    const payload: any = { 
      role: formData.role, 
      department: formData.department, 
      email: formData.email,
      username: formData.username
    };
    if (formData.password) payload.password = formData.password;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', department: '', role: 'employee', password: '' });
      fetchUsers();
    } else {
      alert((await res.json()).error);
    }
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setFormData({ username: user.username, email: user.email, department: user.department, role: user.role, password: '' });
    setIsModalOpen(true);
  };

  const columns = [
    columnHelper.accessor('username', { header: 'Username' }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('department', { header: 'Department' }),
    columnHelper.accessor('role', { 
      header: 'Role',
      cell: info => <span className="capitalize px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 rounded-full text-xs font-bold tracking-wide">{info.getValue().replace('_', ' ')}</span>
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-4">
          <button onClick={() => openEdit(info.row.original)} className="text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-5 h-5"/></button>
          <button onClick={() => handleDelete(info.row.original._id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5"/></button>
        </div>
      )
    })
  ];

  const table = useReactTable({ data: users, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl mt-4 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-t-[2rem] pointer-events-none" />

      <div className="flex justify-between items-center mb-10 relative z-10 p-2">
        <div>
          <h2 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight">Admin Console</h2>
          <p className="text-gray-500 mt-2 font-medium">Manage organization users, departments, and roles.</p>
        </div>
        <button onClick={() => { setEditingUser(null); setFormData({ username: '', email: '', department: '', role: 'employee', password: '' }); setIsModalOpen(true); }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-emerald-200 dark:shadow-none transition-all hover:scale-105 active:scale-95">
          <Plus className="w-5 h-5"/> New User
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative z-10 bg-white dark:bg-gray-800">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                {hg.headers.map(h => (
                  <th key={h.id} className="p-5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-xs">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <AnimatePresence>
            {table.getRowModel().rows.map((row, i) => (
              <motion.tr 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                key={row.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-emerald-50/30 dark:hover:bg-gray-700/30 transition-colors"
               >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
            </AnimatePresence>
            {users.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-gray-400 italic">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-2xl w-full max-w-lg relative border border-gray-100 dark:border-gray-700">
              <button type="button" aria-label="Close form" onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-800 rounded-full p-2"><X className="w-5 h-5"/></button>
              
              <h3 className="text-3xl font-extrabold mb-2 text-gray-800 dark:text-white">
                {editingUser ? 'Modify User' : 'Create User'}
              </h3>
              <p className="text-sm text-gray-500 mb-8">{editingUser ? 'Update the role or department of an existing team member.' : 'Provision a new account for an employee.'}</p>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Username</label>
                    <input disabled={!!editingUser} autoFocus={!editingUser} required type="text" placeholder="jdoe" className={`w-full border border-gray-200 p-3 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      {editingUser ? 'New Password (Optional)' : 'Password'}
                    </label>
                    <input required={!editingUser} type="password" placeholder="••••••••" className="w-full border border-gray-200 p-3 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                  <input required type="email" placeholder="john.doe@company.com" className="w-full border border-gray-200 p-3 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Department</label>
                    <input required type="text" placeholder="Engineering" className="w-full border border-gray-200 p-3 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Role Access</label>
                    <select required className="w-full border border-gray-200 p-3 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option value="employee">Employee</option>
                      <option value="department_head">Department Head</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold p-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition shadow-lg shadow-emerald-200 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0">
                  {editingUser ? 'Save Changes' : 'Provision User Account'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
