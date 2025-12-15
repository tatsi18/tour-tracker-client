// src/AddTourForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

function AddTourForm({ onTourAdded }) {
  const [tourDate, setTourDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [customName, setCustomName] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [shipId, setShipId] = useState("");

  const [agencies, setAgencies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [ships, setShips] = useState([]);

  // Fetch dropdown data
  useEffect(() => {
    axios.get("/api/agencies").then((res) => setAgencies(res.data));
    axios.get("/api/tourtypes").then((res) => setTemplates(res.data));
    axios.get("/api/cruiseships").then((res) => setShips(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tourDate || !startTime || !endTime || !customName) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      await axios.post("/api/events", {
        tour_date: tourDate,
        start_time: startTime,
        end_time: endTime,
        custom_name: customName,
        agency_id: agencyId || null,
        template_id: templateId || null,
        ship_id: shipId || null,
      });

      // Clear form
      setTourDate("");
      setStartTime("");
      setEndTime("");
      setCustomName("");
      setAgencyId("");
      setTemplateId("");
      setShipId("");

      // Notify parent to refresh calendar
      onTourAdded();
    } catch (error) {
      console.error("Failed to add tour:", error);
      alert("Failed to add tour. Check console for details.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      <h3>Add New Tour</h3>

      <div>
        <label>Date:</label>
        <input
          type="date"
          value={tourDate}
          onChange={(e) => setTourDate(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Start Time:</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>

      <div>
        <label>End Time:</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Custom Name:</label>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Agency:</label>
        <select value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
          <option value="">--Select Agency--</option>
          {agencies.map((a) => (
            <option key={a.agency_id} value={a.agency_id}>
              {a.agency_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Tour Type:</label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          <option value="">--Select Tour Type--</option>
          {templates.map((t) => (
            <option key={t.type_id} value={t.type_id}>
              {t.type_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Cruise Ship:</label>
        <select value={shipId} onChange={(e) => setShipId(e.target.value)}>
          <option value="">--Select Cruise Ship--</option>
          {ships.map((s) => (
            <option key={s.ship_id} value={s.ship_id}>
              {s.ship_name}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" style={{ marginTop: "10px" }}>
        Add Tour
      </button>
    </form>
  );
}

export default AddTourForm;
