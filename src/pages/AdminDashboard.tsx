import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LogOut, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  title: string;
  description: string;
  user_email: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  admin_comments?: string;
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { user, signOut } = useAuthStore();

  // Local state to store admin comments before saving
  const [adminCommentsInput, setAdminCommentsInput] = useState<{ [key: string]: string }>({});

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);

      // Initialize adminCommentsInput with existing comments
      const initialComments: { [key: string]: string } = {};
      data?.forEach((ticket) => {
        initialComments[ticket.id] = ticket.admin_comments || '';
      });
      setAdminCommentsInput(initialComments);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket status updated successfully');
      fetchTickets();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateAdminComments = async (ticketId: string) => {
    try {
      const comments = adminCommentsInput[ticketId];

      const { error } = await supabase
        .from('tickets')
        .update({ admin_comments: comments })
        .eq('id', ticketId);

      if (error) throw error;

      // Update the ticket in the local state
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, admin_comments: comments } : ticket
        )
      );

      toast.success('Admin comments updated successfully');
    } catch (error: any) {
      toast.error('Failed to update admin comments');
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm sm:text-base">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            {/* Title and Refresh Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <h2 className="text-xl font-semibold">All Tickets</h2>
              <button
                onClick={fetchTickets}
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                />
              </div>

              {/* Filter Dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Content Section */}
          {loading ? (
            <div className="text-center py-8">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tickets found.</div>
          ) : (
            <div>
              {/* Table for medium and larger screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ticket.user_email}</div>
                        </td>
                        <td className="px-2 md:px-6 py-4">
                          <div className="text-sm text-gray-900">{ticket.title}</div>
                          <div className="text-sm text-gray-500">{ticket.description}</div>
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              ticket.status === 'open'
                                ? 'bg-green-100 text-green-800'
                                : ticket.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleString()}
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={ticket.status}
                            onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-stretch space-y-2">
                            <textarea
                              value={adminCommentsInput[ticket.id] || ''}
                              onChange={(e) =>
                                setAdminCommentsInput({
                                  ...adminCommentsInput,
                                  [ticket.id]: e.target.value,
                                })
                              }
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              rows={2}
                              placeholder="Enter admin comments"
                            ></textarea>
                            <button
                              onClick={() => updateAdminComments(ticket.id)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for small screens */}
              <div className="md:hidden space-y-4">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white shadow rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">{ticket.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ticket.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : ticket.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>User:</strong> {ticket.user_email}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}
                    </p>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={ticket.status}
                        onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Admin Comments
                      </label>
                      <textarea
                        value={adminCommentsInput[ticket.id] || ''}
                        onChange={(e) =>
                          setAdminCommentsInput({
                            ...adminCommentsInput,
                            [ticket.id]: e.target.value,
                          })
                        }
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={1.5}
                        placeholder="Enter admin comments"
                      ></textarea>
                      <button
                        onClick={() => updateAdminComments(ticket.id)}
                        className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
