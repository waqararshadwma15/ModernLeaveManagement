'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Calendar, Filter } from 'lucide-react';

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.accessor('user.username', { header: 'Employee' }),
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

export default function DepartmentDashboard({ initialLeaves }: { initialLeaves: any[] }) {
  const [leaves, setLeaves] = useState(initialLeaves);
  const [dateFilter, setDateFilter] = useState('');

  const fetchFiltered = async () => {
    let url = '/api/dashboard/head';
    if (dateFilter) url += `?date=${dateFilter}`;
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
      const type = l.leaveType;
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ type: key, count: counts[key] }));
  }, [leaves]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl mt-4 border border-gray-100 dark:border-gray-800"
    >
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100 tracking-tight">Department Activity</h2>
      
      <div className="flex gap-4 mb-8 bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        <button 
          onClick={fetchFiltered}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-medium"
        >
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="h-72 border border-gray-200 rounded-2xl p-5 shadow-sm dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <h3 className="font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Total Leaves by Type</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-2xl dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gray-50 dark:bg-gray-800/50">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-4 border-b dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-300">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <motion.tr 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={row.id} 
                className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-4 border-b dark:border-gray-700/50 text-gray-600 dark:text-gray-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-gray-500">
                  No leaves found for these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
