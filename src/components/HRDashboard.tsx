'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Calendar, Filter, Building } from 'lucide-react';

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.accessor('user.username', { header: 'Employee' }),
  columnHelper.accessor('user.department', { header: 'Department' }),
  columnHelper.accessor('leaveType', { header: 'Type' }),
  columnHelper.accessor('startDate', { 
    header: 'Start', 
    cell: info => new Date(info.getValue()).toLocaleDateString() 
  }),
  columnHelper.accessor('endDate', { 
    header: 'End',
    cell: info => new Date(info.getValue()).toLocaleDateString() 
  }),
  columnHelper.accessor('status', { header: 'Status' }),
];

export default function HRDashboard({ initialLeaves }: { initialLeaves: any[] }) {
  const [leaves, setLeaves] = useState(initialLeaves);
  const [dateFilter, setDateFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const fetchFiltered = async () => {
    let url = '/api/dashboard/hr?';
    if (dateFilter) url += `date=${dateFilter}&`;
    if (deptFilter) url += `department=${deptFilter}&`;
    
    const res = await fetch(url);
    const data = await res.json();
    setLeaves(data.leaves || []);
  };

  const table = useReactTable({
    data: leaves,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    leaves.forEach(l => {
      const dept = l.user?.department || 'Unknown';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ department: key, count: counts[key] }));
  }, [leaves]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-t-4 border-indigo-500 mt-4"
    >
      <h2 className="text-4xl font-extrabold mb-8 text-gray-800 dark:text-white tracking-tight">HR Global Leave Hub</h2>
      
      <div className="flex flex-wrap gap-6 mb-10 bg-indigo-50/50 dark:bg-gray-800 p-6 rounded-2xl border border-indigo-100 dark:border-gray-700 items-end">
        <div>
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Filter by Date</label>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Filter by Department</label>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            <input 
              type="text" 
              placeholder="E.g. Engineering"
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
              className="border border-gray-300 rounded-lg p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>
        <button 
          onClick={fetchFiltered}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95"
        >
          <Filter className="w-4 h-4" /> Apply Filters
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="h-80 border border-gray-200 rounded-2xl p-6 shadow-sm dark:border-gray-700 mb-10 w-full max-w-4xl bg-white dark:bg-gray-800"
      >
        <h3 className="font-bold mb-6 text-center text-gray-700 dark:text-gray-200 text-lg">Total Department Absences</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
            <XAxis dataKey="department" axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
            <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} animationDuration={1500} barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="overflow-x-auto border border-gray-200 rounded-2xl dark:border-gray-700 shadow-md bg-white dark:bg-gray-800">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-5 font-bold text-gray-600 dark:text-gray-300 tracking-wider text-sm uppercase">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <motion.tr 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={row.id} 
                className="hover:bg-indigo-50/50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-5 text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-gray-400 italic">
                  No leaves match the current criteria across the organization.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
