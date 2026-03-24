'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { Calendar, Plus, Clock, CheckCircle, XCircle, Plane } from 'lucide-react';
import ApplyLeaveModal from './ApplyLeaveModal';

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.accessor('leaveType', {
    header: 'Type',
    cell: info => <span className="capitalize font-semibold text-indigo-600 dark:text-indigo-400">{info.getValue()}</span>
  }),
  columnHelper.accessor('startDate', {
    header: 'Start Date',
    cell: info => new Date(info.getValue()).toLocaleDateString()
  }),
  columnHelper.accessor('endDate', {
    header: 'End Date',
    cell: info => new Date(info.getValue()).toLocaleDateString()
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue();
      const colors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        approved_by_hod: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        approved_by_hr: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        rejected_by_hod: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        rejected_by_hr: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      };
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors[status] || 'bg-gray-100'}`}>
          {status.replace(/_/g, ' ')}
        </span>
      );
    }
  }),
  columnHelper.accessor('reason', {
    header: 'Reason',
    cell: info => <span className="max-w-xs truncate block italic text-gray-500">{info.getValue()}</span>
  }),
];

interface EmployeeDashboardProps {
  user: any;
  initialLeaves: any[];
}

export default function EmployeeDashboard({ user, initialLeaves }: EmployeeDashboardProps) {
  const [leaves, setLeaves] = useState(initialLeaves);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshLeaves = async () => {
    const res = await fetch('/api/leave');
    const data = await res.json();
    setLeaves(data.leaves || []);
  };

  const table = useReactTable({
    data: leaves,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome back, {user.username}!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your leave applications and stay updated.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Apply for Leave
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Casual Leaves', count: user.leaveBalance?.casual || 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: Plane },
          { label: 'Sick Leaves', count: user.leaveBalance?.sick || 0, color: 'text-red-600', bg: 'bg-red-50', icon: CheckCircle },
          { label: 'Short Leaves', count: user.leaveBalance?.short || 0, color: 'text-teal-600', bg: 'bg-teal-50', icon: Clock },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-5 group hover:border-indigo-200 transition-all"
          >
            <div className={`p-4 rounded-xl ${card.bg} dark:bg-gray-800 group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{card.count} Days</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Your Leave History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="p-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-5 text-sm text-gray-700 dark:text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-300">
                      <Plane className="w-16 h-16 opacity-10" />
                      <p className="text-gray-400 italic font-medium">No leave applications found yet.</p>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-indigo-600 hover:text-indigo-700 font-bold text-sm mt-2"
                      >
                        Submit your first application
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ApplyLeaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshLeaves}
      />
    </motion.div>
  );
}
