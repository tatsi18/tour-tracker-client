// /tour-tracker/client/src/TourTemplateForm.jsx (Dedicated Simple Template Form)

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const initialTemplateState = {
  type_name: "", // Type of tour (Name)
  base_price: 0.0, // Net amount (Price)
  description: "", // Optional field
};

const TourTemplateForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialTemplateState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        type_name: initialData.type_name || "",
        base_price: parseFloat(initialData.base_price) || 0.0,
        description: initialData.description || "",
      });
    } else {
      setFormData(initialTemplateState);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "base_price" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.type_name ||
      isNaN(formData.base_price) ||
      formData.base_price <= 0
    ) {
      toast.error("Type Name and Net Amount are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // CRITICAL: Targets the template endpoint /api/tourtypes
      if (initialData) {
        await axios.put(
          `${API}/tourtypes/${initialData.tour_type_id}`,
          formData
        );
        toast.success(`Tour Template ${formData.type_name} updated.`);
      } else {
        await axios.post(`${API}/tourtypes`, formData);
        toast.success(`Tour Template ${formData.type_name} added.`);
      }
      onSubmit();
      setFormData(initialTemplateState);
    } catch (error) {
      console.error("Error submitting tour type:", error);
      toast.error(
        `Failed to save template: ${
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
        {initialData ? "Edit Tour Template" : "Add New Tour Template"}
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type of Tour (Name)
        </label>
        <input
          type="text"
          name="type_name"
          value={formData.type_name}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Base Price (€)
          </label>
          <input
            type="number"
            name="base_price"
            value={formData.base_price}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., Use for high season only"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
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
            ? "Update Template"
            : "Add Template"}
        </button>
      </div>
    </form>
  );
};

export default TourTemplateForm;
