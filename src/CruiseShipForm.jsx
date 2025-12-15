// /tour-tracker/client/src/CruiseShipForm.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const CruiseShipForm = ({ initialData, onSubmit, onCancel }) => {
  // initialData will either be null (New) or contain the ship object (Edit)
  const [shipName, setShipName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Set the state for editing
      setShipName(initialData.ship_name || "");
    } else {
      // Reset state for adding new
      setShipName("");
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shipName.trim()) {
      toast.error("Ship Name is required.");
      return;
    }

    setIsSubmitting(true);
    const data = { ship_name: shipName.trim() }; // Data payload for POST/PUT

    try {
      if (initialData) {
        // PUT request for editing
        await axios.put(`${API}/cruiseships/${initialData.ship_id}`, data);
        toast.success(`Cruise Ship ${shipName} updated.`);
      } else {
        // POST request for adding new
        await axios.post(`${API}/cruiseships`, data);
        toast.success(`Cruise Ship ${shipName} added.`);
      }
      onSubmit(); // Trigger parent function to close form and refresh list
      setShipName(""); // Reset input
    } catch (error) {
      console.error("Error submitting cruise ship:", error);
      toast.error(
        `Failed to save cruise ship: ${
          error.response?.data?.error || "Server error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">
        {initialData ? "Edit Cruise Ship" : "Add New Cruise Ship"}
      </h3>

      <div className="flex space-x-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 sr-only">
            Ship Name
          </label>
          <input
            type="text"
            name="ship_name"
            placeholder="Enter Cruise Ship Name"
            value={shipName}
            onChange={(e) => setShipName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div className="flex-shrink-0 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : initialData
              ? "Update Ship"
              : "Add Ship"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CruiseShipForm;
