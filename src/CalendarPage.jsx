import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import "@fullcalendar/common/main.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingTour, setEditingTour] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    tourTemplate: "",
    agency: "",
    cruiseShip: "",
    description: "",
    tipEUR: "",
    tipUSD: "",
  });

  const [templates, setTemplates] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [cruiseShips, setCruiseShips] = useState([]);

  useEffect(() => {
    fetchTours();
    fetchDropdownOptions();
  }, []);

  const fetchTours = () => {
    fetch(`${API}/events`)
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((tour) => ({
          id: tour.id,
          title: tour.title,
          start: tour.start,
          end: tour.end,
          backgroundColor: tour.backgroundColor || "#3788d8",
          borderColor: tour.backgroundColor || "#3788d8",
          extendedProps: {
            agency: tour.agency,
            cruiseShip: tour.cruiseShip,
            description: tour.description,
            tourType: tour.tourType,
            tipEUR: tour.tipEUR,
            tipUSD: tour.tipUSD,
            agencyId: tour.agencyId,
            templateId: tour.templateId,
            shipId: tour.shipId,
          },
        }));
        setEvents(formatted);
      })
      .catch((err) => console.error("Error fetching tours:", err));
  };

  const fetchDropdownOptions = () => {
    fetch(`${API}/templates`)
      .then((res) => res.json())
      .then(setTemplates)
      .catch((err) => console.error("Error fetching templates:", err));

    fetch(`${API}/agencies`)
      .then((res) => res.json())
      .then(setAgencies)
      .catch((err) => console.error("Error fetching agencies:", err));

    fetch(`${API}/ships`)
      .then((res) => res.json())
      .then(setCruiseShips)
      .catch((err) => console.error("Error fetching ships:", err));
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTour = (e) => {
    e.preventDefault();

    const agencyId = parseInt(formData.agency);
    const templateId = parseInt(formData.tourTemplate);
    const shipId = parseInt(formData.cruiseShip);

    if (isNaN(agencyId) || isNaN(templateId) || isNaN(shipId)) {
      alert("Please select valid options for all fields");
      return;
    }

    const tourData = {
      custom_name: formData.description || `Tour ${formData.tourTemplate}`,
      tour_date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      agency_id: agencyId,
      template_id: templateId,
      ship_id: shipId,
      tip_eur: formData.tipEUR ? parseFloat(formData.tipEUR) : null,
      tip_usd: formData.tipUSD ? parseFloat(formData.tipUSD) : null,
    };

    const method = editingTour ? "PUT" : "POST";
    const url = editingTour ? `${API}/events/${editingTour}` : `${API}/events`;

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tourData),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.error || "Failed to save tour");
          });
        }
        return res.json();
      })
      .then(() => {
        fetchTours();
        setFormData({
          date: "",
          startTime: "",
          endTime: "",
          tourTemplate: "",
          agency: "",
          cruiseShip: "",
          description: "",
          tipEUR: "",
          tipUSD: "",
        });
        setShowForm(false);
        setEditingTour(null);
      })
      .catch((err) => {
        console.error("Error saving tour:", err);
        alert(`Failed to save tour: ${err.message}`);
      });
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  const handleEditTour = () => {
    const event = selectedEvent;
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : new Date(event.start);

    const dateStr = startDate.toISOString().split("T")[0];
    const startTimeStr = startDate.toTimeString().slice(0, 5);
    const endTimeStr = endDate.toTimeString().slice(0, 5);

    setFormData({
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      tourTemplate: event.extendedProps.templateId || "",
      agency: event.extendedProps.agencyId || "",
      cruiseShip: event.extendedProps.shipId || "",
      description: event.extendedProps.description || "",
      tipEUR: event.extendedProps.tipEUR || "",
      tipUSD: event.extendedProps.tipUSD || "",
    });

    setEditingTour(event.id);
    setShowForm(true);
    closeModal();
  };

  const handleDeleteTour = () => {
    if (!selectedEvent) return;

    if (
      window.confirm(
        `Are you sure you want to delete "${selectedEvent.title}"?`
      )
    ) {
      fetch(`${API}/events/${selectedEvent.id}`, {
        method: "DELETE",
      })
        .then(() => {
          fetchTours();
          closeModal();
        })
        .catch((err) => console.error("Error deleting tour:", err));
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "100%", boxSizing: "border-box" }}>
      <h2 style={{ marginBottom: "20px" }}>Tour Calendar</h2>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingTour(null);
            setFormData({
              date: "",
              startTime: "",
              endTime: "",
              tourTemplate: "",
              agency: "",
              cruiseShip: "",
              description: "",
              tipEUR: "",
              tipUSD: "",
            });
          }}
          style={{
            padding: "12px 24px",
            backgroundColor: "#3788d8",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            width: "100%",
            maxWidth: "200px",
          }}
        >
          {showForm ? "Cancel" : "Add Tour"}
        </button>

        {showForm && (
          <form
            onSubmit={handleAddTour}
            style={{
              marginTop: "20px",
              padding: "20px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "18px" }}>
              {editingTour ? "Edit Tour" : "Add New Tour"}
            </h3>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ marginBottom: "5px", fontWeight: "500" }}>
                Date:
              </span>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                required
                style={{
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ marginBottom: "5px", fontWeight: "500" }}>
                  Start Time:
                </span>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleFormChange}
                  required
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ marginBottom: "5px", fontWeight: "500" }}>
                  End Time:
                </span>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleFormChange}
                  required
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ marginBottom: "5px", fontWeight: "500" }}>
                Type of Tour:
              </span>
              <select
                name="tourTemplate"
                value={formData.tourTemplate}
                onChange={handleFormChange}
                required
                style={{
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select template</option>
                {templates.map((t) => (
                  <option key={t.template_id} value={t.template_id}>
                    {t.template_name || t.tour_type_name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ marginBottom: "5px", fontWeight: "500" }}>
                Agency:
              </span>
              <select
                name="agency"
                value={formData.agency}
                onChange={handleFormChange}
                required
                style={{
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select agency</option>
                {agencies.map((a) => (
                  <option key={a.agency_id} value={a.agency_id}>
                    {a.agency_name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ marginBottom: "5px", fontWeight: "500" }}>
                Cruise Ship:
              </span>
              <select
                name="cruiseShip"
                value={formData.cruiseShip}
                onChange={handleFormChange}
                required
                style={{
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select cruise ship</option>
                {cruiseShips.map((c) => (
                  <option key={c.ship_id} value={c.ship_id}>
                    {c.ship_name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ marginBottom: "5px", fontWeight: "500" }}>
                Description (optional):
              </span>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Add custom description"
                style={{
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ marginBottom: "5px", fontWeight: "500" }}>
                  Tip EUR (optional):
                </span>
                <input
                  type="number"
                  name="tipEUR"
                  value={formData.tipEUR}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ marginBottom: "5px", fontWeight: "500" }}>
                  Tip USD (optional):
                </span>
                <input
                  type="number"
                  name="tipUSD"
                  value={formData.tipUSD}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              style={{
                padding: "12px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "500",
                marginTop: "10px",
              }}
            >
              {editingTour ? "Update Tour" : "Add Tour"}
            </button>
          </form>
        )}
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "10px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          overflow: "auto",
        }}
      >
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: "dayGridMonth,timeGridWeek,listWeek",
          }}
          events={events}
          eventClick={handleEventClick}
          selectable={true}
          height="auto"
          eventDisplay="block"
          contentHeight="auto"
          aspectRatio={1.5}
          eventContent={(eventInfo) => {
            const bgColor = eventInfo.event.backgroundColor;
            return (
              <div
                style={{
                  padding: "4px",
                  overflow: "hidden",
                  backgroundColor: bgColor,
                  width: "100%",
                  height: "100%",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "11px",
                    color: "white",
                  }}
                >
                  {eventInfo.timeText}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  {eventInfo.event.extendedProps.tourType ||
                    eventInfo.event.title}
                </div>
                {eventInfo.event.extendedProps.agency && (
                  <div
                    style={{
                      fontSize: "10px",
                      fontStyle: "italic",
                      color: "white",
                    }}
                  >
                    {eventInfo.event.extendedProps.agency}
                  </div>
                )}
                {eventInfo.event.extendedProps.cruiseShip && (
                  <div style={{ fontSize: "10px", color: "white" }}>
                    🚢 {eventInfo.event.extendedProps.cruiseShip}
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      {selectedEvent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
            boxSizing: "border-box",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                marginTop: 0,
                borderBottom: "2px solid #3788d8",
                paddingBottom: "10px",
                fontSize: "20px",
              }}
            >
              {selectedEvent.title}
            </h3>
            <div style={{ margin: "20px 0" }}>
              <p style={{ margin: "10px 0" }}>
                <strong>Start:</strong> {selectedEvent.start?.toLocaleString()}
              </p>
              <p style={{ margin: "10px 0" }}>
                <strong>End:</strong>{" "}
                {selectedEvent.end?.toLocaleString() || "N/A"}
              </p>
              {selectedEvent.extendedProps.tourType && (
                <p style={{ margin: "10px 0" }}>
                  <strong>Tour Type:</strong>{" "}
                  {selectedEvent.extendedProps.tourType}
                </p>
              )}
              {selectedEvent.extendedProps.agency && (
                <p style={{ margin: "10px 0" }}>
                  <strong>Agency:</strong> {selectedEvent.extendedProps.agency}
                </p>
              )}
              {selectedEvent.extendedProps.cruiseShip && (
                <p style={{ margin: "10px 0" }}>
                  <strong>Cruise Ship:</strong>{" "}
                  {selectedEvent.extendedProps.cruiseShip}
                </p>
              )}
              {selectedEvent.extendedProps.description && (
                <p style={{ margin: "10px 0" }}>
                  <strong>Description:</strong>{" "}
                  {selectedEvent.extendedProps.description}
                </p>
              )}
              {(selectedEvent.extendedProps.tipEUR ||
                selectedEvent.extendedProps.tipUSD) && (
                <p style={{ margin: "10px 0" }}>
                  <strong>Tips:</strong>{" "}
                  {selectedEvent.extendedProps.tipEUR &&
                    `€${parseFloat(selectedEvent.extendedProps.tipEUR).toFixed(
                      2
                    )}`}
                  {selectedEvent.extendedProps.tipEUR &&
                    selectedEvent.extendedProps.tipUSD &&
                    " + "}
                  {selectedEvent.extendedProps.tipUSD &&
                    `$${parseFloat(selectedEvent.extendedProps.tipUSD).toFixed(
                      2
                    )}`}
                </p>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={handleEditTour}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#ffa500",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                Edit Tour
              </button>
              <button
                onClick={handleDeleteTour}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                Delete Tour
              </button>
              <button
                onClick={closeModal}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
