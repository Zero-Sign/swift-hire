import React, { useState, useEffect } from "react";
import { FaTrashAlt, FaEdit, FaPlus, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";
import axios from "axios";
import "./AdminPanel.css";
import { toast } from 'react-toastify';


const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Candidate", password: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch all users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/api/admin/users");
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch users. Please try again.");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Go to first, previous, next or last page
  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Handle Adding New User
  const handleAddUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.password) {
        toast.error("Name, email and password are required!");
        return; // <-- Add this to prevent the request
      }
      
      
      const response = await axios.post("http://localhost:8000/api/admin/users", newUser);
      setUsers([...users, response.data]);
      setNewUser({ name: "", email: "", role: "Candidate", password: "" });
      toast.success("User added successfully!");
    } catch (err) {
      toast.error(`Failed to add user: ${err.response?.data?.detail || err.message}`);
      console.error("Error adding user:", err);
    }
  };

  // Handle Editing User
  const handleEditUser = async () => {
    try {
      const response = await axios.put(`http://localhost:8000/api/admin/users/${editingUser.id}`, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      });
      
      setUsers(users.map((user) => 
        user.id === editingUser.id ? response.data : user
      ));
      setEditingUser(null);
      toast.success("User updated successfully!");
    } catch (err) {
      toast.error(`Failed to update user: ${err.response?.data?.detail || err.message}`);
      console.error("Error updating user:", err);
    }
  };

  // Handle Deleting User (No Confirmation)
  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/admin/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
      toast.success("User deleted successfully!");
    } catch (err) {
      toast.error(`Failed to delete user: ${err.response?.data?.detail || err.message}`);
      console.error("Error deleting user:", err);
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-panel">
      <h2 className="admin-title">User Management Panel</h2>

      {/* Search and Filter Bar */}
      <div className="filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="role-filter">
          <label>Filter by Role:</label>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Candidate">Candidates</option>
            <option value="Interviewer">Interviewers</option>
          </select>
        </div>
      </div>

      {/* Add User Section */}
      <div className="add-user-container">
        <h3>Add New User</h3>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="Candidate">Candidate</option>
            <option value="Interviewer">Interviewer</option>
          </select>
        </div>
        <button className="add-btn" onClick={handleAddUser}>
          <FaPlus /> Add User
        </button>
      </div>

      {/* User Table */}
      <div className="table-container">
        <h3>User Management ({filteredUsers.length} users)</h3>
        {filteredUsers.length === 0 ? (
          <p className="no-results">No users match your search criteria.</p>
        ) : (
          <>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id} className={user.role.toLowerCase()}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="actions">
                      {/* <button
                        className="edit-btn"
                        onClick={() => setEditingUser({...user})}
                      >
                        <FaEdit /> Edit
                      </button> */}
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <FaTrashAlt /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="pagination-controls">
                <button 
                  onClick={goToFirstPage} 
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <FaAngleDoubleLeft />
                </button>
                <button 
                  onClick={goToPrevPage} 
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <FaChevronLeft />
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Calculate the page numbers to show
                    let pageNum;
                    const maxPages = 5;
                    const halfMaxPages = Math.floor(maxPages / 2);
                    
                    if (totalPages <= maxPages) {
                      pageNum = i + 1;
                    } else if (currentPage <= halfMaxPages + 1) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - halfMaxPages) {
                      pageNum = totalPages - (maxPages - 1) + i;
                    } else {
                      pageNum = currentPage - halfMaxPages + i;
                    }
                    
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
                <button 
                  onClick={goToNextPage} 
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  <FaChevronRight />
                </button>
                <button 
                  onClick={goToLastPage} 
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  <FaAngleDoubleRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h3>Edit User</h3>
              <div className="form-grid">
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                />
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                >
                  <option value="Candidate">Candidate</option>
                  <option value="Interviewer">Interviewer</option>
                </select>
              </div>
              <div className="modal-actions">
                <button onClick={handleEditUser} className="save-btn">
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;