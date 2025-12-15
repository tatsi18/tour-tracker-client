// client/src/AgencyForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const initialFormState = {
  agency_name: "",
  agency_color_code: "#007bff", // Default blue
  calculation_scenario: 1, // Default scenario 1 (Number type)
};

const AgencyForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Populate form with existing data for editing
      setFormData({
        agency_name: initialData.agency_name || "",
        agency_color_code: initialData.agency_color_code || "#007bff",
        calculation_scenario: Number(initialData.calculation_scenario) || 1,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "calculation_scenario" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agency_name) {
      toast.error("Agency name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialData) {
        // UPDATE existing agency (PUT request)
        await axios.put(`${API}/agencies/${initialData.agency_id}`, formData);
        toast.success(`${formData.agency_name} updated successfully.`);
      } else {
        // CREATE new agency (POST request)
        await axios.post(`${API}/agencies`, formData);
        toast.success(`${formData.agency_name} added successfully.`);
      }
      onSubmit(); // Callback to refresh list
      setFormData(initialFormState); // Reset form
    } catch (error) {
      console.error("Error submitting agency:", error);
      toast.error(
        `Failed to save agency: ${
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
        {initialData ? "Edit Agency" : "Add New Agency"}
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Agency Name
        </label>
        <input
          type="text"
          name="agency_name"
          value={formData.agency_name}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Color Code (for Calendar)
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="color"
              name="agency_color_code"
              value={formData.agency_color_code}
              onChange={handleChange}
              className="h-8 w-8 rounded-md border-gray-300"
            />
            <span className="ml-3 text-sm text-gray-600">
              {formData.agency_color_code}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Calculation Scenario
          </label>
          <select
            name="calculation_scenario"
            value={formData.calculation_scenario}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          >
            <option value={1}>1: Standard Calculation</option>
            <option value={2}>2: Special Deal/Discount</option>
            <option value={3}>3: Cash/Black Payment</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Saving..."
            : initialData
            ? "Update Agency"
            : "Add Agency"}
        </button>
      </div>
    </form>
  );
};

export default AgencyForm;
