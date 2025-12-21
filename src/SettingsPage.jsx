// /src/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AgencyForm from "./AgencyForm";
import TourTemplateForm from "./TourTemplateForm";
import CruiseShipForm from "./CruiseShipForm";
import "./SettingsPage.css";
import NotificationSettings from './components/NotificationSettings';

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const SettingsPage = () => {
  const [agencies, setAgencies] = useState([]);
  const [tourTypes, setTourTypes] = useState([]);
  const [cruiseShips, setCruiseShips] = useState([]);

  const [showAgencyForm, setShowAgencyForm] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);

  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingTourType, setEditingTourType] = useState(null);

  const [showShipForm, setShowShipForm] = useState(false);
  const [editingShip, setEditingShip] = useState(null);

  // Get token from localStorage
  const token = localStorage.getItem('token');

  const fetchSettingsData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const agencyRes = await axios.get(`${API}/agencies`, { headers });
      setAgencies(agencyRes.data);

      const typeRes = await axios.get(`${API}/tourtypes`, { headers });
      setTourTypes(typeRes.data);

      const shipRes = await axios.get(`${API}/cruiseships`, { headers });
      setCruiseShips(shipRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load settings data.");
    }
  }, []);

  useEffect(() => {
    fetchSettingsData();
  }, [fetchSettingsData]);

  // --- CRUD handlers (agency, type, ship) ---
  const handleEdit = (setterShow, setterEdit, item) => {
    setterEdit(item);
    setterShow(true);
  };

  const handleCancel = (setterShow, setterEdit) => {
    setterShow(false);
    setterEdit(null);
  };

  const handleDelete = async (url, id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${url}/${id}`, { headers });
      toast.success(`${name} deleted`);
      fetchSettingsData();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // --- Card components ---
  const AgencyCard = ({ agency }) => (
    <div className="card" style={{ borderLeftColor: agency.agency_color_code }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: "150px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
            {agency.agency_name}
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Scenario: {agency.calculation_scenario}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className="button button-edit"
            onClick={() =>
              handleEdit(setShowAgencyForm, setEditingAgency, agency)
            }
          >
            Edit
          </button>
          <button
            className="button button-delete"
            onClick={() =>
              handleDelete(
                `${API}/agencies`,
                agency.agency_id,
                agency.agency_name
              )
            }
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const TourTypeCard = ({ type }) => (
    <div className="card" style={{ borderLeftColor: "#6366F1" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: "150px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
            {type.type_name}
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Base Price: €{parseFloat(type.base_price).toFixed(2)}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className="button button-edit"
            onClick={() =>
              handleEdit(setShowTypeForm, setEditingTourType, type)
            }
          >
            Edit
          </button>
          <button
            className="button button-delete"
            onClick={() =>
              handleDelete(
                `${API}/tourtypes`,
                type.tour_type_id,
                type.type_name
              )
            }
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const CruiseShipList = () => (
    <div
      className="card"
      style={{ borderLeftColor: "#DC2626", overflow: "auto" }}
    >
      <table style={{ width: "100%", minWidth: "300px" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                paddingBottom: "12px",
                fontSize: "14px",
              }}
            >
              Ship Name
            </th>
            <th
              style={{
                textAlign: "right",
                paddingBottom: "12px",
                fontSize: "14px",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {cruiseShips.map((ship) => (
            <tr key={ship.ship_id}>
              <td style={{ padding: "8px 0", fontSize: "14px" }}>
                {ship.ship_name}
              </td>
              <td style={{ padding: "8px 0", textAlign: "right" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="button button-edit"
                    onClick={() =>
                      handleEdit(setShowShipForm, setEditingShip, ship)
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="button button-delete"
                    onClick={() =>
                      handleDelete(
                        `${API}/cruiseships`,
                        ship.ship_id,
                        ship.ship_name
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // --- RENDER ---
  return (
    <div style={{ padding: "15px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1
        style={{
          textAlign: "center",
          marginBottom: "24px",
          fontSize: "28px",
          fontWeight: "bold",
        }}
      >
        ⚙️ System Settings
      </h1>

      {/* Notification Settings Section */}
      <section style={{ marginBottom: "32px" }}>
        <NotificationSettings token={token} />
      </section>

      {/* Forms as modals/overlays */}
      {showAgencyForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => handleCancel(setShowAgencyForm, setEditingAgency)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AgencyForm
              initialData={editingAgency}
              onSubmit={() => {
                setShowAgencyForm(false);
                setEditingAgency(null);
                fetchSettingsData();
              }}
              onCancel={() => handleCancel(setShowAgencyForm, setEditingAgency)}
            />
          </div>
        </div>
      )}

      {showTypeForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => handleCancel(setShowTypeForm, setEditingTourType)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <TourTemplateForm
              initialData={editingTourType}
              onSubmit={() => {
                setShowTypeForm(false);
                setEditingTourType(null);
                fetchSettingsData();
              }}
              onCancel={() => handleCancel(setShowTypeForm, setEditingTourType)}
            />
          </div>
        </div>
      )}

      {showShipForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => handleCancel(setShowShipForm, setEditingShip)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CruiseShipForm
              initialData={editingShip}
              onSubmit={() => {
                setShowShipForm(false);
                setEditingShip(null);
                fetchSettingsData();
              }}
              onCancel={() => handleCancel(setShowShipForm, setEditingShip)}
            />
          </div>
        </div>
      )}

      <div className="columns-container">
        {/* AGENCIES */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
              Tour Agencies ({agencies.length})
            </h2>
            <button
              className="button button-add"
              onClick={() => {
                setEditingAgency(null);
                setShowAgencyForm(true);
              }}
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              + Add
            </button>
          </div>
          {agencies.map((a) => (
            <AgencyCard key={a.agency_id} agency={a} />
          ))}
        </section>

        {/* TOUR TYPES */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
              Tour Types ({tourTypes.length})
            </h2>
            <button
              className="button button-add"
              onClick={() => {
                setEditingTourType(null);
                setShowTypeForm(true);
              }}
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              + Add
            </button>
          </div>
          {tourTypes.map((t) => (
            <TourTypeCard key={t.tour_type_id} type={t} />
          ))}
        </section>

        {/* CRUISE SHIPS */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
              🛳️ Cruise Ships ({cruiseShips.length})
            </h2>
            <button
              className="button button-add"
              onClick={() => {
                setEditingShip(null);
                setShowShipForm(true);
              }}
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              + Add
            </button>
          </div>
          <CruiseShipList />
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;