import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LogOut, Plus, RefreshCw, AlertCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'Hardware' | 'Software' | 'Network' | 'Other';
  expected_date: string;
  user_id: string;
  user_email: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  admin_comments?: string;
}

interface TicketForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'Hardware' | 'Software' | 'Network' | 'Other';
  expectedDate: string;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const initialFormState: TicketForm = {
    title: '',
    description: '',
    priority: 'low',
    category: 'Hardware',
    expectedDate: new Date().toISOString().split('T')[0],
  };

  const [form, setForm] = useState<TicketForm>(initialFormState);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from<Ticket>('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
      return;
    }
    fetchTickets();
  }, [isAdmin, navigate, fetchTickets]);

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('User not authenticated.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            title: form.title,
            description: form.description,
            priority: form.priority,
            category: form.category,
            expected_date: form.expectedDate,
            user_id: user.id,
            user_email: user.email,
            status: 'open',
          },
        ])
        .select('*') // Ensure all fields are returned
        .single();

      if (error) throw error;
      if (data) {
        setTickets((prevTickets) => [data, ...prevTickets]);
      }
      toast.success('Ticket created successfully!');
      setForm(initialFormState);
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">IT Support Dashboard</h1>
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
              <h2 className="text-xl font-semibold">My Tickets</h2>
              <button
                onClick={fetchTickets}
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
              />
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Ticket</span>
            </button>
          </div>

          {/* Ticket Form */}
          {showForm && (
            <form onSubmit={createTicket} className="mb-8 bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'high' })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as 'Hardware' | 'Software' | 'Network' | 'Other',
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Network">Network</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Create Ticket
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tickets Section */}
          {loading ? (
            <div className="text-center py-8">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No tickets found</h3>
              <p className="mt-1 text-gray-500">Get started by creating a new ticket.</p>
            </div>
          ) : (
            <div>
              {/* Table for medium and larger screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-2 md:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                          <div className="text-sm text-gray-500">{ticket.description}</div>
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.category}
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleString()}
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-normal break-words text-sm text-gray-500">
                          {ticket.admin_comments || 'No comments from admin yet.'}
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
                      <strong>Priority:</strong>{' '}
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>Category:</strong> {ticket.category}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Admin Comments
                      </label>
                      <div className="mt-1 text-sm text-gray-600">
                        {ticket.admin_comments || 'No comments from admin yet.'}
                      </div>
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
