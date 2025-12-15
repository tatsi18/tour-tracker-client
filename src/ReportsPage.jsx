import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function ReportsPage() {
  const [tours, setTours] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedAgencies, setExpandedAgencies] = useState({});

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [toursRes, agenciesRes] = await Promise.all([
        axios.get(`${API}/tours-detailed`),
        axios.get(`${API}/agencies`),
      ]);
      console.log("Raw tours data from API:", toursRes.data);
      setTours(toursRes.data);
      setAgencies(agenciesRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAgency = (agency) => {
    setExpandedAgencies((prev) => ({ ...prev, [agency]: !prev[agency] }));
  };

  const isEasterPeriod = (date) => {
    const month = new Date(date).getMonth() + 1;
    return month >= 1 && month <= 4;
  };

  const calculateTourFinancials = (tour) => {
    const basePrice = parseFloat(tour.base_price) || 0;
    const scenario = tour.calculation_scenario;
    const isEaster = isEasterPeriod(tour.tour_date);

    const bonusRate = isEaster ? 0.1538 : 0.125;
    const bonusName = isEaster ? "Δώρο Πάσχα" : "Δώρο Χριστουγέννων";
    const bonus = basePrice * bonusRate;
    const holidayAllowance = basePrice * 0.08;
    const annualLeave = basePrice * 0.08;

    let gross, ika, tax, net;

    if (scenario === 1) {
      gross = basePrice + bonus + holidayAllowance;
      ika = gross * 0.1337;
      const taxPart1 = (gross - ika) * 0.05;
      const taxPart2 = annualLeave * 0.05;
      tax = taxPart1 + taxPart2;
      net = gross - ika + annualLeave - tax;
    } else if (scenario === 2) {
      gross = basePrice + bonus + holidayAllowance + annualLeave;
      ika = (gross - annualLeave) * 0.1337;
      tax = (gross - ika) * 0.05;
      net = gross - ika - tax;
    } else {
      gross = basePrice + bonus + holidayAllowance;
      ika = gross * 0.1337;
      const taxPart1 = (gross - ika) * 0.05;
      const taxPart2 = annualLeave * 0.05;
      tax = taxPart1 + taxPart2;
      net = gross - ika + annualLeave - tax;
    }

    return {
      basePrice,
      bonus,
      bonusName,
      holidayAllowance,
      annualLeave,
      gross,
      ika: scenario === 3 ? 0 : ika,
      tax: scenario === 3 ? 0 : tax,
      net,
      scenario,
      isTaxed: scenario !== 3,
    };
  };

  const handleMarkMonthPaid = async (month, agencyId, isPaid) => {
    try {
      await axios.post(`${API}/mark-month-paid`, {
        month,
        agencyId,
        isPaid,
      });
      fetchData();
    } catch (err) {
      console.error("Error marking month as paid:", err);
    }
  };

  const filteredTours = tours.filter((tour) => {
    if (dateFrom && new Date(tour.tour_date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(tour.tour_date) > new Date(dateTo)) return false;
    if (selectedAgency && tour.agency_id !== parseInt(selectedAgency))
      return false;
    return true;
  });

  const totals = filteredTours.reduce(
    (acc, tour) => {
      const finances = calculateTourFinancials(tour);
      acc.totalBasePrice += finances.basePrice;
      acc.totalBonus += finances.bonus;
      acc.totalHolidayAllowance += finances.holidayAllowance;
      acc.totalAnnualLeave += finances.annualLeave;
      acc.totalGross += finances.gross;
      acc.totalNet += finances.net;
      acc.totalIka += finances.ika;
      acc.totalTax += finances.tax;
      acc.totalTours += 1;

      if (finances.isTaxed) {
        acc.taxableIncome += finances.net;
        acc.taxedTours += 1;
      } else {
        acc.untaxedIncome += finances.net;
        acc.untaxedTours += 1;
      }

      if (tour.payment_status === "Paid") {
        acc.paidAmount += finances.net;
      } else {
        acc.unpaidAmount += finances.net;
      }

      if (tour.tip_eur) {
        acc.tipsEUR += parseFloat(tour.tip_eur);
      }
      if (tour.tip_usd) {
        acc.tipsUSD += parseFloat(tour.tip_usd);
      }

      return acc;
    },
    {
      totalBasePrice: 0,
      totalBonus: 0,
      totalHolidayAllowance: 0,
      totalAnnualLeave: 0,
      totalGross: 0,
      totalNet: 0,
      totalIka: 0,
      totalTax: 0,
      totalTours: 0,
      taxableIncome: 0,
      untaxedIncome: 0,
      taxedTours: 0,
      untaxedTours: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      tipsEUR: 0,
      tipsUSD: 0,
    }
  );

  const toursByMonth = filteredTours.reduce((acc, tour) => {
    const month = new Date(tour.tour_date).toLocaleDateString("el-GR", {
      year: "numeric",
      month: "long",
    });
    if (!acc[month]) acc[month] = [];
    acc[month].push(tour);
    return acc;
  }, {});

  const toursByAgency = filteredTours.reduce((acc, tour) => {
    const agencyName = tour.agency_name || "Unknown";
    if (!acc[agencyName]) acc[agencyName] = [];
    acc[agencyName].push(tour);
    return acc;
  }, {});

  // Tips Analysis
  const tipsByMonth = filteredTours.reduce((acc, tour) => {
    const month = new Date(tour.tour_date).toLocaleDateString("el-GR", {
      year: "numeric",
      month: "long",
    });
    if (!acc[month]) {
      acc[month] = { eur: 0, usd: 0, tours: 0 };
    }
    if (tour.tip_eur) acc[month].eur += parseFloat(tour.tip_eur);
    if (tour.tip_usd) acc[month].usd += parseFloat(tour.tip_usd);
    if (tour.tip_eur || tour.tip_usd) acc[month].tours += 1;
    return acc;
  }, {});

  const tipsByShip = filteredTours.reduce((acc, tour) => {
    const shipName = tour.ship_name || "Unknown";
    if (!acc[shipName]) {
      acc[shipName] = { eur: 0, usd: 0, tours: 0 };
    }
    if (tour.tip_eur) acc[shipName].eur += parseFloat(tour.tip_eur);
    if (tour.tip_usd) acc[shipName].usd += parseFloat(tour.tip_usd);
    if (tour.tip_eur || tour.tip_usd) acc[shipName].tours += 1;
    return acc;
  }, {});

  const tipsByTourType = filteredTours.reduce((acc, tour) => {
    const tourType = tour.tour_type_name || "Unknown";
    if (!acc[tourType]) {
      acc[tourType] = { eur: 0, usd: 0, tours: 0 };
    }
    if (tour.tip_eur) acc[tourType].eur += parseFloat(tour.tip_eur);
    if (tour.tip_usd) acc[tourType].usd += parseFloat(tour.tip_usd);
    if (tour.tip_eur || tour.tip_usd) acc[tourType].tours += 1;
    return acc;
  }, {});

  // Tours per day analysis
  const toursPerDay = filteredTours.reduce((acc, tour) => {
    const date = new Date(tour.tour_date).toLocaleDateString("el-GR");
    if (!acc[date]) {
      acc[date] = {
        count: 0,
        tours: [],
      };
    }
    acc[date].count += 1;
    acc[date].tours.push(tour);
    return acc;
  }, {});

  const toursPerDayStats = Object.entries(toursPerDay).reduce(
    (acc, [date, dayData]) => {
      const count = dayData.count;
      const ships = dayData.tours.map((t) => t.ship_name).join(", ");

      if (count === 1) {
        acc.oneTour.count += 1;
        acc.oneTour.details.push({ date, ships });
      } else if (count === 2) {
        acc.twoTours.count += 1;
        acc.twoTours.details.push({ date, ships });
      } else if (count >= 3) {
        acc.threePlus.count += 1;
        acc.threePlus.details.push({ date, ships });
      }
      return acc;
    },
    {
      oneTour: { count: 0, details: [] },
      twoTours: { count: 0, details: [] },
      threePlus: { count: 0, details: [] },
    }
  );

  if (loading) {
    return <div style={{ padding: "20px" }}>Φόρτωση αναφορών...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px" }}>📊 Οικονομικές Αναφορές</h1>

      {/* Filters */}
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
        }}
      >
        <div>
          <label
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            Από Ημερομηνία:
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            Έως Ημερομηνία:
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            Πρακτορείο:
          </label>
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Όλα τα Πρακτορεία</option>
            {agencies.map((a) => (
              <option key={a.agency_id} value={a.agency_id}>
                {a.agency_name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setDateFrom("");
            setDateTo("");
            setSelectedAgency("");
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            alignSelf: "end",
          }}
        >
          Καθαρισμός Φίλτρων
        </button>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            backgroundColor: "#e3f2fd",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#1976d2" }}
          >
            Σύνολο Εκδρομών
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            {totals.totalTours}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#fff9c4",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#f57f17" }}
          >
            Βασική Τιμή
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.totalBasePrice.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#f3e5f5",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#8e24aa" }}
          >
            Δώρα (Χρ/Πάσχα)
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.totalBonus.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#e0f2f1",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#00796b" }}
          >
            Επίδομα Αδείας
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.totalHolidayAllowance.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#fce4ec",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#c2185b" }}
          >
            Αποζημίωση Αδείας
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.totalAnnualLeave.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#e8eaf6",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#3f51b5" }}
          >
            Σύνολο Μεικτά
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.totalGross.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#ffebee",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#d32f2f" }}
          >
            ΙΚΑ Εργαζομένου
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.totalIka.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#ffe0b2",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#e65100" }}
          >
            Φόρος (5%)
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.totalTax.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#e8f5e9",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#388e3c" }}
          >
            Σύνολο Καθαρά
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.totalNet.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#fff3e0",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#f57c00" }}
          >
            Φορολογητέο Εισόδημα
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.taxableIncome.toFixed(2)}
          </p>
          <p style={{ margin: "5px 0 0 0", fontSize: "11px", color: "#666" }}>
            {totals.taxedTours} εκδρομές
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#fce4ec",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#c2185b" }}
          >
            Αφορολόγητο Εισόδημα
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.untaxedIncome.toFixed(2)}
          </p>
          <p style={{ margin: "5px 0 0 0", fontSize: "11px", color: "#666" }}>
            {totals.untaxedTours} εκδρομές
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#c8e6c9",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#2e7d32" }}
          >
            Πληρωμένο Ποσό
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.paidAmount.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#ffccbc",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#d84315" }}
          >
            Εκκρεμή Πληρωμή
          </h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            €{totals.unpaidAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tips Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            backgroundColor: "#f3e5f5",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "18px" }}>💰 Φιλοδωρήματα</h2>
          <div style={{ display: "flex", gap: "30px", fontSize: "16px" }}>
            <div>
              <strong>EUR:</strong> €{totals.tipsEUR.toFixed(2)}
            </div>
            <div>
              <strong>USD:</strong> ${totals.tipsUSD.toFixed(2)}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#e1f5fe",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "18px" }}>📋 ΙΚΑ & Φόρος</h2>
          <div style={{ fontSize: "16px" }}>
            <div>
              <strong>Σύνολο ΙΚΑ:</strong> €{totals.totalIka.toFixed(2)}
            </div>
            <div>
              <strong>Σύνολο Φόρος:</strong> €{totals.totalTax.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Tips Analysis Section */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #e0e0e0",
        }}
      >
        <div
          onClick={() => toggleSection("tipsAnalysis")}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>💵 Ανάλυση Φιλοδωρημάτων</h2>
          <span style={{ fontSize: "24px" }}>
            {expandedSections.tipsAnalysis ? "−" : "+"}
          </span>
        </div>

        {expandedSections.tipsAnalysis && (
          <div style={{ marginTop: "20px" }}>
            {/* Tips by Month */}
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>
                Φιλοδωρήματα ανά Μήνα
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        Μήνας
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        Εκδρομές με Φιλοδώρημα
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        EUR
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        USD
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        Σύνολο (EUR)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tipsByMonth)
                      .sort()
                      .map(([month, tips]) => (
                        <tr key={month}>
                          <td
                            style={{
                              padding: "10px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {month}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {tips.tours}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            €{tips.eur.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            ${tips.usd.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                              fontWeight: "bold",
                            }}
                          >
                            €{(tips.eur + tips.usd * 0.92).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips by Cruise Ship */}
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>
                Φιλοδωρήματα ανά Κρουαζιερόπλοιο
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        Πλοίο
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        Εκδρομές με Φιλοδώρημα
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        EUR
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        USD
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        Μέσος Όρος/Εκδρομή
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tipsByShip)
                      .sort(
                        (a, b) => b[1].eur + b[1].usd - (a[1].eur + a[1].usd)
                      )
                      .map(([ship, tips]) => (
                        <tr key={ship}>
                          <td
                            style={{
                              padding: "10px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {ship}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {tips.tours}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            €{tips.eur.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            ${tips.usd.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                              fontWeight: "bold",
                            }}
                          >
                            €
                            {(
                              (tips.eur + tips.usd * 0.92) /
                              tips.tours
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips by Tour Type */}
            <div>
              <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>
                Φιλοδωρήματα ανά Τύπο Εκδρομής
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        Τύπος Εκδρομής
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        Εκδρομές με Φιλοδώρημα
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        EUR
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        USD
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        Μέσος Όρος/Εκδρομή
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tipsByTourType)
                      .sort(
                        (a, b) => b[1].eur + b[1].usd - (a[1].eur + a[1].usd)
                      )
                      .map(([tourType, tips]) => (
                        <tr key={tourType}>
                          <td
                            style={{
                              padding: "10px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {tourType}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {tips.tours}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            €{tips.eur.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            ${tips.usd.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "right",
                              borderBottom: "1px solid #eee",
                              fontWeight: "bold",
                            }}
                          >
                            €
                            {(
                              (tips.eur + tips.usd * 0.92) /
                              tips.tours
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tours Per Day Analysis */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #e0e0e0",
        }}
      >
        <div
          onClick={() => toggleSection("toursPerDay")}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>📅 Εκδρομές ανά Ημέρα</h2>
          <span style={{ fontSize: "24px" }}>
            {expandedSections.toursPerDay ? "−" : "+"}
          </span>
        </div>

        {expandedSections.toursPerDay && (
          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "8px",
                }}
              >
                <strong>1 Εκδρομή:</strong> {toursPerDayStats.oneTour.count}{" "}
                ημέρες
              </div>
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#fff3e0",
                  borderRadius: "8px",
                }}
              >
                <strong>2 Εκδρομές:</strong> {toursPerDayStats.twoTours.count}{" "}
                ημέρες
              </div>
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#fce4ec",
                  borderRadius: "8px",
                }}
              >
                <strong>3+ Εκδρομές:</strong> {toursPerDayStats.threePlus.count}{" "}
                ημέρες
              </div>
            </div>

            <h3>Λεπτομέρειες:</h3>
            {Object.entries(toursPerDay)
              .sort()
              .map(([date, dayData]) => (
                <div
                  key={date}
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #e0e0e0",
                    marginBottom: "5px",
                  }}
                >
                  <strong>{date}</strong> - {dayData.count} εκδρομές
                  <div
                    style={{
                      marginLeft: "20px",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    {dayData.tours
                      .map((t) => `${t.ship_name || "N/A"}`)
                      .join(", ")}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Monthly Breakdown */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #e0e0e0",
        }}
      >
        <h2>📅 Ανάλυση ανά Μήνα</h2>
        {Object.entries(toursByMonth).map(([month, monthTours]) => {
          // Group tours by agency within this month
          const monthByAgency = monthTours.reduce((acc, tour) => {
            const agencyName = tour.agency_name || "Unknown";
            if (!acc[agencyName]) acc[agencyName] = [];
            acc[agencyName].push(tour);
            return acc;
          }, {});

          const monthTotals = monthTours.reduce(
            (acc, tour) => {
              const finances = calculateTourFinancials(tour);
              acc.gross += finances.gross;
              acc.net += finances.net;
              acc.ika += finances.ika;
              acc.tax += finances.tax;
              acc.taxable += finances.isTaxed ? finances.net : 0;
              acc.untaxed += !finances.isTaxed ? finances.net : 0;
              acc.tours += 1;
              if (tour.payment_status === "Paid") acc.paid += finances.net;
              else acc.unpaid += finances.net;
              return acc;
            },
            {
              gross: 0,
              net: 0,
              ika: 0,
              tax: 0,
              taxable: 0,
              untaxed: 0,
              tours: 0,
              paid: 0,
              unpaid: 0,
            }
          );

          return (
            <div
              key={month}
              style={{ borderBottom: "1px solid #e0e0e0", padding: "15px 0" }}
            >
              <h3 style={{ margin: "0 0 15px 0" }}>{month}</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "10px",
                  fontSize: "14px",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <strong>Εκδρομές:</strong> {monthTotals.tours}
                </div>
                <div>
                  <strong>Μεικτά:</strong> €{monthTotals.gross.toFixed(2)}
                </div>
                <div>
                  <strong>Καθαρά:</strong> €{monthTotals.net.toFixed(2)}
                </div>
                <div>
                  <strong>ΙΚΑ:</strong> €{monthTotals.ika.toFixed(2)}
                </div>
                <div>
                  <strong>Φόρος:</strong> €{monthTotals.tax.toFixed(2)}
                </div>
                <div style={{ color: "#f57c00" }}>
                  <strong>Φορολογητέο:</strong> €
                  {monthTotals.taxable.toFixed(2)}
                </div>
                <div style={{ color: "#c2185b" }}>
                  <strong>Αφορολόγητο:</strong> €
                  {monthTotals.untaxed.toFixed(2)}
                </div>
                <div style={{ color: "#2e7d32" }}>
                  <strong>Πληρωμένο:</strong> €{monthTotals.paid.toFixed(2)}
                </div>
                <div style={{ color: "#d84315" }}>
                  <strong>Εκκρεμές:</strong> €{monthTotals.unpaid.toFixed(2)}
                </div>
              </div>

              {/* Agency breakdown within month with Mark as Paid buttons */}
              <div style={{ marginLeft: "20px", marginTop: "15px" }}>
                <h4 style={{ fontSize: "14px", marginBottom: "10px" }}>
                  Ανά Πρακτορείο:
                </h4>
                {Object.entries(monthByAgency).map(
                  ([agencyName, agencyTours]) => {
                    const agencyTotals = agencyTours.reduce(
                      (acc, tour) => {
                        const finances = calculateTourFinancials(tour);
                        acc.net += finances.net;
                        acc.tours += 1;
                        acc.isPaid = tour.payment_status === "Paid";
                        return acc;
                      },
                      { net: 0, tours: 0, isPaid: false }
                    );

                    const allPaid = agencyTours.every(
                      (t) => t.payment_status === "Paid"
                    );
                    const agencyId = agencyTours[0].agency_id;

                    return (
                      <div
                        key={agencyName}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px",
                          backgroundColor: allPaid ? "#e8f5e9" : "#fff",
                          borderRadius: "4px",
                          marginBottom: "5px",
                          fontSize: "13px",
                        }}
                      >
                        <div>
                          <strong>{agencyName}</strong> - {agencyTotals.tours}{" "}
                          εκδρομές - €{agencyTotals.net.toFixed(2)}
                        </div>
                        <button
                          onClick={() =>
                            handleMarkMonthPaid(month, agencyId, !allPaid)
                          }
                          style={{
                            padding: "6px 12px",
                            backgroundColor: allPaid ? "#f44336" : "#4caf50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          {allPaid
                            ? "Σήμανση ως Απλήρωτο"
                            : "Σήμανση ως Πληρωμένο"}
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agency Breakdown with Tours List */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
        }}
      >
        <h2>🏢 Ανάλυση ανά Πρακτορείο</h2>
        {Object.entries(toursByAgency).map(([agencyName, agencyTours]) => {
          const agencyTotals = agencyTours.reduce(
            (acc, tour) => {
              const finances = calculateTourFinancials(tour);
              acc.basePrice += finances.basePrice;
              acc.bonus += finances.bonus;
              acc.holidayAllowance += finances.holidayAllowance;
              acc.annualLeave += finances.annualLeave;
              acc.gross += finances.gross;
              acc.ika += finances.ika;
              acc.tax += finances.tax;
              acc.net += finances.net;
              acc.tours += 1;
              return acc;
            },
            {
              basePrice: 0,
              bonus: 0,
              holidayAllowance: 0,
              annualLeave: 0,
              gross: 0,
              ika: 0,
              tax: 0,
              net: 0,
              tours: 0,
            }
          );

          return (
            <div
              key={agencyName}
              style={{ borderBottom: "1px solid #e0e0e0", padding: "15px 0" }}
            >
              <div
                onClick={() => toggleAgency(agencyName)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0 }}>{agencyName}</h3>
                <span style={{ fontSize: "24px" }}>
                  {expandedAgencies[agencyName] ? "−" : "+"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "10px",
                  marginTop: "10px",
                  fontSize: "14px",
                }}
              >
                <div>
                  <strong>Εκδρομές:</strong> {agencyTotals.tours}
                </div>
                <div>
                  <strong>Βασική Τιμή:</strong> €
                  {agencyTotals.basePrice.toFixed(2)}
                </div>
                <div>
                  <strong>Δώρα:</strong> €{agencyTotals.bonus.toFixed(2)}
                </div>
                <div>
                  <strong>Επ. Αδείας:</strong> €
                  {agencyTotals.holidayAllowance.toFixed(2)}
                </div>
                <div>
                  <strong>Αποζ. Αδείας:</strong> €
                  {agencyTotals.annualLeave.toFixed(2)}
                </div>
                <div>
                  <strong>Μεικτά:</strong> €{agencyTotals.gross.toFixed(2)}
                </div>
                <div>
                  <strong>ΙΚΑ:</strong> €{agencyTotals.ika.toFixed(2)}
                </div>
                <div>
                  <strong>Φόρος:</strong> €{agencyTotals.tax.toFixed(2)}
                </div>
                <div>
                  <strong>Καθαρά:</strong> €{agencyTotals.net.toFixed(2)}
                </div>
              </div>

              {expandedAgencies[agencyName] && (
                <div style={{ marginTop: "15px", overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f5f5f5" }}>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "left",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          Ημερομηνία
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "left",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          Πλοίο
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          Βασική Τιμή
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          Δώρο
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          Επ. Αδείας
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          Αποζ. Αδείας
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          Μεικτά
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          ΙΚΑ
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          Φόρος
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "right",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          Καθαρά
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {agencyTours.map((tour) => {
                        const finances = calculateTourFinancials(tour);
                        return (
                          <tr key={tour.tour_id}>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {new Date(tour.tour_date).toLocaleDateString(
                                "el-GR"
                              )}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {tour.ship_name}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "right",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              €{finances.basePrice.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "right",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              €{finances.bonus.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "right",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              €{finances.holidayAllowance.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "right",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              €{finances.annualLeave.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "right",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              €{finances.gross.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "right",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              €{finances.ika.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "right",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              €{finances.tax.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "right",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              €{finances.net.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
